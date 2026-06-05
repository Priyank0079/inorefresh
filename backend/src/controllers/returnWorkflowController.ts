import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose from "mongoose";
import Order from "../models/Order";
import Return from "../models/Return";
import Inventory from "../models/Inventory";
import WalletTransaction from "../models/WalletTransaction";
import Customer from "../models/Customer";
import HorecaUser from "../models/HorecaUser";
import RetailerUser from "../models/RetailerUser";
import OrderItem from "../models/OrderItem";
import Admin from "../models/Admin";
import Warehouse from "../models/Warehouse";
import PlatformWallet from "../models/PlatformWallet";
import axios from "axios";
import { sendNotification } from "../services/notificationService";
import { sendNotificationToUser } from "../services/firebaseAdmin";
import { getIO } from "../socket/socketService";

// startInspection removed: Verification is now triggered strictly by OTP delivery.

/**
 * Helper: strictly validate the warehouse OTP for a return (no mock / no bypass).
 * The OTP must match exactly and must not be expired.
 */
function validateWarehouseOtp(
  returnReq: any,
  otp: any
): { ok: boolean; message?: string } {
  const otpStr = String(otp ?? '').trim();
  if (!otpStr) return { ok: false, message: 'OTP is required' };
  if (!returnReq.warehouseVerificationOtp) {
    return { ok: false, message: 'No OTP generated yet. Ask the rider to resend the OTP.' };
  }
  if (
    returnReq.warehouseVerificationOtpExpiresAt &&
    new Date(returnReq.warehouseVerificationOtpExpiresAt) < new Date()
  ) {
    return { ok: false, message: 'OTP has expired. Please resend a new OTP.' };
  }
  if (String(returnReq.warehouseVerificationOtp) !== otpStr) {
    return { ok: false, message: 'Invalid OTP. Please try again.' };
  }
  return { ok: true };
}

/**
 * Helper: Send a raw SMS via SMS India HUB
 */
async function sendRawSms(mobile: string, message: string): Promise<void> {
  const cleanMobile = '91' + mobile.replace(/\D/g, '');
  const params: Record<string, string> = {
    APIKey: process.env.SMS_INDIA_HUB_API_KEY || '',
    msisdn: cleanMobile,
    sid: process.env.SMS_INDIA_HUB_SENDER_ID || '',
    msg: message,
    fl: '0',
    gwid: '2',
  };
  // Only include entity/template IDs when configured — missing these causes
  // silent failures on the SMSIndiahub API for DLT-mandated SMS.
  if (process.env.SMS_INDIA_HUB_ENTITY_ID) params.pe_id = process.env.SMS_INDIA_HUB_ENTITY_ID;
  if (process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID) params.temp_id = process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID;
  const res = await axios.get('http://cloud.smsindiahub.in/vendorsms/pushsms.aspx', { params, timeout: 30000 });
  console.log('[OTP SMS] response:', String(res.data).slice(0, 100));
}

/**
 * Compute the correct refund for one returned line:
 *   base price (unitPrice × returnedQty)
 *   + the line's share of the GST/tax that was charged
 *   − the line's share of any coupon discount
 * This replaces the old "unitPrice × qty only" math which lost the tax.
 */
function computeReturnRefundAmount(
  orderItem: any,
  returnQty: number,
  orderedQty: number,
  order: any
): number {
  const base = (orderItem?.unitPrice || 0) * returnQty;

  // taxBreakdown stores the tax for the FULL ordered quantity per item.
  // Prorate it by how much of the line is being returned.
  let taxShare = 0;
  const breakdown = (order?.taxBreakdown || []) as any[];
  const tb = breakdown.find(
    (t) =>
      String(t.itemId) === String(orderItem?.product) ||
      t.itemName === orderItem?.productName
  );
  const baseOrderedQty = orderedQty || orderItem?.quantity || returnQty;
  if (tb && baseOrderedQty > 0) {
    taxShare = (Number(tb.amount) || 0) * (returnQty / baseOrderedQty);
  }

  // Coupon discount: refund only the line's proportional share so we never
  // over-refund a discounted order.
  let discountShare = 0;
  if (order && Number(order.discount) > 0 && Number(order.subtotal) > 0) {
    discountShare = Number(order.discount) * (base / Number(order.subtotal));
  }

  return Math.max(0, Number((base + taxShare - discountShare).toFixed(2)));
}

export interface RefundResult {
  refundAmount: number;
  warehouseNewBalance: number;
  customerNewBalance: number;
  isNegativeBalance: boolean;
  fundedBy: "WAREHOUSE" | "PLATFORM";
  order: any;
  warehouseId: string | null;
  customerId: string | null;
}

/**
 * Resolve a buyer id to its actual model. Buyers live in THREE collections —
 * Customer, HorecaUser, RetailerUser — and a Return only stores the raw id.
 * The refund must credit the wallet on the correct model, otherwise (e.g. for
 * a HoReCa buyer) Customer.findById returns null and the credit is silently
 * skipped — leaving the wallet at ₹0.
 */
async function resolveBuyer(
  buyerId: any,
  session: any
): Promise<{ doc: any; userType: 'CUSTOMER' | 'horeca' | 'retailer' } | null> {
  const customer = await Customer.findById(buyerId).session(session);
  if (customer) return { doc: customer, userType: 'CUSTOMER' };
  const horeca = await HorecaUser.findById(buyerId).session(session);
  if (horeca) return { doc: horeca, userType: 'horeca' };
  const retailer = await RetailerUser.findById(buyerId).session(session);
  if (retailer) return { doc: retailer, userType: 'retailer' };
  return null;
}

/**
 * Single, atomic, idempotent refund engine used by EVERY refund entry point
 * (rider OTP, warehouse OTP, admin fallback). Money can only move once.
 *   - cuts the warehouse wallet balance
 *   - credits the retailer (customer) wallet
 *   - records both ledger rows
 *   - tracks returned stock
 * Throws { isUserError, message:'ALREADY_REFUNDED' } if already refunded.
 */
export async function executeReturnRefund(returnId: string): Promise<RefundResult> {
  const session = await mongoose.startSession();
  try {
    let result: RefundResult | null = null;
    await session.withTransaction(async () => {
      const returnDoc = await Return.findById(returnId).session(session);
      if (!returnDoc) {
        throw Object.assign(new Error('RETURN_NOT_FOUND'), { isUserError: true });
      }
      if (returnDoc.status === 'REFUNDED') {
        throw Object.assign(new Error('ALREADY_REFUNDED'), { isUserError: true });
      }

      const [order, orderItem, warehouseDoc] = await Promise.all([
        Order.findById(returnDoc.order).session(session),
        OrderItem.findById(returnDoc.orderItem).session(session),
        Warehouse.findById(returnDoc.warehouse).session(session),
      ]);

      // Credit the buyer's wallet on whichever model they belong to
      // (Customer / HorecaUser / RetailerUser).
      const buyer = await resolveBuyer(returnDoc.customer, session);
      const customerDoc = buyer?.doc ?? null;
      const buyerUserType = buyer?.userType ?? 'CUSTOMER';

      // HARD GUARD: never mark a return REFUNDED unless we can actually credit a
      // real buyer wallet. Without this, a missing buyer silently flips the
      // return to REFUNDED with no credit — money lost (root cause of the
      // ₹420 wallet shortfall). Aborting the txn keeps the return retryable.
      if (!customerDoc) {
        throw Object.assign(
          new Error('BUYER_NOT_FOUND_FOR_REFUND'),
          { isUserError: true }
        );
      }

      const refundAmount = computeReturnRefundAmount(
        orderItem,
        returnDoc.quantity,
        returnDoc.orderedQuantity,
        order
      );

      // Funding source: COD orders are funded by the seller/warehouse balance
      // (the warehouse is owed the cash the rider collected). Online/Wallet-paid
      // orders were collected up-front by the platform, so the PLATFORM funds the
      // wallet refund — the warehouse must NOT be debited for money it never held.
      const isCOD =
        !(order as any)?.paymentMethod ||
        String((order as any).paymentMethod).toUpperCase() === 'COD';
      const fundedBy: 'WAREHOUSE' | 'PLATFORM' = isCOD ? 'WAREHOUSE' : 'PLATFORM';

      const warehousePrev = warehouseDoc?.balance ?? 0;
      const customerPrev = customerDoc?.walletAmount ?? 0;
      const warehouseNew = isCOD ? warehousePrev - refundAmount : warehousePrev;
      const customerNew = customerPrev + refundAmount;
      const nowMs = Date.now();

      // 1) Lock the return as REFUNDED (idempotency guard inside the txn)
      returnDoc.status = 'REFUNDED';
      returnDoc.refundAmount = refundAmount;
      returnDoc.refundFundedBy = fundedBy;
      returnDoc.warehouseVerificationOtpVerified = true;
      await returnDoc.save({ session });

      // 2) Debit the funding source for the refund
      if (isCOD) {
        // COD → debit warehouse wallet (ledger style — may go negative)
        if (warehouseDoc) {
          warehouseDoc.balance = warehouseNew;
          await warehouseDoc.save({ session });
          await WalletTransaction.create([{
            userId: warehouseDoc._id,
            userType: 'Warehouse',
            type: 'Debit',
            amount: refundAmount,
            description: `Return refund issued to retailer — Order #${(order as any)?.orderNumber}`,
            reference: `RTN-WH-${nowMs}`,
            relatedOrder: returnDoc.order,
            openingBalance: warehousePrev,
            closingBalance: warehouseNew,
            status: 'Completed',
          }], { session });
        }
      } else {
        // Online / Wallet-paid → platform funds the wallet refund.
        const platform = await PlatformWallet.findOne().session(session);
        if (platform) {
          platform.currentPlatformBalance = Math.max(
            0,
            (platform.currentPlatformBalance || 0) - refundAmount
          );
          await platform.save({ session });
        }
      }

      // 3) Credit retailer wallet (this is what the next order can spend)
      if (customerDoc) {
        customerDoc.walletAmount = customerNew;
        await customerDoc.save({ session });
        await WalletTransaction.create([{
          userId: customerDoc._id,
          userType: buyerUserType,
          type: 'Credit',
          amount: refundAmount,
          description: `Refund credited — Return on Order #${(order as any)?.orderNumber}`,
          reference: `RTN-CUST-${nowMs}`,
          relatedOrder: returnDoc.order,
          openingBalance: customerPrev,
          closingBalance: customerNew,
          status: 'Completed',
        }], { session });
      }

      // 4) Track returned stock (quarantine pool only — do NOT reduce sellable
      //    stock again; the original sale already accounted for that).
      if (orderItem) {
        const inventory = await Inventory.findOne({
          product: orderItem.product,
          warehouse: returnDoc.warehouse,
        }).session(session);
        if (inventory) {
          inventory.returnedStock = (inventory.returnedStock || 0) + returnDoc.quantity;
          await inventory.save({ session });
        }
      }

      result = {
        refundAmount,
        warehouseNewBalance: warehouseNew,
        customerNewBalance: customerNew,
        isNegativeBalance: isCOD && warehouseNew < 0,
        fundedBy,
        order,
        warehouseId: warehouseDoc?._id?.toString() || returnDoc.warehouse?.toString() || null,
        customerId: customerDoc?._id?.toString() || returnDoc.customer?.toString() || null,
      };
    });
    return result!;
  } finally {
    await session.endSession();
  }
}

/**
 * Fire-and-forget notifications after a refund (warehouse, retailer, admins).
 * Never throws — notification failure must not affect the refund.
 */
async function notifyRefundParties(r: RefundResult): Promise<void> {
  const orderNumber = (r.order as any)?.orderNumber;
  let io: any;
  try { io = getIO(); } catch { io = null; }

  // 1) Warehouse — deducted from balance (COD only). Popup if negative balance.
  if (r.warehouseId && r.fundedBy === 'WAREHOUSE') {
    try {
      await sendNotification(
        'Warehouse',
        r.warehouseId,
        r.isNegativeBalance ? '⚠️ Return Refund — Balance Negative' : 'Return Refund Deducted 💸',
        `₹${r.refundAmount.toFixed(2)} deducted from your wallet for Order #${orderNumber}${
          r.isNegativeBalance ? `. ⚠️ Balance is now negative (₹${r.warehouseNewBalance.toFixed(2)}). Please top up.` : '.'
        }`,
        { type: 'Order', priority: r.isNegativeBalance ? 'Urgent' : 'High' }
      );
    } catch (e) { console.error('[notify] Warehouse:', e); }
  }

  // 2) Customer — refund confirmed. Popup via socket so NotificationContext shows it prominently.
  if (r.customerId) {
    try {
      const notif = await sendNotification(
        'Customer',
        r.customerId,
        'Refund Credited! 💰',
        `₹${r.refundAmount.toFixed(2)} added to your Inor Wallet for return on Order #${orderNumber}.`,
        { type: 'Payment', priority: 'High' }
      );
      // Emit directly to the customer's room so the toast appears immediately
      if (io) io.to(`customer-${r.customerId}`).emit('new-notification', notif);
    } catch (e) { console.error('[notify] Customer:', e); }
  }

  // 3) Admin — single socket broadcast (no DB loop). Popup only when negative balance.
  try {
    if (io) {
      io.to('admin-notifications').emit(r.isNegativeBalance ? 'return-refund-alert' : 'new-notification', {
        title: r.isNegativeBalance ? '⚠️ Refund: Warehouse Negative Balance' : 'Return Refunded ✅',
        message: `₹${r.refundAmount.toFixed(2)} refunded for Order #${orderNumber}.${r.isNegativeBalance ? ' Warehouse balance negative — action required.' : ''}`,
        type: 'Order',
        priority: r.isNegativeBalance ? 'Urgent' : 'Medium',
        recipientType: 'Admin',
        isRead: false,
        createdAt: new Date(),
      });
    }
  } catch (e) { console.error('[notify] Admins:', e); }
}

export const submitReturnRequest = asyncHandler(async (req: Request, res: Response) => {
  // Retailer submits return request
  const customerId = req.user?.userId;
  const { orderId, items } = req.body; // items: [{ orderItemId, acceptedQuantity, returnedQuantity, reason, comment, images, videos }]

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  if (order.customer.toString() !== customerId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (order.status !== "Delivered" || order.isVerifiedByCustomer) {
    return res.status(400).json({ success: false, message: "Order is not in verification state" });
  }

  if (order.inspectionExpiresAt && order.inspectionExpiresAt < new Date()) {
    order.returnAllowed = false;
    await order.save();
    return res.status(400).json({ success: false, message: "Verification window has expired" });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "No items provided. Mark items for return or use Accept All." });
  }

  let totalAccepted = 0;
  let totalOrdered = 0;

  const returnRequests = [];

  for (const item of items) {
    const orderItem = await OrderItem.findById(item.orderItemId);
    if (!orderItem) continue;

    // Guard: you can never accept + return more than what was actually ordered.
    const accepted = Number(item.acceptedQuantity) || 0;
    const returned = Number(item.returnedQuantity) || 0;
    if (accepted < 0 || returned < 0 || accepted + returned > orderItem.quantity) {
      return res.status(400).json({
        success: false,
        message: `Invalid quantities for ${orderItem.productName}: accepted (${accepted}) + returned (${returned}) cannot exceed ordered (${orderItem.quantity}).`,
      });
    }

    totalOrdered += orderItem.quantity;
    totalAccepted += item.acceptedQuantity;

    if (item.returnedQuantity > 0) {
      const returnReq = await Return.create({
        order: orderId,
        orderItem: item.orderItemId,
        customer: customerId,
        quantity: item.returnedQuantity,
        acceptedQuantity: item.acceptedQuantity,
        orderedQuantity: orderItem.quantity,
        reason: item.reason,
        description: item.comment,
        images: item.images,
        videos: item.videos,
        status: "Pending",
        warehouse: (orderItem as any).warehouse || order.assignedWarehouse,
        deliveryBoy: order.deliveryBoy,
      });
      returnRequests.push(returnReq);
    }
  }

  if (totalAccepted === 0) {
    order.status = "Fully Returned";
  } else if (totalAccepted < totalOrdered) {
    order.status = "Return Under Review";
  } else {
    order.status = "Delivered"; // Fully accepted
  }

  // Only put rider in "waiting" state when there are actual returns to approve
  if (returnRequests.length > 0) {
    order.riderStatusDuringInspection = "WAITING_FOR_RETURN_APPROVAL";
  } else {
    order.riderStatusDuringInspection = "IDLE";
  }
  order.isVerifiedByCustomer = true;
  await order.save();

  // Notify Warehouse
  if (returnRequests.length > 0) {
    // Persisted bell notification + push
    await sendNotification(
      "Warehouse",
      returnRequests[0].warehouse?.toString() || "",
      "New Return Request",
      `A return request has been submitted for Order #${order.orderNumber}.`,
      { type: "Order", priority: "High" }
    );

    // Immediate real-time popup (with sound) at every involved warehouse so the
    // manager can approve the return right away — emitted per unique warehouse.
    try {
      const io = getIO();
      const warehouseIds = Array.from(
        new Set(returnRequests.map((r) => r.warehouse?.toString()).filter(Boolean))
      );
      for (const whId of warehouseIds) {
        io.to(`warehouse-${whId}`).emit("return-request-alert", {
          orderId: order._id?.toString(),
          orderNumber: order.orderNumber,
          customerName: (order as any).customerName || "Customer",
          itemCount: returnRequests.filter((r) => r.warehouse?.toString() === whId).length,
          timestamp: new Date(),
        });
      }
    } catch (e) {
      console.error("[Return Request] socket emit failed:", e);
    }

    // Admin: silent bell only — admin does NOT need a popup for every return submit.
    // They get a popup only on escalation or failed refund (see those paths below).
    try {
      const io = getIO();
      io.to('admin-notifications').emit('new-notification', {
        title: 'New Return Request',
        message: `Return submitted for Order #${order.orderNumber}.`,
        type: 'Order',
        priority: 'Medium',
        recipientType: 'Admin',
        isRead: false,
        createdAt: new Date(),
      });
    } catch (err) {
      console.error("Failed to notify admin of return request:", err);
    }
  }

  return res.status(200).json({ success: true, message: "Return submitted successfully" });
});

export const reviewReturnRequest = asyncHandler(async (req: Request, res: Response) => {
  // Warehouse manager reviews the return
  const { returnId } = req.params;
  const { action, comment } = req.body; // action: 'Approve' | 'Reject' | 'Escalate'

  const returnReq = await Return.findById(returnId).populate('order');
  if (!returnReq) return res.status(404).json({ success: false, message: "Return request not found" });

  const order = returnReq.order as any;

  if (action === 'Approve') {
    returnReq.status = 'Approved';
    returnReq.wholesalerStatus = 'Approved';
    returnReq.reverseLogisticsCode = `RET-${Date.now()}`;
    returnReq.warehouseVerificationOtp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Update order status on approval (covers both partial and full return cases)
    if (order.status === 'Return Under Review' || order.status === 'Fully Returned') {
       order.status = 'Partially Returned';
       await order.save();
    }
  } else if (action === 'Reject') {
    returnReq.status = 'Rejected';
    returnReq.wholesalerStatus = 'Rejected';
    returnReq.rejectionReason = comment;

    if (order.status === 'Return Under Review' || order.status === 'Fully Returned') {
       order.status = 'Delivered';
       await order.save();
    }
  } else if (action === 'Escalate') {
    returnReq.status = 'UNDER_REVIEW';
    returnReq.wholesalerStatus = 'Escalated_To_Admin';
    returnReq.escalatedAt = new Date();
    returnReq.escalatedReason = comment;
  }

  await returnReq.save();

  // Notify Rider
  if (returnReq.deliveryBoy) {
    await sendNotification(
      "Delivery",
      returnReq.deliveryBoy.toString(),
      "Return Request Update",
      `Return request for Order #${order.orderNumber} has been ${action}d.`,
      { type: "Order", priority: "High" }
    );

    // On approval, fire an instant popup (with sound) so the rider knows to
    // go collect the returned goods from the customer right away.
    if (action === 'Approve') {
      try {
        const io = getIO();
        io.to(`delivery-${returnReq.deliveryBoy.toString()}`).emit('return-pickup-alert', {
          returnId: (returnReq._id as any).toString(),
          orderId: order._id?.toString(),
          orderNumber: order.orderNumber,
          customerName: order.customerName || 'Customer',
          timestamp: new Date(),
        });
      } catch (e) {
        console.error('[Return Pickup] socket emit failed:', e);
      }

      // Also send a data-only FCM push so the rider gets an urgent notification
      // even when the socket is disconnected (tab backgrounded / phone asleep).
      // dataOnly=true bypasses the OS auto-display so our service worker shows
      // it with requireInteraction + full vibration.
      try {
        await sendNotificationToUser(
          returnReq.deliveryBoy.toString(),
          'Delivery',
          {
            title: 'Return Pickup Approved!',
            body: `Go collect returned goods for Order #${order.orderNumber} from the customer.`,
            data: {
              type: 'return_pickup',
              orderId: order._id?.toString() || '',
              orderNumber: String(order.orderNumber),
              customerName: order.customerName || 'Customer',
              returnId: (returnReq._id as any).toString(),
              link: `/delivery/orders/${order._id}`,
            },
            dataOnly: true,
          }
        );
      } catch (e) {
        console.error('[Return Pickup] FCM push failed:', e);
      }
    }
  }

  return res.status(200).json({ success: true, data: returnReq });
});

export const collectReturn = asyncHandler(async (req: Request, res: Response) => {
  // Rider collects return from customer
  const riderId = req.user?.userId;
  const { returnId } = req.params;
  const { proofOfPickupEvidence, riderRemarks } = req.body;
  
  const returnReq = await Return.findById(returnId);
  if (!returnReq) return res.status(404).json({ success: false, message: "Return request not found" });

  if (returnReq.deliveryBoy?.toString() !== riderId) {
     return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (returnReq.status !== 'Approved') {
     return res.status(400).json({ success: false, message: "Return request is not approved yet" });
  }

  if (!proofOfPickupEvidence || !Array.isArray(proofOfPickupEvidence) || proofOfPickupEvidence.length === 0) {
     return res.status(400).json({ success: false, message: "Proof of Pickup Evidence is required (at least one photo)" });
  }

  returnReq.proofOfPickupEvidence = proofOfPickupEvidence;
  returnReq.riderRemarks = riderRemarks;
  returnReq.status = 'IN_TRANSIT_TO_WAREHOUSE';
  await returnReq.save();

  return res.status(200).json({ success: true, data: returnReq });
});

export const verifyWarehouseReceipt = asyncHandler(async (req: Request, res: Response) => {
  // Warehouse verifies receipt from rider via OTP — this triggers the SAME
  // atomic refund as the rider OTP path (single, idempotent money movement).
  const warehouseId = req.user?.userId;
  const { returnId } = req.params;
  const { otp } = req.body;

  const returnReq = await Return.findById(returnId);
  if (!returnReq) return res.status(404).json({ success: false, message: "Return request not found" });

  if (returnReq.status === 'REFUNDED') {
    return res.status(409).json({ success: false, message: "This return has already been refunded." });
  }

  if (returnReq.warehouse?.toString() !== warehouseId) {
     return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  // Strict OTP validation (no mock / no bypass).
  const otpCheck = validateWarehouseOtp(returnReq, otp);
  if (!otpCheck.ok) {
     return res.status(400).json({ success: false, message: otpCheck.message });
  }

  let refundResult: RefundResult;
  try {
    refundResult = await executeReturnRefund(returnId);
  } catch (err: any) {
    if (err?.isUserError && err.message === 'ALREADY_REFUNDED') {
      return res.status(409).json({ success: false, message: "This return has already been refunded." });
    }
    console.error('[verifyWarehouseReceipt] Refund failed:', err);
    return res.status(500).json({ success: false, message: "Refund transaction failed. Please try again." });
  }

  await notifyRefundParties(refundResult);

  return res.status(200).json({
    success: true,
    message: `₹${refundResult.refundAmount.toFixed(2)} refunded to retailer wallet successfully!`,
    data: {
      returnId,
      status: 'REFUNDED',
      refundAmount: refundResult.refundAmount,
      warehouseBalance: refundResult.warehouseNewBalance,
      customerWalletBalance: refundResult.customerNewBalance,
      isNegativeBalance: refundResult.isNegativeBalance,
    },
  });
});

export const approveRefund = asyncHandler(async (req: Request, res: Response) => {
  // Admin fallback: approve (and refund via the shared engine) or reject.
  const { returnId } = req.params;
  const { action } = req.body;

  const returnReq = await Return.findById(returnId).populate('order');
  if (!returnReq) return res.status(404).json({ success: false, message: "Return request not found" });

  if (action === 'Approve') {
    if (returnReq.status === 'REFUNDED') {
      return res.status(409).json({ success: false, message: "This return has already been refunded." });
    }

    let refundResult: RefundResult;
    try {
      refundResult = await executeReturnRefund(returnId);
    } catch (err: any) {
      if (err?.isUserError && err.message === 'ALREADY_REFUNDED') {
        return res.status(409).json({ success: false, message: "This return has already been refunded." });
      }
      console.error('[approveRefund] Refund failed:', err);
      return res.status(500).json({ success: false, message: "Refund transaction failed. Please try again." });
    }

    await notifyRefundParties(refundResult);

    return res.status(200).json({
      success: true,
      message: `₹${refundResult.refundAmount.toFixed(2)} refunded to retailer wallet successfully!`,
      data: {
        returnId,
        status: 'REFUNDED',
        refundAmount: refundResult.refundAmount,
        warehouseBalance: refundResult.warehouseNewBalance,
        customerWalletBalance: refundResult.customerNewBalance,
        isNegativeBalance: refundResult.isNegativeBalance,
      },
    });
  }

  returnReq.status = 'Rejected';
  await returnReq.save();
  return res.status(200).json({ success: true, data: returnReq });
});

export const getOrderReturns = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (order) {
    await checkAndAutoCloseVerification(order);
  }
  const returns = await Return.find({ order: orderId })
    .populate({
      path: 'orderItem',
      populate: { path: 'product' }
    })
    .populate('warehouse', 'warehouseName managerName mobile address location');
  return res.status(200).json({ success: true, data: returns });
});

/**
 * Admin: Get refund exceptions
 * Returns: stuck returns + negative-balance warehouses
 */
export const getRefundExceptions = asyncHandler(async (_req: Request, res: Response) => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const [stuckReturns, negativeWarehouses] = await Promise.all([
    // Returns stuck IN_TRANSIT or RECEIVED_AT_WAREHOUSE older than 2h (likely failed auto-refund)
    Return.find({
      status: { $in: ['IN_TRANSIT_TO_WAREHOUSE', 'RECEIVED_AT_WAREHOUSE'] },
      updatedAt: { $lt: twoHoursAgo },
    })
      .populate('warehouse', 'warehouseName managerName mobile balance')
      .populate({ path: 'orderItem', populate: { path: 'product' } })
      .populate('customer', 'shopName mobile email')
      .sort({ updatedAt: 1 })
      .limit(50),

    // Warehouses with negative balance
    Warehouse.find({ balance: { $lt: 0 } })
      .select('warehouseName managerName mobile email balance')
      .sort({ balance: 1 })
      .limit(20),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      stuckReturns: stuckReturns.map((r: any) => ({
        id: r._id,
        status: r.status,
        productName: r.orderItem?.productName || 'Unknown',
        quantity: r.quantity,
        refundAmount: (r.orderItem?.unitPrice || 0) * r.quantity,
        shopName: (r.customer as any)?.shopName,
        warehouseName: (r.warehouse as any)?.warehouseName,
        warehouseBalance: (r.warehouse as any)?.balance,
        stuckSince: r.updatedAt,
      })),
      negativeWarehouses: negativeWarehouses.map((w: any) => ({
        id: w._id,
        warehouseName: w.warehouseName,
        managerName: w.managerName,
        mobile: w.mobile,
        balance: w.balance,
      })),
    },
  });
});


// Rider: Send warehouse OTP (triggers SMS to wholeseller)
// ---------------------------------------------------------------------------
export const sendWarehouseOtp = asyncHandler(async (req: Request, res: Response) => {
  const riderId = req.user?.userId;
  const { returnId } = req.params;

  const returnReq = await Return.findById(returnId).populate(
    'warehouse',
    'warehouseName managerName mobile address'
  );
  if (!returnReq) {
    return res.status(404).json({ success: false, message: "Return request not found" });
  }

  if (returnReq.deliveryBoy?.toString() !== riderId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (returnReq.status !== 'IN_TRANSIT_TO_WAREHOUSE') {
    return res.status(400).json({
      success: false,
      message: "Return is not in transit to warehouse"
    });
  }

  const warehouse = returnReq.warehouse as any;
  const warehouseId = warehouse?._id?.toString() || returnReq.warehouse?.toString();

  // Always generate a fresh REAL OTP (no mock / no 1234).
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  returnReq.warehouseVerificationOtp = otp;
  returnReq.warehouseVerificationOtpExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await returnReq.save();

  const order = await Order.findById(returnReq.order);
  const orderNumber = order?.orderNumber;

  // 1) Real-time popup + sound on the warehouse dashboard (dedicated event).
  try {
    const io = getIO();
    io.to(`warehouse-${warehouseId}`).emit('return-otp-alert', {
      otp,
      orderId: returnReq.order?.toString(),
      orderNumber,
      returnId: (returnReq._id as any).toString(),
      timestamp: new Date(),
    });
  } catch (e) {
    console.error('[Return OTP] socket emit failed:', e);
  }

  // 2) Persisted in-app notification (bell) + push so it is never missed.
  try {
    await sendNotification(
      'Warehouse',
      warehouseId,
      '🔐 Return Pickup OTP',
      `Rider has arrived to deliver returned goods for Order #${orderNumber}. Your OTP is ${otp}. Share it with the rider to confirm receipt.`,
      { type: 'Order', priority: 'Urgent' }
    );
  } catch (e) {
    console.error('[Return OTP] in-app notification failed:', e);
  }

  // 3) SMS as a secondary channel (only when SMS provider is configured).
  if (warehouse?.mobile && process.env.SMS_INDIA_HUB_API_KEY && process.env.SMS_INDIA_HUB_SENDER_ID) {
    const message = `InoFresh Return OTP: ${otp}. Rider has arrived at your warehouse to deliver returned goods for Order #${orderNumber}. Share this OTP to confirm receipt.`;
    try {
      await sendRawSms(warehouse.mobile, message);
    } catch (smsErr) {
      console.error('[Return OTP] Failed to send SMS:', smsErr);
    }
  }

  return res.status(200).json({ success: true, message: "OTP sent to warehouse (app alert + SMS)." });
});

// ---------------------------------------------------------------------------
// Rider: Verify warehouse OTP → Atomic refund (Warehouse wallet → Retailer wallet)
// ---------------------------------------------------------------------------
export const riderVerifyWarehouseOtp = asyncHandler(async (req: Request, res: Response) => {
  const riderId = req.user?.userId;
  const { returnId } = req.params;
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ success: false, message: "OTP is required" });
  }

  // ── Pre-flight checks (outside session for fast fail) ───────────────────
  const returnReq = await Return.findById(returnId).populate(
    'warehouse',
    'warehouseName managerName mobile address balance'
  );
  if (!returnReq) {
    return res.status(404).json({ success: false, message: "Return request not found" });
  }
  // Atomic lock: idempotency guard
  if (returnReq.status === 'REFUNDED') {
    return res.status(409).json({ success: false, message: "This return has already been refunded." });
  }
  if (returnReq.deliveryBoy?.toString() !== riderId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }
  if (returnReq.status !== 'IN_TRANSIT_TO_WAREHOUSE') {
    return res.status(400).json({ success: false, message: "Return is not in transit to warehouse" });
  }

  // Strict OTP validation (no mock / no bypass).
  const otpCheck = validateWarehouseOtp(returnReq, otp);
  if (!otpCheck.ok) {
    return res.status(400).json({ success: false, message: otpCheck.message });
  }

  // ── Atomic refund via the shared engine (correct amount incl. tax) ───────
  let refundResult: RefundResult;
  try {
    refundResult = await executeReturnRefund(returnId);
  } catch (err: any) {
    if (err?.isUserError && err.message === 'ALREADY_REFUNDED') {
      return res.status(409).json({ success: false, message: "This return has already been refunded." });
    }
    console.error('[riderVerifyWarehouseOtp] Refund failed:', err);
    return res.status(500).json({
      success: false,
      message: "Refund transaction failed. Please try again.",
    });
  }

  // Post-commit notifications (non-critical)
  await notifyRefundParties(refundResult);

  return res.status(200).json({
    success: true,
    message: `₹${refundResult.refundAmount.toFixed(2)} refunded to retailer wallet successfully!`,
    data: {
      returnId,
      status: 'REFUNDED',
      refundAmount: refundResult.refundAmount,
      warehouseBalance: refundResult.warehouseNewBalance,
      customerWalletBalance: refundResult.customerNewBalance,
      isNegativeBalance: refundResult.isNegativeBalance,
    },
  });
});

export const acceptAllItems = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customerId = req.user?.userId;

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  if (order.customer.toString() !== customerId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (order.status !== "Delivered" || order.isVerifiedByCustomer) {
    return res.status(400).json({ success: false, message: "Order is not in verification state" });
  }

  order.status = "Delivered";
  order.isVerifiedByCustomer = true;
  order.riderStatusDuringInspection = "IDLE"; // Rider is free to leave immediately
  await order.save();

  return res.status(200).json({ success: true, message: "All items accepted successfully" });
});

export const timeoutAcceptDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const riderId = req.user?.userId;

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  if (order.deliveryBoy?.toString() !== riderId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (order.status !== "Delivered" || order.isVerifiedByCustomer) {
    return res.status(400).json({ success: false, message: "Order is not in verification state" });
  }

  if (!order.inspectionExpiresAt || new Date(order.inspectionExpiresAt) > new Date()) {
    return res.status(400).json({ success: false, message: "Verification timer has not expired yet" });
  }

  // Timer is expired. Auto-complete the verification.
  order.isVerifiedByCustomer = true;
  order.riderStatusDuringInspection = "IDLE"; // Free the rider
  await order.save();

  // Emit socket updates
  const io = getIO();
  
  // Notify Rider UI
  io.to(`delivery-${riderId}`).emit("delivery-update", {
    orderId: order._id,
    status: order.status,
    isVerifiedByCustomer: true,
    riderStatusDuringInspection: "IDLE"
  });

  // Notify Customer UI
  io.to(`customer-${order.customer}`).emit("order-update", {
    orderId: order._id,
    status: order.status,
    isVerifiedByCustomer: true
  });

  return res.status(200).json({ success: true, message: "Verification auto-completed due to timeout" });
});

export async function checkAndAutoCloseVerification(order: any) {
  if (
    order &&
    order.status === "Delivered" &&
    !order.isVerifiedByCustomer &&
    order.inspectionExpiresAt &&
    new Date(order.inspectionExpiresAt) < new Date()
  ) {
    console.log(`[Verification Timeout] Auto-completing verification for order ${order._id}`);
    order.isVerifiedByCustomer = true;
    order.riderStatusDuringInspection = "IDLE";
    await order.save();

    // 1. Notify the Rider
    if (order.deliveryBoy) {
      try {
        await sendNotification(
          "Delivery",
          order.deliveryBoy.toString(),
          "Verification Timeout",
          `Verification window for Order #${order.orderNumber} expired. Payout secured, you can leave.`,
          { type: "Order", priority: "High" }
        );
        
        // Also emit directly to delivery boy room for instant UI updates if they are tracking
        const io = getIO();
        io.to(`delivery-${order.deliveryBoy.toString()}`).emit("delivery-update", {
          orderId: order._id,
          status: order.status,
          isVerifiedByCustomer: true,
          riderStatusDuringInspection: "IDLE"
        });
      } catch (err) {
        console.error("Failed to notify delivery boy on timeout:", err);
      }
    }

    // 2. Notify the Customer (Retailer)
    try {
      await sendNotification(
        "Customer",
        order.customer.toString(),
        "Verification Expired",
        `Verification window for Order #${order.orderNumber} expired. The order is marked as fully accepted.`,
        { type: "Order", priority: "Medium" }
      );
    } catch (err) {
      console.error("Failed to notify customer on timeout:", err);
    }

    // 3. Notify Admins
    try {
      const admins = await Admin.find({ role: "superadmin" });
      for (const admin of admins) {
        await sendNotification(
          "Admin",
          admin._id.toString(),
          "Verification Expired",
          `Verification window for Order #${order.orderNumber} expired. Auto-accepted with 0 returns.`,
          { type: "Order", priority: "Medium" }
        );
      }
    } catch (err) {
      console.error("Failed to notify admins on timeout:", err);
    }
  }
}

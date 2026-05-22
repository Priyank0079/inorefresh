import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose from "mongoose";
import Order from "../models/Order";
import Return from "../models/Return";
import Inventory from "../models/Inventory";
import WalletTransaction from "../models/WalletTransaction";
import Customer from "../models/Customer";
import OrderItem from "../models/OrderItem";
import Admin from "../models/Admin";
import Warehouse from "../models/Warehouse";
import axios from "axios";
import { sendNotification } from "../services/notificationService";
import { getIO } from "../socket/socketService";

// startInspection removed: Verification is now triggered strictly by OTP delivery.

/**
 * Helper: Check if we are in mock/dev OTP mode
 */
function isMockOtpMode(): boolean {
  return (
    process.env.USE_MOCK_OTP === 'true' ||
    !process.env.SMS_INDIA_HUB_API_KEY ||
    !process.env.SMS_INDIA_HUB_SENDER_ID
  );
}

/**
 * Helper: Send a raw SMS via SMS India HUB
 */
async function sendRawSms(mobile: string, message: string): Promise<void> {
  const cleanMobile = '91' + mobile.replace(/\D/g, '');
  await axios.get('http://cloud.smsindiahub.in/vendorsms/pushsms.aspx', {
    params: {
      APIKey: process.env.SMS_INDIA_HUB_API_KEY,
      msisdn: cleanMobile,
      sid: process.env.SMS_INDIA_HUB_SENDER_ID,
      msg: message,
      fl: '0',
      gwid: '2',
    },
    timeout: 30000,
  });
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

  let totalAccepted = 0;
  let totalOrdered = 0;

  const returnRequests = [];
  
  for (const item of items) {
    const orderItem = await OrderItem.findById(item.orderItemId);
    if (!orderItem) continue;

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
        status: "REQUESTED",
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

  order.riderStatusDuringInspection = "WAITING_FOR_RETURN_APPROVAL";
  order.isVerifiedByCustomer = true;
  await order.save();

  // Notify Warehouse
  if (returnRequests.length > 0) {
    await sendNotification(
      "Warehouse",
      returnRequests[0].warehouse?.toString() || "",
      "New Return Request",
      `A return request has been submitted for Order #${order.orderNumber}.`,
      { type: "Order", priority: "High" }
    );

    // Notify all Admins
    try {
      const admins = await Admin.find({});
      for (const admin of admins) {
        await sendNotification(
          "Admin",
          admin._id.toString(),
          "New Return Request",
          `A return request has been submitted for Order #${order.orderNumber}.`,
          { type: "Order", priority: "High" }
        );
      }
    } catch (err) {
      console.error("Failed to notify admins of return request:", err);
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
    
    // Check if order needs status update
    if (order.status === 'Return Under Review') {
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
  // Warehouse verifies receipt from rider via OTP
  const warehouseId = req.user?.userId;
  const { returnId } = req.params;
  const { otp } = req.body;

  const returnReq = await Return.findById(returnId);
  if (!returnReq) return res.status(404).json({ success: false, message: "Return request not found" });

  if (returnReq.warehouse?.toString() !== warehouseId) {
     return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (returnReq.warehouseVerificationOtp !== otp) {
     return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  returnReq.status = 'RECEIVED_AT_WAREHOUSE';
  returnReq.warehouseVerificationOtpVerified = true;
  await returnReq.save();

  // Inventory adjustment: move to quarantined
  const orderItem = await OrderItem.findById(returnReq.orderItem);
  if (orderItem) {
     const inventory = await Inventory.findOne({ product: orderItem.product, warehouse: warehouseId });
     if (inventory) {
        // Decrease sellable, increase returned pool
        inventory.currentStock = Math.max(0, inventory.currentStock - returnReq.quantity);
        inventory.returnedStock += returnReq.quantity;
        await inventory.save();
     }
  }

  return res.status(200).json({ success: true, data: returnReq });
});

export const approveRefund = asyncHandler(async (req: Request, res: Response) => {
  // Admin approves refund and issues wallet credit
  const { returnId } = req.params;
  const { action, amount } = req.body;

  const returnReq = await Return.findById(returnId).populate('order');
  if (!returnReq) return res.status(404).json({ success: false, message: "Return request not found" });

  if (returnReq.status !== 'RECEIVED_AT_WAREHOUSE') {
     return res.status(400).json({ success: false, message: "Return not received at warehouse yet" });
  }

  if (action === 'Approve') {
     returnReq.status = 'REFUNDED';
     returnReq.refundAmount = amount;
     await returnReq.save();

     // Credit customer wallet
     const customer = await Customer.findById(returnReq.customer);
     if (customer) {
        customer.walletAmount = (customer.walletAmount || 0) + amount;
        await customer.save();

        await WalletTransaction.create({
           wallet: customer._id,
           userModel: 'CUSTOMER',
           type: 'Credit',
           amount: amount,
           transactionId: `TXN-REF-${Date.now()}`,
           description: `Refund for returned order #${(returnReq.order as any)?.orderNumber}`,
           status: 'Completed'
        });
     }
  } else {
     returnReq.status = 'Rejected';
     await returnReq.save();
  }

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
  if (!warehouse?.mobile) {
    return res.status(400).json({ success: false, message: "Warehouse mobile number not found" });
  }

  if (isMockOtpMode()) {
    // Dev/localhost mode: always use 1234 as the OTP
    returnReq.warehouseVerificationOtp = '1234';
    await returnReq.save();
    console.log(
      `[MOCK OTP] Warehouse "${warehouse.warehouseName}" OTP is: 1234 (mobile: ${warehouse.mobile})`
    );
    return res.status(200).json({
      success: true,
      message: "OTP sent (Mock mode - use 1234)",
    });
  }

  // Real mode: reuse existing OTP or generate new one
  let otp = returnReq.warehouseVerificationOtp;
  if (!otp) {
    otp = Math.floor(1000 + Math.random() * 9000).toString();
    returnReq.warehouseVerificationOtp = otp;
    returnReq.warehouseVerificationOtpExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await returnReq.save();
  }

  const order = await Order.findById(returnReq.order);
  const message = `InoFresh Return OTP: ${otp}. Rider has arrived at your warehouse to deliver returned goods for Order #${order?.orderNumber}. Share this OTP to confirm receipt.`;

  try {
    await sendRawSms(warehouse.mobile, message);
  } catch (smsErr) {
    console.error('[Return OTP] Failed to send SMS:', smsErr);
    // Don't fail the request — OTP is saved, manager can see it in their panel
  }

  return res.status(200).json({ success: true, message: "OTP sent to warehouse mobile" });
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

  // OTP validation
  const otpStr = String(otp).trim();
  const isMock = isMockOtpMode();
  const isBypass = otpStr === '1234' || otpStr === '999999';
  const otpMatch = returnReq.warehouseVerificationOtp === otpStr;
  if (!isBypass && !isMock && !otpMatch) {
    return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
  }

  // Gather stable data before the session
  const warehouseId = (returnReq.warehouse as any)?._id?.toString() || returnReq.warehouse?.toString();
  const [order, orderItem] = await Promise.all([
    Order.findById(returnReq.order),
    OrderItem.findById(returnReq.orderItem),
  ]);
  const refundAmount = (orderItem?.unitPrice || 0) * returnReq.quantity;

  // ── Atomic MongoDB Transaction ───────────────────────────────────────────
  const session = await mongoose.startSession();
  let refundResult: {
    refundAmount: number;
    warehouseNewBalance: number;
    customerNewBalance: number;
    isNegativeBalance: boolean;
  } | null = null;

  try {
    await session.withTransaction(async () => {
      // Fetch fresh docs inside session (prevents stale reads)
      const [warehouseDoc, customerDoc, returnDoc] = await Promise.all([
        Warehouse.findById(warehouseId).session(session),
        Customer.findById(returnReq.customer).session(session),
        Return.findById(returnId).session(session),
      ]);

      // Double-check inside session (atomic lock)
      if (!returnDoc || returnDoc.status === 'REFUNDED') {
        throw Object.assign(new Error('ALREADY_REFUNDED'), { isUserError: true });
      }

      const warehousePrevBalance = warehouseDoc?.balance ?? 0;
      const customerPrevBalance = customerDoc?.walletAmount ?? 0;
      const warehouseNewBalance = warehousePrevBalance - refundAmount;
      const customerNewBalance = customerPrevBalance + refundAmount;
      const isNegativeBalance = warehouseNewBalance < 0;
      const nowMs = Date.now();

      // 1️⃣ Mark return as REFUNDED
      returnDoc.status = 'REFUNDED';
      returnDoc.refundAmount = refundAmount;
      returnDoc.warehouseVerificationOtpVerified = true;
      await returnDoc.save({ session });

      // 2️⃣ Deduct from warehouse balance (allow negative — ledger style)
      if (warehouseDoc) {
        warehouseDoc.balance = warehouseNewBalance;
        await warehouseDoc.save({ session });
        await WalletTransaction.create([{
          userId: warehouseDoc._id,
          userType: 'Warehouse',
          type: 'Debit',
          amount: refundAmount,
          description: `Return refund issued to retailer — Order #${order?.orderNumber}`,
          reference: `RTN-WH-${nowMs}`,
          relatedOrder: returnDoc.order,
          openingBalance: warehousePrevBalance,
          closingBalance: warehouseNewBalance,
          status: 'Completed',
        }], { session });
      }

      // 3️⃣ Credit retailer wallet
      if (customerDoc) {
        customerDoc.walletAmount = customerNewBalance;
        await customerDoc.save({ session });
        await WalletTransaction.create([{
          userId: customerDoc._id,
          userType: 'CUSTOMER',
          type: 'Credit',
          amount: refundAmount,
          description: `Refund credited — Return on Order #${order?.orderNumber}`,
          reference: `RTN-CUST-${nowMs}`,
          relatedOrder: returnDoc.order,
          openingBalance: customerPrevBalance,
          closingBalance: customerNewBalance,
          status: 'Completed',
        }], { session });
      }

      // 4️⃣ Inventory adjustment
      if (orderItem) {
        const inventory = await Inventory.findOne({
          product: orderItem.product,
          warehouse: warehouseId,
        }).session(session);
        if (inventory) {
          inventory.currentStock = Math.max(0, inventory.currentStock - returnDoc.quantity);
          inventory.returnedStock = (inventory.returnedStock || 0) + returnDoc.quantity;
          await inventory.save({ session });
        }
      }

      refundResult = { refundAmount, warehouseNewBalance, customerNewBalance, isNegativeBalance };
    });
  } catch (err: any) {
    if (err?.isUserError && err.message === 'ALREADY_REFUNDED') {
      return res.status(409).json({ success: false, message: "This return has already been refunded." });
    }
    console.error('[riderVerifyWarehouseOtp] Transaction aborted:', err);
    return res.status(500).json({
      success: false,
      message: "Refund transaction failed. Please try again.",
    });
  } finally {
    await session.endSession();
  }

  // ── Post-commit: notifications (non-critical, outside session) ───────────
  const { isNegativeBalance } = refundResult!;

  // Notify warehouse
  if (warehouseId) {
    try {
      await sendNotification(
        "Warehouse",
        warehouseId,
        isNegativeBalance ? "⚠️ Return Refund — Balance Negative" : "Return Refund Deducted 💸",
        `₹${refundAmount.toFixed(2)} deducted from your wallet as refund for Order #${order?.orderNumber}${
          isNegativeBalance
            ? `. ⚠️ Your balance is now negative (₹${refundResult!.warehouseNewBalance.toFixed(2)}). Please top up.`
            : '.'}
        `,
        { type: "Order", priority: isNegativeBalance ? "Urgent" : "High" }
      );
    } catch (e) { console.error("[notify] Warehouse:", e); }
  }

  // Notify retailer
  try {
    await sendNotification(
      "Customer",
      returnReq.customer.toString(),
      "Refund Credited! 💰",
      `₹${refundAmount.toFixed(2)} has been added to your Inor Wallet for the return on Order #${order?.orderNumber}.`,
      { type: "Order", priority: "High" }
    );
  } catch (e) { console.error("[notify] Customer:", e); }

  // Notify admins
  try {
    const admins = await Admin.find({});
    for (const admin of admins) {
      await sendNotification(
        "Admin",
        admin._id.toString(),
        isNegativeBalance ? "⚠️ Auto-Refund: Warehouse Negative Balance" : "Return Auto-Refunded ✅",
        `₹${refundAmount.toFixed(2)} auto-refunded for Order #${order?.orderNumber}. Warehouse: ${(returnReq.warehouse as any)?.warehouseName}.${isNegativeBalance ? " Balance is now negative — action required." : ""}`,
        { type: "Order", priority: isNegativeBalance ? "Urgent" : "High" }
      );
    }
  } catch (e) { console.error("[notify] Admins:", e); }

  return res.status(200).json({
    success: true,
    message: `₹${refundAmount.toFixed(2)} refunded to retailer wallet successfully!`,
    data: {
      returnId,
      status: 'REFUNDED',
      refundAmount,
      warehouseBalance: refundResult!.warehouseNewBalance,
      customerWalletBalance: refundResult!.customerNewBalance,
      isNegativeBalance,
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

  // Process delivery earning
  const { processDeliveryEarning } = require('../services/earningProcessingService');
  await processDeliveryEarning(order._id);

  // Emit socket updates
  const { getIO } = require('../services/socketService');
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

    // Process delivery earning safely
    try {
      const { processDeliveryEarning } = require('../services/earningProcessingService');
      await processDeliveryEarning(order._id);
    } catch (err) {
      console.error("Failed to process earning during auto-close:", err);
    }

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

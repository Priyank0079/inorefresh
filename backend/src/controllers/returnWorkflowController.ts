import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import Order from "../models/Order";
import Return from "../models/Return";
import Inventory from "../models/Inventory";
import WalletTransaction from "../models/WalletTransaction";
import Customer from "../models/Customer";
import AppSettings from "../models/AppSettings";
import OrderItem from "../models/OrderItem";
import Admin from "../models/Admin";
import { sendNotification } from "../services/notificationService";
import { getIO } from "../socket/socketService";

// function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//   const R = 6371e3; // metres
//   const phi1 = (lat1 * Math.PI) / 180;
//   const phi2 = (lat2 * Math.PI) / 180;
//   const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
//   const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
//
//   const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//
//   return R * c; // in metres
// }

export const startInspection = asyncHandler(async (req: Request, res: Response) => {
  // const riderId = req.user?.userId; // Bypassed for local testing
  const { orderId, latitude, longitude } = req.body;

  const order = await Order.findById(orderId).populate('customer');
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  // Ensure rider is assigned to this order (Bypassed for local testing)
  // if (order.deliveryBoy?.toString() !== riderId) {
  //   return res.status(403).json({ success: false, message: "You are not assigned to this order" });
  // }

  // GPS check (mock distance check within 500m) - Bypassed for local testing
  // if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
  //   const distance = calculateDistance(latitude, longitude, order.deliveryAddress.latitude, order.deliveryAddress.longitude);
  //   if (distance > 500) {
  //     return res.status(400).json({ success: false, message: "You are too far from the customer location to start inspection" });
  //   }
  // }

  const settings = await AppSettings.findOne();
  const duration = settings?.inspectionDurationMinutes || 10;

  order.status = "Verification Pending";
  order.returnAllowed = true;
  order.inspectionStartedAt = new Date();
  order.inspectionExpiresAt = new Date(Date.now() + duration * 60000);
  order.inspectionDurationMinutes = duration;
  order.riderLatitudeAtInspection = latitude;
  order.riderLongitudeAtInspection = longitude;
  order.riderStatusDuringInspection = "IDLE";
  
  await order.save();

  // Send notification to customer
  await sendNotification(
    "Customer",
    order.customer._id.toString(),
    "Order Arrival",
    "Your order has arrived. Please verify your items.",
    { type: "Order", priority: "High" }
  );

  return res.status(200).json({ success: true, data: order });
});

export const submitReturnRequest = asyncHandler(async (req: Request, res: Response) => {
  // Retailer submits return request
  const customerId = req.user?.userId;
  const { orderId, items } = req.body; // items: [{ orderItemId, acceptedQuantity, returnedQuantity, reason, comment, images, videos }]

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  if (order.customer.toString() !== customerId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (order.status !== "Verification Pending" && order.status !== "Delivered") {
    return res.status(400).json({ success: false, message: "Order is not in verification state" });
  }

  if (order.status === "Verification Pending" && order.inspectionExpiresAt && order.inspectionExpiresAt < new Date()) {
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
        warehouse: (orderItem as any).Warehouse || order.assignedWarehouse,
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
  const returns = await Return.find({ order: orderId }).populate({
    path: 'orderItem',
    populate: { path: 'product' }
  });
  return res.status(200).json({ success: true, data: returns });
});

export const acceptAllItems = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customerId = req.user?.userId;

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  if (order.customer.toString() !== customerId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (order.status !== "Verification Pending" && order.status !== "Delivered") {
    return res.status(400).json({ success: false, message: "Order is not in verification state" });
  }

  order.status = "Delivered";
  order.isVerifiedByCustomer = true;
  order.riderStatusDuringInspection = "IDLE"; // Rider is free to leave immediately
  await order.save();

  return res.status(200).json({ success: true, message: "All items accepted successfully" });
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

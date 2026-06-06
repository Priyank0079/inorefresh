import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Delivery from "../../../models/Delivery";
import Order from "../../../models/Order";
import mongoose from "mongoose";

/**
 * Get Dashboard Stats
 * Returns: Daily Collection, Cash Balance, Pending Orders, All Orders, etc.
 */
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    // Assuming user ID is attached to req.user by auth middleware
    const deliveryId = req.user?.userId;

    if (!deliveryId) {
      console.warn("[Dashboard Stats] No deliveryId found in req.user");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log(`[Dashboard Stats] Fetching stats for deliveryId: ${deliveryId}`);

    // 1. Fetch Delivery Partner Details (for Cash Balance)
    const deliveryPartner = await Delivery.findById(deliveryId);
    if (!deliveryPartner) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery partner not found" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2. Fetch Orders Assigned to this Partner
    // We need:
    // - Pending Orders (Ready for pickup, Out for delivery, Picked Up)
    // - Today's All Orders (Created today OR Delivered today?) -> "Today's All Order" usually means active + completed today
    // - Today's Delivered Orders (for Earnings & Collection)
    // - Return Orders

    const objectId = new mongoose.Types.ObjectId(deliveryId);

    // Aggregation to get counts in one go
    const stats = await Order.aggregate([
      {
        $match: {
          deliveryBoy: objectId,
          // We consider orders active or touching today
        },
      },
      {
        $group: {
          _id: null,
          // Pending: All currently active orders for this rider (no date filter —
          // matches the getPendingOrders endpoint which also has no date filter).
          pendingOrders: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [
                      "Ready for pickup",
                      "Out for Delivery",
                      "Picked Up",
                      "Assigned",
                      "In Transit",
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          // All Orders Today: Created today OR Updated today (matches getTodayOrders query)
          allOrdersToday: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {
                      $and: [
                        { $gte: ["$createdAt", todayStart] },
                        { $lte: ["$createdAt", todayEnd] },
                      ],
                    },
                    {
                      $and: [
                        { $gte: ["$updatedAt", todayStart] },
                        { $lte: ["$updatedAt", todayEnd] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          // Return Orders — all return-status orders for this rider (no date filter —
          // matches the getReturnOrders endpoint which also has no date filter).
          returnOrdersToday: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Returned", "Partially Returned", "Fully Returned", "Cancelled", "Rejected"]] },
                1,
                0,
              ],
            },
          },
          // Daily Collection: cash collected from COD orders delivered TODAY.
          // Fall back to updatedAt when deliveredAt was never stamped.
          dailyCollection: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Delivered"] },
                    { $eq: ["$paymentMethod", "COD"] },
                    { $gte: [{ $ifNull: ["$deliveredAt", "$updatedAt"] }, todayStart] },
                    { $lte: [{ $ifNull: ["$deliveredAt", "$updatedAt"] }, todayEnd] },
                  ],
                },
                "$total", // Sum the order total
                0,
              ],
            },
          },
          // Cash currently in hand = COD orders delivered by this rider that are
          // not yet settled (paymentStatus still Pending). Computed from real
          // orders so it can't drift like a counter field.
          cashInHand: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Delivered"] },
                    { $eq: ["$paymentMethod", "COD"] },
                    { $ne: ["$paymentStatus", "Paid"] },
                  ],
                },
                "$total",
                0,
              ],
            },
          },
          todayDeliveredCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Delivered"] },
                    { $gte: [{ $ifNull: ["$deliveredAt", "$updatedAt"] }, todayStart] },
                    { $lte: [{ $ifNull: ["$deliveredAt", "$updatedAt"] }, todayEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          // Total Completed Deliveries (Lifetime)
          totalDeliveredCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      pendingOrders: 0,
      allOrdersToday: 0,
      returnOrdersToday: 0,
      dailyCollection: 0,
      cashInHand: 0,
      todayDeliveredCount: 0,
      totalDeliveredCount: 0,
    };

    // Active return-item workload for this rider — statuses where the rider
    // still has something to do. Completed/refunded ones are excluded.
    const { default: Return } = await import("../../../models/Return");
    const ACTIVE_RETURN_STATUSES = [
      "Pending", "Approved", "Processing",
      "REQUESTED", "UNDER_REVIEW",
      "COLLECTED_BY_RIDER", "IN_TRANSIT_TO_WAREHOUSE",
    ];
    const returnItemsActive = await Return.countDocuments({
      deliveryBoy: objectId,
      status: { $in: ACTIVE_RETURN_STATUSES },
    });

    // Calculate Earnings (Real Logic from Commission Collection)
    const { default: Commission } = await import("../../../models/Commission");

    const earningStats = await Commission.aggregate([
      {
        $match: {
          deliveryBoy: objectId,
          type: "DELIVERY_BOY",
        },
      },
      {
        $facet: {
          today: [
            {
              $match: {
                createdAt: { $gte: todayStart, $lte: todayEnd },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$commissionAmount" },
              },
            },
          ],
          total: [
            {
              $group: {
                _id: null,
                total: { $sum: "$commissionAmount" },
              },
            },
          ],
        },
      },
    ]);

    const todayEarning = earningStats[0]?.today[0]?.total || 0;
    const totalEarning = earningStats[0]?.total[0]?.total || 0;

    // Fetch list of Pending Orders for the "Today's Pending Order" section
    const pendingOrdersList = await Order.find({
      deliveryBoy: deliveryId,
      status: {
        $in: [
          "Ready for pickup",
          "Out for Delivery",
          "Picked Up",
          "Assigned",
          "In Transit",
        ],
      },
    })
      .select(
        "orderNumber customerName deliveryAddress status total estimatedDeliveryDate",
      ) // Select necessary fields
      .sort({ createdAt: -1 })
      .limit(5);

    // format pending list for Frontend
    const formattedPendingList = pendingOrdersList.map((order) => ({
      id: order._id,
      orderId: order.orderNumber,
      customerName: order.customerName,
      status: order.status, // Map backend status to frontend status if needed
      address: `${order.deliveryAddress.address}, ${order.deliveryAddress.city}`, // Simplify address
      totalAmount: order.total,
      estimatedDeliveryTime: order.estimatedDeliveryDate
        ? new Date(order.estimatedDeliveryDate).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
        : "N/A",
    }));

    // Fetch list of Available Orders (Accepted by warehouse but not yet assigned)
    // In a real production app, we would filter by radius here
    const availableOrdersList = await Order.find({
      status: { $in: ["Accepted", "Ready for pickup"] },
      $or: [{ deliveryBoy: { $exists: false } }, { deliveryBoy: null }]
    })
      .select("orderNumber customerName deliveryAddress status total estimatedDeliveryDate createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedAvailableList = availableOrdersList.map((order) => ({
      id: order._id,
      orderId: order.orderNumber,
      customerName: order.customerName,
      status: "Available", 
      address: `${order.deliveryAddress?.address || ""}, ${order.deliveryAddress?.city || ""}`,
      totalAmount: order.total,
      createdAt: order.createdAt,
    }));

    // Fetch Wallet Balance
    let walletBalance = 0;
    try {
      const {
        getWalletBalance,
      } = require("../../../services/walletManagementService");
      walletBalance = await getWalletBalance(deliveryId, "DELIVERY_BOY");
    } catch (error) {
      console.error("Error fetching wallet balance for dashboard:", error);
    }

    console.log(`[Dashboard Stats] Pending: ${result.pendingOrders}, Available: ${formattedAvailableList.length}, Wallet: ${walletBalance}`);

    return res.status(200).json({
      success: true,
      data: {
        dailyCollection: result.dailyCollection,
        // Cash in hand = undeposited COD cash, computed from real orders so it
        // never drifts (the old cashCollected counter was never incremented).
        cashBalance: result.cashInHand,
        pendingOrders: result.pendingOrders,
        allOrders: result.allOrdersToday,
        returnOrders: result.returnOrdersToday,
        returnItems: returnItemsActive,
        todayEarning: todayEarning,
        totalEarning: totalEarning,
        walletBalance: walletBalance,
        todayDeliveredCount: result.todayDeliveredCount,
        totalDeliveredCount: result.totalDeliveredCount,
        pendingOrdersList: formattedPendingList,
        availableOrders: formattedAvailableList,
        accountStatus: deliveryPartner.status,
      },
    });
  },
);

/**
 * Get Help & Support Data
 */
export const getHelpSupport = asyncHandler(
  async (_req: Request, res: Response) => {
    const faqItems = [
      {
        question: "How do I accept a new order?",
        answer:
          'When you receive a new order notification, tap on it to view order details. Click "Accept Order" to confirm.',
      },
      {
        question: "What should I do if I cannot deliver an order?",
        answer:
          'Contact the customer first. If unable to reach them, mark the order as "Unable to Deliver" and contact support.',
      },
      {
        question: "How are my earnings calculated?",
        answer:
          "You earn ₹25 per successful delivery. Additional bonuses may apply for special orders or peak hours.",
      },
      {
        question: "How do I update my profile information?",
        answer:
          'Go to Menu > Profile and tap "Edit Profile" to update your personal details, vehicle information, etc.',
      },
      {
        question: "What if I have a complaint or issue?",
        answer:
          "You can contact our support team through the Help & Support section or call our helpline at +91 7846940429.",
      },
      {
        question: "What are the delivery timings?",
        answer:
          "You can deliver orders between 8 AM and 10 PM. Peak hours are usually during lunch (12-3 PM) and dinner (7-10 PM).",
      },
    ];

    const contactOptions = [
      { label: "Call Support", value: "+91 9481214922", icon: "phone" },
      {
        label: "Email Support",
        value: "support@inorfresh.com",
        icon: "email",
      },
      { label: "Live Chat", value: "Available 24/7", icon: "chat" },
    ];

    res.status(200).json({
      success: true,
      data: {
        faqs: faqItems,
        contact: contactOptions,
      },
    });
  },
);

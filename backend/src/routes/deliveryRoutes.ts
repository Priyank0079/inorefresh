import { Router } from "express";
import * as deliveryDashboardController from "../modules/delivery/controllers/deliveryDashboardController";
import * as deliveryOrderController from "../modules/delivery/controllers/deliveryOrderController";
import * as deliveryEarningController from "../modules/delivery/controllers/deliveryEarningController";
import { getProfile } from "../modules/delivery/controllers/deliveryAuthController";

import * as deliveryProfileController from "../modules/delivery/controllers/deliveryProfileController";
import * as deliveryNotificationController from "../modules/delivery/controllers/deliveryNotificationController";

const router = Router();

// Profile & Status
router.get("/profile", getProfile);
router.put("/profile", deliveryProfileController.updateProfile);
router.put("/status", deliveryProfileController.updateStatus);
router.put("/settings", deliveryProfileController.updateSettings);

// Notifications
router.get("/notifications", deliveryNotificationController.getNotifications);
router.put("/notifications/:id/read", deliveryNotificationController.markNotificationRead);

// Dashboard Stats
router.get("/dashboard/stats", deliveryDashboardController.getDashboardStats);

// Help & Support
router.get("/help", deliveryDashboardController.getHelpSupport);

// Orders
router.get("/orders/history", deliveryOrderController.getAllOrdersHistory);
router.get("/orders/today", deliveryOrderController.getTodayOrders);
router.get("/orders/pending", deliveryOrderController.getPendingOrders);
router.get("/orders/returns", deliveryOrderController.getReturnOrders);
router.get("/orders/:id", deliveryOrderController.getOrderDetails); // Specific order details
router.get("/orders/:id/warehouse-locations", deliveryOrderController.getWarehouseLocationsForOrder);
router.put("/orders/:id/status", deliveryOrderController.updateOrderStatus);
router.post("/orders/:id/send-delivery-otp", deliveryOrderController.sendDeliveryOtp);
router.post("/orders/:id/verify-delivery-otp", deliveryOrderController.verifyDeliveryOtpController);

// New proximity and pickup routes
router.post("/orders/:id/check-warehouse-proximity", deliveryOrderController.checkWarehouseProximity);
router.post("/orders/:id/confirm-warehouse-pickup", deliveryOrderController.confirmWarehousePickup);
router.post("/orders/:id/check-customer-proximity", deliveryOrderController.checkCustomerProximity);

// Earnings
router.get("/earnings", deliveryEarningController.getEarningsHistory);
router.post("/withdraw", deliveryEarningController.requestWithdrawal);

export default router;

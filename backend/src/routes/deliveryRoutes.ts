import { Router } from "express";
import * as deliveryDashboardController from "../modules/delivery/controllers/deliveryDashboardController";
import * as deliveryOrderController from "../modules/delivery/controllers/deliveryOrderController";
import * as deliveryEarningController from "../modules/delivery/controllers/deliveryEarningController";
import { getProfile } from "../modules/delivery/controllers/deliveryAuthController";

import * as deliveryProfileController from "../modules/delivery/controllers/deliveryProfileController";
import * as deliveryNotificationController from "../modules/delivery/controllers/deliveryNotificationController";
import * as deliveryRouteController from "../modules/delivery/controllers/deliveryRouteController";

const router = Router();

// Profile & Status
router.get("/profile", getProfile);
router.put("/profile", deliveryProfileController.updateProfile);
router.put("/status", deliveryProfileController.updateStatus);
router.put("/settings", deliveryProfileController.updateSettings);

// Notifications
router.get("/notifications", deliveryNotificationController.getNotifications);
router.patch("/notifications/:id/read", deliveryNotificationController.markNotificationRead);
router.patch("/notifications/mark-all-read", deliveryNotificationController.markAllAsRead);

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
router.get("/orders/:id/seller-locations", deliveryOrderController.getWarehouseLocationsForOrder); // Alias for frontend
router.put("/orders/:id/status", deliveryOrderController.updateOrderStatus);
router.post("/orders/:id/send-delivery-otp", deliveryOrderController.sendDeliveryOtp);
router.post("/orders/:id/verify-delivery-otp", deliveryOrderController.verifyDeliveryOtpController);

// New proximity and pickup routes
router.post("/orders/:id/check-warehouse-proximity", deliveryOrderController.checkWarehouseProximity);
router.post("/orders/:id/check-seller-proximity", deliveryOrderController.checkWarehouseProximity); // Alias for frontend
router.post("/orders/:id/confirm-warehouse-pickup", deliveryOrderController.confirmWarehousePickup);
router.post("/orders/:id/confirm-seller-pickup", deliveryOrderController.confirmWarehousePickup); // Alias for frontend
router.post("/orders/:id/check-customer-proximity", deliveryOrderController.checkCustomerProximity);

// Earnings
router.get("/earnings", deliveryEarningController.getEarningsHistory);
router.post("/withdraw", deliveryEarningController.requestWithdrawal);

// ── Route-based logistics flow (Phase 3) ──────────────────────────────────
router.get("/routes/today", deliveryRouteController.getTodayRoute);
router.post("/routes/:id/accept", deliveryRouteController.acceptRoute);
router.post("/routes/:id/loading-otp", deliveryRouteController.sendLoadingOtp);
router.post("/routes/:id/verify-load", deliveryRouteController.verifyLoad);
router.post("/routes/:id/start", deliveryRouteController.startRoute);
router.post("/stops/:stopId/arrived", deliveryRouteController.arriveAtStop);
router.put("/stops/:stopId/deliver", deliveryRouteController.deliverStop);
router.post("/stops/:stopId/send-otp", deliveryRouteController.sendStopOtp);
router.post("/stops/:stopId/confirm", deliveryRouteController.confirmStop);

// Phase 4: payment, returns, returnable assets, route completion
router.post("/stops/:stopId/payment", deliveryRouteController.recordPayment);
router.post("/stops/:stopId/return", deliveryRouteController.recordReturn);
router.post("/stops/:stopId/assets", deliveryRouteController.recordAssets);
router.post("/routes/:id/complete", deliveryRouteController.completeRoute);

export default router;

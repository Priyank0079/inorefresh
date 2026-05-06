import { Router } from "express";
import * as customerController from "../modules/customer/controllers/customerController";
import * as notificationController from "../modules/customer/controllers/customerNotificationController";
import { authenticate } from "../middleware/auth";
import { requireUserType } from "../middleware/auth";

const router = Router();

// Get customer profile (protected route)
router.get("/profile", authenticate, customerController.getProfile);

// Update customer profile (protected route)
router.put("/profile", authenticate, customerController.updateProfile);

// Update customer location (protected route)
router.post("/location", authenticate, customerController.updateLocation);

// Get customer location (protected route)
router.get("/location", authenticate, customerController.getLocation);

// Notification routes
router.get("/notifications", authenticate, requireUserType("Customer", "horeca", "retailer"), notificationController.getMyNotifications);
router.patch("/notifications/:id/read", authenticate, requireUserType("Customer", "horeca", "retailer"), notificationController.markAsRead);
router.patch("/notifications/mark-all-read", authenticate, requireUserType("Customer", "horeca", "retailer"), notificationController.markAllAsRead);

export default router;

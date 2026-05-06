import { Router } from "express";
import { getDashboardStats } from "../modules/warehouse/controllers/dashboardController";
import * as notificationController from "../modules/warehouse/controllers/warehouseNotificationController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and warehouse user type
router.use(authenticate);
router.use(requireUserType("Warehouse"));

// Get warehouse's dashboard statistics
router.get("/stats", getDashboardStats);

// Notification routes
router.get("/notifications", notificationController.getMyNotifications);
router.patch("/notifications/:id/read", notificationController.markAsRead);
router.patch("/notifications/mark-all-read", notificationController.markAllAsRead);

export default router;

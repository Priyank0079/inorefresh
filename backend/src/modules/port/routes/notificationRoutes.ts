import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import { authenticate, requireUserType } from "../../../middleware/auth";

const router = Router();

// All notification routes require Port authentication
router.use(authenticate);
router.use(requireUserType("Port"));

router.get("/", notificationController.getMyNotifications);
router.patch("/mark-all-read", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;

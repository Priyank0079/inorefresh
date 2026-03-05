import { Router } from "express";
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../modules/warehouse/controllers/orderController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and warehouse user type
router.use(authenticate);
router.use(requireUserType("Warehouse"));

// Get warehouse's orders with filters
router.get("/", getOrders);

// Get order by ID
router.get("/:id", getOrderById);

// Update order status
router.patch("/:id/status", updateOrderStatus);

export default router;

import { Router } from "express";
import {
  startInspection,
  submitReturnRequest,
  reviewReturnRequest,
  collectReturn,
  verifyWarehouseReceipt,
  approveRefund,
  getOrderReturns,
  acceptAllItems
} from "../controllers/returnWorkflowController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// Rider Routes
router.post("/rider/start-inspection", authenticate, requireUserType("Delivery", "DELIVERY_BOY" as any), startInspection);
router.post("/rider/collect/:returnId", authenticate, requireUserType("Delivery", "DELIVERY_BOY" as any), collectReturn);

// Retailer Routes
router.post("/retailer/submit", authenticate, requireUserType("Customer", "horeca", "retailer"), submitReturnRequest);
router.post("/retailer/accept-all/:id", authenticate, requireUserType("Customer", "horeca", "retailer"), acceptAllItems);

// General/Common Routes
router.get("/order/:orderId", authenticate, getOrderReturns);

// Warehouse Routes
router.post("/warehouse/review/:returnId", authenticate, requireUserType("Warehouse"), reviewReturnRequest);
router.post("/warehouse/verify/:returnId", authenticate, requireUserType("Warehouse"), verifyWarehouseReceipt);

// Admin Routes
router.post("/admin/refund/:returnId", authenticate, requireUserType("Admin"), approveRefund);


export default router;

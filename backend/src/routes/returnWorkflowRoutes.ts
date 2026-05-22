import { Router } from "express";
import {
  submitReturnRequest,
  reviewReturnRequest,
  collectReturn,
  verifyWarehouseReceipt,
  approveRefund,
  getOrderReturns,
  acceptAllItems,
  timeoutAcceptDelivery,
  sendWarehouseOtp,
  riderVerifyWarehouseOtp,
  getRefundExceptions,
} from "../controllers/returnWorkflowController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// Rider Routes
router.post("/rider/collect/:returnId", authenticate, requireUserType("Delivery", "DELIVERY_BOY" as any), collectReturn);
router.post("/rider/timeout-accept/:id", authenticate, requireUserType("Delivery", "DELIVERY_BOY" as any), timeoutAcceptDelivery);
router.post("/rider/send-otp/:returnId", authenticate, requireUserType("Delivery", "DELIVERY_BOY" as any), sendWarehouseOtp);
router.post("/rider/verify-otp/:returnId", authenticate, requireUserType("Delivery", "DELIVERY_BOY" as any), riderVerifyWarehouseOtp);

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
router.get("/admin/refund-exceptions", authenticate, requireUserType("Admin"), getRefundExceptions);

export default router;

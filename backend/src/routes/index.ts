import { Router } from "express";
import * as warehouseController from "../modules/admin/controllers/adminWarehouseController";
import adminAuthRoutes from "./adminAuthRoutes";
import warehouseAuthRoutes from "./warehouseAuthRoutes";
import dashboardRoutes from "./dashboardRoutes";
import customerAuthRoutes from "./customerAuthRoutes";
import deliveryRoutes from "./deliveryRoutes";
import deliveryAuthRoutes from "./deliveryAuthRoutes";
import authRoutes from './authRoutes';

import { authenticate, requireUserType } from "../middleware/auth";
import customerRoutes from "./customerRoutes";
import warehouseRoutes from "./warehouseRoutes";
import uploadRoutes from "./uploadRoutes";
import productRoutes from "./productRoutes";
import headerCategoryRoutes from "./headerCategoryRoutes";
import categoryRoutes from "./categoryRoutes";
import orderRoutes from "./orderRoutes";
import returnRoutes from "./returnRoutes";
import reportRoutes from "./reportRoutes";
import walletRoutes from "./walletRoutes";
import taxRoutes from "./taxRoutes";
import inwardStockRoutes from "./inwardStockRoutes";
import customerProductRoutes from "./customerProductRoutes";
import customerCategoryRoutes from "./customerCategoryRoutes";
import customerCouponRoutes from "./customerCouponRoutes";
import customerAddressRoutes from "./customerAddressRoutes";
import customerHomeRoutes from "./customerHomeRoutes";
import customerCartRoutes from "./customerCartRoutes";
import wishlistRoutes from "./wishlistRoutes";
import productReviewRoutes from "./productReviewRoutes";
import adminRoutes from "./adminRoutes";
import customerTrackingRoutes from "../modules/customer/routes/trackingRoutes";
import deliveryTrackingRoutes from "../modules/delivery/routes/trackingRoutes";
import fcmTokenRoutes from "./fcmTokenRoutes";
import paymentRoutes from "./paymentRoutes";
import warehouseWalletRoutes from "./warehouseWalletRoutes";
import deliveryWalletRoutes from "./deliveryWalletRoutes";
import adminWithdrawalRoutes from "./adminWithdrawalRoutes";
// Port routes are now mounted directly in server.ts

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderNotes,
} from "../modules/customer/controllers/customerOrderController";

const router = Router();

// Port Module Routes moved to server.ts

// Health check route
router.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Debug logging
router.use((req, _res, next) => {
  const hasToken = !!req.headers.authorization;
  console.log(`[API DEBUG] ${req.method} ${req.path} - Has Token: ${hasToken}`);
  next();
});

// Authentication routes
router.use("/auth/admin", adminAuthRoutes);
router.use("/auth/warehouse", warehouseAuthRoutes);
router.use("/warehouse/auth", warehouseAuthRoutes);
router.use("/auth/customer", customerAuthRoutes);
router.use("/auth/delivery", deliveryAuthRoutes);
router.use("/auth", authRoutes);

// FCM Token routes
router.use("/fcm-tokens", authenticate, fcmTokenRoutes);

// Delivery routes
router.use("/delivery", authenticate, requireUserType("Delivery"), deliveryRoutes);
router.use("/delivery", authenticate, requireUserType("Delivery"), deliveryTrackingRoutes);

// Customer Specific
router.use("/customer/products", customerProductRoutes);
router.use("/customer/categories", customerCategoryRoutes);
router.use("/customer", customerTrackingRoutes);

// Customer orders
router.post("/customer/orders", authenticate, requireUserType("Customer", "horeca", "retailer"), createOrder);
router.get("/customer/orders", authenticate, requireUserType("Customer", "horeca", "retailer"), getMyOrders);
router.get("/customer/orders/:id", authenticate, requireUserType("Customer", "horeca", "retailer"), getOrderById);
router.post("/customer/orders/:id/cancel", authenticate, requireUserType("Customer", "horeca", "retailer"), cancelOrder);
router.patch("/customer/orders/:id/notes", authenticate, requireUserType("Customer", "horeca", "retailer"), updateOrderNotes);

router.use("/customer/coupons", customerCouponRoutes);
router.use("/customer/addresses", customerAddressRoutes);
router.use("/customer/home", customerHomeRoutes);
router.use("/customer/cart", customerCartRoutes);
router.use("/customer/wishlist", wishlistRoutes);
router.use("/customer/reviews", productReviewRoutes);
router.use("/customer", customerRoutes);

// Warehouse
router.use("/warehouse/dashboard", dashboardRoutes);
router.use("/warehouses", warehouseRoutes);

// Admin
router.post("/admin/warehouse", authenticate, requireUserType("Admin"), warehouseController.createWarehouse);
router.post("/admin/create-warehouse", authenticate, requireUserType("Admin"), warehouseController.createWarehouse);
router.use("/admin", adminRoutes);

// Others
router.use("/upload", uploadRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/header-categories", headerCategoryRoutes);
router.use("/orders", orderRoutes);
router.use("/returns", returnRoutes);
router.use("/warehouse/reports", reportRoutes);
router.use("/warehouse/wallet", walletRoutes);
router.use("/warehouse/taxes", taxRoutes);
router.use("/warehouse/inward-stock", inwardStockRoutes);
router.use("/payment", paymentRoutes);
router.use("/warehouse/wallet-new", authenticate, requireUserType("Warehouse"), warehouseWalletRoutes);
router.use("/delivery/wallet", authenticate, requireUserType("Delivery"), deliveryWalletRoutes);
router.use("/admin/withdrawals", authenticate, requireUserType("Admin"), adminWithdrawalRoutes);

export default router;

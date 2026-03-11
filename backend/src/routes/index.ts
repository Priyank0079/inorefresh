import { Router } from "express";
import * as warehouseController from "../modules/admin/controllers/adminWarehouseController";
import adminAuthRoutes from "./adminAuthRoutes";
import warehouseAuthRoutes from "./warehouseAuthRoutes";
import dashboardRoutes from "./dashboardRoutes";
import customerAuthRoutes from "./customerAuthRoutes";
import deliveryRoutes from "./deliveryRoutes";
import deliveryAuthRoutes from "./deliveryAuthRoutes";

// ... (other imports)
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

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderNotes,
} from "../modules/customer/controllers/customerOrderController";

const router = Router();

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
  console.log(`[API V1 PATH] ${req.method} ${req.path}`);
  next();
});

// Authentication routes
router.use("/auth/admin", adminAuthRoutes);
router.use("/auth/warehouse", warehouseAuthRoutes);
router.use("/warehouse/auth", warehouseAuthRoutes); // Alias for compatibility
router.use("/auth/customer", customerAuthRoutes);
router.use("/auth/delivery", deliveryAuthRoutes);
import authRoutes from './authRoutes';
router.use("/auth", authRoutes);

// FCM Token routes (protected - requires authentication)
router.use("/fcm-tokens", authenticate, fcmTokenRoutes);

// Delivery routes (protected)
router.use(
  "/delivery",
  authenticate,
  requireUserType("Delivery"),
  deliveryRoutes
);
router.use(
  "/delivery",
  authenticate,
  requireUserType("Delivery"),
  deliveryTrackingRoutes
);

// Customer routes - Specific routes MUST be registered before general /customer route
// to prevent Express from matching the broader route first
router.use("/customer/products", customerProductRoutes);
router.use("/customer/categories", customerCategoryRoutes);

// Tracking routes (must be before general /customer/orders/:id route)
router.use("/customer", customerTrackingRoutes);

// Customer orders route - direct registration to avoid module loading issue
console.log("🔥 REGISTERING CUSTOMER ORDER ROUTES");
router.post(
  "/customer/orders",
  (_req, _res, next) => {
    console.log("✅ POST /customer/orders ROUTE MATCHED!");
    next();
  },
  authenticate,
  requireUserType("Customer", "horeca", "retailer"),
  createOrder
);
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
// General customer route (must be last to avoid intercepting specific routes)
router.use("/customer", customerRoutes);

// Warehouse dashboard routes
router.use("/warehouse/dashboard", dashboardRoutes);

// Warehouse management routes (protected, admin only)
router.use("/warehouses", warehouseRoutes);

// Admin routes (protected, admin only)
router.post("/admin/warehouse", authenticate, requireUserType("Admin"), warehouseController.createWarehouse);
router.post("/admin/create-warehouse", authenticate, requireUserType("Admin"), warehouseController.createWarehouse);
router.use("/admin", adminRoutes);

// Upload routes (protected)
router.use("/upload", uploadRoutes);

// Product routes (protected, warehouse only)
router.use("/products", productRoutes);

// Category routes (protected, warehouse/admin)
router.use("/categories", categoryRoutes);

// Header Category Routes
router.use("/header-categories", headerCategoryRoutes);

// Order routes (protected, warehouse only)
router.use("/orders", orderRoutes);

// Return routes (protected, warehouse only)
router.use("/returns", returnRoutes);

// Report routes (protected, warehouse only)
router.use("/warehouse/reports", reportRoutes);

// Wallet routes (protected, warehouse only)
router.use("/warehouse/wallet", walletRoutes);

// Tax routes (protected, warehouse/admin)
router.use("/warehouse/taxes", taxRoutes);

// Payment routes (Razorpay integration)
router.use("/payment", paymentRoutes);

// Warehouse wallet routes (protected, warehouse only)
router.use("/warehouse/wallet-new", authenticate, requireUserType("Warehouse"), warehouseWalletRoutes);

// Delivery wallet routes (protected, delivery only)
router.use("/delivery/wallet", authenticate, requireUserType("Delivery"), deliveryWalletRoutes);

// Admin withdrawal management routes (protected, admin only)
router.use("/admin/withdrawals", authenticate, requireUserType("Admin"), adminWithdrawalRoutes);

export default router;

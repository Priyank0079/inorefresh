import { Router } from "express";
import { authenticate, requireUserType, requireWriteModule, requireViewModule } from "../middleware/auth";

// Dashboard Controllers
import * as dashboardController from "../modules/admin/controllers/adminDashboardController";

// Product Controllers
import * as productController from "../modules/admin/controllers/adminProductController";

// Order Controllers
import * as orderController from "../modules/admin/controllers/adminOrderController";

// Customer Controllers
import * as customerController from "../modules/admin/controllers/adminCustomerController";

// Delivery Controllers
import * as deliveryController from "../modules/admin/controllers/adminDeliveryController";

// Settings Controllers
import * as settingsController from "../modules/admin/controllers/adminSettingsController";

// Coupon Controllers
import * as couponController from "../modules/admin/controllers/adminCouponController";

// Notification Controllers
import * as notificationController from "../modules/admin/controllers/adminNotificationController";

// Wallet Controllers
import * as walletController from "../modules/admin/controllers/adminWalletController";
import * as withdrawalController from "../modules/admin/controllers/adminWithdrawalController";

// Tax Controllers
import * as taxController from "../modules/admin/controllers/adminTaxController";

// Cash Collection Controllers
import * as cashCollectionController from "../modules/admin/controllers/adminCashCollectionController";

// FAQ Controllers
import * as faqController from "../modules/admin/controllers/adminFAQController";

import * as paymentController from "../modules/admin/controllers/adminPaymentController";
import * as policyController from "../modules/admin/controllers/adminPolicyController";
import * as warehouseController from "../modules/admin/controllers/adminWarehouseController";
import * as profileController from "../modules/admin/controllers/adminProfileController";
import {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
} from "../modules/admin/controllers/adminShopController";

// System User Controllers
import * as systemUserController from "../modules/admin/controllers/adminSystemUserController";

// Home Section Controllers
import * as homeSectionController from "../modules/admin/controllers/adminHomeSectionController";

// Bestseller Card Controllers
import * as bestsellerCardController from "../modules/admin/controllers/adminBestsellerCardController";

// Lowest Prices Controllers
import * as lowestPricesController from "../modules/admin/controllers/adminLowestPricesController";

// PromoStrip Controllers
import * as promoStripController from "../modules/admin/controllers/adminPromoStripController";

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireUserType("Admin"));

// ==================== Profile Routes ====================
router.get("/profile", profileController.getProfile);
router.put("/profile", profileController.updateProfile);

// ==================== Dashboard Routes ====================
router.get("/dashboard/stats", dashboardController.getDashboardStatsController);
router.get(
  "/dashboard/analytics",
  dashboardController.getSalesAnalyticsController
);
router.get(
  "/dashboard/top-warehouses",
  dashboardController.getTopWarehousesController // Renamed concept but same controller for now
);
router.get(
  "/dashboard/recent-orders",
  dashboardController.getRecentOrdersController
);
router.get(
  "/dashboard/sales-by-location",
  dashboardController.getSalesByLocationController
);
router.get(
  "/dashboard/today-sales",
  dashboardController.getTodaySalesController
);
router.get(
  "/dashboard/order-analytics",
  dashboardController.getOrderAnalyticsController
);

// ==================== Category Routes ====================
router.get("/categories", requireViewModule("products"), productController.getCategories);
router.post("/categories", requireWriteModule("products"), productController.createCategory);
router.put("/categories/:id", requireWriteModule("products"), productController.updateCategory);
router.delete("/categories/:id", requireWriteModule("products"), productController.deleteCategory);
router.patch("/categories/:id/status", requireWriteModule("products"), productController.toggleCategoryStatus);
router.post("/categories/bulk-delete", requireWriteModule("products"), productController.bulkDeleteCategories);
router.put("/categories/reorder", requireWriteModule("products"), productController.updateCategoryOrder);

// ==================== SubCategory Routes ====================
router.get("/subcategories", requireViewModule("products"), productController.getSubCategories);
router.post("/subcategories", requireWriteModule("products"), productController.createSubCategory);
router.put("/subcategories/:id", requireWriteModule("products"), productController.updateSubCategory);
router.delete("/subcategories/:id", requireWriteModule("products"), productController.deleteSubCategory);

// ==================== Brand Routes ====================
router.get("/brands", requireViewModule("products"), productController.getBrands);
router.post("/brands", requireWriteModule("products"), productController.createBrand);
router.put("/brands/:id", requireWriteModule("products"), productController.updateBrand);
router.delete("/brands/:id", requireWriteModule("products"), productController.deleteBrand);

// ==================== Product Routes ====================
router.get("/products", requireViewModule("products"), productController.getProducts);
router.get("/products/:id", requireViewModule("products"), productController.getProductById);
router.put("/products/:id", requireWriteModule("products"), productController.updateProduct);
router.delete("/products/:id", requireWriteModule("products"), productController.deleteProduct);
router.post("/products/bulk-import", requireWriteModule("products"), productController.bulkImportProducts);
router.put("/products/bulk-update", requireWriteModule("products"), productController.bulkUpdateProducts);

// ==================== Order Routes ====================
router.get("/orders", requireViewModule("orders"), orderController.getAllOrders);
router.get("/orders/status/:status", requireViewModule("orders"), orderController.getOrdersByStatus);
router.get("/orders/:id", requireViewModule("orders"), orderController.getOrderById);
router.patch("/orders/:id/status", requireWriteModule("orders"), orderController.updateOrderStatus);
router.patch("/orders/:id/assign-delivery", requireWriteModule("orders"), orderController.assignDeliveryBoy);
router.get("/orders/export/csv", requireViewModule("orders"), orderController.exportOrders);

// ==================== Return Request Routes ====================
router.get("/return-requests", requireViewModule("returns"), orderController.getReturnRequests);
router.get("/return-requests/:id", requireViewModule("returns"), orderController.getReturnRequestById);
router.put("/return-requests/:id", requireWriteModule("returns"), orderController.processReturnRequest);
router.patch("/returns/:id/process", requireWriteModule("returns"), orderController.processReturnRequest);

// ==================== Customer Routes ====================
router.get("/customers", requireViewModule("customers"), customerController.getAllCustomers);
router.get("/customers/:id", requireViewModule("customers"), customerController.getCustomerById);
router.post("/customers/:id/add-wallet", requireWriteModule("customers"), customerController.addWalletBalance);
router.patch("/customers/:id/status", requireWriteModule("customers"), customerController.updateCustomerStatus);
router.put("/customers/:id", requireWriteModule("customers"), customerController.updateCustomer);
router.get("/customers/:id/orders", requireViewModule("customers"), customerController.getCustomerOrders);
router.get("/retailers", requireViewModule("customers"), customerController.getAllRetailers);
router.get("/horeca", requireViewModule("customers"), customerController.getAllHorecaUsers);

// ==================== Delivery Routes ====================
router.get("/delivery", requireViewModule("delivery"), deliveryController.getAllDeliveryBoys);
router.get("/delivery/:id", requireViewModule("delivery"), deliveryController.getDeliveryBoyById);
router.get("/delivery/:id/assignments", requireViewModule("delivery"), deliveryController.getDeliveryAssignments);
router.get("/delivery/:id/cash-collections", requireViewModule("delivery"), deliveryController.getDeliveryBoyCashCollections);
router.get("/delivery-fund-transfers", requireViewModule("delivery"), deliveryController.getDeliveryBoyFundTransfers);
router.post("/delivery", requireWriteModule("delivery"), deliveryController.createDeliveryBoy);
router.put("/delivery/:id", requireWriteModule("delivery"), deliveryController.updateDeliveryBoy);
router.patch("/delivery/:id/status", requireWriteModule("delivery"), deliveryController.updateDeliveryStatus);
router.patch("/delivery/:id/availability", requireWriteModule("delivery"), deliveryController.updateDeliveryBoyAvailability);
router.delete("/delivery/:id", requireWriteModule("delivery"), deliveryController.deleteDeliveryBoy);
router.post("/delivery/:id/collect-cash", requireWriteModule("delivery"), deliveryController.collectCash);
router.post("/delivery-fund-transfers", requireWriteModule("delivery"), deliveryController.addDeliveryBoyFundTransfer);

// ==================== Payment Routes ====================
router.get("/payment-methods", requireViewModule("finance"), paymentController.getPaymentMethods);
router.get("/payment-methods/:id", requireViewModule("finance"), paymentController.getPaymentMethodById);
router.put("/payment-methods/:id", requireWriteModule("finance"), paymentController.updatePaymentMethod);
router.patch("/payment-methods/:id/status", requireWriteModule("finance"), paymentController.updatePaymentMethodStatus);

// ==================== Settings Routes ====================
router.get("/settings", requireViewModule("settings"), settingsController.getAppSettings);
router.put("/settings", requireWriteModule("settings"), settingsController.updateAppSettings);
router.get("/settings/payment-methods", requireViewModule("settings"), settingsController.getPaymentMethods);
router.put("/settings/payment-methods", requireWriteModule("settings"), settingsController.updatePaymentMethods);
router.get("/settings/sms-gateway", requireViewModule("settings"), settingsController.getSMSGatewaySettings);
router.put("/settings/sms-gateway", requireWriteModule("settings"), settingsController.updateSMSGatewaySettings);

// ==================== Coupon Routes ====================
router.get("/coupons", requireViewModule("marketing"), couponController.getCoupons);
router.get("/coupons/:id", requireViewModule("marketing"), couponController.getCouponById);
router.post("/coupons/validate", requireViewModule("marketing"), couponController.validateCoupon);
router.post("/coupons", requireWriteModule("marketing"), couponController.createCoupon);
router.put("/coupons/:id", requireWriteModule("marketing"), couponController.updateCoupon);
router.delete("/coupons/:id", requireWriteModule("marketing"), couponController.deleteCoupon);

// ==================== Notification Routes ====================
router.get("/notifications", requireViewModule("notifications"), notificationController.getNotifications);
router.get("/notifications/:id", requireViewModule("notifications"), notificationController.getNotificationById);
router.patch("/notifications/:id/read", requireViewModule("notifications"), notificationController.markAsRead);
router.patch("/notifications/read-all", requireViewModule("notifications"), notificationController.markMultipleAsRead);
router.patch("/notifications/mark-read", requireViewModule("notifications"), notificationController.markMultipleAsRead);
router.post("/notifications", requireWriteModule("notifications"), notificationController.createNotification);
router.put("/notifications/:id", requireWriteModule("notifications"), notificationController.updateNotification);
router.delete("/notifications/:id", requireWriteModule("notifications"), notificationController.deleteNotification);
router.post("/notifications/:id/send", requireWriteModule("notifications"), notificationController.sendNotification);

// ==================== Wallet & Withdrawal Routes ====================
router.get("/financial/dashboard", requireViewModule("finance"), walletController.getFinancialDashboard);
router.get("/wallet/earnings", requireViewModule("finance"), walletController.getAdminEarnings);
router.get("/wallet/transactions", requireViewModule("finance"), walletController.getWalletTransactions);
router.get("/wallet/withdrawals", requireViewModule("finance"), withdrawalController.getAllWithdrawals);
router.post("/wallet/withdrawal/process", requireWriteModule("finance"), walletController.processWithdrawalWrapper);
router.put("/withdrawals/:id/approve", requireWriteModule("finance"), withdrawalController.approveWithdrawal);
router.put("/withdrawals/:id/reject", requireWriteModule("finance"), withdrawalController.rejectWithdrawal);
router.put("/withdrawals/:id/complete", requireWriteModule("finance"), withdrawalController.completeWithdrawal);

// ==================== Tax Routes ====================
router.get("/taxes", requireViewModule("products"), taxController.getTaxes);
router.get("/taxes/:id", requireViewModule("products"), taxController.getTaxById);
router.post("/taxes", requireWriteModule("products"), taxController.createTax);
router.put("/taxes/:id", requireWriteModule("products"), taxController.updateTax);
router.patch("/taxes/:id/status", requireWriteModule("products"), taxController.updateTaxStatus);
router.delete("/taxes/:id", requireWriteModule("products"), taxController.deleteTax);

// ==================== Cash Collection Routes ====================
router.get("/cash-collections", requireViewModule("delivery"), cashCollectionController.getCashCollections);
router.get("/cash-collections/:id", requireViewModule("delivery"), cashCollectionController.getCashCollectionById);
router.post("/cash-collections", requireWriteModule("delivery"), cashCollectionController.createCashCollection);
router.put("/cash-collections/:id", requireWriteModule("delivery"), cashCollectionController.updateCashCollection);
router.delete("/cash-collections/:id", requireWriteModule("delivery"), cashCollectionController.deleteCashCollection);

// ==================== FAQ Routes ====================
router.get("/faqs", requireViewModule("settings"), faqController.getFAQs);
router.get("/faqs/:id", requireViewModule("settings"), faqController.getFAQById);
router.post("/faqs", requireWriteModule("settings"), faqController.createFAQ);
router.put("/faqs/:id", requireWriteModule("settings"), faqController.updateFAQ);
router.patch("/faqs/:id/status", requireWriteModule("settings"), faqController.updateFAQStatus);
router.delete("/faqs/:id", requireWriteModule("settings"), faqController.deleteFAQ);
router.put("/faqs/order", requireWriteModule("settings"), faqController.updateFAQOrder);

// ==================== Policy Routes ====================
router.get("/policies", requireViewModule("settings"), policyController.getPolicies);
router.post("/policies", requireWriteModule("settings"), policyController.createPolicy);
router.put("/policies/:id", requireWriteModule("settings"), policyController.updatePolicy);
router.delete("/policies/:id", requireWriteModule("settings"), policyController.deletePolicy);

// ==================== Warehouse Routes ====================
router.get("/warehouses", requireViewModule("warehouse"), warehouseController.getAllWarehouses);
router.get("/warehouse", requireViewModule("warehouse"), warehouseController.getAllWarehouses);
router.get("/warehouse/:warehouseId/inward-stock", requireViewModule("warehouse"), warehouseController.getWarehouseInwardStockSummary);
router.get("/warehouses/inward-stock/all", requireViewModule("warehouse"), warehouseController.getAllWarehousesInwardStock);
router.post("/create-warehouse", requireWriteModule("warehouse"), warehouseController.createWarehouse);
router.post("/warehouse", requireWriteModule("warehouse"), warehouseController.createWarehouse);

// ==================== Shop Management ====================
router.get("/shops", requireViewModule("marketing"), getAllShops);
router.get("/shop-by-stores", requireViewModule("marketing"), getAllShops);
router.get("/shop/:id", requireViewModule("marketing"), getShopById);
router.get("/shop-by-stores/:id", requireViewModule("marketing"), getShopById);
router.post("/shop/create", requireWriteModule("marketing"), createShop);
router.post("/shop-by-stores", requireWriteModule("marketing"), createShop);
router.put("/shop/:id", requireWriteModule("marketing"), updateShop);
router.put("/shop-by-stores/:id", requireWriteModule("marketing"), updateShop);
router.delete("/shop/:id", requireWriteModule("marketing"), deleteShop);
router.delete("/shop-by-stores/:id", requireWriteModule("marketing"), deleteShop);

// ==================== System User Routes ====================
router.get("/system-users", requireViewModule("settings"), systemUserController.getAllSystemUsers);
router.get("/system-users/:id", requireViewModule("settings"), systemUserController.getSystemUserById);
router.post("/system-users", requireWriteModule("settings"), systemUserController.createSystemUser);
router.put("/system-users/:id", requireWriteModule("settings"), systemUserController.updateSystemUser);
router.delete("/system-users/:id", requireWriteModule("settings"), systemUserController.deleteSystemUser);

// ==================== Home Section Routes ====================
router.get("/home-sections", requireViewModule("marketing"), homeSectionController.getHomeSections);
router.get("/home-sections/:id", requireViewModule("marketing"), homeSectionController.getHomeSectionById);
router.post("/home-sections", requireWriteModule("marketing"), homeSectionController.createHomeSection);
router.put("/home-sections/:id", requireWriteModule("marketing"), homeSectionController.updateHomeSection);
router.delete("/home-sections/:id", requireWriteModule("marketing"), homeSectionController.deleteHomeSection);
router.put("/home-sections/reorder", requireWriteModule("marketing"), homeSectionController.reorderHomeSections);

// ==================== Bestseller Card Routes ====================
router.get("/bestseller-cards", requireViewModule("marketing"), bestsellerCardController.getBestsellerCards);
router.get("/bestseller-cards/:id", requireViewModule("marketing"), bestsellerCardController.getBestsellerCardById);
router.post("/bestseller-cards", requireWriteModule("marketing"), bestsellerCardController.createBestsellerCard);
router.put("/bestseller-cards/:id", requireWriteModule("marketing"), bestsellerCardController.updateBestsellerCard);
router.delete("/bestseller-cards/:id", requireWriteModule("marketing"), bestsellerCardController.deleteBestsellerCard);
router.put("/bestseller-cards/reorder", requireWriteModule("marketing"), bestsellerCardController.reorderBestsellerCards);

// ==================== Lowest Prices Product Routes ====================
router.get("/lowest-prices-products", requireViewModule("marketing"), lowestPricesController.getLowestPricesProducts);
router.get("/lowest-prices-products/:id", requireViewModule("marketing"), lowestPricesController.getLowestPricesProductById);
router.post("/lowest-prices-products", requireWriteModule("marketing"), lowestPricesController.createLowestPricesProduct);
router.put("/lowest-prices-products/:id", requireWriteModule("marketing"), lowestPricesController.updateLowestPricesProduct);
router.delete("/lowest-prices-products/:id", requireWriteModule("marketing"), lowestPricesController.deleteLowestPricesProduct);
router.put("/lowest-prices-products/reorder", requireWriteModule("marketing"), lowestPricesController.reorderLowestPricesProducts);

// ==================== PromoStrip Routes ====================
router.get("/promo-strips", requireViewModule("marketing"), promoStripController.getAllPromoStrips);
router.get("/promo-strips/:id", requireViewModule("marketing"), promoStripController.getPromoStripById);
router.post("/promo-strips", requireWriteModule("marketing"), promoStripController.createPromoStrip);
router.put("/promo-strips/:id", requireWriteModule("marketing"), promoStripController.updatePromoStrip);
router.delete("/promo-strips/:id", requireWriteModule("marketing"), promoStripController.deletePromoStrip);

export default router;

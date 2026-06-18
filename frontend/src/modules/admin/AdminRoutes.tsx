import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import IconLoader from "../../components/loaders/IconLoader";
import PermissionGuard from "./components/PermissionGuard";

// Lazy load layout
const AdminLayout = lazy(() => import("./components/AdminLayout"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const AdminCategory = lazy(() => import("./pages/AdminCategory"));
const AdminHeaderCategory = lazy(() => import("./pages/AdminHeaderCategory"));
const AdminSubCategory = lazy(() => import("./pages/AdminSubCategory"));
const AdminSubcategoryOrder = lazy(() => import("./pages/AdminSubcategoryOrder"));
const AdminBrand = lazy(() => import("./pages/AdminBrand"));
const AdminTaxes = lazy(() => import("./pages/AdminTaxes"));
const AdminStockManagement = lazy(() => import("./pages/AdminStockManagement"));
const AdminEditProduct = lazy(() => import("./pages/AdminEditProduct"));
const AdminManageSellerList = lazy(() => import("./pages/AdminManageSellerList"));
const AdminCreateSeller = lazy(() => import("./pages/AdminCreateSeller"));
const AdminWarehouseInwardStock = lazy(() => import("./pages/AdminWarehouseInwardStock"));
const AdminPortNegotiations = lazy(() => import("./pages/AdminPortNegotiations"));
const AdminPortShipments = lazy(() => import("./pages/AdminPortShipments"));
const AdminSellerTransaction = lazy(() => import("./pages/AdminSellerTransaction"));
const AdminManageDeliveryBoy = lazy(() => import("./pages/AdminManageDeliveryBoy"));
const AdminFundTransfer = lazy(() => import("./pages/AdminFundTransfer"));
const AdminCashCollection = lazy(() => import("./pages/AdminCashCollection"));
const AdminSellerLocation = lazy(() => import("./pages/AdminSellerLocation"));
const AdminCoupon = lazy(() => import("./pages/AdminCoupon"));
const AdminReturnRequest = lazy(() => import("./pages/AdminReturnRequest"));
const AdminNotification = lazy(() => import("./pages/AdminNotification"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminManageCustomer = lazy(() => import("./pages/AdminManageCustomer"));
const AdminPaymentList = lazy(() => import("./pages/AdminPaymentList"));
const AdminSmsGateway = lazy(() => import("./pages/AdminSmsGateway"));
const AdminSystemUser = lazy(() => import("./pages/AdminSystemUser"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminFAQ = lazy(() => import("./pages/AdminFAQ"));
const AdminHomeSection = lazy(() => import("./pages/AdminHomeSection"));
const AdminBestsellerCards = lazy(() => import("./pages/AdminBestsellerCards"));
const AdminPromoStrip = lazy(() => import("./pages/AdminPromoStrip"));
const AdminLowestPrices = lazy(() => import("./pages/AdminLowestPrices"));
const AdminShopByStore = lazy(() => import("./pages/AdminShopByStore"));
const AdminAllOrders = lazy(() => import("./pages/AdminAllOrders"));
const AdminPendingOrders = lazy(() => import("./pages/AdminPendingOrders"));
const AdminReceivedOrders = lazy(() => import("./pages/AdminReceivedOrders"));
const AdminProcessedOrders = lazy(() => import("./pages/AdminProcessedOrders"));
const AdminShippedOrders = lazy(() => import("./pages/AdminShippedOrders"));
const AdminOutForDeliveryOrders = lazy(() => import("./pages/AdminOutForDeliveryOrders"));
const AdminDeliveredOrders = lazy(() => import("./pages/AdminDeliveredOrders"));
const AdminCancelledOrders = lazy(() => import("./pages/AdminCancelledOrders"));
const AdminCustomerAppPolicy = lazy(() => import("./pages/AdminCustomerAppPolicy"));
const AdminDeliveryAppPolicy = lazy(() => import("./pages/AdminDeliveryAppPolicy"));
const AdminOrderDetail = lazy(() => import("./pages/AdminOrderDetail"));
const AdminExploreProducts = lazy(() => import("./pages/AdminExploreProducts"));
const AdminWithdrawals = lazy(() => import("./pages/AdminWithdrawals"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminWallet = lazy(() => import("./pages/AdminWallet"));
const AdminBillingSettings = lazy(() => import("./pages/AdminBillingSettings"));
const AdminRefundApproval = lazy(() => import("./pages/AdminRefundApproval"));
const AdminTeamManagement = lazy(() => import("./pages/AdminTeamManagement"));
// Shared route-planning page (reused from warehouse module, layout-agnostic)
const RoutePlanning = lazy(() => import("../warehouse/pages/WarehouseRoutePlanning"));
const LiveTracking = lazy(() => import("../warehouse/pages/WarehouseLiveTracking"));

export default function AdminRoutes() {
  return (
    <ProtectedRoute requiredUserType="Admin" redirectTo="/admin/login">
      <Suspense fallback={<IconLoader forceShow />}>
        <AdminLayout>
          <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          {/* Products */}
          <Route path="category" element={<PermissionGuard module="products"><AdminCategory /></PermissionGuard>} />
          <Route path="category/header" element={<PermissionGuard module="products"><AdminHeaderCategory /></PermissionGuard>} />
          <Route path="subcategory" element={<PermissionGuard module="products"><AdminSubCategory /></PermissionGuard>} />
          <Route path="subcategory-order" element={<PermissionGuard module="products"><AdminSubcategoryOrder /></PermissionGuard>} />
          <Route path="brand" element={<PermissionGuard module="products"><AdminBrand /></PermissionGuard>} />
          <Route path="product/taxes" element={<PermissionGuard module="products"><AdminTaxes /></PermissionGuard>} />
          <Route path="product/list" element={<PermissionGuard module="products"><AdminStockManagement /></PermissionGuard>} />
          <Route path="product/edit/:id" element={<PermissionGuard module="products"><AdminEditProduct /></PermissionGuard>} />
          {/* Warehouse */}
          <Route path="manage-warehouse/list" element={<PermissionGuard module="warehouse"><AdminManageSellerList /></PermissionGuard>} />
          <Route path="manage-warehouse/create" element={<PermissionGuard module="warehouse"><AdminCreateSeller /></PermissionGuard>} />
          <Route path="manage-warehouse/inward-stock" element={<PermissionGuard module="warehouse"><AdminWarehouseInwardStock /></PermissionGuard>} />
          <Route path="manage-warehouse/transaction" element={<PermissionGuard module="warehouse"><AdminSellerTransaction /></PermissionGuard>} />
          {/* Port */}
          <Route path="manage-warehouse/port-negotiations" element={<PermissionGuard module="port"><AdminPortNegotiations /></PermissionGuard>} />
          <Route path="manage-warehouse/port-shipments" element={<PermissionGuard module="port"><AdminPortShipments /></PermissionGuard>} />
          <Route path="explore" element={<PermissionGuard module="port"><AdminExploreProducts /></PermissionGuard>} />
          {/* Delivery */}
          <Route path="delivery-boy/manage" element={<PermissionGuard module="delivery"><AdminManageDeliveryBoy /></PermissionGuard>} />
          <Route path="delivery-boy/fund-transfer" element={<PermissionGuard module="delivery"><AdminFundTransfer /></PermissionGuard>} />
          <Route path="delivery-boy/cash-collection" element={<PermissionGuard module="delivery"><AdminCashCollection /></PermissionGuard>} />
          <Route path="collect-cash" element={<PermissionGuard module="delivery"><AdminCashCollection /></PermissionGuard>} />
          <Route path="manage-location/warehouse-location" element={<PermissionGuard module="delivery"><AdminSellerLocation /></PermissionGuard>} />
          <Route path="route-planning" element={<PermissionGuard module="delivery"><RoutePlanning /></PermissionGuard>} />
          <Route path="live-tracking" element={<PermissionGuard module="delivery"><LiveTracking /></PermissionGuard>} />
          {/* Marketing */}
          <Route path="coupon" element={<PermissionGuard module="marketing"><AdminCoupon /></PermissionGuard>} />
          <Route path="home-section" element={<PermissionGuard module="marketing"><AdminHomeSection /></PermissionGuard>} />
          <Route path="bestseller-cards" element={<PermissionGuard module="marketing"><AdminBestsellerCards /></PermissionGuard>} />
          <Route path="promo-strip" element={<PermissionGuard module="marketing"><AdminPromoStrip /></PermissionGuard>} />
          <Route path="lowest-prices" element={<PermissionGuard module="marketing"><AdminLowestPrices /></PermissionGuard>} />
          <Route path="shop-by-store" element={<PermissionGuard module="marketing"><AdminShopByStore /></PermissionGuard>} />
          {/* Returns */}
          <Route path="return" element={<PermissionGuard module="returns"><AdminReturnRequest /></PermissionGuard>} />
          <Route path="return/refunds" element={<PermissionGuard module="returns"><AdminRefundApproval /></PermissionGuard>} />
          {/* Notifications */}
          <Route path="notification" element={<PermissionGuard module="notifications"><AdminNotification /></PermissionGuard>} />
          {/* Orders */}
          <Route path="orders" element={<PermissionGuard module="orders"><AdminOrders /></PermissionGuard>} />
          <Route path="orders/all" element={<PermissionGuard module="orders"><AdminAllOrders /></PermissionGuard>} />
          <Route path="orders/pending" element={<PermissionGuard module="orders"><AdminPendingOrders /></PermissionGuard>} />
          <Route path="orders/received" element={<PermissionGuard module="orders"><AdminReceivedOrders /></PermissionGuard>} />
          <Route path="orders/processed" element={<PermissionGuard module="orders"><AdminProcessedOrders /></PermissionGuard>} />
          <Route path="orders/shipped" element={<PermissionGuard module="orders"><AdminShippedOrders /></PermissionGuard>} />
          <Route path="orders/out-for-delivery" element={<PermissionGuard module="orders"><AdminOutForDeliveryOrders /></PermissionGuard>} />
          <Route path="orders/delivered" element={<PermissionGuard module="orders"><AdminDeliveredOrders /></PermissionGuard>} />
          <Route path="orders/cancelled" element={<PermissionGuard module="orders"><AdminCancelledOrders /></PermissionGuard>} />
          <Route path="orders/:id" element={<PermissionGuard module="orders"><AdminOrderDetail /></PermissionGuard>} />
          {/* Customers */}
          <Route path="customers" element={<PermissionGuard module="customers"><AdminManageCustomer /></PermissionGuard>} />
          <Route path="users" element={<PermissionGuard module="customers"><AdminUsers /></PermissionGuard>} />
          {/* Finance */}
          <Route path="payment-list" element={<PermissionGuard module="finance"><AdminPaymentList /></PermissionGuard>} />
          <Route path="withdrawals" element={<PermissionGuard module="finance"><AdminWithdrawals /></PermissionGuard>} />
          <Route path="payments" element={<PermissionGuard module="finance"><AdminPayments /></PermissionGuard>} />
          <Route path="wallet" element={<PermissionGuard module="finance"><AdminWallet /></PermissionGuard>} />
          <Route path="billing-settings" element={<PermissionGuard module="finance"><AdminBillingSettings /></PermissionGuard>} />
          {/* Settings */}
          <Route path="sms-gateway" element={<PermissionGuard module="settings"><AdminSmsGateway /></PermissionGuard>} />
          <Route path="system-user" element={<PermissionGuard module="settings"><AdminSystemUser /></PermissionGuard>} />
          <Route path="customer-app-policy" element={<PermissionGuard module="settings"><AdminCustomerAppPolicy /></PermissionGuard>} />
          <Route path="delivery-app-policy" element={<PermissionGuard module="settings"><AdminDeliveryAppPolicy /></PermissionGuard>} />
          <Route path="faq" element={<PermissionGuard module="settings"><AdminFAQ /></PermissionGuard>} />
          {/* Team (Admin-only) */}
          <Route path="team" element={<PermissionGuard module="team"><AdminTeamManagement /></PermissionGuard>} />
          </Routes>
        </AdminLayout>
      </Suspense>
    </ProtectedRoute>
  );
}

import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import IconLoader from "../../components/loaders/IconLoader";

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

export default function AdminRoutes() {
  return (
    <ProtectedRoute requiredUserType="Admin" redirectTo="/admin/login">
      <Suspense fallback={<IconLoader forceShow />}>
        <AdminLayout>
          <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="category" element={<AdminCategory />} />
          <Route path="category/header" element={<AdminHeaderCategory />} />
          <Route path="subcategory" element={<AdminSubCategory />} />
          <Route path="subcategory-order" element={<AdminSubcategoryOrder />} />
          <Route path="brand" element={<AdminBrand />} />
          <Route path="product/taxes" element={<AdminTaxes />} />
          <Route path="product/list" element={<AdminStockManagement />} />
          <Route path="product/edit/:id" element={<AdminEditProduct />} />
          <Route path="manage-warehouse/list" element={<AdminManageSellerList />} />
          <Route path="manage-warehouse/create" element={<AdminCreateSeller />} />
          <Route path="manage-warehouse/inward-stock" element={<AdminWarehouseInwardStock />} />
          <Route path="manage-warehouse/port-negotiations" element={<AdminPortNegotiations />} />
          <Route path="manage-warehouse/port-shipments" element={<AdminPortShipments />} />
          <Route path="manage-warehouse/transaction" element={<AdminSellerTransaction />} />
          <Route path="delivery-boy/manage" element={<AdminManageDeliveryBoy />} />
          <Route path="delivery-boy/fund-transfer" element={<AdminFundTransfer />} />
          <Route path="delivery-boy/cash-collection" element={<AdminCashCollection />} />
          <Route path="manage-location/warehouse-location" element={<AdminSellerLocation />} />

          <Route path="coupon" element={<AdminCoupon />} />
          <Route path="return" element={<AdminReturnRequest />} />
          <Route path="return/refunds" element={<AdminRefundApproval />} />
          <Route path="notification" element={<AdminNotification />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminManageCustomer />} />
          <Route path="collect-cash" element={<AdminCashCollection />} />
          <Route path="payment-list" element={<AdminPaymentList />} />
          <Route path="sms-gateway" element={<AdminSmsGateway />} />
          <Route path="system-user" element={<AdminSystemUser />} />
          <Route path="customer-app-policy" element={<AdminCustomerAppPolicy />} />
          <Route path="delivery-app-policy" element={<AdminDeliveryAppPolicy />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="faq" element={<AdminFAQ />} />
          <Route path="home-section" element={<AdminHomeSection />} />
          <Route path="bestseller-cards" element={<AdminBestsellerCards />} />
          <Route path="promo-strip" element={<AdminPromoStrip />} />
          <Route path="lowest-prices" element={<AdminLowestPrices />} />
          <Route path="shop-by-store" element={<AdminShopByStore />} />
          <Route path="orders/all" element={<AdminAllOrders />} />
          <Route path="orders/pending" element={<AdminPendingOrders />} />
          <Route path="orders/received" element={<AdminReceivedOrders />} />
          <Route path="orders/processed" element={<AdminProcessedOrders />} />
          <Route path="orders/shipped" element={<AdminShippedOrders />} />
          <Route path="orders/out-for-delivery" element={<AdminOutForDeliveryOrders />} />
          <Route path="orders/delivered" element={<AdminDeliveredOrders />} />
          <Route path="orders/cancelled" element={<AdminCancelledOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />

          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="wallet" element={<AdminWallet />} />
          <Route path="billing-settings" element={<AdminBillingSettings />} />
          <Route path="explore" element={<AdminExploreProducts />} />
          </Routes>
        </AdminLayout>
      </Suspense>
    </ProtectedRoute>
  );
}

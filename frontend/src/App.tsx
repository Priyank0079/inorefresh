import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, startTransition } from "react";
import { CartProvider } from "./context/CartContext";
import { OrdersProvider } from "./context/OrdersContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LocationProvider } from "./context/LocationContext";
import { ToastProvider } from "./context/ToastContext";

import { LoadingProvider } from "./context/LoadingContext";
import { AxiosLoadingInterceptor } from "./context/AxiosLoadingInterceptor";
import IconLoader from "./components/loaders/IconLoader";
import RouteLoaderTrigger from "./components/loaders/RouteLoaderTrigger";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteTransition from "./components/RouteTransition";
import SmoothScroll from "./components/SmoothScroll";
import { useEffect } from "react";
import { initializePushNotifications, setupForegroundNotificationHandler } from "./services/pushNotificationService";

// Lazy load user routes
const Home = lazy(() => import("./modules/user/Home"));
const Cart = lazy(() => import("./modules/user/Cart"));
const Checkout = lazy(() => import("./modules/user/Checkout"));
const CheckoutAddress = lazy(() => import("./modules/user/CheckoutAddress"));
const ProductDetail = lazy(() => import("./modules/user/ProductDetail"));

// Lazy load less critical routes for code splitting
const Search = lazy(() => import("./modules/user/Search"));
const Orders = lazy(() => import("./modules/user/Orders"));
const OrderDetail = lazy(() => import("./modules/user/OrderDetail"));
const OrderAgain = lazy(() => import("./modules/user/OrderAgain"));
const Account = lazy(() => import("./modules/user/Account"));
const Categories = lazy(() => import("./modules/user/Categories"));
const Category = lazy(() => import("./modules/user/Category"));
const Invoice = lazy(() => import("./modules/user/Invoice"));
const Login = lazy(() => import("./modules/user/Login"));

const AboutUs = lazy(() => import("./modules/user/AboutUs"));
const FAQ = lazy(() => import("./modules/user/FAQ"));
const Wishlist = lazy(() => import("./modules/user/Wishlist"));
const Addresses = lazy(() => import("./modules/user/Addresses"));
const AddressBook = lazy(() => import("./modules/user/AddressBook"));
const SpiritualStore = lazy(() => import("./modules/user/SpiritualStore"));
const PharmaStore = lazy(() => import("./modules/user/PharmaStore"));
const EGiftStore = lazy(() => import("./modules/user/EGiftStore"));
const PetStore = lazy(() => import("./modules/user/PetStore"));
const SportsStore = lazy(() => import("./modules/user/SportsStore"));
const FashionStore = lazy(() => import("./modules/user/FashionStore"));
const ToyStore = lazy(() => import("./modules/user/ToyStore"));
const HobbyStore = lazy(() => import("./modules/user/HobbyStore"));
const StorePage = lazy(() => import("./modules/user/StorePage"));
// Lazy load delivery routes
const DeliveryLayout = lazy(() => import("./modules/delivery/components/DeliveryLayout"));
const DeliveryDashboard = lazy(() => import("./modules/delivery/pages/DeliveryDashboard"));
const DeliveryOrders = lazy(() => import("./modules/delivery/pages/DeliveryOrders"));
const DeliveryOrderDetail = lazy(() => import("./modules/delivery/pages/DeliveryOrderDetail"));
const DeliveryNotifications = lazy(() => import("./modules/delivery/pages/DeliveryNotifications"));
const DeliveryMenu = lazy(() => import("./modules/delivery/pages/DeliveryMenu"));
const DeliveryPendingOrders = lazy(() => import("./modules/delivery/pages/DeliveryPendingOrders"));
const DeliveryAllOrders = lazy(() => import("./modules/delivery/pages/DeliveryAllOrders"));
const DeliveryReturnOrders = lazy(() => import("./modules/delivery/pages/DeliveryReturnOrders"));
const DeliveryProfile = lazy(() => import("./modules/delivery/pages/DeliveryProfile"));
const DeliveryEarnings = lazy(() => import("./modules/delivery/pages/DeliveryEarnings"));
const DeliveryWallet = lazy(() => import("./modules/delivery/pages/DeliveryWallet"));
const DeliverySettings = lazy(() => import("./modules/delivery/pages/DeliverySettings"));
const DeliveryHelp = lazy(() => import("./modules/delivery/pages/DeliveryHelp"));
const DeliveryAbout = lazy(() => import("./modules/delivery/pages/DeliveryAbout"));
const DeliverySellersInRange = lazy(() => import("./modules/delivery/pages/DeliverySellersInRange"));
const DeliveryLogin = lazy(() => import("./modules/delivery/pages/DeliveryLogin"));
const DeliverySignUp = lazy(() => import("./modules/delivery/pages/DeliverySignUp"));

// Lazy load warehouse routes
const WarehouseLayout = lazy(() => import("./modules/warehouse/components/WarehouseLayout"));
const WarehouseDashboard = lazy(() => import("./modules/warehouse/pages/WarehouseDashboard"));
const WarehouseOrders = lazy(() => import("./modules/warehouse/pages/WarehouseOrders"));
const WarehouseOrderDetail = lazy(() => import("./modules/warehouse/pages/WarehouseOrderDetail"));
const WarehouseCategory = lazy(() => import("./modules/warehouse/pages/WarehouseCategory"));
const WarehouseSubCategory = lazy(() => import("./modules/warehouse/pages/WarehouseSubCategory"));
const WarehouseAddProduct = lazy(() => import("./modules/warehouse/pages/WarehouseAddProduct"));
const WarehouseTaxes = lazy(() => import("./modules/warehouse/pages/WarehouseTaxes"));
const WarehouseProductList = lazy(() => import("./modules/warehouse/pages/WarehouseProductList"));
const WarehouseStockManagement = lazy(() => import("./modules/warehouse/pages/WarehouseStockManagement"));
const WarehouseWallet = lazy(() => import("./modules/warehouse/pages/WarehouseWallet"));
const WarehouseSalesReport = lazy(() => import("./modules/warehouse/pages/WarehouseSalesReport"));
const WarehouseReturnRequest = lazy(() => import("./modules/warehouse/pages/WarehouseReturnRequest"));
const WarehouseAccountSettings = lazy(() => import("./modules/warehouse/pages/WarehouseAccountSettings"));
const WarehouseLogin = lazy(() => import("./modules/warehouse/pages/WarehouseLogin"));
const WarehouseSignUp = lazy(() => import("./modules/warehouse/pages/WarehouseSignUp"));

// Lazy load admin routes
const AdminLayout = lazy(() => import("./modules/admin/components/AdminLayout"));
const AdminDashboard = lazy(() => import("./modules/admin/pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./modules/admin/pages/AdminLogin"));
const AdminCategory = lazy(() => import("./modules/admin/pages/AdminCategory"));
const AdminHeaderCategory = lazy(() => import("./modules/admin/pages/AdminHeaderCategory"));
const AdminSubCategory = lazy(() => import("./modules/admin/pages/AdminSubCategory"));
const AdminBrand = lazy(() => import("./modules/admin/pages/AdminBrand"));
const AdminTaxes = lazy(() => import("./modules/admin/pages/AdminTaxes"));
const AdminSellerTransaction = lazy(() => import("./modules/admin/pages/AdminSellerTransaction"));
const AdminStockManagement = lazy(() => import("./modules/admin/pages/AdminStockManagement"));
const AdminSubcategoryOrder = lazy(() => import("./modules/admin/pages/AdminSubcategoryOrder"));
const AdminManageSellerList = lazy(() => import("./modules/admin/pages/AdminManageSellerList"));
const AdminCreateSeller = lazy(() => import("./modules/admin/pages/AdminCreateSeller"));
const AdminCoupon = lazy(() => import("./modules/admin/pages/AdminCoupon"));
const AdminNotification = lazy(() => import("./modules/admin/pages/AdminNotification"));
const AdminSellerLocation = lazy(() => import("./modules/admin/pages/AdminSellerLocation"));

const AdminManageDeliveryBoy = lazy(() => import("./modules/admin/pages/AdminManageDeliveryBoy"));
const AdminFundTransfer = lazy(() => import("./modules/admin/pages/AdminFundTransfer"));
const AdminCashCollection = lazy(() => import("./modules/admin/pages/AdminCashCollection"));
const AdminReturnRequest = lazy(() => import("./modules/admin/pages/AdminReturnRequest"));
const AdminPaymentList = lazy(() => import("./modules/admin/pages/AdminPaymentList"));
const AdminSmsGateway = lazy(() => import("./modules/admin/pages/AdminSmsGateway"));
const AdminSystemUser = lazy(() => import("./modules/admin/pages/AdminSystemUser"));
const AdminUsers = lazy(() => import("./modules/admin/pages/AdminUsers"));
const AdminFAQ = lazy(() => import("./modules/admin/pages/AdminFAQ"));
const AdminHomeSection = lazy(() => import("./modules/admin/pages/AdminHomeSection"));
const AdminBestsellerCards = lazy(() => import("./modules/admin/pages/AdminBestsellerCards"));
const AdminPromoStrip = lazy(() => import("./modules/admin/pages/AdminPromoStrip"));
const AdminLowestPrices = lazy(() => import("./modules/admin/pages/AdminLowestPrices"));
const AdminShopByStore = lazy(() => import("./modules/admin/pages/AdminShopByStore"));
const AdminAllOrders = lazy(() => import("./modules/admin/pages/AdminAllOrders"));
const AdminPendingOrders = lazy(() => import("./modules/admin/pages/AdminPendingOrders"));
const AdminReceivedOrders = lazy(() => import("./modules/admin/pages/AdminReceivedOrders"));
const AdminProcessedOrders = lazy(() => import("./modules/admin/pages/AdminProcessedOrders"));
const AdminShippedOrders = lazy(() => import("./modules/admin/pages/AdminShippedOrders"));
const AdminOutForDeliveryOrders = lazy(() => import("./modules/admin/pages/AdminOutForDeliveryOrders"));
const AdminDeliveredOrders = lazy(() => import("./modules/admin/pages/AdminDeliveredOrders"));
const AdminCancelledOrders = lazy(() => import("./modules/admin/pages/AdminCancelledOrders"));
const AdminCustomerAppPolicy = lazy(() => import("./modules/admin/pages/AdminCustomerAppPolicy"));
const AdminDeliveryAppPolicy = lazy(() => import("./modules/admin/pages/AdminDeliveryAppPolicy"));
const AdminOrders = lazy(() => import("./modules/admin/pages/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./modules/admin/pages/AdminOrderDetail"));
const AdminManageCustomer = lazy(() => import("./modules/admin/pages/AdminManageCustomer"));
const AdminProfile = lazy(() => import("./modules/admin/pages/AdminProfile"));

const AdminWithdrawals = lazy(() => import("./modules/admin/pages/AdminWithdrawals"));
const AdminPayments = lazy(() => import("./modules/admin/pages/AdminPayments"));
const AdminWallet = lazy(() => import("./modules/admin/pages/AdminWallet"));
const AdminBillingSettings = lazy(() => import("./modules/admin/pages/AdminBillingSettings"));

function App() {
  // Initialize push notifications on app load
  useEffect(() => {
    initializePushNotifications();

    // Setup foreground notification handler
    setupForegroundNotificationHandler((payload) => {
      console.log('Notification received in app:', payload);
      // You can add custom handling here (e.g., show toast, update UI)
    });
  }, []);

  return (
    <ErrorBoundary>
      <LoadingProvider>
        <AxiosLoadingInterceptor>
          <IconLoader />
          <AuthProvider>
            <ThemeProvider>
              <LocationProvider>
                <ToastProvider>

                  <CartProvider>
                    <OrdersProvider>
                      <BrowserRouter
                        future={{
                          v7_startTransition: true,
                          v7_relativeSplatPath: true,
                        }}>
                        <SmoothScroll>
                          <RouteLoaderTrigger />
                          <Routes>
                            {/* Public Routes */}
                            <Route
                              path="/login"
                              element={
                                <PublicRoute>
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <Login />
                                  </Suspense>
                                </PublicRoute>
                              }
                            />

                            <Route
                              path="/warehouse/login"
                              element={
                                <PublicRoute userType="Warehouse">
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <WarehouseLogin />
                                  </Suspense>
                                </PublicRoute>
                              }
                            />
                            <Route
                              path="/warehouse/signup"
                              element={
                                <PublicRoute>
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <WarehouseSignUp />
                                  </Suspense>
                                </PublicRoute>
                              }
                            />
                            <Route
                              path="/delivery/login"
                              element={
                                <PublicRoute>
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <DeliveryLogin />
                                  </Suspense>
                                </PublicRoute>
                              }
                            />
                            <Route
                              path="/delivery/signup"
                              element={
                                <PublicRoute>
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <DeliverySignUp />
                                  </Suspense>
                                </PublicRoute>
                              }
                            />
                            <Route
                              path="/admin/login"
                              element={
                                <PublicRoute>
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <AdminLogin />
                                  </Suspense>
                                </PublicRoute>
                              }
                            />

                            {/* Direct Warehouse Category Route (stabilizes deep-link navigation) */}
                            <Route
                              path="/warehouse/category"
                              element={
                                <ProtectedRoute requiredUserType="Warehouse" redirectTo="/warehouse/login">
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <WarehouseLayout>
                                      <WarehouseCategory />
                                    </WarehouseLayout>
                                  </Suspense>
                                </ProtectedRoute>
                              }
                            />

                            {/* Delivery App Routes */}
                            <Route
                              path="/delivery/*"
                              element={
                                <ProtectedRoute requiredUserType="Delivery" redirectTo="/delivery/login">
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <DeliveryLayout>
                                      <Routes>
                                        <Route index element={<DeliveryDashboard />} />
                                        <Route path="orders" element={<DeliveryOrders />} />
                                        <Route path="orders/:id" element={<DeliveryOrderDetail />} />
                                        <Route path="orders/pending" element={<DeliveryPendingOrders />} />
                                        <Route path="orders/all" element={<DeliveryAllOrders />} />
                                        <Route path="orders/return" element={<DeliveryReturnOrders />} />
                                        <Route path="notifications" element={<DeliveryNotifications />} />
                                        <Route path="menu" element={<DeliveryMenu />} />
                                        <Route path="profile" element={<DeliveryProfile />} />
                                        <Route path="earnings" element={<DeliveryEarnings />} />
                                        <Route path="wallet" element={<DeliveryWallet />} />
                                        <Route path="settings" element={<DeliverySettings />} />
                                        <Route path="help" element={<DeliveryHelp />} />
                                        <Route path="about" element={<DeliveryAbout />} />
                                        <Route path="sellers-in-range" element={<DeliverySellersInRange />} />
                                      </Routes>
                                    </DeliveryLayout>
                                  </Suspense>
                                </ProtectedRoute>
                              }
                            />

                            {/* Warehouse App Routes */}
                            <Route
                              path="/warehouse/*"
                              element={
                                <ProtectedRoute requiredUserType="Warehouse" redirectTo="/warehouse/login">
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <WarehouseLayout>
                                      <Routes>
                                        <Route index element={<WarehouseDashboard />} />
                                        <Route path="orders" element={<WarehouseOrders />} />
                                        <Route path="orders/:id" element={<WarehouseOrderDetail />} />
                                        <Route path="category" element={<WarehouseCategory />} />
                                        <Route path="subcategory" element={<WarehouseSubCategory />} />
                                        <Route path="product/add" element={<WarehouseAddProduct />} />
                                        <Route path="product/edit/:id" element={<WarehouseAddProduct />} />
                                        <Route path="product/taxes" element={<WarehouseTaxes />} />
                                        <Route path="product/list" element={<WarehouseProductList />} />
                                        <Route path="product/stock" element={<WarehouseStockManagement />} />
                                        <Route path="return" element={<WarehouseReturnRequest />} />
                                        <Route path="return-order" element={<WarehouseReturnRequest />} />
                                        <Route path="wallet" element={<WarehouseWallet />} />
                                        <Route path="reports/sales" element={<WarehouseSalesReport />} />
                                        <Route path="account-settings" element={<WarehouseAccountSettings />} />
                                        <Route path="all" element={<AdminManageSellerList />} />
                                      </Routes>
                                    </WarehouseLayout>
                                  </Suspense>
                                </ProtectedRoute>
                              }
                            />

                            {/* Admin App Routes */}
                            <Route
                              path="/admin/*"
                              element={
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
                                        <Route path="manage-warehouse/list" element={<AdminManageSellerList />} />
                                        <Route path="manage-warehouse/create" element={<AdminCreateSeller />} />
                                        <Route path="manage-warehouse/transaction" element={<AdminSellerTransaction />} />
                                        <Route path="delivery-boy/manage" element={<AdminManageDeliveryBoy />} />
                                        <Route path="delivery-boy/fund-transfer" element={<AdminFundTransfer />} />
                                        <Route path="delivery-boy/cash-collection" element={<AdminCashCollection />} />
                                        <Route path="manage-location/warehouse-location" element={<AdminSellerLocation />} />

                                        <Route path="coupon" element={<AdminCoupon />} />
                                        <Route path="return" element={<AdminReturnRequest />} />
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
                                      </Routes>
                                    </AdminLayout>
                                  </Suspense>
                                </ProtectedRoute>
                              }
                            />

                            {/* Main App Routes */}
                            <Route
                              path="/*"
                              element={
                                <AppLayout>
                                  <Suspense fallback={<IconLoader forceShow />}>
                                    <Routes>
                                      <Route path="/" element={<Home />} />
                                      <Route path="/user/home" element={<Home />} />
                                      <Route path="/search" element={<Search />} />
                                      <Route path="/orders" element={<Orders />} />
                                      <Route path="/orders/:id" element={<OrderDetail />} />
                                      <Route path="/order-again" element={<OrderAgain />} />
                                      <Route path="/account" element={<Account />} />
                                      <Route path="/about-us" element={<AboutUs />} />
                                      <Route path="/faq" element={<FAQ />} />
                                      <Route path="/wishlist" element={<Wishlist />} />
                                      <Route path="/categories" element={<Categories />} />
                                      <Route path="/category/:id" element={<Category />} />
                                      <Route path="/address-book" element={<AddressBook />} />
                                      <Route path="/checkout" element={<Checkout />} />
                                      <Route path="/checkout/address" element={<CheckoutAddress />} />
                                      <Route path="/product/:id" element={<ProductDetail />} />
                                      <Route path="/invoice/:id" element={<Invoice />} />
                                      <Route path="/cart" element={<Cart />} />
                                      <Route path="/addresses" element={<Addresses />} />
                                      <Route path="/store/:slug" element={<StorePage />} />
                                      <Route path="/store/spiritual" element={<SpiritualStore />} />
                                      <Route path="/store/pharma" element={<PharmaStore />} />
                                      <Route path="/store/e-gifts" element={<EGiftStore />} />
                                      <Route path="/store/pet" element={<PetStore />} />
                                      <Route path="/store/sports" element={<SportsStore />} />
                                      <Route path="/store/fashion-basics" element={<FashionStore />} />
                                      <Route path="/store/toy" element={<ToyStore />} />
                                      <Route path="/store/hobby" element={<HobbyStore />} />
                                    </Routes>
                                  </Suspense>
                                </AppLayout>
                              }
                            />
                          </Routes>
                        </SmoothScroll>
                      </BrowserRouter>
                    </OrdersProvider>
                  </CartProvider>
                </ToastProvider>
              </LocationProvider>

            </ThemeProvider>
          </AuthProvider>
        </AxiosLoadingInterceptor>
      </LoadingProvider>
    </ErrorBoundary>
  );
}

export default App;

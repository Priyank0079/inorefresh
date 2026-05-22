import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import { LoadingProvider } from "./context/LoadingContext";
import { AxiosLoadingInterceptor } from "./context/AxiosLoadingInterceptor";
import IconLoader from "./components/loaders/IconLoader";
import RouteLoaderTrigger from "./components/loaders/RouteLoaderTrigger";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import SmoothScroll from "./components/SmoothScroll";
import { initializePushNotifications, setupForegroundNotificationHandler } from "./services/pushNotificationService";

// Lazy load modular route tables
const CustomerRoutes = lazy(() => import("./modules/user/CustomerRoutes"));
const AdminRoutes = lazy(() => import("./modules/admin/AdminRoutes"));
const WarehouseRoutes = lazy(() => import("./modules/warehouse/WarehouseRoutes"));
const DeliveryRoutes = lazy(() => import("./modules/delivery/DeliveryRoutes"));
const PortRoutes = lazy(() => import("./modules/port/routes/portRoutes.jsx"));

// Lazy load login/auth pages
const Login = lazy(() => import("./modules/user/Login"));
const WarehouseLogin = lazy(() => import("./modules/warehouse/pages/WarehouseLogin"));
const WarehouseSignUp = lazy(() => import("./modules/warehouse/pages/WarehouseSignUp"));
const DeliveryLogin = lazy(() => import("./modules/delivery/pages/DeliveryLogin"));
const DeliverySignUp = lazy(() => import("./modules/delivery/pages/DeliverySignUp"));
const AdminLogin = lazy(() => import("./modules/admin/pages/AdminLogin"));
const PortLogin = lazy(() => import("./modules/port/pages/auth/PortLogin.jsx"));
const PortSignup = lazy(() => import("./modules/port/pages/auth/PortSignup.jsx"));

// Direct Warehouse Category fallback for deep linking
const WarehouseLayout = lazy(() => import("./modules/warehouse/components/WarehouseLayout"));
const WarehouseCategory = lazy(() => import("./modules/warehouse/pages/WarehouseCategory"));

// Common pages
const Terms = lazy(() => import("./components/Terms.jsx"));

function App() {
  // Initialize push notifications on app load
  useEffect(() => {
    initializePushNotifications();

    // Setup foreground notification handler
    setupForegroundNotificationHandler((payload) => {
      console.log('Notification received in app:', payload);
    });
  }, []);

  return (
    <ErrorBoundary>
      <LoadingProvider>
        <AxiosLoadingInterceptor>
          <IconLoader />
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                <NotificationProvider>
                  <BrowserRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}>
                    <SmoothScroll>
                      <RouteLoaderTrigger />
                      <Routes>
                        {/* Auth / Login Routes */}
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
                            <PublicRoute userType="Warehouse">
                              <Suspense fallback={<IconLoader forceShow />}>
                                <WarehouseSignUp />
                              </Suspense>
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/delivery/login"
                          element={
                            <PublicRoute userType="Delivery">
                              <Suspense fallback={<IconLoader forceShow />}>
                                <DeliveryLogin />
                              </Suspense>
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/delivery/signup"
                          element={
                            <PublicRoute userType="Delivery">
                              <Suspense fallback={<IconLoader forceShow />}>
                                <DeliverySignUp />
                              </Suspense>
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/admin/login"
                          element={
                            <PublicRoute userType="Admin">
                              <Suspense fallback={<IconLoader forceShow />}>
                                <AdminLogin />
                              </Suspense>
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/port/login"
                          element={
                            <PublicRoute userType="Port">
                              <Suspense fallback={<IconLoader forceShow />}>
                                <PortLogin />
                              </Suspense>
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/port/signup"
                          element={
                            <PublicRoute userType="Port">
                              <Suspense fallback={<IconLoader forceShow />}>
                                <PortSignup />
                              </Suspense>
                            </PublicRoute>
                          }
                        />

                        {/* Common Routes */}
                        <Route
                          path="/terms"
                          element={
                            <Suspense fallback={<IconLoader forceShow />}>
                              <Terms />
                            </Suspense>
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

                        {/* Sub-routers for specific scopes */}
                        <Route
                          path="/admin/*"
                          element={
                            <Suspense fallback={<IconLoader forceShow />}>
                              <AdminRoutes />
                            </Suspense>
                          }
                        />

                        <Route
                          path="/warehouse/*"
                          element={
                            <Suspense fallback={<IconLoader forceShow />}>
                              <WarehouseRoutes />
                            </Suspense>
                          }
                        />

                        <Route
                          path="/delivery/*"
                          element={
                            <Suspense fallback={<IconLoader forceShow />}>
                              <DeliveryRoutes />
                            </Suspense>
                          }
                        />

                        <Route
                          path="/port/*"
                          element={
                            <Suspense fallback={<IconLoader forceShow />}>
                              <PortRoutes />
                            </Suspense>
                          }
                        />

                        {/* User / Customer Routes */}
                        <Route
                          path="/*"
                          element={
                            <Suspense fallback={<IconLoader forceShow />}>
                              <CustomerRoutes />
                            </Suspense>
                          }
                        />
                      </Routes>
                    </SmoothScroll>
                  </BrowserRouter>
                </NotificationProvider>
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </AxiosLoadingInterceptor>
      </LoadingProvider>
    </ErrorBoundary>
  );
}

export default App;

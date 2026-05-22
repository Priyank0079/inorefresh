import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import IconLoader from "../../components/loaders/IconLoader";

// Lazy load layout
const DeliveryLayout = lazy(() => import("./components/DeliveryLayout"));

// Lazy load delivery pages
const DeliveryDashboard = lazy(() => import("./pages/DeliveryDashboard"));
const DeliveryOrders = lazy(() => import("./pages/DeliveryOrders"));
const DeliveryOrderDetail = lazy(() => import("./pages/DeliveryOrderDetail"));
const RiderInspectionControl = lazy(() => import("./pages/RiderInspectionControl"));
const DeliveryNotifications = lazy(() => import("./pages/DeliveryNotifications"));
const DeliveryMenu = lazy(() => import("./pages/DeliveryMenu"));
const DeliveryPendingOrders = lazy(() => import("./pages/DeliveryPendingOrders"));
const DeliveryAllOrders = lazy(() => import("./pages/DeliveryAllOrders"));
const DeliveryReturnOrders = lazy(() => import("./pages/DeliveryReturnOrders"));
const DeliveryProfile = lazy(() => import("./pages/DeliveryProfile"));
const DeliveryEarnings = lazy(() => import("./pages/DeliveryEarnings"));
const DeliveryWallet = lazy(() => import("./pages/DeliveryWallet"));
const DeliverySettings = lazy(() => import("./pages/DeliverySettings"));
const DeliveryHelp = lazy(() => import("./pages/DeliveryHelp"));
const DeliveryAbout = lazy(() => import("./pages/DeliveryAbout"));
const DeliverySellersInRange = lazy(() => import("./pages/DeliverySellersInRange"));

export default function DeliveryRoutes() {
  return (
    <ProtectedRoute requiredUserType="Delivery" redirectTo="/delivery/login">
      <Suspense fallback={<IconLoader forceShow />}>
        <DeliveryLayout>
          <Routes>
            <Route index element={<DeliveryDashboard />} />
            <Route path="orders" element={<DeliveryOrders />} />
            <Route path="orders/:id" element={<DeliveryOrderDetail />} />
            <Route path="orders/:id/inspection" element={<RiderInspectionControl />} />
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
  );
}

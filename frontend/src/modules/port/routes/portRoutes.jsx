import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import PortLayout from '../components/layout/PortLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const IncomingRequirements = lazy(() => import('../pages/requirements/IncomingRequirements'));
const MyOffers = lazy(() => import('../pages/offers/MyOffers'));
const MyProducts = lazy(() => import('../pages/products/MyProducts'));
const AddProduct = lazy(() => import('../pages/products/AddProduct'));
const MyOrders = lazy(() => import('../pages/orders/MyOrders'));
const TrackOrder = lazy(() => import('../pages/orders/TrackOrder'));
const PortShipments = lazy(() => import('../pages/shipments/PortShipments'));
const Notifications = lazy(() => import('../pages/notifications/Notifications'));
const ProfileSettings = lazy(() => import('../pages/settings/ProfileSettings'));
const NegotiationPage = lazy(() => import('../pages/offers/NegotiationPage'));
const RequirementHistory = lazy(() => import('../pages/requirements/RequirementHistory'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
  </div>
);

const PortRoutes = () => {
  return (
    <ProtectedRoute requiredUserType="Port" redirectTo="/port/login">
      <Routes>
        <Route element={<PortLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />

          <Route path="requirements" element={<Suspense fallback={<LoadingFallback />}><IncomingRequirements /></Suspense>} />
          <Route path="requirements/history" element={<Suspense fallback={<LoadingFallback />}><RequirementHistory /></Suspense>} />

          <Route path="offers" element={<Suspense fallback={<LoadingFallback />}><MyOffers /></Suspense>} />
          <Route path="offers/negotiations" element={<Suspense fallback={<LoadingFallback />}><NegotiationPage /></Suspense>} />

          <Route path="products" element={<Suspense fallback={<LoadingFallback />}><MyProducts /></Suspense>} />
          <Route path="products/add" element={<Suspense fallback={<LoadingFallback />}><AddProduct /></Suspense>} />

          <Route path="orders" element={<Suspense fallback={<LoadingFallback />}><MyOrders /></Suspense>} />
          <Route path="orders/track/:id" element={<Suspense fallback={<LoadingFallback />}><TrackOrder /></Suspense>} />

          <Route path="shipments" element={<Suspense fallback={<LoadingFallback />}><PortShipments /></Suspense>} />

          <Route path="notifications" element={<Suspense fallback={<LoadingFallback />}><Notifications /></Suspense>} />

          <Route path="settings/profile" element={<Suspense fallback={<LoadingFallback />}><ProfileSettings /></Suspense>} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
};

export default PortRoutes;

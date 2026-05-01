import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import PortLayout from '../components/layout/PortLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import IncomingRequirements from '../pages/requirements/IncomingRequirements';
import MyOffers from '../pages/offers/MyOffers';
import MyProducts from '../pages/products/MyProducts';
import AddProduct from '../pages/products/AddProduct';
import MyOrders from '../pages/orders/MyOrders';
import TrackOrder from '../pages/orders/TrackOrder';
import Notifications from '../pages/notifications/Notifications';
import ProfileSettings from '../pages/settings/ProfileSettings';
import NegotiationPage from '../pages/offers/NegotiationPage';

const PortRoutes = () => {
  return (
    <Routes>
      <Route element={<PortLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="requirements" element={<IncomingRequirements />} />
        <Route path="requirements/history" element={<div className="p-8 bg-white rounded-xl shadow-sm border border-slate-100">Requirement History Page (Coming Soon)</div>} />
        
        <Route path="offers" element={<MyOffers />} />
        <Route path="offers/negotiations" element={<NegotiationPage />} />
        
        <Route path="products" element={<MyProducts />} />
        <Route path="products/add" element={<AddProduct />} />
        
        <Route path="orders" element={<MyOrders />} />
        <Route path="orders/track" element={<TrackOrder />} />
        
        <Route path="notifications" element={<Notifications />} />
        
        <Route path="settings/profile" element={<ProfileSettings />} />
        <Route path="settings/account" element={<div className="p-8 bg-white rounded-xl shadow-sm border border-slate-100">Account Settings Page (Coming Soon)</div>} />
      </Route>
    </Routes>
  );
};

export default PortRoutes;

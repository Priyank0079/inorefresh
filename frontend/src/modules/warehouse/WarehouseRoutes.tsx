import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import IconLoader from "../../components/loaders/IconLoader";

// Lazy load layout and shared pages
const WarehouseLayout = lazy(() => import("./components/WarehouseLayout"));
const AdminManageSellerList = lazy(() => import("../admin/pages/AdminManageSellerList"));

// Lazy load warehouse pages
const WarehouseDashboard = lazy(() => import("./pages/WarehouseDashboard"));
const WarehouseOrders = lazy(() => import("./pages/WarehouseOrders"));
const WarehouseOrderDetail = lazy(() => import("./pages/WarehouseOrderDetail"));
const WarehouseCategory = lazy(() => import("./pages/WarehouseCategory"));
const WarehouseSubCategory = lazy(() => import("./pages/WarehouseSubCategory"));
const WarehouseAddProduct = lazy(() => import("./pages/WarehouseAddProduct"));
const WarehouseTaxes = lazy(() => import("./pages/WarehouseTaxes"));
const WarehouseProductList = lazy(() => import("./pages/WarehouseProductList"));
const WarehouseStockManagement = lazy(() => import("./pages/WarehouseStockManagement"));
const WarehouseWallet = lazy(() => import("./pages/WarehouseWallet"));
const WarehouseSalesReport = lazy(() => import("./pages/WarehouseSalesReport"));
const WarehouseReturnRequest = lazy(() => import("./pages/WarehouseReturnRequest"));
const WholesalerReturnInbox = lazy(() => import("./pages/WholesalerReturnInbox"));
const WarehouseReturnVerification = lazy(() => import("./pages/WarehouseReturnVerification"));
const WarehouseInwardStockList = lazy(() => import("./pages/WarehouseInwardStockList"));
const WarehouseAddInwardStock = lazy(() => import("./pages/WarehouseAddInwardStock"));
const WarehouseInwardReport = lazy(() => import("./pages/WarehouseInwardReport"));
const WarehouseAccountSettings = lazy(() => import("./pages/WarehouseAccountSettings"));
const WarehouseExploreProducts = lazy(() => import("./pages/WarehouseExploreProducts"));
const WarehousePortShipments = lazy(() => import("./pages/WarehousePortShipments"));

export default function WarehouseRoutes() {
  return (
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
            <Route path="inward-stock/list" element={<WarehouseInwardStockList />} />
            <Route path="inward-stock/add" element={<WarehouseAddInwardStock />} />
            <Route path="inward-stock/edit/:id" element={<WarehouseAddInwardStock />} />
            <Route path="return" element={<WarehouseReturnRequest />} />
            <Route path="return/inbox" element={<WholesalerReturnInbox />} />
            <Route path="return/verify" element={<WarehouseReturnVerification />} />
            <Route path="return-order" element={<WarehouseReturnRequest />} />
            <Route path="wallet" element={<WarehouseWallet />} />
            <Route path="reports/sales" element={<WarehouseSalesReport />} />
            <Route path="reports/inward" element={<WarehouseInwardReport />} />
            <Route path="account-settings" element={<WarehouseAccountSettings />} />
            <Route path="explore" element={<WarehouseExploreProducts />} />
            <Route path="port-shipments" element={<WarehousePortShipments />} />
            <Route path="all" element={<AdminManageSellerList />} />
          </Routes>
        </WarehouseLayout>
      </Suspense>
    </ProtectedRoute>
  );
}

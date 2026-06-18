import api from "./config";

/**
 * Route-based logistics planning API (Phase 2).
 * Backend: /api/v1/routes — accessible to Warehouse + Admin.
 */

export interface UnplannedOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  orderDate: string;
  items?: string[];
  deliveryAddress?: { address?: string; city?: string; state?: string; pincode?: string; landmark?: string };
}

export interface UnplannedGroup {
  area: string;
  count: number;
  orders: UnplannedOrder[];
}

export interface OrderBundle {
  id: string;
  label: string;
  area: string;
  count: number;
  ready: boolean;
  orderIds: string[];
  orders: UnplannedOrder[];
}

export interface RouteVehicle {
  vehicleNumber: string;
  vehicleType?: string;
  isPartner?: boolean;
}

export interface DeliveryRouteSummary {
  _id: string;
  routeName?: string;
  routeNumber: string;
  date: string;
  status: string;
  vehicle: RouteVehicle;
  driver?: { _id: string; name: string; mobile: string } | null;
  totals: { orderCount: number; totalWeight: number; estimatedTimeMins: number };
  distanceKm?: number;
  createdAt: string;
}

export interface CreateRoutePayload {
  routeName: string;
  date?: string;
  vehicle: RouteVehicle;
  driver?: string;
  orderIds: string[];
}

export interface RouteDriver {
  _id: string;
  name: string;
  mobile: string;
  vehicleNumber?: string;
  vehicleType?: string;
  isPartner?: boolean;
}

export const getUnplannedOrders = async (): Promise<{
  total: number;
  bundleSize: number;
  bundles: OrderBundle[];
  groups: UnplannedGroup[];
}> => {
  const res = await api.get("/routes/unplanned-orders");
  return res.data.data;
};

export const getDrivers = async (): Promise<RouteDriver[]> => {
  const res = await api.get("/routes/drivers");
  return res.data.data;
};

export const confirmOrder = async (orderId: string) => {
  const res = await api.post(`/routes/confirm-order/${orderId}`);
  return res.data;
};

export const createRoute = async (payload: CreateRoutePayload) => {
  const res = await api.post("/routes", payload);
  return res.data;
};

export const getRoutes = async (params?: { date?: string; status?: string }): Promise<DeliveryRouteSummary[]> => {
  const res = await api.get("/routes", { params });
  return res.data.data;
};

export const getRouteById = async (id: string) => {
  const res = await api.get(`/routes/${id}`);
  return res.data.data;
};

export const updateRoute = async (id: string, payload: Partial<CreateRoutePayload>) => {
  const res = await api.put(`/routes/${id}`, payload);
  return res.data;
};

export const getLiveTracking = async () => {
  const res = await api.get("/routes/live-tracking");
  return res.data.data;
};

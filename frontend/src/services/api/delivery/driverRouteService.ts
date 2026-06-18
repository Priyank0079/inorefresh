import api from "../config";

/**
 * Driver-side route execution API (Phase 3).
 * Backend: /api/v1/delivery/routes/* and /api/v1/delivery/stops/*
 */

export interface DriverStop {
  _id: string;
  sequence: number;
  status: "Pending" | "Arrived" | "Delivered" | "Partial" | "Failed";
  retailer: {
    name: string;
    address: string;
    contact?: string;
    location?: { type: string; coordinates: [number, number] };
  };
  invoiceAmount?: number;
  order: string;
  confirmation?: { method?: string; otpVerified?: boolean };
  payment?: { method?: string; amountReceived?: number; status?: string };
  orderPayment?: { method?: string; status?: string };
}

export interface DriverRoute {
  _id: string;
  routeNumber: string;
  date: string;
  status: string;
  vehicle: { vehicleNumber: string; vehicleType?: string; isPartner?: boolean };
  totals: { orderCount: number; totalWeight: number; estimatedTimeMins: number };
  stops: DriverStop[];
}

export const getTodayRoute = async (): Promise<DriverRoute | null> => {
  const res = await api.get("/delivery/routes/today");
  return res.data.data;
};

export const acceptRoute = async (id: string) => {
  const res = await api.post(`/delivery/routes/${id}/accept`);
  return res.data;
};

export const sendLoadingOtp = async (id: string) => {
  const res = await api.post(`/delivery/routes/${id}/loading-otp`);
  return res.data;
};

export const verifyLoad = async (id: string, otp: string, assets: Array<{ type: string; qty: number }>) => {
  const res = await api.post(`/delivery/routes/${id}/verify-load`, { otp, assets });
  return res.data;
};

export const startRoute = async (id: string) => {
  const res = await api.post(`/delivery/routes/${id}/start`);
  return res.data;
};

export const arriveAtStop = async (stopId: string, coords?: { latitude?: number; longitude?: number }) => {
  const res = await api.post(`/delivery/stops/${stopId}/arrived`, coords || {});
  return res.data;
};

export const deliverStop = async (stopId: string) => {
  const res = await api.put(`/delivery/stops/${stopId}/deliver`);
  return res.data;
};

export const sendStopOtp = async (stopId: string) => {
  const res = await api.post(`/delivery/stops/${stopId}/send-otp`);
  return res.data;
};

export const confirmStop = async (
  stopId: string,
  payload: { method: "OTP" | "Signature" | "Photo"; otp?: string; proofUrl?: string },
) => {
  const res = await api.post(`/delivery/stops/${stopId}/confirm`, payload);
  return res.data;
};

export const recordPayment = async (
  stopId: string,
  payload: { method: "Cash" | "UPI" | "Bank Transfer"; amount: number; referenceNo?: string; proofUrl?: string },
) => {
  const res = await api.post(`/delivery/stops/${stopId}/payment`, payload);
  return res.data;
};

export const recordReturn = async (
  stopId: string,
  payload: { reason: string; qtyKg?: number; photoUrl: string; action?: string },
) => {
  const res = await api.post(`/delivery/stops/${stopId}/return`, payload);
  return res.data;
};

export const recordAssets = async (
  stopId: string,
  payload: { type: string; qtyCollected: number },
) => {
  const res = await api.post(`/delivery/stops/${stopId}/assets`, payload);
  return res.data;
};

export const getOrderReturns = async (orderId: string) => {
  const res = await api.get(`/returns/workflow/order/${orderId}`);
  return res.data;
};

export const verifyReturnOtp = async (returnId: string, otp: string) => {
  const res = await api.post(`/returns/workflow/rider/verify-otp/${returnId}`, { otp });
  return res.data;
};

export const completeRoute = async (id: string, distanceKm?: number) => {
  const res = await api.post(`/delivery/routes/${id}/complete`, { distanceKm });
  return res.data;
};

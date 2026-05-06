import API from './config';

export interface PortOffer {
  _id: string;
  requirementId: {
    _id: string;
    requirementId: string;
    fishName: string;
  };
  portId: string;
  warehouseId: {
    _id: string;
    warehouseName?: string;
    name?: string;
    storeName?: string;
    address?: string;
    location?: string;
    city: string;
    state: string;
  };
  offeredPrice: number;
  counterPrice?: number;
  quantityOffered: number;
  status: 'pending' | 'countered' | 'negotiating' | 'approved' | 'rejected' | 'withdrawn' | 'In Transit' | 'Delivered' | 'Cancelled';
  deliveryDate: string;
  notes?: string;
  deliveryDetails?: {
    vehicleType: 'Plane' | 'Truck' | 'Ship' | 'Train' | 'Other';
    estimatedArrival: string;
    additionalInfo?: string;
    trackingNumber?: string;
    status: string;
    updatedAt: string;
  };
  updatedAt: string;
}

export const getMyNegotiations = async () => {
  try {
    const response = await API.get('/port/offers/my-negotiations');
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const getPortOrders = async () => {
  try {
    const response = await API.get('/port/offers/my-orders');
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const getOfferById = async (id: string) => {
  try {
    const response = await API.get(`/port/offers/${id}`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const createOffer = async (offerData: any) => {
  try {
    const response = await API.post('/port/offers', offerData);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const acceptCounter = async (offerId: string) => {
  try {
    const response = await API.post(`/port/offers/${offerId}/accept-counter`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const counterOffer = async (offerId: string, counterData: { price: number, notes?: string }) => {
  try {
    const response = await API.post(`/port/offers/${offerId}/counter`, counterData);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const updateDeliveryDetails = async (offerId: string, deliveryData: any) => {
  try {
    const response = await API.patch(`/port/offers/${offerId}/delivery`, deliveryData);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

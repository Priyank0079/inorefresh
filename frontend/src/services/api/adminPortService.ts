import API from './config';

export const adminGetAllPortOffers = async (params: any = {}) => {
  try {
    const response = await API.get('/port/offers/admin/all', { params });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const adminCounterPortOffer = async (offerId: string, counterData: { price: number, notes?: string }) => {
  try {
    const response = await API.post(`/port/offers/admin/${offerId}/counter`, counterData);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const adminConfirmPortOffer = async (offerId: string, notes?: string) => {
  try {
    const response = await API.post(`/port/offers/admin/${offerId}/confirm`, { notes });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

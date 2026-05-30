import API from './config';

export const getDashboardStats = async () => {
  try {
    const response = await API.get('/port/dashboard/stats');
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const getRecentActivities = async () => {
  try {
    const response = await API.get('/port/dashboard/activities');
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const getRecentRequirements = async () => {
  try {
    const response = await API.get('/port/dashboard/recent-requirements');
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const getRecentOffers = async () => {
  try {
    const response = await API.get('/port/dashboard/recent-offers');
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const getCompleteDashboard = async (token?: string) => {
  try {
    const response = await API.get('/port/dashboard/complete');
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

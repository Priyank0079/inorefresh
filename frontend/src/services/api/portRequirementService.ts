import API from './config';

export interface PortRequirement {
  _id: string;
  requirementId: string;
  fishName: string;
  category: string;
  grade: string;
  quantityRequired: number;
  unit: string;
  targetPrice: number;
  deadline: string;
  status: 'Open' | 'Pending' | 'Negotiating' | 'Expired' | 'Completed' | 'Cancelled';
  warehouseId: {
    _id: string;
    name: string;
    location: string;
    city: string;
    state: string;
  };
  createdAt: string;
}

export const getPortRequirements = async (params: any = {}) => {
  try {
    const response = await API.get('/port/requirements', { params });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const updateRequirementStatus = async (id: string, status: string) => {
  try {
    const response = await API.patch(`/port/requirements/${id}/status`, { status });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: error.message };
  }
};

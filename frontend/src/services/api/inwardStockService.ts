import api from './config';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface InwardStock {
  _id: string;
  supplierName: string;
  sourcePort?: string;
  productName: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  invoiceNumber: string;
  batchNumber?: string;
  vehicleNumber?: string;
  status: 'Pending' | 'Received' | 'Cancelled';
  remarks?: string;
  createdAt: string;
}

export interface InwardStockParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const getInwardStocks = async (params?: InwardStockParams): Promise<ApiResponse<InwardStock[]>> => {
  const response = await api.get<ApiResponse<InwardStock[]>>('/warehouse/inward-stock', { params });
  return response.data;
};

export const getInwardStockById = async (id: string): Promise<ApiResponse<InwardStock>> => {
  const response = await api.get<ApiResponse<InwardStock>>(`/warehouse/inward-stock/${id}`);
  return response.data;
};

export const addInwardStock = async (data: Partial<InwardStock>): Promise<ApiResponse<InwardStock>> => {
  const response = await api.post<ApiResponse<InwardStock>>('/warehouse/inward-stock', data);
  return response.data;
};

export const updateInwardStock = async (id: string, data: Partial<InwardStock>): Promise<ApiResponse<InwardStock>> => {
  const response = await api.put<ApiResponse<InwardStock>>(`/warehouse/inward-stock/${id}`, data);
  return response.data;
};

export const updateInwardStockStatus = async (id: string, status: string): Promise<ApiResponse<InwardStock>> => {
  const response = await api.patch<ApiResponse<InwardStock>>(`/warehouse/inward-stock/${id}/status`, { status });
  return response.data;
};

export const deleteInwardStock = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/warehouse/inward-stock/${id}`);
  return response.data;
};

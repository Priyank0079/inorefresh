import api from './config';

export interface WarehouseInwardStockSummary {
  totalQuantity: number;
  totalRecords: number;
  byStatus: {
    received: number;
    pending: number;
    cancelled: number;
  };
}

export interface InwardStockData {
  _id: string;
  warehouse?: {
    _id: string;
    warehouseName: string;
  };
  supplierName: string;
  sourcePort?: string;
  productName: string;
  variant: string;
  quantity: number;
  date: string;
  orderDate?: string;
  deliveryDate?: string;
  invoiceNumber?: string;
  batchNumber?: string;
  vehicleNumber?: string;
  status: 'Pending' | 'Received' | 'Cancelled';
  remarks?: string;
  createdAt: string;
}

export interface WarehouseStockResponse {
  success: boolean;
  message: string;
  data: {
    stocks: InwardStockData[];
    summary: WarehouseInwardStockSummary;
  };
}

export interface AllWarehousesInwardStockResponse {
  success: boolean;
  message: string;
  data: InwardStockData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Get inward stock summary for a specific warehouse
 */
export const getWarehouseInwardStockSummary = async (
  warehouseId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<WarehouseStockResponse> => {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  const response = await api.get<WarehouseStockResponse>(
    `/admin/warehouse/${warehouseId}/inward-stock`,
    { params }
  );
  return response.data;
};

/**
 * Get all inward stock records with pagination
 */
export const getAllWarehousesInwardStock = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AllWarehousesInwardStockResponse> => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  if (status && status !== 'All Status') params.append('status', status);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  const response = await api.get<AllWarehousesInwardStockResponse>(
    `/admin/warehouses/inward-stock/all`,
    { params }
  );
  return response.data;
};

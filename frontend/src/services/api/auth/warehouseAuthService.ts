import api from "../config";

export interface WarehouseAuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      warehouseName: string;
      mobile: string;
      email: string;
      storeName: string;
      status: string;
      logo?: string;
      address: string;
      city?: string;
    };
  };
}

/**
 * Login warehouse with email and password
 */
export const loginWarehouse = async (email: string, password: string): Promise<WarehouseAuthResponse> => {
  const response = await api.post<WarehouseAuthResponse>("/auth/warehouse/login", { email, password });
  return response.data;
};

/**
 * Get warehouse profile
 */
export const getProfile = async (): Promise<WarehouseAuthResponse> => {
  const response = await api.get<WarehouseAuthResponse>("/auth/warehouse/profile");
  return response.data;
};

/**
 * Toggle shop status
 */
export const toggleShopStatus = async (): Promise<{ success: boolean; message: string; data: { isShopOpen: boolean } }> => {
  const response = await api.put("/auth/warehouse/toggle-shop-status");
  return response.data;
};

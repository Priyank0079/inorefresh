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
 * Send OTP to warehouse mobile number
 */
export const sendOTP = async (mobile: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post("/warehouse/auth/send-otp", { mobile });
  return response.data;
};

/**
 * Verify OTP and login warehouse
 */
export const verifyOTP = async (mobile: string, otp: string): Promise<WarehouseAuthResponse> => {
  const response = await api.post<WarehouseAuthResponse>("/warehouse/auth/verify-otp", { mobile, otp });
  return response.data;
};

/**
 * Get warehouse profile
 */
export const getProfile = async (): Promise<WarehouseAuthResponse> => {
  const response = await api.get<WarehouseAuthResponse>("/warehouse/auth/profile");
  return response.data;
};

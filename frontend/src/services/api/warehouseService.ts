import api from "./config";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface Warehouse {
    _id: string;
    warehouseName: string;
    managerName: string;
    mobile: string;
    email: string;
    storeName: string;
    address: string;
    location: {
        type: "Point";
        coordinates: [number, number];
    };
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
    role: "warehouse";
    balance: number;
    serviceRadiusKm?: number;
    isShopOpen?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminCreateWarehouseData {
    warehouseName: string;
    managerName: string;
    mobile: string;
    email: string;
    password?: string;
    address: string;
    latitude: number;
    longitude: number;
}

/**
 * Create a warehouse account (Admin only)
 */
export const createWarehouse = async (
    data: AdminCreateWarehouseData
): Promise<ApiResponse<Warehouse>> => {
    const response = await api.post<ApiResponse<Warehouse>>("/admin/warehouse", data);
    return response.data;
};

/**
 * Get all warehouses
 */
export const getAllWarehouses = async (): Promise<ApiResponse<Warehouse[]>> => {
    const response = await api.get<ApiResponse<Warehouse[]>>("/warehouses");
    return response.data;
};

/**
 * Get warehouse profile (Warehouse module)
 */
export const getWarehouseProfile = async (): Promise<ApiResponse<Warehouse>> => {
    const response = await api.get<ApiResponse<Warehouse>>("/auth/warehouse/profile");
    return response.data;
};

/**
 * Update warehouse profile
 */
export const updateWarehouseProfile = async (data: any): Promise<ApiResponse<Warehouse>> => {
    const response = await api.put<ApiResponse<Warehouse>>("/auth/warehouse/profile", data);
    return response.data;
};

/**
 * Delete warehouse (Admin only)
 */
export const deleteWarehouse = async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.delete<ApiResponse<any>>(`/warehouses/${id}`);
    return response.data;
};

/**
 * Update warehouse details (Admin only)
 */
export const updateWarehouseByAdmin = async (
    id: string,
    data: {
        address?: string;
        latitude?: number | string;
        longitude?: number | string;
        serviceRadiusKm?: number;
    }
): Promise<ApiResponse<Warehouse>> => {
    const response = await api.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    return response.data;
};

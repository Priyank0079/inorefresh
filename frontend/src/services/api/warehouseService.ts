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
    const response = await api.get<ApiResponse<Warehouse[]>>("/admin/warehouses");
    return response.data;
};

/**
 * Get warehouse profile (Warehouse module)
 */
export const getWarehouseProfile = async (): Promise<ApiResponse<Warehouse>> => {
    const response = await api.get<ApiResponse<Warehouse>>("/warehouse/auth/profile");
    return response.data;
};

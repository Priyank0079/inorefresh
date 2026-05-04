import api from "./config";

export interface PortProduct {
  _id?: string;
  productName: string;
  category: 'Premium' | 'Fresh Catch' | 'Frozen' | 'Dried';
  fishType?: string;
  sizeWeightClass?: string;
  qualityGrade: 'Grade A+' | 'Grade A' | 'Grade B';
  availableQuantity: number;
  pricePerKg: number;
  availabilityDate: string;
  description?: string;
  image?: string;
  status?: 'Active' | 'Inactive' | 'Sold Out';
  createdAt?: string;
  updatedAt?: string;
}

export const getMyProducts = async () => {
  const response = await api.get("/port/products");
  return response.data;
};

export const createProduct = async (data: PortProduct) => {
  const response = await api.post("/port/products", data);
  return response.data;
};

export const getProductById = async (id: string) => {
  const response = await api.get(`/port/products/${id}`);
  return response.data;
};

export const updateProduct = async (id: string, data: Partial<PortProduct>) => {
  const response = await api.put(`/port/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await api.delete(`/port/products/${id}`);
  return response.data;
};

import api from './config';
import { Product } from './productService'; // Reuse generic product type if compatible or define new one
import { apiCache } from '../../utils/apiCache';

export interface Category {
    _id: string; // MongoDB ID
    id?: string; // Virtual ID
    name: string;
    parent?: string | null;
    image?: string;
    icon?: string;
    description?: string;
    isActive: boolean;
    children?: Category[];
    subcategories?: Category[];
    headerCategoryId?: string | { _id: string; name?: string };
    totalProducts?: number;
}

export interface GetProductsParams {
    search?: string;
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'price_asc' | 'price_desc' | 'popular' | 'discount';
    page?: number;
    limit?: number;
    latitude?: number; // User location latitude
    longitude?: number; // User location longitude
}

export interface ProductListResponse {
    success: boolean;
    data: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface ProductDetailResponse {
    success: boolean;
    message?: string;
    data: Product & { similarProducts?: Product[] };
}

export interface CategoryListResponse {
    success: boolean;
    data: Category[];
}

const roundCoord = (value?: number): number | undefined => {
    if (value === undefined || value === null || !Number.isFinite(value)) return undefined;
    return Number(value.toFixed(3));
};

const buildProductsCacheKey = (params?: GetProductsParams): string => {
    if (!params) return "customer-products:{}";

    const normalized: Record<string, unknown> = { ...params };

    if (normalized.latitude !== undefined) {
        normalized.latitude = roundCoord(Number(normalized.latitude));
    }
    if (normalized.longitude !== undefined) {
        normalized.longitude = roundCoord(Number(normalized.longitude));
    }

    const orderedEntries = Object.entries(normalized)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .sort(([a], [b]) => a.localeCompare(b));

    return `customer-products:${JSON.stringify(orderedEntries)}`;
};

/**
 * Get products with filters (Public)
 * Location (latitude/longitude) is required to filter products by seller's service radius
 */
export const getProducts = async (params?: GetProductsParams): Promise<ProductListResponse> => {
    const cacheKey = buildProductsCacheKey(params);

    return apiCache.getOrFetch(
        cacheKey,
        async () => {
            const response = await api.get<ProductListResponse>('/customer/products', { params });
            return response.data;
        },
        2 * 60 * 1000 // 2 minutes for list pages
    );
};

/**
 * Get product details by ID (Public)
 * Location (latitude/longitude) is required to verify product availability
 */
export const getProductById = async (id: string, latitude?: number, longitude?: number): Promise<ProductDetailResponse> => {
    const params: any = {};
    if (latitude !== undefined && longitude !== undefined) {
        params.latitude = roundCoord(latitude);
        params.longitude = roundCoord(longitude);
    }

    const cacheKey = `customer-product-detail:${id}:${params.latitude ?? "na"}:${params.longitude ?? "na"}`;

    return apiCache.getOrFetch(
        cacheKey,
        async () => {
            const response = await api.get<ProductDetailResponse>(`/customer/products/${id}`, { params });
            return response.data;
        },
        3 * 60 * 1000 // 3 minutes for detail pages
    );
};

/**
 * Get category details by ID or slug (Public)
 */
export const getCategoryById = async (id: string): Promise<any> => {
    const response = await api.get<any>(`/customer/categories/${id}`);
    return response.data;
};

/**
 * Get all categories (Public)
 * Using /tree endpoint to get hierarchy if available, otherwise just /
 * Cached for 10 minutes as categories don't change frequently
 */
export const getCategories = async (tree: boolean = false): Promise<CategoryListResponse> => {
    const cacheKey = `customer-categories-${tree ? 'tree' : 'list'}`;
    return apiCache.getOrFetch(
        cacheKey,
        async () => {
    const url = tree ? '/customer/categories/tree' : '/customer/categories';
    const response = await api.get<CategoryListResponse>(url);
    return response.data;
        },
        10 * 60 * 1000 // 10 minutes cache
    );
};

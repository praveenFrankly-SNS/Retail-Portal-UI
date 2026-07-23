// ============================================================
// Retail AI Portal — Product API
// Connecting catalog search, categories, and detail lookups.
// ============================================================

import apiClient, { isLiveMode } from './client';
import type { Product, ProductDetail, Category } from '../types/product';
import { MOCK_PRODUCTS, MOCK_PRODUCT_DETAIL, MOCK_CATEGORIES } from '../mocks/products';

export interface CatalogResponse {
  products: Product[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function getProducts(params: {
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  sort?: string;
  page?: number;
  page_size?: number;
  dataset?: string;
}): Promise<CatalogResponse> {
  if (isLiveMode()) {
    try {
      const { data } = await apiClient.get<CatalogResponse>('/api/v1/products', { params });
      return data;
    } catch (err) {
      console.warn("Catalog fetch failed, falling back to mock:", err);
    }
  }

  // Fallback to mocks
  return {
    products: MOCK_PRODUCTS,
    total_count: MOCK_PRODUCTS.length,
    page: params.page || 1,
    page_size: params.page_size || 20,
    total_pages: 1
  };
}

export async function getProductDetail(productId: string, dataset: string = "wands"): Promise<ProductDetail> {
  if (isLiveMode()) {
    try {
      const { data } = await apiClient.get<ProductDetail>(`/api/v1/products/${productId}`, {
        params: { dataset }
      });
      return data;
    } catch (err) {
      console.warn(`Product detail lookup failed for ${productId}, falling back to mock:`, err);
    }
  }
  return { ...MOCK_PRODUCT_DETAIL, product_id: productId };
}

export async function getCategories(dataset: string = "wands"): Promise<Category[]> {
  if (isLiveMode()) {
    try {
      const { data } = await apiClient.get<{ categories: { name: string; count: number }[] }>('/api/v1/products/categories', {
        params: { dataset }
      });
      return data.categories.map((c, i) => ({
        id: `cat-${i}`,
        name: c.name,
        product_count: c.count,
        icon: '📦'
      }));
    } catch (err) {
      console.warn("Categories fetch failed, falling back to mock:", err);
    }
  }
  return MOCK_CATEGORIES;
}

export async function getTrendingProducts(limit: number = 8, dataset: string = "wands"): Promise<Product[]> {
  if (isLiveMode()) {
    try {
      const { data } = await apiClient.get<{ products: Product[] }>('/api/v1/products/trending', {
        params: { limit, dataset }
      });
      return data.products;
    } catch (err) {
      console.warn("Trending fetch failed, falling back to mock:", err);
    }
  }
  return MOCK_PRODUCTS.slice(0, limit);
}

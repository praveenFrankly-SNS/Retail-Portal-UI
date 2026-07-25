import apiClient from './client';

export interface SearchFilters {
  category?: string
  brand?: string
  min_price?: number
  max_price?: number
  min_rating?: number
  in_stock?: boolean
}

export interface SearchParams {
  query: string
  page?: number
  page_size?: number
  filters?: SearchFilters
  dataset?: string
  use_cache?: boolean
}

export interface Product {
  product_id: string
  product_name: string | null
  description: string | null
  brand: string | null
  category: string | null
  price: number | null
  list_price?: number | null
  discount_percentage?: string | null
  currency: string
  attributes: Record<string, any> | null
  avg_rating: number | null
  review_count: number
  similarity_score: number | null
  image_url: string | null
  product_link?: string | null
  review_title?: string | null
  review_content?: string | null
  attribute_summary?: string | null
  review_summary?: string | null
  related_products?: RelatedProduct[]
}

export interface RelatedProduct {
  product_id: string
  product_name: string | null
  category: string | null
  brand: string | null
  price: number | null
  avg_rating: number | null
  review_count: number
  similarity_score: number | null
  image_url?: string | null
}

export interface SearchMetadata {
  vector_search_time_ms: number
  product_fetch_time_ms: number
  processing_time_ms: number
  cached: boolean
  filters_applied: SearchFilters
  rewritten_query?: string | null
  intent_tokens?: string[]
  model_name?: string | null
}

export interface SearchResponse {
  query: string
  total_results: number
  page: number
  page_size: number
  total_pages: number
  results: Product[]
  metadata: SearchMetadata
}

export interface SuggestionsResponse {
  partial_query: string
  completions: string[]
  categories: string[]
  related_suggestions: string[]
}

export interface CategoryResult {
  name: string
  count: number
}

export interface BrandResult {
  name: string
  count: number
}

export interface HealthStatus {
  status: string
  version: string
  environment: string
  services: Record<string, string>
}

export interface CacheStats {
  enabled: boolean
  connected_clients?: number
  used_memory?: string
  total_keys?: number
  hits?: number
  misses?: number
  hit_rate?: number
}

export interface TopQuery {
  query: string
  count: number
  avg_results: number
  avg_latency_ms: number
}

export interface SearchStats {
  cache: CacheStats
  top_queries: TopQuery[]
  analytics_period: string
}

function getDataset(): string {
  return localStorage.getItem('dataset_variant') || 'amazon'
}

export const searchApi = {
  search: async (params: SearchParams): Promise<SearchResponse> => {
    const dataset = params.dataset || getDataset()
    const { data } = await apiClient.post<SearchResponse>('/api/v1/search/', { ...params, dataset })
    return data
  },

  getSuggestions: async (query: string, limit = 5): Promise<SuggestionsResponse> => {
    const { data } = await apiClient.get<SuggestionsResponse>(
      '/api/v1/search/suggestions',
      { params: { q: query, limit } }
    )
    return data
  },

  getProduct: async (productId: string, dataset?: string): Promise<Product> => {
    const activeDataset = dataset || getDataset()
    const { data } = await apiClient.get<Product>(`/api/v1/products/${productId}`, {
      params: { dataset: activeDataset }
    })
    return data
  },

  getCategories: async (dataset?: string): Promise<CategoryResult[]> => {
    const activeDataset = dataset || getDataset()
    const { data } = await apiClient.get<{ categories: CategoryResult[] }>('/api/v1/products/categories', {
      params: { dataset: activeDataset }
    })
    return data.categories
  },

  getBrands: async (category?: string, dataset?: string): Promise<BrandResult[]> => {
    const activeDataset = dataset || getDataset()
    const { data } = await apiClient.get<{ brands: BrandResult[] }>('/api/v1/products/brands', {
      params: { ...(category ? { category } : {}), dataset: activeDataset },
    })
    return data.brands
  },

  healthCheck: async (): Promise<HealthStatus> => {
    const { data } = await apiClient.get<HealthStatus>('/api/v1/health/')
    return data
  },

  detailedHealthCheck: async (): Promise<HealthStatus> => {
    const { data } = await apiClient.get<HealthStatus>('/api/v1/health/detailed')
    return data
  },

  getStats: async (): Promise<SearchStats> => {
    const { data } = await apiClient.get<SearchStats>('/api/v1/health/stats')
    return data
  },
}

export default searchApi

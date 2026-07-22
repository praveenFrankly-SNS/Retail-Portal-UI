// ============================================================
// Retail AI Portal — Search Types
// ============================================================

export interface SearchRequest {
  query: string;
  dataset?: string;
  filters?: SearchFilters;
  page?: number;
  page_size?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'popularity';
}

export interface SearchFilters {
  categories?: string[];
  brands?: string[];
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  in_stock_only?: boolean;
  features?: string[];
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  search_insights: SearchInsights;
  facets: SearchFacets;
}

export interface SearchResult {
  product_id: string;
  product_name: string;
  category_path: string;
  brand: string;
  price: number;
  discounted_price?: number;
  discount_percent?: number;
  image_url?: string;
  rating: number;
  rating_count: number;
  availability_status: string;
  similarity_score: number;
  badge?: 'BEST_MATCH' | 'GREAT_VALUE' | null;
  description?: string;
}

export interface SearchInsights {
  total_results: number;
  semantic_match_percent: number;
  search_time_ms: number;
  query_complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SearchFacets {
  categories: FacetValue[];
  brands: FacetValue[];
  price_ranges: PriceRange[];
  ratings: FacetValue[];
  features: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  selected?: boolean;
}

export interface PriceRange {
  label: string;
  min: number;
  max: number;
  count: number;
}

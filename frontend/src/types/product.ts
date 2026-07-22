// ============================================================
// Retail AI Portal — Product Types
// ============================================================

export interface Product {
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
  availability_status: 'IN_STOCK' | 'LIMITED' | 'PRE_ORDER' | 'BACK_ORDER' | 'OUT_OF_STOCK';
  description?: string;
  features?: string[];
  specifications?: Record<string, string>;
  recommendation_tags?: string;
  primary_use_case?: string;
  price_tier?: string;
  badge?: 'BEST_MATCH' | 'GREAT_VALUE' | 'BEST_SELLER' | 'NEW' | 'POPULAR' | null;
}

export interface ProductDetail extends Product {
  images: string[];
  about?: string;
  color_options?: string[];
  key_features?: string[];
  reviews_summary?: ReviewSummary;
  delivery_info?: string;
}

export interface ReviewSummary {
  average_rating: number;
  total_count: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  highlights?: string[];
  recent_reviews?: Review[];
}

export interface Review {
  reviewer: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  helpful_count?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  product_count: number;
  parent?: string;
}

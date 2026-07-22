// ============================================================
// Retail AI Portal — Recommendation Types
// ============================================================

export type RecommendationSurface = 'HOME' | 'PRODUCT_PAGE' | 'CART' | 'EMPTY_SEARCH';
export type RelationshipType = 'SIMILAR' | 'COMPLEMENTARY' | 'ACCESSORY' | 'ALTERNATIVE';

export interface RecommendedProduct {
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
  relationship: RelationshipType;
  concept: string;
  final_score: number;
  reason: string;
  badge?: 'BEST_MATCH' | 'GREAT_PICK' | 'POPULAR' | 'NEW' | null;
}

export interface RecommendationResponse {
  recommendation_id: string;
  customer_id: string;
  surface: RecommendationSurface;
  recommendations: RecommendedProduct[];
  generated_at: string;
  context_used: CustomerContextSnapshot;
}

export interface CustomerContextSnapshot {
  recent_searches: string[];
  recent_views: string[];
  cart: string[];
  interests: string[];
}

export interface RecommendationDetail {
  product: RecommendedProduct;
  why_recommended: WhyRecommended;
}

export interface WhyRecommended {
  context_signals: string[];
  relationship_type: RelationshipType;
  concept: string;
  reason: string;
  scores: {
    overall: number;
    context_match: number;
    category_fit: number;
    behavior_signal: number;
    quality: number;
  };
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_percent: number;
}

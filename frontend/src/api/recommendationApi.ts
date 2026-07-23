// ============================================================
// Retail AI Portal — Recommendation API
// Stage 2: Unified REST calls proxying to FastAPI backend.
// ============================================================

import apiClient, { isLiveMode } from './client';
import type { RecommendationResponse } from '../types/recommendation';
import { MOCK_HOME_RECOMMENDATION_RESPONSE } from '../mocks/recommendations';

export interface SessionContext {
  recent_searches: string[];
  recent_views: string[];
  cart_product_ids: string[];
}

export async function getRecommendations(
  customerId: string,
  surface: 'HOME' | 'PRODUCT_PAGE' | 'CART' | 'EMPTY_SEARCH',
  currentProductId?: string | null,
  limit: number = 8,
  sessionContext?: SessionContext
): Promise<RecommendationResponse> {
  if (isLiveMode()) {
    try {
      const { data } = await apiClient.post<RecommendationResponse>('/api/v1/recommendations', {
        customer_id: customerId,
        surface,
        current_product_id: currentProductId || null,
        limit,
        session_context: sessionContext || {
          recent_searches: [],
          recent_views: [],
          cart_product_ids: []
        }
      });
      return data;
    } catch (err) {
      console.error("Recommendation API call failed:", err);
      throw err;
    }
  }

  // Fallback to Mock Data (Stage 1)
  const mockResponse = { ...MOCK_HOME_RECOMMENDATION_RESPONSE };
  mockResponse.customer_id = customerId;
  mockResponse.surface = surface as any;
  
  if (surface === 'PRODUCT_PAGE' && currentProductId) {
    mockResponse.recommendations = mockResponse.recommendations.map(r => ({
      ...r,
      relationship: (r.relationship === 'COMPLEMENTARY' ? 'COMPLEMENTARY' : 'SIMILAR') as any
    })).filter(r => r.product_id !== currentProductId);
  }
  
  return mockResponse;
}

// Retain compatibility wrappers for existing Stage 1 page calls
export async function getHomeRecommendations(
  customerId: string,
  sessionContext?: SessionContext
): Promise<RecommendationResponse> {
  return getRecommendations(customerId, 'HOME', null, 8, sessionContext);
}

export async function getProductPageRecommendations(
  productId: string,
  customerId: string,
  sessionContext?: SessionContext
): Promise<RecommendationResponse> {
  return getRecommendations(customerId, 'PRODUCT_PAGE', productId, 8, sessionContext);
}

export async function getCartRecommendations(
  customerId: string,
  cartProductIds: string[],
  sessionContext?: SessionContext
): Promise<RecommendationResponse> {
  return getRecommendations(customerId, 'CART', null, 8, {
    recent_searches: sessionContext?.recent_searches || [],
    recent_views: sessionContext?.recent_views || [],
    cart_product_ids: cartProductIds
  });
}

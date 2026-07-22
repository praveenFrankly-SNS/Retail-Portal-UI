// ============================================================
// Retail AI Portal — Customer & Cart Types
// ============================================================

export interface Customer {
  customer_id: string;
  customer_name: string;
  email?: string;
  city?: string;
  region?: string;
  avatar_url?: string;
  persona_label?: string; // e.g. "Tech Enthusiast", "Home Office Pro"
  interests?: string[];
  segment?: string;
}

export interface CustomerProfile extends Customer {
  interests: string[];
  recent_searches: string[];
  recently_viewed: string[]; // product_ids
  cart_product_ids: string[];
  preferred_category?: string;
  total_orders?: number;
  last_activity_date?: string;
}

export interface CustomerAIContext {
  top_interests: string[];
  preferred_brands: string[];
  price_preference: string;
  shopping_behavior: string;
  engagement_score: number; // 0-100
  last_refreshed: string;
}

// ── Cart ──────────────────────────────────────────────────

export interface CartItem {
  product_id: string;
  product_name: string;
  brand: string;
  price: number;
  discounted_price?: number;
  image_url?: string;
  quantity: number;
  availability_status: string;
  color?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total_savings: number;
  delivery_threshold: number; // e.g. 3000 — free delivery above this
  delivery_cost: number;
  estimated_tax: number;
  total: number;
}

export type CartEvent =
  | { type: 'ADD_TO_CART'; product_id: string; product_name: string }
  | { type: 'REMOVE_FROM_CART'; product_id: string }
  | { type: 'UPDATE_QUANTITY'; product_id: string; quantity: number };

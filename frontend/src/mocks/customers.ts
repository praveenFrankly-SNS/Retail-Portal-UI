// ============================================================
// Retail AI Portal — Mock Customers
// Matches CustomerProfile / CustomerAIContext types
// ============================================================

import type { Customer, CustomerProfile, CustomerAIContext } from '../types/customer';

export const MOCK_DEMO_CUSTOMERS: Customer[] = [
  {
    customer_id: 'CUST-FRANK-001',
    customer_name: 'Frank',
    persona_label: 'Tech Enthusiast',
    city: 'Bengaluru',
    avatar_url: '',
  },
];

export const MOCK_ACTIVE_CUSTOMER: CustomerProfile = {
  customer_id: 'CUST-FRANK-001',
  customer_name: 'Frank',
  persona_label: 'Tech Enthusiast',
  city: 'Bengaluru',
  region: 'Karnataka, India',
  interests: ['Computers & Laptops', 'Audio', 'Office Accessories', 'Smart Devices'],
  recent_searches: [
    'wireless keyboard',
    'laptop accessories',
    'USB-C hub',
    'noise cancelling headphones',
    '4K monitor',
  ],
  recently_viewed: ['MOCK-008', 'MOCK-002', 'MOCK-005'],
  cart_product_ids: ['MOCK-001'],
  preferred_category: 'Computers & Laptops',
  total_orders: 8,
  last_activity_date: new Date().toISOString(),
};

export const MOCK_AI_CONTEXT: CustomerAIContext = {
  top_interests: ['Wireless Accessories', 'Premium Audio', 'Office Productivity', 'Laptops'],
  preferred_brands: ['Logitech', 'Sony', 'Apple', 'Dell'],
  price_preference: 'Mid to Premium Range (₹5,000 – ₹50,000)',
  shopping_behavior: 'Researches before buying, compares options, buys during offers',
  engagement_score: 82,
  last_refreshed: new Date().toISOString(),
};

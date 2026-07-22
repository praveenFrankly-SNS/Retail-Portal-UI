// ============================================================
// Retail AI Portal — Mock Products
// These fixtures match the real ProductDetail / Product types.
// All image_url fields reference real Unsplash product images.
// ============================================================

import type { Product, ProductDetail, Category } from '../types/product';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'computers-laptops', name: 'Computers & Laptops', product_count: 245, icon: '💻' },
  { id: 'audio', name: 'Audio', product_count: 198, icon: '🎧' },
  { id: 'smart-devices', name: 'Smart Devices', product_count: 156, icon: '📱' },
  { id: 'office-furniture', name: 'Office Furniture', product_count: 132, icon: '🪑' },
  { id: 'monitors', name: 'Monitors', product_count: 112, icon: '🖥️' },
  { id: 'accessories', name: 'Accessories', product_count: 286, icon: '🔌' },
  { id: 'storage', name: 'Storage', product_count: 89, icon: '💾' },
  { id: 'networking', name: 'Networking', product_count: 67, icon: '📡' },
  { id: 'home-kitchen', name: 'Home & Kitchen', product_count: 198, icon: '🏠' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    product_id: 'MOCK-001',
    product_name: 'Logitech MX Keys Wireless Keyboard',
    category_path: 'Computers & Laptops > Keyboards',
    brand: 'Logitech',
    price: 9999,
    discounted_price: 7699,
    discount_percent: 23,
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
    rating: 4.6,
    rating_count: 1200,
    availability_status: 'IN_STOCK',
    badge: 'BEST_MATCH',
    recommendation_tags: 'wireless,productivity,keyboard',
    primary_use_case: 'Office & Productivity',
    price_tier: 'MID_RANGE',
  },
  {
    product_id: 'MOCK-002',
    product_name: 'Sony WH-1000XM5 Wireless Headphones',
    category_path: 'Audio > Headphones',
    brand: 'Sony',
    price: 29990,
    discounted_price: 24990,
    discount_percent: 17,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    rating: 4.7,
    rating_count: 2345,
    availability_status: 'IN_STOCK',
    badge: 'BEST_SELLER',
    recommendation_tags: 'noise-cancelling,wireless,premium',
    primary_use_case: 'Music & Audio',
    price_tier: 'PREMIUM',
  },
  {
    product_id: 'MOCK-003',
    product_name: 'Ugreen USB-C Hub 6-in-1 Adapter',
    category_path: 'Accessories > Hubs & Adapters',
    brand: 'Ugreen',
    price: 4999,
    discounted_price: 3999,
    discount_percent: 20,
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    rating: 4.5,
    rating_count: 980,
    availability_status: 'IN_STOCK',
    recommendation_tags: 'usb-c,hub,laptop-accessory',
    primary_use_case: 'Connectivity',
    price_tier: 'BUDGET',
  },
  {
    product_id: 'MOCK-004',
    product_name: 'ErgoTune Mesh Office Chair',
    category_path: 'Office Furniture > Chairs',
    brand: 'ErgoTune',
    price: 24999,
    discounted_price: 19999,
    discount_percent: 20,
    image_url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop',
    rating: 4.6,
    rating_count: 560,
    availability_status: 'IN_STOCK',
    recommendation_tags: 'ergonomic,office,chair',
    primary_use_case: 'Office & Productivity',
    price_tier: 'PREMIUM',
  },
  {
    product_id: 'MOCK-005',
    product_name: 'BenQ 27" 4K Monitor IPS',
    category_path: 'Monitors > 4K',
    brand: 'BenQ',
    price: 39999,
    discounted_price: 32999,
    discount_percent: 18,
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop',
    rating: 4.6,
    rating_count: 1100,
    availability_status: 'IN_STOCK',
    badge: 'POPULAR',
    recommendation_tags: '4k,monitor,hdr',
    primary_use_case: 'Creative & Work',
    price_tier: 'PREMIUM',
  },
  {
    product_id: 'MOCK-006',
    product_name: 'Adjustable Aluminium Laptop Stand',
    category_path: 'Accessories > Laptop Stands',
    brand: 'Twelve South',
    price: 3999,
    discounted_price: 2999,
    discount_percent: 25,
    image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop',
    rating: 4.4,
    rating_count: 750,
    availability_status: 'IN_STOCK',
    recommendation_tags: 'laptop-stand,aluminium,portable',
    primary_use_case: 'Office & Productivity',
    price_tier: 'BUDGET',
  },
  {
    product_id: 'MOCK-007',
    product_name: 'Apple AirPods Pro 2nd Gen',
    category_path: 'Audio > Earbuds',
    brand: 'Apple',
    price: 24900,
    discounted_price: 22499,
    discount_percent: 10,
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop',
    rating: 4.8,
    rating_count: 2900,
    availability_status: 'IN_STOCK',
    recommendation_tags: 'apple,airpods,noise-cancelling',
    primary_use_case: 'Music & Audio',
    price_tier: 'PREMIUM',
  },
  {
    product_id: 'MOCK-008',
    product_name: 'Logitech MX Master 3S Mouse',
    category_path: 'Accessories > Mice',
    brand: 'Logitech',
    price: 8999,
    discounted_price: 7499,
    discount_percent: 17,
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop',
    rating: 4.7,
    rating_count: 2200,
    availability_status: 'IN_STOCK',
    recommendation_tags: 'wireless,mouse,ergonomic',
    primary_use_case: 'Office & Productivity',
    price_tier: 'MID_RANGE',
  },
];

export const MOCK_TRENDING_PRODUCTS: Product[] = [
  MOCK_PRODUCTS[1], // Sony WH-1000XM5
  MOCK_PRODUCTS[6], // AirPods Pro
  MOCK_PRODUCTS[4], // BenQ 4K Monitor
  MOCK_PRODUCTS[7], // MX Master 3S
  MOCK_PRODUCTS[0], // MX Keys
  MOCK_PRODUCTS[3], // ErgoTune Chair
];

export const MOCK_RECENTLY_VIEWED: Product[] = [
  MOCK_PRODUCTS[7], // MX Master
  MOCK_PRODUCTS[2], // USB-C Hub
  MOCK_PRODUCTS[3], // ErgoTune Chair
  MOCK_PRODUCTS[5], // Laptop Stand
  MOCK_PRODUCTS[4], // 4K Monitor
];

export const MOCK_PRODUCT_DETAIL: ProductDetail = {
  ...MOCK_PRODUCTS[1],
  images: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop',
  ],
  about: 'The Sony WH-1000XM5 delivers industry-leading noise cancellation with Dual Noise Sensor technology, exceptional sound quality and all-day comfort.',
  color_options: ['Black', 'Platinum Silver'],
  key_features: [
    '30-hour battery life with quick charging',
    'Industry-leading noise cancellation',
    'Crystal-clear hands-free calling',
    'Multipoint connection — connect 2 devices simultaneously',
    'Lightweight, comfortable design for all-day wear',
  ],
  specifications: {
    'Driver Unit': '30mm dome type',
    'Frequency Response': '4 Hz – 40,000 Hz',
    'Battery Life': '30 hours (NC ON)',
    'Charging Time': '3.5 hours',
    'Bluetooth Version': '5.2',
    'Weight': '250g',
    'Warranty': '1 Year',
  },
  reviews_summary: {
    average_rating: 4.7,
    total_count: 2345,
    breakdown: { 5: 1692, 4: 469, 3: 141, 2: 23, 1: 20 },
    highlights: ['Excellent noise cancellation', 'Great sound quality', 'Very comfortable', 'Long battery life'],
    recent_reviews: [
      {
        reviewer: 'Arjun M.',
        rating: 5,
        title: 'Best noise cancelling headphones!',
        body: 'The noise cancellation is simply incredible. Perfect for my office calls and travel. Battery lasts all day!',
        date: '2024-05-10',
        verified: true,
        helpful_count: 124,
      },
      {
        reviewer: 'Priya S.',
        rating: 5,
        title: 'Amazing sound and comfort',
        body: 'Super comfortable for long hours. Sound quality is top-notch. Highly recommended!',
        date: '2024-05-07',
        verified: true,
        helpful_count: 98,
      },
    ],
  },
  delivery_info: 'Free delivery. Delivered by tomorrow.',
};

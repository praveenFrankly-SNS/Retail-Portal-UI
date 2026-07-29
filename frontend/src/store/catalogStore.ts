// ============================================================
// Retail AI Portal — Catalog Cache Store (Zustand)
// Stores catalog page results in memory so navigating
// page1→page2→page1 does NOT re-fetch from the server.
// Cache entries expire after 5 minutes (TTL-based).
// ============================================================

import { create } from 'zustand';
import type { Product, Category } from '../types/product';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CatalogPage {
  products: Product[];
  totalCount: number;
  totalPages: number;
  fetchedAt: number; // epoch ms
}

interface CatalogState {
  // Results keyed by a cache key string built from filters + page
  pageCache: Record<string, CatalogPage>;
  // Categories are global — fetched once per session
  categories: Category[];
  categoriesFetchedAt: number;

  // Actions
  getCachedPage: (key: string) => CatalogPage | null;
  setCachedPage: (key: string, page: CatalogPage) => void;
  getCachedCategories: () => Category[] | null;
  setCachedCategories: (cats: Category[]) => void;
  clearCache: () => void;
}

export function buildCacheKey(params: {
  category?: string;
  brand?: string;
  max_price?: number;
  min_rating?: number;
  sort?: string;
  page?: number;
  page_size?: number;
}): string {
  return [
    params.category || 'All',
    params.brand || '',
    params.max_price ?? 100000,
    params.min_rating ?? 0,
    params.sort || 'Popularity',
    params.page ?? 1,
    params.page_size ?? 12,
  ].join('|');
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  pageCache: {},
  categories: [],
  categoriesFetchedAt: 0,

  getCachedPage: (key: string) => {
    const entry = get().pageCache[key];
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
      // Expired — remove it
      set((s) => {
        const next = { ...s.pageCache };
        delete next[key];
        return { pageCache: next };
      });
      return null;
    }
    return entry;
  },

  setCachedPage: (key: string, page: CatalogPage) => {
    set((s) => ({
      pageCache: { ...s.pageCache, [key]: page },
    }));
  },

  getCachedCategories: () => {
    const { categories, categoriesFetchedAt } = get();
    if (!categories.length) return null;
    if (Date.now() - categoriesFetchedAt > CACHE_TTL_MS) return null;
    return categories;
  },

  setCachedCategories: (cats: Category[]) => {
    set({ categories: cats, categoriesFetchedAt: Date.now() });
  },

  clearCache: () => {
    set({ pageCache: {}, categories: [], categoriesFetchedAt: 0 });
  },
}));

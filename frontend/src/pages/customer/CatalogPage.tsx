// ============================================================
// CatalogPage — WF-05
// Connects live catalog querying, categories, brands, price filters,
// and paginated product grid loading from the Databricks SQL Warehouse.
// Wraps in the complete unified MainLayout.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Grid3X3, List, Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { ProductCard } from '../../components/product/ProductCard';
import { getProducts, getCategories } from '../../api/productApi';
import type { Product, Category } from '../../types/product';

const SORT_OPTIONS = ['Popularity', 'Price: Low to High', 'Price: High to Low', 'Rating'];

export function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialCategory = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('Popularity');
  const [priceLimit, setPriceLimit] = useState(100000);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [minRating, setMinRating] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Load categories
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(err => console.warn(err));
  }, []);

  // Load products list based on filters/pagination
  useEffect(() => {
    setLoading(true);
    getProducts({
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      brand: selectedBrand || undefined,
      max_price: priceLimit,
      min_rating: minRating || undefined,
      sort: sortBy,
      page: currentPage,
      page_size: 12,
    })
      .then((res) => {
        setProducts(res.products);
        setTotalCount(res.total_count);
        setTotalPages(res.total_pages);
      })
      .catch((err) => console.warn(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedBrand, priceLimit, minRating, sortBy, currentPage]);

  const brandsList = ['Twelve South', 'Logitech', 'Sony', 'Ugreen', 'Apple', 'BenQ', 'ErgoTune'];

  return (
    <MainLayout showRightSidebar={false}>
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Browse and discover products from all categories ({totalCount} items)
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="catalog-search-input"
              placeholder="Search within catalog..."
              className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none w-full"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
            className="text-sm border border-slate-200 rounded-xl bg-white px-3 py-2 focus:outline-none font-semibold text-slate-600"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <button id="compare-btn" className="btn-secondary hidden sm:inline-flex">Compare (0)</button>
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-white">
            <button
              id="grid-view-btn"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-slate-400'}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              id="list-view-btn"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-slate-400'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => { setSelectedCategory('All'); setCurrentPage(1); }}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all
            ${selectedCategory === 'All'
              ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`cat-tab-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => { setSelectedCategory(cat.name); setCurrentPage(1); }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all
              ${selectedCategory === cat.name
                ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left Filters ─────────────────────────────── */}
        <aside className="w-full lg:w-60 shrink-0 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-slate-500" />
                <span className="text-sm font-black text-slate-900">Filters</span>
              </div>
              <button
                onClick={() => { setSelectedBrand(''); setMinRating(0); setPriceLimit(100000); setCurrentPage(1); }}
                className="text-xs font-bold text-primary-600 hover:text-primary-700"
              >
                Clear all
              </button>
            </div>

            {/* Brands Filter */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Brand</h4>
              <div className="space-y-1.5">
                {brandsList.map((brand) => (
                  <label key={brand} className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBrand === brand}
                      onChange={() => { setSelectedBrand(selectedBrand === brand ? '' : brand); setCurrentPage(1); }}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Price</h4>
                <span className="text-xs font-bold text-slate-800">₹{priceLimit.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={priceLimit}
                onChange={(e) => { setPriceLimit(parseInt(e.target.value)); setCurrentPage(1); }}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>

            {/* Rating Filter */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Min Rating</h4>
              <div className="space-y-1.5">
                {[4.5, 4.0, 3.5].map((val) => (
                  <label key={val} className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={minRating === val}
                      onChange={() => { setMinRating(minRating === val ? 0 : val); setCurrentPage(1); }}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{val} ★ & Up</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Catalog Grid ─────────────────────────── */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-white border border-slate-100 animate-pulse p-4 flex flex-col justify-between">
                  <div className="w-full h-36 bg-slate-50 rounded-xl" />
                  <div className="space-y-2 mt-4">
                    <div className="w-2/3 h-4 bg-slate-100 rounded" />
                    <div className="w-1/2 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-6">
              <span className="text-4xl">🔍</span>
              <h3 className="text-lg font-bold text-slate-800 mt-4 mb-1">No matches found</h3>
              <p className="text-sm text-slate-500 mb-6">Try refining your selected brand or range sliders.</p>
              <button
                onClick={() => { setSelectedBrand(''); setMinRating(0); setPriceLimit(100000); setSelectedCategory('All'); }}
                className="btn-primary"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.product_id} onClick={() => navigate(`/products/${product.product_id}`, { state: { product } })} className="cursor-pointer">
                  <ProductCard product={product} variant="grid" />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-400 font-bold">Showing page {currentPage} of {totalPages}</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-100'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

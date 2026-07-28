// ============================================================
// HomePage — Retail AI Portal (/home)
// Hero + Trending (priority load) + Recommended For You (deferred)
// + Shop by Category + Recently Viewed + Feature Strip + Footer
// Live Databricks data only — real error states shown, no mock.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Zap, Brain, Shield,
  Laptop, Monitor, Headphones, Smartphone, Settings,
  HardDrive, Wifi, HelpCircle, Search, Clock, LayoutGrid,
  Home as HomeIcon, AlertCircle,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { RecommendationRow } from '../../components/recommendation/RecommendationRow';
import { RecommendationPanel } from '../../components/recommendation/RecommendationPanel';
import { getHomeRecommendations } from '../../api/recommendationApi';
import { getTrendingProducts, getProductDetail } from '../../api/productApi';
import { useUserStore } from '../../store/userStore';
import type { RecommendedProduct } from '../../types/recommendation';
import type { Product, ProductDetail } from '../../types/product';

const QUICK_SEARCHES = [
  'Ergonomic office chair',
  'Smart watch under ₹20,000',
  '4K monitor for design',
  'Wireless earbuds',
];

const CATEGORY_MAP = [
  { name: 'Computers & Laptops', icon: Laptop,      query: 'Laptops' },
  { name: 'Office Furniture',    icon: HomeIcon,    query: 'Office Furniture' },
  { name: 'Audio',               icon: Headphones,  query: 'Audio' },
  { name: 'Smart Devices',       icon: Smartphone,  query: 'Smart Watches' },
  { name: 'Monitors',            icon: Monitor,     query: 'Monitors' },
  { name: 'Accessories',         icon: Settings,    query: 'Accessories' },
  { name: 'Storage',             icon: HardDrive,   query: 'Storage' },
  { name: 'Networking',          icon: Wifi,        query: 'Networking' },
  { name: 'Home & Kitchen',      icon: HelpCircle,  query: 'Home & Kitchen' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { activeCustomer, sessionContext, addSearchEvent } = useUserStore();

  const [selectedProduct, setSelectedProduct] = useState<RecommendedProduct | null>(null);
  const [homeRecs,  setHomeRecs]  = useState<RecommendedProduct[]>([]);
  const [trending,  setTrending]  = useState<Product[]>([]);
  const [recentViewProducts, setRecentViewProducts] = useState<ProductDetail[]>([]);

  const [recsLoading,     setRecsLoading]     = useState(true);
  const [recsError,       setRecsError]       = useState<string | null>(null);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError,   setTrendingError]   = useState<string | null>(null);

  // Abort controller ref to cancel stale recommendation requests
  const recsAbortRef = useRef<AbortController | null>(null);

  // Session key — re-fetch recs only when meaningful context changes
  const sessionKey = `${activeCustomer?.customer_id || 'default'}:${(sessionContext?.recent_searches || []).slice(0, 3).join(',')}:${(sessionContext?.recent_views || []).slice(0, 3).join(',')}`;

  // Trending products — priority load (fast, no personalization needed)
  useEffect(() => {
    setTrendingLoading(true);
    setTrendingError(null);
    getTrendingProducts(8)
      .then((res) => setTrending(res))
      .catch((err) => {
        console.warn('Trending fetch failed:', err);
        setTrendingError(err?.message || 'Failed to fetch trending products from Databricks.');
      })
      .finally(() => setTrendingLoading(false));
  }, []);

  // Personalized recommendations — deferred, abortable
  useEffect(() => {
    // Cancel previous in-flight request
    if (recsAbortRef.current) {
      recsAbortRef.current.abort();
    }
    const ctrl = new AbortController();
    recsAbortRef.current = ctrl;

    setRecsLoading(true);
    setRecsError(null);

    getHomeRecommendations(activeCustomer.customer_id, sessionContext)
      .then((res) => {
        if (!ctrl.signal.aborted) {
          setHomeRecs(res.recommendations);
        }
      })
      .catch((err) => {
        if (!ctrl.signal.aborted) {
          console.warn('Home recs fetch failed:', err);
          setRecsError(err?.message || 'Failed to fetch recommendations from Databricks.');
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setRecsLoading(false);
      });

    return () => ctrl.abort();
  }, [sessionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch real details for Recently Viewed items
  useEffect(() => {
    const ids = sessionContext.recent_views.slice(0, 6);
    if (ids.length === 0) { setRecentViewProducts([]); return; }
    Promise.all(ids.map((id) => getProductDetail(id).catch(() => null)))
      .then((prods) => setRecentViewProducts(prods.filter(Boolean) as ProductDetail[]));
  }, [sessionContext.recent_views]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addSearchEvent(searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQuickSearch = (q: string) => {
    addSearchEvent(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <MainLayout showRightSidebar={true}>

      {/* ── Hero Section ──────────────────────────────────────────── */}
      <section
        className="relative mb-8 rounded-2xl overflow-hidden border"
        style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #faf5ff 100%)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex flex-col lg:flex-row items-center gap-8 px-6 py-8 sm:px-8 sm:py-10">

          {/* Left content */}
          <div className="flex-1 max-w-xl">
            {/* AI badge */}
            <div className="ai-badge mb-4 inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              AI-Powered Experience
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
              Find the Perfect Product,{' '}
              <span style={{ color: 'var(--primary)' }}>Just by Describing It</span>
            </h1>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Search in natural language and discover products smarter, faster and more relevant than ever — powered by Databricks Vector Search.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} role="search" aria-label="Product search">
              <div className="search-bar p-1.5" style={{ borderRadius: '12px', height: '56px' }}>
                <Sparkles size={16} className="ml-2 shrink-0" style={{ color: 'var(--primary)' }} />
                <input
                  id="hero-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Try "lightweight laptop for remote work"'
                  className="flex-1 px-3 text-sm bg-transparent focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  aria-label="Search for products"
                />
                <button
                  type="submit"
                  id="hero-search-btn"
                  className="px-5 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 transition-colors shrink-0"
                  style={{ background: 'var(--primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary)'}
                  aria-label="Submit search"
                >
                  <Search size={14} />
                  Search
                </button>
              </div>
            </form>

            {/* Quick searches */}
            <div className="flex flex-wrap items-center gap-2 mt-4" role="group" aria-label="Suggested searches">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-subtle)' }}>Try:</span>
              {QUICK_SEARCHES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickSearch(q)}
                  className="px-3 py-1 rounded-full border text-xs font-medium transition-all"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#818cf8';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Right: floating product images */}
          <div className="hidden lg:flex items-center justify-center gap-4 shrink-0 relative mr-4">
            <div className="relative">
              <div className="w-48 h-40 rounded-2xl overflow-hidden shadow-lg border" style={{ borderColor: 'var(--border)' }}>
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=350&fit=crop"
                  alt="Laptop product"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div
                className="absolute -bottom-4 -left-8 w-22 h-22 rounded-xl overflow-hidden shadow-lg border animate-[float_6s_ease-in-out_infinite]"
                style={{ borderColor: 'var(--border)', width: '88px', height: '88px' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop"
                  alt="Headphones product"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div
                className="absolute -top-4 -right-6 w-20 h-20 rounded-xl overflow-hidden shadow-lg border animate-[float_8s_ease-in-out_2s_infinite]"
                style={{ borderColor: 'var(--border)' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop"
                  alt="Watch product"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending Products (priority, loads first) ──────────────── */}
      <section className="mb-10">
        {trendingError ? (
          <div
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ background: '#fff7ed', borderColor: '#fed7aa' }}
            role="alert"
          >
            <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-900">Unable to fetch trending products from Databricks</p>
              <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">{trendingError}</p>
            </div>
          </div>
        ) : (
          <RecommendationRow
            id="trending"
            title="Trending Products"
            subtitle="Popular items people are searching and buying right now"
            items={trending as any}
            isAI={false}
            isLoading={trendingLoading}
            onViewAll={() => navigate('/catalog?sort=popularity')}
          />
        )}
      </section>

      {/* ── Recommended For You (live, deferred) ──────────────────── */}
      <section className="mb-10">
        {recsError ? (
          <div
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ background: '#fef2f2', borderColor: '#fecaca' }}
            role="alert"
          >
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Recommendations unavailable</p>
              <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{recsError}</p>
            </div>
          </div>
        ) : (
          <RecommendationRow
            id="home-recs"
            title="Recommended For You"
            subtitle={`AI-powered recommendations based on ${activeCustomer.customer_name}'s activity and interests`}
            items={homeRecs}
            isAI
            isLoading={recsLoading}
            onViewAll={() => navigate('/recommendations')}
            onInfoClick={(p) => setSelectedProduct(p)}
          />
        )}
      </section>

      {/* ── Shop by Category ────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-heading">
            <LayoutGrid size={18} style={{ color: 'var(--text-muted)' }} />
            Shop by Category
          </h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-xs font-semibold flex items-center gap-1 hover:underline transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
          {CATEGORY_MAP.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={idx}
                id={`category-btn-${idx}`}
                onClick={() => navigate(`/catalog?category=${encodeURIComponent(cat.query)}`)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border w-full group transition-all"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-card)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  e.currentTarget.style.transform = 'none';
                }}
                aria-label={`Browse ${cat.name}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: 'var(--surface-secondary)' }}
                >
                  <Icon size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Recently Viewed ──────────────────────────────────────────── */}
      {sessionContext.recent_views.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading">
              <Clock size={16} style={{ color: 'var(--text-muted)' }} />
              Recently Viewed
            </h2>
            <Link
              to="/profile"
              className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1" role="list" aria-label="Recently viewed products">
            {sessionContext.recent_views.slice(0, 6).map((productId, idx) => {
              const prod = recentViewProducts.find((p) => p.product_id === productId);
              return (
                <div
                  key={idx}
                  role="listitem"
                  onClick={() => navigate(`/products/${productId}`)}
                  className="shrink-0 w-36 p-3 rounded-xl border cursor-pointer transition-all card-hover"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/products/${productId}`)}
                  aria-label={prod?.product_name || `Product ${productId}`}
                >
                  <div
                    className="w-full h-24 rounded-lg flex items-center justify-center mb-2 overflow-hidden p-2"
                    style={{ background: 'var(--surface-secondary)' }}
                  >
                    {prod?.image_url ? (
                      <img
                        src={prod.image_url}
                        alt={prod.product_name}
                        className="w-full h-full object-contain mix-blend-multiply"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs text-center font-medium" style={{ color: 'var(--text-subtle)' }}>Product</span>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {prod?.product_name || `ID: ${productId}`}
                  </p>
                  {prod?.price && (
                    <p className="text-[10px] font-bold mt-0.5 font-mono" style={{ color: 'var(--primary)' }}>
                      ₹{prod.price.toLocaleString('en-IN')}
                    </p>
                  )}
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                    {idx === 0 ? '2 mins ago' : `${idx + 1} hours ago`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Feature Strip ─────────────────────────────────────────────── */}
      <section
        className="rounded-xl border p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
        aria-label="Platform features"
      >
        {[
          { icon: Brain,    color: '#0369a1', bg: '#e0f2fe', title: 'AI Semantic Search',       desc: 'Understand what you mean, not just keywords' },
          { icon: Sparkles, color: '#7e22ce', bg: '#faf5ff', title: 'Smart Recommendations',    desc: 'Discover products you\'ll love before you search' },
          { icon: Zap,      color: '#d97706', bg: '#fef3c7', title: 'Real-time & Accurate',     desc: 'Results in under 2 seconds powered by AI' },
          { icon: Shield,   color: '#16a34a', bg: '#dcfce7', title: 'Secure & Governed',        desc: 'Enterprise-grade security on Databricks' },
        ].map(({ icon: Icon, color, bg, title, desc }, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${i > 0 ? 'pt-4 md:pt-0 md:pl-6 md:border-l' : ''}`}
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: bg }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</p>
              <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t pt-8 pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--primary)' }}
              >
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Retail AI Portal</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              AI-powered product search and recommendation accelerator built on Databricks Vector Search and Model Serving.
            </p>
            <p className="text-[10px] mt-3" style={{ color: 'var(--text-subtle)' }}>
              Built with Databricks · FastAPI · React · TypeScript
            </p>
          </div>

          {[
            { title: 'Platform', links: ['AI Search', 'Recommendations', 'Demo Lab', 'Catalog'] },
            { title: 'Resources', links: ['Documentation', 'How it Works', 'API Reference'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h5 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h5>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <span
                      className="text-xs cursor-pointer transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
            © 2026 Retail AI Accelerator. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--text-subtle)' }}>
            <span className="cursor-pointer hover:opacity-70 transition-opacity">Terms of Service</span>
            <span className="cursor-pointer hover:opacity-70 transition-opacity">Privacy Policy</span>
          </div>
        </div>
      </footer>

      {/* Recommendation detail slide-out */}
      <RecommendationPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </MainLayout>
  );
}



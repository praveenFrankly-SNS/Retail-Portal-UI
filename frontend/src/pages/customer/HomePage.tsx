// ============================================================
// HomePage — Retail AI Portal (WF-02)
// Hero + Recommended For You (live) + Trending + Categories
// + Recently Viewed + Feature Strip + Footer
// No mock data — live Databricks recommendations with graceful fallback.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Zap, Brain, Shield,
  Laptop, Monitor, Headphones, Smartphone, Settings,
  HardDrive, Wifi, HelpCircle, Search, Clock, FlaskConical,
  Home as HomeIcon, Mail,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { RecommendationRow } from '../../components/recommendation/RecommendationRow';
import { RecommendationPanel } from '../../components/recommendation/RecommendationPanel';
import { getHomeRecommendations } from '../../api/recommendationApi';
import { getTrendingProducts } from '../../api/productApi';
import { useUserStore } from '../../store/userStore';
import type { RecommendedProduct } from '../../types/recommendation';
import type { Product } from '../../types/product';

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
  const [recsLoading,     setRecsLoading]     = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Live recommendations whenever active customer / session changes
  useEffect(() => {
    setRecsLoading(true);
    getHomeRecommendations(activeCustomer.customer_id, sessionContext)
      .then((res) => setHomeRecs(res.recommendations))
      .catch((err) => console.warn(err))
      .finally(() => setRecsLoading(false));
  }, [activeCustomer.customer_id, sessionContext]);

  // Trending products (once per mount)
  useEffect(() => {
    setTrendingLoading(true);
    getTrendingProducts(6)
      .then((res) => setTrending(res))
      .catch((err) => console.warn(err))
      .finally(() => setTrendingLoading(false));
  }, []);

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

  // Recently viewed from session context
  const recentlyViewed = sessionContext.recent_views.slice(0, 6);

  return (
    <MainLayout showRightSidebar={true}>

      {/* ── Hero Section ────────────────────────────────────── */}
      <section className="relative mb-8 rounded-3xl overflow-hidden bg-gradient-to-br from-primary-50 via-white to-indigo-50 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-8 px-6 py-8 sm:px-10 sm:py-10">

          {/* Left content */}
          <div className="flex-1 max-w-xl">
            {/* AI badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 border border-primary-200 mb-4">
              <Sparkles size={12} className="text-primary-600 animate-pulse" />
              <span className="text-xs font-semibold text-primary-700">AI-Powered Experience</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-3">
              Find the Perfect Product,{' '}
              <span className="text-primary-600">Just by Describing It</span>
            </h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Search in natural language and discover products smarter, faster and more relevant than ever.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-1.5 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                <Sparkles size={17} className="ml-3 text-primary-400 shrink-0" />
                <input
                  id="hero-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Try "lightweight laptop for remote work", "noise cancelling headphones"'
                  className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  id="hero-search-btn"
                  className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Search size={14} />
                </button>
              </div>
            </form>

            {/* Quick searches */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs text-slate-400 font-semibold">Try these searches:</span>
              {QUICK_SEARCHES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickSearch(q)}
                  className="px-3 py-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-primary-300 hover:text-primary-600 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Right: floating product images */}
          <div className="hidden lg:flex items-center justify-center gap-4 shrink-0 relative mr-4">
            <div className="relative">
              <div className="w-52 h-44 rounded-3xl overflow-hidden shadow-xl border border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=350&fit=crop"
                  alt="Laptop"
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="absolute -bottom-4 -left-8 w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-slate-100 animate-bounce"
                style={{ animationDuration: '6s' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop"
                  alt="Headphones"
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="absolute -top-4 -right-6 w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-slate-100 animate-bounce"
                style={{ animationDuration: '8s' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop"
                  alt="Watch"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recommended For You (live) ──────────────────────── */}
      <section className="mb-10">
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
      </section>

      {/* ── Trending Products (live) ────────────────────────── */}
      <section className="mb-10">
        <RecommendationRow
          id="trending"
          title="Trending Products"
          subtitle="Popular items people are searching and buying right now"
          items={trending as any}
          isAI={false}
          isLoading={trendingLoading}
          onViewAll={() => navigate('/catalog?sort=popularity')}
        />
      </section>

      {/* ── Shop by Category ───────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-heading">Shop by Category</h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View all categories <ArrowRight size={13} />
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
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 w-full group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 text-center leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Recently Viewed ─────────────────────────────────── */}
      {recentlyViewed.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              <h2 className="section-heading">Recently Viewed</h2>
            </div>
            <Link to="/profile" className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {recentlyViewed.map((productId, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/products/${productId}`)}
                className="shrink-0 w-36 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
              >
                <div className="w-full h-24 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                  <span className="text-slate-300 text-xs text-center px-1">Product</span>
                </div>
                <p className="text-[10px] font-bold text-slate-600 truncate">ID: {productId}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{idx === 0 ? '2 mins ago' : `${idx + 1} hours ago`}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Feature Strip ──────────────────────────────────── */}
      <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 mb-12">
        {[
          { icon: Brain,    color: 'blue',   title: 'AI Semantic Search',       desc: 'Understand what you mean, not just keywords' },
          { icon: Sparkles, color: 'purple', title: 'Smart Recommendations',    desc: 'Discover products you\'ll love before you search' },
          { icon: Zap,      color: 'amber',  title: 'Real-time & Accurate',     desc: 'Results in under 2 seconds powered by AI' },
          { icon: Shield,   color: 'emerald',title: 'Secure & Governed',        desc: 'Enterprise-grade security on Databricks' },
        ].map(({ icon: Icon, color, title, desc }, i) => (
          <div key={i} className={`flex items-start gap-3.5 ${i > 0 ? 'pt-4 md:pt-0 md:pl-6' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-${color}-50 text-${color}-600`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 pt-8 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="font-black text-slate-900 text-sm">Retail AI</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI-powered product search and recommendation accelerator built on Databricks.
            </p>
          </div>

          {[
            {
              title: 'Product',
              links: ['AI Search', 'Recommendations', 'Demo Lab', 'Catalog'],
            },
            {
              title: 'Resources',
              links: ['How it Works', 'Documentation', 'Case Studies', 'Blog'],
            },
            {
              title: 'Company',
              links: ['About Us', 'Contact', 'Careers', 'Privacy Policy'],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">{title}</h5>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <span className="text-xs text-slate-500 hover:text-primary-600 cursor-pointer transition-colors">{link}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Stay Updated */}
          <div>
            <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Stay Updated</h5>
            <p className="text-xs text-slate-500 mb-3 leading-snug">
              Get the latest updates and insights on AI-powered shopping.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-primary-400 bg-slate-50"
              />
              <button className="px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-slate-400">
            © 2026 Retail AI Accelerator. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>

      {/* Recommendation detail slide-out */}
      <RecommendationPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </MainLayout>
  );
}

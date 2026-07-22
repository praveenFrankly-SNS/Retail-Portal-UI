// ============================================================
// MainLayout — Retail AI Portal (WF-01)
// Implements the complete 3-column unified layout:
// - Left Column: Sidebar Navigation + Switcher Persona + Context Snapshot
// - Top Bar: Search actions, Language, Upload, Notifications & Profile Avatar
// - Center Content: Main page view
// - Right Column: AI Demo Lab Promo + Live Activity Feed + Trending Searches
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Sparkles,
  LayoutGrid,
  Star,
  ShoppingCart,
  FlaskConical,
  Info,
  Database,
  ChevronDown,
  Bell,
  Globe,
  UploadCloud,
  TrendingUp,
  Brain,
  Activity,
  ArrowRight,
  CheckCircle,
  Eye,
  Search
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useUserStore } from '../../store/userStore';
import { getCustomers } from '../../api/customerApi';
import type { Customer } from '../../types/customer';

interface MainLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'AI Search', path: '/search', icon: Sparkles },
  { label: 'Catalog', path: '/catalog', icon: LayoutGrid },
  { label: 'Recommendations', path: '/recommendations', icon: Star },
  { label: 'Cart', path: '/cart', icon: ShoppingCart },
  { label: 'Demo Lab', path: '/demo-lab', icon: FlaskConical, badge: 'New' },
  { label: 'Monitoring', path: '/monitoring', icon: Database },
  { label: 'About', path: '/about', icon: Info },
];

export function MainLayout({ children, showRightSidebar = false }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const cartCount = useCartStore((s) => s.getItemCount());
  const { activeCustomer, setActiveCustomer, sessionContext, addSearchEvent } = useUserStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [personas, setPersonas] = useState<Customer[]>([]);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Sync search input query text
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (location.pathname === '/search') {
      setSearchQuery(q);
    }
  }, [location]);

  // Load switcher personas
  useEffect(() => {
    getCustomers()
      .then(setPersonas)
      .catch((err) => console.warn('Failed to load personas:', err));
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setShowSwitcher(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addSearchEvent(searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTrendingClick = (term: string) => {
    addSearchEvent(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Safe category interest extraction
  const displayInterest = activeCustomer.interests?.slice(0, 3).join(', ') || 'General';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="flex flex-col overflow-y-auto grow p-4">
          
          {/* Logo & Subtitle */}
          <Link to="/" className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-md shadow-primary-200">
              <Sparkles className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">Retail AI</h1>
              <p className="text-[10px] text-slate-400 font-bold leading-tight">Powered by Databricks</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1 mb-8">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const isCart = item.label === 'Cart';

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={active ? 'text-primary-600' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {isCart && cartCount > 0 && (
                    <span className="bg-primary-600 text-white text-xs font-black px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                  {item.badge && (
                    <span className="bg-accent-100 text-accent-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Customer Context Snapshot */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-4 mt-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              AI Context Snapshot
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Eye size={13} className="text-slate-400" /> Recent Views
                </span>
                <span className="font-bold text-slate-800">
                  {sessionContext.recent_views.length} items
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Search size={13} className="text-slate-400" /> Recent Searches
                </span>
                <span className="font-bold text-slate-800">
                  {sessionContext.recent_searches.length} searches
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <ShoppingCart size={13} className="text-slate-400" /> Cart Items
                </span>
                <span className="font-bold text-slate-800">
                  {sessionContext.cart_product_ids.length} items
                </span>
              </div>
              <div className="border-t border-slate-100/70 pt-2.5">
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Top Interest</span>
                <span className="font-bold text-slate-700 truncate block max-w-full" title={displayInterest}>
                  {displayInterest}
                </span>
              </div>
            </div>

            <Link
              to="/profile"
              className="text-xs font-bold text-primary-600 hover:text-primary-700 mt-4 block text-center border-t border-slate-100 pt-3"
            >
              View full profile →
            </Link>
          </div>
        </div>

        {/* Switcher Customer Persona Dropdown */}
        <div className="p-4 border-t border-slate-100 bg-white relative" ref={switcherRef}>
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-black text-xs flex items-center justify-center shrink-0">
                {activeCustomer.customer_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Demo Customer</p>
                <p className="text-sm font-black text-slate-800 truncate">
                  {activeCustomer.customer_name} ({activeCustomer.customer_id.split('-').pop()})
                </p>
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 transition-transform duration-200" />
          </button>

          {showSwitcher && (
            <div className="absolute bottom-20 left-4 right-4 bg-white border border-slate-200 rounded-2xl shadow-panel py-2 z-50 animate-slide-up max-h-60 overflow-y-auto">
              <p className="text-[10px] font-extrabold text-slate-400 px-4 py-1.5 uppercase tracking-widest border-b border-slate-50 mb-1">
                Switch Persona
              </p>
              {personas.map((p) => (
                <button
                  key={p.customer_id}
                  onClick={() => {
                    setActiveCustomer(p);
                    setShowSwitcher(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm font-semibold hover:bg-slate-50 transition-colors ${
                    activeCustomer.customer_id === p.customer_id
                      ? 'text-primary-600 bg-primary-50/50'
                      : 'text-slate-600'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                    {p.customer_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">{p.customer_name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{p.customer_id}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTAINER ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
          
          {/* Middle: Global Search */}
          <form onSubmit={handleGlobalSearch} className="w-full max-w-lg">
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden px-3.5 focus-within:border-primary-400 focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything in natural language..."
                className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg p-1.5 transition-colors"
              >
                <Search size={12} className="text-white" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            
            <button
              onClick={() => navigate('/demo-lab')}
              className="hidden md:flex items-center gap-1.5 text-xs font-bold text-primary-600 border border-primary-200 px-3 py-2 rounded-xl hover:bg-primary-50 transition-colors"
            >
              <UploadCloud size={14} />
              Upload Product
            </button>

            <div className="flex items-center gap-1 text-slate-500 font-semibold text-xs border border-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer">
              <Globe size={14} />
              <span>English</span>
            </div>

            <button className="relative w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
            </button>

            {/* Profile Avatar / Quick Link */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/profile')}>
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                {activeCustomer.customer_name.charAt(0)}
              </div>
              <span className="hidden sm:inline text-sm font-bold text-slate-700">
                {activeCustomer.customer_name.split(' ')[0]}
              </span>
            </div>

            {/* Shopping Cart button */}
            <Link
              to="/cart"
              className="relative w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page Inner Container (Divided if showing Right Sidebar) */}
        <div className="flex-1 flex min-w-0">
          
          {/* Main central content body */}
          <div className="flex-1 overflow-y-auto px-6 py-8 min-w-0">
            {children}
          </div>

          {/* ── RIGHT SIDEBAR ────────────────────────────────────────── */}
          {showRightSidebar && (
            <aside className="w-80 bg-white border-l border-slate-200 shrink-0 hidden xl:flex flex-col gap-6 p-6 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
              
              {/* Promo Card: AI Demo Lab */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-4 relative overflow-hidden">
                <div className="absolute right-2 -bottom-2 opacity-10">
                  <Brain size={120} className="text-indigo-900" />
                </div>
                <span className="bg-primary-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">
                  New
                </span>
                <h4 className="font-black text-slate-900 text-sm mb-1">AI Demo Lab</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Upload a new product and see it become searchable & recommendable in minutes.
                </p>
                <Link
                  to="/demo-lab"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"
                >
                  Go to Demo Lab <ArrowRight size={12} />
                </Link>
              </div>

              {/* Your Activity Feed */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3.5">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-primary-600 animate-pulse" />
                    Your Activity
                  </h4>
                  <Link to="/profile" className="text-xs font-bold text-primary-600 hover:text-primary-700">
                    View All
                  </Link>
                </div>

                <div className="space-y-3">
                  {sessionContext.recent_views.length > 0 ? (
                    sessionContext.recent_views.slice(0, 4).map((view, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <div>
                          <span className="font-bold text-slate-800">Viewed product</span>
                          <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[200px]">
                            ID: {view}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">No recent views.</div>
                  )}

                  {sessionContext.recent_searches.length > 0 &&
                    sessionContext.recent_searches.slice(0, 2).map((search, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <div>
                          <span className="font-bold text-slate-800">Searched</span>
                          <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[200px]">
                            "{search}"
                          </p>
                        </div>
                      </div>
                    ))
                  }

                  {sessionContext.cart_product_ids.length > 0 && (
                    <div className="flex items-start gap-2.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      <div>
                        <span className="font-bold text-slate-800">Added to Cart</span>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {sessionContext.cart_product_ids.length} items in cart
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Trending Searches */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-primary-600" />
                    Trending Searches
                  </h4>
                  <button onClick={() => navigate('/catalog')} className="text-xs font-bold text-primary-600 hover:text-primary-700">
                    View All
                  </button>
                </div>
                
                <ul className="space-y-2">
                  {[
                    'wireless headphones',
                    'standing desk',
                    'mechanical keyboard',
                    'laptop accessories',
                    'portable monitor'
                  ].map((term, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 w-4 block text-right">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => handleTrendingClick(term)}
                        className="text-xs text-slate-600 hover:text-primary-600 hover:font-bold transition-all text-left"
                      >
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why Retail AI? */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">
                  Why Retail AI?
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Brain size={12} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Semantic Understanding</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Search naturally, like speaking to a human.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Sparkles size={12} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">AI Recommendations</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Hyper-personalized matches mapped directly to interests.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle size={12} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Real-time Intelligence</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Immediate context feedback as you browse or search.</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

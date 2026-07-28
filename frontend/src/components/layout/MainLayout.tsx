// ============================================================
// MainLayout — Retail AI Portal (Enterprise Layout)
// 3-column: Left sidebar nav | Top header | Center content
// Enterprise design: Plus Jakarta Sans, 44px nav items,
// 6px nav spacing, clean active states, no decorative gradients
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
  BarChart2,
  ChevronDown,
  Bell,
  TrendingUp,
  Brain,
  Activity,
  ArrowRight,
  CheckCircle,
  Eye,
  Search,
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

// Using /home (industry standard for customer-facing portals)
const NAV_ITEMS: NavItem[] = [
  { label: 'Home',            path: '/home',           icon: Home },
  { label: 'Product Search',  path: '/search',         icon: Search },
  { label: 'Catalog',         path: '/catalog',        icon: LayoutGrid },
  { label: 'Recommendations', path: '/recommendations', icon: Star },
  { label: 'Cart',            path: '/cart',           icon: ShoppingCart },
  { label: 'Demo Lab',        path: '/demo-lab',       icon: FlaskConical, badge: 'New' },
  { label: 'Monitoring',      path: '/monitoring',     icon: BarChart2 },
  { label: 'About',           path: '/about',          icon: Info },
];

const NAV_GROUPS = [
  {
    label: 'DISCOVERY',
    items: ['Home', 'Product Search', 'Catalog'],
  },
  {
    label: 'PERSONALIZATION',
    items: ['Recommendations', 'Cart'],
  },
  {
    label: 'TOOLS',
    items: ['Demo Lab', 'Monitoring', 'About'],
  },
];

const TRENDING_TERMS = [
  'wireless headphones',
  'standing desk',
  'mechanical keyboard',
  'laptop accessories',
  'portable monitor',
];

export function MainLayout({ children, showRightSidebar = false }: MainLayoutProps) {
  const location  = useLocation();
  const navigate  = useNavigate();

  const cartCount = useCartStore((s) => s.getItemCount());
  const { activeCustomer, setActiveCustomer, sessionContext, addSearchEvent, clearActivityHistory } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [personas, setPersonas] = useState<Customer[]>([]);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Sync global search bar with current URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (location.pathname === '/search') setSearchQuery(q);
  }, [location]);

  // Load demo persona switcher list
  useEffect(() => {
    getCustomers()
      .then(setPersonas)
      .catch((err) => console.warn('Failed to load personas:', err));
  }, []);

  // Close switcher on outside click
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
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const displayInterest = activeCustomer.interests?.slice(0, 3).join(', ') || 'General';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)', fontFamily: 'var(--font-sans)' }}>

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
      <aside
        className="w-60 bg-white border-r flex flex-col shrink-0 h-screen sticky top-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col overflow-y-auto grow px-3 py-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 px-2 py-2 mb-5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ background: 'var(--primary)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">Retail AI</p>
              <p className="text-[10px] font-medium leading-none mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                Powered by Databricks
              </p>
            </div>
          </Link>

          {/* Navigation Groups */}
          <nav className="space-y-5 mb-6" aria-label="Main navigation">
            {NAV_GROUPS.map((group) => {
              const groupItems = NAV_ITEMS.filter((item) => group.items.includes(item.label));
              return (
                <div key={group.label}>
                  <p
                    className="px-2 mb-1 text-[10px] font-semibold tracking-widest"
                    style={{ color: 'var(--text-subtle)', textTransform: 'uppercase' }}
                  >
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      const isCart = item.label === 'Cart';

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                          className="flex items-center justify-between px-2 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            height: '36px',
                            color: active ? 'var(--primary)' : 'var(--text-secondary)',
                            background: active ? '#eef2ff' : 'transparent',
                            fontWeight: active ? 600 : 500,
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = 'var(--surface-secondary)';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }
                          }}
                          aria-current={active ? 'page' : undefined}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              size={16}
                              style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}
                            />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isCart && cartCount > 0 && (
                              <span
                                className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'var(--primary)', minWidth: '18px', textAlign: 'center' }}
                              >
                                {cartCount}
                              </span>
                            )}
                            {item.badge && (
                              <span className="ai-badge text-[9px] px-1.5 py-0.5">{item.badge}</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* AI Context Snapshot */}
          <div
            className="rounded-xl p-3 mt-auto mb-3"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-muted)' }}>
              AI Context Snapshot
            </p>
            <div className="space-y-1.5 text-xs">
              {[
                { icon: Eye, label: 'Recent Views', value: `${sessionContext.recent_views.length} items` },
                { icon: Search, label: 'Recent Searches', value: `${sessionContext.recent_searches.length} searches` },
                { icon: ShoppingCart, label: 'Cart Items', value: `${sessionContext.cart_product_ids.length} items` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Icon size={11} />
                    {label}
                  </span>
                  <span className="font-semibold font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-[10px] mb-0.5" style={{ color: 'var(--text-subtle)' }}>Top Interest</p>
                <p className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }} title={displayInterest}>
                  {displayInterest}
                </p>
              </div>
            </div>
            <div
              className="flex items-center justify-between pt-2.5 mt-2 border-t"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <Link
                to="/profile"
                className="text-[11px] font-semibold hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                View profile →
              </Link>
              {(sessionContext.recent_views.length > 0 || sessionContext.recent_searches.length > 0) && (
                <button
                  onClick={clearActivityHistory}
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: 'var(--text-subtle)' }}
                  title="Clear search and view history"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-subtle)'}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Demo Customer Switcher */}
        <div
          className="px-3 py-3 border-t bg-white relative"
          style={{ borderColor: 'var(--border)' }}
          ref={switcherRef}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-widest mb-2 px-1"
            style={{ color: 'var(--text-subtle)' }}
          >
            Demo Customer
          </p>
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="w-full flex items-center justify-between p-2 rounded-lg border transition-all text-left"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            aria-expanded={showSwitcher}
            aria-haspopup="listbox"
            id="customer-switcher-btn"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                style={{ background: 'var(--primary)' }}
                aria-hidden="true"
              >
                {activeCustomer.customer_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-none" style={{ color: 'var(--text-primary)' }}>
                  {activeCustomer.customer_name}
                </p>
                <p className="text-[10px] mt-0.5 truncate leading-none" style={{ color: 'var(--text-muted)' }}>
                  {activeCustomer.persona_label || activeCustomer.customer_id}
                </p>
              </div>
            </div>
            <ChevronDown
              size={13}
              style={{ color: 'var(--text-subtle)', transition: 'transform 200ms', transform: showSwitcher ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          {showSwitcher && (
            <div
              className="absolute bottom-20 left-3 right-3 rounded-xl shadow-lg py-1.5 z-50 max-h-64 overflow-y-auto animate-slide-up"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-dropdown)' }}
              role="listbox"
              aria-label="Select demo customer"
            >
              <p
                className="text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest border-b mb-1"
                style={{ color: 'var(--text-subtle)', borderColor: 'var(--border-subtle)' }}
              >
                Switch Persona
              </p>
              {personas.map((p) => {
                const isSelected = activeCustomer.customer_id === p.customer_id;
                return (
                  <button
                    key={p.customer_id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => { setActiveCustomer(p); setShowSwitcher(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors"
                    style={{
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      background: isSelected ? '#eef2ff' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0"
                      style={{
                        background: isSelected ? '#e0e7ff' : 'var(--surface-secondary)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                    >
                      {p.customer_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs leading-none truncate">{p.customer_name}</p>
                      <p className="text-[10px] mt-0.5 leading-none truncate" style={{ color: 'var(--text-subtle)' }}>
                        {p.persona_label || p.customer_id}
                      </p>
                    </div>
                    {isSelected && <CheckCircle size={13} style={{ color: 'var(--primary)' }} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTAINER ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header Bar */}
        <header
          className="bg-white border-b px-6 flex items-center justify-between sticky top-0 z-40"
          style={{ height: '64px', borderColor: 'var(--border)' }}
        >
          {/* Global Search */}
          <form onSubmit={handleGlobalSearch} className="w-full max-w-lg" role="search">
            <div
              className="search-bar w-full px-4 transition-all"
              style={{ gap: '10px' }}
            >
              <Search size={16} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
              <input
                type="search"
                id="global-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything in natural language..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
                aria-label="Global product search"
              />
              <button
                type="submit"
                id="global-search-btn"
                className="px-3 py-1.5 rounded-md text-white text-xs font-semibold shrink-0 transition-colors"
                style={{ background: 'var(--primary)' }}
                aria-label="Submit search"
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary)'}
              >
                Search
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {/* Notifications */}
            <button
              id="notifications-btn"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              aria-label="Notifications"
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>

            {/* Profile Avatar */}
            <button
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
              onClick={() => navigate('/profile')}
              id="profile-btn"
              aria-label="View profile"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div
                className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center"
                style={{ background: 'var(--primary)' }}
              >
                {activeCustomer.customer_name.charAt(0)}
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {activeCustomer.customer_name.split(' ')[0]}
              </span>
              <ChevronDown size={12} style={{ color: 'var(--text-subtle)' }} />
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              id="cart-icon-btn"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              aria-label={`Shopping cart, ${cartCount} items`}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--surface-secondary)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 border-2 border-white"
                  style={{ background: 'var(--primary)' }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content + Optional Right Sidebar */}
        <div className="flex-1 flex min-w-0">

          {/* Main central content */}
          <main
            className="flex-1 overflow-y-auto min-w-0"
            style={{ padding: '24px' }}
          >
            {children}
          </main>

          {/* ── RIGHT SIDEBAR ──────────────────────────────────────────── */}
          {showRightSidebar && (
            <aside
              className="w-72 shrink-0 hidden xl:flex flex-col gap-5 p-5 h-screen sticky top-0 overflow-y-auto border-l"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* AI Demo Lab Promo */}
              <div
                className="rounded-xl p-4 relative overflow-hidden"
                style={{ background: '#f3e8ff', border: '1px solid #e9d5ff' }}
              >
                <span className="ai-badge mb-2 inline-flex">New</span>
                <h4 className="font-bold text-slate-900 text-sm mb-1">AI Demo Lab</h4>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                  Upload a new product and see it become searchable & recommendable in minutes.
                </p>
                <Link
                  to="/demo-lab"
                  className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                  style={{ color: '#7e22ce' }}
                >
                  Go to Demo Lab <ArrowRight size={11} />
                </Link>
              </div>

              {/* Your Activity */}
              <div className="card p-4">
                <div className="card-header -mx-4 -mt-4 mb-3 px-4 py-2.5">
                  <h4 className="section-title text-xs flex items-center gap-1.5">
                    <Activity size={12} style={{ color: 'var(--primary)' }} className="animate-pulse" />
                    Your Activity
                  </h4>
                  <div className="flex items-center gap-2">
                    {(sessionContext.recent_views.length > 0 || sessionContext.recent_searches.length > 0) && (
                      <button
                        onClick={clearActivityHistory}
                        className="text-[11px] font-medium transition-colors"
                        style={{ color: 'var(--text-subtle)' }}
                        title="Clear history"
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-subtle)'}
                      >
                        Clear
                      </button>
                    )}
                    <Link to="/profile" className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                      View All
                    </Link>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {sessionContext.recent_views.length > 0 ? (
                    sessionContext.recent_views.slice(0, 3).map((view, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <Eye size={11} className="text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Viewed product</span>
                          <p className="text-[10px] truncate max-w-[180px] font-mono" style={{ color: 'var(--text-subtle)' }}>{view}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic" style={{ color: 'var(--text-subtle)' }}>No activity yet. Start browsing!</p>
                  )}
                  {sessionContext.recent_searches.slice(0, 2).map((s, idx) => (
                    <div key={`s-${idx}`} className="flex items-start gap-2 text-xs pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <Search size={11} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Searched</span>
                        <p className="text-[10px] truncate max-w-[180px]" style={{ color: 'var(--text-subtle)' }}>"{s}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Searches */}
              <div className="card p-4">
                <div className="card-header -mx-4 -mt-4 mb-3 px-4 py-2.5">
                  <h4 className="section-title text-xs flex items-center gap-1.5">
                    <TrendingUp size={12} style={{ color: 'var(--primary)' }} />
                    Trending Searches
                  </h4>
                  <button
                    onClick={() => navigate('/catalog')}
                    className="text-xs font-semibold"
                    style={{ color: 'var(--primary)' }}
                  >
                    View All
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {TRENDING_TERMS.map((term, index) => (
                    <li key={index} className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold w-4 text-right shrink-0 font-mono" style={{ color: 'var(--text-subtle)' }}>
                        {index + 1}
                      </span>
                      <button
                        onClick={() => handleTrendingClick(term)}
                        className="text-xs transition-all text-left hover:underline"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why Retail AI */}
              <div className="card p-4">
                <h4
                  className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Why Retail AI?
                </h4>
                <div className="space-y-3">
                  {[
                    { icon: Brain, color: '#0369a1', bg: '#e0f2fe', title: 'Semantic Search', desc: 'Understand intent, not just keywords' },
                    { icon: Sparkles, color: '#7e22ce', bg: '#faf5ff', title: 'AI Recommendations', desc: 'Personalized for every session' },
                    { icon: Activity, color: '#16a34a', bg: '#dcfce7', title: 'Real-time Intelligence', desc: 'Always learning from interactions' },
                    { icon: CheckCircle, color: '#d97706', bg: '#fef3c7', title: 'Enterprise Ready', desc: 'Secure, scalable, governed' },
                  ].map(({ icon: Icon, color, bg, title, desc }) => (
                    <div key={title} className="flex items-start gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: bg }}
                      >
                        <Icon size={12} style={{ color }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

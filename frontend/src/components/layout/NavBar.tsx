// ============================================================
// NavBar — Retail AI Portal
// Matches WF-01: horizontal top nav, logo, search bar,
// nav links, dataset badge, user switcher dropdown, cart badge
// ============================================================

import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Bell, ChevronDown, Home,
  Sparkles, LayoutGrid, Star, FlaskConical, Info
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { useUserStore } from '../../store/userStore';
import { getCustomers } from '../../api/customerApi';
import type { Customer } from '../../types/customer';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/home', icon: Home },
  { label: 'Product Search', path: '/search', icon: Search },
  { label: 'Catalog', path: '/catalog', icon: LayoutGrid },
  { label: 'Recommendations', path: '/recommendations', icon: Star },
  { label: 'Cart', path: '/cart', icon: ShoppingCart },
  { label: 'Demo Lab', path: '/demo-lab', icon: FlaskConical, badge: 'New' },
  { label: 'About', path: '/about', icon: Info },
];

export function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.getItemCount());
  
  const { activeCustomer, setActiveCustomer, addSearchEvent } = useUserStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [personas, setPersonas] = useState<Customer[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load switcher personas
  useEffect(() => {
    getCustomers().then(setPersonas).catch(err => console.warn(err));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync search input with query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (location.pathname === '/search') setSearchQuery(q);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Log search event in user session context
      addSearchEvent(searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-nav">
      <div className="max-w-[1440px] mx-auto px-4 h-[60px] flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div className="hidden sm:block leading-none">
            <div className="text-sm font-bold text-gray-900 leading-tight">Retail AI</div>
            <div className="text-[10px] text-gray-400 font-medium leading-tight">Powered by Databricks</div>
          </div>
        </Link>



        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative flex items-center">
            <Search
              size={16}
              className="absolute left-3 text-gray-400 pointer-events-none"
            />
            <input
              ref={searchRef}
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything in natural language..."
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-gray-200 bg-gray-50
                         text-sm text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         focus:bg-white transition-all duration-150"
            />
            <button
              type="submit"
              id="global-search-btn"
              className="absolute right-1.5 h-6 px-2.5 rounded-md bg-primary-600 text-white text-xs font-medium
                         hover:bg-primary-700 active:bg-primary-800 transition-colors"
            >
              <Search size={13} />
            </button>
          </div>
        </form>

        {/* Right: Nav links (desktop) */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            if (item.label === 'Cart') return null; // Cart shown separately
            return (
              <Link
                key={item.path}
                to={item.path}
                id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
                )}
                {item.badge && (
                  <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full
                                   bg-accent-500 text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-1 shrink-0 relative" ref={dropdownRef}>
          {/* Notifications */}
          <button
            id="notifications-btn"
            className="relative w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell size={17} />
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            id="cart-nav-btn"
            className="relative w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart size={17} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1
                               bg-primary-600 text-white text-[10px] font-bold
                               rounded-full flex items-center justify-center leading-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* User Avatar switcher button */}
          <button
            id="user-avatar-btn"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-1.5 h-8 px-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {activeCustomer.customer_name[0]}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">{activeCustomer.customer_name}</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showUserDropdown && (
            <div
              id="user-switcher-dropdown"
              className="absolute right-0 top-11 w-64 bg-white border border-gray-100 shadow-panel rounded-xl py-2 z-50 animate-fade-in"
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Demo Switcher Persona</p>
                <p className="text-xs text-gray-500 leading-snug mt-0.5">Select a customer profile to switch recommendation context.</p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {personas.map((persona) => (
                  <button
                    key={persona.customer_id}
                    onClick={() => {
                      setActiveCustomer(persona);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-4 py-2 hover:bg-gray-50 text-left transition-colors
                      ${activeCustomer.customer_id === persona.customer_id ? 'bg-primary-50/50' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold shrink-0">
                      {persona.customer_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                        {persona.customer_name}
                        {activeCustomer.customer_id === persona.customer_id && (
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate leading-snug">{persona.persona_label}</p>
                      <p className="text-[9px] text-gray-400 truncate leading-none mt-0.5">ID: {persona.customer_id}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

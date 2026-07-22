// ============================================================
// ProfilePage — Retail AI Portal (WF-08)
// Demo Customer profile with:
//   Left: Sub-navigation (Dashboard, Orders, Wishlist, etc.)
//   Center: Demo Customer selector + Profile card + Interests
//           + Recent Searches / Recent Views / Wishlist
//           + Purchase History
//   Right: AI Context Summary (interests, brands, price, score)
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Heart, Eye, GitCompare, MessageSquare,
  MapPin, CreditCard, User, Settings, FlaskConical, CheckCircle,
  Search, RefreshCcw, Star, TrendingUp, Brain, ShoppingBag, Clock,
  ArrowRight, Plus,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { getCustomers, getCustomerContext } from '../../api/customerApi';
import { useUserStore } from '../../store/userStore';
import type { Customer, CustomerAIContext } from '../../types/customer';

const PROFILE_NAV = [
  { id: 'dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'orders',     label: 'Orders',          icon: Package },
  { id: 'wishlist',   label: 'Wishlist',        icon: Heart },
  { id: 'viewed',     label: 'Recently Viewed', icon: Eye },
  { id: 'compare',    label: 'Compare',         icon: GitCompare },
  { id: 'messages',   label: 'Messages',        icon: MessageSquare },
  { id: 'addresses',  label: 'Addresses',       icon: MapPin },
  { id: 'payments',   label: 'Payment Methods', icon: CreditCard },
  { id: 'profile',    label: 'My Profile',      icon: User },
  { id: 'settings',   label: 'Settings',        icon: Settings },
];

const MOCK_ORDERS = [
  { id: 'ORD-10023', date: 'May 18, 2026', amount: 35988, status: 'Delivered' },
  { id: 'ORD-10011', date: 'Apr 28, 2026', amount: 4299,  status: 'Delivered' },
  { id: 'ORD-09995', date: 'Apr 12, 2026', amount: 7499,  status: 'Delivered' },
  { id: 'ORD-09980', date: 'Mar 30, 2026', amount: 2999,  status: 'Returned'  },
];

const MOCK_INTERESTS = [
  'Wireless Audio', 'Smart Devices', 'Home Office', 'Productivity',
  'Travel Tech', 'Premium Brands', 'Gadgets',
];

const STATUS_COLORS: Record<string, string> = {
  Delivered: 'bg-green-100 text-green-700',
  Returned:  'bg-amber-100 text-amber-700',
  Processing:'bg-blue-100 text-blue-700',
  Shipped:   'bg-purple-100 text-purple-700',
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { activeCustomer, setActiveCustomer, sessionContext } = useUserStore();

  const [activeSection, setActiveSection] = useState('profile');
  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [aiContext,  setAiContext]   = useState<CustomerAIContext | null>(null);
  const [interests,  setInterests]  = useState<string[]>(MOCK_INTERESTS);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch(console.warn);
  }, []);

  useEffect(() => {
    getCustomerContext(activeCustomer.customer_id)
      .then(setAiContext)
      .catch(console.warn);
  }, [activeCustomer.customer_id]);

  const handleRefreshContext = () => {
    setRefreshing(true);
    getCustomerContext(activeCustomer.customer_id)
      .then(setAiContext)
      .catch(console.warn)
      .finally(() => setRefreshing(false));
  };

  const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');

  return (
    <MainLayout showRightSidebar={false}>
      <div className="flex gap-6 min-h-[calc(100vh-128px)]">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
        <aside className="w-56 shrink-0 space-y-4">
          {/* Sub-nav */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <nav className="divide-y divide-slate-50">
              {PROFILE_NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    activeSection === id
                      ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={15} className={activeSection === id ? 'text-primary-500' : 'text-slate-400'} />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* AI Demo Lab Promo */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical size={14} className="text-primary-600" />
              <span className="text-xs font-black text-slate-900">AI Demo Lab</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
              Try uploading a product and see AI in action.
            </p>
            <button
              onClick={() => navigate('/demo-lab')}
              className="text-[10px] text-primary-600 font-bold hover:underline flex items-center gap-1"
            >
              Go to Demo Lab <ArrowRight size={10} />
            </button>
          </div>
        </aside>

        {/* ── CENTER: Profile Content ──────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          <div>
            <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
            <p className="text-sm text-slate-500">Manage your profile, preferences and AI context</p>
          </div>

          {/* Demo Customer Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-black text-slate-900">Select Demo Customer</h3>
              <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center cursor-help">
                <span className="text-[9px] text-slate-500 font-black">?</span>
              </div>
            </div>
            <div className="space-y-2">
              {customers.map((c) => (
                <button
                  key={c.customer_id}
                  onClick={() => setActiveCustomer(c)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    activeCustomer.customer_id === c.customer_id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                    activeCustomer.customer_id === c.customer_id
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.customer_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.customer_name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.persona_label || c.customer_id}</p>
                  </div>
                  {activeCustomer.customer_id === c.customer_id && (
                    <CheckCircle size={16} className="text-primary-500 ml-auto shrink-0" />
                  )}
                </button>
              ))}
              <button className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-primary-300 hover:text-primary-600 transition-all text-sm font-semibold">
                <Plus size={15} /> Create New Demo Customer
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 font-black text-2xl flex items-center justify-center shrink-0">
                {activeCustomer.customer_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">{activeCustomer.customer_name}</h3>
                  <span className="bg-primary-50 text-primary-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-primary-100">Current</span>
                </div>
                <p className="text-sm text-slate-500">{activeCustomer.persona_label}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">📍 {activeCustomer.city || 'India'}</span>
                </div>
              </div>
              <button className="ml-auto flex items-center gap-1.5 text-xs font-bold text-primary-600 border border-primary-200 px-3 py-2 rounded-xl hover:bg-primary-50 transition-colors">
                ✏️ Edit Profile
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 border-t border-slate-100 pt-4">
              {[
                { label: 'Orders', value: '12' },
                { label: 'Total Spent', value: '₹1,24,890' },
                { label: 'Products Viewed', value: sessionContext.recent_views.length.toString() || '28' },
                { label: 'Wishlisted Items', value: '6' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-black text-slate-900">{value}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Interests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-black text-slate-900">Customer Interests</h3>
              <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center cursor-help">
                <span className="text-[9px] text-slate-500 font-black">?</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-primary-50 text-primary-700 border border-primary-100 text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary-100 transition-colors"
                >
                  {interest} ✕
                </span>
              ))}
              <button className="flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors">
                <Plus size={12} /> Add Interest
              </button>
            </div>
          </div>

          {/* 3-Column: Recent Searches, Recent Views, Wishlist */}
          <div className="grid grid-cols-3 gap-4">

            {/* Recent Searches */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-900">Recent Searches</h4>
                <button className="text-[10px] text-primary-600 font-bold">View all</button>
              </div>
              <div className="space-y-2">
                {(sessionContext.recent_searches.length > 0
                  ? sessionContext.recent_searches
                  : ['noise cancelling headphones', 'wireless earbuds', 'bluetooth speaker', 'ergonomic chair', 'laptop stand']
                ).slice(0, 5).map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span
                      className="text-xs text-slate-600 hover:text-primary-600 cursor-pointer flex items-center gap-1.5"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                    >
                      <Search size={11} className="text-slate-400" /> {s}
                    </span>
                    <span className="text-[9px] text-slate-400">{idx === 0 ? 'Today' : `${idx + 1}d ago`}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Views */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-900">Recent Views</h4>
                <button className="text-[10px] text-primary-600 font-bold">View all</button>
              </div>
              <div className="space-y-2">
                {sessionContext.recent_views.length > 0
                  ? sessionContext.recent_views.slice(0, 4).map((id, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg p-1 -mx-1 transition-colors"
                      onClick={() => navigate(`/products/${id}`)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Eye size={12} className="text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate">Product {id.slice(-4)}</p>
                        <p className="text-[9px] text-slate-400">{idx === 0 ? '2 mins ago' : `${idx + 1}h ago`}</p>
                      </div>
                    </div>
                  ))
                  : (
                    <p className="text-xs text-slate-400 italic">No products viewed yet.</p>
                  )
                }
              </div>
            </div>

            {/* Wishlist */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-900">Wishlist (6)</h4>
                <button className="text-[10px] text-primary-600 font-bold">View all</button>
              </div>
              <div className="space-y-2">
                {['Apple AirPods Max', 'Sony HT-A9 Home Theatre', 'Logitech MX Master 3S'].map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Heart size={12} className="text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-700 truncate">{name}</p>
                      <p className="text-[9px] text-slate-400">₹{[59900, 89990, 9995][idx].toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Purchase History (Demo)</h3>
                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center cursor-help inline-block ml-1">
                  <span className="text-[9px] text-slate-500 font-black">?</span>
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700">
                View all orders <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left pb-2">Order ID</th>
                    <th className="text-left pb-2">Date</th>
                    <th className="text-left pb-2">Products</th>
                    <th className="text-right pb-2">Amount</th>
                    <th className="text-right pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MOCK_ORDERS.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 text-xs font-bold text-primary-600">{order.id}</td>
                      <td className="py-3 text-xs text-slate-600">{order.date}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                              <ShoppingBag size={10} className="text-slate-400" />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-xs font-black text-slate-900 text-right">
                        {formatINR(order.amount)}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT: AI Context Summary ────────────────────────── */}
        <aside className="w-64 shrink-0 space-y-4 hidden xl:block">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-900">AI Context Summary</h4>
              <button className="text-[10px] text-primary-600 font-bold hover:underline">How it works ›</button>
            </div>
            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
              This is how our AI understands {activeCustomer.customer_name.split(' ')[0]} to deliver personalized recommendations.
            </p>

            <div className="space-y-4">
              {[
                {
                  icon: Star, color: 'text-amber-600 bg-amber-50',
                  label: 'Top Interests',
                  value: aiContext?.top_interests?.join(', ') || interests.slice(0, 3).join(', '),
                },
                {
                  icon: ShoppingBag, color: 'text-blue-600 bg-blue-50',
                  label: 'Preferred Brands',
                  value: aiContext?.preferred_brands?.join(', ') || 'Sony, Bose, Apple, Samsung, Anker',
                },
                {
                  icon: TrendingUp, color: 'text-green-600 bg-green-50',
                  label: 'Price Preference',
                  value: aiContext?.price_preference || 'Mid to Premium Range\n₹2,000 – ₹30,000',
                },
                {
                  icon: Brain, color: 'text-purple-600 bg-purple-50',
                  label: 'Shopping Behavior',
                  value: aiContext?.shopping_behavior || 'Researches before buying, compares options, buys during offers',
                },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${color}`}>
                      <Icon size={11} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-semibold pl-7 leading-snug whitespace-pre-line">{value}</p>
                </div>
              ))}

              {/* Engagement Score */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-rose-600 bg-rose-50">
                    <Star size={11} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Engagement Score</span>
                </div>
                <div className="pl-7">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mr-2">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${aiContext?.engagement_score ?? 85}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-800">High ({aiContext?.engagement_score ?? 85}/100)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleRefreshContext}
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCcw size={12} className={refreshing ? 'animate-spin' : ''} />
              Refresh AI Context
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h4 className="text-xs font-black text-slate-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              {[
                { icon: Star, label: 'Update Interests', sub: 'Help AI personalize better' },
                { icon: Package, label: 'View All Orders', sub: 'Track and manage your orders' },
                { icon: MapPin, label: 'Manage Addresses', sub: 'View and edit saved addresses' },
                { icon: CreditCard, label: 'Payment Methods', sub: 'Manage your cards & UPI' },
              ].map(({ icon: Icon, label, sub }) => (
                <button key={label} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">{label}</p>
                    <p className="text-[9px] text-slate-500">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </MainLayout>
  );
}

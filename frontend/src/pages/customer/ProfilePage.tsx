// ============================================================
// ProfilePage — WF-08
// Displays customer profile analytics, category preferences,
// brand affinity, search telemetry, and event history log.
// Wraps inside the unified MainLayout.
// ============================================================

import { useState, useEffect } from 'react';
import {
  User,
  Heart,
  Eye,
  Sliders,
  ShoppingBag,
  Sparkles,
  RefreshCcw,
  Activity,
  Award,
  Grid
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { getCustomerProfile, getCustomerContext } from '../../api/customerApi';
import { useUserStore } from '../../store/userStore';
import type { CustomerProfile, CustomerAIContext } from '../../types/customer';

export function ProfilePage() {
  const { activeCustomer } = useUserStore();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [context, setContext] = useState<CustomerAIContext | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = () => {
    setLoading(true);
    Promise.all([
      getCustomerProfile(activeCustomer.customer_id),
      getCustomerContext(activeCustomer.customer_id)
    ])
      .then(([profData, ctxData]) => {
        setProfile(profData);
        setContext(ctxData);
      })
      .catch(err => console.warn(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfileData();
  }, [activeCustomer.customer_id]);

  if (loading || !profile || !context) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCcw className="animate-spin text-primary-600 mb-3" size={32} />
          <p className="text-sm font-semibold text-slate-500">Loading AI Profile Context...</p>
        </div>
      </MainLayout>
    );
  }

  // Safe metrics calculations
  const totalViewsCount = profile.recently_viewed?.length || 0;
  const totalSearchesCount = profile.recent_searches?.length || 0;
  const totalCartCount = profile.cart_product_ids?.length || 0;

  return (
    <MainLayout showRightSidebar={false}>
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Explore your personalized shopping metrics and context signals</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Account Navigation */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {[
              { label: 'My Dashboard', icon: Grid, active: true },
              { label: 'Orders List', icon: ShoppingBag },
              { label: 'My Wishlist', icon: Heart },
              { label: 'Recent Clicks', icon: Eye },
              { label: 'Preferences', icon: Sliders },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold cursor-pointer border-b border-slate-50 last:border-0 transition-colors
                    ${item.active ? 'text-primary-600 bg-primary-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Side: Profile Dashboard Details */}
        <div className="flex-grow space-y-6 min-w-0">
          
          {/* Card: AI Profile Summary Card */}
          <div className="bg-gradient-to-br from-primary-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-10">
              <User size={120} />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center font-black text-lg">
                {activeCustomer.customer_name[0]}
              </div>
              <div>
                <h2 className="text-xl font-black">{profile.customer_name}</h2>
                <p className="text-xs text-primary-200 mt-0.5">{profile.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Segment: {profile.segment || 'General'}
                  </span>
                  <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award size={10} />
                    VIP Tier
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/10 mt-6 pt-5">
              <div>
                <span className="text-[10px] text-primary-200 font-extrabold uppercase">Views tracked</span>
                <p className="text-lg font-black mt-0.5">{totalViewsCount}</p>
              </div>
              <div>
                <span className="text-[10px] text-primary-200 font-extrabold uppercase">Searches logged</span>
                <p className="text-lg font-black mt-0.5">{totalSearchesCount}</p>
              </div>
              <div>
                <span className="text-[10px] text-primary-200 font-extrabold uppercase">Cart Items</span>
                <p className="text-lg font-black mt-0.5">{totalCartCount}</p>
              </div>
            </div>
          </div>

          {/* Grid: Preferences & Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: Category Interests */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-primary-600" />
                Category Preferences
              </h3>
              <div className="space-y-3">
                {activeCustomer.interests && activeCustomer.interests.length > 0 ? (
                  activeCustomer.interests.map((cat: string, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{cat}</span>
                        <span className="text-primary-600">High Match</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No segment interests mapped.</p>
                )}
              </div>
            </div>

            {/* Box 2: Brand Affinity */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-primary-600" />
                Brand Affinity
              </h3>
              <div className="space-y-3">
                {['Twelve South', 'Logitech', 'Sony', 'BenQ'].map((brand, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{brand}</span>
                      <span className="text-slate-500">{90 - idx * 10}% affinity</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 rounded-full" style={{ width: `${90 - idx * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Raw Search logs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4">Historical Activity Logs</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {profile.recent_searches && profile.recent_searches.length > 0 ? (
                profile.recent_searches.map((search: string, idx: number) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">Searched for "{search}"</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Logged</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 italic">No search events logged yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

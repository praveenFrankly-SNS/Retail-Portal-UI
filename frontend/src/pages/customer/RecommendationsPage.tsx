// ============================================================
// RecommendationsPage — Retail AI Portal (WF-09 + WF-10)
// Full AI recommendation dashboard with:
//   Left: Profile sub-nav + AI Recommendation Engine badge
//   Center: Multiple live recommendation surfaces
//   Right: "Why these recommendations?" + Confidence gauge
// ============================================================

import { useState, useEffect } from 'react';
import {
  Sparkles, RefreshCcw, Star, ShoppingCart, Package, Layers,
  Clock, History, Brain, Shield, ChevronRight, Activity,
  TrendingUp, AlertCircle, Info,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { RecommendationRow } from '../../components/recommendation/RecommendationRow';
import { RecommendationDetailsPanel } from '../../components/recommendation/RecommendationDetailsPanel';
import { getRecommendations } from '../../api/recommendationApi';
import { getCustomerContext } from '../../api/customerApi';
import { useUserStore } from '../../store/userStore';
import { useNavigate } from 'react-router-dom';
import type { RecommendedProduct } from '../../types/recommendation';
import type { CustomerAIContext } from '../../types/customer';

type SubNavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const LEFT_NAV: SubNavItem[] = [
  { id: 'overview',      label: 'Overview',             icon: Star },
  { id: 'home',          label: 'Recommended For You',  icon: Sparkles },
  { id: 'similar',       label: 'Similar Products',     icon: Layers },
  { id: 'complementary', label: 'Complementary Products',icon: Package },
  { id: 'accessories',   label: 'Accessories',          icon: ShoppingCart },
  { id: 'alternatives',  label: 'Alternative Products', icon: RefreshCcw },
  { id: 'viewed',        label: 'Recently Viewed',      icon: Clock },
  { id: 'history',       label: 'Purchase History',     icon: History },
  { id: 'context',       label: 'AI Context',           icon: Brain },
];

function ConfidenceRing({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const textColor = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';
  const label = pct >= 80 ? 'High Confidence' : pct >= 50 ? 'Medium Confidence' : 'Low Confidence';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-black ${textColor}`}>{pct}%</span>
        </div>
      </div>
      <p className={`text-sm font-black mt-2 ${textColor}`}>{label}</p>
      <p className="text-[10px] text-slate-500 text-center mt-1">
        We're very confident you'll like these products
      </p>
      <button className="text-[10px] text-primary-600 font-bold mt-2 hover:underline">
        How confidence is calculated →
      </button>
    </div>
  );
}

export function RecommendationsPage() {
  const { activeCustomer, sessionContext } = useUserStore();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<RecommendedProduct | null>(null);
  const [aiContext, setAiContext]   = useState<CustomerAIContext | null>(null);

  const [homeRecs,       setHomeRecs]        = useState<RecommendedProduct[]>([]);
  const [similarRecs,    setSimilarRecs]      = useState<RecommendedProduct[]>([]);
  const [compRecs,       setCompRecs]         = useState<RecommendedProduct[]>([]);
  const [accessoryRecs,  setAccessoryRecs]    = useState<RecommendedProduct[]>([]);
  const [alternativeRecs,setAlternativeRecs]  = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      getRecommendations(activeCustomer.customer_id, 'HOME',         null, 8, sessionContext),
      getRecommendations(activeCustomer.customer_id, 'PRODUCT_PAGE', null, 8, sessionContext),
      getRecommendations(activeCustomer.customer_id, 'CART',         null, 8, sessionContext),
    ])
      .then(([homeRes, pdpRes, cartRes]) => {
        setHomeRecs(homeRes.recommendations);
        setSimilarRecs(pdpRes.recommendations.filter(r => r.relationship === 'SIMILAR'));
        setAlternativeRecs(pdpRes.recommendations.filter(r => r.relationship === 'ALTERNATIVE'));
        setCompRecs(cartRes.recommendations.filter(r => r.relationship === 'COMPLEMENTARY'));
        setAccessoryRecs(cartRes.recommendations.filter(r => r.relationship === 'ACCESSORY'));
      })
      .catch(err => console.warn(err))
      .finally(() => setLoading(false));
  };

  const fetchContext = () => {
    getCustomerContext(activeCustomer.customer_id)
      .then(setAiContext)
      .catch(err => console.warn(err));
  };

  useEffect(() => {
    fetchAll();
    fetchContext();
  }, [activeCustomer.customer_id, sessionContext]);

  const confidencePct = 92;

  const whyFactors = [
    { icon: TrendingUp, text: 'Viewed 5 headphones in the last 7 days', sub: 'You showed interest in noise cancelling headphones', color: 'text-blue-600 bg-blue-50' },
    { icon: ShoppingCart, text: 'Purchased Bose Earbuds II recently', sub: 'You prefer premium audio quality', color: 'text-green-600 bg-green-50' },
    { icon: Activity, text: 'Frequently searches for audio equipment', sub: 'You search about 2× more than average users', color: 'text-purple-600 bg-purple-50' },
    { icon: Star, text: 'Interest in travel & productivity', sub: 'Travel tech and productivity items match your interests', color: 'text-amber-600 bg-amber-50' },
    { icon: Brain, text: 'Price preference: Mid to Premium', sub: 'You usually buy products between ₹5,000–₹30,000', color: 'text-indigo-600 bg-indigo-50' },
    { icon: TrendingUp, text: 'High engagement with recommendations', sub: 'You click on recommended items 35% more', color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <MainLayout showRightSidebar={false}>
      <div className="flex gap-6 min-h-[calc(100vh-128px)]">

        {/* ── LEFT SIDEBAR: Profile + Sub-nav ───────────────────── */}
        <aside className="w-64 shrink-0 space-y-4">

          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-black text-lg flex items-center justify-center shrink-0">
              {activeCustomer.customer_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm truncate">{activeCustomer.customer_name}</p>
              <span className="inline-block bg-primary-50 text-primary-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-primary-100">
                Current
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{activeCustomer.persona_label}</p>
            </div>
          </div>

          {/* Sub-navigation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <nav className="divide-y divide-slate-50">
              {LEFT_NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    activeSection === id
                      ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className={activeSection === id ? 'text-primary-500' : 'text-slate-400'} />
                    <span className="text-xs">{label}</span>
                  </div>
                  <ChevronRight size={12} className="text-slate-300" />
                </button>
              ))}
            </nav>
          </div>

          {/* AI Recommendation Engine Badge */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={15} className="text-primary-600" />
              <span className="text-xs font-black text-slate-900">AI Recommendation Engine</span>
              <span className="ml-auto bg-green-100 text-green-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
              Personalized results based on your behavior and preferences.
            </p>
            <button className="text-[10px] text-primary-600 font-bold hover:underline">
              How it works →
            </button>
          </div>
        </aside>

        {/* ── CENTER: Recommendation Surfaces ────────────────────── */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="text-primary-600 animate-pulse" size={22} />
                Recommended For You
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Handpicked products we think you'll love
              </p>
            </div>
            <button
              id="refresh-recs-btn"
              onClick={() => { fetchAll(); fetchContext(); }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 transition-colors"
            >
              <RefreshCcw size={12} />
              Refresh
            </button>
          </div>

          {/* HOME recs */}
          <RecommendationRow
            id="recs-home"
            title="Recommended For You"
            subtitle="Handpicked products we think you'll love"
            items={homeRecs}
            isAI
            isLoading={loading}
            onInfoClick={(p) => setSelectedProduct(p)}
            onViewAll={() => navigate('/catalog')}
          />

          {/* SIMILAR recs */}
          {(loading || similarRecs.length > 0) && (
            <RecommendationRow
              id="recs-similar"
              title="Similar Products"
              subtitle="Products similar to items you've viewed or purchased"
              items={similarRecs}
              isAI
              isLoading={loading}
              onInfoClick={(p) => setSelectedProduct(p)}
              onViewAll={() => navigate('/catalog')}
            />
          )}

          {/* COMPLEMENTARY recs */}
          {(loading || compRecs.length > 0) && (
            <RecommendationRow
              id="recs-complementary"
              title="Complementary Products (Complete Your Setup)"
              subtitle="Complete your setup with these perfect add-ons"
              items={compRecs}
              isAI
              isLoading={loading}
              onInfoClick={(p) => setSelectedProduct(p)}
              onViewAll={() => navigate('/catalog')}
            />
          )}

          {/* ACCESSORY recs */}
          {(loading || accessoryRecs.length > 0) && (
            <RecommendationRow
              id="recs-accessories"
              title="Accessories You Might Need"
              subtitle="Essential accessories for a better experience"
              items={accessoryRecs}
              isAI
              isLoading={loading}
              onInfoClick={(p) => setSelectedProduct(p)}
              onViewAll={() => navigate('/catalog')}
            />
          )}

          {/* ALTERNATIVE recs */}
          {(loading || alternativeRecs.length > 0) && (
            <RecommendationRow
              id="recs-alternatives"
              title="Alternative Products"
              subtitle="Different options that may suit you"
              items={alternativeRecs}
              isAI
              isLoading={loading}
              onInfoClick={(p) => setSelectedProduct(p)}
              onViewAll={() => navigate('/catalog')}
            />
          )}
        </div>

        {/* ── RIGHT SIDEBAR: Why Recommendations + Confidence ─────── */}
        <aside className="w-72 shrink-0 space-y-5 hidden xl:block">

          {/* Why these recommendations? */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-slate-900">Why these recommendations?</h4>
              <span className="bg-primary-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">AI</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-4">Based on your activity and preferences</p>
            <div className="space-y-3">
              {whyFactors.map(({ icon: Icon, text, sub, color }, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={13} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">{text}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation Confidence */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h4 className="text-sm font-black text-slate-900 mb-4">Recommendation Confidence</h4>
            <ConfidenceRing pct={confidencePct} />
          </div>

          {/* AI Context Summary */}
          {aiContext && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h4 className="text-sm font-black text-slate-900 mb-3">AI Context</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Top Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {aiContext.top_interests?.map((t: string) => (
                      <span key={t} className="bg-primary-50 text-primary-700 text-[9px] font-bold px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Price Preference</p>
                  <p className="text-slate-700 font-semibold">{aiContext.price_preference}</p>
                </div>
                <div className="border-t border-slate-100 pt-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Engagement Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${aiContext.engagement_score}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-green-600">{aiContext.engagement_score}/100</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Need something else? */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
            <h4 className="text-sm font-black text-slate-900 mb-1">Need something else?</h4>
            <p className="text-xs text-slate-500 mb-3">
              Tell our AI what you're looking for and get personalized suggestions.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors"
            >
              <Sparkles size={13} />
              Ask AI Assistant
            </button>
          </div>
        </aside>
      </div>

      {/* Recommendation details slide-out panel (WF-10) */}
      <RecommendationDetailsPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </MainLayout>
  );
}

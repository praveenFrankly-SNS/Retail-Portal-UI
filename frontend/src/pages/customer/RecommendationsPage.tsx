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
      <div className="space-y-8 max-w-full">

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
            title="Personalized Picks"
            subtitle={`AI recommendations tailored for ${activeCustomer.customer_name}`}
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

      {/* Slide-over details panel */}
      {selectedProduct && (
        <RecommendationDetailsPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </MainLayout>
  );
}

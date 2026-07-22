// ============================================================
// RecommendationsPage — Retail AI Portal (WF-09 + WF-10)
// Standalone AI exploration page showing all recommendation
// surfaces with context details and transparency slide-out panel.
// Wraps inside the unified MainLayout.
// ============================================================

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { RecommendationRow } from '../../components/recommendation/RecommendationRow';
import { RecommendationPanel } from '../../components/recommendation/RecommendationPanel';
import { getRecommendations } from '../../api/recommendationApi';
import { getCustomerContext } from '../../api/customerApi';
import { useUserStore } from '../../store/userStore';
import type { RecommendedProduct } from '../../types/recommendation';
import type { CustomerAIContext } from '../../types/customer';

export function RecommendationsPage() {
  const { activeCustomer, sessionContext } = useUserStore();

  const [selectedProduct, setSelectedProduct] = useState<RecommendedProduct | null>(null);
  const [aiContext, setAiContext] = useState<CustomerAIContext | null>(null);
  
  const [homeRecs, setHomeRecs] = useState<RecommendedProduct[]>([]);
  const [similarRecs, setSimilarRecs] = useState<RecommendedProduct[]>([]);
  const [compRecs, setCompRecs] = useState<RecommendedProduct[]>([]);
  const [accessoryRecs, setAccessoryRecs] = useState<RecommendedProduct[]>([]);
  const [alternativeRecs, setAlternativeRecs] = useState<RecommendedProduct[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchRecommendations = () => {
    setLoading(true);
    
    // Concurrent surface requests to live endpoint
    Promise.all([
      getRecommendations(activeCustomer.customer_id, 'HOME', null, 8, sessionContext),
      getRecommendations(activeCustomer.customer_id, 'PRODUCT_PAGE', null, 8, sessionContext),
      getRecommendations(activeCustomer.customer_id, 'CART', null, 8, sessionContext)
    ])
      .then(([homeRes, pdpRes, cartRes]) => {
        setHomeRecs(homeRes.recommendations);
        
        // Split PDP recommendations by relationship category
        setSimilarRecs(pdpRes.recommendations.filter(r => r.relationship === 'SIMILAR'));
        setAlternativeRecs(pdpRes.recommendations.filter(r => r.relationship === 'ALTERNATIVE'));
        
        // Split Cart recommendations by relationship category
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
    fetchRecommendations();
    fetchContext();
  }, [activeCustomer.customer_id, sessionContext]);

  return (
    <MainLayout showRightSidebar={false}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="text-primary-600 animate-pulse" size={24} />
            AI Recommendation Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Explore personalized suggestions across shopping touchpoints</p>
        </div>
        
        <button
          onClick={() => { fetchRecommendations(); fetchContext(); }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 transition-colors"
        >
          <RefreshCcw size={13} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Context Explanation */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
              Persona Parameters
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Name</span>
                <p className="text-sm font-black text-slate-800 mt-0.5">{activeCustomer.customer_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{activeCustomer.persona_label}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Segment Target</span>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  Category: {activeCustomer.interests?.join(', ') || 'General'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1.5">
                  Live Context Signals
                </span>
                
                <div className="space-y-2 text-xs">
                  {aiContext ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Searches</span>
                        <span className="font-bold text-slate-800">{(aiContext as any).recent_searches?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Views</span>
                        <span className="font-bold text-slate-800">{(aiContext as any).recent_views?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cart items</span>
                        <span className="font-bold text-slate-800">{(aiContext as any).cart?.length || 0}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 italic">Loading telemetry...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Recommendation Rows List */}
        <div className="flex-1 space-y-10 min-w-0">
          
          {/* HOME recommendations */}
          <RecommendationRow
            id="home"
            title="Landing Home recommendations"
            subtitle="Recommendations shown on customer homepage based on category fit"
            items={homeRecs}
            isAI
            isLoading={loading}
            onInfoClick={(p) => setSelectedProduct(p)}
          />

          {/* PDP Similar recommendations */}
          {similarRecs.length > 0 && (
            <RecommendationRow
              id="similar"
              title="Similar Alternatives"
              subtitle="Alternatives shown on PDP detail page matching current category"
              items={similarRecs}
              isAI
              isLoading={loading}
              onInfoClick={(p) => setSelectedProduct(p)}
            />
          )}

          {/* CART complementary recommendations */}
          {compRecs.length > 0 && (
            <RecommendationRow
              id="complementary"
              title="Frequently Bought Together"
              subtitle="Complementary suggestions generated for the cart"
              items={compRecs}
              isAI
              isLoading={loading}
              onInfoClick={(p) => setSelectedProduct(p)}
            />
          )}

          {/* CART accessory recommendations */}
          {accessoryRecs.length > 0 && (
            <RecommendationRow
              id="accessory"
              title="Product Accessories"
              subtitle="Required additions or accessories recommended"
              items={accessoryRecs}
              isAI
              isLoading={loading}
              onInfoClick={(p) => setSelectedProduct(p)}
            />
          )}

          {/* PDP Alternatives recommendations */}
          {alternativeRecs.length > 0 && (
            <RecommendationRow
              id="alternative"
              title="Alternative Selections"
              subtitle="Options other shoppers browsed alongside these catalog entries"
              items={alternativeRecs}
              isAI
              isLoading={loading}
              onInfoClick={(p) => setSelectedProduct(p)}
            />
          )}
        </div>
      </div>

      <RecommendationPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </MainLayout>
  );
}

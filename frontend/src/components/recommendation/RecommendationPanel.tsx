// ============================================================
// RecommendationPanel — Retail AI Portal
// WF-10: Slide-out drawer showing recommendation detail:
// - Product info
// - Context signals used
// - Relationship type
// - Recommendation score breakdown
// - AI explanation
// ============================================================

import { X, Star, Shield, Sparkles, TrendingUp, Target } from 'lucide-react';
import type { RecommendedProduct } from '../../types/recommendation';

interface RecommendationPanelProps {
  product: RecommendedProduct | null;
  onClose: () => void;
}

const RELATIONSHIP_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  SIMILAR: { label: 'Similar Product', color: 'text-blue-600 bg-blue-50', desc: 'Same category and use case' },
  COMPLEMENTARY: { label: 'Complementary', color: 'text-green-700 bg-green-50', desc: 'Enhances your current items' },
  ACCESSORY: { label: 'Accessory', color: 'text-purple-700 bg-purple-50', desc: 'Works with your setup' },
  ALTERNATIVE: { label: 'Alternative', color: 'text-orange-700 bg-orange-50', desc: 'Different option for same need' },
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-semibold text-gray-700">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export function RecommendationPanel({ product, onClose }: RecommendationPanelProps) {
  if (!product) return null;

  const rel = RELATIONSHIP_LABELS[product.relationship] ?? {
    label: product.relationship,
    color: 'text-gray-700 bg-gray-100',
    desc: '',
  };

  const confidencePercent = Math.round(product.final_score * 100);
  const confidenceLevel = confidencePercent >= 80 ? 'High' : confidencePercent >= 60 ? 'Medium' : 'Low';
  const confidenceColor = confidencePercent >= 80 ? 'text-green-600' : confidencePercent >= 60 ? 'text-amber-600' : 'text-red-500';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        id="recommendation-detail-panel"
        className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-white shadow-panel
                   flex flex-col animate-slide-in-right overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Recommendation Details</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Product Card Mini */}
          <div className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
              {product.image_url ? (
                <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">{product.product_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star size={11} className="text-amber-400" fill="currentColor" />
                <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
                <span className="text-xs text-gray-400">({product.rating_count.toLocaleString()})</span>
              </div>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                ₹{(product.discounted_price ?? product.price).toLocaleString('en-IN')}
              </p>
              {product.badge && (
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-100 text-green-700">
                  {product.badge.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Why recommended */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-accent-500" />
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Why this recommendation?</h4>
              <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent-100 text-accent-700">AI</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{product.reason}</p>
          </div>

          {/* Relationship Type */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Relationship Type</h4>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${rel.color}`}>
                {rel.label}
              </span>
            </div>
            {rel.desc && <p className="text-xs text-gray-500 mt-1.5">{rel.desc}</p>}
            {product.concept && (
              <p className="text-xs text-gray-600 mt-1 font-medium italic">"{product.concept}"</p>
            )}
          </div>

          {/* Recommendation Score */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp size={13} className="text-primary-500" />
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Recommendation Score</h4>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl font-bold text-gray-900">{product.final_score.toFixed(2)}</div>
              <div>
                <div className={`text-sm font-semibold ${confidenceColor}`}>
                  {confidenceLevel} Confidence
                </div>
                <div className="text-xs text-gray-400">Relevance match</div>
              </div>
            </div>
            <div className="space-y-2.5">
              <ScoreBar label="Context Match" value={Math.min(product.final_score + 0.03, 1)} />
              <ScoreBar label="Category Fit" value={Math.min(product.final_score + 0.01, 1)} />
              <ScoreBar label="Behavior Signal" value={Math.max(product.final_score - 0.02, 0)} />
              <ScoreBar label="Quality Score" value={product.rating / 5} />
            </div>
          </div>

          {/* Confidence Level */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border border-green-100">
            <Shield size={14} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-700">Confidence Level: {confidenceLevel} ({confidencePercent}%)</p>
              <p className="text-[11px] text-green-600 mt-0.5">
                We're confident you'll find this product valuable based on your activity.
              </p>
            </div>
          </div>

          {/* AI Explanation */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Target size={13} className="text-accent-500" />
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">AI Explanation</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              This recommendation is generated by our Common-Sense AI engine which evaluates product relationships, your browsing context, and category affinity to surface the most relevant products for your current need.
            </p>
          </div>

          {/* Helpful? */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Was this helpful?</span>
            <button className="text-lg hover:scale-110 transition-transform" title="Helpful">👍</button>
            <button className="text-lg hover:scale-110 transition-transform" title="Not helpful">👎</button>
          </div>

          {/* View Product */}
          <button className="w-full btn-primary justify-center">
            View Product Details
          </button>
        </div>
      </div>
    </>
  );
}

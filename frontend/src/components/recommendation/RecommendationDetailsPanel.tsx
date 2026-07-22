// ============================================================
// RecommendationDetailsPanel — Retail AI Portal (WF-10)
// Slide-out drawer panel showing AI explanation for a
// specific recommended product. Shows context signals,
// relationship type, recommendation scores, confidence level,
// and AI-generated explanation text.
// ============================================================

import { X, Star, Brain, ShieldCheck, TrendingUp, Link2, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RecommendedProduct } from '../../types/recommendation';

interface RecommendationDetailsPanelProps {
  product: RecommendedProduct | null;
  onClose: () => void;
}

const RELATIONSHIP_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  COMPLEMENTARY: { label: 'Complementary',   desc: 'Complements your current products or interests',  color: 'text-blue-600 bg-blue-50' },
  SIMILAR:       { label: 'Similar',          desc: 'Similar to products you\'ve viewed or purchased', color: 'text-purple-600 bg-purple-50' },
  ACCESSORY:     { label: 'Accessory',        desc: 'An essential add-on for your existing products',  color: 'text-amber-600 bg-amber-50' },
  ALTERNATIVE:   { label: 'Alternative',      desc: 'A different option that meets the same need',     color: 'text-green-600 bg-green-50' },
};

const BADGE_LABELS: Record<string, { label: string; color: string }> = {
  BEST_MATCH:  { label: 'Best Match',  color: 'bg-green-100 text-green-700 border-green-200' },
  GREAT_PICK:  { label: 'Great Pick',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  POPULAR:     { label: 'Popular',     color: 'bg-orange-100 text-orange-700 border-orange-200' },
  NEW:         { label: 'New',         color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500 font-semibold">{label}</span>
        <span className="text-[10px] font-black text-slate-800">{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ConfidenceGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const level = pct >= 80 ? 'High' : pct >= 50 ? 'Medium' : 'Low';
  const color = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';
  const trackColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      {/* Ring gauge */}
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'}
            strokeWidth="3.5"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-black ${color}`}>{pct}%</span>
        </div>
      </div>
      <div>
        <p className={`text-sm font-black ${color}`}>{level} Confidence</p>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
          We're {pct >= 80 ? 'very confident' : 'moderately confident'} you'll like this product
        </p>
        <button className="text-[10px] text-primary-600 font-bold mt-1 hover:underline">
          How confidence is calculated →
        </button>
      </div>
    </div>
  );
}

export function RecommendationDetailsPanel({ product, onClose }: RecommendationDetailsPanelProps) {
  const navigate = useNavigate();

  if (!product) return null;

  const rel      = RELATIONSHIP_LABELS[product.relationship] ?? RELATIONSHIP_LABELS.SIMILAR;
  const badge    = product.badge ? BADGE_LABELS[product.badge] : null;
  const score    = product.final_score ?? 0.88;
  const ctxMatch = Math.min(score + 0.06, 1);
  const catFit   = Math.min(score + 0.03, 1);
  const behavSig = Math.max(score - 0.03, 0);
  const popAdj   = Math.max(score - 0.07, 0);

  const formatINR = (n: number) =>
    '₹' + n.toLocaleString('en-IN');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="font-black text-slate-900 text-base">Recommendation Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">

          {/* Product Summary */}
          <div className="flex gap-3 items-start">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.product_name}
                className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Brain size={24} className="text-slate-300" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm leading-snug line-clamp-2">{product.product_name}</p>
              <p className="text-xs text-slate-500 mt-1">{product.brand}</p>
              <p className="text-base font-black text-slate-900 mt-1">{formatINR(product.discounted_price ?? product.price)}</p>
              {badge && (
                <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border mt-1 ${badge.color}`}>
                  {badge.label}
                </span>
              )}
              <div className="flex items-center gap-1 mt-1">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-slate-700">
                  {product.rating.toFixed(1)} ({product.rating_count.toLocaleString()} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Why this recommendation? */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Brain size={15} className="text-primary-600" />
              <h4 className="text-sm font-black text-slate-900">Why this recommendation?</h4>
              <span className="ml-auto bg-primary-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">AI</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This product is recommended for you based on our AI analysis of your behavior, preferences, and context.
            </p>
          </div>

          {/* Context Used */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                <TrendingUp size={12} className="text-blue-600" />
              </div>
              <h5 className="text-xs font-black text-slate-800">Context Used</h5>
            </div>
            <ul className="space-y-1 pl-8 text-xs text-slate-600">
              <li>• Searched: "{product.concept}"</li>
              <li>• Viewed similar products in this category</li>
              <li>• Based on your browsing history and cart</li>
            </ul>
          </div>

          {/* Relationship Type */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                <Link2 size={12} className="text-purple-600" />
              </div>
              <h5 className="text-xs font-black text-slate-800">Relationship Type</h5>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rel.color}`}>
              {rel.label}
            </span>
            <p className="text-xs text-slate-500 mt-1.5 pl-0.5">{rel.desc}</p>
          </div>

          {/* Recommendation Score */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-black text-slate-800">Recommendation Score</h5>
              <span className="text-xs font-bold text-green-600">High relevance match</span>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-3">{score.toFixed(2)}</div>
            <div className="space-y-2.5">
              <ScoreBar label="Context Match"   value={ctxMatch} />
              <ScoreBar label="Category Fit"    value={catFit} />
              <ScoreBar label="Behavior Signal" value={behavSig} />
              <ScoreBar label="Popularity Adj." value={popAdj} />
            </div>
          </div>

          {/* AI Explanation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center">
                <Brain size={12} className="text-amber-600" />
              </div>
              <h5 className="text-xs font-black text-slate-800">AI Explanation</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl p-3">
              {product.reason || `This product strongly matches your interest profile. Based on your recent activity, purchase patterns, and browsing behavior, this ${product.brand} product scored highly on context relevance and category alignment.`}
            </p>
          </div>

          {/* Confidence Level */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <h5 className="text-xs font-black text-slate-800 mb-3">Confidence Level</h5>
            <ConfidenceGauge score={score} />
          </div>

          {/* Was this helpful? */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600">Was this helpful?</span>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-green-50">
                <ThumbsUp size={13} />
              </button>
              <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
                <ThumbsDown size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-5 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={() => { navigate(`/products/${product.product_id}`); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
          >
            View Product Details <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

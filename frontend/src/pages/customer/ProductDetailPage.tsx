// ============================================================
// ProductDetailPage — Retail AI Portal (WF-06)
// Displays full product details, connects Add to Cart store events, 
// and triggers PRODUCT_PAGE recommendations (Similar, Complementary, 
// Accessory, Alternative) grouped by relationship type.
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '../../services/api';
import { NavBar } from '../../components/layout/NavBar';
import { RecommendationRow } from '../../components/recommendation/RecommendationRow';
import { RecommendationPanel } from '../../components/recommendation/RecommendationPanel';
import { getRecommendations } from '../../api/recommendationApi';
import { useCartStore } from '../../store/cartStore';
import { useUserStore } from '../../store/userStore';
import {
  ArrowLeft,
  ShareNetwork,
  CheckCircle,
  SpinnerGap,
  Sparkle,
  Truck,
  ArrowCounterClockwise,
  SealCheck,
  House,
  CaretRight,
  Star as StarIcon
} from '@phosphor-icons/react';
import { ShoppingCart } from 'lucide-react';
import type { RecommendedProduct } from '../../types/recommendation';

function parseFeatures(text: string | null | undefined): string[] {
  if (!text) return [];
  const parts = text
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && s.length < 120);
  return parts.slice(0, 6);
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { activeCustomer, sessionContext, addViewEvent } = useUserStore();
  const addItem = useCartStore((s) => s.addItem);

  const [selectedProduct, setSelectedProduct] = useState<RecommendedProduct | null>(null);
  const [similarRecs, setSimilarRecs] = useState<RecommendedProduct[]>([]);
  const [compRecs, setCompRecs] = useState<RecommendedProduct[]>([]);
  const [accessoryRecs, setAccessoryRecs] = useState<RecommendedProduct[]>([]);
  const [altRecs, setAltRecs] = useState<RecommendedProduct[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);

  // Fetch product detail query
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => searchAPI.getProduct(id!),
    enabled: !!id,
  });

  // Track product view in session context & server events
  useEffect(() => {
    if (id) {
      addViewEvent(id);
    }
  }, [id]);

  // Fetch PDP recommendations when active customer or viewed product changes
  useEffect(() => {
    if (!id) return;
    setRecsLoading(true);
    getRecommendations(activeCustomer.customer_id, 'PRODUCT_PAGE', id, 12, sessionContext)
      .then((res) => {
        // PDP logic: ensure recommended_product_id != current_product_id
        const filtered = res.recommendations.filter((r) => r.product_id !== id);
        
        // Group recommendations by relationship mappings
        setSimilarRecs(filtered.filter((r) => r.relationship === 'SIMILAR'));
        setCompRecs(filtered.filter((r) => r.relationship === 'COMPLEMENTARY'));
        setAccessoryRecs(filtered.filter((r) => r.relationship === 'ACCESSORY'));
        setAltRecs(filtered.filter((r) => r.relationship === 'ALTERNATIVE'));
      })
      .catch((err) => console.warn(err))
      .finally(() => setRecsLoading(false));
  }, [id, activeCustomer.customer_id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <SpinnerGap size={40} className="text-primary-600 animate-spin" />
          <p className="text-sm font-bold text-slate-500">Fetching Product Details...</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-3xl max-w-sm shadow-card">
          <span className="text-4xl">⚠️</span>
          <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">Product Not Found</h3>
          <p className="text-sm text-slate-500 mb-6">This item is not in the catalog index.</p>
          <button
            onClick={() => navigate('/catalog')}
            className="btn-primary"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  const rawScore = product.similarity_score;
  const matchPct = rawScore ? Math.round(rawScore * 100) : null;
  const keyFeatures = parseFeatures(product.attribute_summary);
  const descriptionText = product.description || product.attribute_summary || 'No description available.';

  const handleAddToCart = () => {
    // Add to Zustand Cart
    addItem({
      product_id: product.product_id,
      product_name: product.product_name || 'Generic Product',
      brand: product.brand || 'Generic',
      price: product.price || 0,
      image_url: product.image_url || `https://picsum.photos/seed/${absHash(product.product_id)}/400/400`,
      quantity: 1,
      availability_status: 'IN_STOCK',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavBar />

      {/* ── Breadcrumb + Back ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-4 w-full flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors">
            <House size={16} weight="fill" />
          </button>
          <CaretRight size={14} className="text-slate-300" />
          <button onClick={() => navigate('/catalog')} className="hover:text-slate-900 transition-colors font-medium">
            Catalog
          </button>
          {product.category && (
            <>
              <CaretRight size={14} className="text-slate-300" />
              <span className="font-medium">{product.category}</span>
            </>
          )}
          <CaretRight size={14} className="text-slate-300" />
          <span className="font-semibold text-slate-900 truncate max-w-[200px]">{product.product_name}</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={16} weight="bold" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all">
            <ShareNetwork size={16} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* ── Main Details ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 pb-20 w-full flex flex-col gap-10">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row gap-10 shadow-sm">
          
          {/* Left: Images */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="aspect-[4/3] w-full rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden relative">
              <img
                src={product.image_url || `https://picsum.photos/seed/${absHash(product.product_id)}/600/400`}
                alt={product.product_name || 'Product Image'}
                className="w-full h-full object-cover"
              />
              {matchPct && (
                <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md">
                  <Sparkle size={12} className="animate-pulse" />
                  <span>{matchPct}% AI Match</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex-1 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-extrabold text-primary-600 uppercase tracking-widest">
                {product.brand || 'ACCELERATOR DESIGN'}
              </p>
              <h2 className="text-2xl font-black text-slate-900 mt-1 leading-tight">
                {product.product_name}
              </h2>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-amber-500">
                  <StarIcon size={16} weight="fill" />
                  <span className="text-sm font-bold text-slate-800">
                    {product.avg_rating || '4.5'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  {product.review_count || 120} reviews
                </span>
                <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  In Stock
                </span>
              </div>

              <div className="border-t border-slate-100 mt-6 pt-5">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {descriptionText}
                </p>
              </div>

              {keyFeatures.length > 0 && (
                <div className="border-t border-slate-100 mt-5 pt-5">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Key Features</h4>
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {keyFeatures.map((f, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="text-primary-500 font-bold shrink-0 mt-0.5">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Buying Options */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-500">Price</span>
                <span className="text-xl font-black text-slate-900">
                  ₹{(product.price || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-primary-200 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* ── Product Recommendations Surfaces ─────────────────────── */}
        <div className="space-y-10">
          {similarRecs.length > 0 && (
            <RecommendationRow
              id="pdp-similar"
              title="Similar Products"
              subtitle="Alternative models matching this product segment"
              items={similarRecs}
              isAI
              isLoading={recsLoading}
              onInfoClick={(p) => setSelectedProduct(p)}
            />
          )}

          {compRecs.length > 0 && (
            <RecommendationRow
              id="pdp-complementary"
              title="Complete Your Setup"
              subtitle="Commonly bundled add-ons frequently bought with this product"
              items={compRecs}
              isAI
              isLoading={recsLoading}
              onInfoClick={(p) => setSelectedProduct(p)}
            />
          )}

          {accessoryRecs.length > 0 && (
            <RecommendationRow
              id="pdp-accessories"
              title="Essential Accessories"
              subtitle="Add accessory attachments designed for this model"
              items={accessoryRecs}
              isAI
              isLoading={recsLoading}
              onInfoClick={(p) => setSelectedProduct(p)}
            />
          )}

          {altRecs.length > 0 && (
            <RecommendationRow
              id="pdp-alternatives"
              title="Alternative Choices"
              subtitle="Options you might want to review"
              items={altRecs}
              isAI
              isLoading={recsLoading}
              onInfoClick={(p) => setSelectedProduct(p)}
            />
          )}
        </div>

        {/* ── Value Proposition Footer Strip ───────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-slate-100 mt-4">
          <div className="py-8 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck size={24} weight="fill" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Free Shipping</h4>
              <p className="text-xs text-slate-500 mt-1">On orders over ₹3,000</p>
            </div>
          </div>
          <div className="py-8 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <ArrowCounterClockwise size={24} weight="fill" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">7-Day Returns</h4>
              <p className="text-xs text-slate-500 mt-1">No hassle returns</p>
            </div>
          </div>
          <div className="py-8 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <SealCheck size={24} weight="fill" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">1 Year Warranty</h4>
              <p className="text-xs text-slate-500 mt-1">Full brand coverage</p>
            </div>
          </div>
        </div>
      </main>

      <RecommendationPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}

function absHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

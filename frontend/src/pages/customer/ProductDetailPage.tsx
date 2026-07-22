// ============================================================
// ProductDetailPage — Retail AI Portal (WF-06)
// Full product details: image gallery, product info, specs,
// reviews, and LIVE recommendation surfaces:
//   • Why we recommend this (right panel)
//   • Customers also viewed
//   • Complete Your Setup (Frequently Bought Together)
//   • Similar Products
//   • Alternative Products
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Star, ShoppingCart, Heart, Share2,
  CheckCircle, Truck, RefreshCcw, Shield, Sparkles,
  Brain, ChevronRight, Minus, Plus, Package, Layers,
  ZoomIn,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { RecommendationRow } from '../../components/recommendation/RecommendationRow';
import { RecommendationDetailsPanel } from '../../components/recommendation/RecommendationDetailsPanel';
import { getProductDetail } from '../../api/productApi';
import { getRecommendations } from '../../api/recommendationApi';
import { useCartStore } from '../../store/cartStore';
import { useUserStore } from '../../store/userStore';
import type { RecommendedProduct } from '../../types/recommendation';
import type { ProductDetail } from '../../types/product';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&h=500&fit=crop',
];

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>
      <span className="text-sm text-slate-500">({count.toLocaleString()} reviews)</span>
    </div>
  );
}

function RatingBar({ stars, pct }: { stars: number; pct: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-600 w-4 shrink-0">{stars}</span>
      <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-400 w-6 text-right">{pct}%</span>
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { activeCustomer, sessionContext, addViewEvent } = useUserStore();
  const addItem = useCartStore((s) => s.addItem);

  const [product,      setProduct]       = useState<ProductDetail | null>(null);
  const [prodLoading,  setProdLoading]   = useState(true);
  const [quantity,     setQuantity]      = useState(1);
  const [activeImage,  setActiveImage]   = useState(0);
  const [activeTab,    setActiveTab]     = useState<'overview' | 'specs' | 'reviews' | 'qa'>('overview');
  const [addedToCart,  setAddedToCart]   = useState(false);
  const [wishlist,     setWishlist]      = useState(false);

  // Recommendation state
  const [selectedRec,    setSelectedRec]    = useState<RecommendedProduct | null>(null);
  const [similarRecs,    setSimilarRecs]    = useState<RecommendedProduct[]>([]);
  const [compRecs,       setCompRecs]       = useState<RecommendedProduct[]>([]);
  const [accessoryRecs,  setAccessoryRecs]  = useState<RecommendedProduct[]>([]);
  const [altRecs,        setAltRecs]        = useState<RecommendedProduct[]>([]);
  const [whyRecs,        setWhyRecs]        = useState<RecommendedProduct[]>([]);
  const [recsLoading,    setRecsLoading]    = useState(true);

  // Load product detail
  useEffect(() => {
    if (!id) return;
    setProdLoading(true);
    getProductDetail(id)
      .then(setProduct)
      .catch(console.warn)
      .finally(() => setProdLoading(false));
    addViewEvent(id);
  }, [id]);

  // Load recommendations when product or customer changes
  useEffect(() => {
    if (!id) return;
    setRecsLoading(true);
    Promise.all([
      getRecommendations(activeCustomer.customer_id, 'PRODUCT_PAGE', id, 8, sessionContext),
      getRecommendations(activeCustomer.customer_id, 'HOME', null, 3, sessionContext),
    ])
      .then(([pdpRes, homeRes]) => {
        const recs = pdpRes.recommendations;
        setSimilarRecs(recs.filter(r => r.relationship === 'SIMILAR').slice(0, 6));
        setCompRecs(recs.filter(r => r.relationship === 'COMPLEMENTARY').slice(0, 4));
        setAccessoryRecs(recs.filter(r => r.relationship === 'ACCESSORY').slice(0, 6));
        setAltRecs(recs.filter(r => r.relationship === 'ALTERNATIVE').slice(0, 6));
        setWhyRecs(homeRes.recommendations.slice(0, 3));
      })
      .catch(console.warn)
      .finally(() => setRecsLoading(false));
  }, [id, activeCustomer.customer_id, sessionContext]);

  const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        product_id:          product.product_id,
        product_name:        product.product_name,
        brand:               product.brand,
        price:               product.price,
        discounted_price:    product.discounted_price,
        image_url:           product.image_url || images[0],
        quantity:            1,
        availability_status: product.availability_status,
        color:               product.color_options?.[0],
      });
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const images = product?.images?.length ? product.images : PLACEHOLDER_IMAGES;
  const discount = product?.discount_percent || (
    product?.discounted_price && product?.price
      ? Math.round((1 - product.discounted_price / product.price) * 100)
      : null
  );
  const reviewBreakdown = product?.reviews_summary?.breakdown ?? { 5: 72, 4: 20, 3: 6, 2: 1, 1: 1 };

  if (prodLoading) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading product...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">Product not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary-600 font-bold">
            ← Go back
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightSidebar={false}>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
        <button onClick={() => navigate('/')} className="hover:text-primary-600 transition-colors">Home</button>
        <ChevronRight size={12} />
        <button onClick={() => navigate('/catalog')} className="hover:text-primary-600 transition-colors">
          {product.category_path?.split(' > ')[0] || 'Catalog'}
        </button>
        {product.category_path?.includes('>') && (
          <>
            <ChevronRight size={12} />
            <span className="hover:text-primary-600 transition-colors cursor-pointer">
              {product.category_path.split(' > ')[1]}
            </span>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-slate-800 font-semibold truncate max-w-[200px]">{product.product_name}</span>
      </nav>

      <div className="flex gap-8 mb-10">

        {/* ── LEFT: Image Gallery ─────────────────────────────── */}
        <div className="w-96 shrink-0">
          {/* Thumbnails + Main Image */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            <div className="flex flex-col gap-2">
              {images.slice(0, 5).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === idx ? 'border-primary-500 shadow-md' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
              <img
                src={images[activeImage] || PLACEHOLDER_IMAGES[0]}
                alt={product.product_name}
                className="w-full h-80 object-contain p-4"
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[0]; }}
              />
              {product.badge && (
                <span className="absolute top-3 left-3 bg-green-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                  {product.badge === 'BEST_SELLER' ? 'Best Seller' : product.badge.replace('_', ' ')}
                </span>
              )}
              <button className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn size={15} />
              </button>
            </div>
          </div>

          {/* Share / Wishlist */}
          <div className="flex gap-2 mt-3">
            <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <Share2 size={13} /> Share
            </button>
            <button
              onClick={() => setWishlist(v => !v)}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                wishlist
                  ? 'text-red-600 border-red-200 bg-red-50'
                  : 'text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart size={13} className={wishlist ? 'fill-red-500' : ''} />
              {wishlist ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>
        </div>

        {/* ── CENTER: Product Info ───────────────────────────── */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2">
            {product.product_name}
          </h1>

          {/* Rating */}
          <div className="mb-3">
            <StarRating rating={product.rating} count={product.rating_count} />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black text-slate-900">
              {formatINR(product.discounted_price ?? product.price)}
            </span>
            {product.discounted_price && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatINR(product.price)}</span>
                {discount && (
                  <span className="text-sm font-extrabold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          {/* Availability + Delivery */}
          <div className="flex flex-wrap items-center gap-3 mb-5 text-xs">
            <span className={`flex items-center gap-1 font-bold ${
              product.availability_status === 'IN_STOCK' ? 'text-green-600' : 'text-red-500'
            }`}>
              <CheckCircle size={13} />
              {product.availability_status === 'IN_STOCK' ? 'In Stock' : product.availability_status.replace('_', ' ')}
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Truck size={13} className="text-green-500" /> FREE delivery
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Shield size={13} className="text-blue-500" /> 1 Year Warranty
            </span>
          </div>

          {/* Color Options */}
          {product.color_options && product.color_options.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-slate-700 mb-2">Color: {product.color_options[0]}</p>
              <div className="flex gap-2">
                {product.color_options.map((c) => (
                  <button key={c} className="w-8 h-8 rounded-full border-2 border-primary-400 bg-slate-800" title={c} />
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-9 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-slate-800">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-9 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              id="add-to-cart-btn"
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                addedToCart
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {addedToCart ? (
                <><CheckCircle size={15} /> Added to Cart!</>
              ) : (
                <><ShoppingCart size={15} /> Add to cart</>
              )}
            </button>
            <button className="py-3 px-5 rounded-xl border border-primary-600 text-primary-600 text-sm font-bold hover:bg-primary-50 transition-colors">
              Buy now
            </button>
          </div>

          {/* Feature Tags */}
          {product.key_features && product.key_features.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {product.key_features.slice(0, 4).map((f) => (
                <span key={f} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg">{f}</span>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-slate-200 mb-4">
            <div className="flex gap-0">
              {(['overview', 'specs', 'reviews', 'qa'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-sm font-bold capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'text-primary-600 border-primary-600'
                      : 'text-slate-500 border-transparent hover:text-slate-800'
                  }`}
                >
                  {tab === 'qa' ? 'Q&A' : tab === 'specs' ? 'Specifications' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'reviews' && ` (${product.rating_count.toLocaleString()})`}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-2">About this item</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {product.about || product.description || 'Premium quality product with excellent build and performance.'}
                  </p>
                  {product.features && (
                    <ul className="mt-3 space-y-1">
                      {product.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                          <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-2">Specifications</h3>
                    <div className="space-y-1.5">
                      {Object.entries(product.specifications).slice(0, 6).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <span className="text-slate-500 font-semibold w-28 shrink-0">{k}</span>
                          <span className="text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-2">
              {product.specifications && Object.entries(product.specifications).map(([k, v]) => (
                <div key={k} className="flex gap-4 py-2 border-b border-slate-50 text-sm">
                  <span className="text-slate-500 font-semibold w-36 shrink-0">{k}</span>
                  <span className="text-slate-800">{v}</span>
                </div>
              ))}
              {(!product.specifications || !Object.keys(product.specifications).length) && (
                <p className="text-slate-400 text-sm italic">Specifications not available.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-5xl font-black text-slate-900">{product.rating.toFixed(1)}</div>
                <StarRating rating={product.rating} count={product.rating_count} />
                <div className="mt-4 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((s) => (
                    <RatingBar key={s} stars={s} pct={(reviewBreakdown as any)[s] || 0} />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {(product.reviews_summary?.recent_reviews || []).map((r, i) => (
                  <div key={i} className="border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                        {r.reviewer.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{r.reviewer}</span>
                      {r.verified && <CheckCircle size={11} className="text-green-500" />}
                    </div>
                    <StarRating rating={r.rating} count={0} />
                    <p className="text-xs font-bold text-slate-800 mt-1">{r.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{r.body}</p>
                  </div>
                ))}
                {!(product.reviews_summary?.recent_reviews?.length) && (
                  <p className="text-slate-400 text-sm italic">No reviews yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <p className="text-slate-400 text-sm italic">No questions yet for this product.</p>
          )}
        </div>

        {/* ── RIGHT: Why We Recommend + Customers Viewed ─── */}
        <div className="w-64 shrink-0 space-y-4">
          <div className="rounded-2xl bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={15} className="text-primary-600" />
              <h4 className="text-sm font-black text-slate-900">Why we recommend this</h4>
              <span className="ml-auto bg-primary-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">AI</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">Based on your activity, we think you'll love this!</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" />
                You searched for similar products
              </li>
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" />
                Popular among similar shoppers
              </li>
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" />
                Matches your price preference
              </li>
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" />
                Top-rated in this category
              </li>
            </ul>
            <button className="text-[10px] text-primary-600 font-bold mt-3 hover:underline">
              How it works →
            </button>
          </div>

          {/* Customers also viewed */}
          {whyRecs.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-900">Customers also viewed</h4>
                <button onClick={() => navigate('/recommendations')} className="text-[10px] font-bold text-primary-600">View all</button>
              </div>
              <div className="space-y-3">
                {whyRecs.map((rec) => (
                  <div
                    key={rec.product_id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-xl p-1.5 transition-colors"
                    onClick={() => navigate(`/products/${rec.product_id}`)}
                  >
                    {rec.image_url ? (
                      <img src={rec.image_url} alt={rec.product_name} className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{rec.product_name}</p>
                      <p className="text-xs font-black text-slate-900">{formatINR(rec.discounted_price ?? rec.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Complete Your Setup (Frequently Bought Together) ── */}
      {(recsLoading || compRecs.length > 0) && (
        <section className="mb-10">
          <RecommendationRow
            id="pdp-complete-setup"
            title="Complete Your Setup"
            subtitle="Frequently bought together"
            items={compRecs}
            isAI
            isLoading={recsLoading}
            onInfoClick={(p) => setSelectedRec(p)}
            onViewAll={() => navigate('/recommendations')}
          />
        </section>
      )}

      {/* ── Similar Products ───────────────────────────────── */}
      {(recsLoading || similarRecs.length > 0) && (
        <section className="mb-10">
          <RecommendationRow
            id="pdp-similar"
            title="Similar Products"
            subtitle="More like this"
            items={similarRecs}
            isAI
            isLoading={recsLoading}
            onInfoClick={(p) => setSelectedRec(p)}
            onViewAll={() => navigate('/catalog')}
          />
        </section>
      )}

      {/* ── Alternative Products ──────────────────────────── */}
      {(recsLoading || altRecs.length > 0) && (
        <section className="mb-10">
          <RecommendationRow
            id="pdp-alternatives"
            title="Alternative Products"
            subtitle="Different options to consider"
            items={altRecs}
            isAI
            isLoading={recsLoading}
            onInfoClick={(p) => setSelectedRec(p)}
            onViewAll={() => navigate('/catalog')}
          />
        </section>
      )}

      {/* Recommendation Details Panel (WF-10) */}
      <RecommendationDetailsPanel product={selectedRec} onClose={() => setSelectedRec(null)} />
    </MainLayout>
  );
}

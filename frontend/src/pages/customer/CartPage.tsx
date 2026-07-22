// ============================================================
// CartPage — WF-07
// Displays current cart items, delivery metrics progress, 
// and triggers CART recommendations (COMPLEMENTARY and ACCESSORY) 
// using live serving endpoints when cart changes.
// Wraps inside the unified MainLayout.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, Shield, RefreshCcw, Clock, Truck } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { RecommendationRow } from '../../components/recommendation/RecommendationRow';
import { RecommendationPanel } from '../../components/recommendation/RecommendationPanel';
import { useCartStore } from '../../store/cartStore';
import { useUserStore } from '../../store/userStore';
import { getCartRecommendations } from '../../api/recommendationApi';
import type { RecommendedProduct } from '../../types/recommendation';

const FREE_DELIVERY_THRESHOLD = 3000;

const TRUST_BADGES = [
  { icon: Shield, label: 'Secure Checkout', desc: '256-bit SSL encryption' },
  { icon: RefreshCcw, label: 'Easy Returns', desc: '7-day return policy' },
  { icon: Clock, label: '1 Year Warranty', desc: 'On all eligible products' },
  { icon: Truck, label: '24/7 Support', desc: "We're here to help" },
];

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getSubtotal, getTotalSavings } = useCartStore();
  const { activeCustomer, sessionContext, setCartItems } = useUserStore();

  const [cartRecs, setCartRecs] = useState<RecommendedProduct[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<RecommendedProduct | null>(null);

  const subtotal = getSubtotal();
  const savings = getTotalSavings();
  const deliveryProgress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const amountToFreeDelivery = Math.max(FREE_DELIVERY_THRESHOLD - subtotal, 0);

  // Sync session cart context whenever local items array changes
  useEffect(() => {
    const ids = items.map((i) => i.product_id);
    setCartItems(ids);
  }, [items]);

  // Fetch complementary cart suggestions when active customer or cart state changes
  useEffect(() => {
    setRecsLoading(true);
    getCartRecommendations(activeCustomer.customer_id, sessionContext.cart_product_ids, sessionContext)
      .then((res) => {
        // Filter out products already present in the cart
        const cartIds = new Set(items.map((i) => i.product_id));
        const filtered = res.recommendations.filter((r) => !cartIds.has(r.product_id));
        setCartRecs(filtered);
      })
      .catch((err) => console.warn(err))
      .finally(() => setRecsLoading(false));
  }, [activeCustomer.customer_id, items, sessionContext]);

  if (items.length === 0) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Your cart is empty</h1>
          <p className="text-slate-500 mb-6 text-sm">Add products to your cart and they'll appear here.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Start Shopping</button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightSidebar={false}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Your Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Review your items, apply offers, and complete your purchase.</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-bold">
          <Shield size={14} />
          <span>Secure Checkout</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Cart Items ────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          
          {/* Delivery Progress Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-primary-600" />
                {amountToFreeDelivery > 0 ? (
                  <p className="text-xs font-semibold text-slate-600">
                    You're <span className="text-primary-600 font-black">₹{amountToFreeDelivery.toLocaleString('en-IN')}</span> away from FREE delivery
                  </p>
                ) : (
                  <p className="text-xs font-black text-emerald-600">🎉 You qualify for FREE delivery!</p>
                )}
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${deliveryProgress === 100 ? 'bg-emerald-500' : 'bg-primary-600'}`}
                style={{ width: `${deliveryProgress}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.product_id} className="p-4 flex gap-4">
                <div className="w-20 h-20 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={item.image_url || `https://picsum.photos/seed/${item.product_id}/200/200`}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-bold text-slate-900 text-sm truncate max-w-[300px]">
                        {item.product_name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {item.brand}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-2">
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-white">
                      <button
                        onClick={() => updateQuantity(item.product_id, Math.max(item.quantity - 1, 1))}
                        className="p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Order Summary Sidebar ────────────────────── */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900">Order Summary</h3>

            <div className="space-y-3.5 text-xs text-slate-500 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-950">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                {subtotal >= FREE_DELIVERY_THRESHOLD ? (
                  <span className="font-bold text-emerald-600">FREE</span>
                ) : (
                  <span className="font-bold text-slate-950">₹150</span>
                )}
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Product Discount</span>
                  <span className="font-bold">-₹{savings.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-sm font-black text-slate-900 pt-1">
              <span>Total</span>
              <span>
                ₹{(subtotal + (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 150)).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={() => alert('Secure Checkout complete in Demo mode!')}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-primary-200 text-sm flex items-center justify-center gap-2"
            >
              Proceed to Secure Checkout
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 py-1"
            >
              <ArrowLeft size={13} />
              Continue Shopping
            </button>
          </div>

          {/* Trust Badges */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid grid-cols-2 gap-4">
            {TRUST_BADGES.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center p-2">
                  <Icon size={20} className="text-primary-600 mb-1" />
                  <span className="text-[10px] font-black text-slate-950">{b.label}</span>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-snug">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* complementary recs */}
      {cartRecs.length > 0 && (
        <div className="mt-12">
          <RecommendationRow
            id="cart-recs"
            title="Complete Your Setup"
            subtitle="Add accessory add-ons to round out your checkout cart items"
            items={cartRecs}
            isAI
            isLoading={recsLoading}
            onInfoClick={(p) => setSelectedProduct(p)}
          />
        </div>
      )}

      <RecommendationPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </MainLayout>
  );
}

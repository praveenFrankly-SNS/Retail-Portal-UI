// ============================================================
// CartPage — Retail AI Portal (WF-07)
// Cart items + order summary + live recommendations:
//   • Recommended Accessories (ACCESSORY)
//   • Frequently Bought Together bundle
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2, Minus, Plus, ShoppingCart, Shield, RefreshCcw,
  Clock, Sparkles, CheckCircle, Tag, Truck, ChevronRight,
  Package,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { RecommendationRow } from '../../components/recommendation/RecommendationRow';
import { RecommendationDetailsPanel } from '../../components/recommendation/RecommendationDetailsPanel';
import { getCartRecommendations } from '../../api/recommendationApi';
import { useCartStore } from '../../store/cartStore';
import { useUserStore } from '../../store/userStore';
import type { RecommendedProduct } from '../../types/recommendation';

const FREE_DELIVERY_THRESHOLD = 500;

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getTotalSavings } = useCartStore();
  const { activeCustomer, sessionContext, setCartItems } = useUserStore();

  const [selectedRec,   setSelectedRec]   = useState<RecommendedProduct | null>(null);
  const [accessoryRecs, setAccessoryRecs] = useState<RecommendedProduct[]>([]);
  const [compRecs,      setCompRecs]      = useState<RecommendedProduct[]>([]);
  const [recsLoading,   setRecsLoading]   = useState(true);
  const [couponCode,    setCouponCode]    = useState('');

  const subtotal   = getSubtotal();
  const savings    = getTotalSavings();
  const tax        = Math.round(subtotal * 0.18);
  const delivery   = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 99;
  const total      = subtotal + tax + delivery;
  const toFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');

  // Sync cart items to session context
  useEffect(() => {
    setCartItems(items.map(i => i.product_id));
  }, [items]);

  // Load cart recommendations
  useEffect(() => {
    if (!activeCustomer.customer_id) return;
    setRecsLoading(true);
    getCartRecommendations(
      activeCustomer.customer_id,
      items.map(i => i.product_id),
      sessionContext
    )
      .then((res) => {
        setAccessoryRecs(res.recommendations.filter(r => r.relationship === 'ACCESSORY').slice(0, 5));
        setCompRecs(res.recommendations.filter(r => r.relationship === 'COMPLEMENTARY').slice(0, 3));
      })
      .catch(console.warn)
      .finally(() => setRecsLoading(false));
  }, [activeCustomer.customer_id, items.length]);

  if (items.length === 0) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
            <ShoppingCart size={40} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-sm text-slate-500 mb-6">Browse products and add items you love to your cart.</p>
          <button
            onClick={() => navigate('/catalog')}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-colors"
          >
            Start Shopping
          </button>
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
            Your Cart <span className="text-slate-400 font-semibold text-lg">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Review your items, apply offers, and complete your purchase.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 px-3 py-2 rounded-xl bg-white">
          <Shield size={13} className="text-green-500" />
          Secure Checkout
        </div>
      </div>

      {/* Free delivery progress */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2 text-sm">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-primary-600" />
            {toFreeDelivery > 0 ? (
              <span className="text-slate-700">
                You're <span className="text-primary-700 font-black">{formatINR(toFreeDelivery)}</span> away from FREE delivery
              </span>
            ) : (
              <span className="text-green-700 font-bold">🎉 You qualify for FREE delivery!</span>
            )}
          </div>
          <span className="font-black text-primary-700 text-xs">{formatINR(FREE_DELIVERY_THRESHOLD)} FREE DELIVERY</span>
        </div>
        <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${deliveryProgress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-6">

        {/* ── Cart Items ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-2">
            <span>Product</span>
            <span className="text-right">Price</span>
            <span className="text-center">Quantity</span>
            <span className="text-right">Subtotal</span>
          </div>

          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item) => {
              const lineTotal = (item.discounted_price ?? item.price) * item.quantity;
              return (
                <div
                  key={item.product_id}
                  className="grid md:grid-cols-[1fr_auto_auto_auto] gap-4 items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                >
                  {/* Product info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Package size={20} className="text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-primary-600"
                        onClick={() => navigate(`/products/${item.product_id}`)}
                      >
                        {item.product_name}
                      </p>
                      <p className="text-xs text-slate-500">{item.brand}</p>
                      {item.color && (
                        <p className="text-xs text-slate-400">Color: {item.color}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold ${
                          item.availability_status === 'IN_STOCK' ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          ● {item.availability_status === 'IN_STOCK' ? 'In Stock' : 'Limited'}
                        </span>
                        <span className="text-[10px] text-green-600">● Eligible for FREE delivery</span>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatINR(item.discounted_price ?? item.price)}</p>
                    {item.discounted_price && item.price > item.discounted_price && (
                      <p className="text-xs text-slate-400 line-through">{formatINR(item.price)}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="ml-2 w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatINR(lineTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Actions */}
          <div className="flex items-center justify-between mt-4 px-1">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded" /> Select all ({items.length})
              </label>
              <button className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold">
                <Trash2 size={12} /> Remove selected
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600 font-semibold">
                <Clock size={12} /> Save for later
              </button>
              <button onClick={clearCart} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-semibold">
                <Trash2 size={12} /> Clear cart
              </button>
            </div>
          </div>
        </div>

        {/* ── Order Summary ───────────────────────────────────── */}
        <div className="w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-24">
            <h3 className="text-base font-black text-slate-900 mb-4">Order Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal ({items.length} items)</span>
                <span className="font-bold text-slate-900">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Delivery</span>
                <span className={`font-bold ${delivery === 0 ? 'text-green-600' : 'text-slate-900'}`}>
                  {delivery === 0 ? 'FREE' : formatINR(delivery)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estimated Tax (18%)</span>
                <span className="font-bold text-slate-900">{formatINR(tax)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="font-semibold">You save</span>
                  <span className="font-black">-{formatINR(savings)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-slate-900 font-black text-base">Total</span>
                <span className="text-slate-900 font-black text-lg">{formatINR(total)}</span>
              </div>
            </div>

            {savings > 0 && (
              <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-2.5 text-center">
                <p className="text-xs font-bold text-green-700">🎉 You're saving {formatINR(savings)} on this order!</p>
              </div>
            )}

            {/* Coupon */}
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-700 mb-2">Apply coupon code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-primary-400 bg-slate-50"
                />
                <button className="px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors">
                  Apply
                </button>
              </div>
            </div>

            {/* Deliver to */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-slate-700">Deliver to</p>
                <button className="text-[10px] text-primary-600 font-bold hover:underline">Change</button>
              </div>
              <p className="text-xs font-bold text-slate-800">{activeCustomer.customer_name}</p>
              <p className="text-[10px] text-slate-500">{activeCustomer.city || 'India'}</p>
              <p className="text-[10px] text-green-600 font-semibold mt-1">
                ✓ Delivery by Tue, 27 May
              </p>
            </div>

            <button
              id="proceed-checkout-btn"
              className="w-full mt-4 py-3.5 rounded-xl bg-primary-600 text-white font-black text-sm hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <Shield size={15} />
              Proceed to Checkout
            </button>
            <button
              onClick={() => navigate('/catalog')}
              className="w-full mt-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <ChevronRight size={14} className="rotate-180" />
              Continue Shopping
            </button>

            {/* Trust badges */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Shield, text: 'Secure Payments', sub: '100% secure' },
                { icon: RefreshCcw, text: 'Easy Returns', sub: '7-day policy' },
                { icon: Tag, text: 'Price Match', sub: 'Best prices' },
              ].map(({ icon: Icon, text, sub }) => (
                <div key={text} className="text-center">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-1">
                    <Icon size={13} className="text-slate-500" />
                  </div>
                  <p className="text-[9px] font-bold text-slate-700">{text}</p>
                  <p className="text-[8px] text-slate-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommended Accessories (live) ───────────────────── */}
      <section className="mt-10">
        <RecommendationRow
          id="cart-accessories"
          title="Recommended Accessories"
          subtitle="Handpicked accessories to enhance your experience"
          items={accessoryRecs}
          isAI
          isLoading={recsLoading}
          onInfoClick={(p) => setSelectedRec(p)}
          onViewAll={() => navigate('/recommendations')}
        />
      </section>

      {/* ── Frequently Bought Together (live) ───────────────── */}
      {(recsLoading || compRecs.length > 0) && (
        <section className="mt-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary-600 animate-pulse" />
              <div>
                <h2 className="text-lg font-black text-slate-900">Frequently Bought Together</h2>
                <p className="text-xs text-slate-500">Customers who bought these items also bought</p>
              </div>
            </div>
          </div>
          {recsLoading ? (
            <div className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-4 mb-5">
                {compRecs.map((rec, idx) => (
                  <div key={rec.product_id} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-slate-300 font-black text-xl">+</span>}
                    <div
                      className="flex flex-col items-center gap-1 cursor-pointer"
                      onClick={() => navigate(`/products/${rec.product_id}`)}
                    >
                      {rec.image_url ? (
                        <img src={rec.image_url} alt={rec.product_name} className="w-20 h-20 rounded-xl object-cover border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Package size={20} className="text-slate-300" />
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-slate-800 max-w-[80px] text-center line-clamp-1">{rec.product_name}</p>
                      <p className="text-xs font-black text-slate-900">₹{(rec.discounted_price ?? rec.price).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
                <div className="ml-4 border-l border-slate-200 pl-4">
                  <p className="text-xs text-slate-500 mb-1">Total Price</p>
                  <p className="text-lg font-black text-slate-900">
                    {formatINR(compRecs.reduce((s, r) => s + (r.discounted_price ?? r.price), 0))}
                  </p>
                  <button className="mt-2 px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-1">
                    <ShoppingCart size={12} /> Add All to Cart
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Complete Your Purchase strip */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Truck,    text: 'FREE Delivery',     sub: 'On orders above ₹3,000' },
          { icon: RefreshCcw, text: '7-Day Easy Returns', sub: 'No questions asked' },
          { icon: Shield,   text: '1 Year Warranty',   sub: 'On all eligible products' },
          { icon: CheckCircle, text: '24/7 Customer Support', sub: 'We\'re here to help' },
        ].map(({ icon: Icon, text, sub }) => (
          <div key={text} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-primary-600">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{text}</p>
              <p className="text-[10px] text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </section>

      <RecommendationDetailsPanel product={selectedRec} onClose={() => setSelectedRec(null)} />
    </MainLayout>
  );
}

// ============================================================
// ProductCard — Retail AI Portal
// Unified product card used in: Home recommendation rows,
// Search results, Catalog grid, Cart, PDP recommendation rows
// Supports: compact (row), grid (default), and mini modes
// ============================================================

import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Info, Package } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import type { Product } from '../../types/product';
import type { RecommendedProduct } from '../../types/recommendation';

type ProductCardVariant = 'grid' | 'compact' | 'recommendation';

interface ProductCardProps {
  product: Product | RecommendedProduct;
  variant?: ProductCardVariant;
  onInfoClick?: (product: RecommendedProduct) => void;
  className?: string;
}

const BADGE_STYLES: Record<string, string> = {
  BEST_MATCH: 'bg-green-100 text-green-700 border-green-200',
  GREAT_VALUE: 'bg-orange-100 text-orange-700 border-orange-200',
  BEST_SELLER: 'bg-amber-100 text-amber-700 border-amber-200',
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  POPULAR: 'bg-purple-100 text-purple-700 border-purple-200',
  GREAT_PICK: 'bg-teal-100 text-teal-700 border-teal-200',
};

const BADGE_LABELS: Record<string, string> = {
  BEST_MATCH: 'Best Match',
  GREAT_VALUE: 'Great Value',
  BEST_SELLER: 'Best Seller',
  NEW: 'New',
  POPULAR: 'Popular',
  GREAT_PICK: 'Great Pick',
};

function isRecommendedProduct(p: Product | RecommendedProduct): p is RecommendedProduct {
  return 'relationship' in p;
}

function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null) return 'Price on Request';
  return `₹${price.toLocaleString('en-IN')}`;
}

function NoImagePlaceholder() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/40 flex flex-col items-center justify-center p-3 relative overflow-hidden select-none">
      <div className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur shadow-sm border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:scale-110 group-hover:border-primary-300 transition-all duration-300">
        <Package size={20} className="stroke-[1.5] animate-pulse" />
      </div>
      <span className="text-[10px] font-bold text-slate-400 mt-1.5 tracking-wider uppercase group-hover:text-primary-600 transition-colors">
        Retail Product
      </span>
    </div>
  );
}

export function ProductCard({ product, variant = 'grid', onInfoClick, className = '' }: ProductCardProps) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const rawPrice = product.price ?? (product as any).selling_price;
  const effectivePrice = product.discounted_price ?? rawPrice;
  const hasDiscount = product.discounted_price && rawPrice && product.discounted_price < rawPrice;
  const isRec = isRecommendedProduct(product);
  const badge = product.badge;

  const handleCardClick = () => {
    if (isRec && onInfoClick) {
      onInfoClick(product as RecommendedProduct);
    } else if (product.product_id) {
      navigate(`/products/${product.product_id}`, { state: { product } });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addItem({
      product_id: product.product_id,
      product_name: product.product_name,
      brand: product.brand,
      price: product.price,
      discounted_price: product.discounted_price,
      image_url: product.image_url,
      quantity: 1,
      availability_status: product.availability_status,
    });
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:shadow-card-hover transition-all duration-200 ${className}`}>
        {/* Image */}
        <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-md" />
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{product.product_name}</p>
          <p className="text-xs text-gray-500">{product.brand}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-gray-900">{formatPrice(effectivePrice)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>
        {/* Rating */}
        <div className="flex items-center gap-0.5 text-xs text-amber-500 shrink-0">
          <Star size={11} fill="currentColor" />
          <span className="font-medium">{product.rating}</span>
        </div>
      </div>
    );
  }

  // Default: grid / recommendation card
  return (
    <div
      id={`product-card-${product.product_id}`}
      onClick={handleCardClick}
      className={`product-card flex flex-col cursor-pointer group hover:shadow-lg transition-all duration-200 ${className}`}
    >
      {/* Image area */}
      <div className="relative h-32 sm:h-36 bg-gray-50 rounded-t-xl overflow-hidden flex items-center justify-center p-2">
        {badge && (
          <span className={`absolute top-2 left-2 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${BADGE_STYLES[badge] ?? 'bg-gray-100 text-gray-600'}`}>
            {BADGE_LABELS[badge] ?? badge}
          </span>
        )}
        {/* Wishlist */}
        <button
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={13} />
        </button>
        {/* Info icon for recommendations */}
        {isRec && onInfoClick && (
          <button
            title="View AI recommendation context"
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center
                       text-primary-600 hover:bg-primary-600 hover:text-white transition-all"
            onClick={(e) => { e.stopPropagation(); onInfoClick(product as RecommendedProduct); }}
          >
            <Info size={14} />
          </button>
        )}
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="max-h-24 max-w-[80%] object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              // Swap broken image with fallback container
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.classList.add('p-0');
              }
            }}
          />
        ) : (
          <NoImagePlaceholder />
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        {/* Brand */}
        <p className="text-xs text-gray-400 font-medium">{product.brand}</p>
        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.product_name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star size={11} className="text-amber-400" fill="currentColor" />
          <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
          <span className="text-xs text-gray-400">({(product.rating_count ?? 0).toLocaleString()})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-base font-bold text-gray-900">{formatPrice(effectivePrice)}</span>
          {hasDiscount && (
            <>
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
              <span className="text-xs font-semibold text-green-600">{product.discount_percent}% OFF</span>
            </>
          )}
        </div>

        {/* AI reason (for recommendations) */}
        {isRec && (product as RecommendedProduct).reason && (
          <p className="text-[11px] text-gray-500 italic leading-snug line-clamp-2 mt-0.5">
            {(product as RecommendedProduct).reason}
          </p>
        )}

        {/* Add to cart */}
        <button
          id={`add-to-cart-${product.product_id}`}
          onClick={handleAddToCart}
          disabled={product.availability_status === 'OUT_OF_STOCK'}
          className="mt-2 flex items-center justify-center gap-1.5 w-full h-8 rounded-lg border border-gray-200
                     text-xs font-medium text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <ShoppingCart size={13} />
          {product.availability_status === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}

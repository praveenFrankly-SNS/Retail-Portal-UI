// ============================================================
// RecommendationRow — Retail AI Portal
// Horizontal scrollable row with section header, AI icon,
// "View all" link, and left/right navigation arrows
// ============================================================

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProductCard } from '../product/ProductCard';
import type { RecommendedProduct } from '../../types/recommendation';
import type { Product } from '../../types/product';

interface RecommendationRowProps {
  title: string;
  subtitle?: string;
  items: (Product | RecommendedProduct)[];
  isAI?: boolean;
  onViewAll?: () => void;
  onInfoClick?: (product: RecommendedProduct) => void;
  isLoading?: boolean;
  id: string;
}

function SkeletonCard() {
  return (
    <div className="shrink-0 w-44 rounded-xl border border-gray-100 bg-white overflow-hidden">
      <div className="aspect-square shimmer-bg" />
      <div className="p-3 space-y-2">
        <div className="h-3 shimmer-bg rounded w-1/2" />
        <div className="h-3 shimmer-bg rounded w-full" />
        <div className="h-3 shimmer-bg rounded w-3/4" />
        <div className="h-7 shimmer-bg rounded-lg mt-2" />
      </div>
    </div>
  );
}

export function RecommendationRow({
  title, subtitle, items, isAI = true, onViewAll, onInfoClick, isLoading = false, id
}: RecommendationRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 380;
    scrollRef.current.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <section id={`rec-row-${id}`} className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          {isAI && (
            <div className="mt-0.5 w-5 h-5 rounded-md bg-accent-100 flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-accent-600" />
            </div>
          )}
          <div>
            <h2 className="text-gray-900 text-base font-semibold leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors mr-1"
            >
              View all
            </button>
          )}
          <button
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center
                       text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center
                       text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto rec-scroll pb-1 -mx-0.5 px-0.5"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((item) => (
              <div key={item.product_id} style={{ scrollSnapAlign: 'start' }} className="shrink-0 w-44">
                <ProductCard
                  product={item}
                  variant="recommendation"
                  onInfoClick={onInfoClick}
                />
              </div>
            ))
        }
      </div>
    </section>
  );
}

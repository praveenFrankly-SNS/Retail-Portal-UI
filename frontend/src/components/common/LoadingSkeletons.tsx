// ============================================================
// LoadingSkeletons — Shared skeleton loader components
// Used for: product cards, recommendation rows, tables, forms
// ============================================================

interface ProductCardSkeletonProps {
  count?: number;
  columns?: string;
}

export function ProductCardSkeleton({ count = 8, columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' }: ProductCardSkeletonProps) {
  return (
    <div className={`grid ${columns} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-100 rounded-[10px] overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-36 bg-slate-100" />
          <div className="p-3 space-y-2">
            <div className="h-2.5 bg-slate-100 rounded w-1/3" />
            <div className="h-3.5 bg-slate-100 rounded w-3/4" />
            <div className="h-3.5 bg-slate-100 rounded w-1/2" />
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-8 bg-slate-100 rounded-lg w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecommendationRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-100 rounded w-48 animate-pulse" />
          <div className="h-3 bg-slate-100 rounded w-64 animate-pulse" />
        </div>
        <div className="h-4 bg-slate-100 rounded w-16 animate-pulse" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-44 bg-white border border-slate-100 rounded-[10px] overflow-hidden animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-28 bg-slate-100" />
            <div className="p-2.5 space-y-1.5">
              <div className="h-2.5 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
              <div className="h-3.5 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-3 bg-white border-b border-slate-100 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-3 bg-slate-100 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function HeroSearchSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 p-6 sm:p-8 bg-white animate-pulse space-y-4">
      <div className="h-6 bg-slate-100 rounded w-32" />
      <div className="h-10 bg-slate-100 rounded w-2/3" />
      <div className="h-6 bg-slate-100 rounded w-1/2" />
      <div className="h-12 bg-slate-100 rounded-lg w-full" />
      <div className="flex gap-2">
        {[80, 100, 90, 110].map((w, i) => (
          <div key={i} className="h-7 bg-slate-100 rounded-full" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-32" />
        <div className="h-7 bg-slate-100 rounded w-56" />
        <div className="h-4 bg-slate-100 rounded w-80" />
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-[10px]" />
        ))}
      </div>
      <div className="h-64 bg-slate-100 rounded-[10px]" />
    </div>
  );
}

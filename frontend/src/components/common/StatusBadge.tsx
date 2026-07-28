// ============================================================
// StatusBadge — Shared reusable status badge component
// Uses .status-pill CSS utility class
// ============================================================

interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  label: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

const DOT_COLORS: Record<StatusBadgeProps['variant'], string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-slate-400',
};

const NEUTRAL_STYLES = 'bg-slate-100 text-slate-600';

export function StatusBadge({ variant, label, dot = false, size = 'md' }: StatusBadgeProps) {
  const isNeutral = variant === 'neutral';
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : '';

  return (
    <span
      className={`status-pill ${isNeutral ? NEUTRAL_STYLES : variant} ${sizeClass}`}
      role="status"
      aria-label={label}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[variant]}`} />
      )}
      {label}
    </span>
  );
}

// ── Pre-composed common badges ──────────────────────────────────────
export const InStockBadge = () => <StatusBadge variant="success" label="In Stock" dot />;
export const OutOfStockBadge = () => <StatusBadge variant="danger" label="Out of Stock" />;
export const LowStockBadge = () => <StatusBadge variant="warning" label="Low Stock" dot />;
export const AIBadge = ({ label = 'AI-Powered' }: { label?: string }) => (
  <span className="ai-badge">
    <span className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
    {label}
  </span>
);

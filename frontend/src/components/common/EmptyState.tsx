// ============================================================
// EmptyState — Shared empty / zero-data state component
// Used across search, catalog, cart, recommendations
// ============================================================

import React from 'react';
import { PackageSearch } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`} role="status">
      {icon ?? (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <PackageSearch size={28} className="text-slate-400" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-semibold text-slate-800">{title}</p>
        {description && (
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ── DatabricksErrorState ────────────────────────────────────────────
interface DatabricksErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DatabricksErrorState({ message, onRetry, className = '' }: DatabricksErrorProps) {
  return (
    <div className={`empty-state ${className}`} role="alert">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-slate-800">Unable to fetch data from Databricks</p>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          {message ||
            'This data could not be retrieved from your Databricks workspace. Check your connection, credentials, or contact your administrator.'}
        </p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-2">
          Try Again
        </button>
      )}
    </div>
  );
}

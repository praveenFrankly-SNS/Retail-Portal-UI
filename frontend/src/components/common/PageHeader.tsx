// ============================================================
// PageHeader — Shared enterprise page header component
// Layout: Breadcrumb → Title → Description → optional Toolbar
// ============================================================

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: React.ReactNode;
  description?: React.ReactNode;
  toolbar?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ breadcrumbs, title, description, toolbar, badge }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 mb-3" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
              <span
                onClick={crumb.onClick}
                className={`text-xs font-medium ${
                  crumb.onClick
                    ? 'text-slate-400 hover:text-slate-700 cursor-pointer transition-colors'
                    : 'text-slate-600'
                }`}
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="section-description mt-1">{description}</p>
          )}
        </div>

        {/* Toolbar */}
        {toolbar && (
          <div className="toolbar shrink-0">{toolbar}</div>
        )}
      </div>
    </div>
  );
}

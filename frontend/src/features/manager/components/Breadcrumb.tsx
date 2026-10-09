// frontend/src/features/manager/components/Breadcrumb.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center flex-wrap gap-1.5 text-xs text-slate-500 font-medium ${className}`}
    >
      <Link
        to="/manager/facilities"
        className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-600 transition-colors"
        title="Trang danh sách cơ sở"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Quản lý ô kho</span>
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const IconComponent = item.icon;

        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast || !item.to ? (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[320px]">
                {IconComponent && <IconComponent className="w-3.5 h-3.5 shrink-0 text-slate-600" />}
                <span className="truncate">{item.label}</span>
              </span>
            ) : (
              <Link
                to={item.to}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-brand-600 hover:underline transition-colors truncate max-w-[150px] sm:max-w-[220px]"
              >
                {IconComponent && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

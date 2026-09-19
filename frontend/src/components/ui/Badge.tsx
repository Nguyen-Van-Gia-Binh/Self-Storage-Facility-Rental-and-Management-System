import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'available' | 'reserved' | 'occupied' | 'maintenance' | 'overdue' | 'locked';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-brand-50 text-brand-700 border-brand-200',
    available: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    reserved: 'bg-sky-50 text-sky-700 border-sky-300',
    occupied: 'bg-slate-100 text-slate-700 border-slate-300',
    maintenance: 'bg-amber-50 text-amber-700 border-amber-300',
    overdue: 'bg-red-50 text-red-700 border-red-300',
    locked: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

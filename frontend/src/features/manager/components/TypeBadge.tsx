// frontend/src/features/manager/components/TypeBadge.tsx
import React from 'react';
import { KeyRound, Wrench, Droplets, Zap, Sparkles, Receipt, HelpCircle, ShieldAlert } from 'lucide-react';
import type { SupportCategory } from '../types/staffAssignment';

interface TypeBadgeProps {
  category: SupportCategory | string;
  size?: 'sm' | 'md';
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }>; className: string }
> = {
  ACCESS_ISSUE: {
    label: 'Khóa cửa & PIN',
    icon: KeyRound,
    className: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
  LOST_KEY: {
    label: 'Mất chìa khóa',
    icon: ShieldAlert,
    className: 'bg-rose-50 text-rose-700 border-rose-200/80',
  },
  FACILITY_DAMAGE: {
    label: 'Hư hỏng vách/cửa',
    icon: Wrench,
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  },
  FACILITY_LEAK: {
    label: 'Ngập nước, thấm dột',
    icon: Droplets,
    className: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
  },
  POWER_ISSUE: {
    label: 'Điện & Chiếu sáng',
    icon: Zap,
    className: 'bg-yellow-50 text-yellow-800 border-yellow-200/80',
  },
  CLEANLINESS: {
    label: 'Vệ sinh kho bãi',
    icon: Sparkles,
    className: 'bg-teal-50 text-teal-700 border-teal-200/80',
  },
  PAYMENT_BILLING: {
    label: 'Hóa đơn & Cước phí',
    icon: Receipt,
    className: 'bg-purple-50 text-purple-700 border-purple-200/80',
  },
  OTHER: {
    label: 'Sự cố khác',
    icon: HelpCircle,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export const TypeBadge: React.FC<TypeBadgeProps> = ({ category, size = 'sm' }) => {
  const cfg = CATEGORY_CONFIG[category] ?? {
    label: category || 'Sự cố chung',
    icon: HelpCircle,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const Icon = cfg.icon;
  const sz = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border whitespace-nowrap ${sz} ${cfg.className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
};

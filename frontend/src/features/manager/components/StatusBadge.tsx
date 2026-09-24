// frontend/src/features/manager/components/StatusBadge.tsx
import React from 'react';
import type { UnitStatus } from '@/types/unit';

const STATUS_CONFIG: Record<UnitStatus, { label: string; className: string; dotColor: string }> = {
  AVAILABLE: {
    label: 'Trống',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
  },
  RESERVED: {
    label: 'Đã đặt',
    className: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotColor: 'bg-amber-500',
  },
  OCCUPIED: {
    label: 'Đang thuê',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotColor: 'bg-blue-500',
  },
  MAINTENANCE: {
    label: 'Bảo trì',
    className: 'bg-orange-50 text-orange-700 border-orange-200/80',
    dotColor: 'bg-orange-500',
  },
  OUT_OF_SERVICE: {
    label: 'Ngừng dịch vụ',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    dotColor: 'bg-slate-400',
  },
};

interface StatusBadgeProps {
  status: UnitStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  };
  const sz = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sz} ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
};

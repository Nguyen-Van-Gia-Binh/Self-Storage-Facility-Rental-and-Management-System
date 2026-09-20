// frontend/src/features/manager/components/StatusBadge.tsx
import React from 'react';
import { UnitStatus } from '@/types/unit';

const STATUS_CONFIG: Record<UnitStatus, { label: string; className: string }> = {
  AVAILABLE:      { label: 'Trong',         className: 'bg-green-900/50 text-green-400 border border-green-700' },
  RESERVED:       { label: 'Da dat',        className: 'bg-amber-900/50 text-amber-400 border border-amber-700' },
  OCCUPIED:       { label: 'Dang thue',     className: 'bg-blue-900/50 text-blue-400 border border-blue-700' },
  MAINTENANCE:    { label: 'Bao tri',       className: 'bg-orange-900/50 text-orange-400 border border-orange-700' },
  OUT_OF_SERVICE: { label: 'Ngung dich vu', className: 'bg-gray-800 text-gray-500 border border-gray-700' },
};

interface StatusBadgeProps {
  status: UnitStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-800 text-gray-400 border border-gray-700' };
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded font-medium font-mono ${sz} ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

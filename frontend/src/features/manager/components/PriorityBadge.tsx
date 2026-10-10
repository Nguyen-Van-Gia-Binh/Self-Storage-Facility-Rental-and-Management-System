// frontend/src/features/manager/components/PriorityBadge.tsx
import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface PriorityBadgeProps {
  isUrgent?: boolean;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' | string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  isUrgent,
  priority,
  size = 'sm',
}) => {
  const isHighOrUrgent = Boolean(isUrgent || priority === 'URGENT' || priority === 'HIGH');
  const sz = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  if (isHighOrUrgent) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold border whitespace-nowrap bg-rose-50 text-rose-700 border-rose-200/80 animate-pulse ${sz}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>🔴 Khẩn cấp</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border whitespace-nowrap bg-slate-50 text-slate-600 border-slate-200 ${sz}`}
    >
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>🟡 Tiêu chuẩn</span>
    </span>
  );
};

// frontend/src/features/manager/components/StatusBadge.tsx
import React from 'react';
import type { UnitStatus } from '@/types/unit';
import type { ManagerContractStatus } from '@/types/contractManager';

export type AnyBadgeStatus = UnitStatus | ManagerContractStatus | string;

const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
  // Trạng thái Ô kho (UnitStatus)
  AVAILABLE: {
    label: 'Trống',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
  },
  RESERVED: {
    label: 'Đã đặt',
    className: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dotColor: 'bg-sky-500',
  },
  OCCUPIED: {
    label: 'Đang thuê',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotColor: 'bg-blue-500',
  },
  CLEANING: {
    label: 'Dọn dẹp',
    className: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dotColor: 'bg-purple-500',
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

  // Trạng thái Hợp đồng (ManagerContractStatus)
  ACTIVE: {
    label: 'Đang hiệu lực',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
  },
  PENDING_RETURN: {
    label: 'Chờ trả kho',
    className: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotColor: 'bg-amber-500',
  },
  INSPECTED: {
    label: 'Đã nghiệm thu',
    className: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dotColor: 'bg-teal-500',
  },
  OVERDUE: {
    label: 'Quá hạn',
    className: 'bg-orange-50 text-orange-700 border-orange-200/80',
    dotColor: 'bg-orange-500',
  },
  TERMINATED: {
    label: 'Đã chấm dứt',
    className: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotColor: 'bg-rose-500',
  },
  CLOSED: {
    label: 'Đã kết thúc',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  },
  PENDING_CHECK_IN: {
    label: 'Chờ nhận kho',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotColor: 'bg-blue-500',
  },
  RELOCATION_PENDING: {
    label: 'Chờ đổi ô kho',
    className: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    dotColor: 'bg-amber-500 animate-pulse',
  },
  AWAITING_RELOCATION: {
    label: 'Chờ đổi ô kho',
    className: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    dotColor: 'bg-amber-500 animate-pulse',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    dotColor: 'bg-amber-500 animate-pulse',
  },

  // Trạng thái Sự cố (SupportStatus)
  NEW: {
    label: 'Chờ tiếp nhận',
    className: 'bg-amber-50 text-amber-900 border-amber-200/80',
    dotColor: 'bg-amber-500',
  },
  OPEN: {
    label: 'Chờ tiếp nhận',
    className: 'bg-amber-50 text-amber-900 border-amber-200/80',
    dotColor: 'bg-amber-500',
  },
  ASSIGNED: {
    label: 'Đã phân công',
    className: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dotColor: 'bg-sky-500',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    className: 'bg-orange-50 text-orange-700 border-orange-200/80',
    dotColor: 'bg-orange-500',
  },
  RESOLVED: {
    label: 'Đã xử lý',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
  },
};

interface StatusBadgeProps {
  status: AnyBadgeStatus;
  size?: 'sm' | 'md';
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', customLabel }) => {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  };
  const sz = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold border whitespace-nowrap ${sz} ${cfg.className}`}
    >
      {customLabel || cfg.label}
    </span>
  );
};

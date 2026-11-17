// frontend/src/features/manager/components/StatusBadge.tsx
import React from 'react';
import type { UnitStatus } from '@/types/unit';
import type { ManagerContractStatus } from '@/types/contractManager';

export type AnyBadgeStatus = UnitStatus | ManagerContractStatus | string;

/**
 * Hệ thống màu ngữ nghĩa chuẩn Enterprise SaaS (5 nhóm):
 * - Emerald: Thành công / Đang hiệu lực / Đã nghiệm thu / Trống
 * - Amber:   Đang chờ / Chờ trả kho / Cần chú ý
 * - Blue:    Thông tin / Đang xử lý / Chờ nhận kho / Đang thuê
 * - Rose:    Nguy hiểm / Quá hạn / Đã chấm dứt / Đã hủy
 * - Gray:    Đã kết thúc / Đã lưu trữ / Không khả dụng
 */
const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
  // Trạng thái Ô kho (UnitStatus)
  AVAILABLE: {
    label: 'Trống',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  RESERVED: {
    label: 'Đã đặt',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  OCCUPIED: {
    label: 'Đang thuê',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  CLEANING: {
    label: 'Dọn dẹp',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  MAINTENANCE: {
    label: 'Bảo trì',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  OUT_OF_SERVICE: {
    label: 'Ngừng dịch vụ',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    dotColor: 'bg-gray-400',
  },

  // Trạng thái Hợp đồng (ManagerContractStatus)
  ACTIVE: {
    label: 'Đang hiệu lực',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  PENDING_RETURN: {
    label: 'Chờ trả kho',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  INSPECTED: {
    label: 'Đã nghiệm thu',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  OVERDUE: {
    label: 'Quá hạn',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
  },
  TERMINATED: {
    label: 'Đã chấm dứt',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
  },
  CLOSED: {
    label: 'Đã kết thúc',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    dotColor: 'bg-gray-400',
  },
  PENDING_CHECK_IN: {
    label: 'Chờ nhận kho',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  RELOCATION_PENDING: {
    label: 'Chờ đổi ô kho',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  AWAITING_RELOCATION: {
    label: 'Chờ đổi ô kho',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
  },

  // Trạng thái Sự cố (SupportStatus)
  NEW: {
    label: 'Chờ tiếp nhận',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  OPEN: {
    label: 'Chờ tiếp nhận',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  ASSIGNED: {
    label: 'Đã phân công',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  RESOLVED: {
    label: 'Đã xử lý',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    dotColor: 'bg-gray-400',
  };
  const sz = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold border whitespace-nowrap ${sz} ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotColor}`} />
      {customLabel || cfg.label}
    </span>
  );
};

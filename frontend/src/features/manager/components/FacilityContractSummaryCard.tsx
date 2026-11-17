// frontend/src/features/manager/components/FacilityContractSummaryCard.tsx
import React from 'react';
import { Building2, MapPin, ChevronRight } from 'lucide-react';
import type { FacilityListItem } from '@/types';

export interface FacilityContractStats {
  total: number;
  active: number;
  pending: number; // PENDING_RETURN, PENDING_CHECK_IN
  overdue: number; // OVERDUE, TERMINATED
}

interface FacilityContractSummaryCardProps {
  facility: FacilityListItem;
  stats?: FacilityContractStats;
  onClick: () => void;
}

export const FacilityContractSummaryCard: React.FC<FacilityContractSummaryCardProps> = ({
  facility,
  stats = { total: 0, active: 0, pending: 0, overdue: 0 },
  onClick,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={`Xem danh sách hợp đồng: ${facility.name}`}
      aria-label={`Xem danh sách hợp đồng: ${facility.name}`}
      className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 md:px-6 py-4 items-center bg-white hover:bg-gray-50 transition-colors cursor-pointer group focus:outline-hidden focus:bg-gray-50 ${
        facility.isActive ? '' : 'opacity-70'
      }`}
    >
      {/* Cột 1: Tên & Mã cơ sở */}
      <div className="col-span-1 md:col-span-4 flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200/80 flex items-center justify-center text-gray-500 group-hover:bg-brand-50 group-hover:border-brand-200 group-hover:text-brand-600 transition-colors shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors truncate text-sm">
              {facility.name}
            </p>
            {!facility.isActive && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                Tạm dừng
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-gray-500 mt-0.5">{facility.code}</p>
        </div>
      </div>

      {/* Cột 2: Địa chỉ rút gọn */}
      <div className="col-span-1 md:col-span-4 flex items-center gap-1.5 text-xs md:text-sm text-gray-600 min-w-0">
        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="truncate" title={facility.address || 'Chưa cập nhật địa chỉ'}>
          {facility.address || 'Chưa cập nhật địa chỉ'}
        </span>
      </div>

      {/* Cột 3: Số liệu Hợp đồng (Active / Quá hạn) */}
      <div className="col-span-1 md:col-span-3 flex flex-wrap md:justify-center items-center gap-2">
        <span
          className={`px-2.5 py-1 rounded text-xs font-semibold border tabular-nums ${
            stats.active > 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
        >
          {stats.active} Đang thuê
        </span>
        <span
          className={`px-2.5 py-1 rounded text-xs font-semibold border tabular-nums ${
            stats.overdue > 0
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
        >
          {stats.overdue} Quá hạn
        </span>
      </div>

      {/* Cột 4: Mũi tên điều hướng */}
      <div className="hidden md:flex md:col-span-1 justify-end">
        <span className="p-1.5 text-gray-400 group-hover:text-brand-600 group-hover:bg-brand-50 rounded-md transition-colors">
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
};

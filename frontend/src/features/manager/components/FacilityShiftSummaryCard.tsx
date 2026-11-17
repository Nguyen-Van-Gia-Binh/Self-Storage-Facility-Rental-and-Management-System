import React from 'react';
import { Building2, Users, ChevronRight, MapPin } from 'lucide-react';
import type { FacilityListItem } from '@/types';

export interface FacilityShiftStats {
  totalStaff: number;
  morningStaffCount?: number;
  afternoonStaffCount?: number;
  nightStaffCount?: number;
}

interface FacilityShiftSummaryCardProps {
  facility: FacilityListItem;
  stats?: FacilityShiftStats;
  onViewSchedule: (facilityId: number) => void;
}

export const FacilityShiftSummaryCard: React.FC<FacilityShiftSummaryCardProps> = ({
  facility,
  stats = {
    totalStaff: 0,
  },
  onViewSchedule,
}) => {
  const handleClick = () => {
    onViewSchedule(Number(facility.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title="Điều phối & Phân công việc"
      aria-label={`Điều phối & Phân công việc: ${facility.name}`}
      className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 md:px-6 py-4 items-center hover:bg-slate-50 transition-colors cursor-pointer group focus:outline-hidden focus:bg-slate-50"
    >
      {/* Cột 1: Tên & Mã cơ sở */}
      <div className="col-span-1 md:col-span-5 flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 group-hover:scale-105 transition-transform shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate text-sm md:text-base">
            {facility.name}
          </p>
          <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider block mt-0.5">
            {facility.code}
          </span>
        </div>
      </div>

      {/* Cột 2: Địa chỉ */}
      <div className="col-span-1 md:col-span-5 flex items-center gap-2 text-xs md:text-sm text-slate-600 min-w-0">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="truncate" title={facility.address || 'Địa chỉ đang cập nhật'}>
          {facility.address || 'Địa chỉ đang cập nhật'}
        </span>
      </div>

      {/* Cột 3: Đội ngũ nhân sự & Thao tác */}
      <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-3 shrink-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
          <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{stats.totalStaff} nhân viên</span>
        </span>
        <span className="sr-only">Điều phối & Phân công việc</span>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </div>
  );
};


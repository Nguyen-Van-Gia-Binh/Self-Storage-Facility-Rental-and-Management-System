import React from 'react';
import { Building2, Users, ArrowRight, MapPin } from 'lucide-react';
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
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-brand-300 transition-all p-5 flex flex-col justify-between group">
      <div>
        {/* Header: Mã & Tên cơ sở */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider block">
                {facility.code}
              </span>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                {facility.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Địa chỉ */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{facility.address || 'Địa chỉ đang cập nhật'}</span>
        </div>

        <div className="h-px bg-slate-100 mb-4" />

        {/* Mini-stats: Nhân viên cơ sở */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-700 bg-slate-50/70 rounded-xl p-3 border border-slate-100">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Đội ngũ nhân sự:
            </span>
            <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
              {stats.totalStaff} nhân viên
            </span>
          </div>
        </div>
      </div>

      {/* Button Điều hướng Phân công */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onViewSchedule(Number(facility.id))}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-600 hover:text-white rounded-xl transition-all cursor-pointer"
        >
          <span>Điều phối & Phân công việc</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

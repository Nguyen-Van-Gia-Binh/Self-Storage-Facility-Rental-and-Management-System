// frontend/src/features/manager/components/FacilityShiftSummaryCard.tsx
import React from 'react';
import { Building2, Users, Calendar, ArrowRight, MapPin } from 'lucide-react';
import type { FacilityListItem } from '@/types';

export interface FacilityShiftStats {
  totalStaff: number;
  morningStaffCount: number;
  afternoonStaffCount: number;
  nightStaffCount: number;
}

interface FacilityShiftSummaryCardProps {
  facility: FacilityListItem;
  stats?: FacilityShiftStats;
  onViewSchedule: (facilityId: number) => void;
}

export const FacilityShiftSummaryCard: React.FC<FacilityShiftSummaryCardProps> = ({
  facility,
  stats = {
    totalStaff: 6,
    morningStaffCount: 2,
    afternoonStaffCount: 2,
    nightStaffCount: 2,
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

        {/* Mini-stats: Nhân viên & Ca trực */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Tổng nhân sự:
            </span>
            <span className="font-bold text-slate-900">{stats.totalStaff} nhân viên</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mb-1.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Ca trực hôm nay:</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center font-semibold">
              <div className="bg-white rounded-lg py-1 px-1 border border-slate-100 text-slate-700">
                <span className="text-[10px] text-slate-400 block font-normal">Sáng</span>
                <span className="text-brand-600 font-bold">{stats.morningStaffCount}</span>
              </div>
              <div className="bg-white rounded-lg py-1 px-1 border border-slate-100 text-slate-700">
                <span className="text-[10px] text-slate-400 block font-normal">Chiều</span>
                <span className="text-amber-600 font-bold">{stats.afternoonStaffCount}</span>
              </div>
              <div className="bg-white rounded-lg py-1 px-1 border border-slate-100 text-slate-700">
                <span className="text-[10px] text-slate-400 block font-normal">Đêm</span>
                <span className="text-indigo-600 font-bold">{stats.nightStaffCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Button Điều hướng Cấp 2 */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onViewSchedule(Number(facility.id))}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-600 hover:text-white rounded-xl transition-all cursor-pointer"
        >
          <span>Xem lịch trực</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

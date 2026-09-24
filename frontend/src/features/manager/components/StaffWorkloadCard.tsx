import React from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  Filter,
  UserCheck,
} from 'lucide-react';
import type { StaffWorkloadItem } from '../types/staffAssignment';

interface StaffWorkloadCardProps {
  staff: StaffWorkloadItem;
  isSelected?: boolean;
  onSelectForFilter?: (staffId: number | null) => void;
  onViewSchedule: (staff: StaffWorkloadItem) => void;
}

export const StaffWorkloadCard: React.FC<StaffWorkloadCardProps> = ({
  staff,
  isSelected,
  onSelectForFilter,
  onViewSchedule,
}) => {
  // Xác định màu sắc và nhãn tình trạng quá tải / cân bằng tải (AC-3)
  const getWorkloadBadge = () => {
    if (staff.status === 'OVERLOADED' || staff.activeTaskCount >= 5) {
      return {
        label: 'Quá tải (≥5)',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500 animate-pulse',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-600',
      };
    }
    if (staff.status === 'AVAILABLE' || staff.activeTaskCount <= 2) {
      return {
        label: 'Sẵn sàng',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-600',
      };
    }
    return {
      label: 'Bình thường',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-500',
      barColor: 'bg-blue-500',
      textColor: 'text-blue-600',
    };
  };

  const badge = getWorkloadBadge();
  const progressPercent = Math.min(100, Math.round((staff.activeTaskCount / 6) * 100));

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 bg-white p-4 shadow-sm flex flex-col justify-between ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div>
        {/* Top bar: Avatar & Tình trạng tải */}
        <div className="flex items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-11 h-11 shrink-0">
              {staff.avatarUrl ? (
                <img
                  src={staff.avatarUrl}
                  alt={staff.staffName}
                  className="w-11 h-11 shrink-0 rounded-xl object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-11 h-11 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200 shadow-2xs">
                  {staff.staffName.charAt(0)}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${badge.dotClass}`}
                title={badge.label}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-sm tracking-tight leading-snug truncate" title={staff.staffName}>
                {staff.staffName}
              </h4>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{staff.shift || 'Ca làm việc chính'}</span>
              </p>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 shrink-0 whitespace-nowrap ${badge.className}`}
          >
            {staff.status === 'OVERLOADED' ? (
              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
            ) : (
              <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
            )}
            {badge.label}
          </span>
        </div>

        {/* Thanh đo tải công việc (Workload Bar) */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-500">Mức độ tiếp nhận task:</span>
            <span className={`font-bold ${badge.textColor}`}>
              {staff.activeTaskCount} đang làm / 6 tối đa
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${badge.barColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Thống kê nhiệm vụ trong ngày */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Đang xử lý</p>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">
              {staff.activeTaskCount}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <p className="text-emerald-600 text-[10px] uppercase font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đã xong
            </p>
            <p className="text-base font-extrabold text-emerald-700 mt-0.5">
              {staff.completedTaskCount}
            </p>
          </div>
        </div>

        {/* Thông tin liên hệ nhanh */}
        <div className="space-y-1 text-[11px] text-slate-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{staff.staffPhone}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{staff.staffEmail}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewSchedule(staff)}
          className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Xem ca trực</span>
        </button>

        {onSelectForFilter && (
          <button
            type="button"
            onClick={() => onSelectForFilter(isSelected ? null : staff.staffId)}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
            }`}
            title={isSelected ? 'Hủy lọc' : 'Lọc nhiệm vụ của nhân viên này'}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isSelected ? 'Đang lọc' : 'Lọc'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// frontend/src/features/manager/components/ShiftCard.tsx
import React from 'react';
import { User, Phone, CheckCircle, PackageOpen, Wrench, ArrowRight } from 'lucide-react';
import type { StaffWorkloadItem } from '../types/staffAssignment';

export interface ShiftStaffTasksCount {
  checkInCount: number;
  returnCount: number;
  incidentCount: number;
}

interface ShiftCardProps {
  staff: StaffWorkloadItem;
  taskCounts?: ShiftStaffTasksCount;
  onViewDetails?: (staffId: number) => void;
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  staff,
  taskCounts = { checkInCount: 1, returnCount: 1, incidentCount: 0 },
  onViewDetails,
}) => {
  const getLoadBadge = () => {
    switch (staff.status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Sẵn sàng
          </span>
        );
      case 'OVERLOADED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Quá tải ({staff.activeTaskCount} việc)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Đang trực
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all p-3.5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{staff.staffName}</h4>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" />
                <span>{staff.staffPhone || '090-xxxx-xxx'}</span>
              </p>
            </div>
          </div>
          {getLoadBadge()}
        </div>

        {/* Mini stats công việc của nhân viên trong ca */}
        <div className="grid grid-cols-3 gap-1.5 py-2 my-2 bg-slate-50 rounded-lg text-center border border-slate-100">
          <div className="px-1">
            <span className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
              <CheckCircle className="w-2.5 h-2.5 text-brand-500" />
              Check-in
            </span>
            <span className="text-xs font-bold text-slate-800">{taskCounts.checkInCount}</span>
          </div>
          <div className="px-1 border-x border-slate-200/60">
            <span className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
              <PackageOpen className="w-2.5 h-2.5 text-amber-500" />
              Trả kho
            </span>
            <span className="text-xs font-bold text-slate-800">{taskCounts.returnCount}</span>
          </div>
          <div className="px-1">
            <span className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
              <Wrench className="w-2.5 h-2.5 text-rose-500" />
              Sự cố
            </span>
            <span className="text-xs font-bold text-slate-800">{taskCounts.incidentCount}</span>
          </div>
        </div>
      </div>

      <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-end">
        <button
          type="button"
          onClick={() => onViewDetails && onViewDetails(staff.staffId)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
        >
          <span>Chi tiết việc</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

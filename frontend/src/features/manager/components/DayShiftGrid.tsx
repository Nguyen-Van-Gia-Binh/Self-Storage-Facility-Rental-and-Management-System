// frontend/src/features/manager/components/DayShiftGrid.tsx
import React from 'react';
import { ArrowRight, UserPlus } from 'lucide-react';
import { ShiftCard, type ShiftStaffTasksCount } from './ShiftCard';
import type { StaffWorkloadItem } from '../types/staffAssignment';

export interface ShiftInfo {
  id: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  name: string;
  timeRange: string;
  icon: React.ElementType;
  colorClass: string;
  badgeBg: string;
  staffList: StaffWorkloadItem[];
}

interface DayShiftGridProps {
  shifts: ShiftInfo[];
  staffTaskCountsMap?: Record<number, ShiftStaffTasksCount>;
  onViewStaffWork: (staffId: number, shiftId: string) => void;
  onViewShiftWork: (shiftId: string) => void;
  onAddAssignment?: (shiftId?: string) => void;
}

export const DayShiftGrid: React.FC<DayShiftGridProps> = ({
  shifts,
  staffTaskCountsMap = {},
  onViewStaffWork,
  onViewShiftWork,
  onAddAssignment,
}) => {
  return (
    <div className="space-y-6">
      {shifts.map((shift) => {
        const IconComponent = shift.icon;
        return (
          <div
            key={shift.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
          >
            {/* Header ca trực */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${shift.badgeBg} ${shift.colorClass}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                      {shift.name}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {shift.timeRange}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {shift.staffList.length} nhân viên được phân công ca này
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {onAddAssignment && (
                  <button
                    type="button"
                    onClick={() => onAddAssignment(shift.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                    <span>Thêm nhân sự</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onViewShiftWork(shift.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-600 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <span>Xem công việc ca</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Grid nhân viên */}
            <div className="p-4">
              {shift.staffList.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  (Chưa có nhân viên trực ca này)
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {shift.staffList.map((st) => (
                    <ShiftCard
                      key={st.staffId}
                      staff={st}
                      taskCounts={staffTaskCountsMap[st.staffId]}
                      onViewDetails={() => onViewStaffWork(st.staffId, shift.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

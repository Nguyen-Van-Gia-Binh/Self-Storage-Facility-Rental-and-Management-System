// frontend/src/features/manager/components/CalendarWeekView.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export interface DayWorkSummary {
  date: string; // YYYY-MM-DD
  dayLabel: string; // T2, T3...
  dayNumber: number;
  taskCount: number;
  isToday: boolean;
}

interface CalendarWeekViewProps {
  currentDate: string; // YYYY-MM-DD
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  daySummaries: DayWorkSummary[];
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onCurrentWeek?: () => void;
  monthTitle?: string; // Tháng 11/2026
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  selectedDate,
  onSelectDate,
  daySummaries,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  monthTitle = 'Tháng này',
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 mb-6">
      {/* Header chuyển tuần */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800">
          <CalendarIcon className="w-4 h-4 text-brand-600" />
          <span className="font-bold text-sm tracking-tight">{monthTitle}</span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={onPrevWeek}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Tuần trước</span>
          </button>
          <button
            type="button"
            onClick={onCurrentWeek}
            className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Tuần sau</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid 7 ngày */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {daySummaries.map((day) => {
          const isSelected = day.date === selectedDate;
          return (
            <button
              type="button"
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={`flex flex-col items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300'
              }`}
            >
              <span
                className={`text-[11px] font-semibold uppercase ${
                  isSelected ? 'text-brand-600' : 'text-slate-500'
                }`}
              >
                {day.dayLabel}
              </span>
              <div
                className={`my-1 text-base font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                  day.isToday
                    ? 'bg-brand-600 text-white shadow-xs'
                    : isSelected
                    ? 'text-brand-700'
                    : 'text-slate-800'
                }`}
              >
                {day.dayNumber}
              </div>
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-0.5">
                <span className="font-bold text-slate-700">{day.taskCount}</span>
                <span className="text-[10px] text-slate-400">cv</span>
              </div>
              <span
                className={`mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                  isSelected
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {isSelected ? 'Đang chọn' : 'Xem'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

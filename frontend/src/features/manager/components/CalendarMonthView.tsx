// frontend/src/features/manager/components/CalendarMonthView.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarMonthViewProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const d = new Date(selectedDate || '2026-11-15');
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = currentYearMonth;

  const handlePrevMonth = () => {
    setCurrentYearMonth((prev) => {
      const newMonth = prev.month === 0 ? 11 : prev.month - 1;
      const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setCurrentYearMonth((prev) => {
      const newMonth = prev.month === 11 ? 0 : prev.month + 1;
      const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Convert so Monday is 0: (day + 6) % 7
  const startOffset = (firstDayOfWeek + 6) % 7;

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: startOffset }, (_, i) => i);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 mb-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <h3 className="font-bold text-sm text-slate-800">
          {monthNames[month]} / {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <span key={d} className="text-[11px] font-bold text-slate-400 py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {blanksArray.map((b) => (
          <div key={`blank-${b}`} className="p-2" />
        ))}
        {daysArray.map((day) => {
          const formattedMonth = String(month + 1).padStart(2, '0');
          const formattedDay = String(day).padStart(2, '0');
          const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-brand-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-brand-50 hover:text-brand-600'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

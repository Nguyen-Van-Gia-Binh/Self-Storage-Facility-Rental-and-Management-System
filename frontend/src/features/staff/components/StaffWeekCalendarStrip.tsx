import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';

export interface StaffWeekCalendarStripProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onDateChange: (newDate: string) => void;
  totalTasksForSelectedDate?: number;
}

// Chuyển đổi an toàn 'YYYY-MM-DD' sang Date theo giờ địa phương (tránh lệch timezone UTC)
export const parseLocalDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

// Định dạng Date sang 'YYYY-MM-DD' theo giờ địa phương
export const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Tìm ngày Thứ Hai đầu tuần (theo chuẩn lịch Việt Nam & ISO, tuần bắt đầu từ Thứ Hai)
export const getMondayOfWeek = (d: Date): Date => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayOfWeek = date.getDay(); // 0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + diff);
  return date;
};

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const StaffWeekCalendarStrip: React.FC<StaffWeekCalendarStripProps> = ({
  selectedDate,
  onDateChange,
  totalTasksForSelectedDate,
}) => {
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  // Ngày Thứ Hai của tuần đang hiển thị
  const [viewingMonday, setViewingMonday] = useState<Date>(() => {
    const initial = parseLocalDate(selectedDate);
    return getMondayOfWeek(initial);
  });

  // Tự động đồng bộ tuần hiển thị khi selectedDate thay đổi từ bên ngoài (ví dụ đổi URL hay bộ lọc)
  useEffect(() => {
    if (selectedDate) {
      const parsed = parseLocalDate(selectedDate);
      const targetMonday = getMondayOfWeek(parsed);
      setViewingMonday((prev) => {
        if (formatLocalDate(prev) !== formatLocalDate(targetMonday)) {
          return targetMonday;
        }
        return prev;
      });
    }
  }, [selectedDate]);

  // Sinh 7 ngày trong tuần từ Thứ Hai đến Chủ Nhật
  const weekDays = useMemo(() => {
    const days: Array<{
      dateStr: string;
      date: Date;
      dayLabel: string;
      dayNumber: number;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(viewingMonday.getFullYear(), viewingMonday.getMonth(), viewingMonday.getDate() + i);
      const dateStr = formatLocalDate(d);
      days.push({
        dateStr,
        date: d,
        dayLabel: DAY_LABELS[i],
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    return days;
  }, [viewingMonday, selectedDate, todayStr]);

  // Thông tin tiêu đề tuần (ví dụ: 12/10 – 18/10/2026)
  const weekRangeText = useMemo(() => {
    if (weekDays.length === 0) return '';
    const firstDay = weekDays[0].date;
    const lastDay = weekDays[6].date;
    const startStr = `${firstDay.getDate()}/${firstDay.getMonth() + 1}`;
    const endStr = `${lastDay.getDate()}/${lastDay.getMonth() + 1}/${lastDay.getFullYear()}`;
    return `Tuần: ${startStr} – ${endStr}`;
  }, [weekDays]);

  // Chuyển sang tuần trước
  const handlePrevWeek = () => {
    const prev = new Date(viewingMonday.getFullYear(), viewingMonday.getMonth(), viewingMonday.getDate() - 7);
    setViewingMonday(prev);
  };

  // Chuyển sang tuần kế tiếp
  const handleNextWeek = () => {
    const next = new Date(viewingMonday.getFullYear(), viewingMonday.getMonth(), viewingMonday.getDate() + 7);
    setViewingMonday(next);
  };

  // Về ngày hôm nay
  const handleGoToday = () => {
    const today = new Date();
    setViewingMonday(getMondayOfWeek(today));
    onDateChange(formatLocalDate(today));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-3.5 py-3 sm:px-4 space-y-2.5">
      {/* Header điều khiển tuần & Chuyển ngày */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-200/60">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Lịch trực tuần</span>
            <span className="text-xs text-slate-300 hidden sm:inline">·</span>
            <span className="text-xs font-semibold text-brand-700">{weekRangeText}</span>
          </div>
        </div>

        {/* Cụm nút điều hướng: Hôm nay / Tuần trước / Tuần sau */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleGoToday}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer border ${
              selectedDate === todayStr
                ? 'bg-brand-50 text-brand-700 border-brand-200'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
            title="Quay lại ngày hôm nay"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Hôm nay</span>
          </button>

          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/70 p-0.5">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dải ngang 7 ngày gọn gàng (Ẩn hoàn toàn thanh cuộn ngang, chia đều 7 cột trên màn hình lớn) */}
      <div className="flex md:grid md:grid-cols-7 items-stretch gap-2 overflow-x-auto md:overflow-visible pb-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {weekDays.map((day) => {
          const { dateStr, dayLabel, dayNumber, isToday, isSelected } = day;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDateChange(dateStr)}
              className={`relative flex-1 min-w-[74px] md:min-w-0 rounded-xl px-2.5 py-2 text-center transition-colors duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5 select-none ${
                isSelected
                  ? 'bg-white border-2 border-brand-500 text-brand-700 shadow-sm'
                  : 'bg-slate-50/80 hover:bg-slate-100 text-slate-600 border border-slate-200/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <span
                  className={`text-[11px] uppercase tracking-wider ${
                    isSelected ? 'font-bold text-brand-600' : 'font-medium text-slate-500'
                  }`}
                >
                  {dayLabel}
                </span>
                {isSelected && typeof totalTasksForSelectedDate === 'number' && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-brand-50 text-brand-700 border border-brand-200/80">
                    {totalTasksForSelectedDate} việc
                  </span>
                )}
              </div>

              <span
                className={`text-lg font-bold num leading-tight ${
                  isSelected ? 'text-brand-700' : 'text-slate-800'
                }`}
              >
                {dayNumber < 10 ? `0${dayNumber}` : dayNumber}
              </span>

              {isToday && (
                <span
                  className={`absolute -bottom-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  Hôm nay
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

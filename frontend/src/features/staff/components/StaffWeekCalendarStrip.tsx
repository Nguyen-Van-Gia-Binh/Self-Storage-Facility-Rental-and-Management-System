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

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

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
      monthText: string;
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
        monthText: `${d.getDate()} Thg ${d.getMonth() + 1}`,
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 space-y-3">
      {/* Header điều khiển tuần & Chuyển ngày */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/60">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800">Lịch ca trực tuần</span>
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">·</span>
              <span className="text-xs font-semibold text-teal-700">{weekRangeText}</span>
            </div>
          </div>
        </div>

        {/* Cụm nút điều hướng: Tuần trước / Hôm nay / Tuần sau */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleGoToday}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
              selectedDate === todayStr
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
            title="Quay lại ngày hôm nay"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Hôm nay</span>
          </button>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 p-0.5">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dải 7 thẻ ngày (Ẩn hoàn toàn thanh cuộn ngang, chia đều 7 cột trên màn hình lớn) */}
      <div className="flex md:grid md:grid-cols-7 items-stretch gap-2 sm:gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {weekDays.map((day) => {
          const { dateStr, dayLabel, dayNumber, monthText, isToday, isSelected } = day;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDateChange(dateStr)}
              className={`flex-1 min-w-[92px] md:min-w-0 rounded-2xl p-2.5 sm:p-3 text-center transition-colors duration-200 cursor-pointer border flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                  : 'bg-white hover:bg-teal-50/40 text-slate-700 border-slate-200/90 hover:border-teal-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* Hàng 1: Thứ & Badge Hôm nay */}
              <div className="flex items-center justify-between gap-1 w-full mb-1">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                    isSelected ? 'text-teal-100' : 'text-slate-500'
                  }`}
                >
                  {dayLabel}
                </span>
                {isToday && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    Hôm nay
                  </span>
                )}
              </div>

              {/* Hàng 2: Số ngày to nổi bật */}
              <div className="my-0.5">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {dayNumber < 10 ? `0${dayNumber}` : dayNumber}
                </span>
              </div>

              {/* Hàng 3: Chi tiết ngày & Thống kê nhiệm vụ khi được chọn */}
              <div className="mt-1 pt-1 border-t border-current/15 flex flex-col items-center">
                <span
                  className={`text-[11px] font-medium leading-none ${
                    isSelected ? 'text-teal-100' : 'text-slate-400'
                  }`}
                >
                  {monthText}
                </span>

                {isSelected && typeof totalTasksForSelectedDate === 'number' && (
                  <span className="text-[10px] font-bold text-white bg-teal-700/70 px-1.5 py-0.5 rounded-md mt-1 leading-none shadow-2xs">
                    {totalTasksForSelectedDate} việc ca trực
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

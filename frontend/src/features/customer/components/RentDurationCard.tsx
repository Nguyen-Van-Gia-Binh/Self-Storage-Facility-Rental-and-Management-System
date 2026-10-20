import React from 'react';
import { Clock, Minus, Plus, Sparkles } from 'lucide-react';

export interface RentDurationCardProps {
  startDate: string;
  todayStr: string;
  onStartDateChange: (val: string) => void;
  calculatedEndDate: string;
  durationMonths: number;
  onDurationChange: (months: number) => void;
  isCustomMode: boolean;
  setIsCustomMode: (custom: boolean) => void;
  quickMilestones: Array<{ months: number; label: string }>;
  discountAmount?: number;
  discountPercent?: number;
  discountProgramName?: string | null;
  formatDateVN: (dateStr: string) => string;
}

/**
 * RentDurationCard — Thẻ 1: Thời gian thuê (Start Date + Segmented Duration Control)
 */
export const RentDurationCard: React.FC<RentDurationCardProps> = ({
  startDate,
  todayStr,
  onStartDateChange,
  calculatedEndDate,
  durationMonths,
  onDurationChange,
  isCustomMode,
  setIsCustomMode,
  quickMilestones,
  discountAmount = 0,
  discountPercent = 0,
  discountProgramName = null,
  formatDateVN,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800 block">
        1. Thời gian thuê
      </span>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chọn ngày bắt đầu */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Ngày bắt đầu lưu kho
          </label>
          <input
            type="date"
            min={todayStr}
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all shadow-2xs"
          />
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>
              Dự kiến kết thúc: <strong className="text-slate-800">{formatDateVN(calculatedEndDate)}</strong>
            </span>
          </p>
        </div>

        {/* Chọn thời hạn thuê (Segmented Control + Stepper) */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Thời hạn thuê
          </label>

          {/* Segmented Control */}
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {quickMilestones.map((pkg) => {
              const isSelected = !isCustomMode && durationMonths === pkg.months;
              return (
                <button
                  key={pkg.months}
                  type="button"
                  onClick={() => {
                    setIsCustomMode(false);
                    onDurationChange(pkg.months);
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-brand-800 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {pkg.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isCustomMode
                  ? 'bg-white text-brand-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              Tùy chỉnh
            </button>
          </div>

          {/* Stepper chỉ hiện khi isCustomMode */}
          {isCustomMode && (
            <div className="flex items-center justify-between p-2 mt-2 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-600">
                Số tháng tùy chỉnh:
              </span>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onDurationChange(Math.max(1, durationMonths - 1))}
                  disabled={durationMonths <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-l border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Giảm 1 tháng"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={durationMonths}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onDurationChange(isNaN(val) || val < 1 ? 1 : Math.min(120, val));
                  }}
                  className="w-14 h-7 text-center border-y border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onDurationChange(Math.min(120, durationMonths + 1))}
                  disabled={durationMonths >= 120}
                  className="w-7 h-7 flex items-center justify-center rounded-r border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Tăng 1 tháng"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-slate-500 ml-1.5">tháng</span>
              </div>
            </div>
          )}

          {/* Banner ưu đãi nếu có */}
          {discountAmount > 0 && (
            <p className="text-[11px] font-medium text-emerald-700 mt-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {discountProgramName ? (
                  <strong>
                    {discountProgramName}
                    {discountPercent > 0 && !discountProgramName.includes('%') ? ` (-${discountPercent}%)` : ''}
                  </strong>
                ) : (
                  <strong>Ưu đãi giảm {discountPercent}%</strong>
                )}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

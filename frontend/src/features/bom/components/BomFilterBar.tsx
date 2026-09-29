import React, { useState } from 'react';
import { Calendar, Building2, AlertCircle } from 'lucide-react';
import type { ReportFilterParams } from '@/types';
import { Button } from '@/components/ui/Button';

export interface BomFilterBarProps {
  filters: ReportFilterParams;
  onChange: (filters: ReportFilterParams) => void;
  onOpenExport?: () => void;
  facilities: { id: number; name: string }[];
  isLoading?: boolean;
}

/** Ngày hiện tại theo Asia/Ho_Chi_Minh (YYYY-MM-DD). */
function todayInHoChiMinh(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function formatYmd(year: number, monthIndex0: number, day: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function periodRange(
  type: Exclude<ReportFilterParams['periodType'], 'CUSTOM'>
): { from: string; to: string } {
  const today = todayInHoChiMinh();
  const [y, m] = today.split('-').map(Number);
  const monthIndex0 = m - 1;

  if (type === 'THIS_MONTH') {
    return {
      from: formatYmd(y, monthIndex0, 1),
      to: formatYmd(y, monthIndex0, daysInMonth(y, monthIndex0)),
    };
  }

  if (type === 'LAST_MONTH') {
    const lastMonthIndex = monthIndex0 === 0 ? 11 : monthIndex0 - 1;
    const lastMonthYear = monthIndex0 === 0 ? y - 1 : y;
    return {
      from: formatYmd(lastMonthYear, lastMonthIndex, 1),
      to: formatYmd(lastMonthYear, lastMonthIndex, daysInMonth(lastMonthYear, lastMonthIndex)),
    };
  }

  // THIS_QUARTER
  const quarterStartMonth = Math.floor(monthIndex0 / 3) * 3;
  const quarterEndMonth = quarterStartMonth + 2;
  return {
    from: formatYmd(y, quarterStartMonth, 1),
    to: formatYmd(y, quarterEndMonth, daysInMonth(y, quarterEndMonth)),
  };
}

function thisMonthLabel(): string {
  const today = todayInHoChiMinh();
  const [y, m] = today.split('-');
  return `Tháng ${Number(m)}/${y}`;
}

function thisQuarterLabel(): string {
  const today = todayInHoChiMinh();
  const [y, m] = today.split('-').map(Number);
  const quarter = Math.floor((m - 1) / 3) + 1;
  return `Quý ${quarter}/${y}`;
}

export const BomFilterBar: React.FC<BomFilterBarProps> = ({
  filters,
  onChange,
  facilities,
  isLoading = false,
}) => {
  const [customFrom, setCustomFrom] = useState(filters.from);
  const [customTo, setCustomTo] = useState(filters.to);
  const [dateError, setDateError] = useState<string | null>(null);

  const handlePeriodChange = (type: ReportFilterParams['periodType']) => {
    setDateError(null);
    if (type !== 'CUSTOM') {
      const { from: newFrom, to: newTo } = periodRange(type);
      setCustomFrom(newFrom);
      setCustomTo(newTo);
      onChange({
        ...filters,
        periodType: type,
        from: newFrom,
        to: newTo,
      });
    } else {
      onChange({
        ...filters,
        periodType: 'CUSTOM',
      });
    }
  };

  const handleApplyCustomDates = () => {
    // US-BM-04.1 AC-4: Từ chối nếu ngày kết thúc trước ngày bắt đầu
    if (customFrom && customTo && customTo < customFrom) {
      setDateError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
      return;
    }
    setDateError(null);
    onChange({
      ...filters,
      periodType: 'CUSTOM',
      from: customFrom,
      to: customTo,
    });
  };

  const currentFrom = filters.periodType === 'CUSTOM' ? customFrom : filters.from;
  const currentTo = filters.periodType === 'CUSTOM' ? customTo : filters.to;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Bộ nút chọn nhanh kỳ báo cáo */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Kỳ báo cáo:
          </span>
          {(
            [
              { id: 'THIS_MONTH', label: thisMonthLabel() },
              { id: 'LAST_MONTH', label: 'Tháng trước' },
              { id: 'THIS_QUARTER', label: thisQuarterLabel() },
              { id: 'CUSTOM', label: 'Tùy chọn / 30 ngày gần nhất' },
            ] as const
          ).map((p) => {
            const isActive = filters.periodType === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0a1614] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dòng chọn chi tiết ngày và chi nhánh */}
      <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Chọn ngày từ - đến */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Từ:</span>
            <input
              type="date"
              value={currentFrom}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setDateError(null);
                if (filters.periodType !== 'CUSTOM') {
                  onChange({ ...filters, periodType: 'CUSTOM', from: e.target.value, to: currentTo });
                }
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Đến:</span>
            <input
              type="date"
              value={currentTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setDateError(null);
                if (filters.periodType !== 'CUSTOM') {
                  onChange({ ...filters, periodType: 'CUSTOM', from: currentFrom, to: e.target.value });
                }
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          {/* Nút áp dụng ngày nếu thay đổi */}
          {filters.periodType === 'CUSTOM' && (customFrom !== filters.from || customTo !== filters.to) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyCustomDates}
              className="text-xs py-1.5 px-3 h-8 text-brand-600 border-brand-300 hover:bg-brand-50"
            >
              Áp dụng ngày
            </Button>
          )}

          {/* Dropdown cơ sở — value rỗng = toàn hệ thống (không gửi facilityId=all) */}
          <div className="flex items-center gap-2 ml-0 sm:ml-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.facilityId ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                const val =
                  raw === '' || raw.toLowerCase() === 'all'
                    ? undefined
                    : Number.parseInt(raw, 10);
                onChange({
                  ...filters,
                  facilityId: Number.isFinite(val as number) ? (val as number) : undefined,
                });
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white cursor-pointer"
            >
              <option value="">🏢 Toàn hệ thống (Tất cả cơ sở)</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trạng thái tải dữ liệu */}
        {isLoading && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5 italic">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
            Đang cập nhật số liệu...
          </div>
        )}
      </div>

      {/* Cảnh báo lỗi ngày kết thúc nhỏ hơn ngày bắt đầu */}
      {dateError && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{dateError}</span>
        </div>
      )}
    </div>
  );
};

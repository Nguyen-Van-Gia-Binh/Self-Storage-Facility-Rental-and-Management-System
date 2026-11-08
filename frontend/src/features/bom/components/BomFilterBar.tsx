import React, { useState, useEffect } from 'react';
import { AlertCircle, Filter } from 'lucide-react';
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
  const [localPeriod, setLocalPeriod] = useState(filters.periodType);
  const [localFrom, setLocalFrom] = useState(filters.from);
  const [localTo, setLocalTo] = useState(filters.to);
  const [localFacilityId, setLocalFacilityId] = useState(filters.facilityId);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setLocalPeriod(filters.periodType);
    setLocalFrom(filters.from);
    setLocalTo(filters.to);
    setLocalFacilityId(filters.facilityId);
  }, [filters.from, filters.to, filters.periodType, filters.facilityId]);

  const handlePeriodSelect = (type: Exclude<ReportFilterParams['periodType'], 'CUSTOM'>) => {
    setDateError(null);
    const { from: newFrom, to: newTo } = periodRange(type);
    setLocalPeriod(type);
    setLocalFrom(newFrom);
    setLocalTo(newTo);
  };

  const handleFromChange = (newFrom: string) => {
    setLocalFrom(newFrom);
    setLocalPeriod('CUSTOM');
    if (localTo && newFrom && localTo < newFrom) {
      setDateError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
    } else {
      setDateError(null);
    }
  };

  const handleToChange = (newTo: string) => {
    setLocalTo(newTo);
    setLocalPeriod('CUSTOM');
    if (localFrom && newTo && newTo < localFrom) {
      setDateError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
    } else {
      setDateError(null);
    }
  };

  const handleFacilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    const val = raw === '' || raw.toLowerCase() === 'all' ? undefined : Number.parseInt(raw, 10);
    setLocalFacilityId(Number.isFinite(val as number) ? (val as number) : undefined);
  };

  const handleApplyFilter = () => {
    // US-BM-04.1 AC-4: Từ chối nếu ngày kết thúc trước ngày bắt đầu
    if (localFrom && localTo && localTo < localFrom) {
      setDateError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
      return;
    }
    setDateError(null);
    onChange({
      periodType: localPeriod,
      from: localFrom,
      to: localTo,
      facilityId: localFacilityId,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Bộ nút chọn nhanh kỳ báo cáo */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Kỳ báo cáo:
          </span>
          {(
            [
              { id: 'THIS_MONTH', label: 'Tháng hiện tại' },
              { id: 'LAST_MONTH', label: 'Tháng trước' },
              { id: 'THIS_QUARTER', label: thisQuarterLabel() },
            ] as const
          ).map((p) => {
            const isActive = localPeriod === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodSelect(p.id)}
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
              value={localFrom}
              onChange={(e) => handleFromChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Đến:</span>
            <input
              type="date"
              value={localTo}
              onChange={(e) => handleToChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          {/* Dropdown cơ sở — value rỗng = toàn hệ thống */}
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="text-xs text-slate-500">Cơ sở:</span>
            <select
              value={localFacilityId ?? ''}
              onChange={handleFacilityChange}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white cursor-pointer"
            >
              <option value="">Toàn hệ thống (Tất cả cơ sở)</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nút Lọc dữ liệu */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleApplyFilter}
            isLoading={isLoading}
            className="flex items-center gap-1.5 text-xs py-1.5 px-4 bg-[#0a1614] hover:bg-slate-800 text-white font-medium rounded-lg shadow-sm cursor-pointer ml-0 sm:ml-2"
            title="Áp dụng bộ lọc"
          >
            <Filter className="w-3.5 h-3.5" />
            Lọc
          </Button>
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

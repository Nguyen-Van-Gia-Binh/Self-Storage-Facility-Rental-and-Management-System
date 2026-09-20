import React, { useState, useEffect } from 'react';
import { Calendar, Download, Building2, AlertCircle } from 'lucide-react';
import type { ReportFilterParams } from '@/types';
import { Button } from '@/components/ui/Button';

export interface BomFilterBarProps {
  filters: ReportFilterParams;
  onChange: (filters: ReportFilterParams) => void;
  onOpenExport: () => void;
  facilities: { id: number; name: string }[];
  isLoading?: boolean;
}

export const BomFilterBar: React.FC<BomFilterBarProps> = ({
  filters,
  onChange,
  onOpenExport,
  facilities,
  isLoading = false,
}) => {
  const [localFrom, setLocalFrom] = useState(filters.from);
  const [localTo, setLocalTo] = useState(filters.to);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setLocalFrom(filters.from);
    setLocalTo(filters.to);
  }, [filters.from, filters.to]);

  const handlePeriodChange = (type: ReportFilterParams['periodType']) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed

    let newFrom = '';
    let newTo = '';

    if (type === 'THIS_MONTH') {
      newFrom = new Date(year, month, 1).toISOString().split('T')[0];
      newTo = new Date(year, month + 1, 0).toISOString().split('T')[0];
    } else if (type === 'LAST_MONTH') {
      newFrom = new Date(year, month - 1, 1).toISOString().split('T')[0];
      newTo = new Date(year, month, 0).toISOString().split('T')[0];
    } else if (type === 'THIS_QUARTER') {
      const currentQuarter = Math.floor(month / 3);
      newFrom = new Date(year, currentQuarter * 3, 1).toISOString().split('T')[0];
      newTo = new Date(year, (currentQuarter + 1) * 3, 0).toISOString().split('T')[0];
    }

    if (type !== 'CUSTOM') {
      setDateError(null);
      setLocalFrom(newFrom);
      setLocalTo(newTo);
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
    if (localFrom && localTo && localTo < localFrom) {
      setDateError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
      return;
    }
    setDateError(null);
    onChange({
      ...filters,
      periodType: 'CUSTOM',
      from: localFrom,
      to: localTo,
    });
  };

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
              { id: 'THIS_MONTH', label: 'Tháng 10/2026' },
              { id: 'LAST_MONTH', label: 'Tháng trước' },
              { id: 'THIS_QUARTER', label: 'Quý 4/2026' },
              { id: 'CUSTOM', label: 'Tùy chọn' },
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

        {/* Nút Xuất báo cáo */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenExport}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs py-2 px-3.5 rounded-lg shadow-sm"
          >
            <Download className="w-4 h-4" />
            Trích xuất báo cáo đối soát
          </Button>
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
              onChange={(e) => {
                setLocalFrom(e.target.value);
                setDateError(null);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Đến:</span>
            <input
              type="date"
              value={localTo}
              onChange={(e) => {
                setLocalTo(e.target.value);
                setDateError(null);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          {/* Nút áp dụng ngày nếu thay đổi */}
          {(localFrom !== filters.from || localTo !== filters.to) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyCustomDates}
              className="text-xs py-1.5 px-3 h-8 text-brand-600 border-brand-300 hover:bg-brand-50"
            >
              Áp dụng ngày
            </Button>
          )}

          {/* Dropdown cơ sở */}
          <div className="flex items-center gap-2 ml-0 sm:ml-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.facilityId || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                onChange({
                  ...filters,
                  facilityId: val,
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

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

export const BomFilterBar: React.FC<BomFilterBarProps> = ({
  filters,
  onChange,
  facilities,
  isLoading = false,
}) => {
  const [localFrom, setLocalFrom] = useState(filters.from);
  const [localTo, setLocalTo] = useState(filters.to);
  const [localFacilityId, setLocalFacilityId] = useState(filters.facilityId);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setLocalFrom(filters.from);
    setLocalTo(filters.to);
    setLocalFacilityId(filters.facilityId);
  }, [filters.from, filters.to, filters.facilityId]);

  const handleFromChange = (newFrom: string) => {
    setLocalFrom(newFrom);
    if (dateError) setDateError(null);
  };

  const handleToChange = (newTo: string) => {
    setLocalTo(newTo);
    if (dateError) setDateError(null);
  };

  const handleFacilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    setLocalFacilityId(val);
    onChange({
      periodType: filters.periodType,
      from: localFrom,
      to: localTo,
      facilityId: val,
    });
  };

  const handleApplyFilter = () => {
    if (localFrom && localTo && localFrom > localTo) {
      setDateError('Ngày bắt đầu không được lớn hơn ngày kết thúc');
      return;
    }
    setDateError(null);
    onChange({
      periodType: filters.periodType,
      from: localFrom,
      to: localTo,
      facilityId: localFacilityId,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-3.5 sm:px-4 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Chọn ngày từ - đến */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Từ:</span>
            <input
              type="date"
              value={localFrom}
              onChange={(e) => handleFromChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Đến:</span>
            <input
              type="date"
              value={localTo}
              onChange={(e) => handleToChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <span className="hidden sm:inline text-slate-300">|</span>

          {/* Dropdown cơ sở */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Cơ sở:</span>
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
            className="flex items-center gap-1.5 text-xs py-1.5 px-3.5 bg-[#0a1614] hover:bg-slate-800 text-white font-medium rounded-lg shadow-sm cursor-pointer"
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

      {/* Cảnh báo lỗi ngày */}
      {dateError && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{dateError}</span>
        </div>
      )}
    </div>
  );
};

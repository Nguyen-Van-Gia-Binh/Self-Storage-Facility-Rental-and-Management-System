import React, { useState } from 'react';
import { BarChart3, ArrowUpDown } from 'lucide-react';
import type { FacilityOccupancyItem } from '@/types';
import { formatPercent } from '@/utils/format';

export interface OccupancyComparisonChartProps {
  data: FacilityOccupancyItem[];
  isLoading?: boolean;
}

export const OccupancyComparisonChart: React.FC<OccupancyComparisonChartProps> = ({
  data,
  isLoading = false,
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/3" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Sắp xếp theo Usage Rate theo US-BM-04.2 AC-3
  const sortedData = [...data].sort((a, b) => {
    return sortOrder === 'desc'
      ? b.occupancyRate - a.occupancyRate
      : a.occupancyRate - b.occupancyRate;
  });

  const getBarColor = (rate: number) => {
    if (rate >= 0.8) return 'bg-emerald-500';
    if (rate >= 0.5) return 'bg-brand-500';
    return 'bg-amber-500';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              So Sánh Tỷ Lệ Lấp Đầy & Tải Vận Hành Giữa Các Cơ Sở
            </h3>
            <p className="text-xs text-slate-500">
              Công thức: Usage Rate = Số ô Occupied / (Tổng ô - Out of service)
            </p>
          </div>
        </div>

        {/* Nút sắp xếp */}
        <button
          type="button"
          onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-all self-start sm:self-auto"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>Sắp xếp: {sortOrder === 'desc' ? 'Giảm dần' : 'Tăng dần'}</span>
        </button>
      </div>

      {/* Danh sách các thanh so sánh */}
      <div className="space-y-4 pt-1">
        {sortedData.map((item) => {
          const ratePercent = Math.min(item.occupancyRate * 100, 100);
          const barColor = getBarColor(item.occupancyRate);

          return (
            <div
              key={item.facilityId}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {item.facilityName}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    (ID: #{item.facilityId})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Tỷ lệ lấp đầy:</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {formatPercent(item.occupancyRate)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({item.occupiedUnits}/{item.totalUnits} ô)
                  </span>
                </div>
              </div>

              {/* Thanh tiến trình với mốc 80% */}
              <div className="relative h-4 w-full bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  style={{ width: `${ratePercent}%` }}
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                />
                {/* Vạch mốc chỉ tiêu 80% */}
                <div
                  className="absolute top-0 bottom-0 border-r-2 border-dashed border-slate-400/80"
                  style={{ left: '80%' }}
                  title="Chỉ tiêu vàng: 80%"
                />
              </div>

              {/* Chi tiết phân bổ trạng thái ô kho theo US-BM-04.2 AC-2 */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                <span className="text-slate-400 font-medium">Bóc tách ô kho:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Trống: {item.availableUnits}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Đang thuê: {item.occupiedUnits}
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  Đặt chỗ: {item.reservedUnits}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Bảo trì: {item.maintenanceUnits}
                </span>
                {item.cleaningUnits > 0 && (
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Vệ sinh: {item.cleaningUnits}
                  </span>
                )}
                {item.outOfServiceUnits > 0 && (
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                    Ngừng dùng: {item.outOfServiceUnits}
                  </span>
                )}
                {item.overdueContractsCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                    Quá hạn: {item.overdueContractsCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  ArrowUpDown,
  Search,
  X,
  Filter,
  ChevronRight,
} from 'lucide-react';
import type { FacilityOccupancyItem } from '@/types';
import { formatPercent } from '@/utils/format';
import { TablePagination } from '@/components/ui/TablePagination';
import { Tooltip } from '@/components/ui/Tooltip';

export interface OccupancyComparisonChartProps {
  data: FacilityOccupancyItem[];
  isLoading?: boolean;
  onSelectFacility?: (facilityId: number) => void;
  onOpenDetail?: (facility: FacilityOccupancyItem) => void;
}

export const OccupancyComparisonChart: React.FC<OccupancyComparisonChartProps> = ({
  data,
  isLoading = false,
  onSelectFacility,
  onOpenDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hideZeroOccupancy, setHideZeroOccupancy] = useState(false);
  const [filterUnderTarget, setFilterUnderTarget] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, hideZeroOccupancy, filterUnderTarget, sortOrder, pageSize]);

  const filteredData = useMemo(() => {
    return [...data]
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.facilityName.toLowerCase().includes(q);
          const matchId = String(item.facilityId).includes(q);
          if (!matchName && !matchId) return false;
        }

        if (hideZeroOccupancy) {
          const exploitable = Math.max(0, item.totalUnits - (item.outOfServiceUnits || 0));
          if (exploitable === 0 || item.occupancyRate === 0 || item.occupiedUnits === 0) {
            return false;
          }
        }

        if (filterUnderTarget) {
          if ((item.occupancyRate ?? 0) >= 0.5) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const rateA = a.occupancyRate ?? 0;
        const rateB = b.occupancyRate ?? 0;
        return sortOrder === 'desc' ? rateB - rateA : rateA - rateB;
      });
  }, [data, searchQuery, hideZeroOccupancy, filterUnderTarget, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedData = useMemo(
    () => filteredData.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [filteredData, safePage, pageSize]
  );

  const hasActiveFilters = Boolean(searchQuery.trim() || hideZeroOccupancy || filterUnderTarget);

  const handleResetFilters = () => {
    setSearchQuery('');
    setHideZeroOccupancy(false);
    setFilterUnderTarget(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-5 animate-pulse space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Hiệu Suất Vận Hành &amp; Tỷ Lệ Lấp Đầy Từng Cơ Sở
        </h3>
        <div className="text-xs tabular-nums text-gray-500">
          Tổng số: <strong className="font-semibold text-gray-800">{filteredData.length}</strong> / {data.length} cơ sở
        </div>
      </div>

      {/* Compact Toolbar */}
      <div className="px-4 py-2.5 bg-gray-50/70 border-b border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên hoặc ID cơ sở..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-gray-200 rounded-md outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-colors text-gray-800 placeholder-gray-400 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer px-2.5 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors select-none">
            <input
              type="checkbox"
              checked={hideZeroOccupancy}
              onChange={(e) => setHideZeroOccupancy(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-brand-600 accent-brand-600 focus:ring-brand-500 cursor-pointer"
            />
            <span>Ẩn cơ sở 0%</span>
          </label>

          <button
            type="button"
            onClick={() => setFilterUnderTarget((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              filterUnderTarget
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${filterUnderTarget ? 'text-amber-700' : 'text-gray-400'}`} />
            <span>Chỉ xem &lt; 50%</span>
          </button>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span>Sắp xếp: {sortOrder === 'desc' ? 'Giảm dần' : 'Tăng dần'}</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 transition-colors cursor-pointer"
              title="Đặt lại các điều kiện lọc"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      {filteredData.length === 0 ? (
        <div className="p-10 text-center space-y-2.5">
          <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-gray-800">
            {filterUnderTarget && !searchQuery
              ? 'Tuyệt vời! Không có cơ sở nào dưới chỉ tiêu (< 50%).'
              : 'Không tìm thấy cơ sở phù hợp với bộ lọc.'}
          </p>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Hãy thử điều chỉnh từ khóa tìm kiếm hoặc xóa các điều kiện lọc để hiển thị toàn bộ cơ sở.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer mt-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-full">Tên cơ sở</th>
                  <th className="py-2.5 px-4 text-right tabular-nums">Tổng ô kho</th>
                  <th className="py-2.5 px-4 text-right tabular-nums">Đã thuê</th>
                  <th className="py-2.5 px-4 text-right tabular-nums">Trống</th>
                  <th className="py-2.5 px-4 text-right">Tỷ lệ lấp đầy</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">
                    <span className="sr-only">Chi tiết</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {pagedData.map((item) => {
                  const exploitableUnits = Math.max(0, item.totalUnits - (item.outOfServiceUnits || 0));
                  const rateUnknown = item.occupancyRate == null || exploitableUnits === 0;
                  const rate = item.occupancyRate ?? 0;
                  const pct = rateUnknown ? 0 : Math.min(Math.max(rate * 100, 0), 100);

                  const breakdownParts = [
                    `Đặt chỗ: ${item.reservedUnits}`,
                    `Bảo trì: ${item.maintenanceUnits}`,
                    item.cleaningUnits > 0 ? `Vệ sinh: ${item.cleaningUnits}` : null,
                    item.outOfServiceUnits > 0 ? `Ngừng dùng: ${item.outOfServiceUnits}` : null,
                    `Quá hạn: ${item.overdueContractsCount}`,
                  ].filter(Boolean).join(' · ');

                  const handleFacilityClick = () => {
                    if (onOpenDetail) {
                      onOpenDetail(item);
                    } else if (onSelectFacility) {
                      onSelectFacility(item.facilityId);
                    }
                  };

                  return (
                    <tr key={item.facilityId} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleFacilityClick}
                            className="font-semibold text-gray-900 group-hover:text-brand-600 hover:underline text-left cursor-pointer transition-colors"
                          >
                            {item.facilityName}
                          </button>
                          <span className="text-[11px] text-gray-400 tabular-nums">
                            #{item.facilityId}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-700 font-medium">
                        {item.totalUnits}
                      </td>

                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-900 font-semibold">
                        {item.occupiedUnits}
                      </td>

                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-600">
                        {item.availableUnits}
                      </td>

                      <td className="py-2.5 px-4">
                        {rateUnknown ? (
                          <span className="block text-right text-gray-400">N/A</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2.5">
                            <div
                              role="progressbar"
                              aria-valuenow={Math.round(pct)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Tỷ lệ lấp đầy ${item.facilityName}`}
                              className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden shrink-0"
                            >
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full transition-all ${
                                  pct >= 50 ? 'bg-brand-600' : pct > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                }`}
                              />
                            </div>
                            <span className="tabular-nums font-semibold text-gray-800 w-11 text-right">
                              {formatPercent(item.occupancyRate)}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        <Tooltip content={breakdownParts} position="top">
                          {item.overdueContractsCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Quá hạn ({item.overdueContractsCount})
                            </span>
                          ) : rateUnknown ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              Chưa khai thác
                            </span>
                          ) : rate >= 0.5 ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Ổn định
                            </span>
                          ) : rate < 0.1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Lấp đầy thấp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Đang khai thác
                            </span>
                          )}
                        </Tooltip>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={handleFacilityClick}
                          aria-label="Chi tiết"
                          title="Xem chi tiết cơ sở"
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={safePage}
            pageSize={pageSize}
            totalElements={filteredData.length}
            totalPages={totalPages}
            itemLabel="cơ sở"
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
            }}
          />
        </>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  ArrowUpDown,
  Search,
  AlertTriangle,
  X,
  Filter,
} from 'lucide-react';
import type { FacilityOccupancyItem } from '@/types';
import { formatPercent } from '@/utils/format';

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
  // 1. Toàn bộ React hooks phải đặt ở trên đầu component (tuân thủ tuyệt đối React Rules of Hooks)
  const [searchQuery, setSearchQuery] = useState('');
  const [hideZeroOccupancy, setHideZeroOccupancy] = useState(false);
  const [filterUnderTarget, setFilterUnderTarget] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 2. Lọc và sắp xếp dữ liệu
  const filteredData = useMemo(() => {
    return [...data]
      .filter((item) => {
        // Tìm kiếm theo tên hoặc mã ID cơ sở
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.facilityName.toLowerCase().includes(q);
          const matchId = String(item.facilityId).includes(q);
          if (!matchName && !matchId) return false;
        }

        // Toggle: Ẩn cơ sở 0%
        if (hideZeroOccupancy) {
          const exploitable = Math.max(0, item.totalUnits - (item.outOfServiceUnits || 0));
          if (exploitable === 0 || item.occupancyRate === 0 || item.occupiedUnits === 0) {
            return false;
          }
        }

        // Filter: Chỉ xem cơ sở dưới chỉ tiêu (< 50%)
        if (filterUnderTarget) {
          if (item.occupancyRate >= 0.5) return false;
        }

        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'desc'
          ? b.occupancyRate - a.occupancyRate
          : a.occupancyRate - b.occupancyRate;
      });
  }, [data, searchQuery, hideZeroOccupancy, filterUnderTarget, sortOrder]);

  const hasActiveFilters = Boolean(searchQuery.trim() || hideZeroOccupancy || filterUnderTarget);

  const handleResetFilters = () => {
    setSearchQuery('');
    setHideZeroOccupancy(false);
    setFilterUnderTarget(false);
  };

  // 3. Early return skeleton sau khi đã khai báo đầy đủ hooks
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/3" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // 4. Hàm helper phân định dải màu KPI theo chuẩn Enterprise UX
  const getRateColorMeta = (rate: number, rateUnknown: boolean) => {
    if (rateUnknown) {
      return {
        textColor: 'text-slate-400',
        barColor: 'bg-slate-300',
        isAlarm: false,
        isExemplary: false,
      };
    }
    if (rate >= 0.8) {
      return {
        textColor: 'text-emerald-600',
        barColor: 'bg-emerald-500',
        isAlarm: false,
        isExemplary: true,
      };
    }
    if (rate >= 0.7) {
      return {
        textColor: 'text-sky-600',
        barColor: 'bg-sky-500',
        isAlarm: false,
        isExemplary: false,
      };
    }
    if (rate >= 0.3) {
      return {
        textColor: 'text-amber-600',
        barColor: 'bg-amber-500',
        isAlarm: false,
        isExemplary: false,
      };
    }
    // Dưới 30%: Báo động đỏ
    return {
      textColor: 'text-rose-600',
      barColor: 'bg-rose-500',
      isAlarm: true,
      isExemplary: false,
    };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5">
      {/* 1. Header Khối */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Hiệu Suất Vận Hành & Tỷ Lệ Lấp Đầy Từng Cơ Sở
            </h3>
            <p className="text-xs text-slate-500">
              Công thức: Usage Rate = Số ô Đang thuê / (Tổng ô - Ngừng dùng)
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Hiển thị: <strong className="text-slate-700">{filteredData.length}</strong> / {data.length} cơ sở
        </div>
      </div>

      {/* 2. Thanh Công Cụ (Toolbar) Theo Specs Design Leader */}
      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
        {/* Ô Tìm Kiếm */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên hoặc ID cơ sở..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-800 placeholder-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Cụm Bộ Lọc Nhanh & Sắp Xếp */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle: Ẩn cơ sở 0% */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors select-none">
            <input
              type="checkbox"
              checked={hideZeroOccupancy}
              onChange={(e) => setHideZeroOccupancy(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span>Ẩn cơ sở 0%</span>
          </label>

          {/* Button: Chỉ xem < 50% */}
          <button
            type="button"
            onClick={() => setFilterUnderTarget((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterUnderTarget
                ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${filterUnderTarget ? 'text-amber-700' : 'text-slate-400'}`} />
            <span>Chỉ xem &lt; 50%</span>
          </button>

          {/* Button: Sắp xếp tỷ lệ lấp đầy */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all shadow-2xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sắp xếp: {sortOrder === 'desc' ? 'Giảm dần' : 'Tăng dần'}</span>
          </button>

          {/* Nút Xóa Lọc Nhanh (chỉ hiện khi có filter) */}
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

      {/* 3. Danh Sách Cơ Sở (List View) */}
      <div className="space-y-3 pt-1">
        {filteredData.length === 0 ? (
          /* Empty State theo chuẩn specs Design Leader */
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <BarChart3 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {filterUnderTarget && !searchQuery
                ? 'Tuyệt vời! Không có cơ sở nào dưới chỉ tiêu (< 50%).'
                : 'Không tìm thấy cơ sở phù hợp với bộ lọc.'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hãy thử điều chỉnh từ khóa tìm kiếm hoặc xóa các điều kiện lọc để hiển thị toàn bộ cơ sở.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer mt-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        ) : (
          filteredData.map((item) => {
            const exploitableUnits = Math.max(0, item.totalUnits - (item.outOfServiceUnits || 0));
            const rateUnknown = exploitableUnits === 0;
            const ratePercent = rateUnknown ? 0 : Math.min(item.occupancyRate * 100, 100);
            const { textColor, barColor, isAlarm, isExemplary } = getRateColorMeta(
              item.occupancyRate,
              rateUnknown
            );

            const handleFacilityClick = () => {
              if (onOpenDetail) {
                onOpenDetail(item);
              } else if (onSelectFacility) {
                onSelectFacility(item.facilityId);
              }
            };

            return (
              <div
                key={item.facilityId}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3 group"
              >
                {/* A. Header Dòng (Top Row) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleFacilityClick}
                      className="font-bold text-slate-800 hover:text-emerald-600 hover:underline transition-colors text-sm text-left cursor-pointer inline-flex items-center gap-1.5"
                      title="Bấm để xem chi tiết bóc tách ô kho và doanh thu của cơ sở này"
                    >
                      <span>{item.facilityName}</span>
                    </button>
                    <span className="text-xs text-slate-400 font-mono">
                      (ID: #{item.facilityId})
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 hidden sm:inline">Tỷ lệ lấp đầy:</span>
                      <span className={`font-mono font-bold text-base ${textColor}`}>
                        {rateUnknown ? 'Không xác định' : formatPercent(item.occupancyRate)}
                      </span>
                      {isAlarm && (
                        <span title="Tỷ lệ lấp đầy thấp dưới 30% - Cần đẩy mạnh tiếp thị">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 inline" />
                        </span>
                      )}
                      {isExemplary && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/60">
                          Đạt chuẩn
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {rateUnknown ? 'N/A' : `${item.occupiedUnits} / ${exploitableUnits} ô`}
                    </div>
                  </div>
                </div>

                {/* B. Thanh Tiến Trình (Middle Row) */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
                  <div
                    style={{ width: `${ratePercent}%` }}
                    className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out`}
                  />
                  {/* Vạch mốc chỉ tiêu 80% */}
                  <div
                    className="absolute top-0 bottom-0 border-r-2 border-dashed border-slate-400/80"
                    style={{ left: '80%' }}
                    title="Chỉ tiêu vàng: 80%"
                  />
                </div>

                {/* C. Các Chip Trạng Thái Ô Kho (Bottom Row) */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Trống */}
                  <div
                    className={`px-2 py-1 rounded-md font-medium border bg-emerald-50 border-emerald-200 text-emerald-700 transition-opacity ${
                      item.availableUnits === 0 ? 'opacity-50' : ''
                    }`}
                    title={`Có ${item.availableUnits} ô kho đang sẵn sàng cho thuê`}
                  >
                    Trống: {item.availableUnits}
                  </div>

                  {/* Đang thuê */}
                  <div
                    className={`px-2 py-1 rounded-md font-medium border bg-sky-50 border-sky-200 text-sky-700 transition-opacity ${
                      item.occupiedUnits === 0 ? 'opacity-50' : ''
                    }`}
                    title={`Có ${item.occupiedUnits} ô kho đang có khách thuê hoạt động`}
                  >
                    Đang thuê: {item.occupiedUnits}
                  </div>

                  {/* Đặt chỗ */}
                  <div
                    className={`px-2 py-1 rounded-md font-medium border bg-amber-50 border-amber-200 text-amber-700 transition-opacity ${
                      item.reservedUnits === 0 ? 'opacity-50' : ''
                    }`}
                    title={`Có ${item.reservedUnits} ô kho đang được giữ chỗ chờ nhận kho`}
                  >
                    Đặt chỗ: {item.reservedUnits}
                  </div>

                  {/* Bảo trì */}
                  <div
                    className={`px-2 py-1 rounded-md font-medium border bg-slate-100 border-slate-200 text-slate-600 transition-opacity ${
                      item.maintenanceUnits === 0 ? 'opacity-50' : ''
                    }`}
                    title={`Có ${item.maintenanceUnits} ô kho đang bảo dưỡng / sửa chữa`}
                  >
                    Bảo trì: {item.maintenanceUnits}
                  </div>

                  {/* Vệ sinh (nếu có) */}
                  {item.cleaningUnits > 0 && (
                    <div
                      className="px-2 py-1 rounded-md font-medium border bg-purple-50 border-purple-200 text-purple-700"
                      title={`Có ${item.cleaningUnits} ô kho đang vệ sinh sau trả kho`}
                    >
                      Vệ sinh: {item.cleaningUnits}
                    </div>
                  )}

                  {/* Ngừng dùng (nếu có) */}
                  {item.outOfServiceUnits > 0 && (
                    <div
                      className="px-2 py-1 rounded-md font-medium border bg-stone-100 border-stone-200 text-stone-600"
                      title={`Có ${item.outOfServiceUnits} ô kho tạm ngừng khai thác kỹ thuật`}
                    >
                      Ngừng dùng: {item.outOfServiceUnits}
                    </div>
                  )}

                  {/* Quá hạn */}
                  <div
                    className={`px-2 py-1 rounded-md font-semibold border bg-rose-50 border-rose-200 text-rose-700 transition-opacity ${
                      item.overdueContractsCount === 0 ? 'opacity-50' : ''
                    }`}
                    title={`Có ${item.overdueContractsCount} hợp đồng đang trễ hạn thanh toán`}
                  >
                    Quá hạn: {item.overdueContractsCount}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

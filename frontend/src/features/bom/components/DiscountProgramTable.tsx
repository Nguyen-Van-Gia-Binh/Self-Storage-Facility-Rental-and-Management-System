// frontend/src/features/bom/components/DiscountProgramTable.tsx
import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import type { DiscountProgramItem } from '@/api/discount';

interface DiscountProgramTableProps {
  programs: DiscountProgramItem[];
  onOpenModal: () => void;
  onEdit: (item: DiscountProgramItem) => void;
  onToggleStatus: (item: DiscountProgramItem) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type ScopeFilter = 'ALL' | 'SYSTEM' | 'FACILITY' | 'UNIT_TYPE';
type SortKey = 'DEFAULT' | 'DISCOUNT_DESC' | 'MONTHS_ASC' | 'NAME_ASC';

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatDiscountValue(type: 'PERCENT' | 'AMOUNT', value: number): string {
  if (type === 'PERCENT') {
    return `Giảm ${value}%`;
  }
  return `Giảm ${value.toLocaleString('vi-VN')} ₫`;
}

function formatScopeText(item: DiscountProgramItem): string {
  if (item.scopeType === 'SYSTEM') return 'Toàn hệ thống';
  if (item.scopeType === 'FACILITY') {
    return item.facilityName || (item.facilityId ? `Cơ sở #${item.facilityId}` : 'Chưa xác định');
  }
  if (item.scopeType === 'UNIT_TYPE') {
    return item.unitTypeName
      ? `Loại kho: ${item.unitTypeName}`
      : item.unitTypeId
        ? `Loại kho #${item.unitTypeId}`
        : 'Chưa xác định';
  }
  return 'Chưa xác định';
}

export const DiscountProgramTable: React.FC<DiscountProgramTableProps> = ({
  programs,
  onOpenModal,
  onEdit,
  onToggleStatus,
  onRefresh,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('DEFAULT');
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    minMonths: true,
    period: true,
    scope: true,
  });

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = programs.filter((item) => {
      if (statusFilter === 'ACTIVE' && !item.isActive) return false;
      if (statusFilter === 'INACTIVE' && item.isActive) return false;
      if (scopeFilter !== 'ALL' && item.scopeType !== scopeFilter) return false;
      if (!q) return true;
      const scopeText = formatScopeText(item).toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        scopeText.includes(q) ||
        formatDiscountValue(item.discountType, item.discountValue).toLowerCase().includes(q)
      );
    });

    if (sortBy === 'DEFAULT') return list;
    return [...list].sort((a, b) => {
      if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name, 'vi');
      if (sortBy === 'MONTHS_ASC') return a.minRentalMonths - b.minRentalMonths;
      if (sortBy === 'DISCOUNT_DESC') return b.discountValue - a.discountValue;
      return 0;
    });
  }, [programs, searchQuery, statusFilter, scopeFilter, sortBy]);

  const activeColCount =
    4 +
    (visibleCols.minMonths ? 1 : 0) +
    (visibleCols.period ? 1 : 0) +
    (visibleCols.scope ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header phẳng, không banner màu cam */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900 text-base">
            Chương trình khuyến mãi &amp; Chiết khấu
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Thiết lập chiết khấu theo kỳ hạn thuê và bật/tắt áp dụng theo phạm vi cơ sở.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span>+ Thêm chương trình</span>
        </button>
      </div>

      {/* Unified Card: Toolbar + Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Enterprise Toolbar: Tìm kiếm + Lọc + Sắp xếp + Cột hiển thị */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/60 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm chương trình..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang áp dụng</option>
              <option value="INACTIVE">Tạm dừng</option>
            </select>

            <select
              aria-label="Lọc theo phạm vi"
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
            >
              <option value="ALL">Tất cả phạm vi</option>
              <option value="SYSTEM">Toàn hệ thống</option>
              <option value="FACILITY">Theo cơ sở</option>
              <option value="UNIT_TYPE">Theo loại kho</option>
            </select>

            <select
              aria-label="Sắp xếp chương trình"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
            >
              <option value="DEFAULT">Sắp xếp: Mặc định</option>
              <option value="DISCOUNT_DESC">Mức giảm cao nhất</option>
              <option value="MONTHS_ASC">Thuê tối thiểu tăng dần</option>
              <option value="NAME_ASC">Tên (A → Z)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative">
            <button
              type="button"
              onClick={() => setColumnMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
              <span>Cột</span>
            </button>

            {columnMenuOpen && (
              <div className="absolute right-0 top-9 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 space-y-1.5 text-xs">
                <p className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider px-1 pb-1 border-b border-gray-100">
                  Hiển thị cột
                </p>
                <label className="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50 cursor-pointer text-gray-700">
                  <input
                    type="checkbox"
                    checked={visibleCols.minMonths}
                    onChange={(e) =>
                      setVisibleCols((prev) => ({ ...prev, minMonths: e.target.checked }))
                    }
                    className="accent-brand-600"
                  />
                  <span>Thuê tối thiểu</span>
                </label>
                <label className="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50 cursor-pointer text-gray-700">
                  <input
                    type="checkbox"
                    checked={visibleCols.period}
                    onChange={(e) =>
                      setVisibleCols((prev) => ({ ...prev, period: e.target.checked }))
                    }
                    className="accent-brand-600"
                  />
                  <span>Thời gian áp dụng</span>
                </label>
                <label className="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50 cursor-pointer text-gray-700">
                  <input
                    type="checkbox"
                    checked={visibleCols.scope}
                    onChange={(e) =>
                      setVisibleCols((prev) => ({ ...prev, scope: e.target.checked }))
                    }
                    className="accent-brand-600"
                  />
                  <span>Phạm vi</span>
                </label>
              </div>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Làm mới danh sách khuyến mãi"
                title="Làm mới"
                className="p-1.5 bg-white border border-gray-300 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">Tên chương trình</th>
                <th className="py-3 px-4 text-right">Mức giảm</th>
                {visibleCols.minMonths && (
                  <th className="py-3 px-4 text-right">Thuê tối thiểu</th>
                )}
                {visibleCols.period && (
                  <th className="py-3 px-4">Thời gian áp dụng</th>
                )}
                {visibleCols.scope && (
                  <th className="py-3 px-4 min-w-[160px]">Phạm vi</th>
                )}
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={activeColCount} className="text-center py-10 text-xs text-gray-400">
                    Đang tải danh sách chương trình khuyến mãi...
                  </td>
                </tr>
              ) : filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={activeColCount} className="text-center py-10 text-gray-500">
                    <p className="text-sm font-medium text-gray-800">
                      {programs.length === 0
                        ? 'Chưa có chương trình khuyến mãi nào được thiết lập.'
                        : 'Không tìm thấy chương trình phù hợp với bộ lọc.'}
                    </p>
                    {programs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setScopeFilter('ALL');
                        }}
                        className="mt-2 text-xs font-semibold text-brand-600 hover:underline cursor-pointer"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {item.name}
                    </td>

                    {/* Mức giảm là Giá trị (Value), hiển thị chữ in đậm không bọc pill như Status */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-gray-900 tabular-nums">
                        {formatDiscountValue(item.discountType, item.discountValue)}
                      </span>
                    </td>

                    {visibleCols.minMonths && (
                      <td className="py-3.5 px-4 text-right font-medium text-gray-700 tabular-nums whitespace-nowrap">
                        ≥ {item.minRentalMonths} tháng
                      </td>
                    )}

                    {visibleCols.period && (
                      <td className="py-3.5 px-4 text-xs text-gray-600 tabular-nums whitespace-nowrap">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </td>
                    )}

                    {visibleCols.scope && (
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-700 whitespace-nowrap">
                        {formatScopeText(item)}
                      </td>
                    )}

                    {/* Cột Trạng thái: Toggle Switch 1-click trực tiếp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.isActive}
                          aria-label={
                            item.isActive
                              ? `Tạm dừng ${item.name}`
                              : `Kích hoạt ${item.name}`
                          }
                          onClick={() => onToggleStatus(item)}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                            item.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-2xs ${
                              item.isActive ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-medium ${
                            item.isActive ? 'text-emerald-700' : 'text-gray-500'
                          }`}
                        >
                          {item.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                        </span>
                      </div>
                    </td>

                    {/* Thao tác gọn, hạn chế icon */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                      >
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

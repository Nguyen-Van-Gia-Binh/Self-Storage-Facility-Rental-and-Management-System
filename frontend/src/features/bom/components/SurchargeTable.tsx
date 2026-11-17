// frontend/src/features/bom/components/SurchargeTable.tsx
import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Pencil,
  Search,
  Plus,
  Layers,
  Filter,
  Globe,
} from 'lucide-react';
import type { SurchargeItem } from '@/types';
import { feeCategoryLabel } from '@/features/pricing/feeCategory';
import { Tooltip } from '@/components/ui/Tooltip';

interface SurchargeTableProps {
  surcharges: SurchargeItem[];
  onOpenModal: () => void;
  onEdit: (item: SurchargeItem) => void;
  onToggleStatus: (item: SurchargeItem) => void;
  onBulkToggleStatus?: (items: SurchargeItem[], targetActive: boolean) => void;
  isLoading?: boolean;
}

function formatDateVN(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === '') return 'Vô thời hạn';
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return clean;
}

export const SurchargeTable: React.FC<SurchargeTableProps> = ({
  surcharges,
  onOpenModal,
  onEdit,
  onToggleStatus,
  onBulkToggleStatus,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filteredSurcharges = useMemo(() => {
    return surcharges.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        String(item.id).includes(term) ||
        (item.code && item.code.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (item.facilityName && item.facilityName.toLowerCase().includes(term));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive);

      return matchSearch && matchStatus;
    });
  }, [surcharges, searchTerm, statusFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSurcharges.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    filteredSurcharges.length > 0 && selectedIds.length === filteredSurcharges.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < filteredSurcharges.length;

  const selectedTargets = surcharges.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="space-y-3">
      {/* Compact Toolbar: Search + Status Filter + Primary Brand CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-md border border-gray-200">
        <div className="flex flex-1 items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc mã..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-md text-xs font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 pl-2.5 pr-1.5 py-1 rounded-md shrink-0 transition-colors">
            <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <select
              aria-label="Lọc theo trạng thái phụ phí"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className="text-xs font-medium bg-transparent text-gray-700 border-0 outline-none cursor-pointer py-0.5 pr-6"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang áp dụng</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm phụ phí</span>
        </button>
      </div>

      {/* Main Enterprise Data Table */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={isLoading || filteredSurcharges.length === 0}
                    className="rounded border-gray-300 text-brand-600 accent-brand-600 focus:ring-brand-500 cursor-pointer"
                    title="Chọn tất cả để thao tác hàng loạt"
                  />
                </th>
                <th className="py-2.5 px-4">Mã</th>
                <th className="py-2.5 px-4 w-full">Tên phụ phí &amp; Hình thức</th>
                <th className="py-2.5 px-4">Phạm vi</th>
                <th className="py-2.5 px-4 text-right">Mức phí</th>
                <th className="py-2.5 px-4">Ngày hiệu lực</th>
                <th className="py-2.5 px-4">Trạng thái</th>
                <th className="py-2.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                    <div className="inline-block p-2 rounded-md bg-brand-50 text-brand-600 animate-pulse mb-2">
                      <Layers className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium">Đang tải danh mục phụ phí hệ thống...</p>
                  </td>
                </tr>
              ) : filteredSurcharges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                    <AlertCircle className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'Không tìm thấy phụ phí phù hợp với bộ lọc'
                        : 'Chưa có phụ phí nào được cấu hình'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'Hãy thử thay đổi từ khóa hoặc điều kiện lọc'
                        : 'Nhấn "+ Thêm phụ phí" để khởi tạo danh mục đầu tiên.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSurcharges.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  const isFixed = item.type === 'FIXED';
                  const dateText = formatDateVN(item.effectiveDate);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isChecked ? 'bg-brand-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOne(item.id)}
                          className="rounded border-gray-300 text-brand-600 accent-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>

                      {/* Mã */}
                      <td className="py-2.5 px-4 text-xs font-medium text-gray-500 tabular-nums whitespace-nowrap">
                        {item.code?.trim() ? item.code : `#${item.id}`}
                      </td>

                      {/* Tên phụ phí & Hình thức */}
                      <td className="py-2.5 px-4 whitespace-normal">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 text-sm leading-snug">
                            {item.name}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                            {isFixed ? 'Cố định' : 'Tỷ lệ %'} - {feeCategoryLabel(item.category)}
                          </span>
                        </div>
                      </td>

                      {/* Phạm vi áp dụng */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {item.facilityName ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium">
                            {item.facilityName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                            <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>Toàn hệ thống</span>
                          </span>
                        )}
                      </td>

                      {/* Mức phí: strictly right-aligned, tabular-nums */}
                      <td className="py-2.5 px-4 text-right tabular-nums text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {isFixed ? (
                          <>
                            <span>{item.amount.toLocaleString('vi-VN')}</span>
                            <span className="ml-1 text-xs font-medium text-gray-500">đ</span>
                          </>
                        ) : (
                          <>
                            <span>{item.amount}</span>
                            <span className="text-xs font-medium text-gray-500">%</span>
                          </>
                        )}
                      </td>

                      {/* Ngày hiệu lực */}
                      <td className="py-2.5 px-4 text-sm text-gray-700 tabular-nums whitespace-nowrap">
                        {dateText === 'Vô thời hạn' ? (
                          <span className="text-xs text-gray-400">Vô thời hạn</span>
                        ) : (
                          <span>{dateText}</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50/70 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Đang áp dụng</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full border border-gray-500 bg-white" />
                            <span>Tạm ngưng</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác: Edit + 1-click Toggle Switch */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2.5">
                          <Tooltip content="Chỉnh sửa định mức và thông tin phụ phí" position="top" align="end">
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                              aria-label="Sửa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>

                          <Tooltip
                            content={item.isActive ? 'Tạm ngưng áp dụng phụ phí này' : 'Kích hoạt áp dụng lại phụ phí này'}
                            position="top"
                            align="end"
                          >
                            <button
                              type="button"
                              role="switch"
                              aria-checked={item.isActive}
                              aria-label={item.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                              onClick={() => onToggleStatus(item)}
                              className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                                item.isActive ? 'bg-brand-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-transform ${
                                  item.isActive ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Light Floating Bulk Action Bar (Linear / Notion style) */}
      {selectedIds.length > 0 && onBulkToggleStatus && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 rounded-lg shadow-[0_8px_28px_rgba(15,23,42,0.12)] border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 tabular-nums">
              Đã chọn {selectedIds.length} phụ phí
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>

            <button
              type="button"
              onClick={() => {
                onBulkToggleStatus(selectedTargets, false);
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              Tạm ngưng
            </button>

            <button
              type="button"
              onClick={() => {
                onBulkToggleStatus(selectedTargets, true);
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Kích hoạt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

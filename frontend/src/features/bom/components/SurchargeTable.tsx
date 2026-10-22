// frontend/src/features/bom/components/SurchargeTable.tsx
import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  AlertCircle,
  Pencil,
  Power,
  Search,
  Plus,
  Layers,
  Filter,
  CheckCircle2,
  Check,
} from 'lucide-react';
import type { SurchargeItem } from '@/types';
import { feeCategoryLabel } from '@/features/pricing/feeCategory';

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

  // Filtered surcharges
  const filteredSurcharges = useMemo(() => {
    return surcharges.filter((item) => {
      // Search text
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        String(item.id).includes(term) ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (item.facilityName && item.facilityName.toLowerCase().includes(term));

      // Status filter
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive);

      return matchSearch && matchStatus;
    });
  }, [surcharges, searchTerm, statusFilter]);

  // Bulk selection logic
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
    <div className="space-y-3.5">
      {/* Sleek Toolbar: Search + Status Filter + Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Left: Search & Filter */}
        <div className="flex flex-1 items-center gap-2.5 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm phụ phí theo tên hoặc mã..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50/70 border border-slate-200/90 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50/70 border border-slate-200/90 px-2.5 py-1.5 rounded-lg shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className="text-xs font-semibold bg-transparent text-slate-700 outline-none cursor-pointer pr-1"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang áp dụng</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>
          </div>
        </div>

        {/* Right: Add Surcharge Button */}
        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm phụ phí</span>
        </button>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {/* Checkbox Select All */}
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={isLoading || filteredSurcharges.length === 0}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    title="Chọn tất cả để thao tác hàng loạt"
                  />
                </th>
                <th className="py-3 px-4 w-16">Mã (ID)</th>
                <th className="py-3 px-4">Tên phụ phí & Hình thức</th>
                <th className="py-3 px-4">Phạm vi áp dụng</th>
                <th className="py-3 px-4 text-right">Mức phí</th>
                <th className="py-3 px-4">Ngày hiệu lực</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    <div className="inline-block p-2 rounded-xl bg-amber-50 text-amber-500 animate-pulse mb-2">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium">Đang tải danh mục phụ phí hệ thống...</p>
                  </td>
                </tr>
              ) : filteredSurcharges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'Không tìm thấy phụ phí phù hợp với bộ lọc'
                        : 'Chưa có phụ phí nào được cấu hình'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
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
                      className={`hover:bg-slate-50/80 transition-colors duration-150 group ${
                        isChecked ? 'bg-amber-50/25' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOne(item.id)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      {/* Mã ID */}
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-500">
                        #{item.id}
                      </td>

                      {/* Tên phụ phí & Hình thức / Nhóm gộp */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors text-sm">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                            <span
                              className={`font-semibold ${
                                isFixed ? 'text-blue-600' : 'text-purple-600'
                              }`}
                            >
                              {isFixed ? 'Cố định' : 'Tỷ lệ %'}
                            </span>
                            <span>•</span>
                            <span>{feeCategoryLabel(item.category)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Phạm vi áp dụng */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{item.facilityName || 'Toàn hệ thống'}</span>
                        </div>
                      </td>

                      {/* Mức phí: Căn phải, Tabular nums, Màu cam đậm */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-sm font-bold text-amber-600">
                        {isFixed ? (
                          <>
                            <span>{item.amount.toLocaleString('vi-VN')}</span>{' '}
                            <span className="text-xs font-semibold text-slate-400">₫</span>
                          </>
                        ) : (
                          <>
                            <span>{item.amount}</span>
                            <span className="text-xs font-semibold text-slate-400">%</span>
                          </>
                        )}
                      </td>

                      {/* Ngày hiệu lực: Chuẩn ngày hoặc Vô thời hạn */}
                      <td className="py-3 px-4 text-xs font-medium">
                        {dateText === 'Vô thời hạn' ? (
                          <span className="text-slate-400 italic">Vô thời hạn</span>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-xs">{dateText}</span>
                          </div>
                        )}
                      </td>

                      {/* Trạng thái Badge */}
                      <td className="py-3 px-4 text-center">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đang áp dụng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tạm ngưng
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
                            title="Chỉnh sửa định mức và thông tin phụ phí"
                          >
                            <Pencil className="w-3 h-3 text-slate-500" />
                            <span>Sửa</span>
                          </button>

                          {item.isActive ? (
                            <button
                              type="button"
                              onClick={() => onToggleStatus(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50/60 border border-amber-200/80 rounded-lg hover:bg-amber-100/70 transition-colors cursor-pointer"
                              title="Tạm ngưng áp dụng phụ phí này"
                            >
                              <Power className="w-3 h-3 text-amber-600" />
                              <span>Tạm ngưng</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onToggleStatus(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50/60 border border-emerald-200/80 rounded-lg hover:bg-emerald-100/70 transition-colors cursor-pointer"
                              title="Kích hoạt áp dụng lại phụ phí này"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Kích hoạt</span>
                            </button>
                          )}
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

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && onBulkToggleStatus && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between px-5 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-900 text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium text-slate-200">
              Đã chọn <strong>{selectedIds.length}</strong> phụ phí
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onBulkToggleStatus(selectedTargets, false);
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Tạm ngưng hàng loạt</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onBulkToggleStatus(selectedTargets, true);
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Kích hoạt hàng loạt</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

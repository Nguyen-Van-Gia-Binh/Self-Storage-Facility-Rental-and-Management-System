// frontend/src/features/bom/components/FacilityPriceTable.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Layers,
  Edit3,
  AlertCircle,
  History,
  Zap,
  Calendar,
  Clock,
} from 'lucide-react';
import type { UnitTypeCatalog } from '@/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface FacilityPriceTableProps {
  unitTypes: UnitTypeCatalog[];
  facilityName: string;
  selectedFacilityId: number;
  onOpenPriceModal: (unitType: UnitTypeCatalog) => void;
  onOpenBulkPriceModal: (selectedUnitTypes: UnitTypeCatalog[]) => void;
  onDelete: (unitType: UnitTypeCatalog) => Promise<void>;
  isLoading?: boolean;
}

export const FacilityPriceTable: React.FC<FacilityPriceTableProps> = ({
  unitTypes,
  facilityName,
  selectedFacilityId,
  onOpenPriceModal,
  onOpenBulkPriceModal,
  onDelete,
  isLoading = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pendingDelete, setPendingDelete] = useState<UnitTypeCatalog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedFacilityId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(unitTypes.map((u) => u.id));
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
    unitTypes.length > 0 && selectedIds.length === unitTypes.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < unitTypes.length;

  const selectedTargets = unitTypes.filter((u) => selectedIds.includes(u.id));

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setIsDeleting(true);
    try {
      await onDelete(target);
      setSelectedIds((prev) => prev.filter((id) => id !== target.id));
    } catch {
      // Trang cha hiện thông báo từ máy chủ.
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bảng Dữ liệu Thả nổi */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                {/* Checkbox All */}
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={isLoading || unitTypes.length === 0}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Chọn tất cả để cập nhật giá hàng loạt"
                  />
                </th>
                <th className="py-3 px-4 w-full">Loại ô kho</th>
                <th className="py-3 px-4 text-right tabular-nums">Diện tích (m²)</th>
                <th className="py-3 px-4 text-right tabular-nums">Đơn giá (₫/m²)</th>
                <th className="py-3 px-4 text-right tabular-nums">Giá thuê (₫/tháng)</th>
                <th className="py-3 px-4 text-right tabular-nums">Tổng ô kho (ô)</th>
                <th className="py-3 px-4 text-center sticky right-0 bg-slate-100">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    <div className="inline-block p-2 rounded-xl bg-amber-50 text-amber-500 animate-pulse mb-2">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium">Đang tải bảng giá cơ sở {facilityName}...</p>
                  </td>
                </tr>
              ) : unitTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">
                      Chưa có loại ô kho nào tại cơ sở này
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hãy tạo loại ô kho hoặc kiểm tra cấu hình cơ sở.
                    </p>
                  </td>
                </tr>
              ) : (
                unitTypes.map((ut) => {
                  const isChecked = selectedIds.includes(ut.id);
                  const rate =
                    ut.areaM2 > 0 && ut.monthlyPrice > 0
                      ? Math.round(ut.monthlyPrice / ut.areaM2)
                      : (ut.pricePerM2 ?? null);

                  return (
                    <tr
                      key={ut.id}
                      className={`hover:bg-slate-50/80 transition-colors duration-150 group ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Checkbox One */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOne(ut.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Loại ô kho + Ngày hiệu lực / Giá hẹn giờ */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                            {!(ut.scheduledEffectiveFrom && ut.scheduledPricePerM2 != null) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            )}
                            {ut.name}
                          </span>
                          {ut.description && (
                            <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                              {ut.description}
                            </span>
                          )}

                          {ut.scheduledEffectiveFrom && ut.scheduledPricePerM2 != null && (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 mt-1 w-fit">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              <span>
                                Sắp áp dụng từ {ut.scheduledEffectiveFrom}:{' '}
                                <strong>{ut.scheduledPricePerM2.toLocaleString('vi-VN')} ₫/m²</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Diện tích (m²) */}
                      <td className="py-3 px-4 text-right tabular-nums text-sm text-slate-700">
                        {ut.areaM2}
                      </td>

                      {/* Đơn giá (₫/m²) */}
                      <td className="py-3 px-4 text-right tabular-nums text-xs font-semibold text-slate-800">
                        {rate != null && rate > 0 ? (
                          rate.toLocaleString('vi-VN')
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Giá thuê (₫/tháng) - Căn phải, Tabular nums */}
                      <td className="py-3 px-4 text-right tabular-nums text-sm font-medium text-slate-900">
                        {ut.monthlyPrice > 0 ? (
                          ut.monthlyPrice.toLocaleString('vi-VN')
                        ) : (
                          <span className="text-xs text-rose-600 font-medium">Chưa niêm yết</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums text-sm text-slate-700">
                        {ut.totalUnits}
                      </td>

                      {/* Thao tác */}
                      <td className={`py-3 px-4 text-center sticky right-0 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] ${isChecked ? 'bg-blue-50' : 'bg-white'}`}>
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Nút Đổi giá */}
                          <button
                            type="button"
                            onClick={() => onOpenPriceModal(ut)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Đổi giá</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPendingDelete(ut)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Xóa
                          </button>

                          {/* Nút Xem lịch sử thay đổi giá */}
                          <Tooltip content="Xem lịch sử thay đổi giá" position="left">
                            <Link
                              to={`/bom/price-audit?facilityId=${selectedFacilityId}`}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            >
                              <History className="w-3.5 h-3.5" />
                            </Link>
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

        {/* Footer bảng */}
        <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hiển thị <span className="font-semibold text-slate-700">{unitTypes.length}</span> loại ô kho tại{' '}
            <strong className="text-slate-800 font-semibold">{facilityName}</strong>
          </span>
          <Link
            to={`/bom/price-audit?facilityId=${selectedFacilityId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90 rounded-lg shadow-2xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Xem nhật ký kiểm toán giá của cơ sở này</span>
          </Link>
        </div>
      </div>

      {/* Floating Bulk Action Bar khi có chọn Checkbox (Portal ra body để tránh bị giam trong scroll/transform container) */}
      {selectedIds.length > 0 &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium">
                Đã chọn <strong className="text-amber-400 font-bold">{selectedIds.length}</strong> / {unitTypes.length} loại ô kho
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <button
              type="button"
              onClick={() => onOpenBulkPriceModal(selectedTargets)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Cập nhật giá hàng loạt</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-1 py-1"
            >
              Bỏ chọn
            </button>
          </div>,
          document.body
        )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={pendingDelete ? `Gỡ ${pendingDelete.name} khỏi cơ sở này?` : 'Gỡ loại kho'}
        description="Loại kho biến mất khỏi bảng giá của cơ sở đang xem. Các cơ sở khác giữ nguyên. Hệ thống từ chối nếu cơ sở này còn ô kho."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
        icon="alert"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      />
    </div>
  );
};

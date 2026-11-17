// frontend/src/features/bom/components/FacilityPriceTable.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  AlertCircle,
  History,
  Calendar,
  Clock,
  Trash2,
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
    <div className="space-y-3">
      {/* Bảng Dữ liệu Enterprise — Mật độ cao, số liệu căn phải tuyệt đối */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={isLoading || unitTypes.length === 0}
                    className="rounded border-gray-300 text-brand-600 accent-brand-600 focus:ring-brand-500 cursor-pointer"
                    title="Chọn tất cả để cập nhật giá hàng loạt"
                  />
                </th>
                <th className="py-2.5 px-4 w-full">Loại ô kho</th>
                <th className="py-2.5 px-4 text-right tabular-nums">Diện tích (m²)</th>
                <th className="py-2.5 px-4 text-right tabular-nums">Đơn giá (₫/m²)</th>
                <th className="py-2.5 px-4 text-right tabular-nums">Giá thuê (₫/tháng)</th>
                <th className="py-2.5 px-4 text-right tabular-nums">Tổng ô kho (ô)</th>
                <th className="py-2.5 px-4 text-right sticky right-0 bg-gray-50">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                    <div className="inline-block p-2 rounded-md bg-brand-50 text-brand-600 animate-pulse mb-2">
                      <Layers className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium">Đang tải bảng giá cơ sở {facilityName}...</p>
                  </td>
                </tr>
              ) : unitTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                    <AlertCircle className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">
                      Chưa có loại ô kho nào tại cơ sở này
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
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
                      className={`hover:bg-gray-50/80 transition-colors group ${
                        isChecked ? 'bg-brand-50/30' : ''
                      }`}
                    >
                      {/* Checkbox One */}
                      <td className="py-2 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOne(ut.id)}
                          className="rounded border-gray-300 text-brand-600 accent-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>

                      {/* Loại ô kho + Mô tả có Tooltip */}
                      <td className="py-2 px-4">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-2 font-semibold text-gray-900 leading-snug">
                            {!(ut.scheduledEffectiveFrom && ut.scheduledPricePerM2 != null) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            )}
                            <span>{ut.name}</span>
                          </span>
                          {ut.description && (
                            <Tooltip content={ut.description} position="top">
                              <span
                                title={ut.description}
                                className="text-xs text-gray-500 truncate max-w-xs mt-0.5 block"
                              >
                                {ut.description}
                              </span>
                            </Tooltip>
                          )}

                          {ut.scheduledEffectiveFrom && ut.scheduledPricePerM2 != null && (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 w-fit">
                              <Calendar className="w-3 h-3 text-amber-700" />
                              <span>
                                Sắp áp dụng từ {ut.scheduledEffectiveFrom}:{' '}
                                <strong className="tabular-nums">
                                  {ut.scheduledPricePerM2.toLocaleString('vi-VN')} ₫/m²
                                </strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Diện tích (m²) */}
                      <td className="py-2 px-4 text-right tabular-nums text-sm text-gray-700 whitespace-nowrap">
                        {ut.areaM2}
                      </td>

                      {/* Đơn giá (₫/m²) */}
                      <td className="py-2 px-4 text-right tabular-nums text-sm font-medium text-gray-800 whitespace-nowrap">
                        {rate != null && rate > 0 ? (
                          rate.toLocaleString('vi-VN')
                        ) : (
                          <span className="text-gray-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Giá thuê (₫/tháng) */}
                      <td className="py-2 px-4 text-right tabular-nums text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {ut.monthlyPrice > 0 ? (
                          ut.monthlyPrice.toLocaleString('vi-VN')
                        ) : (
                          <span className="text-xs text-rose-600 font-medium">Chưa niêm yết</span>
                        )}
                      </td>

                      {/* Tổng ô kho (ô) */}
                      <td className="py-2 px-4 text-right tabular-nums text-sm text-gray-700 whitespace-nowrap">
                        {ut.totalUnits}
                      </td>

                      {/* Thao tác: Text link Đổi giá + Icon Trash mờ + History */}
                      <td
                        className={`py-2 px-4 text-right sticky right-0 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.08)] whitespace-nowrap ${
                          isChecked ? 'bg-brand-50/40' : 'bg-white group-hover:bg-gray-50/80'
                        }`}
                      >
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenPriceModal(ut)}
                            className="px-1.5 py-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Đổi giá
                          </button>

                          <Tooltip content="Gỡ loại kho khỏi cơ sở này" position="top" align="end">
                            <button
                              type="button"
                              onClick={() => setPendingDelete(ut)}
                              aria-label={`Xóa ${ut.name}`}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>

                          <Tooltip content="Xem lịch sử thay đổi giá" position="top" align="end">
                            <Link
                              to={`/bom/price-audit?facilityId=${selectedFacilityId}`}
                              aria-label="Xem lịch sử thay đổi giá"
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
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
        <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            Hiển thị <span className="font-semibold text-gray-700 tabular-nums">{unitTypes.length}</span> loại ô kho tại{' '}
            <strong className="text-gray-800 font-semibold">{facilityName}</strong>
          </span>
          <Link
            to={`/bom/price-audit?facilityId=${selectedFacilityId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 hover:text-gray-900 border border-gray-300 rounded-md transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>Xem nhật ký kiểm toán giá của cơ sở này</span>
          </Link>
        </div>
      </div>

      {/* Light Full-width Sticky Bulk Action Bar (Linear / Notion style) */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-3 z-20 w-full flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 rounded-md border border-gray-200 shadow-[0_8px_28px_rgba(15,23,42,0.12)]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 tabular-nums">
              Đã chọn {selectedIds.length} / {unitTypes.length} loại ô kho
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:underline rounded-md transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>

            <button
              type="button"
              onClick={() => onOpenBulkPriceModal(selectedTargets)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Cập nhật giá hàng loạt</span>
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={pendingDelete ? `Gỡ ${pendingDelete.name} khỏi cơ sở này?` : 'Gỡ loại kho'}
        description="Loại kho sẽ biến mất khỏi bảng giá của cơ sở đang xem. Các cơ sở khác giữ nguyên."
        note="Hệ thống sẽ từ chối gỡ bỏ nếu cơ sở này vẫn còn ô kho vật lý thuộc loại này."
        confirmLabel="Xác nhận xóa"
        cancelLabel="Hủy bỏ"
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

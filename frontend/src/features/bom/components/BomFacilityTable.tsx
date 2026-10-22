// frontend/src/features/bom/components/BomFacilityTable.tsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin,
  Edit2,
  Power,
  Eye,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { FacilityListItem } from '@/types';
import { useScrollLock } from '@/hooks/useScrollLock';
import { Tooltip } from '@/components/ui/Tooltip';

interface BomFacilityTableProps {
  facilities: FacilityListItem[];
  totalCount?: number;
  onViewDetail: (facility: FacilityListItem) => void;
  onEdit: (facility: FacilityListItem) => void;
  onToggleStatus: (facility: FacilityListItem, targetStatus: boolean) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Trích xuất thông minh Quận/Huyện, Tỉnh/TP từ chuỗi địa chỉ
 */
function formatShortAddress(address?: string | null): string {
  if (!address) return 'Chưa cập nhật';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  }
  return address;
}

function is24_7Hours(hours?: string | null): boolean {
  if (!hours) return false;
  const lower = hours.toLowerCase();
  return lower.includes('24/7') || lower.includes('24h') || lower.includes('24/24');
}

export const BomFacilityTable: React.FC<BomFacilityTableProps> = ({
  facilities,
  totalCount,
  onViewDetail,
  onEdit,
  onToggleStatus,
  isLoading = false,
}) => {
  const [confirmTarget, setConfirmTarget] = useState<{
    facility: FacilityListItem;
    newStatus: boolean;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useScrollLock(Boolean(confirmTarget));

  const handleConfirmToggle = async () => {
    if (!confirmTarget) return;
    setIsProcessing(true);
    try {
      await onToggleStatus(confirmTarget.facility, confirmTarget.newStatus);
      setConfirmTarget(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4 w-28">Mã cơ sở</th>
              <th className="py-3 px-4">Tên cơ sở</th>
              <th className="py-3 px-4">Địa chỉ (Rút gọn)</th>
              <th className="py-3 px-4">Thời gian h.động</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {facilities.map((fac) => (
              <tr
                key={fac.id}
                className="hover:bg-slate-50/80 transition-colors duration-150 group"
              >
                {/* Cột 1: Mã cơ sở (Badge font-mono) */}
                <td className="py-2.5 px-4 font-mono text-xs">
                  <span className="inline-block font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                    {fac.code || `#${fac.id}`}
                  </span>
                </td>

                {/* Cột 2: Tên cơ sở (In đậm, click mở Drawer chi tiết) */}
                <td className="py-2.5 px-4">
                  <button
                    type="button"
                    onClick={() => onViewDetail(fac)}
                    className="text-left font-semibold text-slate-900 hover:text-amber-600 transition-colors cursor-pointer truncate max-w-sm block"
                    title="Xem chi tiết cơ sở"
                  >
                    {fac.name}
                  </button>
                </td>

                {/* Cột 3: Địa chỉ (Rút gọn) */}
                <td className="py-2.5 px-4 text-xs text-slate-600 max-w-[220px]">
                  <div
                    className="flex items-center space-x-1.5"
                    title={fac.address || 'Chưa cập nhật'}
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{formatShortAddress(fac.address)}</span>
                  </div>
                </td>

                {/* Cột 4: Thời gian hoạt động */}
                <td className="py-2.5 px-4 text-xs text-slate-600">
                  {is24_7Hours(fac.openingHours) ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      24/7
                    </span>
                  ) : (
                    <span className="font-mono text-slate-700">
                      {fac.openingHours || '06:00 - 22:00'}
                    </span>
                  )}
                </td>

                {/* Cột 5: Trạng thái */}
                <td className="py-2.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      fac.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        fac.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {fac.isActive ? 'Hoạt động' : 'Ngừng HĐ'}
                  </span>
                </td>

                {/* Cột 6: Thao tác (kèm Floating Tooltip) */}
                <td className="py-2.5 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Tooltip content="Xem chi tiết" position="top">
                      <button
                        type="button"
                        onClick={() => onViewDetail(fac)}
                        disabled={isLoading}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </Tooltip>

                    <Tooltip content="Chỉnh sửa thông tin" position="top">
                      <button
                        type="button"
                        onClick={() => onEdit(fac)}
                        disabled={isLoading}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </Tooltip>

                    <Tooltip
                      content={fac.isActive ? 'Tạm ngưng hoạt động' : 'Kích hoạt lại'}
                      position="left"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmTarget({
                            facility: fac,
                            newStatus: !fac.isActive,
                          })
                        }
                        disabled={isLoading}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          fac.isActive
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer bảng: Thông tin số lượng & hướng dẫn */}
      <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
        <span>
          Hiển thị{' '}
          <span className="font-semibold text-slate-700">{facilities.length}</span>
          {totalCount !== undefined && totalCount !== facilities.length ? (
            <>
              {' '}trên tổng số{' '}
              <span className="font-semibold text-slate-700">{totalCount}</span> cơ sở
            </>
          ) : (
            <> cơ sở</>
          )}
        </span>
        <span className="text-[11px] text-slate-400 hidden sm:inline italic">
          Nhấp vào tên hoặc biểu tượng [👁️] để mở Drawer chi tiết
        </span>
      </div>

      {/* Confirmation Modal for Toggle Status */}
      {confirmTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isProcessing) {
                setConfirmTarget(null);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2.5 rounded-lg ${
                    confirmTarget.newStatus
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {confirmTarget.newStatus ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-base">
                    {confirmTarget.newStatus
                      ? 'Mở lại hoạt động cơ sở?'
                      : 'Ngừng hoạt động cơ sở?'}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {confirmTarget.newStatus
                      ? `Cơ sở "${confirmTarget.facility.name}" sẽ hiển thị trở lại trên danh mục công khai và cho phép đặt chỗ.`
                      : `Cơ sở "${confirmTarget.facility.name}" sẽ ẩn khỏi trang đặt chỗ. Lưu ý: Chỉ được ngừng hoạt động khi không còn hợp đồng thuê active hoặc overdue.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmTarget(null)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmToggle}
                  disabled={isProcessing}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer ${
                    confirmTarget.newStatus
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {confirmTarget.newStatus ? 'Kích hoạt lại' : 'Xác nhận ngừng'}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Clock, RefreshCw, ArrowRight } from 'lucide-react';
import type { WaitlistResponse, WaitlistStatus } from '@/types/waitlist';
import { formatDateVN } from '../utils/unitPickerHelpers';

export interface MyWaitlistsTableProps {
  waitlists: WaitlistResponse[];
  loading: boolean;
  cancellingId: number | null;
  onCancel: (item: WaitlistResponse) => void;
  onViewContracts: () => void;
}

const STATUS_META: Record<
  WaitlistStatus,
  { label: string; textClass: string; dotClass: string; isInactive: boolean }
> = {
  WAITING: {
    label: 'Đang chờ trống',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
    isInactive: false,
  },
  CONTACTING: {
    label: 'Đang tư vấn',
    textClass: 'text-sky-700',
    dotClass: 'bg-sky-500',
    isInactive: false,
  },
  PENDING_FOLLOW_UP: {
    label: 'Hẹn gọi lại',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
    isInactive: false,
  },
  CONVERTED: {
    label: 'Đã chuyển thành đơn',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-600',
    isInactive: false,
  },
  CANCELLED: {
    label: 'Đã hủy',
    textClass: 'text-slate-500',
    dotClass: 'bg-slate-400',
    isInactive: true,
  },
  EXPIRED: {
    label: 'Hết hạn chờ',
    textClass: 'text-slate-500',
    dotClass: 'bg-slate-400',
    isInactive: true,
  },
  REJECTED: {
    label: 'Đã từ chối',
    textClass: 'text-slate-500',
    dotClass: 'bg-slate-400',
    isInactive: true,
  },
};

function formatDisplayDate(iso?: string): string {
  if (!iso) return '—';
  const trimmed = iso.trim();
  return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? formatDateVN(trimmed.slice(0, 10)) : trimmed;
}

export const MyWaitlistsTable: React.FC<MyWaitlistsTableProps> = ({
  waitlists,
  loading,
  cancellingId,
  onCancel,
  onViewContracts,
}) => {
  const [confirmCancelItem, setConfirmCancelItem] = useState<WaitlistResponse | null>(null);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
          <span>Đang tải danh sách chờ của bạn...</span>
        </div>
      </div>
    );
  }

  if (waitlists.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl py-12 px-6 text-center space-y-3">
        <Clock className="w-8 h-8 text-gray-400 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-900">Bạn chưa có yêu cầu chờ nào</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Khi hạng ô kho bạn cần tạm hết chỗ hoặc đặt lịch trước trên 30 ngày, bạn có thể đăng ký vào danh sách chờ miễn phí.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/customer/units"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <span>Tìm &amp; Thuê ô kho</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="py-3 px-6 w-[28%]">Loại kho &amp; Cơ sở</th>
                <th className="py-3 px-4 w-[18%]">Ngày mong muốn</th>
                <th className="py-3 px-4 w-[18%]">Liên hệ</th>
                <th className="py-3 px-4 w-[18%]">Trạng thái</th>
                <th className="py-3 px-6 w-[18%] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitlists.map((item) => {
                const meta = STATUS_META[item.status] ?? STATUS_META.WAITING;
                const canCancel =
                  item.status === 'WAITING' ||
                  item.status === 'CONTACTING' ||
                  item.status === 'PENDING_FOLLOW_UP';
                const isCancelling = cancellingId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      meta.isInactive ? 'bg-gray-50 opacity-70' : 'bg-white hover:bg-gray-50/70'
                    }`}
                  >
                    {/* Cột 1: Loại kho & Cơ sở */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-gray-900">
                          {item.unitTypeName || `Hạng kho #${item.unitTypeId}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.facilityName || `Cơ sở #${item.facilityId}`}
                        </span>
                        {item.contactNotes && (
                          <span
                            className="text-xs text-gray-400 truncate max-w-[260px] mt-0.5"
                            title={item.contactNotes}
                          >
                            Ghi chú: {item.contactNotes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cột 2: Ngày mong muốn & Thời hạn */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 tabular-nums">
                          {formatDisplayDate(item.targetStartDate)}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          Dự kiến {item.rentalMonths} tháng
                        </span>
                      </div>
                    </td>

                    {/* Cột 3: Liên hệ */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700 font-medium tabular-nums">
                          {item.contactPhone || item.customerPhone || '—'}
                        </span>
                        {item.assignedFmName && item.status === 'CONTACTING' && (
                          <span className="text-xs text-blue-600 mt-0.5">
                            Tư vấn: {item.assignedFmName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cột 4: Trạng thái phẳng (Chấm tròn + text màu ngữ nghĩa, không nền pill) */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${meta.textClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} aria-hidden="true" />
                        <span>{meta.label}</span>
                      </span>
                    </td>

                    {/* Cột 5: Thao tác */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-3">
                        {canCancel && (
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={() => setConfirmCancelItem(item)}
                            className="text-xs font-medium text-slate-600 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isCancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}
                          </button>
                        )}

                        {item.status === 'CONVERTED' && (
                          <button
                            type="button"
                            onClick={onViewContracts}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors cursor-pointer"
                          >
                            Xem kho của tôi
                          </button>
                        )}

                        {meta.isInactive && <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal xác nhận Hủy yêu cầu chờ (Destructive Action Popup giữa màn hình) */}
      {confirmCancelItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => cancellingId === null && setConfirmCancelItem(null)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Hủy yêu cầu chờ?</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Bạn có chắc chắn muốn hủy yêu cầu chờ cho hạng kho{' '}
                  <strong className="text-gray-900">{confirmCancelItem.unitTypeName}</strong> tại{' '}
                  <strong className="text-gray-900">{confirmCancelItem.facilityName}</strong>? Vị trí ưu tiên trong danh sách chờ sẽ không thể khôi phục.
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={cancellingId === confirmCancelItem.id}
                  onClick={() => setConfirmCancelItem(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  disabled={cancellingId === confirmCancelItem.id}
                  onClick={() => {
                    const target = confirmCancelItem;
                    setConfirmCancelItem(null);
                    onCancel(target);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {cancellingId === confirmCancelItem.id ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

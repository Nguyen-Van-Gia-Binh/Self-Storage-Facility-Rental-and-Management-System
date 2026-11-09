import React, { useEffect, useState } from 'react';
import { getPaymentHistory, type PaymentHistoryPage } from '@/api/payment';
import { formatCurrency } from '@/utils/format';

const TYPE_LABELS: Record<string, string> = {
  INITIAL_PAYMENT: 'Thanh toán giữ chỗ',
  CONTRACT_RENEWAL: 'Gia hạn',
  RENEWAL_PAYMENT: 'Gia hạn',
  SETTLEMENT: 'Quyết toán trả kho',
  OVERDUE_PENALTY: 'Phí quá hạn',
  EXTRA_FEE_PAYMENT: 'Phụ phí',
  RESCHEDULE_FEE: 'Phí dời lịch',
  REFUND: 'Hoàn tiền',
  RENT_REFUND: 'Hoàn tiền thuê',
  DEPOSIT_REFUND: 'Hoàn cọc',
};

const OUTFLOW_TYPES = new Set(['REFUND', 'RENT_REFUND', 'DEPOSIT_REFUND']);

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  SUCCESS: { label: 'Thành công', className: 'bg-emerald-50 text-emerald-700' },
  PAID: { label: 'Thành công', className: 'bg-emerald-50 text-emerald-700' },
  PENDING: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700' },
  PENDING_REFUND: { label: 'Chờ hoàn tiền', className: 'bg-amber-50 text-amber-700' },
  EXPIRED: { label: 'Hết hạn', className: 'bg-slate-100 text-slate-600' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600' },
  FAILED: { label: 'Thất bại', className: 'bg-rose-50 text-rose-700' },
};

function formatDateTime(value?: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface TransactionHistoryTableProps {
  from: string;
  to: string;
  facilityId?: number;
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({ from, to, facilityId }) => {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PaymentHistoryPage | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;
    setData(null);
    setError(false);
    getPaymentHistory({ from, to, facilityId, page })
      .then((res) => !ignore && setData(res))
      .catch(() => !ignore && setError(true));
    return () => {
      ignore = true;
    };
  }, [from, to, facilityId, page]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-none overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Lịch sử giao dịch</h3>
          <p className="text-xs text-slate-500">Theo ngày tiền vào hoặc hoàn ra, mới nhất trước.</p>
        </div>
        {data && (
          <span className="text-xs text-slate-500 tabular-nums">{data.totalElements} giao dịch</span>
        )}
      </div>

      {error ? (
        <p className="p-8 text-center text-sm text-rose-600">Không tải được lịch sử giao dịch. Thử lại sau.</p>
      ) : !data ? (
        <div className="p-5 animate-pulse">
          <div className="h-32 bg-slate-100 rounded-lg" />
        </div>
      ) : data.content.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">Không có giao dịch nào trong kỳ đã chọn.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Thời điểm</th>
                  <th className="py-3 px-3">Mã đơn</th>
                  <th className="py-3 px-3">Loại</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3">Cơ sở</th>
                  <th className="py-3 px-3">Phương thức</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((t) => {
                  const status = STATUS_STYLES[t.status] ?? { label: t.status, className: 'bg-slate-100 text-slate-600' };
                  const outflow = OUTFLOW_TYPES.has(t.referenceType);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 tabular-nums text-slate-600 whitespace-nowrap">
                        {formatDateTime(t.paidAt ?? t.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800">{t.orderCode ?? `#${t.id}`}</td>
                      <td className="py-3 px-3 text-slate-800">{TYPE_LABELS[t.referenceType] ?? t.referenceType}</td>
                      <td className="py-3 px-3 text-slate-800">{t.customerName ?? '-'}</td>
                      <td className="py-3 px-3 text-slate-600">{t.facilityName ?? '-'}</td>
                      <td className="py-3 px-3 text-slate-600">{t.method}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right tabular-nums font-semibold ${outflow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {outflow ? '-' : ''}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <div className="p-3 px-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                Trước
              </button>
              <span className="tabular-nums text-slate-500">
                Trang {page + 1}/{data.totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

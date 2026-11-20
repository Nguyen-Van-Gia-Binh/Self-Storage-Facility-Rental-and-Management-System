import React, { useEffect, useState } from 'react';
import { getPaymentHistory, type PaymentHistoryPage } from '@/api/payment';
import { formatCurrency } from '@/utils/format';
import { TablePagination } from '@/components/ui/TablePagination';

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
  COMPENSATION: 'Bồi thường phạt cọc',
};

const OUTFLOW_TYPES = new Set(['REFUND', 'RENT_REFUND', 'DEPOSIT_REFUND', 'COMPENSATION']);

const STATUS_STYLES: Record<string, { label: string; className: string; dotClass: string }> = {
  SUCCESS: {
    label: 'Thành công',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600',
  },
  PAID: {
    label: 'Thành công',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600',
  },
  PENDING: {
    label: 'Chờ thanh toán',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  PENDING_REFUND: {
    label: 'Chờ hoàn tiền',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  EXPIRED: {
    label: 'Hết hạn',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    dotClass: 'bg-gray-400',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-600',
  },
  FAILED: {
    label: 'Thất bại',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-600',
  },
};

/** Format compact enterprise timestamp: DD/MM/YYYY HH:mm (Asia/Ho_Chi_Minh, no seconds) */
function formatDateTime(value?: string): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(parsed);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

export interface TransactionHistoryTableProps {
  from: string;
  to: string;
  facilityId?: number;
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({ from, to, facilityId }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<PaymentHistoryPage | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [from, to, facilityId, pageSize]);

  useEffect(() => {
    let ignore = false;
    setData(null);
    setError(false);
    getPaymentHistory({ from, to, facilityId, page, size: pageSize })
      .then((res) => !ignore && setData(res))
      .catch(() => !ignore && setError(true));
    return () => {
      ignore = true;
    };
  }, [from, to, facilityId, page, pageSize]);

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-200 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Lịch sử giao dịch</h3>
          <p className="text-xs text-gray-500">Theo ngày tiền vào hoặc hoàn ra, mới nhất trước.</p>
        </div>
        {data && (
          <span className="text-xs text-gray-500 tabular-nums font-medium">
            {data.totalElements} giao dịch
          </span>
        )}
      </div>

      {error ? (
        <p className="p-8 text-center text-sm text-rose-600">Không tải được lịch sử giao dịch. Thử lại sau.</p>
      ) : !data ? (
        <div className="p-5 animate-pulse space-y-2">
          <div className="h-8 bg-gray-100 rounded" />
          <div className="h-8 bg-gray-100 rounded" />
          <div className="h-8 bg-gray-100 rounded" />
        </div>
      ) : data.content.length === 0 ? (
        <p className="p-8 text-center text-sm text-gray-500">Không có giao dịch nào trong kỳ đã chọn.</p>
      ) : (
        <>
          <div className="overflow-x-auto max-h-[540px]">
            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-3">Mã đơn</th>
                  <th className="py-2.5 px-3">Loại</th>
                  <th className="py-2.5 px-3">Khách hàng</th>
                  <th className="py-2.5 px-3">Cơ sở</th>
                  <th className="py-2.5 px-3">Phương thức</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-4 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.content.map((t) => {
                  const status = STATUS_STYLES[t.status] ?? {
                    label: t.status,
                    className: 'bg-gray-100 text-gray-700 border-gray-200',
                    dotClass: 'bg-gray-400',
                  };
                  const outflow = OUTFLOW_TYPES.has(t.referenceType);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-4 tabular-nums text-gray-600 whitespace-nowrap">
                        {formatDateTime(t.paidAt ?? t.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-800 tabular-nums whitespace-nowrap">
                        {t.orderCode ?? `#${t.id}`}
                      </td>
                      <td className="py-2.5 px-3 text-gray-800">
                        {TYPE_LABELS[t.referenceType] ?? t.referenceType}
                      </td>
                      <td className="py-2.5 px-3 text-gray-800 font-medium">
                        {t.customerName ?? '-'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {t.facilityName ?? '-'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {t.method}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${status.className}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right tabular-nums font-semibold whitespace-nowrap ${
                          outflow ? 'text-rose-600' : 'text-gray-900'
                        }`}
                      >
                        {outflow ? '-' : ''}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={page}
            pageSize={pageSize}
            totalElements={data.totalElements}
            totalPages={data.totalPages}
            itemLabel="giao dịch"
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

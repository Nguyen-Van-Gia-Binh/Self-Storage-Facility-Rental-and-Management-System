import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getMyHistory, type CustomerHistoryItem } from '@/api/customerRentals';
import { tokenStorage } from '@/utils/tokenStorage';
import { markCustomerHistorySeen } from '../historySeen';

type HistoryFilter = 'ALL' | 'PAYMENT' | 'CONTRACT' | 'ADJUSTMENT';

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PAYMENT', label: 'Giao dịch' },
  { id: 'CONTRACT', label: 'Hợp đồng' },
  { id: 'ADJUSTMENT', label: 'Điều chỉnh' },
];

const TAB_CLASS =
  'whitespace-nowrap py-3 border-b-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

function isAlarm(item: CustomerHistoryItem): boolean {
  if (item.kind === 'PAYMENT' && item.detail.includes('Thất bại')) return true;
  if (item.kind === 'CONTRACT' && item.detail.includes('Quá hạn')) return true;
  return false;
}

function formatWhen(at: string | null): string {
  if (!at) return '';
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function historyCells(item: CustomerHistoryItem): { kindLabel: string; code: string; status: string; amount: string } {
  if (item.kind === 'PAYMENT') {
    const parts = item.detail.split(' · ');
    return {
      kindLabel: item.title,
      amount: parts[0] ?? '',
      status: parts[1] ?? '',
      code: parts[2] ?? '',
    };
  }
  if (item.kind === 'CONTRACT') {
    return { kindLabel: 'Hợp đồng', code: item.title, status: item.detail, amount: '' };
  }
  return { kindLabel: item.title, code: item.detail, status: '', amount: '' };
}

export const CustomerHistoryPage: React.FC = () => {
  const user = tokenStorage.getUser();
  const [items, setItems] = useState<CustomerHistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>('ALL');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setError('');
    setLoading(true);
    getMyHistory()
      .then((rows) => {
        setItems(rows);
        setError('');
      })
      .catch(() => setError('Không tải được lịch sử.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!tokenStorage.getUser()) return;
    markCustomerHistorySeen();
    load();
  }, [load]);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const byKind = filter === 'ALL' ? items : items.filter((item) => item.kind === filter);
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? byKind.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(needle))
    : byKind;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Lịch sử</h1>
      <p className="mt-1 text-sm text-slate-500">Giao dịch, hợp đồng và điều chỉnh ô kho của bạn.</p>

      <div className="mt-6 flex flex-col gap-3 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <nav className="-mb-px flex flex-wrap gap-x-6">
          {FILTERS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`${TAB_CLASS} ${
                filter === chip.id
                  ? 'border-brand-500 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 font-medium hover:text-slate-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </nav>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm mã hợp đồng"
          className="mb-3 w-full sm:mb-0 sm:w-56 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading && items.length === 0 && !error && (
        <p className="mt-8 text-center text-sm text-slate-500">Đang tải...</p>
      )}

      {error && (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-600">Không tải được lịch sử.</p>
          <button type="button" onClick={load} className="mt-3 text-sm font-semibold text-brand-600">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="py-16 text-center">
          <h2 className="text-base font-semibold text-slate-900">Chưa có lịch sử hoạt động</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            Các giao dịch và thay đổi hợp đồng của bạn sẽ xuất hiện tại đây.
          </p>
          <Link to="/customer/units" className="mt-4 inline-block text-sm font-semibold text-brand-600">
            Đến Kho của tôi
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && visible.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">Không có mục trong bộ lọc này.</p>
      )}

      {!error && visible.length > 0 && (
        <div className="mt-4 overflow-x-auto border border-slate-200 bg-white shadow-none">
          <table className="w-full min-w-[760px] table-fixed text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-[22%] py-2.5 pl-5 pr-3 text-left text-xs font-semibold text-slate-500">Loại</th>
                <th className="w-[24%] px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Mã hợp đồng</th>
                <th className="w-[16%] px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Trạng thái</th>
                <th className="w-[20%] px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Thời gian</th>
                <th className="w-[18%] py-2.5 pl-3 pr-5 text-right text-xs font-semibold text-slate-500">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item, index) => {
                const cells = historyCells(item);
                return (
                  <tr key={`${item.kind}-${item.at}-${index}`} className="border-t border-slate-200">
                    <td className="py-3 pl-5 pr-3 font-semibold text-slate-900">{cells.kindLabel}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-600">{cells.code}</td>
                    <td className={`whitespace-nowrap px-3 py-3 ${isAlarm(item) ? 'text-rose-600' : 'text-slate-600'}`}>{cells.status}</td>
                    <td className="num whitespace-nowrap px-3 py-3 text-left text-slate-500">{formatWhen(item.at)}</td>
                    <td className="num whitespace-nowrap py-3 pl-3 pr-5 text-right text-slate-900">{cells.amount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

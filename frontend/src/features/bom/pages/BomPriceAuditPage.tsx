import React, { useEffect, useState } from 'react';
import { History, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fetchFacilities } from '@/api/facility';
import { fetchPriceAudit } from '@/api/pricing';
import type { PriceAuditEntry, PriceAuditField, PriceAuditPage } from '@/api/pricing';
import type { FacilityListItem } from '@/types';

const CATEGORIES = [
  { value: 'ALL', label: 'Tất cả loại giá' },
  { value: 'RENT', label: 'Giá thuê' },
  { value: 'SURCHARGE', label: 'Phụ phí' },
  { value: 'POLICY', label: 'Chính sách' },
] as const;

function categoryLabel(category: string): string {
  return CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

function statusClass(status: string): string {
  if (status === 'Đang áp dụng') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Chưa áp dụng') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function formatWhen(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDay(value?: string | null): string {
  if (!value) return '—';
  const [year, month, day] = value.split('T')[0].split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function fieldChanged(entry: PriceAuditEntry, field: PriceAuditField): boolean {
  return entry.changes.some(
    (change) => change.key === field.key && (change.oldValue ?? '') !== (change.newValue ?? '')
  );
}

export const BomPriceAuditPage: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [category, setCategory] = useState('ALL');
  const [facilityId, setFacilityId] = useState<number | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [actorId, setActorId] = useState<number | ''>('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PriceAuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PriceAuditEntry | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchFacilities()
      .then((items) => {
        if (!ignore) setFacilities(items.filter((item) => item.isActive));
      })
      .catch(() => {
        if (!ignore) setFacilities([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    fetchPriceAudit({
      category,
      facilityId: facilityId === '' ? undefined : facilityId,
      from: from || undefined,
      to: to || undefined,
      actorId: actorId === '' ? undefined : actorId,
      page,
      size: 20,
    })
      .then((result) => {
        if (!ignore) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setData(null);
          setLoading(false);
          setError(err instanceof Error ? err.message : 'Không tải được nhật ký giá');
        }
      });
    return () => {
      ignore = true;
    };
  }, [category, facilityId, from, to, actorId, page]);

  const resetPage = () => setPage(0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-2.5">
        <div className="p-2.5 rounded-xl bg-violet-600 text-white">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nhật ký giá & phí</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mọi phiên bản BOM đã ban hành: giá thuê theo m², phụ phí và tham số chính sách
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="text-xs font-semibold text-slate-500">
          Loại
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              resetPage();
            }}
            className="mt-1 w-full text-sm font-medium border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800"
          >
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Cơ sở
          <select
            value={facilityId}
            onChange={(event) => {
              setFacilityId(event.target.value ? Number(event.target.value) : '');
              resetPage();
            }}
            className="mt-1 w-full text-sm font-medium border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800"
          >
            <option value="">Tất cả cơ sở</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Ghi từ ngày
          <input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              resetPage();
            }}
            className="mt-1 w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Đến ngày
          <input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              resetPage();
            }}
            className="mt-1 w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Người thực hiện
          <select
            value={actorId}
            onChange={(event) => {
              setActorId(event.target.value ? Number(event.target.value) : '');
              resetPage();
            }}
            className="mt-1 w-full text-sm font-medium border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800"
          >
            <option value="">Tất cả</option>
            {(data?.actors ?? []).map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-500 -mt-3 px-1">
        Chính sách áp dụng toàn hệ thống nên vẫn hiện khi lọc theo một cơ sở. Phụ phí toàn hệ thống cũng vậy.
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải nhật ký
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-rose-600">{error}</p>
        ) : !data || data.content.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">Chưa có phiên bản nào trong bộ lọc này.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Thời điểm ghi</th>
                  <th className="py-3.5 px-4">Người thực hiện</th>
                  <th className="py-3.5 px-4">Loại</th>
                  <th className="py-3.5 px-4">Đối tượng</th>
                  <th className="py-3.5 px-4">Giá trị cũ → mới</th>
                  <th className="py-3.5 px-4">Hiệu lực</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className="border-b border-slate-100 hover:bg-violet-50/40 cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">{formatWhen(entry.recordedAt)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{entry.actorName}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{categoryLabel(entry.category)}</td>
                    <td className="py-3 px-4">{entry.subject}</td>
                    <td className="py-3 px-4 text-slate-700">{entry.changeSummary}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{formatDay(entry.effectiveFrom)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${statusClass(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.totalElements > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              {data.totalElements} phiên bản · trang {data.page + 1}/{Math.max(data.totalPages, 1)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-900/40" onClick={() => setSelected(null)}>
          <aside
            className="h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-violet-600 uppercase">{categoryLabel(selected.category)}</p>
                <h2 className="text-lg font-bold text-slate-900">{selected.subject}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selected.actorName} · {formatWhen(selected.recordedAt)} · hiệu lực {formatDay(selected.effectiveFrom)}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-700">{selected.changeSummary}</p>
              <h3 className="text-xs font-semibold uppercase text-slate-500 pt-2">Snapshot phiên bản</h3>
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {(selected.snapshot.length > 0 ? selected.snapshot : selected.changes).map((field) => {
                  const changed = fieldChanged(selected, field);
                  return (
                    <li key={field.key} className={`px-3 py-2.5 text-sm ${changed ? 'bg-amber-50' : ''}`}>
                      <p className="text-xs text-slate-500">{field.label}</p>
                      <p className="font-medium text-slate-800">
                        {field.oldValue ? `${field.oldValue} → ${field.newValue ?? '—'}` : field.newValue ?? '—'}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

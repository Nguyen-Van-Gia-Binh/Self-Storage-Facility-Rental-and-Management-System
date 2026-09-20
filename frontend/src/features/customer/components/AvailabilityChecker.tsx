import React, { useState } from 'react';
import { CalendarDays, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { checkAvailability } from '@/api/facility';
import type { AvailabilityQuery, AvailabilityResult } from '@/types';

interface AvailabilityCheckerProps {
  facilityId: number;
  unitTypeId: number;
  unitTypeName: string;
  monthlyPrice: number;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';
const today = () => new Date().toISOString().split('T')[0];

export const AvailabilityChecker: React.FC<AvailabilityCheckerProps> = ({
  facilityId,
  unitTypeId,
  unitTypeName,
}) => {
  const [query, setQuery] = useState<AvailabilityQuery>({ startDate: today(), rentalMonths: 1 });
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [startErr, setStartErr] = useState('');
  const [monthsErr, setMonthsErr] = useState('');
  const [apiErr, setApiErr] = useState('');

  function validate() {
    let ok = true;
    setStartErr('');
    setMonthsErr('');
    if (!query.startDate || query.startDate < today()) {
      setStartErr('Ngày bắt đầu phải từ hôm nay trở đi');
      ok = false;
    }
    if (!Number.isInteger(query.rentalMonths) || query.rentalMonths < 1) {
      setMonthsErr('Thời hạn thuê phải là số tháng nguyên ≥ 1 (BR-GEN-03)');
      ok = false;
    }
    return ok;
  }

  async function handleCheck() {
    if (!validate()) return;
    setLoading(true);
    setApiErr('');
    setResult(null);
    try {
      setResult(await checkAvailability(facilityId, unitTypeId, query));
    } catch (e: unknown) {
      setApiErr((e as { message?: string })?.message ?? 'Không thể kiểm tra. Thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id={`availability-checker-${unitTypeId}`} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
      <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-teal-600" />
        Kiểm tra phòng trống — <span className="text-teal-700">{unitTypeName}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`start-date-${unitTypeId}`} className="block text-xs font-medium text-slate-600 mb-1">
            Ngày bắt đầu thuê
          </label>
          <input
            id={`start-date-${unitTypeId}`}
            type="date"
            min={today()}
            value={query.startDate}
            onChange={(e) => setQuery((q) => ({ ...q, startDate: e.target.value }))}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              startErr ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          {startErr && <p className="mt-1 text-xs text-red-500">{startErr}</p>}
        </div>
        <div>
          <label htmlFor={`rental-months-${unitTypeId}`} className="block text-xs font-medium text-slate-600 mb-1">
            Thời hạn thuê (tháng)
          </label>
          <select
            id={`rental-months-${unitTypeId}`}
            value={query.rentalMonths}
            onChange={(e) => setQuery((q) => ({ ...q, rentalMonths: Number(e.target.value) }))}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              monthsErr ? 'border-red-400' : 'border-slate-300'
            }`}
          >
            {[1, 2, 3, 6, 12].map((m) => (
              <option key={m} value={m}>
                {m} tháng
              </option>
            ))}
          </select>
          {monthsErr && <p className="mt-1 text-xs text-red-500">{monthsErr}</p>}
        </div>
      </div>

      <button
        id={`btn-check-availability-${unitTypeId}`}
        onClick={handleCheck}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-teal-600 text-teal-700 text-sm font-medium hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra...
          </>
        ) : (
          <>
            <CalendarDays className="w-4 h-4" /> Kiểm tra phòng trống
          </>
        )}
      </button>

      {apiErr && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {apiErr}
        </div>
      )}

      {result && (
        <div
          id={`availability-result-${unitTypeId}`}
          className={`p-4 rounded-lg border ${
            result.availableSlots > 0 ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            {result.availableSlots > 0 ? (
              <CheckCircle className="w-5 h-5 text-teal-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
            <p className={`text-sm font-semibold ${result.availableSlots > 0 ? 'text-teal-800' : 'text-amber-800'}`}>
              {result.availableSlots > 0
                ? `Còn ${result.availableSlots} ô kho trống`
                : 'Tạm hết ô kho trong khoảng thời gian này'}
            </p>
          </div>
          {result.availableSlots > 0 && (
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>
                Từ <span className="font-medium text-slate-800">{result.startDate}</span> đến{' '}
                <span className="font-medium text-slate-800">{result.endDateExclusive}</span>
              </p>
              <p>
                Tiền thuê {result.rentalMonths} tháng:{' '}
                <span className="font-bold text-slate-800">{fmt(result.totalRentalFee)}</span>
              </p>
              <p>
                Tiền cọc (BR-DEP-01):{' '}
                <span className="font-bold text-slate-800">{fmt(result.depositAmount)}</span>
              </p>
              <p className="pt-1 font-bold text-slate-800 border-t border-slate-200">
                Tổng thanh toán: {fmt(result.totalRentalFee + result.depositAmount)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// frontend/src/features/bom/components/PolicyDrawer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { publishPolicy, type PolicyPublishPayload, type PolicyVersionListItem } from '@/api/pricing';
import type { ActivePolicyInfo } from '@/types';
import { useScrollLock } from '@/hooks/useScrollLock';

interface PolicyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'publish' | 'view';
  activePolicy: ActivePolicyInfo | null;
  viewingVersion: PolicyVersionListItem | null;
  onPublishSuccess: () => void;
  onSwitchToPublishWithSnapshot?: (snapshot: any) => void;
}

type FormState = {
  effectiveDate: string;
  depositMultiplier: string;
  reservationHoldHours: string;
  rentalBufferDays: string;
  rentalDailyDivisor: string;
  checkinGraceDays: string;
  cancelFullRefundHours: string;
  cancelLateRefundRate: string;
  cancelNoShowRefundRate: string;
  renewalReminderDays: string;
  renewalMinMonths: string;
  renewalMaxMonths: string;
  overdueGraceDays: string;
  overdueDailyRate: string;
  overdueCapRate: string;
  overdueLockAccessDays: string;
  overdueTerminationDays: string;
  returnNoticeDays: string;
  returnRefundWorkingDays: string;
  returnEarlyRefundRate: string;
  accessPinLength: string;
  supportUrgentSlaHours: string;
  supportAutoCloseWorkingDays: string;
  confirmed: boolean;
};

function todayInVietnam(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function rateToPercent(rate: number | null | undefined, fallbackFraction: number): string {
  const fraction = rate == null || Number.isNaN(rate) ? fallbackFraction : rate;
  return String(Math.round(fraction * 1000) / 10);
}

function percentToRate(raw: string): number {
  return Number(raw) / 100;
}

function fromPolicySource(source: any): FormState {
  if (!source) {
    return {
      effectiveDate: todayInVietnam(),
      depositMultiplier: '1',
      reservationHoldHours: '48',
      rentalBufferDays: '15',
      rentalDailyDivisor: '30',
      checkinGraceDays: '10',
      cancelFullRefundHours: '48',
      cancelLateRefundRate: '50',
      cancelNoShowRefundRate: '0',
      renewalReminderDays: '60,7,3,1',
      renewalMinMonths: '1',
      renewalMaxMonths: '12',
      overdueGraceDays: '3',
      overdueDailyRate: '10',
      overdueCapRate: '70',
      overdueLockAccessDays: '7',
      overdueTerminationDays: '10',
      returnNoticeDays: '30',
      returnRefundWorkingDays: '7',
      returnEarlyRefundRate: '0',
      accessPinLength: '6',
      supportUrgentSlaHours: '2',
      supportAutoCloseWorkingDays: '7',
      confirmed: false,
    };
  }

  const date = source.effectiveFrom
    ? new Date(source.effectiveFrom).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    : source.effectiveDate || todayInVietnam();
  const today = todayInVietnam();

  return {
    effectiveDate: date < today ? today : date,
    depositMultiplier: String(source.depositMultiplier ?? 1),
    reservationHoldHours: String(source.reservationHoldHours ?? 48),
    rentalBufferDays: String(source.rentalBufferDays ?? 15),
    rentalDailyDivisor: String(source.rentalDailyDivisor ?? 30),
    checkinGraceDays: String(source.checkinGraceDays ?? 10),
    cancelFullRefundHours: String(source.cancelFullRefundHours ?? 48),
    cancelLateRefundRate: rateToPercent(source.cancelLateRefundRate, 0.5),
    cancelNoShowRefundRate: rateToPercent(source.cancelNoShowRefundRate, 0),
    renewalReminderDays: source.renewalReminderDays || '60,7,3,1',
    renewalMinMonths: String(source.renewalMinMonths ?? 1),
    renewalMaxMonths: String(source.renewalMaxMonths ?? 12),
    overdueGraceDays: String(source.overdueGraceDays ?? 3),
    overdueDailyRate: rateToPercent(source.overdueDailyRate, 0.1),
    overdueCapRate: rateToPercent(source.overdueCapRate, 0.7),
    overdueLockAccessDays: String(source.overdueLockAccessDays ?? 7),
    overdueTerminationDays: String(source.overdueTerminationDays ?? 10),
    returnNoticeDays: String(source.returnNoticeDays ?? 30),
    returnRefundWorkingDays: String(source.returnRefundWorkingDays ?? 7),
    returnEarlyRefundRate: rateToPercent(source.returnEarlyRefundRate, 0),
    accessPinLength: String(source.accessPinLength ?? 6),
    supportUrgentSlaHours: String(source.supportUrgentSlaHours ?? 2),
    supportAutoCloseWorkingDays: String(source.supportAutoCloseWorkingDays ?? 7),
    confirmed: false,
  };
}

const DIFF_META: Record<keyof Omit<FormState, 'confirmed' | 'effectiveDate'>, { label: string; unit: string }> = {
  depositMultiplier: { label: 'Hệ số cọc', unit: 'tháng' },
  reservationHoldHours: { label: 'Giờ giữ chỗ', unit: 'giờ' },
  rentalBufferDays: { label: 'Ngày đệm sau thuê', unit: 'ngày' },
  rentalDailyDivisor: { label: 'Quy ước ngày / tháng', unit: 'ngày' },
  checkinGraceDays: { label: 'Ân hạn nhận kho', unit: 'ngày' },
  cancelFullRefundHours: { label: 'Giờ hủy hoàn 100%', unit: 'giờ' },
  cancelLateRefundRate: { label: 'Hoàn tiền hủy muộn', unit: '%' },
  cancelNoShowRefundRate: { label: 'Hoàn tiền vắng mặt', unit: '%' },
  renewalReminderDays: { label: 'Mốc nhắc gia hạn', unit: 'ngày' },
  renewalMinMonths: { label: 'Kỳ hạn tối thiểu', unit: 'tháng' },
  renewalMaxMonths: { label: 'Kỳ hạn tối đa', unit: 'tháng' },
  overdueGraceDays: { label: 'Ân hạn quá hạn', unit: 'ngày' },
  overdueDailyRate: { label: 'Phí quá hạn mỗi ngày', unit: '%' },
  overdueCapRate: { label: 'Trần phí quá hạn', unit: '%' },
  overdueLockAccessDays: { label: 'Mốc khóa truy cập', unit: 'ngày' },
  overdueTerminationDays: { label: 'Mốc chấm dứt HĐ', unit: 'ngày' },
  returnNoticeDays: { label: 'Khóa quyền gia hạn', unit: 'ngày' },
  returnRefundWorkingDays: { label: 'Ngày hoàn cọc', unit: 'ngày' },
  returnEarlyRefundRate: { label: 'Hoàn tiền trả sớm', unit: '%' },
  accessPinLength: { label: 'Độ dài mã PIN', unit: 'ký tự' },
  supportUrgentSlaHours: { label: 'SLA sự cố khẩn', unit: 'giờ' },
  supportAutoCloseWorkingDays: { label: 'Tự đóng hỗ trợ', unit: 'ngày' },
};

function statusBadgeClass(status?: string): string {
  if (status === 'Đang hiệu lực') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Chưa áp dụng') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export const PolicyDrawer: React.FC<PolicyDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  activePolicy,
  viewingVersion,
  onPublishSuccess,
  onSwitchToPublishWithSnapshot,
}) => {
  useScrollLock(isOpen);

  const baselineState = useMemo(() => fromPolicySource(activePolicy), [activePolicy]);

  const [form, setForm] = useState<FormState>(baselineState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Accordion section expanded states
  const [sections, setSections] = useState({
    deposit: true,
    renewal: true,
    cancellation: true,
    overdue: true,
    support: false,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (mode === 'view' && viewingVersion) {
      setForm(fromPolicySource(viewingVersion.rawPolicy || activePolicy));
    } else {
      setForm(baselineState);
    }
    setError('');
  }, [mode, viewingVersion, baselineState, isOpen]);

  const setField = (key: keyof FormState) => (value: string) => {
    if (mode === 'view') return;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const isReadOnly = mode === 'view';

  // Compute Diff between baseline and current form
  const diffs = useMemo(() => {
    if (isReadOnly) return [];
    const list: Array<{ key: string; label: string; oldVal: string; newVal: string; unit: string }> = [];
    (Object.keys(DIFF_META) as Array<keyof typeof DIFF_META>).forEach((field) => {
      if (form[field] !== baselineState[field]) {
        list.push({
          key: field,
          label: DIFF_META[field].label,
          oldVal: baselineState[field],
          newVal: form[field],
          unit: DIFF_META[field].unit,
        });
      }
    });
    return list;
  }, [form, baselineState, isReadOnly]);

  const validate = (): string | null => {
    if (form.effectiveDate < todayInVietnam()) {
      return 'Ngày hiệu lực không được ở quá khứ';
    }
    if (Number(form.depositMultiplier) <= 0) {
      return 'Hệ số cọc phải lớn hơn 0';
    }
    if (Number(form.renewalMinMonths) > Number(form.renewalMaxMonths)) {
      return 'Số tháng gia hạn tối thiểu không được lớn hơn số tháng tối đa';
    }
    const reminders = form.renewalReminderDays.split(',').map((item) => item.trim()).filter(Boolean);
    const seen = new Set<string>();
    for (const item of reminders) {
      const day = Number(item);
      if (!Number.isInteger(day) || day <= 0 || seen.has(item)) {
        return 'Các mốc nhắc gia hạn phải lớn hơn 0 và không được trùng nhau';
      }
      seen.add(item);
    }
    const rates: Array<[string, string]> = [
      ['Tỷ lệ hoàn khi hủy muộn', form.cancelLateRefundRate],
      ['Tỷ lệ hoàn no-show', form.cancelNoShowRefundRate],
      ['Phí quá hạn mỗi ngày', form.overdueDailyRate],
      ['Trần phí quá hạn', form.overdueCapRate],
      ['Tỷ lệ hoàn khi trả sớm', form.returnEarlyRefundRate],
    ];
    for (const [label, raw] of rates) {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        return `${label} phải từ 0% đến 100%`;
      }
    }
    const grace = Number(form.overdueGraceDays);
    const lock = Number(form.overdueLockAccessDays);
    const termination = Number(form.overdueTerminationDays);
    if (!(Number.isInteger(grace) && Number.isInteger(lock) && Number.isInteger(termination) && grace < lock && lock <= termination)) {
      return 'Ân hạn phải nhỏ hơn mốc khóa truy cập, và mốc khóa không được sau ngày chấm dứt';
    }
    if (!form.confirmed) {
      return 'Cần đánh dấu xác nhận ban hành trước khi lưu phiên bản mới';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isReadOnly) return;
    setError('');

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const payload: PolicyPublishPayload = {
      effectiveFrom: `${form.effectiveDate}T00:00:00+07:00`,
      depositMultiplier: Number(form.depositMultiplier),
      reservationHoldHours: Number(form.reservationHoldHours),
      rentalBufferDays: Number(form.rentalBufferDays),
      rentalDailyDivisor: Number(form.rentalDailyDivisor),
      checkinGraceDays: Number(form.checkinGraceDays),
      cancelFullRefundHours: Number(form.cancelFullRefundHours),
      cancelLateRefundRate: percentToRate(form.cancelLateRefundRate),
      cancelNoShowRefundRate: percentToRate(form.cancelNoShowRefundRate),
      renewalReminderDays: form.renewalReminderDays,
      renewalMinMonths: Number(form.renewalMinMonths),
      renewalMaxMonths: Number(form.renewalMaxMonths),
      overdueGraceDays: Number(form.overdueGraceDays),
      overdueDailyRate: percentToRate(form.overdueDailyRate),
      overdueCapRate: percentToRate(form.overdueCapRate),
      overdueNoticeDays: Number(form.overdueGraceDays) + 1,
      overdueLockAccessDays: Number(form.overdueLockAccessDays),
      overdueTerminationDays: Number(form.overdueTerminationDays),
      returnNoticeDays: Number(form.returnNoticeDays),
      returnRefundWorkingDays: Number(form.returnRefundWorkingDays),
      returnEarlyRefundRate: percentToRate(form.returnEarlyRefundRate),
      accessPinLength: Number(form.accessPinLength),
      supportUrgentSlaHours: Number(form.supportUrgentSlaHours),
      supportAutoCloseWorkingDays: Number(form.supportAutoCloseWorkingDays),
    };

    setSaving(true);
    try {
      await publishPolicy(payload);
      onPublishSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không ban hành được chính sách');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              {isReadOnly ? (
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Chi tiết phiên bản v{viewingVersion?.versionNo ?? '—'}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass(
                      viewingVersion?.status
                    )}`}
                  >
                    {viewingVersion?.status || 'Chỉ đọc'}
                  </span>
                </div>
              ) : (
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Tạo phiên bản chính sách mới
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kế thừa từ phiên bản v{activePolicy?.version ?? '1'} (Đang hiệu lực)
                  </p>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Banner Thông báo */}
          {isReadOnly ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">
                  Thông số snapshot lịch sử phiên bản v{viewingVersion?.versionNo}
                </p>
                <p className="mt-0.5">
                  Ngày áp dụng: {viewingVersion?.effectiveDate || '—'} · Người ban hành: {viewingVersion?.publishedBy ? `BOM #${viewingVersion.publishedBy}` : 'Hệ thống'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Lưu ý:</strong> Thay đổi chính sách sẽ sinh ra một phiên bản mới. Hợp đồng đã tạo trước ngày hiệu lực vẫn giữ nguyên thông số theo snapshot ban đầu.
              </p>
            </div>
          )}

          {/* Ngày hiệu lực (Publish Mode) */}
          {!isReadOnly && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label htmlFor="policy-effective-date" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày bắt đầu hiệu lực phiên bản mới <span className="text-rose-500">*</span>
              </label>
              <input
                id="policy-effective-date"
                type="date"
                min={todayInVietnam()}
                value={form.effectiveDate}
                onChange={(e) => setField('effectiveDate')(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Nếu chọn hôm nay, phiên bản sẽ có hiệu lực ngay lập tức cho các đơn tạo mới tiếp theo.
              </p>
            </div>
          )}

          {/* [1] CƠ BẢN & ĐẶT CỌC */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('deposit')}
              className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-left font-bold text-xs text-slate-800 uppercase tracking-wider hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-indigo-700">
                <ShieldCheck className="w-4 h-4" />
                1. Cơ bản & Quy định Đặt cọc
              </span>
              {sections.deposit ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {sections.deposit && (
              <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="deposit-multiplier-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Hệ số tiền cọc (tháng tiền thuê) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="deposit-multiplier-input"
                      type="number"
                      step="0.1"
                      disabled={isReadOnly}
                      value={form.depositMultiplier}
                      onChange={(e) => setField('depositMultiplier')(e.target.value)}
                      className={`w-full px-3 py-2 pr-14 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      tháng
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Khách cọc bằng N tháng tiền thuê</p>
                </div>

                <div>
                  <label htmlFor="hold-hours-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời hạn giữ chỗ đơn đặt kho <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="hold-hours-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.reservationHoldHours}
                      onChange={(e) => setField('reservationHoldHours')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      giờ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Thời gian thanh toán cọc trước khi hủy</p>
                </div>

                <div>
                  <label htmlFor="checkin-grace-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Ân hạn ngày nhận kho bàn giao
                  </label>
                  <div className="relative">
                    <input
                      id="checkin-grace-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.checkinGraceDays}
                      onChange={(e) => setField('checkinGraceDays')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      ngày
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Số ngày chờ khách trước khi coi là no-show</p>
                </div>

                <div>
                  <label htmlFor="rental-divisor-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Quy ước ngày của một tháng thuê
                  </label>
                  <div className="relative">
                    <input
                      id="rental-divisor-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.rentalDailyDivisor}
                      onChange={(e) => setField('rentalDailyDivisor')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      ngày
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mẫu số chia tính tiền ngày lẻ (thường là 30)</p>
                </div>
              </div>
            )}
          </div>

          {/* [2] GIA HẠN HỢP ĐỒNG */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('renewal')}
              className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-left font-bold text-xs text-slate-800 uppercase tracking-wider hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-indigo-700">
                <RefreshCw className="w-4 h-4" />
                2. Chính sách Gia hạn Hợp đồng
              </span>
              {sections.renewal ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {sections.renewal && (
              <div className="p-4 bg-white space-y-4">
                <div>
                  <label htmlFor="renewal-reminder-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Các mốc ngày gửi thông báo nhắc gia hạn
                  </label>
                  <input
                    id="renewal-reminder-input"
                    type="text"
                    disabled={isReadOnly}
                    value={form.renewalReminderDays}
                    onChange={(e) => setField('renewalReminderDays')(e.target.value)}
                    placeholder="VD: 60,7,3,1"
                    className={`w-full px-3 py-2 border rounded-lg text-sm font-medium font-mono ${
                      isReadOnly
                        ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                        : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Các ngày trước khi hết hạn (ngăn cách bằng dấu phẩy). VD: 60,7,3,1
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="renewal-min-months-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Kỳ hạn gia hạn tối thiểu
                    </label>
                    <div className="relative">
                      <input
                        id="renewal-min-months-input"
                        type="number"
                        disabled={isReadOnly}
                        value={form.renewalMinMonths}
                        onChange={(e) => setField('renewalMinMonths')(e.target.value)}
                        className={`w-full px-3 py-2 pr-14 border rounded-lg text-sm font-semibold tabular-nums ${
                          isReadOnly
                            ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                            : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                        }`}
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                        tháng
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="renewal-max-months-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Kỳ hạn gia hạn tối đa
                    </label>
                    <div className="relative">
                      <input
                        id="renewal-max-months-input"
                        type="number"
                        disabled={isReadOnly}
                        value={form.renewalMaxMonths}
                        onChange={(e) => setField('renewalMaxMonths')(e.target.value)}
                        className={`w-full px-3 py-2 pr-14 border rounded-lg text-sm font-semibold tabular-nums ${
                          isReadOnly
                            ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                            : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                        }`}
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                        tháng
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* [3] HỦY ĐẶT CHỖ & TRẢ KHO */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('cancellation')}
              className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-left font-bold text-xs text-slate-800 uppercase tracking-wider hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-indigo-700">
                <Clock className="w-4 h-4" />
                3. Hủy Đặt chỗ & Quy định Trả kho
              </span>
              {sections.cancellation ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {sections.cancellation && (
              <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cancel-full-refund-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Hạn giờ hủy được hoàn 100%
                  </label>
                  <div className="relative">
                    <input
                      id="cancel-full-refund-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.cancelFullRefundHours}
                      onChange={(e) => setField('cancelFullRefundHours')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      giờ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Trước mốc này được hoàn 100% tiền cọc</p>
                </div>

                <div>
                  <label htmlFor="cancel-late-refund-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Tỷ lệ hoàn tiền khi hủy muộn
                  </label>
                  <div className="relative">
                    <input
                      id="cancel-late-refund-input"
                      type="number"
                      step="0.1"
                      disabled={isReadOnly}
                      value={form.cancelLateRefundRate}
                      onChange={(e) => setField('cancelLateRefundRate')(e.target.value)}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sau mốc trên, chỉ hoàn N% tiền cọc</p>
                </div>

                <div>
                  <label htmlFor="return-notice-days-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Khóa quyền gia hạn (ngày trước hết hạn)
                  </label>
                  <div className="relative">
                    <input
                      id="return-notice-days-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.returnNoticeDays}
                      onChange={(e) => setField('returnNoticeDays')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      ngày
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dưới mốc này tính năng gia hạn tự động khóa</p>
                </div>

                <div>
                  <label htmlFor="return-refund-days-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày làm việc hoàn tiền cọc trả kho
                  </label>
                  <div className="relative">
                    <input
                      id="return-refund-days-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.returnRefundWorkingDays}
                      onChange={(e) => setField('returnRefundWorkingDays')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      ngày
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Thời hạn đối soát hoàn tất hoàn tiền</p>
                </div>
              </div>
            )}
          </div>

          {/* [4] QUÁ HẠN & PHẠT */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('overdue')}
              className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-left font-bold text-xs text-slate-800 uppercase tracking-wider hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                4. Xử lý Quá hạn & Phạt chậm trả
              </span>
              {sections.overdue ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {sections.overdue && (
              <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="overdue-grace-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Số ngày ân hạn quá hạn
                  </label>
                  <div className="relative">
                    <input
                      id="overdue-grace-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.overdueGraceDays}
                      onChange={(e) => setField('overdueGraceDays')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      ngày
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tính phí phạt từ ngày thứ {Number(form.overdueGraceDays) + 1}</p>
                </div>

                <div>
                  <label htmlFor="overdue-daily-rate-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Tỷ lệ phí quá hạn mỗi ngày
                  </label>
                  <div className="relative">
                    <input
                      id="overdue-daily-rate-input"
                      type="number"
                      step="0.1"
                      disabled={isReadOnly}
                      value={form.overdueDailyRate}
                      onChange={(e) => setField('overdueDailyRate')(e.target.value)}
                      className={`w-full px-3 py-2 pr-16 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      %/ngày
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tính trên mức cọc hoặc tiền thuê ngày</p>
                </div>

                <div>
                  <label htmlFor="overdue-cap-rate-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Trần phí quá hạn tối đa
                  </label>
                  <div className="relative">
                    <input
                      id="overdue-cap-rate-input"
                      type="number"
                      step="0.1"
                      disabled={isReadOnly}
                      value={form.overdueCapRate}
                      onChange={(e) => setField('overdueCapRate')(e.target.value)}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mức phạt cộng dồn không vượt quá trần này</p>
                </div>

                <div>
                  <label htmlFor="overdue-lock-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Mốc tự động khóa quyền truy cập
                  </label>
                  <div className="relative">
                    <input
                      id="overdue-lock-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.overdueLockAccessDays}
                      onChange={(e) => setField('overdueLockAccessDays')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      ngày
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Khóa mã PIN mở cửa của khách</p>
                </div>
              </div>
            )}
          </div>

          {/* [5] TRUY CẬP & HỖ TRỢ */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('support')}
              className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-left font-bold text-xs text-slate-800 uppercase tracking-wider hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-indigo-700">
                <KeyRound className="w-4 h-4" />
                5. Truy cập & Hỗ trợ kỹ thuật
              </span>
              {sections.support ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {sections.support && (
              <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="access-pin-length-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Độ dài mã PIN
                  </label>
                  <div className="relative">
                    <input
                      id="access-pin-length-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.accessPinLength}
                      onChange={(e) => setField('accessPinLength')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      ký tự
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="support-urgent-sla-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    SLA sự cố khẩn cấp
                  </label>
                  <div className="relative">
                    <input
                      id="support-urgent-sla-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.supportUrgentSlaHours}
                      onChange={(e) => setField('supportUrgentSlaHours')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      giờ
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="support-autoclose-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Tự đóng ticket hỗ trợ
                  </label>
                  <div className="relative">
                    <input
                      id="support-autoclose-input"
                      type="number"
                      disabled={isReadOnly}
                      value={form.supportAutoCloseWorkingDays}
                      onChange={(e) => setField('supportAutoCloseWorkingDays')(e.target.value)}
                      className={`w-full px-3 py-2 pr-12 border rounded-lg text-sm font-semibold tabular-nums ${
                        isReadOnly
                          ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                      ngày
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Diff Preview Box (Publish Mode) */}
          {!isReadOnly && diffs.length > 0 && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Xem trước thay đổi ({diffs.length} thông số sẽ được cập nhật):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {diffs.map((d) => (
                  <div key={d.key} className="bg-white/80 p-2 rounded-lg border border-indigo-100 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">{d.label}:</span>
                    <span className="font-mono font-bold text-slate-900">
                      <span className="text-slate-400 line-through mr-1.5">{d.oldVal}</span>
                      <span className="text-indigo-600">{d.newVal} {d.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation & Confirmation (Publish Mode) */}
          {!isReadOnly && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.confirmed}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmed: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5 cursor-pointer"
                />
                <span>
                  Tôi xác nhận ban hành phiên bản chính sách mới này. Hệ thống sẽ lưu giữ snapshot và áp dụng từ ngày {form.effectiveDate}.
                </span>
              </label>

              {error && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                  {error}
                </p>
              )}
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/90 bg-slate-50/70 flex items-center justify-between gap-3">
          {isReadOnly ? (
            <>
              {onSwitchToPublishWithSnapshot && viewingVersion?.rawPolicy ? (
                <button
                  type="button"
                  onClick={() => onSwitchToPublishWithSnapshot(viewingVersion.rawPolicy)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kế thừa bản này để ban hành</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang ban hành...</span>
                  </>
                ) : (
                  <span>Ban hành chính sách</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

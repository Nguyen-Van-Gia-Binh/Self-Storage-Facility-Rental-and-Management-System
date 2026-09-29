import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { fetchPolicyForPublish, publishPolicy, type PolicyPublishPayload } from '@/api/pricing';

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
  overdueNoticeDays: string;
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
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function emptyForm(): FormState {
  return {
    effectiveDate: todayInVietnam(),
    depositMultiplier: '1',
    reservationHoldHours: '48',
    rentalBufferDays: '15',
    rentalDailyDivisor: '30',
    checkinGraceDays: '10',
    cancelFullRefundHours: '48',
    cancelLateRefundRate: '0',
    cancelNoShowRefundRate: '0',
    renewalReminderDays: '60,7,3,1',
    renewalMinMonths: '1',
    renewalMaxMonths: '12',
    overdueGraceDays: '3',
    overdueDailyRate: '0.1',
    overdueCapRate: '0.7',
    overdueNoticeDays: '4',
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

function fromPolicy(policy: PolicyPublishPayload): FormState {
  const date = policy.effectiveFrom
    ? new Date(policy.effectiveFrom).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    : todayInVietnam();
  const today = todayInVietnam();
  return {
    effectiveDate: date < today ? today : date,
    depositMultiplier: String(policy.depositMultiplier ?? 1),
    reservationHoldHours: String(policy.reservationHoldHours ?? 48),
    rentalBufferDays: String(policy.rentalBufferDays ?? 15),
    rentalDailyDivisor: String(policy.rentalDailyDivisor ?? 30),
    checkinGraceDays: String(policy.checkinGraceDays ?? 10),
    cancelFullRefundHours: String(policy.cancelFullRefundHours ?? 48),
    cancelLateRefundRate: String(policy.cancelLateRefundRate ?? 0),
    cancelNoShowRefundRate: String(policy.cancelNoShowRefundRate ?? 0),
    renewalReminderDays: policy.renewalReminderDays || '60,7,3,1',
    renewalMinMonths: String(policy.renewalMinMonths ?? 1),
    renewalMaxMonths: String(policy.renewalMaxMonths ?? 12),
    overdueGraceDays: String(policy.overdueGraceDays ?? 3),
    overdueDailyRate: String(policy.overdueDailyRate ?? 0.1),
    overdueCapRate: String(policy.overdueCapRate ?? 0.7),
    overdueNoticeDays: String(policy.overdueNoticeDays ?? 4),
    overdueLockAccessDays: String(policy.overdueLockAccessDays ?? 7),
    overdueTerminationDays: String(policy.overdueTerminationDays ?? 10),
    returnNoticeDays: String(policy.returnNoticeDays ?? 30),
    returnRefundWorkingDays: String(policy.returnRefundWorkingDays ?? 7),
    returnEarlyRefundRate: String(policy.returnEarlyRefundRate ?? 0),
    accessPinLength: String(policy.accessPinLength ?? 6),
    supportUrgentSlaHours: String(policy.supportUrgentSlaHours ?? 2),
    supportAutoCloseWorkingDays: String(policy.supportAutoCloseWorkingDays ?? 7),
    confirmed: false,
  };
}

function Field({
  label,
  value,
  onChange,
  type = 'number',
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

export const BomPolicyPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPolicyForPublish()
      .then((policy) => setForm(fromPolicy(policy)))
      .catch(() => setForm(emptyForm()))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

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
    const grace = Number(form.overdueGraceDays);
    const notice = Number(form.overdueNoticeDays);
    const lock = Number(form.overdueLockAccessDays);
    const termination = Number(form.overdueTerminationDays);
    if (!(grace < notice && notice <= lock && lock <= termination)) {
      return 'Các mốc quá hạn phải theo thứ tự: ân hạn → bắt đầu tính phí → khóa truy cập → chấm dứt';
    }
    if (!form.confirmed) {
      return 'Cần xác nhận ban hành trước khi lưu phiên bản mới';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
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
      cancelLateRefundRate: Number(form.cancelLateRefundRate),
      cancelNoShowRefundRate: Number(form.cancelNoShowRefundRate),
      renewalReminderDays: form.renewalReminderDays,
      renewalMinMonths: Number(form.renewalMinMonths),
      renewalMaxMonths: Number(form.renewalMaxMonths),
      overdueGraceDays: Number(form.overdueGraceDays),
      overdueDailyRate: Number(form.overdueDailyRate),
      overdueCapRate: Number(form.overdueCapRate),
      overdueNoticeDays: Number(form.overdueNoticeDays),
      overdueLockAccessDays: Number(form.overdueLockAccessDays),
      overdueTerminationDays: Number(form.overdueTerminationDays),
      returnNoticeDays: Number(form.returnNoticeDays),
      returnRefundWorkingDays: Number(form.returnRefundWorkingDays),
      returnEarlyRefundRate: Number(form.returnEarlyRefundRate),
      accessPinLength: Number(form.accessPinLength),
      supportUrgentSlaHours: Number(form.supportUrgentSlaHours),
      supportAutoCloseWorkingDays: Number(form.supportAutoCloseWorkingDays),
    };
    setSaving(true);
    try {
      const saved = await publishPolicy(payload);
      setMessage(`Đã ban hành phiên bản ${saved.versionNo ?? ''}. Bản ghi cũ không bị đổi.`);
      setForm((current) => ({ ...current, confirmed: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không ban hành được chính sách');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-slate-500">Đang tải chính sách đang hiệu lực...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ban hành chính sách thuê</h1>
          <p className="text-sm text-slate-500">
            Phiên bản mới chỉ áp dụng cho đơn tạo sau ngày hiệu lực. Hợp đồng đã ký giữ snapshot cũ.
          </p>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Ngày hiệu lực" type="date" value={form.effectiveDate} onChange={set('effectiveDate')} />
        <Field label="Hệ số cọc (lớn hơn 0)" value={form.depositMultiplier} step="0.1" onChange={set('depositMultiplier')} />
        <Field label="Giờ giữ chỗ" value={form.reservationHoldHours} onChange={set('reservationHoldHours')} />
        <Field label="Ngày ân hạn nhận kho" value={form.checkinGraceDays} onChange={set('checkinGraceDays')} />
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-900">Gia hạn</h2>
        <Field label="Mốc nhắc, cách nhau bởi dấu phẩy" type="text" value={form.renewalReminderDays} onChange={set('renewalReminderDays')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tháng tối thiểu" value={form.renewalMinMonths} onChange={set('renewalMinMonths')} />
          <Field label="Tháng tối đa" value={form.renewalMaxMonths} onChange={set('renewalMaxMonths')} />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-900">Hủy và trả kho</h2>
        <p className="text-xs text-slate-500">Cơ sở hủy thì hoàn 100%. Không có ô tỷ lệ phạt cho trường hợp này.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Giờ hủy được hoàn 100%" value={form.cancelFullRefundHours} onChange={set('cancelFullRefundHours')} />
          <Field label="Tỷ lệ hoàn khi hủy muộn (0–1)" value={form.cancelLateRefundRate} step="0.01" onChange={set('cancelLateRefundRate')} />
          <Field label="Tỷ lệ hoàn no-show (0–1)" value={form.cancelNoShowRefundRate} step="0.01" onChange={set('cancelNoShowRefundRate')} />
          <Field label="Ngày báo trả" value={form.returnNoticeDays} onChange={set('returnNoticeDays')} />
          <Field label="Ngày làm việc hoàn cọc" value={form.returnRefundWorkingDays} onChange={set('returnRefundWorkingDays')} />
          <Field label="Tỷ lệ hoàn khi trả sớm (0–1)" value={form.returnEarlyRefundRate} step="0.01" onChange={set('returnEarlyRefundRate')} />
        </div>
        <p className="text-xs text-slate-500">Quyết toán trả kho = cọc trừ hư hại, phí quá hạn và phụ phí chưa trả. Công thức này không tắt được.</p>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-900">Quá hạn</h2>
        <p className="text-xs text-slate-500">Thứ tự bắt buộc: ân hạn, rồi bắt đầu tính phí, rồi khóa truy cập, rồi chấm dứt. Khách quá hạn không đặt chỗ mới.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Ân hạn (ngày)" value={form.overdueGraceDays} onChange={set('overdueGraceDays')} />
          <Field label="Bắt đầu tính phí (ngày)" value={form.overdueNoticeDays} onChange={set('overdueNoticeDays')} />
          <Field label="Khóa truy cập (ngày)" value={form.overdueLockAccessDays} onChange={set('overdueLockAccessDays')} />
          <Field label="Chấm dứt (ngày)" value={form.overdueTerminationDays} onChange={set('overdueTerminationDays')} />
          <Field label="Phí mỗi ngày (0–1)" value={form.overdueDailyRate} step="0.01" onChange={set('overdueDailyRate')} />
          <Field label="Trần phí (0–1)" value={form.overdueCapRate} step="0.01" onChange={set('overdueCapRate')} />
        </div>
      </section>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.confirmed}
          onChange={(event) => setForm((current) => ({ ...current, confirmed: event.target.checked }))}
        />
        Tôi xác nhận ban hành phiên bản mới
      </label>

      {error && <p className="text-sm text-rose-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
      >
        {saving ? 'Đang ban hành...' : 'Ban hành chính sách'}
      </button>
    </form>
  );
};

// frontend/src/features/bom/components/PolicySummaryCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { PolicyVersionListItem } from '@/api/pricing';
import type { ActivePolicyInfo } from '@/types';

interface PolicySummaryCardProps {
  policy: ActivePolicyInfo | null;
  scheduledPolicy?: { version: string; effectiveDate: string } | null;
  versions?: PolicyVersionListItem[];
  isLoading?: boolean;
}

function statusClass(status: string): string {
  if (status === 'Đang hiệu lực') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Chưa áp dụng') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function formatDay(value: string): string {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value || '—';
  return `${day}/${month}/${year}`;
}

export const PolicySummaryCard: React.FC<PolicySummaryCardProps> = ({
  policy,
  scheduledPolicy = null,
  versions = [],
  isLoading = false,
}) => {
  if (isLoading || !policy) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
        <p className="text-sm text-slate-500">Đang tải thông số chính sách hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-base">
                Chính sách vận hành hệ thống — Phiên bản {policy.version}
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Đang hiệu lực
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ngày bắt đầu áp dụng: <span className="font-medium text-slate-700">{policy.effectiveDate ? formatDay(policy.effectiveDate) : '—'}</span> (BM-02 / BM-03)
            </p>
            {scheduledPolicy && (
              <p className="text-xs text-amber-700 mt-1">
                Phiên bản {scheduledPolicy.version} chưa áp dụng, bắt đầu từ {formatDay(scheduledPolicy.effectiveDate)}.
              </p>
            )}
          </div>
        </div>
        <Link to="/bom/policies" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">
          Ban hành phiên bản mới
        </Link>
      </div>

      {/* Grid of Policy Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tiền cọc */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-amber-600">
            <ShieldCheck className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900">Quy định tiền cọc (Deposit)</h4>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {policy.depositMultiplier} × tháng tiền thuê
          </p>
          <p className="text-xs text-slate-500">
            Khách hàng đặt cọc bằng {policy.depositMultiplier} tháng tiền thuê khi đặt chỗ và nhận kho bàn giao.
          </p>
        </div>

        {/* Giữ chỗ & Check-in */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-blue-600">
            <Clock className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900">Thời hạn giữ chỗ & Check-in</h4>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-blue-600">
              {policy.reservationHoldHours} giờ
            </span>
            <span className="text-xs text-slate-500 font-medium">
              (Ân hạn check-in: +{policy.checkinGraceDays} ngày)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Tạm giữ chỗ ô kho {policy.reservationHoldHours} giờ để hoàn tất thanh toán, ân hạn {policy.checkinGraceDays} ngày tiếp đón trước khi chuyển No-Show.
          </p>
        </div>

        {/* Xử lý Quá hạn (Overdue) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900">Phí quá hạn hợp đồng</h4>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-600">
              {Math.round(policy.overdueDailyRate * 100)}%/ngày
            </span>
            <span className="text-xs text-slate-500 font-medium">
              (Trần: {Math.round(policy.overdueCapRate * 100)}%)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Ân hạn {policy.overdueGraceDays} ngày. Từ ngày thứ {policy.overdueGraceDays + 1} quá hạn tính phạt {Math.round(policy.overdueDailyRate * 100)}%/ngày, trần tối đa {Math.round(policy.overdueCapRate * 100)}% tiền cọc.
          </p>
        </div>

        {/* Hủy đặt chỗ (Cancellation) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-purple-600">
            <RefreshCw className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900">Chính sách hủy đặt chỗ</h4>
          </div>
          <p className="text-2xl font-black text-purple-600">
            Hoàn 100% / {Math.round(policy.cancelLateRefundRate * 100)}%
          </p>
          <p className="text-xs text-slate-500">
            Hủy trước {policy.cancelFullRefundHours}h hoàn tiền 100%. Hủy sau {policy.cancelFullRefundHours}h hoàn {Math.round(policy.cancelLateRefundRate * 100)}% tổng số tiền đã nộp.
          </p>
        </div>

        {/* Thời hạn khóa quyền gia hạn (Renewal Cutoff) — BR-REN-02 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600">
            <RefreshCw className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900">
              Thời hạn khóa quyền gia hạn (Renewal Cutoff)
            </h4>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            Trước {policy.returnNoticeDays} ngày
          </p>
          <p className="text-xs text-slate-500">
            Khách hàng chỉ được phép gia hạn khi thời hạn hợp đồng còn từ {policy.returnNoticeDays} ngày trở
            lên. Khi còn dưới {policy.returnNoticeDays} ngày hoặc quá hạn, tính năng gia hạn sẽ tự động bị
            khóa, khách buộc phải ký hợp đồng mới nếu muốn tiếp tục thuê ô kho.
          </p>
        </div>

        {/* Quy định trả kho (Return) — BR-RET-06: linh hoạt, không bắt báo trước */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-teal-600">
            <ShieldCheck className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900">Quy định trả kho</h4>
          </div>
          <p className="text-2xl font-black text-teal-600">Linh hoạt 24/7</p>
          <p className="text-xs text-slate-500">
            Khách có thể tạo yêu cầu trả kho bất cứ lúc nào khi hợp đồng đang hoạt động; hoàn tất đối soát
            và hoàn cọc trong {policy.returnRefundWorkingDays ?? 7} ngày làm việc sau khi nghiệm thu kho.
          </p>
        </div>

        {/* Kỳ hạn gia hạn */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-slate-700">
            <Clock className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-sm text-slate-900">Giới hạn thời gian gia hạn</h4>
          </div>
          <p className="text-2xl font-black text-slate-800">
            {policy.renewalMinMonths} — {policy.renewalMaxMonths} tháng
          </p>
          <p className="text-xs text-slate-500">
            Cho phép gia hạn tối thiểu {policy.renewalMinMonths} tháng và tối đa {policy.renewalMaxMonths} tháng cho mỗi lần gia hạn.
          </p>
        </div>
      </div>

      {versions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-900">Các phiên bản đã ban hành</h4>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Phiên bản</th>
                <th className="px-5 py-3 font-semibold">Ngày hiệu lực</th>
                <th className="px-5 py-3 font-semibold">Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((item) => (
                <tr key={`${item.id}-${item.versionNo}`} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-slate-900">v{item.versionNo}</td>
                  <td className="px-5 py-3 text-slate-700">{formatDay(item.effectiveDate)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Note footer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-3 text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p>
          Các tham số chính sách được đọc trực tiếp từ bảng CSDL hệ thống và tự động gắn vào snapshot khi
          hợp đồng hoặc đơn đặt chỗ được khởi tạo. Khi ban hành chính sách mới, hợp đồng cũ vẫn giữ nguyên các mốc thời gian và cách tính theo snapshot ban đầu.
        </p>
      </div>
    </div>
  );
};

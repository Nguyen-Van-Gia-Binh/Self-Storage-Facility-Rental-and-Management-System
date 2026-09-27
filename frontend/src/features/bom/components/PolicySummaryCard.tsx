// frontend/src/features/bom/components/PolicySummaryCard.tsx
import React from 'react';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { ActivePolicyInfo } from '@/types';

interface PolicySummaryCardProps {
  policy: ActivePolicyInfo | null;
  isLoading?: boolean;
}

export const PolicySummaryCard: React.FC<PolicySummaryCardProps> = ({
  policy,
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
              Ngày bắt đầu áp dụng: <span className="font-medium text-slate-700">{policy.effectiveDate}</span> (BM-02 / BM-03)
            </p>
          </div>
        </div>
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
            Khách hàng đặt cọc đúng bằng 01 tháng tiền thuê khi đặt chỗ và nhận kho bàn giao.
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
            Tạm giữ chỗ ô kho 48h để hoàn tất thanh toán, ân hạn 3 ngày tiếp đón trước khi chuyển No-Show.
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
            Ân hạn {policy.overdueGraceDays} ngày. Từ ngày thứ 4 quá hạn tính phạt 10%/ngày, trần tối đa 70% tiền cọc.
          </p>
        </div>

        {/* Hủy đặt chỗ (Cancellation) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-purple-600">
            <RefreshCw className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900">Chính sách hủy đặt chỗ</h4>
          </div>
          <p className="text-2xl font-black text-purple-600">
            Hoàn 100% / 50%
          </p>
          <p className="text-xs text-slate-500">
            Hủy trước {policy.cancelFullRefundHours}h hoàn tiền 100%. Hủy sau {policy.cancelFullRefundHours}h hoàn {Math.round(policy.cancelLateRefundRate * 100)}% tổng số tiền đã nộp.
          </p>
        </div>

        {/* Trả kho (Return) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
            <h4 className="font-bold text-sm text-slate-900">Quy định trả kho</h4>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            Báo trước {policy.returnNoticeDays} ngày
          </p>
          <p className="text-xs text-slate-500">
            Khách hàng đăng ký trả kho trước ít nhất {policy.returnNoticeDays} ngày làm việc để đối soát hoàn cọc.
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

// frontend/src/features/bom/components/PolicySummaryCard.tsx
import React from 'react';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Info,
  Settings2,
  Eye,
  AlertCircle,
} from 'lucide-react';
import type { PolicyVersionListItem } from '@/api/pricing';
import type { ActivePolicyInfo } from '@/types';

interface PolicySummaryCardProps {
  policy: ActivePolicyInfo | null;
  scheduledPolicy?: { version: string; effectiveDate: string } | null;
  versions?: PolicyVersionListItem[];
  isLoading?: boolean;
  onOpenPublishDrawer?: () => void;
  onViewVersion?: (version: PolicyVersionListItem) => void;
}

function statusClass(status: string): string {
  if (status === 'Đang hiệu lực') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Chưa áp dụng') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function formatDay(value: string): string {
  if (!value) return '—';
  const parts = value.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return value;
}

export const PolicySummaryCard: React.FC<PolicySummaryCardProps> = ({
  policy,
  scheduledPolicy = null,
  versions = [],
  isLoading = false,
  onOpenPublishDrawer,
  onViewVersion,
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
      {/* Header Info & Action */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-base">
                Chính sách vận hành hệ thống — Phiên bản v{policy.version}
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Đang hiệu lực
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ngày bắt đầu áp dụng: <span className="font-medium text-slate-700">{policy.effectiveDate ? formatDay(policy.effectiveDate) : '—'}</span>
            </p>
            {scheduledPolicy && (
              <p className="text-xs text-amber-700 mt-1 font-medium">
                Phiên bản {scheduledPolicy.version} chưa áp dụng, bắt đầu từ {formatDay(scheduledPolicy.effectiveDate)}.
              </p>
            )}
          </div>
        </div>

        {onOpenPublishDrawer && (
          <button
            type="button"
            onClick={onOpenPublishDrawer}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer shrink-0"
          >
            <Settings2 className="w-4 h-4" />
            <span>Cập nhật chính sách</span>
          </button>
        )}
      </div>

      {/* Alert Banner Pháp lý */}
      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start space-x-3 text-xs text-amber-950 leading-relaxed shadow-2xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Lưu ý:</strong> Thay đổi chính sách chỉ áp dụng cho đơn đặt chỗ và hợp đồng tạo mới sau ngày hiệu lực. Hợp đồng đã ký giữ nguyên snapshot thông số theo phiên bản ban đầu nhằm đảm bảo tính toàn vẹn pháp lý.
        </p>
      </div>

      {/* =========================================================================
          CỤM 1: TÀI CHÍNH & TIỀN CỌC (Finance & Deposit)
         ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Nhóm 1: Tài chính & Tiền cọc
            </h4>
            <p className="text-xs text-slate-500">Quy định mức đặt cọc khi nhận kho và chính sách hoàn tiền khi hủy chỗ.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Quy định tiền cọc */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-amber-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-700">
                <ShieldCheck className="w-4 h-4" />
                <h5 className="font-bold text-xs uppercase tracking-wider">Quy định tiền cọc</h5>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                Bắt buộc
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {policy.depositMultiplier}
              </span>
              <span className="text-base font-bold text-slate-600">tháng</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bằng {policy.depositMultiplier} tháng tiền thuê khi khách hàng đặt chỗ và nhận kho bàn giao.
            </p>
          </div>

          {/* Card: Chính sách hủy đặt chỗ */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-700">
                <RefreshCw className="w-4 h-4" />
                <h5 className="font-bold text-xs uppercase tracking-wider">Chính sách hủy đặt chỗ</h5>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                Linh hoạt
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Hoàn 100% / {Math.round(policy.cancelLateRefundRate * 100)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hủy trước {policy.cancelFullRefundHours}h hoàn tiền 100%. Hủy sau {policy.cancelFullRefundHours}h hoàn {Math.round(policy.cancelLateRefundRate * 100)}% tổng số tiền đã nộp.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CỤM 2: THỜI GIAN & GIA HẠN (Time Constraints & Extensions)
         ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Nhóm 2: Thời gian & Gia hạn
          </h4>
          <p className="text-xs text-slate-500">Thời hạn tạm giữ ô kho và các mốc quy định gia hạn hợp đồng thuê.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Thời hạn giữ chỗ & Bàn giao */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-indigo-200 transition-colors">
            <div className="flex items-center space-x-2 text-indigo-700">
              <Clock className="w-4 h-4" />
              <h5 className="font-bold text-xs uppercase tracking-wider">Giữ chỗ & Bàn giao</h5>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {policy.reservationHoldHours}
              </span>
              <span className="text-base font-bold text-slate-600">giờ</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tạm giữ chỗ {policy.reservationHoldHours} giờ để hoàn tất cọc; ân hạn thêm {policy.checkinGraceDays} ngày tiếp đón trước khi hủy do vắng mặt.
            </p>
          </div>

          {/* Card: Thời hạn khóa quyền gia hạn */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-indigo-200 transition-colors">
            <div className="flex items-center space-x-2 text-emerald-700">
              <RefreshCw className="w-4 h-4" />
              <h5 className="font-bold text-xs uppercase tracking-wider">Khóa quyền gia hạn</h5>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Trước</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {policy.returnNoticeDays}
              </span>
              <span className="text-base font-bold text-slate-600">ngày</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tự động khóa tính năng gia hạn khi hợp đồng còn dưới {policy.returnNoticeDays} ngày. Khách buộc phải ký hợp đồng mới nếu muốn tiếp tục.
            </p>
          </div>

          {/* Card: Giới hạn thời gian gia hạn */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center space-x-2 text-slate-700">
              <Clock className="w-4 h-4 text-amber-500" />
              <h5 className="font-bold text-xs uppercase tracking-wider">Kỳ hạn gia hạn</h5>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {policy.renewalMinMonths} — {policy.renewalMaxMonths}
              </span>
              <span className="text-base font-bold text-slate-600">tháng</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kỳ hạn tối thiểu {policy.renewalMinMonths} tháng và tối đa {policy.renewalMaxMonths} tháng cho mỗi lần gia hạn hợp đồng.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CỤM 3: RỦI RO & KẾT THÚC (Risks & Exit)
         ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Nhóm 3: Rủi ro & Kết thúc
          </h4>
          <p className="text-xs text-slate-500">Quy định xử lý hợp đồng quá hạn và nghiệm thu quyết toán khi trả kho.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Phí quá hạn hợp đồng */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-rose-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
                <h5 className="font-bold text-xs uppercase tracking-wider">Phí quá hạn hợp đồng</h5>
              </div>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                Trần: {Math.round(policy.overdueCapRate * 100)}% cọc
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-rose-600 tracking-tight">
                {Math.round(policy.overdueDailyRate * 100)}%
              </span>
              <span className="text-base font-bold text-slate-600">/ ngày</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ân hạn {policy.overdueGraceDays} ngày. Từ ngày thứ {policy.overdueGraceDays + 1} quá hạn tính phạt {Math.round(policy.overdueDailyRate * 100)}%/ngày, trần tối đa {Math.round(policy.overdueCapRate * 100)}% tiền cọc.
            </p>
          </div>

          {/* Card: Quy định trả kho */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-teal-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-teal-700">
                <ShieldCheck className="w-4 h-4" />
                <h5 className="font-bold text-xs uppercase tracking-wider">Quy định trả kho</h5>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                Nghiệm thu
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                Linh hoạt 24/7
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Khách có thể yêu cầu trả kho bất cứ lúc nào; đối soát và hoàn cọc trong {policy.returnRefundWorkingDays ?? 7} ngày làm việc sau khi nghiệm thu kho.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LỊCH SỬ PHIÊN BẢN (Version History Table)
         ========================================================================= */}
      {versions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Lịch sử các phiên bản đã ban hành</h4>
              <p className="text-xs text-slate-500 mt-0.5">Truy vết snapshot các thông số chính sách qua từng giai đoạn</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {versions.length} phiên bản
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">Phiên bản</th>
                <th className="px-5 py-3 font-semibold">Ngày hiệu lực</th>
                <th className="px-5 py-3 font-semibold">Người ban hành</th>
                <th className="px-5 py-3 font-semibold">Tình trạng</th>
                <th className="px-5 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((item) => (
                <tr key={`${item.id}-${item.versionNo}`} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-bold text-slate-900 font-mono">v{item.versionNo}</td>
                  <td className="px-5 py-3 text-slate-700">{formatDay(item.effectiveDate)}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {item.publishedBy ? `BOM #${item.publishedBy}` : 'Hệ thống'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {onViewVersion && (
                      <button
                        type="button"
                        onClick={() => onViewVersion(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Note footer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-3 text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          Các tham số chính sách được đọc trực tiếp từ cơ sở dữ liệu hệ thống. Khi phiên bản mới có hiệu lực, hệ thống sẽ tự động sử dụng cấu hình mới cho tất cả các giao dịch và hợp đồng tạo mới.
        </p>
      </div>
    </div>
  );
};

// frontend/src/features/bom/components/PolicySummaryCard.tsx
import React from 'react';
import {
  ShieldCheck,
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
                Chính sách vận hành hệ thống — Phiên bản {policy.version}
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
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <Settings2 className="w-4 h-4" />
            <span>Cập nhật chính sách</span>
          </button>
        )}
      </div>

      {/* Alert Banner Pháp lý */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-3 text-xs text-slate-600 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
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

        <div className="bg-white rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-5 space-y-2">
            <h5 className="font-medium text-xs text-slate-500">Quy định tiền cọc</h5>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">
                {policy.depositMultiplier}
              </span>
              <span className="text-sm text-slate-600">tháng</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bằng {policy.depositMultiplier} tháng tiền thuê khi khách hàng đặt chỗ và nhận kho bàn giao.
            </p>
          </div>

          <div className="p-5 space-y-2">
            <h5 className="font-medium text-xs text-slate-500">Chính sách hủy đặt chỗ</h5>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-slate-900 tracking-tight">
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

        <div className="bg-white rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-5 space-y-2">
            <h5 className="font-medium text-xs text-slate-500">Giữ chỗ & Bàn giao</h5>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">
                {policy.reservationHoldHours}
              </span>
              <span className="text-sm text-slate-600">giờ</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tạm giữ chỗ {policy.reservationHoldHours} giờ để hoàn tất cọc; ân hạn thêm {policy.checkinGraceDays} ngày tiếp đón trước khi hủy do vắng mặt.
            </p>
          </div>

          <div className="p-5 space-y-2">
            <h5 className="font-medium text-xs text-slate-500">Khóa quyền gia hạn</h5>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-slate-500">Trước</span>
              <span className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">
                {policy.returnNoticeDays}
              </span>
              <span className="text-sm text-slate-600">ngày</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tự động khóa tính năng gia hạn khi hợp đồng còn dưới {policy.returnNoticeDays} ngày. Khách buộc phải ký hợp đồng mới nếu muốn tiếp tục.
            </p>
          </div>

          <div className="p-5 space-y-2">
            <h5 className="font-medium text-xs text-slate-500">Kỳ hạn gia hạn</h5>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">
                {policy.renewalMinMonths} — {policy.renewalMaxMonths}
              </span>
              <span className="text-sm text-slate-600">tháng</span>
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

        <div className="bg-white rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-5 space-y-2">
            <h5 className="font-medium text-xs text-slate-500">Phí quá hạn hợp đồng</h5>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">
                {Math.round(policy.overdueDailyRate * 100)}%
              </span>
              <span className="text-sm text-slate-600">/ ngày</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ân hạn {policy.overdueGraceDays} ngày. Từ ngày thứ {policy.overdueGraceDays + 1} quá hạn tính phạt {Math.round(policy.overdueDailyRate * 100)}%/ngày, trần tối đa {Math.round(policy.overdueCapRate * 100)}% tiền cọc.
            </p>
          </div>

          <div className="p-5 space-y-2">
            <h5 className="font-medium text-xs text-slate-500">Quy định trả kho</h5>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-slate-900 tracking-tight">
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
              <tr className="whitespace-nowrap">
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
                  <td className="px-5 py-3 font-bold text-slate-900 font-mono whitespace-nowrap">v{item.versionNo}</td>
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap tabular-nums">{formatDay(item.effectiveDate)}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs whitespace-nowrap">
                    {item.publishedBy ? `BOM #${item.publishedBy}` : 'Hệ thống'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {onViewVersion && (
                      <button
                        type="button"
                        onClick={() => onViewVersion(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
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

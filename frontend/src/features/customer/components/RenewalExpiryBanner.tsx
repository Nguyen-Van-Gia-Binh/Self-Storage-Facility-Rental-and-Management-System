import React from 'react';
import { 
  AlertCircle, 
  PhoneCall, 
  PlusCircle, 
  Ban, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RentedContract } from '../types';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { formatVND } from '../utils/pricing';

interface RenewalExpiryBannerProps {
  contract: RentedContract;
  onContactSupport?: () => void;
}

export const RenewalExpiryBanner: React.FC<RenewalExpiryBannerProps> = ({
  contract,
}) => {
  const daysRemaining = calculateDaysRemaining(contract.endDate);
  const overdueDays =
    contract.overdueDays !== undefined && contract.overdueDays > 0
      ? contract.overdueDays
      : Math.abs(daysRemaining) || 0;
  const isGracePeriod = contract.status === 'OVERDUE' && overdueDays <= 3;
  const isTerminated = contract.status === 'TERMINATED' || contract.status === 'CLOSED';
  const hasUnpaidOverdue = contract.status === 'OVERDUE' && (contract.overdueFee ?? 0) > 0;
  const isOverdueCleared = contract.status === 'OVERDUE' && !isGracePeriod && (contract.overdueFee ?? 0) === 0;

  // Trường hợp đang chờ trả kho: Không được gia hạn trực tuyến (BR-RET-12)
  if (contract.status === 'PENDING_RETURN') {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider">
                Chờ trả kho — Không thể gia hạn
              </span>
            </div>
            <h3 className="text-base font-bold text-amber-950">
              Hợp đồng đang chờ nhân viên nghiệm thu trả kho
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Quý khách đã gửi yêu cầu trả kho cho ô kho này. Nếu đổi ý muốn tiếp tục gia hạn thuê kho, quý khách vui lòng quay lại trang <strong>Quản lý kho của tôi</strong> và nhấn nút <strong>"Hủy yêu cầu trả kho"</strong> trước khi nhân viên cơ sở nghiệm thu.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                to="/customer/my-units"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Quay lại Quản lý kho</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. Trường hợp từ chối gia hạn theo BR-REN-02 (Đã thanh lý hoặc chấm dứt)
  if (isTerminated) {
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-700 flex-shrink-0 mt-0.5">
            <Ban className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase tracking-wider">
                Từ chối gia hạn
              </span>
            </div>
            <h3 className="text-base font-bold text-rose-950">
              Hợp đồng này đã chấm dứt hiệu lực hoặc hoàn tất thanh lý
            </h3>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              Theo quy định, các hợp đồng ở trạng thái <em>Đã thanh lý (TERMINATED)</em> hoặc <em>Đã đóng (CLOSED)</em> không được phép gia hạn trực tuyến. Quý khách vui lòng liên hệ nhân viên quản lý cơ sở để được hỗ trợ hoặc tạo đơn đặt thuê ô kho mới.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a
                href="tel:1900888999"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Hotline: 1900 888 999</span>
              </a>
              <Link
                to="/customer/units"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-100/60 text-rose-900 text-xs font-bold transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Thuê ô kho mới</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Trường hợp quá hạn còn nợ phạt: Cần nộp phạt trước khi gia hạn (BR-REN-06)
  if (hasUnpaidOverdue) {
    const overdueCount = contract.overdueDays || Math.abs(daysRemaining) || 1;
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-700 flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase tracking-wider">
                Quá hạn {overdueCount} ngày — Còn nợ phạt {formatVND(contract.overdueFee || 0)}
              </span>
              <span className="text-xs font-semibold text-rose-700">
                Hết hạn từ {contract.endDate}
              </span>
            </div>
            <h3 className="text-base font-bold text-rose-950">
              Vui lòng thanh toán phí quá hạn trước khi gia hạn
            </h3>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              Theo quy định <strong>BR-REN-06</strong>, hợp đồng quá hạn cần thanh toán toàn bộ nợ phạt phát sinh trước khi có thể gia hạn trực tuyến. Sau khi nộp phạt, quý khách có thể tiếp tục gia hạn nếu ô kho chưa có người khác đặt trước.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                to={`/customer/payment?unitNumber=${contract.unitNumber}&facilityName=${encodeURIComponent(
                  contract.facilityName
                )}&amount=${contract.overdueFee || contract.monthlyRent}&contractId=${contract.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Thanh toán phí phạt quá hạn</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2b. Trường hợp trong ân hạn 3 ngày (D+1..D+3) (BR-OVD-01 & BR-OVD-02)
  if (isGracePeriod) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider">
                Thời gian ân hạn D+{overdueDays} (Miễn phí phạt)
              </span>
              <span className="text-xs font-semibold text-amber-800">
                Hết hạn: {contract.endDate}
              </span>
            </div>
            <h3 className="text-base font-bold text-amber-950">
              Hợp đồng đang trong thời gian ân hạn {overdueDays}/3 ngày
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Quý khách đang trong 3 ngày ân hạn đầu tiên và chưa bị tính phí phạt. Bạn có thể chọn kỳ hạn bên dưới để tiếp tục gia hạn ô kho <strong>{contract.unitNumber}</strong>, hoặc dọn đồ và báo trả kho trước 00:00 ngày D+4 để nhận lại 100% tiền cọc.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Trường hợp quá hạn đã nộp hết phạt (BR-REN-06): Cho phép gia hạn!
  if (isOverdueCleared) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase tracking-wider">
                Đã tất toán phạt — Đủ điều kiện gia hạn
              </span>
            </div>
            <h3 className="text-base font-bold text-emerald-950">
              Nợ phạt đã được thanh toán đầy đủ
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
              Quý khách đã tất toán nợ phạt quá hạn thành công. Bạn có thể chọn kỳ hạn gia hạn bên dưới để tiếp tục sử dụng ô kho <strong>{contract.unitNumber}</strong> cho chu kỳ tiếp theo (nếu chưa có khách đặt trước).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Trường hợp sắp hết hạn (<= 30 ngày): Nhắc nhở chủ động (BR-REN-01 & BR-REN-02 mới)
  if (daysRemaining <= 30) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider">
                Nhắc nhở gia hạn (Còn {daysRemaining} ngày)
              </span>
              <span className="text-xs font-semibold text-amber-800">
                Hết hạn: {contract.endDate}
              </span>
            </div>
            <h3 className="text-base font-bold text-amber-950">
              Hãy gia hạn sớm để giữ vị trí ô kho {contract.unitNumber}!
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Hợp đồng sắp kết thúc. Quý khách vui lòng hoàn tất gia hạn sớm để giữ ô kho trước khi khách hàng khác có thể đặt giữ chỗ cho chu kỳ tiếp theo. Kỳ hạn mới sẽ nối tiếp trực tiếp sau ngày {contract.endDate}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Còn dài (> 30 ngày): Hiệu lực an toàn — Ẩn banner để giao diện tinh gọn, tập trung vào form gia hạn
  return null;
};

import React from 'react';
import { 
  AlertCircle, 
  ShieldCheck, 
  PhoneCall, 
  PlusCircle,
  Ban
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RentedContract } from '../types';
import { calculateDaysRemaining } from '../utils/renewalPricing';

interface RenewalExpiryBannerProps {
  contract: RentedContract;
  onContactSupport?: () => void;
}

export const RenewalExpiryBanner: React.FC<RenewalExpiryBannerProps> = ({
  contract,
}) => {
  const daysRemaining = calculateDaysRemaining(contract.endDate);
  const isTerminated = contract.status === 'TERMINATED' || contract.status === 'CLOSED';
  const isOverdue = contract.status === 'OVERDUE' || daysRemaining < 0;
  const isCutoffLocked = contract.status === 'ACTIVE' && daysRemaining < 30;

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
                to="/booking/picker"
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

  // 2. Trường hợp quá hạn theo BR-REN-02: Không thể gia hạn trực tuyến
  if (isOverdue) {
    const overdueCount = contract.overdueDays || Math.abs(daysRemaining) || 1;
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-700 flex-shrink-0 mt-0.5">
            <Ban className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase tracking-wider">
                Quá hạn {overdueCount} ngày — Không thể gia hạn
              </span>
              <span className="text-xs font-semibold text-rose-700">
                Hết hạn từ ngày {contract.endDate}
              </span>
            </div>
            <h3 className="text-base font-bold text-rose-950">
              Hợp đồng đã quá hạn và bị khóa tính năng gia hạn
            </h3>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              Theo quy định, hợp đồng ở trạng thái quá hạn không thể tiếp tục gia hạn trực tuyến. Quý khách vui lòng thanh toán phí quá hạn, hoàn tất trả kho hoặc đăng ký hợp đồng thuê mới nếu có nhu cầu tiếp tục sử dụng ô kho (tùy thuộc vào tình trạng còn trống của ô kho).
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                to={`/customer/payment?unitNumber=${contract.unitNumber}&facilityName=${encodeURIComponent(
                  contract.facilityName
                )}&amount=${contract.monthlyRent}&contractId=${contract.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Thanh toán phí phạt quá hạn</span>
              </Link>
              <Link
                to="/booking/picker"
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

  // 3. Trường hợp dưới 30 ngày (BR-REN-01 & BR-REN-02): Khóa quyền tự gia hạn
  if (isCutoffLocked) {
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-700 flex-shrink-0 mt-0.5">
            <Ban className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase tracking-wider">
                Đã khóa quyền gia hạn (&lt; 30 ngày)
              </span>
              <span className="text-xs font-semibold text-rose-700">
                Còn {daysRemaining} ngày (Hết hạn {contract.endDate})
              </span>
            </div>
            <h3 className="text-base font-bold text-rose-950">
              Đã quá hạn chót gia hạn trực tuyến (Ít nhất 30 ngày trước ngày hết hạn)
            </h3>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              Theo quy định, khách hàng bắt buộc phải hoàn tất gia hạn trước ngày kết thúc hợp đồng ít nhất <strong>30 ngày</strong>. Hợp đồng của quý khách hiện chỉ còn <strong>{daysRemaining} ngày</strong> (đã dưới mốc 30 ngày) nên hệ thống đã khóa quyền gia hạn trực tuyến để chuẩn bị kế hoạch hoàn trả hoặc mở chỗ cho khách hàng tiếp theo. Nếu quý khách có nhu cầu tiếp tục sử dụng, vui lòng đăng ký một hợp đồng thuê mới hoặc liên hệ ban quản lý.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a
                href="tel:1900888999"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Hotline hỗ trợ: 1900 888 999</span>
              </a>
              <Link
                to="/booking/picker"
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

  // 4. Trường hợp trong vùng cảnh báo sớm (30..37 ngày): 7 ngày trước mốc khóa 30 ngày
  if (daysRemaining <= 37) {
    const daysUntilCutoff = daysRemaining - 30;
    return (
      <div className="rounded-xl border border-amber-400 bg-amber-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider">
                Sắp đến hạn chót gia hạn (Còn {daysUntilCutoff} ngày nữa để gia hạn)
              </span>
              <span className="text-xs font-semibold text-amber-800">
                Hết hạn hợp đồng: {contract.endDate}
              </span>
            </div>
            <h3 className="text-base font-bold text-amber-950">
              Gia hạn ngay để không bị khóa và mất vị trí ô kho ({daysUntilCutoff === 0 ? 'Hôm nay là ngày cuối cùng gia hạn' : `Còn ${daysUntilCutoff} ngày`})!
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Theo quy định, quý khách cần gia hạn trước mốc 30 ngày. Khi chỉ còn dưới 30 ngày, tính năng gia hạn sẽ tự động bị khóa và ô kho có thể được phân bổ cho khách hàng khác sau ngày {contract.endDate}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Còn dài (> 37 ngày)
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase tracking-wider">
              Hiệu lực an toàn (Còn {daysRemaining} ngày)
            </span>
          </div>
          <h3 className="text-base font-bold text-emerald-950">
            Hợp đồng đang có hiệu lực tốt đến ngày {contract.endDate}
          </h3>
          <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
            Bạn có thể đăng ký gia hạn thêm thời gian sử dụng bất kỳ lúc nào trước mốc 30 ngày. Kỳ hạn mới sẽ tự động cộng nối tiếp vào sau ngày hết hạn hiện tại.
          </p>
        </div>
      </div>
    </div>
  );
};

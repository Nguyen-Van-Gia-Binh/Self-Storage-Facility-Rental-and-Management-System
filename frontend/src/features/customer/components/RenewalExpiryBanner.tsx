import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Info, 
  PhoneCall, 
  PlusCircle,
  Ban
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RentedContract } from '../types';

interface RenewalExpiryBannerProps {
  contract: RentedContract;
  onContactSupport?: () => void;
}

export const RenewalExpiryBanner: React.FC<RenewalExpiryBannerProps> = ({
  contract,
}) => {
  // Tính số ngày còn lại đến ngày kết thúc hợp đồng
  const calculateDaysRemaining = (endDateStr: string): number => {
    try {
      const end = new Date(endDateStr);
      const now = new Date();
      end.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const daysRemaining = calculateDaysRemaining(contract.endDate);
  const isOverdue = contract.status === 'OVERDUE' || daysRemaining < 0;
  const isTerminated = contract.status === 'TERMINATED' || contract.status === 'CLOSED';

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
                Từ chối gia hạn (BR-REN-02)
              </span>
            </div>
            <h3 className="text-base font-bold text-rose-950">
              Hợp đồng này đã chấm dứt hiệu lực hoặc hoàn tất thanh lý
            </h3>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              Theo quy định <strong>BR-REN-02</strong>, các hợp đồng ở trạng thái <em>Đã thanh lý (TERMINATED)</em> hoặc <em>Đã đóng (CLOSED)</em> không được phép gia hạn trực tuyến. Quý khách vui lòng liên hệ nhân viên quản lý cơ sở để được hỗ trợ hoặc tạo đơn đặt thuê ô kho mới.
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
                <span>Thuê ngăn kho mới</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Trường hợp quá hạn theo BR-REN-06 (OVERDUE)
  if (isOverdue) {
    const overdueCount = contract.overdueDays || Math.abs(daysRemaining) || 1;
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-700 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase tracking-wider">
                Quá hạn {overdueCount} ngày (BR-OVD-02)
              </span>
              <span className="text-xs font-semibold text-rose-700">
                Hết hạn từ ngày {contract.endDate}
              </span>
            </div>
            <h3 className="text-base font-bold text-rose-950">
              Hợp đồng đang quá hạn — Gia hạn ngay để mở khóa mã PIN
            </h3>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              Ngăn kho của quý khách đã quá ngày đến hạn. Theo quy định <strong>BR-REN-06</strong>, quý khách hoàn toàn có thể gia hạn ngay bây giờ: các khoản nợ cũ và phí phạt chậm trả (nếu có) sẽ được hệ thống <strong>tự động gộp thành một dòng riêng</strong> vào hóa đơn gia hạn kỳ mới.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Trường hợp khẩn cấp: Còn <= 1 ngày
  if (daysRemaining <= 1) {
    return (
      <div className="rounded-xl border border-amber-400 bg-amber-50/90 p-4 sm:p-5 shadow-xs animate-pulse">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider">
                Báo động khẩn cấp (BR-REN-01)
              </span>
            </div>
            <h3 className="text-base font-bold text-amber-950">
              Hợp đồng sẽ hết hạn trong vòng {daysRemaining === 0 ? 'hôm nay' : '24 giờ'}!
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Vui lòng hoàn tất gia hạn trực tuyến trước <strong>23:59 ngày {contract.endDate}</strong> để tránh bị tạm khóa mã PIN mở cửa và không phát sinh phí phạt quá hạn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Trường hợp nghiêm trọng: Còn <= 3 ngày
  if (daysRemaining <= 3) {
    return (
      <div className="rounded-xl border border-orange-300 bg-orange-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-700 flex-shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-200 text-orange-900 uppercase tracking-wider">
                Sắp đến hạn (Còn {daysRemaining} ngày)
              </span>
            </div>
            <h3 className="text-base font-bold text-orange-950">
              Thời hạn thuê sắp kết thúc vào ngày {contract.endDate}
            </h3>
            <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">
              Gia hạn ngay để giữ nguyên quyền sử dụng liên tục, không cần cọc lại (BR-DEP-01) và bảo lưu mã PIN mở khóa an toàn (BR-REN-08).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Trường hợp cảnh báo chú ý: Còn <= 7 ngày
  if (daysRemaining <= 7) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider">
                Nhắc nhở gia hạn (Còn {daysRemaining} ngày)
              </span>
            </div>
            <h3 className="text-base font-bold text-amber-950">
              Hợp đồng của bạn sẽ hết hạn vào ngày {contract.endDate}
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Lựa chọn kỳ hạn từ 6 tháng trở lên để nhận ngay <strong>chiết khấu 5% - 10%</strong> theo chính sách ưu đãi gia hạn dài hạn (BR-REN-07).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 6. Trường hợp khuyến nghị: Còn <= 30 ngày
  if (daysRemaining <= 30) {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-sky-100 rounded-lg text-sky-700 flex-shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-200 text-sky-900 uppercase tracking-wider">
                Gợi ý gia hạn sớm (Còn {daysRemaining} ngày)
              </span>
            </div>
            <h3 className="text-base font-bold text-sky-950">
              Chủ động kéo dài hợp đồng đến sau ngày {contract.endDate}
            </h3>
            <p className="text-xs sm:text-sm text-sky-800 leading-relaxed">
              Khách hàng có thể gia hạn bất kỳ lúc nào khi hợp đồng đang có hiệu lực. Toàn bộ tiền cọc ban đầu được bảo lưu 100%, không phát sinh phụ phí (BR-DEP-01).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 7. Còn dài (> 30 ngày)
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
            Bạn có thể đăng ký gia hạn thêm thời gian sử dụng bất kỳ lúc nào. Kỳ hạn mới sẽ tự động cộng nối tiếp vào sau ngày hết hạn hiện tại.
          </p>
        </div>
      </div>
    </div>
  );
};

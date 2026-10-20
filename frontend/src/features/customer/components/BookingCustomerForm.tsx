import React from 'react';
import { User, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface BookingCustomerFormProps {
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  customerIdCard: string;
  setCustomerIdCard: (v: string) => void;
  agreeTerms: boolean;
  setAgreeTerms: (v: boolean) => void;
  formErrors: Record<string, string>;
  holdHours: number;
  depositMultiplierLabel: string;
  bookingError: string | null;
  isSubmitting: boolean;
  isCheckingAvailability: boolean;
  isButtonDisabled: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * BookingCustomerForm — Bước 2: Form nhập thông tin khách hàng & Chấp thuận điều khoản dịch vụ
 */
export const BookingCustomerForm: React.FC<BookingCustomerFormProps> = ({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  customerIdCard,
  setCustomerIdCard,
  agreeTerms,
  setAgreeTerms,
  formErrors,
  holdHours,
  depositMultiplierLabel,
  bookingError,
  isSubmitting,
  isCheckingAvailability,
  isButtonDisabled,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 1. THÔNG TIN KHÁCH HÀNG */}
      <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-brand-100">
          <User className="w-4 h-4 text-brand-600" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a1614]">
            1. Thông tin người thuê ô kho
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Họ và tên */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 bg-white border border-brand-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0a1614] focus:outline-none focus:border-brand-500 shadow-xs"
            />
            {formErrors.customerName && (
              <p className="text-[11px] text-rose-600 font-semibold">{formErrors.customerName}</p>
            )}
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Số điện thoại liên hệ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="0901234567"
              className="w-full px-3.5 py-2.5 bg-white border border-brand-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0a1614] focus:outline-none focus:border-brand-500 shadow-xs"
            />
            {formErrors.customerPhone && (
              <p className="text-[11px] text-rose-600 font-semibold">{formErrors.customerPhone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Email nhận mã PIN & Hợp đồng <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full px-3.5 py-2.5 bg-white border border-brand-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0a1614] focus:outline-none focus:border-brand-500 shadow-xs"
            />
            {formErrors.customerEmail && (
              <p className="text-[11px] text-rose-600 font-semibold">{formErrors.customerEmail}</p>
            )}
          </div>

          {/* Số CCCD / Hộ chiếu */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Số CCCD / Hộ chiếu (12 số) <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              value={customerIdCard}
              onChange={(e) => setCustomerIdCard(e.target.value)}
              placeholder="Nhập 12 số CCCD..."
              className="w-full px-3.5 py-2.5 bg-white border border-brand-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0a1614] focus:outline-none focus:border-brand-500 shadow-xs"
            />
            <p className="text-[10px] text-slate-500">Dùng đối chiếu khi nhận bàn giao kho tại cơ sở</p>
            {formErrors.customerIdCard && (
              <p className="text-[11px] text-rose-600 font-semibold">{formErrors.customerIdCard}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. ĐIỀU KHOẢN DỊCH VỤ & CHÍNH SÁCH */}
      <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a1614] pb-2 border-b border-brand-100">
          2. Điều khoản dịch vụ & Chính sách lưu trữ
        </h2>

        <div className="p-4 bg-brand-50/50 border border-brand-200/70 rounded-xl space-y-2 text-xs text-slate-600">
          <p>• <strong>Nhận bàn giao kho:</strong> Quý khách xuất trình CCCD trùng khớp khi đến cơ sở để nhận mã PIN điện tử (hoặc mã QR) và hướng dẫn mở kho.</p>
          <p>• <strong>Chính sách giữ chỗ:</strong> Đơn đặt cọc giữ chỗ có hiệu lực trong {holdHours} giờ. Hủy trước ngày bắt đầu được hoàn 100% tiền thuê.</p>
          <p>• <strong>Hoàn trả tiền cọc:</strong> Tiền cọc giữ kho ({depositMultiplierLabel} tháng) được hoàn trả 100% ngay khi thanh lý hợp đồng đúng hạn.</p>
        </div>

        <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
          />
          <span className="text-xs font-semibold text-[#0a1614]">
            Tôi đã đọc, hiểu rõ và đồng ý với Điều khoản sử dụng và Chính sách cọc của SmartStorage.
          </span>
        </label>
        {formErrors.agreeTerms && (
          <p className="text-[11px] text-rose-600 font-semibold">{formErrors.agreeTerms}</p>
        )}
      </div>

      {bookingError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
          {bookingError}
        </div>
      )}

      {/* NÚT TIẾP TỤC */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting || isCheckingAvailability || isButtonDisabled}
          className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all hover:scale-[1.01] flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tạo mã thanh toán VietQR...</span>
            </>
          ) : (
            <>
              <span>Tiếp tục: Thanh toán VietQR & Giữ chỗ 48h</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

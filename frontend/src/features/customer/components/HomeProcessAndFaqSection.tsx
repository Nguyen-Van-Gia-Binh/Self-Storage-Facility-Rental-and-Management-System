import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  CreditCard,
  KeyRound,
  ChevronDown,
  Headphones,
  Warehouse,
  Phone,
  ArrowRight,
} from 'lucide-react';
import type { ActivePolicyInfo } from '@/types';

interface HomeProcessAndFaqSectionProps {
  primaryFacilityId?: number | string;
  policy?: ActivePolicyInfo | null;
  onScrollToBranches: () => void;
}

/**
 * Quy trình 3 bước & Câu hỏi thường gặp rút gọn, lấy số liệu thực tế từ Policy hệ thống.
 */
export const HomeProcessAndFaqSection: React.FC<HomeProcessAndFaqSectionProps> = ({
  primaryFacilityId,
  policy,
  onScrollToBranches,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const holdHours = policy?.reservationHoldHours ?? 48;
  const depositMonths = policy?.depositMultiplier ?? 1;
  const pinLength = policy?.accessPinLength ?? 6;
  const returnNoticeDays = policy?.returnNoticeDays ?? 30;
  const lateRefundPct = Math.round((policy?.cancelLateRefundRate ?? 0.5) * 100);
  const renewalMin = policy?.renewalMinMonths ?? 1;
  const renewalMax = policy?.renewalMaxMonths ?? 12;

  const faqItems = [
    {
      q: `Ra vào kho và sử dụng mã PIN ${pinLength} số thế nào?`,
      a: `Chi nhánh mở cửa theo khung giờ niêm yết. Sau khi Check-in (online hoặc tại quầy), mã PIN ${pinLength} số riêng của hợp đồng được kích hoạt và bạn có thể đổi mã bất kỳ lúc nào tại mục "Kho của tôi".`,
    },
    {
      q: 'Hàng hóa có được bảo vệ hay bồi thường rủi ro không?',
      a: 'Mỗi hợp đồng kèm sẵn Gói bảo vệ cơ bản 10.000.000đ (miễn phí). Bạn có thể nâng cấp lên Gói mở rộng 50.000.000đ (+50.000đ/tháng) ngay khi đặt chỗ.',
    },
    {
      q: 'Chính sách hủy đặt chỗ và báo trả kho ra sao?',
      a: `Hủy trước ngày nhận ≥ 7 ngày: hoàn 100% tiền thuê & cọc; từ 2–6 ngày: hoàn ${lateRefundPct}% cọc; dưới 48h: không hoàn cọc. Khi trả kho, báo trước ${returnNoticeDays} ngày để nhận đủ 100% tiền cọc sau nghiệm thu.`,
    },
    {
      q: 'Có thể gia hạn hoặc dời ngày nhận kho trực tuyến không?',
      a: `Có. Bạn có thể gia hạn từ ${renewalMin}–${renewalMax} tháng ngay trên cổng khách hàng, hoặc dời ngày nhận kho tối đa 7 ngày (thực hiện trước giờ hẹn ít nhất 48 giờ).`,
    },
  ];

  return (
    <>
      {/* 4. QUY TRÌNH 3 BƯỚC NGẮN GỌN */}
      <section className="py-12 sm:py-14 bg-white border-b border-slate-200">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-9">
            <span className="text-[#439782] text-xs font-bold uppercase tracking-wider block mb-1">
              Quy Trình Đặt Kho
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
              3 bước nhận kho nhanh chóng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#f2f9f7]/60 p-5 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 mb-3 rounded-xl bg-white flex items-center justify-center text-[#57b29a] border border-slate-200/80">
                <Box className="w-5 h-5" />
              </div>
              <span className="font-mono text-[11px] text-[#439782] font-bold block mb-1">
                BƯỚC 01
              </span>
              <h3 className="font-bold text-sm sm:text-base text-[#0a1614] mb-1.5">
                Chọn ô kho &amp; Giữ chỗ {holdHours}h
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chọn chi nhánh, cỡ kho và ngày bắt đầu thuê. Suất trống được giữ trong {holdHours} giờ.
              </p>
            </div>

            <div className="bg-[#f2f9f7]/60 p-5 rounded-2xl border-2 border-[#57b29a]">
              <div className="w-10 h-10 mb-3 rounded-xl bg-[#57b29a] flex items-center justify-center text-white">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-mono text-[11px] text-[#439782] font-bold block mb-1">
                BƯỚC 02
              </span>
              <h3 className="font-bold text-sm sm:text-base text-[#0a1614] mb-1.5">
                Thanh toán VNPay minh bạch
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thanh toán tiền thuê kèm {depositMonths} tháng tiền cọc (tự động giảm giá khi thuê dài hạn).
              </p>
            </div>

            <div className="bg-[#f2f9f7]/60 p-5 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 mb-3 rounded-xl bg-white flex items-center justify-center text-[#125449] border border-slate-200/80">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="font-mono text-[11px] text-[#439782] font-bold block mb-1">
                BƯỚC 03
              </span>
              <h3 className="font-bold text-sm sm:text-base text-[#0a1614] mb-1.5">
                Check-in &amp; Nhận mã PIN {pinLength} số
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check-in online hoặc tại quầy để nhận bàn giao và kích hoạt mã PIN riêng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQS & BANNER CTA GỌN NHẸ */}
      <section className="py-12 sm:py-14 bg-[#f2f9f7] border-b border-slate-200" id="faqs">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            <div className="lg:col-span-4 space-y-3">
              <span className="text-[#439782] text-xs font-bold uppercase tracking-wider block">
                Giải Đáp Nhanh
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
                Câu hỏi thường gặp
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mọi thông tin về mã PIN, gói bảo vệ và chính sách hoàn cọc đều minh bạch trước khi đặt.
              </p>
              <a
                className="inline-flex items-center gap-2 text-[#125449] font-semibold text-xs hover:underline pt-1"
                href="tel:19008888"
              >
                <Headphones className="w-4 h-4 text-[#57b29a]" />
                <span>Hotline hỗ trợ: 1900 8888</span>
              </a>
            </div>

            <div className="lg:col-span-8 space-y-2.5">
              {faqItems.map((item, index) => (
                <div
                  key={item.q}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq((prev) => (prev === index ? null : index))}
                    className="w-full text-left font-semibold text-xs sm:text-sm text-[#0a1614] flex justify-between items-center cursor-pointer gap-4"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#57b29a] shrink-0 transition-transform duration-200 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-slate-100 pt-2.5">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA Card tối giản nền xanh ngọc thanh lịch (không ảnh công nghiệp tối) */}
          <div
            className="rounded-2xl overflow-hidden shadow-lg border border-teal-700/40 bg-gradient-to-r from-[#125449] via-[#1c6e60] to-[#144c42] p-7 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white"
            id="rent-now"
          >
            <div className="max-w-xl space-y-2">
              <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider block">
                Bắt đầu lưu trữ ngay hôm nay
              </span>
              <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                Chọn ô kho trống phù hợp &amp; giữ chỗ trong {holdHours} giờ
              </h3>
              <p className="text-teal-50/90 text-xs sm:text-sm">
                Kiểm tra trực tiếp sức chứa theo ngày nhận mong muốn với giá thuê niêm yết rõ ràng.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {primaryFacilityId ? (
                <Link
                  to={`/customer/units?facility=${primaryFacilityId}`}
                  className="px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#125449] font-bold text-xs transition-all inline-flex items-center gap-2 shadow-md"
                >
                  <Warehouse className="w-4 h-4" />
                  <span>Chọn ô kho ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onScrollToBranches}
                  className="px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#125449] font-bold text-xs transition-all inline-flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Warehouse className="w-4 h-4" />
                  <span>Xem các chi nhánh</span>
                </button>
              )}

              <a
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-medium text-xs transition-all inline-flex items-center gap-2"
                href="tel:19008888"
              >
                <Phone className="w-4 h-4 text-emerald-200" />
                <span>1900 8888</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

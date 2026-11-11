import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Headphones } from 'lucide-react';
import type { ActivePolicyInfo } from '@/types';
import pixelStepBoxImg from '@/assets/images/pixel-step-1-box.png';
import pixelStepPaymentImg from '@/assets/images/pixel-step-2-payment.png';
import pixelStepPinImg from '@/assets/images/pixel-step-3-pin.png';
import pixelWhyFlexibleImg from '@/assets/images/pixel-why-1-flexible.png';
import pixelWhySecurityImg from '@/assets/images/pixel-why-2-security.png';
import pixelWhyTransparentImg from '@/assets/images/pixel-why-3-transparent.png';
import faqCofounderImg from '@/assets/images/faq-cofounder-clean.webp';

interface HomeProcessAndFaqSectionProps {
  policy?: ActivePolicyInfo | null;
  onScrollToId?: (id: string) => void;
}

const VALUE_HIGHLIGHTS = [
  {
    code: 'LINH HOẠT',
    title: 'Thuê theo tháng, không cọc dài hạn',
    desc: 'Chọn kỳ hạn 1–12 tháng theo nhu cầu thực tế, không lo phí điện nước.',
    iconSrc: pixelWhyFlexibleImg,
  },
  {
    code: 'AN NINH 2 LỚP',
    title: 'Camera 24/7 & Khóa PIN 6 số riêng',
    desc: 'Mỗi ô kho có mã PIN độc lập, tự đổi mã trực tiếp trên cổng khách hàng.',
    iconSrc: pixelWhySecurityImg,
  },
  {
    code: 'MINH BẠCH',
    title: 'Minh bạch tiền thuê, cọc và chiết khấu',
    desc: 'Hiển thị rõ tiền thuê, tiền cọc và chiết khấu trước khi thanh toán.',
    iconSrc: pixelWhyTransparentImg,
  },
];

/**
 * Quy trình 3 bước, Lý do chọn SmartStorage và khối FAQ nền trời xanh Cofounder.
 */
export const HomeProcessAndFaqSection: React.FC<HomeProcessAndFaqSectionProps> = ({
  policy,
  onScrollToId,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleGoToBranches = () => {
    if (onScrollToId) {
      onScrollToId('branches');
      return;
    }
    document.getElementById('branches')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      a: `Mở cửa theo giờ chi nhánh. Sau Check-in, mã PIN ${pinLength} số tự động kích hoạt và có thể đổi mọi lúc tại "Kho của tôi".`,
    },
    {
      q: 'Trách nhiệm bảo quản hàng hóa và quy định an toàn ra sao?',
      a: 'SmartStorage cho thuê mặt bằng tự quản (không nhận lưu giữ tiền mặt, vàng bạc, chất cháy nổ hay thực phẩm tươi sống). Cơ sở trang bị Camera 24/7 & PCCC tự động; chỉ bồi thường tối đa 10 triệu/ô kho theo chứng từ nếu hư hại do lỗi kỹ thuật hạ tầng cơ sở.',
    },
    {
      q: 'Chính sách hủy đặt chỗ và báo trả kho ra sao?',
      a: `Hủy trước ≥ 7 ngày: hoàn 100% tiền thuê & cọc; từ 2–6 ngày: hoàn ${lateRefundPct}% cọc; dưới 48h: không hoàn cọc. Trả kho báo trước ${returnNoticeDays} ngày để nhận lại 100% cọc.`,
    },
    {
      q: 'Có thể gia hạn hoặc dời ngày nhận kho trực tuyến không?',
      a: `Có. Gia hạn ${renewalMin}–${renewalMax} tháng ngay trên web hoặc dời ngày nhận tối đa 7 ngày (trước giờ hẹn ít nhất 48 giờ).`,
    },
  ];

  return (
    <>
      {/* 4. QUY TRÌNH 3 BƯỚC + LÝ DO CHỌN SMARTSTORAGE & FEEDBACK */}
      <section className="py-16 sm:py-20 bg-white border-b border-sky-100">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div>
            <div className="text-center max-w-2xl mx-auto mb-9">
              <span className="font-pixel text-[#0c5a8a] text-[13px] font-medium uppercase tracking-wider block mb-2">
                Quy Trình Thuê Kho
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#0a1614] tracking-tight">
                3 bước nhận kho trong ngày
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#f3f8fc] p-6 rounded-2xl border border-sky-200/80 shadow-[0_4px_0_0_rgba(14,116,144,0.08)]">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="font-pixel inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-[12px] text-[#0c5a8a] tracking-wider">
                    MÀN 01 · CHỌN KHO
                  </span>
                  <div className="w-20 h-20 rounded-2xl bg-white border border-sky-200/75 shadow-2xs flex items-center justify-center p-2 shrink-0">
                    <img
                      src={pixelStepBoxImg}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-[#0a1614] mb-1.5">
                  Chọn ô &amp; Giữ chỗ {holdHours}h
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Chọn chi nhánh, kích cỡ và ngày nhận — giữ chỗ miễn phí {holdHours} giờ.
                </p>
              </div>

              <div className="bg-[#f3f8fc] p-6 rounded-2xl border border-sky-200/80 shadow-[0_4px_0_0_rgba(14,116,144,0.08)]">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="font-pixel inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-[12px] text-[#0c5a8a] tracking-wider">
                    MÀN 02 · THANH TOÁN
                  </span>
                  <div className="w-20 h-20 rounded-2xl bg-white border border-sky-200/75 shadow-2xs flex items-center justify-center p-2 shrink-0">
                    <img
                      src={pixelStepPaymentImg}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-[#0a1614] mb-1.5">
                  Thanh toán VNPay
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Thanh toán tiền thuê cùng {depositMonths} tháng cọc, tự động trừ ưu đãi dài hạn.
                </p>
              </div>

              <div className="bg-[#f3f8fc] p-6 rounded-2xl border border-sky-200/80 shadow-[0_4px_0_0_rgba(14,116,144,0.08)]">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="font-pixel inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-[12px] text-[#0c5a8a] tracking-wider">
                    MÀN 03 · NHẬN KHO
                  </span>
                  <div className="w-20 h-20 rounded-2xl bg-white border border-sky-200/75 shadow-2xs flex items-center justify-center p-2 shrink-0">
                    <img
                      src={pixelStepPinImg}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-[#0a1614] mb-1.5">
                  Nhận kho &amp; Mã PIN {pinLength} số
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Check-in online hoặc tại quầy để kích hoạt ngay mã PIN {pinLength} số riêng.
                </p>
              </div>
            </div>
          </div>

          {/* Lý do chọn SmartStorage */}
          <div className="space-y-8 pt-4 border-t border-slate-200/80">
            <div className="text-center max-w-2xl mx-auto">
              <span className="font-pixel text-[#0c5a8a] text-[13px] font-medium uppercase tracking-wider block mb-2">
                Tại Sao Chọn SmartStorage
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
                Gọn hơn thuê kho lẻ bên ngoài
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {VALUE_HIGHLIGHTS.map(({ code, title, desc, iconSrc }) => (
                <div
                  key={code}
                  className="p-6 rounded-2xl border border-slate-200 bg-white space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-pixel text-[13px] font-medium text-[#0284c7] tracking-wider">
                      {code}
                    </span>
                    <div className="w-16 h-16 rounded-2xl bg-[#f3f8fc] border border-sky-200/70 flex items-center justify-center p-2 shrink-0">
                      <img
                        src={iconSrc}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-[#0a1614]">{title}</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQS — Nền Tranh Bầu Trời & Hàng Cây Cofounder (mượt sắc nét) */}
      <section
        className="relative py-16 sm:py-20 lg:min-h-[660px] flex items-center bg-[#0d6ec9] overflow-hidden"
        id="faqs"
      >
        <img
          src={faqCofounderImg}
          alt="Không gian giải đáp câu hỏi thường gặp SmartStorage"
          className="absolute inset-0 w-full h-full object-cover object-bottom select-none pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#041d3a]/55 via-[#073161]/30 to-transparent pointer-events-none"
        />

        <div className="relative z-10 w-full max-w-[760px] mx-auto px-4 sm:px-6 space-y-7">
          <div className="text-center space-y-2.5 text-white">
            <span className="font-pixel text-sky-100 text-[13px] font-medium uppercase tracking-wider block drop-shadow-2xs">
              Giải Đáp Nhanh
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight drop-shadow-[0_2px_12px_rgba(3,20,44,0.45)]">
              Câu hỏi thường gặp
            </h2>
            <p className="text-sm sm:text-base text-white max-w-lg mx-auto drop-shadow-[0_1px_8px_rgba(3,20,44,0.45)]">
              Thông tin ngắn gọn về mã PIN, an toàn hàng hóa và nhận trả kho.
            </p>
            <div className="pt-1">
              <a
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#041f3d]/45 hover:bg-[#041f3d]/65 border border-white/40 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-colors shadow-2xs"
                href="tel:19008888"
              >
                <Headphones className="w-4 h-4 text-sky-100" />
                <span>Hotline hỗ trợ: 1900 8888</span>
              </a>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/85 shadow-[0_24px_60px_-15px_rgba(8,47,73,0.32)] p-4 sm:p-6 space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={item.q}
                className="bg-[#f7fbff] px-5 py-4 rounded-2xl border border-sky-100"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq((prev) => (prev === index ? null : index))}
                  className="w-full text-left font-bold text-sm sm:text-base text-[#0a1614] flex justify-between items-center cursor-pointer gap-4"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#0c5a8a] shrink-0 transition-transform duration-200 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <p className="text-sm text-slate-700 mt-3 leading-relaxed border-t border-sky-100 pt-3">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Dải CTA cuối trang tách bạch trên nền sáng, bo thẻ xanh thương hiệu trước Footer */}
      <section
        id="closing-cta"
        className="bg-[#f3f8fc] border-t border-sky-200/80 py-12 sm:py-14"
      >
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#0c5a8a] via-[#0b689e] to-[#0284c7] border border-sky-400/30 shadow-[0_20px_48px_-16px_rgba(12,90,138,0.38)] px-6 py-8 sm:px-10 sm:py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2 max-w-xl">
              <span className="font-pixel text-sky-200 text-[13px] uppercase tracking-wider block">
                Sẵn Sàng Lưu Trữ
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Bắt đầu lưu trữ hôm nay
              </h2>
              <p className="text-sm text-sky-50/95 leading-relaxed">
                Chọn chi nhánh gần bạn, giữ chỗ {holdHours} giờ và chủ động ra vào bằng mã PIN {pinLength} số.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoToBranches}
              style={{ ['--tactile-shadow' as string]: '#93c5fd' }}
              className="btn-tactile px-6 py-3.5 rounded-full bg-white hover:bg-sky-50 text-[#0c5a8a] font-bold text-sm inline-flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Chọn cơ sở &amp; Đặt kho</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

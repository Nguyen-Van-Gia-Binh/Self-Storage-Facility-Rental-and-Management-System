import React, { useState } from 'react';
import { ChevronDown, Headphones } from 'lucide-react';
import type { ActivePolicyInfo } from '@/types';
import pixelStepBoxImg from '@/assets/images/pixel-step-1-box.png';
import pixelStepPaymentImg from '@/assets/images/pixel-step-2-payment.png';
import pixelStepPinImg from '@/assets/images/pixel-step-3-pin.png';
import pixelWhyFlexibleImg from '@/assets/images/pixel-why-1-flexible.png';
import pixelWhySecurityImg from '@/assets/images/pixel-why-2-security.png';
import pixelWhyTransparentImg from '@/assets/images/pixel-why-3-transparent.png';
import pixelAvatarMinhThuImg from '@/assets/images/pixel-avatar-minh-thu.png';
import pixelAvatarQuocBaoImg from '@/assets/images/pixel-avatar-quoc-bao.png';
import pixelAvatarHoangNamImg from '@/assets/images/pixel-avatar-hoang-nam.png';
import pixelFaqCofounderImg from '@/assets/images/pixel-faq-cofounder.jpg';

interface HomeProcessAndFaqSectionProps {
  policy?: ActivePolicyInfo | null;
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
    title: 'Giá trọn gói, sẵn bảo vệ 10 triệu',
    desc: 'Hiển thị rõ tiền thuê, tiền cọc và chiết khấu trước khi thanh toán.',
    iconSrc: pixelWhyTransparentImg,
  },
];

const CUSTOMER_QUOTES = [
  {
    quote:
      'Sửa căn hộ ở Cầu Giấy gần 2 tháng, gửi trọn sofa, tủ lạnh và 15 thùng đồ rất gọn, tự mở PIN buổi tối tiện lắm.',
    author: 'Chị Minh Thư · Chuyển & sửa căn hộ',
    unitUsed: 'Thuê cỡ M (6 m²)',
    avatarSrc: pixelAvatarMinhThuImg,
  },
  {
    quote:
      'Shop mỹ phẩm cần kho Máy lạnh 20–25°C để giữ hàng ổn định, chi phí nhẹ hơn thuê mặt bằng kho riêng gần nửa.',
    author: 'Anh Quốc Bảo · Kinh doanh mỹ phẩm',
    unitUsed: 'Kho Máy lạnh · Cỡ S',
    avatarSrc: pixelAvatarQuocBaoImg,
  },
  {
    quote:
      'Giữ chỗ online trước khi bay công tác, nhận kho trong 10 phút và trả kho nhận đủ 100% cọc rất minh bạch.',
    author: 'Bạn Hoàng Nam · Công tác dài ngày',
    unitUsed: 'Thuê cỡ XS (1 m²)',
    avatarSrc: pixelAvatarHoangNamImg,
  },
];

/**
 * Quy trình 3 bước, Lý do chọn SmartStorage, Feedback và khối FAQ nền trời xanh Cofounder.
 */
export const HomeProcessAndFaqSection: React.FC<HomeProcessAndFaqSectionProps> = ({ policy }) => {
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
      a: `Mở cửa theo giờ chi nhánh. Sau Check-in, mã PIN ${pinLength} số tự động kích hoạt và có thể đổi mọi lúc tại "Kho của tôi".`,
    },
    {
      q: 'Hàng hóa có được bảo vệ hay bồi thường rủi ro không?',
      a: 'Mỗi hợp đồng kèm sẵn Bảo vệ cơ bản 10 triệu (miễn phí), có thể nâng cấp lên 50 triệu (+50.000đ/tháng).',
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
              <span className="font-mono text-[#0c5a8a] text-xs font-bold uppercase tracking-wider block mb-2">
                Quy Trình Thuê Kho
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#0a1614] tracking-tight">
                3 bước nhận kho trong ngày
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#f3f8fc] p-6 rounded-2xl border border-sky-200/70">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="font-mono text-xs text-[#0c5a8a] font-bold tracking-wider">CHỌN KHO</span>
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

              <div className="bg-[#f3f8fc] p-6 rounded-2xl border border-sky-200/70">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="font-mono text-xs text-[#0c5a8a] font-bold tracking-wider">THANH TOÁN</span>
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

              <div className="bg-[#f3f8fc] p-6 rounded-2xl border border-sky-200/70">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="font-mono text-xs text-[#0c5a8a] font-bold tracking-wider">NHẬN KHO</span>
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

          {/* Lý do chọn SmartStorage & Tiếng nói Khách hàng (Human Proof) */}
          <div className="space-y-8 pt-4 border-t border-slate-200/80">
            <div className="text-center max-w-2xl mx-auto">
              <span className="font-mono text-[#0c5a8a] text-xs font-bold uppercase tracking-wider block mb-2">
                Tại Sao Chọn SmartStorage
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
                Tiện gọn hơn tự thuê nhà kho rời bên ngoài
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {VALUE_HIGHLIGHTS.map(({ code, title, desc, iconSrc }) => (
                <div
                  key={code}
                  className="p-6 rounded-2xl border border-slate-200 bg-white space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-[#0284c7] tracking-wider">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {CUSTOMER_QUOTES.map(({ quote, author, unitUsed, avatarSrc }) => (
                <div
                  key={author}
                  className="p-5 rounded-2xl bg-[#f3f8fc] border border-sky-200/75 flex flex-col justify-between gap-4"
                >
                  <p className="text-sm text-slate-700 leading-relaxed">“{quote}”</p>
                  <div className="pt-3 border-t border-sky-200/70 flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-[#e4f1fb] border border-sky-300/60 shadow-2xs flex items-end justify-center pt-1 overflow-hidden shrink-0">
                      <img
                        src={avatarSrc}
                        alt={`Ảnh đại diện ${author}`}
                        className="w-full h-full object-contain object-bottom"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-[#0a1614] block truncate">{author}</span>
                      <span className="text-xs font-medium text-[#0c5a8a] block mt-0.5">
                        {unitUsed}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQS — Nền Tranh Pixel-Art Bầu Trời & Hàng Cây Cofounder */}
      <section
        className="relative py-16 sm:py-20 lg:min-h-[660px] flex items-center bg-[#1585e8] overflow-hidden"
        id="faqs"
      >
        <img
          src={pixelFaqCofounderImg}
          alt="Không gian giải đáp câu hỏi thường gặp SmartStorage"
          className="absolute inset-0 w-full h-full object-cover object-bottom select-none pointer-events-none"
        />

        <div className="relative z-10 w-full max-w-[760px] mx-auto px-4 sm:px-6 space-y-7">
          <div className="text-center space-y-2.5 text-white">
            <span className="font-mono text-sky-100 text-xs font-bold uppercase tracking-wider block drop-shadow-2xs">
              Giải Đáp Nhanh
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight drop-shadow-[0_2px_10px_rgba(6,45,98,0.22)]">
              Câu hỏi thường gặp
            </h2>
            <p className="text-sm sm:text-base text-white/95 max-w-lg mx-auto drop-shadow-[0_1px_6px_rgba(6,45,98,0.2)]">
              Thông tin ngắn gọn về mã PIN, bảo vệ tài sản và nhận trả kho.
            </p>
            <div className="pt-1">
              <a
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/35 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-colors shadow-2xs"
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
    </>
  );
};

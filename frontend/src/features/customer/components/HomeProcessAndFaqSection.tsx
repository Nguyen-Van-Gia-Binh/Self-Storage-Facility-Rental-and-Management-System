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

interface HomeProcessAndFaqSectionProps {
  primaryFacilityId?: number | string;
  onScrollToBranches: () => void;
}

const FAQ_ITEMS = [
  {
    q: 'Thời gian ra vào kho và sử dụng mã PIN 6 số như thế nào?',
    a: 'Mỗi chi nhánh mở cửa phục vụ theo khung giờ vận hành niêm yết (06:00–22:00 hoặc 24/7 tùy cơ sở). Sau khi hoàn tất bước nhận kho (Check-in online hoặc tại quầy), hệ thống sẽ cấp mã PIN 6 số riêng cho ô kho của bạn và bạn có thể chủ động đổi mã PIN bất kỳ lúc nào trong mục "Kho của tôi".',
  },
  {
    q: 'Hàng hóa lưu trữ có được bảo hiểm hay gói bảo vệ rủi ro không?',
    a: 'Có. Mỗi hợp đồng mặc định được bảo vệ theo Gói cơ bản trị giá 10.000.000đ (miễn phí). Với hàng hóa hoặc thiết bị có giá trị cao, bạn có thể chọn nâng cấp lên Gói bảo vệ mở rộng tối đa 50.000.000đ với mức phí 50.000đ/tháng ngay tại bước đặt kho.',
  },
  {
    q: 'Chính sách hủy đặt chỗ và báo trả kho được tính như thế nào?',
    a: 'Trước ngày nhận kho: hủy sớm từ 7 ngày trở lên được hoàn 100% tiền thuê và tiền cọc; hủy từ 2 đến 6 ngày hoàn 100% tiền thuê và 50% tiền cọc; hủy sát giờ dưới 48 giờ hoàn 100% tiền thuê và không hoàn cọc. Khi đang thuê, bạn gửi yêu cầu báo trả kho trước 30 ngày để nhận lại 100% tiền cọc sau khi nhân viên nghiệm thu hiện trạng.',
  },
  {
    q: 'Tôi có thể gia hạn thời gian thuê hoặc dời ngày nhận kho trực tuyến không?',
    a: 'Hoàn toàn được. Bạn có thể bấm "Gia hạn" trực tiếp trên thẻ hợp đồng của mình để thuê tiếp từ 1 đến 12 tháng. Nếu có việc đột xuất trước ngày nhận kho tối thiểu 48 giờ, hệ thống hỗ trợ dời lịch nhận kho tối đa 7 ngày (tối đa 1 lần cho mỗi hợp đồng).',
  },
];

/**
 * Quy trình 3 bước thuê kho sát thực tế hệ thống + FAQ theo BUSINESS-RULES.md + Banner CTA cuối trang.
 */
export const HomeProcessAndFaqSection: React.FC<HomeProcessAndFaqSectionProps> = ({
  primaryFacilityId,
  onScrollToBranches,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <>
      {/* 4. QUY TRÌNH THUÊ KHO 3 BƯỚC THỰC TẾ */}
      <section className="py-14 sm:py-16 bg-[#f2f9f7] border-b border-slate-200">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[#439782] text-xs font-bold uppercase tracking-wider block mb-1.5">
              Quy Trình Rõ Ràng
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
              Thuê kho trực tuyến chỉ với 3 bước đơn giản
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Giữ chỗ 48 giờ an toàn, thanh toán minh bạch và chủ động nhận kho theo lịch của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 mb-4 rounded-xl bg-[#f2f9f7] flex items-center justify-center text-[#57b29a] border border-slate-200/80">
                <Box className="w-6 h-6" />
              </div>
              <span className="font-mono text-[11px] text-[#439782] font-bold block mb-1">
                BƯỚC 01
              </span>
              <h3 className="font-bold text-base text-[#0a1614] mb-2">
                Chọn hạng kho &amp; Giữ chỗ 48h
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chọn chi nhánh, kích thước (1m²–15m²) và ngày nhận kho dự kiến. Đơn được giữ suất an toàn trong 48 giờ để bạn thanh toán.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-[#57b29a] shadow-sm relative">
              <div className="w-12 h-12 mb-4 rounded-xl bg-[#57b29a] flex items-center justify-center text-white shadow-xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="font-mono text-[11px] text-[#439782] font-bold block mb-1">
                BƯỚC 02
              </span>
              <h3 className="font-bold text-base text-[#0a1614] mb-2">
                Thanh toán VNPay minh bạch
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thanh toán tiền thuê (tự động áp dụng ưu đãi kỳ hạn dài) kèm 1 tháng tiền cọc hoàn lại khi kết thúc hợp đồng đúng hạn.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 mb-4 rounded-xl bg-[#f2f9f7] flex items-center justify-center text-[#0a1614] border border-slate-200/80">
                <KeyRound className="w-6 h-6" />
              </div>
              <span className="font-mono text-[11px] text-[#439782] font-bold block mb-1">
                BƯỚC 03
              </span>
              <h3 className="font-bold text-base text-[#0a1614] mb-2">
                Check-in &amp; Nhận mã PIN 6 số
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tự Check-in Online ngay trên cổng khách hàng hoặc nhận bàn giao trực tiếp cùng nhân viên tại quầy để kích hoạt mã PIN mở kho.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQS & BANNER CTA CUỐI TRANG */}
      <section className="py-14 sm:py-16 bg-white border-b border-slate-200" id="faqs">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-14">
            <div className="lg:col-span-4 space-y-3">
              <span className="text-[#439782] text-xs font-bold uppercase tracking-wider block">
                Giải Đáp Thắc Mắc
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
                Câu hỏi thường gặp
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Thông tin minh bạch về giờ mở cửa, bảo vệ hàng hóa, chính sách hoàn cọc và thủ tục gia hạn.
              </p>
              <div className="pt-2">
                <a
                  className="inline-flex items-center gap-2 text-[#439782] font-semibold text-xs hover:underline"
                  href="tel:19008888"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Cần tư vấn thêm? Gọi Hotline 1900 8888</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-3">
              {FAQ_ITEMS.map((item, index) => (
                <div
                  key={item.q}
                  className="bg-[#f2f9f7]/60 p-5 rounded-2xl border border-slate-200/90"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left font-semibold text-sm text-[#0a1614] flex justify-between items-center cursor-pointer gap-4"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#57b29a] shrink-0 transition-transform duration-200 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-200/80 pt-3">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA Banner đồng bộ màu xanh ngọc SmartStorage */}
          <div
            className="relative rounded-2xl overflow-hidden shadow-lg border border-teal-700/40 bg-gradient-to-br from-[#125449] via-[#1c6e60] to-[#11473e]"
            id="rent-now"
          >
            <div className="relative min-h-[16rem] sm:min-h-[18rem] flex items-center">
              <img
                alt="Hệ thống cơ sở lưu trữ SmartStorage"
                className="w-full h-full object-cover opacity-25 absolute inset-0"
                src="/assets/landing/facility.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#125449]/95 via-[#186054]/85 to-[#11473e]/55" />
              <div className="relative z-10 p-8 sm:p-10 flex flex-col justify-center max-w-2xl text-white">
                <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider block mb-2">
                  Sẵn sàng dọn thoáng không gian của bạn
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight tracking-tight">
                  Chọn ô kho trống và giữ chỗ ngay trong hôm nay
                </h3>
                <p className="text-teal-50/90 text-xs sm:text-sm mb-6 max-w-lg leading-relaxed">
                  Minh bạch chi phí từ ngày đầu tiên, hỗ trợ chọn gói bảo vệ tài sản và kiểm tra trực tiếp hiện trạng ô kho trước khi nhận.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {primaryFacilityId ? (
                    <Link
                      to={`/customer/units?facility=${primaryFacilityId}`}
                      className="px-6 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#125449] font-bold text-xs transition-all inline-flex items-center gap-2 shadow-md"
                    >
                      <Warehouse className="w-4 h-4" />
                      <span>Chọn ô kho trực tuyến ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={onScrollToBranches}
                      className="px-6 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#125449] font-bold text-xs transition-all inline-flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <Warehouse className="w-4 h-4" />
                      <span>Xem các chi nhánh</span>
                    </button>
                  )}

                  <a
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-medium text-xs transition-all inline-flex items-center gap-2"
                    href="tel:19008888"
                  >
                    <Phone className="w-4 h-4 text-emerald-200" />
                    <span>Hotline: 1900 8888</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};


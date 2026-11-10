import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Thermometer, Warehouse, Camera } from 'lucide-react';

interface HomeSizeGuideSectionProps {
  primaryFacilityId?: number | string;
  onScrollToBranches: () => void;
}

/**
 * Giới thiệu 2 dòng kho thực tế (Tiêu chuẩn & Máy lạnh) và 3 tình huống gửi đồ phổ biến.
 * Toàn bộ hình ảnh lấy từ local assets và nút CTA trỏ đúng tới cơ sở khả dụng kèm bộ lọc.
 */
export const HomeSizeGuideSection: React.FC<HomeSizeGuideSectionProps> = ({
  primaryFacilityId,
  onScrollToBranches,
}) => {
  const buildUnitLink = (storageType: 'standard' | 'climate', size?: string) => {
    if (!primaryFacilityId) return '#branches';
    const params = new URLSearchParams({
      facility: String(primaryFacilityId),
      storageType,
    });
    if (size) params.set('size', size);
    return `/customer/units?${params.toString()}`;
  };

  const renderCta = (
    label: string,
    storageType: 'standard' | 'climate',
    variant: 'primary' | 'secondary',
    size?: string
  ) => {
    const className =
      variant === 'primary'
        ? 'px-4 py-2.5 bg-[#57b29a] hover:bg-[#439782] text-white font-semibold rounded-xl transition-colors text-xs inline-flex items-center gap-1.5 shadow-xs'
        : 'px-4 py-2.5 bg-[#f2f9f7] hover:bg-[#57b29a] hover:text-white text-[#0a1614] font-semibold rounded-xl transition-colors text-xs border border-slate-200 inline-flex items-center gap-1.5';

    if (!primaryFacilityId) {
      return (
        <button type="button" onClick={onScrollToBranches} className={`${className} cursor-pointer`}>
          <span>{label}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      );
    }

    return (
      <Link to={buildUnitLink(storageType, size)} className={className}>
        <span>{label}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    );
  };

  return (
    <section className="py-14 sm:py-16 bg-[#f2f9f7] border-b border-slate-200/80" id="unit-types">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Phần A: So sánh 2 dòng kho thực tế */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[#439782] text-xs font-bold uppercase tracking-wider block mb-1.5">
              2 Dòng Kho Chuyên Biệt
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
              Chọn đúng môi trường bảo quản cho đồ đạc của bạn
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Đầy đủ các cỡ từ 1m² (XS) đến 15m² (XL) với cửa khóa PIN riêng và giám sát camera 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* CARD 1: Kho Tiêu Chuẩn */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-all">
              <div className="relative h-52 overflow-hidden bg-slate-100">
                <img
                  alt="Hành lang ô kho tiêu chuẩn sạch sẽ"
                  className="w-full h-full object-cover"
                  src="/assets/landing/unit-nho.png"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0a1614]/85 text-white backdrop-blur-sm">
                    <Warehouse className="w-3 h-3 text-[#57b29a]" />
                    Kho Tiêu Chuẩn
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-baseline mb-2 gap-2">
                    <h3 className="font-bold text-lg text-[#0a1614]">Kho Tiêu Chuẩn</h3>
                    <span className="text-xs font-semibold text-slate-500">Kích thước 1m² – 15m²</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Phù hợp lưu trữ nội thất gia đình, xe máy, đồ dọn sửa nhà, vali hành lý và hàng hóa đóng thùng thông thường.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Ô kho thép kín đáo, thông gió tự nhiên khô ráo quanh năm
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Trang bị hệ thống báo cháy &amp; chữa cháy tự động đạt chuẩn PCCC
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Mã PIN 6 số riêng tư, tự do thay đổi mã trên cổng khách hàng
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Giảm giá tự động khi đăng ký kỳ hạn thuê dài từ 3, 6, 12 tháng
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Tiết kiệm chi phí nhất</span>
                  {renderCta('Xem ô kho Tiêu chuẩn', 'standard', 'secondary')}
                </div>
              </div>
            </div>

            {/* CARD 2: Kho Máy Lạnh */}
            <div className="bg-white rounded-2xl border-2 border-[#57b29a] shadow-md flex flex-col overflow-hidden relative">
              <div className="bg-[#57b29a] text-white text-center py-1.5 text-[11px] tracking-wide font-semibold">
                Kiểm soát nhiệt độ 20°C – 25°C chống ẩm mốc 24/7
              </div>
              <div className="relative h-52 overflow-hidden bg-slate-100">
                <img
                  alt="Kho máy lạnh sạch sẽ kiểm soát nhiệt độ"
                  className="w-full h-full object-cover"
                  src="/assets/landing/unit-lanh.jpg"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#57b29a] text-white shadow-sm">
                    <Thermometer className="w-3 h-3" />
                    Kho Máy Lạnh
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-baseline mb-2 gap-2">
                    <h3 className="font-bold text-lg text-[#0a1614]">Kho Máy Lạnh</h3>
                    <span className="text-xs font-semibold text-[#439782]">Kích thước 1m² – 15m²</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Dành riêng cho mỹ phẩm, dược phẩm, đồ gỗ cao cấp, đồ da, nhạc cụ, thiết bị điện tử và hồ sơ chứng từ nhạy cảm với độ ẩm.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Điều hòa vận hành ổn định 20°C – 25°C, ngăn ngừa ẩm mốc hiệu quả
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Sàn sạch chống bụi, vách cách nhiệt khép kín từng khu vực
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Mã PIN 6 số riêng tư, an ninh camera giám sát hành lang 24/7
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Tùy chọn gói bảo vệ hàng hóa mở rộng lên tới 50.000.000đ
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-[#439782] font-semibold">Bảo vệ đồ giá trị cao</span>
                  {renderCta('Chọn kho Máy lạnh', 'climate', 'primary')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phần B: 3 Tình huống thực tế & An ninh vận hành */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
            <div>
              <span className="text-[#439782] text-xs font-bold uppercase tracking-wider block mb-1">
                Giải pháp theo nhu cầu thực tế
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0a1614] tracking-tight">
                SmartStorage giúp ích thế nào cho bạn?
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-slate-600 mt-2 md:mt-0">
              <Camera className="w-4 h-4 text-[#57b29a]" />
              <span>Hỗ trợ xe đẩy hàng miễn phí &amp; camera an ninh tại mọi cơ sở</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="h-44 overflow-hidden bg-slate-100">
                  <img
                    alt="Khách hàng sử dụng xe đẩy chuyển đồ vào kho khi dọn nhà"
                    className="w-full h-full object-cover"
                    src="/assets/landing/use-chuyen-nha.png"
                  />
                </div>
                <div className="p-5">
                  <span className="inline-block text-[11px] font-semibold text-[#439782] bg-[#f2f9f7] px-2.5 py-0.5 rounded-full mb-2">
                    Gia đình &amp; Cá nhân
                  </span>
                  <h4 className="font-bold text-base text-[#0a1614] mb-1.5">
                    Chuyển nhà &amp; Sửa chữa nhà ở
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gửi trọn bộ sofa, giường nệm, thiết bị gia dụng trong thời gian thi công nội thất hoặc chờ nhận nhà mới.
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Gợi ý: Kho M (6m²)</span>
                {renderCta('Chọn cỡ M', 'standard', 'secondary', 'M')}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="h-44 overflow-hidden bg-slate-100">
                  <img
                    alt="Chủ shop sắp xếp thùng hàng hóa lên kệ trong ô kho"
                    className="w-full h-full object-cover"
                    src="/assets/landing/use-mua.png"
                  />
                </div>
                <div className="p-5">
                  <span className="inline-block text-[11px] font-semibold text-[#439782] bg-[#f2f9f7] px-2.5 py-0.5 rounded-full mb-2">
                    Shop Online &amp; Doanh nghiệp
                  </span>
                  <h4 className="font-bold text-base text-[#0a1614] mb-1.5">
                    Lưu trữ hàng hóa &amp; Hồ sơ
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Giảm chi phí thuê mặt bằng đắt đỏ nhờ kho trung tâm quận nội thành, dễ dàng sắp xếp kệ và xuất nhập hàng.
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Gợi ý: Kho L (10m²)</span>
                {renderCta('Chọn cỡ L', 'standard', 'secondary', 'L')}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="h-44 overflow-hidden bg-slate-100">
                  <img
                    alt="Hệ thống camera an ninh giám sát 24/7 tại kho"
                    className="w-full h-full object-cover"
                    src="/assets/landing/camera.png"
                  />
                </div>
                <div className="p-5">
                  <span className="inline-block text-[11px] font-semibold text-[#439782] bg-[#f2f9f7] px-2.5 py-0.5 rounded-full mb-2">
                    An tâm tuyệt đối
                  </span>
                  <h4 className="font-bold text-base text-[#0a1614] mb-1.5">
                    Đồ nhạy cảm ẩm &amp; Tài sản quý
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kho máy lạnh ổn định 20–25°C kết hợp camera giám sát 24/7 và gói bảo vệ tài sản lên tới 50 triệu đồng.
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Gợi ý: Kho Máy Lạnh</span>
                {renderCta('Xem kho lạnh', 'climate', 'secondary', 'S')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


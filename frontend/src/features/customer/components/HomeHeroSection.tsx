import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, KeyRound, Thermometer, MapPin, ShieldCheck, Box } from 'lucide-react';
import { HomeSearchBar, type HomeSearchBarProps } from './HomeSearchBar';

interface SizePreviewOption {
  code: 'XS' | 'S' | 'M' | 'L' | 'XL';
  area: string;
  dimensions: string;
  fitSummary: string;
  idealFor: string;
  image: string;
}

const SIZE_PREVIEW_OPTIONS: SizePreviewOption[] = [
  {
    code: 'XS',
    area: '1 m²',
    dimensions: '1.0m × 1.0m × 2.5m',
    fitSummary: '2–3 vali du lịch, 5–8 thùng carton hồ sơ hoặc đồ cá nhân sinh viên.',
    idealFor: 'Du lịch, lưu hồ sơ nhỏ',
    image: '/assets/landing/unit-nho.png',
  },
  {
    code: 'S',
    area: '3 m²',
    dimensions: '1.5m × 2.0m × 2.5m',
    fitSummary: '1 xe máy + 10–15 thùng đồ phòng trọ, quạt, bàn gấp và vật dụng gia đình.',
    idealFor: 'Phòng trọ, đồ cá nhân',
    image: '/assets/landing/unit-nho.png',
  },
  {
    code: 'M',
    area: '6 m²',
    dimensions: '2.0m × 3.0m × 2.5m',
    fitSummary: 'Trọn bộ đồ căn hộ 1–2 phòng ngủ: sofa, tủ lạnh, nệm, máy giặt và 20–30 thùng.',
    idealFor: 'Chuyển nhà, sửa nhà',
    image: '/assets/landing/unit-vua.png',
  },
  {
    code: 'L',
    area: '10 m²',
    dimensions: '2.5m × 4.0m × 2.5m',
    fitSummary: 'Nội thất nhà 2–3 phòng ngủ hoặc hàng tồn kho shop online xếp kệ gọn gàng.',
    idealFor: 'Shop online, gia đình lớn',
    image: '/assets/landing/unit-lon.jpg',
  },
  {
    code: 'XL',
    area: '15 m²',
    dimensions: '3.0m × 5.0m × 2.5m',
    fitSummary: 'Kho hàng doanh nghiệp, nhiều kệ pallet, thiết bị văn phòng và hàng sự kiện.',
    idealFor: 'Doanh nghiệp B2B',
    image: '/assets/landing/unit-lon.jpg',
  },
];

interface HomeHeroSectionProps extends HomeSearchBarProps {
  primaryFacilityId?: number | string;
  facilitiesCount: number;
  onScrollToId: (id: string) => void;
}

/**
 * Hero Section cân đối 12 cột:
 * - Cột trái (7 cột): Thông điệp mộc mạc, trung thực theo nghiệp vụ thật + CTA đặt kho
 * - Cột phải (5 cột): Thẻ ước lượng nhanh 5 kích thước ô kho (XS..XL) giúp khách chọn đúng nhu cầu
 * - Đáy Hero: Thanh HomeSearchBar gắn liền
 */
export const HomeHeroSection: React.FC<HomeHeroSectionProps> = ({
  primaryFacilityId,
  facilitiesCount,
  onScrollToId,
  ...searchBarProps
}) => {
  const [activeSize, setActiveSize] = useState<SizePreviewOption['code']>('M');
  const currentPreview =
    SIZE_PREVIEW_OPTIONS.find((item) => item.code === activeSize) ?? SIZE_PREVIEW_OPTIONS[2];

  const buildUnitPickerUrl = (extra?: { size?: string }) => {
    if (!primaryFacilityId) return '#branches';
    const params = new URLSearchParams({ facility: String(primaryFacilityId) });
    if (extra?.size) {
      params.set('size', extra.size);
    }
    return `/customer/units?${params.toString()}`;
  };

  return (
    <section className="relative bg-gradient-to-br from-[#125449] via-[#1c6e60] to-[#11473e] border-b border-teal-700/40 overflow-hidden">
      {/* Ánh sáng nền nhẹ giúp tổng thể tươi tắn, đồng bộ trang Đăng nhập */}
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[380px] h-[380px] bg-teal-200/15 rounded-full blur-3xl pointer-events-none" />

      {/* Ảnh nền cơ sở thực tế + lớp phủ xanh ngọc hài hòa */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          alt="Cơ sở kho tự quản SmartStorage"
          className="w-full h-full object-cover opacity-25 object-center"
          src="/assets/landing/hero-green.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#125449]/92 via-[#186054]/80 to-[#11473e]/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#11473e]/90 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* CỘT TRÁI (7 cột): Nội dung giá trị cốt lõi */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-100 border border-white/20 text-xs font-semibold backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              <span>Hệ thống kho tự quản SmartStorage</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-white tracking-tight leading-[1.2]">
              Không gian gửi đồ sạch đẹp,{' '}
              <br className="hidden sm:inline" />
              <span className="text-emerald-200 whitespace-nowrap">an toàn &amp; chủ động</span>{' '}
              theo nhu cầu
            </h1>

            <p className="text-sm sm:text-base text-teal-50/90 max-w-xl leading-relaxed">
              Thuê ô kho riêng từ 1m² đến 15m² theo tháng. Đặt giữ chỗ trực tuyến trong 48 giờ,
              thanh toán minh bạch qua VNPay và quản lý mã PIN 6 số ngay trên cổng khách hàng.
            </p>

            {/* 3 điểm chứng thực thực tế */}
            <div className="grid grid-cols-3 gap-3 pt-1 max-w-xl">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <div className="flex items-center gap-1.5 text-emerald-200">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-sm sm:text-base text-white">PIN 6 số</span>
                </div>
                <span className="text-[11px] text-teal-100/90 block mt-0.5">
                  Khóa riêng từng ô kho
                </span>
              </div>

              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <div className="flex items-center gap-1.5 text-emerald-200">
                  <Thermometer className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-sm sm:text-base text-white">20–25°C</span>
                </div>
                <span className="text-[11px] text-teal-100/90 block mt-0.5">
                  Có kho máy lạnh chống ẩm
                </span>
              </div>

              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <div className="flex items-center gap-1.5 text-emerald-200">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-sm sm:text-base text-white">
                    {facilitiesCount > 0 ? `${facilitiesCount} cơ sở` : '3 cơ sở'}
                  </span>
                </div>
                <span className="text-[11px] text-teal-100/90 block mt-0.5">
                  Hà Nội &amp; TP.HCM
                </span>
              </div>
            </div>

            {/* CTAs chính */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {primaryFacilityId ? (
                <Link
                  to={buildUnitPickerUrl()}
                  className="px-6 py-3 rounded-xl bg-white text-[#125449] font-bold text-sm hover:bg-emerald-50 transition-all shadow-md flex items-center gap-2 active:scale-[0.98]"
                >
                  <span>Đặt kho trực tuyến ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onScrollToId('branches')}
                  className="px-6 py-3 rounded-xl bg-white text-[#125449] font-bold text-sm hover:bg-emerald-50 transition-all shadow-md flex items-center gap-2 active:scale-[0.98] cursor-pointer"
                >
                  <span>Chọn cơ sở gần bạn</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onScrollToId('unit-types')}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-medium text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Xem bảng loại kho</span>
              </button>
            </div>
          </div>

          {/* CỘT PHẢI (5 cột): Thẻ ước lượng nhanh kích thước kho (Lấp đầy khoảng trống & Giải tỏa nỗi lo chọn size) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden text-[#0a1614]">
              <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#439782] block">
                    Ước lượng nhanh
                  </span>
                  <h2 className="text-sm font-bold text-[#0a1614]">
                    Kho cỡ nào vừa với đồ nhà bạn?
                  </h2>
                </div>
                <Box className="w-5 h-5 text-[#57b29a] shrink-0" />
              </div>

              {/* 5 nút chọn Size XS - XL */}
              <div className="px-5 pt-3">
                <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#f2f9f7] rounded-xl border border-slate-200/70">
                  {SIZE_PREVIEW_OPTIONS.map((opt) => {
                    const isActive = opt.code === activeSize;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => setActiveSize(opt.code)}
                        className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#57b29a] text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:bg-white/80 font-medium'
                        }`}
                      >
                        <span className="block text-xs leading-tight">{opt.code}</span>
                        <span
                          className={`block text-[10px] leading-tight ${
                            isActive ? 'text-teal-50' : 'text-slate-400'
                          }`}
                        >
                          {opt.area}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chi tiết kích thước đang chọn */}
              <div className="p-5 space-y-3">
                <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70">
                  <img
                    src={currentPreview.image}
                    alt={`Kho kích thước ${currentPreview.code}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-bold">
                      Cỡ {currentPreview.code} · {currentPreview.area}
                    </span>
                    <span className="font-mono text-[11px] bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      {currentPreview.dimensions}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="inline-block text-[11px] font-semibold text-[#439782] bg-[#f2f9f7] px-2.5 py-0.5 rounded-full">
                    Phù hợp: {currentPreview.idealFor}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                    {currentPreview.fitSummary}
                  </p>
                </div>

                {primaryFacilityId ? (
                  <Link
                    to={buildUnitPickerUrl({ size: currentPreview.code })}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#125449] hover:bg-[#0e4239] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span>Tìm ô kho cỡ {currentPreview.code} ({currentPreview.area})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onScrollToId('branches')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#125449] hover:bg-[#0e4239] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Xem chi nhánh có sẵn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm nhanh gắn đáy Hero */}
        <div className="mt-8">
          <HomeSearchBar {...searchBarProps} />
        </div>
      </div>
    </section>
  );
};


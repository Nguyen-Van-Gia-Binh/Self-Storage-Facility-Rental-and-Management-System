import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Thermometer,
  Warehouse,
  Home,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import type { UnitTypeResponse } from '@/types/unit';
import { formatVND } from '../utils/pricing';
import { isClimateUnitType } from '../utils/unitPickerHelpers';

interface HomeSizeGuideSectionProps {
  primaryFacilityId?: number | string;
  unitTypes?: UnitTypeResponse[];
  onScrollToBranches: () => void;
}

/**
 * So sánh 2 dòng kho thực tế (Tiêu chuẩn & Máy lạnh) theo phong cách tối giản, ít chữ,
 * không dùng ảnh công nghiệp lớn gây nặng mắt. Dữ liệu giá lấy trực tiếp từ Backend API.
 */
export const HomeSizeGuideSection: React.FC<HomeSizeGuideSectionProps> = ({
  primaryFacilityId,
  unitTypes = [],
  onScrollToBranches,
}) => {
  const { minStandardPrice, minClimatePrice } = useMemo(() => {
    let stdMin = 350000;
    let acMin = 500000;
    const stdPrices = unitTypes
      .filter((ut) => !isClimateUnitType(ut) && (ut.monthlyPrice ?? 0) > 0)
      .map((ut) => ut.monthlyPrice as number);
    const acPrices = unitTypes
      .filter((ut) => isClimateUnitType(ut) && (ut.monthlyPrice ?? 0) > 0)
      .map((ut) => ut.monthlyPrice as number);

    if (stdPrices.length > 0) stdMin = Math.min(...stdPrices);
    if (acPrices.length > 0) acMin = Math.min(...acPrices);
    return { minStandardPrice: stdMin, minClimatePrice: acMin };
  }, [unitTypes]);

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
    <section className="py-12 sm:py-14 bg-[#f2f9f7] border-b border-slate-200/80" id="unit-types">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Phần A: So sánh tối giản 2 dòng kho */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[#439782] text-xs font-bold uppercase tracking-wider block mb-1">
              2 Dòng Kho Tại SmartStorage
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
              Chọn đúng môi trường bảo quản
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* CARD 1: Kho Tiêu Chuẩn */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-[#f2f9f7] border border-slate-200/80 flex items-center justify-center text-[#439782] shrink-0">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-[#0a1614] leading-snug">
                        Kho Tiêu Chuẩn
                      </h3>
                      <span className="text-xs text-slate-500 block mt-0.5 whitespace-nowrap">
                        5 cỡ XS – XL (1m² – 15m²)
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 whitespace-nowrap">
                    <span className="text-[11px] text-slate-400 block">Giá từ</span>
                    <span className="font-bold text-base text-[#125449]">
                      {formatVND(minStandardPrice)}
                      <span className="text-xs font-normal text-slate-500">/tháng</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Phù hợp nội thất gia đình, vali, đồ dọn nhà và hàng đóng thùng thông thường.
                </p>

                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                    Thông gió tự nhiên, khô ráo và PCCC tự động
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                    Khóa mã PIN 6 số riêng tư, giám sát camera 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                    Tiết kiệm chi phí nhất cho gửi đồ ngắn &amp; dài hạn
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Kèm bảo vệ cơ bản 10tr</span>
                {renderCta('Xem ô kho Tiêu chuẩn', 'standard', 'secondary')}
              </div>
            </div>

            {/* CARD 2: Kho Máy Lạnh */}
            <div className="bg-white rounded-2xl border-2 border-[#57b29a] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-[#57b29a] flex items-center justify-center text-white shadow-xs shrink-0">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-[#0a1614] leading-snug">
                        Kho Máy Lạnh
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          5 cỡ XS – XL
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f2f9f7] text-[#125449] border border-[#57b29a]/30 whitespace-nowrap">
                          20°C – 25°C
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 whitespace-nowrap">
                    <span className="text-[11px] text-slate-400 block">Giá từ</span>
                    <span className="font-bold text-base text-[#125449]">
                      {formatVND(minClimatePrice)}
                      <span className="text-xs font-normal text-slate-500">/tháng</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Dành cho mỹ phẩm, đồ gỗ quý, đồ da, nhạc cụ, thiết bị điện tử và hồ sơ nhạy cảm ẩm.
                </p>

                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                    Điều hòa duy trì 20°C – 25°C ngày đêm, chống ẩm mốc
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                    Khóa mã PIN 6 số riêng tư, giám sát camera 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                    Tùy chọn nâng cấp gói bảo vệ hàng hóa tới 50 triệu đồng
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-[#439782] font-semibold">Bảo quản tối ưu</span>
                {renderCta('Chọn kho Máy lạnh', 'climate', 'primary')}
              </div>
            </div>
          </div>
        </div>

        {/* Phần B: 3 Tình huống gợi ý gọn nhẹ (Không nhồi ảnh công nghiệp) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <Link
            to={buildUnitLink('standard', 'M')}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#57b29a] hover:shadow-sm transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#f2f9f7] text-[#439782] flex items-center justify-center shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs sm:text-sm text-[#0a1614] group-hover:text-[#439782] transition-colors">
                Chuyển &amp; sửa nhà
              </h4>
              <p className="text-[11px] text-slate-500 truncate">Sofa, nệm, tủ lạnh · Gợi ý Cỡ M</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#57b29a] shrink-0" />
          </Link>

          <Link
            to={buildUnitLink('standard', 'L')}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#57b29a] hover:shadow-sm transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#f2f9f7] text-[#439782] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs sm:text-sm text-[#0a1614] group-hover:text-[#439782] transition-colors">
                Shop Online &amp; B2B
              </h4>
              <p className="text-[11px] text-slate-500 truncate">Hàng hóa, hồ sơ · Gợi ý Cỡ L</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#57b29a] shrink-0" />
          </Link>

          <Link
            to={buildUnitLink('climate', 'S')}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#57b29a] hover:shadow-sm transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#f2f9f7] text-[#439782] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs sm:text-sm text-[#0a1614] group-hover:text-[#439782] transition-colors">
                Đồ giá trị, nhạy ẩm
              </h4>
              <p className="text-[11px] text-slate-500 truncate">Mỹ phẩm, máy ảnh · Kho Máy lạnh</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#57b29a] shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  );
};

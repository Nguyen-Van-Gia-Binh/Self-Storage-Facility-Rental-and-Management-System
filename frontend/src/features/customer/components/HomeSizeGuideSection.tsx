import React, { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { UnitTypeResponse } from '@/types/unit';
import pixelStandardImg from '@/assets/images/pixel-standard-unit.jpg';
import pixelClimateImg from '@/assets/images/pixel-climate-unit.jpg';
import pixelUsecaseHomeImg from '@/assets/images/pixel-usecase-1-home.png';
import pixelUsecaseBusinessImg from '@/assets/images/pixel-usecase-2-business.png';
import pixelUsecaseValuablesImg from '@/assets/images/pixel-usecase-3-valuables.png';
import { formatVND } from '../utils/pricing';
import { isClimateUnitType } from '../utils/unitPickerHelpers';

interface HomeSizeGuideSectionProps {
  unitTypes?: UnitTypeResponse[];
}

const USE_CASES = [
  {
    code: 'GIA ĐÌNH',
    title: 'Chuyển nhà & Sửa nhà',
    desc: 'Gửi gọn sofa, tủ lạnh và thùng đồ chờ ngày về nhà mới.',
    tag: 'Gợi ý Cỡ M (6 m²)',
    imageSrc: pixelUsecaseHomeImg,
  },
  {
    code: 'KINH DOANH',
    title: 'Kinh doanh & Lưu hồ sơ',
    desc: 'Lưu hàng đóng kiện & chứng từ cần ra vào lấy thường xuyên.',
    tag: 'Gợi ý Cỡ L (10 m²)',
    imageSrc: pixelUsecaseBusinessImg,
  },
  {
    code: 'ĐỒ GIÁ TRỊ',
    title: 'Đồ giá trị, nhạy ẩm',
    desc: 'Mỹ phẩm, máy ảnh, đồ da, tranh ảnh cần giữ ổn định 20°C–25°C.',
    tag: 'Kho Máy Lạnh · Cỡ S',
    imageSrc: pixelUsecaseValuablesImg,
  },
];

/**
 * Bento Grid bất đối xứng (phong cách Cofounder) kết hợp minh họa Pixel-Art:
 * - Nền viền cây xanh & hoa cỏ nhẹ hai bên lề (#eef5fb)
 * - Hàng trên: 2 khối lớn so sánh Kho Máy Lạnh (7/12) & Kho Tiêu Chuẩn (5/12) lấy giá thật từ API.
 * - Hàng dưới: 3 khối gợi ý theo nhu cầu thực tế kèm minh họa Pixel-Art riêng biệt.
 */
export const HomeSizeGuideSection: React.FC<HomeSizeGuideSectionProps> = ({
  unitTypes = [],
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

  return (
    <section
      className="py-16 sm:py-20 bg-[#f3f8fc] border-b border-sky-200/70 scroll-mt-16"
      id="unit-types"
    >
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="font-pixel text-[#0c5a8a] text-[13px] font-medium uppercase tracking-wider block mb-2">
            Hai Dòng Kho
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#0a1614] tracking-tight">
            Chọn môi trường bảo quản
          </h2>
        </div>

        {/* Hàng trên: Bento Grid bất đối xứng 7/12 + 5/12 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* BENTO 1 (7 cột): Kho Máy Lạnh kèm Pixel-Art Diorama 60fps */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-sky-200/90 shadow-xs overflow-hidden grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-6 p-6 sm:p-7 flex flex-col justify-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-xl text-[#0a1614]">Kho Máy Lạnh</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e8f4fc] text-[#0c5a8a] border border-sky-200 whitespace-nowrap">
                  20°C – 25°C
                </span>
              </div>

              <div>
                <span className="text-[13px] text-slate-600 block">Giá thuê từ</span>
                <span className="font-bold text-2xl text-[#0c5a8a]">
                  {formatVND(minClimatePrice)}
                  <span className="text-sm font-medium text-slate-600">/tháng</span>
                </span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                Kiểm soát nhiệt ẩm 24/7 cho mỹ phẩm, đồ da, máy ảnh và hồ sơ.
              </p>

              <ul className="space-y-2 text-[13px] text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0284c7] shrink-0" />
                  Điều hòa ổn định 24/7, chống ẩm mốc
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0284c7] shrink-0" />
                  Khóa mã PIN 6 số riêng, tự đổi mã trên web
                </li>
              </ul>
            </div>

            <div className="sm:col-span-6 bg-[#eff8fb] relative min-h-[240px] flex items-center justify-center overflow-hidden border-t sm:border-t-0 sm:border-l border-slate-200/80">
              <img
                src={pixelClimateImg}
                alt="Minh họa Pixel-Art kho máy lạnh 20-25 độ SmartStorage"
                className="w-full h-full object-cover object-center hero-ken-burns"
              />
              {/* 3 hạt pixel khí mát thổi ra từ điều hòa */}
              <span
                aria-hidden="true"
                style={{ left: '34%', top: '30%' }}
                className="absolute w-1.5 h-1.5 bg-sky-400 pixel-cool-float-1 pointer-events-none"
              />
              <span
                aria-hidden="true"
                style={{ left: '38%', top: '32%' }}
                className="absolute w-1.5 h-1.5 bg-cyan-300 pixel-cool-float-2 pointer-events-none"
              />
              <span
                aria-hidden="true"
                style={{ left: '32%', top: '34%' }}
                className="absolute w-1.5 h-1.5 bg-sky-300 pixel-cool-float-3 pointer-events-none"
              />
            </div>
          </div>

          {/* BENTO 2 (5 cột): Kho Tiêu Chuẩn kèm minh họa rõ nét vừa khung */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/95 shadow-xs overflow-hidden flex flex-col justify-between">
            <div className="h-56 sm:h-60 bg-[#ecf7ef] flex items-center justify-center p-2 border-b border-slate-200/80">
              <img
                src={pixelStandardImg}
                alt="Minh họa kho tiêu chuẩn SmartStorage"
                className="h-full w-auto object-contain"
              />
            </div>

            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-center gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xl text-[#0a1614]">Kho Tiêu Chuẩn</h3>
                  <span className="text-[13px] text-slate-600 block mt-0.5 whitespace-nowrap">
                    5 cỡ XS – XL (1m² – 15m²)
                  </span>
                </div>
                <div className="text-right shrink-0 whitespace-nowrap">
                  <span className="text-[13px] text-slate-600 block">Giá từ</span>
                  <span className="font-bold text-xl text-[#0c5a8a]">
                    {formatVND(minStandardPrice)}
                    <span className="text-xs font-medium text-slate-600">/tháng</span>
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                Thông gió khô ráo, PCCC tự động — tối ưu cho nội thất, vali và hàng đóng thùng.
              </p>

              <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700 pt-1">
                <CheckCircle2 className="w-4 h-4 text-[#0284c7] shrink-0" />
                <span>Camera an ninh 24/7 &amp; PCCC tự động đạt chuẩn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hàng dưới: 3 Khối Nhu Cầu Trọng Tâm kèm minh họa Pixel-Art */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {USE_CASES.map((uc) => (
            <div
              key={uc.code}
              className="bg-white/95 backdrop-blur-xs rounded-2xl border border-sky-200/80 p-5 sm:p-6 shadow-2xs space-y-3.5 flex flex-col justify-between"
            >
              <div className="h-40 rounded-2xl bg-[#f4f9fe] border border-sky-100/90 flex items-center justify-center p-3 overflow-hidden">
                <img
                  src={uc.imageSrc}
                  alt={`Minh họa ${uc.title}`}
                  className="h-full w-auto object-contain"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-pixel text-[13px] font-medium text-[#0c5a8a] tracking-wider">
                    {uc.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f4fc] text-[#0c5a8a] border border-sky-200/80">
                    {uc.tag}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-[#0a1614]">{uc.title}</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{uc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React, { useState, useMemo } from 'react';
import { ArrowRight, Plus, Minus, RotateCcw } from 'lucide-react';
import type { UnitTypeResponse } from '@/types/unit';
import heroCofounderImg from '@/assets/images/hero-cofounder-clean.webp';
import { resolveSizeCategory } from '../utils/unitPickerHelpers';
import { StorageUnit3DPreview, type UnitSpec3D } from './StorageUnit3DPreview';
import {
  EMPTY_ESTIMATOR_COUNTS,
  INITIAL_SAMPLE_COUNTS,
  STORAGE_ESTIMATOR_ITEMS,
  recommendUnitSize,
  sumItemCounts,
  type EstimatorItemCounts,
  type EstimatorItemKey,
} from '../utils/storageEstimator';

type SizeCode = UnitSpec3D['code'];

// Thông số chuẩn theo V16__standardize_unit_types_and_sizes.sql (làm fallback trước khi API tải xong)
const DEFAULT_UNIT_SPECS: Record<SizeCode, UnitSpec3D> = {
  XS: { code: 'XS', widthM: 1.0, lengthM: 1.0, heightM: 2.5, areaM2: 1.0, volumeM3: 2.5 },
  S: { code: 'S', widthM: 1.5, lengthM: 2.0, heightM: 2.5, areaM2: 3.0, volumeM3: 7.5 },
  M: { code: 'M', widthM: 2.0, lengthM: 3.0, heightM: 2.5, areaM2: 6.0, volumeM3: 15.0 },
  L: { code: 'L', widthM: 2.5, lengthM: 4.0, heightM: 2.5, areaM2: 10.0, volumeM3: 25.0 },
  XL: { code: 'XL', widthM: 3.0, lengthM: 5.0, heightM: 3.0, areaM2: 15.0, volumeM3: 45.0 },
};

const SIZE_ORDER: SizeCode[] = ['XS', 'S', 'M', 'L', 'XL'];

const DRIFT_CLOUDS = [
  { left: '46%', top: '7%', width: '132px', duration: '34s', delay: '-6s' },
  { left: '61%', top: '17%', width: '104px', duration: '42s', delay: '-21s' },
];

const FLOATING_LEAVES = [
  { left: '72%', top: '16%', size: 12, color: '#a3e635', duration: '9.5s', delay: '-1.5s' },
  { left: '84%', top: '13%', size: 11, color: '#bef264', duration: '11s', delay: '-4.8s' },
  { left: '91%', top: '24%', size: 13, color: '#84cc16', duration: '10.2s', delay: '-7.2s' },
  { left: '78%', top: '28%', size: 10, color: '#fde047', duration: '12s', delay: '-3.1s' },
  { left: '88%', top: '34%', size: 11, color: '#65a30d', duration: '9.8s', delay: '-8.4s' },
];

const RIVER_GLINTS = [
  { left: '7%', top: '63%', width: '22px', delay: '0s' },
  { left: '15%', top: '66%', width: '28px', delay: '-1.4s' },
  { left: '23%', top: '62%', width: '18px', delay: '-2.3s' },
  { left: '11%', top: '68%', width: '20px', delay: '-0.8s' },
];

interface HomeHeroSectionProps {
  unitTypes?: UnitTypeResponse[];
  onScrollToId: (id: string) => void;
}

/**
 * Hero phong cách Keytail × Cofounder:
 * - Phần đầu nền xanh ngọc sâu chuyển sắc mượt xuống nền trắng sáng
 * - Tiêu đề lớn 1 màu trắng dứt khoát, không lặp thẻ icon nhỏ
 * - Sân khấu nổi gồm Diorama sống động 60fps + Mô hình 3D kích thước thực tế V16
 */
export const HomeHeroSection: React.FC<HomeHeroSectionProps> = ({
  unitTypes = [],
  onScrollToId,
}) => {
  const [activeSize, setActiveSize] = useState<SizeCode>('M');
  const [env, setEnv] = useState<'STANDARD' | 'CLIMATE_CONTROLLED'>('STANDARD');
  const [itemCounts, setItemCounts] = useState<EstimatorItemCounts>({ ...INITIAL_SAMPLE_COUNTS });

  // Đồng bộ kích thước thực tế từ API Backend (fallback về chuẩn V16 nếu chưa tải xong)
  const resolvedSpecs = useMemo(() => {
    const map: Record<SizeCode, UnitSpec3D> = {
      XS: { ...DEFAULT_UNIT_SPECS.XS },
      S: { ...DEFAULT_UNIT_SPECS.S },
      M: { ...DEFAULT_UNIT_SPECS.M },
      L: { ...DEFAULT_UNIT_SPECS.L },
      XL: { ...DEFAULT_UNIT_SPECS.XL },
    };

    unitTypes.forEach((ut) => {
      const code = resolveSizeCategory(ut.code || ut.name, ut.areaM2) as SizeCode;
      if (!map[code]) return;
      if (ut.widthM && ut.depthM && ut.heightM) {
        map[code].widthM = ut.widthM;
        map[code].lengthM = ut.depthM;
        map[code].heightM = ut.heightM;
        map[code].areaM2 = ut.areaM2 || Number((ut.widthM * ut.depthM).toFixed(1));
        map[code].volumeM3 =
          ut.volumeM3 || Number((ut.widthM * ut.depthM * ut.heightM).toFixed(1));
      }
    });

    return map;
  }, [unitTypes]);

  const totalItems = sumItemCounts(itemCounts);
  const recommendedSize = useMemo(
    () => recommendUnitSize(resolvedSpecs, itemCounts),
    [resolvedSpecs, itemCounts]
  );

  const handleItemDelta = (key: EstimatorItemKey, delta: number) => {
    setItemCounts((prev) => {
      const nextVal = Math.max(0, Math.min(99, prev[key] + delta));
      return { ...prev, [key]: nextVal };
    });
  };

  const resetItems = () => {
    setItemCounts({ ...EMPTY_ESTIMATOR_COUNTS });
  };

  const currentSpec = resolvedSpecs[activeSize];

  return (
    <section className="relative bg-white overflow-hidden border-b border-slate-200/80">
      {/* 1. Hero Full-Bleed Phong cách Cofounder (Bầu trời mượt + Lớp gradient tối tăng tương phản vùng chữ) */}
      <div className="relative bg-gradient-to-b from-[#072e5a] via-[#0b4b8a] to-[#0f6dc2] md:bg-none">
        <div className="relative w-full md:aspect-[16/9] md:min-h-[500px] lg:min-h-[580px] md:max-h-[740px] overflow-hidden border-b border-emerald-950/10 flex flex-col-reverse md:block">
          {/* Nền tranh minh họa sắc nét 16:9 (không sọc ngang) + chuyển động mây & lá cây 60fps */}
          <div className="relative w-full aspect-[16/9] md:aspect-auto md:absolute md:inset-0 overflow-hidden">
            <img
              src={heroCofounderImg}
              alt="Không gian lưu trữ tự quản SmartStorage tại công viên xanh"
              className="w-full h-full object-cover object-[72%_100%] md:object-bottom select-none hero-scene-breathe"
            />

            {/* Các lớp chuyển động tự nhiên (mây bay, nắng xuyên tán cây, lá rơi nhẹ, gợn nước) */}
            <div
              data-testid="hero-ambient-motion"
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {/* Tia nắng vàng nhẹ xuyên qua tán cây bên phải */}
              <div
                className="hidden sm:block absolute -top-12 right-0 w-[44%] h-[78%] hero-sunbeam-sway"
                style={{
                  background:
                    'linear-gradient(125deg, rgba(254, 249, 195, 0.32) 0%, rgba(254, 240, 138, 0.14) 36%, transparent 72%)',
                  clipPath: 'polygon(52% 0%, 100% 0%, 100% 62%, 14% 100%, 4% 80%)',
                }}
              />

              {/* Mây trôi nhẹ phía bầu trời bên phải (không che chữ bên trái) */}
              {DRIFT_CLOUDS.map((cloud, idx) => (
                <svg
                  key={idx}
                  viewBox="0 0 120 44"
                  style={{
                    left: cloud.left,
                    top: cloud.top,
                    width: cloud.width,
                    animationDuration: cloud.duration,
                    animationDelay: cloud.delay,
                  }}
                  className="hidden md:block absolute hero-cloud-drift drop-shadow-[0_2px_6px_rgba(255,255,255,0.2)]"
                >
                  <path
                    d="M18 36h80c10 0 16-6 16-13 0-6-5-11-12-12-2-7-9-11-17-11-6 0-12 3-15 8-3-2-6-3-10-3-8 0-14 5-15 12-5 1-9 5-9 10 0 5 5 9 12 9z"
                    fill="rgba(255, 255, 255, 0.72)"
                  />
                </svg>
              ))}

              {/* Lá cây khẽ bay xuống từ tán cây công viên bên phải */}
              {FLOATING_LEAVES.map((leaf, idx) => (
                <svg
                  key={idx}
                  viewBox="0 0 16 16"
                  style={{
                    left: leaf.left,
                    top: leaf.top,
                    width: `${leaf.size}px`,
                    height: `${leaf.size}px`,
                    animationDuration: leaf.duration,
                    animationDelay: leaf.delay,
                  }}
                  className="absolute hero-leaf-float"
                >
                  <path
                    d="M13.5 2.5C8 2.5 3.5 5.5 2.5 11.5c5.5-0.5 9.5-3.5 11-9z"
                    fill={leaf.color}
                    stroke="#3f6212"
                    strokeWidth="0.6"
                    strokeOpacity="0.45"
                  />
                </svg>
              ))}

              {/* Gợn nắng lấp lánh nhẹ trên mặt sông bên trái */}
              {RIVER_GLINTS.map((glint, idx) => (
                <span
                  key={idx}
                  style={{
                    left: glint.left,
                    top: glint.top,
                    width: glint.width,
                    animationDelay: glint.delay,
                  }}
                  className="hidden sm:block absolute h-[2px] rounded-full bg-white/80 hero-water-sparkle"
                />
              ))}
            </div>

            {/* Lớp gradient tối bên trái & góc trên-trái để chữ trắng + mô tả đọc rõ trên nền trời & mây sáng */}
            <div
              data-testid="hero-text-scrim"
              aria-hidden="true"
              className="hidden md:block absolute inset-0 pointer-events-none bg-gradient-to-r from-[#041b35]/85 via-[#072d57]/58 via-45% to-transparent"
            />
            <div
              aria-hidden="true"
              className="hidden md:block absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(4,24,48,0.55)_0%,transparent_65%)]"
            />

            {/* Nhịp sáng nhẹ trên màn tablet QR & mã PIN ở góc phải dưới */}
            <div
              aria-hidden="true"
              style={{ left: '81.6%', top: '76.5%' }}
              className="hidden lg:flex absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-85" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.95)]" />
              </span>
            </div>
          </div>

          {/* Nội dung Hero duy nhất: Mobile xếp trên ảnh nền xanh đậm; Desktop nằm trên vùng scrim tối góc trái */}
          <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-6 md:pt-10 lg:pt-12 xl:pt-14 md:pb-0">
            <div
              style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif" }}
              className="max-w-xl lg:max-w-[580px] space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#041f3d]/45 backdrop-blur-xs border border-white/35 text-xs font-medium uppercase tracking-[0.08em] text-white shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 pixel-beacon" />
                <span className="font-pixel text-[13px] tracking-[0.06em]">SmartStorage Việt Nam</span>
              </div>

              <h1
                style={{ lineHeight: 1.32, letterSpacing: '-0.005em' }}
                className="text-3xl sm:text-4xl lg:text-[2.35rem] xl:text-[2.55rem] font-semibold text-white drop-shadow-[0_2px_14px_rgba(3,20,44,0.55)]"
              >
                Không gian lưu trữ tự quản
                <br className="hidden sm:inline" /> hiện đại và an toàn
              </h1>

              <p
                style={{ lineHeight: 1.65, letterSpacing: '0.005em' }}
                className="text-sm sm:text-[15px] text-white max-w-[440px] font-normal drop-shadow-[0_2px_10px_rgba(3,20,44,0.65)]"
              >
                Gửi đồ cá nhân, nội thất và hàng hóa linh hoạt theo nhu cầu — đặt giữ chỗ trực tuyến nhanh gọn, chủ động ra vào mỗi ngày.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onScrollToId('branches')}
                  style={{ ['--tactile-shadow' as string]: '#93c5fd' }}
                  className="btn-tactile px-6 py-3 rounded-full bg-white text-[#0c5a8a] font-bold text-sm hover:bg-sky-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Đặt kho ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onScrollToId('size-estimator')}
                  style={{ ['--tactile-shadow' as string]: 'rgba(3, 21, 44, 0.7)' }}
                  className="btn-tactile px-6 py-3 rounded-full bg-[#041f3d]/60 hover:bg-[#041f3d]/80 backdrop-blur-xs border border-white/50 text-white font-semibold text-sm cursor-pointer"
                >
                  Ước lượng cỡ kho 3D
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dải công cụ Ước lượng không gian 3D thực tế (V16) ngay bên dưới bức tranh */}
      <div
        id="size-estimator"
        className="bg-gradient-to-b from-[#eff6fc] to-white py-8 sm:py-10 scroll-mt-16"
      >
        <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Card Ước lượng 3D cân đối 2 cột */}
          <div className="bg-white rounded-3xl border border-sky-200/80 shadow-[0_18px_48px_-18px_rgba(12,90,138,0.14)] p-5 sm:p-7 space-y-5 text-[#0a1614]">
            {/* Header + Chuyển dòng kho */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0a1614]">
                Ước lượng không gian 3D thực tế
              </h2>

              <div className="inline-flex p-1 rounded-xl bg-[#f3f8fc] border border-sky-200/80 text-[13px]">
                <button
                  type="button"
                  onClick={() => setEnv('STANDARD')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    env === 'STANDARD'
                      ? 'bg-white text-[#0c5a8a] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tiêu chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setEnv('CLIMATE_CONTROLLED')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    env === 'CLIMATE_CONTROLLED'
                      ? 'bg-white text-[#0284c7] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Máy lạnh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Cột trái: Mô hình 3D Isometric phóng to cân đối */}
              <div className="lg:col-span-6">
                <StorageUnit3DPreview
                  spec={currentSpec}
                  environment={env}
                  itemCounts={itemCounts}
                  recommendedSize={recommendedSize}
                  onSelectSize={setActiveSize}
                />
              </div>

              {/* Cột phải: 5 tab kích thước + Bộ đếm đồ đạc 2 cột thoáng rộng không cắt chữ */}
              <div className="lg:col-span-6 space-y-4">
                <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#f3f8fc] rounded-xl border border-sky-200/80">
                  {SIZE_ORDER.map((code) => {
                    const s = resolvedSpecs[code];
                    const isActive = code === activeSize;
                    return (
                      <button
                        key={code}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setActiveSize(code)}
                        style={{
                          ['--tactile-shadow' as string]: isActive ? '#06324d' : '#cbd5e1',
                        }}
                        className={`btn-tactile py-2 px-1 rounded-lg text-center cursor-pointer ${
                          isActive
                            ? 'bg-[#0c5a8a] text-white font-bold'
                            : 'bg-white/75 text-slate-700 hover:bg-white font-semibold'
                        }`}
                      >
                        <span className="block text-sm leading-tight">{code}</span>
                        <span
                          className={`block text-xs leading-tight mt-0.5 ${
                            isActive ? 'text-sky-100' : 'text-slate-500'
                          }`}
                        >
                          {s.areaM2} m²
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[13px] text-slate-700">
                    <span className="font-semibold">Thử xếp nhanh đồ đạc:</span>
                    <button
                      type="button"
                      onClick={resetItems}
                      disabled={totalItems === 0}
                      className="inline-flex items-center gap-1.5 text-[#0c5a8a] hover:underline font-semibold cursor-pointer disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Đặt lại hàng hóa
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STORAGE_ESTIMATOR_ITEMS.map((item) => {
                      const count = itemCounts[item.key];
                      return (
                        <div
                          key={item.key}
                          className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-[13px] ${
                            count > 0
                              ? 'bg-[#f3f8fc] border-[#3898cf]/70 text-[#0c5a8a] font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-[3px] shrink-0 border border-black/15"
                              style={{ backgroundColor: item.colors.left }}
                            />
                            <div className="min-w-0">
                              <span className="block leading-tight">{item.label}</span>
                              <span className="block text-[11px] text-slate-600 font-normal leading-tight mt-0.5 whitespace-nowrap">
                                {item.sizeLabel}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              aria-label={`Giảm ${item.label}`}
                              onClick={() => handleItemDelta(item.key, -1)}
                              disabled={count === 0}
                              className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-mono text-xs font-bold">{count}</span>
                            <button
                              type="button"
                              aria-label={`Tăng ${item.label}`}
                              onClick={() => handleItemDelta(item.key, 1)}
                              className="btn-tactile w-6 h-6 rounded-md bg-[#0c5a8a] text-white flex items-center justify-center hover:bg-[#084369] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

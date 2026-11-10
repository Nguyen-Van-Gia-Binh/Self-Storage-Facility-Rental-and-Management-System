import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, KeyRound, Thermometer, MapPin, Plus, Minus, RotateCcw } from 'lucide-react';
import type { UnitTypeResponse } from '@/types/unit';
import pixelCofounderHeroImg from '@/assets/images/pixel-hero-cofounder.jpg';
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

interface HomeHeroSectionProps {
  primaryFacilityId?: number | string;
  facilitiesCount: number;
  unitTypes?: UnitTypeResponse[];
  onScrollToId: (id: string) => void;
}

/**
 * Hero phong cách Keytail × Cofounder:
 * - Phần đầu nền xanh ngọc sâu chuyển sắc mượt xuống nền trắng sáng
 * - Tiêu đề lớn 1 màu trắng dứt khoát, không lặp thẻ icon nhỏ
 * - Sân khấu nổi gồm Diorama Pixel-Art sống động 60fps + Mô hình 3D kích thước thực tế V16
 */
export const HomeHeroSection: React.FC<HomeHeroSectionProps> = ({
  primaryFacilityId,
  facilitiesCount,
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
      const next = { ...prev, [key]: nextVal };
      if (sumItemCounts(next) > 0) {
        setActiveSize(recommendUnitSize(resolvedSpecs, next));
      }
      return next;
    });
  };

  const resetItems = () => {
    setItemCounts({ ...EMPTY_ESTIMATOR_COUNTS });
  };

  const currentSpec = resolvedSpecs[activeSize];

  return (
    <section className="relative bg-white overflow-hidden border-b border-slate-200/80">
      {/* 1. Hero Full-Bleed Phong cách Cofounder (Bầu trời xanh thoáng góc trái + Công viên SmartStorage Pixel-Art) */}
      <div className="relative bg-gradient-to-b from-[#0b73d8] via-[#128df2] to-[#1398fd] md:bg-none">
        <div className="relative w-full md:aspect-[16/9] md:min-h-[500px] lg:min-h-[580px] md:max-h-[740px] overflow-hidden border-b border-emerald-950/10 flex flex-col-reverse md:block">
          {/* Nền tranh Pixel-Art 16:9 sắc nét */}
          <div className="relative w-full aspect-[16/9] md:aspect-auto md:absolute md:inset-0">
            <img
              src={pixelCofounderHeroImg}
              alt="Không gian lưu trữ tự quản SmartStorage tại công viên xanh"
              className="w-full h-full object-cover object-[72%_100%] md:object-bottom select-none"
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

          {/* Nội dung Hero duy nhất: Mobile xếp trên ảnh; Desktop nằm gọn trong vùng trời xanh bên trái mây trắng */}
          <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-6 md:pt-10 lg:pt-12 xl:pt-14 md:pb-0">
            <div
              style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif" }}
              className="max-w-xl lg:max-w-[580px] space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-xs border border-white/30 text-xs font-medium uppercase tracking-[0.08em] text-white shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 pixel-beacon" />
                <span>SmartStorage Việt Nam</span>
              </div>

              <h1
                style={{ lineHeight: 1.34, letterSpacing: '-0.005em' }}
                className="text-3xl sm:text-4xl lg:text-[2.35rem] xl:text-[2.55rem] font-semibold text-white drop-shadow-[0_2px_12px_rgba(6,45,98,0.22)]"
              >
                Không gian lưu trữ tự quản
                <br className="hidden sm:inline" /> hiện đại và an toàn
              </h1>

              <p
                style={{ lineHeight: 1.65, letterSpacing: '0.005em' }}
                className="text-sm sm:text-[15px] text-white/95 max-w-[410px] font-normal drop-shadow-[0_1px_6px_rgba(6,45,98,0.2)]"
              >
                Gửi đồ cá nhân, nội thất và hàng hóa linh hoạt theo nhu cầu — đặt giữ chỗ trực tuyến nhanh gọn, chủ động ra vào mỗi ngày.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {primaryFacilityId ? (
                  <Link
                    to={`/customer/units?facility=${String(primaryFacilityId)}`}
                    className="px-6 py-3 rounded-full bg-white text-[#0c5a8a] font-bold text-sm hover:bg-sky-50 transition-all shadow-lg inline-flex items-center gap-2 active:scale-[0.98]"
                  >
                    <span>Đặt kho ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onScrollToId('branches')}
                    className="px-6 py-3 rounded-full bg-white text-[#0c5a8a] font-bold text-sm hover:bg-sky-50 transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Xem chi nhánh</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onScrollToId('branches')}
                  className="px-6 py-3 rounded-full bg-[#09478d]/35 hover:bg-[#09478d]/55 backdrop-blur-xs border border-white/40 text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  Xem {facilitiesCount > 0 ? `${facilitiesCount} cơ sở` : 'các cơ sở'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dải công cụ Ước lượng không gian 3D thực tế (V16) ngay bên dưới bức tranh */}
      <div className="bg-gradient-to-b from-[#eff6fc] to-white py-8 sm:py-10">
        <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Thanh tóm tắt 3 tiêu chuẩn nổi bật */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-[13px] sm:text-sm font-medium text-[#0c5a8a]">
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#0284c7]" />
              Mã PIN 6 số riêng tư
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-[#0284c7]" />
              Máy lạnh 20–25°C
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0284c7]" />
              Hà Nội &amp; TP.HCM
            </span>
          </div>

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
                        className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#0c5a8a] text-white shadow-xs font-bold'
                            : 'text-slate-700 hover:bg-white font-semibold'
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
                              className="w-6 h-6 rounded-md bg-[#0c5a8a] text-white flex items-center justify-center hover:bg-[#084369] cursor-pointer"
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

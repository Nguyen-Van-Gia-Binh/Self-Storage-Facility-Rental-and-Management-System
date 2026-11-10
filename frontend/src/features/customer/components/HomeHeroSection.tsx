import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  KeyRound,
  Thermometer,
  MapPin,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react';
import type { UnitTypeResponse } from '@/types/unit';
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
 * Hero Section tinh gọn chữ & tích hợp Mô hình 3D ước lượng kích thước thật từ CSDL.
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
    <section className="relative bg-gradient-to-br from-[#125449] via-[#1c6e60] to-[#11473e] border-b border-teal-700/40 overflow-hidden">
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[380px] h-[380px] bg-teal-200/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-11 pb-10 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* CỘT TRÁI (6 cột): Thông điệp cô đọng, dễ đọc trong 3 giây */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-100 border border-white/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              <span>SmartStorage · Hà Nội &amp; TP.HCM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-white tracking-tight leading-[1.18]">
              Kho tự quản sạch đẹp, <br className="hidden sm:inline" />
              <span className="text-emerald-200 whitespace-nowrap">an toàn &amp; chủ động</span>
            </h1>

            <p className="text-sm sm:text-base text-teal-50/90 max-w-lg leading-relaxed">
              Thuê ô kho riêng từ 1m² đến 15m². Giữ chỗ 48 giờ, thanh toán VNPay và mở khóa bằng mã PIN 6 số.
            </p>

            <div className="grid grid-cols-3 gap-2.5 max-w-lg">
              <div className="p-3 bg-white/10 rounded-xl border border-white/15">
                <div className="flex items-center gap-1.5 text-emerald-200 font-bold text-sm">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span className="text-white">PIN 6 số</span>
                </div>
                <span className="text-[11px] text-teal-100/85 block mt-0.5">Khóa riêng tư</span>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/15">
                <div className="flex items-center gap-1.5 text-emerald-200 font-bold text-sm">
                  <Thermometer className="w-4 h-4 shrink-0" />
                  <span className="text-white">20–25°C</span>
                </div>
                <span className="text-[11px] text-teal-100/85 block mt-0.5">Có kho máy lạnh</span>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/15">
                <div className="flex items-center gap-1.5 text-emerald-200 font-bold text-sm">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-white">
                    {facilitiesCount > 0 ? `${facilitiesCount} cơ sở` : '3 cơ sở'}
                  </span>
                </div>
                <span className="text-[11px] text-teal-100/85 block mt-0.5">Trung tâm nội đô</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {primaryFacilityId ? (
                <Link
                  to={`/customer/units?facility=${String(primaryFacilityId)}`}
                  className="px-6 py-3 rounded-xl bg-white text-[#125449] font-bold text-sm hover:bg-emerald-50 transition-all shadow-md flex items-center gap-2 active:scale-[0.98]"
                >
                  <span>Đặt kho ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onScrollToId('branches')}
                  className="px-6 py-3 rounded-xl bg-white text-[#125449] font-bold text-sm hover:bg-emerald-50 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Xem chi nhánh</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onScrollToId('branches')}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-medium text-sm transition-all cursor-pointer"
              >
                Xem các cơ sở
              </button>
            </div>
          </div>

          {/* CỘT PHẢI (6 cột): Công cụ Ước lượng 3D kích thước thực tế từ CSDL */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-5 text-[#0a1614] space-y-3">
              {/* Header + Chuyển dòng kho */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-[#0a1614]">
                  Ước lượng không gian 3D thực tế
                </h2>

                <div className="inline-flex p-0.5 rounded-lg bg-[#f2f9f7] border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setEnv('STANDARD')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      env === 'STANDARD'
                        ? 'bg-white text-[#125449] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tiêu chuẩn
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnv('CLIMATE_CONTROLLED')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      env === 'CLIMATE_CONTROLLED'
                        ? 'bg-white text-sky-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Máy lạnh
                  </button>
                </div>
              </div>

              {/* 5 tab kích thước thật XS..XL */}
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#f2f9f7] rounded-xl border border-slate-200/70">
                {SIZE_ORDER.map((code) => {
                  const s = resolvedSpecs[code];
                  const isActive = code === activeSize;
                  return (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveSize(code)}
                      className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#57b29a] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:bg-white font-medium'
                      }`}
                    >
                      <span className="block text-xs leading-tight">{code}</span>
                      <span
                        className={`block text-[10px] leading-tight ${
                          isActive ? 'text-teal-50' : 'text-slate-400'
                        }`}
                      >
                        {s.areaM2} m²
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mô hình 3D Isometric tỉ lệ thật */}
              <StorageUnit3DPreview
                spec={currentSpec}
                environment={env}
                itemCounts={itemCounts}
                recommendedSize={recommendedSize}
                onSelectSize={setActiveSize}
              />

              {/* Chọn nhanh đồ đạc (+ / -), nút Đặt lại luôn sẵn sàng để làm trống kho */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium">Thử xếp nhanh đồ đạc:</span>
                  <button
                    type="button"
                    onClick={resetItems}
                    disabled={totalItems === 0}
                    className="inline-flex items-center gap-1 text-[#439782] hover:underline font-semibold cursor-pointer disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Đặt lại hàng hóa
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {STORAGE_ESTIMATOR_ITEMS.map((item) => {
                    const count = itemCounts[item.key];
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] ${
                          count > 0
                            ? 'bg-[#f2f9f7] border-[#57b29a]/60 text-[#125449] font-semibold'
                            : 'bg-slate-50/70 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-[2px] shrink-0 border border-black/15"
                            style={{ backgroundColor: item.colors.top }}
                          />
                          <div className="min-w-0">
                            <span className="block truncate leading-tight">{item.label}</span>
                            <span className="block text-[9.5px] text-slate-400 font-normal leading-tight">
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
                            className="w-4 h-4 rounded bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-3.5 text-center font-mono text-[11px]">{count}</span>
                          <button
                            type="button"
                            aria-label={`Tăng ${item.label}`}
                            onClick={() => handleItemDelta(item.key, 1)}
                            className="w-4 h-4 rounded bg-[#57b29a] text-white flex items-center justify-center hover:bg-[#439782] cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
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
    </section>
  );
};

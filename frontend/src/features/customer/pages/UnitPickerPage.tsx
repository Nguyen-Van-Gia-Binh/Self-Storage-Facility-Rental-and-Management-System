import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Box, 
  Wind, 
  ThermometerSnowflake, 
  ShieldCheck, 
  MapPin, 
  Layers
} from 'lucide-react';
import { mockFacilities, mockUnitTypes, mockStorageUnits } from '../mockData';
import type { StorageType, UnitSizeCategory, StorageUnit } from '../types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatVND } from '../utils/pricing';
import { UnitGrid } from '../components/UnitGrid';

export const UnitPickerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const facilityId = searchParams.get('facility') || 'FAC-D7-02';
  const initialTypeId = searchParams.get('type');

  const facility = useMemo(() => {
    return mockFacilities.find((f) => f.id === facilityId) || mockFacilities[0];
  }, [facilityId]);

  // Bộ lọc ô kho theo cơ sở
  const facilityUnits = useMemo(() => {
    const list = mockStorageUnits.filter((u) => u.facilityId === facility.id);
    return list.length > 0 ? list : mockStorageUnits;
  }, [facility.id]);

  const [storageType, setStorageType] = useState<StorageType>(() => {
    if (initialTypeId) {
      const match = mockUnitTypes.find((t) => t.id === initialTypeId);
      if (match) return match.storageType;
    }
    return 'STANDARD';
  });

  const [selectedSize, setSelectedSize] = useState<UnitSizeCategory>(() => {
    if (initialTypeId) {
      const match = mockUnitTypes.find((t) => t.id === initialTypeId);
      if (match) return match.sizeCategory;
    }
    return 'M';
  });

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Lọc các loại kho theo chế độ Standard / Climate
  const availableTypes = useMemo(() => {
    return mockUnitTypes.filter((t) => t.storageType === storageType);
  }, [storageType]);

  const currentUnitType = useMemo(() => {
    return availableTypes.find((t) => t.sizeCategory === selectedSize) || availableTypes[0];
  }, [availableTypes, selectedSize]);

  // Ô kho khả dụng phù hợp nhất theo phân loại đang chọn
  const defaultMatchingUnit = useMemo(() => {
    return (
      facilityUnits.find(
        (u) =>
          u.status === 'AVAILABLE' &&
          u.sizeCategory === selectedSize &&
          u.storageType === storageType
      ) ||
      facilityUnits.find((u) => u.status === 'AVAILABLE') ||
      facilityUnits[0] ||
      null
    );
  }, [facilityUnits, selectedSize, storageType]);

  // Ô kho đang được chọn
  const selectedUnit = useMemo(() => {
    if (selectedUnitId) {
      const found = facilityUnits.find((u) => u.id === selectedUnitId);
      if (found) return found;
    }
    return defaultMatchingUnit;
  }, [facilityUnits, selectedUnitId, defaultMatchingUnit]);

  const handleSelectUnitOnGrid = (unit: StorageUnit) => {
    setSelectedUnitId(unit.id);
    if (unit.sizeCategory && unit.sizeCategory !== selectedSize) {
      setSelectedSize(unit.sizeCategory);
    }
    if (unit.storageType && unit.storageType !== storageType) {
      setStorageType(unit.storageType);
    }
  };

  const handleProceedToBooking = (unitToBook?: StorageUnit) => {
    const targetUnit = unitToBook || selectedUnit;
    const targetUnitNumber = targetUnit ? targetUnit.unitNumber : 'A102';
    const targetUnitId = targetUnit ? targetUnit.id : 'U-A102';

    navigate(
      `/customer/booking?facility=${facility.id}&type=${currentUnitType.id}&unitId=${targetUnitId}&unitNumber=${targetUnitNumber}`
    );
  };

  const getBadgeTranslation = (badge?: string) => {
    switch (badge) {
      case 'POPULAR': return 'Phổ biến nhất';
      case 'SPACIOUS': return 'Không gian rộng';
      case 'COMMERCIAL': return 'Doanh nghiệp';
      case 'COMPACT': return 'Gọn nhẹ';
      default: return badge;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* 1. Header & Stepper đồng bộ (Pill Breadcrumbs chuẩn Dub.co SaaS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <Link
            to="/facilities"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Đổi cơ sở khác (<MapPin className="w-3 h-3 text-brand-600 inline" /> {facility.name})
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a1614] tracking-tight">
            Chọn Kích Thước & Sơ Đồ Ô Kho Trực Quan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem vị trí thực tế trên mặt bằng, chọn ô kho còn trống và giữ slot nguyên tử trong 48 giờ (SC-02).
          </p>
        </div>

        {/* Stepper pills đồng bộ với toàn bộ luồng */}
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5 bg-brand-500 text-white px-3 py-1 rounded-full border border-brand-500 shadow-xs">
            <span className="w-4 h-4 rounded-full bg-white text-brand-700 text-[10px] flex items-center justify-center font-bold">1</span>
            <span>1. Chọn loại & Sơ đồ</span>
          </div>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-bold">2</span>
            <span>2. Thời hạn & Hồ sơ</span>
          </div>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-bold">3</span>
            <span>3. Thanh toán VietQR</span>
          </div>
        </div>
      </div>

      {/* 2. Bộ chuyển đổi chế độ kho (Standard vs Climate-Controlled) */}
      <div className="max-w-md mx-auto grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
        <button
          type="button"
          onClick={() => setStorageType('STANDARD')}
          className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-all text-left cursor-pointer ${
            storageType === 'STANDARD'
              ? 'bg-brand-50 border-2 border-brand-500 shadow-2xs text-brand-900'
              : 'border-2 border-transparent hover:bg-slate-50 text-slate-600'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-[#0a1614] block">Kho Tiêu Chuẩn</span>
            <span className="text-[11px] text-slate-500 block">Khô thoáng, đồ gia dụng</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStorageType('CLIMATE_CONTROLLED')}
          className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-all text-left cursor-pointer ${
            storageType === 'CLIMATE_CONTROLLED'
              ? 'bg-sky-50 border-2 border-[#96b3cf] shadow-2xs text-sky-900'
              : 'border-2 border-transparent hover:bg-slate-50 text-slate-600'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
            <ThermometerSnowflake className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-[#0a1614] block">Kho Máy Lạnh 24/7</span>
            <span className="text-[11px] text-slate-500 block">22°C–25°C, hút ẩm</span>
          </div>
        </button>
      </div>

      {/* 3. Danh mục 4 thẻ kích cỡ kho S, M, L, XL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Box className="w-4 h-4 text-brand-600" /> Phân Nhóm Kích Thước Kho (SCR-SC-01B)
          </h2>
          <span className="text-xs text-slate-400">Chọn cỡ kho để tự động định vị trên sơ đồ bên dưới</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {availableTypes.map((type) => {
            const isSelected = selectedSize === type.sizeCategory;

            return (
              <div
                key={type.id}
                onClick={() => setSelectedSize(type.sizeCategory)}
                className={`rounded-xl p-3.5 border-2 transition-all flex flex-col justify-between cursor-pointer bg-white ${
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-sm scale-[1.01]'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Header & Badge */}
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm font-extrabold text-[#0a1614]">
                      {type.name.split('–')[0]}
                    </h3>
                    {type.badge && (
                      <Badge 
                        variant={
                          type.badge === 'POPULAR' ? 'primary' : 
                          type.badge === 'SPACIOUS' ? 'secondary' : 
                          type.badge === 'COMMERCIAL' ? 'accent' : 'default'
                        }
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {getBadgeTranslation(type.badge)}
                      </Badge>
                    )}
                  </div>

                  {/* 3D Cube Icon Visual */}
                  <div className="h-12 w-full rounded-lg bg-brand-50/40 border border-brand-100/60 flex items-center justify-center">
                    <Box className={`w-6 h-6 transition-transform ${isSelected ? 'text-brand-500 scale-110' : 'text-slate-400'}`} />
                  </div>

                  {/* Size & Dimensions */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-baseline justify-between font-bold text-slate-800">
                      <span>Diện tích sàn:</span>
                      <span className="text-xs text-brand-700 font-extrabold">{type.areaM2} m² ({type.volumeM3} m³)</span>
                    </div>
                    <div className="text-slate-500 text-[11px] flex justify-between">
                      <span>Kích thước:</span>
                      <span>{type.dimensions}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed pt-1 border-t border-slate-100 mt-1 line-clamp-2">
                      {type.capacityDescription}
                    </p>
                  </div>
                </div>

                {/* Price & Selection Button */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-400">Đơn giá:</span>
                    <span className="text-sm font-extrabold text-[#0a1614]">
                      {formatVND(type.baseMonthlyPrice)} <span className="text-[10px] font-normal text-slate-400">/tháng</span>
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full gap-1 text-xs py-1.5 font-semibold"
                  >
                    {isSelected ? (
                      <>Đang chọn Cỡ {type.sizeCategory} <Check className="w-3.5 h-3.5" /></>
                    ) : (
                      `Chọn Cỡ ${type.sizeCategory}`
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SƠ ĐỒ MẶT BẰNG KHO TRỰC QUAN (INTERACTIVE UNIT PICKER - SC-02) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base font-extrabold text-[#0a1614] flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" /> Sơ Đồ Mặt Bằng & Chọn Ô Kho Trực Quan (Interactive Floorplan)
            </h2>
            <p className="text-xs text-slate-500">
              Bạn có thể nhấp trực tiếp vào ô kho màu xanh lá trên sơ đồ để chọn đúng vị trí mong muốn.
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 shrink-0">
            Cơ sở: {facility.name}
          </span>
        </div>

        <UnitGrid
          units={facilityUnits}
          selectedUnitId={selectedUnit ? selectedUnit.id : null}
          onSelectUnit={handleSelectUnitOnGrid}
          filterType={storageType}
          filterSize={selectedSize}
          onConfirmSelection={handleProceedToBooking}
          facilityName={facility.name}
        />
      </div>

      {/* 5. THANH HÀNH ĐỘNG DÍNH LIỀN (Floating Action Bar) */}
      <div className="max-w-4xl mx-auto pt-2">
        <Card className="px-4 sm:px-5 py-3 bg-white border border-slate-200/90 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Ô kho đã chọn:</span>
                <span className="text-sm font-extrabold text-[#0a1614] font-mono">
                  {selectedUnit ? `Ngăn số ${selectedUnit.unitNumber}` : currentUnitType.name.split('–')[0]}
                </span>
                {selectedUnit && (
                  <Badge variant="available" className="text-[10px]">Tầng {selectedUnit.floor} · {selectedUnit.zone}</Badge>
                )}
                <span className="text-xs text-slate-400">({currentUnitType.areaM2} m² · {currentUnitType.dimensions})</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Đơn giá: <strong className="text-brand-600 font-extrabold text-xs">{formatVND(currentUnitType.baseMonthlyPrice)}</strong>/tháng · Tự động tạm giữ slot trong 48 giờ (BR-DEP-03)
              </p>
            </div>
          </div>

          <Button 
            variant="primary" 
            size="md" 
            onClick={() => handleProceedToBooking()}
            className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm flex items-center justify-center gap-2 rounded-xl shrink-0"
          >
            <span>Tiếp tục: Thời hạn & Hồ sơ (Bước 2)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
};

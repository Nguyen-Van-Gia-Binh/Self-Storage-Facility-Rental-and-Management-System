import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  Box, 
  Wind, 
  ThermometerSnowflake, 
  MapPin, 
  Layers,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatVND } from '../utils/pricing';
import { UnitGrid } from '../components/UnitGrid';
import { fetchFacilities } from '@/api/facility';
import { fetchUnitTypes as fetchUnitTypesApi, fetchStorageUnits as fetchStorageUnitsApi } from '@/api/unit';
import { checkUnitAvailability, type AvailabilityResponse } from '@/api/reservation';
import type { FacilityListItem } from '@/types';
import type { StorageType, UnitSizeCategory, StorageUnit, UnitType, UnitStatus } from '../types';

// Hàm định dạng ngày Việt Nam DD/MM/YYYY
function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Danh sách các gói thời hạn thuê chuẩn
const DURATION_PACKAGES = [
  { months: 1, label: '1 Tháng', discountLabel: '' },
  { months: 3, label: '3 Tháng', discountLabel: 'Phổ biến', popular: true },
  { months: 6, label: '6 Tháng', discountLabel: 'Tiết kiệm 5%' },
  { months: 12, label: '12 Tháng', discountLabel: 'Tiết kiệm 10%' },
];

// Hàm xác định nhóm kích thước chuẩn từ mã/tên loại kho và diện tích
function resolveSizeCategory(codeOrName: string, areaM2?: number): UnitSizeCategory {
  const upper = codeOrName.toUpperCase();
  const lower = codeOrName.toLowerCase();
  if (upper.includes('SMALL') || lower.includes('nhỏ') || (areaM2 != null && areaM2 <= 1.5)) {
    return 'S';
  }
  if (upper.includes('LARGE') || lower.includes('lớn') || (areaM2 != null && areaM2 >= 9)) {
    return 'L';
  }
  if (upper.includes('XL') || (areaM2 != null && areaM2 >= 15)) {
    return 'XL';
  }
  return 'M';
}

export const UnitPickerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const facilityParam = searchParams.get('facility');
  const initialTypeId = searchParams.get('type');
  const initialMonthsParam = parseInt(searchParams.get('months') || '', 10);
  const initialStartDateParam = searchParams.get('startDate');

  const [loading, setLoading] = useState<boolean>(true);
  const [currentFacility, setCurrentFacility] = useState<{ id: string; name: string; address?: string }>({
    id: facilityParam || '',
    name: 'Cơ sở lưu trữ',
  });
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [facilityUnits, setFacilityUnits] = useState<StorageUnit[]>([]);

  // 1. Quản lý thời gian thuê dự kiến (Ngày bắt đầu & Số tháng thuê)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [startDate, setStartDate] = useState<string>(() => {
    if (initialStartDateParam && initialStartDateParam >= todayStr) {
      return initialStartDateParam;
    }
    return todayStr;
  });
  const [durationMonths, setDurationMonths] = useState<number>(
    !isNaN(initialMonthsParam) && initialMonthsParam > 0 ? initialMonthsParam : 3
  );

  // Tính ngày kết thúc dự kiến
  const calculatedEndDate = useMemo(() => {
    if (!startDate) return '';
    const [y, m, d] = startDate.split('-').map(Number);
    const date = new Date(y, m - 1 + durationMonths, d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [startDate, durationMonths]);

  // Sức chứa ô kho theo loại kho trong khoảng thời gian đã chọn
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, AvailabilityResponse>>({});
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(false);

  const [storageType, setStorageType] = useState<StorageType>('STANDARD');
  const [selectedSize, setSelectedSize] = useState<UnitSizeCategory>('S');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Tải dữ liệu thực tế từ backend khi facilityParam thay đổi
  useEffect(() => {
    // Nếu URL không có tham số cơ sở, tự động chuyển hướng về Trang chủ để khách chọn cơ sở
    if (!facilityParam) {
      navigate('/customer', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadFacilityAndUnits() {
      setLoading(true);
      try {
        // 1. Lấy danh sách cơ sở thực tế
        const facList = await fetchFacilities();
        if (!isMounted) return;

        // Tìm cơ sở tương ứng theo ID hoặc Code (ví dụ: '1' hoặc 'FAC-HC')
        const matchedFac = facList.find(
          (f: FacilityListItem) => String(f.id) === facilityParam || f.code === facilityParam
        ) || facList[0];

        if (matchedFac) {
          setCurrentFacility({
            id: String(matchedFac.id),
            name: matchedFac.name,
            address: matchedFac.address,
          });

          const numericId = typeof matchedFac.id === 'number' ? matchedFac.id : Number(matchedFac.id);

          // 2. Gọi API lấy bảng giá Loại ô kho thực tế của cơ sở này (T2.8)
          const utPage = await fetchUnitTypesApi(numericId, { size: 50 });

          // 3. Gọi API lấy danh sách Ô kho vật lý thực tế của cơ sở này (T2.10)
          const suPage = await fetchStorageUnitsApi(numericId, { size: 100 });

          if (!isMounted) return;

          // Chuyển đổi dữ liệu backend UnitTypeResponse sang domain UnitType
          let mappedUTs: UnitType[] = [];
          if (utPage?.content && utPage.content.length > 0) {
            mappedUTs = utPage.content.map((ut) => {
              const codeUpper = (ut.code || ut.name).toUpperCase();
              const sizeCat: UnitSizeCategory = resolveSizeCategory(ut.code || ut.name, ut.areaM2);

              const isClimate = codeUpper.includes('CLIMATE') || ut.name.toLowerCase().includes('lạnh');
              const sType: StorageType = isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD';

              const width = ut.widthM || 2;
              const depth = ut.depthM || 2;
              const height = ut.heightM || 2.5;
              const area = ut.areaM2 || Number((width * depth).toFixed(1));
              const vol = ut.volumeM3 || Number((width * depth * height).toFixed(1));

              return {
                id: String(ut.id),
                code: ut.code || `UT-${ut.id}`,
                name: ut.name,
                sizeCategory: sizeCat,
                storageType: sType,
                areaM2: area,
                volumeM3: vol,
                dimensions: `${width}m x ${depth}m x ${height}m`,
                capacityDescription: ut.description || `${ut.name} - Hệ thống an ninh và PCCC chuẩn quốc tế`,
                baseMonthlyPrice: ut.monthlyPrice || 500000,
                badge: sizeCat === 'M' ? 'POPULAR' : sizeCat === 'L' ? 'SPACIOUS' : undefined,
              };
            });
            setUnitTypes(mappedUTs);

            if (initialTypeId) {
              const found = mappedUTs.find((ut) => ut.id === initialTypeId || ut.code === initialTypeId);
              if (found) {
                setSelectedSize(found.sizeCategory);
                setStorageType(found.storageType);
              }
            }
          } else {
            setUnitTypes([]);
          }

          // Chuyển đổi dữ liệu backend StorageUnitResponse sang domain StorageUnit
          if (suPage?.content && suPage.content.length > 0) {
            const mappedSUs: StorageUnit[] = suPage.content.map((su) => {
              const parentType = mappedUTs.find((ut) => String(ut.id) === String(su.unitTypeId));
              const sizeCat = parentType ? parentType.sizeCategory : 'S';
              const sType = parentType ? parentType.storageType : 'STANDARD';

              const statusRaw = (su.status || 'AVAILABLE').toUpperCase();
              let unitStatus: UnitStatus = 'AVAILABLE';
              if (statusRaw === 'OCCUPIED') unitStatus = 'OCCUPIED';
              else if (statusRaw === 'RESERVED') unitStatus = 'RESERVED';
              else if (statusRaw === 'MAINTENANCE') unitStatus = 'MAINTENANCE';
              else if (statusRaw === 'OVERDUE') unitStatus = 'OVERDUE';
              else if (statusRaw === 'LOCKED') unitStatus = 'LOCKED';

              return {
                id: String(su.id),
                unitNumber: su.code || `S-${su.id}`,
                facilityId: String(su.facilityId || currentFacility.id),
                unitTypeId: String(su.unitTypeId || (parentType ? parentType.id : '1')),
                floor: su.floor || 1,
                zone: su.position || 'Khu A',
                sizeCategory: sizeCat,
                storageType: sType,
                status: unitStatus,
                dimensions: parentType ? parentType.dimensions : '2m x 2m x 2.5m',
                areaM2: parentType ? parentType.areaM2 : 4,
                volumeM3: parentType ? parentType.volumeM3 : 10,
                locationDescription: `Tầng ${su.floor || 1} - ${su.position || 'Khu A'} - Cạnh cửa chính`,
                monthlyPrice: su.monthlyPrice || (parentType ? parentType.baseMonthlyPrice : 500000),
              };
            });
            setFacilityUnits(mappedSUs);
          } else {
            setFacilityUnits([]);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu cơ sở & ô kho từ API backend:', err);
        setUnitTypes([]);
        setFacilityUnits([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFacilityAndUnits();
    return () => { isMounted = false; };
  }, [facilityParam, initialTypeId, navigate]);

  // Tải sức chứa ô kho thực tế và danh sách ô kho động theo khoảng thời gian khách chọn (SC-01)
  useEffect(() => {
    const fId = parseInt(currentFacility.id, 10);
    if (isNaN(fId) || unitTypes.length === 0) return;

    let isMounted = true;
    async function loadAvailabilitiesAndUnits() {
      setLoadingAvailability(true);
      const map: Record<string, AvailabilityResponse> = {};
      try {
        await Promise.all([
          Promise.all(
            unitTypes.map(async (ut) => {
              const uId = parseInt(ut.id, 10);
              if (!isNaN(uId)) {
                try {
                  const res = await checkUnitAvailability(fId, uId, startDate, durationMonths);
                  map[ut.id] = res;
                } catch {
                  // Bỏ qua lỗi từng loại kho
                }
              }
            })
          ),
          (async () => {
            try {
              const suPage = await fetchStorageUnitsApi(fId, {
                startDate,
                rentalMonths: durationMonths,
                size: 100,
              });
              if (!isMounted) return;
              if (suPage?.content && suPage.content.length > 0) {
                const mappedSUs: StorageUnit[] = suPage.content.map((su) => {
                  const parentType = unitTypes.find((ut) => String(ut.id) === String(su.unitTypeId));
                  const sizeCat = parentType ? parentType.sizeCategory : 'S';
                  const sType = parentType ? parentType.storageType : 'STANDARD';

                  const statusRaw = (su.status || 'AVAILABLE').toUpperCase();
                  let unitStatus: UnitStatus = 'AVAILABLE';
                  if (statusRaw === 'OCCUPIED') unitStatus = 'OCCUPIED';
                  else if (statusRaw === 'RESERVED') unitStatus = 'RESERVED';
                  else if (statusRaw === 'MAINTENANCE') unitStatus = 'MAINTENANCE';
                  else if (statusRaw === 'OVERDUE') unitStatus = 'OVERDUE';
                  else if (statusRaw === 'LOCKED') unitStatus = 'LOCKED';

                  return {
                    id: String(su.id),
                    unitNumber: su.code || `S-${su.id}`,
                    facilityId: String(su.facilityId || currentFacility.id),
                    unitTypeId: String(su.unitTypeId || (parentType ? parentType.id : '1')),
                    floor: su.floor || 1,
                    zone: su.position || 'Khu A',
                    sizeCategory: sizeCat,
                    storageType: sType,
                    status: unitStatus,
                    dimensions: parentType ? parentType.dimensions : '2m x 2m x 2.5m',
                    areaM2: parentType ? parentType.areaM2 : 4,
                    volumeM3: parentType ? parentType.volumeM3 : 10,
                    locationDescription: `Tầng ${su.floor || 1} - ${su.position || 'Khu A'} - Cạnh cửa chính`,
                    monthlyPrice: su.monthlyPrice || (parentType ? parentType.baseMonthlyPrice : 500000),
                  };
                });
                setFacilityUnits(mappedSUs);
              }
            } catch (err) {
              console.error('Lỗi khi tải ô kho theo kỳ hạn:', err);
            }
          })(),
        ]);

        if (isMounted) {
          setAvailabilityMap(map);
        }
      } finally {
        if (isMounted) {
          setLoadingAvailability(false);
        }
      }
    }

    loadAvailabilitiesAndUnits();
    return () => {
      isMounted = false;
    };
  }, [currentFacility.id, unitTypes, startDate, durationMonths]);

  // Lọc các loại kho theo chế độ Standard / Climate
  const availableTypes = useMemo(() => {
    const list = unitTypes.filter((t) => t.storageType === storageType);
    return list.length > 0 ? list : unitTypes;
  }, [unitTypes, storageType]);

  const currentUnitType = useMemo(() => {
    return availableTypes.find((t) => t.sizeCategory === selectedSize) || availableTypes[0];
  }, [availableTypes, selectedSize]);

  // Cập nhật trạng thái ô kho trên sơ đồ theo availability của loại kho trong kỳ hạn đã chọn
  const displayFacilityUnits = useMemo(() => {
    return facilityUnits.map((u) => {
      const matchedUT = unitTypes.find(
        (ut) => ut.sizeCategory === u.sizeCategory && ut.storageType === u.storageType
      );
      if (matchedUT && availabilityMap[matchedUT.id]) {
        const avail = availabilityMap[matchedUT.id];
        // Nếu loại kho này hết chỗ trong kỳ hạn đã chọn, chuyển sang OCCUPIED nếu đang AVAILABLE
        if (avail.availableSlots === 0 && u.status === 'AVAILABLE') {
          return {
            ...u,
            status: 'OCCUPIED' as UnitStatus,
          };
        }
      }
      return u;
    });
  }, [facilityUnits, unitTypes, availabilityMap]);

  // Ô kho khả dụng phù hợp nhất theo phân loại đang chọn
  const defaultMatchingUnit = useMemo(() => {
    return (
      displayFacilityUnits.find(
        (u) =>
          u.status === 'AVAILABLE' &&
          u.sizeCategory === selectedSize &&
          u.storageType === storageType
      ) ||
      displayFacilityUnits.find((u) => u.status === 'AVAILABLE') ||
      displayFacilityUnits[0] ||
      null
    );
  }, [displayFacilityUnits, selectedSize, storageType]);

  // Ô kho đang được chọn
  const selectedUnit = useMemo(() => {
    if (selectedUnitId) {
      const found = displayFacilityUnits.find((u) => u.id === selectedUnitId);
      if (found) return found;
    }
    return defaultMatchingUnit;
  }, [displayFacilityUnits, selectedUnitId, defaultMatchingUnit]);

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
    const typeIdToPass = currentUnitType ? currentUnitType.id : (unitTypes[0]?.id || '1');

    const params = new URLSearchParams({
      facility: String(currentFacility.id),
      type: String(typeIdToPass),
      startDate,
      months: String(durationMonths),
    });

    if (targetUnit?.id) {
      params.set('unitId', String(targetUnit.id));
    }
    if (targetUnit?.unitNumber) {
      params.set('unitNumber', targetUnit.unitNumber);
    }

    navigate(`/customer/booking?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Đang tải sơ đồ mặt bằng và biểu giá ô kho thực tế...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* 1. Header & Stepper đồng bộ (Pill Breadcrumbs chuẩn Dub.co SaaS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <Link
            to="/customer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Đổi cơ sở khác (<MapPin className="w-3 h-3 text-brand-600 inline" /> {currentFacility.name})
          </Link>
        </div>

        {/* Stepper pills đồng bộ với toàn bộ luồng */}
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5 bg-brand-500 text-white px-3 py-1 rounded-full border border-brand-500 shadow-xs">
            <span className="w-4 h-4 rounded-full bg-white text-brand-700 text-[10px] flex items-center justify-center font-bold">1</span>
            <span>Chọn loại & Sơ đồ</span>
          </div>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-bold">2</span>
            <span>Hồ sơ đặt chỗ</span>
          </div>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-bold">3</span>
            <span>Thanh toán VietQR</span>
          </div>
        </div>
      </div>

      {/* 1. CHỌN LOẠI KHO TRƯỚC (Bộ chuyển đổi Standard/Climate & 3 thẻ cỡ kho căn giữa cân đối) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-base font-extrabold text-[#0a1614] flex items-center gap-2">
              <Box className="w-4 h-4 text-brand-600" />
              1. Chọn Loại Kho & Kích Thước
            </h2>
          </div>
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 shrink-0 self-start sm:self-auto">
            Cơ sở: {currentFacility.name}
          </span>
        </div>

        {/* Bộ chuyển đổi chế độ kho (Standard vs Climate-Controlled) */}
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

        {/* Danh mục các thẻ kích cỡ kho: CĂN GIỮA CHO CÂN ĐỐI */}
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {availableTypes.map((type) => {
            const isSelected = selectedSize === type.sizeCategory;
            const availInfo = availabilityMap[type.id];

            return (
              <div
                key={type.id}
                onClick={() => setSelectedSize(type.sizeCategory)}
                className={`w-full sm:w-[calc(50%-0.6rem)] md:w-[calc(33.333%-0.75rem)] max-w-[290px] rounded-xl p-3.5 border-2 transition-all flex flex-col justify-between cursor-pointer bg-white ${
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
                    {type.badge === 'POPULAR' && (
                      <Badge 
                        variant="primary"
                        className="text-[10px] px-2 py-0.5 whitespace-nowrap shrink-0"
                      >
                        Phổ biến nhất
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

                    {/* Sức chứa ô kho trống thời gian thực */}
                    {availInfo && (
                      <div className="pt-1">
                        {availInfo.availableSlots > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Còn {availInfo.availableSlots} ô trống
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Hết chỗ trong kỳ hạn
                          </span>
                        )}
                      </div>
                    )}
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

      {/* 2. CHỌN THỜI GIAN THUÊ KHO DỰ KIẾN (Sau khi chọn loại kho) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-[#0a1614] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              2. Chọn Thời Gian Thuê Kho Dự Kiến
            </h2>
          </div>
          {loadingAvailability ? (
            <span className="text-xs font-semibold text-brand-600 flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang kiểm tra ô trống...
            </span>
          ) : (
            <Badge variant="available" className="text-xs px-2.5 py-1">
              Đã đồng bộ sức chứa
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Gói thời hạn thuê (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Gói thời hạn thuê:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATION_PACKAGES.map((pkg) => {
                const isSelected = durationMonths === pkg.months;
                return (
                  <button
                    key={pkg.months}
                    type="button"
                    onClick={() => setDurationMonths(pkg.months)}
                    className={`relative p-2.5 rounded-xl border-2 transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/60 shadow-2xs text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {pkg.discountLabel && (
                      <span className={`absolute -top-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold shadow-2xs ${
                        pkg.popular
                          ? 'bg-emerald-500 text-white'
                          : 'bg-brand-600 text-white'
                      }`}>
                        {pkg.discountLabel}
                      </span>
                    )}
                    <span className="text-sm font-extrabold">{pkg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ngày bắt đầu & Ngày kết thúc (Right 5 cols) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ngày bắt đầu thuê:
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={todayStr}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ngày kết thúc dự kiến:
              </label>
              <div className="w-full px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-lg text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-between">
                <span>{formatDateVN(calculatedEndDate)}</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Banner tóm tắt kỳ hạn đã chọn */}
        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Sơ đồ bên dưới đang phản ánh các ô kho trống cho kỳ hạn <strong>{durationMonths} tháng</strong> (từ <strong>{formatDateVN(startDate)}</strong> đến <strong>{formatDateVN(calculatedEndDate)}</strong>).
            </span>
          </div>
        </div>
      </div>

      {/* 3. SƠ ĐỒ MẶT BẰNG Ô KHO VẬT LÝ (Hiển thị sau khi chọn loại kho và thời gian) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-base font-extrabold text-[#0a1614] flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" /> 3. Sơ Đồ Mặt Bằng Ô Kho Vật Lý
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
              Đang lọc Cỡ {selectedSize} • {durationMonths} tháng
            </span>
          </div>
        </div>

        <UnitGrid
          units={displayFacilityUnits}
          selectedUnitId={selectedUnit ? selectedUnit.id : null}
          onSelectUnit={handleSelectUnitOnGrid}
          filterType={storageType}
          filterSize={selectedSize}
          onConfirmSelection={handleProceedToBooking}
          facilityName={currentFacility.name}
        />
      </div>
    </div>
  );
};

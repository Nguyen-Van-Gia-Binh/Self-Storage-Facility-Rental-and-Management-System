import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  MapPin, 
  Loader2, 
  Clock, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatVND } from '../utils/pricing';
import { fetchFacilities } from '@/api/facility';
import { fetchUnitTypes as fetchUnitTypesApi, fetchStorageUnits as fetchStorageUnitsApi } from '@/api/unit';
import { checkUnitAvailability, type AvailabilityResponse } from '@/api/reservation';
import type { FacilityListItem } from '@/types';
import type { StorageType, UnitSizeCategory, StorageUnit, UnitType, UnitStatus } from '../types';

// Định dạng ngày Việt Nam DD/MM/YYYY
function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

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
  const [currentFacility, setCurrentFacility] = useState<{ id: string; name: string; address?: string; phone?: string }>({
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

  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [durationMonths, setDurationMonths] = useState<number>(
    !isNaN(initialMonthsParam) && initialMonthsParam > 0 ? initialMonthsParam : 3
  );

  const durationPackages = useMemo(() => {
    return [
      { months: 1, label: '1 Tháng' },
      { months: 2, label: '2 Tháng' },
      { months: 3, label: '3 Tháng' },
      { months: 4, label: '4 Tháng' },
      { months: 5, label: '5 Tháng' },
      { months: 6, label: '6 Tháng (Ưu đãi -5%)' },
      { months: 7, label: '7 Tháng' },
      { months: 8, label: '8 Tháng' },
      { months: 9, label: '9 Tháng' },
      { months: 10, label: '10 Tháng' },
      { months: 11, label: '11 Tháng' },
      { months: 12, label: '12 Tháng / 1 Năm (Ưu đãi -10%)' },
      { months: 18, label: '18 Tháng / 1.5 Năm (Ưu đãi -10%)' },
      { months: 24, label: '24 Tháng / 2 Năm (Ưu đãi -10%)' },
      { months: 36, label: '36 Tháng / 3 Năm (Ưu đãi -10%)' },
      { months: 48, label: '48 Tháng / 4 Năm (Ưu đãi -10%)' },
      { months: 60, label: '60 Tháng / 5 Năm (Ưu đãi -10%)' },
    ];
  }, []);

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
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<UnitSizeCategory>('S');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [facilityInactiveModalOpen, setFacilityInactiveModalOpen] = useState<boolean>(false);
  const [unitUnavailableModal, setUnitUnavailableModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // Tải dữ liệu thực tế từ backend khi facilityParam thay đổi
  useEffect(() => {
    if (!facilityParam) {
      navigate('/customer', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadFacilityAndUnits() {
      setLoading(true);
      try {
        const facList = await fetchFacilities();
        if (!isMounted) return;

        const matchedFac = facList.find(
          (f: FacilityListItem) => String(f.id) === facilityParam || f.code === facilityParam
        );

        if (!matchedFac) {
          setFacilityInactiveModalOpen(true);
          setLoading(false);
          return;
        }

        setCurrentFacility({
          id: String(matchedFac.id),
          name: matchedFac.name,
          address: matchedFac.address,
          phone: matchedFac.phone,
        });

        const numericId = typeof matchedFac.id === 'number' ? matchedFac.id : Number(matchedFac.id);

        const utPage = await fetchUnitTypesApi(numericId, { size: 50 });
        const suPage = await fetchStorageUnitsApi(numericId, { size: 100 });

        if (!isMounted) return;

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
              baseMonthlyPrice: ut.monthlyPrice && ut.monthlyPrice > 0 ? ut.monthlyPrice : 0,
              badge: sizeCat === 'M' ? 'POPULAR' : sizeCat === 'L' ? 'SPACIOUS' : undefined,
              priceStatus: ut.priceStatus ?? (ut.monthlyPrice && ut.monthlyPrice > 0 ? 'Đang áp dụng' : 'Chưa niêm yết'),
            };
          });
          setUnitTypes(mappedUTs);

          if (initialTypeId) {
            const found = mappedUTs.find((ut) => ut.id === initialTypeId || ut.code === initialTypeId);
            if (found && found.baseMonthlyPrice > 0) {
              setSelectedTypeId(found.id);
              setSelectedSize(found.sizeCategory);
              setStorageType(found.storageType);
            }
          } else {
            const firstListed = mappedUTs.find((ut) => ut.baseMonthlyPrice > 0);
            if (firstListed) {
              setSelectedTypeId(firstListed.id);
              setSelectedSize(firstListed.sizeCategory);
              setStorageType(firstListed.storageType);
            }
          }
        }

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
              locationDescription: `Tầng ${su.floor || 1} - ${su.position || 'Khu A'}`,
              monthlyPrice: su.monthlyPrice && su.monthlyPrice > 0
                ? su.monthlyPrice
                : (parentType && parentType.baseMonthlyPrice > 0 ? parentType.baseMonthlyPrice : 0),
            };
          });
          setFacilityUnits(mappedSUs);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu cơ sở:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFacilityAndUnits();
    return () => { isMounted = false; };
  }, [facilityParam, initialTypeId, navigate]);

  // Tải sức chứa ô kho thực tế theo khoảng thời gian khách chọn
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
                    locationDescription: `Tầng ${su.floor || 1} - ${su.position || 'Khu A'}`,
                    monthlyPrice: su.monthlyPrice && su.monthlyPrice > 0
                      ? su.monthlyPrice
                      : (parentType && parentType.baseMonthlyPrice > 0 ? parentType.baseMonthlyPrice : 0),
                  };
                });
                setFacilityUnits(mappedSUs);
              }
            } catch (err) {
              console.error('Lỗi khi tải ô kho:', err);
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
    if (selectedTypeId) {
      const matchedById = availableTypes.find((t) => t.id === selectedTypeId);
      if (matchedById) return matchedById;
    }
    const matchedBySize = availableTypes.find((t) => t.sizeCategory === selectedSize);
    if (matchedBySize) return matchedBySize;
    const firstListed = availableTypes.find((t) => t.baseMonthlyPrice > 0);
    return firstListed || availableTypes[0];
  }, [availableTypes, selectedTypeId, selectedSize]);

  // Cập nhật trạng thái ô kho trên sơ đồ theo availability
  const displayFacilityUnits = useMemo(() => {
    return facilityUnits.map((u) => {
      const matchedUT = unitTypes.find(
        (ut) => ut.sizeCategory === u.sizeCategory && ut.storageType === u.storageType
      );
      if (matchedUT && availabilityMap[matchedUT.id]) {
        const avail = availabilityMap[matchedUT.id];
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

  // Ô kho đang được chọn
  const selectedUnit = useMemo(() => {
    if (selectedUnitId) {
      const found = displayFacilityUnits.find((u) => u.id === selectedUnitId);
      if (!found) return null;
      if (selectedTypeId && found.unitTypeId && found.unitTypeId !== selectedTypeId) return null;
      if (selectedSize && found.sizeCategory !== selectedSize) return null;
      if (storageType && found.storageType !== storageType) return null;
      return found;
    }
    return null;
  }, [displayFacilityUnits, selectedUnitId, selectedTypeId, selectedSize, storageType]);

  // Tự động chọn ô kho còn trống đầu tiên khi đổi loại kho hoặc tải trang
  useEffect(() => {
    const currentUnitsForType = displayFacilityUnits.filter((u) => {
      if (selectedTypeId && u.unitTypeId) return u.unitTypeId === selectedTypeId;
      if (storageType && u.storageType) return u.storageType === storageType;
      return true;
    });

    const isCurrentValid = currentUnitsForType.some((u) => u.id === selectedUnitId && u.status === 'AVAILABLE');
    if (!isCurrentValid) {
      const firstAvailable = currentUnitsForType.find((u) => u.status === 'AVAILABLE');
      if (firstAvailable) {
        setSelectedUnitId(firstAvailable.id);
      } else {
        setSelectedUnitId(null);
      }
    }
  }, [displayFacilityUnits, selectedTypeId, storageType, selectedUnitId]);

  const handleSelectType = (type: UnitType) => {
    setSelectedTypeId(type.id);
    setSelectedSize(type.sizeCategory);
    if (selectedUnitId) {
      const current = displayFacilityUnits.find((u) => u.id === selectedUnitId);
      if (!current || (current.unitTypeId && current.unitTypeId !== type.id)) {
        setSelectedUnitId(null);
      }
    }
  };

  const handleSelectStorageType = (sType: StorageType) => {
    setStorageType(sType);
    if (selectedUnitId) {
      const current = displayFacilityUnits.find((u) => u.id === selectedUnitId);
      if (!current || current.storageType !== sType) {
        setSelectedUnitId(null);
      }
    }
    const typesForType = unitTypes.filter((t) => t.storageType === sType);
    const firstListed = typesForType.find((t) => t.baseMonthlyPrice > 0);
    if (firstListed) {
      setSelectedTypeId(firstListed.id);
      setSelectedSize(firstListed.sizeCategory);
    } else if (typesForType.length > 0) {
      setSelectedTypeId(typesForType[0].id);
      setSelectedSize(typesForType[0].sizeCategory);
    }
  };

  const handleSelectUnitOnGrid = (unit: StorageUnit) => {
    setSelectedUnitId(unit.id);
    if (unit.unitTypeId && unit.unitTypeId !== selectedTypeId) {
      setSelectedTypeId(unit.unitTypeId);
    }
    if (unit.sizeCategory && unit.sizeCategory !== selectedSize) {
      setSelectedSize(unit.sizeCategory);
    }
    if (unit.storageType && unit.storageType !== storageType) {
      setStorageType(unit.storageType);
    }
  };

  // Tính toán bảng giá minh bạch
  const priceCalculation = useMemo(() => {
    const basePrice = (selectedUnit?.monthlyPrice && selectedUnit.monthlyPrice > 0)
      ? selectedUnit.monthlyPrice
      : (currentUnitType?.baseMonthlyPrice ?? 0);

    const grossRent = basePrice * durationMonths;
    let discountPercent = 0;
    if (durationMonths >= 12) {
      discountPercent = 10;
    } else if (durationMonths >= 6) {
      discountPercent = 5;
    }

    const discountAmount = Math.round((grossRent * discountPercent) / 100);
    const netRent = grossRent - discountAmount;
    const depositAmount = basePrice; // 1 tháng tiền cọc
    const totalDue = netRent + depositAmount;

    return {
      basePrice,
      grossRent,
      discountPercent,
      discountAmount,
      netRent,
      depositAmount,
      totalDue,
    };
  }, [selectedUnit, currentUnitType, durationMonths]);

  const handleProceedToBooking = async () => {
    const targetUnit = selectedUnit;
    if (!targetUnit) {
      // Nếu chưa chọn ô kho cụ thể trên sơ đồ, tự động chọn ô kho trống đầu tiên
      const firstAvailable = displayFacilityUnits.find(
        (u) =>
          u.status === 'AVAILABLE' &&
          u.storageType === storageType &&
          (!selectedTypeId || u.unitTypeId === selectedTypeId)
      );
      if (firstAvailable) {
        handleProceedToBookingWithUnit(firstAvailable);
      } else {
        setUnitUnavailableModal({
          isOpen: true,
          title: 'Vui lòng chọn 1 ô kho',
          message: 'Quý khách vui lòng nhấp chọn một ô kho còn trống trên sơ đồ mặt bằng để tiếp tục đặt chỗ.',
        });
      }
      return;
    }
    handleProceedToBookingWithUnit(targetUnit);
  };

  const handleProceedToBookingWithUnit = async (targetUnit: StorageUnit) => {
    const listedPrice = (targetUnit.monthlyPrice && targetUnit.monthlyPrice > 0)
      ? targetUnit.monthlyPrice
      : (currentUnitType?.baseMonthlyPrice ?? 0);
    if (listedPrice <= 0) {
      setUnitUnavailableModal({
        isOpen: true,
        title: 'Loại ô kho chưa niêm yết giá',
        message: 'Loại ô kho này chưa được niêm yết giá chính thức nên tạm thời chưa thể đặt chỗ. Quý khách vui lòng chọn loại kho khác.',
      });
      return;
    }

    const fId = parseInt(currentFacility.id, 10);
    if (isNaN(fId)) return;

    setIsConfirming(true);
    try {
      const typeIdToPass = targetUnit.unitTypeId || (currentUnitType ? currentUnitType.id : (unitTypes[0]?.id || '1'));

      const params = new URLSearchParams({
        facility: String(currentFacility.id),
        type: String(typeIdToPass),
        unit: String(targetUnit.id),
        unitNumber: targetUnit.unitNumber,
        startDate,
        months: String(durationMonths),
      });

      navigate(`/customer/booking?${params.toString()}`);
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Đang tải thông tin cơ sở và sơ đồ ô kho...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* TOP BAR: FACILITY INFO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-200/60">
        <div>
          <Link
            to="/customer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Chọn cơ sở khác</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a1614] tracking-tight">
            {currentFacility.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>{currentFacility.address || 'Hệ thống kho tự quản thông minh'}</span>
          </div>
        </div>
      </div>

      {/* 2 COLUMNS LAYOUT: LEFT (Controls & Matrix Grid) + RIGHT (Sticky Summary Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================== CỘT TRÁI: 2 THẺ TỐI GIẢN (8 cols) ==================== */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. THỜI GIAN THUÊ */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800 block">
              1. Thời gian thuê
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Ngày bắt đầu vào kho
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all shadow-2xs"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>Dự kiến kết thúc: <strong className="text-slate-800">{formatDateVN(calculatedEndDate)}</strong></span>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Thời hạn thuê
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomDuration(!isCustomDuration)}
                    className="text-[11px] text-brand-600 hover:text-brand-700 font-bold underline cursor-pointer"
                  >
                    {isCustomDuration ? 'Chọn theo danh mục' : 'Nhập số tháng tùy chỉnh'}
                  </button>
                </div>
                {isCustomDuration ? (
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={durationMonths}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setDurationMonths(isNaN(val) || val < 1 ? 1 : val);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all shadow-2xs"
                      placeholder="Nhập số tháng thuê (ví dụ: 5, 15, 24...)"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      Tháng
                    </span>
                  </div>
                ) : (
                  <select
                    value={durationMonths}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val === -1) {
                        setIsCustomDuration(true);
                      } else {
                        setDurationMonths(val);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all shadow-2xs cursor-pointer"
                  >
                    {durationPackages.map((pkg) => (
                      <option key={pkg.months} value={pkg.months}>
                        {pkg.label}
                      </option>
                    ))}
                    <option value={-1}>✏️ Nhập số tháng tùy chỉnh khác...</option>
                  </select>
                )}
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  {durationMonths >= 12
                    ? '🎉 Giảm 10% tổng tiền thuê cho kỳ từ 12 tháng trở lên'
                    : durationMonths >= 6
                    ? '🎉 Giảm 5% tổng tiền thuê cho kỳ từ 6 tháng trở lên'
                    : '💡 Thanh toán trọn kỳ khi đặt chỗ'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. CHỌN LOẠI KHO & KÍCH THƯỚC */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800 block">
                2. Chọn loại kho & Kích thước
              </span>
              {loadingAvailability && (
                <span className="text-[11px] text-brand-600 flex items-center gap-1 font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải ô trống...</span>
                </span>
              )}
            </div>

            {/* Môi trường kho tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => handleSelectStorageType('STANDARD')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  storageType === 'STANDARD'
                    ? 'border-[#008B74] bg-[#e6f7f4] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <span>Kho Tiêu Chuẩn</span>
                </div>
                {storageType === 'STANDARD' && (
                  <div className="w-5 h-5 rounded-full bg-[#008B74] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectStorageType('CLIMATE_CONTROLLED')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  storageType === 'CLIMATE_CONTROLLED'
                    ? 'border-[#008B74] bg-[#e6f7f4] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="text-base">❄️</span>
                  <span>Kho Máy Lạnh (24/7)</span>
                </div>
                {storageType === 'CLIMATE_CONTROLLED' && (
                  <div className="w-5 h-5 rounded-full bg-[#008B74] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>

            {/* Kích thước tương ứng - High Contrast */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {availableTypes.map((type) => {
                const isSelected = selectedTypeId === type.id || selectedSize === type.sizeCategory;
                const avail = availabilityMap[type.id];
                const slots = avail ? avail.availableSlots : null;
                const isOutOfSlots = slots !== null && slots <= 0;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleSelectType(type)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#008B74] bg-[#e6f7f4] shadow-xs ring-2 ring-[#008B74]/25'
                        : isOutOfSlots
                        ? 'border-slate-200 bg-slate-50 text-slate-700'
                        : 'border-slate-200 hover:border-emerald-400 bg-white text-slate-900 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <strong className={`text-xs font-black block ${isSelected ? 'text-[#008B74]' : 'text-slate-900'}`}>
                          Size {type.sizeCategory}
                        </strong>
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#008B74] text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {type.areaM2} m²
                        </span>
                      </div>
                      <span className={`text-xs block mt-1.5 font-black font-mono ${isSelected ? 'text-[#008B74]' : 'text-emerald-700'}`}>
                        {formatVND(type.baseMonthlyPrice)}/tháng
                      </span>
                    </div>

                    <div className="mt-2.5 text-[11px] font-bold">
                      {slots !== null ? (
                        slots > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Còn {slots} ô
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            Hết chỗ
                          </span>
                        )
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Chú thích trạng thái sơ đồ ô kho */}
            <div className="flex items-center gap-4 text-xs text-slate-700 pt-3.5 border-t border-slate-100 font-semibold flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600 shadow-2xs"></span>
                <span>Còn trống</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#008B74] shadow-2xs"></span>
                <span>Đang chọn</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500 shadow-2xs"></span>
                <span>Đang giữ chỗ</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-300 shadow-2xs"></span>
                <span>Đã thuê</span>
              </span>
            </div>

            {/* SƠ ĐỒ MA TRẬN Ô KHO THỰC TẾ - VIBRANT HIGH CONTRAST */}
            <div className="pt-1">
              {displayFacilityUnits.filter((u) => {
                if (selectedTypeId && u.unitTypeId) return u.unitTypeId === selectedTypeId;
                if (storageType && u.storageType) return u.storageType === storageType;
                return true;
              }).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {displayFacilityUnits
                    .filter((u) => {
                      if (selectedTypeId && u.unitTypeId) return u.unitTypeId === selectedTypeId;
                      if (storageType && u.storageType) return u.storageType === storageType;
                      return true;
                    })
                    .map((unit) => {
                      const isSelected = selectedUnit?.id === unit.id;
                      const isAvailable = unit.status === 'AVAILABLE';
                      const isReserved = (unit.status as string) === 'RESERVED' || (unit.status as string) === 'PENDING_PAYMENT';

                      return (
                        <button
                          key={unit.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSelectUnitOnGrid(unit)}
                          className={`p-3.5 rounded-xl text-center transition-all cursor-pointer border-2 flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-[#008B74] text-white border-[#006e5c] shadow-md ring-4 ring-[#008B74]/20 scale-[1.03]'
                              : isAvailable
                              ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46] hover:border-[#10b981] hover:bg-[#d1fae5] hover:shadow-xs'
                              : isReserved
                              ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af] cursor-not-allowed'
                              : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] cursor-not-allowed'
                          }`}
                        >
                          <span className={`text-xs font-black font-mono block ${isSelected ? 'text-white' : ''}`}>
                            {unit.unitNumber}
                          </span>
                          <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded block ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : isAvailable
                              ? 'bg-emerald-100/90 text-emerald-800'
                              : isReserved
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200/80 text-slate-600'
                          }`}>
                            {isSelected ? 'Đang chọn' : isAvailable ? 'Trống' : isReserved ? 'Giữ chỗ' : 'Đã thuê'}
                          </span>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600">
                  Cơ sở hiện chưa có ô kho thuộc loại này.
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ==================== CỘT PHẢI: TÓM TẮT ĐẶT CHỖ (STICKY SIDEBAR - 4 cols) ==================== */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-brand-200/90 rounded-2xl p-6 shadow-sm sticky top-24 space-y-4">
            <h3 className="text-base font-bold text-[#0a1614] pb-3 border-b border-brand-100">
              Tóm tắt đặt chỗ
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Cơ sở:</span>
                <strong className="text-[#0a1614] text-right">{currentFacility.name}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Mã ô kho:</span>
                <strong className={`font-mono px-2 py-0.5 rounded border ${
                  selectedUnit
                    ? 'text-brand-700 bg-brand-50 border-brand-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}>
                  {selectedUnit ? selectedUnit.unitNumber : 'Chưa chọn ô'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Loại ô kho:</span>
                <strong className="text-[#0a1614]">
                  {storageType === 'CLIMATE_CONTROLLED' ? 'Kho Máy Lạnh' : 'Kho Tiêu Chuẩn'} — Size {selectedSize} ({currentUnitType?.areaM2 || 3} m²)
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Kỳ thuê:</span>
                <strong className="text-[#0a1614] text-right">
                  {formatDateVN(startDate)} → {formatDateVN(calculatedEndDate)} ({durationMonths} tháng)
                </strong>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Đơn giá:</span>
                <span className="font-semibold text-[#0a1614]">{formatVND(priceCalculation.basePrice)} / tháng</span>
              </div>
              <div className="flex justify-between">
                <span>Tiền thuê {durationMonths} tháng:</span>
                <span className="font-semibold text-[#0a1614]">{formatVND(priceCalculation.grossRent)}</span>
              </div>
              {priceCalculation.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Chiết khấu ({priceCalculation.discountPercent}%):</span>
                  <span>-{formatVND(priceCalculation.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tiền đặt cọc:</span>
                <span className="font-semibold text-[#0a1614]">{formatVND(priceCalculation.depositAmount)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-brand-300 flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#0a1614]">Tổng thanh toán:</span>
              <span className="text-xl font-extrabold text-brand-700 font-mono">
                {formatVND(priceCalculation.totalDue)}
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleProceedToBooking}
              disabled={isConfirming}
              className="w-full py-3.5 text-xs sm:text-sm font-bold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-xs transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang chuyển tiếp...</span>
                </>
              ) : (
                <>
                  <span>Điền thông tin và thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

      </div>

      {/* Modal cảnh báo khi cơ sở ngừng hoạt động */}
      <Modal isOpen={facilityInactiveModalOpen} onClose={() => navigate('/customer')}>
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Cơ sở tạm ngừng hoạt động</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cơ sở lưu trữ bạn đang chọn hiện đã tạm dừng phục vụ. Quý khách vui lòng chọn cơ sở khác đang hoạt động.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-semibold"
              onClick={() => navigate('/customer')}
            >
              Quay lại danh sách cơ sở
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal cảnh báo ô kho không khả dụng */}
      <Modal
        isOpen={unitUnavailableModal.isOpen}
        onClose={() => setUnitUnavailableModal((prev) => ({ ...prev, isOpen: false }))}
      >
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">{unitUnavailableModal.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {unitUnavailableModal.message}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-semibold"
              onClick={() => setUnitUnavailableModal((prev) => ({ ...prev, isOpen: false }))}
            >
              Đã hiểu, chọn ô kho khác
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

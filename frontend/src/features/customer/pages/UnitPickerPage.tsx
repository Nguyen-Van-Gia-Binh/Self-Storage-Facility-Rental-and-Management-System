import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  MapPin, 
  Loader2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Plus,
  Minus,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatVND, normalizeDiscountPercent, findFirstAvailableUnit } from '../utils/pricing';
import { fetchFacilities } from '@/api/facility';
import { fetchUnitTypes as fetchUnitTypesApi, fetchStorageUnits as fetchStorageUnitsApi } from '@/api/unit';
import {
  checkUnitAvailability,
  getMyReservationsApi,
  calculateBookingPrice,
  type AvailabilityResponse,
  type CalculatePriceResponse,
} from '@/api/reservation';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import { tokenStorage } from '@/utils/tokenStorage';
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

// Hàm nhận diện loại kho máy lạnh chuẩn xác theo mã, tên và mô tả công năng
export function isClimateUnitType(ut: { code?: string; name?: string; description?: string }): boolean {
  const code = (ut.code || '').toUpperCase();
  const name = (ut.name || '').toLowerCase();
  const desc = (ut.description || '').toLowerCase();
  return (
    code.includes('CLIMATE') ||
    name.includes('lạnh') ||
    name.includes('máy lạnh') ||
    name.includes('điều hòa') ||
    desc.includes('điều hòa') ||
    desc.includes('máy lạnh') ||
    desc.includes('độ ẩm')
  );
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

  const [durationMonths, setDurationMonths] = useState<number>(
    !isNaN(initialMonthsParam) && initialMonthsParam > 0 ? initialMonthsParam : 3
  );

  const policy = useActivePolicy();
  const depositMultiplier = policy?.depositMultiplier ?? 1;
  const depositMultiplierLabel = Number.isInteger(depositMultiplier)
    ? String(depositMultiplier)
    : depositMultiplier.toFixed(1).replace(/\.0$/, '');


  const quickMilestones = useMemo(() => [
    { months: 1, label: '1 tháng' },
    { months: 3, label: '3 tháng' },
    { months: 6, label: '6 tháng' },
    { months: 12, label: '1 năm' },
  ], []);

  const [isCustomMode, setIsCustomMode] = useState<boolean>(![1, 3, 6, 12].includes(durationMonths));


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
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(initialTypeId || null);
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
  const [pendingLimitModal, setPendingLimitModal] = useState<{
    isOpen: boolean;
    pendingReservation: any | null;
  }>({
    isOpen: false,
    pendingReservation: null,
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
            const sizeCat: UnitSizeCategory = resolveSizeCategory(ut.code || ut.name, ut.areaM2);
            const isClimate = isClimateUnitType(ut);
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
          const listedUTIds = new Set(
            mappedUTs
              .filter((ut) => ut.baseMonthlyPrice > 0 && ut.priceStatus !== 'UNLISTED' && ut.priceStatus !== 'Chưa niêm yết')
              .map((ut) => String(ut.id))
          );
          const mappedSUs: StorageUnit[] = suPage.content
            .filter((su) => listedUTIds.has(String(su.unitTypeId)))
            .map((su) => {
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
                const listedUTIds = new Set(
                  unitTypes
                    .filter((ut) => ut.baseMonthlyPrice > 0 && ut.priceStatus !== 'UNLISTED' && ut.priceStatus !== 'Chưa niêm yết')
                    .map((ut) => String(ut.id))
                );
                const mappedSUs: StorageUnit[] = suPage.content
                  .filter((su) => listedUTIds.has(String(su.unitTypeId)))
                  .map((su) => {
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

  // Lọc các loại kho theo chế độ Standard / Climate và chỉ hiển thị loại kho đã niêm yết giá chính thức (ISS-113)
  const availableTypes = useMemo(() => {
    return unitTypes.filter(
      (t) =>
        t.baseMonthlyPrice > 0 &&
        t.priceStatus !== 'UNLISTED' &&
        t.priceStatus !== 'Chưa niêm yết' &&
        t.storageType === storageType
    );
  }, [unitTypes, storageType]);

  const standardTypesCount = useMemo(
    () =>
      unitTypes.filter(
        (t) =>
          t.baseMonthlyPrice > 0 &&
          t.priceStatus !== 'UNLISTED' &&
          t.priceStatus !== 'Chưa niêm yết' &&
          t.storageType === 'STANDARD'
      ).length,
    [unitTypes]
  );
  const climateTypesCount = useMemo(
    () =>
      unitTypes.filter(
        (t) =>
          t.baseMonthlyPrice > 0 &&
          t.priceStatus !== 'UNLISTED' &&
          t.priceStatus !== 'Chưa niêm yết' &&
          t.storageType === 'CLIMATE_CONTROLLED'
      ).length,
    [unitTypes]
  );

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
    const isSameType = selectedTypeId === type.id;
    setSelectedTypeId(type.id);
    setSelectedSize(type.sizeCategory);
    setStorageType(type.storageType);
    setExpandedTypeId(isSameType && expandedTypeId === type.id ? null : type.id);

    const firstAvail = findFirstAvailableUnit(type.id, displayFacilityUnits);
    if (firstAvail) {
      setSelectedUnitId(firstAvail.id);
    } else {
      setSelectedUnitId(null);
    }
  };

  const handleSelectStorageType = (sType: StorageType) => {
    setStorageType(sType);
    const typesForType = unitTypes.filter((t) => t.storageType === sType);
    const firstListed = typesForType.find((t) => t.baseMonthlyPrice > 0);
    if (firstListed) {
      setSelectedTypeId(firstListed.id);
      setSelectedSize(firstListed.sizeCategory);
      setExpandedTypeId(firstListed.id);
      const firstAvail = findFirstAvailableUnit(firstListed.id, displayFacilityUnits);
      setSelectedUnitId(firstAvail ? firstAvail.id : null);
    } else if (typesForType.length > 0) {
      setSelectedTypeId(typesForType[0].id);
      setSelectedSize(typesForType[0].sizeCategory);
      setExpandedTypeId(typesForType[0].id);
      const firstAvail = findFirstAvailableUnit(typesForType[0].id, displayFacilityUnits);
      setSelectedUnitId(firstAvail ? firstAvail.id : null);
    } else {
      setSelectedTypeId('');
      setExpandedTypeId(null);
      setSelectedUnitId(null);
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

  const [serverPricing, setServerPricing] = useState<CalculatePriceResponse | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const fId = parseInt(currentFacility?.id, 10);
    const utId = currentUnitType ? parseInt(String(currentUnitType.id), 10) : null;
    if (!fId || !utId || durationMonths <= 0) {
      setServerPricing(null);
      return;
    }

    calculateBookingPrice({
      facilityId: fId,
      unitTypeId: utId,
      months: durationMonths,
    })
      .then((data) => {
        if (isCurrent) {
          setServerPricing(data);
        }
      })
      .catch((err) => {
        console.warn('Lỗi tính giá đặt chỗ từ server:', err);
        if (isCurrent) {
          setServerPricing(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [currentFacility?.id, currentUnitType?.id, durationMonths]);

  // Tính toán bảng giá minh bạch từ Backend CSDL (BR-PRI-01, US-BM-03.3)
  const priceCalculation = useMemo(() => {
    const basePrice = (selectedUnit?.monthlyPrice && selectedUnit.monthlyPrice > 0)
      ? selectedUnit.monthlyPrice
      : (currentUnitType?.baseMonthlyPrice ?? 0);

    const grossRent = basePrice * durationMonths;
    const fallbackDeposit = Math.round((basePrice * depositMultiplier) / 1000) * 1000;

    if (serverPricing) {
      return {
        basePrice: serverPricing.monthlyPrice || basePrice,
        grossRent: serverPricing.rawRentTotal || grossRent,
        discountPercent: normalizeDiscountPercent(serverPricing.discountPercentage),
        discountAmount: serverPricing.discountAmount || 0,
        discountProgramName: serverPricing.discountProgramName || null,
        netRent: serverPricing.finalRentTotal || (grossRent - (serverPricing.discountAmount || 0)),
        depositAmount: serverPricing.depositAmount || fallbackDeposit,
        totalDue: serverPricing.totalDueToday || ((serverPricing.finalRentTotal || grossRent) + fallbackDeposit),
      };
    }

    return {
      basePrice,
      grossRent,
      discountPercent: 0,
      discountAmount: 0,
      discountProgramName: null,
      netRent: grossRent,
      depositAmount: fallbackDeposit,
      totalDue: grossRent + fallbackDeposit,
    };
  }, [selectedUnit, currentUnitType, durationMonths, depositMultiplier, serverPricing]);

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
      // 1. Kiểm tra giới hạn 1 đơn giữ chỗ PENDING_PAYMENT (BR-RES-02)
      if (tokenStorage.getAccessToken()) {
        try {
          const myReservations = await getMyReservationsApi();
          const activePending = myReservations?.find((r) => {
            if (r.status !== 'PENDING_PAYMENT') return false;
            if (!r.holdExpiresAt) return true;
            return new Date(r.holdExpiresAt).getTime() > Date.now();
          });

          if (activePending) {
            setPendingLimitModal({
              isOpen: true,
              pendingReservation: activePending,
            });
            return;
          }
        } catch (err) {
          console.error('Không thể kiểm tra đơn giữ chỗ hiện tại:', err);
        }
      }

      // 2. Realtime Database Unit Availability Validation on Confirm (ISS-76)
      const liveUnitsPage = await fetchStorageUnitsApi(fId, {
        startDate,
        rentalMonths: durationMonths,
        size: 200,
      });
      const liveUnits = liveUnitsPage?.content || [];
      const currentLiveUnit = liveUnits.find((u) => String(u.id) === String(targetUnit.id));

      if (currentLiveUnit) {
        const liveStatus = (currentLiveUnit.status || 'AVAILABLE').toUpperCase();
        if (liveStatus === 'MAINTENANCE') {
          setUnitUnavailableModal({
            isOpen: true,
            title: 'Ô kho đang tạm ngừng hoạt động / Bảo trì',
            message: `Ô kho ${targetUnit.unitNumber} hiện đang được bảo trì hoặc kiểm tra kỹ thuật. Quý khách vui lòng chọn ô kho khác.`,
          });
          return;
        }
        if (liveStatus === 'RESERVED') {
          setUnitUnavailableModal({
            isOpen: true,
            title: 'Ô kho đã có người giữ chỗ',
            message: `Ô kho ${targetUnit.unitNumber} vừa được người khác giữ chỗ. Quý khách vui lòng chọn ô kho khác.`,
          });
          return;
        }
        if (liveStatus === 'OCCUPIED' || liveStatus === 'OVERDUE' || liveStatus === 'LOCKED') {
          setUnitUnavailableModal({
            isOpen: true,
            title: 'Ô kho đã có người thuê',
            message: `Ô kho ${targetUnit.unitNumber} đã có khách hàng thuê. Quý khách vui lòng chọn ô kho khác còn trống.`,
          });
          return;
        }
      }

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

          {/* 1. THỜI GIAN THUÊ (Rent Duration - Segmented Control) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800 block">
              1. Thời gian thuê
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Ngày bắt đầu lưu kho
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
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Thời hạn thuê
                </label>

                {/* Segmented Control phẳng & hiện đại */}
                <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {quickMilestones.map((pkg) => {
                    const isSelected = !isCustomMode && durationMonths === pkg.months;
                    return (
                      <button
                        key={pkg.months}
                        type="button"
                        onClick={() => {
                          setIsCustomMode(false);
                          setDurationMonths(pkg.months);
                        }}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-brand-800 shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        {pkg.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(true)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCustomMode
                        ? 'bg-white text-brand-800 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {isCustomMode ? `${durationMonths}T` : 'Tùy chỉnh'}
                  </button>
                </div>

                {/* Stepper chỉ hiện khi isCustomMode */}
                {isCustomMode && (
                  <div className="flex items-center justify-between p-2 mt-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Số tháng tùy chỉnh:
                    </span>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setDurationMonths(Math.max(1, durationMonths - 1))}
                        disabled={durationMonths <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded-l border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                        title="Giảm 1 tháng"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={durationMonths}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setDurationMonths(isNaN(val) || val < 1 ? 1 : Math.min(120, val));
                        }}
                        className="w-14 h-7 text-center border-y border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setDurationMonths(Math.min(120, durationMonths + 1))}
                        disabled={durationMonths >= 120}
                        className="w-7 h-7 flex items-center justify-center rounded-r border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                        title="Tăng 1 tháng"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-500 ml-1.5">tháng</span>
                    </div>
                  </div>
                )}

                {/* Dòng text xanh nhỏ kích thích mua hàng khi có ưu đãi */}
                {priceCalculation.discountAmount > 0 && (
                  <p className="text-[11px] font-medium text-emerald-700 mt-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Tiết kiệm {priceCalculation.discountPercent}%: <strong>{priceCalculation.discountProgramName || 'Chương trình ưu đãi'}</strong> (-{priceCalculation.discountPercent}%)
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. CHỌN LOẠI KHO & KÍCH THƯỚC (Progressive Disclosure) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800 block">
                2. Chọn loại kho & Kích thước
              </span>
              {loadingAvailability && (
                <span className="text-[11px] text-brand-600 flex items-center gap-1 font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang kiểm tra ô trống...</span>
                </span>
              )}
            </div>

            {/* Bước 2.1: Môi trường kho tabs kèm Tooltip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => handleSelectStorageType('STANDARD')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  storageType === 'STANDARD'
                    ? 'border-[#008B74] bg-[#e6f7f4] shadow-xs ring-2 ring-[#008B74]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📦</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900 block">Kho Tiêu Chuẩn</span>
                      <span className="text-slate-400 hover:text-slate-600 cursor-help" title="Nhiệt độ phòng thoáng khí tự nhiên, phù hợp đồ đạc gia đình, nội thất, hàng hóa thông thường">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Nhiệt độ phòng thoáng khí ({standardTypesCount} loại)</span>
                  </div>
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
                    ? 'border-[#008B74] bg-[#e6f7f4] shadow-xs ring-2 ring-[#008B74]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">❄️</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900 block">Kho Máy Lạnh (24/7)</span>
                      <span className="text-slate-400 hover:text-slate-600 cursor-help" title="Kiểm soát 22°C - 25°C và độ ẩm ổn định, chuyên dụng bảo quản tài liệu, đồ gỗ cao cấp, thiết bị điện tử">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">22°C - 25°C & kiểm soát ẩm ({climateTypesCount} loại)</span>
                  </div>
                </div>
                {storageType === 'CLIMATE_CONTROLLED' && (
                  <div className="w-5 h-5 rounded-full bg-[#008B74] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>

            {/* Bước 2.2: Danh sách Kích thước dạng List Card Rows kèm Accordion Sơ đồ ô kho */}
            {availableTypes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm">
                Hiện tại cơ sở chưa có loại ô kho nào được niêm yết giá chính thức cho danh mục này. Quý khách vui lòng chọn phân loại khác.
              </div>
            ) : (
              <div className="space-y-3">
                {availableTypes.map((type) => {
                  const isUnlisted = !type.baseMonthlyPrice || type.baseMonthlyPrice <= 0 || type.priceStatus === 'UNLISTED' || type.priceStatus === 'Chưa niêm yết';
                  const isSelected = !isUnlisted && selectedTypeId === type.id;
                  const isExpanded = isSelected && expandedTypeId === type.id;
                  const avail = availabilityMap[type.id];
                  const slots = avail ? avail.availableSlots : null;

                  // Lọc các ô kho thuộc loại này để render trong Accordion
                  const unitsForThisType = displayFacilityUnits.filter((u) => u.unitTypeId === type.id);

                  return (
                    <div
                      key={type.id}
                      className={`border-2 rounded-2xl transition-all overflow-hidden ${
                        isUnlisted
                          ? 'border-slate-200 bg-slate-50/60 opacity-60'
                          : isSelected
                          ? 'border-[#008B74] bg-white shadow-xs ring-2 ring-[#008B74]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      {/* Row Header (Clickable Card) */}
                      <button
                        type="button"
                        disabled={isUnlisted}
                        onClick={() => handleSelectType(type)}
                        className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        {/* Cột trái: Tên & Kích thước */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm sm:text-base">
                              {type.name}
                            </span>
                            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Size {type.sizeCategory}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {type.dimensions} • Thể tích: <strong className="text-slate-700 font-mono">{type.volumeM3} m³</strong> ({type.areaM2} m²)
                          </p>
                        </div>

                        {/* Cột phải: Giá niêm yết, Trạng thái & Nút chọn */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-left sm:text-right">
                            {isUnlisted ? (
                              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                Chưa niêm yết giá
                              </span>
                            ) : (
                              <div className="text-base sm:text-lg font-black font-mono text-emerald-700">
                                {formatVND(type.baseMonthlyPrice)}
                                <span className="text-xs font-normal text-slate-500 font-sans">/tháng</span>
                              </div>
                            )}

                            <div className="text-[11px] font-bold mt-0.5">
                              {slots !== null ? (
                                slots > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                    Còn {slots} ô trống
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                    Hết chỗ
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-400 text-[10px]">Đang kiểm tra...</span>
                              )}
                            </div>
                          </div>

                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform ${
                            isSelected
                              ? 'bg-[#008B74] text-white border-[#008B74]'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </button>

                      {/* Bước 2.3: Accordion Sơ đồ ô kho cụ thể của kích thước này */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              Chọn vị trí ô kho cụ thể ({type.name}):
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold flex-wrap">
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span>
                                <span>Còn trống</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded bg-[#008B74]"></span>
                                <span>Đang chọn</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                                <span>Giữ chỗ</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded bg-slate-300"></span>
                                <span>Đã thuê</span>
                              </span>
                            </div>
                          </div>

                          {unitsForThisType.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                              {unitsForThisType.map((unit) => {
                                const isUnitSelected = selectedUnit?.id === unit.id;
                                const isAvailable = unit.status === 'AVAILABLE';
                                const isReserved = (unit.status as string) === 'RESERVED' || (unit.status as string) === 'PENDING_PAYMENT';

                                return (
                                  <button
                                    key={unit.id}
                                    type="button"
                                    disabled={!isAvailable}
                                    onClick={() => handleSelectUnitOnGrid(unit)}
                                    className={`p-3 rounded-xl text-center transition-all cursor-pointer border-2 flex flex-col items-center justify-center ${
                                      isUnitSelected
                                        ? 'bg-[#008B74] text-white border-[#006e5c] shadow-md ring-2 ring-[#008B74]/20 scale-[1.02]'
                                        : isAvailable
                                        ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46] hover:border-[#10b981] hover:bg-[#d1fae5]'
                                        : isReserved
                                        ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af] cursor-not-allowed opacity-70'
                                        : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] cursor-not-allowed opacity-60'
                                    }`}
                                  >
                                    <span className="text-xs font-black font-mono block">
                                      {unit.unitNumber}
                                    </span>
                                    <span className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded block ${
                                      isUnitSelected
                                        ? 'bg-white/20 text-white'
                                        : isAvailable
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : isReserved
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      {isUnitSelected ? 'Đang chọn' : isAvailable ? 'Trống' : isReserved ? 'Giữ chỗ' : 'Đã thuê'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-white rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600">
                              Hiện chưa có ô kho cụ thể nào được gán cho loại này.
                            </div>
                          )}

                          <p className="text-[11px] text-slate-500 font-medium italic">
                            💡 Hệ thống đã tự động gán ô trống khả dụng đầu tiên. Quý khách có thể click chọn ô khác trên sơ đồ để đổi vị trí.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
                  <span>
                    {priceCalculation.discountProgramName
                      ? `${priceCalculation.discountProgramName}${priceCalculation.discountPercent > 0 ? ` (-${priceCalculation.discountPercent}%)` : ''}:`
                      : `Chiết khấu (-${priceCalculation.discountPercent}%):`}
                  </span>
                  <span>-{formatVND(priceCalculation.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tiền đặt cọc ({depositMultiplierLabel} tháng):</span>
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

      {/* Modal cảnh báo giới hạn 1 đơn giữ chỗ PENDING_PAYMENT */}
      <Modal
        isOpen={pendingLimitModal.isOpen}
        onClose={() => setPendingLimitModal({ isOpen: false, pendingReservation: null })}
      >
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Quý khách đang có đơn giữ chỗ</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Quý khách vui lòng thanh toán ô kho{' '}
              <strong className="text-slate-900 font-semibold">
                {pendingLimitModal.pendingReservation?.storageUnitCode || pendingLimitModal.pendingReservation?.code || ''}
              </strong>
              {pendingLimitModal.pendingReservation?.facilityName ? ` (tại ${pendingLimitModal.pendingReservation.facilityName})` : ''}{' '}
              trước khi đặt ô kho khác.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-semibold"
              onClick={() => {
                const rsv = pendingLimitModal.pendingReservation;
                setPendingLimitModal({ isOpen: false, pendingReservation: null });
                if (rsv) {
                  navigate(`/customer/booking?facility=${rsv.facilityId}&reservationId=${rsv.id}`);
                }
              }}
            >
              Thanh toán ô kho đang giữ chỗ
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800"
              onClick={() => setPendingLimitModal({ isOpen: false, pendingReservation: null })}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

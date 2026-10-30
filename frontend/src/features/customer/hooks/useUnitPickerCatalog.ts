import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFacilities } from '@/api/facility';
import { fetchUnitTypes as fetchUnitTypesApi, fetchStorageUnits as fetchStorageUnitsApi } from '@/api/unit';
import { checkUnitAvailability, type AvailabilityResponse } from '@/api/reservation';
import type { FacilityListItem } from '@/types';
import type { StorageType, UnitSizeCategory, StorageUnit, UnitType, UnitStatus } from '../types';
import { resolveSizeCategory, isClimateUnitType, mapApiUnitsToStorageUnits } from '../utils/unitPickerHelpers';
import { findFirstAvailableUnit } from '../utils/pricing';

interface UseUnitPickerCatalogParams {
  facilityParam: string | null;
  initialTypeId: string | null;
  startDate: string;
  durationMonths: number;
}

export function useUnitPickerCatalog({
  facilityParam,
  initialTypeId,
  startDate,
  durationMonths,
}: UseUnitPickerCatalogParams) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [currentFacility, setCurrentFacility] = useState<{ id: string; name: string; address?: string; phone?: string }>({
    id: facilityParam || '',
    name: 'Cơ sở lưu trữ',
  });
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [facilityUnits, setFacilityUnits] = useState<StorageUnit[]>([]);

  const [availabilityMap, setAvailabilityMap] = useState<Record<string, AvailabilityResponse>>({});
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(false);

  const [storageType, setStorageType] = useState<StorageType | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(initialTypeId || null);
  const [selectedSize, setSelectedSize] = useState<UnitSizeCategory>('S');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [facilityInactiveModalOpen, setFacilityInactiveModalOpen] = useState<boolean>(false);

  // 1. Tải danh mục cơ sở & ô kho ban đầu khi facilityParam thay đổi
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
            // Khi không truyền initialTypeId từ URL: không auto-select để khách hàng chủ động click chọn loại kho
            const firstListed = mappedUTs.find((ut) => ut.baseMonthlyPrice > 0);
            if (firstListed) {
              // Giữ storageType = null để khách hàng tự click chọn Kho Tiêu Chuẩn hay Kho Máy Lạnh
            }
          }
        }

        if (suPage?.content && suPage.content.length > 0) {
          /* listedUTIds: Lọc các ô kho hợp lệ từ danh sách types đã niêm yết */
          const mappedSUs = mapApiUnitsToStorageUnits(suPage.content, mappedUTs, String(matchedFac.id));
          setFacilityUnits(mappedSUs);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu cơ sở:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFacilityAndUnits();
    return () => {
      isMounted = false;
    };
  }, [facilityParam, initialTypeId, navigate]);

  // 2. Tải sức chứa ô kho thực tế theo khoảng thời gian khách chọn
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
                const mappedSUs = mapApiUnitsToStorageUnits(suPage.content, unitTypes, currentFacility.id);
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

  // 3. Lọc danh sách loại kho đã niêm yết giá theo storageType (ISS-113)
  const availableTypes = useMemo(() => {
    if (!storageType) return [];
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

  // 4. Loại kho đang được chọn (Chỉ xác định khi người dùng đã chọn selectedTypeId)
  const currentUnitType = useMemo(() => {
    if (selectedTypeId) {
      const matchedById = availableTypes.find((t) => t.id === selectedTypeId);
      if (matchedById) return matchedById;
    }
    return undefined;
  }, [availableTypes, selectedTypeId]);

  // 5. Cập nhật trạng thái ô kho trên sơ đồ theo availability
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

  // 6. Ô kho cụ thể đang được chọn (Chỉ chọn khi khách đã chọn loại kho)
  const selectedUnit = useMemo(() => {
    if (!selectedTypeId) return null;
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

  // 7. Tự động chọn ô kho còn trống đầu tiên khi đổi loại kho hoặc tải trang
  useEffect(() => {
    if (!selectedTypeId) {
      setSelectedUnitId(null);
      return;
    }
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

  // 8. Các hàm xử lý tương tác chọn loại kho / môi trường / ô kho
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
    // Khi đổi môi trường kho: reset để khách hàng chủ động chọn kích thước kho mới
    setSelectedTypeId('');
    setExpandedTypeId(null);
    setSelectedUnitId(null);
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

  return {
    loading,
    currentFacility,
    unitTypes,
    facilityUnits,
    setFacilityUnits,
    availabilityMap,
    loadingAvailability,
    facilityInactiveModalOpen,
    setFacilityInactiveModalOpen,
    storageType,
    setStorageType,
    selectedTypeId,
    setSelectedTypeId,
    expandedTypeId,
    setExpandedTypeId,
    selectedSize,
    setSelectedSize,
    selectedUnitId,
    setSelectedUnitId,
    availableTypes,
    standardTypesCount,
    climateTypesCount,
    currentUnitType,
    displayFacilityUnits,
    selectedUnit,
    handleSelectType,
    handleSelectStorageType,
    handleSelectUnitOnGrid,
  };
}

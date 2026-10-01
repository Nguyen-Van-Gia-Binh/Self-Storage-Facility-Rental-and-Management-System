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
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatVND } from '../utils/pricing';
import { UnitGrid } from '../components/UnitGrid';
import { fetchFacilities } from '@/api/facility';
import { fetchUnitTypes as fetchUnitTypesApi, fetchStorageUnits as fetchStorageUnitsApi } from '@/api/unit';
import { checkUnitAvailability, type AvailabilityResponse } from '@/api/reservation';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import { discountTag, termMonthChoices } from '../utils/policyTerms';
import { tokenStorage } from '@/utils/tokenStorage';
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
  const policy = useActivePolicy();
  const durationPackages = useMemo(() => {
    if (!policy) return [];
    const months = termMonthChoices(policy.renewalMinMonths, policy.renewalMaxMonths);
    return months.map((value) => ({
      months: value,
      label: `${value} Tháng`,
      discountLabel: discountTag(value, 'save') ?? '',
      popular: value === 3,
    }));
  }, [policy]);
  const [durationMonths, setDurationMonths] = useState<number>(
    !isNaN(initialMonthsParam) && initialMonthsParam > 0 ? initialMonthsParam : 3
  );

  useEffect(() => {
    if (!policy) return;
    if (durationMonths < policy.renewalMinMonths || durationMonths > policy.renewalMaxMonths) {
      setDurationMonths(policy.renewalMinMonths);
    }
  }, [policy, durationMonths]);

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
    // Nếu URL không có tham số cơ sở, tự động chuyển hướng về Trang chủ để khách chọn cơ sở
    if (!facilityParam) {
      navigate('/customer', { replace: true });
      return;
    }

    let isMounted = true;

    async function loadFacilityAndUnits() {
      setLoading(true);
      try {
        // 1. Lấy danh sách cơ sở thực tế (chỉ các cơ sở đang ACTIVE)
        const facList = await fetchFacilities();
        if (!isMounted) return;

        // Tìm cơ sở tương ứng theo ID hoặc Code (ví dụ: '1' hoặc 'FAC-HC')
        const matchedFac = facList.find(
          (f: FacilityListItem) => String(f.id) === facilityParam || f.code === facilityParam
        );

        if (!matchedFac) {
          // Cơ sở không tồn tại hoặc đã bị ngừng hoạt động
          setFacilityInactiveModalOpen(true);
          setLoading(false);
          return;
        }
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
                baseMonthlyPrice: ut.monthlyPrice && ut.monthlyPrice > 0 ? ut.monthlyPrice : 0,
                badge: sizeCat === 'M' ? 'POPULAR' : sizeCat === 'L' ? 'SPACIOUS' : undefined,
                priceStatus: ut.priceStatus ?? (ut.monthlyPrice && ut.monthlyPrice > 0 ? 'Đang áp dụng' : 'Chưa niêm yết'),
              };
            });
            setUnitTypes(mappedUTs);

            if (initialTypeId) {
              const found = mappedUTs.find((ut) => ut.id === initialTypeId || ut.code === initialTypeId);
              if (found) {
                const isFoundUnlisted = !found.baseMonthlyPrice || found.baseMonthlyPrice <= 0 || found.priceStatus === 'UNLISTED' || found.priceStatus === 'Chưa niêm yết';
                if (!isFoundUnlisted) {
                  setSelectedTypeId(found.id);
                  setSelectedSize(found.sizeCategory);
                  setStorageType(found.storageType);
                }
              }
            } else {
              // Ưu tiên chọn loại kho đầu tiên đã niêm yết giá
              const firstListed = mappedUTs.find((ut) => ut.baseMonthlyPrice > 0 && ut.priceStatus !== 'UNLISTED' && ut.priceStatus !== 'Chưa niêm yết');
              if (firstListed) {
                setSelectedTypeId(firstListed.id);
                setSelectedSize(firstListed.sizeCategory);
                setStorageType(firstListed.storageType);
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
                monthlyPrice: su.monthlyPrice && su.monthlyPrice > 0
                  ? su.monthlyPrice
                  : (parentType && parentType.baseMonthlyPrice > 0 ? parentType.baseMonthlyPrice : 0),
              };
            });
            setFacilityUnits(mappedSUs);
          } else {
            setFacilityUnits([]);
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
                    monthlyPrice: su.monthlyPrice && su.monthlyPrice > 0
                  ? su.monthlyPrice
                  : (parentType && parentType.baseMonthlyPrice > 0 ? parentType.baseMonthlyPrice : 0),
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
    if (selectedTypeId) {
      const matchedById = availableTypes.find((t) => t.id === selectedTypeId);
      if (matchedById) return matchedById;
    }
    const matchedBySize = availableTypes.find((t) => t.sizeCategory === selectedSize);
    if (matchedBySize) return matchedBySize;
    const firstListed = availableTypes.find(
      (t) => t.baseMonthlyPrice > 0 && t.priceStatus !== 'UNLISTED' && t.priceStatus !== 'Chưa niêm yết'
    );
    return firstListed || availableTypes[0];
  }, [availableTypes, selectedTypeId, selectedSize]);

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

  // Ô kho đang được chọn — chỉ set khi khách chủ động nhấp, không auto-select
  const selectedUnit = useMemo(() => {
    if (selectedUnitId) {
      const found = displayFacilityUnits.find((u) => u.id === selectedUnitId);
      if (!found) return null;
      if (selectedTypeId && found.unitTypeId && found.unitTypeId !== selectedTypeId) return null;
      if (selectedSize && found.sizeCategory !== selectedSize) return null;
      if (storageType && found.storageType !== storageType) return null;
      return found;
    }
    return null; // Không fallback về ô kho mặc định — tránh chọn trước khi khách click
  }, [displayFacilityUnits, selectedUnitId, selectedTypeId, selectedSize, storageType]);

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
    const firstListed = typesForType.find(
      (t) => t.baseMonthlyPrice > 0 && t.priceStatus !== 'UNLISTED' && t.priceStatus !== 'Chưa niêm yết'
    );
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

  const handleProceedToBooking = async (unitToBook?: StorageUnit) => {
    const targetUnit = unitToBook || selectedUnit;
    if (!targetUnit) {
      return;
    }
    const listedPrice = (targetUnit.monthlyPrice && targetUnit.monthlyPrice > 0)
      ? targetUnit.monthlyPrice
      : (currentUnitType?.baseMonthlyPrice ?? 0);
    if (listedPrice <= 0) {
      setUnitUnavailableModal({
        isOpen: true,
        title: 'Loại ô kho chưa niêm yết giá',
        message: 'Loại ô kho này chưa được Ban Quản Trị niêm yết giá chính thức nên tạm thời chưa thể đặt chỗ. Quý khách vui lòng chọn loại kho khác.',
      });
      return;
    }

    const fId = parseInt(currentFacility.id, 10);
    if (isNaN(fId)) return;

    setIsConfirming(true);

    try {
      // 1. Gọi trực tiếp xuống Database kiểm tra trạng thái thời gian thực của ô kho và cơ sở (ISS-76)
      const suPage = await fetchStorageUnitsApi(fId, {
        startDate,
        rentalMonths: durationMonths,
        size: 100,
      });

      // Cập nhật lại sơ đồ ô kho mới nhất từ DB
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
            monthlyPrice: su.monthlyPrice && su.monthlyPrice > 0
              ? su.monthlyPrice
              : (parentType && parentType.baseMonthlyPrice > 0 ? parentType.baseMonthlyPrice : 0),
          };
        });
        setFacilityUnits(mappedSUs);
      }

      // Kiểm tra xem ô kho mục tiêu có còn tồn tại và sẵn sàng không
      const latestUnit = suPage?.content?.find((su) => String(su.id) === String(targetUnit.id));

      if (!latestUnit) {
        setUnitUnavailableModal({
          isOpen: true,
          title: 'Ô kho không tồn tại',
          message: `Ô kho ${targetUnit.unitNumber} không tìm thấy hoặc đã bị thay đổi trên hệ thống. Vui lòng chọn ô kho khác trên sơ đồ.`,
        });
        setSelectedUnitId(null);
        return;
      }

      const statusRaw = (latestUnit.status || 'AVAILABLE').toUpperCase();

      if (statusRaw === 'MAINTENANCE' || statusRaw === 'OUT_OF_SERVICE') {
        setUnitUnavailableModal({
          isOpen: true,
          title: 'Ô kho đang tạm ngừng hoạt động / Bảo trì',
          message: `Ô kho ${targetUnit.unitNumber} hiện đang trong chế độ bảo trì hoặc tạm ngưng phục vụ. Quý khách vui lòng chọn một ô kho còn trống khác trên sơ đồ.`,
        });
        setSelectedUnitId(null);
        return;
      }

      if (statusRaw === 'RESERVED') {
        setUnitUnavailableModal({
          isOpen: true,
          title: 'Ô kho đã có người giữ chỗ',
          message: `Ô kho ${targetUnit.unitNumber} vừa có khách hàng khác thực hiện giữ chỗ trong kỳ hạn bạn đã chọn. Vui lòng chọn ô kho còn trống khác.`,
        });
        setSelectedUnitId(null);
        return;
      }

      if (statusRaw === 'OCCUPIED' || statusRaw === 'LOCKED' || statusRaw === 'OVERDUE') {
        setUnitUnavailableModal({
          isOpen: true,
          title: 'Ô kho đã có người thuê',
          message: `Ô kho ${targetUnit.unitNumber} hiện đã có hợp đồng thuê trong kỳ hạn bạn đã chọn. Vui lòng chọn ô kho còn trống khác.`,
        });
        setSelectedUnitId(null);
        return;
      }

      // 2. Ô kho hoàn toàn khả dụng -> Tiếp tục điều hướng sang trang Đặt chỗ
      const typeIdToPass = targetUnit.unitTypeId || (currentUnitType ? currentUnitType.id : (unitTypes[0]?.id || '1'));

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

      const bookingUrl = `/customer/booking?${params.toString()}`;
      if (!tokenStorage.getAccessToken()) {
        navigate(`/auth/login?redirect=${encodeURIComponent(bookingUrl)}`);
        return;
      }

      navigate(bookingUrl);
    } catch (err: unknown) {
      console.error('Lỗi khi kiểm tra tính sẵn sàng của ô kho thời gian thực:', err);
      const msg = (err as any)?.message || '';
      if (msg.toLowerCase().includes('co so') || msg.toLowerCase().includes('facility') || msg.toLowerCase().includes('ngung hoat dong')) {
        setFacilityInactiveModalOpen(true);
      } else {
        setUnitUnavailableModal({
          isOpen: true,
          title: 'Không thể xác nhận ô kho',
          message: 'Hệ thống không thể kiểm tra trạng thái ô kho vào lúc này. Vui lòng thử lại hoặc chọn ô kho khác.',
        });
      }
    } finally {
      setIsConfirming(false);
    }
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
            onClick={() => handleSelectStorageType('STANDARD')}
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
            onClick={() => handleSelectStorageType('CLIMATE_CONTROLLED')}
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
            const isUnlisted = !type.baseMonthlyPrice || type.baseMonthlyPrice <= 0 || type.priceStatus === 'UNLISTED' || type.priceStatus === 'Chưa niêm yết';
            const isSelected = !isUnlisted && (selectedTypeId ? selectedTypeId === type.id : selectedSize === type.sizeCategory);
            const availInfo = availabilityMap[type.id];

            return (
              <div
                key={type.id}
                onClick={() => {
                  if (!isUnlisted) {
                    handleSelectType(type);
                  }
                }}
                className={`w-full sm:w-[calc(50%-0.6rem)] md:w-[calc(33.333%-0.75rem)] max-w-[290px] rounded-xl p-3.5 border-2 transition-all flex flex-col justify-between ${
                  isUnlisted
                    ? 'opacity-70 cursor-not-allowed bg-slate-50/70 border-dashed border-slate-300'
                    : isSelected
                    ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-sm scale-[1.01] cursor-pointer bg-white'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-2xs cursor-pointer bg-white'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Header & Badge */}
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm font-extrabold text-[#0a1614]">
                      {type.name.split('–')[0]}
                    </h3>
                    {isUnlisted ? (
                      <Badge 
                        variant="warning"
                        className="text-[10px] px-2 py-0.5 whitespace-nowrap shrink-0 bg-amber-50 text-amber-700 border-amber-200"
                      >
                        Chưa niêm yết giá
                      </Badge>
                    ) : type.badge === 'POPULAR' ? (
                      <Badge 
                        variant="primary"
                        className="text-[10px] px-2 py-0.5 whitespace-nowrap shrink-0"
                      >
                        Phổ biến nhất
                      </Badge>
                    ) : null}
                  </div>

                  {/* 3D Cube Icon Visual */}
                  <div className={`h-12 w-full rounded-lg border flex items-center justify-center ${
                    isUnlisted ? 'bg-slate-100/60 border-slate-200' : 'bg-brand-50/40 border-brand-100/60'
                  }`}>
                    <Box className={`w-6 h-6 transition-transform ${
                      isUnlisted ? 'text-slate-300' : isSelected ? 'text-brand-500 scale-110' : 'text-slate-400'
                    }`} />
                  </div>

                  {/* Size & Dimensions */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-baseline justify-between font-bold text-slate-800">
                      <span>Diện tích sàn:</span>
                      <span className={`text-xs font-extrabold ${isUnlisted ? 'text-slate-500' : 'text-brand-700'}`}>
                        {type.areaM2} m² ({type.volumeM3} m³)
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] flex justify-between">
                      <span>Kích thước:</span>
                      <span>{type.dimensions}</span>
                    </div>

                    {/* Sức chứa ô kho trống thời gian thực */}
                    {!isUnlisted && availInfo && (
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
                      {!isUnlisted ? (
                        <>{formatVND(type.baseMonthlyPrice)} <span className="text-[10px] font-normal text-slate-400">/tháng</span></>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Chưa niêm yết
                        </span>
                      )}
                    </span>
                  </div>
                  {!isUnlisted && (availInfo?.surcharges ?? []).map((line) => (
                    <div key={line.name} className="flex items-baseline justify-between text-[11px] text-amber-800">
                      <span>Phụ phí: {line.name}</span>
                      <span className="font-semibold">+{formatVND(line.amount)}</span>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant={isUnlisted ? 'outline' : isSelected ? 'primary' : 'outline'}
                    size="sm"
                    disabled={isUnlisted}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isUnlisted) {
                        handleSelectType(type);
                      }
                    }}
                    className={`w-full gap-1 text-xs py-1.5 font-semibold ${
                      isUnlisted ? 'text-slate-400 bg-slate-100/80 border-slate-200 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUnlisted ? (
                      'Tạm chưa mở đặt'
                    ) : isSelected ? (
                      <>Đang chọn {type.name.split('–')[0] || `Cỡ ${type.sizeCategory}`} <Check className="w-3.5 h-3.5" /></>
                    ) : (
                      `Chọn ${type.name.split('–')[0] || `Cỡ ${type.sizeCategory}`}`
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
              {durationPackages.length === 0 && (
                <span className="col-span-full text-xs text-slate-500">Đang tải kỳ hạn từ chính sách...</span>
              )}
              {durationPackages.map((pkg) => {
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
              Đang lọc {currentUnitType?.name || `Cỡ ${selectedSize}`} • {durationMonths} tháng
            </span>
          </div>
        </div>

        <UnitGrid
          units={displayFacilityUnits}
          selectedUnitId={selectedUnit ? selectedUnit.id : null}
          onSelectUnit={handleSelectUnitOnGrid}
          filterType={storageType}
          filterSize={selectedSize}
          filterUnitTypeId={selectedTypeId}
          onConfirmSelection={handleProceedToBooking}
          isConfirming={isConfirming}
          facilityName={currentFacility.name}
        />
      </div>

      {/* Modal cảnh báo khi cơ sở bị BOM ngừng hoạt động (ISS-75) */}
      <Modal isOpen={facilityInactiveModalOpen} onClose={() => navigate('/customer')}>
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Cơ sở tạm ngừng hoạt động</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cơ sở lưu trữ bạn đang chọn hiện đã tạm dừng phục vụ hoặc không tồn tại trên hệ thống. Quý khách vui lòng chọn cơ sở lưu trữ khác đang hoạt động.
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

      {/* Modal cảnh báo khi ô kho bị bảo trì hoặc có người khác đặt trước (ISS-76) */}
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

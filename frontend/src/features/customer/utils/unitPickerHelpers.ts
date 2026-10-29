import type { UnitSizeCategory } from '../types';

/**
 * Định dạng ngày Việt Nam DD/MM/YYYY từ chuỗi YYYY-MM-DD
 */
export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Tính ngày kết thúc hợp đồng theo chu kỳ số tháng từ ngày bắt đầu
 */
export function calculateEndDate(startDate: string, durationMonths: number): string {
  if (!startDate) return '';
  const [y, m, d] = startDate.split('-').map(Number);
  const date = new Date(y, m - 1 + (durationMonths || 1), d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


/**
 * Nhận diện loại kho máy lạnh (Climate Controlled) chuẩn xác theo mã, tên và mô tả công năng
 */
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

/**
 * Xác định nhóm kích thước chuẩn (S, M, L, XL) từ mã, tên loại kho và diện tích
 */
export function resolveSizeCategory(codeOrName: string, areaM2?: number): UnitSizeCategory {
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

/**
 * Chuẩn hóa danh sách ô kho con từ API sang Domain StorageUnit,
 * tự động lọc bỏ các ô kho thuộc loại kho chưa niêm yết giá (ISS-113).
 */
export function mapApiUnitsToStorageUnits(
  rawUnits: any[],
  unitTypes: any[],
  fallbackFacilityId: string
): any[] {
  const listedUTIds = new Set(
    unitTypes
      .filter((ut) => ut.baseMonthlyPrice > 0 && ut.priceStatus !== 'UNLISTED' && ut.priceStatus !== 'Chưa niêm yết')
      .map((ut) => String(ut.id))
  );

  return rawUnits
    .filter((su) => listedUTIds.has(String(su.unitTypeId)))
    .map((su) => {
      const parentType = unitTypes.find((ut) => String(ut.id) === String(su.unitTypeId));
      const sizeCat = parentType ? parentType.sizeCategory : 'S';
      const sType = parentType ? parentType.storageType : 'STANDARD';
      const statusRaw = (su.status || 'AVAILABLE').toUpperCase();

      let unitStatus = 'AVAILABLE';
      if (statusRaw === 'OCCUPIED') unitStatus = 'OCCUPIED';
      else if (statusRaw === 'RESERVED') unitStatus = 'RESERVED';
      else if (statusRaw === 'MAINTENANCE') unitStatus = 'MAINTENANCE';
      else if (statusRaw === 'OVERDUE') unitStatus = 'OVERDUE';
      else if (statusRaw === 'LOCKED') unitStatus = 'LOCKED';

      return {
        id: String(su.id),
        unitNumber: su.code || `S-${su.id}`,
        facilityId: String(su.facilityId || fallbackFacilityId),
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
}


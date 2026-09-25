/**
 * Pricing, Surcharge & Policy API — BM-02 & BM-03 (T2.13)
 * API-SPEC.md § 6 (Unit Types Price) & § 10 (Policies & Surcharges)
 */
import { apiClient, isMockEnabled } from './client';
import type {
  UnitTypeCatalog,
  SurchargeItem,
  CreateSurchargeRequest,
  ActivePolicyInfo,
} from '@/types';
import mockUnitTypesData from '@/mock/mock-unit-types.json';

export interface FacilityPriceItem {
  id: number;
  facilityId: number;
  unitTypeId: number;
  unitTypeCode?: string;
  unitTypeName: string;
  monthlyPrice: number;
  effectiveDate?: string;
  updatedAt?: string;
}

export interface UpdatePricePayload {
  monthlyPrice: number;
}

// Mock in-memory state for Unit Type prices
const inMemoryUnitTypes: Record<string, UnitTypeCatalog[]> = JSON.parse(
  JSON.stringify(mockUnitTypesData)
);

// Mock initial Surcharges list
const initialSurcharges: SurchargeItem[] = [
  {
    id: 1,
    name: 'Cấp lại Access Card / Thẻ từ',
    facilityId: null, // Áp dụng toàn hệ thống
    facilityName: 'Toàn hệ thống',
    unitTypeId: null,
    amount: 150000,
    type: 'FIXED',
    effectiveDate: '2026-09-01',
    isActive: true,
  },
  {
    id: 2,
    name: 'Phụ phí quản lý tầng 3 (Có thang máy)',
    facilityId: 1,
    facilityName: 'Kho Quận 1 — 123 Lê Lợi',
    unitTypeId: null,
    amount: 100000,
    type: 'FIXED',
    effectiveDate: '2026-10-01',
    isActive: true,
  },
  {
    id: 3,
    name: 'Phụ phí bảo quản lạnh đặc biệt',
    facilityId: 2,
    facilityName: 'Kho Tân Bình — 456 Hoàng Văn Thụ',
    unitTypeId: null,
    amount: 5, // 5% trên đơn giá thuê tháng
    type: 'PERCENTAGE',
    effectiveDate: '2026-10-01',
    isActive: true,
  },
];

const inMemorySurcharges: SurchargeItem[] = [...initialSurcharges];

// Mock Active Policy
const mockActivePolicy: ActivePolicyInfo = {
  id: 1,
  version: '2026-Q4',
  effectiveDate: '2026-10-01',
  depositMultiplier: 1.0, // 1 tháng tiền cọc BR-DEP-01
  reservationHoldHours: 48, // Giữ chỗ 48h BR-RES-02
  rentalDailyDivisor: 30, // Quy đổi ngày BR-PRC-02
  checkinGraceDays: 3, // Ân hạn check-in 3 ngày BR-CHK-02
  cancelFullRefundHours: 48, // Hủy trước 48h hoàn 100% BR-CAN-01
  cancelLateRefundRate: 0.5, // Hủy muộn hoàn 50% BR-CAN-02
  renewalMinMonths: 1,
  renewalMaxMonths: 12,
  overdueGraceDays: 3, // Ân hạn quá hạn 3 ngày BR-OVD-01
  overdueDailyRate: 0.1, // 10% / ngày sau ân hạn BR-OVD-03
  overdueCapRate: 0.7, // Trần phí quá hạn 70% BR-OVD-04
  returnNoticeDays: 7, // Báo trả trước 7 ngày BR-RET-01
};

/**
 * Lấy bảng giá của tất cả loại ô kho tại một cơ sở (BM-03)
 */
export async function getFacilityPrices(facilityId: number): Promise<FacilityPriceItem[]> {
  if (isMockEnabled('WS3')) {
    const list = inMemoryUnitTypes[String(facilityId)] || [];
    return list.map((u) => ({
      id: u.id,
      facilityId,
      unitTypeId: u.id,
      unitTypeName: u.name,
      monthlyPrice: u.monthlyPrice,
      effectiveDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    }));
  }
  return await apiClient<FacilityPriceItem[]>(`/facilities/${facilityId}/prices`);
}

/**
 * Cập nhật đơn giá tháng cho loại ô kho tại cơ sở qua PUT chuẩn (BM-03)
 */
export async function updateUnitPrice(
  facilityId: number,
  unitTypeId: number,
  payload: UpdatePricePayload
): Promise<FacilityPriceItem> {
  if (isMockEnabled('WS3')) {
    const list = inMemoryUnitTypes[String(facilityId)] || [];
    const item = list.find((u) => u.id === unitTypeId);
    if (!item) {
      throw { status: 404, message: 'Không tìm thấy loại ô kho', timestamp: new Date().toISOString() };
    }
    item.monthlyPrice = payload.monthlyPrice;
    return {
      id: item.id,
      facilityId,
      unitTypeId: item.id,
      unitTypeName: item.name,
      monthlyPrice: item.monthlyPrice,
      updatedAt: new Date().toISOString(),
    };
  }

  return await apiClient<FacilityPriceItem>(`/facilities/${facilityId}/prices/${unitTypeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Cập nhật đơn giá thuê tháng cho Unit Type tại một Facility (Tương thích ngược) (BM-03)
 */
export async function updateUnitTypePrice(
  facilityId: number,
  unitTypeId: number,
  monthlyPrice: number,
  _effectiveDate?: string
): Promise<UnitTypeCatalog> {
  const res = await updateUnitPrice(facilityId, unitTypeId, { monthlyPrice });
  const list = inMemoryUnitTypes[String(facilityId)] || [];
  const found = list.find((u) => u.id === unitTypeId);
  if (found) {
    found.monthlyPrice = monthlyPrice;
  }
  return {
    id: res.unitTypeId || res.id,
    facilityId,
    name: res.unitTypeName || found?.name || `Loại ô kho #${unitTypeId}`,
    monthlyPrice: res.monthlyPrice,
    description: found?.description || '',
    widthM: found?.widthM || 0,
    depthM: found?.depthM || 0,
    heightM: found?.heightM || 0,
    areaM2: found?.areaM2 || 0,
    totalUnits: found?.totalUnits || 0,
    isActive: found?.isActive ?? true,
  };
}

/**
 * Danh sách phụ phí (BM-03)
 */
export async function fetchSurcharges(params?: {
  facilityId?: number;
  isActive?: boolean;
}): Promise<SurchargeItem[]> {
  if (isMockEnabled('WS3')) {
    let result = [...inMemorySurcharges];
    if (params?.facilityId !== undefined) {
      result = result.filter((s) => s.facilityId === null || s.facilityId === params.facilityId);
    }
    if (params?.isActive !== undefined) {
      result = result.filter((s) => s.isActive === params.isActive);
    }
    return result;
  }

  const qs = new URLSearchParams();
  if (params?.facilityId !== undefined) qs.set('facilityId', String(params.facilityId));
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
  const url = qs.toString() ? `/surcharges?${qs}` : '/surcharges';
  const res = await apiClient<{ content: SurchargeItem[] }>(url);
  return res.content;
}

/**
 * Tạo phụ phí mới (BM-03)
 */
export async function createSurcharge(data: CreateSurchargeRequest): Promise<SurchargeItem> {
  if (isMockEnabled('WS3')) {
    const nextId = Math.max(...inMemorySurcharges.map((s) => s.id), 0) + 1;
    const newItem: SurchargeItem = {
      id: nextId,
      name: data.name,
      facilityId: data.facilityId ?? null,
      facilityName: data.facilityId ? `Cơ sở #${data.facilityId}` : 'Toàn hệ thống',
      unitTypeId: data.unitTypeId ?? null,
      amount: data.amount,
      type: data.type,
      effectiveDate: data.effectiveDate,
      isActive: true,
    };
    inMemorySurcharges.unshift(newItem);
    return newItem;
  }

  return await apiClient<SurchargeItem>('/surcharges', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Lấy chính sách cọc & quá hạn đang hiệu lực (BM-02 / BM-03)
 */
export async function fetchActivePolicy(): Promise<ActivePolicyInfo> {
  if (isMockEnabled('WS3')) {
    return { ...mockActivePolicy };
  }

  try {
    return await apiClient<ActivePolicyInfo>('/policies/active');
  } catch (err) {
    console.warn('Lỗi gọi /policies/active, fallback mock policy:', err);
    return { ...mockActivePolicy };
  }
}

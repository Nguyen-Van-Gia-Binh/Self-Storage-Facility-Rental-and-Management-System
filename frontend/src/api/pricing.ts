/**
 * Pricing, Surcharge & Policy API — BM-02 & BM-03 (T2.13)
 * API-SPEC.md § 6 (Unit Types Price) & § 10 (Policies & Surcharges)
 * Gọi trực tiếp dữ liệu từ Backend CSDL (Không mock, không hardcode)
 */
import { apiClient } from './client';
import type { PageResponse } from './client';
import type {
  UnitTypeCatalog,
  SurchargeItem,
  CreateSurchargeRequest,
  ActivePolicyInfo,
} from '@/types';

export interface FacilityPriceItem {
  id: number;
  facilityId: number;
  unitTypeId: number;
  unitTypeCode?: string;
  unitTypeName: string;
  monthlyPrice: number;
  pricePerM2?: number | null;
  effectiveDate?: string;
  effectiveFrom?: string;
  priceStatus?: string | null;
  scheduledEffectiveFrom?: string | null;
  scheduledPricePerM2?: number | null;
  updatedAt?: string;
}

export interface UpdatePricePayload {
  pricePerM2: number;
  effectiveDate?: string;
  /** Legacy — không dùng từ UI mới */
  monthlyPrice?: number;
}

export interface PriceVersionItem {
  id: number;
  facilityId: number;
  unitTypeId: number;
  unitTypeCode?: string;
  unitTypeName?: string;
  pricePerM2: number;
  monthlyPrice: number;
  effectiveFrom: string;
  status: string;
  createdAt?: string;
}

/**
 * Lấy bảng giá của tất cả loại ô kho tại một cơ sở (BM-03)
 * Gọi endpoint: GET /api/v1/facilities/{facilityId}/prices
 */
export async function getFacilityPrices(facilityId: number): Promise<FacilityPriceItem[]> {
  return await apiClient<FacilityPriceItem[]>(`/facilities/${facilityId}/prices`);
}

/**
 * Cập nhật đơn giá tháng cho loại ô kho tại cơ sở qua PUT chuẩn (BM-03)
 * Gọi endpoint: PUT /api/v1/facilities/{facilityId}/prices/{unitTypeId}
 */
export async function updateUnitPrice(
  facilityId: number,
  unitTypeId: number,
  payload: UpdatePricePayload
): Promise<FacilityPriceItem> {
  return await apiClient<FacilityPriceItem>(`/facilities/${facilityId}/prices/${unitTypeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Cập nhật đơn giá m² cho Unit Type tại Facility (BM-03 / BR-GEN-05)
 */
export async function updateUnitTypePrice(
  facilityId: number,
  unitTypeId: number,
  pricePerM2: number,
  effectiveDate?: string
): Promise<UnitTypeCatalog> {
  const res = await updateUnitPrice(facilityId, unitTypeId, {
    pricePerM2,
    effectiveDate,
  });
  return {
    id: res.unitTypeId || res.id,
    facilityId,
    name: res.unitTypeName || `Loại ô kho #${unitTypeId}`,
    monthlyPrice: res.monthlyPrice,
    pricePerM2: res.pricePerM2 ?? pricePerM2,
    priceStatus: res.priceStatus,
    scheduledEffectiveFrom: res.scheduledEffectiveFrom ?? null,
    scheduledPricePerM2: res.scheduledPricePerM2 ?? null,
    description: '',
    widthM: 0,
    depthM: 0,
    heightM: 0,
    areaM2: 0,
    totalUnits: 0,
    isActive: true,
  };
}

/**
 * Lịch sử phiên bản giá tại cơ sở (BOM)
 */
export async function fetchPriceHistory(
  facilityId: number,
  unitTypeId?: number
): Promise<PriceVersionItem[]> {
  const qs = new URLSearchParams();
  if (unitTypeId != null) qs.set('unitTypeId', String(unitTypeId));
  const url = qs.toString()
    ? `/facilities/${facilityId}/prices/history?${qs}`
    : `/facilities/${facilityId}/prices/history`;
  return await apiClient<PriceVersionItem[]>(url);
}

/**
 * Danh sách phụ phí (BM-03)
 * Gọi endpoint: GET /api/v1/surcharges
 */
export async function fetchSurcharges(params?: {
  facilityId?: number;
  isActive?: boolean;
}): Promise<SurchargeItem[]> {
  const qs = new URLSearchParams({ size: '100' });
  if (params?.facilityId !== undefined) qs.set('facilityId', String(params.facilityId));
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
  const res = await apiClient<PageResponse<SurchargeItem>>(`/surcharges?${qs}`);
  return res.content ?? [];
}

/**
 * Tạo phụ phí mới (BM-03)
 * Gọi endpoint: POST /api/v1/surcharges
 */
export async function createSurcharge(data: CreateSurchargeRequest): Promise<SurchargeItem> {
  return await apiClient<SurchargeItem>('/surcharges', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Lấy chính sách cọc & quá hạn đang hiệu lực trực tiếp từ CSDL (BM-02 / BM-03)
 * Gọi endpoint: GET /api/v1/policies/active
 */
export async function fetchActivePolicy(): Promise<ActivePolicyInfo> {
  const res = await apiClient<any>('/policies/active');
  return {
    id: res.id,
    version: res.version || (res.versionNo ? `v${res.versionNo}` : '2026-Q4'),
    effectiveDate: (res.effectiveDate || res.effectiveFrom || '').split('T')[0],
    depositMultiplier: Number(res.depositMultiplier ?? 1.0),
    reservationHoldHours: Number(res.reservationHoldHours ?? 48),
    rentalDailyDivisor: Number(res.rentalDailyDivisor ?? 30),
    checkinGraceDays: Number(res.checkinGraceDays ?? 10),
    cancelFullRefundHours: Number(res.cancelFullRefundHours ?? 48),
    cancelLateRefundRate: Number(res.cancelLateRefundRate ?? 0.0),
    renewalMinMonths: Number(res.renewalMinMonths ?? 1),
    renewalMaxMonths: Number(res.renewalMaxMonths ?? 12),
    overdueGraceDays: Number(res.overdueGraceDays ?? 3),
    overdueDailyRate: Number(res.overdueDailyRate ?? 0.1),
    overdueCapRate: Number(res.overdueCapRate ?? 0.7),
    returnNoticeDays: Number(res.returnNoticeDays ?? 30),
    returnRefundWorkingDays: Number(res.returnRefundWorkingDays ?? 7),
  };
}

export interface PolicyPublishPayload {
  effectiveFrom: string;
  depositMultiplier: number;
  reservationHoldHours: number;
  rentalBufferDays: number;
  rentalDailyDivisor: number;
  checkinGraceDays: number;
  cancelFullRefundHours: number;
  cancelLateRefundRate: number;
  cancelNoShowRefundRate: number;
  renewalReminderDays: string;
  renewalMinMonths: number;
  renewalMaxMonths: number;
  overdueGraceDays: number;
  overdueDailyRate: number;
  overdueCapRate: number;
  overdueNoticeDays: number;
  overdueLockAccessDays: number;
  overdueTerminationDays: number;
  returnNoticeDays: number;
  returnRefundWorkingDays: number;
  returnEarlyRefundRate: number;
  accessPinLength: number;
  supportUrgentSlaHours: number;
  supportAutoCloseWorkingDays: number;
}

export async function fetchPolicyForPublish(): Promise<PolicyPublishPayload & { versionNo?: number }> {
  return await apiClient('/policies/active');
}

export async function publishPolicy(data: PolicyPublishPayload): Promise<PolicyPublishPayload & { versionNo?: number }> {
  return await apiClient('/policies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

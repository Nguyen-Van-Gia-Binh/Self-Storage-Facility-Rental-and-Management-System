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
export interface PriceAuditField {
  key: string;
  label: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface PriceAuditActor {
  id: number;
  name: string;
}

export interface PriceAuditEntry {
  id: string;
  category: 'RENT' | 'SURCHARGE' | 'POLICY';
  recordedAt?: string | null;
  actorId?: number | null;
  actorName: string;
  subject: string;
  facilityId?: number | null;
  facilityName?: string | null;
  changeSummary: string;
  changes: PriceAuditField[];
  snapshot: PriceAuditField[];
  effectiveFrom?: string | null;
  status: string;
}

export interface PriceAuditPage {
  content: PriceAuditEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  actors: PriceAuditActor[];
}

export async function fetchPriceAudit(params: {
  category?: string;
  facilityId?: number;
  from?: string;
  to?: string;
  actorId?: number;
  page?: number;
  size?: number;
}): Promise<PriceAuditPage> {
  const qs = new URLSearchParams();
  if (params.category && params.category !== 'ALL') qs.set('category', params.category);
  if (params.facilityId != null) qs.set('facilityId', String(params.facilityId));
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.actorId != null) qs.set('actorId', String(params.actorId));
  qs.set('page', String(params.page ?? 0));
  qs.set('size', String(params.size ?? 20));
  return await apiClient<PriceAuditPage>(`/pricing/audit?${qs}`);
}

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

export async function updateSurcharge(
  item: SurchargeItem,
  patch: {
    name?: string;
    category?: string;
    amount?: number;
    isActive?: boolean;
    effectiveDate?: string;
  },
): Promise<SurchargeItem> {
  const body: {
    name: string;
    amount: number;
    isActive: boolean;
    category?: string;
    effectiveDate?: string;
  } = {
    name: patch.name ?? item.name,
    amount: patch.amount ?? item.amount,
    isActive: patch.isActive ?? item.isActive,
    category: patch.category ?? item.category,
  };
  if (patch.effectiveDate) {
    body.effectiveDate = patch.effectiveDate;
  }
  return await apiClient<SurchargeItem>(`/surcharges/${item.id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
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
    version: res.versionNo != null ? `v${res.versionNo}` : (res.version || '2026-Q4'),
    effectiveDate: vietnamCalendarDate(res.effectiveFrom || res.effectiveDate),
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
    rentalBufferDays: Number(res.rentalBufferDays ?? 15),
    cancelNoShowRefundRate: Number(res.cancelNoShowRefundRate ?? 0),
    renewalReminderDays: typeof res.renewalReminderDays === 'string' ? res.renewalReminderDays : '',
    returnEarlyRefundRate: Number(res.returnEarlyRefundRate ?? 0),
    overdueLockAccessDays: Number(res.overdueLockAccessDays ?? 10),
    overdueTerminationDays: Number(res.overdueTerminationDays ?? 10),
    accessPinLength: Number(res.accessPinLength ?? 6),
    supportUrgentSlaHours: Number(res.supportUrgentSlaHours ?? 2),
    supportAutoCloseWorkingDays: Number(res.supportAutoCloseWorkingDays ?? 7),
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

export type PolicyVersionStatus = 'Đang hiệu lực' | 'Chưa áp dụng' | 'Đã thay thế';

export interface PolicyVersionListItem {
  id: number;
  versionNo: number;
  effectiveDate: string;
  status: PolicyVersionStatus;
}

function vietnamCalendarDate(value?: string | null): string {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value).split('T')[0];
  }
  return parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export async function fetchPolicyVersions(): Promise<PolicyVersionListItem[]> {
  const page = await apiClient<{ content?: Array<{ id?: number; versionNo?: number; effectiveFrom?: string }> }>(
    '/policies?page=0&size=50&sort=versionNo,desc'
  );
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const rows = (page.content ?? [])
    .filter((item) => item.versionNo != null)
    .map((item) => ({
      id: item.id ?? 0,
      versionNo: item.versionNo as number,
      effectiveDate: vietnamCalendarDate(item.effectiveFrom),
    }));
  const applied = rows
    .filter((row) => row.effectiveDate && row.effectiveDate <= today)
    .sort((left, right) => right.versionNo - left.versionNo)[0];
  return rows.map((row) => ({
    ...row,
    status: !row.effectiveDate || row.effectiveDate > today
      ? 'Chưa áp dụng'
      : applied && row.versionNo === applied.versionNo
        ? 'Đang hiệu lực'
        : 'Đã thay thế',
  }));
}

export function nextScheduledPolicy(
  versions: PolicyVersionListItem[]
): { version: string; effectiveDate: string } | null {
  const scheduled = versions
    .filter((item) => item.status === 'Chưa áp dụng' && item.effectiveDate)
    .sort((left, right) => right.versionNo - left.versionNo)[0];
  if (!scheduled) {
    return null;
  }
  return { version: `v${scheduled.versionNo}`, effectiveDate: scheduled.effectiveDate };
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

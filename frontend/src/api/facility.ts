/**
 * Facility API — SC-01 (T2.16) & BM-01 (T2.13)
 * API-SPEC.md § 5 (Facility) & § 6 (Unit Types + Availability)
 * Gọi trực tiếp dữ liệu từ Backend CSDL (Không mock, không hardcode)
 */
import { apiClient } from './client';
import type { ApiResponse } from './client';
import type {
  FacilityListItem,
  FacilityDetail,
  UnitTypeCatalog,
  AvailabilityResult,
  AvailabilityQuery,
  CreateFacilityRequest,
  UpdateFacilityRequest,
} from '@/types';

export async function fetchFacilities(keyword?: string, includeInactive = false): Promise<FacilityListItem[]> {
  const qs = new URLSearchParams({ size: '50' });
  if (!includeInactive) qs.set('isActive', 'true');
  if (keyword) qs.set('keyword', keyword);
  const res = await apiClient<{ content: FacilityListItem[] }>(`/facilities?${qs}`);
  return (res.content ?? []).filter(isListedFacility);
}

function isListedFacility(facility: { name?: string; code?: string }): boolean {
  const name = (facility.name || '').toLowerCase();
  const code = (facility.code || '').toLowerCase();
  return !name.includes('sadas') && !code.includes('sadas');
}

/** Tải hết cơ sở đang hoạt động, không dừng ở một trang. */
export async function fetchAllActiveFacilities(): Promise<FacilityListItem[]> {
  const all: FacilityListItem[] = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages) {
    const qs = new URLSearchParams({
      size: '50',
      page: String(page),
      isActive: 'true',
    });
    const res = await apiClient<{ content: FacilityListItem[]; totalPages?: number }>(`/facilities?${qs}`);
    const batch = (res.content ?? []).filter(isListedFacility);
    all.push(...batch);
    totalPages = res.totalPages && res.totalPages > 0 ? res.totalPages : 1;
    if (batch.length === 0) break;
    page += 1;
  }
  return all;
}

/**
 * Cơ sở được phân công cho người đang đăng nhập (SA-03).
 * Admin và BOM nhận mọi cơ sở đang hoạt động. Manager và Staff nhận đúng các cơ sở đã gán.
 */
export async function fetchMyAssignedFacilities(): Promise<FacilityListItem[]> {
  const res = await apiClient<ApiResponse<FacilityListItem[]>>('/facilities/my-assigned-facilities');
  const list = Array.isArray(res?.data) ? res.data : [];
  return list.filter(isListedFacility);
}

export async function fetchFacilityById(id: number): Promise<FacilityDetail> {
  return await apiClient<FacilityDetail>(`/facilities/${id}`);
}

export async function fetchUnitTypes(facilityId: number): Promise<UnitTypeCatalog[]> {
  const res = await apiClient<{ content: UnitTypeCatalog[] }>(`/facilities/${facilityId}/unit-types?isActive=true&size=50`);
  return res.content ?? [];
}

export async function checkAvailability(facilityId: number, unitTypeId: number, query: AvailabilityQuery): Promise<AvailabilityResult> {
  const qs = new URLSearchParams({ startDate: query.startDate, rentalMonths: String(query.rentalMonths) });
  return await apiClient<AvailabilityResult>(`/facilities/${facilityId}/unit-types/${unitTypeId}/availability?${qs}`);
}

// --- BOM Facility Management APIs (BM-01) ---

export async function createFacility(data: CreateFacilityRequest): Promise<FacilityDetail> {
  return await apiClient<FacilityDetail>('/facilities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFacility(id: number, data: UpdateFacilityRequest): Promise<FacilityDetail> {
  return await apiClient<FacilityDetail>(`/facilities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleFacilityStatus(id: number, isActive: boolean): Promise<FacilityDetail> {
  return await apiClient<FacilityDetail>(`/facilities/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

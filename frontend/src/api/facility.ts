/**
 * Facility API — SC-01 (T2.16) & BM-01 (T2.13)
 * API-SPEC.md § 5 (Facility) & § 6 (Unit Types + Availability)
 */
import { apiClient } from './client';
import type {
  FacilityListItem,
  FacilityDetail,
  UnitTypeCatalog,
  AvailabilityResult,
  AvailabilityQuery,
  CreateFacilityRequest,
  UpdateFacilityRequest,
} from '@/types';
import mockFacilities from '@/mock/mock-facilities.json';
import mockUnitTypesData from '@/mock/mock-unit-types.json';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Bộ nhớ in-memory cho các thao tác mock để phản hồi tức thì
const inMemoryFacilities: FacilityListItem[] = [...(mockFacilities as FacilityListItem[])];

export async function fetchFacilities(keyword?: string, includeInactive = false): Promise<FacilityListItem[]> {
  if (USE_MOCK) {
    let list = inMemoryFacilities;
    if (!includeInactive) {
      list = list.filter((f) => f.isActive);
    }
    if (!keyword) return list;
    const q = keyword.toLowerCase();
    return list.filter((f) => f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q));
  }

  const qs = new URLSearchParams({ size: '50' });
  if (!includeInactive) qs.set('isActive', 'true');
  if (keyword) qs.set('keyword', keyword);
  const res = await apiClient<{ content: FacilityListItem[] }>(`/facilities?${qs}`);
  return res.content;
}

export async function fetchFacilityById(id: number): Promise<FacilityDetail> {
  if (USE_MOCK) {
    const found = (mockFacilities as FacilityListItem[]).find((f) => f.id === id);
    if (!found) throw { status: 404, message: 'Không tìm thấy cơ sở', timestamp: new Date().toISOString() };
    return found as unknown as FacilityDetail;
  }

  return await apiClient<FacilityDetail>(`/facilities/${id}`);
}

export async function fetchUnitTypes(facilityId: number): Promise<UnitTypeCatalog[]> {
  if (USE_MOCK) {
    const map = mockUnitTypesData as Record<string, UnitTypeCatalog[]>;
    return map[String(facilityId)] ?? [];
  }

  const res = await apiClient<{ content: UnitTypeCatalog[] }>(`/facilities/${facilityId}/unit-types?isActive=true&size=50`);
  return res.content ?? [];
}

export async function checkAvailability(facilityId: number, unitTypeId: number, query: AvailabilityQuery): Promise<AvailabilityResult> {
  if (USE_MOCK) {
    const map = mockUnitTypesData as Record<string, UnitTypeCatalog[]>;
    const ut = (map[String(facilityId)] ?? []).find((u) => u.id === unitTypeId);
    if (!ut) throw { status: 404, message: 'Không tìm thấy loại ô kho', timestamp: new Date().toISOString() };
    const end = new Date(query.startDate);
    end.setMonth(end.getMonth() + query.rentalMonths);
    return {
      facilityId,
      unitTypeId,
      startDate: query.startDate,
      endDateExclusive: end.toISOString().split('T')[0],
      rentalMonths: query.rentalMonths,
      availableSlots: Math.max(0, ut.totalUnits - 1),
      monthlyPrice: ut.monthlyPrice,
      totalRentalFee: ut.monthlyPrice * query.rentalMonths,
      depositAmount: ut.monthlyPrice, // BR-DEP-01
    };
  }

  const qs = new URLSearchParams({ startDate: query.startDate, rentalMonths: String(query.rentalMonths) });
  return await apiClient<AvailabilityResult>(`/facilities/${facilityId}/unit-types/${unitTypeId}/availability?${qs}`);
}

// --- BOM Facility Management APIs (BM-01) ---

export async function createFacility(data: CreateFacilityRequest): Promise<FacilityDetail> {
  if (USE_MOCK) {
    const nextId = Math.max(...inMemoryFacilities.map((f) => f.id), 0) + 1;
    const now = new Date().toISOString();
    const createdDetail: FacilityDetail = {
      id: nextId,
      code: data.code,
      name: data.name,
      address: data.address,
      phone: data.phone || '028-1234-5678',
      description: data.description || '',
      openingHours: data.openingHours || '06:00–22:00',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryFacilities.unshift({
      ...createdDetail,
      lowestMonthlyPrice: 800000,
      activeUnitTypeCount: 0,
    });
    return createdDetail;
  }

  return await apiClient<FacilityDetail>('/facilities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFacility(id: number, data: UpdateFacilityRequest): Promise<FacilityDetail> {
  if (USE_MOCK) {
    const idx = inMemoryFacilities.findIndex((f) => f.id === id);
    if (idx === -1) {
      throw { status: 404, message: 'Không tìm thấy cơ sở', timestamp: new Date().toISOString() };
    }
    const current = inMemoryFacilities[idx];
    const now = new Date().toISOString();
    const updatedDetail: FacilityDetail = {
      ...current,
      name: data.name,
      address: data.address,
      phone: data.phone || current.phone,
      description: data.description !== undefined ? data.description : current.description,
      openingHours: data.openingHours || current.openingHours,
      updatedAt: now,
    };
    inMemoryFacilities[idx] = {
      ...inMemoryFacilities[idx],
      ...updatedDetail,
    };
    return updatedDetail;
  }

  return await apiClient<FacilityDetail>(`/facilities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleFacilityStatus(id: number, isActive: boolean): Promise<FacilityDetail> {
  if (USE_MOCK) {
    const idx = inMemoryFacilities.findIndex((f) => f.id === id);
    if (idx === -1) {
      throw { status: 404, message: 'Không tìm thấy cơ sở', timestamp: new Date().toISOString() };
    }
    // Giả lập AC-2: Không tắt cơ sở nếu có id = 1 (mô phỏng cơ sở đang có hợp đồng active)
    if (!isActive && id === 999) {
      throw {
        status: 409,
        errorCode: 'FACILITY_HAS_ACTIVE_CONTRACTS',
        message: 'Không thể ngừng khai thác: Cơ sở đang còn hợp đồng thuê còn hiệu lực.',
        timestamp: new Date().toISOString(),
      };
    }
    inMemoryFacilities[idx].isActive = isActive;
    return inMemoryFacilities[idx] as unknown as FacilityDetail;
  }

  return await apiClient<FacilityDetail>(`/facilities/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

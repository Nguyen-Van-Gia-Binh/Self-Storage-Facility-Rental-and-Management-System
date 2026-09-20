/**
 * Public Catalog API — SC-01 (T2.16)
 * All endpoints PUBLIC — no JWT required.
 * API-SPEC.md § 5 (Facility) & § 6 (Unit Types + Availability)
 */
import { apiClient } from './client';
import type { FacilityListItem, FacilityDetail, UnitTypeCatalog, AvailabilityResult, AvailabilityQuery } from '@/types';
import mockFacilities from '@/mock/mock-facilities.json';
import mockUnitTypesData from '@/mock/mock-unit-types.json';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export async function fetchFacilities(keyword?: string): Promise<FacilityListItem[]> {
  if (USE_MOCK) {
    const all = mockFacilities as FacilityListItem[];
    if (!keyword) return all.filter((f) => f.isActive);
    const q = keyword.toLowerCase();
    return all.filter((f) => f.isActive && (f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q)));
  }

  try {
    const qs = new URLSearchParams({ size: '50', isActive: 'true' });
    if (keyword) qs.set('keyword', keyword);
    const res = await apiClient<{ content: FacilityListItem[] }>(`/facilities?${qs}`);
    return res.content;
  } catch (err) {
    console.warn('Lỗi gọi API /facilities, fallback sang mock data:', err);
    const all = mockFacilities as FacilityListItem[];
    if (!keyword) return all.filter((f) => f.isActive);
    const q = keyword.toLowerCase();
    return all.filter((f) => f.isActive && (f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q)));
  }
}

export async function fetchFacilityById(id: number): Promise<FacilityDetail> {
  if (USE_MOCK) {
    const found = (mockFacilities as FacilityListItem[]).find((f) => f.id === id);
    if (!found) throw { status: 404, message: 'Không tìm thấy cơ sở', timestamp: new Date().toISOString() };
    return found as unknown as FacilityDetail;
  }

  try {
    return await apiClient<FacilityDetail>(`/facilities/${id}`);
  } catch (err) {
    console.warn(`Lỗi gọi API /facilities/${id}, fallback sang mock data:`, err);
    const found = (mockFacilities as FacilityListItem[]).find((f) => f.id === id);
    if (!found) throw { status: 404, message: 'Không tìm thấy cơ sở', timestamp: new Date().toISOString() };
    return found as unknown as FacilityDetail;
  }
}

export async function fetchUnitTypes(facilityId: number): Promise<UnitTypeCatalog[]> {
  if (USE_MOCK) {
    const map = mockUnitTypesData as Record<string, UnitTypeCatalog[]>;
    return map[String(facilityId)] ?? [];
  }

  try {
    const res = await apiClient<{ content: UnitTypeCatalog[] }>(`/facilities/${facilityId}/unit-types?isActive=true&size=50`);
    return res.content;
  } catch (err) {
    console.warn(`Lỗi gọi API /facilities/${facilityId}/unit-types, fallback sang mock data:`, err);
    const map = mockUnitTypesData as Record<string, UnitTypeCatalog[]>;
    return map[String(facilityId)] ?? [];
  }
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

  try {
    const qs = new URLSearchParams({ startDate: query.startDate, rentalMonths: String(query.rentalMonths) });
    return await apiClient<AvailabilityResult>(`/facilities/${facilityId}/unit-types/${unitTypeId}/availability?${qs}`);
  } catch (err) {
    console.warn('Lỗi gọi API checkAvailability, fallback sang mock data:', err);
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
      depositAmount: ut.monthlyPrice,
    };
  }
}

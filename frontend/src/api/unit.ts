// frontend/src/api/unit.ts
import { apiClient } from '@/api/client';
import type {
  UnitTypeResponse,
  StorageUnitResponse,
  UnitTypeFormData,
  StorageUnitFormData,
  PageResponse,
  UnitStatus,
} from '@/types/unit';

export interface UnitTypeListParams {
  page?: number;
  size?: number;
  isActive?: boolean;
}

export interface StorageUnitListParams {
  page?: number;
  size?: number;
  unitTypeId?: number;
  status?: UnitStatus;
  floor?: number;
  position?: string;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const fetchUnitTypes = (facilityId: number, params: UnitTypeListParams = {}) =>
  apiClient<PageResponse<UnitTypeResponse>>(
    `/facilities/${facilityId}/unit-types${buildQuery(params as Record<string, string | number | boolean | undefined>)}`
  );

export const createUnitType = (facilityId: number, data: UnitTypeFormData) =>
  apiClient<UnitTypeResponse>(`/facilities/${facilityId}/unit-types`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateUnitType = (facilityId: number, unitTypeId: number, data: UnitTypeFormData) =>
  apiClient<UnitTypeResponse>(`/facilities/${facilityId}/unit-types/${unitTypeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const toggleUnitTypeStatus = (facilityId: number, unitTypeId: number, isActive: boolean) =>
  apiClient<UnitTypeResponse>(`/facilities/${facilityId}/unit-types/${unitTypeId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });

export const fetchStorageUnits = (facilityId: number, params: StorageUnitListParams = {}) =>
  apiClient<PageResponse<StorageUnitResponse>>(
    `/facilities/${facilityId}/storage-units${buildQuery(params as Record<string, string | number | boolean | undefined>)}`
  );

export const createStorageUnit = (facilityId: number, data: StorageUnitFormData) =>
  apiClient<StorageUnitResponse>(`/facilities/${facilityId}/storage-units`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateStorageUnitStatus = (
  facilityId: number,
  unitId: number,
  status: UnitStatus,
  reason?: string
) =>
  apiClient<StorageUnitResponse>(`/facilities/${facilityId}/storage-units/${unitId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });
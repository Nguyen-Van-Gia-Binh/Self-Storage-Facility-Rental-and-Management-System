// frontend/src/types/unit.ts

export type UnitStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface UnitTypeResponse {
  id: number;
  facilityId: number;
  code?: string;
  name: string;
  description: string;
  widthM: number;
  depthM: number;
  heightM: number;
  areaM2: number;
  volumeM3?: number;
  monthlyPrice: number;
  totalUnits: number;
  isActive: boolean;
}

export interface StorageUnitResponse {
  id: number;
  facilityId: number;
  unitTypeId: number;
  unitTypeName?: string;
  unitTypeCode?: string;
  monthlyPrice?: number;
  code: string;
  floor: number;
  position: string;
  locationNote?: string;
  status: UnitStatus;
  isActive: boolean;
}

export interface UnitTypeFormData {
  code?: string;
  name: string;
  description: string;
  widthM: number;
  depthM: number;
  heightM: number;
  monthlyPrice: number;
}

export interface StorageUnitFormData {
  unitTypeId: number;
  code: string;
  floor: number;
  position: string;
  locationNote?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

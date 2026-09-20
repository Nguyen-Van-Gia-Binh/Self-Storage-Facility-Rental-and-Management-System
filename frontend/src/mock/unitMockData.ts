// frontend/src/mock/unitMockData.ts
import type { UnitTypeResponse, StorageUnitResponse } from '@/types/unit';

export const MOCK_FACILITY_ID = 1;

export const mockUnitTypes: UnitTypeResponse[] = [
  {
    id: 1, facilityId: 1, name: 'Loai S - 3m2',
    description: 'Phu hop do ca nhan, hanh ly du lich',
    widthM: 1.5, depthM: 2.0, heightM: 2.5, areaM2: 3.0,
    monthlyPrice: 800000, totalUnits: 10, isActive: true,
  },
  {
    id: 2, facilityId: 1, name: 'Loai M - 6m2',
    description: 'Phu hop do noi that nho, thiet bi van phong',
    widthM: 2.0, depthM: 3.0, heightM: 2.5, areaM2: 6.0,
    monthlyPrice: 1500000, totalUnits: 8, isActive: true,
  },
  {
    id: 3, facilityId: 1, name: 'Loai L - 12m2',
    description: 'Phu hop noi that phong khach, xe may',
    widthM: 3.0, depthM: 4.0, heightM: 2.5, areaM2: 12.0,
    monthlyPrice: 2800000, totalUnits: 5, isActive: true,
  },
  {
    id: 4, facilityId: 1, name: 'Loai XL - 20m2',
    description: 'Kho lon cho doanh nghiep, hang hoa',
    widthM: 4.0, depthM: 5.0, heightM: 3.0, areaM2: 20.0,
    monthlyPrice: 4500000, totalUnits: 3, isActive: false,
  },
];

export const mockStorageUnits: StorageUnitResponse[] = [
  { id: 101, facilityId: 1, unitTypeId: 1, code: 'S-101', floor: 1, position: 'A1', status: 'AVAILABLE', isActive: true },
  { id: 102, facilityId: 1, unitTypeId: 1, code: 'S-102', floor: 1, position: 'A2', status: 'OCCUPIED', isActive: true },
  { id: 103, facilityId: 1, unitTypeId: 1, code: 'S-103', floor: 1, position: 'A3', status: 'RESERVED', isActive: true },
  { id: 104, facilityId: 1, unitTypeId: 1, code: 'S-104', floor: 2, position: 'B1', status: 'MAINTENANCE', isActive: true },
  { id: 105, facilityId: 1, unitTypeId: 1, code: 'S-105', floor: 2, position: 'B2', status: 'AVAILABLE', isActive: true },
  { id: 201, facilityId: 1, unitTypeId: 2, code: 'M-201', floor: 1, position: 'C1', status: 'AVAILABLE', isActive: true },
  { id: 202, facilityId: 1, unitTypeId: 2, code: 'M-202', floor: 1, position: 'C2', status: 'OCCUPIED', isActive: true },
  { id: 301, facilityId: 1, unitTypeId: 3, code: 'L-301', floor: 1, position: 'D1', status: 'AVAILABLE', isActive: true },
];
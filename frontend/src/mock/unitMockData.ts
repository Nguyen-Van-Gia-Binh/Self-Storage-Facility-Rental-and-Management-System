// frontend/src/mock/unitMockData.ts
import type { UnitTypeResponse, StorageUnitResponse } from '@/types/unit';

export const MOCK_FACILITY_ID = 1;

export const mockUnitTypes: UnitTypeResponse[] = [
  {
    id: 1, facilityId: 1, code: 'UT-SMALL', name: 'Loại S — Tiêu chuẩn (3m²)',
    description: 'Phù hợp đồ cá nhân, vali, hành lý du lịch (Nhiệt độ phòng)',
    widthM: 1.5, depthM: 2.0, heightM: 2.5, areaM2: 3.0,
    monthlyPrice: 800000, totalUnits: 10, isActive: true,
  },
  {
    id: 2, facilityId: 1, code: 'UT-MEDIUM', name: 'Loại M — Tiêu chuẩn (6m²)',
    description: 'Phù hợp đồ nội thất nhỏ, thiết bị văn phòng (Nhiệt độ phòng)',
    widthM: 2.0, depthM: 3.0, heightM: 2.5, areaM2: 6.0,
    monthlyPrice: 1500000, totalUnits: 8, isActive: true,
  },
  {
    id: 3, facilityId: 1, code: 'UT-LARGE', name: 'Loại L — Tiêu chuẩn (12m²)',
    description: 'Phù hợp nội thất phòng khách, xe máy, hàng hóa kinh doanh',
    widthM: 3.0, depthM: 4.0, heightM: 2.5, areaM2: 12.0,
    monthlyPrice: 2800000, totalUnits: 5, isActive: true,
  },
  {
    id: 5, facilityId: 1, code: 'UT-CLIMATE', name: 'Kho Máy Lạnh (Climate Unit — 5m²)',
    description: 'Điều hòa nhiệt độ 22°C - 25°C & kiểm soát độ ẩm 24/7, phù hợp đồ da, rượu vang, thiết bị điện tử',
    widthM: 2.0, depthM: 2.5, heightM: 2.5, areaM2: 5.0,
    monthlyPrice: 3200000, totalUnits: 4, isActive: true,
  },
  {
    id: 4, facilityId: 1, code: 'UT-XL', name: 'Loại XL — Tiêu chuẩn (20m²)',
    description: 'Kho lớn cho doanh nghiệp, chuyển nhà trọn gói',
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
  { id: 401, facilityId: 1, unitTypeId: 5, code: 'C-401', floor: 4, position: 'D1', status: 'AVAILABLE', isActive: true },
  { id: 402, facilityId: 1, unitTypeId: 5, code: 'C-402', floor: 4, position: 'D2', status: 'AVAILABLE', isActive: true },
  { id: 403, facilityId: 1, unitTypeId: 5, code: 'C-403', floor: 4, position: 'D3', status: 'AVAILABLE', isActive: true },
  { id: 404, facilityId: 1, unitTypeId: 5, code: 'C-404', floor: 4, position: 'D4', status: 'OCCUPIED', isActive: true },
];
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UnitTypeCard } from '../../components/UnitTypeCard';
import { UnitTypeListPage } from '../UnitTypeListPage';
import type { UnitTypeResponse, StorageUnitResponse } from '@/types/unit';
import type { FacilityListItem } from '@/types';

const mockFetchFacilities = vi.fn();
const mockFetchUnitTypes = vi.fn();
const mockFetchStorageUnits = vi.fn();

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: (...args: unknown[]) => mockFetchFacilities(...args),
}));

vi.mock('@/api/unit', () => ({
  fetchUnitTypes: (...args: unknown[]) => mockFetchUnitTypes(...args),
  fetchStorageUnits: (...args: unknown[]) => mockFetchStorageUnits(...args),
}));

const mockFacility: FacilityListItem = {
  id: 9,
  code: 'FAC-HP',
  name: 'Cơ sở Cảng Đình Vũ - Hải Phòng',
  address: 'KCN Đình Vũ, Hải Phòng',
  phone: '02253888999',
  description: 'Cơ sở Hải Phòng',
  openingHours: '07:00 - 22:00',
  isActive: true,
  createdAt: '2026-01-01',
};

const climateType: UnitTypeResponse = {
  id: 1,
  facilityId: 9,
  code: 'UT-AC-L',
  name: 'Kho Máy Lạnh L',
  description: 'Kho điều hòa kiểm soát nhiệt độ 24/7 (20°C - 25°C). Phù hợp thiết bị y tế.',
  areaM2: 10,
  widthM: 2.5,
  depthM: 4,
  heightM: 2.5,
  monthlyPrice: 1500000,
  isActive: true,
  totalUnits: 3,
};

const standardFullType: UnitTypeResponse = {
  id: 2,
  facilityId: 9,
  code: 'UT-STD-L',
  name: 'Kho Tiêu Chuẩn L',
  description: 'Kho tiêu chuẩn kích thước L phù hợp chuyển nhà trọn gói.',
  areaM2: 10,
  widthM: 2.5,
  depthM: 4,
  heightM: 2.5,
  monthlyPrice: 1200000,
  isActive: true,
  totalUnits: 2,
};

const mockUnits: StorageUnitResponse[] = [
  { id: 101, facilityId: 9, unitTypeId: 1, code: 'HP-AC-01', floor: 1, position: 'A1', status: 'AVAILABLE', isActive: true },
  { id: 102, facilityId: 9, unitTypeId: 1, code: 'HP-AC-02', floor: 1, position: 'A2', status: 'AVAILABLE', isActive: true },
  { id: 103, facilityId: 9, unitTypeId: 1, code: 'HP-AC-03', floor: 1, position: 'A3', status: 'AVAILABLE', isActive: true },
  { id: 104, facilityId: 9, unitTypeId: 2, code: 'HP-STD-01', floor: 1, position: 'B1', status: 'OCCUPIED', isActive: true },
  { id: 105, facilityId: 9, unitTypeId: 2, code: 'HP-STD-02', floor: 1, position: 'B2', status: 'OCCUPIED', isActive: true },
];

describe('UnitTypeCard & UnitTypeListPage — Enterprise SaaS (Anti Candy-colored UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchFacilities.mockResolvedValue([mockFacility]);
    mockFetchUnitTypes.mockResolvedValue({ content: [climateType, standardFullType] });
    mockFetchStorageUnits.mockResolvedValue({ content: mockUnits });
  });

  afterEach(() => {
    cleanup();
  });

  it('UnitTypeCard bỏ hoàn toàn nền pastel gradient, hộp icon màu mè, badge nhiệt độ dư thừa và khung xám lồng thông số', () => {
    const { container } = render(
      <UnitTypeCard
        type={climateType}
        stats={{ total: 3, available: 3, occupied: 0, maintenance: 0 }}
        onClick={() => {}}
      />
    );

    const html = container.innerHTML;
    // Không còn gradient pastel & không còn icon box màu kẹo / pulse dot / hộp xám bọc thông số
    expect(html).not.toMatch(/bg-gradient-to-b/);
    expect(html).not.toMatch(/bg-cyan-|bg-sky-|bg-orange-|bg-purple-|bg-amber-/);
    expect(html).not.toContain('animate-pulse');
    expect(html).not.toContain('bg-slate-50/70');
    expect(html).not.toContain('Nhiệt độ ổn định 20-25°C');

    // Có đầy đủ thông tin gộp gọn: tên, mã, phân loại, 3 thông số, trạng thái còn trống, nút Xem chi tiết
    expect(screen.getByText('Kho Máy Lạnh L')).toBeInTheDocument();
    expect(screen.getByText('UT-AC-L')).toBeInTheDocument();
    expect(screen.getByText('Kho Máy Lạnh')).toBeInTheDocument();
    expect(screen.getByText('10 m²')).toBeInTheDocument();
    expect(screen.getByText('2.5×4×2.5m')).toBeInTheDocument();
    expect(screen.getByText('3 ô')).toBeInTheDocument();
    expect(screen.getByText(/Còn 3 ô trống/i)).toBeInTheDocument();
    expect(screen.getByText('Xem chi tiết')).toBeInTheDocument();
    expect(screen.queryByText('Xem danh sách ô')).not.toBeInTheDocument();
  });

  it('UnitTypeCard hiển thị trạng thái Hết ô khi không còn ô trống', () => {
    render(
      <UnitTypeCard
        type={standardFullType}
        stats={{ total: 2, available: 0, occupied: 2, maintenance: 0 }}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('Kho Tiêu Chuẩn L')).toBeInTheDocument();
    expect(screen.getByText('Hết ô')).toBeInTheDocument();
  });

  it('UnitTypeListPage mặc định mở ở chế độ Bảng (Table View) chuẩn ERP/WMS và hỗ trợ chuyển sang Lưới (Grid)', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/manager/facilities/9']}>
        <Routes>
          <Route path="/manager/facilities/:facilityId" element={<UnitTypeListPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Kho Máy Lạnh L')).toBeInTheDocument();
    });

    // Mặc định là dạng Bảng (Table) với đầy đủ cột so sánh nhanh
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table.textContent).toContain('Tên loại kho');
    expect(table.textContent).toContain('Mã');
    expect(table.textContent).toContain('Phân loại');
    expect(table.textContent).toContain('Diện tích');
    expect(table.textContent).toContain('Kích thước');
    expect(table.textContent).toContain('Quy mô');
    expect(table.textContent).toContain('Trạng thái');
    expect(table.textContent).toContain('Còn 3 ô trống');
    expect(table.textContent).toContain('Hết ô');
    expect(table.textContent).toContain('Xem chi tiết');

    // Không dùng hộp icon màu kẹo trong bảng
    expect(container.innerHTML).not.toMatch(/bg-cyan-|bg-orange-|bg-purple-/);

    // Chuyển sang chế độ Lưới (Grid)
    const gridBtn = screen.getByRole('button', { name: /Lưới/i });
    fireEvent.click(gridBtn);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Kho Máy Lạnh L')).toBeInTheDocument();
    expect(screen.getByText('Kho Tiêu Chuẩn L')).toBeInTheDocument();
  });
});

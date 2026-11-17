// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { StorageUnitListPage } from '../StorageUnitListPage';
import { StorageUnitTable } from '../../components/StorageUnitTable';
import type { StorageUnitResponse } from '@/types/unit';

const mockFetchFacilities = vi.fn();
const mockFetchUnitTypes = vi.fn();
const mockFetchStorageUnits = vi.fn();
const mockGetManagerContracts = vi.fn();

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: (...args: unknown[]) => mockFetchFacilities(...args),
}));

vi.mock('@/api/unit', () => ({
  fetchUnitTypes: (...args: unknown[]) => mockFetchUnitTypes(...args),
  fetchStorageUnits: (...args: unknown[]) => mockFetchStorageUnits(...args),
  createStorageUnit: vi.fn(),
  updateStorageUnitStatus: vi.fn(),
}));

vi.mock('@/api/contract', () => ({
  getManagerContracts: (...args: unknown[]) => mockGetManagerContracts(...args),
}));

const sampleUnits: StorageUnitResponse[] = [
  {
    id: 101,
    facilityId: 9,
    unitTypeId: 6,
    code: 'HP-AC-L101',
    floor: 1,
    position: 'Khu D',
    locationNote: 'Tầng 1 · Khu D · Tổng kho mát 10m²',
    status: 'AVAILABLE',
    isActive: true,
  },
  {
    id: 102,
    facilityId: 9,
    unitTypeId: 6,
    code: 'HP-AC-L201',
    floor: 2,
    position: 'Khu D',
    locationNote: 'Tầng 2 · Khu D · Tổng kho mát 10m²',
    status: 'AVAILABLE',
    isActive: true,
  },
];

describe('StorageUnitListPage, StorageUnitTable & Sidebar — Enterprise Table-Centric Revamp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchFacilities.mockResolvedValue([
      { id: 9, code: 'FAC-HP', name: 'Cơ sở Cảng Đình Vũ - Hải Phòng', isActive: true },
    ]);
    mockFetchUnitTypes.mockResolvedValue({
      content: [{ id: 6, facilityId: 9, code: 'UT-AC-L', name: 'Kho Máy Lạnh L', areaM2: 10, isActive: true }],
    });
    mockFetchStorageUnits.mockResolvedValue({ content: sampleUnits });
    mockGetManagerContracts.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('StorageUnitTable: mật độ cao py-2.5, bỏ hộp icon Box và dòng lặp locationNote, hiển thị Tầng 1, Khu D, trạng thái phẳng và thao tác text-link không viền', () => {
    const onSelect = vi.fn();
    const onStatus = vi.fn();

    render(
      <StorageUnitTable
        units={sampleUnits}
        contractsMap={{}}
        onSelectUnit={onSelect}
        onStatusChange={onStatus}
      />
    );

    expect(screen.getByText('HP-AC-L101')).toBeInTheDocument();
    expect(screen.getByText('Tầng 1, Khu D')).toBeInTheDocument();
    expect(screen.getByText('Tầng 2, Khu D')).toBeInTheDocument();
    // Không lặp dòng locationNote gây nhiễu dưới mã ô kho
    expect(screen.queryByText(/Tổng kho mát 10m²/i)).not.toBeInTheDocument();

    const detailButtons = screen.getAllByRole('button', { name: 'Chi tiết' });
    expect(detailButtons[0].className).not.toContain('border-brand-200');
    fireEvent.click(detailButtons[0]);
    expect(onSelect).toHaveBeenCalledWith(sampleUnits[0]);

    const maintButtons = screen.getAllByRole('button', { name: 'Bảo trì' });
    expect(maintButtons[0].className).not.toContain('border-amber-200');
    fireEvent.click(maintButtons[0]);
    expect(onStatus).toHaveBeenCalledWith(sampleUnits[0], 'MAINTENANCE');
  });

  it('StorageUnitListPage: xóa sổ 5 thẻ KPI Bento Box pastel, đưa thông số loại kho xuống phụ đề và thu gọn bộ lọc ngày vào 1 hàng Toolbar', async () => {
    render(
      <MemoryRouter initialEntries={['/manager/facilities/9/unit-types/6']}>
        <Routes>
          <Route
            path="/manager/facilities/:facilityId/unit-types/:typeId"
            element={<StorageUnitListPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Danh sách Ô kho vật lý')).toBeInTheDocument();
    });

    // Chuyển sang Bảng danh sách (nếu đang ở Sơ đồ 2D)
    const tableTab = screen.queryByRole('button', { name: /Bảng danh sách/i });
    if (tableTab) {
      fireEvent.click(tableTab);
    }

    await waitFor(() => {
      expect(screen.getByText('HP-AC-L101')).toBeInTheDocument();
    });

    // Phụ đề gộp gọn loại kho + tóm tắt tổng/trống/lấp đầy
    const subtitle = screen.getByText(/Kho Máy Lạnh L \(10 m²\)/);
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveTextContent(/Tổng:\s*2 ô kho/);
    expect(subtitle).toHaveTextContent(/Trống:\s*2/);
    expect(subtitle).toHaveTextContent(/Lấp đầy:\s*0%/);
    // Không còn 5 thẻ KPI Bento Box lãng phí không gian
    expect(screen.queryByText('Sẵn sàng nhận khách')).not.toBeInTheDocument();
    expect(screen.queryByText('Hợp đồng hiệu lực')).not.toBeInTheDocument();
    expect(screen.queryByText('Tạm ngưng khai thác')).not.toBeInTheDocument();
    // Bộ lọc ngày thu gọn thành nút trong Toolbar
    expect(screen.getByRole('button', { name: /Ngày: Hôm nay/i })).toBeInTheDocument();
  });

  it('DashboardLayout Sidebar: mục đang chọn dùng nền xám nhạt, chữ xanh đậm + vạch kẻ trái thay vì khối xanh đặc to đùng', () => {
    const layoutContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/layouts/DashboardLayout.tsx'),
      'utf-8'
    );

    expect(layoutContent).not.toContain("'bg-brand-600 text-white shadow-2xs font-semibold'");
    expect(layoutContent).toContain('text-brand-700');
    expect(layoutContent).toContain('before:bg-brand-600');
  });
});

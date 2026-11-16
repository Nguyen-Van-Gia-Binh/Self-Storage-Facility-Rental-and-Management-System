// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FacilityListPage } from '../../pages/FacilityListPage';
import * as facilityApi from '@/api/facility';
import type { FacilityListItem } from '@/types';

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: vi.fn(),
}));

vi.mock('@/api/unit', () => ({
  fetchStorageUnits: vi.fn().mockResolvedValue({ content: [] }),
}));

const facility: FacilityListItem = {
  id: 1,
  code: 'FAC-CG',
  name: 'Cơ sở Cầu Giấy',
  address: '123 Đường Cầu Giấy, Hà Nội',
  phone: '0987654321',
  description: 'Cơ sở hiện đại',
  openingHours: '08:00 - 20:00',
  isActive: true,
  createdAt: '2026-01-01',
};

describe('Bảng danh sách cơ sở', () => {
  it('hiện tên, mã, địa chỉ, điện thoại, trạng thái và nút Quản lý', async () => {
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue([facility]);

    render(
      <MemoryRouter>
        <FacilityListPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Cơ sở Cầu Giấy')).toBeTruthy();
    expect(screen.getByText('FAC-CG')).toBeTruthy();
    expect(screen.getByText('123 Đường Cầu Giấy, Hà Nội')).toBeTruthy();
    expect(screen.getByText('0987654321')).toBeTruthy();
    expect(screen.getByText('Hoạt động')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Quản lý' })).toBeTruthy();
  });
});

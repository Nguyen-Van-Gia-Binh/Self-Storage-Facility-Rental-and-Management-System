// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WaitlistInboxPage } from '../WaitlistInboxPage';
import * as facilityApi from '@/api/facility';
import * as waitlistApi from '@/api/waitlist';
import type { WaitlistResponse } from '@/types/waitlist';
import type { FacilityListItem } from '@/types';

vi.mock('@/utils/useCurrentUser', () => ({
  useCurrentUser: () => ({ id: 99, role: 'FACILITY_MANAGER', email: 'fm@test.com' }),
}));

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: vi.fn(),
}));

vi.mock('@/api/waitlist', () => ({
  fetchFacilityWaitlists: vi.fn(),
  startContacting: vi.fn(),
  convertWaitlistToReservation: vi.fn(),
  rejectWaitlist: vi.fn(),
  followUpWaitlist: vi.fn(),
}));

const mockFacilities: FacilityListItem[] = [
  { id: 1, name: 'Cơ sở Quận 1', code: 'FAC-Q1', address: '123 HCM' } as FacilityListItem,
];

const mockWaitlists: WaitlistResponse[] = [
  {
    id: 101,
    customerId: 1,
    facilityId: 1,
    unitTypeId: 5,
    unitTypeName: 'Kho Lớn (15m2)',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0912345678',
    customerEmail: 'a@gmail.com',
    targetStartDate: '2026-12-01',
    rentalMonths: 3,
    status: 'WAITING',
    availableCapacity: 2,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 102,
    customerId: 2,
    facilityId: 1,
    unitTypeId: 6,
    unitTypeName: 'Kho Nhỏ (5m2)',
    customerName: 'Trần Thị B',
    customerPhone: '0987654321',
    targetStartDate: '2026-12-18',
    status: 'CONTACTING',
    assignedFmId: 99,
    assignedFmName: 'FM Test',
    contactTimeoutAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    availableCapacity: 0,
    rentalMonths: 1,
    createdAt: '2026-11-02T10:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
  },
];

describe('WaitlistInboxPage (FM Waitlist — Enterprise Status Design System)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('hiển thị đúng ngày DD/MM/YYYY, Soft Badges ngữ nghĩa, nút Tạo HĐ (Primary/Disabled) và nút Gỡ', async () => {
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue(mockFacilities);
    vi.mocked(waitlistApi.fetchFacilityWaitlists).mockResolvedValue(mockWaitlists);

    render(
      <MemoryRouter>
        <WaitlistInboxPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Danh sách Chờ \(Waitlist\)/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
      // Ngày định dạng DD/MM/YYYY
      expect(screen.getByText('01/12/2026')).toBeInTheDocument();
      expect(screen.getByText('18/12/2026')).toBeInTheDocument();
      expect(screen.queryByText('2026-12-18')).not.toBeInTheDocument();

      // Badge ngữ nghĩa Soft Background + Dot
      const waitingBadge = screen.getByText('Đang chờ');
      expect(waitingBadge.className).toContain('bg-amber-50');
      const contactingBadge = screen.getByText('Đang tư vấn');
      expect(contactingBadge.className).toContain('bg-blue-50');

      // Nút Tạo HĐ và nút Gỡ viền xám
      const createBtns = screen.getAllByRole('button', { name: /^Tạo HĐ$/i });
      expect(createBtns.length).toBe(2);
      expect(createBtns[0].className).toContain('bg-brand-600');
      expect(createBtns[1]).toBeDisabled();
      expect(createBtns[1]).toHaveAttribute('title', 'Không còn ô kho trống phù hợp');

      const archiveBtns = screen.getAllByRole('button', { name: /^Gỡ$/i });
      expect(archiveBtns.length).toBe(2);
    });
  });

  it('xử lý danh sách chờ rỗng gọn gàng không bị lỗi', async () => {
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue(mockFacilities);
    vi.mocked(waitlistApi.fetchFacilityWaitlists).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WaitlistInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Không có khách hàng nào trong danh sách chờ/i)).toBeInTheDocument();
    });
  });

  it('hiển thị nút Gán ô kho màu Brand Mint khi có đơn đặt trước chưa gán ô', async () => {
    const priorityWaitlists: WaitlistResponse[] = [
      {
        id: 103,
        customerId: 3,
        facilityId: 1,
        unitTypeId: 5,
        unitTypeName: 'Kho Lớn (15m2)',
        customerName: 'Khách Chờ Ưu Tiên',
        customerPhone: '0933445566',
        targetStartDate: '2026-12-05',
        rentalMonths: 2,
        status: 'CONTACTING',
        assignedFmId: 99,
        assignedFmName: 'FM Test',
        availableCapacity: 0,
        unassignedReservationCount: 2,
        createdAt: '2026-11-05T10:00:00Z',
        updatedAt: '2026-11-05T10:00:00Z',
      },
    ];

    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue(mockFacilities);
    vi.mocked(waitlistApi.fetchFacilityWaitlists).mockResolvedValue(priorityWaitlists);

    render(
      <MemoryRouter>
        <WaitlistInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const assignBtn = screen.getByRole('button', { name: /Gán ô kho \(2\)/i });
      expect(assignBtn).toBeInTheDocument();
      expect(assignBtn.className).toContain('bg-brand-600');
    });
  });

  it('khi hết ô trống (availableCapacity = 0): hiển thị text xám Tạm hết ô trống (không dùng badge đỏ) và vô hiệu hóa nút Tạo HĐ', async () => {
    const zeroCapacityWaitlists: WaitlistResponse[] = [
      {
        id: 104,
        customerId: 4,
        facilityId: 1,
        unitTypeId: 7,
        unitTypeName: 'Kho Máy Lạnh (10m2)',
        customerName: 'Khách Chờ Hết Ô',
        customerPhone: '0977889900',
        targetStartDate: '2026-12-10',
        rentalMonths: 1,
        status: 'WAITING',
        availableCapacity: 0,
        unassignedReservationCount: 0,
        createdAt: '2026-11-06T10:00:00Z',
        updatedAt: '2026-11-06T10:00:00Z',
      },
    ];

    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue(mockFacilities);
    vi.mocked(waitlistApi.fetchFacilityWaitlists).mockResolvedValue(zeroCapacityWaitlists);

    render(
      <MemoryRouter>
        <WaitlistInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const emptyCapText = screen.getByText('Tạm hết ô trống');
      expect(emptyCapText.className).toContain('text-gray-400');
      expect(emptyCapText.className).not.toContain('bg-rose-');

      const createBtn = screen.getByRole('button', { name: /^Tạo HĐ$/i });
      expect(createBtn).toBeDisabled();
      expect(screen.getByText('10/12/2026')).toBeInTheDocument();
    });
  });
});

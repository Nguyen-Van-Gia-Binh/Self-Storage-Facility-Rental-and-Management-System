// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  },
  {
    id: 102,
    facilityId: 1,
    unitTypeId: 6,
    unitTypeName: 'Kho Nhỏ (5m2)',
    customerName: 'Trần Thị B',
    customerPhone: '0987654321',
    status: 'CONTACTING',
    assignedFmId: 99,
    assignedFmName: 'FM Test',
    contactTimeoutAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    availableCapacity: 0,
    rentalMonths: 1,
    createdAt: '2026-11-02T10:00:00Z',
  },
];

describe('WaitlistInboxPage (FM Telesales CRM)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders CRM Inbox without throwing white screen and displays KPI cards', async () => {
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue(mockFacilities);
    vi.mocked(waitlistApi.fetchFacilityWaitlists).mockResolvedValue(mockWaitlists);

    render(
      <MemoryRouter>
        <WaitlistInboxPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Danh sách Chờ & Hộp thư Tư vấn/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeDefined();
      expect(screen.getByText('Trần Thị B')).toBeDefined();
      expect(screen.getByText('Kho Lớn (15m2)')).toBeDefined();
      expect(screen.getByText(/Còn 2 ô trống/i)).toBeDefined();
      expect(screen.getByText(/Hết công suất \(0\)/i)).toBeDefined();
    });
  });

  it('handles empty waitlists gracefully without crashing', async () => {
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue(mockFacilities);
    vi.mocked(waitlistApi.fetchFacilityWaitlists).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WaitlistInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const emptyMessages = screen.getAllByText(/Không có khách hàng nào trong danh sách chờ/i);
      expect(emptyMessages.length).toBeGreaterThan(0);
    });
  });

  it('displays reservation priority warning banner and action when unassigned reservations exist', async () => {
    const priorityWaitlists: WaitlistResponse[] = [
      {
        id: 103,
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
      expect(screen.getByText(/CẢNH BÁO QUY CHẾ ƯU TIÊN/i)).toBeDefined();
      expect(screen.getByText(/Ưu tiên 2 đơn đặt trước/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Gán ô kho \(2\)/i })).toBeDefined();
    });
  });
});

// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreateSupportTicketModal } from '../CreateSupportTicketModal';
import { RentedUnitCard } from '../RentedUnitCard';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import type { RentedContract } from '../../types';

describe('CreateSupportTicketModal - Lọc hợp đồng hợp lệ', () => {
  const mixedRentals: RentedContract[] = [
    {
      id: '1',
      contractNumber: 'CTR-001',
      facilityId: '1',
      facilityName: 'Cơ sở Quận 7',
      unitId: '101',
      unitNumber: 'U-101',
      unitTypeName: 'Kho Cỡ S',
      sizeCategory: 'S',
      storageType: 'STANDARD',
      startDate: '2026-09-01',
      endDate: '2026-10-01',
      monthlyRent: 1500000,
      depositHeld: 1500000,
      status: 'ACTIVE',
    },
    {
      id: '2',
      contractNumber: 'CTR-002',
      facilityId: '1',
      facilityName: 'Cơ sở Quận 7',
      unitId: '102',
      unitNumber: 'U-102',
      unitTypeName: 'Kho Cỡ M',
      sizeCategory: 'M',
      storageType: 'STANDARD',
      startDate: '2026-08-01',
      endDate: '2026-09-01',
      monthlyRent: 2000000,
      depositHeld: 2000000,
      status: 'TERMINATED',
    },
    {
      id: '3',
      contractNumber: 'CTR-003',
      facilityId: '1',
      facilityName: 'Cơ sở Quận 7',
      unitId: '103',
      unitNumber: 'U-103',
      unitTypeName: 'Kho Cỡ L',
      sizeCategory: 'L',
      storageType: 'STANDARD',
      startDate: '2026-07-01',
      endDate: '2026-08-01',
      monthlyRent: 3000000,
      depositHeld: 3000000,
      status: 'CLOSED',
    },
  ];

  it('chỉ hiển thị hợp đồng ACTIVE trong dropdown, loại bỏ TERMINATED và CLOSED', () => {
    render(
      <BrowserRouter>
        <CreateSupportTicketModal
          isOpen={true}
          onClose={vi.fn()}
          rentals={mixedRentals}
          facilities={[{ id: '1', name: 'Cơ sở Quận 7' } as any]}
          onSubmit={vi.fn()}
        />
      </BrowserRouter>
    );

    // Hợp đồng ACTIVE phải có trong dropdown
    expect(screen.getByText(/Kho U-101 — Cơ sở Quận 7/i)).toBeInTheDocument();

    // Hợp đồng TERMINATED và CLOSED không được xuất hiện
    expect(screen.queryByText(/Kho U-102/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kho U-103/i)).not.toBeInTheDocument();
  });

  it('hiển thị thông báo khi tất cả hợp đồng đều đã kết thúc', () => {
    const closedRentals = mixedRentals.filter(r => r.status === 'TERMINATED' || r.status === 'CLOSED');

    render(
      <BrowserRouter>
        <CreateSupportTicketModal
          isOpen={true}
          onClose={vi.fn()}
          rentals={closedRentals}
          facilities={[{ id: '1', name: 'Cơ sở Quận 7' } as any]}
          onSubmit={vi.fn()}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/Bạn hiện không có hợp đồng kho nào đang hoạt động/i)).toBeInTheDocument();
  });

  it('RentedUnitCard ẩn nút Báo sự cố khi hợp đồng đã TERMINATED hoặc CLOSED', () => {
    const terminatedContract = mixedRentals[1];

    render(
      <BrowserRouter>
        <RentedUnitCard
          contract={terminatedContract}
        />
      </BrowserRouter>
    );

    // Không được có nút Báo sự cố
    expect(screen.queryByText('Báo sự cố')).not.toBeInTheDocument();
  });
});

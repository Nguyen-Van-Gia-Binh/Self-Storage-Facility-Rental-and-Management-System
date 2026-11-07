// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MyUnitsTable } from '../MyUnitsTable';
import { RentedUnitCard } from '../RentedUnitCard';
import type { RentedContract } from '../../types';

describe('Kiểm thử hiển thị nút Check-in online theo trạng thái gán ô kho', () => {
  afterEach(() => {
    cleanup();
  });

  const baseAssignedContract: RentedContract = {
    id: 'contract-101',
    contractNumber: 'CTR-2026-101',
    unitNumber: 'Q7-S101',
    unitTypeName: 'Kho Tiêu Chuẩn S',
    facilityName: 'Cơ sở Quận 7',
    facilityAddress: '10 Mai Văn Vĩnh, Q7',
    startDate: '2026-11-10',
    endDate: '2027-02-10',
    status: 'PENDING_CHECKIN',
    monthlyRent: 800000,
    depositHeld: 800000,
  };

  const baseUnassignedContract: RentedContract = {
    ...baseAssignedContract,
    id: 'contract-102',
    contractNumber: 'CTR-2026-102',
    unitNumber: 'Chưa gán ô',
  };

  describe('Trong bảng MyUnitsTable', () => {
    it('hiển thị cả nút "Vé nhận kho" và "Check-in online" khi ô kho ĐÃ ĐƯỢC GÁN', () => {
      render(
        <MemoryRouter>
          <MyUnitsTable
            contracts={[baseAssignedContract]}
            pendingReservations={[]}
            loading={false}
            searchQuery=""
            statusFilter="ALL"
            onClearFilters={vi.fn()}
            onViewDetail={vi.fn()}
            onChangePin={vi.fn()}
            onScheduleReturn={vi.fn()}
            onReschedulePeriod={vi.fn()}
            onOpenOverduePayment={vi.fn()}
            onCancelReturn={vi.fn()}
          />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /Vé nhận kho/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Check-in online/i })).toBeInTheDocument();
    });

    it('CHỈ hiển thị nút "Vé nhận kho", ẨN nút "Check-in online" khi ô kho CHƯA ĐƯỢC GÁN', () => {
      render(
        <MemoryRouter>
          <MyUnitsTable
            contracts={[baseUnassignedContract]}
            pendingReservations={[]}
            loading={false}
            searchQuery=""
            statusFilter="ALL"
            onClearFilters={vi.fn()}
            onViewDetail={vi.fn()}
            onChangePin={vi.fn()}
            onScheduleReturn={vi.fn()}
            onReschedulePeriod={vi.fn()}
            onOpenOverduePayment={vi.fn()}
            onCancelReturn={vi.fn()}
          />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /Vé nhận kho/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Check-in online/i })).not.toBeInTheDocument();
    });
  });

  describe('Trong thẻ RentedUnitCard', () => {
    it('hiển thị cả nút "Vé nhận kho" và "Check-in online" khi ô kho ĐÃ ĐƯỢC GÁN', () => {
      render(
        <MemoryRouter>
          <RentedUnitCard contract={baseAssignedContract} />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /Vé nhận kho/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Check-in online/i })).toBeInTheDocument();
    });

    it('CHỈ hiển thị nút "Vé nhận kho", ẨN nút "Check-in online" khi ô kho CHƯA ĐƯỢC GÁN', () => {
      render(
        <MemoryRouter>
          <RentedUnitCard contract={baseUnassignedContract} />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /Vé nhận kho/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Check-in online/i })).not.toBeInTheDocument();
    });
  });
});


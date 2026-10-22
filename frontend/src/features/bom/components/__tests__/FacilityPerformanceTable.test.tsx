// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FacilityPerformanceTable } from '../FacilityPerformanceTable';
import type { FacilityRevenueBreakdown, FacilityOccupancyItem } from '@/types';

const mockRevenues: FacilityRevenueBreakdown[] = [
  {
    facilityId: 1,
    facilityName: 'Cơ sở Quận 1 - Bến Nghé',
    totalRevenue: 50000000,
    rentalRevenue: 35000000,
    surchargeRevenue: 5000000,
    renewalRevenue: 10000000,
    overdueFeeRevenue: 0,
    depositBalance: 15000000,
    refundAmount: 2000000,
  },
  {
    facilityId: 2,
    facilityName: 'Cơ sở Cầu Giấy - Hà Nội',
    totalRevenue: 25000000,
    rentalRevenue: 20000000,
    surchargeRevenue: 2000000,
    renewalRevenue: 2000000,
    overdueFeeRevenue: 1000000,
    depositBalance: 8000000,
    refundAmount: 0,
  },
];

const mockOccupancies: FacilityOccupancyItem[] = [
  {
    facilityId: 1,
    facilityName: 'Cơ sở Quận 1 - Bến Nghé',
    month: '2026-10',
    occupancyRate: 0.85,
    availableUnits: 15,
    reservedUnits: 5,
    occupiedUnits: 85,
    cleaningUnits: 0,
    maintenanceUnits: 0,
    outOfServiceUnits: 0,
    totalUnits: 100,
    overdueContractsCount: 0,
  },
  {
    facilityId: 2,
    facilityName: 'Cơ sở Cầu Giấy - Hà Nội',
    month: '2026-10',
    occupancyRate: 0.6,
    availableUnits: 20,
    reservedUnits: 2,
    occupiedUnits: 30,
    cleaningUnits: 0,
    maintenanceUnits: 0,
    outOfServiceUnits: 0,
    totalUnits: 50,
    overdueContractsCount: 2,
  },
];

describe('FacilityPerformanceTable Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 2-tier Super-headers correctly', () => {
    render(
      <FacilityPerformanceTable
        revenues={mockRevenues}
        occupancies={mockOccupancies}
      />
    );

    // Tầng 1: Super-headers
    expect(screen.getByText('Thông tin cơ sở')).toBeInTheDocument();
    expect(screen.getByText('Cơ cấu dòng tiền (₫)')).toBeInTheDocument();
    expect(screen.getByText('Hiệu suất vận hành')).toBeInTheDocument();

    // Tầng 2: Column headers
    expect(screen.getByText(/Cơ sở lưu kho/i)).toBeInTheDocument();
    expect(screen.getByText(/Tiền thuê kho/i)).toBeInTheDocument();
    expect(screen.getByText(/Phụ phí & Gia hạn/i)).toBeInTheDocument();
    expect(screen.getByText(/Phí quá hạn/i)).toBeInTheDocument();
    expect(screen.getByText(/Tổng thực thu/i)).toBeInTheDocument();
    expect(screen.getByText(/Tỷ lệ lấp đầy/i)).toBeInTheDocument();
  });

  it('formats 0 as dash "-" and renders tabular numbers', () => {
    render(
      <FacilityPerformanceTable
        revenues={mockRevenues}
        occupancies={mockOccupancies}
      />
    );

    // Cơ sở 1 có overdueFeeRevenue = 0 -> render "-"
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders sticky Total Row with grand total numbers', () => {
    render(
      <FacilityPerformanceTable
        revenues={mockRevenues}
        occupancies={mockOccupancies}
      />
    );

    expect(screen.getByText('TỔNG CỘNG TOÀN HỆ THỐNG')).toBeInTheDocument();
    // Tổng doanh thu 50M + 25M = 75M
    expect(screen.getByText('75.000.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('2 cơ sở')).toBeInTheDocument();
  });

  it('supports facility search filter', () => {
    render(
      <FacilityPerformanceTable
        revenues={mockRevenues}
        occupancies={mockOccupancies}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Tìm tên hoặc mã cơ sở.../i);
    fireEvent.change(searchInput, { target: { value: 'Quận 1' } });

    expect(screen.getByText('Cơ sở Quận 1 - Bến Nghé')).toBeInTheDocument();
    expect(screen.queryByText('Cơ sở Cầu Giấy - Hà Nội')).not.toBeInTheDocument();
  });

  it('calls onOpenDetail when clicking the [Chi tiết] ghost button', () => {
    const onOpenDetailMock = vi.fn();
    render(
      <FacilityPerformanceTable
        revenues={mockRevenues}
        occupancies={mockOccupancies}
        onOpenDetail={onOpenDetailMock}
      />
    );

    const detailButtons = screen.getAllByRole('button', { name: /Chi tiết/i });
    expect(detailButtons.length).toBe(2);

    fireEvent.click(detailButtons[0]);
    expect(onOpenDetailMock).toHaveBeenCalledTimes(1);
    expect(onOpenDetailMock.mock.calls[0][0].facilityId).toBe(1);
  });

  it('calls onSelectFacility when clicking the facility name link', () => {
    const onSelectFacilityMock = vi.fn();
    render(
      <FacilityPerformanceTable
        revenues={mockRevenues}
        occupancies={mockOccupancies}
        onSelectFacility={onSelectFacilityMock}
      />
    );

    const facilityLink = screen.getByRole('button', { name: /Cơ sở Quận 1 - Bến Nghé/i });
    fireEvent.click(facilityLink);

    expect(onSelectFacilityMock).toHaveBeenCalledWith(1);
  });
});

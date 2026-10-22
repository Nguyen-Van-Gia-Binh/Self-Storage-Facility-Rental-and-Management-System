// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  FacilityPerformanceDrawer,
  type FacilityPerformanceData,
} from '../FacilityPerformanceDrawer';

afterEach(() => {
  cleanup();
});

const mockFacility: FacilityPerformanceData = {
  facilityId: 7,
  facilityName: 'Cơ sở Bình Thạnh - TP.HCM',
  rentalRevenue: 27540000,
  surchargeRevenue: 0,
  renewalRevenue: 0,
  overdueFeeRevenue: 0,
  totalRevenue: 27540000,
  depositBalance: 2550000,
  refundAmount: 30090000,
  occupancyRate: 0.0,
  occupiedUnits: 0,
  availableUnits: 1,
  outOfServiceUnits: 0,
  totalUnits: 1,
  overdueCount: 0,
};

describe('FacilityPerformanceDrawer', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <FacilityPerformanceDrawer
        isOpen={false}
        facility={mockFacility}
        onClose={vi.fn()}
        onApplyGlobalFilter={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders directly to document.body via portal and displays facility details', () => {
    render(
      <FacilityPerformanceDrawer
        isOpen={true}
        facility={mockFacility}
        onClose={vi.fn()}
        onApplyGlobalFilter={vi.fn()}
      />
    );

    // Kiểm tra tên cơ sở và mã chi nhánh
    expect(screen.getByText('Cơ sở Bình Thạnh - TP.HCM')).toBeInTheDocument();
    expect(screen.getByText('Mã chi nhánh: #7')).toBeInTheDocument();

    // Kiểm tra số tiền doanh thu và hoàn trả
    expect(screen.getAllByText(/27\.540\.000/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/- 30\.090\.000 ₫/i)).toBeInTheDocument();

    // Kiểm tra drawer nằm trên document.body
    const dialog = screen.getByRole('dialog');
    expect(dialog.parentElement).toBe(document.body);
  });

  it('calls onClose when backdrop or close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <FacilityPerformanceDrawer
        isOpen={true}
        facility={mockFacility}
        onClose={handleClose}
        onApplyGlobalFilter={vi.fn()}
      />
    );

    const closeBtn = screen.getByTitle('Đóng bảng chi tiết');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <FacilityPerformanceDrawer
        isOpen={true}
        facility={mockFacility}
        onClose={handleClose}
        onApplyGlobalFilter={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onApplyGlobalFilter and onClose when clicking primary action button', () => {
    const handleFilter = vi.fn();
    const handleClose = vi.fn();
    render(
      <FacilityPerformanceDrawer
        isOpen={true}
        facility={mockFacility}
        onClose={handleClose}
        onApplyGlobalFilter={handleFilter}
      />
    );

    const actionBtn = screen.getByText('Xem báo cáo toàn diện cơ sở này');
    fireEvent.click(actionBtn);
    expect(handleFilter).toHaveBeenCalledWith(7);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

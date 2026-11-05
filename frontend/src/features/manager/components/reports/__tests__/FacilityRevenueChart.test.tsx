// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FacilityRevenueChart } from '../FacilityRevenueChart';
import type { FacilityOverviewReport } from '../../../types/report';

const mockReport: FacilityOverviewReport = {
  facilityId: 1,
  facilityName: 'Cơ sở Quận 1 - Nguyễn Du',
  month: '2026-10',
  totalUnits: 50,
  availableUnits: 15,
  occupiedUnits: 30,
  maintenanceUnits: 5,
  occupancyRate: 0.6,
  activeContracts: 28,
  overdueContracts: 2,
  newContracts: 5,
  returnedContracts: 2,
  totalRevenue: 35000000,
  rentalRevenue: 28000000,
  surchargeRevenue: 2000000,
  customerServiceFee: 2000000,
  overduePenaltyFee: 1500000,
  depositBalance: 8500000,
  companyIncidentCost: 1200000,
  netRevenue: 30300000,
};

describe('FacilityRevenueChart Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders SVG Donut Chart with correct aria-label and stream items', () => {
    render(<FacilityRevenueChart data={mockReport} />);

    // SVG Donut Chart
    const svg = screen.getByLabelText('Biểu đồ cơ cấu doanh thu cơ sở');
    expect(svg).toBeInTheDocument();

    // 4 Dòng tiền cơ sở
    expect(screen.getByText('Phí thuê kho')).toBeInTheDocument();
    expect(screen.getByText('Phí dịch vụ')).toBeInTheDocument();
    expect(screen.getByText('Phạt quá hạn')).toBeInTheDocument();
    expect(screen.getByText('Cọc giữ chỗ & đảm bảo')).toBeInTheDocument();
  });

  it('renders amounts and percentages accurately', () => {
    render(<FacilityRevenueChart data={mockReport} />);

    // Kiểm tra định dạng tiền tệ VND xuất hiện
    expect(screen.getAllByText(/28\.000\.000/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/2\.000\.000/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/1\.500\.000/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/8\.500\.000/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Company Incident Cost deduction callout when cost > 0', () => {
    render(<FacilityRevenueChart data={mockReport} />);

    expect(screen.getAllByText(/Chi phí sự cố công ty chi trả/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/- 1\.200\.000/i)).toBeInTheDocument();
  });

  it('handles stream click and selection callback', () => {
    const onSelectStreamMock = vi.fn();
    render(
      <FacilityRevenueChart
        data={mockReport}
        selectedStreamId={null}
        onSelectStream={onSelectStreamMock}
      />
    );

    const overdueButton = screen.getByTestId('stream-item-overdue');
    fireEvent.click(overdueButton);

    expect(onSelectStreamMock).toHaveBeenCalledWith('overdue');
  });

  it('handles zero revenue state gracefully without NaN error', () => {
    const zeroReport: FacilityOverviewReport = {
      ...mockReport,
      rentalRevenue: 0,
      customerServiceFee: 0,
      surchargeRevenue: 0,
      overduePenaltyFee: 0,
      depositBalance: 0,
      companyIncidentCost: 0,
      totalRevenue: 0,
      netRevenue: 0,
    };

    render(<FacilityRevenueChart data={zeroReport} />);

    expect(screen.getByText(/Chưa phát sinh dòng tiền/i)).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});

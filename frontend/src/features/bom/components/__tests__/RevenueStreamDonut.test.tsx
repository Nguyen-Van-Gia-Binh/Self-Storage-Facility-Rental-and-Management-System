// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RevenueStreamDonut } from '../RevenueStreamDonut';
import type { SystemRevenueReport } from '@/types';

const mockRevenue: SystemRevenueReport = {
  from: '2026-10-01',
  to: '2026-10-31',
  totalRevenue: 74590000,
  rentalRevenue: 45390000,
  surchargeRevenue: 1500000,
  overdueFeeRevenue: 450000,
  renewalRevenue: 19200000,
  depositBalance: 8050000,
  totalRefundAmount: 44840000,
  byFacility: [],
};

describe('RevenueStreamDonut Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders SVG Donut Chart with correct aria-label and total amount', () => {
    render(<RevenueStreamDonut revenue={mockRevenue} />);

    // SVG Donut Chart
    const svg = screen.getByLabelText('Biểu đồ tròn cơ cấu nguồn thu');
    expect(svg).toBeInTheDocument();

    // Kiểm tra dòng tiền Net Cash Flow
    expect(screen.getByText(/Khoản tiền đã xử lý \/ hoàn trả khách hàng:/i)).toBeInTheDocument();
    expect(screen.getByText(/- 44\.840\.000/i)).toBeInTheDocument();
  });

  it('renders 4 Mini-KPI cards with accurate metrics and labels', () => {
    render(<RevenueStreamDonut revenue={mockRevenue} />);

    // 4 Thẻ KPI: Tiền thuê kho, Phí gia hạn, Tiền cọc giữ chỗ, Tỷ lệ hoàn / Hủy
    expect(screen.getAllByText('Tiền thuê kho').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Phí gia hạn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tiền cọc giữ chỗ')).toBeInTheDocument();
    expect(screen.getByText('Tỷ lệ hoàn / Hủy')).toBeInTheDocument();

    // Giá trị tiền tệ tương ứng (xuất hiện ở cả Legend và Thẻ KPI)
    expect(screen.getAllByText('45.390.000 ₫').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('19.200.000 ₫').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('8.050.000 ₫').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onSelectStream when clicking a legend item to trigger cross-filtering', () => {
    const onSelectStreamMock = vi.fn();
    render(
      <RevenueStreamDonut
        revenue={mockRevenue}
        selectedStream={null}
        onSelectStream={onSelectStreamMock}
      />
    );

    // Bấm vào mục "Phí gia hạn" trong chú giải
    const renewalLegend = screen.getByTitle(/Hợp đồng tái tục kỳ mới của khách quen/i);
    fireEvent.click(renewalLegend);

    expect(onSelectStreamMock).toHaveBeenCalledWith('renewal');
  });

  it('handles empty data state gracefully', () => {
    render(
      <RevenueStreamDonut
        revenue={{
          from: '2026-10-01',
          to: '2026-10-31',
          totalRevenue: 0,
          rentalRevenue: 0,
          surchargeRevenue: 0,
          overdueFeeRevenue: 0,
          renewalRevenue: 0,
          depositBalance: 0,
          totalRefundAmount: 0,
          byFacility: [],
        }}
      />
    );

    expect(screen.getByText(/Chưa có giao dịch phát sinh trong kỳ/i)).toBeInTheDocument();
  });
});

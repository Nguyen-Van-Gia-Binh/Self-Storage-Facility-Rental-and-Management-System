// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { BomKpiSummary } from '../BomKpiSummary';
import { RevenueTrendCharts } from '../RevenueTrendCharts';
import type { SystemRevenueReport, OverdueReportResponse, MonthlyRevenueTrend } from '@/types';

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('BomKpiSummary - Tier 1 Macro Financial KPIs', () => {
  afterEach(cleanup);

  const mockRevenue: SystemRevenueReport = {
    from: '2026-10-01',
    to: '2026-10-31',
    totalRevenue: 138786000,
    rentalRevenue: 100000000,
    surchargeRevenue: 15000000,
    overdueFeeRevenue: 3786000,
    renewalRevenue: 20000000,
    depositBalance: 30000000,
    totalRefundAmount: 5000000,
    mrr: 85000000,
    activeContractCount: 42,
    totalDepositLiability: 110000000,
    byFacility: [],
  };

  const mockOverdue: OverdueReportResponse = {
    totalOverdueContracts: 4,
    totalAccruedFee: 3786000,
    content: [],
  };

  it('renders đúng 4 thẻ Macro Financial KPI với số liệu chính xác', () => {
    render(<BomKpiSummary revenue={mockRevenue} overdue={mockOverdue} />);

    // 1. Dòng tiền thực thu (Cash Flow)
    expect(screen.getByText(/DÒNG TIỀN THỰC THU \(CASH\)/i)).toBeInTheDocument();
    expect(screen.getByText(/138\.786\.000/i)).toBeInTheDocument();

    // 2. Doanh thu định kỳ (Net MRR)
    expect(screen.getByText(/DOANH THU ĐỊNH KỲ \(MRR\)/i)).toBeInTheDocument();
    expect(screen.getByText(/85\.000\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/42/i)).toBeInTheDocument();
    expect(screen.getByText(/hợp đồng ACTIVE/i)).toBeInTheDocument();

    // 3. Tiền cọc đang giữ (Liability)
    expect(screen.getByText(/TIỀN CỌC ĐANG GIỮ/i)).toBeInTheDocument();
    expect(screen.getByText(/110\.000\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/Nợ phải trả \(Không tính vào DT\)/i)).toBeInTheDocument();

    // 4. Nợ quá hạn (Overdue Bad Debt Risk)
    expect(screen.getByText(/NỢ QUÁ HẠN & RỦI RO/i)).toBeInTheDocument();
    expect(screen.getByText(/3\.786\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/4 hợp đồng quá hạn/i)).toBeInTheDocument();
  });

  it('renders skeleton loading khi isLoading = true', () => {
    const { container } = render(<BomKpiSummary isLoading={true} />);
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThan(0);
  });
});

describe('RevenueTrendCharts - Tier 2 Trends Over Time', () => {
  afterEach(cleanup);

  const mockTrends: MonthlyRevenueTrend[] = [
    {
      month: '2026-09',
      monthLabel: 'T09/26',
      rentalRevenue: 50000000,
      surchargeRevenue: 5000000,
      overdueFeeRevenue: 1000000,
      renewalRevenue: 10000000,
      cashFlow: 66000000,
      mrr: 60000000,
    },
    {
      month: '2026-10',
      monthLabel: 'T10/26',
      rentalRevenue: 70000000,
      surchargeRevenue: 6000000,
      overdueFeeRevenue: 2000000,
      renewalRevenue: 12000000,
      cashFlow: 90000000,
      mrr: 75000000,
    },
  ];

  it('renders biểu đồ khi có dữ liệu', () => {
    render(<RevenueTrendCharts data={mockTrends} />);
    expect(screen.getByText(/Xu Hướng Dòng Tiền Thực Thu \(12 Tháng\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Thực Thu \(Cash\) vs Định Kỳ \(MRR\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Thuê kho & Gia hạn/i)).toBeInTheDocument();
  });

  it('renders empty state tao nhã khi không có dữ liệu', () => {
    render(<RevenueTrendCharts data={[]} />);
    expect(screen.getByText(/Chưa có đủ dữ liệu xu hướng/i)).toBeInTheDocument();
  });
});

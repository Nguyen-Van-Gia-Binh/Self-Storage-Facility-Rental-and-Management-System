import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FacilityReportKpiCards } from '../FacilityReportKpiCards';
import type { FacilityOverviewReport } from '../../../types/report';

describe('FacilityReportKpiCards - Tỷ lệ lấp đầy Usage Rate', () => {
  const baseReport: FacilityOverviewReport = {
    facilityId: 1,
    facilityName: 'Cơ sở Cầu Giấy - Hà Nội',
    month: '2026-10',
    totalUnits: 17,
    availableUnits: 10,
    occupiedUnits: 4,
    maintenanceUnits: 3,
    occupancyRate: 0.235,
    activeContracts: 2,
    overdueContracts: 0,
    newContracts: 0,
    returnedContracts: 0,
    totalRevenue: 0,
    rentalRevenue: 0,
    surchargeRevenue: 0,
    depositBalance: 1750000,
  };

  it('1. Chuẩn hóa tỷ lệ lấp đầy từ hệ số Backend (0.235) hiển thị chính xác 23.5%', () => {
    const html = renderToString(<FacilityReportKpiCards data={{ ...baseReport, occupancyRate: 0.235 }} />);
    expect(html).toMatch(/23\.5(?:<!-- -->)?%/);
    expect(html).not.toMatch(/0\.2(?:<!-- -->)?%/);
    expect(html).toContain('Thấp');
  });

  it('2. Hiển thị chính xác 85.0% và nhãn Tối ưu khi tỷ lệ >= 80%', () => {
    const html = renderToString(<FacilityReportKpiCards data={{ ...baseReport, occupancyRate: 0.85 }} />);
    expect(html).toMatch(/85\.0(?:<!-- -->)?%/);
    expect(html).toContain('Tối ưu');
  });

  it('3. Hiển thị chính xác 65.0% và nhãn Trung bình khi tỷ lệ từ 50% đến dưới 80%', () => {
    const html = renderToString(<FacilityReportKpiCards data={{ ...baseReport, occupancyRate: 0.65 }} />);
    expect(html).toMatch(/65\.0(?:<!-- -->)?%/);
    expect(html).toContain('Trung bình');
  });

  it('4. Hiển thị 0.0% và nhãn Thấp khi occupancyRate = 0', () => {
    const html = renderToString(<FacilityReportKpiCards data={{ ...baseReport, occupancyRate: 0 }} />);
    expect(html).toMatch(/0\.0(?:<!-- -->)?%/);
    expect(html).toContain('Thấp');
  });

  it('5. Tương thích ngược nếu dữ liệu đầu vào đã là số phần trăm (ví dụ 78.95)', () => {
    const html = renderToString(<FacilityReportKpiCards data={{ ...baseReport, occupancyRate: 78.95 }} />);
    expect(html).toMatch(/79\.0(?:<!-- -->)?%/);
    expect(html).toContain('Trung bình');
  });
});

// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { ExecutivePrintReport } from '../ExecutivePrintReport';
import type { OverdueReportResponse, SystemOccupancyReport, SystemRevenueReport } from '@/types';

const mockRevenue: SystemRevenueReport = {
  from: '2026-10-20',
  to: '2026-11-18',
  totalRevenue: 1927380000,
  rentalRevenue: 115370000,
  surchargeRevenue: 5260000,
  renewalRevenue: 1806750000,
  overdueFeeRevenue: 0,
  depositBalance: 17150000,
  totalRefundAmount: 3608770000,
  mrr: 2750000,
  activeContractCount: 5,
  byFacility: [
    {
      facilityId: 1,
      facilityName: 'Cơ sở Quận 1 - TP.HCM',
      rentalRevenue: 90000000,
      surchargeRevenue: 1250000,
      renewalRevenue: 0,
      overdueFeeRevenue: 0,
      depositBalance: 750000,
      refundAmount: 0,
      totalRevenue: 91250000,
    },
  ],
};

const mockOccupancy: SystemOccupancyReport = {
  averageOccupancyRate: 0.009,
  totalUnitsSystem: 591,
  occupiedUnitsSystem: 5,
  availableUnitsSystem: 576,
  data: [
    {
      facilityId: 1,
      facilityName: 'Cơ sở Quận 1 - TP.HCM',
      occupancyRate: 0.07,
      totalUnits: 59,
      occupiedUnits: 4,
      availableUnits: 51,
      reservedUnits: 0,
      cleaningUnits: 0,
      maintenanceUnits: 0,
      outOfServiceUnits: 0,
      overdueContractsCount: 0,
    },
  ],
};

const mockOverdue: OverdueReportResponse = {
  totalOverdueContracts: 0,
  totalAccruedFee: 0,
  content: [],
};

describe('ExecutivePrintReport — Ledger Typography PDF', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses monochrome Ledger formatting: em-dash for zero, no repeated "đ" in table cells, no tfoot duplication, and hides all-zero occupancy columns', () => {
    const { container } = render(
      <ExecutivePrintReport
        revenue={mockRevenue}
        occupancy={mockOccupancy}
        overdue={mockOverdue}
        from="2026-10-20"
        to="2026-11-18"
        scopeName="Toàn bộ hệ thống"
        printedAt="18/11/2026 - 04:08"
        preparedBy="Huỳnh Nhật"
        preparedOn="18/11/2026"
      />
    );

    // Letterhead is rendered inside a div (not <header>, which global print CSS hides!)
    expect(container.querySelector('.ss-letterhead')?.tagName).toBe('DIV');

    // Currency unit stated in metadata & section headers, NOT repeated as "đ" or "₫" inside data cells
    expect(screen.getAllByText(/VND/i).length).toBeGreaterThan(0);
    const tables = container.querySelectorAll('table.ss-table');
    expect(tables.length).toBeGreaterThanOrEqual(2);
    expect(tables[0].textContent).not.toContain('₫');
    expect(tables[0].querySelector('tbody')?.textContent ?? '').not.toMatch(/\d\s*[đ₫]/);

    // Zero values formatted as em-dash "—" instead of "0 đ"
    expect(tables[0].textContent).toContain('—');

    // No <tfoot> that causes Chrome print to duplicate "Cộng" on every page
    expect(tables[0].querySelector('tfoot')).toBeNull();
    expect(tables[0].querySelector('tbody tr.ss-total-row')).not.toBeNull();

    // All-zero operational columns (Đặt chỗ, Vệ sinh, Bảo trì, Ngừng, HĐ quá hạn) are dynamically hidden
    expect(tables[1].textContent).not.toContain('Đặt chỗ');
    expect(tables[1].textContent).not.toContain('Vệ sinh');
    expect(tables[1].textContent).not.toContain('Bảo trì');

    // Structured 3-column approval sign-off block with date lines
    expect(screen.getByText(/NGƯỜI LẬP BIỂU/i)).toBeInTheDocument();
    expect(screen.getByText(/PHỤ TRÁCH VẬN HÀNH/i)).toBeInTheDocument();
    expect(screen.getByText(/GIÁM ĐỐC ĐIỀU HÀNH/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ngày .* tháng .* năm/i).length).toBe(3);
  });
});

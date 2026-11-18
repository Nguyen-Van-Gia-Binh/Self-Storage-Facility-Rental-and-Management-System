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

  it('uses formal Vietnamese contract typography (Times New Roman), official administrative header, monochrome Ledger tables, and 3-column signature block', () => {
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

    // Formal contract serif font (Times New Roman) matching ContractPrintDocument
    const article = container.querySelector('article.ss-report') as HTMLElement | null;
    expect(article).not.toBeNull();
    expect(article?.style.fontFamily).toContain('Times New Roman');

    // Formal Vietnamese administrative header (Left org + Right National Motto)
    expect(container.querySelector('.ss-letterhead')?.tagName).toBe('DIV');
    expect(screen.getByText('CÔNG TY SMARTSTORAGE')).toBeInTheDocument();
    expect(screen.getByText(/Bộ phận: BOM Operations/i)).toBeInTheDocument();
    expect(screen.getByText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')).toBeInTheDocument();
    expect(screen.getByText('Độc lập - Tự do - Hạnh phúc')).toBeInTheDocument();

    // Italic period subtitle centered under report title
    expect(screen.getByText(/Từ ngày 20\/10\/2026 đến ngày 18\/11\/2026/i)).toBeInTheDocument();

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

    // Structured 3-column approval sign-off block with date line
    expect(screen.getByText('NGƯỜI LẬP BIỂU')).toBeInTheDocument();
    expect(screen.getByText('PHỤ TRÁCH VẬN HÀNH')).toBeInTheDocument();
    expect(screen.getByText('GIÁM ĐỐC ĐIỀU HÀNH')).toBeInTheDocument();
    expect(screen.getByText(/ngày .* tháng .* năm 2026/i)).toBeInTheDocument();
  });
});

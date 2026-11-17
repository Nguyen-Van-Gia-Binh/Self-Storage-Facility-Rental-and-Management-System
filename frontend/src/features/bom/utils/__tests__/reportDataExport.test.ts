import { describe, it, expect } from 'vitest';
import {
  buildRevenueCsv,
  buildMultiSheetXlsx,
  buildExportFilename,
} from '../reportDataExport';
import type { OverdueReportResponse, SystemOccupancyReport, SystemRevenueReport } from '@/types';

const sampleRevenue: SystemRevenueReport = {
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
      facilityId: 5,
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

const sampleOccupancy: SystemOccupancyReport = {
  averageOccupancyRate: 0.009,
  totalUnitsSystem: 591,
  occupiedUnitsSystem: 5,
  availableUnitsSystem: 576,
  data: [
    {
      facilityId: 5,
      facilityName: 'Cơ sở Quận 1 - TP.HCM',
      occupancyRate: 0.07,
      totalUnits: 59,
      occupiedUnits: 4,
      availableUnits: 51,
      reservedUnits: 1,
      cleaningUnits: 1,
      maintenanceUnits: 2,
      outOfServiceUnits: 0,
      overdueContractsCount: 0,
    },
  ],
};

const sampleOverdue: OverdueReportResponse = {
  totalOverdueContracts: 0,
  totalAccruedFee: 0,
  content: [],
};

describe('reportDataExport — Enterprise Data Hygiene (CSV + 4-Sheet XLSX)', () => {
  it('generates standardized filename SmartStorage_BaoCaoDoanhThu_YYYY-MM-DD.{ext}', () => {
    expect(buildExportFilename('xlsx', '2026-11-18')).toBe('SmartStorage_BaoCaoDoanhThu_2026-11-18.xlsx');
    expect(buildExportFilename('csv', '2026-11-18', 5)).toBe('SmartStorage_BaoCaoDoanhThu_CoSo5_2026-11-18.csv');
  });

  it('builds raw UTF-8 BOM CSV with Row 1 = Headers, raw integer numbers (no VND/commas), and raw decimal occupancy', () => {
    const csv = buildRevenueCsv(sampleRevenue, sampleOccupancy);
    // Starts with UTF-8 BOM
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    const lines = csv.slice(1).trim().split('\r\n');
    // Row 1 MUST be column headers (no "# BÁO CÁO..." clutter)
    expect(lines[0]).toContain('Mã cơ sở');
    expect(lines[0]).toContain('Tổng doanh thu (VND)');
    expect(lines[0]).not.toMatch(/^#/);

    // Row 2 MUST contain raw unformatted numeric values (no "đ", no "90.000.000", no "7.0%")
    expect(lines[1]).toContain('90000000');
    expect(lines[1]).toContain('91250000');
    expect(lines[1]).toContain('0.07');
    expect(lines[1]).not.toContain('₫');
    expect(lines[1]).not.toContain('7.0%');
  });

  it('builds a valid OOXML ZIP (.xlsx) containing 4 dedicated sheets (Tong_Quan, Chi_Tiet_Doanh_Thu, Hieu_Suat_Co_So, No_Qua_Han)', () => {
    const bytes = buildMultiSheetXlsx({
      revenue: sampleRevenue,
      occupancy: sampleOccupancy,
      overdue: sampleOverdue,
      from: '2026-10-20',
      to: '2026-11-18',
      scopeName: 'Toàn bộ hệ thống',
    });

    // Valid ZIP local file header magic bytes "PK\x03\x04"
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);

    // Since stored ZIP entries are uncompressed UTF-8 XML, inspect sheet names & raw numeric cells directly
    const rawXml = new TextDecoder('utf-8').decode(bytes);
    expect(rawXml).toContain('name="Tong_Quan"');
    expect(rawXml).toContain('name="Chi_Tiet_Doanh_Thu"');
    expect(rawXml).toContain('name="Hieu_Suat_Co_So"');
    expect(rawXml).toContain('name="No_Qua_Han"');

    // Pure numeric cells (no "₫" currency text formatting)
    expect(rawXml).toContain('<v>1927380000</v>');
    expect(rawXml).toContain('<v>91250000</v>');
    expect(rawXml).toContain('<v>0.07</v>');
    expect(rawXml).not.toContain('₫');
    // Zero merged cells
    expect(rawXml).not.toContain('<mergeCells');
  });
});

/**
 * Report domain types for BOM and System BI (BM-04, BM-05)
 * According to API-SPEC.md § 12 and USER-STORIES-BM-SA.md § 5, 6
 */

export interface FacilityRevenueBreakdown {
  facilityId: number;
  facilityName: string;
  totalRevenue: number;
  rentalRevenue: number;
  surchargeRevenue: number;
  overdueFeeRevenue: number;
  renewalRevenue: number;
  depositBalance: number;
  refundAmount: number;
}

export interface SystemRevenueReport {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  totalRevenue: number;
  rentalRevenue: number;
  surchargeRevenue: number;
  overdueFeeRevenue: number;
  renewalRevenue: number;
  depositBalance: number;
  totalRefundAmount: number;
  byFacility: FacilityRevenueBreakdown[];
}

export interface FacilityOccupancyItem {
  facilityId: number;
  facilityName: string;
  month: string; // YYYY-MM
  occupancyRate: number; // 0.0 -> 1.0 (ví dụ 0.784 = 78.4%)
  availableUnits: number;
  reservedUnits: number;
  occupiedUnits: number;
  cleaningUnits: number;
  maintenanceUnits: number;
  outOfServiceUnits: number;
  totalUnits: number;
  overdueContractsCount: number;
}

export interface SystemOccupancyReport {
  month: string;
  averageOccupancyRate: number;
  totalUnitsSystem: number;
  occupiedUnitsSystem: number;
  availableUnitsSystem: number;
  data: FacilityOccupancyItem[];
}

export interface OverdueContractItem {
  contractId: number;
  contractCode: string;
  facilityId: number;
  facilityName: string;
  customerName: string;
  customerPhone: string;
  unitCode: string;
  endDateExclusive: string;
  overdueDays: number;
  monthlyRentalPrice: number;
  accruedOverdueFee: number;
  status: 'OVERDUE';
}

export interface OverdueReportResponse {
  totalOverdueContracts: number;
  totalAccruedFee: number;
  content: OverdueContractItem[];
}

export interface ReportFilterParams {
  periodType: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'CUSTOM';
  from: string;
  to: string;
  facilityId?: number; // undefined = Toàn hệ thống
}

export interface ReportExportParams {
  type: 'REVENUE' | 'OCCUPANCY' | 'OVERDUE';
  from: string;
  to: string;
  facilityId?: number;
  format: 'CSV' | 'XLSX' | 'PDF';
}

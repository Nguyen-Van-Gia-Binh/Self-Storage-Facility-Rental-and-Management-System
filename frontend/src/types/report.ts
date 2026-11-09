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
  mrr?: number;
  activeContractCount?: number;
  depositLiability?: number;
}

export interface MonthlyRevenueTrend {
  month: string;           // "2026-01"
  monthLabel: string;      // "T01/26"
  rentalRevenue: number;
  surchargeRevenue: number;
  overdueFeeRevenue: number;
  renewalRevenue: number;
  cashFlow: number;
  mrr: number;
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
  mrr?: number;
  activeContractCount?: number;
  totalDepositLiability?: number;
  monthlyTrends?: MonthlyRevenueTrend[];
  byFacility: FacilityRevenueBreakdown[];
}

export interface FacilityOccupancyItem {
  facilityId: number;
  facilityName: string;
  month: string; // YYYY-MM
  occupancyRate: number | null; // null khi không có ô khai thác (US-BM-04.2 AC-4)
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
  averageOccupancyRate: number | null;
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

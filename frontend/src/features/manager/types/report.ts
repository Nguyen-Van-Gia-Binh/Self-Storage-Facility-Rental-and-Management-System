// frontend/src/features/manager/types/report.ts

export interface FacilityOverviewReport {
  facilityId: number;
  facilityName: string;
  month: string;
  totalUnits: number;
  availableUnits: number;
  occupiedUnits: number;
  maintenanceUnits: number;
  occupancyRate: number; // Tỷ lệ thập phân 0.0 -> 1.0 (ví dụ: 0.235 ứng với 23.5%)
  activeContracts: number;
  overdueContracts: number;
  newContracts: number;
  returnedContracts: number;
  totalRevenue: number;
  rentalRevenue: number;
  surchargeRevenue: number;
  depositBalance: number;
}

export interface OverdueContractDebt {
  contractId: number;
  contractCode: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  storageUnitId: number;
  unitCode: string;
  endDateExclusive: string;
  overdueDays: number;
  monthlyRentalPrice: number;
  accruedOverdueFee: number;
  totalDebt: number;
  status: 'OVERDUE' | 'TERMINATED' | string;
}

export interface DebtAgeBracket {
  bracketCode: 'D1_TO_D10' | 'D11_TO_D30' | 'OVER_D30' | string;
  bracketName: string;
  contractCount: number;
  totalDebt: number;
  contracts: OverdueContractDebt[];
}

export interface OverdueDebtReport {
  facilityId: number;
  facilityName: string;
  totalOverdueContracts: number;
  totalOverdueDebt: number;
  // BR Chuẩn: 3 giai đoạn xử lý nợ + Mốc D+10+ thanh lý
  bracketD1ToD3?: DebtAgeBracket;
  bracketD4ToD6?: DebtAgeBracket;
  bracketD7ToD10?: DebtAgeBracket;
  bracketTerminatedD10Plus?: DebtAgeBracket;
  // Giữ lại để tương thích ngược
  bracketD1ToD10?: DebtAgeBracket;
  bracketD11ToD30?: DebtAgeBracket;
  bracketOverD30?: DebtAgeBracket;
  contracts: OverdueContractDebt[];
}

export interface FacilityContractSummary {
  id: number;
  code: string;
  customerId: number;
  facilityId: number;
  storageUnitId: number;
  unitTypeId: number;
  unitCode?: string;
  customerName?: string;
  customerPhone?: string;
  startDate: string;
  endDateExclusive: string;
  rentalMonths: number;
  monthlyPrice: number;
  depositAmount: number;
  depositBalance: number;
  status: 'PENDING_CHECKIN' | 'ACTIVE' | 'OVERDUE' | 'RETURN_PENDING' | 'TERMINATED' | 'COMPLETED';
  nearExpiration: boolean;
}

export interface FacilityInfo {
  id: number;
  code: string;
  name: string;
  address?: string;
}

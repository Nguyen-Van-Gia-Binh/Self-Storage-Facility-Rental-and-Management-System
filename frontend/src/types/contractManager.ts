/**
 * Types dành riêng cho Facility Manager Contracts Hub (SCR-FM-02 / T3.12)
 * Tuân thủ TOPIC.md, UI-FLOW-MAPPING.md § 12-14 và API-SPEC.md § 8
 */

export type ManagerContractStatus =
  | 'ACTIVE'
  | 'PENDING_CHECK_IN'
  | 'NOTICE_SUBMITTED'
  | 'INSPECTED'
  | 'OVERDUE'
  | 'CLOSED'
  | 'TERMINATED';

export interface ManagerContractItem {
  id: number;
  code: string;
  reservationId?: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  facilityId: number;
  facilityName: string;
  storageUnitId: number;
  storageUnitCode: string;
  unitTypeId: number;
  unitTypeName: string;
  unitDimensions?: string;
  floor?: number;
  position?: string;
  startDate: string;
  endDateExclusive: string;
  rentalMonths: number;
  monthlyPrice: number;
  depositAmount: number;
  depositBalance: number;
  status: ManagerContractStatus;
  accessCode?: string;
  nearExpiration?: boolean;
  daysRemaining?: number;
  checkInGraceDaysRemaining?: number;

  // Thuộc tính phục vụ Tab Overdue & Sealing
  overdueDays?: number;
  overdueFeeAccrued?: number;
  accruedOverdueFee?: number;
  totalOutstandingDebt?: number;
  isPinLocked?: boolean;
  isSealed?: boolean;

  // Thuộc tính phục vụ Tab Return & Settlement
  returnNoticeDate?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  inspectionCondition?: 'GOOD' | 'MINOR_DAMAGE' | 'HEAVY_DAMAGE';
  damageCost?: number;
  damageNotes?: string;
  estimatedRefund?: number;
  evidenceImageUrls?: string[];
  relocationEligible?: boolean;
  openSupportRequestId?: number | null;
}

export interface ContractKpiData {
  activeCount: number;
  nearExpiringCount: number;
  pendingCheckInCount: number;
  overdueCount: number;
  totalOverdueDebt: number;
  pendingSettlementCount: number;
}

export interface ReassignUnitRequest {
  contractId: number;
  currentUnitId: number;
  newUnitId: number;
  newUnitCode: string;
  reason: string;
  supportRequestId?: number;
  customerConsent?: boolean;
}

export interface AvailableUnitOption {
  id: number;
  code: string;
  unitTypeId: number;
  unitTypeName: string;
  floor: number;
  position: string;
  status: string;
}

export interface ContractFinancialSummary {
  contractId: number;
  contractCode: string;
  customerName: string;
  depositAmount: number;
  depositBalance: number;
  totalRentalFee: number;
  overdueFeeAccrued: number;
  totalUnpaidExtraCharges: number;
  totalOutstandingDebt: number;
  extraCharges: Array<{
    id: number;
    amount: number;
    reason: string;
    status: 'PAID' | 'UNPAID';
    createdAt: string;
  }>;
}

export interface SettlementApprovalRequest {
  contractId: number;
  damageCost: number;
  depositRefundAmount: number;
  penaltyAmount?: number;
  note?: string;
}

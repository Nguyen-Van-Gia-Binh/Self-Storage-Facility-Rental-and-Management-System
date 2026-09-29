/**
 * Global domain types according to TOPIC.md § 7 and DATA-DICTIONARY.md
 */

export type UserRole = 'CUSTOMER' | 'FACILITY_STAFF' | 'FACILITY_MANAGER' | 'BUSINESS_OPS_MANAGER' | 'ADMIN';

export type StorageUnitStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'OVERDUE' | 'LOCKED';

export type ReservationStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED' | 'NO_SHOW';

export type ContractStatus = 'PENDING_CHECKIN' | 'ACTIVE' | 'RETURNING' | 'RETURNED' | 'OVERDUE' | 'TERMINATED' | 'CANCELLED';

export interface StorageUnitType {
  id: string;
  name: string; // Type S, M, L, XL
  description: string;
  isClimateControlled: boolean;
  basePricePerMonth: number;
  dimensions: string; // e.g., 1m x 1m x 2m
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  imageUrl?: string;
}

// --- Public Catalog Types (T2.16 SC-01) ---

export interface FacilityListItem {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  description: string;
  openingHours: string;
  isActive: boolean;
  createdAt: string;
  lowestMonthlyPrice?: number;
  activeUnitTypeCount?: number;
}

export interface FacilityDetail {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  description: string;
  openingHours: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lowestMonthlyPrice?: number;
  activeUnitTypeCount?: number;
}

export interface UnitTypeCatalog {
  id: number;
  facilityId: number;
  name: string;
  description: string;
  widthM: number;
  depthM: number;
  heightM: number;
  areaM2: number;
  monthlyPrice: number;
  totalUnits: number;
  isActive: boolean;
}

export interface AvailabilityResult {
  facilityId: number;
  unitTypeId: number;
  startDate: string;
  endDateExclusive: string;
  rentalMonths: number;
  availableSlots: number;
  monthlyPrice: number;
  totalRentalFee: number;
  depositAmount: number;
}

export interface AvailabilityQuery {
  startDate: string;    // yyyy-MM-dd
  rentalMonths: number; // >= 1
}

// --- Staff Check-in & Handover Types (T3.11 WS2) ---

export interface CheckInContract {
  id: number;
  code: string;
  reservationId: number;
  reservationCode: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerIdentityNumber: string;
  facilityId: number;
  facilityName: string;
  storageUnitId: number;
  storageUnitCode: string;
  floor: number;
  position: string;
  unitTypeId: number;
  unitTypeName: string;
  unitTypeDimensions: string;
  startDate: string;
  endDateExclusive: string;
  rentalMonths: number;
  monthlyPrice: number;
  totalRentalFee: number;
  depositAmount: number;
  totalPayable: number;
  isFullyPaid: boolean;
  status: 'PENDING_CHECK_IN' | 'PENDING_CHECKIN' | 'ACTIVE' | 'TERMINATED' | 'OVERDUE';
  appointmentTime: string;
  graceDaysRemaining: number;
  assignedStaffId?: number;
  assignedStaffName?: string;
}

export interface CheckInSubmitRequest {
  checkinDate: string;
  conditionNote: string;
  customerConfirmed: boolean;
  notes?: string;
  signatureDataUrl?: string;
  accessCardCode?: string;
  inspectionCriteria?: {
    cleanAndEmpty: boolean;
    doorWorking: boolean;
    dryWallsFloor: boolean;
    smartLockReady: boolean;
  };
}

export interface CheckInSubmitResponse {
  contractId: number;
  status: 'ACTIVE';
  checkinDate: string;
  accessCode: string; // 6 số PIN bảo mật
}

export interface HandoverRejectRequest {
  rejectionReason: string;
  reportedDefects?: string;
}

export interface HandoverRejectResponse {
  contractId: number;
  status: 'TERMINATED';
  storageUnitStatus: 'MAINTENANCE';
  message: string;
}

// --- Staff Return Inspection & Daily Tasks Types (T4.13 WS2) ---

export type InspectionCondition = 'GOOD' | 'MINOR_DAMAGE' | 'MAJOR_DAMAGE';

export interface ReturnInspectionRequest {
  returnDate: string;
  condition: InspectionCondition;
  damageNotes?: string;
  damageCost?: number;
  evidenceImageUrls?: string;
  customerConfirmed: boolean;
  signatureDataUrl?: string;
}

export interface ReturnInspectionResponse {
  id: number;
  status: string; // PENDING_RETURN
  returnDate: string;
  estimatedDepositRefund: number;
  overdueFee: number;
  damageCost: number;
}

export interface SettlementPreviewData {
  contractId: number;
  depositAmount: number;
  damageCost: number;
  overdueFee: number;
  unpaidExtraCharges: number;
  depositRefundAmount: number;
  payableAmount: number;
}

export interface ReturnContractDetail {
  id: number;
  code: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerIdentityNumber: string;
  facilityId: number;
  facilityName: string;
  storageUnitId: number;
  storageUnitCode: string;
  unitTypeName: string;
  startDate: string;
  endDateExclusive: string;
  rentalMonths: number;
  monthlyPrice: number;
  depositAmount: number;
  status: string; // ACTIVE, PENDING_RETURN, OVERDUE
  returnNoticeDate?: string;
  requestedReturnDate?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  assignmentStatus?: 'UNASSIGNED' | 'ASSIGNED';
  isInspected?: boolean;
  damageCost?: number;
  damageNotes?: string;
}

export interface DailyCheckInTask {
  reservationId: number;
  contractId?: number;
  customerName: string;
  customerPhone: string;
  unitCode: string;
  startDate: string;
  appointmentTime: string;
  isFullyPaid: boolean;
  status: 'WAITING' | 'ARRIVED' | 'COMPLETED';
}

export interface DailyReturnTask {
  contractId: number;
  contractCode: string;
  customerName: string;
  customerPhone: string;
  unitCode: string;
  returnDate: string;
  appointmentTime: string;
  depositAmount: number;
  status: 'PENDING_INSPECTION' | 'INSPECTED' | 'WAITING_MANAGER';
}

export interface DailyIncidentTask {
  ticketId: number;
  title: string;
  category: 'ACCESS_CODE' | 'LOST_KEY' | 'DAMAGED_UNIT' | 'OVERLOCK_D4' | 'CLEANING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  unitCode: string;
  customerName?: string;
  slaDeadline: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  isOverlockTask?: boolean;
}

export interface StaffDailyTaskReport {
  date: string;
  facilityId: number;
  facilityName: string;
  staffId: number;
  staffName: string;
  pendingCheckIns: DailyCheckInTask[];
  pendingReturns: DailyReturnTask[];
  openSupportRequests: DailyIncidentTask[];
}

// --- BOM Management Types (T2.13 BM-01 & BM-03) ---

export interface CreateFacilityRequest {
  code: string;
  name: string;
  address: string;
  phone?: string;
  description?: string;
  openingHours?: string;
}

export interface UpdateFacilityRequest {
  name: string;
  address: string;
  phone?: string;
  description?: string;
  openingHours?: string;
}

export interface SurchargeItem {
  id: number;
  name: string;
  facilityId?: number | null;
  facilityName?: string;
  unitTypeId?: number | null;
  amount: number;
  type: 'FIXED' | 'PERCENTAGE';
  effectiveDate: string;
  isActive: boolean;
}

export interface CreateSurchargeRequest {
  name: string;
  facilityId?: number | null;
  unitTypeId?: number | null;
  amount: number;
  type: 'FIXED' | 'PERCENTAGE';
  effectiveDate: string;
}

export interface ActivePolicyInfo {
  id: number;
  version: string;
  effectiveDate: string;
  depositMultiplier: number;
  reservationHoldHours: number;
  rentalDailyDivisor: number;
  checkinGraceDays: number;
  cancelFullRefundHours: number;
  cancelLateRefundRate: number;
  renewalMinMonths: number;
  renewalMaxMonths: number;
  overdueGraceDays: number;
  overdueDailyRate: number;
  overdueCapRate: number;
  returnNoticeDays: number;
}

export * from './report';

// --- Online Payment & Digital Move-in Pass Types (T3.10 SC-03) ---

export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface CreatePaymentRequest {
  referenceType: 'RESERVATION' | 'RENEWAL' | 'OVERDUE_FEE' | 'EXTRA_CHARGE';
  referenceId: string | number;
  amount: number;
  method: PaymentMethod;
  transactionRef?: string;
}

export interface PaymentTransaction {
  id: string | number;
  referenceType: string;
  referenceId: string | number;
  amount: number;
  rentalFee: number;
  depositAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  paidAt?: string;
  unitNumber: string;
  facilityName: string;
}

export interface MoveInPassData {
  passCode: string;
  reservationId: string | number;
  unitNumber: string;
  facilityId: string | number;
  facilityName: string;
  facilityAddress: string;
  facilityPhone: string;
  customerName: string;
  customerPhone: string;
  customerIdentity: string;
  startDate: string;
  checkInWindow: string;
  status: 'PENDING_CHECKIN';
  totalPaid: number;
}

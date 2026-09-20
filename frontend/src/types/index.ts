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
  name: string;
  address: string;
  phone: string;
  description: string;
  openingHours: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

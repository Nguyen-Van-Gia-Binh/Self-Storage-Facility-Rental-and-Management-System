export type WaitlistStatus =
  | 'WAITING'
  | 'CONTACTING'
  | 'PENDING_FOLLOW_UP'
  | 'CONVERTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface WaitlistResponse {
  id: number;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  contactPhone?: string;
  customerEmail?: string;
  facilityId: number;
  facilityName?: string;
  unitTypeId: number;
  unitTypeCode?: string;
  unitTypeName?: string;
  targetStartDate: string;
  rentalMonths: number;
  status: WaitlistStatus;
  assignedFmId?: number;
  assignedFmName?: string;
  lastContactedAt?: string;
  contactTimeoutAt?: string;
  contactNotes?: string;
  convertedReservationId?: number;
  convertedReservationCode?: string;
  convertedContractId?: number;
  availableCapacity?: number;
  remainingTimeoutSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWaitlistRequest {
  facilityId: number;
  unitTypeId: number;
  targetStartDate: string;
  rentalMonths?: number;
  phoneNumber: string;
  contactNotes?: string;
}

export interface ConvertWaitlistRequest {
  startDate?: string;
  rentalMonths?: number;
}

export interface ConvertWaitlistToContractRequest {
  startDate?: string;
  rentalMonths?: number;
  storageUnitId?: number;
  paymentMethod?: string;
  customerPhone?: string;
  notes?: string;
}

export interface RejectWaitlistRequest {
  reason?: string;
}

export interface FollowUpWaitlistRequest {
  contactNotes?: string;
}


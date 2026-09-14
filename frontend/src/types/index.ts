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

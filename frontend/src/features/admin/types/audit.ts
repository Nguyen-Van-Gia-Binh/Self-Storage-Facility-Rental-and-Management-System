/**
 * TypeScript definitions for System Administrator Audit Logs & Login History (SA-04 / UC-SYS-03)
 * Maps directly to backend DTOs: AuditLogResponse, LoginHistoryResponse, PageResponse.
 */

export interface AuditLogItem {
  id: number;
  userId?: number | null;
  userEmail?: string | null;
  userFullName?: string | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  beforeValue?: string | null;
  afterValue?: string | null;
  createdAt: string; // ISO string (OffsetDateTime)
}

export interface LoginHistoryItem {
  id: number;
  userId?: number | null;
  email: string;
  loggedInAt: string; // ISO string (OffsetDateTime)
  ipAddress?: string | null;
  userAgent?: string | null;
  isSuccess: boolean;
  failureReason?: string | null;
}

export interface AuditLogFilterParams {
  userId?: number;
  action?: string;
  entityType?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  page?: number;
  size?: number;
  search?: string; // Client-side or free-text search
}

export interface LoginHistoryFilterParams {
  email?: string;
  isSuccess?: boolean;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  page?: number;
  size?: number;
}

export interface AuditStats {
  totalActivities: number;
  roleOrStatusChanges: number;
  failedLoginsToday: number;
  totalLoginsToday: number;
}

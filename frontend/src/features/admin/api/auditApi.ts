import { apiClient } from '@/api/client';
import type { PageResponse } from '@/api/user';
import { tokenStorage } from '@/utils/tokenStorage';
import type {
  AuditLogItem,
  LoginHistoryItem,
  AuditLogFilterParams,
  LoginHistoryFilterParams,
  AuditStats,
} from '../types/audit';

/**
 * 1. Lấy danh sách nhật ký thao tác nghiệp vụ có phân trang và bộ lọc (SA-04, US-SA-04.2)
 * Endpoint: GET /api/v1/audit/activities
 */
export async function getAuditActivities(
  params: AuditLogFilterParams = {}
): Promise<PageResponse<AuditLogItem>> {
  const { page = 0, size = 10, action, entityType, from, to, userId } = params;

  const searchParams = new URLSearchParams();
  searchParams.set('page', String(page));
  searchParams.set('size', String(size));
  if (action && action !== 'ALL') searchParams.set('action', action);
  if (entityType && entityType !== 'ALL') searchParams.set('entityType', entityType);
  if (from) searchParams.set('from', from);
  if (to) searchParams.set('to', to);
  if (userId) searchParams.set('userId', String(userId));

  const res = await apiClient<PageResponse<AuditLogItem>>(`/audit/activities?${searchParams.toString()}`);
  return {
    ...res,
    last: res.last ?? (res.page >= res.totalPages - 1),
  };
}

/**
 * 2. Lấy danh sách lịch sử đăng nhập hệ thống có phân trang và bộ lọc (SA-04, US-SA-04.1)
 * Endpoint: GET /api/v1/audit/logins
 */
export async function getLoginHistories(
  params: LoginHistoryFilterParams = {}
): Promise<PageResponse<LoginHistoryItem>> {
  const { page = 0, size = 10, email, isSuccess, from, to } = params;

  const searchParams = new URLSearchParams();
  searchParams.set('page', String(page));
  searchParams.set('size', String(size));
  if (email) searchParams.set('email', email);
  if (isSuccess !== undefined) searchParams.set('isSuccess', String(isSuccess));
  if (from) searchParams.set('from', from);
  if (to) searchParams.set('to', to);

  const res = await apiClient<PageResponse<LoginHistoryItem>>(`/audit/logins?${searchParams.toString()}`);

  // Chuẩn hóa isSuccess từ backend serializer (hỗ trợ cả success và isSuccess)
  const normalizedContent = (res.content || []).map((item) => ({
    ...item,
    isSuccess:
      (item as unknown as { success?: boolean }).success !== undefined
        ? Boolean((item as unknown as { success?: boolean }).success)
        : Boolean(item.isSuccess),
  }));

  return {
    ...res,
    content: normalizedContent,
    last: res.last ?? (res.page >= res.totalPages - 1),
  };
}

/**
 * 3. Thống kê tổng quan hoạt động & an ninh (Stats Cards)
 */
export async function getAuditStats(): Promise<AuditStats> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [actRes, loginsRes, failedRes] = await Promise.all([
      apiClient<PageResponse<AuditLogItem>>('/audit/activities?page=0&size=100').catch(() => null),
      apiClient<PageResponse<LoginHistoryItem>>(`/audit/logins?page=0&size=1&from=${today}`).catch(() => null),
      apiClient<PageResponse<LoginHistoryItem>>(`/audit/logins?page=0&size=1&isSuccess=false&from=${today}`).catch(() => null),
    ]);

    const totalActivities = actRes?.totalElements ?? 0;
    const roleOrStatusChanges = (actRes?.content || []).filter((i) =>
      i.action.includes('ROLE') || i.action.includes('STATUS') || i.action.includes('ASSIGN')
    ).length;
    const totalLoginsToday = loginsRes?.totalElements ?? 0;
    const failedLoginsToday = failedRes?.totalElements ?? 0;

    return {
      totalActivities,
      roleOrStatusChanges,
      failedLoginsToday,
      totalLoginsToday,
    };
  } catch (error) {
    console.warn('Lỗi lấy thống kê audit:', error);
    return {
      totalActivities: 0,
      roleOrStatusChanges: 0,
      failedLoginsToday: 0,
      totalLoginsToday: 0,
    };
  }
}

/**
 * 4. Xuất file CSV nhật ký thao tác (SA-04, US-SA-04.2 AC-3)
 * Endpoint: GET /api/v1/audit/activities/export
 */
export async function exportAuditLogsCsv(params: AuditLogFilterParams = {}): Promise<void> {
  const { action, entityType, from, to, userId } = params;
  const searchParams = new URLSearchParams();
  if (action && action !== 'ALL') searchParams.set('action', action);
  if (entityType && entityType !== 'ALL') searchParams.set('entityType', entityType);
  if (from) searchParams.set('from', from);
  if (to) searchParams.set('to', to);
  if (userId) searchParams.set('userId', String(userId));

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const token = localStorage.getItem('access_token') || tokenStorage.getAccessToken();
  const response = await fetch(`${baseUrl}/audit/activities/export?${searchParams.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.ok) {
    const blob = await response.blob();
    triggerDownloadBlob(blob, `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  } else {
    throw new Error('Không thể xuất file CSV từ máy chủ');
  }
}

function triggerDownloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

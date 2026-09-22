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
import {
  mockAuditLogs,
  mockLoginHistories,
  mockAuditStats,
} from '../mock/mockAuditData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/**
 * 1. Lấy danh sách nhật ký thao tác nghiệp vụ có phân trang và bộ lọc (SA-04, US-SA-04.2)
 * Endpoint: GET /api/v1/audit/activities
 */
export async function getAuditActivities(
  params: AuditLogFilterParams = {}
): Promise<PageResponse<AuditLogItem>> {
  const { page = 0, size = 10, action, entityType, from, to, userId } = params;

  if (USE_MOCK) {
    return filterMockAuditLogs(params);
  }

  try {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(page));
    searchParams.set('size', String(size));
    if (action && action !== 'ALL') searchParams.set('action', action);
    if (entityType && entityType !== 'ALL') searchParams.set('entityType', entityType);
    if (from) searchParams.set('from', from);
    if (to) searchParams.set('to', to);
    if (userId) searchParams.set('userId', String(userId));

    const res = await apiClient<PageResponse<AuditLogItem>>(`/audit/activities?${searchParams.toString()}`);
    if (res && Array.isArray(res.content)) {
      return res;
    }
    return filterMockAuditLogs(params);
  } catch (error) {
    console.warn('Lỗi gọi API /audit/activities, fallback mock data:', error);
    return filterMockAuditLogs(params);
  }
}

/**
 * 2. Lấy danh sách lịch sử đăng nhập hệ thống có phân trang và bộ lọc (SA-04, US-SA-04.1)
 * Endpoint: GET /api/v1/audit/logins
 */
export async function getLoginHistories(
  params: LoginHistoryFilterParams = {}
): Promise<PageResponse<LoginHistoryItem>> {
  const { page = 0, size = 10, email, isSuccess, from, to } = params;

  if (USE_MOCK) {
    return filterMockLoginHistories(params);
  }

  try {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(page));
    searchParams.set('size', String(size));
    if (email) searchParams.set('email', email);
    if (isSuccess !== undefined) searchParams.set('isSuccess', String(isSuccess));
    if (from) searchParams.set('from', from);
    if (to) searchParams.set('to', to);

    const res = await apiClient<PageResponse<LoginHistoryItem>>(`/audit/logins?${searchParams.toString()}`);
    if (res && Array.isArray(res.content)) {
      return res;
    }
    return filterMockLoginHistories(params);
  } catch (error) {
    console.warn('Lỗi gọi API /audit/logins, fallback mock data:', error);
    return filterMockLoginHistories(params);
  }
}

/**
 * 3. Thống kê tổng quan hoạt động & an ninh (Stats Cards)
 */
export async function getAuditStats(): Promise<AuditStats> {
  return mockAuditStats;
}

/**
 * 4. Xuất file CSV nhật ký thao tác (SA-04, US-SA-04.2 AC-3)
 * Endpoint: GET /api/v1/audit/activities/export
 */
export async function exportAuditLogsCsv(params: AuditLogFilterParams = {}): Promise<void> {
  const { action, entityType, from, to, userId } = params;

  if (!USE_MOCK) {
    try {
      const searchParams = new URLSearchParams();
      if (action && action !== 'ALL') searchParams.set('action', action);
      if (entityType && entityType !== 'ALL') searchParams.set('entityType', entityType);
      if (from) searchParams.set('from', from);
      if (to) searchParams.set('to', to);
      if (userId) searchParams.set('userId', String(userId));

      const token = tokenStorage.getAccessToken();
      const response = await fetch(`/api/v1/audit/activities/export?${searchParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const blob = await response.blob();
        triggerDownloadBlob(blob, `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
        return;
      }
    } catch (e) {
      console.warn('Backend export failed, fallback to client-side CSV generator:', e);
    }
  }

  // Fallback: Client-side CSV generation with UTF-8 BOM
  const data = filterMockAuditLogs({ ...params, size: 1000 }).content;
  const headers = ['ID', 'Thời điểm', 'Email người dùng', 'Họ tên', 'Hành động', 'Đối tượng', 'Mã đối tượng', 'Chi tiết trước', 'Chi tiết sau'];
  const rows = data.map((item) => [
    item.id,
    `"${item.createdAt}"`,
    `"${item.userEmail || ''}"`,
    `"${item.userFullName || ''}"`,
    `"${item.action}"`,
    `"${item.entityType}"`,
    item.entityId ?? '',
    `"${(item.beforeValue || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(item.afterValue || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownloadBlob(blob, `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
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

function filterMockAuditLogs(params: AuditLogFilterParams): PageResponse<AuditLogItem> {
  let list = [...mockAuditLogs];

  if (params.action && params.action !== 'ALL') {
    list = list.filter((i) => i.action === params.action);
  }
  if (params.entityType && params.entityType !== 'ALL') {
    list = list.filter((i) => i.entityType === params.entityType);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (i) =>
        (i.userFullName && i.userFullName.toLowerCase().includes(q)) ||
        (i.userEmail && i.userEmail.toLowerCase().includes(q)) ||
        i.action.toLowerCase().includes(q) ||
        i.entityType.toLowerCase().includes(q)
    );
  }
  if (params.from) {
    list = list.filter((i) => i.createdAt >= params.from!);
  }
  if (params.to) {
    list = list.filter((i) => i.createdAt.slice(0, 10) <= params.to!);
  }

  const page = params.page || 0;
  const size = params.size || 10;
  const total = list.length;
  const start = page * size;
  const content = list.slice(start, start + size);

  return {
    content,
    page,
    size,
    totalElements: total,
    totalPages: Math.ceil(total / size) || 1,
    last: start + size >= total,
  };
}

function filterMockLoginHistories(params: LoginHistoryFilterParams): PageResponse<LoginHistoryItem> {
  let list = [...mockLoginHistories];

  if (params.email) {
    const q = params.email.toLowerCase();
    list = list.filter((i) => i.email.toLowerCase().includes(q));
  }
  if (params.isSuccess !== undefined) {
    list = list.filter((i) => i.isSuccess === params.isSuccess);
  }
  if (params.from) {
    list = list.filter((i) => i.loggedInAt >= params.from!);
  }
  if (params.to) {
    list = list.filter((i) => i.loggedInAt.slice(0, 10) <= params.to!);
  }

  const page = params.page || 0;
  const size = params.size || 10;
  const total = list.length;
  const start = page * size;
  const content = list.slice(start, start + size);

  return {
    content,
    page,
    size,
    totalElements: total,
    totalPages: Math.ceil(total / size) || 1,
    last: start + size >= total,
  };
}

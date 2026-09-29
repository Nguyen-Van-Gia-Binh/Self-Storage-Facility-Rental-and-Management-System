import { apiClient, isMockEnabled } from './client';
import type { ApiResponse } from './client';
import type { StaffDailyTaskReport, DailyIncidentTask } from '../types';
import mockDailyTasksData from '../mock/mock-daily-tasks.json';

const localDailyTasks: StaffDailyTaskReport = JSON.parse(JSON.stringify(mockDailyTasksData));

function mapRawSupportTask(item: any): DailyIncidentTask {
  const isUrgent = item.isUrgent ?? (item.priority === 'URGENT');
  return {
    ticketId: item.ticketId ?? item.supportRequestId ?? item.id ?? Math.floor(Math.random() * 10000),
    code: item.code ?? (item.supportRequestId ? `SUP-${item.supportRequestId}` : (item.id ? `SUP-${item.id}` : undefined)),
    title: item.title ?? item.description ?? 'Sự cố vận hành',
    description: item.description ?? item.title ?? 'Sự cố vận hành',
    category: item.category ?? 'DAMAGED_UNIT',
    priority: item.priority ?? (isUrgent ? 'URGENT' : 'MEDIUM'),
    unitCode: item.unitCode ?? item.storageUnitCode ?? '---',
    storageUnitId: item.storageUnitId,
    facilityId: item.facilityId,
    facilityName: item.facilityName,
    customerName: item.customerName ?? item.reporterName ?? undefined,
    customerPhone: item.customerPhone ?? undefined,
    slaDeadline: item.slaDeadline ?? (item.slaDueAt ? new Date(item.slaDueAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'SLA 2h'),
    slaDueAt: item.slaDueAt,
    status: item.status === 'RESOLVED' ? 'RESOLVED' : item.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : item.status === 'ASSIGNED' ? 'ASSIGNED' : item.status === 'CLOSED' ? 'CLOSED' : 'PENDING',
    isOverlockTask: item.isOverlockTask ?? (item.category === 'OVERLOCK_D4' || item.category === 'OVERLOCK'),
    assignedStaffId: item.assignedStaffId,
    assignedStaffName: item.assignedStaffName,
    attachmentUrls: item.attachmentUrls,
    resolutionAttachmentUrls: item.resolutionAttachmentUrls,
    resolutionNote: item.resolutionNote,
    createdAt: item.createdAt,
  };
}

/**
 * Lấy danh sách công việc hằng ngày trong ca trực của Staff (FS-06, T4.9)
 * Endpoint: GET /api/v1/reports/staff/{staffId}/daily-tasks?date={date}
 */
export async function getStaffDailyTasks(
  staffId: number,
  date?: string
): Promise<StaffDailyTaskReport> {
  const queryDate = date || new Date().toISOString().split('T')[0];

  if (isMockEnabled('WS2')) {
    return { ...localDailyTasks, date: queryDate };
  }

  // Không fallback về mock — để lỗi propagate để UI xử lý
  const res = await apiClient<ApiResponse<any>>(
    `/reports/staff/${staffId}/daily-tasks?date=${queryDate}`
  );
  const data = res.data;
  const rawList = data?.supportTasks || data?.openSupportRequests || [];
  return {
    ...data,
    openSupportRequests: rawList.map(mapRawSupportTask)
  };
}

/**
 * Lấy danh sách sự cố vận hành được phân công hoặc trong ca trực (FS-05, FS-06)
 * Endpoint: GET /api/v1/management/support-requests
 */
export async function getStaffIncidents(params?: {
  assignedStaffId?: number;
  status?: string;
  category?: string;
  facilityId?: number;
  page?: number;
  size?: number;
}): Promise<{ content: DailyIncidentTask[]; totalElements: number; totalPages: number }> {
  const queryParams = new URLSearchParams();
  if (params?.assignedStaffId) queryParams.set('assignedStaffId', String(params.assignedStaffId));
  if (params?.status && params.status !== 'ALL') queryParams.set('status', params.status);
  if (params?.category && params.category !== 'ALL') queryParams.set('category', params.category);
  if (params?.facilityId) queryParams.set('facilityId', String(params.facilityId));
  if (params?.page !== undefined) queryParams.set('page', String(params.page));
  if (params?.size !== undefined) queryParams.set('size', String(params.size));

  const url = `/management/support-requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await apiClient<ApiResponse<any>>(url);
  const data = res.data;

  return {
    content: (data?.content || []).map(mapRawSupportTask),
    totalElements: data?.totalElements || 0,
    totalPages: data?.totalPages || 1,
  };
}

/**
 * Xem chi tiết sự cố kỹ thuật (FS-05, US-FS-05.1, US-FS-05.2)
 * Endpoint: GET /api/v1/management/support-requests/{id}
 */
export async function getStaffIncidentDetail(ticketId: number): Promise<DailyIncidentTask> {
  const res = await apiClient<ApiResponse<any>>(`/management/support-requests/${ticketId}`);
  return mapRawSupportTask(res.data);
}

/**
 * Tiếp nhận và bắt đầu kiểm tra hiện trường (FS-05, US-FS-05.2 AC-1)
 * Endpoint: PATCH /api/v1/support-requests/{id}/in-progress
 */
export async function startStaffIncident(ticketId: number): Promise<{ success: boolean; message: string }> {
  await apiClient(`/support-requests/${ticketId}/in-progress`, {
    method: 'PATCH',
  });
  return {
    success: true,
    message: 'Đã tiếp nhận sự cố và chuyển trạng thái: Đang xử lý tại hiện trường',
  };
}

/**
 * Hoàn thành xử lý sự cố kèm ảnh hiện trạng và biên bản (FS-05, US-FS-05.2 AC-2, AC-4)
 * Endpoint: PATCH /api/v1/support-requests/{id}/resolve
 */
export async function resolveStaffIncident(
  ticketId: number,
  payload: { resolutionNote: string; resolutionAttachmentUrls?: string[] }
): Promise<{ success: boolean; message: string }> {
  await apiClient(`/support-requests/${ticketId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({
      resolutionNote: payload.resolutionNote,
      resolutionAttachmentUrls: payload.resolutionAttachmentUrls || [],
    }),
  });
  return {
    success: true,
    message: 'Đã hoàn tất khắc phục sự cố và chuyển biên bản nghiệm thu cho khách hàng',
  };
}

/**
 * Cập nhật trạng thái một công việc trong ca trực (lưu cục bộ session mock)
 */
export function updateTaskStatusInSession(
  type: 'checkIn' | 'return' | 'incident',
  id: number,
  newStatus: string
) {
  if (type === 'return') {
    localDailyTasks.pendingReturns = localDailyTasks.pendingReturns.map((r) =>
      r.contractId === id
        ? { ...r, status: newStatus as StaffDailyTaskReport['pendingReturns'][number]['status'] }
        : r
    );
  } else if (type === 'checkIn') {
    localDailyTasks.pendingCheckIns = localDailyTasks.pendingCheckIns.map((c) =>
      c.reservationId === id
        ? { ...c, status: newStatus as StaffDailyTaskReport['pendingCheckIns'][number]['status'] }
        : c
    );
  } else if (type === 'incident') {
    localDailyTasks.openSupportRequests = localDailyTasks.openSupportRequests.map((i) =>
      i.ticketId === id
        ? { ...i, status: newStatus as StaffDailyTaskReport['openSupportRequests'][number]['status'] }
        : i
    );
  }
}

import { apiClient } from './client';
import type { ApiResponse } from './client';
import type { StaffDailyTaskReport, DailyIncidentTask } from '../types';

function mapRawSupportTask(item: any): DailyIncidentTask {
  const isUrgent = item.isUrgent ?? (item.priority === 'URGENT');
  const ticketId = item.ticketId ?? item.supportRequestId ?? item.id;
  return {
    ticketId,
    code: item.code,
    title: item.title ?? item.description ?? '',
    description: item.description ?? item.title ?? '',
    category: item.category ?? '',
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
    relocationRequired: Boolean(item.relocationRequired),
    contractId: item.contractId ?? undefined,
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

  const res = await apiClient<ApiResponse<any>>(
    `/reports/staff/${staffId}/daily-tasks?date=${queryDate}`
  );
  const data = res.data;
  const rawList = data?.supportTasks || data?.openSupportRequests || [];
  const rawCheckIns = data?.checkInTasks || data?.pendingCheckIns || [];
  const rawReturns = data?.returnTasks || data?.pendingReturns || [];

  return {
    ...data,
    pendingCheckIns: rawCheckIns.map((ci: any) => ({
      ...ci,
      reservationId: ci.reservationId ?? ci.contractId,
      contractCode: ci.contractCode,
      unitCode: ci.storageUnitCode || ci.unitCode || '---',
      facilityId: ci.facilityId,
      facilityName: ci.facilityName,
      appointmentTime: ci.appointmentTime || (ci.scheduledDate ? `Ngày ${ci.scheduledDate}` : 'Trong ngày'),
      status: (ci.completed || ci.status === 'COMPLETED' || ci.status === 'ACTIVE') ? 'COMPLETED' : (ci.status || 'PENDING'),
      completed: Boolean(ci.completed || ci.status === 'COMPLETED' || ci.status === 'ACTIVE'),
    })),
    pendingReturns: rawReturns.map((rt: any) => ({
      ...rt,
      contractId: rt.contractId,
      contractCode: rt.contractCode,
      unitCode: rt.storageUnitCode || rt.unitCode || '---',
      facilityId: rt.facilityId,
      facilityName: rt.facilityName,
      appointmentTime: rt.appointmentTime || (rt.scheduledDate ? `Ngày ${rt.scheduledDate}` : 'Trong ngày'),
      depositAmount: rt.depositAmount ?? 0,
      status: (rt.completed || rt.status === 'COMPLETED' || rt.status === 'INSPECTED' || rt.status === 'RETURNED') ? 'COMPLETED' : (rt.status || 'PENDING_INSPECTION'),
      completed: Boolean(rt.completed || rt.status === 'COMPLETED' || rt.status === 'INSPECTED' || rt.status === 'RETURNED'),
    })),
    openSupportRequests: rawList.map(mapRawSupportTask),
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
export async function markStaffIncidentRelocation(
  ticketId: number,
  required: boolean
): Promise<{ success: boolean; message: string }> {
  await apiClient(`/support-requests/${ticketId}/relocation-required`, {
    method: 'PATCH',
    body: JSON.stringify({ required }),
  });
  return {
    success: true,
    message: required
      ? 'Đã đánh dấu phiếu cần di dời sang ô dự phòng'
      : 'Đã bỏ đánh dấu cần di dời',
  };
}

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

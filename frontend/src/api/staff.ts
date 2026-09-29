import { apiClient, isMockEnabled } from './client';
import type { ApiResponse } from './client';
import type { StaffDailyTaskReport, DailyIncidentTask } from '../types';
import mockDailyTasksData from '../mock/mock-daily-tasks.json';

const localDailyTasks: StaffDailyTaskReport = JSON.parse(JSON.stringify(mockDailyTasksData));

function mapRawSupportTask(item: any): DailyIncidentTask {
  return {
    ticketId: item.ticketId ?? item.supportRequestId ?? Math.floor(Math.random() * 10000),
    code: item.code ?? (item.supportRequestId ? `SUP-${item.supportRequestId}` : undefined),
    title: item.title ?? item.description ?? 'Sự cố vận hành',
    category: item.category ?? 'DAMAGED_UNIT',
    priority: item.priority ?? (item.isUrgent ? 'URGENT' : 'MEDIUM'),
    unitCode: item.unitCode ?? item.storageUnitCode ?? '---',
    customerName: item.customerName ?? item.reporterName ?? undefined,
    slaDeadline: item.slaDeadline ?? (item.slaDueAt ? new Date(item.slaDueAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'SLA 2h'),
    status: item.status === 'RESOLVED' ? 'RESOLVED' : item.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING',
    isOverlockTask: item.isOverlockTask ?? (item.category === 'OVERLOCK_D4' || item.category === 'OVERLOCK')
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
  return {
    ...data,
    openSupportRequests: (data.openSupportRequests || []).map(mapRawSupportTask)
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

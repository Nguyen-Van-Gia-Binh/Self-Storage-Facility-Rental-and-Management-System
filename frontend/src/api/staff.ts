import { apiClient, isMockEnabled } from './client';
import type { ApiResponse } from './client';
import type { StaffDailyTaskReport } from '../types';
import mockDailyTasksData from '../mock/mock-daily-tasks.json';

const localDailyTasks: StaffDailyTaskReport = JSON.parse(JSON.stringify(mockDailyTasksData));

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
  const res = await apiClient<ApiResponse<StaffDailyTaskReport>>(
    `/reports/staff/${staffId}/daily-tasks?date=${queryDate}`
  );
  return res.data;
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

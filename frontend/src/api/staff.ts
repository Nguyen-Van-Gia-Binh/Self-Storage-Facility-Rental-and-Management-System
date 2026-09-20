import { apiClient } from './client';
import type { ApiResponse } from './client';
import type { StaffDailyTaskReport } from '../types';
import mockDailyTasksData from '../mock/mock-daily-tasks.json';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const localDailyTasks: StaffDailyTaskReport = JSON.parse(JSON.stringify(mockDailyTasksData));

/**
 * Lấy danh sách công việc hằng ngày trong ca trực của Staff (FS-06, T4.9)
 * Endpoint: GET /api/v1/reports/staff/{staffId}/daily-tasks?date={date}
 */
export async function getStaffDailyTasks(
  staffId: number = 8,
  date?: string
): Promise<StaffDailyTaskReport> {
  const queryDate = date || new Date().toISOString().split('T')[0];

  if (USE_MOCK) {
    return {
      ...localDailyTasks,
      date: queryDate,
    };
  }

  try {
    const res = await apiClient<ApiResponse<StaffDailyTaskReport> | StaffDailyTaskReport>(
      `/reports/staff/${staffId}/daily-tasks?date=${queryDate}`
    );
    if ('data' in res && res.data) {
      return res.data;
    }
    return res as StaffDailyTaskReport;
  } catch (error) {
    console.warn('Lỗi gọi API /reports/staff/.../daily-tasks, fallback mock:', error);
    return {
      ...localDailyTasks,
      date: queryDate,
    };
  }
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
      r.contractId === id ? { ...r, status: newStatus as any } : r
    );
  } else if (type === 'checkIn') {
    localDailyTasks.pendingCheckIns = localDailyTasks.pendingCheckIns.map((c) =>
      c.reservationId === id ? { ...c, status: newStatus as any } : c
    );
  } else if (type === 'incident') {
    localDailyTasks.openSupportRequests = localDailyTasks.openSupportRequests.map((i) =>
      i.ticketId === id ? { ...i, status: newStatus as any } : i
    );
  }
}

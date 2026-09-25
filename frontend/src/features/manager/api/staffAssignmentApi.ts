import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/api/client';
import type {
  StaffWorkloadItem,
  DailyDispatchTaskItem,
  AssignTaskPayload,
  ManagementSupportTicket,
  SupportStatus,
  SupportCategory,
  ResolveSupportRequestDto,
} from '../types/staffAssignment';
import type { StaffDailyTaskReport } from '@/types';
import {
  mockStaffWorkload,
  mockDailyDispatchTasks,
  mockManagementSupportTickets,
} from '../mock/mockStaffAssignmentData';
import { getStaffDailyTasks } from '@/api/staff';
import { getPendingContracts } from '@/api/contract';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Trạng thái bộ nhớ tạm trong phiên làm việc cho Mock mode
let memoryStaffWorkload: StaffWorkloadItem[] = JSON.parse(JSON.stringify(mockStaffWorkload));
let memoryDispatchTasks: DailyDispatchTaskItem[] = JSON.parse(JSON.stringify(mockDailyDispatchTasks));
let memorySupportTickets: ManagementSupportTicket[] = JSON.parse(JSON.stringify(mockManagementSupportTickets));

/**
 * 1. Lấy danh sách tải công việc của nhân viên cơ sở (FM-05, US-FM-05.1 AC-3)
 * Endpoint Backend: GET /api/v1/support-requests/staff-workload?facilityId={facilityId}
 */
export async function getStaffWorkload(facilityId: number): Promise<StaffWorkloadItem[]> {
  if (USE_MOCK) {
    return memoryStaffWorkload.filter((s) => s.facilityId === facilityId);
  }

  try {
    const res = await apiClient<ApiResponse<StaffWorkloadItem[]> | StaffWorkloadItem[]>(
      `/support-requests/staff-workload?facilityId=${facilityId}`
    );
    if ('data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    if (Array.isArray(res)) {
      return res;
    }
    return memoryStaffWorkload.filter((s) => s.facilityId === facilityId);
  } catch (error) {
    console.warn('Lỗi gọi API /support-requests/staff-workload, fallback mock:', error);
    return memoryStaffWorkload.filter((s) => s.facilityId === facilityId);
  }
}

/**
 * 2. Lấy danh sách nhiệm vụ thực địa cần điều phối trong ngày (SCR-FM-03)
 */
export async function getDailyDispatchTasks(
  facilityId: number,
  _date?: string
): Promise<DailyDispatchTaskItem[]> {
  try {
    // Tự động kéo các hợp đồng PENDING_CHECK_IN từ backend để sinh task tiếp đón
    const pendingContracts = await getPendingContracts(facilityId);
    if (pendingContracts && Array.isArray(pendingContracts)) {
      pendingContracts.forEach((contract: any) => {
        const exists = memoryDispatchTasks.some(
          (t) => t.referenceId === contract.id && t.taskType === 'CHECK_IN'
        );
        if (!exists) {
          memoryDispatchTasks.unshift({
            id: 9000 + contract.id,
            taskType: 'CHECK_IN',
            title: `Tiếp đón bàn giao kho cho hợp đồng ${contract.code}`,
            facilityId: contract.facilityId || facilityId,
            facilityName: contract.facilityName || 'Kho SmartStorage',
            unitCode: contract.storageUnitCode || `U-${contract.storageUnitId || contract.id}`,
            customerName: contract.customerName || 'Khách hàng',
            customerPhone: contract.customerPhone || '0901234567',
            scheduledDate: contract.startDate || new Date().toISOString().split('T')[0],
            scheduledTime: '09:00 - 11:30',
            priority: 'NORMAL',
            isUrgent: false,
            status: 'UNASSIGNED',
            referenceId: contract.id,
            referenceCode: contract.code,
            notes: 'Khách hàng đã đặt cọc VietQR thành công, sẵn sàng nhận kho 48h.',
          });
        }
      });
    }
  } catch (err) {
    console.warn('Lỗi đồng bộ hợp đồng chờ check-in vào nhiệm vụ thực địa:', err);
  }

  // Lọc theo cơ sở
  return memoryDispatchTasks.filter((t) => t.facilityId === facilityId);
}

/**
 * 3. Phân công hoặc điều chuyển nhân viên cho một nhiệm vụ thực địa (US-FM-05.1 AC-1, AC-2, AC-4)
 * Nếu là Incident task -> gọi thêm PATCH /api/v1/support-requests/{id}/assign
 */
export async function assignStaffToTask(
  payload: AssignTaskPayload
): Promise<{ success: boolean; message: string; updatedTask: DailyDispatchTaskItem }> {
  const staff = memoryStaffWorkload.find((s) => s.staffId === payload.staffId);
  if (!staff) {
    throw new Error('Không tìm thấy thông tin nhân viên được chọn');
  }

  const taskIndex = memoryDispatchTasks.findIndex((t) => t.id === payload.taskId);
  if (taskIndex === -1) {
    throw new Error('Không tìm thấy nhiệm vụ cần phân công');
  }

  const prevTask = memoryDispatchTasks[taskIndex];
  const prevStaffId = prevTask.assignedStaffId;

  // Cập nhật tải công việc của nhân viên cũ (nếu điều chuyển AC-4)
  if (prevStaffId && prevStaffId !== payload.staffId) {
    const prevStaff = memoryStaffWorkload.find((s) => s.staffId === prevStaffId);
    if (prevStaff && prevStaff.activeTaskCount > 0) {
      prevStaff.activeTaskCount -= 1;
      if (prevStaff.activeTaskCount <= 2) prevStaff.status = 'AVAILABLE';
      else if (prevStaff.activeTaskCount <= 4) prevStaff.status = 'NORMAL';
    }
  }

  // Cập nhật tải công việc của nhân viên mới
  if (prevStaffId !== payload.staffId) {
    staff.activeTaskCount += 1;
    if (staff.activeTaskCount >= 5) {
      staff.status = 'OVERLOADED';
    } else if (staff.activeTaskCount >= 3) {
      staff.status = 'NORMAL';
    }
  }

  // Cập nhật nhiệm vụ
  const updatedTask: DailyDispatchTaskItem = {
    ...prevTask,
    assignedStaffId: staff.staffId,
    assignedStaffName: staff.staffName,
    priority: payload.priority,
    isUrgent: payload.priority === 'URGENT',
    status: 'ASSIGNED',
    notes: payload.notes || prevTask.notes,
  };

  memoryDispatchTasks[taskIndex] = updatedTask;

  // Nếu nhiệm vụ là INCIDENT, đồng bộ sang danh sách Support Tickets và gọi Backend
  if (prevTask.taskType === 'INCIDENT' && prevTask.referenceId) {
    const ticketIndex = memorySupportTickets.findIndex((t) => t.id === prevTask.referenceId);
    if (ticketIndex !== -1) {
      memorySupportTickets[ticketIndex] = {
        ...memorySupportTickets[ticketIndex],
        assignedStaffId: staff.staffId,
        assignedStaffName: staff.staffName,
        status: 'ASSIGNED',
        isUrgent: payload.priority === 'URGENT',
        assignmentNotes: payload.notes,
      };
    }

    if (!USE_MOCK) {
      try {
        await apiClient(`/support-requests/${prevTask.referenceId}/assign`, {
          method: 'PATCH',
          body: JSON.stringify({
            staffId: payload.staffId,
            note: payload.notes || 'Phân công từ bàn điều phối cơ sở',
          }),
        });
      } catch (err) {
        console.warn('Lỗi gọi API PATCH /support-requests/{id}/assign:', err);
      }
    }
  }

  const isReassign = Boolean(prevStaffId && prevStaffId !== payload.staffId);
  const actionMsg = isReassign
    ? `Đã điều chuyển nhiệm vụ sang nhân viên ${staff.staffName}`
    : `Đã phân công nhiệm vụ cho nhân viên ${staff.staffName}`;

  return {
    success: true,
    message: actionMsg,
    updatedTask,
  };
}

/**
 * 4. Lấy danh sách phiếu yêu cầu hỗ trợ sự cố dành cho Quản lý (SCR-FM-05 / Flow 7)
 * Endpoint Backend: GET /api/v1/management/support-requests
 */
export async function getManagementSupportRequests(params?: {
  facilityId?: number;
  status?: SupportStatus;
  category?: SupportCategory;
  isUrgent?: boolean;
  keyword?: string;
}): Promise<ManagementSupportTicket[]> {
  if (USE_MOCK) {
    let result = [...memorySupportTickets];
    if (params?.facilityId) {
      result = result.filter((t) => t.facilityId === params.facilityId);
    }
    if (params?.status) {
      result = result.filter((t) => t.status === params.status);
    }
    if (params?.category) {
      result = result.filter((t) => t.category === params.category);
    }
    if (params?.isUrgent !== undefined) {
      result = result.filter((t) => t.isUrgent === params.isUrgent);
    }
    if (params?.keyword?.trim()) {
      const q = params.keyword.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.storageUnitCode.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }

  try {
    const query = new URLSearchParams();
    if (params?.facilityId) query.set('facilityId', String(params.facilityId));
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    query.set('size', '50');

    const res = await apiClient<ApiResponse<{ content: ManagementSupportTicket[] }> | { content: ManagementSupportTicket[] }>(
      `/management/support-requests?${query.toString()}`
    );

    let list: ManagementSupportTicket[] = [];
    if ('data' in res && res.data && Array.isArray(res.data.content)) {
      list = res.data.content;
    } else if ('content' in res && Array.isArray(res.content)) {
      list = res.content;
    } else {
      list = memorySupportTickets;
    }

    if (params?.keyword?.trim()) {
      const q = params.keyword.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.storageUnitCode.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q)
      );
    }
    return list;
  } catch (err) {
    console.warn('Lỗi gọi API /management/support-requests, fallback mock:', err);
    return memorySupportTickets;
  }
}

/**
 * 5. Phân công trực tiếp từ màn hình Incidents Hub (PATCH /api/v1/support-requests/{id}/assign)
 */
export async function assignSupportStaffDirect(
  ticketId: number,
  staffId: number,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const staff = memoryStaffWorkload.find((s) => s.staffId === staffId);
  const staffName = staff ? staff.staffName : `Nhân viên #${staffId}`;

  // Cập nhật ticket trong memory
  const idx = memorySupportTickets.findIndex((t) => t.id === ticketId);
  if (idx !== -1) {
    memorySupportTickets[idx] = {
      ...memorySupportTickets[idx],
      assignedStaffId: staffId,
      assignedStaffName: staffName,
      status: 'ASSIGNED',
      assignmentNotes: notes,
      updatedAt: new Date().toISOString(),
    };
  }

  // Tăng workload của nhân viên
  if (staff) {
    staff.activeTaskCount += 1;
    if (staff.activeTaskCount >= 5) staff.status = 'OVERLOADED';
  }

  if (!USE_MOCK) {
    try {
      await apiClient(`/support-requests/${ticketId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ staffId, note: notes || '' }),
      });
    } catch (err) {
      console.warn('Lỗi gọi API assign support direct, fallback mock:', err);
    }
  }

  return {
    success: true,
    message: `Đã phân công xử lý ticket cho ${staffName}`,
  };
}

/**
 * 6. Xem toàn bộ ca trực và danh mục việc trong ngày của 1 nhân viên (FS-06 / FM-05)
 * Endpoint: GET /api/v1/reports/staff/{staffId}/daily-tasks
 */
export async function getStaffDailySchedule(
  staffId: number,
  date?: string
): Promise<StaffDailyTaskReport> {
  return getStaffDailyTasks(staffId, date);
}

/**
 * 7. Hoàn thành xử lý sự cố kỹ thuật (FS-05, FM-05)
 */
export async function resolveSupportTicket(
  ticketId: number,
  payload: ResolveSupportRequestDto
): Promise<{ success: boolean; message: string }> {
  const idx = memorySupportTickets.findIndex((t) => t.id === ticketId);
  if (idx !== -1) {
    memorySupportTickets[idx] = {
      ...memorySupportTickets[idx],
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolutionNotes: payload.resolutionNotes,
    };
  }

  if (!USE_MOCK) {
    try {
      await apiClient(`/support-requests/${ticketId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Lỗi gọi API resolve support ticket:', err);
    }
  }

  return {
    success: true,
    message: 'Đã hoàn thành và giải quyết sự cố kỹ thuật',
  };
}

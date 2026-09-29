import { apiClient } from '@/api/client';
import type { ApiResponse, PageResponse } from '@/api/client';
import type {
  StaffWorkloadItem,
  DailyDispatchTaskItem,
  AssignTaskPayload,
  ManagementSupportTicket,
  SupportStatus,
  SupportCategory,
  ResolveSupportRequestDto,
  DispatchTaskPriority,
} from '../types/staffAssignment';
import type { StaffDailyTaskReport } from '@/types';
import { getStaffDailyTasks } from '@/api/staff';
import { getPendingContracts, getManagerContracts, assignReturnStaff, assignCheckInStaff } from '@/api/contract';

const TASK_OVERRIDES_KEY = 'smartstorage_dispatch_task_overrides';

function getTaskOverrides(): Record<string, { priority?: DispatchTaskPriority; isUrgent?: boolean; notes?: string; staffId?: number; staffName?: string }> {
  try {
    const raw = localStorage.getItem(TASK_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTaskOverride(taskId: number, data: { priority?: DispatchTaskPriority; isUrgent?: boolean; notes?: string; staffId?: number; staffName?: string }) {
  try {
    const current = getTaskOverrides();
    current[String(taskId)] = { ...current[String(taskId)], ...data };
    localStorage.setItem(TASK_OVERRIDES_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

/**
 * 1. Lấy danh sách tải công việc của nhân viên cơ sở (FM-05, US-FM-05.1 AC-3)
 * Endpoint Backend: GET /api/v1/support-requests/staff-workload?facilityId={facilityId}
 */
export async function getStaffWorkload(facilityId: number): Promise<StaffWorkloadItem[]> {
  try {
    const res = await apiClient<ApiResponse<any[]>>(`/support-requests/staff-workload?facilityId=${facilityId}`);
    const rawList = res?.data || [];
    return rawList.map((item: any) => {
      const active = Number(item.activeTaskCount || 0);
      let status: 'AVAILABLE' | 'NORMAL' | 'OVERLOADED' = 'AVAILABLE';
      if (active >= 5) {
        status = 'OVERLOADED';
      } else if (active >= 3) {
        status = 'NORMAL';
      }

      return {
        staffId: item.staffId,
        staffName: item.staffName || `Nhân viên #${item.staffId}`,
        staffEmail: item.staffEmail || `staff${item.staffId}@smartstorage.vn`,
        staffPhone: item.staffPhone || 'Chưa cập nhật',
        facilityId: item.facilityId || facilityId,
        facilityName: item.facilityName || 'Kho SmartStorage',
        activeTaskCount: active,
        completedTaskCount: Number(item.completedTaskCount || 0),
        shift: 'Ca sáng (07:00 - 15:30)',
        status,
      };
    });
  } catch (error) {
    console.warn('Lỗi gọi API /support-requests/staff-workload:', error);
    return [];
  }
}

/**
 * 2. Lấy danh sách phiếu yêu cầu hỗ trợ sự cố dành cho Quản lý (SCR-FM-05 / Flow 7)
 * Endpoint Backend: GET /api/v1/management/support-requests
 */
export async function getManagementSupportRequests(params?: {
  facilityId?: number;
  status?: SupportStatus;
  category?: SupportCategory;
  isUrgent?: boolean;
  keyword?: string;
}): Promise<ManagementSupportTicket[]> {
  try {
    const query = new URLSearchParams();
    if (params?.facilityId && params.facilityId > 0) query.set('facilityId', String(params.facilityId));
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    query.set('size', '50');

    const res = await apiClient<ApiResponse<PageResponse<any>>>(
      `/management/support-requests?${query.toString()}`
    );

    const rawList: any[] = res?.data?.content || [];
    let list: ManagementSupportTicket[] = rawList.map((item: any) => ({
      id: item.id,
      code: item.code || `SUP-${item.id}`,
      customerId: item.customerId || 0,
      customerName: item.customerName || `Khách hàng #${item.customerId}`,
      customerPhone: item.customerPhone || 'Chưa cập nhật',
      contractId: item.contractId,
      contractCode: item.contractCode || (item.contractId ? `CTR-${item.contractId}` : undefined),
      storageUnitId: item.storageUnitId,
      storageUnitCode: item.storageUnitCode || `U-${item.storageUnitId || item.id}`,
      facilityId: item.facilityId || params?.facilityId || 1,
      facilityName: item.facilityName || 'Kho SmartStorage',
      category: item.category as SupportCategory,
      categoryDisplayName: item.categoryDisplayName || item.category || 'Sự cố chung',
      description: item.description || '',
      status: item.status as SupportStatus,
      statusDisplayName: item.statusDisplayName || item.status || 'Chờ tiếp nhận',
      isUrgent: Boolean(item.isUrgent),
      assignedStaffId: item.assignedStaffId,
      assignedStaffName: item.assignedStaffName,
      slaDueAt: item.slaDueAt,
      resolvedAt: item.resolvedAt,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt,
      assignmentNotes: item.assignmentNotes,
      resolutionNotes: item.resolutionNotes,
      attachments: item.attachments || [],
      resolutionAttachments: item.resolutionAttachments || [],
    }));

    if (params?.isUrgent !== undefined) {
      list = list.filter((t) => t.isUrgent === params.isUrgent);
    }

    if (params?.keyword?.trim()) {
      const q = params.keyword.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.storageUnitCode.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return list;
  } catch (err) {
    console.warn('Lỗi gọi API /management/support-requests:', err);
    return [];
  }
}

/**
 * 3. Lấy chi tiết một phiếu yêu cầu hỗ trợ (GET /api/v1/management/support-requests/{id})
 */
export async function getSupportRequestDetail(id: number): Promise<ManagementSupportTicket> {
  const res = await apiClient<ApiResponse<any>>(`/management/support-requests/${id}`);
  const item = res.data;
  return {
    id: item.id,
    code: item.code || `SUP-${item.id}`,
    customerId: item.customerId || 0,
    customerName: item.customerName || `Khách hàng #${item.customerId}`,
    customerPhone: item.customerPhone || 'Chưa cập nhật',
    contractId: item.contractId,
    contractCode: item.contractCode || (item.contractId ? `CTR-${item.contractId}` : undefined),
    storageUnitId: item.storageUnitId,
    storageUnitCode: item.storageUnitCode || `U-${item.storageUnitId || item.id}`,
    facilityId: item.facilityId || 1,
    facilityName: item.facilityName || 'Kho SmartStorage',
    category: item.category as SupportCategory,
    categoryDisplayName: item.categoryDisplayName || item.category || 'Sự cố chung',
    description: item.description || '',
    status: item.status as SupportStatus,
    statusDisplayName: item.statusDisplayName || item.status || 'Chờ tiếp nhận',
    isUrgent: Boolean(item.isUrgent),
    assignedStaffId: item.assignedStaffId,
    assignedStaffName: item.assignedStaffName,
    slaDueAt: item.slaDueAt,
    resolvedAt: item.resolvedAt,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt,
    assignmentNotes: item.assignmentNotes,
    resolutionNotes: item.resolutionNotes,
    attachments: item.attachments || [],
    resolutionAttachments: item.resolutionAttachments || [],
  };
}

/**
 * 4. Lấy danh sách nhiệm vụ thực địa cần điều phối trong ngày (SCR-FM-03)
 * Hợp nhất từ 3 nguồn Real API backend:
 * - INCIDENT: Phiếu sự cố kỹ thuật từ support_request
 * - CHECK_IN: Hợp đồng đang chờ bàn giao nhận kho PENDING_CHECK_IN
 * - RETURN: Hợp đồng đang chờ kiểm tra trả kho PENDING_RETURN / INSPECTED
 */
export async function getDailyDispatchTasks(
  facilityId: number,
  _date?: string
): Promise<DailyDispatchTaskItem[]> {
  const tasks: DailyDispatchTaskItem[] = [];

  try {
    const [incidents, pendingCheckIns, returnContracts] = await Promise.all([
      getManagementSupportRequests({ facilityId }),
      getPendingContracts(facilityId).catch(() => []),
      getManagerContracts({ facilityId, status: 'PENDING_RETURN' }).catch(() => []),
    ]);

    // 1. Map các sự cố kỹ thuật (INCIDENT)
    incidents.forEach((ticket) => {
      let dispatchStatus: DailyDispatchTaskItem['status'] = 'UNASSIGNED';
      if (ticket.status === 'ASSIGNED') dispatchStatus = 'ASSIGNED';
      else if (ticket.status === 'IN_PROGRESS') dispatchStatus = 'IN_PROGRESS';
      else if (ticket.status === 'RESOLVED') dispatchStatus = 'RESOLVED';
      else if (ticket.status === 'CLOSED') dispatchStatus = 'COMPLETED';

      tasks.push({
        id: ticket.id,
        taskType: 'INCIDENT',
        title: `[Sự cố] ${ticket.categoryDisplayName} - Ô kho ${ticket.storageUnitCode}`,
        facilityId: ticket.facilityId,
        facilityName: ticket.facilityName,
        unitCode: ticket.storageUnitCode,
        customerName: ticket.customerName,
        customerPhone: ticket.customerPhone,
        scheduledDate: ticket.createdAt ? ticket.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        scheduledTime: ticket.createdAt ? ticket.createdAt.substring(11, 16) : 'Hôm nay',
        slaDeadline: ticket.slaDueAt,
        priority: ticket.isUrgent ? 'URGENT' : 'NORMAL',
        isUrgent: ticket.isUrgent,
        assignedStaffId: ticket.assignedStaffId,
        assignedStaffName: ticket.assignedStaffName,
        status: dispatchStatus,
        notes: ticket.description,
        referenceId: ticket.id,
        referenceCode: ticket.code,
      });
    });

    // 2. Map các hợp đồng chờ tiếp đón nhận kho (CHECK_IN)
    if (Array.isArray(pendingCheckIns)) {
      pendingCheckIns.forEach((contract: any) => {
        let dispatchStatus: DailyDispatchTaskItem['status'] = 'UNASSIGNED';
        if (contract.assignedStaffId) {
          dispatchStatus = 'ASSIGNED';
        }

        tasks.push({
          id: 100000 + contract.id,
          taskType: 'CHECK_IN',
          title: `Tiếp đón bàn giao kho cho hợp đồng ${contract.code}`,
          facilityId: contract.facilityId || facilityId,
          facilityName: contract.facilityName || 'Kho SmartStorage',
          unitCode: contract.storageUnitCode || `U-${contract.storageUnitId || contract.id}`,
          customerName: contract.customerName || 'Khách hàng',
          customerPhone: contract.customerPhone || 'Chưa cập nhật',
          scheduledDate: contract.startDate || new Date().toISOString().split('T')[0],
          scheduledTime: '09:00 - 11:30',
          priority: 'NORMAL',
          isUrgent: false,
          status: dispatchStatus,
          assignedStaffId: contract.assignedStaffId,
          assignedStaffName: contract.assignedStaffName,
          referenceId: contract.id,
          referenceCode: contract.code,
          notes: 'Khách hàng đã đặt cọc VietQR thành công, sẵn sàng nhận kho.',
        });
      });
    }

    // 3. Map các hợp đồng chờ kiểm tra trả kho (RETURN)
    if (Array.isArray(returnContracts)) {
      returnContracts.forEach((contract: any) => {
        let dispatchStatus: DailyDispatchTaskItem['status'] = 'UNASSIGNED';
        if (contract.status === 'INSPECTED') {
          dispatchStatus = 'COMPLETED';
        } else if (contract.assignedStaffId) {
          dispatchStatus = 'ASSIGNED';
        }

        tasks.push({
          id: 200000 + contract.id,
          taskType: 'RETURN',
          title: `Nghiệm thu trả kho & hoàn cọc hợp đồng ${contract.code}`,
          facilityId: contract.facilityId || facilityId,
          facilityName: contract.facilityName || 'Kho SmartStorage',
          unitCode: contract.storageUnitCode || `U-${contract.storageUnitId || contract.id}`,
          customerName: contract.customerName || 'Khách hàng',
          customerPhone: contract.customerPhone || 'Chưa cập nhật',
          scheduledDate: contract.endDateExclusive || new Date().toISOString().split('T')[0],
          scheduledTime: '14:00 - 16:30',
          priority: 'NORMAL',
          isUrgent: false,
          status: dispatchStatus,
          assignedStaffId: contract.assignedStaffId,
          assignedStaffName: contract.assignedStaffName,
          referenceId: contract.id,
          referenceCode: contract.code,
          notes: 'Khách hàng đã dọn sạch ô kho và gửi yêu cầu nghiệm thu.',
        });
      });
    }

    // Áp dụng các cấu hình priority và ghi chú do Quản lý cơ sở phân công
    const overrides = getTaskOverrides();
    tasks.forEach((t) => {
      const ov = overrides[String(t.id)];
      if (ov) {
        if (ov.priority) {
          t.priority = ov.priority;
          t.isUrgent = ov.priority === 'URGENT';
        }
        if (ov.notes !== undefined && ov.notes !== '') {
          t.notes = ov.notes;
        }
        if (ov.staffId !== undefined) {
          t.assignedStaffId = ov.staffId;
        }
        if (ov.staffName !== undefined && ov.staffName !== '') {
          t.assignedStaffName = ov.staffName;
        }
        if (t.assignedStaffId) {
          t.status = 'ASSIGNED';
        }
      }
    });
  } catch (err) {
    console.warn('Lỗi tổng hợp bảng điều phối nhiệm vụ thực địa:', err);
  }

  return tasks;
}

/**
 * 5. Phân công hoặc điều chuyển nhân viên cho một nhiệm vụ thực địa (US-FM-05.1 AC-1, AC-2, AC-4)
 * - Nếu là Incident task -> gọi Real API: PATCH /api/v1/support-requests/{id}/assign
 * - Nếu là Return task -> gọi Real API: PATCH /api/v1/contracts/{id}/assign-return
 */
export async function assignStaffToTask(
  payload: AssignTaskPayload
): Promise<{ success: boolean; message: string; updatedTask: Partial<DailyDispatchTaskItem> }> {
  let backendMsg = 'Phân công nhân viên thực hiện nhiệm vụ thành công';
  let assignedStaffName = '';

  try {
    const contractId =
      payload.taskType === 'CHECK_IN'
        ? payload.taskId > 100000
          ? payload.taskId - 100000
          : payload.taskId
        : payload.taskType === 'RETURN'
        ? payload.taskId > 200000
          ? payload.taskId - 200000
          : payload.taskId
        : undefined;

    const res = await apiClient<ApiResponse<any>>('/staff-assignments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: payload.taskId,
        contractId,
        staffId: payload.staffId,
        taskType: payload.taskType,
        priority: payload.priority,
        notes: payload.notes,
      }),
    });

    if (res?.data?.staffName) {
      assignedStaffName = res.data.staffName;
    }
    if (res?.message) {
      backendMsg = res.message;
    }

    // Luôn đồng bộ vào Contract Service chuyên trách
    if (contractId) {
      if (payload.taskType === 'CHECK_IN') {
        try {
          await assignCheckInStaff(contractId, payload.staffId, payload.notes);
        } catch (subErr) {
          console.warn(`Lỗi đồng bộ assignCheckInStaff #${contractId}:`, subErr);
        }
      } else if (payload.taskType === 'RETURN') {
        try {
          await assignReturnStaff(contractId, payload.staffId, payload.notes);
        } catch (subErr) {
          console.warn(`Lỗi đồng bộ assignReturnStaff #${contractId}:`, subErr);
        }
      }
    }
  } catch (err) {
    console.warn('Lỗi gọi /staff-assignments, fallback endpoint tương thích:', err);
    if (payload.taskType === 'INCIDENT') {
      await apiClient(`/support-requests/${payload.taskId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({
          staffId: payload.staffId,
          note: payload.notes || 'Phân công từ bàn điều phối cơ sở',
        }),
      });
    } else if (payload.taskType === 'RETURN') {
      const contractId = payload.taskId > 200000 ? payload.taskId - 200000 : payload.taskId;
      try {
        await assignReturnStaff(contractId, payload.staffId, payload.notes);
      } catch (subErr) {
        console.warn(`Lỗi gọi API phân công trả kho contract #${contractId}:`, subErr);
      }
    } else if (payload.taskType === 'CHECK_IN') {
      const contractId = payload.taskId > 100000 ? payload.taskId - 100000 : payload.taskId;
      try {
        await assignCheckInStaff(contractId, payload.staffId, payload.notes);
      } catch (checkInErr) {
        console.warn(`Lỗi gọi API phân công check-in contract #${contractId}:`, checkInErr);
      }
    }
  }

  // Lưu vết override để đảm bảo UI duy trì chính xác priority và notes sau khi refetch
  saveTaskOverride(payload.taskId, {
    priority: payload.priority,
    isUrgent: payload.priority === 'URGENT',
    notes: payload.notes,
    staffId: payload.staffId,
    staffName: assignedStaffName,
  });

  return {
    success: true,
    message: backendMsg,
    updatedTask: {
      id: payload.taskId,
      assignedStaffId: payload.staffId,
      assignedStaffName: assignedStaffName || undefined,
      priority: payload.priority,
      isUrgent: payload.priority === 'URGENT',
      status: 'ASSIGNED',
      notes: payload.notes,
    },
  };
}

/**
 * 6. Phân công trực tiếp từ màn hình Incidents Hub (PATCH /api/v1/support-requests/{id}/assign)
 */
export async function assignSupportStaffDirect(
  ticketId: number,
  staffId: number,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  await apiClient(`/support-requests/${ticketId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({
      staffId,
      note: notes || 'Phân công từ màn hình Xử lý sự cố',
    }),
  });

  return {
    success: true,
    message: 'Đã phân công nhân viên xử lý sự cố thành công',
  };
}

/**
 * 7. Bắt đầu xử lý sự cố tại hiện trường (PATCH /api/v1/support-requests/{id}/in-progress)
 */
export async function startIncidentInProgress(
  ticketId: number
): Promise<{ success: boolean; message: string }> {
  await apiClient(`/support-requests/${ticketId}/in-progress`, {
    method: 'PATCH',
  });

  return {
    success: true,
    message: 'Đã cập nhật trạng thái: Đang xử lý tại hiện trường',
  };
}

/**
 * 8. Hoàn thành xử lý sự cố kỹ thuật (PATCH /api/v1/support-requests/{id}/resolve)
 */
export async function resolveSupportTicket(
  ticketId: number,
  payload: ResolveSupportRequestDto | { resolutionNote: string; resolutionAttachmentUrls?: string[] }
): Promise<{ success: boolean; message: string }> {
  const note =
    (payload as any).resolutionNote ||
    (payload as ResolveSupportRequestDto).resolutionNotes ||
    'Đã xử lý xong sự cố';
  const urls =
    (payload as any).resolutionAttachmentUrls ||
    (payload as ResolveSupportRequestDto).resolutionImageUrls ||
    [];

  await apiClient(`/support-requests/${ticketId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({
      resolutionNote: note,
      resolutionAttachmentUrls: urls,
    }),
  });

  return {
    success: true,
    message: 'Đã hoàn thành và giải quyết sự cố kỹ thuật',
  };
}

/**
 * 9. Xem toàn bộ ca trực và danh mục việc trong ngày của 1 nhân viên (FS-06 / FM-05)
 * Endpoint: GET /api/v1/reports/staff/{staffId}/daily-tasks
 */
export async function getStaffDailySchedule(
  staffId: number,
  date?: string
): Promise<StaffDailyTaskReport> {
  return getStaffDailyTasks(staffId, date);
}

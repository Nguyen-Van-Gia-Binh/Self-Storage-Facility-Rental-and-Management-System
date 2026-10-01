/**
 * Types dành riêng cho Facility Manager:
 * Phân công nhân sự & Điều phối ca trực (SCR-FM-03 / FM-05)
 * Bàn điều phối sự cố kỹ thuật (SCR-FM-05 / Flow 7 / UC-F7-03, UC-F7-04)
 */

export type WorkloadLoadLevel = 'AVAILABLE' | 'NORMAL' | 'OVERLOADED' | 'ON_LEAVE';

export interface StaffWorkloadItem {
  staffId: number;
  staffName: string;
  staffEmail: string;
  staffPhone: string;
  facilityId: number;
  facilityName: string;
  activeTaskCount: number;
  completedTaskCount: number;
  pendingUrgentCount?: number;
  shift?: string;
  status: WorkloadLoadLevel;
  avatarUrl?: string;
}

export type DispatchTaskType = 'CHECK_IN' | 'RETURN' | 'INCIDENT' | 'OVERLOCK';

export type DispatchTaskPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export type DispatchTaskStatus = 
  | 'UNASSIGNED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'COMPLETED';

export interface DailyDispatchTaskItem {
  id: number;
  taskType: DispatchTaskType;
  title: string;
  facilityId: number;
  facilityName: string;
  unitCode: string;
  customerName: string;
  customerPhone: string;
  scheduledDate: string;
  scheduledTime: string;
  slaDeadline?: string;
  priority: DispatchTaskPriority;
  isUrgent: boolean;
  assignedStaffId?: number;
  assignedStaffName?: string;
  status: DispatchTaskStatus;
  notes?: string;
  referenceId?: number;
  referenceCode?: string;
}

export interface AssignTaskPayload {
  taskId: number;
  taskType: DispatchTaskType;
  staffId: number;
  priority: DispatchTaskPriority;
  notes?: string;
}

export type SupportCategory = 
  | 'ACCESS_ISSUE'       // Kẹt cửa, hỏng khóa số, mất mã PIN
  | 'FACILITY_DAMAGE'    // Hư hỏng vách ngăn, trần, sàn
  | 'FACILITY_LEAK'      // Thấm dột, ẩm mốc, điều hòa
  | 'CLEANLINESS'        // Vệ sinh, rác, côn trùng
  | 'PAYMENT_BILLING'    // Thắc mắc thanh toán, phụ phí
  | 'OTHER';             // Yêu cầu hỗ trợ khác

export type SupportStatus = 
  | 'OPEN'               // Chờ tiếp nhận
  | 'ASSIGNED'           // Đã phân công nhân viên
  | 'IN_PROGRESS'        // Nhân viên đang xử lý tại chỗ
  | 'RESOLVED'           // Đã hoàn thành xử lý
  | 'CLOSED'             // Đã nghiệm thu & đóng
  | 'CANCELLED';         // Khách hủy

export interface IncidentAttachment {
  id: number;
  fileUrl: string;
  fileName: string;
  fileType?: string;
  uploadedAt?: string;
}

export interface ManagementSupportTicket {
  id: number;
  code: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  contractId?: number;
  contractCode?: string;
  storageUnitId?: number;
  storageUnitCode: string;
  facilityId: number;
  facilityName: string;
  category: SupportCategory;
  categoryDisplayName: string;
  description: string;
  status: SupportStatus;
  statusDisplayName: string;
  isUrgent: boolean;
  assignedStaffId?: number;
  assignedStaffName?: string;
  slaDueAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
  assignmentNotes?: string;
  resolutionNotes?: string;
  attachments?: IncidentAttachment[];
  resolutionAttachments?: IncidentAttachment[];
}

export interface AssignStaffRequestDto {
  staffId: number;
  note?: string;
}

export interface ResolveSupportRequestDto {
  resolutionNotes: string;
  resolutionImageUrls?: string[];
}

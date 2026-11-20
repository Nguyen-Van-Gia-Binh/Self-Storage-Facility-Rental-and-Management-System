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
  checkinGraceDays?: number;
}

export interface AssignTaskPayload {
  taskId: number;
  taskType: DispatchTaskType;
  staffId: number;
  priority: DispatchTaskPriority;
  notes?: string;
}

export type SupportCategory = 
  | 'LOCK_ACCESS'        // Sự cố khóa, mã PIN ra vào (Database / Backend chuẩn)
  | 'UNIT_DAMAGE'        // Hư hại ô kho, cửa, sàn, trần
  | 'PAYMENT'            // Vấn đề thanh toán, tiền cọc
  | 'BELONGINGS'         // Tài sản lưu trữ, mượn xe nâng
  | 'OTHER'              // Yêu cầu hỗ trợ khác
  // Các alias tương thích ngược dữ liệu cũ:
  | 'ACCESS_ISSUE'       // Alias LOCK_ACCESS
  | 'LOST_KEY'           // Alias LOCK_ACCESS
  | 'FACILITY_DAMAGE'    // Alias UNIT_DAMAGE
  | 'FACILITY_LEAK'      // Alias UNIT_DAMAGE
  | 'POWER_ISSUE'        // Alias UNIT_DAMAGE
  | 'CLEANLINESS'        // Alias OTHER / UNIT_DAMAGE
  | 'PAYMENT_BILLING';   // Alias PAYMENT

export type SupportStatus = 
  | 'NEW'                // Mới gửi (SupportStatus.java)
  | 'OPEN'               // Chờ tiếp nhận (alias UI)
  | 'ASSIGNED'           // Đã phân công nhân viên
  | 'IN_PROGRESS'        // Nhân viên đang xử lý tại chỗ
  | 'RESOLVED'           // Đã hoàn thành xử lý
  | 'CLOSED'             // Đã nghiệm thu & đóng
  | 'AUTO_CLOSED'        // Tự động đóng
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
  contractId?: number;
  contractCode?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractStatus?: string;
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
  assignedStaffPhone?: string;
  slaDueAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
  assignmentNotes?: string;
  resolutionNotes?: string;
  relocationRequired?: boolean;
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

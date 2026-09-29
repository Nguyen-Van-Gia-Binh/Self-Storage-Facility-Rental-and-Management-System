/**
 * WS1: Customer & Reservation Domain Types
 * Định nghĩa các kiểu dữ liệu cho luồng Khách hàng & Đặt chỗ
 * Bám sát Storage_Self.sql, BUSINESS-RULES.md và UI-DESIGN-SYSTEM.md
 */

// 6 trạng thái vòng đời ô kho theo UI-DESIGN-SYSTEM.md § 2.2
export type UnitStatus = 
  | 'AVAILABLE' 
  | 'RESERVED' 
  | 'OCCUPIED' 
  | 'MAINTENANCE' 
  | 'OVERDUE' 
  | 'LOCKED';

// Phân nhóm kích thước kho theo wireframe SCR-SC-01B
export type UnitSizeCategory = 'S' | 'M' | 'L' | 'XL';

// Chế độ kho: Tiêu chuẩn hoặc Máy lạnh
export type StorageType = 'STANDARD' | 'CLIMATE_CONTROLLED';

// Cơ sở lưu trữ (Facility - BM-01)
export interface Facility {
  id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  city: string;
  distance: string;
  startingPrice: number;
  image: string;
  phone: string;
}

// Loại ô kho (Unit Type - FM-01)
export interface UnitType {
  id: string;
  code: string;
  name: string;
  sizeCategory: UnitSizeCategory;
  storageType: StorageType;
  areaM2: number;
  volumeM3: number;
  dimensions: string;
  capacityDescription: string;
  baseMonthlyPrice: number;
  badge?: 'POPULAR' | 'SPACIOUS' | 'COMMERCIAL' | 'COMPACT';
}

// Ngăn ô kho thực tế trên mặt bằng (Storage Unit - FM-01, SC-01)
export interface StorageUnit {
  id: string;
  unitNumber: string; // Vd: A101, B205
  facilityId: string;
  unitTypeId: string;
  floor: number;
  zone: string; // Vd: Zone A, Zone B
  status: UnitStatus;
  sizeCategory?: UnitSizeCategory;
  storageType?: StorageType;
  areaM2?: number;
  monthlyPrice?: number;
  locationNote?: string; // Vị trí thực tế chi tiết (vd: Cạnh thang máy, Gần cửa chính)
}

// Dữ liệu tạo đơn đặt chỗ (Booking Draft - SC-02, BR-DEP-01, BR-DEP-03)
export interface BookingDraft {
  facilityId: string;
  facilityName: string;
  unitId: string;
  unitNumber: string;
  unitTypeId: string;
  unitTypeName: string;
  storageType: StorageType;
  areaM2: number;
  monthlyRent: number;
  durationMonths: number; // 1, 3, 6, 12
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  depositAmount: number; // Cọc 1 tháng (BR-DEP-01)
  totalUpfront: number; // Tiền thuê N tháng + Cọc (BR-GEN-03, BR-GEN-04)
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerIdentityNumber: string; // CCCD phục vụ bàn giao (BR-CHK-01)
  holdExpiresAt?: string; // Giữ chỗ trong 48h (BR-DEP-03)
}

// Hợp đồng thuê kho đang chạy của khách (My Rentals - SC-05, SCR-SC-04)
export interface RentedContract {
  id: string;
  contractNumber: string;
  facilityId: string;
  facilityName: string;
  unitId: string;
  unitNumber: string;
  unitTypeName: string;
  sizeCategory: UnitSizeCategory;
  storageType: StorageType;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositHeld: number;
  accessPin?: string; // Mã PIN mở cửa (chỉ cấp khi ACTIVE theo BR-ACC-01)
  status: 'ACTIVE' | 'PENDING_CHECKIN' | 'EXPIRING_SOON' | 'OVERDUE' | 'PENDING_RETURN' | 'CLOSED' | 'TERMINATED';
  overdueDays?: number;
  overdueFee?: number;
  scheduledReturnDate?: string;
  inspectionDone?: boolean;
  hasPendingRenewal?: boolean;
  pendingRenewalOrderCode?: number;
  pendingRenewalMonths?: number;
  pendingRenewalAmount?: number;
  pendingRenewalExpiresAt?: string;
}

// Nhật ký truy cập ra vào kho (US-SC-05.2, BR-ACC-02)
export interface AccessLogEntry {
  id: string;
  contractId: string;
  unitNumber: string;
  timestamp: string;
  method: 'PIN_CODE' | 'QR_PASS' | 'STAFF_OVERRIDE';
  accessorName: string;
  status: 'SUCCESS' | 'FAILED';
  deviceInfo?: string;
}

// Yêu cầu đổi mã PIN khóa điện tử (BR-ACC-01)
export interface ChangePinRequest {
  contractId: string;
  oldPin?: string;
  newPin: string;
}

// Đăng ký lịch hẹn trả kho (US-SC-05.4, BR-RET-06, BR-RET-10)
export interface ScheduleReturnRequest {
  contractId: string;
  returnDate: string;
  notes?: string;
}

export interface ScheduleReturnResponse {
  contractId: string;
  scheduledReturnDate: string;
  status: 'PENDING_RETURN';
  estimatedDepositRefund: number;
  message: string;
}

// 5 Danh mục sự cố theo SupportCategory.java và TOPIC.md § 5 (Flow 7)
export type SupportCategory = 
  | 'LOCK_ACCESS' 
  | 'UNIT_DAMAGE' 
  | 'PAYMENT' 
  | 'BELONGINGS' 
  | 'OTHER';

// 6 Trạng thái vé hỗ trợ theo SupportStatus.java và BR-SUP-01..03
export type SupportStatus = 
  | 'NEW' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'CLOSED' 
  | 'AUTO_CLOSED';

// Tệp đính kèm ảnh sự cố / biên bản kiểm tra
export interface SupportAttachment {
  id: number;
  fileUrl: string;
  fileType?: string;
  uploadedAt?: string;
}

// Thông tin vé hỗ trợ chi tiết (SC-06, SCR-SC-06, UC-F7-01, UC-F7-02, UC-F7-08)
export interface SupportTicket {
  id: number;
  ticketCode: string;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  contractId?: number;
  contractNumber?: string;
  facilityId: number;
  facilityName: string;
  storageUnitId?: number;
  unitNumber?: string;
  category: SupportCategory;
  title?: string;
  isUrgent: boolean;
  slaHours: number;
  description: string;
  status: SupportStatus;
  assignedStaffId?: number;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  autoCloseDeadline?: string;
  createdAt: string;
  updatedAt?: string;
  attachments: SupportAttachment[];
  resolutionAttachments?: SupportAttachment[];
}

// Payload tạo yêu cầu hỗ trợ mới (US-SC-06.1)
export interface CreateSupportTicketPayload {
  contractId?: number;
  facilityId: number;
  storageUnitId?: number;
  title?: string;
  category: SupportCategory;
  isUrgent: boolean;
  description: string;
  attachmentUrls?: string[];
}

// Yêu cầu gia hạn hợp đồng trực tuyến (US-SC-05.3, BR-REN-01..08)
export interface RenewContractRequest {
  contractId: string;
  months: number;
  newEndDate: string;
  totalAmount: number;
  paymentMethod?: 'VIETQR' | 'BANK_TRANSFER' | 'CARD';
  transactionReference?: string;
}

export interface RenewContractResponse {
  success: boolean;
  contract: RentedContract;
  receiptNumber: string;
  renewedAt: string;
  message: string;
}

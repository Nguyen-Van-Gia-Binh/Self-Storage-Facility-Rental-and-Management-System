# Hướng Dẫn Kỹ Thuật Phase 2 — Workstream 4: Quản Trị, Hỗ Trợ Sự Cố & Báo Cáo (Admin, Support & Reports)

> **Người thực hiện:** Lê Thanh Tùng (WS4)  
> **Ranh giới Bounded Context:** `com.swp391.selfstorage.auth` · `user` · `support` · `report` · `frontend/src/features/admin/` · `frontend/src/features/manager/` (phần Report & Support) · `SupportPage.tsx`  
> **Tài liệu tham chiếu:** [PLAN.md](../PLAN.md) · [API-SPEC.md](../API-SPEC.md) · [INTEGRATION-DESIGN.md](INTEGRATION-DESIGN.md)

---

## 1. Mục Tiêu & Nhánh Làm Việc

### 1.1. Mục tiêu công việc
Kích hoạt toàn bộ luồng xử lý ticket sự cố khách hàng, phân công công việc điều phối của Facility Manager (FM), nhật ký kiểm toán và báo cáo quản trị:
1. **Khách hàng gửi & theo dõi sự cố (`SC-06`):**
   - Loại bỏ mảng biến nhớ tạm `cachedTickets` trong `frontend/src/features/customer/pages/SupportPage.tsx`.
   - Kết nối `POST /support-requests` và `GET /support-requests` qua JWT.
2. **Phân công & Xử lý sự cố cho FM và Staff (`FM-05`, `FS-05`):**
   - Xem tải công việc nhân viên: `GET /support-requests/staff-workload?facilityId={id}`.
   - Quản lý phân công nhân viên: `PATCH /support-requests/{id}/assign`.
   - Nhân viên tiếp nhận và hoàn thành: `PATCH /support-requests/{id}/in-progress` và `PATCH /support-requests/{id}/resolve`.
   - Xem danh sách sự cố quản lý: `GET /management/support-requests`.
3. **Báo cáo cấp Cơ sở cho FM (`FM-06`):**
   - Nối API `GET /reports/facility/{facilityId}/overview` và `GET /reports/facility/{facilityId}/overdue-debt`.
4. **Quản trị Người dùng & Nhật ký Hệ thống (`SA-01..04`):**
   - Tắt cờ Mock, kết nối `GET /users`, `GET /audit/activities` và `GET /audit/logins`.

### 1.2. Quy trình Git chuẩn (BẮT BUỘC)
```powershell
# 1. Kéo main mới nhất và tạo nhánh tính năng
git checkout main
git fetch origin main
git pull origin main
git checkout -b feature/ws4-connect-admin-support-api

# 2. Bật cờ kết nối Backend thật cho WS4 trong frontend/.env:
# VITE_USE_MOCK=false
# VITE_MOCK_WS4=false
```

---

## 2. Ranh Giới Mã Nguồn (Zero-Conflict Boundary)

| Phân loại | Danh sách tệp / Thư mục |
| :--- | :--- |
| **Được phép chỉnh sửa (Sở hữu bởi WS4)** | • `frontend/src/features/customer/pages/SupportPage.tsx`<br>• `frontend/src/features/manager/api/staffAssignmentApi.ts`<br>• `frontend/src/features/manager/api/facilityReportApi.ts`<br>• `frontend/src/features/manager/pages/StaffAssignmentPage.tsx`<br>• `frontend/src/features/manager/pages/FacilityReportPage.tsx`<br>• `frontend/src/features/admin/api/auditApi.ts`<br>• `frontend/src/features/admin/api/user.ts`<br>• `frontend/src/features/admin/pages/`<br>• Backend: `com.swp391.selfstorage.auth.*`, `user.*`, `support.*`, `report.*` |
| **TUYỆT ĐỐI CẤM SỬA (Thuộc Workstream khác)** | ❌ `frontend/src/api/client.ts` (Phase 1 đã cố định)<br>❌ `com.swp391.selfstorage.reservation.*` (WS1)<br>❌ `com.swp391.selfstorage.facility.*`, `unit.*`, `contract.*` (WS2)<br>❌ `com.swp391.selfstorage.payment.*`, `policy.*` (WS3) |

---

## 3. Bảng Đối Chiếu Hợp Đồng API (Reconciliation Matrix)

| Chức năng | Frontend cũ / Điểm lệch | Backend Thực tế (Chuẩn) | Headers & Body | Response Cấu trúc | Ghi chú xử lý |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Khách tạo yêu cầu hỗ trợ** | Lưu mảng tĩnh `cachedTickets` | `POST /support-requests` | Body: `CreateSupportRequest { facilityId, rentalContractId?, category, title, description, attachedImageUrls }` | `ApiResponse<SupportRequestDetailResponse>` (201) | Bắt buộc gửi JWT |
| **Khách xem danh sách ticket của mình** | Lấy từ `cachedTickets` | `GET /support-requests` | Query: `status`, `category`, `page`, `size` | `ApiResponse<PageResponse<SupportRequestSummaryResponse>>` | Bóc `res.data.content` |
| **Xem khối lượng công việc nhân viên (Workload)** | Mock tĩnh | `GET /support-requests/staff-workload` | Query: `facilityId` | `ApiResponse<List<StaffWorkloadResponse>>` | Trả về số ticket đang xử lý của từng Staff |
| **FM phân công nhân viên** | Mock tĩnh | `PATCH /support-requests/{id}/assign` | Body: `AssignStaffRequest { staffId, notes }` | `ApiResponse<SupportRequestDetailResponse>` | Quyền `FACILITY_MANAGER`, `ADMIN` |
| **Staff bắt đầu xử lý sự cố** | Mock tĩnh | `PATCH /support-requests/{id}/in-progress` | Path param `id` | `ApiResponse<SupportRequestDetailResponse>` | Chuyển trạng thái sang `IN_PROGRESS` |
| **Staff giải quyết xong sự cố** | Mock tĩnh | `PATCH /support-requests/{id}/resolve` | Body: `ResolveSupportRequest { resolutionNotes, evidenceImageUrls }` | `ApiResponse<SupportRequestDetailResponse>` | Chuyển trạng thái sang `RESOLVED` |
| **Danh sách sự cố cấp Quản lý** | Bị chặn cờ mock | `GET /management/support-requests` | Query: `facilityId`, `status`, `assignedStaffId`, `page`, `size` | `ApiResponse<PageResponse<SupportRequestSummaryResponse>>` | Bóc `res.data.content` |
| **Báo cáo tổng quan cơ sở** | Mock tĩnh | `GET /reports/facility/{facilityId}/overview` | Query: `month=YYYY-MM` (tùy chọn) | `ApiResponse<FacilityOverviewReportResponse>` | Trả về tỷ lệ lấp đầy, số kho trống, doanh thu |
| **Báo cáo nợ quá hạn cơ sở** | Mock tĩnh | `GET /reports/facility/{facilityId}/overdue-debt` | Path param `facilityId` | `ApiResponse<OverdueDebtReportResponse>` | Chi tiết các hợp đồng quá hạn nợ |
| **Nhật ký thao tác & Đăng nhập Admin** | Mock tĩnh | `GET /audit/activities`<br>`GET /audit/logins` | Query: `page`, `size`, `sort` | `PageResponse<AuditLogResponse>`<br>`PageResponse<LoginHistoryResponse>` | Quyền `SYSTEM_ADMINISTRATOR` |

---

## 4. Hướng Dẫn Sửa Mã Nguồn Chi Tiết

### 4.1. Chuẩn hóa Khách hàng gửi Ticket (`frontend/src/features/customer/pages/SupportPage.tsx`)
Xóa bỏ hoàn toàn mảng `cachedTickets` in-memory. Sử dụng `apiClient` từ `@/api/client`:

```typescript
import { apiClient, ApiResponse, PageResponse } from '@/api/client';

export interface CreateSupportTicketPayload {
  facilityId: number;
  rentalContractId?: number;
  category: 'FACILITY_ISSUE' | 'ACCESS_CONTROL' | 'PAYMENT_BILLING' | 'ACCOUNT' | 'OTHER';
  title: string;
  description: string;
  attachedImageUrls?: string;
}

// 1. Tạo ticket mới
export async function createSupportTicket(payload: CreateSupportTicketPayload) {
  const res = await apiClient<ApiResponse<any>>('/support-requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return res.data;
}

// 2. Tải danh sách ticket của tôi
export async function getMySupportTickets(page = 0, size = 10) {
  const res = await apiClient<ApiResponse<PageResponse<any>>>(`/support-requests?page=${page}&size=${size}`);
  return res.data.content;
}
```

### 4.2. Chuẩn hóa API Phân công Công việc (`frontend/src/features/manager/api/staffAssignmentApi.ts`)
```typescript
import { apiClient, ApiResponse, PageResponse, isMockEnabled } from '@/api/client';

export interface StaffWorkloadItem {
  staffId: number;
  fullName: string;
  activeTicketCount: number;
  pendingTaskCount: number;
}

export interface AssignStaffPayload {
  staffId: number;
  notes?: string;
}

// 1. Xem tải công việc nhân viên
export async function getStaffWorkload(facilityId: number): Promise<StaffWorkloadItem[]> {
  if (isMockEnabled('WS4')) return mockStaffWorkload;
  const res = await apiClient<ApiResponse<StaffWorkloadItem[]>>(`/support-requests/staff-workload?facilityId=${facilityId}`);
  return res.data;
}

// 2. Phân công ticket
export async function assignStaffToTicket(ticketId: number, payload: AssignStaffPayload) {
  const res = await apiClient<ApiResponse<any>>(`/support-requests/${ticketId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return res.data;
}

// 3. Nhân viên hoàn thành giải quyết ticket
export async function resolveSupportTicket(ticketId: number, resolutionNotes: string, evidenceImageUrls?: string) {
  const res = await apiClient<ApiResponse<any>>(`/support-requests/${ticketId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ resolutionNotes, evidenceImageUrls })
  });
  return res.data;
}
```

### 4.3. Chuẩn hóa API Báo cáo Cơ sở (`frontend/src/features/manager/api/facilityReportApi.ts`)
```typescript
import { apiClient, ApiResponse, isMockEnabled } from '@/api/client';

export interface FacilityOverviewReport {
  facilityId: number;
  facilityName: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  totalMonthlyRevenue: number;
}

export async function getFacilityOverviewReport(facilityId: number, month?: string): Promise<FacilityOverviewReport> {
  if (isMockEnabled('WS4')) return mockFacilityOverview;
  const query = month ? `?month=${month}` : '';
  const res = await apiClient<ApiResponse<FacilityOverviewReport>>(`/reports/facility/${facilityId}/overview${query}`);
  return res.data;
}
```

---

## 5. Câu Lệnh Prompt Dành Cho Trợ Lý AI (AI Instructions Prompt)

> **Hướng dẫn thành viên:** Copy toàn bộ đoạn prompt trong khung dưới đây và dán vào cửa sổ chat với AI Assistant (Antigravity/Gemini/Claude) để yêu cầu AI lập kế hoạch và code bằng lệnh `/writing-plans`:

```text
Xin chào AI, tôi là Lê Thanh Tùng, phụ trách Workstream 4 (WS4: Quản trị, Support sự cố & Báo cáo) trong dự án SWP391.
Hãy đọc kỹ tài liệu hướng dẫn của tôi tại: docs/guides/WS4-GUIDE-ADMIN-SUPPORT-REPORT.md
Và kiến trúc tích hợp tại: docs/guides/INTEGRATION-DESIGN.md

YÊU CẦU:
1. Hãy sử dụng kỹ năng /writing-plans để lập một Kế hoạch Triển khai (Implementation Plan) chi tiết từng bước cho Phase 2 của Workstream 4.
2. Mục tiêu chính:
   - Trong SupportPage.tsx: Xóa bỏ hoàn toàn biến mảng cachedTickets, gọi POST /support-requests khi tạo ticket và GET /support-requests khi xem danh sách ticket.
   - Trong staffAssignmentApi.ts: Nối API lấy tải công việc GET /support-requests/staff-workload?facilityId={id}, nối API phân công PATCH /support-requests/{id}/assign và xử lý ticket PATCH /support-requests/{id}/resolve.
   - Trong facilityReportApi.ts: Nối API báo cáo GET /reports/facility/{facilityId}/overview và GET /reports/facility/{facilityId}/overdue-debt.
   - Tắt cờ mock trong auditApi.ts và user.ts: Đảm bảo các trang Quản trị Admin tải dữ liệu thật từ GET /audit/activities, GET /audit/logins và GET /users.
3. Ranh giới tuyệt đối: CHỈ chỉnh sửa các file thuộc WS4 (SupportPage.tsx, staffAssignmentApi.ts, facilityReportApi.ts, auditApi.ts, user.ts, các trang admin/manager tương ứng và backend com.swp391.selfstorage.auth/user/support/report). Tuyệt đối KHÔNG sửa code của WS1, WS2, WS3 hoặc client.ts.
4. Bật cờ VITE_MOCK_WS4=false trong frontend/.env để kiểm thử thực tế.
5. Tạo nhánh Git chuẩn: feature/ws4-connect-admin-support-api rẽ từ main mới nhất.
6. Tuân thủ TDD & kiểm thử: mvn clean test pass 100%, npm run build không lỗi.

Hãy trình bày Plan chi tiết với các checkbox [ ] để tôi duyệt trước khi bắt đầu code!
```

---

## 6. Tiêu Chí Nghiệm Thu (Definition of Done - DoD)

- [ ] Nhánh Git `feature/ws4-connect-admin-support-api` rẽ sạch sẽ từ `main` mới nhất.
- [ ] Bật `VITE_USE_MOCK=false` và `VITE_MOCK_WS4=false` trong `frontend/.env`.
- [ ] Vào trang Hỗ trợ (Customer): Gửi thử một ticket sự cố mới -> lưu thành công vào database và hiển thị trong danh sách ticket.
- [ ] Đăng nhập tài khoản FM: Mở trang Phân công nhân viên, hiển thị danh sách Staff kèm số lượng ticket đang gán (Workload) tải từ API Backend.
- [ ] Thực hiện phân công ticket cho Staff: Trạng thái ticket cập nhật thành công.
- [ ] Đăng nhập tài khoản Staff: Bấm nhận việc và hoàn thành ticket kèm ghi chú và ảnh chứng cứ.
- [ ] Vào trang Báo cáo Cơ sở của FM: Hiển thị đúng biểu đồ và số liệu tỷ lệ lấp đầy từ Backend.
- [ ] Vào trang Quản trị Admin: Hiển thị đúng danh sách User và nhật ký đăng nhập/hoạt động hệ thống từ `GET /audit/*`.
- [ ] `mvn clean test` pass 100%.
- [ ] `npm run build` thành công 100%.
- [ ] Rebase `origin/main`, push nhánh và tạo Pull Request.

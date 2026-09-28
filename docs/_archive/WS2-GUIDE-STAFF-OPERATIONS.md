# Hướng Dẫn Kỹ Thuật Phase 2 — Workstream 2: Cơ Sở, Kho & Vận Hành (Facilities, Units & Operations)

> **Người thực hiện:** Nguyễn Văn Gia Bình (WS2)  
> **Ranh giới Bounded Context:** `com.swp391.selfstorage.facility` · `unit` · `contract` · `frontend/src/features/staff/` · Các trang quản lý ô kho & cơ sở vật lý  
> **Tài liệu tham chiếu:** [PLAN.md](../PLAN.md) · [API-SPEC.md](../API-SPEC.md) · [INTEGRATION-DESIGN.md](INTEGRATION-DESIGN.md)

---

## 1. Mục Tiêu & Nhánh Làm Việc

### 1.1. Mục tiêu công việc
Kích hoạt 100% tầng vận hành thực tế tại quầy lễ tân (Staff Desk) và quản lý kho:
1. **Tra cứu & Quản lý Hợp đồng (`FM-03`):** Nối `GET /contracts`, bóc tách dữ liệu phân trang chuẩn xác (`res.data.content`) không gây lỗi undefined length.
2. **Quy trình Đón khách & Bàn giao kho (Check-in `FS-01..03`, `SC-04`):** Xác nhận bàn giao ô kho, gửi `POST /contracts/{id}/check-in`, nhận mã PIN 6 số điện tử và chuyển trạng thái kho sang `OCCUPIED`.
3. **Từ chối nhận kho (Handover Rejection):** Ghi nhận khách từ chối do cơ sở vật chất không đạt qua `POST /contracts/{id}/handover-rejection`.
4. **Nghiệm thu trả kho (Inspection `FS-04`):** Nhân viên kiểm tra hiện trạng, lập biên bản hư hỏng qua `POST /contracts/{id}/return-inspections`.
5. **Quyết toán hoàn cọc & Thanh lý hợp đồng (`FM-04`):** Xem trước bảng tính quyết toán `GET /contracts/{id}/settlement-preview` và phê duyệt đóng hợp đồng `POST /contracts/{id}/settlement-approval`.
6. **Xóa bỏ hardcode `staffId = 8` tại Staff Dashboard:** Trích xuất thông tin nhân viên trực tiếp từ tài khoản đăng nhập hiện tại (`useAuthStore`).

### 1.2. Quy trình Git chuẩn (BẮT BUỘC)
```powershell
# 1. Kéo main mới nhất và tạo nhánh tính năng
git checkout main
git fetch origin main
git pull origin main
git checkout -b feature/Tx-ws2-staff-handover-api

# 2. Bật cờ kết nối Backend thật cho WS2 trong frontend/.env:
# VITE_USE_MOCK=false
# VITE_MOCK_WS2=false
```

---

## 2. Ranh Giới Mã Nguồn (Zero-Conflict Boundary)

| Phân loại | Danh sách tệp / Thư mục |
| :--- | :--- |
| **Được phép chỉnh sửa (Sở hữu bởi WS2)** | • `frontend/src/api/contract.ts`<br>• `frontend/src/api/facility.ts`<br>• `frontend/src/api/storageUnit.ts`<br>• `frontend/src/features/staff/pages/StaffDashboardPage.tsx`<br>• `frontend/src/features/staff/pages/StaffCheckInPage.tsx`<br>• `frontend/src/features/staff/pages/StaffReturnPage.tsx`<br>• `frontend/src/features/staff/components/` (HandoverModal, InspectionForm)<br>• Backend: `com.swp391.selfstorage.facility.*`, `unit.*`, `contract.*` |
| **TUYỆT ĐỐI CẤM SỬA (Thuộc Workstream khác)** | ❌ `frontend/src/api/client.ts` (Phase 1 đã cố định)<br>❌ `com.swp391.selfstorage.reservation.*` (WS1)<br>❌ `com.swp391.selfstorage.payment.*` & `policy.*` (WS3)<br>❌ `com.swp391.selfstorage.auth.*`, `user.*`, `support.*`, `report.*` (WS4) |

---

## 3. Bảng Đối Chiếu Hợp Đồng API (Reconciliation Matrix)

| Chức năng | Frontend cũ / Điểm lệch | Backend Thực tế (Chuẩn) | Headers & Body | Response Cấu trúc | Ghi chú xử lý |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Danh sách hợp đồng** | `res.data` bị parse nhầm thành mảng | `GET /contracts` | Query: `status`, `keyword`, `page`, `size`, `sort` | `ApiResponse<PageResponse<ContractSummaryResponse>>` | Cần trả về `res.data` (chứa `.content` và pagination info) |
| **Chi tiết hợp đồng** | Thiếu role / facility check | `GET /contracts/{id}` | Path param `id` | `ApiResponse<ContractResponse>` | Bóc `res.data` |
| **Bàn giao kho (Check-in)** | Bị cờ Mock chặn lại | `POST /contracts/{id}/check-in` | Header: `X-Staff-Id`<br>Body: `CheckInRequest { accessCardCode, notes, checkinDate }` | `ApiResponse<CheckInResponse>` | Trả về mã PIN 6 số (`accessCode`) và trạng thái `ACTIVE` |
| **Từ chối nhận kho** | Chưa nối API | `POST /contracts/{id}/handover-rejection` | Header: `X-Staff-Id`<br>Body: `HandoverRejectionRequest { rejectionReason, notes }` | `ApiResponse<HandoverRejectionResponse>` | Hợp đồng sang `TERMINATED`, ô kho sang `MAINTENANCE` |
| **Nghiệm thu trả kho** | Gọi sai URL `/inspections` | `POST /contracts/{id}/return-inspections` | Header: `X-Staff-Id`<br>Body: `ReturnInspectionRequest { returnDate, condition, damageNotes, damageCost, evidenceImageUrls }` | `ApiResponse<ReturnInspectionResponse>` | `condition`: `GOOD`, `MINOR_DAMAGE`, `MAJOR_DAMAGE` |
| **Xem trước quyết toán** | Mock tĩnh ở client | `GET /contracts/{id}/settlement-preview` | Path param `id` | `ApiResponse<SettlementPreviewResponse>` | Trả về `depositRefundAmount`, `damageCost`, `payableAmount` |
| **Phê duyệt quyết toán (FM)** | Chưa nối | `POST /contracts/{id}/settlement-approval` | Header: `X-Manager-Id`<br>Body: `SettlementApprovalRequest { adjustedDamageCost, approvedNotes }` | `ApiResponse<SettlementApprovalResponse>` | Đóng hợp đồng `CLOSED`, trả ô kho về `CLEANING` |
| **Nhiệm vụ trong ca trực Staff** | Hardcode `staffId = 8` | `GET /staff/daily-tasks` hoặc `GET /staff/{staffId}/daily-tasks` | Query: `date=YYYY-MM-DD`, `pendingOnly=true` | `ApiResponse<StaffDailyTasksResponse>` | Đọc ID nhân viên từ `authStore.user.id` |

---

## 4. Hướng Dẫn Sửa Mã Nguồn Chi Tiết

### 4.1. Chuẩn hóa hàm gọi API Hợp đồng (`frontend/src/api/contract.ts`)
Khắc phục triệt để lỗi ép kiểu sai và bóc tách dữ liệu chuẩn:

```typescript
import { apiClient, ApiResponse, PageResponse, isMockEnabled } from '@/api/client';

export interface ContractSummary {
  id: number;
  code: string;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  facilityId: number;
  facilityName?: string;
  storageUnitId: number;
  storageUnitCode?: string;
  unitTypeId: number;
  unitTypeName?: string;
  startDate: string;
  endDateExclusive: string;
  rentalMonths: number;
  monthlyPrice: number;
  depositAmount: number;
  depositBalance: number;
  status: string; // PENDING_CHECKIN, ACTIVE, PENDING_RETURN, OVERDUE, CLOSED, etc.
  nearExpiration: boolean;
}

export interface CheckInPayload {
  accessCardCode?: string;
  notes?: string;
  checkinDate?: string;
}

export interface CheckInResult {
  id: number;
  contractCode: string;
  status: string;
  accessCode: string; // Mã PIN 6 số cấp cho khách
  checkinDate: string;
}

export interface ReturnInspectionPayload {
  returnDate: string;
  condition: 'GOOD' | 'MINOR_DAMAGE' | 'MAJOR_DAMAGE';
  damageNotes?: string;
  damageCost?: number;
  evidenceImageUrls?: string;
}

// 1. Lấy danh sách hợp đồng (PageResponse)
export async function getContracts(params?: {
  status?: string;
  keyword?: string;
  facilityId?: number;
  page?: number;
  size?: number;
}): Promise<PageResponse<ContractSummary>> {
  if (isMockEnabled('WS2')) {
    return getMockContracts(params);
  }
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.keyword) query.set('keyword', params.keyword);
  query.set('page', String(params?.page ?? 0));
  query.set('size', String(params?.size ?? 10));

  const res = await apiClient<ApiResponse<PageResponse<ContractSummary>>>(`/contracts?${query.toString()}`);
  return res.data; // Trả về PageResponse { content: [...], totalElements, totalPages, page, size }
}

// 2. Nhân viên bàn giao kho (Check-in)
export async function performCheckIn(contractId: number, payload: CheckInPayload, staffId?: number): Promise<CheckInResult> {
  if (isMockEnabled('WS2')) {
    return mockPerformCheckIn(contractId, payload);
  }
  const headers: Record<string, string> = {};
  if (staffId) headers['X-Staff-Id'] = String(staffId);

  const res = await apiClient<ApiResponse<CheckInResult>>(`/contracts/${contractId}/check-in`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  return res.data;
}

// 3. Nghiệm thu trả kho (Return Inspection)
export async function submitReturnInspection(contractId: number, payload: ReturnInspectionPayload, staffId?: number) {
  if (isMockEnabled('WS2')) {
    return mockSubmitReturnInspection(contractId, payload);
  }
  const headers: Record<string, string> = {};
  if (staffId) headers['X-Staff-Id'] = String(staffId);

  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/return-inspections`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  return res.data;
}

// 4. Xem trước bảng quyết toán
export async function getSettlementPreview(contractId: number) {
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/settlement-preview`);
  return res.data;
}

// 5. Phê duyệt quyết toán (FM)
export async function approveSettlement(contractId: number, payload?: { adjustedDamageCost?: number; approvedNotes?: string }, managerId?: number) {
  const headers: Record<string, string> = {};
  if (managerId) headers['X-Manager-Id'] = String(managerId);

  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/settlement-approval`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload ?? {})
  });
  return res.data;
}
```

### 4.2. Xóa bỏ Hardcode `staffId = 8` trong `StaffDashboardPage.tsx`
Thay thế đoạn mã hardcode ID bằng context người dùng đang đăng nhập:

```tsx
// CŨ:
// const staffId = 8;
// const response = await fetchDailyTasks(staffId);

// MỚI:
import { useAuthStore } from '@/features/auth/authStore';

export const StaffDashboardPage = () => {
  const { user } = useAuthStore();
  const staffId = user?.id;

  useEffect(() => {
    if (staffId) {
      loadDailyTasks(staffId);
    }
  }, [staffId]);
  // ...
};
```

---

## 5. Câu Lệnh Prompt Dành Cho Trợ Lý AI (AI Instructions Prompt)

> **Hướng dẫn thành viên:** Copy toàn bộ đoạn prompt trong khung dưới đây và dán vào cửa sổ chat với AI Assistant (Antigravity/Gemini/Claude) để yêu cầu AI lập kế hoạch và code bằng lệnh `/writing-plans`:

```text
Xin chào AI, tôi là Nguyễn Văn Gia Bình, phụ trách Workstream 2 (WS2: Cơ sở, Kho & Vận hành) trong dự án SWP391.
Hãy đọc kỹ tài liệu hướng dẫn của tôi tại: docs/guides/WS2-GUIDE-STAFF-OPERATIONS.md
Và kiến trúc tích hợp tại: docs/guides/INTEGRATION-DESIGN.md

YÊU CẦU:
1. Hãy sử dụng kỹ năng /writing-plans để lập một Kế hoạch Triển khai (Implementation Plan) chi tiết từng bước cho Phase 2 của Workstream 2.
2. Mục tiêu chính:
   - Sửa hàm bóc tách dữ liệu getContracts() trong frontend/src/api/contract.ts: Đảm bảo trả về res.data (PageResponse) và UI bóc tách qua response.content.
   - Nối API Check-in bàn giao kho: POST /contracts/{id}/check-in gửi kèm X-Staff-Id, nhận về mã PIN 6 số và cập nhật danh sách hợp đồng.
   - Nối API Từ chối nhận kho: POST /contracts/{id}/handover-rejection.
   - Nối API Nghiệm thu trả kho: POST /contracts/{id}/return-inspections.
   - Nối API Xem trước & Phê duyệt quyết toán: GET /contracts/{id}/settlement-preview và POST /contracts/{id}/settlement-approval.
   - Bỏ toàn bộ hardcode staffId = 8 trong StaffDashboardPage.tsx, lấy ID từ useAuthStore.
3. Ranh giới tuyệt đối: CHỈ chỉnh sửa các file thuộc WS2 (frontend/src/api/contract.ts, facility.ts, storageUnit.ts, frontend/src/features/staff/*, và backend com.swp391.selfstorage.contract/facility/unit). Tuyệt đối KHÔNG sửa code của WS1, WS3, WS4 hoặc client.ts.
4. Bật cờ VITE_MOCK_WS2=false trong frontend/.env để kiểm thử thực tế.
5. Tạo nhánh Git chuẩn: feature/Tx-ws2-staff-handover-api rẽ từ main mới nhất.
6. Tuân thủ TDD & kiểm thử: mvn clean test xanh 100%, npm run build không lỗi.

Hãy trình bày Plan chi tiết với các checkbox [ ] để tôi duyệt trước khi bắt đầu code!
```

---

## 6. Tiêu Chí Nghiệm Thu (Definition of Done - DoD)

- [ ] Nhánh Git `feature/Tx-ws2-staff-handover-api` rẽ sạch sẽ từ `main` mới nhất.
- [ ] Bật `VITE_USE_MOCK=false` và `VITE_MOCK_WS2=false` trong `frontend/.env`.
- [ ] Mở Staff Desk: Tải danh sách hợp đồng `PENDING_CHECKIN` từ CSDL SQL Server hiển thị đầy đủ trên bảng, không bị crash hoặc trắng trang.
- [ ] Thực hiện Check-in bàn giao kho: Bấm xác nhận, nhận thông báo cấp mã PIN 6 số thành công, trạng thái hợp đồng đổi sang `ACTIVE`.
- [ ] Thực hiện Nghiệm thu trả kho: Bấm nộp biên bản nghiệm thu hư hỏng, hệ thống cập nhật hợp đồng sang `PENDING_RETURN`.
- [ ] Quản lý duyệt quyết toán: Hiển thị đúng số tiền khấu trừ thiệt hại và tiền hoàn cọc.
- [ ] Không còn bất kỳ vị trí nào hardcode `staffId = 8`.
- [ ] `mvn clean test` pass 100% (toàn bộ 335+ tests backend).
- [ ] `npm run build` thành công 100%.
- [ ] Rebase `origin/main`, push nhánh và tạo Pull Request.

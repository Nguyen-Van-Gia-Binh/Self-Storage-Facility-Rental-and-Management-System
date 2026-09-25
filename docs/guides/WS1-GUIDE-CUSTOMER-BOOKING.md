# Hướng Dẫn Kỹ Thuật Phase 2 — Workstream 1: Khách Hàng & Đặt Chỗ (Customer & Booking)

> **Người thực hiện:** Nguyễn Phạm Xuân Nhi (WS1)  
> **Ranh giới Bounded Context:** `com.swp391.selfstorage.reservation` · `frontend/src/features/customer/` (phần đặt chỗ & quản lý hợp đồng khách hàng)  
> **Tài liệu tham chiếu:** [PLAN.md](../PLAN.md) · [API-SPEC.md](../API-SPEC.md) · [INTEGRATION-DESIGN.md](INTEGRATION-DESIGN.md)

---

## 1. Mục Tiêu & Nhánh Làm Việc

### 1.1. Mục tiêu công việc
Nối thông 100% luồng nghiệp vụ của Khách hàng từ đầu đến cuối:
1. **Tìm kiếm cơ sở & kiểm tra sức chứa ô kho (`SC-01`):** Tra cứu danh sách cơ sở, loại ô kho, kiểm tra availability theo khoảng ngày thuê.
2. **Đặt chỗ & Giữ capacity 48h (`SC-02`):** Tính trước giá thuê, tạo đơn đặt chỗ `POST /reservations`.
3. **Quản lý ô kho của tôi (`SC-05`):** Xem danh sách ô kho đang thuê `GET /customers/me/rentals`, xem chi tiết hợp đồng, mã PIN truy cập.
4. **Báo trước trả kho & Gia hạn hợp đồng (`SC-05`, Flow 6):** Lấy báo giá gia hạn chuẩn từ Backend `POST /contracts/{id}/renewals/quote`, thực hiện gia hạn và thông báo trả kho.

### 1.2. Quy trình Git chuẩn (BẮT BUỘC)
Tuân thủ quy trình 5 bước tại `CONTRIBUTING.md`. Tuyệt đối không code trên `main` hoặc nhánh cũ:

```powershell
# 1. Kéo main mới nhất và rẽ nhánh mới
git checkout main
git fetch origin main
git pull origin main
git checkout -b feature/ws1-connect-customer-booking-api

# 2. Bật cờ kết nối Backend thật cho WS1 trong frontend/.env:
# VITE_USE_MOCK=false
# VITE_MOCK_WS1=false
```

---

## 2. Ranh Giới Mã Nguồn (Zero-Conflict Boundary)

| Phân loại | Danh sách tệp / Thư mục |
| :--- | :--- |
| **Được phép chỉnh sửa (Sở hữu bởi WS1)** | • `frontend/src/api/customerRentals.ts`<br>• `frontend/src/api/reservation.ts` (hoặc tương đương)<br>• `frontend/src/features/customer/pages/BookingPage.tsx`<br>• `frontend/src/features/customer/pages/MyRentalsPage.tsx`<br>• `frontend/src/features/customer/pages/ContractDetailPage.tsx`<br>• `frontend/src/features/customer/components/` (Booking modal, Renewal modal)<br>• Backend (nếu cần chỉnh DTO/Service): `com.swp391.selfstorage.reservation.*` |
| **TUYỆT ĐỐI CẤM SỬA (Thuộc Workstream khác)** | ❌ `frontend/src/api/client.ts` (Nền tảng chung Phase 1)<br>❌ `com.swp391.selfstorage.facility.*` & `unit.*` (WS2)<br>❌ `com.swp391.selfstorage.contract.*` (WS2)<br>❌ `com.swp391.selfstorage.payment.*` & `policy.*` (WS3)<br>❌ `com.swp391.selfstorage.auth.*`, `user.*`, `support.*`, `report.*` (WS4) |

---

## 3. Bảng Đối Chiếu Hợp Đồng API (Reconciliation Matrix)

| Chức năng | Frontend cũ / Nhầm lẫn | Backend Thực tế (Chuẩn) | Request DTO & Query | Response Cấu trúc | Ghi chú xử lý |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tra cứu danh sách cơ sở** | `GET /public/facilities` | `GET /facilities` | `keyword`, `isActive=true`, `page`, `size` | `PageResponse<FacilityResponse>` | Endpoint công khai, không cần JWT |
| **Tra cứu loại ô kho theo cơ sở** | `GET /public/unit-types` | `GET /facilities/{facilityId}/unit-types` | `isActive=true` | `PageResponse<UnitTypeResponse>` | Endpoint công khai |
| **Kiểm tra sức chứa (Availability)** | Client tự tính | `GET /facilities/{fId}/unit-types/{uId}/availability` | `startDate=YYYY-MM-DD`, `rentalMonths=N` | `AvailabilityResponse` | Trả về `availableSlots`, `monthlyPrice`, `depositAmount` |
| **Tính trước tiền thuê & cọc** | Client nhẩm giá | `POST /reservations/calculate-price` | `CalculatePriceRequest`: `{ facilityId, unitTypeId, startDate, rentalMonths }` | `ApiResponse<CalculatePriceResponse>` | Bóc `res.data` lấy: `totalRentalFee`, `depositAmount`, `discountAmount`, `finalAmount` |
| **Tạo đơn đặt chỗ** | `fetch` tự chế, thiếu JWT | `POST /reservations` | `CreateReservationRequest`: `{ facilityId, unitTypeId, startDate, rentalMonths, notes }` | `ApiResponse<ReservationResponse>` (Status 201) | Bắt buộc gửi JWT Header (`apiClient` tự lo) |
| **Danh sách ô kho đang thuê của tôi** | `GET /customer/contracts` | `GET /customers/me/rentals` | `status=ALL\|ACTIVE\|OVERDUE`, `page`, `size` | `ApiResponse<PageResponse<CustomerRentalSummaryResponse>>` | Bóc `res.data.content` để render danh sách! |
| **Chi tiết ô kho đang thuê** | `GET /customer/contracts/{id}` | `GET /customers/me/rentals/{id}` | Path param `id` | `ApiResponse<CustomerRentalDetailResponse>` | Bóc `res.data` lấy mã PIN, trạng thái, ngày hết hạn |
| **Xem trước chi phí gia hạn** | Client tự nhân giá | `POST /contracts/{id}/renewals/quote` | `RenewalRequest`: `{ renewalMonths: N }` | `ApiResponse<RenewalQuoteResponse>` | Bóc `res.data` lấy số tiền gia hạn chính xác từ Policy Backend |
| **Thực hiện gia hạn hợp đồng** | `POST /customer/contracts/{id}/renew` | `POST /contracts/{id}/renewals` | `RenewalRequest`: `{ renewalMonths: N }` + param `paymentId` | `ApiResponse<RenewalResponse>` | Gọi sau khi thanh toán gia hạn thành công |
| **Gửi thông báo trả kho** | `POST /customer/contracts/{id}/return` | `POST /contracts/{id}/return-notices` | `ReturnNoticeRequest`: `{ intendedReturnDate, notes }` | `ApiResponse<ReturnNoticeResponse>` | Ngày trả phải $\ge$ ngày hiện tại |

---

## 4. Hướng Dẫn Sửa Mã Nguồn Chi Tiết

### 4.1. Chuẩn hóa hàm gọi API Khách hàng (`frontend/src/api/customerRentals.ts`)
Thay thế toàn bộ lệnh `fetch` độc lập bằng `apiClient` từ `@/api/client` và sử dụng cờ kiểm tra mock `isMockEnabled('WS1')`:

```typescript
import { apiClient, ApiResponse, PageResponse, isMockEnabled } from '@/api/client';

export interface CustomerRentalSummary {
  id: number;
  contractCode: string;
  facilityName: string;
  unitCode: string;
  unitTypeName: string;
  startDate: string;
  endDateExclusive: string;
  status: string; // ACTIVE, PENDING_CHECKIN, OVERDUE, etc.
  accessCode?: string;
  monthlyPrice: number;
}

export interface CustomerRentalDetail extends CustomerRentalSummary {
  depositAmount: number;
  depositBalance: number;
  totalRentalFee: number;
  overdueFeeAccrued: number;
  facilityAddress: string;
  facilityPhone: string;
}

export interface RenewalQuote {
  contractId: number;
  currentEndDate: string;
  newEndDateExclusive: string;
  renewalMonths: number;
  monthlyPrice: number;
  totalRenewalFee: number;
}

// 1. Lấy danh sách ô kho đang thuê
export async function getMyRentals(params?: { status?: string; page?: number; size?: number }): Promise<PageResponse<CustomerRentalSummary>> {
  if (isMockEnabled('WS1')) {
    return getMockMyRentals();
  }
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  query.set('page', String(params?.page ?? 0));
  query.set('size', String(params?.size ?? 10));

  const res = await apiClient<ApiResponse<PageResponse<CustomerRentalSummary>>>(`/customers/me/rentals?${query.toString()}`);
  return res.data;
}

// 2. Lấy chi tiết ô kho
export async function getMyRentalDetail(contractId: number): Promise<CustomerRentalDetail> {
  if (isMockEnabled('WS1')) {
    return getMockMyRentalDetail(contractId);
  }
  const res = await apiClient<ApiResponse<CustomerRentalDetail>>(`/customers/me/rentals/${contractId}`);
  return res.data;
}

// 3. Xem trước giá gia hạn
export async function getRenewalQuote(contractId: number, renewalMonths: number): Promise<RenewalQuote> {
  if (isMockEnabled('WS1')) {
    return getMockRenewalQuote(contractId, renewalMonths);
  }
  const res = await apiClient<ApiResponse<RenewalQuote>>(`/contracts/${contractId}/renewals/quote`, {
    method: 'POST',
    body: JSON.stringify({ renewalMonths })
  });
  return res.data;
}

// 4. Xác nhận gia hạn
export async function submitRenewal(contractId: number, renewalMonths: number, paymentId?: number) {
  const query = paymentId ? `?paymentId=${paymentId}` : '';
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/renewals${query}`, {
    method: 'POST',
    body: JSON.stringify({ renewalMonths })
  });
  return res.data;
}

// 5. Gửi thông báo trả kho
export async function submitReturnNotice(contractId: number, intendedReturnDate: string, notes?: string) {
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/return-notices`, {
    method: 'POST',
    body: JSON.stringify({ intendedReturnDate, notes })
  });
  return res.data;
}
```

### 4.2. Chuẩn hóa API Đặt chỗ (`frontend/src/api/reservation.ts`)
```typescript
import { apiClient, ApiResponse, isMockEnabled } from '@/api/client';

export interface CalculatePriceRequest {
  facilityId: number;
  unitTypeId: number;
  startDate: string;
  rentalMonths: number;
}

export interface CalculatePriceResponse {
  monthlyPrice: number;
  rentalMonths: number;
  totalRentalFee: number;
  depositAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface CreateReservationRequest {
  facilityId: number;
  unitTypeId: number;
  startDate: string;
  rentalMonths: number;
  notes?: string;
}

export interface ReservationResponse {
  id: number;
  code: string;
  facilityId: number;
  unitTypeId: number;
  status: string; // PENDING_PAYMENT, CONFIRMED, etc.
  totalAmount: number;
  depositAmount: number;
  expiresAt: string;
}

export async function calculateBookingPrice(req: CalculatePriceRequest): Promise<CalculatePriceResponse> {
  if (isMockEnabled('WS1')) return mockCalculatePrice(req);
  const res = await apiClient<ApiResponse<CalculatePriceResponse>>('/reservations/calculate-price', {
    method: 'POST',
    body: JSON.stringify(req)
  });
  return res.data;
}

export async function createReservation(req: CreateReservationRequest): Promise<ReservationResponse> {
  if (isMockEnabled('WS1')) return mockCreateReservation(req);
  const res = await apiClient<ApiResponse<ReservationResponse>>('/reservations', {
    method: 'POST',
    body: JSON.stringify(req)
  });
  return res.data;
}
```

### 4.3. Xử lý tính năng Đổi mã PIN & Nhật ký mở khóa (Access Logs)
* Hiện tại Backend chưa lưu bảng `access_logs`.
* Trong `frontend/src/api/customerRentals.ts`, đối với 2 hàm `changeAccessPin()` và `getAccessLogs()`, duy trì Mock fallback có thông báo `console.warn('[WS1] Feature Access Logs is currently client-simulated')` để giao diện không bị lỗi crash.

---

## 5. Câu Lệnh Prompt Dành Cho Trợ Lý AI (AI Instructions Prompt)

> **Hướng dẫn thành viên:** Copy toàn bộ đoạn prompt trong khung dưới đây và dán vào cửa sổ chat với AI Assistant (Antigravity/Gemini/Claude) để yêu cầu AI lập kế hoạch và code bằng lệnh `/writing-plans`:

```text
Xin chào AI, tôi là Nguyễn Phạm Xuân Nhi, phụ trách Workstream 1 (WS1: Khách hàng & Đặt chỗ) trong dự án SWP391.
Hãy đọc kỹ tài liệu hướng dẫn của tôi tại: docs/guides/WS1-GUIDE-CUSTOMER-BOOKING.md
Và kiến trúc tích hợp tại: docs/guides/INTEGRATION-DESIGN.md

YÊU CẦU:
1. Hãy sử dụng kỹ năng /writing-plans để lập một Kế hoạch Triển khai (Implementation Plan) chi tiết từng bước cho Phase 2 của Workstream 1.
2. Mục tiêu là nối toàn bộ API thật của Khách hàng:
   - Tra cứu cơ sở & unit-type: GET /facilities, GET /facilities/{id}/unit-types, GET /facilities/{id}/unit-types/{id}/availability.
   - Tính giá & Đặt chỗ: POST /reservations/calculate-price, POST /reservations.
   - Quản lý kho của tôi: GET /customers/me/rentals, GET /customers/me/rentals/{id}.
   - Báo giá & Gia hạn: POST /contracts/{id}/renewals/quote, POST /contracts/{id}/renewals.
   - Báo trước trả kho: POST /contracts/{id}/return-notices.
3. Ranh giới tuyệt đối: CHỈ chỉnh sửa các file thuộc WS1 (frontend/src/api/customerRentals.ts, reservation.ts, BookingPage.tsx, MyRentalsPage.tsx, v.v.). Tuyệt đối KHÔNG sửa chéo mã nguồn của WS2, WS3, WS4 hoặc client.ts.
4. Áp dụng quy chuẩn bóc tách dữ liệu: Tất cả API Backend trả về ApiResponse<T> ({ status, message, data }), đối với phân trang thì mảng nằm trong data.content.
5. Tạo nhánh Git chuẩn: feature/ws1-connect-customer-booking-api rẽ từ main mới nhất.
6. Tuân thủ TDD & kiểm thử: Chạy npm run build không có lỗi TypeScript lint nào.

Hãy trình bày Plan chi tiết với các checkbox [ ] để tôi duyệt trước khi bạn bắt đầu viết code!
```

---

## 6. Tiêu Chí Nghiệm Thu (Definition of Done - DoD)

- [ ] Nhánh Git `feature/ws1-connect-customer-booking-api` được rẽ trực tiếp từ `main` mới nhất.
- [ ] Bật `VITE_USE_MOCK=false` và `VITE_MOCK_WS1=false` trong `frontend/.env`.
- [ ] Vào trang Tìm kho: Chọn cơ sở, chọn loại kho, hiển thị đúng giá tiền và sức chứa còn trống từ Backend.
- [ ] Đặt chỗ: Bấm đặt chỗ gửi đúng `POST /reservations`, nhận về mã đơn đặt chỗ thật.
- [ ] Vào trang "Ô kho của tôi": Tải đúng danh sách hợp đồng của tài khoản đang đăng nhập qua `GET /customers/me/rentals`.
- [ ] Mở modal gia hạn: Hiển thị đúng số tiền báo giá từ `POST /contracts/{id}/renewals/quote`.
- [ ] Chạy lệnh kiểm thử Frontend: `npm run build` thành công 100%, không phát sinh lỗi TypeScript.
- [ ] Thực hiện rebase `origin/main`, push nhánh và tạo Pull Request theo mẫu tại `CONTRIBUTING.md`.

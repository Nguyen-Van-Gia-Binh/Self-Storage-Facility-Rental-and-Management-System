# Hướng Dẫn Kỹ Thuật Phase 2 — Workstream 3: Tài Chính, Biểu Giá & Thanh Toán VietQR (Pricing & Payments)

> **Người thực hiện:** Huỳnh Nhật (WS3)  
> **Ranh giới Bounded Context:** `com.swp391.selfstorage.payment` · `policy` · `frontend/src/features/payment/` · `frontend/src/features/bom/` (BOM Pricing & Finance)  
> **Tài liệu tham chiếu:** [PLAN.md](../PLAN.md) · [API-SPEC.md](../API-SPEC.md) · [INTEGRATION-DESIGN.md](INTEGRATION-DESIGN.md)

---

## 1. Mục Tiêu & Nhánh Làm Việc

### 1.1. Mục tiêu công việc
Kích hoạt toàn bộ hạ tầng thanh toán tự động VietQR (PayOS) và hệ thống quản trị tài chính - biểu giá cho Business Operations Manager (BOM):
1. **Sửa đổi Endpoint Biểu giá ô kho (`BM-03`):** Khắc phục lỗi lệch URL và HTTP Method khi cập nhật đơn giá tháng của loại ô kho theo cơ sở (`PUT /facilities/{facilityId}/prices/{unitTypeId}`).
2. **Cơ chế Thanh toán VietQR PayOS Tự động (`SC-03`):**
   - Tạo link và mã QR thanh toán qua `POST /payments/checkout`.
   - **Xóa bỏ hàm giả lập `POST /payments/{id}/verify`**.
   - Cài đặt cơ chế **Polling kiểm tra trạng thái giao dịch** qua `GET /payments/order/{orderCode}/status` (polling mỗi 3s/lần cho đến khi trạng thái chuyển sang `PAID`).
3. **BOM Dashboard (`BM-04`, `BM-05`):** Loại bỏ mảng danh sách cơ sở bị hardcode tĩnh tại `BomDashboardPage.tsx#L31`. Gọi API `GET /facilities` nạp dữ liệu động và hiển thị báo cáo doanh thu `GET /reports/system/revenue`.

### 1.2. Quy trình Git chuẩn (BẮT BUỘC)
```powershell
# 1. Kéo main mới nhất và tạo nhánh tính năng
git checkout main
git fetch origin main
git pull origin main
git checkout -b feature/ws3-connect-pricing-payment-api

# 2. Bật cờ kết nối Backend thật cho WS3 trong frontend/.env:
# VITE_USE_MOCK=false
# VITE_MOCK_WS3=false
```

---

## 2. Ranh Giới Mã Nguồn (Zero-Conflict Boundary)

| Phân loại | Danh sách tệp / Thư mục |
| :--- | :--- |
| **Được phép chỉnh sửa (Sở hữu bởi WS3)** | • `frontend/src/api/payment.ts`<br>• `frontend/src/api/pricing.ts`<br>• `frontend/src/features/payment/components/VietQRPaymentModal.tsx`<br>• `frontend/src/features/payment/pages/PaymentResultPage.tsx`<br>• `frontend/src/features/bom/pages/BomDashboardPage.tsx`<br>• `frontend/src/features/bom/pages/BomPricingManagementPage.tsx`<br>• Backend: `com.swp391.selfstorage.payment.*`, `com.swp391.selfstorage.policy.*` |
| **TUYỆT ĐỐI CẤM SỬA (Thuộc Workstream khác)** | ❌ `frontend/src/api/client.ts` (Phase 1 đã cố định)<br>❌ `com.swp391.selfstorage.reservation.*` (WS1)<br>❌ `com.swp391.selfstorage.facility.*`, `unit.*`, `contract.*` (WS2)<br>❌ `com.swp391.selfstorage.auth.*`, `user.*`, `support.*`, `report.*` (WS4) |

---

## 3. Bảng Đối Chiếu Hợp Đồng API (Reconciliation Matrix)

| Chức năng | Frontend cũ / Điểm lệch | Backend Thực tế (Chuẩn) | Headers & Body | Response Cấu trúc | Ghi chú xử lý |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Xem bảng giá theo cơ sở** | `GET /facilities/{id}/unit-types` | `GET /facilities/{facilityId}/prices` | Path param `facilityId` | `List<FacilityPriceResponse>` | Endpoint công khai / BOM |
| **Cập nhật giá ô kho** | `PATCH /facilities/{fId}/unit-types/{uId}/price` (Sai Method & Path) | `PUT /facilities/{facilityId}/prices/{unitTypeId}` | Body: `UpdatePriceRequest { monthlyPrice }` | `FacilityPriceResponse` | Yêu cầu quyền `BUSINESS_OPERATIONS_MANAGER` |
| **Khởi tạo link thanh toán VietQR** | Tạo mock dữ liệu QR | `POST /payments/checkout` | Body: `CheckoutRequest { reservationId?, contractRenewalId?, amount, description, cancelUrl, returnUrl }` | `CheckoutResponse` | Trả về `qrCode`, `checkoutUrl`, `orderCode` |
| **Đối soát kết quả thanh toán** | Gọi `POST /payments/{id}/verify` (Không tồn tại 404) | `GET /payments/order/{orderCode}/status` | Path param `orderCode` | `PaymentResponse` | **Cơ chế Polling:** Frontend định kỳ gọi mỗi 3 giây để kiểm tra khi PayOS gửi webhook |
| **Tiếp nhận Webhook PayOS** | Chưa rõ cấu hình | `POST /payments/webhook/payos` | PayOS webhook signature & data | `Map<String, Object>`: `{ error: 0, message: "Success" }` | Đã mở whitelist trong `SecurityConfig` |
| **Danh sách lịch sử thanh toán** | Mock tĩnh | `GET /payments` | Query: `referenceType`, `status`, `page`, `size` | `PageResponse<PaymentResponse>` | Dành cho BOM / Admin tra cứu |
| **Danh sách cơ sở trên BOM Dashboard** | Mảng tĩnh hardcode `#L31` | `GET /facilities` | Query: `isActive=true` | `PageResponse<FacilityResponse>` | Xóa mảng hardcode, nạp từ API |

---

## 4. Hướng Dẫn Sửa Mã Nguồn Chi Tiết

### 4.1. Chuẩn hóa API Bảng giá (`frontend/src/api/pricing.ts`)
```typescript
import { apiClient, isMockEnabled } from '@/api/client';

export interface FacilityPriceItem {
  id: number;
  facilityId: number;
  unitTypeId: number;
  unitTypeName: string;
  monthlyPrice: number;
  effectiveDate: string;
}

export interface UpdatePricePayload {
  monthlyPrice: number;
}

// 1. Lấy bảng giá của cơ sở
export async function getFacilityPrices(facilityId: number): Promise<FacilityPriceItem[]> {
  if (isMockEnabled('WS3')) {
    return getMockFacilityPrices(facilityId);
  }
  return await apiClient<FacilityPriceItem[]>(`/facilities/${facilityId}/prices`);
}

// 2. Cập nhật đơn giá tháng (PUT chuẩn)
export async function updateUnitPrice(facilityId: number, unitTypeId: number, payload: UpdatePricePayload): Promise<FacilityPriceItem> {
  return await apiClient<FacilityPriceItem>(`/facilities/${facilityId}/prices/${unitTypeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
```

### 4.2. Chuẩn hóa API Thanh toán & Polling VietQR (`frontend/src/api/payment.ts`)
```typescript
import { apiClient, isMockEnabled } from '@/api/client';

export interface CheckoutPayload {
  reservationId?: number;
  contractRenewalId?: number;
  amount: number;
  description: string;
  cancelUrl?: string;
  returnUrl?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  qrCode: string; // Chuỗi VietQR hoặc base64
  orderCode: number;
  paymentId: number;
  amount: number;
  description: string;
}

export interface PaymentStatusResult {
  id: number;
  orderCode: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  paidAt?: string;
  referenceType: string;
  referenceId: number;
}

// 1. Tạo đơn thanh toán PayOS
export async function createCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  if (isMockEnabled('WS3')) {
    return mockCreateCheckout(payload);
  }
  return await apiClient<CheckoutResult>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// 2. Kiểm tra trạng thái thanh toán (Dùng cho Polling)
export async function pollPaymentStatus(orderCode: number): Promise<PaymentStatusResult> {
  if (isMockEnabled('WS3')) {
    return mockPollPaymentStatus(orderCode);
  }
  return await apiClient<PaymentStatusResult>(`/payments/order/${orderCode}/status`);
}
```

### 4.3. Cập nhật `VietQRPaymentModal.tsx` để Polling tự động
Xóa bỏ nút bấm thủ công "Xác nhận đã chuyển khoản" gọi vào `verifyPayment`. Thay bằng hiệu ứng loading kèm hook `setInterval`:

```tsx
useEffect(() => {
  if (!orderCode || paymentStatus === 'PAID') return;

  const intervalId = setInterval(async () => {
    try {
      const res = await pollPaymentStatus(orderCode);
      if (res.status === 'PAID') {
        setPaymentStatus('PAID');
        clearInterval(intervalId);
        onPaymentSuccess(res);
      }
    } catch (err) {
      console.error('Polling payment error:', err);
    }
  }, 3000); // Polling mỗi 3 giây

  return () => clearInterval(intervalId);
}, [orderCode, paymentStatus]);
```

### 4.4. Xóa bỏ Mảng Cơ sở Hardcode trong `BomDashboardPage.tsx`
* Tại dòng 31 của `BomDashboardPage.tsx`, tìm mảng hằng số danh sách cơ sở (ví dụ: `const FACILITIES = [{ id: 1, name: 'Kho Tân Bình' }, ...]`).
* Thay thế bằng lệnh gọi `getFacilities()` từ `frontend/src/api/facility.ts` trong `useEffect`:
```tsx
useEffect(() => {
  async function loadFacilities() {
    const res = await getFacilities();
    setFacilities(res.content || []);
  }
  loadFacilities();
}, []);
```

---

## 5. Câu Lệnh Prompt Dành Cho Trợ Lý AI (AI Instructions Prompt)

> **Hướng dẫn thành viên:** Copy toàn bộ đoạn prompt trong khung dưới đây và dán vào cửa sổ chat với AI Assistant (Antigravity/Gemini/Claude) để yêu cầu AI lập kế hoạch và code bằng lệnh `/writing-plans`:

```text
Xin chào AI, tôi là Huỳnh Nhật, phụ trách Workstream 3 (WS3: Tài chính, Biểu giá & Thanh toán VietQR) trong dự án SWP391.
Hãy đọc kỹ tài liệu hướng dẫn của tôi tại: docs/guides/WS3-GUIDE-PRICING-PAYMENT.md
Và kiến trúc tích hợp tại: docs/guides/INTEGRATION-DESIGN.md

YÊU CẦU:
1. Hãy sử dụng kỹ năng /writing-plans để lập một Kế hoạch Triển khai (Implementation Plan) chi tiết từng bước cho Phase 2 của Workstream 3.
2. Mục tiêu chính:
   - Sửa hàm cập nhật bảng giá trong frontend/src/api/pricing.ts và BomPricingManagementPage.tsx: Chuyển từ PATCH thành PUT /facilities/{facilityId}/prices/{unitTypeId} gửi đúng UpdatePriceRequest { monthlyPrice }.
   - Khởi tạo link thanh toán PayOS: POST /payments/checkout trả về CheckoutResponse chứa qrCode và orderCode.
   - Xóa bỏ hoàn toàn hàm cũ POST /payments/{id}/verify.
   - Viết logic Polling trong VietQRPaymentModal.tsx: Gọi GET /payments/order/{orderCode}/status mỗi 3 giây/lần. Khi nhận status == 'PAID' thì chuyển bước thành công.
   - Sửa BomDashboardPage.tsx: Xóa mảng cơ sở hardcode tại dòng 31, gọi GET /facilities nạp danh sách động.
3. Ranh giới tuyệt đối: CHỈ chỉnh sửa các file thuộc WS3 (frontend/src/api/payment.ts, pricing.ts, VietQRPaymentModal.tsx, BomDashboardPage.tsx, BomPricingManagementPage.tsx, backend com.swp391.selfstorage.payment/policy). Tuyệt đối KHÔNG sửa code của WS1, WS2, WS4 hoặc client.ts.
4. Bật cờ VITE_MOCK_WS3=false trong frontend/.env để kiểm thử thực tế.
5. Tạo nhánh Git chuẩn: feature/ws3-connect-pricing-payment-api rẽ từ main mới nhất.
6. Tuân thủ TDD & kiểm thử: mvn clean test pass 100%, npm run build không lỗi.

Hãy trình bày Plan chi tiết với các checkbox [ ] để tôi duyệt trước khi bắt đầu code!
```

---

## 6. Tiêu Chí Nghiệm Thu (Definition of Done - DoD)

- [ ] Nhánh Git `feature/ws3-connect-pricing-payment-api` rẽ trực tiếp từ `main` mới nhất.
- [ ] Bật `VITE_USE_MOCK=false` và `VITE_MOCK_WS3=false` trong `frontend/.env`.
- [ ] Vào trang Quản lý giá BOM: Đổi giá tháng của một loại ô kho, bấm lưu -> gửi đúng `PUT /facilities/{facilityId}/prices/{unitTypeId}`, cập nhật thành công trong CSDL.
- [ ] Mở modal thanh toán VietQR: Nhận được mã QR và `orderCode` thật từ PayOS.
- [ ] Cơ chế polling hoạt động mượt mà (xem tab Network thấy gọi `GET /payments/order/{orderCode}/status` mỗi 3s).
- [ ] Khi chuyển khoản thử nghiệm thành công (hoặc webhook báo về), modal tự động chuyển sang trạng thái đã thanh toán.
- [ ] Mở BOM Dashboard: Danh sách cơ sở được tải động từ API, không còn mảng hardcode.
- [ ] `mvn clean test` pass 100%.
- [ ] `npm run build` thành công 100%.
- [ ] Rebase `origin/main`, push nhánh và tạo Pull Request.

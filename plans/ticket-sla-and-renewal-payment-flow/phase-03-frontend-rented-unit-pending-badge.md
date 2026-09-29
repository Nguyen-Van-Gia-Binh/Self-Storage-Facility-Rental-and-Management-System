# Phase 03: Frontend Lưu Vết Đơn Chờ Thanh Toán Trên Thẻ Ô Kho & Nút "Tiếp Tục Thanh Toán"

## Mục tiêu
Cập nhật giao diện thẻ ô kho (`RentedUnitCard`) tại trang "Kho của tôi" (My Rentals): Khi hợp đồng đang có giao dịch gia hạn chờ thanh toán (`hasPendingRenewal: true`), hiển thị badge cảnh báo màu hổ phách và tự động thay thế nút hành động từ "Gia hạn hợp đồng trực tuyến" sang nút "Tiếp tục thanh toán" dẫn thẳng tới màn hình thanh toán VietQR (Bước 3).

## Phạm vi công việc (Concrete Tasks)

- [ ] **Step 3.1: Viết test kiểm chứng UI (`RenewalPendingTracking.test.tsx`) theo TDD**
  - Tạo mới file: `frontend/src/features/customer/components/__tests__/RenewalPendingTracking.test.tsx`
  - Viết test kiểm tra:
    1. Khi hợp đồng có `hasPendingRenewal: true`, `RentedUnitCard` render badge màu hổ phách có nội dung `Đang chờ thanh toán gia hạn`.
    2. Nút hành động chính trong card hiển thị văn bản "Tiếp tục thanh toán" thay vì "Gia hạn hợp đồng trực tuyến".
    3. Link của nút "Tiếp tục thanh toán" trỏ đúng cấu trúc: `/customer/renew/${contract.id}?orderCode=${contract.pendingRenewalOrderCode}&step=3`.
    4. Khi hợp đồng có `hasPendingRenewal: false` hoặc không có trường này, vẫn hiển thị nút mặc định "Gia hạn hợp đồng trực tuyến" (`/customer/renew/${contract.id}`).
  - Chạy `npm test RenewalPendingTracking` -> xác nhận Red (test fail).

- [ ] **Step 3.2: Cập nhật API client trong `frontend/src/api/customerRentals.ts`**
  - Bổ sung vào interface `BackendRentalSummary`:
    ```typescript
    hasPendingRenewal?: boolean;
    pendingRenewalOrderCode?: number;
    pendingRenewalMonths?: number;
    pendingRenewalAmount?: number;
    pendingRenewalExpiresAt?: string;
    ```
  - Bổ sung vào interface `RentedContract`:
    ```typescript
    hasPendingRenewal?: boolean;
    pendingRenewalOrderCode?: number;
    pendingRenewalMonths?: number;
    pendingRenewalAmount?: number;
    pendingRenewalExpiresAt?: string;
    ```
  - Trong hàm `mapBackendRentalToContract`:
    - Ánh xạ các trường từ `BackendRentalSummary` sang `RentedContract`:
      ```typescript
      hasPendingRenewal: Boolean(raw.hasPendingRenewal),
      pendingRenewalOrderCode: raw.pendingRenewalOrderCode,
      pendingRenewalMonths: raw.pendingRenewalMonths,
      pendingRenewalAmount: raw.pendingRenewalAmount,
      pendingRenewalExpiresAt: raw.pendingRenewalExpiresAt,
      ```

- [ ] **Step 3.3: Cập nhật component `frontend/src/features/customer/components/RentedUnitCard.tsx`**
  - Trong phần hiển thị Badge trạng thái (hoặc vị trí cạnh badge trạng thái):
    - Nếu `contract.hasPendingRenewal`: hiển thị Badge nổi bật:
      ```tsx
      <Badge variant="warning" className="bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
        <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
        <span>Đang chờ thanh toán gia hạn</span>
      </Badge>
      ```
  - Trong phần nút thao tác chính ở footer của Card:
    - Nếu `contract.hasPendingRenewal && contract.pendingRenewalOrderCode`:
      - Hiển thị nút Primary:
        ```tsx
        <Link
          to={`/customer/renew/${contract.id}?orderCode=${contract.pendingRenewalOrderCode}&step=3`}
          className="w-full sm:w-auto"
        >
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 bg-brand-600 hover:bg-brand-700 text-white shadow-xs font-semibold"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Tiếp tục thanh toán</span>
          </Button>
        </Link>
        ```
    - Ngược lại (không có pending renewal): Giữ nguyên nút "Gia hạn hợp đồng trực tuyến" dẫn tới `/customer/renew/${contract.id}`.

- [ ] **Step 3.4: Chạy test và xác nhận Green**
  - Chạy `npm test RenewalPendingTracking` -> Pass 100%.

- [ ] **Step 3.5: Commit Git Phase 3**
  - Message: `feat(customer): hiển thị trạng thái chờ thanh toán gia hạn và nút tiếp tục thanh toán`

## Files / Modules Affected
- `frontend/src/api/customerRentals.ts` (MODIFY)
- `frontend/src/features/customer/components/RentedUnitCard.tsx` (MODIFY)
- `frontend/src/features/customer/components/__tests__/RenewalPendingTracking.test.tsx` (CREATE)

## Dependencies
- Phụ thuộc Phase 02 (định dạng DTO Backend). Có thể mock data trong unit test để chạy trước hoặc kiểm thử song song.

## Tests to Write First (TDD)
- `RenewalPendingTracking.test.tsx`:
  - `rendersPendingRenewalBadgeWhenHasPendingIsTrue`
  - `rendersContinuePaymentButtonWithCorrectUrlAndOrderCode`
  - `rendersDefaultRenewalButtonWhenNoPendingRenewal`

## Verification & Acceptance Criteria
- Lệnh kiểm tra: `npm test RenewalPendingTracking`
- Giao diện thẻ ô kho chuyển đổi nút tức thì và chính xác theo trạng thái đơn thanh toán của hợp đồng.

# Phase 04: Nâng Cấp Bước 3 Thanh Toán Gia Hạn (Sandbox Dev Bar, Đếm Ngược 48 Giờ, Nút Hủy Thanh Toán)

## Mục tiêu
Hoàn thiện trải nghiệm và môi trường kiểm thử tại Bước 3 trang Gia hạn hợp đồng (`RenewalPage.tsx`):
1. Đọc tham số URL `step=3` và `orderCode` để khôi phục màn hình thanh toán đang chờ.
2. Tích hợp thanh Sandbox Dev Bar giúp QA/Tester giả lập nhanh kết quả giao dịch (Thành công / Thất bại) mà không cần chuyển khoản thật.
3. Chuẩn hóa bộ đếm ngược thời hạn giữ chỗ 48 giờ theo `BR-REN-10` (thay vì 15 phút hardcode).
4. Thay thế nút "Quay lại xem bảng kê" thành nút "Hủy lệnh thanh toán" có hộp thoại xác nhận và gọi API hủy giao dịch giải phóng ô kho.
5. Cập nhật tài liệu quy định nghiệp vụ `docs/BUSINESS-RULES.md` (`BR-REN-10`) và `docs/NOTION-AUDIT-ISSUES-AND-BR-CHANGES.md` (Mục 6).

## Phạm vi công việc (Concrete Tasks)

- [ ] **Step 4.1: Cập nhật logic khôi phục phiên thanh toán từ URL (`RenewalPage.tsx`)**
  - Sử dụng hook `useSearchParams()` để lấy `step` và `orderCode` từ URL.
  - Nếu `step === '3'` và `orderCode` hợp lệ:
    - Set `currentStep = 3`.
    - Nếu state `payosCheckout` chưa có: Gọi `customerApi.getPaymentStatus(Number(orderCode))` để nạp lại thông tin thanh toán (mã VietQR, số tiền, nội dung chuyển khoản) mà không cần gọi hàm tạo mới link checkout.

- [ ] **Step 4.2: Chuẩn hóa Bộ đếm thời hạn giữ chỗ 48 giờ (`BR-REN-10`)**
  - Thay vì hardcode `useState(900)` (15 phút), tính toán thời gian hết hạn dựa trên `pendingRenewalExpiresAt` hoặc tính 48 giờ từ thời điểm tạo đơn.
  - Hiển thị thông minh:
    - Nếu thời gian còn lại > 60 phút: Hiển thị định dạng *"Còn X giờ Y phút"* (kèm mốc giờ hết hạn cụ thể).
    - Nếu thời gian còn lại <= 60 phút: Chuyển sang đồng hồ đếm lùi từng giây định dạng `mm:ss` nổi bật màu cam/đỏ.
  - Khi hết hạn 48 giờ: Tự động đánh dấu phiên hết hạn và khóa nút xác nhận.

- [ ] **Step 4.3: Bổ sung Sandbox Dev Bar tại Bước 3**
  - Thiết kế một Card nổi bật với viền nét đứt (dashed border) màu xanh xám tại Bước 3:
    ```tsx
    <div className="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span>Môi trường Thử nghiệm (Sandbox Payment)</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button
          type="button"
          size="sm"
          onClick={handleSimulateSuccess}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
        >
          ⚡ Giả lập Chuyển khoản Thành công
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSimulateCancel}
          className="border-rose-300 text-rose-600 hover:bg-rose-50 font-semibold text-xs"
        >
          ❌ Giả lập Hủy / Chuyển khoản Thất bại
        </Button>
      </div>
    </div>
    ```
  - Logic nút `Giả lập Chuyển khoản Thành công`:
    - Gọi `customerApi.processSandboxTransfer(orderCode, 'TRANSFER_SUCCESS')`.
    - Sau khi thành công: kích hoạt quy trình kích hoạt gia hạn `executeRenewalActivation()`, hiển thị thông báo thành công và mở Modal Hóa đơn điện tử (`RenewalReceiptModal`).
  - Logic nút `Giả lập Hủy / Chuyển khoản Thất bại`:
    - Gọi `customerApi.processSandboxTransfer(orderCode, 'CANCEL')`.
    - Hiển thị thông báo giao dịch đã bị hủy và cho phép quay về Bước 1 hoặc trang "Kho của tôi".

- [ ] **Step 4.4: Thay thế nút "Quay lại xem bảng kê" thành "Hủy lệnh thanh toán"**
  - Chân trang Bước 3 (nút điều hướng bên trái):
    - Đổi thành: **"Hủy lệnh thanh toán"** (icon `XCircle`, variant `outline`, hover nền đỏ nhạt).
    - Khi người dùng click: Hiển thị dialog xác nhận:
      *"Bạn có chắc chắn muốn hủy lệnh thanh toán gia hạn này? Ô kho sẽ được mở lại để bạn có thể chọn gói thuê hoặc thời gian gia hạn khác."*
    - Khi bấm xác nhận hủy trong dialog:
      - Gọi `customerApi.processSandboxTransfer(orderCode, 'CANCEL')`.
      - Reset `currentStep = 1` hoặc điều hướng về `/customer/my-rentals`.
      - Hiển thị toast thông báo: *"Đã hủy lệnh thanh toán gia hạn thành công."*

- [ ] **Step 4.5: Cập nhật tài liệu kỹ thuật & nghiệp vụ**
  - `docs/NOTION-AUDIT-ISSUES-AND-BR-CHANGES.md`: Đánh dấu `[ĐÃ XONG]` cho Mục 6 kèm ảnh và mô tả kỹ thuật cập nhật.
  - `docs/BUSINESS-RULES.md`: Cập nhật điều chỉnh quy tắc `BR-REN-10`:
    > *"BR-REN-10: Khi khách hàng xác nhận tạo mã thanh toán VietQR gia hạn hợp đồng, hệ thống tạm khóa capacity và giữ chỗ ô kho trong vòng 48 giờ. Trong 48 giờ này, hợp đồng mang trạng thái chờ thanh toán (PENDING_RENEWAL). Nếu quá 48 giờ mà chưa thanh toán hoặc khách chủ động hủy lệnh, giao dịch chuyển sang FAILED và giải phóng capacity."*

- [ ] **Step 4.6: Commit Git Phase 4**
  - Message: `feat(renewal): bổ sung sandbox dev bar, đếm ngược 48h và nút hủy thanh toán gia hạn`

## Files / Modules Affected
- `frontend/src/features/customer/pages/RenewalPage.tsx` (MODIFY)
- `docs/NOTION-AUDIT-ISSUES-AND-BR-CHANGES.md` (MODIFY)
- `docs/BUSINESS-RULES.md` (MODIFY)

## Dependencies
- Phụ thuộc Phase 02 (API `processSandboxTransfer` với action `CANCEL` và lưu vết transaction).

## Tests to Write First (TDD)
- Bổ sung test cases trong `RenewalPage.test.tsx` (hoặc test tương ứng):
  - Kiểm tra render Sandbox Dev Bar khi ở Bước 3.
  - Kiểm tra nút "Hủy lệnh thanh toán" mở hộp thoại xác nhận.
  - Kiểm tra đếm ngược hiển thị đúng theo mốc 48 giờ.

## Verification & Acceptance Criteria
- Lệnh kiểm tra: `npm test RenewalPage` hoặc `npm test`
- Thử nghiệm trên UI: Bước 3 hiển thị đầy đủ Sandbox Dev Bar, đếm ngược 48h và nút Hủy lệnh thanh toán hoạt động trơn tru.

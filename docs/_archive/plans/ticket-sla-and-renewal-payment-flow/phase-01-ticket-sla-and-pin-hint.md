# Phase 01: Chuẩn hóa Form Báo Sự Cố & Loại bỏ Checkbox SLA 2 Giờ

## Mục tiêu
Loại bỏ quyền tự gán cam kết SLA 2 giờ phía khách hàng trên form gửi yêu cầu hỗ trợ (Support Ticket). Toàn bộ quyền phân loại khẩn cấp (SLA 2h) do Quản lý cơ sở (FM) quyết định. Bổ sung banner hướng dẫn khách hàng tự xem/đổi mã PIN trực tiếp trên thẻ ô kho tại trang "Kho của tôi" nhằm giảm tải ticket không cần thiết.

## Phạm vi công việc (Concrete Tasks)

- [ ] **Step 1.1: Tạo file test kiểm chứng UI (`TicketSlaAudit.test.tsx`) theo TDD**
  - Tạo mới file: `frontend/src/features/customer/components/__tests__/TicketSlaAudit.test.tsx`
  - Viết test kiểm tra:
    1. Form `CreateSupportTicketModal` KHÔNG render checkbox "Sự cố khẩn cấp (Cam kết SLA xử lý tại chỗ trong vòng 2 giờ)".
    2. Category `LOCK_ACCESS` hiển thị nhãn "Khóa & Mã PIN", mô tả "Kẹt chốt cơ, hỏng bàn phím điện tử, cửa không nhận tín hiệu" và KHÔNG chứa chuỗi "(SLA 2h)".
    3. Khi chọn danh mục `LOCK_ACCESS`, hiển thị banner gợi ý xem/đổi PIN trực tiếp trên thẻ ô kho.
    4. Payload gửi đi (`onSubmit`) luôn có `isUrgent: false`.
  - Chạy `npm test TicketSlaAudit` -> xác nhận Red (test fail).

- [ ] **Step 1.2: Cập nhật component `CreateSupportTicketModal.tsx`**
  - Xóa bỏ state `isUrgent` (hoặc cố định `isUrgent: false`).
  - Xóa bỏ block giao diện checkbox `Sự cố khẩn cấp (Cam kết SLA xử lý tại chỗ trong vòng 2 giờ)`.
  - Cập nhật định nghĩa trong mảng `CATEGORIES`:
    - `key: 'LOCK_ACCESS'`
    - `label: 'Khóa & Mã PIN'`
    - `desc: 'Kẹt chốt cơ, hỏng bàn phím điện tử, cửa không nhận tín hiệu'`
    - Xóa `urgentDefault: true`.
  - Bổ sung Smart PIN Hint banner khi `selectedCategory === 'LOCK_ACCESS'`:
    - Hiển thị banner có icon `Info`: *"💡 Bạn quên mã PIN mở cửa? Bạn có thể xem lại hoặc đổi mã PIN mới trực tiếp trên thẻ ô kho tại trang 'Kho của tôi' mà không cần gửi yêu cầu hỗ trợ."*
  - Thay thế vùng checkbox SLA bằng Notice tiêu chuẩn:
    - *"Thời gian tiếp nhận & xử lý: Quản lý cơ sở (FM) sẽ tiếp nhận và đánh giá mức độ khẩn cấp của sự cố để điều phối nhân viên kỹ thuật có mặt hỗ trợ trong thời gian sớm nhất."*
  - Đảm bảo hàm `handleSubmit` gửi payload với `isUrgent: false`.

- [ ] **Step 1.3: Chạy test và xác nhận Green**
  - Chạy `npm test TicketSlaAudit` -> Pass 100%.

- [ ] **Step 1.4: Cập nhật tài liệu `docs/NOTION-AUDIT-ISSUES-AND-BR-CHANGES.md` (Mục 5)**
  - Đánh dấu trạng thái `[ĐÃ XONG]` cho Mục 5.
  - Ghi nhận chi tiết: Không cần tính năng cấp lại mã PIN qua OTP thừa thãi vì hệ thống đã hỗ trợ xem và đổi mã PIN trực tiếp trên thẻ ô kho; loại bỏ checkbox cam kết 2h phía khách; chuyển toàn quyền thẩm định khẩn cấp cho FM.

- [ ] **Step 1.5: Commit Git Phase 1**
  - Message: `fix(support): loại bỏ checkbox tự tick SLA 2h và bổ sung hướng dẫn xem đổi mã PIN`

## Files / Modules Affected
- `frontend/src/features/customer/components/CreateSupportTicketModal.tsx` (MODIFY)
- `frontend/src/features/customer/components/__tests__/TicketSlaAudit.test.tsx` (CREATE)
- `docs/NOTION-AUDIT-ISSUES-AND-BR-CHANGES.md` (MODIFY)

## Dependencies
- Không phụ thuộc vào các phase khác. Có thể thực hiện độc lập ngay từ đầu.

## Tests to Write First (TDD)
- Test suite `TicketSlaAudit.test.tsx`:
  - `testModalDoesNotContainSla2hCheckbox()`
  - `testLockAccessCategoryDescription()`
  - `testSmartPinHintBannerVisibleWhenLockAccessSelected()`
  - `testSubmitsWithIsUrgentFalse()`

## Verification & Acceptance Criteria
- Lệnh kiểm tra: `npm test TicketSlaAudit` -> Tất cả test cases pass.
- Không còn bất kỳ xuất hiện nào của checkbox tự tích SLA 2h trên form báo sự cố của khách.

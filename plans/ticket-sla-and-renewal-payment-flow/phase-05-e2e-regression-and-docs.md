# Phase 05: Kiểm Thử Hồi Quy Toàn Diện, Đồng Bộ Dashboard & Hoàn Tất DoD

## Mục tiêu
Thực hiện kiểm thử hồi quy toàn diện (End-to-End Regression Testing) cho cả hai tầng Backend và Frontend. Đảm bảo toàn bộ test suite xanh 100%, không phát sinh lỗi biên dịch hay type-check. Đồng bộ tiến độ vào Bảng điều hành dự án (`docs/DASHBOARD.md`) theo Quy tắc 3 Dòng và hoàn thiện tài liệu nghiệm thu.

## Phạm vi công việc (Concrete Tasks)

- [ ] **Step 5.1: Kiểm thử toàn bộ tầng Backend**
  - Chạy toàn bộ test suite backend:
    ```powershell
    mvn clean test
    ```
  - Xác nhận:
    - 100% test cases pass (bao gồm `CustomerRentalServiceTest`, `PaymentServiceTest`, `PaymentControllerTest`, v.v.).
    - Không có lỗi biên dịch, không có cảnh báo nghiêm trọng.

- [ ] **Step 5.2: Kiểm thử và Build toàn bộ tầng Frontend**
  - Chạy bộ test vitest frontend:
    ```powershell
    npm test -- --run
    ```
  - Chạy kiểm tra TypeScript và Build bundle Vite:
    ```powershell
    npm run build
    ```
  - Xác nhận:
    - Tất cả các test cases mới (`TicketSlaAudit.test.tsx`, `RenewalPendingTracking.test.tsx`, v.v.) và cũ đều pass.
    - Lệnh build Vite kết thúc thành công (Exit code 0), không có lỗi type check.

- [ ] **Step 5.3: Cập nhật Bảng điều hành `docs/DASHBOARD.md`**
  - Ghi nhận hoàn thành 2 issues Task 5 và Task 6 theo Quy tắc 3 Dòng:
    - **Vấn đề 5 (SLA Ticket & PIN Hint):** Đã xóa checkbox SLA 2h phía khách; bổ sung banner xem/đổi PIN trực tiếp trên thẻ ô kho; chuyển thẩm quyền đánh giá khẩn cấp cho FM.
    - **Vấn đề 6 (VietQR Renewal Flow):** Đã tích hợp Sandbox Dev Bar tại Bước 3; chuẩn hóa đếm ngược 48 giờ (`BR-REN-10`); lưu vết đơn `PENDING_RENEWAL` trên thẻ ô kho; bổ sung nút Hủy lệnh thanh toán hoàn chỉnh.
  - Cập nhật số liệu test và trạng thái hoàn thành sprint.

- [ ] **Step 5.4: Báo cáo kết quả và trình người dùng nghiệm thu**
  - Báo cáo tổng thể những thay đổi đã thực hiện.
  - Sẵn sàng kích hoạt lệnh commit và tạo Pull Request theo quy trình chuẩn.

## Files / Modules Affected
- `docs/DASHBOARD.md` (MODIFY)
- Toàn bộ test reports và bundle build.

## Dependencies
- Phụ thuộc hoàn thành Phase 01, Phase 02, Phase 03, Phase 04.

## Verification & Acceptance Criteria
- Lệnh Backend: `mvn clean test` -> `BUILD SUCCESS`
- Lệnh Frontend: `npm run build` -> Exit code 0
- Bảng điều hành `docs/DASHBOARD.md` được cập nhật đầy đủ và chính xác.

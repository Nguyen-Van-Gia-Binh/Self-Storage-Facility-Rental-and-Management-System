# Kế hoạch Triển khai: Chuẩn hóa SLA Báo Sự Cố & Luồng Thanh Toán Gia Hạn Hợp Đồng (VietQR)

Mode: hard
Risk: normal — Chỉnh sửa DTO response và logic tra cứu transaction gia hạn ở Backend; cập nhật form báo sự cố, thẻ ô kho và trang gia hạn ở Frontend; không cần migration CSDL do các trường đã có sẵn trong payment_transaction.
Test: --tdd
Tasks: default

## Tổng quan
Kế hoạch này giải quyết triệt để 2 vấn đề trọng tâm được chỉ ra trong Notion Audit (Mục 5 & Mục 6):
1. **Task 5 (SLA Ticket & PIN Hint):** Loại bỏ checkbox cam kết SLA 2 giờ phía khách hàng trên form gửi yêu cầu hỗ trợ; quyền đánh giá khẩn cấp (SLA 2h) do Quản lý cơ sở (FM) quyết định; bổ sung banner hướng dẫn khách hàng tự xem/đổi mã PIN trực tiếp trên thẻ ô kho mà không cần tạo ticket.
2. **Task 6 (VietQR Renewal Flow):** Bổ sung Sandbox Dev Bar tại Bước 3 trang gia hạn (`RenewalPage`), chuẩn hóa thời gian giữ chỗ 48 giờ (`BR-REN-10`), lưu vết giao dịch chờ thanh toán (`PENDING_RENEWAL`) trên thẻ ô kho với nút "Tiếp tục thanh toán", và cơ chế Hủy lệnh thanh toán hoàn chỉnh.

## Danh sách Phases

| Phase | Tên Phase | Trọng tâm thực hiện | Verification Command |
|---|---|---|---|
| `phase-01-ticket-sla-and-pin-hint` | Form Báo sự cố & SLA 2h | Xóa checkbox SLA 2h, thêm PIN hint, cập nhật category `LOCK_ACCESS`, cập nhật tài liệu Mục 5 | `npm test TicketSlaAudit` |
| `phase-02-backend-pending-renewal-tracking` | Backend Pending Renewal Tracking | Mở rộng DTO `CustomerRentalSummaryResponse`, tra cứu & auto-expire 48h trong `CustomerRentalServiceImpl`, tối ưu checkout link | `mvn test -Dtest=CustomerRentalServiceTest,PaymentServiceTest` |
| `phase-03-frontend-rented-unit-pending-badge` | Frontend Rented Unit Pending Badge | Bổ sung pending renewal vào API mapper, hiển thị badge amber và nút "Tiếp tục thanh toán" trên `RentedUnitCard` | `npm test RenewalPendingTracking` |
| `phase-04-frontend-renewal-sandbox-and-cancel` | Frontend RenewalPage Step 3 Upgrade | Tích hợp Sandbox Dev Bar, countdown 48h, nút Hủy thanh toán, cập nhật `BR-REN-10` trong `docs/BUSINESS-RULES.md` | `npm test` |
| `phase-05-e2e-regression-and-docs` | E2E Regression & Dashboard Sync | Chạy toàn bộ test suite backend và build frontend, cập nhật `docs/DASHBOARD.md` | `mvn clean test ; npm run build` |

## Ma trận Rủi ro & Giải pháp (Risks & Mitigations)

1. **Rủi ro rác giao dịch khi khách bấm gia hạn nhiều lần:**
   - *Giải pháp:* Tại `PaymentServiceImpl.createCheckoutLink`, kiểm tra nếu đã có transaction `PENDING` cho hợp đồng với cùng số tháng gia hạn và còn hiệu lực (< 48h), hệ thống sẽ tái sử dụng `orderCode` và link checkout cũ thay vì sinh giao dịch mới.
2. **Rủi ro treo trạng thái PENDING vĩnh viễn:**
   - *Giải pháp:* Trong `CustomerRentalServiceImpl`, khi nạp thông tin tóm tắt hợp đồng, nếu giao dịch `PENDING` đã quá 48 giờ (`now.isAfter(expiresAt)`), hệ thống lập tức tự động cập nhật trạng thái transaction thành `FAILED`, đảm bảo ô kho không bị khóa giữ chỗ ảo.
3. **Rủi ro xung đột route điều hướng:**
   - *Giải pháp:* Xác định chính xác route trang gia hạn trong `CustomerRoutes.tsx` là `/customer/renew/:contractId`. Link "Tiếp tục thanh toán" sẽ trỏ chuẩn xác đến: `/customer/renew/${contract.id}?orderCode=${contract.pendingRenewalOrderCode}&step=3`.

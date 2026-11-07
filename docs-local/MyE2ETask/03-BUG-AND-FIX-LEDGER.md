# 03. Sổ Theo dõi Lỗi & Khắc phục (Bug & Fix Ledger)

> **Nhật ký QA & Fix Bug Cá nhân:** **Nguyễn Văn Gia Bình** (WS2 — Lead Tech)  
> **Áp dụng:** Giai đoạn Kiểm thử Toàn diện & Sửa lỗi Hệ thống (Tuần 9)  
> **Quy tắc 3 Dòng:** Mỗi bug chỉ tóm tắt tối đa 30 từ, nêu thẳng hiện tượng, nguyên nhân gốc và hướng xử lý/mã commit.

---

## 1. 📋 Bảng Theo dõi Bug Flow 3 & Sub-flow 6.2

| Mã Bug | Phân hệ / Màn hình | Hiện tượng lỗi cốt lõi | Nguyên nhân & Hướng khắc phục | Commit / PR Fix | Trạng thái |
| :---: | :---: | :--- | :--- | :---: | :---: |
| **`BUG-WS2-01`** | Flow 3<br>`ScheduleReturnModal` | Khách bấm trả sớm vào ngày cuối tuần thì API trả lỗi 400 do không check ca trực của Staff. | Bổ sung hàm kiểm tra lịch trực của Staff theo `BR-CHK-01` trước khi cho phép chọn giờ hẹn trả kho trên modal. | `Đang kiểm tra` | `OPEN` |
| **`BUG-WS2-02`** | Flow 3<br>`SettlementService` | Tiền cọc hoàn trả bị âm nếu chi phí hư hại do nhân viên nhập lớn hơn tiền cọc hiện có. | Cài đặt logic chặn số âm: Nếu `damage_fee > deposit`, gán `refund_amount = 0` và sinh hóa đơn thu thêm theo `BR-RET-03`. | `Đang kiểm tra` | `OPEN` |
| **`BUG-WS2-03`** | Flow 3<br>`CancelReturnModal` | Khách bấm hủy trả kho nhưng trạng thái ô kho trong bảng `storage_unit` vẫn kẹt ở `PENDING_RETURN`. | Sửa `ContractReturnServiceImpl.cancelReturnRequest()` bổ sung lệnh cập nhật lại `unit.status = OCCUPIED` trong cùng transaction. | `Đang kiểm tra` | `OPEN` |
| **`BUG-WS2-04`** | Flow 6.2<br>`OverdueCronJob` | Tính phạt quá hạn bị lệch 1 ngày do server chạy múi giờ UTC thay vì UTC+7 (Giờ Hà Nội). | Thêm cấu hình `@Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Ho_Chi_Minh")` theo đúng quy tắc múi giờ `BR-GEN-06`. | `Đang kiểm tra` | `OPEN` |
| **`BUG-WS2-05`** | Flow 6.2<br>`AccessCodeService` | Hợp đồng chuyển sang `OVERDUE_LOCKED` ở ngày D+7 nhưng mã PIN vẫn mở được cửa cổng chính. | Bổ sung kiểm tra ràng buộc trạng thái hợp đồng `OVERDUE_LOCKED` trong phương thức xác thực `verifyPin()` của AccessCodeService. | `Đang kiểm tra` | `OPEN` |
| **`BUG-WS2-06`** | Flow 6.2<br>`VietQR Payment` | Khách nộp phạt thành công nhưng giao diện không tự reload mở lại nút bấm Đăng ký trả kho. | Bổ sung WebSocket event hoặc polling 3s sau khi quét QR để cập nhật state hợp đồng sang `OVERDUE_CLEARED`. | `Đang kiểm tra` | `OPEN` |
| **`E2E-WS2-01`** | Flow 3<br>`Playwright Suite` | Kiểm chứng tự động chuỗi nghiệp vụ Multi-Actor 3 bên (Khách báo trả -> Nhân viên nghiệm thu -> Quản lý quyết toán cọc Win-Win). | Tự động hóa qua Playwright E2E (`flow3-return-settlement.spec.ts`) với 3 browser context độc lập và Data-Driven Testing (`settlement-cases.json`). | `f68b0d1`, `3791b88` | `VERIFIED` |

---

## 2. 📝 Mẫu Ghi chép Nhanh khi Phát hiện Bug Mới (Template)

Khi chạy test phát hiện bug mới, copy template này dán vào bảng trên:

```markdown
| `BUG-WS2-xx` | Phân hệ / File | [Hiện tượng ngắn gọn] | [Nguyên nhân & Hướng fix trong 1-2 câu] | `SHA-commit` | `OPEN / FIXED / VERIFIED` |
```

---

## 3. 🔍 Danh mục Kiểm tra An toàn trước khi Báo cáo Xong (Sanity Checklist)

- [x] **Không sót Exception không xử lý:** Mọi trường hợp lỗi nghiệp vụ (như hủy sai trạng thái, thanh toán trùng) đều trả về mã lỗi rõ ràng (`400 Bad Request` hoặc `409 Conflict`) kèm message tiếng Việt dễ hiểu.
- [x] **Đảm bảo tính ACID của Transaction:** Mọi thao tác đổi trạng thái hợp đồng đi kèm cập nhật trạng thái ô kho hoặc vô hiệu hóa mã PIN đều phải bọc trong `@Transactional`.
- [x] **Không rò rỉ dữ liệu (Multi-Facility Security):** Nhân viên cơ sở A không thể bấm nghiệm thu hợp đồng của cơ sở B (Kiểm tra `@facilitySecurity.canAccessFacility`).

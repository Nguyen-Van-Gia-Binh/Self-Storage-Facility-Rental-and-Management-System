# Bảng Điều hành Trung tâm (Project Dashboard)

> **Self-Storage Facility Rental and Management System (SWP391)**  
> **Bộ nhớ làm việc duy nhất (Single Working Memory)** dành cho Nhóm phát triển và Trợ lý AI.  
> *Tất cả trạng thái sprint, phân công 4 Workstream và sổ theo dõi Issue/Bug được cập nhật trực tiếp tại đây.*

---

## Mục lục
1. [🎯 Trọng tâm hiện tại (Current Focus)](#1--trọng-tâm-hiện-tại-current-focus)
2. [🚨 Sổ Vấn đề & Bug Tinh gọn (Lean Issue Tracker)](#2--sổ-vấn-đề--bug-tinh-gọn-lean-issue-tracker)
3. [📊 Ma trận Tiến độ 4 Workstream](#3--ma-trận-tiến-độ-4-workstream)
4. [🤖 Chỉ dẫn Tương tác dành cho AI](#4--chỉ-dẫn-tương-tác-dành-cho-ai)

---

## 1. 🎯 Trọng tâm hiện tại (Current Focus)

* **Giai đoạn:** Sprint Hoàn thiện Nghiệp vụ & Kiểm thử Tích hợp (Integration & Polish).
* **Mục tiêu chính:** Đồng bộ luồng điều phối nhân sự, kiểm thử e2e các luồng chính (Booking → Check-in → Return), xử lý các điểm nghẽn giao diện và tối ưu hóa hiệu năng.

### Phân công Trách nhiệm (4 Workstreams):
| Workstream | Người phụ trách | Trọng tâm công việc | Nhánh Git / Trạng thái |
| :--- | :--- | :--- | :--- |
| **WS1: Khách hàng & Đặt chỗ** | **Xuân Nhi** | Hoàn thiện Flow 1 (Booking), Flow 6.1 (Gia hạn), Bộ lọc Catalog | `main` (Hoàn thành cơ bản) |
| **WS2: Cơ sở & Vận hành** | **Gia Bình** | Flow 2 (Check-in Desk), Flow 3 (Nghiệm thu Trả kho), Sơ đồ ô kho | `main` (Đã nối Real API) |
| **WS3: Tài chính & Tự động** | **Huỳnh Nhật** | Flow 4 (Bảng giá BOM), Flow 6.2 (Phí quá hạn & Thanh toán nợ), VietQR | `main` (Hoàn thành cơ bản) |
| **WS4: Quản trị & Điều phối** | **Thanh Tùng** | Flow 5 (Điều phối nhân viên FM), Flow 7 (Ticket sự cố), Báo cáo | `main` (Đã merge API điều phối #160) |

---

## 2. 🚨 Sổ Vấn đề & Bug Tinh gọn (Lean Issue Tracker)

> **Quy tắc 3 Dòng:** Mỗi vấn đề chỉ tóm tắt tối đa 30 từ, nêu thẳng hiện tượng cốt lõi và hướng xử lý.  
> Không viết dài dòng. Khi giải quyết xong, đổi trạng thái sang `RESOLVED` kèm mã commit/PR.

| Mã | Hiện tượng & Vấn đề cốt lõi | Hướng xử lý | Phụ trách | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| `ISS-13` | Cột `end_date` trong Contract/Renewal chưa rõ là bao gồm hay loại trừ ngày cuối. | Thống nhất quy ước khoảng nửa mở `[start_date, end_date_exclusive)`. | Tùng / Nhật | `OPEN` |
| `ISS-14` | Dư thừa nơi lưu nợ quá hạn và chi phí hư hỏng (Contract vs Ledger). | Chỉ định Contract là bản chính; Ledger là lịch sử giao dịch. | Tùng / Nhật | `OPEN` |
| `ISS-15` | Sổ cái `ledger_entry.amount` chưa quy ước âm/dương cho hoàn tiền. | Quy định `amount` luôn dương, chiều tiền do `entry_type` (`CREDIT`/`DEBIT`) xác định. | Nhật | `OPEN` |
| `ISS-17` | Nguy cơ race condition khi hai khách đặt cùng 1 ô kho cùng lúc. | Bổ sung `@Version` (`rowversion`) trên bảng `storage_unit` để khóa lạc quan. | Tùng / Bình | `OPEN` |
| `ISS-18` | Ràng buộc duy nhất trên `handover_record` chặn việc tạo lại sau khi hủy bàn giao. | Chuyển sang Unique Index có điều kiện: `WHERE status <> 'CANCELLED'`. | Tùng | `OPEN` |
| `ISS-23` | Bảng danh mục `unit_type` thiếu cờ ngừng hoạt động (Soft Delete). | Đã bổ sung `is_active BIT` qua migration `V4` và API cập nhật. | Bình | `RESOLVED` (#157) |
| `ISS-35` | Giao diện thiếu thông tin tầng, diện tích, thể tích ô kho. | Đã thêm cột `floor`, `position` và tính toán động `areaM2`, `volumeM3`. | Bình | `RESOLVED` (#157) |
| `ISS-36` | Màn hình Staff Return Inspection hiển thị lẫn lộn nhiệm vụ khác cơ sở. | Đã bổ sung bộ chọn cơ sở và ràng buộc chỉ xem nhiệm vụ được Manager phân công. | Bình / Tùng | `RESOLVED` (#160) |
| `ISS-37` | Sơ đồ mặt bằng và số ô trống chưa phản ánh động theo kỳ hạn thuê. | Đã hỗ trợ tham số startDate/rentalMonths tại API storage-units và đồng bộ UI. | Bình / Nhi | `RESOLVED` |
| `ISS-38` | Khách chưa đăng nhập bị lỗi 403 đỏ ở Hỗ trợ, thấy ô ảo ở Kho của tôi và đặt kho sai ID. | Bổ sung Auth Guard đồng bộ, prompt đăng nhập trang nhã và bảo vệ Booking flow. | Nhi | `RESOLVED` |
| `ISS-39` | Thiếu role canonical trong `@PreAuthorize` StaffSupportController và alias authorities. | Đã bổ sung canonical role + alias vào UserPrincipal và controller. | Bình | `RESOLVED` |
| `ISS-40` | Lỗ hổng Header Spoofing cho phép giả mạo `X-Staff-Id`, `X-Manager-Id`. | Bỏ header giả mạo, xác thực danh tính qua `@AuthenticationPrincipal UserPrincipal`. | Bình | `RESOLVED` |
| `ISS-41` | Rò rỉ dữ liệu đa cơ sở của FM và Staff khi thao tác contract/storage-unit. | Tích hợp `FacilitySecurityService` và kiểm tra quyền cơ sở gán cho nhân sự. | Bình | `RESOLVED` |
| `ISS-42` | Đặt chỗ ẩn danh (Anonymous booking) tự động gán khách hàng mặc định ID=1L. | Bắt buộc xác thực, ném UNAUTHORIZED nếu chưa đăng nhập và kích hoạt Auth Guard. | Bình / Nhi | `RESOLVED` |
| `ISS-43` | Rò rỉ phiên làm việc do `clearSession()` không xóa sạch mock override và sessionStorage. | Dọn sạch toàn bộ key `smartstorage_*`, `selfstorage_*` và `sessionStorage`. | Bình | `RESOLVED` |
| `ISS-44` | Đặt chỗ hiển thị mock Tân Bình Flagship và gọi sai endpoint catalog ô kho. | Nối Real API `/facilities`, `/storage-units` và ánh xạ động tên cơ sở theo ID. | Bình / Nhi | `RESOLVED` |
| `ISS-45` | Hợp đồng PENDING_RETURN bị mất mã PIN trên API và hiển thị nút Gia hạn trên UI. | Giữ accessCode cho PENDING_RETURN, ẩn nút Gia hạn theo BR-REN-02, thêm migration V26. | Bình | `RESOLVED` (#167) |
| `ISS-46` | Nộp phạt quá hạn OVERDUE_PENALTY tự chuyển hợp đồng về ACTIVE (sai BR-OVD-08). | Giữ nguyên OVERDUE, xóa nợ phạt về 0 để mở quyền báo trả kho (PENDING_RETURN). | Bình / Nhật | `RESOLVED` |
| `ISS-47` | Thiếu khóa mã PIN tại mốc D+7 (BR-OVD-05) ở backend, còn frontend khóa sớm ở D+4. | Cronjob khóa accessCode tại D+7; Frontend chỉ khóa hiển thị mã PIN khi D+7. | Bình | `RESOLVED` |
| `ISS-48` | Thiếu đệm an toàn 15 ngày gối đầu và lỗi tự động chọn sẵn ô kho mặc định. | Cập nhật SQL buffer 15 ngày (DATEADD) và bỏ auto-select trên UnitPickerPage. | Bình / Nhi | `RESOLVED` |
| `ISS-49` | PaymentController và các trang thanh toán thiếu Auth Guard. | Thêm @PreAuthorize("isAuthenticated()") và Auth Guard redirect login. | Bình | `RESOLVED` |

*(Lịch sử thảo luận chi tiết của các vấn đề cũ trước đây được lưu tại [docs/_archive/OPEN-ISSUES-LEGACY.md](_archive/OPEN-ISSUES-LEGACY.md))*

---

## 3. 📊 Ma trận Tiến độ 4 Workstream

| Phân hệ / Tính năng | Luồng (Flow) | Backend API | Frontend UI | E2E Test | Ghi chú |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Catalog & Tìm kiếm kho** | Flow 1 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Hỗ trợ lọc theo diện tích, loại kho |
| **Đặt chỗ & Thanh toán cọc** | Flow 1 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | VietQR tích hợp PayOS / Mock |
| **Bàn giao kho (Check-in)** | Flow 2 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Staff e-Form ký nhận & cấp mã |
| **Quản lý kho đang thuê** | Flow 3 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Xem chi tiết, gia hạn, báo trả kho |
| **Nghiệm thu trả kho & Tất toán**| Flow 3 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Manager phân công, Staff nghiệm thu |
| **Bảng giá & Chính sách BOM** | Flow 4 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Cấu hình giá, chiết khấu |
| **Điều phối nhân sự cơ sở** | Flow 5 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Phân công ca trực và tiếp nhận việc |
| **Gia hạn thuê online** | Flow 6.1 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Thanh toán tiền thuê chu kỳ mới |
| **Cronjob Quá hạn & Khóa mã** | Flow 6.2 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Tự động tính phí D+1, khóa mã D+4 |
| **Xử lý sự cố & Báo cáo** | Flow 7 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Gửi ticket, phản hồi và đóng sự cố |

---

## 4. 🤖 Chỉ dẫn Tương tác dành cho AI

Khi bắt đầu một phiên làm việc mới với Antigravity / Gemini / Claude:
1. **Đọc Dashboard trước:** Luôn đọc file này để biết trạng thái mới nhất của dự án và Workstream bạn đang tham gia.
2. **Tuân thủ quy chuẩn Zero-Conflict:** Chỉ chỉnh sửa trong phạm vi Backend/Frontend của Workstream được giao (xem [docs/PLAN.md](PLAN.md)).
3. **Cập nhật trạng thái sau khi xong task:** 
   - Nếu giải quyết xong một issue trong bảng: Đổi trạng thái sang `RESOLVED`.
   - Nếu phát hiện vấn đề kỹ thuật mới: Thêm 1 dòng mới vào Bảng Sổ Vấn đề theo đúng Quy tắc 3 dòng.

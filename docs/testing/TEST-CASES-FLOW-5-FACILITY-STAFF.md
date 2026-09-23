# Test Suite: Flow 5 — Quản lý kho cơ sở & Điều phối nhân sự (Facility Storage & Staff Management Flow)

> **Tài liệu tham chiếu:** [TOPIC.md § 4.5](../TOPIC.md#flow-5--facility-storage-and-staff-management-flow) · [USE-CASES.md § 6](../USE-CASES.md#6-flow-5--facility-storage-and-staff-management) · [BUSINESS-RULES.md § 13](../BUSINESS-RULES.md#13-vòng-đời-trạng-thái) · [API-SPEC.md](../API-SPEC.md)  
> **Workstream phụ trách:** WS4 (Quản trị & Điều phối) · Phối hợp: WS2  
> **Mã Use Case bao phủ:** `UC-F5-01` đến `UC-F5-08` (8 Use Cases)  
> **Mã Yêu cầu bao phủ:** `FM-01`, `FM-05`, `FM-06`, `FS-06`, `SA-02`, `SA-03`

---

## 1. Danh sách ca kiểm thử (Test Cases Summary)

| Test Case ID | Test Summary | Use Case | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-F5-001` | Facility Manager tạo mới loại ô kho (Unit Type) kèm kích thước và tiện ích | `UC-F5-01` | Positive | P1 |
| `TC-F5-002` | Chặn xóa mềm hoặc vô hiệu hóa Unit Type khi vẫn còn ô kho vật lý liên kết | `UC-F5-01` | Negative / Constraint | P2 |
| `TC-F5-003` | FM tạo mới và cấu hình vị trí ô kho vật lý (Storage Unit) theo tầng và khu vực | `UC-F5-02` | Positive | P1 |
| `TC-F5-004` | Chuyển trạng thái ô kho thủ công sang *Maintenance* (Bảo trì) khi trống | `UC-F5-03` | State Transition | P1 |
| `TC-F5-005` | Chặn chuyển ô kho sang *Maintenance* nếu đang có hợp đồng *Active* hoặc *Reserved* | `UC-F5-03` | Business Rule / Negative | P1 |
| `TC-F5-006` | Facility Manager phân công ca trực và nhiệm vụ đón tiếp cho Facility Staff | `UC-F5-04` | Positive | P1 |
| `TC-F5-007` | Facility Staff xem danh sách công việc hằng ngày (Checklist bàn giao, trả kho, sự cố) | `UC-F5-05` | Positive / UI | P1 |
| `TC-F5-008` | Facility Manager xem báo cáo cơ sở: tỷ lệ lấp đầy, doanh thu và hợp đồng quá hạn | `UC-F5-06` | Reporting | P1 |
| `TC-F5-009` | System Administrator gán vai trò người dùng (Customer, Staff, FM, BOM, Admin) | `UC-F5-07` | Security / RBAC | P1 |
| `TC-F5-010` | Cấu hình phân quyền dữ liệu theo cơ sở: FM cơ sở A bị chặn truy cập cơ sở B | `UC-F5-08` | Security / Multi-facility | P1 |

---

## 2. Chi tiết các ca kiểm thử (Detailed Test Specifications)

### `TC-F5-001`: Facility Manager tạo mới loại ô kho (Unit Type) kèm kích thước và tiện ích
* **Traceability:** `FM-01` · `UC-F5-01`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Facility Manager đăng nhập (`fm_user_q9`).
* **Test Steps:**
  1. Vào menu "Quản lý loại ô kho" (`/manager/unit-types`).
  2. Bấm "Thêm loại kho mới".
  3. Điền thông tin:
     - Tên loại kho: "Kho mini điều hòa (Small Climate-Controlled)"
     - Mã loại: `UT_MINI_AC`
     - Kích thước: Dài 1.5m x Rộng 1.5m x Cao 2.5m
     - Thể tích tự động tính: $1.5 \times 1.5 \times 2.5 = 5.625\ \text{m}^3$
     - Tiện ích: Đánh dấu [x] Kiểm soát nhiệt độ, [x] Đèn chiếu sáng, [x] Báo khói.
  4. Bấm "Lưu".
* **Expected Result:**
  - Loại ô kho mới được tạo thành công với trạng thái `ACTIVE`.
  - Thể tích được hệ thống tự động tính chính xác $5.625\ \text{m}^3$.
  - Xuất hiện trên bảng danh mục loại kho để gán ô kho vật lý.

---

### `TC-F5-002`: Chặn xóa mềm hoặc vô hiệu hóa Unit Type khi vẫn còn ô kho vật lý liên kết
* **Traceability:** `FM-01` · `UC-F5-01`
* **Test Type:** Integrity / Constraint (Negative) · **Priority:** P2 (High)
* **Pre-conditions:** Loại ô kho `Medium Unit` hiện đang liên kết với 15 ô kho vật lý tại cơ sở.
* **Test Steps:**
  1. FM chọn loại kho `Medium Unit` và chọn thao tác "Xóa / Vô hiệu hóa".
* **Expected Result:**
  - Hệ thống từ chối thực hiện, trả về thông báo lỗi: *"Không thể xóa loại ô kho này vì hiện đang có 15 ô kho vật lý thuộc loại này. Vui lòng chuyển đổi hoặc xóa các ô kho trước."*
  - Bản ghi Unit Type giữ nguyên trạng thái `ACTIVE`.

---

### `TC-F5-003`: FM tạo mới và cấu hình vị trí ô kho vật lý (Storage Unit) theo tầng và khu vực
* **Traceability:** `FM-01` · `UC-F5-02`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** FM đang ở trang quản lý ô kho tại Cơ sở Quận 9.
* **Test Steps:**
  1. Vào mục "Danh sách ô kho vật lý" (`/manager/units`).
  2. Bấm "Thêm ô kho".
  3. Nhập: Mã ô kho: `M-201`, Loại kho: `Medium Unit`, Tầng: `Tầng 2`, Khu vực: `Khu B (Zone B)`, Vị trí trên sơ đồ: Tọa độ $(X: 120, Y: 80)$.
  4. Bấm "Lưu ô kho".
* **Expected Result:**
  - Ô kho `M-201` được tạo thành công với trạng thái khởi tạo `AVAILABLE`.
  - Ô kho hiển thị chính xác vị trí trên sơ đồ mặt bằng Tầng 2.

---

### `TC-F5-004`: Chuyển trạng thái ô kho thủ công sang Maintenance (Bảo trì) khi trống
* **Traceability:** `FM-01` · `UC-F5-03` · `BR-AVL-01`
* **Test Type:** State Transition · **Priority:** P1 (Critical)
* **Pre-conditions:** Ô kho `M-201` đang ở trạng thái `AVAILABLE`.
* **Test Steps:**
  1. FM chọn ô kho `M-201`.
  2. Chọn "Chuyển sang bảo trì", nhập lý do: "Sơn sửa lại sàn epoxy".
  3. Xác nhận.
* **Expected Result:**
  - Trạng thái ô kho chuyển sang `MAINTENANCE`.
  - Trên sơ đồ mặt bằng, ô kho chuyển sang màu xám đậm (Bảo trì).
  - Ô kho tự động bị loại khỏi danh sách ô kho khả dụng khi khách hàng tìm kiếm thuê.

---

### `TC-F5-005`: Chặn chuyển ô kho sang Maintenance nếu đang có hợp đồng Active hoặc Reserved
* **Traceability:** `FM-01` · `UC-F5-03`
* **Test Type:** Business Rule / Negative · **Priority:** P1 (Critical)
* **Pre-conditions:** Ô kho `M-102` đang có hợp đồng thuê ở trạng thái `ACTIVE` (hoặc đang có Reservation `RESERVED`).
* **Test Steps:**
  1. FM cố gắng đổi trạng thái ô kho `M-102` sang `MAINTENANCE`.
* **Expected Result:**
  - Hệ thống từ chối thao tác, trả về mã lỗi `409 Conflict`.
  - Thông báo hiển thị: *"Không thể đưa ô kho vào bảo trì vì ô kho đang được thuê hoặc đang có lịch đặt trước. Vui lòng xử lý đổi kho cho khách trước."*

---

### `TC-F5-006`: Facility Manager phân công ca trực và nhiệm vụ đón tiếp cho Facility Staff
* **Traceability:** `FM-05` · `UC-F5-04`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** FM đang quản lý 2 nhân viên: Staff A và Staff B.
* **Test Steps:**
  1. Vào menu "Phân công nhân sự" (`/manager/staff-schedule`).
  2. Chọn ngày: Ngày mai (`24/09/2026`).
  3. Phân công: Staff A trực ca sáng (07:00 - 15:00), Staff B trực ca chiều (14:30 - 22:00).
  4. Gán nhiệm vụ phụ trách chính cho Staff A: "Tiếp đón 4 khách check-in hẹn trước".
  5. Bấm "Ban hành lịch trực".
* **Expected Result:**
  - Lịch trực được lưu thành công vào bảng `staff_schedule`.
  - Hệ thống gửi thông báo nhắc lịch làm việc đến tài khoản của Staff A và Staff B.

---

### `TC-F5-007`: Facility Staff xem danh sách công việc hằng ngày (Checklist bàn giao, trả kho, sự cố)
* **Traceability:** `FS-06` · `UC-F5-05`
* **Test Type:** Functional / UI (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Staff A đăng nhập vào đầu ca trực sáng.
* **Test Steps:**
  1. Vào trang "Công việc trong ngày" (`/staff/daily-tasks`).
* **Expected Result:**
  - Giao diện hiển thị thành 3 cụm tab rõ ràng:
    - **Lịch nhận kho (Check-in):** 4 khách theo khung giờ hẹn (Tên, Mã đặt chỗ, Giờ hẹn).
    - **Lịch trả kho (Return):** 2 khách đến hạn trả kho cần kiểm tra hiện trường.
    - **Yêu cầu hỗ trợ (Support):** 1 yêu cầu cần kiểm tra ổ khóa kẹt.
  - Mỗi tác vụ có nút bấm trực tiếp để mở e-Form tương ứng (Bàn giao, Nghiệm thu, Ticket).

---

### `TC-F5-008`: Facility Manager xem báo cáo cơ sở: tỷ lệ lấp đầy, doanh thu và hợp đồng quá hạn
* **Traceability:** `FM-06` · `UC-F5-06`
* **Test Type:** Reporting (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** FM đăng nhập vào Cơ sở Quận 9.
* **Test Steps:**
  1. Vào trang "Báo cáo cơ sở" (`/manager/reports`).
* **Expected Result:**
  - Hiển thị đầy đủ 4 thẻ chỉ số quan trọng (KPI Cards):
    1. Tổng số ô kho & Tỷ lệ lấp đầy: $75\%$ (Xanh lá).
    2. Doanh thu lũy kế tháng của cơ sở: $62.500.000\ \text{VND}$.
    3. Số lượng hợp đồng sắp đến hạn trả trong 30 ngày: 5 hợp đồng.
    4. Số lượng hợp đồng đang quá hạn (Overdue): 1 trường hợp (cảnh báo đỏ).

---

### `TC-F5-009`: System Administrator gán vai trò người dùng (Customer, Staff, FM, BOM, Admin)
* **Traceability:** `SA-02` · `UC-F5-07`
* **Test Type:** Security / RBAC · **Priority:** P1 (Critical)
* **Pre-conditions:** System Administrator đăng nhập (`sys_admin`).
* **Test Steps:**
  1. Vào trang "Quản lý phân quyền" (`/admin/roles`).
  2. Chọn tài khoản `user_tung_01`.
  3. Gán vai trò: `ROLE_FACILITY_MANAGER`.
  4. Bấm "Cập nhật vai trò".
  5. Đăng nhập bằng tài khoản `user_tung_01`.
* **Expected Result:**
  - Người dùng `user_tung_01` có toàn quyền truy cập các tính năng của Facility Manager.
  - Tuyệt đối không thể truy cập các trang quản trị của System Administrator (ví dụ `/admin/users`) -> Nhận mã lỗi `403 Forbidden`.

---

### `TC-F5-010`: Cấu hình phân quyền dữ liệu theo cơ sở: FM cơ sở A bị chặn truy cập cơ sở B
* **Traceability:** `SA-03` · `UC-F5-08`
* **Test Type:** Security / Multi-facility Isolation · **Priority:** P1 (Critical)
* **Pre-conditions:** Tài khoản `fm_quan9` được gán phụ trách Cơ sở Quận 9 (`facilityId = 1`). Cơ sở Quận 7 có `facilityId = 2`.
* **Test Steps:**
  1. Tài khoản `fm_quan9` đăng nhập.
  2. Cố tình gửi yêu cầu API lấy danh sách hợp đồng của Cơ sở Quận 7: `GET /api/v1/manager/facilities/2/contracts`.
* **Expected Result:**
  - Hệ thống kiểm tra quyền hạn dữ liệu (Facility Scoped Permission).
  - Backend từ chối truy cập và trả về mã lỗi HTTP `403 Forbidden` kèm thông báo: *"Bạn không có quyền quản trị dữ liệu của cơ sở này."*
  - Dữ liệu giữa các cơ sở hoàn toàn được cô lập bảo mật.

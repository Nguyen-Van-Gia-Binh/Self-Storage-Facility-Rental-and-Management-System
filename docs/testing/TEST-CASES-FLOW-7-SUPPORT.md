# Test Suite: Flow 7 — Yêu cầu hỗ trợ & Xử lý sự cố (Support Request & Incident Handling Flow)

> **Tài liệu tham chiếu:** [TOPIC.md § 5.2](../TOPIC.md#flow-7--support-request-and-issue-handling-flow) · [USE-CASES.md § 8](../USE-CASES.md#8-flow-7--support-request-and-issue-handling) · [BUSINESS-RULES.md § 12](../BUSINESS-RULES.md#12-support--on-site-sla--hỗ-trợ-và-xử-lý-sự-cố) · [API-SPEC.md](../API-SPEC.md)  
> **Workstream phụ trách:** WS4 (Quản trị & Điều phối) · Phối hợp: WS1, WS2  
> **Mã Use Case bao phủ:** `UC-F7-01` đến `UC-F7-08` (8 Use Cases)  
> **Mã Yêu cầu bao phủ:** `SC-06`, `FS-03`, `FS-05`, `FM-05`

---

## 1. Danh sách ca kiểm thử (Test Cases Summary)

| Test Case ID | Test Summary | Use Case | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-F7-001` | Khách hàng gửi yêu cầu hỗ trợ sự cố khẩn cấp (Lỗi mã PIN không mở được cửa) | `UC-F7-01` | Positive | P1 |
| `TC-F7-002` | Khách gửi ticket báo ô kho bị hư hại / ẩm mốc kèm ảnh chụp đính kèm | `UC-F7-01` | Positive | P2 |
| `TC-F7-003` | Khách hàng theo dõi tiến độ xử lý và trao đổi tin nhắn trực tiếp trên Ticket | `UC-F7-02` | Positive / UI | P2 |
| `TC-F7-004` | Facility Manager tiếp nhận, phân loại ưu tiên và kích hoạt cam kết SLA trong 2 giờ | `UC-F7-03` | Workflow / SLA | P1 |
| `TC-F7-005` | Facility Manager phân công Facility Staff phụ trách xử lý sự cố tại hiện trường | `UC-F7-04` | Positive | P1 |
| `TC-F7-006` | Staff xử lý sự cố mất chìa khóa: Cắt khóa cũ, thay ổ khóa mới và thu phí dịch vụ | `UC-F7-05` | Operational | P1 |
| `TC-F7-007` | Staff xử lý sự cố lỗi mã PIN: Reset mã PIN 6 số mới và bàn giao an toàn | `UC-F7-05` | Security / Access | P1 |
| `TC-F7-008` | Cập nhật ô kho sang *Maintenance* khi phát hiện hư hại nặng cần sửa chữa lớn | `UC-F7-06`, `UC-F7-07` | State Transition | P1 |
| `TC-F7-009` | Nhân viên hoàn tất xử lý hiện trường và chuyển trạng thái Ticket sang *Resolved* | `UC-F7-08` | Positive | P1 |
| `TC-F7-010` | Khách hàng đánh giá mức độ hài lòng và xác nhận đóng Ticket | `UC-F7-08` | Positive | P2 |
| `TC-F7-011` | Hệ thống tự động đóng Ticket sau 7 ngày làm việc khách không phản hồi | `UC-F7-08` | System Automation | P2 |

---

## 2. Chi tiết các ca kiểm thử (Detailed Test Specifications)

### `TC-F7-001`: Khách hàng gửi yêu cầu hỗ trợ sự cố khẩn cấp (Lỗi mã PIN không mở được cửa)
* **Traceability:** `SC-06` · `UC-F7-01` · `BR-SUP-01`, `BR-SUP-02`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Khách hàng đang có mặt tại cơ sở, nhập mã PIN nhưng khóa báo lỗi đỏ không mở được cửa kho `M-102`.
* **Test Steps:**
  1. Khách hàng mở ứng dụng, vào mục "Hỗ trợ & Báo sự cố" (`/customer/support/new`).
  2. Chọn loại sự cố: "Lỗi truy cập / Mã PIN (Khẩn cấp)".
  3. Chọn ô kho bị lỗi: `M-102`.
  4. Mô tả: "Nhập mã PIN 482910 nhưng bàn phím báo tít đỏ 3 lần, đang cần lấy đồ gấp".
  5. Bấm "Gửi yêu cầu".
* **Expected Result:**
  - Hệ thống tạo ticket mới với mã `TCK-7001`.
  - Mức độ ưu tiên tự động gán là `URGENT` (Khẩn cấp).
  - Đồng hồ đếm ngược SLA cam kết xử lý 2 giờ (`support.urgent_sla_hours = 2`) bắt đầu chạy.
  - Âm thanh và thông báo đỏ hiển thị tức thì trên Dashboard của Facility Manager và Staff trực ca.

---

### `TC-F7-002`: Khách gửi ticket báo ô kho bị hư hại / ẩm mốc kèm ảnh chụp đính kèm
* **Traceability:** `SC-06` · `UC-F7-01`
* **Test Type:** Functional / Media Upload · **Priority:** P2 (High)
* **Pre-conditions:** Khách hàng phát hiện vách ngăn ô kho bị thấm ẩm sau trận mưa lớn.
* **Test Steps:**
  1. Vào form tạo yêu cầu hỗ trợ.
  2. Chọn loại sự cố: "Cơ sở vật chất / Hư hại ô kho".
  3. Tải lên 2 tệp ảnh chụp hiện trường (định dạng JPG/PNG, dung lượng < 5MB).
  4. Bấm "Gửi yêu cầu".
* **Expected Result:**
  - Ticket tạo thành công với mức độ ưu tiên `NORMAL`.
  - Ảnh đính kèm hiển thị xem trước rõ ràng trên màn hình quản trị của FM và Staff.
  - Validation: Nếu đính kèm file sai định dạng (ví dụ `.exe`) hoặc vượt quá dung lượng cho phép, hệ thống cảnh báo chặn tải lên.

---

### `TC-F7-003`: Khách hàng theo dõi tiến độ xử lý và trao đổi tin nhắn trực tiếp trên Ticket
* **Traceability:** `SC-06` · `UC-F7-02`
* **Test Type:** Functional / Communication · **Priority:** P2 (High)
* **Pre-conditions:** Ticket `TCK-7001` đang ở trạng thái `IN_PROGRESS`.
* **Test Steps:**
  1. Khách hàng mở chi tiết Ticket `TCK-7001`.
  2. Nhập bình luận: "Em đang đứng trước cửa ô kho M-102 ạ".
  3. Bấm "Gửi tin nhắn".
* **Expected Result:**
  - Tin nhắn xuất hiện ngay trên khung chat/trao đổi của ticket (Realtime / Polling).
  - Nhân viên phụ trách nhìn thấy tin nhắn và có thể phản hồi lại cho khách.

---

### `TC-F7-004`: Facility Manager tiếp nhận, phân loại ưu tiên và kích hoạt SLA trong 2 giờ
* **Traceability:** `FM-05` · `UC-F7-03` · `BR-SUP-01`
* **Test Type:** Workflow / SLA Management · **Priority:** P1 (Critical)
* **Pre-conditions:** Ticket `TCK-7001` ở trạng thái `NEW`.
* **Test Steps:**
  1. Facility Manager đăng nhập, mở danh sách "Yêu cầu hỗ trợ cơ sở" (`/manager/support`).
  2. Mở ticket `TCK-7001`, duyệt qua thông tin.
  3. Bấm "Tiếp nhận yêu cầu".
* **Expected Result:**
  - Trạng thái ticket chuyển từ `NEW` sang `ASSIGNED`.
  - Hệ thống ghi nhận SLA: Deadline xử lý là $T_0 + 2\ \text{giờ}$.
  - Nếu quá 2 giờ chưa xử lý: Hệ thống hiển thị cảnh báo đỏ "SLA Violated / Quá hạn xử lý".

---

### `TC-F7-005`: Facility Manager phân công Facility Staff phụ trách xử lý sự cố tại hiện trường
* **Traceability:** `FM-05` · `UC-F7-04`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** FM đang ở màn hình phân công ticket `TCK-7001`.
* **Test Steps:**
  1. Tại trường "Nhân viên xử lý", chọn: "Nguyễn Văn Staff A" (nhân viên đang trực tại khu vực tầng 1).
  2. Bấm "Giao việc".
* **Expected Result:**
  - Ticket được gán cho Staff A.
  - Ứng dụng của Staff A rung chuông thông báo nhiệm vụ khẩn cấp có giới hạn thời gian.
  - Ticket xuất hiện trong tab "Nhiệm vụ cần xử lý" trên Staff Desk.

---

### `TC-F7-006`: Staff xử lý sự cố mất chìa khóa: Cắt khóa cũ, thay ổ khóa mới và thu phí
* **Traceability:** `FS-05` · `UC-F7-05` · `BR-SUP-02`, `BR-PRI-04`
* **Test Type:** Operational / Physical Handling · **Priority:** P1 (Critical)
* **Pre-conditions:** Khách hàng làm mất chìa khóa cơ của ô kho `S-005`. Staff A có mặt tại ô kho với khách hàng.
* **Test Steps:**
  1. Staff A xác minh CCCD khách hàng chính chủ.
  2. Tiến hành cắt ổ khóa cũ bị mất chìa, lắp ổ khóa mới kèm 2 chìa khóa mới.
  3. Bàn giao chìa khóa mới cho khách.
  4. Trên ứng dụng, Staff chọn mục: "Đã thay ổ khóa mới", nhập phụ phí bồi thường thay ổ khóa: `200.000 VND` (theo biểu giá quy định).
  5. Thu phí trực tiếp hoặc tạo mã QR để khách thanh toán.
* **Expected Result:**
  - Khách nhận chìa khóa mới và mở được kho.
  - Phụ phí 200.000 VND được hạch toán vào doanh thu phụ trợ của cơ sở.
  - Biên bản thay khóa được lưu trữ điện tử.

---

### `TC-F7-007`: Staff xử lý sự cố lỗi mã PIN: Reset mã PIN 6 số mới và bàn giao an toàn
* **Traceability:** `FS-05` · `UC-F7-05` · `BR-ACC-01`
* **Test Type:** Security / Access Recovery · **Priority:** P1 (Critical)
* **Pre-conditions:** Nhân viên đến xử lý sự cố ticket `TCK-7001` (khóa điện tử không nhận PIN cũ).
* **Test Steps:**
  1. Staff A kiểm tra ổ khóa điện tử, xác nhận pin của khóa vẫn tốt.
  2. Staff bấm "Khởi tạo lại mã PIN truy cập" trên ứng dụng quản trị.
  3. Hệ thống tạo mã PIN ngẫu nhiên mới: `918234`.
  4. Khách hàng nhập mã PIN mới tại bàn phím.
* **Expected Result:**
  - Ổ khóa điện tử mở chốt thành công, đèn xanh bật sáng.
  - Mã PIN cũ bị hủy.
  - Mã PIN mới được đồng bộ vào tài khoản của khách trên portal.

---

### `TC-F7-008`: Cập nhật ô kho sang Maintenance khi phát hiện hư hại nặng cần sửa chữa lớn
* **Traceability:** `FS-03` · `UC-F7-07` · `BR-AVL-01`
* **Test Type:** State Transition · **Priority:** P1 (Critical)
* **Pre-conditions:** Nhân viên kiểm tra sự cố thấm nước, phát hiện vách ngăn bị gãy cần đội ngũ thợ cơ khí đến sửa chữa trong 2 ngày. Ô kho này khách đã dọn hết đồ để di dời.
* **Test Steps:**
  1. Nhân viên chuyển trạng thái ô kho sang `MAINTENANCE`.
* **Expected Result:**
  - Ô kho chuyển sang trạng thái `MAINTENANCE`.
  - Ô kho bị khóa khỏi sơ đồ khả dụng, đảm bảo không có khách hàng nào đặt nhầm vào ô kho đang sửa chữa.

---

### `TC-F7-009`: Nhân viên hoàn tất xử lý hiện trường và chuyển trạng thái Ticket sang Resolved
* **Traceability:** `FS-05` · `UC-F7-08`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Sự cố đã được xử lý xong tại hiện trường.
* **Test Steps:**
  1. Staff A mở ticket `TCK-7001`.
  2. Nhập tóm tắt kết quả: "Đã hỗ trợ reset mã PIN mới 918234, khách hàng đã thử mở cửa và lấy đồ thành công".
  3. Bấm "Hoàn tất xử lý".
* **Expected Result:**
  - Trạng thái ticket chuyển từ `IN_PROGRESS` sang `RESOLVED`.
  - Hệ thống ghi nhận thời gian xử lý thực tế: 35 phút (vượt trội so với cam kết SLA 2 giờ).
  - Gửi thông báo đến khách hàng yêu cầu nghiệm thu và đánh giá.

---

### `TC-F7-010`: Khách hàng đánh giá mức độ hài lòng và xác nhận đóng Ticket
* **Traceability:** `SC-06` · `UC-F7-08`
* **Test Type:** Functional / Feedback · **Priority:** P2 (High)
* **Pre-conditions:** Ticket `TCK-7001` đang ở trạng thái `RESOLVED`.
* **Test Steps:**
  1. Khách hàng mở thông báo trên ứng dụng.
  2. Bấm chọn mức độ hài lòng: `5 sao (Rất hài lòng)`.
  3. Nhập phản hồi: "Nhân viên hỗ trợ rất nhanh và nhiệt tình".
  4. Bấm "Xác nhận đóng ticket".
* **Expected Result:**
  - Trạng thái ticket chuyển thành `CLOSED`.
  - Đánh giá 5 sao được lưu vào hồ sơ chỉ số chất lượng dịch vụ của cơ sở.

---

### `TC-F7-011`: Hệ thống tự động đóng Ticket sau 7 ngày làm việc khách không phản hồi
* **Traceability:** `SC-06` · `UC-F7-08` · `BR-SUP-03`
* **Test Type:** System Automation · **Priority:** P2 (High)
* **Pre-conditions:** Ticket `TCK-7002` đã được nhân viên chuyển sang `RESOLVED` vào ngày `01/10/2026`. Khách hàng không vào bấm xác nhận hay phản hồi gì thêm.
* **Test Steps:**
  1. Giả lập thời gian trôi qua quá 7 ngày làm việc (`support.auto_close_working_days = 7`, loại trừ thứ 7, chủ nhật) ➔ Đến ngày `12/10/2026`.
  2. Cronjob tự động đóng ticket chạy định kỳ.
* **Expected Result:**
  - Hệ thống tự động chuyển trạng thái ticket từ `RESOLVED` sang `CLOSED`.
  - Ghi nhận lý do đóng: "Tự động đóng do khách hàng không có phản hồi sau 7 ngày làm việc".

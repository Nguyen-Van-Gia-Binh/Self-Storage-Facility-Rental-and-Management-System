# Test Suite: Flow 1 — Đặt chỗ ô kho (Storage Unit Reservation Flow)

> **Tài liệu tham chiếu:** [TOPIC.md § 4.1](../TOPIC.md#flow-1--storage-unit-reservation-flow) · [USE-CASES.md § 2](../USE-CASES.md#2-flow-1--storage-unit-reservation) · [BUSINESS-RULES.md § 3, 4, 5, 6](../BUSINESS-RULES.md) · [API-SPEC.md](../API-SPEC.md)  
> **Workstream phụ trách:** WS1 (Khách hàng & Đặt chỗ) · Phối hợp: WS2, WS3  
> **Mã Use Case bao phủ:** `UC-F1-01` đến `UC-F1-12` (12 Use Cases)  
> **Mã Yêu cầu bao phủ:** `SC-01`, `SC-02`, `SC-03`, `FM-02`, `BM-02`, `BM-03`

---

## 1. Danh sách ca kiểm thử (Test Cases Summary)

| Test Case ID | Test Summary | Use Case | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-F1-001` | Tìm kiếm và xem danh sách cơ sở (Facility) đang hoạt động | `UC-F1-01` | Positive | P1 |
| `TC-F1-002` | Xem sơ đồ mặt bằng và trạng thái chi tiết từng ô kho theo Unit Type | `UC-F1-02` | Positive | P1 |
| `TC-F1-003` | Kiểm tra tính toán Capacity còn trống theo khoảng ngày `[start, endExclusive)` | `UC-F1-03` | Positive / BVA | P1 |
| `TC-F1-004` | Tạo Reservation hợp lệ với ô kho cụ thể và thời hạn N tháng | `UC-F1-04` | Positive | P1 |
| `TC-F1-005` | Kiểm tra công thức ước tính chi phí thuê và tiền cọc Deposit | `UC-F1-05` | Positive / Calc | P1 |
| `TC-F1-006` | Concurrency Test: Hai khách hàng cùng đặt 1 ô kho duy nhất đồng thời | `UC-F1-04`, `UC-F1-06` | Concurrency / Negative | P1 |
| `TC-F1-007` | Chặn khách hàng đang có hợp đồng Overdue không được tạo Reservation mới | `UC-F1-04` | Negative / Security | P2 |
| `TC-F1-008` | Hệ thống tự động giải phóng ô kho sau 48 giờ không thanh toán | `UC-F1-06`, `UC-F1-11` | System Cron | P1 |
| `TC-F1-009` | Khách hàng chủ động hủy Reservation khi đang chờ thanh toán (Pending Payment) | `UC-F1-10` | Positive | P2 |
| `TC-F1-010` | Thanh toán trực tuyến thành công: Khóa ô kho và tạo lịch hẹn Check-in | `UC-F1-07`, `UC-F1-08`, `UC-F1-09` | Positive | P1 |
| `TC-F1-011` | Xử lý giao dịch thanh toán thất bại hoặc quá thời gian chờ (Timeout) | `UC-F1-07` | Negative | P2 |
| `TC-F1-012` | Khách hàng hủy đặt chỗ trước ngày bắt đầu >= 48 giờ (Hoàn 100% tiền thuê + cọc) | `UC-F1-10` | Positive / Refund | P1 |
| `TC-F1-013` | Khách hàng hủy đặt chỗ trước ngày bắt đầu < 48 giờ (Hoàn 100% tiền thuê, phạt 50% cọc) | `UC-F1-10` | Boundary / Refund | P1 |
| `TC-F1-014` | Cơ sở hủy đặt chỗ do ô kho hư hỏng bất khả kháng (Hoàn tiền 100%) | `UC-F1-12` | Positive / Exception | P2 |
| `TC-F1-015` | Tạo đặt chỗ với ngày bắt đầu trong quá khứ hoặc số tháng không hợp lệ | `UC-F1-04` | Negative / Validation | P2 |

---

## 2. Chi tiết các ca kiểm thử (Detailed Test Specifications)

### `TC-F1-001`: Tìm kiếm và xem danh sách cơ sở (Facility) đang hoạt động
* **Traceability:** `SC-01` · `UC-F1-01`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Hệ thống có ít nhất 2 cơ sở ở trạng thái `ACTIVE` (ví dụ: Cơ sở Quận 9, Cơ sở Quận 7) và 1 cơ sở ở trạng thái `INACTIVE`.
* **Test Steps:**
  1. Người dùng mở trang chủ / danh mục cơ sở công khai (`/facilities`).
  2. Nhập từ khóa tìm kiếm `"Quận 9"` vào ô tìm kiếm khu vực.
  3. Bấm nút "Tìm kiếm".
* **Test Data:** Keyword: `"Quận 9"`.
* **Expected Result:**
  - Hệ thống chỉ hiển thị cơ sở `ACTIVE` khớp với từ khóa tìm kiếm.
  - Cơ sở `INACTIVE` tuyệt đối không xuất hiện trên giao diện người dùng.
  - Mỗi cơ sở hiển thị đầy đủ: Tên cơ sở, Địa chỉ, Hotline, Giờ mở cửa, và số lượng loại ô kho khả dụng.

---

### `TC-F1-002`: Xem sơ đồ mặt bằng và trạng thái chi tiết từng ô kho theo Unit Type
* **Traceability:** `SC-01` · `UC-F1-02`
* **Test Type:** Functional / UI (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Đăng nhập hoặc truy cập ẩn danh vào chi tiết Cơ sở Quận 9 (`facilityId = 1`).
* **Test Steps:**
  1. Chọn xem chi tiết Cơ sở Quận 9.
  2. Chuyển sang tab "Sơ đồ mặt bằng" (Floor Map).
  3. Nhấp chọn loại kho "Medium Unit (2m x 2m x 2.5m)".
* **Expected Result:**
  - Sơ đồ mặt bằng hiển thị trực quan các ô kho với mã màu phân biệt rõ ràng:
    - Xanh lá: `AVAILABLE` (Có thể chọn).
    - Vàng nhạt: `RESERVED` (Đang giữ chỗ).
    - Đỏ/Xám: `OCCUPIED` (Đang có người thuê).
    - Xám đậm: `MAINTENANCE` (Đang bảo trì).
  - Khi hover/click vào một ô kho xanh lá, hiển thị popover thông tin: Mã ô kho (ví dụ `M-102`), Diện tích, Thể tích, và Đơn giá thuê tháng.

---

### `TC-F1-003`: Kiểm tra tính toán Capacity còn trống theo khoảng ngày `[start, endExclusive)`
* **Traceability:** `SC-01` · `UC-F1-03` · `BR-AVL-01`, `BR-AVL-02`
* **Test Type:** Functional / Boundary · **Priority:** P1 (Critical)
* **Pre-conditions:**
  - Unit Type A có tổng cộng 5 ô kho vật lý.
  - 1 ô kho đang bảo trì (`MAINTENANCE`).
  - 2 ô kho đang có hợp đồng thuê từ ngày 01/10/2026 đến 31/10/2026.
  - 1 ô kho có Reservation Confirmed từ ngày 15/10/2026 đến 15/11/2026.
  - 1 ô kho hoàn toàn trống.
* **Test Steps:**
  1. Khách hàng tra cứu khả dụng cho khoảng thuê từ 20/10/2026 đến 20/11/2026.
* **Expected Result:**
  - Khả dụng thực tế tính theo công thức: $5 - 1\ (\text{maint}) - 2\ (\text{contract overlap}) - 1\ (\text{reservation overlap}) = 1$ ô khả dụng.
  - Hệ thống báo: "Còn 1 ô kho khả dụng cho khoảng thời gian đã chọn".

---

### `TC-F1-004`: Tạo Reservation hợp lệ với ô kho cụ thể và thời hạn N tháng
* **Traceability:** `SC-02` · `UC-F1-04` · `BR-RES-01`, `BR-RES-02`, `BR-AVL-04`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Storage Customer đã đăng nhập. Ô kho `M-102` đang `AVAILABLE`.
* **Test Steps:**
  1. Chọn ô kho `M-102` trên sơ đồ.
  2. Chọn ngày bắt đầu thuê: Ngày mai (`24/09/2026`).
  3. Chọn thời hạn thuê: `3 tháng`.
  4. Bấm "Tiến hành giữ chỗ & Thanh toán".
* **Expected Result:**
  - Hệ thống tạo thành công bản ghi `Reservation` ở trạng thái `PENDING_PAYMENT`.
  - Ô kho `M-102` được tạm giữ trong 48 giờ: trên sơ đồ đổi sang trạng thái màu vàng (Held).
  - Ngày kết thúc dự kiến được tính tự động: `24/12/2026`.
  - Bắt đầu đếm ngược thời gian thanh toán: `47:59:59`.

---

### `TC-F1-005`: Kiểm tra công thức ước tính chi phí thuê và tiền cọc Deposit
* **Traceability:** `SC-02`, `BM-03` · `UC-F1-05` · `BR-GEN-04`, `BR-DEP-01`, `BR-PRI-01`
* **Test Type:** Calculation / Financial (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Đơn giá tháng của Unit Type = 1.500.000 VND. Hệ số Deposit = 1.0.
* **Test Steps:**
  1. Thực hiện tạo đơn thuê 3 tháng cho Unit Type trên.
  2. Kiểm tra bảng kê chi phí hiển thị trên giao diện thanh toán.
* **Test Data:** Đơn giá: 1.500.000 đ/tháng. Số tháng: 3. Hệ số cọc: 1.0.
* **Expected Result:**
  - Tiền thuê 3 tháng: $1.500.000 \times 3 = 4.500.000\ \text{VND}$.
  - Tiền cọc Deposit: $1.500.000 \times 1.0 = 1.500.000\ \text{VND}$.
  - Tổng số tiền cần thanh toán ngay: $4.500.000 + 1.500.000 = 6.000.000\ \text{VND}$.
  - Tất cả các số tiền hiển thị đúng định dạng tiền tệ Việt Nam (có dấu chấm phân cách hàng nghìn, đơn vị đ hoặc VND).

---

### `TC-F1-006`: Concurrency Test: Hai khách hàng cùng đặt 1 ô kho duy nhất đồng thời
* **Traceability:** `FM-02` · `UC-F1-04`, `UC-F1-06` · `BR-AVL-03`
* **Test Type:** Concurrency / Integrity (Negative) · **Priority:** P1 (Critical)
* **Pre-conditions:** Unit Type chỉ còn đúng 1 ô kho trống cuối cùng (`S-005`). Khách A và Khách B cùng mở màn hình đặt chỗ ô kho này.
* **Test Steps:**
  1. Khách A và Khách B cùng gửi yêu cầu tạo Reservation giữ chỗ ô `S-005` gần như đồng thời (trong khoảng cách vài mili-giây).
* **Expected Result:**
  - Hệ thống xử lý nguyên tử (Atomic Lock):
    - Yêu cầu của Khách A thành công: Tạo Reservation `PENDING_PAYMENT`, giữ ô `S-005`.
    - Yêu cầu của Khách B bị từ chối ngay lập tức: Trả về mã lỗi HTTP `409 Conflict` kèm thông báo: *"Ô kho này vừa được người khác giữ chỗ. Vui lòng chọn ô kho khác."*
  - CSDL không bị overbooking (số lượng reservation active không vượt quá số ô kho thực tế).

---

### `TC-F1-007`: Chặn khách hàng đang có hợp đồng Overdue không được tạo Reservation mới
* **Traceability:** `SC-02` · `UC-F1-04` · `BR-RES-03`, `BR-OVD-09`
* **Test Type:** Business Rule / Security (Negative) · **Priority:** P2 (High)
* **Pre-conditions:** Tài khoản Khách hàng `customer_test_01` hiện đang có 1 hợp đồng thuê ở trạng thái `OVERDUE` tại cơ sở Quận 7.
* **Test Steps:**
  1. Khách hàng `customer_test_01` đăng nhập và cố gắng đặt một ô kho mới tại cơ sở Quận 9.
  2. Bấm "Tiến hành giữ chỗ".
* **Expected Result:**
  - Hệ thống từ chối tạo đơn, trả về mã lỗi HTTP `400 Bad Request`.
  - Thông báo hiển thị: *"Tài khoản của bạn hiện đang có hợp đồng quá hạn chưa giải quyết. Vui lòng thanh toán hoặc hoàn tất trả kho trước khi đặt kho mới."*

---

### `TC-F1-008`: Hệ thống tự động giải phóng ô kho sau 48 giờ không thanh toán
* **Traceability:** `FM-02` · `UC-F1-06`, `UC-F1-11` · `BR-DEP-03`
* **Test Type:** System Automation / State Transition · **Priority:** P1 (Critical)
* **Pre-conditions:** Reservation `RSV-1001` ở trạng thái `PENDING_PAYMENT` giữ ô `M-102` được tạo lúc $T_0$.
* **Test Steps:**
  1. Giả lập thời gian hệ thống trôi qua $T_0 + 48\ \text{giờ} + 1\ \text{phút}$.
  2. Cronjob tự động quét các đơn đặt chỗ hết hạn chạy kích hoạt.
* **Expected Result:**
  - Reservation `RSV-1001` chuyển trạng thái sang `EXPIRED`.
  - Ô kho `M-102` được giải phóng, chuyển trạng thái từ `RESERVED` về lại `AVAILABLE`.
  - Khách hàng khác lập tức có thể nhìn thấy và chọn ô kho `M-102`.

---

### `TC-F1-009`: Khách hàng chủ động hủy Reservation khi đang chờ thanh toán
* **Traceability:** `SC-02` · `UC-F1-10` · `BR-RES-04`
* **Test Type:** Functional (Positive) · **Priority:** P2 (High)
* **Pre-conditions:** Khách hàng có Reservation `RSV-1002` ở trạng thái `PENDING_PAYMENT`.
* **Test Steps:**
  1. Khách hàng vào "Đơn đặt chỗ của tôi".
  2. Bấm nút "Hủy đơn đặt chỗ".
  3. Xác nhận trên hộp thoại xác nhận hủy.
* **Expected Result:**
  - Reservation `RSV-1002` chuyển trạng thái sang `CANCELLED`.
  - Ô kho được giải phóng ngay lập tức về `AVAILABLE`.
  - Không phát sinh giao dịch hoàn tiền vì đơn chưa thanh toán.

---

### `TC-F1-010`: Thanh toán trực tuyến thành công: Khóa ô kho và tạo lịch hẹn Check-in
* **Traceability:** `SC-03`, `FM-02` · `UC-F1-07`, `UC-F1-08`, `UC-F1-09` · `BR-PAY-02`, `BR-AVL-04`
* **Test Type:** Functional / End-to-End (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Khách hàng đang ở màn hình thanh toán cho đơn `RSV-1003` (số tiền 6.000.000 VND).
* **Test Steps:**
  1. Quét mã VietQR hoặc chọn phương thức thanh toán giả lập.
  2. Cổng thanh toán gửi Webhook/Callback báo thành công về backend hệ thống.
* **Expected Result:**
  - Bản ghi `payment_transaction` được tạo: Trạng thái `SUCCESS`, mã giao dịch ngân hàng lưu vết đầy đủ.
  - Reservation `RSV-1003` chuyển trạng thái từ `PENDING_PAYMENT` sang `CONFIRMED`.
  - Ô kho gắn với đơn chuyển trạng thái sang `RESERVED`.
  - Hợp đồng `RentalContract` được khởi tạo ở trạng thái `PENDING_CHECKIN`.
  - Hệ thống gửi email/thông báo xác nhận đặt chỗ thành công kèm: Mã đặt chỗ, Thông tin ô kho, Lịch hẹn Check-in và hướng dẫn thủ tục nhận kho.

---

### `TC-F1-011`: Xử lý giao dịch thanh toán thất bại hoặc timeout
* **Traceability:** `SC-03` · `UC-F1-07` · `BR-PAY-01`
* **Test Type:** Integration (Negative) · **Priority:** P2 (High)
* **Pre-conditions:** Khách hàng thực hiện thanh toán cho Reservation `RSV-1004`.
* **Test Steps:**
  1. Giả lập cổng thanh toán trả về mã lỗi: `INSUFFICIENT_FUNDS` (Số dư không đủ) hoặc khách hàng hủy thanh toán tại trang thanh toán.
* **Expected Result:**
  - Trạng thái thanh toán ghi nhận `FAILED`.
  - Reservation `RSV-1004` vẫn giữ nguyên trạng thái `PENDING_PAYMENT` (vẫn còn trong 48h giữ chỗ để khách thử lại phương thức khác).
  - Giao diện hiển thị thông báo lỗi rõ ràng: *"Thanh toán không thành công. Vui lòng thử lại trước khi hết thời gian giữ chỗ."*

---

### `TC-F1-012`: Khách hàng hủy đặt chỗ trước ngày bắt đầu >= 48 giờ (Hoàn 100% tiền thuê + cọc)
* **Traceability:** `SC-02`, `BM-02` · `UC-F1-10` · `BR-CAN-01`
* **Test Type:** Financial / Policy (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Đơn đặt chỗ đã thanh toán 6.000.000 VND (4.500.000đ tiền thuê + 1.500.000đ tiền cọc). Ngày bắt đầu thuê là `01/10/2026 08:00`.
* **Test Steps:**
  1. Vào ngày `25/09/2026 10:00` (cách thời điểm bắt đầu > 48 giờ), khách hàng bấm "Hủy đặt chỗ".
  2. Xác nhận lý do hủy và gửi yêu cầu.
* **Expected Result:**
  - Hệ thống áp dụng chính sách `BR-CAN-01`: Hủy trước >= 48h được hoàn 100% tiền thuê và 100% tiền cọc.
  - Tổng số tiền hoàn: $4.500.000 + 1.500.000 = 6.000.000\ \text{VND}$.
  - Trạng thái Reservation chuyển sang `CANCELLED`. Ô kho được mở lại `AVAILABLE`.
  - Tạo yêu cầu hoàn tiền `RefundRequest` với số tiền 6.000.000 VND gửi đến hệ thống/quản lý xử lý.

---

### `TC-F1-013`: Khách hàng hủy đặt chỗ trước ngày bắt đầu < 48 giờ (Hoàn 100% tiền thuê, phạt 50% cọc)
* **Traceability:** `SC-02`, `BM-02` · `UC-F1-10` · `BR-CAN-02`
* **Test Type:** Financial / Policy (Boundary) · **Priority:** P1 (Critical)
* **Pre-conditions:** Đơn đặt chỗ đã thanh toán 6.000.000 VND (4.500.000đ tiền thuê + 1.500.000đ tiền cọc). Ngày bắt đầu thuê là `01/10/2026 08:00`.
* **Test Steps:**
  1. Vào ngày `30/09/2026 09:00` (cách thời điểm bắt đầu chỉ 23 giờ, tức < 48 giờ), khách hàng bấm "Hủy đặt chỗ".
  2. Xác nhận lý do hủy và gửi yêu cầu.
* **Expected Result:**
  - Hệ thống áp dụng chính sách `BR-CAN-02`: Hủy muộn (< 48h) hoàn 100% tiền thuê và hoàn 50% tiền cọc Deposit (phạt 50% tiền cọc).
  - Tiền thuê hoàn: $4.500.000\ \text{VND}$.
  - Tiền cọc hoàn: $1.500.000 \times 50\% = 750.000\ \text{VND}$.
  - Tổng số tiền khách nhận lại: $4.500.000 + 750.000 = 5.250.000\ \text{VND}$ (Hệ thống giữ lại 750.000 VND tiền phạt).
  - Trạng thái Reservation chuyển `CANCELLED`, ô kho giải phóng về `AVAILABLE`.

---

### `TC-F1-014`: Cơ sở hủy đặt chỗ do ô kho hư hỏng bất khả kháng (Hoàn tiền 100%)
* **Traceability:** `FM-02`, `BM-02` · `UC-F1-12` · `BR-CAN-03`
* **Test Type:** Business Exception (Positive) · **Priority:** P2 (High)
* **Pre-conditions:** Đơn đặt chỗ `RSV-1005` đã thanh toán 6.000.000 VND. Ô kho bị sự cố ngập nước đột xuất tại cơ sở và cơ sở không còn ô kho cùng loại để đổi.
* **Test Steps:**
  1. Facility Manager đăng nhập, vào chi tiết đơn `RSV-1005`.
  2. Chọn "Hủy đặt chỗ phía cơ sở", nhập lý do: "Ô kho ngập nước, cơ sở hết phòng thay thế".
  3. Bấm xác nhận hủy.
* **Expected Result:**
  - Hệ thống áp dụng chính sách `BR-CAN-03`: Hoàn 100% toàn bộ số tiền khách đã nộp (6.000.000 VND) bất kể thời điểm hủy.
  - Trạng thái đơn chuyển sang `CANCELLED_BY_FACILITY`.
  - Ô kho chuyển sang trạng thái `MAINTENANCE`.
  - Gửi email thông báo xin lỗi khách hàng và cung cấp mã hoàn tiền.

---

### `TC-F1-015`: Tạo đặt chỗ với ngày bắt đầu trong quá khứ hoặc số tháng không hợp lệ
* **Traceability:** `SC-02` · `UC-F1-04` · `BR-RES-01`
* **Test Type:** Validation (Negative) · **Priority:** P2 (High)
* **Pre-conditions:** Khách hàng ở màn hình đặt chỗ.
* **Test Steps & Data:**
  - Ca A: Chọn ngày bắt đầu là ngày hôm qua (`22/09/2026`).
  - Ca B: Nhập số tháng thuê = `0` hoặc `-1`.
  - Ca C: Nhập số tháng thuê không phải số nguyên (ví dụ `1.5 tháng`).
* **Expected Result:**
  - Giao diện validate chặn ngay tại client (disable các ngày trong quá khứ trên DatePicker, ô số tháng chỉ cho chọn số nguyên từ 1 đến 12).
  - Nếu cố tình bypass gửi API: Backend trả về `400 Bad Request` kèm message lỗi tương ứng.

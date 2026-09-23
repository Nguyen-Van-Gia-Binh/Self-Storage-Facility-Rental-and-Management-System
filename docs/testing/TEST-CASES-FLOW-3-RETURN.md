# Test Suite: Flow 3 — Quản lý ô kho đang thuê & Trả kho (Rented Unit Management & Return Flow)

> **Tài liệu tham chiếu:** [TOPIC.md § 4.3](../TOPIC.md#flow-3--rented-storage-unit-management-flow) · [USE-CASES.md § 4](../USE-CASES.md#4-flow-3--rented-storage-unit-management) · [BUSINESS-RULES.md § 9, 13, 14](../BUSINESS-RULES.md) · [API-SPEC.md](../API-SPEC.md)  
> **Workstream phụ trách:** WS2 (Cơ sở, Kho & Vận hành) · Phối hợp: WS1, WS3  
> **Mã Use Case bao phủ:** `UC-F3-01` đến `UC-F3-13` (13 Use Cases)  
> **Mã Yêu cầu bao phủ:** `SC-03`, `SC-05`, `FS-03`, `FS-04`, `FM-03`, `FM-04`

---

## 1. Danh sách ca kiểm thử (Test Cases Summary)

| Test Case ID | Test Summary | Use Case | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-F3-001` | Khách hàng xem danh sách các ô kho đang thuê và thời hạn hợp đồng | `UC-F3-01`, `UC-F3-02` | Positive | P1 |
| `TC-F3-002` | Cập nhật thông tin liên hệ và danh sách người được ủy quyền truy cập | `UC-F3-03` | Positive & Validation | P2 |
| `TC-F3-003` | Xem lịch sử ra vào và trạng thái hiệu lực của mã PIN truy cập | `UC-F3-04` | Positive / Security | P2 |
| `TC-F3-004` | Hệ thống tự động kích hoạt tiến trình trả kho khi không gia hạn trước 1 tháng | `UC-F3-05` | System Automation | P1 |
| `TC-F3-005` | Khách chủ động đăng ký trả kho sớm (Early Return): Không hoàn tiền thuê còn lại | `UC-F3-05` | Boundary / Financial | P1 |
| `TC-F3-006` | Nhân viên kiểm tra hiện trạng ô kho đạt chuẩn (Không hư hại, sạch sẽ) khi trả | `UC-F3-06` | Positive | P1 |
| `TC-F3-007` | Hiện trường ô kho bị hư hại hoặc mất chìa cơ: Khấu trừ bồi thường vào Deposit | `UC-F3-06` | Negative / Financial | P1 |
| `TC-F3-008` | Vô hiệu hóa Access Code / PIN và thu hồi chìa khóa cơ ngay khi hoàn tất nghiệm thu | `UC-F3-07` | Security / Access | P1 |
| `TC-F3-009` | Facility Manager quyết toán hợp đồng và thực hiện hoàn trả Deposit trong 7 ngày | `UC-F3-08` | Financial / Policy | P1 |
| `TC-F3-010` | Vòng đời ô kho sau trả: Chuyển sang *Cleaning* rồi mở lại *Available* | `UC-F3-09` | State Transition | P1 |
| `TC-F3-011` | Facility Manager giám sát danh sách khách và tiến độ thanh toán của từng hợp đồng | `UC-F3-10`, `UC-F3-11` | Positive | P2 |
| `TC-F3-012` | Đánh dấu ô kho cần bảo trì hoặc kiểm tra định kỳ trong quá trình vận hành | `UC-F3-12` | Positive | P2 |
| `TC-F3-013` | Khách hàng thanh toán phụ phí bồi thường phát sinh vượt quá số tiền cọc Deposit | `UC-F3-13` | Boundary / Financial | P2 |

---

## 2. Chi tiết các ca kiểm thử (Detailed Test Specifications)

### `TC-F3-001`: Khách hàng xem danh sách các ô kho đang thuê và thời hạn hợp đồng
* **Traceability:** `SC-05` · `UC-F3-01`, `UC-F3-02`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Khách hàng Nguyễn Văn An đăng nhập (`customer_an`), đang thuê 2 ô kho tại Cơ sở Quận 9 (Ô `M-102` hạn đến 30/11/2026, Ô `S-005` hạn đến 31/12/2026).
* **Test Steps:**
  1. Vào trang "Ô kho của tôi" (`/customer/my-units`).
* **Expected Result:**
  - Hiển thị danh sách cả 2 ô kho với đầy đủ thẻ thông tin: Mã ô kho, Tên cơ sở, Ngày bắt đầu, Ngày hết hạn, Trạng thái hợp đồng (`ACTIVE`), và Mã PIN truy cập hiện tại.
  - Bấm vào một ô kho: Xem được chi tiết lịch sử hóa đơn thanh toán (Tiền thuê N tháng đã đóng, Tiền cọc Deposit đang giữ).

---

### `TC-F3-002`: Cập nhật thông tin liên hệ và danh sách người được ủy quyền truy cập
* **Traceability:** `SC-05` · `UC-F3-03`
* **Test Type:** Functional / Validation · **Priority:** P2 (High)
* **Pre-conditions:** Khách hàng đang ở trang chi tiết ô kho `M-102`.
* **Test Steps:**
  1. Chọn mục "Người được ủy quyền".
  2. Bấm "Thêm người được ủy quyền".
  3. Nhập: Họ tên: "Lê Văn Cường", Số CCCD: `079095009999`, SĐT: `0987654321`, Mối quan hệ: "Đồng nghiệp".
  4. Bấm "Lưu thông tin".
* **Expected Result:**
  - Thông tin người được ủy quyền được lưu thành công vào CSDL.
  - Người này được phép sử dụng mã PIN truy cập vào cơ sở theo dữ liệu nhận diện đăng ký.
  - Validation: Nếu nhập số điện thoại không đúng 10 số hoặc thiếu CCCD, hệ thống báo lỗi đỏ và không cho lưu.

---

### `TC-F3-003`: Xem lịch sử ra vào và trạng thái hiệu lực của mã PIN truy cập
* **Traceability:** `SC-05` · `UC-F3-04`
* **Test Type:** Functional / Security · **Priority:** P2 (High)
* **Pre-conditions:** Khách hàng đã sử dụng mã PIN mở cửa kho 3 lần trong tuần.
* **Test Steps:**
  1. Tại chi tiết ô kho, chuyển sang tab "Lịch sử truy cập".
* **Expected Result:**
  - Hiển thị danh sách các lần truy cập: Thời gian chính xác (ngày, giờ, phút), Cổng/Vị trí ra vào, và Phương tiện sử dụng (Mã PIN).
  - Trạng thái mã PIN hiển thị rõ: `HOẠT ĐỘNG (ACTIVE)`.

---

### `TC-F3-004`: Hệ thống tự động kích hoạt tiến trình trả kho khi không gia hạn trước 1 tháng
* **Traceability:** `SC-05`, `FM-04` · `UC-F3-05` · `BR-RET-01`, `BR-REN-01`
* **Test Type:** System Automation / Business Rule · **Priority:** P1 (Critical)
* **Pre-conditions:** Hợp đồng `CTR-3001` có ngày kết thúc là `31/10/2026`. Mốc khóa gia hạn là trước 30 ngày (`01/10/2026 00:00`). Khách hàng không thực hiện gia hạn.
* **Test Steps:**
  1. Giả lập thời gian hệ thống chạm mốc `01/10/2026 00:00`.
  2. Cronjob kiểm tra gia hạn tự động kích hoạt.
* **Expected Result:**
  - Hệ thống áp dụng quy tắc trả kho tự động (`BR-RET-01`): Chuyển tiến trình hợp đồng sang `PENDING_RETURN`.
  - Khóa tính năng gia hạn (nút "Gia hạn" trên portal chuyển thành disabled).
  - Gửi thông báo đến khách hàng: *"Hợp đồng của bạn đã hết hạn gia hạn. Hệ thống đã chuyển sang tiến trình trả kho vào ngày 31/10/2026. Vui lòng sắp xếp dọn đồ trước hạn."*
  - Xuất hiện trên danh sách "Khách cần trả kho" tại portal của Facility Staff.

---

### `TC-F3-005`: Khách chủ động đăng ký trả kho sớm (Early Return): Không hoàn tiền thuê còn lại
* **Traceability:** `SC-05`, `FM-04` · `UC-F3-05` · `BR-RET-06`
* **Test Type:** Boundary / Financial Rule · **Priority:** P1 (Critical)
* **Pre-conditions:** Hợp đồng thuê 6 tháng từ `01/07/2026` đến `31/12/2026` (tiền thuê đã đóng 9.000.000đ, cọc 1.500.000đ).
* **Test Steps:**
  1. Ngày `15/10/2026` (còn 2.5 tháng nữa mới hết hạn), khách hàng chọn "Đăng ký trả kho sớm".
  2. Chọn ngày hẹn trả kho thực tế: `20/10/2026`.
  3. Bấm xác nhận.
* **Expected Result:**
  - Hệ thống áp dụng quy tắc `BR-RET-06`: Tỷ lệ hoàn tiền thuê thời gian chưa dùng là 0% (`return.early_refund_rate = 0%`).
  - Hệ thống hiển thị thông báo rõ ràng trước khi xác nhận: *"Theo chính sách của hệ thống, trả kho sớm không được hoàn lại tiền thuê của khoảng thời gian còn lại. Tiền cọc Deposit (1.500.000 VND) sẽ được quyết toán hoàn trả sau khi nghiệm thu."*
  - Ngày kết thúc dự kiến cập nhật thành `20/10/2026`, lịch hẹn trả kho được ghi nhận.

---

### `TC-F3-006`: Nhân viên kiểm tra nghiệm thu hiện trạng ô kho đạt chuẩn khi trả
* **Traceability:** `FS-04` · `UC-F3-06` · `BR-RET-02`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Khách hàng đã dọn hết đồ ra khỏi ô kho `M-102` vào ngày hẹn trả kho.
* **Test Steps:**
  1. Nhân viên mở e-Form "Biên bản nghiệm thu trả kho" (`/staff/return/inspection/CTR-3001`).
  2. Kiểm tra checklist nghiệm thu:
     - Ô kho đã dọn sạch toàn bộ đồ đạc, không rác: Đạt [x]
     - Kết cấu tường, vách ngăn, cửa không trầy xước/hư hỏng: Đạt [x]
     - Nhận lại đầy đủ 2 chìa khóa cơ ban đầu: Đạt [x]
  3. Chụp ảnh hiện trạng kho trống sạch đính kèm.
  4. Khách và nhân viên ký số biên bản nghiệm thu.
* **Expected Result:**
  - Biên bản nghiệm thu đạt chuẩn (Damage = 0 VND).
  - Đề xuất hoàn trả 100% tiền cọc Deposit ($1.500.000\ \text{VND}$).

---

### `TC-F3-007`: Hiện trường ô kho bị hư hại hoặc mất chìa cơ: Khấu trừ bồi thường vào Deposit
* **Traceability:** `FS-04`, `FM-04` · `UC-F3-06` · `BR-RET-03`
* **Test Type:** Financial / Penalty (Negative) · **Priority:** P1 (Critical)
* **Pre-conditions:** Hợp đồng có tiền cọc Deposit là 1.500.000 VND. Ô kho bị thủng một lỗ nhỏ ở vách ngăn và khách làm mất 1 chìa khóa cơ.
* **Test Steps:**
  1. Nhân viên thực hiện nghiệm thu tại ô kho.
  2. Tích chọn các mục vi phạm:
     - Hư hỏng vách ngăn: Chi phí sửa chữa = 400.000 VND (chụp ảnh đính kèm).
     - Mất chìa khóa cơ (thay ổ mới): Chi phí = 200.000 VND.
  3. Hệ thống tính tổng chi phí bồi thường: 600.000 VND.
  4. Khách hàng xem và ký số biên bản nghiệm thu có khấu trừ.
* **Expected Result:**
  - Biên bản ghi rõ số tiền bồi thường thiệt hại: 600.000 VND.
  - Số tiền cọc Deposit thực tế còn lại được hoàn: $1.500.000 - 600.000 = 900.000\ \text{VND}$.
  - Hợp đồng ghi nhận số tiền hoàn cọc chính xác là 900.000 VND.

---

### `TC-F3-008`: Vô hiệu hóa Access Code / PIN và thu hồi chìa khóa cơ ngay khi hoàn tất nghiệm thu
* **Traceability:** `FS-03` · `UC-F3-07` · `BR-RET-04`
* **Test Type:** Security / Access Control · **Priority:** P1 (Critical)
* **Pre-conditions:** Biên bản nghiệm thu trả kho vừa được ký hoàn tất.
* **Test Steps:**
  1. Thử dùng mã PIN cũ của khách để mở cửa kho hoặc qua cổng an ninh.
  2. Kiểm tra trạng thái mã PIN trong CSDL.
* **Expected Result:**
  - Mã PIN truy cập của ô kho lập tức chuyển sang `REVOKED` (Vô hiệu hóa).
  - Cổng an ninh từ chối mở cửa với mã PIN cũ.
  - Trên portal của khách, thẻ ô kho không còn hiển thị mã PIN.

---

### `TC-F3-009`: Facility Manager quyết toán hợp đồng và thực hiện hoàn trả Deposit trong 7 ngày
* **Traceability:** `FM-04` · `UC-F3-08` · `BR-RET-05`
* **Test Type:** Financial / Workflow · **Priority:** P1 (Critical)
* **Pre-conditions:** Biên bản nghiệm thu hợp đồng `CTR-3001` đã hoàn tất (số tiền hoàn cọc: 900.000 VND).
* **Test Steps:**
  1. Facility Manager đăng nhập, vào danh sách "Quyết toán hợp đồng trả kho".
  2. Kiểm tra biên bản nghiệm thu và ảnh chụp hiện trường.
  3. Bấm "Phê duyệt quyết toán & Lập lệnh hoàn cọc".
* **Expected Result:**
  - Trạng thái hợp đồng chuyển từ `PENDING_RETURN` sang `COMPLETED` (Hoàn tất).
  - Lệnh hoàn tiền được tạo gửi sang bộ phận tài chính/ngân hàng, cam kết xử lý trong tối đa 7 ngày làm việc (`return.refund_working_days = 7`).
  - Gửi thông báo quyết toán chi tiết về email/portal của khách.

---

### `TC-F3-010`: Vòng đời ô kho sau trả: Chuyển sang Cleaning rồi mở lại Available
* **Traceability:** `FS-03` · `UC-F3-09` · `BR-RET-07`
* **Test Type:** State Transition · **Priority:** P1 (Critical)
* **Pre-conditions:** Hợp đồng thuê vừa hoàn tất thủ tục trả kho.
* **Test Steps:**
  1. Kiểm tra trạng thái ô kho ngay sau khi ký nghiệm thu trả kho.
  2. Nhân viên vệ sinh kho xong, vào Staff Portal bấm "Hoàn tất dọn dẹp ô kho".
* **Expected Result:**
  - Bước 1: Trạng thái ô kho chuyển thành `CLEANING`. Trên sơ đồ kho hiển thị màu vàng cam (Cleaning), khách ngoài chưa thể đặt ô kho này.
  - Bước 2: Sau khi bấm hoàn tất dọn dẹp, ô kho chuyển sang `AVAILABLE` (màu xanh lá) và ngay lập tức hiển thị trên danh mục khả dụng để đón khách mới.

---

### `TC-F3-011`: Facility Manager giám sát danh sách khách và tiến độ thanh toán của từng hợp đồng
* **Traceability:** `FM-03` · `UC-F3-10`, `UC-F3-11`
* **Test Type:** Functional (Positive) · **Priority:** P2 (High)
* **Pre-conditions:** Facility Manager đăng nhập.
* **Test Steps:**
  1. Vào trang "Quản lý hợp đồng cơ sở" (`/manager/contracts`).
  2. Lọc theo các tiêu chí: `ACTIVE`, `PENDING_CHECKIN`, `PENDING_RETURN`, `OVERDUE`.
* **Expected Result:**
  - Hiển thị bảng dữ liệu chính xác: Mã hợp đồng, Khách hàng, Số ô kho, Ngày hết hạn, Số tiền cọc đang giữ, và Tình trạng công nợ/quá hạn.

---

### `TC-F3-012`: Đánh dấu ô kho cần bảo trì hoặc kiểm tra định kỳ trong quá trình vận hành
* **Traceability:** `FS-03` · `UC-F3-12`
* **Test Type:** Functional (Positive) · **Priority:** P2 (High)
* **Pre-conditions:** Ô kho `S-008` đang trống (`AVAILABLE`). Nhân viên phát hiện bóng đèn bị hỏng.
* **Test Steps:**
  1. Nhân viên chọn ô kho `S-008`, chọn thao tác "Đánh dấu bảo trì".
  2. Nhập lý do: "Thay bóng đèn chiếu sáng".
  3. Bấm xác nhận.
* **Expected Result:**
  - Ô kho chuyển trạng thái sang `MAINTENANCE`.
  - Ô kho tạm thời không được tính vào capacity khả dụng của cơ sở (`BR-AVL-01`).
  - Khi nhân viên sửa xong và bấm "Hoàn tất bảo trì", kho trở lại `AVAILABLE`.

---

### `TC-F3-013`: Khách hàng thanh toán phụ phí bồi thường phát sinh vượt quá số tiền cọc
* **Traceability:** `SC-03` · `UC-F3-13`
* **Test Type:** Financial / Boundary · **Priority:** P2 (High)
* **Pre-conditions:** Tiền cọc Deposit của hợp đồng là 1.500.000 VND. Khách hàng làm hỏng cửa cuốn nặng, chi phí khắc phục là 2.500.000 VND (vượt cọc 1.000.000 VND).
* **Test Steps:**
  1. Nhân viên lập biên bản nghiệm thu ghi nhận thiệt hại 2.500.000 VND.
  2. Khấu trừ hết 1.500.000 VND tiền cọc (Deposit hoàn trả = 0 VND).
  3. Hệ thống tạo hóa đơn phụ thu bổ sung: 1.000.000 VND.
  4. Khách hàng quét mã VietQR thanh toán khoản 1.000.000 VND bổ sung.
* **Expected Result:**
  - Giao dịch thanh toán phụ phí thành công.
  - Hợp đồng được quyết toán không còn nợ xấu, chuyển sang `COMPLETED`.

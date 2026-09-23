# Test Suite: Flow 2 — Check-in & Bàn giao ô kho (Check-in and Handover Flow)

> **Tài liệu tham chiếu:** [TOPIC.md § 4.2](../TOPIC.md#flow-2--storage-check-in-and-handover-flow) · [USE-CASES.md § 3](../USE-CASES.md#3-flow-2--storage-check-in-and-handover) · [BUSINESS-RULES.md § 10, 11](../BUSINESS-RULES.md) · [API-SPEC.md](../API-SPEC.md)  
> **Workstream phụ trách:** WS2 (Cơ sở, Kho & Vận hành) · Phối hợp: WS1, WS4  
> **Mã Use Case bao phủ:** `UC-F2-01` đến `UC-F2-09` (9 Use Cases)  
> **Mã Yêu cầu bao phủ:** `SC-04`, `FS-01`, `FS-02`, `FS-03`, `FM-02`, `FM-05`

---

## 1. Danh sách ca kiểm thử (Test Cases Summary)

| Test Case ID | Test Summary | Use Case | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-F2-001` | Tra cứu thông tin đặt chỗ của khách tại quầy bằng Mã đặt chỗ hoặc Số điện thoại | `UC-F2-01` | Positive | P1 |
| `TC-F2-002` | Tra cứu với mã đặt chỗ không tồn tại hoặc đơn chưa thanh toán | `UC-F2-01` | Negative | P2 |
| `TC-F2-003` | Xác minh CCCD/Hộ chiếu người đến nhận kho khớp với thông tin đã đăng ký | `UC-F2-02` | Positive & Negative | P1 |
| `TC-F2-004` | Kiểm tra hiện trạng ô kho đạt chuẩn và lập biên bản bàn giao điện tử (e-Handover) | `UC-F2-03` | Positive | P1 |
| `TC-F2-005` | Hiện trường ô kho không đạt chuẩn: Nhân viên đề xuất đổi sang ô kho tương đương | `UC-F2-03` | Positive / Exception | P2 |
| `TC-F2-006` | Khách từ chối nhận ô kho lỗi và cơ sở hết kho đổi: FM duyệt hoàn tiền 100% trong 3 ngày | `UC-F2-03` | Positive / Refund | P1 |
| `TC-F2-007` | Hệ thống sinh mã PIN 6 số ngẫu nhiên duy nhất và bàn giao khóa cơ (Cấm dùng thẻ RFID) | `UC-F2-04` | Security / Compliance | P1 |
| `TC-F2-008` | Khách hàng thực hiện ký số xác nhận Check-in và hoàn tất thủ tục nhận kho | `UC-F2-05` | Positive | P1 |
| `TC-F2-009` | Kích hoạt trạng thái tự động: Storage Unit sang *Occupied* và Contract sang *Active* | `UC-F2-06`, `UC-F2-07` | State Transition | P1 |
| `TC-F2-010` | Khách đến Check-in trễ trong khoảng thời gian ân hạn (Grace Period <= 10 ngày) | `UC-F2-08` | Boundary / Positive | P2 |
| `TC-F2-011` | Xử lý khách No-show quá 10 ngày: Hủy hợp đồng, hoàn tiền thuê, tịch thu 100% cọc | `UC-F2-08` | Boundary / Financial | P1 |
| `TC-F2-012` | Facility Manager phân công Facility Staff phụ trách bàn giao trong ngày | `UC-F2-09` | Positive | P2 |

---

## 2. Chi tiết các ca kiểm thử (Detailed Test Specifications)

### `TC-F2-001`: Tra cứu thông tin đặt chỗ của khách tại quầy bằng Mã đặt chỗ hoặc Số điện thoại
* **Traceability:** `FS-01` · `UC-F2-01`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Đơn đặt chỗ `RSV-2001` đã thanh toán thành công, gắn với khách hàng Nguyễn Văn An (SĐT: `0901234567`), ngày bắt đầu thuê: hôm nay.
* **Test Steps:**
  1. Facility Staff đăng nhập vào Staff Portal (`/staff/desk`).
  2. Tại ô tra cứu, nhập mã đặt chỗ `"RSV-2001"` (hoặc số điện thoại `"0901234567"`).
  3. Bấm nút "Tra cứu".
* **Expected Result:**
  - Hệ thống hiển thị đúng thông tin: Họ tên khách, SĐT, Số CCCD, Loại ô kho, Mã ô kho (ví dụ `M-105`), Ngày bắt đầu, Thời hạn thuê (3 tháng), và trạng thái thanh toán: `PAID (Đã thanh toán đủ 100%)`.

---

### `TC-F2-002`: Tra cứu với mã đặt chỗ không tồn tại hoặc đơn chưa thanh toán
* **Traceability:** `FS-01` · `UC-F2-01`
* **Test Type:** Functional (Negative) · **Priority:** P2 (High)
* **Pre-conditions:** Facility Staff đang ở màn hình tra cứu.
* **Test Steps & Data:**
  - Ca A: Nhập mã không tồn tại `"RSV-9999"`.
  - Ca B: Nhập mã `RSV-PENDING` của một đơn chưa thanh toán (đang `PENDING_PAYMENT`).
* **Expected Result:**
  - Ca A: Báo lỗi *"Không tìm thấy thông tin đặt chỗ phù hợp"*.
  - Ca B: Hiển thị trạng thái *"Đơn đặt chỗ chưa hoàn tất thanh toán. Vui lòng hướng dẫn khách thanh toán trước khi bàn giao."* Nút "Tiến hành bàn giao" bị khóa (disabled).

---

### `TC-F2-003`: Xác minh CCCD/Hộ chiếu người đến nhận kho khớp với thông tin đã đăng ký
* **Traceability:** `FS-01` · `UC-F2-02`
* **Test Type:** Functional / Verification · **Priority:** P1 (Critical)
* **Pre-conditions:** Đơn `RSV-2001` lưu thông tin CCCD là `079090001234`.
* **Test Steps:**
  1. Khách hàng xuất trình thẻ CCCD vật lý.
  2. Nhân viên so khớp số CCCD thực tế với thông tin trên hệ thống.
  3. Trường hợp hợp lệ: Tích chọn "Đã xác minh danh tính thành công" và chụp ảnh/tải ảnh mặt trước CCCD lên hệ thống.
  4. Trường hợp không hợp lệ (người khác đi thay không có giấy ủy quyền): Nhân viên bấm từ chối bàn giao.
* **Expected Result:**
  - Nếu xác minh thành công: Mở khóa bước "Lập biên bản bàn giao".
  - Nếu thông tin sai lệch: Hệ thống ghi nhận trạng thái từ chối, yêu cầu xuất trình giấy tờ chính chủ hoặc văn bản ủy quyền hợp lệ.

---

### `TC-F2-004`: Kiểm tra hiện trạng ô kho đạt chuẩn và lập biên bản bàn giao điện tử (e-Handover)
* **Traceability:** `FS-02` · `UC-F2-03` · `BR-CHK-01`, `BR-CHK-02`
* **Test Type:** Functional / Workflow (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Nhân viên và khách hàng cùng có mặt tại vị trí ô kho `M-105`.
* **Test Steps:**
  1. Nhân viên mở e-Form bàn giao trên máy tính bảng/điện thoại (`/staff/handover/RSV-2001`).
  2. Nhân viên và khách kiểm tra checklist hiện trạng:
     - Cửa cuốn / cửa bản lề hoạt động trơn tru: Đạt [x]
     - Đèn chiếu sáng hoạt động: Đạt [x]
     - Ô kho sạch sẽ, không rác, không ẩm mốc, không mùi lạ: Đạt [x]
     - Khóa an toàn hoạt động tốt: Đạt [x]
  3. Nhân viên chụp 2 bức ảnh thực tế ô kho đính kèm vào form.
  4. Bấm "Tạo biên bản bàn giao".
* **Expected Result:**
  - Biên bản bàn giao điện tử được tạo với mã duy nhất `HO-2001`.
  - Hiển thị đầy đủ thông tin: Danh mục checklist, hình ảnh đính kèm, thời gian bàn giao và điều khoản cam kết sử dụng kho.

---

### `TC-F2-005`: Hiện trường ô kho không đạt chuẩn: Nhân viên đề xuất đổi sang ô kho tương đương
* **Traceability:** `FS-02`, `FM-02` · `UC-F2-03` · `BR-CHK-06`
* **Test Type:** Business Exception (Positive) · **Priority:** P2 (High)
* **Pre-conditions:** Ô kho `M-105` bị kẹt cửa hoặc có vết ẩm. Cơ sở vẫn còn ô kho `M-108` cùng loại Medium Unit đang trống (`AVAILABLE`).
* **Test Steps:**
  1. Tại màn hình kiểm tra hiện trạng, nhân viên tích chọn checklist: "Cửa kẹt / Không đạt chuẩn".
  2. Bấm nút "Báo sự cố & Đổi ô kho".
  3. Chọn ô kho thay thế `M-108` từ danh sách các ô kho khả dụng cùng loại.
  4. Bấm "Gửi phê duyệt đổi kho".
* **Expected Result:**
  - Ô kho cũ `M-105` được đánh dấu chuyển sang `MAINTENANCE` để kỹ thuật xử lý.
  - Đơn đặt chỗ `RSV-2001` được cập nhật gán sang ô kho mới `M-108`.
  - Khách hàng và nhân viên tiến hành nghiệm thu tại ô kho mới `M-108`.

---

### `TC-F2-006`: Khách từ chối nhận ô kho lỗi và cơ sở hết kho đổi: FM duyệt hoàn tiền 100% trong 3 ngày
* **Traceability:** `SC-04`, `FM-02` · `UC-F2-03` · `BR-CHK-06`
* **Test Type:** Financial / Policy · **Priority:** P1 (Critical)
* **Pre-conditions:** Ô kho bị sự cố, cơ sở không còn ô kho nào khác cùng loại hoặc lớn hơn để đổi. Khách hàng yêu cầu hủy hợp đồng và từ chối nhận kho.
* **Test Steps:**
  1. Nhân viên chọn lý do: "Ô kho lỗi - Khách hàng từ chối nhận".
  2. Hệ thống chuyển yêu cầu đến Facility Manager.
  3. Facility Manager đăng nhập duyệt yêu cầu hủy và hoàn tiền.
* **Expected Result:**
  - Hệ thống áp dụng quy tắc `BR-CHK-06`: Hoàn lại 100% toàn bộ số tiền (tiền thuê + cọc deposit) về tài khoản gốc của khách.
  - Thời hạn cam kết xử lý hoàn tiền: Tối đa 3 ngày làm việc (`checkin.refund_working_days = 3`).
  - Trạng thái Reservation chuyển sang `CANCELLED_DUE_TO_DEFECT`.

---

### `TC-F2-007`: Hệ thống sinh mã PIN 6 số ngẫu nhiên duy nhất và bàn giao khóa cơ (Cấm dùng thẻ RFID)
* **Traceability:** `FS-02` · `UC-F2-04` · `BR-ACC-01`, `BR-ACC-03`
* **Test Type:** Security / Business Rule Compliance · **Priority:** P1 (Critical)
* **Pre-conditions:** Đang ở bước cấp phương tiện truy cập của biên bản bàn giao.
* **Test Steps:**
  1. Nhân viên bấm nút "Cấp mã truy cập".
  2. Bàn giao 2 chìa khóa cơ vật lý (nếu ô kho dùng ổ khóa cơ).
* **Expected Result:**
  - Hệ thống sinh tự động mã PIN gồm đúng **6 chữ số** (ví dụ: `482910`).
  - **Quy chuẩn đề bài tuyệt đối:** Hệ thống KHÔNG CÓ trường dữ liệu, giao diện, hoặc chức năng quét/cấp thẻ RFID từ xa.
  - Mã PIN được mã hóa lưu trữ trong CSDL và gửi trực tiếp qua SMS/Email bảo mật cho khách, đồng thời hiển thị trên portal của khách sau khi kích hoạt.

---

### `TC-F2-008`: Khách hàng thực hiện ký số xác nhận Check-in và hoàn tất thủ tục nhận kho
* **Traceability:** `SC-04` · `UC-F2-05` · `BR-CHK-02`
* **Test Type:** Functional / E-Signature · **Priority:** P1 (Critical)
* **Pre-conditions:** Biên bản bàn giao đã điền đủ thông tin và mã PIN đã được tạo.
* **Test Steps:**
  1. Khách hàng xem lại toàn bộ nội dung biên bản điện tử trên màn hình.
  2. Khách hàng ký tên trực tiếp vào khung vẽ chữ ký điện tử (Signature Canvas) và bấm "Xác nhận nhận kho".
  3. Nhân viên ký tên xác nhận hoàn tất.
* **Expected Result:**
  - File biên bản bàn giao (PDF/HTML) được đóng dấu chữ ký của cả 2 bên cùng timestamp chính xác.
  - Reservation chuyển trạng thái sang `FULFILLED` (`BR-RES-05`).

---

### `TC-F2-009`: Kích hoạt trạng thái tự động: Storage Unit sang Occupied và Contract sang Active
* **Traceability:** `FS-03`, `FM-02` · `UC-F2-06`, `UC-F2-07` · `BR-CHK-04`
* **Test Type:** State Transition / System Integrity · **Priority:** P1 (Critical)
* **Pre-conditions:** Biên bản bàn giao vừa được ký số hoàn tất.
* **Test Steps:**
  1. Kiểm tra trạng thái của `StorageUnit` trong CSDL và trên sơ đồ mặt bằng.
  2. Kiểm tra trạng thái của `RentalContract` trong danh sách hợp đồng.
* **Expected Result:**
  - `StorageUnit.status` chuyển từ `RESERVED` sang `OCCUPIED`.
  - Trên sơ đồ mặt bằng, ô kho chuyển sang màu đỏ (Occupied).
  - `RentalContract.status` chuyển từ `PENDING_CHECKIN` sang `ACTIVE`.
  - Ngày bắt đầu thực tế (`actual_start_date`) được ghi nhận là ngày ký biên bản.

---

### `TC-F2-010`: Khách đến Check-in trễ trong khoảng thời gian ân hạn (<= 10 ngày)
* **Traceability:** `FS-01`, `FM-02` · `UC-F2-08` · `BR-CAN-04`, `BR-CHK-05`
* **Test Type:** Boundary / Positive · **Priority:** P2 (High)
* **Pre-conditions:** Hợp đồng có ngày bắt đầu thuê là `01/10/2026`.
* **Test Steps:**
  1. Khách hàng đến nhận kho vào ngày `06/10/2026` (trễ 5 ngày so với lịch hẹn, nhưng nằm trong khoảng ân hạn 10 ngày).
  2. Nhân viên tra cứu đơn đặt chỗ và tiến hành thủ tục bàn giao.
* **Expected Result:**
  - Hệ thống cho phép thực hiện Check-in bình thường, không phạt phí.
  - Lưu ý quy tắc thời hạn: Hợp đồng vẫn giữ nguyên ngày kết thúc theo hợp đồng ban đầu (không được bù 5 ngày trễ).

---

### `TC-F2-011`: Xử lý khách No-show quá 10 ngày: Hủy hợp đồng, hoàn tiền thuê, tịch thu 100% cọc
* **Traceability:** `FS-01`, `FM-02` · `UC-F2-08` · `BR-CAN-04`
* **Test Type:** Boundary / Financial Rule (System Automation) · **Priority:** P1 (Critical)
* **Pre-conditions:** Đơn đặt chỗ đã thanh toán 6.000.000 VND (4.500.000đ tiền thuê + 1.500.000đ tiền cọc). Ngày bắt đầu thuê là `01/10/2026`.
* **Test Steps:**
  1. Đến hết 23:59 ngày `11/10/2026` (quá 10 ngày ân hạn `checkin.grace_days`), khách hàng hoàn toàn không đến check-in (No-show).
  2. Cronjob tự động quét các đơn No-show chạy lúc 00:00 ngày `12/10/2026`.
* **Expected Result:**
  - Hệ thống tự động kích hoạt hủy do No-show theo `BR-CAN-04`:
    - Tiền thuê N tháng: Hoàn trả 100% ($4.500.000\ \text{VND}$) cho khách hàng.
    - Tiền cọc Deposit: Tịch thu 100% ($1.500.000\ \text{VND}$) sung vào doanh thu phạt của cơ sở (`cancel.no_show_refund_rate = 0%`).
  - Hợp đồng chuyển sang `CANCELLED_NO_SHOW`.
  - Ô kho được tự động giải phóng từ `RESERVED` về lại `AVAILABLE`.

---

### `TC-F2-012`: Facility Manager phân công Facility Staff phụ trách bàn giao trong ngày
* **Traceability:** `FM-05`, `FS-06` · `UC-F2-09`
* **Test Type:** Functional (Positive) · **Priority:** P2 (High)
* **Pre-conditions:** Facility Manager đăng nhập. Hôm nay có 3 lịch hẹn check-in của khách.
* **Test Steps:**
  1. Facility Manager vào mục "Quản lý ca trực & Phân công" (`/manager/roster`).
  2. Chọn nhân viên "Trần Văn Staff B" và gán phụ trách ca trực bàn giao từ 08:00 đến 12:00.
  3. Bấm "Lưu phân công".
* **Expected Result:**
  - Nhân viên Staff B đăng nhập sẽ thấy danh sách 3 khách cần tiếp đón check-in trong tab "Công việc hằng ngày" (`/staff/daily-tasks`).

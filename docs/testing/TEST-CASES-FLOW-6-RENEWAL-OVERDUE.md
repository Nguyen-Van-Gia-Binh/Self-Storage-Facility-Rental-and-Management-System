# Test Suite: Flow 6 — Gia hạn thuê & Xử lý quá hạn (Storage Renewal & Overdue Handling Flow)

> **Tài liệu tham chiếu:** [TOPIC.md § 5.1](../TOPIC.md#flow-6--storage-renewal-and-overdue-handling-flow) · [USE-CASES.md § 7](../USE-CASES.md#7-flow-6--storage-renewal-and-overdue-handling) · [BUSINESS-RULES.md § 7, 8, 14](../BUSINESS-RULES.md) · [API-SPEC.md](../API-SPEC.md)  
> **Workstream phụ trách:** WS3 (Tài chính & Tự động hóa) · Phối hợp: WS1, WS2  
> **Mã Use Case bao phủ:** `UC-F6-01` đến `UC-F6-11` (11 Use Cases)  
> **Mã Yêu cầu bao phủ:** `SC-03`, `SC-05`, `FM-03`, `FM-04`, `FM-06`, `BM-02`, `BM-03`

---

## 1. Danh sách ca kiểm thử (Test Cases Summary)

| Test Case ID | Test Summary | Sub-flow / UC | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-F6-001` | Hệ thống gửi thông báo nhắc gia hạn tự động trước 60 ngày và đếm ngược 7, 3, 1 ngày | 6.1 · `UC-F6-01` | System Cron | P1 |
| `TC-F6-002` | Khách gửi yêu cầu gia hạn hợp lệ trước ngày kết thúc ít nhất 30 ngày | 6.1 · `UC-F6-02` | Positive | P1 |
| `TC-F6-003` | Từ chối yêu cầu gia hạn khi ô kho đã có người đặt trước trong tương lai | 6.1 · `UC-F6-02` | Negative / Constraint | P1 |
| `TC-F6-004` | Khóa chức năng gia hạn khi thời gian thuê còn lại dưới 30 ngày (quá mốc khóa) | 6.1 · `UC-F6-02` | Boundary / Business Rule | P1 |
| `TC-F6-005` | Khách hàng thanh toán phí gia hạn N tháng qua cổng thanh toán trực tuyến | 6.1 · `UC-F6-03` | Financial (Positive) | P1 |
| `TC-F6-006` | Hệ thống tự động cập nhật ngày kết thúc hợp đồng, giữ nguyên mã PIN và ô kho | 6.1 · `UC-F6-04` | State Transition | P1 |
| `TC-F6-007` | Hợp đồng tự động chuyển trạng thái *Overdue* tại 00:00 ngày D+1 khi chưa dọn đồ | 6.2 · `UC-F6-05` | System Automation | P1 |
| `TC-F6-008` | Giai đoạn ân hạn (D+1 đến D+3): Gửi thông báo nhắc dọn đồ, miễn phí phạt, giữ quyền PIN | 6.2 · `UC-F6-08` | Boundary / Positive | P1 |
| `TC-F6-009` | Khách dọn đồ xong trong thời gian ân hạn (trước hết ngày D+3): Hoàn trả 100% tiền cọc | 6.2 · `UC-F6-08` | Financial / Policy | P1 |
| `TC-F6-010` | Bắt đầu tính phí quá hạn từ ngày D+4 (Mỗi ngày phạt 10% tiền cọc Deposit) | 6.2 · `UC-F6-06` | Calculation / BVA | P1 |
| `TC-F6-011` | Phạt quá hạn dồn tích chạm trần tối đa 70% tiền cọc vào ngày D+10 | 6.2 · `UC-F6-06` | Financial / Cap Rate | P1 |
| `TC-F6-012` | Tự động chấm dứt hợp đồng, khóa vĩnh viễn mã PIN khi quá hạn 10 ngày (D+11) | 6.2 · `UC-F6-07`, `UC-F6-11` | Security / State Transition | P1 |
| `TC-F6-013` | Nhân viên dọn kho, niêm phong tài sản tồn đọng chuyển vào kho tổng ngoại tuyến | 6.2 · `UC-F6-09` | Offline Operation | P2 |
| `TC-F6-014` | Facility Manager theo dõi danh sách hợp đồng quá hạn và tiến trình xử lý | 6.2 · `UC-F6-10` | Reporting | P2 |

---

## 2. Chi tiết các ca kiểm thử (Detailed Test Specifications)

### `TC-F6-001`: Hệ thống gửi thông báo nhắc gia hạn tự động trước 60 ngày và đếm ngược 7, 3, 1 ngày
* **Traceability:** `SC-05`, `BM-02` · `UC-F6-01` · `BR-REN-01`
* **Test Type:** System Automation (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Hợp đồng `CTR-6001` có ngày hết hạn là `30/11/2026`. Mốc khóa gia hạn là `31/10/2026` (trước 30 ngày).
* **Test Steps:**
  1. Kiểm tra kích hoạt gửi thông báo tại các mốc thời gian:
     - Mốc 1: Ngày `01/10/2026` (Trước ngày hết hạn 60 ngày).
     - Mốc 2: Ngày `24/10/2026` (Đếm ngược 7 ngày trước mốc khóa).
     - Mốc 3: Ngày `28/10/2026` (Đếm ngược 3 ngày trước mốc khóa).
     - Mốc 4: Ngày `30/10/2026` (Đếm ngược 1 ngày trước mốc khóa).
* **Expected Result:**
  - Tại mỗi mốc, cronjob gửi email và push notification thành công đến khách hàng.
  - Nội dung thông báo nêu rõ: Số ngày còn lại để thực hiện gia hạn, hướng dẫn các bước gia hạn online và cảnh báo sau ngày 31/10/2026 sẽ tự động chuyển sang tiến trình trả kho.

---

### `TC-F6-002`: Khách gửi yêu cầu gia hạn hợp lệ trước ngày kết thúc ít nhất 30 ngày
* **Traceability:** `SC-05` · `UC-F6-02` · `BR-REN-02`, `BR-REN-03`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Hợp đồng có hạn đến `30/11/2026`. Hôm nay là `15/10/2026` (> 30 ngày). Ô kho không có ai đặt trước cho kỳ sau.
* **Test Steps:**
  1. Khách hàng vào chi tiết hợp đồng trên portal.
  2. Bấm nút "Gia hạn hợp đồng".
  3. Chọn thời hạn gia hạn thêm: `3 tháng`.
  4. Bấm "Xác nhận gia hạn".
* **Expected Result:**
  - Hệ thống kiểm tra hợp lệ: Ô kho sẵn sàng, thời điểm gia hạn đúng quy định.
  - Hệ thống tự động tính chi phí gia hạn theo đơn giá hiện hành (ví dụ: $1.500.000 \times 3 = 4.500.000\ \text{VND}$).
  - Khách hàng không phải đóng lại tiền cọc Deposit (vì cọc cũ vẫn đang giữ).
  - Chuyển hướng sang cổng thanh toán trực tuyến.

---

### `TC-F6-003`: Từ chối yêu cầu gia hạn khi ô kho đã có người đặt trước trong tương lai
* **Traceability:** `SC-05`, `FM-04` · `UC-F6-02` · `BR-REN-02`, `BR-AVL-01`
* **Test Type:** Business Rule / Constraint (Negative) · **Priority:** P1 (Critical)
* **Pre-conditions:** Ô kho `M-102` đang thuê đến `30/11/2026`. Trước đó, khách hàng C đã đặt chỗ và thanh toán giữ ô `M-102` cho kỳ tiếp theo bắt đầu từ `01/12/2026`.
* **Test Steps:**
  1. Khách hàng đang thuê bấm "Gia hạn hợp đồng" thêm 3 tháng (từ 01/12/2026 đến 28/02/2027).
* **Expected Result:**
  - Hệ thống phát hiện xung đột giao thoa thời gian (`BR-AVL-02`).
  - Hệ thống từ chối gia hạn với thông báo: *"Rất tiếc, ô kho này đã được khách hàng khác đặt chỗ trước cho kỳ tiếp theo. Hệ thống không thể gia hạn ô kho hiện tại. Bạn vui lòng trả kho khi đến hạn hoặc liên hệ quản lý để được hỗ trợ đặt ô kho khác."*
  - Hợp đồng chuyển sang quy trình chuẩn bị trả kho.

---

### `TC-F6-004`: Khóa chức năng gia hạn khi thời gian thuê còn lại dưới 30 ngày
* **Traceability:** `SC-05` · `UC-F6-02` · `BR-REN-01`, `BR-RET-01`
* **Test Type:** Boundary / Policy Enforcement · **Priority:** P1 (Critical)
* **Pre-conditions:** Hợp đồng có hạn đến `31/10/2026`. Hôm nay là `02/10/2026` (chỉ còn 29 ngày nữa là hết hạn, tức vi phạm mốc tối thiểu 30 ngày).
* **Test Steps:**
  1. Khách hàng truy cập vào chi tiết hợp đồng trên portal.
* **Expected Result:**
  - Nút "Gia hạn hợp đồng" bị khóa (disabled) hoặc ẩn.
  - Hiển thị thông báo: *"Đã quá thời hạn cho phép gia hạn (yêu cầu trước hạn tối thiểu 30 ngày). Hợp đồng đã tự động chuyển sang tiến trình trả kho vào ngày 31/10/2026."*

---

### `TC-F6-005`: Khách hàng thanh toán phí gia hạn N tháng qua cổng thanh toán trực tuyến
* **Traceability:** `SC-03` · `UC-F6-03` · `BR-REN-04`
* **Test Type:** Financial / Integration (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Khách hàng đang ở màn hình thanh toán phí gia hạn 3 tháng (4.500.000 VND).
* **Test Steps:**
  1. Thực hiện quét mã VietQR thanh toán 4.500.000 VND.
  2. Webhook thanh toán báo trạng thái `SUCCESS`.
* **Expected Result:**
  - Tạo giao dịch thanh toán loại `PAYMENT_RENEWAL` với số tiền 4.500.000 VND.
  - Gửi hóa đơn điện tử gia hạn về email của khách.

---

### `TC-F6-006`: Hệ thống tự động cập nhật ngày kết thúc hợp đồng, giữ nguyên mã PIN và ô kho
* **Traceability:** `FM-04` · `UC-F6-04` · `BR-REN-05`
* **Test Type:** State Transition / System Integrity · **Priority:** P1 (Critical)
* **Pre-conditions:** Thanh toán gia hạn 3 tháng vừa thành công cho hợp đồng hạn cũ là `30/11/2026`.
* **Test Steps:**
  1. Kiểm tra thông tin `RentalContract` trong CSDL.
  2. Kiểm tra mã PIN mở cửa của ô kho.
* **Expected Result:**
  - Ngày kết thúc mới (`end_date`) được tự động dời thành: `28/02/2027` (cộng thêm đúng 3 tháng).
  - Trạng thái hợp đồng tiếp tục duy trì là `ACTIVE`.
  - Ô kho vật lý vẫn là ô cũ (`M-102`), mã PIN truy cập cũ của khách tiếp tục có hiệu lực đến ngày `28/02/2027` (không bị đổi mã PIN, không cần làm lại thủ tục check-in).

---

### `TC-F6-007`: Hợp đồng tự động chuyển trạng thái Overdue tại 00:00 ngày D+1 khi chưa dọn đồ
* **Traceability:** `FM-04` · `UC-F6-05` · `BR-OVD-01`
* **Test Type:** System Automation (State Transition) · **Priority:** P1 (Critical)
* **Pre-conditions:** Hợp đồng `CTR-6002` có ngày hết hạn là `30/09/2026`. Đến 23:59 ngày `30/09/2026` khách hàng chưa thực hiện nghiệm thu trả kho.
* **Test Steps:**
  1. Giả lập thời gian hệ thống chuyển sang `00:00:01` ngày `01/10/2026` (Ngày D+1).
  2. Cronjob phát hiện quá hạn chạy tự động.
* **Expected Result:**
  - Hợp đồng `CTR-6002` chuyển trạng thái từ `ACTIVE` sang `OVERDUE`.
  - Ghi nhận `overdue_start_date = 01/10/2026`.
  - Hợp đồng được đánh dấu cảnh báo màu đỏ trên portal của Facility Manager.

---

### `TC-F6-008`: Giai đoạn ân hạn (D+1 đến D+3): Gửi nhắc dọn đồ, miễn phí phạt, giữ quyền PIN
* **Traceability:** `FM-04`, `SC-05` · `UC-F6-08` · `BR-OVD-02`, `BR-ACC-02`
* **Test Type:** Boundary / Policy Testing · **Priority:** P1 (Critical)
* **Pre-conditions:** Hợp đồng đang ở các ngày quá hạn D+1, D+2, D+3 (`01/10` đến `03/10/2026`).
* **Test Steps:**
  1. Khách hàng dùng mã PIN hiện tại đến cơ sở mở cửa kho để dọn đồ.
  2. Kiểm tra hóa đơn công nợ của hợp đồng trong 3 ngày này.
* **Expected Result:**
  - Mã PIN truy cập vẫn **mở cửa bình thường** (chưa bị khóa quyền).
  - Phí phạt quá hạn phát sinh = **0 VND** (Ân hạn 3 ngày theo `BR-OVD-02`).
  - Hệ thống tự động gửi tin nhắn/email hằng ngày nhắc khách: *"Hợp đồng của bạn đã quá hạn. Bạn đang trong giai đoạn ân hạn 3 ngày (miễn phí phạt). Vui lòng dọn đồ trước 23:59 ngày D+3 để nhận lại 100% tiền cọc."*

---

### `TC-F6-009`: Khách dọn đồ xong trong thời gian ân hạn: Hoàn trả 100% tiền cọc
* **Traceability:** `FM-04` · `UC-F6-08` · `BR-OVD-02`
* **Test Type:** Financial / Policy (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Khách hàng dọn xong toàn bộ đồ vào lúc 16:00 ngày D+3 (`03/10/2026`). Tiền cọc là 1.500.000 VND.
* **Test Steps:**
  1. Nhân viên thực hiện nghiệm thu hiện trạng kho sạch sẽ, đạt chuẩn.
  2. Bấm hoàn tất nghiệm thu trả kho.
* **Expected Result:**
  - Vì hoàn tất trong thời gian ân hạn (D+3), phí quá hạn = 0 VND.
  - Khách hàng được nhận lại **100% tiền cọc Deposit** ($1.500.000\ \text{VND}$).
  - Hợp đồng kết thúc êm đẹp, chuyển sang `COMPLETED`.

---

### `TC-F6-010`: Bắt đầu tính phí quá hạn từ ngày D+4 (Mỗi ngày phạt 10% tiền cọc Deposit)
* **Traceability:** `FM-04`, `BM-03` · `UC-F6-06` · `BR-OVD-03`
* **Test Type:** Financial Calculation / BVA · **Priority:** P1 (Critical)
* **Pre-conditions:** Tiền cọc Deposit = 1.500.000 VND. Khách hàng chưa dọn đồ đến ngày D+4 (`04/10/2026`).
* **Test Steps:**
  1. Giả lập thời gian chạy cronjob tính phí quá hạn vào 00:00 ngày D+4.
* **Expected Result:**
  - Hệ thống áp dụng quy tắc `BR-OVD-03`: Tính phí quá hạn 10% tiền cọc mỗi ngày.
  - Phí quá hạn ngày D+4: $1.500.000 \times 10\% = 150.000\ \text{VND}$.
  - Tổng phí quá hạn lũy kế ghi nhận = 150.000 VND.
  - Gửi thông báo đến khách thông báo đã bắt đầu tính phí phạt 150.000đ/ngày.

---

### `TC-F6-011`: Phạt quá hạn dồn tích chạm trần tối đa 70% tiền cọc vào ngày D+10
* **Traceability:** `FM-04`, `BM-03` · `UC-F6-06` · `BR-OVD-04`
* **Test Type:** Financial / Cap Rate Testing · **Priority:** P1 (Critical)
* **Pre-conditions:** Tiền cọc Deposit = 1.500.000 VND. Quá hạn kéo dài liên tục từ D+4 đến D+10 (`04/10` đến `10/10/2026` = 7 ngày tính phí).
* **Test Steps:**
  1. Theo dõi số tiền phạt tích lũy qua từng ngày từ D+4 đến D+10.
* **Expected Result:**
  - Ngày D+4: 1 ngày x 150.000đ = 150.000đ (10%).
  - Ngày D+5: 2 ngày x 150.000đ = 300.000đ (20%).
  - ...
  - Ngày D+10: 7 ngày x 150.000đ = $1.050.000\ \text{VND}$ (Đúng bằng **70% tiền cọc** theo `BR-OVD-04`).
  - Hệ thống kích hoạt cảnh báo đỏ khẩn cấp: Ngày cuối cùng trước khi chấm dứt hợp đồng và niêm phong kho.

---

### `TC-F6-012`: Tự động chấm dứt hợp đồng, khóa vĩnh viễn mã PIN khi quá hạn 10 ngày (D+11)
* **Traceability:** `FM-04` · `UC-F6-07`, `UC-F6-11` · `BR-OVD-05`, `BR-ACC-02`
* **Test Type:** Security / Access Control / State Transition · **Priority:** P1 (Critical)
* **Pre-conditions:** Hết ngày D+10 khách vẫn không dọn đồ.
* **Test Steps:**
  1. Giả lập thời gian chuyển sang 00:00 ngày D+11 (`11/10/2026`).
  2. Cronjob xử lý vi phạm hợp đồng kích hoạt.
  3. Khách hàng thử nhập mã PIN tại cửa kho.
* **Expected Result:**
  - Hợp đồng chuyển sang trạng thái `TERMINATED` (Chấm dứt do vi phạm quá hạn).
  - Mã PIN truy cập bị **KHÓA VĨNH VIỄN** (`REVOKED`), cửa từ chối mở.
  - Ô kho chuyển sang trạng thái `CLEANING` / `UNDER_INSPECTION`.
  - Tiền cọc Deposit còn lại sau phạt ($1.500.000 - 1.050.000 = 450.000\ \text{VND}$) được chuyển vào quỹ xử lý lưu kho ngoại tuyến.

---

### `TC-F6-013`: Nhân viên dọn kho, niêm phong tài sản tồn đọng chuyển vào kho tổng ngoại tuyến
* **Traceability:** `FS-05`, `FM-04`, `BM-02` · `UC-F6-09` · `BR-OVD-07`
* **Test Type:** Operational / Physical Inspection · **Priority:** P2 (High)
* **Pre-conditions:** Hợp đồng vừa bị `TERMINATED` vào ngày D+11.
* **Test Steps:**
  1. FM phân công Staff tiến hành dọn kho `M-102`.
  2. Nhân viên mở kho (bằng chìa khóa master), lập biên bản kiểm kê tài sản còn sót lại.
  3. Đóng thùng, dán tem niêm phong có chữ ký FM và Staff, chuyển vào kho lưu trữ tổng của cơ sở.
  4. Xác nhận dọn kho hoàn tất trên hệ thống.
* **Expected Result:**
  - Biên bản kiểm kê niêm phong tài sản được lưu trữ dạng hồ sơ pháp lý ngoại tuyến (`BR-OVD-07`).
  - Ô kho `M-102` sau khi được vệ sinh sạch sẽ chuyển sang `AVAILABLE` để đưa vào kinh doanh trở lại.

---

### `TC-F6-014`: Facility Manager theo dõi danh sách hợp đồng quá hạn và tiến trình xử lý
* **Traceability:** `FM-06` · `UC-F6-10`
* **Test Type:** Functional / Reporting · **Priority:** P2 (High)
* **Pre-conditions:** FM đăng nhập vào cơ sở.
* **Test Steps:**
  1. Vào menu "Hợp đồng quá hạn" (`/manager/overdue-contracts`).
* **Expected Result:**
  - Bảng danh sách hiển thị chi tiết: Mã hợp đồng, Khách hàng, SĐT, Số ngày quá hạn hiện tại (D+X), Tổng phí phạt đã tích lũy, Trạng thái mã PIN (Đang mở hay Đã khóa).
  - Có các nút tác vụ nhanh: "Gửi nhắc nhở thủ công", "Xem lịch sử thông báo", "Lập lệnh niêm phong dọn dẹp".

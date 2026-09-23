# Test Suite: Flow 4 — Vận hành kinh doanh, Chính sách & Giám sát doanh thu (Business Operations & Revenue Flow)

> **Tài liệu tham chiếu:** [TOPIC.md § 4.4](../TOPIC.md#flow-4--business-rules-fee-management-and-revenue-monitoring-flow) · [USE-CASES.md § 5](../USE-CASES.md#5-flow-4--business-rules-fee-management-and-revenue-monitoring) · [BUSINESS-RULES.md § 1, 2, 4](../BUSINESS-RULES.md) · [API-SPEC.md](../API-SPEC.md)  
> **Workstream phụ trách:** WS3 (Tài chính & Tự động hóa) · Phối hợp: WS1, WS2, WS4  
> **Mã Use Case bao phủ:** `UC-F4-01` đến `UC-F4-12` (12 Use Cases)  
> **Mã Yêu cầu bao phủ:** `BM-01`, `BM-02`, `BM-03`, `BM-04`, `BM-05`

---

## 1. Danh sách ca kiểm thử (Test Cases Summary)

| Test Case ID | Test Summary | Use Case | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-F4-001` | BOM tạo mới một cơ sở lưu trữ (Facility) vào hệ thống | `UC-F4-01` | Positive | P1 |
| `TC-F4-002` | Cập nhật thông tin cơ sở và chặn chuyển sang *Inactive* khi còn hợp đồng hiệu lực | `UC-F4-01` | Business Rule / Validation | P1 |
| `TC-F4-003` | Cấu hình hệ số tiền cọc `deposit.multiplier` và xác nhận cơ chế không hồi tố | `UC-F4-02` | Financial / Policy | P1 |
| `TC-F4-004` | Cấu hình tham số thời gian giữ chỗ chờ thanh toán `reservation.hold_hours` | `UC-F4-02` | Functional (Positive) | P2 |
| `TC-F4-005` | Cấu hình chính sách hủy đặt chỗ và các mốc tỷ lệ hoàn tiền | `UC-F4-04` | Financial / Policy | P1 |
| `TC-F4-006` | Cấu hình chính sách xử lý quá hạn: Số ngày ân hạn và tỷ lệ phạt lũy tiến | `UC-F4-06` | Financial / Policy | P1 |
| `TC-F4-007` | Thiết lập biểu giá thuê theo cặp Unit Type x Facility (Làm tròn 1.000 VND) | `UC-F4-07` | Financial / BVA | P1 |
| `TC-F4-008` | Quản lý bảng phụ phí dịch vụ và biểu giá bồi thường thiệt hại | `UC-F4-08` | Functional (Positive) | P2 |
| `TC-F4-009` | Cấu hình và áp dụng mã giảm giá / khuyến mãi theo thời hạn thuê | `UC-F4-09` | Positive & Boundary | P2 |
| `TC-F4-010` | Giám sát Dashboard doanh thu toàn hệ thống và phân tích theo cơ sở | `UC-F4-10` | Reporting / Calculation | P1 |
| `TC-F4-011` | Giám sát tỷ lệ lấp đầy / sử dụng kho (Usage Rate) theo thời gian thực | `UC-F4-11` | Metric / Formula | P1 |
| `TC-F4-012` | Xuất báo cáo tài chính và vận hành toàn hệ thống (Excel / CSV) | `UC-F4-12` | Data Export | P2 |

---

## 2. Chi tiết các ca kiểm thử (Detailed Test Specifications)

### `TC-F4-001`: BOM tạo mới một cơ sở lưu trữ (Facility) vào hệ thống
* **Traceability:** `BM-01` · `UC-F4-01`
* **Test Type:** Functional (Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Business Operations Manager đăng nhập (`bom_user`).
* **Test Steps:**
  1. Vào menu "Quản lý cơ sở" (`/bom/facilities`).
  2. Bấm nút "Thêm cơ sở mới".
  3. Điền thông tin:
     - Tên cơ sở: "Cơ sở Tân Bình - Chi nhánh 3"
     - Địa chỉ: "123 Đường Cộng Hòa, Phường 13, Quận Tân Bình, TP.HCM"
     - Hotline: "02873009999"
     - Giờ hoạt động: "07:00 - 22:00"
     - Tổng diện tích sàn: 1500 m²
  4. Bấm "Lưu cơ sở".
* **Expected Result:**
  - Cơ sở mới được tạo thành công với trạng thái mặc định `ACTIVE`.
  - Bản ghi lưu vào bảng `facility` với đầy đủ thông tin.
  - Cơ sở xuất hiện trong danh sách cơ sở toàn hệ thống.

---

### `TC-F4-002`: Cập nhật thông tin cơ sở và chặn chuyển sang Inactive khi còn hợp đồng hiệu lực
* **Traceability:** `BM-01` · `UC-F4-01` · `BR-GEN-01`
* **Test Type:** Business Rule / Validation (Negative & Positive) · **Priority:** P1 (Critical)
* **Pre-conditions:** Cơ sở Quận 9 hiện đang có 5 hợp đồng thuê ở trạng thái `ACTIVE`.
* **Test Steps:**
  1. BOM chọn Cơ sở Quận 9, chọn "Chỉnh sửa".
  2. Đổi trạng thái từ `ACTIVE` sang `INACTIVE` (Đóng cửa cơ sở).
  3. Bấm "Cập nhật".
* **Expected Result:**
  - Hệ thống từ chối cập nhật trạng thái `INACTIVE`, trả về mã lỗi `409 Conflict`.
  - Hiển thị thông báo ràng buộc: *"Không thể tạm dừng hoạt động cơ sở này vì hiện tại vẫn còn 5 hợp đồng đang có hiệu lực. Vui lòng thanh lý hoặc di dời hết hợp đồng trước khi đóng cơ sở."*
  - Khi cơ sở không còn hợp đồng active nào: Cho phép chuyển sang `INACTIVE` thành công.

---

### `TC-F4-003`: Cấu hình hệ số tiền cọc deposit.multiplier và xác nhận cơ chế không hồi tố
* **Traceability:** `BM-02` · `UC-F4-02` · `BR-GEN-02`, `BR-DEP-01`
* **Test Type:** Financial / Policy Versioning · **Priority:** P1 (Critical)
* **Pre-conditions:** Hệ số cọc hiện tại là `1.0`. Khách hàng An đã đặt cọc hợp đồng A với hệ số `1.0` (tiền cọc 1.500.000đ).
* **Test Steps:**
  1. BOM vào trang "Cấu hình chính sách hệ thống" (`/bom/policies`).
  2. Tìm khóa cấu hình `deposit.multiplier`, sửa giá trị từ `1.0` thành `1.5`.
  3. Bấm "Lưu thay đổi" (Hệ thống tạo phiên bản chính sách mới `version = 2`).
  4. Khách hàng Bình vào đặt chỗ một ô kho mới cùng loại.
  5. Kiểm tra hợp đồng cũ của Khách An.
* **Expected Result:**
  - Đơn đặt chỗ mới của Khách Bình: Áp dụng hệ số mới $1.5 \implies \text{Tiền cọc} = 1.500.000 \times 1.5 = 2.250.000\ \text{VND}$.
  - Hợp đồng cũ của Khách An: **Không bị hồi tố** (`BR-GEN-02`), tiền cọc đã nộp vẫn giữ nguyên snapshot 1.500.000 VND.

---

### `TC-F4-004`: Cấu hình tham số thời gian giữ chỗ chờ thanh toán reservation.hold_hours
* **Traceability:** `BM-02` · `UC-F4-02` · `BR-DEP-03`
* **Test Type:** Functional (Positive) · **Priority:** P2 (High)
* **Pre-conditions:** Giá trị mặc định là 48 giờ.
* **Test Steps:**
  1. BOM vào cấu hình chính sách, chỉnh sửa khóa `reservation.hold_hours` thành `24` giờ.
  2. Bấm "Lưu".
  3. Khách hàng tạo một đơn đặt chỗ mới.
* **Expected Result:**
  - Đơn đặt chỗ mới có thời gian đếm ngược thanh toán bắt đầu từ `23:59:59` thay vì `47:59:59`.

---

### `TC-F4-005`: Cấu hình chính sách hủy đặt chỗ và các mốc tỷ lệ hoàn tiền
* **Traceability:** `BM-02` · `UC-F4-04` · `BR-CAN-01`, `BR-CAN-02`
* **Test Type:** Financial / Policy · **Priority:** P1 (Critical)
* **Pre-conditions:** BOM đang ở màn hình cấu hình chính sách hủy và hoàn tiền.
* **Test Steps:**
  1. Xem và cấu hình các thông số:
     - `cancel.full_refund_hours`: 48 giờ (hủy trước 48h hoàn 100% cọc).
     - `cancel.late_refund_rate`: 50% (hủy muộn dưới 48h hoàn 50% cọc).
     - `cancel.no_show_refund_rate`: 0% (không đến nhận hoàn 0% cọc).
  2. Thử nghiệm nhập tỷ lệ âm (ví dụ `-10%`) hoặc lớn hơn `100%`.
* **Expected Result:**
  - Nhập giá trị hợp lệ (0% - 100%): Hệ thống lưu thành công.
  - Nhập giá trị âm hoặc > 100%: Hệ thống validate báo lỗi *"Tỷ lệ hoàn tiền phải nằm trong khoảng từ 0% đến 100%"*.

---

### `TC-F4-006`: Cấu hình chính sách xử lý quá hạn: Số ngày ân hạn và tỷ lệ phạt lũy tiến
* **Traceability:** `BM-02` · `UC-F4-06` · `BR-OVD-02`, `BR-OVD-03`, `BR-OVD-04`
* **Test Type:** Financial / Policy · **Priority:** P1 (Critical)
* **Pre-conditions:** BOM ở màn hình chính sách Quá hạn (Overdue Policy).
* **Test Steps:**
  1. Kiểm tra các tham số mặc định:
     - `overdue.grace_days`: 3 ngày (D+1 đến D+3 ân hạn chưa phạt tiền).
     - `overdue.daily_rate`: 10% (mỗi ngày phạt 10% tiền cọc).
     - `overdue.cap_rate`: 70% (trần phạt tối đa 70% tiền cọc).
     - `overdue.termination_days`: 10 ngày (D+10 chấm dứt hợp đồng, khóa PIN).
  2. BOM lưu cấu hình.
* **Expected Result:**
  - Các tham số được ghi nhận và đồng bộ vào cronjob tính phí phạt hằng ngày.

---

### `TC-F4-007`: Thiết lập biểu giá thuê theo cặp Unit Type x Facility (Làm tròn 1.000 VND)
* **Traceability:** `BM-03` · `UC-F4-07` · `BR-GEN-04`, `BR-GEN-05`
* **Test Type:** Financial / BVA · **Priority:** P1 (Critical)
* **Pre-conditions:** Hệ thống có Loại kho "Large Unit" và Cơ sở Quận 7.
* **Test Steps:**
  1. Vào bảng giá thuê (`/bom/pricing`).
  2. Chọn Cơ sở: "Cơ sở Quận 7", Loại kho: "Large Unit".
  3. Nhập đơn giá tháng: `2.499.500 VND`.
  4. Bấm "Áp dụng giá mới".
* **Expected Result:**
  - Hệ thống áp dụng quy tắc làm tròn `BR-GEN-04`: Tự động làm tròn lên thành `2.500.000 VND`.
  - Giá được lưu vào bảng `facility_unit_type_price` có hiệu lực ngay cho các Reservation mới tạo sau thời điểm lưu.

---

### `TC-F4-008`: Quản lý bảng phụ phí dịch vụ và biểu giá bồi thường thiệt hại
* **Traceability:** `BM-03` · `UC-F4-08`
* **Test Type:** Functional (Positive) · **Priority:** P2 (High)
* **Pre-conditions:** BOM ở trang quản lý phụ phí.
* **Test Steps:**
  1. Thêm một mục phụ phí mới:
     - Tên khoản phí: "Phí vệ sinh kho bẩn đặc biệt"
     - Mã phí: `FEE_CLEAN_DIRT`
     - Số tiền cố định: `300.000 VND`
  2. Cập nhật mức bồi thường: "Mất chìa khóa cơ" = `200.000 VND`.
  3. Bấm "Lưu danh mục phí".
* **Expected Result:**
  - Danh mục phí được cập nhật thành công, xuất hiện trên dropdown lựa chọn của Staff khi lập biên bản nghiệm thu trả kho.

---

### `TC-F4-009`: Cấu hình và áp dụng mã giảm giá / khuyến mãi theo thời hạn thuê
* **Traceability:** `BM-03` · `UC-F4-09`
* **Test Type:** Functional / Boundary · **Priority:** P2 (High)
* **Pre-conditions:** BOM tạo chính sách khuyến mãi: "Thuê từ 6 tháng trở lên giảm 10% tổng tiền thuê".
* **Test Steps:**
  1. Khách hàng A đặt thuê 3 tháng (không đủ điều kiện giảm giá).
  2. Khách hàng B đặt thuê 6 tháng (đủ điều kiện giảm 10%).
* **Expected Result:**
  - Khách A: Tiền thuê tính nguyên giá 100%.
  - Khách B: Tiền thuê 6 tháng được chiết khấu đúng 10% (ví dụ: $9.000.000 - 10\% = 8.100.000\ \text{VND}$). Tiền cọc Deposit vẫn tính nguyên giá theo đơn giá gốc trước giảm (`BR-DEP-01`).

---

### `TC-F4-010`: Giám sát Dashboard doanh thu toàn hệ thống và phân tích theo cơ sở
* **Traceability:** `BM-04`, `BM-05` · `UC-F4-10`, `UC-F4-12`
* **Test Type:** Reporting / Calculation · **Priority:** P1 (Critical)
* **Pre-conditions:** Trong tháng 09/2026, hệ thống ghi nhận:
  - Cơ sở Quận 9: Thu tiền thuê 45.000.000đ, Thu tiền cọc giữ 15.000.000đ, Thu phạt quá hạn 1.200.000đ.
  - Cơ sở Quận 7: Thu tiền thuê 30.000.000đ, Thu tiền cọc giữ 10.000.000đ, Thu phạt quá hạn 0đ.
* **Test Steps:**
  1. BOM mở Dashboard tài chính (`/bom/dashboard`).
  2. Chọn mốc thời gian: "Tháng 09/2026".
* **Expected Result:**
  - Doanh thu thực tế (Rental + Penalty): $45.000.000 + 1.200.000 + 30.000.000 = 76.200.000\ \text{VND}$.
  - Tiền cọc đang giữ (Escrow/Deposit): $15.000.000 + 10.000.000 = 25.000.000\ \text{VND}$ (tách riêng, không tính vào doanh thu thuần).
  - Biểu đồ cột thể hiện chính xác doanh thu so sánh giữa các cơ sở.

---

### `TC-F4-011`: Giám sát tỷ lệ lấp đầy / sử dụng kho (Usage Rate) theo thời gian thực
* **Traceability:** `BM-04` · `UC-F4-11`
* **Test Type:** Metric / Formula Calculation · **Priority:** P1 (Critical)
* **Pre-conditions:** Cơ sở Quận 9 có tổng 50 ô kho. Trong đó: 35 ô `OCCUPIED`, 5 ô `RESERVED`, 2 ô `MAINTENANCE`, 8 ô `AVAILABLE`.
* **Test Steps:**
  1. BOM xem chỉ số hiệu quả vận hành tại Cơ sở Quận 9.
* **Expected Result:**
  - Tổng số ô kho có thể khai thác: $50 - 2\ (\text{maint}) = 48$ ô kho.
  - Số ô kho đang được sử dụng (Occupied): 35 ô.
  - Tỷ lệ sử dụng (Usage Rate): $\frac{35}{48} \approx 72.9\%$.
  - Tỷ lệ giữ chỗ (Reservation Rate): $\frac{5}{48} \approx 10.4\%$.
  - Hiển thị widget tỷ lệ lấp đầy với màu sắc trực quan (Xanh lá nếu > 70%, Vàng nếu 50-70%, Đỏ nếu < 50%).

---

### `TC-F4-012`: Xuất báo cáo tài chính và vận hành toàn hệ thống (Excel / CSV)
* **Traceability:** `BM-05` · `UC-F4-12`
* **Test Type:** Functional / Data Export · **Priority:** P2 (High)
* **Pre-conditions:** BOM đang ở trang Báo cáo hệ thống (`/bom/reports`).
* **Test Steps:**
  1. Chọn loại báo cáo: "Báo cáo doanh thu & Công nợ theo cơ sở".
  2. Chọn định dạng: `Excel (.xlsx)`.
  3. Bấm "Xuất báo cáo".
* **Expected Result:**
  - File tải xuống thành công, không lỗi encoding font tiếng Việt (UTF-8).
  - Cấu trúc file đúng mẫu gồm: Tiêu đề báo cáo, Ngày kết xuất, Bảng dữ liệu chi tiết có định dạng tiền tệ và dòng Tổng cộng (Grand Total) khớp 100% với số liệu trên giao diện web.

# TÀI LIỆU THIẾT KẾ ERD & TỪ ĐIỂN DỮ LIỆU (DATA DICTIONARY)
**Hệ thống**: Self-Storage Facility Rental and Management System  
**Chuẩn kỹ thuật**: Crow's Foot Notation (Information Engineering - IE Standard)  
**Tài liệu nguồn ánh xạ**: `database/Storage_Self.sql`, `docs/BUSINESS-RULES.md`, `docs/CONVENTIONS.md` Sec 5  
**File sơ đồ PlantUML**:
- Sơ đồ ERD toàn hệ thống: [erd-database-model.puml](diagrams/erd-database-model.puml)
- Sơ đồ ERD phân hệ nghiệp vụ cốt lõi (Core Domain): [erd-core-domain.puml](diagrams/erd-core-domain.puml)

---

## 1. Cơ sở Kỹ nghệ Phần mềm: Kỹ nghệ ngược (Reverse Engineering)

### 1.1. Chu trình thiết kế dữ liệu chuẩn trong SE
Trong quy trình Kỹ nghệ phần mềm (Software Engineering - SE), thiết kế dữ liệu trải qua 4 giai đoạn:
1. **Yêu cầu nghiệp vụ (Business Requirements)**: Lấy từ `BUSINESS-RULES.md` & `USE-CASES.md`.
2. **Mô hình hóa khái niệm (Conceptual Data Model)**: Xác định các thực thể và quan hệ thực tế (Entities & Relationships).
3. **Mô hình hóa logic (Logical Data Model / ERD)**: Chuẩn hóa dữ liệu (1NF, 2NF, 3NF/BCNF), xác định Primary Key (PK), Foreign Key (FK), bảng trung gian, và Cardinality (Bản số quan hệ).
4. **Mô hình hóa vật lý (Physical Database Design - DDL)**: Sinh script SQL cụ thể cho hệ quản trị CSDL (SQL Server, PostgreSQL...) với các kiểu dữ liệu vật lý, Index, Check constraint, Triggers.

### 1.2. Tại sao làm trước Database rồi vẽ ngược lại ERD hoàn toàn đúng chuẩn kỹ thuật?
Trong thực tế phát triển phần mềm doanh nghiệp, phương pháp này được gọi là **Kỹ nghệ ngược (Reverse Engineering)**:
- **Tính chính xác tuyệt đối (100% Consistency)**: Khi vẽ ERD từ DDL đã tối ưu và chuẩn hóa 3NF/BCNF, mọi tên bảng, tên cột, kiểu dữ liệu, ràng buộc khóa chính/ngoại và bản số (cardinality) trên sơ đồ sẽ khớp chính xác 1:1 với CSDL thực thi.
- **Không có sai lệch (Zero Discrepancy)**: Tránh được lỗi phổ biến khi làm đồ án là "ERD vẽ một đằng, tạo bảng CSDL làm một nẻo".
- **Bảo vệ đồ án tự tin**: Bạn có thể giải thích với Giảng viên: *"Em đã hiện thực hóa mô hình quan hệ ở mức vật lý (Physical DDL với đầy đủ kiểm tra toàn vẹn bằng Trigger và Constraint), sau đó trích xuất chuẩn hóa ngược lại sơ đồ ERD theo chuẩn quốc tế Crow's Foot để đảm bảo tính đồng bộ mã nguồn 100%."*

---

## 2. Quy ước Ký hiệu Quốc tế (Crow's Foot / Information Engineering Notation)

Sơ đồ sử dụng chuẩn **Crow's Foot** (chân quạ) do James Martin khởi xướng — chuẩn mực quốc tế phổ biến nhất trong Kỹ nghệ phần mềm:

| Ký hiệu PlantUML | Tên quan hệ | Ý nghĩa nghiệp vụ trong hệ thống | Ví dụ trong hệ thống |
| :---: | :---: | :--- | :--- |
| `\|\|--o{` | **1 to Many (0..*)** | Một thực thể cha có 0 hoặc nhiều thực thể con | 1 `app_user` (Customer) có thể có 0 hoặc nhiều `reservation` |
| `\|\|--\|{` | **1 to Many (1..*)** | Một thực thể cha bắt buộc có ít nhất 1 thực thể con | 1 `facility` bắt buộc phải có từ 1 ô kho `storage_unit` trở lên |
| `\|\|--o\|` | **1 to One (0..1)** | Một thực thể cha có tối đa 1 thực thể con (không bắt buộc) | 1 `reservation` khi thanh toán thành công chuyển thành tối đa 1 `rental_contract` (`uq_rental_contract_reservation_id`) |
| `\|\|--\|\|` | **1 to 1 (Bắt buộc)** | Hai thực thể liên kết 1-1 chặt chẽ | 1 `rental_contract` có đúng 1 `handover_record` khi check-in |
| `\|o--o{` | **Zero/One to Many** | Khóa ngoại có thể NULL | `storage_unit` gắn vào `reservation` (lúc mới tạo Pending Payment là NULL, sau khi thanh toán FM mới gán) |

---

## 3. Bản số & Quy tắc Dữ liệu Nghiệp vụ (Data Business Rules)

Dưới đây là các câu trả lời kỹ thuật cho câu hỏi giảng viên thường chất vấn:

### Q1: Một khách hàng có thể đặt 1 hay nhiều đơn giữ chỗ (Reservation)?
- **Quan hệ**: `app_user (1) ||--o{ reservation (0..*)`
- **Quy tắc**: Một khách hàng có thể tạo nhiều đơn giữ chỗ theo thời gian. Tuy nhiên, hệ thống ràng buộc qua logic: không được tạo đơn mới nếu đang có hợp đồng `Overdue` nợ tiền (`BR-OVD-09`).

### Q2: Quan hệ giữa Reservation và Storage Unit như thế nào?
- **Quan hệ**: `storage_unit (0..1) |o--o{ reservation (0..*)`
- **Quy tắc**:
  - Khi khách tạo đơn ở trạng thái `PENDING_PAYMENT`, `storage_unit_id` là **NULL** (hệ thống chỉ giữ capacity mức pool của loại kho `unit_type` tại cơ sở `facility`).
  - Sau khi khách thanh toán đủ cọc + tiền thuê (`UC-F1-08`, `BR-AVL-04`), Facility Manager mới chọn và gán thủ công một ô kho vật lý cụ thể `storage_unit_id`.
  - Một ô kho vật lý (`storage_unit`) qua các khoảng thời gian khác nhau có thể phục vụ nhiều đơn Reservation khác nhau.

### Q3: Quan hệ giữa Reservation và Contract?
- **Quan hệ**: `reservation (1) ||--o| rental_contract (0..1)`
- **Quy tắc**: Bảng `rental_contract` có ràng buộc duy nhất `uq_rental_contract_reservation_id UNIQUE (reservation_id)`. Do đó, 1 đơn Reservation chỉ có thể sinh ra tối đa **1** Hợp đồng thuê duy nhất. Các đơn bị hủy (`CANCELLED`) hoặc hết hạn (`EXPIRED`) sẽ không bao giờ sinh ra hợp đồng.

### Q4: 1 Hợp đồng gắn với mấy ô kho?
- **Quan hệ**: `storage_unit (1) ||--o{ rental_contract (0..*)`
- **Quy tắc**: Theo `BR-DEP-06`, suốt vòng đời của 1 hợp đồng thuê, khách chỉ thuê **duy nhất 1 ô kho cố định**. Qua năm tháng, 1 ô kho có thể được cho thuê bởi nhiều hợp đồng lịch sử khác nhau.

---

## 4. Danh mục Thực thể & Từ điển Dữ liệu (Data Dictionary)

Hệ thống gồm **24 thực thể** được phân tách thành 6 phân hệ (Domain Packages):

### 4.1. Phân hệ Người dùng & Phân quyền (User & Access Control)
1. **`app_user`**: Tài khoản người dùng (Customer, Facility Staff, Facility Manager, BOM, Admin).
2. **`user_facility_assignment`**: Phân công nhân sự theo chi nhánh/cơ sở (N-N giữa User và Facility).
3. **`login_history`**: Lịch sử đăng nhập, IP, User-Agent để kiểm tra an ninh (`SA-04`).
4. **`audit_log`**: Nhật ký kiểm toán thao tác nhạy cảm (ghi lại `before_value`, `after_value`).

### 4.2. Phân hệ Cơ sở & Ô kho (Facility & Storage Catalog)
5. **`facility`**: Cơ sở kho tự quản (mã kho, địa chỉ, trạng thái Active/Inactive).
6. **`unit_type`**: Danh mục kích thước ô kho chuẩn (S, M, L, XL...).
7. **`facility_unit_type_price`**: Bảng giá thuê theo tháng cho từng cặp Cơ sở x Loại kho.
8. **`storage_unit`**: Từng ô kho vật lý cụ thể (A-101, B-202) kèm trạng thái 6 bước vòng đời (`AVAILABLE`, `RESERVED`, `OCCUPIED`, `CLEANING`, `MAINTENANCE`, `OUT_OF_SERVICE`).

### 4.3. Phân hệ Chính sách & Khuyến mại (Policy & Pricing)
9. **`policy_version`**: Bảng tham số chính sách có phiên bản (`version_no`), lưu hệ số cọc, thời gian ân hạn, tỷ lệ phạt quá hạn, SLA hỗ trợ (`BR-GEN-02`).
10. **`extra_fee_type`**: Danh mục loại phụ phí (phí cấp lại thẻ, phí vệ sinh...).
11. **`discount_program`**: Chương trình ưu đãi, giảm giá theo tỷ lệ % hoặc số tiền cố định.

### 4.4. Phân hệ Vòng đời Hợp đồng Thuê (Core Rental Lifecycle)
12. **`reservation`**: Đơn giữ chỗ ô kho kèm snapshot đơn giá và phiên bản chính sách tại thời điểm đặt (`BR-GEN-05`).
13. **`rental_contract`**: Hợp đồng thuê chính thức, quản lý ngày bắt đầu, kết thúc, ngày quá hạn, tổng phạt.
14. **`contract_renewal`**: Lịch sử các lần gia hạn hợp đồng của khách hàng (`BR-REN-*`).
15. **`handover_record`**: Biên bản bàn giao khi Check-in có chữ ký số 2 bên (`BR-CHK-03`).
16. **`return_request`**: Yêu cầu trả kho, biên bản nghiệm thu hiện trạng và quyết định hoàn tiền cọc (`BR-RET-*`).
17. **`access_credential`**: Mã PIN, QR, thẻ từ, chìa khóa cấp quyền ra vào ô kho (`BR-ACC-*`).

### 4.5. Phân hệ Thanh toán & Sổ cái (Payment & Ledger)
18. **`payment_transaction`**: Nhật ký giao dịch cổng thanh toán (VNPay, Momo, Chuyển khoản).
19. **`ledger_entry`**: Sổ cái tài chính **bất biến** (Immutable ledger: chỉ INSERT, không UPDATE/DELETE) ghi nhận mọi luồng tiền thu/chi/phạt/hoàn cọc (`BR-PAY-06`).
20. **`contract_extra_charge`**: Khoản phụ phí phát sinh cụ thể gắn vào hợp đồng.
21. **`overdue_fee_adjustment_request`**: Đề xuất xin miễn/giảm phạt nợ quá hạn gửi BOM duyệt (`BR-OVD-10`).

### 4.6. Phân hệ Vận hành & Hỗ trợ (Operations & Support)
22. **`support_request`**: Phiếu khiếu nại / yêu cầu hỗ trợ sự cố của khách hàng (`Flow 7`).
23. **`staff_daily_assignment`**: Bảng phân công công việc trong ngày của nhân viên tại cơ sở.
24. **`attachment`**: Quản lý ảnh đính kèm (ảnh biên bản, ảnh hư hỏng, ảnh hiện trường).

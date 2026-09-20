# TỪ ĐIỂN DỮ LIỆU (DATA DICTIONARY)
**Hệ thống**: Self-Storage Facility Rental and Management System  
**Nhiệm vụ trong Kế hoạch**: `T1.11` · Giai đoạn 1 · [docs/PLAN.md](PLAN.md)  
**Tài liệu tham chiếu**: [Storage_Self.sql](../database/Storage_Self.sql), [erd-conceptual.puml](diagrams/_archive/erd-conceptual.puml) (ERD mức khái niệm), [erd-database-model.puml](diagrams/_archive/erd-database-model.puml) (Physical Data Model), [BUSINESS-RULES.md](BUSINESS-RULES.md)  
**Quy ước CSDL**: [CONVENTIONS.md § 5](CONVENTIONS.md#5-cơ-sở-dữ-liệu--sql-server-và-flyway) (`snake_case`, đơn vị tiền `BIGINT`, mốc thời gian `DATETIMEOFFSET`, ngày `DATE`, chuẩn hoá 3NF/BCNF).

---

## Mục lục
1. [Phân hệ Người dùng & Phân quyền (User & Access Control)](#1-phân-hệ-người-dùng--phân-quyền)
2. [Phân hệ Cơ sở & Ô kho (Facility & Storage Catalog)](#2-phân-hệ-cơ-sở--ô-kho)
3. [Phân hệ Chính sách & Khuyến mại (Policy, Pricing & Promotion)](#3-phân-hệ-chính-sách--khuyến-mại)
4. [Phân hệ Vòng đời Hợp đồng Thuê (Core Rental Lifecycle)](#4-phân-hệ-vòng-đời-hợp-đồng-thuê)
5. [Phân hệ Thanh toán & Sổ cái Tài chính (Payment & Ledger)](#5-phân-hệ-thanh-toán--sổ-cái-tài-chính)
6. [Phân hệ Vận hành & Hỗ trợ (Operations & Support)](#6-phân-hệ-vận-hành--hỗ-trợ)

---

## 1. Phân hệ Người dùng & Phân quyền

### 1.1. Bảng `app_user`
Lưu trữ thông tin tài khoản của toàn bộ người dùng trong hệ thống (`SA-01` .. `SA-04`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Định danh duy nhất của người dùng |
| `email` | `NVARCHAR(255)` | Có | `UNIQUE` | Email đăng nhập, định danh duy nhất |
| `password_hash` | `NVARCHAR(255)` | Có | | Mật khẩu băm (BCrypt) |
| `full_name` | `NVARCHAR(150)` | Có | | Họ và tên đầy đủ |
| `phone` | `NVARCHAR(20)` | Không | | Số điện thoại liên hệ |
| `identity_number` | `NVARCHAR(20)` | Không | | Số CCCD / Hộ chiếu để xác minh danh tính khi nhận kho (`BR-CHK-01`); để trống với tài khoản nhân sự |
| `role` | `VARCHAR(30)` | Có | `CHECK (role IN ('STORAGE_CUSTOMER', 'FACILITY_STAFF', 'FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR'))` | Vai trò người dùng (`US-SA-02.1`: mỗi tài khoản đúng 1 vai trò) |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'ACTIVE'`, `CHECK IN ('ACTIVE','INACTIVE')` | Trạng thái hoạt động của tài khoản |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Thời điểm tạo tài khoản |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Thời điểm cập nhật thông tin gần nhất |

### 1.2. Bảng `user_facility_assignment`
Phân quyền quản lý dữ liệu theo cơ sở cho Facility Staff và Facility Manager (`SA-03`, `UC-F5-08`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `user_id` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Nhân viên / Quản lý được phân công |
| `facility_id` | `BIGINT` | Có | `FK` $\rightarrow$ `facility(id)` | Cơ sở được giao quyền quản lý |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Thời điểm gán quyền |

*Ràng buộc duy nhất*: `UNIQUE (user_id, facility_id)`.

### 1.3. Bảng `login_history`
Theo dõi lịch sử đăng nhập phục vụ giám sát bảo mật hệ thống (`SA-04`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `user_id` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Người dùng đăng nhập |
| `logged_in_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Mốc thời gian đăng nhập |
| `ip_address` | `NVARCHAR(64)` | Không | | Địa chỉ IP đăng nhập |
| `user_agent` | `NVARCHAR(255)` | Không | | Thông tin trình duyệt / thiết bị |
| `is_success` | `BIT` | Có | | 1: Thành công, 0: Thất bại |

### 1.4. Bảng `audit_log`
Nhật ký kiểm toán ghi nhận các thao tác nhạy cảm (thay đổi giá, duyệt miễn giảm, cập nhật trạng thái ô kho).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `user_id` | `BIGINT` | Không | `FK` $\rightarrow$ `app_user(id)` | Người thực hiện thao tác (NULL nếu do cron job hệ thống) |
| `action` | `NVARCHAR(100)` | Có | | Tên hành động (vd: `UPDATE_PRICE`, `APPROVE_OVERDUE_WAIVER`) |
| `entity_type` | `NVARCHAR(100)` | Có | | Tên bảng/thực thể bị tác động |
| `entity_id` | `BIGINT` | Có | | ID bản ghi bị tác động |
| `before_value` | `NVARCHAR(MAX)` | Không | | Dữ liệu JSON trước khi đổi |
| `after_value` | `NVARCHAR(MAX)` | Không | | Dữ liệu JSON sau khi đổi |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Mốc thời gian thực hiện |

---

## 2. Phân hệ Cơ sở & Ô kho

### 2.1. Bảng `facility`
Danh mục cơ sở kho tự quản trong chuỗi (`BM-01`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `code` | `NVARCHAR(20)` | Có | `UNIQUE` | Mã cơ sở kho (vd: `FAC-Q7`, `FAC-THD`) |
| `name` | `NVARCHAR(150)` | Có | | Tên cơ sở kho |
| `address` | `NVARCHAR(255)` | Có | | Địa chỉ thực tế của cơ sở |
| `phone` | `NVARCHAR(20)` | Không | | Số điện thoại liên hệ cơ sở kho |
| `description` | `NVARCHAR(2000)` | Không | | Giới thiệu, mô tả tiện ích cơ sở |
| `opening_hours` | `NVARCHAR(50)` | Không | | Thời gian mở cửa hoạt động (vd: `06:00–22:00`) |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'ACTIVE'`, `CHECK IN ('ACTIVE','INACTIVE')` | Tình trạng khai thác cơ sở (`BM-01`) |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày khởi tạo |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày cập nhật |

### 2.2. Bảng `unit_type`
Danh mục kích thước quy chuẩn ô kho toàn hệ thống (`FM-01`, `UC-F5-01`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `code` | `NVARCHAR(20)` | Có | `UNIQUE` | Mã loại kho (vd: `S`, `M`, `L`, `XL`) |
| `name` | `NVARCHAR(100)` | Có | | Tên loại kho hiển thị |
| `width_m` | `DECIMAL(5,2)` | Có | | Chiều rộng ô kho (mét) |
| `length_m` | `DECIMAL(5,2)` | Có | | Chiều dài ô kho (mét) |
| `height_m` | `DECIMAL(5,2)` | Có | | Chiều cao ô kho (mét) |
| `description` | `NVARCHAR(500)` | Không | | Mô tả công năng lưu trữ phù hợp |
| `is_active` | `BIT` | Có | `DEFAULT 1` | Cờ trạng thái hoạt động (Soft Delete) |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày tạo |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày cập nhật |

### 2.3. Bảng `facility_unit_type_price`
Bảng giá niêm yết hiện hành theo Cơ sở $\times$ Loại kho (`US-BM-03.1`, `BR-GEN-05`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `facility_id` | `BIGINT` | Có | `FK` $\rightarrow$ `facility(id)` | Cơ sở áp dụng giá |
| `unit_type_id` | `BIGINT` | Có | `FK` $\rightarrow$ `unit_type(id)` | Loại ô kho áp dụng |
| `monthly_price` | `BIGINT` | Có | `CHECK (monthly_price > 0)` | Đơn giá thuê 1 tháng (VND, số nguyên theo `BR-GEN-04`) |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày thiết lập giá |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày điều chỉnh giá |

*Ràng buộc duy nhất*: `UNIQUE (facility_id, unit_type_id)`.

### 2.4. Bảng `storage_unit`
Từng ô kho vật lý cụ thể tại cơ sở (`UC-F5-02`, vòng đời 6 trạng thái `state-machine-storage-unit.puml`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `facility_id` | `BIGINT` | Có | `FK` $\rightarrow$ `facility(id)` | Thuộc cơ sở nào |
| `unit_type_id` | `BIGINT` | Có | `FK` $\rightarrow$ `unit_type(id)` | Loại kích thước |
| `code` | `NVARCHAR(30)` | Có | | Mã vị trí ô kho vật lý (vd: `A-101`, `B-205`) |
| `floor` | `INT` | Không | | Tầng đặt ô kho (vd: 1, 2, 3) |
| `position` | `NVARCHAR(50)` | Không | | Vị trí / dãy ô kho (vd: Dãy A, Khu B) |
| `location_note` | `NVARCHAR(255)` | Không | | Vị trí chi tiết (Tầng 1, Dãy A, gần cửa cuốn) |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'AVAILABLE'`, `CHECK IN ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'OUT_OF_SERVICE')` | Trạng thái vòng đời của ô kho |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày khởi tạo |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày cập nhật |

*Ràng buộc duy nhất*: `UNIQUE (facility_id, code)` (Mỗi cơ sở không được trùng mã ô kho).

---

## 3. Phân hệ Chính sách & Khuyến mại

### 3.1. Bảng `policy_version`
Chính sách vận hành có phiên bản đầy đủ tại từng thời điểm ban hành (`BR-GEN-02`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `version_no` | `INT` | Có | `UNIQUE` | Số phiên bản chính sách tăng dần (1, 2, 3...) |
| `effective_from` | `DATETIMEOFFSET` | Có | | Mốc thời gian chính thức có hiệu lực |
| `deposit_multiplier` | `DECIMAL(5,2)` | Có | | Hệ số tiền cọc (vd: `1.00` = 1 tháng tiền thuê - `BR-DEP-01`) |
| `reservation_hold_hours` | `INT` | Có | | Số giờ giữ chỗ chờ thanh toán (`48` giờ - `BR-RES-02`) |
| `checkin_grace_days` | `INT` | Có | | Số ngày ân hạn check-in sau ngày bắt đầu (`10` ngày - `BR-CHK-05`) |
| `cancel_full_refund_hours` | `INT` | Có | | Số giờ hủy trước check-in được hoàn 100% (`48` giờ - `BR-CAN-01`) |
| `cancel_late_refund_rate` | `DECIMAL(5,2)` | Có | | Tỷ lệ hoàn tiền khi hủy muộn (`0.50` = 50% - `BR-CAN-02`) |
| `cancel_no_show_refund_rate` | `DECIMAL(5,2)` | Có | | Tỷ lệ hoàn tiền khi khách No-show (`0.00` = 0% - `BR-CAN-04`) |
| `renewal_reminder_days` | `NVARCHAR(50)` | Có | | Chuỗi CSV các ngày nhắc hạn trước khi hết hạn (`"30,7,3,1"`) |
| `renewal_min_months` | `INT` | Có | | Số tháng gia hạn tối thiểu (`1` tháng) |
| `renewal_max_months` | `INT` | Có | | Số tháng gia hạn tối đa (`12` tháng) |
| `overdue_grace_days` | `INT` | Có | | Số ngày ân hạn quá hạn trước khi tính phí (`3` ngày - `BR-OVD-01`) |
| `overdue_daily_rate` | `DECIMAL(5,2)` | Có | | Tỷ lệ phí quá hạn mỗi ngày (`0.05` = 5%/ngày - `BR-OVD-02`) |
| `overdue_cap_rate` | `DECIMAL(5,2)` | Có | | Trần phí quá hạn tối đa (`0.35` = 35% tiền cọc - `BR-OVD-03`) |
| `overdue_lock_access_days` | `INT` | Có | | Mốc ngày khóa quyền truy cập (`D+10` - `BR-OVD-05`) |
| `overdue_notice_days` | `INT` | Có | | Mốc ngày gửi thông báo tính phí (`D+4` - `BR-OVD-04`) |
| `overdue_termination_days` | `INT` | Có | | Mốc ngày đơn phương chấm dứt hợp đồng (`D+10` - `BR-OVD-05`) |
| `return_notice_days` | `INT` | Có | | Số ngày báo trước khi trả kho (`3` ngày - `BR-RET-01`) |
| `return_refund_working_days` | `INT` | Có | | Số ngày làm việc hoàn tiền cọc (`3` ngày - `BR-RET-05`) |
| `return_early_refund_rate` | `DECIMAL(5,2)` | Có | | Tỷ lệ hoàn tiền khi trả kho trước hạn (`0.00` = 0% - `BR-RET-06`) |
| `access_pin_length` | `INT` | Có | `DEFAULT 6` | Độ dài mã PIN bảo mật (`BR-ACC-01`) |
| `support_urgent_sla_hours` | `INT` | Có | | Cam kết SLA xử lý sự cố khẩn (`4` giờ - `BR-SUP-01`) |
| `support_auto_close_working_days` | `INT` | Có | | Ngày tự động đóng yêu cầu hỗ trợ (`3` ngày - `BR-SUP-03`) |
| `published_by` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Người ban hành phiên bản chính sách (BOM) |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày tạo |

### 3.2. Bảng `extra_fee_type`
Danh mục loại phụ phí phát sinh (`US-BM-03.2`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `code` | `NVARCHAR(30)` | Có | `UNIQUE` | Mã phụ phí (vd: `REPLACE_CARD`, `CLEANING_FEE`, `KEY_LOST`) |
| `name` | `NVARCHAR(150)` | Có | | Tên hiển thị loại phụ phí |
| `amount` | `BIGINT` | Có | `CHECK (amount >= 0)` | Đơn giá quy định (VND) |
| `is_active` | `BIT` | Có | `DEFAULT 1` | 1: Đang áp dụng, 0: Ngừng áp dụng |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày tạo |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày cập nhật |

### 3.3. Bảng `discount_program`
Chương trình khuyến mãi giảm giá thuê (`US-BM-03.3`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `name` | `NVARCHAR(150)` | Có | | Tên chiến dịch ưu đãi |
| `discount_type` | `VARCHAR(20)` | Có | `CHECK IN ('PERCENT', 'AMOUNT')` | Loại giảm (% hoặc số tiền cố định) |
| `discount_value` | `DECIMAL(10,2)` | Có | | Giá trị giảm |
| `start_date` | `DATE` | Có | | Ngày bắt đầu chương trình |
| `end_date` | `DATE` | Có | `CHECK (end_date >= start_date)` | Ngày kết thúc chương trình |
| `scope_type` | `VARCHAR(20)` | Có | `CHECK IN ('SYSTEM', 'FACILITY', 'UNIT_TYPE')` | Phạm vi áp dụng |
| `facility_id` | `BIGINT` | Không | `FK` $\rightarrow$ `facility(id)` | Áp dụng cho cơ sở cụ thể (nếu scope=`FACILITY`) |
| `unit_type_id` | `BIGINT` | Không | `FK` $\rightarrow$ `unit_type(id)` | Áp dụng cho loại kho cụ thể (nếu scope=`UNIT_TYPE`) |
| `is_active` | `BIT` | Có | `DEFAULT 1` | Trạng thái kích hoạt |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày tạo |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày cập nhật |

---

## 4. Phân hệ Vòng đời Hợp đồng Thuê

### 4.1. Bảng `reservation`
Đơn đặt giữ chỗ ô kho (`Flow 1`, `state-machine-reservation.puml`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `code` | `NVARCHAR(30)` | Có | `UNIQUE` | Mã đơn giữ chỗ (vd: `RES-202609-0001`) |
| `customer_id` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Khách hàng đặt chỗ |
| `facility_id` | `BIGINT` | Có | `FK` $\rightarrow$ `facility(id)` | Cơ sở được chọn |
| `unit_type_id` | `BIGINT` | Có | `FK` $\rightarrow$ `unit_type(id)` | Loại kho được chọn |
| `start_date` | `DATE` | Có | | Ngày bắt đầu thuê dự kiến |
| `rental_months` | `INT` | Có | `CHECK (rental_months > 0)` | Số tháng đăng ký thuê |
| `end_date_exclusive`| `DATE` | Có | | Ngày kết thúc kỳ thuê dạng $[start, end)$ (`BR-RES-01`) |
| `monthly_price_snapshot`| `BIGINT` | Có | | Snapshot giá thuê 1 tháng lúc đặt (`BR-GEN-05`) |
| `policy_version_id`| `BIGINT` | Có | `FK` $\rightarrow$ `policy_version(id)` | Phiên bản chính sách snapshot lúc đặt |
| `discount_program_id`| `BIGINT` | Không | `FK` $\rightarrow$ `discount_program(id)` | Mã khuyến mại áp dụng |
| `discount_amount`| `BIGINT` | Có | `DEFAULT 0` | Số tiền được giảm giá |
| `deposit_amount` | `BIGINT` | Có | | Số tiền cọc cần đóng |
| `total_rental_fee`| `BIGINT` | Có | | Tổng tiền thuê các tháng sau giảm giá |
| `total_payable` | `BIGINT` | Có | | Tổng tiền phải thanh toán ban đầu (= tiền thuê + cọc) |
| `storage_unit_id`| `BIGINT` | Không | `FK` $\rightarrow$ `storage_unit(id)` | Ô kho vật lý khách chọn, khóa Reserved sau khi trả tiền (`BR-AVL-04`) |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'PENDING_PAYMENT'`, `CHECK IN ('PENDING_PAYMENT', 'CONFIRMED', 'FULFILLED', 'EXPIRED', 'CANCELLED', 'NO_SHOW')` | Trạng thái vòng đời đơn giữ chỗ |
| `hold_expires_at`| `DATETIMEOFFSET` | Có | | Hạn chót thanh toán giữ chỗ (48h) |
| `confirmed_at` | `DATETIMEOFFSET` | Không | | Mốc thanh toán thành công và gán kho |
| `fulfilled_at` | `DATETIMEOFFSET` | Không | | Mốc hoàn tất check-in bàn giao kho |
| `cancelled_at` | `DATETIMEOFFSET` | Không | | Mốc bị hủy (khách hủy hoặc hệ thống hủy) |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày tạo |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày cập nhật |

### 4.2. Bảng `rental_contract`
Hợp đồng thuê ô kho chính thức (`Flow 2, 3, 6`, `state-machine-contract.puml`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `code` | `NVARCHAR(30)` | Có | `UNIQUE` | Mã hợp đồng (vd: `CTR-202609-0001`) |
| `reservation_id` | `BIGINT` | Có | `FK` $\rightarrow$ `reservation(id)`, `UNIQUE` | Sinh từ đơn Reservation duy nhất (Quan hệ 1:0..1) |
| `customer_id` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Khách hàng ký hợp đồng |
| `facility_id` | `BIGINT` | Có | `FK` $\rightarrow$ `facility(id)` | Cơ sở kho |
| `storage_unit_id`| `BIGINT` | Có | `FK` $\rightarrow$ `storage_unit(id)` | Ô kho thuê cố định (`BR-DEP-06`) |
| `start_date` | `DATE` | Có | | Ngày bắt đầu tính tiền thuê |
| `end_date` | `DATE` | Có | | Ngày hết hạn hợp đồng hiện tại |
| `policy_version_id`| `BIGINT` | Có | `FK` $\rightarrow$ `policy_version(id)` | Snapshot chính sách áp dụng |
| `monthly_price_snapshot`| `BIGINT` | Có | | Đơn giá thuê 1 tháng cố định trong hợp đồng |
| `deposit_amount` | `BIGINT` | Có | | Tiền cọc đang giữ của hợp đồng |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'PENDING_CHECK_IN'`, `CHECK IN ('PENDING_CHECK_IN', 'ACTIVE', 'PENDING_RETURN', 'OVERDUE', 'CANCELLED', 'CLOSED', 'TERMINATED')` | Trạng thái vòng đời hợp đồng |
| `overdue_since` | `DATE` | Không | | Mốc ngày bắt đầu rơi vào quá hạn |
| `overdue_fee_accrued`| `BIGINT` | Có | `DEFAULT 0` | Tổng phí phạt quá hạn đã tích lũy |
| `activated_at` | `DATETIMEOFFSET` | Không | | Mốc bàn giao kho và kích hoạt hợp đồng |
| `closed_at` | `DATETIMEOFFSET` | Không | | Mốc thanh lý và đóng hợp đồng thành công |
| `terminated_at` | `DATETIMEOFFSET` | Không | | Mốc đơn phương chấm dứt hợp đồng do quá hạn 60 ngày |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày tạo hợp đồng |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày cập nhật |

### 4.3. Bảng `contract_renewal`
Lịch sử các lần gia hạn hợp đồng thuê kho (`BR-REN-*`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `contract_id` | `BIGINT` | Có | `FK` $\rightarrow$ `rental_contract(id)` | Thuộc hợp đồng nào |
| `previous_end_date`| `DATE` | Có | | Ngày hết hạn trước khi gia hạn |
| `new_end_date` | `DATE` | Có | | Ngày hết hạn mới sau khi gia hạn |
| `rental_months` | `INT` | Có | `CHECK (rental_months > 0)` | Số tháng gia hạn thêm |
| `monthly_price_snapshot`| `BIGINT` | Có | | Đơn giá tháng áp dụng cho đợt gia hạn |
| `policy_version_id`| `BIGINT` | Có | `FK` $\rightarrow$ `policy_version(id)` | Snapshot chính sách tại thời điểm gia hạn |
| `overdue_fee_settled`| `BIGINT` | Có | `DEFAULT 0` | Tiền nợ quá hạn đã trả kèm (nếu gia hạn lúc Overdue) |
| `rental_fee_amount`| `BIGINT` | Có | | Tiền thuê của kỳ mới |
| `total_paid` | `BIGINT` | Có | | Tổng tiền đã trả đợt gia hạn (= tiền thuê + nợ phạt) |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Thời điểm gia hạn |

### 4.4. Bảng `handover_record`
Biên bản nghiệm thu bàn giao khi Check-in (`Flow 2`, `BR-CHK-03`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `contract_id` | `BIGINT` | Có | `FK` $\rightarrow$ `rental_contract(id)`, `UNIQUE` | 1 Hợp đồng có đúng 1 biên bản bàn giao |
| `staff_id` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Nhân viên phụ trách bàn giao |
| `condition_note`| `NVARCHAR(1000)`| Không | | Ghi chú hiện trạng ô kho trước khi nhận |
| `customer_signed_at`| `DATETIMEOFFSET`| Không | | Mốc chữ ký điện tử của khách hàng |
| `staff_signed_at`| `DATETIMEOFFSET`| Không | | Mốc chữ ký điện tử của nhân viên |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'PENDING_SIGNATURE'`, `CHECK IN ('PENDING_SIGNATURE', 'COMPLETED', 'CANCELLED')` | Trạng thái biên bản: chờ ký, hai bên đã ký, hoặc hủy lượt bàn giao do ô kho lỗi (`US-FS-02.1`) |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Thời điểm lập biên bản |

### 4.5. Bảng `return_request`
Yêu cầu trả kho và biên bản nghiệm thu hoàn kho (`Flow 3`, `BR-RET-*`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `contract_id` | `BIGINT` | Có | `FK` $\rightarrow$ `rental_contract(id)` | Hợp đồng trả kho |
| `requested_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Mốc khách đăng ký trả kho |
| `requested_return_date`| `DATE` | Có | | Ngày hẹn trả kho thực tế |
| `appointment_slot`| `NVARCHAR(50)` | Không | | Khung giờ hẹn (vd: `09:00 - 10:00`) |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'PENDING'`, `CHECK IN ('PENDING', 'COMPLETED', 'CANCELLED')` | Trạng thái yêu cầu trả kho |
| `inspected_by` | `BIGINT` | Không | `FK` $\rightarrow$ `app_user(id)` | Nhân viên thực hiện kiểm tra kho |
| `inspected_at` | `DATETIMEOFFSET` | Không | | Mốc thời gian kiểm tra |
| `is_intact` | `BIT` | Không | | 1: Nguyên vẹn, 0: Có hư hại ô kho |
| `condition_note`| `NVARCHAR(1000)`| Không | | Ghi chép hư hỏng hoặc đồ bỏ lại |
| `damage_cost` | `BIGINT` | Có | `DEFAULT 0`, `CHECK (damage_cost >= 0)` | Chi phí đền bù thiệt hại (nếu có) |
| `deposit_refund_amount`| `BIGINT` | Không | | Số tiền cọc thực tế hoàn lại cho khách |
| `cancelled_at` | `DATETIMEOFFSET` | Không | | Mốc khách hủy yêu cầu trả kho |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày tạo |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày cập nhật |

### 4.6. Bảng `access_credential`
Thông tin quyền truy cập mở ô kho (`Flow 2`, `BR-ACC-*`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `contract_id` | `BIGINT` | Có | `FK` $\rightarrow$ `rental_contract(id)` | Thuộc hợp đồng nào |
| `storage_unit_id`| `BIGINT` | Có | `FK` $\rightarrow$ `storage_unit(id)` | Ô kho được mở |
| `credential_type`| `VARCHAR(20)` | Có | `CHECK IN ('PIN', 'QR', 'CARD', 'KEY')` | Loại phương thức ra vào |
| `code_value_hash`| `NVARCHAR(255)`| Có | | Giá trị mã băm bảo mật (không lưu mã gốc) |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'ACTIVE'`, `CHECK IN ('ACTIVE', 'SUSPENDED', 'REVOKED')` | Trạng thái (`SUSPENDED` khi Overdue D+4) |
| `issued_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Thời điểm cấp |
| `suspended_at` | `DATETIMEOFFSET` | Không | | Thời điểm tạm khóa |
| `revoked_at` | `DATETIMEOFFSET` | Không | | Thời điểm thu hồi quyền vĩnh viễn |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày tạo |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Ngày cập nhật |

---

## 5. Phân hệ Thanh toán & Sổ cái Tài chính

### 5.1. Bảng `payment_transaction`
Giao dịch thanh toán cổng điện tử (`Flow 1, 3, 6`, `BR-PAY-*`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `reservation_id` | `BIGINT` | Không | `FK` $\rightarrow$ `reservation(id)` | Giao dịch cho đơn Reservation ban đầu |
| `contract_id` | `BIGINT` | Không | `FK` $\rightarrow$ `rental_contract(id)` | Giao dịch cho hợp đồng (gia hạn, phụ phí, hoàn cọc) |
| `transaction_type`| `VARCHAR(30)` | Có | `CHECK IN ('INITIAL_PAYMENT', 'RENEWAL_PAYMENT', 'EXTRA_FEE_PAYMENT', 'REFUND')` | Mục đích thanh toán |
| `amount` | `BIGINT` | Có | | Số tiền giao dịch (VND) |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'PENDING'`, `CHECK IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUND_FAILED')` | Trạng thái cổng thanh toán |
| `payment_method` | `NVARCHAR(50)` | Không | | Phương thức (VNPay, Momo, Chuyển khoản) |
| `provider_reference`| `NVARCHAR(100)`| Không | | Mã giao dịch phía đối tác cung cấp (Mã VNPay) |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Mốc khởi tạo giao dịch |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Mốc cập nhật trạng thái |

### 5.2. Bảng `ledger_entry`
Sổ cái tài chính bất biến (`BR-PAY-06` — Chỉ cho phép `INSERT`, cấm `UPDATE`/`DELETE`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `reservation_id` | `BIGINT` | Không | `FK` $\rightarrow$ `reservation(id)` | Định danh Reservation liên quan |
| `contract_id` | `BIGINT` | Không | `FK` $\rightarrow$ `rental_contract(id)` | Định danh Hợp đồng liên quan |
| `payment_transaction_id`| `BIGINT` | Không | `FK` $\rightarrow$ `payment_transaction(id)` | Giao dịch thanh toán liên kết |
| `entry_type` | `VARCHAR(20)` | Có | `CHECK IN ('COLLECTED', 'ADJUSTED', 'DEDUCTED', 'REFUNDED', 'OUTSTANDING')` | Loại ghi sổ tài chính |
| `amount` | `BIGINT` | Có | | Số tiền hạch toán |
| `description` | `NVARCHAR(500)` | Không | | Nội dung hạch toán kế toán |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Thời điểm ghi sổ |

### 5.3. Bảng `contract_extra_charge`
Phụ phí hoặc đền bù thiệt hại ghi nhận vào hợp đồng (`BR-RET-08`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `contract_id` | `BIGINT` | Có | `FK` $\rightarrow$ `rental_contract(id)` | Thuộc hợp đồng nào |
| `extra_fee_type_id`| `BIGINT` | Có | `FK` $\rightarrow$ `extra_fee_type(id)` | Loại phụ phí |
| `amount` | `BIGINT` | Có | | Số tiền tính phí |
| `reason` | `NVARCHAR(500)` | Không | | Diễn giải nguyên nhân phát sinh |
| `recorded_by` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Nhân viên ghi nhận |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'UNPAID'`, `CHECK IN ('UNPAID', 'PAID')` | Trạng thái thu phụ phí: chưa thu / đã thu (`US-FM-03.2`, dùng khi quyết toán theo `BR-RET-04`) |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Thời điểm lập phí |

### 5.4. Bảng `overdue_fee_adjustment_request`
Đề xuất xin miễn/giảm phạt nợ quá hạn theo vụ việc (`BR-OVD-10`, `US-BM-03.4`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `contract_id` | `BIGINT` | Có | `FK` $\rightarrow$ `rental_contract(id)` | Hợp đồng xin miễn giảm |
| `requested_by` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Nhân viên/Quản lý cơ sở lập đề xuất |
| `requested_amount`| `BIGINT` | Có | | Số tiền phạt đề xuất xin giảm |
| `reason` | `NVARCHAR(500)` | Có | | Lý do đề xuất xin miễn giảm |
| `evidence_note` | `NVARCHAR(500)` | Không | | Bằng chứng đính kèm (giấy tờ sự cố...) |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'PENDING'`, `CHECK IN ('PENDING', 'APPROVED', 'REJECTED')` | Trạng thái phê duyệt của BOM |
| `reviewed_by` | `BIGINT` | Không | `FK` $\rightarrow$ `app_user(id)` | Quản lý BOM thực hiện duyệt |
| `reviewed_amount`| `BIGINT` | Không | | Số tiền được BOM duyệt giảm thực tế |
| `review_reason` | `NVARCHAR(500)` | Không | | Ghi chú phản hồi của BOM |
| `requested_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Mốc gửi yêu cầu |
| `reviewed_at` | `DATETIMEOFFSET` | Không | | Mốc BOM phê duyệt/từ chối |

---

## 6. Phân hệ Vận hành & Hỗ trợ

### 6.1. Bảng `support_request`
Phiếu yêu cầu khiếu nại, sự cố kỹ thuật của khách hàng (`Flow 7`, `FM-05`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `code` | `NVARCHAR(30)` | Có | `UNIQUE` | Mã phiếu hỗ trợ (vd: `SUP-202609-0001`) |
| `customer_id` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Khách hàng tạo khiếu nại |
| `contract_id` | `BIGINT` | Không | `FK` $\rightarrow$ `rental_contract(id)` | Hợp đồng liên quan (nếu có) |
| `storage_unit_id`| `BIGINT` | Không | `FK` $\rightarrow$ `storage_unit(id)` | Ô kho gặp sự cố (nếu có) |
| `category` | `VARCHAR(30)` | Có | `CHECK IN ('UNIT_DAMAGE', 'LOCK_ACCESS', 'PAYMENT', 'BELONGINGS', 'OTHER')` | Danh mục sự cố |
| `description` | `NVARCHAR(1000)`| Có | | Chi tiết vấn đề khách gặp phải |
| `status` | `VARCHAR(20)` | Có | `DEFAULT 'NEW'`, `CHECK IN ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'AUTO_CLOSED')` | Trạng thái xử lý phiếu hỗ trợ |
| `assigned_staff_id`| `BIGINT` | Không | `FK` $\rightarrow$ `app_user(id)` | Nhân viên kỹ thuật được giao xử lý |
| `sla_due_at` | `DATETIMEOFFSET`| Không | | Hạn chót cam kết giải quyết theo SLA |
| `resolved_at` | `DATETIMEOFFSET`| Không | | Mốc thời gian xử lý xong |
| `resolution_note`| `NVARCHAR(1000)`| Không | | Ghi nhận kết quả khắc phục sự cố |
| `customer_confirmed_at`| `DATETIMEOFFSET`| Không | | Mốc khách hàng xác nhận hài lòng |
| `auto_closed_at` | `DATETIMEOFFSET`| Không | | Mốc tự động đóng sau 3 ngày không phản hồi |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Mốc tiếp nhận yêu cầu |
| `updated_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Mốc cập nhật tiến độ |

### 6.2. Bảng `staff_daily_assignment`
Phân công nhiệm vụ thực địa hàng ngày cho nhân viên cơ sở (`FM-05`, `UC-F2-09`, `UC-F5-04`).

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `staff_id` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Nhân viên thực hiện |
| `facility_id` | `BIGINT` | Có | `FK` $\rightarrow$ `facility(id)` | Địa điểm cơ sở làm việc |
| `work_date` | `DATE` | Có | | Ngày làm việc |
| `task_type` | `VARCHAR(20)` | Có | `CHECK IN ('HANDOVER', 'RETURN', 'SUPPORT', 'INSPECTION')` | Loại công việc thực hiện |
| `reference_type` | `NVARCHAR(30)` | Có | | Loại thực thể cần xử lý (vd: `RESERVATION`, `RETURN_REQUEST`) |
| `reference_id` | `BIGINT` | Có | | ID bản ghi đối tượng xử lý |
| `assigned_by` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Quản lý cơ sở (FM) phân công |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Mốc phân công |

### 6.3. Bảng `attachment`
Lưu trữ tệp đa hình: ảnh biên bản bàn giao, ảnh trả kho, bằng chứng hư hỏng...

| Tên cột | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Mặc định | Ý nghĩa & Mô tả nghiệp vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `BIGINT` | Có | `PK`, `IDENTITY(1,1)` | Khóa chính |
| `entity_type` | `NVARCHAR(30)` | Có | | Bảng liên kết (vd: `HANDOVER_RECORD`, `RETURN_REQUEST`, `SUPPORT_REQUEST`) |
| `entity_id` | `BIGINT` | Có | | ID bản ghi liên kết |
| `file_url` | `NVARCHAR(500)` | Có | | Đường dẫn lưu trữ tệp (Cloudinary / S3 URL) |
| `uploaded_by` | `BIGINT` | Có | `FK` $\rightarrow$ `app_user(id)` | Người tải tệp lên hệ thống |
| `created_at` | `DATETIMEOFFSET` | Có | `DEFAULT SYSDATETIMEOFFSET()` | Thời điểm tải lên |

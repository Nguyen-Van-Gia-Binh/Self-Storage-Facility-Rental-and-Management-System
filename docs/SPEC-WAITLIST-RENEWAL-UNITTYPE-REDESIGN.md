# BẢN ĐẶC TẢ NGHIỆP VỤ & KIẾN TRÚC TOÀN DIỆN
## 1. Waitlist (Danh sách chờ) · 2. Gia hạn & Điều chuyển (Renewal & Bumping) · 3. Quản lý Kiểu kho cho BOM (Global Unit Type Catalog)

> **Dự án:** Hệ thống Quản lý và Cho thuê Kho Tự Quản (Self-Storage Facility Rental & Management System)  
> **Tác giả:** Lead Software Architect & Technical Lead  
> **Phiên bản:** 1.0 — Chuẩn hóa Doanh nghiệp (Enterprise Edition)  
> **Trạng thái:** Đã thống nhất 100% qua phỏng vấn phản biện kỹ thuật (`/grill-me`)  
> **Tài liệu liên đới:** `docs/TOPIC.md`, `docs/BUSINESS-RULES.md`, `docs/USER-STORIES-AND-USE-CASES.md`, `docs/DATA-DICTIONARY.md`, `docs/WORKFLOWS.md`

---

## 1. TỔNG QUAN KIẾN TRÚC & ĐỐI CHIẾU THAY ĐỔI (PARADIGM SHIFT)

| Hạng mục | Hiện trạng (As-Is) | Kiến trúc Chuẩn hóa mới (To-Be) | Giá trị Doanh nghiệp |
| :--- | :--- | :--- | :--- |
| **1. Hết kho trống (Sold Out)** | Khách hàng thấy ô kho đỏ/hết chỗ thì rời bỏ trang web; cơ sở mất dấu nhu cầu khách hàng. | Hệ thống cung cấp nút **"Đăng ký Danh sách chờ (Join Waitlist)"** miễn phí. Khi có kho trống, FM trực tiếp gọi điện tư vấn chốt sale theo hàng đợi FIFO (khóa 2 giờ tư vấn độc quyền), tạo đơn Reservation gửi link thanh toán cọc cho khách. | Thu thập lead khách hàng tiềm năng, chốt sale trực tiếp B2B tỷ lệ chuyển đổi cao, tối giản code theo Ponytail (loại bỏ Batch Offer phức tạp). |
| **2. Hạn chót Gia hạn (Renewal)** | Cho phép khách gia hạn đến sát ngày, dẫn đến xung đột khi có khách mới đặt trước (Deadlock giữa khách cũ vs khách mới). | **Mốc T-30 đến T-20:** Hệ thống gửi thông báo khẩn tại T-30, dành 10 ngày đầu cho khách tự do gia hạn online. Qua mốc **T-20 ngày** không gia hạn sẽ chính thức khóa tự phục vụ, chuyển `PENDING_EXPIRATION` và kích hoạt đẩy kho vào Waitlist. Gia hạn trễ (T-20 đến T-0) bắt buộc qua FM duyệt và thu phí hành chính (chỉ duyệt khi khách chờ chưa cọc). | Tối ưu hóa chuỗi cung ứng, loại bỏ tình trạng hủy đơn giờ chót và bảo vệ doanh thu. |
| **3. Giải quyết xung đột nhận kho (Bumping)** | Hủy đơn khách mới, ép khách cũ dọn đi hoặc hoàn tiền thủ công gây bức xúc. | **Late Binding Substitution:** Khách mua Hạng kho (Capacity). FM đổi ô kho khác cùng loại đang AVAILABLE. Cháy kho toàn cơ sở thì kích hoạt Bồi thường khẩn cấp (Hoàn 100% + Voucher 10-20%). | Khách hàng luôn có kho để vào; triệt tiêu hoàn toàn khiếu nại tranh chấp mặt bằng. |
| **4. Quản lý Kiểu kho (Unit Type)** | FM tự tạo Kiểu kho phân mảnh theo từng cơ sở (`/facilities/{id}/unit-types`), trùng lặp và vỡ cấu trúc báo cáo BOM. | Chuyển toàn bộ quyền quản trị Kiểu kho sang cho **BOM (Global Enterprise Catalog)**. Chuẩn hóa kích thước, tải trọng, môi trường dùng chung toàn quốc. FM chỉ quản lý các ô vật lý. | Báo cáo doanh thu chuẩn SKU toàn hệ thống; phân định rành mạch trách nhiệm quản trị (SoD). |

---

## 2. PHẦN 1: WAITLIST (DANH SÁCH CHỜ KHI HẾT CÔNG SUẤT)

### 2.1. Quy tắc Nghiệp vụ (Business Rules)

* **`BR-WAT-01` (Cascade FIFO Queue):**
  * Danh sách chờ được sắp xếp theo nguyên tắc ai đăng ký trước được phục vụ trước (`created_at ASC`) theo từng cặp `(facility_id, unit_type_id)`.
  * Khách hàng đăng ký hoàn toàn **miễn phí (0 VNĐ)**, chỉ yêu cầu tài khoản đã xác thực Số điện thoại / Email.
* **`BR-WAT-02` (Single Offer Hold Time - 24 giờ):**
  * Khi danh sách chờ $\le 5$ người: Khi có kho trống, hệ thống gửi thông báo (Email, SMS, Push Notification) độc quyền cho người đứng đầu hàng đợi.
  * Khách hàng có đúng **24 giờ** kể từ thời điểm phát hành lời mời (`offered_at`) để thanh toán tiền đặt cọc giữ chỗ.
  * Quá 24 giờ không thanh toán, lời mời tự động hết hạn (`EXPIRED`) và hệ thống tự động kích hoạt lời mời cho người kế tiếp.
* **`BR-WAT-03` (Batch Offer Mechanism - Waitlist > 5 người):**
  * Khi danh sách chờ $> 5$ người: Nhằm tăng tốc độ lấp đầy kho và tránh việc người cuối phải chờ hàng tháng, hệ thống kích hoạt cơ chế mời theo nhóm:
    * Gửi lời mời đồng thời cho **Top 3 người** đầu tiên trong hàng đợi.
    * Thời gian giữ chỗ rút ngắn còn **4 giờ**.
    * Áp dụng nguyên tắc **"Ai thanh toán cọc trước sẽ nhận kho"** (First to Pay Wins). Ngay khi có 1 người thanh toán thành công, 2 lời mời còn lại tự động đóng và trở về vị trí đầu hàng đợi cho lượt tiếp theo.
* **`BR-WAT-04` (Fallback Public Available):**
  * Nếu hệ thống đã gửi lời mời qua toàn bộ danh sách chờ mà không có khách nào đặt cọc, ô kho sẽ tự động chuyển sang trạng thái `AVAILABLE` công khai trên website cho toàn bộ khách vãng lai.
* **`BR-WAT-05` (Khách chủ động từ chối):**
  * Trong thời gian giữ chỗ (24h hoặc 4h), nếu khách bấm nút **"Từ chối nhận kho"**, hệ thống lập tức thu hồi lời mời và chuyển ngay cho người kế tiếp mà không cần chờ hết hạn thời gian.
* **`BR-WAT-06` (Target Date Range & T-3 Reminder Expiration):**
  * Khi đăng ký Waitlist, khách hàng bắt buộc chọn **Ngày mong muốn nhận kho (`target_start_date`)**.
  * Nếu `CURRENT_DATE > target_start_date` mà chưa có kho trống, đơn Waitlist tự động chuyển sang trạng thái `EXPIRED`.
  * **Cơ chế nhắc nhở T-3:** Trước ngày mong muốn 3 ngày (`target_start_date - 3`), hệ thống tự động gửi email/SMS: *"Chúng tôi chưa tìm được kho trống trước ngày [target_start_date]. Bạn có muốn tiếp tục chờ không?"*. Khách có thể bấm link gia hạn thêm **15 ngày** (`PATCH /api/v1/waitlists/{id}/extend`).

### 2.2. Vòng đời Trạng thái Waitlist (State Machine)

```text
       [ Khách đăng ký ]
               │
               ▼
           WAITING ──────── (Qua ngày target_start_date mà không gia hạn) ──────► EXPIRED
               │
      (Có kho trống - Gửi lời mời)
               │
               ▼
            OFFERED ─────── (Quá 24h hoặc quá 4h không thanh toán) ──────────────► EXPIRED
           │       │
(Thanh toán cọc)  (Bấm 'Từ chối')
         │           │
         ▼           ▼
     CONVERTED   CANCELLED
  (Tạo HĐ mới)  (Chuyển sang người tiếp theo)
```

### 2.3. CSDL: Bảng `waitlist` (Data Schema)

```sql
CREATE TABLE waitlist (
    id                  BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    customer_id         BIGINT NOT NULL,
    facility_id         BIGINT NOT NULL,
    unit_type_id        BIGINT NOT NULL,
    target_start_date   DATE NOT NULL,
    rental_months       INT NOT NULL DEFAULT 1,
    status              VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    offered_at          TIMESTAMP WITH TIME ZONE NULL,
    offer_expires_at    TIMESTAMP WITH TIME ZONE NULL,
    converted_contract_id BIGINT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_waitlist_customer FOREIGN KEY (customer_id) REFERENCES app_user(id),
    CONSTRAINT fk_waitlist_facility FOREIGN KEY (facility_id) REFERENCES facility(id),
    CONSTRAINT fk_waitlist_unit_type FOREIGN KEY (unit_type_id) REFERENCES unit_type(id),
    CONSTRAINT fk_waitlist_contract FOREIGN KEY (converted_contract_id) REFERENCES rental_contract(id),
    CONSTRAINT ck_waitlist_status CHECK (status IN ('WAITING', 'OFFERED', 'CONVERTED', 'EXPIRED', 'CANCELLED'))
);

CREATE INDEX idx_waitlist_lookup ON waitlist (facility_id, unit_type_id, status, created_at);
CREATE INDEX idx_waitlist_expiry ON waitlist (status, target_start_date);
```

### 2.4. Danh mục API Waitlist

| Method | Endpoint | Quyền (Role) | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/waitlists` | `CUSTOMER` | Đăng ký vào danh sách chờ cho `(facilityId, unitTypeId, targetStartDate)` |
| `GET` | `/api/v1/waitlists/my` | `CUSTOMER` | Xem danh sách các đơn đang chờ của bản thân |
| `PATCH` | `/api/v1/waitlists/{id}/extend` | `CUSTOMER` | Gia hạn thêm 15 ngày cho đơn sắp hết hạn (từ link email nhắc T-3) |
| `POST` | `/api/v1/waitlists/{id}/decline` | `CUSTOMER` | Chủ động từ chối lời mời nhận kho |
| `POST` | `/api/v1/waitlists/{id}/accept` | `CUSTOMER` | Xác nhận nhận kho và chuyển hướng sang thanh toán đặt cọc VNPay |
| `GET` | `/api/v1/facilities/{facilityId}/waitlists` | `FACILITY_MANAGER`, `BOM` | Xem danh sách khách đang chờ tại cơ sở |

---

## 3. PHẦN 2: GIA HẠN KHO & ĐIỀU CHUYỂN HỢP ĐỒNG (RENEWAL & BUMPING)

### 3.1. Quy tắc Nghiệp vụ Gia hạn & Đặt trước (Renewal & Preemption)

* **`BR-REN-01` (Lịch nhắc hẹn tự động):**
  * Hệ thống tự động gửi thông báo nhắc gia hạn tại các mốc: **T-60, T-30 (bắt đầu đếm ngược 10 ngày), T-25, T-20 (khóa tự gia hạn), T-7, T-3, T-1** ngày trước ngày kết thúc hợp đồng (`end_date`).
* **`BR-REN-09` (Hạn chót Tự gia hạn - 10 ngày đếm ngược & Khóa tại T-20):**
  * **Mốc T-30 ngày:** Hệ thống gửi thông báo khẩn cấp: *"Hợp đồng còn 30 ngày sẽ kết thúc. Bạn có 10 ngày đầu tiên (từ T-30 đến T-20) để tự gia hạn trực tuyến trên Portal."* Khách hàng hoàn toàn chủ động bấm gia hạn và thanh toán trong 10 ngày này.
  * **Đúng vào mốc T-20 ngày:** Nếu khách vẫn chưa gia hạn, quyền tự gia hạn trực tuyến chính thức bị **KHÓA** (Disabled nút Gia hạn trên portal), hợp đồng tự động chuyển cờ `pending_expiration = true`, và ô kho lập tức được kích hoạt để gửi lời mời cho khách trong **Waitlist** (`BR-WAT-02`).
* **`BR-REN-10` (Gia hạn Ngoại lệ qua FM - Force Renewal):**
  * Trong khoảng thời gian từ **T-20 đến T-0**: Nếu khách cũ đổi ý muốn gia hạn, khách bắt buộc phải liên hệ Ban quản lý cơ sở (FM).
  * **Điều kiện tiên quyết:** FM chỉ được phép bấm nút `[Gia hạn ngoại lệ]` trên hệ thống **KHI VÀ CHỈ KHI** đơn của khách mới trong Waitlist **CHƯA ĐẶT CỌC**.
  * Nếu khách mới đã thanh toán tiền cọc: Hệ thống **KHÓA TUYỆT ĐỐI**, chặn không cho FM gia hạn đè. Khách cũ bắt buộc phải dọn đồ trả kho trước ngày T-0.
  * **Phí hành chính gia hạn muộn:** Khi FM thực hiện Force Renewal, hệ thống tự động cộng thêm một khoản phí hành chính cố định:
    $$\text{late\_renewal\_admin\_fee} = 200.000\text{ VNĐ}$$
* **`BR-BMP-01` (Nguyên tắc Late Binding Bumping):**
  * Khách hàng đặt chỗ (Reservation) là đặt mua **Hạn ngạch Hạng kho (Unit Type Capacity)**, không phải quyền sở hữu một ô kho vật lý cụ thể.
  * Khi ô kho vật lý dự kiến bàn giao cho khách mới gặp sự cố (ẩm dột, hỏng khóa, hoặc khách cũ đang trong diện xử lý vi phạm chưa dọn đồ): FM có trách nhiệm đổi ô (Reassign) sang một ô kho khác **cùng loại (Unit Type)** đang `AVAILABLE` trong cơ sở. Hợp đồng, giá thuê và tiền cọc giữ nguyên 100%.
* **`BR-BMP-02` (Chính sách Bồi thường khi Cháy kho - Facility Exhaustion):**
  * Nếu toàn bộ cơ sở không còn bất kỳ ô kho nào cùng loại trống để thay thế: Hệ thống chuyển đơn sang trạng thái `PENDING_EMERGENCY_RESOLUTION`.
  * Khách hàng có 2 quyền lựa chọn:
    1. **Quyền ưu tiên:** Đứng vị trí TOP 1 trong Waitlist của chu kỳ tới.
    2. **Hủy đơn & Đền bù:** Hoàn lại **100% tiền cọc + 100% tiền thuê đã trả ngay lập tức**, đồng thời hệ thống tự động phát hành **Voucher giảm giá 10% – 20%** cho lần thuê tiếp theo (do BOM cấu hình).
* **`BR-REN-08` (Cấm Đổi loại kho khi Tự gia hạn):**
  * Khách hàng tự gia hạn trên portal chỉ được gia hạn trên đúng Hạng kho / Ô kho hiện tại. Hệ thống không cho phép tự ý chuyển đổi sang Hạng kho khác trong luồng Self-service.
* **`BR-REN-11` (Quy trình Nâng/Hạ hạng kho có sự hỗ trợ của FM - FM-Assisted Upgrade/Downgrade):**
  * Khách muốn đổi sang loại kho lớn hơn hoặc nhỏ hơn phải liên hệ FM.
  * FM thực hiện quy trình 2 bước trên hệ thống:
    1. **Bước 1:** Tất toán hợp đồng kho cũ (nghiệm thu dọn đồ, thanh toán nợ cũ, hoàn cọc kho cũ).
    2. **Bước 2:** Khởi tạo Hợp đồng mới cho Hạng kho mới (áp dụng bảng giá hiện hành, thu cọc mới).
* **`BR-REN-12` (Thời gian Ân hạn Chuyển đồ - Physical Move Grace Period):**
  * Khi FM phê duyệt yêu cầu đổi hạng kho, hệ thống cấp thời gian ân hạn di chuyển đồ đạc là **24 giờ**.
  * Trong 24 giờ này, hệ thống cấp đồng thời **cả 2 mã PIN** (mã ô kho cũ và mã ô kho mới) để khách hàng thuận tiện chuyển tài sản sang kho mới. Sau 24h, mã kho cũ tự động bị vô hiệu hóa.

---

## 4. PHẦN 3: QUẢN LÝ DANH MỤC KIỂU KHO CHO BOM (GLOBAL MASTER CATALOG)

### 4.1. Quy tắc Phân quyền & Quản lý Danh mục

* **`BR-BOM-01` (Global Enterprise Catalog):**
  * **BOM (Business Operations Manager)** là vai trò **DUY NHẤT** trong toàn hệ thống có quyền Tạo mới (`POST`), Cập nhật (`PUT`), hoặc Chuyển trạng thái (`PATCH`) danh mục Kiểu kho (`UnitType`).
  * Danh mục `UnitType` là Master Data mang tính toàn cầu (Global), áp dụng đồng nhất trên toàn bộ hệ thống kho của công ty. Bảng `unit_type` **không chứa cột `facility_id`**.
* **`BR-FM-01` (Facility Manager Physical Instantiation):**
  * Facility Manager (FM) **CẤM** không được tự tạo mới, sửa đổi hoặc xóa Kiểu kho.
  * FM chỉ quản lý các **Ô kho vật lý cụ thể (Storage Unit)** tại cơ sở của mình. Khi FM tạo ô kho mới (ví dụ: `A-101`), FM bắt buộc phải chọn từ danh sách Dropdown các `UnitType` đang ở trạng thái `ACTIVE` do BOM ban hành.
* **`BR-BOM-02` (Ràng buộc Vô hiệu hóa mềm - Soft Delete Only):**
  * Tuyệt đối **CẤM xóa vật lý (Hard Delete)** một `UnitType` khỏi cơ sở dữ liệu nếu đã có bất kỳ `StorageUnit` hoặc `RentalContract` nào liên kết.
  * Chỉ được phép chuyển trạng thái `is_active = false` (hoặc `status = 'INACTIVE'`).
* **`BR-BOM-03` (Vô hiệu hóa mềm tức thời - Graceful Deactivation):**
  * Khi BOM chuyển trạng thái một `UnitType` sang `INACTIVE`:
    * Hệ thống **ngay lập tức ẩn** loại kho này khỏi Cổng tìm kiếm & đặt kho của khách hàng mới (`AvailabilityService`).
    * Các Hợp đồng đang chạy (`ACTIVE`, `OVERDUE`) của khách hàng cũ vẫn được tiếp tục sử dụng bình thường cho đến khi hết hạn hợp đồng.
* **`BR-BOM-04` (Khóa gia hạn với Kiểu kho ngừng kinh doanh):**
  * Khi hợp đồng thuộc một `UnitType` đã bị `INACTIVE` đến hạn: Hệ thống **KHÓA TOÀN BỘ NÚT GIA HẠN** (cả tự phục vụ lẫn qua FM).
  * Hiển thị cảnh báo rõ ràng cho khách: *"Loại kho này đã ngừng khai thác kinh doanh. Vui lòng liên hệ Ban quản lý để được hỗ trợ chuyển sang loại kho thay thế."*
* **`BR-BOM-05` (Tự động Ngừng khai thác ô vật lý - Out of Service):**
  * Khi khách hàng kết thúc hợp đồng và bàn giao lại ô kho thuộc `UnitType` đã `INACTIVE`, hệ thống tự động đổi trạng thái ô kho vật lý đó sang:
    $$\text{StorageUnit.status} = \mathbf{OUT\_OF\_SERVICE}$$
  * FM không thể phân bổ ô này cho bất kỳ ai nữa.

### 4.2. Chuẩn hóa Thuộc tính SKU Kiểu kho (Data Fields)

Một `UnitType` chuẩn doanh nghiệp bao gồm 3 nhóm thông tin:

1. **Nhóm 1 — Định danh & Hiển thị (Bắt buộc):**
   * `code` (Mã SKU): Duy nhất toàn hệ thống (vd: `UT-DRY-S`, `UT-CHILLED-M`, `UT-BONDED-XL`).
   * `name` (Tên hiển thị): Tên thương mại (vd: `Kho Thường Size S (Quần áo & Đồ gia dụng)`).
   * `description` (Mô tả công năng): Khuyến nghị tải trọng và loại hàng hóa phù hợp.
2. **Nhóm 2 — Kích thước & Kỹ thuật (Hệ thống tính toán tự động):**
   * `length_m`, `width_m`, `height_m`: Kích thước Dài $\times$ Rộng $\times$ Cao (mét).
   * `area_m2` ($m^2$): **Tự động tính** = `ROUND(width_m * length_m, 2)`. Khóa Read-only trên UI.
   * `volume_m3` ($m^3$): **Tự động tính** = `ROUND(width_m * length_m * height_m, 3)`. Khóa Read-only trên UI.
   * `max_load_kg_m2` (Tải trọng sàn): Khả năng chịu lực tối đa của sàn (kg/$m^2$), phục vụ khách hàng doanh nghiệp B2B chứa hàng nặng.
   * `pallet_capacity` (Sức chứa Pallet): Số pallet tiêu chuẩn (1.0m $\times$ 1.2m) có thể xếp được.
3. **Nhóm 3 — Môi trường lưu trữ & Tiện ích:**
   * `environment` (Môi trường kiểm soát Self-Storage): Enum bắt buộc do BOM ban hành:
     * `STANDARD`: Kho tiêu chuẩn (Nhiệt độ phòng tự nhiên, thông thoáng, PCCC chuẩn).
     * `CLIMATE_CONTROLLED`: Kho máy lạnh (Điều hòa $20^\circ\text{C} - 25^\circ\text{C}$ & kiểm soát ẩm 24/7 cho đồ da, rượu vang, thiết bị điện tử, dược mỹ phẩm).
   * `features` (Đặc tính nổi bật): Danh sách cờ tiện ích (PCCC tự động, camera 24/7, xe nâng hỗ trợ, cửa cuốn cơ/điện).

---

## 5. BẢN ĐỒ THAY ĐỔI TÀI LIỆU CỐT LÕI (CORE DOCS IMPACT MATRIX)

| Tài liệu dự án | Vị trí cần cập nhật | Nội dung cập nhật cụ thể |
| :--- | :--- | :--- |
| **`docs/TOPIC.md`** | **§ 3.1 (`SC-02`):**<br>**§ 3.3 (`FM-01`):**<br>**§ 3.4 (`BM-01`, `BM-03`):**<br>**§ 4 (Flow 1 & 5):**<br>**§ 5 (Flow 6):** | • Bổ sung tính năng Đăng ký danh sách chờ (Waitlist) vào `SC-02`.<br>• Tước quyền quản lý danh mục `UnitType` khỏi `FM-01`, chỉ giữ quản lý ô kho vật lý tại cơ sở.<br>• Bổ sung quyền sở hữu Master Catalog `UnitType` toàn hệ thống vào `BM-01`.<br>• Cập nhật Flow 1 (Waitlist Cascade & Batch Offer), Flow 5 (FM tạo ô từ danh mục BOM), và Flow 6 (Mốc T-30 đếm ngược 10 ngày, T-20 khóa tự gia hạn, Force Renewal qua FM từ T-20 kèm Phí 200k, Bumping Late Binding). |
| **`docs/BUSINESS-RULES.md`** | **§ 2 (Bảng tham số):**<br>**§ 8 (Gia hạn):**<br>**§ 11 (Bồi thường/Bumping):**<br>**§ 14 (Chương mới):**<br>**§ 15 (Chương mới):** | • Bổ sung 6 tham số: `waitlist.hold_hours_single` (24h), `waitlist.hold_hours_batch` (4h), `waitlist.batch_threshold` (5), `renewal.deadline_days` (30), `renewal.late_admin_fee` (200.000đ), `renewal.upgrade_grace_hours` (24h).<br>• Viết lại `BR-REN-08`, `BR-REN-09`, `BR-REN-10`, `BR-REN-11`, `BR-REN-12`.<br>• Bổ sung `BR-BMP-01`, `BR-BMP-02`.<br>• Tạo chương § 14 định nghĩa toàn bộ `BR-WAT-01` .. `BR-WAT-07`.<br>• Tạo chương § 15 định nghĩa toàn bộ `BR-BOM-01` .. `BR-BOM-05`. |
| **`docs/USER-STORIES-AND-USE-CASES.md`** | **Phần 1 (User Stories):**<br>**Phần 2 (Use Cases):** | • Bổ sung `US-SC-02.3` (Đăng ký Waitlist), `US-BM-01.3` (Quản lý Master Unit Type), `US-FM-04.4` (Gia hạn ngoại lệ Force Renewal & Phí phạt).<br>• Cập nhật phân rã `UC-F1-05` (Waitlist Offering), `UC-F5-01` (BOM định nghĩa Unit Type), `UC-F6-02` (Quy trình Force Renewal & Bumping). |
| **`docs/DATA-DICTIONARY.md`** | **§ 2.2 (`unit_type`):**<br>**§ 4.x (`waitlist`):** | • Cập nhật bảng `unit_type`: Chuyển quyền quản trị sang BOM, bổ sung các cột `pallet_capacity`, `max_load_kg_m2`, `environment`, `features`.<br>• Thêm mới bảng `waitlist`: Chi tiết 12 cột, kiểu dữ liệu, khóa ngoại, default value và indexes. |

---

## 6. BỘ CHECKLIST NGHIỆM THU TỰ ĐỘNG (DOD & VERIFICATION)

- [ ] **Tài liệu đồng bộ 100%:** Toàn bộ 4 file tài liệu đặc tả nghiệp vụ không còn bất kỳ mâu thuẫn nào về vai trò giữa BOM vs FM đối với `UnitType`, mốc gia hạn T-30, và luồng Waitlist.
- [ ] **Flyway Migration:** Tạo migration bổ sung cột cho `unit_type` và bảng `waitlist` mới.
- [ ] **Backend Test Suite:** Đảm bảo 522/522 tests pass, bổ sung unit test cho `WaitlistService` và `BOMUnitTypeService`.
- [ ] **Frontend Build:** `npm run build` thành công, chuyển UI thêm kiểu kho sang phân hệ BOM.


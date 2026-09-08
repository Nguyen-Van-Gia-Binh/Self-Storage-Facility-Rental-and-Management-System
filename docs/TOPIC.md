# Đề tài: Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ

> **Self-Storage Facility Rental and Management System**

---

## Mục lục

1. [Giới thiệu đề tài](#1-giới-thiệu-đề-tài)
2. [Danh sách tác nhân (Actors)](#2-danh-sách-tác-nhân-actors)
3. [Yêu cầu chức năng theo tác nhân](#3-yêu-cầu-chức-năng-theo-tác-nhân)
4. [Các luồng nghiệp vụ chính (Flow 1–5)](#4-các-luồng-nghiệp-vụ-chính-flow-15)
5. [Các luồng nghiệp vụ bổ sung (Flow 6–7)](#5-các-luồng-nghiệp-vụ-bổ-sung-flow-67)
6. [Ma trận tác nhân – luồng nghiệp vụ](#6-ma-trận-tác-nhân--luồng-nghiệp-vụ)
7. [Thuật ngữ (Glossary)](#7-thuật-ngữ-glossary)
8. [Phụ lục: Nguyên văn đề bài](#8-phụ-lục-nguyên-văn-đề-bài)

---

## 1. Giới thiệu đề tài

Hệ thống hỗ trợ toàn bộ vòng đời của dịch vụ **cho thuê kho lưu trữ tự phục vụ (self-storage)**:
từ lúc khách hàng tìm kiếm và đặt chỗ một ô kho (storage unit), nhận bàn giao tại cơ sở,
sử dụng và gia hạn, cho tới lúc trả kho — kèm theo các nghiệp vụ vận hành phía sau như
quản lý ô kho, phân công nhân viên, thu phí, xử lý quá hạn và báo cáo doanh thu.

Hệ thống phục vụ **5 nhóm người dùng**, với **5 luồng nghiệp vụ chính** và **2 luồng bổ sung**.

---

## 2. Danh sách tác nhân (Actors)

| # | Tác nhân                            | Tên tiếng Việt               | Vai trò tóm tắt                                                                   |
| - | ------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| 1 | **Storage Customer**            | Khách thuê kho                | Tìm kiếm, đặt chỗ, thanh toán, nhận và quản lý ô kho đã thuê           |
| 2 | **Facility Staff**              | Nhân viên cơ sở             | Bàn giao / thu hồi ô kho, cập nhật trạng thái, xử lý sự cố tại chỗ      |
| 3 | **Facility Manager**            | Quản lý cơ sở               | Quản lý ô kho, hợp đồng, nhân sự và báo cáo của một cơ sở             |
| 4 | **Business Operations Manager** | Quản lý vận hành kinh doanh | Quản lý toàn bộ cơ sở, chính sách, giá, phí và báo cáo toàn hệ thống |
| 5 | **System Administrator**        | Quản trị hệ thống           | Quản lý tài khoản, phân quyền, theo dõi nhật ký hoạt động                |

---

## 3. Yêu cầu chức năng theo tác nhân

### 3.1. Storage Customer — Khách thuê kho

| Mã   | Chức năng                 | Mô tả                                                                                               |
| ----- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| SC-01 | Xem thông tin dịch vụ    | Xem danh sách cơ sở lưu trữ, loại ô kho, kích thước, giá thuê và các ô kho còn trống |
| SC-02 | Đặt chỗ ô kho           | Đặt chỗ bằng cách chọn cơ sở, loại ô kho, ngày bắt đầu và thời hạn thuê             |
| SC-03 | Thanh toán                 | Thanh toán tiền cọc, phí thuê, phí gia hạn hoặc các khoản phụ thu                          |
| SC-04 | Check-in nhận kho          | Đến nhận ô kho được cấp theo lịch hẹn đã đặt                                            |
| SC-05 | Quản lý ô kho đã thuê | Theo dõi và quản lý một hoặc nhiều ô kho đang thuê                                          |
| SC-06 | Gửi yêu cầu hỗ trợ     | Báo sự cố liên quan tới ô kho, khóa, mã truy cập, thanh toán hoặc tài sản lưu trữ      |

### 3.2. Facility Staff — Nhân viên cơ sở

| Mã   | Chức năng                          | Mô tả                                                                                                        |
| ----- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| FS-01 | Kiểm tra đặt chỗ                 | Kiểm tra thông tin đặt chỗ của khách khi khách đến nhận ô kho                                      |
| FS-02 | Hỗ trợ check-in & bàn giao        | Bàn giao ô kho kèm khóa, thẻ truy cập hoặc mã truy cập                                                |
| FS-03 | Cập nhật trạng thái ô kho       | Cập nhật sau bàn giao, trong quá trình sử dụng, sau khi trả kho, hoặc khi cần kiểm tra / bảo trì  |
| FS-04 | Xác nhận tình trạng khi trả kho | Kiểm tra và xác nhận hiện trạng ô kho lúc khách trả                                                  |
| FS-05 | Xử lý sự cố tại chỗ            | Tiếp nhận và xử lý mất chìa khóa, lỗi mã truy cập, ô kho hư hỏng, yêu cầu hỗ trợ của khách |
| FS-06 | Theo dõi công việc hằng ngày    | Danh sách khách cần nhận kho, trả kho hoặc cần hỗ trợ trong ngày                                     |

### 3.3. Facility Manager — Quản lý cơ sở

| Mã   | Chức năng                               | Mô tả                                                                                                   |
| ----- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| FM-01 | Quản lý ô kho tại cơ sở phụ trách | Quản lý loại ô kho, kích thước, vị trí, giá thuê và trạng thái ô kho                       |
| FM-02 | Phân bổ ô kho cho khách               | Gán ô kho phù hợp dựa trên loại ô kho, thời hạn thuê và tình trạng còn trống              |
| FM-03 | Theo dõi khách và hợp đồng          | Giám sát khách đang thuê, hợp đồng thuê, thời hạn thuê và tình trạng thanh toán           |
| FM-04 | Quản lý quy trình vận hành thuê     | Quản lý bàn giao, trả kho, gia hạn và xử lý quá hạn tại cơ sở                                |
| FM-05 | Phân công nhân viên                   | Phân công Facility Staff hỗ trợ bàn giao, kiểm tra ô kho hoặc xử lý sự cố                     |
| FM-06 | Xem báo cáo cơ sở                     | Báo cáo ô kho trống, ô kho đã thuê, doanh thu, tỷ lệ sử dụng và các trường hợp quá hạn |

### 3.4. Business Operations Manager — Quản lý vận hành kinh doanh

| Mã   | Chức năng                      | Mô tả                                                                                    |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| BM-01 | Quản lý danh sách cơ sở     | Quản lý toàn bộ cơ sở lưu trữ trong hệ thống                                     |
| BM-02 | Thiết lập chính sách thuê   | Chính sách chung về đặt cọc, gia hạn, hủy, trả kho và xử lý quá hạn          |
| BM-03 | Quản lý giá và phí          | Khung giá thuê, phụ phí, phí quá hạn, chính sách giảm giá / miễn phí          |
| BM-04 | Giám sát hiệu quả vận hành | Theo dõi doanh thu, tỷ lệ lấp đầy kho và hiệu quả hoạt động của từng cơ sở |
| BM-05 | Báo cáo toàn hệ thống       | Xem và xuất báo cáo theo cơ sở, loại ô kho, doanh thu và tình trạng thuê       |

### 3.5. System Administrator — Quản trị hệ thống

| Mã   | Chức năng                           | Mô tả                                                                                       |
| ----- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| SA-01 | Quản lý tài khoản người dùng   | Quản lý tài khoản người dùng trong hệ thống                                          |
| SA-02 | Phân quyền vai trò                 | Gán vai trò Storage Customer, Facility Staff, Facility Manager, Business Operations Manager |
| SA-03 | Cấu hình quyền truy cập dữ liệu | Phân quyền dữ liệu theo vai trò người dùng và theo cơ sở được gán              |
| SA-04 | Theo dõi nhật ký                   | Theo dõi lịch sử đăng nhập và nhật ký hoạt động của người dùng                |

---

## 4. Các luồng nghiệp vụ chính (Flow 1–5)

> **Lưu ý:** đề bài gốc chỉ nêu *tên* của 7 luồng. Phần *Tác nhân* và *Phạm vi liên quan* dưới đây
> được suy ra từ danh sách chức năng ở Mục 3 để định hướng phân tích, không phải nguyên văn đề bài.

### Flow 1 — Storage Unit Reservation Flow

*Luồng đặt chỗ ô kho*

- **Tác nhân chính:** Storage Customer
- **Tác nhân liên quan:** Facility Manager
- **Phạm vi liên quan:** `SC-01`, `SC-02`, `SC-03`, `FM-02`
- **Nội dung dự kiến:** Khách xem cơ sở / loại ô kho / giá thuê → chọn cơ sở, loại ô kho, ngày bắt đầu
  và thời hạn thuê → tạo đặt chỗ → thanh toán tiền cọc và phí thuê → nhận lịch hẹn check-in.

### Flow 2 — Storage Check-in and Handover Flow

*Luồng check-in và bàn giao ô kho*

- **Tác nhân chính:** Facility Staff
- **Tác nhân liên quan:** Storage Customer, Facility Manager
- **Phạm vi liên quan:** `SC-04`, `FS-01`, `FS-02`, `FS-03`, `FM-02`, `FM-05`
- **Nội dung dự kiến:** Khách đến theo lịch hẹn → nhân viên kiểm tra đặt chỗ → bàn giao ô kho kèm
  khóa / thẻ / mã truy cập → cập nhật trạng thái ô kho sang *đang sử dụng*.

### Flow 3 — Rented Storage Unit Management Flow

*Luồng quản lý ô kho đang thuê*

- **Tác nhân chính:** Storage Customer
- **Tác nhân liên quan:** Facility Manager, Facility Staff
- **Phạm vi liên quan:** `SC-05`, `FS-03`, `FS-04`, `FM-03`, `FM-04`
- **Nội dung dự kiến:** Khách theo dõi các ô kho đang thuê, thời hạn và tình trạng thanh toán;
  quản lý cơ sở giám sát hợp đồng; quy trình trả kho có kiểm tra và xác nhận hiện trạng ô kho.

### Flow 4 — Business Rules, Fee Management, and Revenue Monitoring Flow

*Luồng quy định nghiệp vụ, quản lý phí và giám sát doanh thu*

- **Tác nhân chính:** Business Operations Manager
- **Phạm vi liên quan:** `BM-01`, `BM-02`, `BM-03`, `BM-04`, `BM-05`
- **Nội dung dự kiến:** Thiết lập chính sách đặt cọc / gia hạn / hủy / trả kho / quá hạn, khung giá và
  phụ phí → áp dụng cho toàn hệ thống → giám sát doanh thu, tỷ lệ sử dụng → xem và xuất báo cáo.

### Flow 5 — Facility Storage and Staff Management Flow

*Luồng quản lý kho và nhân sự tại cơ sở*

- **Tác nhân chính:** Facility Manager
- **Tác nhân liên quan:** Facility Staff, System Administrator
- **Phạm vi liên quan:** `FM-01`, `FM-05`, `FM-06`, `FS-06`, `SA-02`, `SA-03`
- **Nội dung dự kiến:** Quản lý danh mục ô kho (loại, kích thước, vị trí, giá, trạng thái) →
  phân công nhân viên theo công việc trong ngày → theo dõi báo cáo của cơ sở.

---

## 5. Các luồng nghiệp vụ bổ sung (Flow 6–7)

### Flow 6 — Storage Renewal and Overdue Handling Flow

*Luồng gia hạn thuê và xử lý quá hạn*

- **Tác nhân chính:** Storage Customer, Facility Manager
- **Phạm vi liên quan:** `SC-03`, `SC-05`, `FM-03`, `FM-04`, `FM-06`, `BM-02`, `BM-03`
- **Nội dung dự kiến:** Nhắc hạn và gia hạn hợp đồng thuê → thanh toán phí gia hạn; nếu quá hạn thì
  áp dụng phí quá hạn và quy trình xử lý quá hạn theo chính sách chung của hệ thống.

### Flow 7 — Support Request and Issue Handling Flow

*Luồng yêu cầu hỗ trợ và xử lý sự cố*

- **Tác nhân chính:** Storage Customer, Facility Staff
- **Tác nhân liên quan:** Facility Manager
- **Phạm vi liên quan:** `SC-06`, `FS-03`, `FS-05`, `FM-05`
- **Nội dung dự kiến:** Khách gửi yêu cầu hỗ trợ (ô kho, khóa, mã truy cập, thanh toán, tài sản) →
  phân công nhân viên xử lý → xử lý tại chỗ → cập nhật trạng thái ô kho và đóng yêu cầu.

---

## 6. Ma trận tác nhân – luồng nghiệp vụ

| Tác nhân                  | Flow 1 | Flow 2 | Flow 3 | Flow 4 | Flow 5 | Flow 6 | Flow 7 |
| --------------------------- | :----: | :----: | :----: | :----: | :----: | :----: | :----: |
| Storage Customer            |   ●   |   ○   |   ●   |        |        |   ●   |   ●   |
| Facility Staff              |        |   ●   |   ○   |        |   ○   |        |   ●   |
| Facility Manager            |   ○   |   ○   |   ●   |        |   ●   |   ●   |   ○   |
| Business Operations Manager |        |        |        |   ●   |        |   ○   |        |
| System Administrator        |        |        |        |        |   ○   |        |        |

**Chú thích:** ● tác nhân chính · ○ tác nhân liên quan

---

## 7. Thuật ngữ (Glossary)

| Thuật ngữ                         | Giải thích                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| **Facility**                  | Cơ sở lưu trữ — một địa điểm vật lý chứa nhiều ô kho                       |
| **Storage Unit**              | Ô kho — đơn vị cho thuê nhỏ nhất, có mã, vị trí và trạng thái riêng       |
| **Unit Type / Unit Size**     | Loại và kích thước ô kho, quyết định khung giá thuê                            |
| **Reservation**               | Đặt chỗ ô kho trước khi nhận bàn giao, gắn với lịch hẹn check-in              |
| **Deposit**                   | Tiền cọc khách trả khi đặt chỗ                                                     |
| **Check-in / Handover**       | Thủ tục khách đến nhận và được bàn giao ô kho kèm phương tiện truy cập   |
| **Access Code / Access Card** | Mã hoặc thẻ truy cập cấp cho khách để vào khu vực kho                           |
| **Renewal**                   | Gia hạn thời hạn thuê, kèm phí gia hạn                                             |
| **Overdue**                   | Quá hạn thuê hoặc quá hạn thanh toán, áp dụng phí và quy trình xử lý riêng |
| **Return**                    | Trả kho — khách kết thúc thuê, nhân viên kiểm tra hiện trạng ô kho            |
| **Usage Rate**                | Tỷ lệ sử dụng / lấp đầy kho của một cơ sở                                      |

---

## 8. Phụ lục: Nguyên văn đề bài

Giữ nguyên bản tiếng Anh để đối chiếu khi làm tài liệu phân tích.

### Topic

> Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ
> **Self-Storage Facility Rental and Management System**

### Actors

> Storage Customer · Facility Staff · Facility Manager · Business Operations Manager · System Administrator

### Requirements

**1. Storage Customer**

- View storage facilities, unit types, unit sizes, rental prices, and available units.
- Reserve a storage unit by choosing the facility, unit type, start date, and rental period.
- Pay the deposit, rental fee, renewal fee, or extra charges.
- Check in to receive the assigned storage unit based on the scheduled appointment.
- Manage one or more rented storage units.
- Send support requests for problems related to the unit, lock, access code, payment, or stored items.

**2. Facility Staff**

- Check the customer's reservation when the customer arrives to receive the unit.
- Support check-in and hand over the storage unit, lock, access card, or access code.
- Update the unit status after handover, during use, after return, or when inspection/maintenance is needed.
- Check and confirm the unit condition when the customer returns the unit.
- Receive and handle on-site problems such as lost keys, access code issues, damaged units, or customer support requests.
- Track the daily list of customers who need to receive units, return units, or receive support.

**3. Facility Manager**

- Manage storage units at the assigned facility, including unit type, size, location, rental price, and unit status.
- Assign suitable storage units to customers based on unit type, rental period, and availability.
- Monitor current customers, rental contracts, rental periods, and payment status.
- Manage the process of unit handover, unit return, rental renewal, and overdue handling at the facility.
- Assign facility staff to support handover, unit inspection, or problem handling.
- View facility reports on available units, rented units, revenue, usage rate, and overdue cases.

**4. Business Operations Manager**

- Manage the list of all storage facilities in the whole system.
- Set general rental policies, such as deposit, renewal, cancellation, unit return, and overdue handling.
- Manage rental price ranges, extra fees, overdue fees, and discount or fee-waiver policies.
- Monitor revenue, storage usage rate, and operating performance of each facility.
- View and export system-wide reports by facility, unit type, revenue, and rental status.

**5. System Administrator**

- Manage user accounts in the system.
- Assign roles to Storage Customer, Facility Staff, Facility Manager, and Business Operations Manager.
- Configure data access permissions based on user role and assigned facility.
- Track login history and user activity logs.

### Main flows

> Flow 1: Storage Unit Reservation Flow
> Flow 2: Storage Check-in and Handover Flow
> Flow 3: Rented Storage Unit Management Flow
> Flow 4: Business Rules, Fee Management, and Revenue Monitoring Flow
> Flow 5: Facility Storage and Staff Management Flow

### Additional flows

> Flow 6: Storage Renewal and Overdue Handling Flow
> Flow 7: Support Request and Issue Handling Flow

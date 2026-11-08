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

| #   | Tác nhân                        | Tên tiếng Việt              | Vai trò tóm tắt                                                      |
| --- | ------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| 1   | **Storage Customer**            | Khách thuê kho              | Tìm kiếm, đặt chỗ, thanh toán, nhận và quản lý ô kho đã thuê         |
| 2   | **Facility Staff**              | Nhân viên cơ sở             | Bàn giao / thu hồi ô kho, cập nhật trạng thái, xử lý sự cố tại chỗ   |
| 3   | **Facility Manager**            | Quản lý cơ sở               | Quản lý ô kho, hợp đồng, nhân sự và báo cáo của một cơ sở            |
| 4   | **Business Operations Manager** | Quản lý vận hành kinh doanh | Quản lý toàn bộ cơ sở, chính sách, giá, phí và báo cáo toàn hệ thống |
| 5   | **System Administrator**        | Quản trị hệ thống           | Quản lý tài khoản, phân quyền, theo dõi nhật ký hoạt động            |

---

## 3. Yêu cầu chức năng theo tác nhân

### 3.1. Storage Customer — Khách thuê kho

| Mã    | Chức năng                     | Mô tả                                                                                                                |
| ----- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| SC-01 | Xem thông tin dịch vụ         | Xem danh sách cơ sở lưu trữ, loại ô kho, kích thước, giá thuê và số chỗ còn trống theo hạng kho                      |
| SC-02 | Đặt chỗ ô kho & Danh sách chờ | Đặt chỗ bằng cách chọn cơ sở, loại ô kho, ngày bắt đầu và thời hạn thuê; đăng ký Waitlist miễn phí khi hết kho trống |
| SC-03 | Thanh toán                    | Thanh toán Deposit cùng toàn bộ phí thuê N tháng khi đặt chỗ, phí gia hạn hoặc các khoản phụ thu                     |
| SC-04 | Check-in nhận kho             | Nhận ô kho linh hoạt qua Check-in Online trên ứng dụng hoặc đến trực tiếp theo lịch hẹn                              |
| SC-05 | Quản lý ô kho đã thuê         | Theo dõi và quản lý một hoặc nhiều ô kho đang thuê                                                                   |
| SC-06 | Gửi yêu cầu hỗ trợ            | Báo sự cố liên quan tới ô kho, khóa, mã truy cập, thanh toán hoặc tài sản lưu trữ                                    |

### 3.2. Facility Staff — Nhân viên cơ sở

| Mã    | Chức năng                       | Mô tả                                                                                             |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| FS-01 | Kiểm tra đặt chỗ                | Kiểm tra thông tin đặt chỗ của khách khi khách đến nhận ô kho                                     |
| FS-02 | Hỗ trợ check-in & bàn giao      | Bàn giao ô kho kèm khóa vật lý (nếu có) hoặc mã PIN / Access Code cho khách (không dùng thẻ RFID) |
| FS-03 | Cập nhật trạng thái ô kho       | Cập nhật sau bàn giao, trong quá trình sử dụng, sau khi trả kho, hoặc khi cần kiểm tra / bảo trì  |
| FS-04 | Xác nhận tình trạng khi trả kho | Kiểm tra và xác nhận hiện trạng ô kho lúc khách trả                                               |
| FS-05 | Xử lý sự cố tại chỗ             | Tiếp nhận và xử lý mất chìa khóa, lỗi mã truy cập, ô kho hư hỏng, yêu cầu hỗ trợ của khách        |
| FS-06 | Theo dõi công việc hằng ngày    | Danh sách khách cần nhận kho, trả kho hoặc cần hỗ trợ trong ngày                                  |

### 3.3. Facility Manager — Quản lý cơ sở

| Mã    | Chức năng                         | Mô tả                                                                                                                                          |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| FM-01 | Quản lý ô kho tại cơ sở phụ trách | Quản lý danh sách ô kho vật lý (Storage Unit), vị trí và trạng thái tại cơ sở; khởi tạo từ danh mục Unit Type của BOM                          |
| FM-02 | Phân bổ ô kho cho khách           | Quản lý hàng đợi đơn đặt chỗ theo Unit Type; FM chủ động gán Storage Unit đang AVAILABLE trước ngày Check-in và có thể đổi ô đến trước ngày đó |
| FM-03 | Theo dõi khách và hợp đồng        | Giám sát khách đang thuê, hợp đồng thuê, thời hạn thuê và tình trạng thanh toán                                                                |
| FM-04 | Quản lý quy trình vận hành thuê   | Quản lý bàn giao, trả kho, gia hạn và xử lý quá hạn tại cơ sở                                                                                  |
| FM-05 | Phân công nhân viên               | Phân công Facility Staff hỗ trợ bàn giao, kiểm tra ô kho hoặc xử lý sự cố                                                                      |
| FM-06 | Xem báo cáo cơ sở                 | Báo cáo ô kho trống, ô kho đã thuê, doanh thu, tỷ lệ sử dụng và các trường hợp quá hạn                                                         |

### 3.4. Business Operations Manager — Quản lý vận hành kinh doanh

| Mã    | Chức năng                       | Mô tả                                                                                         |
| ----- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| BM-01 | Quản lý cơ sở & Kiểu kho Master | Quản lý toàn bộ cơ sở và danh mục Kiểu kho chuẩn hóa toàn hệ thống (Global Unit Type Catalog) |
| BM-02 | Thiết lập chính sách thuê       | Chính sách chung về đặt cọc, gia hạn, hủy, trả kho và xử lý quá hạn                           |
| BM-03 | Quản lý giá và phí              | Khung giá thuê, phụ phí, phí quá hạn, chính sách giảm giá / miễn phí                          |
| BM-04 | Giám sát hiệu quả vận hành      | Theo dõi doanh thu, tỷ lệ lấp đầy kho và hiệu quả hoạt động của từng cơ sở                    |
| BM-05 | Báo cáo toàn hệ thống           | Xem và xuất báo cáo theo cơ sở, loại ô kho, doanh thu và tình trạng thuê                      |

### 3.5. System Administrator — Quản trị hệ thống

| Mã    | Chức năng                       | Mô tả                                                                                       |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| SA-01 | Quản lý tài khoản người dùng    | Quản lý tài khoản người dùng trong hệ thống                                                 |
| SA-02 | Phân quyền vai trò              | Gán vai trò Storage Customer, Facility Staff, Facility Manager, Business Operations Manager |
| SA-03 | Cấu hình quyền truy cập dữ liệu | Phân quyền dữ liệu theo vai trò người dùng và theo cơ sở được gán                           |
| SA-04 | Theo dõi nhật ký                | Theo dõi lịch sử đăng nhập và nhật ký hoạt động của người dùng                              |

---

## 4. Các luồng nghiệp vụ chính (Flow 1–5)

> **Lưu ý:** đề bài gốc chỉ nêu _tên_ của 7 luồng. Phần _Tác nhân_ và _Phạm vi liên quan_ dưới đây
> được suy ra từ danh sách chức năng ở Mục 3 để định hướng phân tích, không phải nguyên văn đề bài.

### Flow 1 — Storage Unit Reservation Flow

_Luồng đặt chỗ ô kho và hàng đợi danh sách chờ_

- **Tác nhân chính:** Storage Customer
- **Tác nhân liên quan:** Facility Manager
- **Phạm vi liên quan:** `SC-01`, `SC-02`, `SC-03`, `FM-02`
- **Nội dung dự kiến:** Khách xem cơ sở, chọn hạng kho (Unit Type), ngày bắt đầu (khống chế trong cửa sổ tối đa 30 ngày theo `BR-RES-01`) và thời hạn thuê → xem bảng ước tính chi phí, tiền cọc Deposit và tùy chọn Gói bảo vệ hàng hóa (+50k/tháng) → hệ thống giữ hạn ngạch hạng kho trong 48h, chưa gán mã ô → khách thanh toán trực tuyến qua cổng VietQR/VNPay/thẻ → hệ thống xác nhận Confirmed và gửi lịch hẹn Check-in. FM phân bổ một Storage Unit đang AVAILABLE cùng loại trước ngày Check-in. Trong giai đoạn chờ nhận kho, khách có thể sử dụng tính năng **Dời ngày có phí theo ngày** (tối đa 7 ngày theo `BR-RES-06`) hoặc **Hủy đặt chỗ theo chính sách 3 tầng** (`BR-CAN-01..03`: hoàn 100% tiền thuê; tiền cọc hoàn 100% nếu hủy sớm $\ge 7$ ngày, phạt 50% nếu hủy 2–6 ngày, phạt 100% nếu hủy dưới 48h). **Trường hợp hết kho trống:** Nếu toàn bộ công suất của Hạng kho trong cửa sổ 30 ngày đã kín chỗ (không còn ngày nào để book), khách hàng được đăng ký miễn phí vào **Danh sách chờ (Waitlist)** chọn ngày mong muốn (`target_start_date` trong vòng 30 ngày). Hệ thống tuyệt đối không nhận đặt trước hay đăng ký Waitlist vượt quá 30 ngày. Khi có kho trống hoặc hợp đồng sắp đáo hạn, hệ thống hiển thị danh sách chờ dạng CRM Inbox để Facility Manager chủ động liên hệ tư vấn chốt sale (khóa độc quyền 2h). Khi khách chốt thuê, FM tạo đơn đặt cọc và khách có 24h thanh toán qua VNPay. Nếu khách từ chối hoặc hết hạn lock 2h, hệ thống tự động giải phóng bản ghi để phục vụ khách tiếp theo theo nguyên tắc FIFO.

### Flow 2 — Storage Check-in and Handover Flow

_Luồng check-in và bàn giao ô kho_

- **Tác nhân chính:** Facility Staff
- **Tác nhân liên quan:** Storage Customer, Facility Manager
- **Phạm vi liên quan:** `SC-04`, `FS-01`, `FS-02`, `FS-03`, `FM-02`, `FM-05`
- **Nội dung dự kiến:** Khách hàng có thể thực hiện **Check-in Online (Digital Move-In)** ngay trên ứng dụng bằng chữ ký điện tử hoặc đến cơ sở nhận trực tiếp theo lịch hẹn. Nhân viên tra cứu đơn Check-in đã được FM gán ô → kiểm tra hiện trường. Nếu ô phát sinh lỗi, nhân viên báo trên hệ thống để FM đổi sang ô AVAILABLE khác cùng loại rồi bàn giao tiếp; chỉ khi cơ sở hết ô thay thế hoặc khách từ chối nhận thì Facility Manager hoàn tiền trong 3 ngày. Khi hoàn tất nghiệm thu (ký số Online hoặc ký tại quầy): hệ thống cấp mã PIN / Access Code 24/7 (không dùng thẻ RFID) → Hợp đồng chuyển _Active_, ô kho chuyển _Occupied_. Nếu khách chưa nhận kho trong 10 ngày ân hạn và không dời lịch, hệ thống áp dụng cơ chế **Auto-Activation** kích hoạt hợp đồng sang _Active_ và cấp mã PIN qua Email/SMS để bảo toàn 100% doanh thu gói thuê cho cơ sở.

### Flow 3 — Rented Storage Unit Management Flow

_Luồng quản lý ô kho đang thuê và trả kho tự động_

- **Tác nhân chính:** Storage Customer
- **Tác nhân liên quan:** Facility Manager, Facility Staff
- **Phạm vi liên quan:** `SC-05`, `FS-03`, `FS-04`, `FM-03`, `FM-04`
- **Nội dung dự kiến:** Khách theo dõi các ô kho đang thuê, thời hạn và tình trạng thanh toán. **Quy trình trả kho tự động**: Trước ngày hết hạn hợp đồng 1 tháng, nếu khách không thực hiện gia hạn thì hệ thống mặc định coi như không thuê tiếp và tự động chuyển sang tiến trình trả kho khi đến hạn. Hết hạn hợp đồng, nếu muốn tiếp tục thuê khách phải tạo hợp đồng mới. Khách hoàn tất dọn đồ, nhân viên nghiệm thu hiện trạng và quản lý cơ sở quyết toán hoàn Deposit. Khách hàng có quyền **Trả kho sớm (Win-Win)** theo `BR-RET-06`: hệ thống hoàn trả 100% tiền thuê phần thời gian chưa dùng, phạt 100% tiền cọc Deposit do vi phạm thời hạn hợp đồng, và khấu trừ chi phí hư hại vật chất theo biên bản nghiệm thu.

### Flow 4 — Business Rules, Fee Management, and Revenue Monitoring Flow

_Luồng quy định nghiệp vụ, quản lý phí và giám sát doanh thu_

- **Tác nhân chính:** Business Operations Manager
- **Tác nhân liên quan:** Facility Manager
- **Phạm vi liên quan:** `BM-01`, `BM-02`, `BM-03`, `BM-04`, `BM-05`
- **Nội dung dự kiến:** BOM đăng nhập thiết lập chính sách cọc (Deposit), chính sách gia hạn (Renewal & lịch nhắc hẹn), chính sách hủy & hoàn tiền (Cancellation & Refund), quản lý khung giá, phụ phí và theo dõi doanh thu, tỷ lệ sử dụng (Usage Rate) toàn hệ thống.

### Flow 5 — Facility Storage and Staff Management Flow

_Luồng quản lý kho và nhân sự tại cơ sở_

- **Tác nhân chính:** Facility Manager
- **Tác nhân liên quan:** Facility Staff, System Administrator, Business Operations Manager
- **Phạm vi liên quan:** `FM-01`, `FM-05`, `FM-06`, `FS-06`, `BM-01`, `SA-02`, `SA-03`
- **Nội dung dự kiến:** BOM quản lý danh mục Kiểu kho chuẩn hóa toàn hệ thống (Master Unit Type Catalog). FM tại cơ sở khởi tạo và quản lý danh sách ô kho vật lý (Storage Unit: mã, vị trí, trạng thái) chọn từ danh mục Unit Type đang ACTIVE của BOM → phân công Facility Staff theo công việc trong ngày → xem báo cáo cơ sở (trạng thái ô kho, doanh thu, Usage Rate, hợp đồng).

---

## 5. Các luồng nghiệp vụ bổ sung (Flow 6–7)

### Flow 6 — Storage Renewal and Overdue Handling Flow

_Luồng gia hạn thuê, điều chuyển và xử lý quá hạn_

- **Tác nhân chính:** Storage Customer, Facility Manager
- **Tác nhân liên quan:** Business Operations Manager
- **Phạm vi liên quan:** `SC-03`, `SC-05`, `FM-03`, `FM-04`, `FM-06`, `BM-02`, `BM-03`
- **Nội dung dự kiến:**
  - **Sub-flow 6.1 (Gia hạn & Điều chuyển):** Hệ thống gửi nhắc tự động từ trước 2 tháng (mốc 60, 30, 25, 20, 7, 3, 1 ngày). Mốc T-30 ngày bắt đầu chuỗi 10 ngày thông báo khẩn cấp cho khách đang thuê chủ động tự gia hạn online. Đúng mốc **T-20 ngày**, nếu khách không gia hạn, hệ thống chính thức khóa quyền tự gia hạn trên portal, hợp đồng chuyển sang `PENDING_EXPIRATION` và kho tự động đẩy vào Waitlist. Khách cũ muốn gia hạn muộn (từ T-20 đến T-0) bắt buộc phải qua FM duyệt `[Gia hạn ngoại lệ]` kèm phí hành chính 200.000 VNĐ, và chỉ được duyệt khi khách chờ trong Waitlist chưa cọc. **Late Binding Bumping:** Nếu khách mới đã cọc mà ô kho dự kiến gặp sự cố, FM điều chuyển sang ô khác cùng loại đang AVAILABLE; nếu cháy kho toàn cơ sở, kích hoạt bồi thường khẩn cấp (Top 1 Waitlist hoặc hoàn 100% cọc + phí thuê và tặng voucher 10-20%). Hệ thống cấm đổi loại kho khi tự gia hạn; đổi hạng kho phải qua FM hỗ trợ quy trình 2 bước và cấp 24h ân hạn chuyển đồ.
  - **Sub-flow 6.2 (Xử lý quá hạn):** Hợp đồng không gia hạn trước 1 tháng sẽ mặc định chuyển sang tiến trình trả kho; đến ngày kết thúc hợp đồng nếu khách chưa dọn đồ sẽ chuyển sang quá hạn (D+1). Từ ngày 1 đến 3 (D+1 → D+3) là giai đoạn ân hạn: hệ thống gửi thông báo nhắc dọn đồ mỗi ngày, chưa tính phí quá hạn và khách truy cập kho bình thường (nếu khách dọn xong trong 3 ngày này thì được hoàn trả 100% tiền cọc). Từ ngày thứ 4 đến ngày thứ 10 (D+4 → D+10), hệ thống tự động tính phí quá hạn 10% tiền cọc mỗi ngày và gửi thông báo nhắc dọn đồ hằng ngày. Quá 10 ngày (D+10): chấm dứt hợp đồng, khóa quyền truy cập, ô kho chuyển sang Cleaning/Maintaining; FM phân công Staff dọn dẹp, toàn bộ đồ đạc của khách được niêm phong chuyển vào kho lưu trữ tổng để FM xử lý thủ công ngoại tuyến (offline). Hệ thống không hỗ trợ tính năng đề xuất miễn giảm phí quá hạn.

### Flow 7 — Support Request and Issue Handling Flow

_Luồng yêu cầu hỗ trợ và xử lý sự cố_

- **Tác nhân chính:** Storage Customer, Facility Staff
- **Tác nhân liên quan:** Facility Manager
- **Phạm vi liên quan:** `SC-06`, `FS-03`, `FS-05`, `FM-05`
- **Nội dung dự kiến:** Khách gửi yêu cầu hỗ trợ sự cố → Facility Manager tiếp nhận và phân loại yêu cầu → FM phân công công việc cho Facility Staff → Staff xử lý hiện trường → hệ thống thông báo kết quả cho khách và đóng yêu cầu. Về trách nhiệm đền bù thiệt hại hàng hóa (`BR-SUP-04`): hệ thống áp dụng hạn mức trách nhiệm mặc định tối đa 10.000.000 VNĐ / ô kho cho sự cố do lỗi cơ sở; cung cấp tùy chọn Gói bảo vệ mở rộng (+50.000 VNĐ/tháng) bồi thường tới 50.000.000 VNĐ qua đối tác bảo hiểm; miễn trừ 100% đối với hàng cấm (chất cháy nổ, đồ tươi sống, tiền mặt, kim loại quý).

---

## 6. Ma trận tác nhân – luồng nghiệp vụ

| Tác nhân                    | Flow 1 | Flow 2 | Flow 3 | Flow 4 | Flow 5 | Flow 6 | Flow 7 |
| --------------------------- | :----: | :----: | :----: | :----: | :----: | :----: | :----: |
| Storage Customer            |   ●    |   ○    |   ●    |        |        |   ●    |   ●    |
| Facility Staff              |        |   ●    |   ○    |        |   ○    |        |   ●    |
| Facility Manager            |   ○    |   ○    |   ●    |   ○    |   ●    |   ●    |   ○    |
| Business Operations Manager |        |        |        |   ●    |        |   ○    |        |
| System Administrator        |        |        |        |        |   ○    |        |        |

**Chú thích:** ● tác nhân chính · ○ tác nhân liên quan

---

## 7. Thuật ngữ (Glossary)

| Thuật ngữ                 | Giải thích                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Facility**              | Cơ sở lưu trữ — một địa điểm vật lý chứa nhiều ô kho                                                                                                                                        |
| **Storage Unit**          | Ô kho — đơn vị cho thuê nhỏ nhất, có mã, vị trí và trạng thái riêng                                                                                                                         |
| **Unit Type / Unit Size** | Loại và kích thước ô kho, quyết định khung giá thuê                                                                                                                                         |
| **Reservation**           | Đặt chỗ theo Facility, Unit Type và khoảng thuê; giữ hạn ngạch hạng kho khi chờ thanh toán. Sau thanh toán, `storage_unit_id` vẫn trống cho đến khi FM gán Storage Unit trước ngày Check-in |
| **Deposit**               | Tiền cọc khách trả khi đặt chỗ                                                                                                                                                              |
| **Check-in / Handover**   | Thủ tục khách đến nhận và bàn giao ô kho kèm mã PIN / Access Code hoặc chìa khóa vật lý (không dùng thẻ RFID)                                                                               |
| **Access Code**           | Mã số truy cập / PIN cấp cho khách để mở khóa hoặc vào khu vực kho (không dùng thẻ từ)                                                                                                      |
| **Renewal**               | Gia hạn thời hạn thuê, kèm phí gia hạn                                                                                                                                                      |
| **Overdue**               | Quá hạn thuê: tính phí D+4..D+10, quá D+10 chấm dứt hợp đồng và dọn dẹp kho                                                                                                                 |
| **Return**                | Trả kho tự động nếu không gia hạn trước 1 tháng; nhân viên nghiệm thu hiện trạng                                                                                                            |
| **Usage Rate**            | Tỷ lệ sử dụng / lấp đầy kho của một cơ sở                                                                                                                                                   |

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

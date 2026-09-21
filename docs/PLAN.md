# Kế hoạch triển khai dự án

> **Self-Storage Facility Rental and Management System** — 10 tuần, 5 giai đoạn, 4 thành viên.
>
> Kế hoạch này bám theo [TOPIC.md](TOPIC.md): 5 actor, 27 mã yêu cầu chức năng (§ 3) và 7 luồng
> nghiệp vụ (§ 4–5). Bản phân công nhiệm vụ được tái cấu trúc thành **4 Trục công việc (Workstreams) độc lập**
> nhằm triệt tiêu xung đột mã nguồn (Zero Conflicts) và tối ưu hóa việc hợp nhất (Easy Merge).
> *(Lịch sử các phiên bản kế hoạch được lưu trữ đầy đủ trong lịch sử Git)*.
>
> Bảng theo dõi tiến độ chi tiết đặt trên Notion:
> [SWP391 — Task Tracker](https://app.notion.com/p/3d5561bd42cd808e8161c482b37386c6).

---

## Mục lục

1. [Thông tin chung](#1-thông-tin-chung)
2. [Chiến lược phân chia theo 4 Trục công việc (Workstreams)](#2-chiến-lược-phân-chia-theo-4-trục-công-việc-workstreams)
3. [Lộ trình tổng thể 5 giai đoạn](#3-lộ-trình-tổng-thể-5-giai-đoạn)
4. [Chi tiết nhiệm vụ từng giai đoạn](#4-chi-tiết-nhiệm-vụ-từng-giai-đoạn)
5. [Bản đồ phủ 27 mã yêu cầu chức năng](#5-bản-đồ-phủ-27-mã-yêu-cầu-chức-năng)
6. [Quy tắc kỹ thuật chống xung đột mã nguồn (Zero-Conflict Rules)](#6-quy-tắc-kỹ-thuật-chống-xung-đột-mã-nguồn-zero-conflict-rules)
7. [Quy ước làm việc &amp; Định nghĩa hoàn thành (DoD)](#7-quy-ước-làm-việc--định-nghĩa-hoàn-thành-dod)
8. [Quản lý rủi ro và đối sách](#8-quản-lý-rủi-ro-và-đối-sách)

---

## 1. Thông tin chung

| Hạng mục                        | Nội dung                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Thời lượng**           | 10 tuần · 5 giai đoạn × 2 tuần                                                                       |
| **Bắt đầu / Kết thúc** | 08/09/2026 → 16/11/2026                                                                                   |
| **Nhịp báo cáo**         | 2 tuần/lần — 21/09 (P1) · 05/10 (P2) · 19/10 (P3) · 02/11 (P4) · 16/11 (P5)                         |
| **Nhân sự**               | 4 thành viên (Fullstack theo Cụm chức năng / Feature-driven)                                          |
| **Công nghệ**             | Spring Boot 3 (Java 17) · React 18 (TypeScript + Vite + Tailwind CSS) · SQL Server 2022 · Flyway · JWT |

---

## 2. Chiến lược phân chia theo 4 Trục công việc (Workstreams)

Để tránh nút thắt cổ chai khi 1 người làm toàn bộ Frontend cho 5 Portal và tránh đụng độ git khi gộp code, dự án chia thành **4 Trục công việc độc lập (Vertical Bounded Contexts)**. Mỗi thành viên làm chủ trọn vẹn từ Backend Entity, Service, Controller đến Frontend Feature Pages của trục mình:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│              TẦNG NỀN TẢNG DÙNG CHUNG (Thiết lập 1 lần — Cấm sửa tùy tiện)             │
│        Common DTOs, Security Filter, CSDL gốc (Storage_Self.sql), Base Layout UI       │
└────────────────────────────────────────────────────────────────────────────────────────┘
         │                           │                          │                      │
         ▼                           ▼                          ▼                      ▼
  [WORKSTREAM 1]              [WORKSTREAM 2]             [WORKSTREAM 3]         [WORKSTREAM 4]
Khách hàng & Đặt chỗ        Cơ sở, Kho & Vận hành      Tài chính & Quá hạn    Quản trị & Điều phối
• Flow 1 (Reservation)      • Flow 2 (Check-in)        • Flow 4 (Policy/Fee)  • Flow 5 (Staff Mgmt)
• Flow 6.1 (Renewal UI)     • Flow 3 (Return/Contract) • Flow 6.2 (Overdue)   • Flow 7 (Support)
• Customer Portal           • Staff Portal             • Payment & BOM Portal • Manager & Admin Portal
(Xuân Nhi)                  (Gia Bình)                 (Nhật Huỳnh)           (Thanh Tùng)
```

### Ma trận phân định ranh giới 4 Trục công việc:

| Trục công việc                            | Người phụ trách               | Luồng nghiệp vụ                                                                                                | Phạm vi Backend (`com.swp391.selfstorage.*`) | Phạm vi Frontend (`src/features/*`)                                             | Bảng CSDL làm chủ                                              |
| -------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **WS1: Khách hàng & Đặt chỗ**     | **Nguyễn Phạm Xuân Nhi** | **Flow 1** (Đặt chỗ kho)<br>**Flow 6.1** (Gia hạn trực tuyến)<br>Public Catalog                         | `reservation` (query unit/facility)            | `customer` (Interactive Unit Picker, Catalog, Booking, My Units)                   | `reservation`, `reservation_item`                                   |
| **WS2: Cơ sở & Vận hành**          | **Nguyễn Văn Gia Bình**            | **Flow 2** (Check-in & Bàn giao)<br>**Flow 3** (Quản lý kho & Trả kho)<br>Vòng đời Hợp đồng         | `facility`, `unit`, `contract`                      | `staff` (Check-in Desk, Handover e-Form, Return Inspection, Unit Status)           | `facility`, `unit_type`, `storage_unit`, `rental_contract`, `inspection`    |
| **WS3: Tài chính & Tự động hóa** | **Huỳnh Nhật**            | **Flow 4** (Chính sách & Bảng giá BOM)<br>**Flow 6.2** (Xử lý quá hạn & Cronjob)<br>Cổng thanh toán | `payment`, `policy`, `scheduler` (cron jobs)        | `bom`, `payment` (QR Popup Modal, Pricing config, System Revenue)                     | `payment_transaction`, `pricing_rule`, `overdue_log`                  |
| **WS4: Quản trị & Điều phối**     | **Lê Thanh Tùng**                   | **Flow 5** (Điều phối nhân sự FM)<br>**Flow 7** (Xử lý sự cố & Ticket)<br>Identity & Access          | `auth`, `user`, `support`, `report`                     | `manager`, `admin`, `auth` (Login, RBAC, Assign Staff, Incident Board, Facility Report) | `app_user`, `user_facility_assignment`, `support_request`, `activity_log` |

---

## 3. Lộ trình tổng thể 5 giai đoạn

| GĐ          | Tuần | Thời gian     | Trọng tâm                                                                                          | Báo cáo             |
| ------------ | ----- | -------------- | ---------------------------------------------------------------------------------------------------- | --------------------- |
| **P1** | 1–2  | 08/09 – 21/09 | Phân tích yêu cầu, business rules, ERD, activity diagram, wireframe, thiết lập repo            | **#1** — 21/09 |
| **P2** | 3–4  | 22/09 – 05/10 | Dựng nền tảng: Schema CSDL, Security JWT, Base UI, Module Quản trị, Cơ sở & Bảng giá        | **#2** — 05/10 |
| **P3** | 5–6  | 06/10 – 19/10 | Trục xương sống: Flow 1 (Đặt chỗ kho) + Cổng thanh toán + Flow 2 (Check-in & Bàn giao)     | **#3** — 19/10 |
| **P4** | 7–8  | 20/10 – 02/11 | Khép kín vòng đời: Flow 3 (Trả kho) + Flow 6 (Gia hạn & Cronjob quá hạn) + Flow 7 (Sự cố) | **#4** — 02/11 |
| **P5** | 9–10 | 03/11 – 16/11 | Flow 4 (Báo cáo & Giám sát doanh thu), nhật ký hoạt động, kiểm thử e2e, deploy & bảo vệ | **#5** — 16/11 |

---

## 4. Chi tiết nhiệm vụ từng giai đoạn

> **Ghi chú về mã nhiệm vụ:** Các mã `T1.*` đến `T5.*` được giữ nguyên vẹn để bảo đảm tính tương thích với
> toàn bộ tài liệu phân tích ([USE-CASES.md](USE-CASES.md), [USER-STORIES-*.md](USER-STORIES-SC.md), [README.md](../README.md)).

### Giai đoạn 1 — Phân tích và Thiết kế

**Tuần 1–2 · 08/09 – 21/09 · Báo cáo #1**
*Mục tiêu:* Đặc tả toàn diện hệ thống vào tài liệu, dựng khung repo Backend + Frontend chạy được.

| Mã   | Trục | Nhiệm vụ                                                                                                                                                                                                                                                                                                                                                                                                                    | Người phụ trách | Hạn |
| ----- | :---: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----------------: | :---: |
| T1.1  |  WS4  | Phân rã Flow 1–7 thành danh sách use case                                                                                                                                                                                                                                                                                                                                                                                |        Bình        | 14/09 |
| T1.2  |  WS1  | Viết user story cho Storage Customer (`SC-01`→`SC-06`)                                                                                                                                                                                                                                                                                                                                                                  |        Bình        | 21/09 |
| T1.3  |  WS2  | Viết user story cho Facility Staff và Facility Manager (`FS-*`, `FM-*`)                                                                                                                                                                                                                                                                                                                                                 |        Tùng        | 21/09 |
| T1.4  |  WS3  | Viết user story cho BOM và System Administrator (`BM-*`, `SA-*`) — [USER-STORIES-BM-SA.md](USER-STORIES-BM-SA.md)                                                                                                                                                                                                                                                                                                       |        Nhật        | 21/09 |
| T1.5  |  WS4  | Chốt business rules: Reservation, Availability, Pricing, Payment, Deposit, Cancellation, Renewal, Overdue, Return                                                                                                                                                                                                                                                                                                            |        Bình        | 21/09 |
| T1.6  |  WS4  | Vẽ Use Case Diagram tổng cho 5 actor                                                                                                                                                                                                                                                                                                                                                                                        |        Bình        | 14/09 |
| T1.7  | WS1/2 | Vẽ Activity Diagram Flow 1 và Flow 2 —[activity-diagram-flow-1-storage-reservation.drawio](diagrams/activity-diagram-flow-1-storage-reservation.drawio), [activity-diagram-flow-2-checkin-handover.drawio](diagrams/activity-diagram-flow-2-checkin-handover.drawio)                                                                                                                                                         |        Tùng        | 14/09 |
| T1.7b | WS1/2 | Vẽ Activity Diagram Main Flow End-to-End và Ánh xạ UI Demo ([UI-FLOW-MAPPING.md](UI-FLOW-MAPPING.md))                                                                                                                                                                                                                                                                                                                      |        Tùng        | 14/09 |
| T1.8  |  WS3  | Vẽ Activity Diagram Flow 6 (Renew & Overdue) —[activity-diagram-flow-6-1-storage-renewal.drawio](diagrams/activity-diagram-flow-6-1-storage-renewal.drawio), [activity-diagram-flow-6-2-overdue-handling.drawio](diagrams/activity-diagram-flow-6-2-overdue-handling.drawio)                                                                                                                                                  |        Nhật        | 14/09 |
| T1.9  |  WS4  | Vẽ Activity Diagram Flow 4, Flow 5 và Flow 7 —[activity-diagram-flow-4-business-operations.drawio](diagrams/activity-diagram-flow-4-business-operations.drawio), [activity-diagram-flow-5-facility-staff-management.drawio](diagrams/activity-diagram-flow-5-facility-staff-management.drawio), [activity-diagram-flow-7-support-incident-handling.drawio](diagrams/activity-diagram-flow-7-support-incident-handling.drawio) |        Bình        | 21/09 |
| T1.10 |  WS2  | Thiết kế ERD cho toàn hệ thống                                                                                                                                                                                                                                                                                                                                                                                           |        Tùng        | 14/09 |
| T1.11 |  WS3  | Viết data dictionary cho ERD                                                                                                                                                                                                                                                                                                                                                                                                 |        Nhật        | 21/09 |
| T1.12 |  WS4  | Thiết kế sơ đồ phân quyền theo vai trò và theo cơ sở (`SA-02`, `SA-03`)                                                                                                                                                                                                                                                                                                                                        |        Nhật        | 21/09 |
| T1.13 |  WS1  | Wireframe portal Storage Customer                                                                                                                                                                                                                                                                                                                                                                                             |         Nhi         | 14/09 |
| T1.14 |  WS2  | Wireframe portal Facility Staff và Facility Manager                                                                                                                                                                                                                                                                                                                                                                          |         Nhi         | 21/09 |
| T1.15 |  WS3  | Wireframe portal Business Operations Manager và Admin                                                                                                                                                                                                                                                                                                                                                                        |         Nhi         | 21/09 |
| T1.16 |  WS2  | Khởi tạo Spring Boot skeleton, SQL Server và Flyway                                                                                                                                                                                                                                                                                                                                                                        |        Tùng        | 14/09 |
| T1.17 |  WS1  | Khởi tạo React app và design system cơ bản                                                                                                                                                                                                                                                                                                                                                                               |         Nhi         | 14/09 |
| T1.18 |  WS4  | Thống nhất coding convention, Git workflow và quy ước API                                                                                                                                                                                                                                                                                                                                                                |        Bình        | 14/09 |
| T1.19 |  WS4  | Chuẩn bị slide và demo Báo cáo#1                                                                                                                                                                                                                                                                                                                                                                                         |        Bình        | 21/09 |

---

### Giai đoạn 2 — Nền tảng hệ thống và Quản trị

**Tuần 3–4 · 22/09 – 05/10 · Báo cáo #2**
*Phạm vi yêu cầu:* `SA-01`, `SA-02`, `SA-03`, `BM-01`, `BM-03`, `FM-01`, `SC-01`.
*Mục tiêu:* Tạo lập nền tảng CSDL chung, Security JWT, danh mục cơ sở, ô kho và khung giá chuẩn.

| Mã   | Trục | Nhiệm vụ                                                                             | Người phụ trách | Hạn |
| ----- | :---: | -------------------------------------------------------------------------------------- | :-----------------: | :---: |
| T2.1  |  WS2  | Tạo schema CSDL và Flyway migration V1 (từ `database/Storage_Self.sql`)            |        Bình        | 28/09 |
| T2.2  |  WS3  | Tạo seed data mẫu chuẩn hóa (đầy đủ 5 roles, 2 cơ sở, 20 ô kho)             |        Nhật        | 05/10 |
| T2.3  |  WS4  | Auth: Đăng ký, đăng nhập JWT, Spring Security & Password Encoder                 |        Tùng        | 28/09 |
| T2.4  |  WS4  | API quản lý tài khoản người dùng (`SA-01`)                                    |        Tùng        | 05/10 |
| T2.5  |  WS4  | API gán vai trò cho người dùng (`SA-02`)                                        |        Tùng        | 05/10 |
| T2.6  |  WS4  | Phân quyền truy cập dữ liệu theo vai trò và cơ sở (`SA-03`)                 |        Tùng        | 05/10 |
| T2.7  |  WS2  | API quản lý cơ sở Facility (`BM-01`)                                             |        Bình        | 28/09 |
| T2.8  |  WS2  | API quản lý Unit Type và Storage Unit (`FM-01`)                                   |        Bình        | 05/10 |
| T2.9  |  WS3  | API khung giá thuê, phụ phí và phí quá hạn (`BM-03`)                         |        Nhật        | 05/10 |
| T2.10 |  WS2  | API tra cứu Facility, Unit Type, giá và Availability theo khoảng thuê (`SC-01`) |        Bình        | 05/10 |
| T2.11 |  WS1  | Frontend: Layout chung, Sidebar theo vai trò, Route Guard & Token Storage             |         Nhi         | 28/09 |
| T2.12 |  WS4  | Frontend: Màn hình đăng nhập, đăng ký và phục hồi mật khẩu                |         Nhi         | 28/09 |
| T2.13 |  WS3  | Frontend: Màn hình quản lý cơ sở và bảng giá của BOM                         |         Nhi         | 05/10 |
| T2.14 |  WS2  | Frontend: Màn hình quản lý danh mục ô kho của Facility Manager                  |        Bình        | 05/10 |
| T2.15 |  WS4  | Frontend: Màn hình Admin quản lý tài khoản và phân quyền dữ liệu            |        Tùng        | 05/10 |
| T2.16 |  WS1  | Frontend: Trang công khai xem danh sách Facility, Unit Type & tình trạng trống    |        Bình        | 05/10 |
| T2.17 |  WS2  | Unit test tầng service cho module danh mục & quản trị (44 tests)              |        Bình        | 05/10 |
| T2.18 |  WS4  | Rà soát API contract và chuẩn bị Báo cáo#2                                      |        Bình        | 05/10 |

---

### Giai đoạn 3 — Flow 1 và Flow 2: Reservation và Check-in

**Tuần 5–6 · 06/10 – 19/10 · Báo cáo #3**
*Phạm vi yêu cầu:* `SC-02`, `SC-03`, `SC-04`, `FS-01`, `FS-02`, `FS-03`, `FM-02`.
*Mục tiêu:* Trục xương sống thông suốt: Khách đặt chỗ $\rightarrow$ Thanh toán $\rightarrow$ Khách đến cơ sở $\rightarrow$ Bàn giao & Kích hoạt hợp đồng.

| Mã   | Trục | Nhiệm vụ                                                                                          | Người phụ trách | Hạn |
| ----- | :---: | --------------------------------------------------------------------------------------------------- | :-----------------: | :---: |
| T3.1  |  WS1  | API tạo Reservation giữ capacity trong 48h (`SC-02`)                                            |        Tùng        | 12/10 |
| T3.2  |  WS2  | Cơ chế tạm giữ ô kho nguyên tử và khóa Reserved Storage Unit sau thanh toán (`FM-02`)   |        Bình        | 12/10 |
| T3.3  |  WS3  | API thanh toán toàn bộ phí thuê N tháng cùng Deposit qua cổng VietQR/PayOS (`SC-03`)      |        Nhật        | 12/10 |
| T3.4  |  WS2  | Sinh Hợp đồng `PENDING_CHECKIN` và lịch hẹn Check-in sau khi thanh toán thành công        |        Bình        | 19/10 |
| T3.5  |  WS2  | API kiểm tra thông tin đặt chỗ khi khách đến cơ sở (`FS-01`)                            |        Bình        | 19/10 |
| T3.6  |  WS2  | API bàn giao ô kho, ký biên bản điện tử và cấp Access Code/mã PIN (`FS-02`)            |        Bình        | 19/10 |
| T3.7  |  WS2  | API cập nhật trạng thái ô kho sang `OCCUPIED` và Hợp đồng sang `ACTIVE` (`FS-03`)     |        Bình        | 19/10 |
| T3.8  |  WS1  | API check-in xác nhận khách đã nhận kho (`SC-04`)                                           |        Tùng        | 19/10 |
| T3.9  |  WS1  | Frontend: Luồng đặt chỗ và **Sơ đồ chọn ô kho trực quan** (Interactive Unit Picker) |         Nhi         | 12/10 |
| T3.10 |  WS3  | Frontend: Màn hình thanh toán trực tuyến (Popup quét VietQR và xác nhận)                   |         Nhi         | 19/10 |
| T3.11 |  WS2  | Frontend: Màn hình Staff tra cứu đặt chỗ, biên bản bàn giao và cấp mã PIN               |        Bình        | 19/10 |
| T3.12 |  WS4  | Frontend: Màn hình Facility Manager giám sát hợp đồng và xử lý đổi ô kho               |        Tùng        | 19/10 |
| T3.13 |  WS4  | Test tích hợp luồng E2E Flow 1$\rightarrow$ Flow 2                                             |        Nhật        | 19/10 |
| T3.14 |  WS4  | Viết kịch bản test case thủ công và chuẩn bị Báo cáo#3                                    |        Bình        | 19/10 |

---

### Giai đoạn 4 — Flow 3, 6 và 7: Vòng đời thuê, Gia hạn, Hỗ trợ

**Tuần 7–8 · 20/10 – 02/11 · Báo cáo #4**
*Phạm vi yêu cầu:* `SC-05`, `SC-06`, `FS-04`, `FS-05`, `FS-06`, `FM-03`, `FM-04`, `FM-05`, `BM-02`.
*Mục tiêu:* Khép kín vòng đời: Quản lý kho đang thuê, Gia hạn, Xử lý quá hạn tự động bằng Cronjob, Trả kho hoàn cọc, và Xử lý sự cố.

| Mã   | Trục | Nhiệm vụ                                                                                                                            | Người phụ trách | Hạn |
| ----- | :---: | ------------------------------------------------------------------------------------------------------------------------------------- | :-----------------: | :---: |
| T4.1  |  WS1  | API danh sách ô kho đang thuê của khách (`SC-05`)                                                                             |        Tùng        | 26/10 |
| T4.2  |  WS2  | API theo dõi khách và hợp đồng thuê cho Facility Manager (`FM-03`)                                                           |        Bình        | 26/10 |
| T4.3  |  WS2  | Quy trình Return: Biên bản nghiệm thu inspection, quyết toán và hoàn cọc Deposit (`FS-04`, `FM-04`)                      |        Bình        | 02/11 |
| T4.4  |  WS3  | API cấu hình chính sách cọc, hoàn tiền và gia hạn (`BM-02`)                                                                |        Nhật        | 26/10 |
| T4.5  |  WS3  | API Renewal tự động sau Payment, kiểm tra capacity và gia hạn hợp đồng                                                       |        Nhật        | 02/11 |
| T4.6  |  WS3  | **Scheduled Cronjob** xử lý Overdue hằng đêm: ân hạn D+1..D+3, phạt 10%/ngày D+4..D+10, chấm dứt D+10 (`UC-F6-11`) |        Nhật        | 02/11 |
| T4.7  |  WS4  | API gửi và theo dõi yêu cầu hỗ trợ / sự cố (`SC-06`)                                                                       |        Tùng        | 02/11 |
| T4.8  |  WS4  | API phân công nhân viên và cập nhật tiến độ xử lý sự cố (`FM-05`, `FS-05`)                                          |        Tùng        | 02/11 |
| T4.9  |  WS4  | API bảng công việc hằng ngày của Staff (`FS-06`)                                                                              |        Tùng        | 02/11 |
| T4.10 |  WS1  | Frontend: Dashboard quản lý danh sách ô kho đang thuê của khách                                                               |         Nhi         | 26/10 |
| T4.11 |  WS3  | Frontend: Màn hình gia hạn trực tuyến và cảnh báo hạn hợp đồng                                                            |         Nhi         | 02/11 |
| T4.12 |  WS4  | Frontend: Màn hình gửi và theo dõi ticket hỗ trợ sự cố của khách                                                           |        Tùng        | 02/11 |
| T4.13 |  WS2  | Frontend: Màn hình Staff — Nghiệm thu trả kho, danh mục việc trong ngày                                                       |        Bình        | 02/11 |
| T4.14 |  WS4  | Frontend: Màn hình FM — Giám sát hợp đồng, phân công nhân viên xử lý sự cố                                            |        Tùng        | 02/11 |
| T4.15 |  WS3  | Test tích hợp tự động cho Scheduled Cronjob và luồng hoàn cọc                                                                |        Nhật        | 02/11 |
| T4.16 |  WS4  | Đối chiếu business rules và chuẩn bị Báo cáo#4                                                                                |        Bình        | 02/11 |

---

### Giai đoạn 5 — Flow 4: Báo cáo, Doanh thu và Hoàn thiện

**Tuần 9–10 · 03/11 – 16/11 · Báo cáo #5 (Bảo vệ tốt nghiệp)**
*Phạm vi yêu cầu:* `FM-06`, `BM-04`, `BM-05`, `SA-04`.
*Mục tiêu:* Tầng báo cáo thống kê, rà soát bảo mật, kiểm thử toàn diện 7 flow, deploy production và bảo vệ trước hội đồng.

| Mã   |   Trục   | Nhiệm vụ                                                                           | Người phụ trách | Hạn |
| ----- | :-------: | ------------------------------------------------------------------------------------ | :-----------------: | :---: |
| T5.1  |    WS4    | API báo cáo tỷ lệ sử dụng kho và doanh thu cấp cơ sở (`FM-06`)           |        Tùng        | 09/11 |
| T5.2  |    WS3    | API giám sát doanh thu và tỷ lệ lấp đầy toàn hệ thống (`BM-04`)         |        Nhật        | 09/11 |
| T5.3  |    WS3    | API báo cáo tổng hợp và xuất dữ liệu Excel/CSV (`BM-05`)                   |        Nhật        | 09/11 |
| T5.4  |    WS4    | Ghi nhận và API xem nhật ký hoạt động / lịch sử đăng nhập (`SA-04`)    |        Tùng        | 09/11 |
| T5.5  |    WS4    | Frontend: Dashboard báo cáo trực quan cho Facility Manager                        |        Tùng        | 09/11 |
| T5.6  |    WS3    | Frontend: Dashboard tài chính & xuất báo cáo toàn hệ thống cho BOM           |        Bình        | 09/11 |
| T5.7  |    WS4    | Frontend: Màn hình Admin kiểm tra nhật ký hoạt động hệ thống               |        Tùng        | 09/11 |
| T5.8  | Toàn bộ | Viết và thực thi bộ test case tự động & thủ công cho cả 7 flow             |      Cả nhóm      | 09/11 |
| T5.9  | Toàn bộ | Rà soát lỗi tồn đọng, tối ưu UI/UX và responsive trên thiết bị di động |      Cả nhóm      | 16/11 |
| T5.10 |    WS3    | Chuẩn bị dữ liệu demo sống (kịch bản chạy demo mượt mà từ Flow 1 tới 7) |        Nhật        | 16/11 |
| T5.11 |    WS2    | Đóng gói Docker, triển khai hệ thống lên Cloud/VPS môi trường thử nghiệm |        Bình        | 16/11 |
| T5.12 |    WS4    | Hoàn thiện toàn bộ tập tài liệu đồ án (SRS, SDD, User Guide, Test Report)  |        Bình        | 16/11 |
| T5.13 | Toàn bộ | Thiết kế slide thuyết trình và luyện tập kịch bản bảo vệ đồ án         |      Cả nhóm      | 16/11 |

---

## 5. Bản đồ phủ 27 mã yêu cầu chức năng

Toàn bộ 27 mã yêu cầu ở [TOPIC.md § 3](TOPIC.md#3-yêu-cầu-chức-năng-theo-tác-nhân) được bảo đảm phủ kín theo đúng Workstream và Giai đoạn:

|   Giai đoạn   |    Trục chính    | Mã yêu cầu chức năng                                                                 |   Số mã   |
| :-------------: | :----------------: | :---------------------------------------------------------------------------------------- | :----------: |
|  **P1**  |      Tất cả      | Toàn bộ 27 mã (Phân tích, thiết kế, quy chuẩn và kiến trúc)                    |      —      |
|  **P2**  | WS2, WS3, WS4, WS1 | `SA-01` `SA-02` `SA-03` `BM-01` `BM-03` `FM-01` `SC-01`                     |      7      |
|  **P3**  |   WS1, WS2, WS3   | `SC-02` `SC-03` `SC-04` `FS-01` `FS-02` `FS-03` `FM-02`                     |      7      |
|  **P4**  | WS1, WS2, WS3, WS4 | `SC-05` `SC-06` `FS-04` `FS-05` `FS-06` `FM-03` `FM-04` `FM-05` `BM-02` |      9      |
|  **P5**  |      WS3, WS4      | `FM-06` `BM-04` `BM-05` `SA-04`                                                   |      4      |
| **TỔNG** |                    | **Đã phủ 27 / 27 mã chức năng (100%)**                                        | **27** |

---

## 6. Quy tắc kỹ thuật chống xung đột mã nguồn (Zero-Conflict Rules)

Để đảm bảo 4 thành viên code song song mà **không bao giờ bị Merge Conflict**, nhóm bắt buộc tuân thủ 6 quy tắc sau:

### Quy tắc 1: Phân lập Package Backend tuyệt đối (Backend Package Isolation)

- Mã nguồn Java trong `backend/src/main/java/com/swp391/selfstorage/` đã được chia sẵn theo Domain:
  - `reservation/`: Thuộc quyền sở hữu độc quyền của **WS1**.
  - `facility/`, `unit/`, `contract/`: Thuộc quyền sở hữu độc quyền của **WS2**.
  - `payment/`, `policy/`: Thuộc quyền sở hữu độc quyền của **WS3**.
  - `auth/`, `user/`, `support/`, `report/`: Thuộc quyền sở hữu độc quyền của **WS4**.
- **Quy ước:** Thành viên Trục A tuyệt đối **không chỉnh sửa file Entity/Repository/Service trong package của Trục B**.

### Quy tắc 2: Giao tiếp lỏng lẻo giữa các Domain (Loose Coupling via IDs)

- Khi **WS1** tạo đơn đặt chỗ: chỉ lưu `storage_unit_id` và `customer_id` dạng `Long`. Tuyệt đối không dùng JPA `@ManyToOne` kéo trực tiếp toàn bộ object của package khác nếu không thực sự cần thiết.
- Khi **WS3** xử lý thanh toán thành công: gọi qua **Public Service Method** (ví dụ: `reservationService.markAsPaid(reservationId)`) hoặc xuất sự kiện Spring Application Event. Không can thiệp sửa trực tiếp CSDL của module khác.

### Quy tắc 3: CSDL Bất biến (Database Immutability)

- File [database/Storage_Self.sql](../database/Storage_Self.sql) đã chứa đầy đủ định nghĩa tất cả các bảng.
- **Quy ước:** Toàn bộ bảng được khởi tạo qua Flyway migration `V1__init_schema.sql` ngay đầu P2.
- **Cấm:** Tuyệt đối không tự ý chạy `ALTER TABLE` đổi tên cột, xóa cột. Bất kỳ thay đổi nào về schema phải được họp nhóm 4 người thống nhất và tạo file migration mới (`V2__...sql`).

### Quy tắc 4: Chuẩn hóa tầng DTO và Error Code dùng chung (Shared Contract Freeze)

- Mọi API trả về bắt buộc dùng cấu trúc chuẩn hóa `ApiResponse<T>` và `PageResponse<T>` trong `common/dto/`.
- Mã lỗi nghiệp vụ thống nhất tại `common/exception/ErrorCode.java`.
- API endpoint và request/response body phải bám sát 100% tài liệu [docs/API-SPEC.md](API-SPEC.md).

### Quy tắc 5: Phân lập Tuyến đường Frontend (Frontend Route & Feature Isolation)

- File `frontend/src/routes/index.tsx` là Master Router dùng chung, được đóng băng sau khi khai báo 5 Sub-router cấp cao:
  ```tsx
  <Routes>
    <Route path="/customer/*" element={<CustomerRoutes />} />
    <Route path="/staff/*" element={<StaffRoutes />} />
    <Route path="/manager/*" element={<ManagerRoutes />} />
    <Route path="/admin/*" element={<AdminRoutes />} />
    <Route path="/bom/*" element={<BomRoutes />} />
    <Route path="/auth/*" element={<AuthRoutes />} />
  </Routes>
  ```
- Mỗi thành viên tự tạo thư mục tính năng của mình trong `frontend/src/features/<tên-feature>/` và quản lý file `*Routes.tsx` riêng bên trong. Không sửa chéo file trang của nhau.

### Quy tắc 6: Kỷ luật Git & Quy trình Pull Request (PR)

- Nhánh làm việc tuân thủ mẫu: `feature/ws<1-4>-<tên-nhiệm-vụ>` (ví dụ: `feature/ws1-unit-grid`, `feature/ws3-cron-overdue`).
- **Cấm:** Không ai được commit trực tiếp lên nhánh `main` hoặc `develop`.
- **Merge Gate:** Mọi PR phải có ít nhất 1 người review (ưu tiên Team Leader hoặc người phụ trách trục liên quan) và đảm bảo build chạy qua không có lỗi compile trước khi merge.

---

## 7. Quy ước làm việc & Định nghĩa hoàn thành (DoD)

- **Nhịp độ:** Họp Scrum ngắn 15 phút mỗi 2 ngày để cập nhật: *Đã làm gì hôm qua? Hôm nay làm gì? Có bị nghẽn gì với trục khác không?*
- **API-First & Mock Data:** Backend cam kết API Contract sớm; Frontend dùng mock data JSON chạy trước giao diện mà không cần chờ Backend code xong.
- **Definition of Done (DoD) cho mỗi Task:**
  1. Code biên dịch không lỗi, không có warning nghiêm trọng.
  2. Có unit test / integration test cho các hàm xử lý logic tiền bạc, trạng thái và bảo mật.
  3. API test thông qua Swagger / Postman với đầy đủ case thành công và case lỗi.
  4. Đã tạo PR, được review và merge vào nhánh chính.
  5. Cập nhật trạng thái trên Notion Task Tracker.

---

## 8. Quản lý rủi ro và đối sách

| Rủi ro                                                                      |       Mức độ       | Đối sách kỹ thuật                                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | :-------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nút thắt cổ chai Frontend** (1 người làm không kịp 5 portal) |  **Rất cao**  | Phân chia thành 4 Workstream End-to-End: mỗi thành viên tự làm cả giao diện Portal của trục mình; Leader hỗ trợ làm UI Portal Admin/Manager; dựng sẵn thư viện components dùng chung ở P2. |
| **Xung đột mã nguồn (Merge Conflict)**                             |     **Cao**     | Áp dụng triệt để 6 Zero-Conflict Rules: phân lập package Java, phân lập feature folder React, route con riêng biệt, CSDL cố định.                                                                 |
| **Logic quá hạn & tính phạt cọc phức tạp**                      | **Trung bình** | Đóng gói toàn bộ logic D+1..D+10 vào Scheduled Cronjob độc lập trong WS3; viết unit test kiểm tra riêng rẽ từng mốc ngày trước khi nối vào hệ thống.                                      |
| **Cổng thanh toán thực tế trục trặc**                            | **Trung bình** | Dùng PayOS hoặc tạo Mock Payment Service sandbox có API sinh mã QR VietQR giả lập; bảo đảm nghiệp vụ thông suốt trước khi cấu hình API key thật.                                             |
| **Dồn việc kiểm thử vào tuần cuối**                             | **Trung bình** | Mỗi Giai đoạn đều có các task test riêng cho luồng của giai đoạn đó; báo cáo cuối mỗi kỳ phải có demo chức năng chạy sống.                                                             |

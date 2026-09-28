# Self-Storage Facility Rental and Management System

**Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ**

Hệ thống quản lý toàn bộ vòng đời dịch vụ cho thuê kho tự phục vụ: khách hàng tìm kiếm và đặt chỗ
ô kho, nhận bàn giao tại cơ sở, sử dụng và gia hạn, cho tới khi trả kho — song song với các nghiệp vụ
vận hành phía sau như quản lý ô kho, phân công nhân viên, thu phí, xử lý quá hạn và báo cáo doanh thu.

> 📄 Đặc tả đề tài đầy đủ: **[docs/TOPIC.md](docs/TOPIC.md)**

---

## Tác nhân (Actors)

| Tác nhân                            | Vai trò                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Storage Customer**            | Xem dịch vụ, đặt chỗ, thanh toán, check-in, quản lý ô kho đang thuê, gửi yêu cầu hỗ trợ   |
| **Facility Staff**              | Kiểm tra đặt chỗ, bàn giao / thu hồi ô kho, cập nhật trạng thái, xử lý sự cố tại chỗ     |
| **Facility Manager**            | Quản lý ô kho, phân bổ ô kho, theo dõi hợp đồng, phân công nhân viên, xem báo cáo cơ sở |
| **Business Operations Manager** | Quản lý danh sách cơ sở, chính sách thuê, giá và phí, báo cáo toàn hệ thống               |
| **System Administrator**        | Quản lý tài khoản, phân quyền vai trò và dữ liệu, theo dõi nhật ký hoạt động              |

Chi tiết chức năng của từng tác nhân: [docs/TOPIC.md § 3](docs/TOPIC.md#3-yêu-cầu-chức-năng-theo-tác-nhân)

---

## Phạm vi nghiệp vụ

### Luồng chính

| # | Luồng                                                        | Mô tả ngắn                                                                                                                          |
| - | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **Storage Unit Reservation**                            | Chọn Facility, Unit Type và khoảng thuê; giữ capacity, trả trước phí thuê N tháng cùng Deposit rồi phân bổ Storage Unit |
| 2 | **Storage Check-in and Handover**                       | Check-in theo lịch hẹn, nghiệm thu và bàn giao ô kho kèm khóa / mã PIN (không dùng thẻ RFID)                               |
| 3 | **Rented Storage Unit Management**                      | Quản lý các ô kho đang thuê, tự động trả kho khi hết hạn nếu không gia hạn trước 1 tháng                             |
| 4 | **Business Rules, Fee Management & Revenue Monitoring** | Chính sách thuê, khung giá, phụ phí và giám sát doanh thu toàn hệ thống                                                    |
| 5 | **Facility Storage and Staff Management**               | Quản lý danh mục ô kho và phân công nhân viên tại cơ sở                                                                    |

### Luồng bổ sung

| # | Luồng                                         | Mô tả ngắn                                                                                                               |
| - | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 6 | **Storage Renewal and Overdue Handling** | Gia hạn (Renew) khi còn hạn; xử lý quá hạn: tính phí D+4..D+10, quá D+10 chấm dứt hợp đồng và dọn dẹp kho |
| 7 | **Support Request and Issue Handling**   | Tiếp nhận yêu cầu hỗ trợ và xử lý sự cố (khóa, mã truy cập, hư hỏng, thanh toán)                           |

Chi tiết từng luồng: [docs/TOPIC.md § 4–5](docs/TOPIC.md#4-các-luồng-nghiệp-vụ-chính-flow-15)

---

## Cấu trúc thư mục

```
.
├── README.md              # Tài liệu tổng quan (file này)
├── CONTRIBUTING.md        # Quy trình Git: nhánh, commit, Pull Request, review
└── docs/
    ├── DASHBOARD.md       # Bảng điều hành trung tâm: Sprint, Issue/Bug tinh gọn, tiến độ 4 Workstream
    ├── USER-STORIES-AND-USE-CASES.md # Tài liệu hợp nhất: Quy tắc, User Stories (5 actor) & Phân rã Use Cases
    ├── TOPIC.md           # Đặc tả đề tài: actors, chức năng, luồng nghiệp vụ, glossary
    ├── BUSINESS-RULES.md  # Reservation, Availability, Pricing, Payment và vòng đời thuê
    ├── API-SPEC.md        # Hợp đồng REST API chi tiết toàn hệ thống
    ├── DATA-DICTIONARY.md # Từ điển dữ liệu CSDL (đồng bộ Flyway migration)
    ├── UI-DESIGN-SYSTEM.md # Quy chuẩn hệ thống thiết kế giao diện
    ├── CONVENTIONS.md     # Coding convention và quy ước REST API
    ├── PLAN.md            # Khung kế hoạch tổng thể & tra cứu mã nhiệm vụ
    ├── diagrams/          # Sơ đồ Activity Diagram (.drawio)
    └── _archive/          # Tài liệu và sơ đồ cũ đã lưu trữ
```

Cấu trúc mã nguồn (`backend/`, `frontend/`) sẽ được bổ sung ở nhiệm vụ T1.16 và T1.17.

---

## Kế hoạch triển khai

Dự án chạy trong **10 tuần (08/09/2026 – 16/11/2026)**, chia thành **5 giai đoạn × 2 tuần**, mỗi giai
đoạn kết thúc bằng một buổi báo cáo với giảng viên.

| GĐ          | Tuần | Thời gian     | Trọng tâm                                                                                          | Báo cáo   |
| ------------ | ----- | -------------- | ---------------------------------------------------------------------------------------------------- | ----------- |
| **P1** | 1–2  | 08/09 – 21/09 | Phân tích yêu cầu, business rules, ERD, activity diagram, wireframe, khởi tạo dự án          | #1 — 21/09 |
| **P2** | 3–4  | 22/09 – 05/10 | Nền tảng: schema, Auth và phân quyền, quản lý Facility / Unit Type / Storage Unit, khung giá | #2 — 05/10 |
| **P3** | 5–6  | 06/10 – 19/10 | Flow 1 + Flow 2: giữ capacity, trả phí N tháng + Deposit, phân bổ unit, Check-in / Handover    | #3 — 19/10 |
| **P4** | 7–8  | 20/10 – 02/11 | Flow 3 + Flow 6 + Flow 7: quản lý ô kho đang thuê, Return, Renewal, Overdue, Support Request    | #4 — 02/11 |
| **P5** | 9–10 | 03/11 – 16/11 | Flow 4: báo cáo và doanh thu, kiểm thử, deploy, tài liệu và bảo vệ                         | #5 — 16/11 |

Nhóm 4 người, chia theo vai trò kỹ thuật:

| Thành viên                      | Vai trò                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| **Nguyễn Văn Gia Bình**  | Team Leader / BA — hỗ trợ cả Backend và Frontend                                    |
| **Lê Thanh Tùng**         | Backend A — Core Domain (Facility, Unit, Reservation, Contract, Handover, Return)       |
| **Huỳnh Nhật**            | Backend B — Money & Platform (Auth, Payment, Policy, Renewal, Overdue, Support, Report) |
| **Nguyễn Phạm Xuân Nhi** | Frontend                                                                                 |

Chi tiết nhiệm vụ từng giai đoạn: [docs/PLAN.md](docs/PLAN.md) · Bảng theo dõi tiến độ:
[SWP391 trên Notion](https://app.notion.com/p/3d5561bd42cd808e8161c482b37386c6)

---

## Công nghệ

| Thành phần      | Lựa chọn            |
| ----------------- | --------------------- |
| Backend           | Spring Boot (Java)    |
| Frontend          | React                 |
| Cơ sở dữ liệu | SQL Server            |
| Migration         | Flyway                |
| Xác thực        | JWT + Spring Security |

## Hướng dẫn Cài đặt & Deploy

Xem bộ tài liệu hướng dẫn triển khai đầy đủ tại **[docs/deploy/README.md](docs/deploy/README.md)**.

| Tài liệu                                                            | Nội dung                                                            |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [01-prerequisites.md](docs/deploy/01-prerequisites.md)                 | Yêu cầu phần mềm: JDK 17, Node 20+, SQL Server 2022              |
| [02-database-setup.md](docs/deploy/02-database-setup.md)               | Tạo database SelfStorageDB và chạy Flyway migrations              |
| [03-backend-local.md](docs/deploy/03-backend-local.md)                 | Build và chạy Backend Spring Boot cục bộ                         |
| [04-frontend-local.md](docs/deploy/04-frontend-local.md)               | Cấu hình .env và chạy Frontend React Vite                        |
| [05-environment-variables.md](docs/deploy/05-environment-variables.md) | Bảng tra cứu toàn bộ biến môi trường Backend & Frontend      |
| [06-health-check.md](docs/deploy/06-health-check.md)                   | Checklist kiểm tra sức khỏe hệ thống sau deploy                 |
| [07-production-deploy.md](docs/deploy/07-production-deploy.md)         | Hướng dẫn deploy production (JAR, Nginx, IIS) & Checklist an ninh |

---


## Tài liệu

 **Điều hành & Yêu cầu cốt lõi**

- [docs/DASHBOARD.md](docs/DASHBOARD.md) — **Bảng điều hành trung tâm:** Sprint hiện tại, tiến độ 4 Workstream, sổ theo dõi Issue & Bug tinh gọn.
- [docs/USER-STORIES-AND-USE-CASES.md](docs/USER-STORIES-AND-USE-CASES.md) — **Tài liệu hợp nhất:** Quy tắc viết, toàn bộ User Stories (5 actor) và Phân rã 7 luồng Use Cases.
- [docs/TOPIC.md](docs/TOPIC.md) — Đặc tả đề tài gốc: 5 actor, 27 mã yêu cầu chức năng, 7 luồng nghiệp vụ.
- [docs/BUSINESS-RULES.md](docs/BUSINESS-RULES.md) — Toàn bộ quy tắc nghiệp vụ (`BR-*`) và bảng thông số cấu hình.
- [docs/PLAN.md](docs/PLAN.md) — Khung kế hoạch tổng thể & ma trận nhiệm vụ (`T1.1` → `T5.x`).

 **Kiến trúc & Kỹ thuật**

- [docs/API-SPEC.md](docs/API-SPEC.md) — Hợp đồng REST API đầy đủ cho toàn bộ các endpoint Backend.
- [docs/DATA-DICTIONARY.md](docs/DATA-DICTIONARY.md) — Từ điển dữ liệu CSDL (đồng bộ với Flyway migration).
- [docs/UI-DESIGN-SYSTEM.md](docs/UI-DESIGN-SYSTEM.md) — Hệ thống Design tokens & Component chuẩn hóa.
- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — Coding convention Java / React / SQL và quy ước REST API.
- [CONTRIBUTING.md](CONTRIBUTING.md) — Quy trình Git: nhánh, commit, Pull Request, review, Definition of Done.

 **Sơ đồ hoạt động (Activity Diagrams)**

- [docs/diagrams/activity-diagram-flow-1-storage-reservation.drawio](docs/diagrams/activity-diagram-flow-1-storage-reservation.drawio) — Flow 1 (Reservation).
- [docs/diagrams/activity-diagram-flow-2-checkin-handover.drawio](docs/diagrams/activity-diagram-flow-2-checkin-handover.drawio) — Flow 2 (Check-in / Handover).
- [docs/diagrams/activity-diagram-flow-6-1-storage-renewal.drawio](docs/diagrams/activity-diagram-flow-6-1-storage-renewal.drawio) — Flow 6.1 (Storage Renewal).
- [docs/diagrams/activity-diagram-flow-6-2-overdue-handling.drawio](docs/diagrams/activity-diagram-flow-6-2-overdue-handling.drawio) — Flow 6.2 (Overdue Handling).
- [docs/diagrams/activity-diagram-flow-4-business-operations.drawio](docs/diagrams/activity-diagram-flow-4-business-operations.drawio) — Flow 4 (Business Rules, Fee Management, Revenue Monitoring).
- [docs/diagrams/activity-diagram-flow-5-facility-staff-management.drawio](docs/diagrams/activity-diagram-flow-5-facility-staff-management.drawio) — Flow 5 (Facility Storage and Staff Management).
- [docs/diagrams/activity-diagram-flow-7-support-incident-handling.drawio](docs/diagrams/activity-diagram-flow-7-support-incident-handling.drawio) — Flow 7 (Support Request and Issue Handling).
- [docs/_archive/](docs/_archive/) — Thư mục lưu trữ các tài liệu và sơ đồ cũ.

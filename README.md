# Self-Storage Facility Rental and Management System

**Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ**

Hệ thống quản lý toàn bộ vòng đời dịch vụ cho thuê kho tự phục vụ: khách hàng tìm kiếm và đặt chỗ
ô kho, nhận bàn giao tại cơ sở, sử dụng và gia hạn, cho tới khi trả kho — song song với các nghiệp vụ
vận hành phía sau như quản lý ô kho, phân công nhân viên, thu phí, xử lý quá hạn và báo cáo doanh thu.

> 📄 Đặc tả đề tài đầy đủ: **[docs/TOPIC.md](docs/TOPIC.md)**

---

## Tác nhân (Actors)

| Tác nhân | Vai trò |
|----------|---------|
| **Storage Customer** | Xem dịch vụ, đặt chỗ, thanh toán, check-in, quản lý ô kho đang thuê, gửi yêu cầu hỗ trợ |
| **Facility Staff** | Kiểm tra đặt chỗ, bàn giao / thu hồi ô kho, cập nhật trạng thái, xử lý sự cố tại chỗ |
| **Facility Manager** | Quản lý ô kho, phân bổ ô kho, theo dõi hợp đồng, phân công nhân viên, xem báo cáo cơ sở |
| **Business Operations Manager** | Quản lý danh sách cơ sở, chính sách thuê, giá và phí, báo cáo toàn hệ thống |
| **System Administrator** | Quản lý tài khoản, phân quyền vai trò và dữ liệu, theo dõi nhật ký hoạt động |

Chi tiết chức năng của từng tác nhân: [docs/TOPIC.md § 3](docs/TOPIC.md#3-yêu-cầu-chức-năng-theo-tác-nhân)

---

## Phạm vi nghiệp vụ

### Luồng chính

| # | Luồng | Mô tả ngắn |
|---|-------|-----------|
| 1 | **Storage Unit Reservation** | Chọn Facility, Unit Type và khoảng thuê; giữ capacity, trả trước phí thuê N tháng cùng Deposit rồi phân bổ Storage Unit |
| 2 | **Storage Check-in and Handover** | Check-in theo lịch hẹn và bàn giao ô kho kèm khóa / thẻ / mã truy cập |
| 3 | **Rented Storage Unit Management** | Quản lý các ô kho đang thuê, theo dõi hợp đồng và quy trình trả kho |
| 4 | **Business Rules, Fee Management & Revenue Monitoring** | Chính sách thuê, khung giá, phụ phí và giám sát doanh thu toàn hệ thống |
| 5 | **Facility Storage and Staff Management** | Quản lý danh mục ô kho và phân công nhân viên tại cơ sở |

### Luồng bổ sung

| # | Luồng | Mô tả ngắn |
|---|-------|-----------|
| 6 | **Storage Renewal and Overdue Handling** | Renewal tự động sau Payment; scheduled job Overdue tại D+1, D+4, D+10, D+30 và D+60 (`UC-F6-11`); FM xử lý tài sản |
| 7 | **Support Request and Issue Handling** | Tiếp nhận yêu cầu hỗ trợ và xử lý sự cố (khóa, mã truy cập, hư hỏng, thanh toán) |

Chi tiết từng luồng: [docs/TOPIC.md § 4–5](docs/TOPIC.md#4-các-luồng-nghiệp-vụ-chính-flow-15)

---

## Cấu trúc thư mục

```
.
├── README.md              # Tài liệu tổng quan (file này)
├── CONTRIBUTING.md        # Quy trình Git: nhánh, commit, Pull Request, review
└── docs/
    ├── TOPIC.md           # Đặc tả đề tài: actors, chức năng, luồng nghiệp vụ, glossary
    ├── PLAN.md            # Kế hoạch triển khai: giai đoạn, nhiệm vụ, phân công, rủi ro
    ├── USE-CASES.md       # Phân rã Flow 1–7 thành 73 use case
    ├── USER-STORIES-SC.md # User story và acceptance criteria cho Storage Customer
    ├── BUSINESS-RULES.md  # Reservation, Availability, Pricing, Payment và vòng đời thuê
    ├── CONVENTIONS.md     # Coding convention và quy ước REST API
    ├── REVIEW-CHECKLIST.md # Quy trình tự review tài liệu, kèm điều kiện dừng
    ├── OPEN-ISSUES.md     # Sổ vấn đề mở đang chờ quyết
    ├── check-docs.sh      # Script kiểm tính nhất quán giữa các tài liệu
    └── diagrams/
        ├── use-case-diagram.puml              # Use Case Diagram tổng (PlantUML)
        ├── activity-flow-1-booking.puml       # Activity Diagram Flow 1 — Reservation (T1.7)
        ├── activity-flow2-checkin-handover.puml # Activity Diagram Flow 2 — Check-in / Handover (T1.7)
        ├── activity-main-flow-end-to-end.puml # Activity Diagram Main Flow end-to-end (T1.7b)
        ├── activity-flow-3.puml               # Activity Diagram Flow 3 — Return (T1.8)
        ├── activity-flow-4.puml               # Activity Diagram Flow 4 — Business Rules / Fee / Revenue (T1.9)
        ├── activity-flow-5.puml               # Activity Diagram Flow 5 — Facility Storage / Staff (T1.9)
        ├── activity-flow-6.puml               # Activity Diagram Flow 6 — Renewal / Overdue (T1.8)
        └── activity-flow-7.puml               # Activity Diagram Flow 7 — Support Request (T1.9)
```

Cấu trúc mã nguồn (`backend/`, `frontend/`) sẽ được bổ sung ở nhiệm vụ T1.16 và T1.17.

---

## Kế hoạch triển khai

Dự án chạy trong **10 tuần (08/09/2026 – 16/11/2026)**, chia thành **5 giai đoạn × 2 tuần**, mỗi giai
đoạn kết thúc bằng một buổi báo cáo với giảng viên.

| GĐ | Tuần | Thời gian | Trọng tâm | Báo cáo |
|----|------|-----------|-----------|---------|
| **P1** | 1–2 | 08/09 – 21/09 | Phân tích yêu cầu, business rules, ERD, activity diagram, wireframe, khởi tạo dự án | #1 — 21/09 |
| **P2** | 3–4 | 22/09 – 05/10 | Nền tảng: schema, Auth và phân quyền, quản lý Facility / Unit Type / Storage Unit, khung giá | #2 — 05/10 |
| **P3** | 5–6 | 06/10 – 19/10 | Flow 1 + Flow 2: giữ capacity, trả phí N tháng + Deposit, phân bổ unit, Check-in / Handover | #3 — 19/10 |
| **P4** | 7–8 | 20/10 – 02/11 | Flow 3 + Flow 6 + Flow 7: quản lý ô kho đang thuê, Return, Renewal, Overdue, Support Request | #4 — 02/11 |
| **P5** | 9–10 | 03/11 – 16/11 | Flow 4: báo cáo và doanh thu, kiểm thử, deploy, tài liệu và bảo vệ | #5 — 16/11 |

Nhóm 4 người, chia theo vai trò kỹ thuật:

| Thành viên | Vai trò |
|------------|---------|
| **Nguyễn Văn Gia Bình** | Team Leader / BA — hỗ trợ cả Backend và Frontend |
| **Lê Thanh Tùng** | Backend A — Core Domain (Facility, Unit, Reservation, Contract, Handover, Return) |
| **Huỳnh Nhật** | Backend B — Money & Platform (Auth, Payment, Policy, Renewal, Overdue, Support, Report) |
| **Nguyễn Phạm Xuân Nhi** | Frontend |

Chi tiết nhiệm vụ từng giai đoạn: [docs/PLAN.md](docs/PLAN.md) · Bảng theo dõi tiến độ:
[SWP391 trên Notion](https://app.notion.com/p/3d5561bd42cd808e8161c482b37386c6)

---

## Trạng thái dự án

| Hạng mục | Trạng thái |
|----------|-----------|
| Đặc tả đề tài | ✅ Hoàn thành — [docs/TOPIC.md](docs/TOPIC.md) |
| Kế hoạch triển khai | ✅ Hoàn thành — [docs/PLAN.md](docs/PLAN.md) |
| Công nghệ sử dụng | ✅ Đã chốt — Spring Boot · React · SQL Server |
| Phân rã use case | ✅ Hoàn thành — [docs/USE-CASES.md](docs/USE-CASES.md) |
| Use Case Diagram tổng | ✅ Hoàn thành — [docs/diagrams/](docs/diagrams/use-case-diagram.puml) |
| Business rules | ✅ Hoàn thành — [docs/BUSINESS-RULES.md](docs/BUSINESS-RULES.md) |
| Coding convention & Git workflow | ✅ Hoàn thành — [docs/CONVENTIONS.md](docs/CONVENTIONS.md) · [CONTRIBUTING.md](CONTRIBUTING.md) |
| User story — Storage Customer | ✅ Hoàn thành — [docs/USER-STORIES-SC.md](docs/USER-STORIES-SC.md) |
| User story — Facility Staff và Facility Manager | ✅ Hoàn thành — [docs/USER-STORIES-FS-FM.md](docs/USER-STORIES-FS-FM.md) |
| User story — Business Operations Manager và System Administrator | ✅ Hoàn thành — [docs/USER-STORIES-BM-SA.md](docs/USER-STORIES-BM-SA.md) |
| Activity Diagram 7 flow | ✅ Hoàn thành — [docs/diagrams/](docs/diagrams/activity-flow-4.puml) (T1.7, T1.7b, T1.8, T1.9) |
| Thiết kế cơ sở dữ liệu (ERD) | 🔄 Đang thực hiện — nhiệm vụ T1.10, T1.11 |
| Thiết kế giao diện (wireframe / UI) | 🔄 Đang thực hiện — nhiệm vụ T1.13, T1.14, T1.15 |
| Khung dự án Backend + Frontend | ⬜ Chưa bắt đầu — nhiệm vụ T1.16, T1.17 |
| Triển khai mã nguồn | ⬜ Bắt đầu từ Giai đoạn 2 (22/09) |

---

## Công nghệ

| Thành phần | Lựa chọn |
|------------|----------|
| Backend | Spring Boot (Java) |
| Frontend | React |
| Cơ sở dữ liệu | SQL Server |
| Migration | Flyway |
| Xác thực | JWT + Spring Security |

Hướng dẫn cài đặt và chạy dự án sẽ được bổ sung vào README này khi khung dự án hoàn tất (nhiệm vụ
T1.16 và T1.17 của Giai đoạn 1).

---

## Việc tiếp theo

Đang ở **Giai đoạn 1 (08/09 – 21/09)**. Đã xong: phân rã use case (T1.1), Use Case Diagram tổng
(T1.6), business rules (T1.5), coding convention và Git workflow (T1.18), user story cho Storage
Customer (T1.2).

Còn lại trước Báo cáo #1:

1. Viết user story và acceptance criteria cho các actor còn lại — `FS-*`, `FM-*` (T1.3) và `BM-*`,
   `SA-*` (T1.4), theo đúng khuôn mẫu ở [docs/USER-STORIES-SC.md § 1](docs/USER-STORIES-SC.md#1-quy-ước-viết-user-story).
2. Vẽ Activity Diagram cho cả 7 flow (T1.7, T1.8, T1.9).
3. Thiết kế ERD và data dictionary: Facility, Storage Unit, Unit Type, Reservation, Contract, Payment,
   Support Request, User & Role (T1.10, T1.11) — bám theo vòng đời trạng thái đã chốt ở
   [docs/BUSINESS-RULES.md § 13](docs/BUSINESS-RULES.md#13-vòng-đời-trạng-thái).
4. Thiết kế sơ đồ phân quyền theo vai trò và theo cơ sở (T1.12).
5. Wireframe / mockup cho 5 portal giao diện (T1.13, T1.14, T1.15).
6. Khởi tạo khung Spring Boot + SQL Server + Flyway (T1.16) và React (T1.17) theo cấu trúc thư mục ở
   [docs/CONVENTIONS.md § 2](docs/CONVENTIONS.md#2-cấu-trúc-repository).
7. Chuẩn bị slide và demo Báo cáo #1 (T1.19).

Danh sách nhiệm vụ đầy đủ kèm người phụ trách và hạn: [docs/PLAN.md § 4](docs/PLAN.md#4-chi-tiết-từng-giai-đoạn)

---

## Tài liệu

**Đặc tả và kế hoạch**

- [docs/TOPIC.md](docs/TOPIC.md) — Đặc tả đề tài đầy đủ, kèm nguyên văn đề bài ở phần phụ lục.
- [docs/PLAN.md](docs/PLAN.md) — Kế hoạch triển khai 10 tuần: giai đoạn, nhiệm vụ, phân công, rủi ro.

**Phân tích yêu cầu**

- [docs/USE-CASES.md](docs/USE-CASES.md) — Phân rã Flow 1–7 thành 73 use case, kèm bản đồ phủ 27 mã yêu cầu.
- [docs/USER-STORIES-SC.md](docs/USER-STORIES-SC.md) — 22 user story và 111 acceptance criteria cho Storage Customer.
- [docs/BUSINESS-RULES.md](docs/BUSINESS-RULES.md) — Baseline Reservation, Availability, Pricing, Payment, Deposit, Cancellation, Renewal, Overdue và Return.
- [docs/diagrams/use-case-diagram.puml](docs/diagrams/use-case-diagram.puml) — Use Case Diagram tổng (PlantUML).
- [docs/diagrams/activity-flow-1-booking.puml](docs/diagrams/activity-flow-1-booking.puml) — Activity Diagram Flow 1 (Reservation).
- [docs/diagrams/activity-flow2-checkin-handover.puml](docs/diagrams/activity-flow2-checkin-handover.puml) — Activity Diagram Flow 2 (Check-in / Handover).
- [docs/diagrams/activity-main-flow-end-to-end.puml](docs/diagrams/activity-main-flow-end-to-end.puml) — Activity Diagram Main Flow end-to-end (demo).
- [docs/diagrams/activity-flow-3.puml](docs/diagrams/activity-flow-3.puml) — Activity Diagram Flow 3 (Return).
- [docs/diagrams/activity-flow-4.puml](docs/diagrams/activity-flow-4.puml) — Activity Diagram Flow 4 (Business Rules, Fee Management, Revenue Monitoring).
- [docs/diagrams/activity-flow-5.puml](docs/diagrams/activity-flow-5.puml) — Activity Diagram Flow 5 (Facility Storage and Staff Management).
- [docs/diagrams/activity-flow-6.puml](docs/diagrams/activity-flow-6.puml) — Activity Diagram Flow 6 (Renewal / Overdue).
- [docs/diagrams/activity-flow-7.puml](docs/diagrams/activity-flow-7.puml) — Activity Diagram Flow 7 (Support Request and Issue Handling).

**Quy ước kỹ thuật**

- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — Coding convention Java / React / SQL và quy ước REST API.
- [CONTRIBUTING.md](CONTRIBUTING.md) — Quy trình Git: nhánh, commit, Pull Request, review, Definition of Done.

**Chất lượng tài liệu**

- [docs/REVIEW-CHECKLIST.md](docs/REVIEW-CHECKLIST.md) — Quy trình tự review 3 lớp kèm điều kiện dừng cho từng nhiệm vụ.
- [docs/OPEN-ISSUES.md](docs/OPEN-ISSUES.md) — Sổ vấn đề mở đang chờ nhóm quyết.
- [docs/check-docs.sh](docs/check-docs.sh) — Kiểm tính nhất quán tự động: `bash docs/check-docs.sh`

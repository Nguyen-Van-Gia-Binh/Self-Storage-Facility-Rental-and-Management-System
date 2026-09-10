# Kế hoạch triển khai dự án

> **Self-Storage Facility Rental and Management System** — 10 tuần, 5 giai đoạn, 4 thành viên.
>
> Kế hoạch này bám theo [TOPIC.md](TOPIC.md): 5 actor, 27 mã yêu cầu chức năng (§ 3) và 7 luồng
> nghiệp vụ (§ 4–5). Bảng theo dõi nhiệm vụ chi tiết đặt trên Notion:
> [SWP391 — Task Tracker](https://app.notion.com/p/3d5561bd42cd808e8161c482b37386c6).

---

## Mục lục

1. [Thông tin chung](#1-thông-tin-chung)
2. [Phân công vai trò](#2-phân-công-vai-trò)
3. [Lộ trình tổng thể](#3-lộ-trình-tổng-thể)
4. [Chi tiết từng giai đoạn](#4-chi-tiết-từng-giai-đoạn)
5. [Bản đồ phủ yêu cầu](#5-bản-đồ-phủ-yêu-cầu)
6. [Quy ước làm việc](#6-quy-ước-làm-việc)
7. [Rủi ro và đối sách](#7-rủi-ro-và-đối-sách)

---

## 1. Thông tin chung

| Hạng mục | Nội dung |
|----------|----------|
| **Thời lượng** | 10 tuần · 5 giai đoạn × 2 tuần |
| **Bắt đầu / Kết thúc** | 08/09/2026 → 16/11/2026 |
| **Nhịp báo cáo** | 2 tuần/lần — 21/09 · 05/10 · 19/10 · 02/11 · 16/11 |
| **Nhân sự** | 4 thành viên, chia theo vai trò kỹ thuật |
| **Công nghệ** | Spring Boot (Java) · React · SQL Server · Flyway migration · JWT |

---

## 2. Phân công vai trò

| Thành viên | Vai trò | Phạm vi phụ trách |
|------------|---------|-------------------|
| **Nguyễn Văn Gia Bình** | Team Leader / BA — hỗ trợ cả Backend và Frontend | Use case, user story, business rules, tài liệu, quản lý tiến độ, chuẩn bị báo cáo. Gánh linh hoạt Frontend hoặc Backend ở nơi đang nghẽn. |
| **Lê Thanh Tùng** | Backend A — Core Domain | Facility, Storage Unit, Unit Type, Reservation, Contract, Check-in / Handover, Return, báo cáo cơ sở. Kiêm cấu hình repo và deploy. |
| **Huỳnh Nhật** | Backend B — Money & Platform | Auth / phân quyền, Payment, chính sách và khung phí, Renewal, Overdue, Support Request, báo cáo toàn hệ thống, activity log. |
| **Nguyễn Phạm Xuân Nhi** | Frontend | Wireframe và mockup Figma, React app, 5 portal giao diện, tích hợp API. |

---

## 3. Lộ trình tổng thể

| GĐ | Tuần | Thời gian | Trọng tâm | Báo cáo |
|----|------|-----------|-----------|---------|
| **P1** | 1–2 | 08/09 – 21/09 | Phân tích yêu cầu, business rules, ERD, activity diagram, wireframe, khởi tạo dự án | **#1** — 21/09 |
| **P2** | 3–4 | 22/09 – 05/10 | Nền tảng: schema, Auth và phân quyền, quản lý Facility / Unit Type / Storage Unit, khung giá | **#2** — 05/10 |
| **P3** | 5–6 | 06/10 – 19/10 | Flow 1 + Flow 2: giữ capacity, trả phí N tháng + Deposit, phân bổ Storage Unit, Check-in / Handover | **#3** — 19/10 |
| **P4** | 7–8 | 20/10 – 02/11 | Flow 3 + Flow 6 + Flow 7: quản lý ô kho đang thuê, Return, Renewal, Overdue, Support Request | **#4** — 02/11 |
| **P5** | 9–10 | 03/11 – 16/11 | Flow 4: báo cáo và doanh thu, activity log, kiểm thử, deploy, tài liệu và bảo vệ | **#5** — 16/11 |

---

## 4. Chi tiết từng giai đoạn

### Giai đoạn 1 — Phân tích và Thiết kế

**Tuần 1–2 · 08/09 – 21/09 · Báo cáo #1**

**Mục tiêu:** biến đặc tả đề tài thành tài liệu phân tích đủ chi tiết để code được, đồng thời dựng
xong khung dự án trống chạy được.

| Mã | Nhiệm vụ | Người phụ trách | Hạn |
|----|----------|-----------------|-----|
| T1.1 | Phân rã Flow 1–7 thành danh sách use case | Bình | 14/09 |
| T1.2 | Viết user story cho Storage Customer (`SC-01`→`SC-06`) | Bình | 21/09 |
| T1.3 | Viết user story cho Facility Staff và Facility Manager (`FS-*`, `FM-*`) | Tùng | 21/09 |
| T1.4 | Viết user story cho Business Operations Manager và System Administrator (`BM-*`, `SA-*`) — [USER-STORIES-BM-SA.md](USER-STORIES-BM-SA.md) | Nhật | 21/09 |
| T1.5 | Chốt business rules: Reservation, Availability, Pricing, Payment, Deposit, Cancellation, Renewal, Overdue, Return | Bình | 21/09 |
| T1.6 | Vẽ Use Case Diagram tổng cho 5 actor | Bình | 14/09 |
| T1.7 | Vẽ Activity Diagram Flow 1 và Flow 2 | Tùng | 14/09 |
| T1.8 | Vẽ Activity Diagram Flow 3 và Flow 6 — [activity-flow-3.puml](diagrams/activity-flow-3.puml), [activity-flow-6.puml](diagrams/activity-flow-6.puml) | Nhật | 14/09 |
| T1.9 | Vẽ Activity Diagram Flow 4, Flow 5 và Flow 7 | Bình | 21/09 |
| T1.10 | Thiết kế ERD cho toàn hệ thống | Tùng | 14/09 |
| T1.11 | Viết data dictionary cho ERD | Nhật | 21/09 |
| T1.12 | Thiết kế sơ đồ phân quyền theo vai trò và theo cơ sở (`SA-02`, `SA-03`) | Nhật | 21/09 |
| T1.13 | Wireframe portal Storage Customer | Nhi | 14/09 |
| T1.14 | Wireframe portal Facility Staff và Facility Manager | Nhi | 21/09 |
| T1.15 | Wireframe portal Business Operations Manager và Admin | Nhi | 21/09 |
| T1.16 | Khởi tạo Spring Boot skeleton, SQL Server và Flyway | Tùng | 14/09 |
| T1.17 | Khởi tạo React app và design system cơ bản | Nhi | 14/09 |
| T1.18 | Thống nhất coding convention, Git workflow và quy ước API | Bình | 14/09 |
| T1.19 | Chuẩn bị slide và demo Báo cáo #1 | Bình | 21/09 |

**Baseline đầu vào cho T1.3 (`FS-*`, `FM-*`):**

- Flow 3 phải phủ `UC-F3-06`→`UC-F3-12`; Flow 6 phải phủ `UC-F6-04`→`UC-F6-12`.
- Renewal tự ghi nhận sau Payment (`BR-REN-04`), không tạo bước Facility Manager duyệt thủ công;
  Facility Manager theo dõi và xử lý ngoại lệ.
- D+1, D+10, D+30 do scheduled job; D+60 job `UC-F6-11` chấm dứt Contract, Facility Manager xử lý
  tài sản (`UC-F6-09`) và đề xuất miễn/giảm phí theo vụ (`BR-OVD-10`, `UC-F6-12`).
- Return phải có nhánh báo muộn, Contract *Overdue* và hủy yêu cầu (`BR-RET-10`→`BR-RET-12`).

**Đầu ra báo cáo #1:** SRS v1 (use case + user story + business rules), ERD và data dictionary, bộ
Activity Diagram 7 flow, wireframe 5 portal, repo có skeleton Backend + Frontend chạy được, README
đã chốt stack.

### Giai đoạn 2 — Nền tảng hệ thống và Quản trị

**Tuần 3–4 · 22/09 – 05/10 · Báo cáo #2**

**Phạm vi yêu cầu:** `SA-01`, `SA-02`, `SA-03`, `BM-01`, `BM-03`, `FM-01`, `SC-01`

**Mục tiêu:** có nền tảng dữ liệu, đăng nhập, phân quyền và danh mục Facility / Unit Type /
Storage Unit — điều kiện cần cho mọi flow nghiệp vụ phía sau.

| Mã | Nhiệm vụ | Người phụ trách | Hạn |
|----|----------|-----------------|-----|
| T2.1 | Tạo schema CSDL và Flyway migration V1 | Tùng | 28/09 |
| T2.2 | Tạo seed data mẫu | Nhật | 05/10 |
| T2.3 | Auth: đăng ký, đăng nhập JWT và Spring Security | Nhật | 28/09 |
| T2.4 | API quản lý tài khoản người dùng (`SA-01`) | Nhật | 05/10 |
| T2.5 | API gán vai trò cho người dùng (`SA-02`) | Nhật | 05/10 |
| T2.6 | Phân quyền truy cập dữ liệu theo vai trò và cơ sở (`SA-03`) | Nhật | 05/10 |
| T2.7 | API quản lý Facility (`BM-01`) | Tùng | 28/09 |
| T2.8 | API quản lý Unit Type và Storage Unit (`FM-01`) | Tùng | 05/10 |
| T2.9 | API khung giá thuê, phụ phí và phí quá hạn (`BM-03`) | Nhật | 05/10 |
| T2.10 | API tra cứu Facility, Unit Type, giá và Availability theo khoảng thuê (`SC-01`) | Tùng | 05/10 |
| T2.11 | Frontend: layout chung, sidebar theo vai trò, route guard | Nhi | 28/09 |
| T2.12 | Frontend: màn hình đăng nhập và đăng ký | Nhi | 28/09 |
| T2.13 | Frontend: màn hình quản lý cơ sở và bảng giá | Nhi | 05/10 |
| T2.14 | Frontend: màn hình quản lý ô kho của Facility Manager | Nhi | 05/10 |
| T2.15 | Frontend: màn hình Admin quản lý tài khoản và phân quyền | Bình | 05/10 |
| T2.16 | Frontend: trang công khai Facility, Unit Type và Availability | Bình | 05/10 |
| T2.17 | Unit test tầng service cho module quản trị | Tùng | 05/10 |
| T2.18 | Rà soát API contract và chuẩn bị Báo cáo #2 | Bình | 05/10 |

**Đầu ra báo cáo #2:** demo đăng nhập theo 5 vai trò, quản lý cơ sở / loại ô kho / ô kho, bảng giá;
CSDL đã có schema và dữ liệu mẫu.

### Giai đoạn 3 — Flow 1 và Flow 2: Reservation và Check-in

**Tuần 5–6 · 06/10 – 19/10 · Báo cáo #3**

**Phạm vi yêu cầu:** `SC-02`, `SC-03`, `SC-04`, `FS-01`, `FS-02`, `FS-03`, `FM-02`

**Mục tiêu:** chạy được trọn vẹn chuỗi đặt chỗ → giữ capacity → trả trước phí thuê N tháng cùng
Deposit → phân bổ Storage Unit cụ thể → đến cơ sở → nhận bàn giao. Đây là trục xương sống của hệ thống.

| Mã | Nhiệm vụ | Người phụ trách | Hạn |
|----|----------|-----------------|-----|
| T3.1 | API tạo Reservation (`SC-02`) | Tùng | 12/10 |
| T3.2 | Thuật toán giữ capacity nguyên tử và phân bổ Storage Unit sau thanh toán (`FM-02`) | Tùng | 12/10 |
| T3.3 | API thanh toán toàn bộ phí thuê N tháng cùng Deposit (`SC-03`) | Nhật | 12/10 |
| T3.4 | Sinh Contract *Pending Check-in* và lịch hẹn Check-in sau thanh toán | Tùng | 19/10 |
| T3.5 | API kiểm tra đặt chỗ khi khách đến (`FS-01`) | Nhật | 19/10 |
| T3.6 | API bàn giao ô kho và cấp Access Code / Access Card (`FS-02`) | Nhật | 19/10 |
| T3.7 | API cập nhật trạng thái ô kho theo vòng đời (`FS-03`) | Tùng | 19/10 |
| T3.8 | API check-in xác nhận khách đã nhận kho (`SC-04`) | Tùng | 19/10 |
| T3.9 | Frontend: luồng đặt chỗ nhiều bước | Nhi | 12/10 |
| T3.10 | Frontend: màn hình thanh toán và hóa đơn | Nhi | 19/10 |
| T3.11 | Frontend: màn hình Staff kiểm tra đặt chỗ và bàn giao | Bình | 19/10 |
| T3.12 | Frontend: màn hình Facility Manager phân bổ ô kho | Nhi | 19/10 |
| T3.13 | Test tích hợp Flow 1 → Flow 2 | Nhật | 19/10 |
| T3.14 | Viết test case thủ công và chuẩn bị Báo cáo #3 | Bình | 19/10 |

**Đầu ra báo cáo #3:** demo end-to-end một khách giữ capacity, trả phí N tháng cùng Deposit, được
phân bổ Storage Unit, đến nhận kho và được cấp mã truy cập; Reservation thành *Fulfilled*, Contract
thành *Active* và Storage Unit thành *Occupied*.

### Giai đoạn 4 — Flow 3, 6 và 7: Vòng đời thuê, Gia hạn, Hỗ trợ

**Tuần 7–8 · 20/10 – 02/11 · Báo cáo #4**

**Phạm vi yêu cầu:** `SC-05`, `SC-06`, `FS-04`, `FS-05`, `FS-06`, `FM-03`, `FM-04`, `FM-05`, `BM-02`

**Mục tiêu:** khép kín vòng đời hợp đồng thuê — theo dõi, gia hạn, quá hạn, trả kho — và nhánh xử lý
sự cố.

| Mã | Nhiệm vụ | Người phụ trách | Hạn |
|----|----------|-----------------|-----|
| T4.1 | API danh sách ô kho đang thuê của khách (`SC-05`) | Tùng | 26/10 |
| T4.2 | API theo dõi khách và hợp đồng thuê (`FM-03`) | Tùng | 26/10 |
| T4.3 | Quy trình Return từ *Active* / *Overdue*: inspection, quyết toán và hoàn Deposit (`FS-04`, `FM-04`) | Tùng | 02/11 |
| T4.4 | API cấu hình chính sách thuê (`BM-02`) | Nhật | 26/10 |
| T4.5 | API Renewal tự động sau Payment, kiểm tra capacity commitment và tính phí | Nhật | 02/11 |
| T4.6 | Scheduled job nhắc hạn và xử lý Overdue tại D+1 / D+4 / D+10 / D+30 / D+60 (`UC-F6-11`) | Nhật | 02/11 |
| T4.7 | API gửi và theo dõi Support Request (`SC-06`) | Nhật | 02/11 |
| T4.8 | API phân công nhân viên và xử lý sự cố (`FM-05`, `FS-05`) | Tùng | 02/11 |
| T4.9 | API công việc hằng ngày của Facility Staff (`FS-06`) | Tùng | 02/11 |
| T4.10 | Frontend: dashboard ô kho đang thuê của khách | Nhi | 26/10 |
| T4.11 | Frontend: màn hình gia hạn và cảnh báo quá hạn | Nhi | 02/11 |
| T4.12 | Frontend: gửi và theo dõi yêu cầu hỗ trợ | Bình | 02/11 |
| T4.13 | Frontend: màn hình Staff — công việc ngày, trả kho, sự cố | Nhi | 02/11 |
| T4.14 | Frontend: màn hình Facility Manager — hợp đồng và phân công | Bình | 02/11 |
| T4.15 | Test tích hợp vòng đời thuê đầy đủ | Nhật | 02/11 |
| T4.16 | Đối chiếu business rules và chuẩn bị Báo cáo #4 | Bình | 02/11 |

**Đầu ra báo cáo #4:** demo trọn vòng đời — đặt chỗ → nhận kho → gia hạn → quá hạn bị áp phí → trả
kho và hoàn cọc; demo một yêu cầu hỗ trợ từ lúc gửi tới lúc đóng.

### Giai đoạn 5 — Flow 4: Báo cáo, Doanh thu và Hoàn thiện

**Tuần 9–10 · 03/11 – 16/11 · Báo cáo #5 (bảo vệ)**

**Phạm vi yêu cầu:** `FM-06`, `BM-04`, `BM-05`, `SA-04`

**Mục tiêu:** hoàn thành tầng giám sát và báo cáo, sau đó ổn định hệ thống, chuẩn bị tài liệu và
bảo vệ.

| Mã | Nhiệm vụ | Người phụ trách | Hạn |
|----|----------|-----------------|-----|
| T5.1 | API báo cáo cấp cơ sở (`FM-06`) | Tùng | 09/11 |
| T5.2 | API giám sát doanh thu và tỷ lệ lấp đầy (`BM-04`) | Nhật | 09/11 |
| T5.3 | API báo cáo toàn hệ thống và xuất file (`BM-05`) | Nhật | 09/11 |
| T5.4 | Nhật ký đăng nhập và activity log (`SA-04`) | Nhật | 09/11 |
| T5.5 | Frontend: dashboard báo cáo Facility Manager | Nhi | 09/11 |
| T5.6 | Frontend: dashboard toàn hệ thống và xuất báo cáo | Bình | 09/11 |
| T5.7 | Frontend: màn hình Admin xem nhật ký hoạt động | Bình | 09/11 |
| T5.8 | Viết và thực thi test case cho 7 flow | Cả nhóm | 09/11 |
| T5.9 | Sửa bug tồn đọng và rà soát UI/UX | Cả nhóm | 16/11 |
| T5.10 | Chuẩn bị dữ liệu và kịch bản demo | Nhật | 16/11 |
| T5.11 | Deploy hệ thống lên môi trường thử nghiệm | Tùng | 16/11 |
| T5.12 | Hoàn thiện tài liệu cuối kỳ | Bình | 16/11 |
| T5.13 | Slide và tập bảo vệ Báo cáo #5 | Cả nhóm | 16/11 |

**Đầu ra báo cáo #5:** hệ thống hoàn chỉnh phủ 7 flow, bộ tài liệu cuối kỳ, bản deploy chạy được và
kịch bản demo.

---

## 5. Bản đồ phủ yêu cầu

Toàn bộ 27 mã yêu cầu ở [TOPIC.md § 3](TOPIC.md#3-yêu-cầu-chức-năng-theo-tác-nhân) đều được phân về
một giai đoạn cụ thể, không mã nào bị bỏ sót.

| Giai đoạn | Flow liên quan | Mã yêu cầu | Số mã |
|-----------|----------------|------------|:-----:|
| **P1** | Flow 1–7 (phân tích, chưa code) | toàn bộ, ở mức tài liệu | — |
| **P2** | Flow 5 (một phần) + nền tảng | `SA-01` `SA-02` `SA-03` `BM-01` `BM-03` `FM-01` `SC-01` | 7 |
| **P3** | Flow 1, Flow 2 | `SC-02` `SC-03` `SC-04` `FS-01` `FS-02` `FS-03` `FM-02` | 7 |
| **P4** | Flow 3, Flow 6, Flow 7 | `SC-05` `SC-06` `FS-04` `FS-05` `FS-06` `FM-03` `FM-04` `FM-05` `BM-02` | 9 |
| **P5** | Flow 4 + Flow 5 (báo cáo) | `FM-06` `BM-04` `BM-05` `SA-04` | 4 |

---

## 6. Quy ước làm việc

- **Nhịp:** mỗi giai đoạn 2 tuần. Đầu giai đoạn họp chia việc, giữa giai đoạn họp kiểm tra tiến độ,
  cuối giai đoạn báo cáo giảng viên.
- **Git:** nhánh `main` luôn chạy được. Mỗi nhiệm vụ làm trên nhánh riêng theo mẫu
  `feature/<mã-task>-<mô-tả-ngắn>`, merge qua Pull Request, ít nhất 1 người review.
- **Tài liệu:** mọi thay đổi về actor, chức năng hoặc flow phải sửa [TOPIC.md](TOPIC.md) trước, rồi
  mới đồng bộ sang [README.md](../README.md). Không đánh số lại mã yêu cầu đã có — chỉ thêm mã mới.
- **API contract:** thống nhất trước khi code. Backend công bố endpoint và schema, Frontend mock
  theo đó để hai bên chạy song song, không phải chờ nhau.
- **Definition of Done:** code chạy được, có test cho tầng service, đã merge vào `main`, và cập nhật
  tài liệu liên quan.

---

## 7. Rủi ro và đối sách

| Rủi ro | Ảnh hưởng | Đối sách |
|--------|-----------|----------|
| Chỉ có 1 Frontend cho 5 portal giao diện | Cao — nghẽn từ P3 trở đi | Leader gánh trực tiếp phần Frontend ở mỗi giai đoạn (đã phân cụ thể trong § 4); ưu tiên dựng component dùng chung ở P2 để P3–P5 chỉ lắp ráp. |
| Business rules về Reservation / Payment / Deposit / Renewal / Overdue chốt muộn | Cao — phải sửa lại code P3, P4 | Bắt buộc chốt xong trong P1 (T1.5) và ghi vào tài liệu; mọi thay đổi sau đó phải qua họp nhóm. |
| Tích hợp thanh toán thật quá tốn thời gian | Trung bình | Dùng payment gateway giả lập ở P3; chỉ tích hợp thật nếu còn thời gian ở P5. |
| ERD thay đổi sau khi đã code | Trung bình | Dùng Flyway migration ngay từ P2 để mọi thay đổi schema đều có phiên bản và rollback được. |
| Dồn kiểm thử và tài liệu vào cuối kỳ | Trung bình | Mỗi giai đoạn đều có nhiệm vụ test và cập nhật tài liệu riêng, không để dồn sang P5. |

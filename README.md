# Self-Storage Facility Rental and Management System

**Hệ thống Nền tảng Quản lý & Cho thuê Kho Lưu trữ Tự phục vụ Thông minh**

[![Java 17](https://img.shields.io/badge/Java-17_LTS-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot 3.2](https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQL Server 2022](https://img.shields.io/badge/SQL_Server-2022-CC292B?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server/)
[![Flyway Migrations](https://img.shields.io/badge/Flyway-45_Migrations-CC0200?logo=flyway&logoColor=white)](https://flywaydb.org/)
[![Backend Tests](https://img.shields.io/badge/Backend_Tests-463_Passed-success?logo=apachemaven&logoColor=white)](backend/)
[![Frontend Tests](https://img.shields.io/badge/Frontend_Tests-68_Passed-success?logo=vitest&logoColor=white)](frontend/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🏢 **Đồ án chuyên ngành SWP391 — FPT University (Fall 2026)**  
> 📄 Đặc tả nghiệp vụ chuẩn: **[docs/TOPIC.md](docs/TOPIC.md)** · Bảng điều hành dự án: **[docs/DASHBOARD.md](docs/DASHBOARD.md)**

---

## 🌟 Tổng quan Dự án (Project Overview)

**Self-Storage Facility Rental and Management System** là giải pháp phần mềm chuyển đổi số toàn diện cho chuỗi cơ sở lưu trữ cá nhân và doanh nghiệp vừa/nhỏ (Self-Storage). Hệ thống giải quyết trọn vẹn bài toán vận hành chuỗi kho hiện đại: từ **tìm kiếm và đặt kho theo sơ đồ mặt bằng thời gian thực**, **thanh toán trực tuyến VietQR tức thì**, **bàn giao nhận kho bằng biên bản điện tử & khóa số thông minh 24/7**, cho đến **quản lý hợp đồng điện tử**, **gia hạn chống xung đột**, **nghiệm thu trả kho**, **xử lý sự cố kỹ thuật** và **giám sát nợ quá hạn 3 giai đoạn tự động**.

Hệ thống được thiết kế theo kiến trúc phân lớp hướng đối tượng (Layered Architecture), bảo đảm cô lập dữ liệu đa cơ sở (Multi-Facility Data Isolation), đáp ứng nghiêm ngặt 27 mã yêu cầu chức năng trên 5 phân hệ người dùng độc lập.

---

## 💎 Điểm sáng Nghiệp vụ & Kỹ thuật Vượt trội (Key Innovations)

### 1. 🔄 Vòng đời thuê kho số hóa 100% (End-to-End Digital Lifecycle)
* **Sơ đồ kho trực quan 2D theo thời gian thực:** Khách hàng chủ động chọn cơ sở, tầng và vị trí ô kho; hệ thống tự động kiểm tra tính sẵn sàng tức thời tại database (chống đặt trùng).
* **Đệm an toàn 15 ngày gối đầu (15-Day Safety Buffer):** Tự động tính toán khoảng đệm vệ sinh, bảo dưỡng giữa các hợp đồng thuê kế tiếp theo quy tắc `BR-RES-05`.
* **Thanh toán VietQR động:** Tích hợp sinh mã QR thanh toán chuẩn ngân hàng, đối soát mã đơn hàng tự động và chuyển trạng thái hợp đồng ngay sau khi thanh toán cọc thành công.
* **Thẻ nhận kho số (Move-in Pass) & Mã PIN 24/7:** Sau khi đặt cọc, khách hàng nhận thẻ số điện tử hiển thị mã QR đến quầy và mã PIN số kích hoạt mở cửa kho 24/7.

### 2. 📜 Hợp đồng Điện tử & Biên bản Bàn giao Online (Digital Contracts & Handover)
* **Văn bản Hợp đồng Pháp lý 4 Điều khoản:** Tích hợp trực tiếp trên Portal khách hàng với đầy đủ tư cách pháp nhân hai bên, đơn giá, biểu phí và thời hạn hợp đồng.
* **Biên bản Bàn giao Check-in chuẩn 4 tiêu chí (`BR-CHK-02`):** Nhân viên cơ sở đối soát hiện trường (Vệ sinh, Cửa khóa cuốn, Chống ẩm/PCCC, Khóa điện tử IoT) và ký biên bản điện tử trực tiếp trên thiết bị di động.
* **Phụ lục Điều chuyển Ô kho Tự động:** Khi quản lý cơ sở đổi ô kho do sự cố, hệ thống sinh ngay **Phụ lục điều chuyển**, cập nhật mã ô kho mới và **khẳng định bảo lưu 100% quyền lợi khách hàng** (giữ nguyên đơn giá thuê và tiền cọc ban đầu theo quy tắc `BR-AVL-05` & `BR-SUP-02`).
* **Hỗ trợ In ấn Điện tử:** Tích hợp sẵn nút `[In hợp đồng]` (`window.print()`) chuẩn khổ giấy A4 lưu trữ pháp lý.

### 3. 🛠️ Phân định Trách nhiệm Sự cố & Điều chuyển Kho Thông minh (Incident & Relocation)
* **Phân định 2 nhánh trách nhiệm hiện trường (`BR-SUP-02`):**
  - *Lỗi do công ty (hạ tầng, kỹ thuật, thấm dột, kẹt khóa hệ thống):* Cơ sở chịu 100% chi phí sửa chữa (0 VND), ưu tiên kích hoạt đổi ô kho dự phòng.
  - *Lỗi do khách hàng (sơ suất, gãy khóa, biến dạng vách ngăn):* Nhân viên đối soát phụ phí từ danh mục BOM (`BM-03`). Bắt buộc xác nhận khách đã nộp đủ phí mới được phép hoàn tất nghiệm thu.
* **Đồng bộ phân công nhân viên theo ca trực (`FM-05`, `FS-05`):** Bãi bỏ cơ chế SLA cứng gây áp lực ảo; tinh giản phân bổ theo nhân viên đang trực ca tại cơ sở.

### 4. 🚨 Quản trị Rủi ro Nợ quá hạn 3 Giai đoạn Nhân văn (`BR-OVD-01..03`)
* **Giai đoạn D+1 đến D+3 (Ân hạn nhắc nợ):** Miễn 100% phạt trễ hạn; gửi thông báo SMS/Email nhắc nhở; vẫn duy trì mã PIN mở cửa kho.
* **Giai đoạn D+4 đến D+6 (Tính phạt trễ hạn):** Áp dụng phạt 10%/ngày (trần 30% cọc); mở mã PIN để khách có thể chủ động dọn dẹp hàng hóa hoặc thanh toán.
* **Giai đoạn D+7 đến D+10 (Khóa an ninh & Cảnh báo cưỡng chế):** Tự động khóa mã PIN/QR điện tử; phạt tối đa 70% cọc; phát thông báo niêm phong khẩn.
* **Mốc 23:59 D+10 (Chấm dứt hợp đồng):** Tự động đơn phương hủy hợp đồng, kích hoạt quy trình dọn dẹp và thanh lý tài sản tồn đọng.
* **Cơ chế nộp phạt & mở khóa tức thời:** Sau khi nộp phạt quá hạn, hệ thống mở quyền báo trả kho và tự động cấp lại mã PIN mở cửa nếu khách muốn dọn kho.

### 5. 🛡️ Bảo mật & Cô lập Dữ liệu Đa cơ sở (Multi-Facility Data Isolation)
* Tuân thủ ràng buộc **`SA-03`**: Quản lý cơ sở (Facility Manager) và Nhân viên (Facility Staff) chỉ được phép truy xuất, nhận việc và thống kê dữ liệu của các cơ sở được phân công cụ thể.
* Khóa chặt lỗ hổng Header Spoofing thông qua `@AuthenticationPrincipal` trên Spring Security JWT.

---

## 👥 Tác nhân & Phân hệ Chức năng (Actors & Modules)

Hệ thống phục vụ **5 nhóm tác nhân** với quyền hạn và giao diện chuyên biệt:

| Tác nhân (Actor) | Tên tiếng Việt | Portal / Phân hệ | Trách nhiệm cốt lõi |
| :--- | :--- | :--- | :--- |
| **Storage Customer** | Khách thuê kho | `/customer/*` | Xem catalog kho, đặt chỗ, thanh toán VietQR, nhận thẻ Move-in Pass, quản lý kho đang thuê, xem hợp đồng online, gia hạn, báo trả kho, gửi ticket hỗ trợ. |
| **Facility Staff** | Nhân viên cơ sở | `/staff/*` | Kiểm tra đặt chỗ, lễ tân Check-in, lập biên bản bàn giao 4 tiêu chí, kiểm tra nghiệm thu trả kho, xử lý sự cố hiện trường, theo dõi task hàng ngày. |
| **Facility Manager** | Quản lý cơ sở | `/manager/*` | Quản lý mặt bằng & danh mục ô kho cơ sở, phân công ca trực nhân viên, điều phối sự cố & đổi ô kho, duyệt biên bản trả kho, báo cáo rủi ro quá hạn. |
| **Business Operations Manager** | Quản lý vận hành kinh doanh | `/bom/*` | Quản lý danh mục toàn bộ cơ sở toàn quốc, thiết lập chính sách cọc & gia hạn, bảng giá thuê & biểu phụ phí, báo cáo doanh thu & tỷ lệ lấp đầy (Usage Rate). |
| **System Administrator** | Quản trị hệ thống | `/admin/*` | Quản lý tài khoản người dùng, phân quyền vai trò (Role), gán quyền truy cập theo cơ sở (SA-03), theo dõi Audit Logs & lịch sử đăng nhập an ninh. |

> 📌 Chi tiết 27 mã yêu cầu chức năng (`SC-01..06`, `FS-01..06`, `FM-01..06`, `BM-01..05`, `SA-01..04`): **[docs/TOPIC.md § 3](docs/TOPIC.md#3-yêu-cầu-chức-năng-theo-tác-nhân)**

---

## 🔄 Phạm vi 7 Luồng Nghiệp vụ (Business Flows)

```
                           ┌──────────────────────────────┐
                           │   1. Storage Reservation    │
                           │   (Giữ chỗ, Cọc & VietQR)   │
                           └──────────────┬───────────────┘
                                          │
                                          ▼
                           ┌──────────────────────────────┐
                           │ 2. Check-in & Handover Desk  │
                           │ (4 Tiêu chí & Mã PIN 24/7)   │
                           └──────────────┬───────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
    ┌──────────────────────────────┐              ┌──────────────────────────────┐
    │ 3. Rented Storage Management │              │ 7. Support & Issue Handling  │
    │  (Hợp đồng số, Quản lý kho)  │◄────────────►│  (Hiện trường, Đổi ô kho)    │
    └──────────────┬───────────────┘              └──────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐ ┌──────────────────┐
│  6.1. Renewal    │ │  6.2. Overdue    │
│ (Gia hạn online) │ │ (3 Giai đoạn nợ) │
└────────┬─────────┘ └────────┬─────────┘
         │                    │
         └─────────┬──────────┘
                   ▼
    ┌──────────────────────────────┐
    │  Return & Deposit Settlement │
    │ (Nghiệm thu dọn kho & Hoàn)  │
    └──────────────────────────────┘
```

### Các Luồng Chính (Flow 1–5)
* **Flow 1 — Storage Unit Reservation:** Tìm kiếm theo cơ sở, chọn loại ô kho; kiểm tra tính sẵn sàng realtime; giữ chỗ theo đệm 15 ngày; thanh toán cọc & phí thuê N tháng qua VietQR.
* **Flow 2 — Storage Check-in and Handover:** Khách đến cơ sở xuất trình mã nhận kho; nhân viên dẫn đối soát 4 tiêu chí an toàn; ký biên bản bàn giao điện tử và cấp mã PIN truy cập 24/7.
* **Flow 3 — Rented Storage Unit Management:** Quản lý danh sách ô kho đang thuê; tra cứu hợp đồng điện tử và nhật ký mở cửa IoT; hủy yêu cầu trả kho khi đổi ý (`BR-RET-12`).
* **Flow 4 — Business Rules, Fee Management & Revenue Monitoring:** BOM cấu hình chính sách tiền cọc động (`depositMultiplier`), bảng giá theo diện tích m², phụ phí đền bù và theo dõi Usage Rate toàn chuỗi.
* **Flow 5 — Facility Storage and Staff Management:** FM quản lý mặt bằng kho, trạng thái ô kho (`AVAILABLE`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`); phân công nhân viên theo ca trực trên Bảng điều phối hàng ngày.

### Các Luồng Bổ sung (Flow 6–7)
* **Flow 6 — Storage Renewal and Overdue Handling:**
  - *Flow 6.1 (Gia hạn):* Cho phép gia hạn online; kiểm tra trùng lịch đặt trước với Conflict View trực quan (`BR-REN-01..06`).
  - *Flow 6.2 (Xử lý quá hạn):* Tự động chuyển nợ D+1..D+3 (ân hạn), D+4..D+6 (phạt trễ), D+7..D+10 (khóa PIN), >D+10 (thanh lý niêm phong tài sản).
* **Flow 7 — Support Request and Issue Handling:** Khách báo sự cố trên Portal; FM tiếp nhận và phân công nhân viên ca trực; Staff nghiệm thu hiện trường phân định lỗi; FM điều chuyển ô kho bảo lưu giá và cọc.

> 📌 Chi tiết ma trận Use Cases và Đặc tả luồng: **[docs/USER-STORIES-AND-USE-CASES.md](docs/USER-STORIES-AND-USE-CASES.md)**

---

## 🏗️ Kiến trúc Công nghệ (Technology Stack)

| Lớp (Layer) | Công nghệ / Thư viện | Vai trò & Đặc tả kỹ thuật |
| :--- | :--- | :--- |
| **Backend Core** | **Java 17 LTS · Spring Boot 3.2.5** | Nền tảng RESTful API mạnh mẽ, ổn định, xử lý giao dịch an toàn (`@Transactional`). |
| **Bảo mật & Phân quyền** | **Spring Security · JWT (jjwt 0.11.5)** | Xác thực không lưu phiên (Stateless), kiểm soát vai trò qua `@PreAuthorize`, cô lập đa cơ sở. |
| **Truy xuất Dữ liệu** | **Spring Data JPA · Hibernate 6** | Tối ưu hóa truy vấn, chống N+1, khóa hàng đối soát trạng thái kho (`findByIdForUpdate`). |
| **Cơ sở Dữ liệu** | **Microsoft SQL Server 2022** | Ràng buộc khóa ngoại, toàn vẹn dữ liệu tài chính, lưu trữ Unicode Tiếng Việt chuẩn UTF-8. |
| **Database Migration**| **Flyway 9 (45 Migration Scripts)** | Phiên bản hóa 100% lược đồ CSDL (`V1` → `V45`), đồng bộ dữ liệu hạt giống (Seed Data). |
| **Frontend Core** | **React 19.2 · TypeScript 6.0 · Vite 8** | Giao diện Single Page Application (SPA) siêu nhanh, Type-safety toàn diện từ DTO đến UI. |
| **Giao diện & Styling** | **TailwindCSS 3.4 · Lucide React** | Hệ thống Design System chuẩn sắc xanh thương hiệu (Mint/Emerald), hỗ trợ Responsive mọi kích thước màn hình. |
| **Thanh toán & Tích hợp**| **VietQR · PayOS API · QRCode.react** | Sinh mã QR động chuẩn ngân hàng, đối soát mã đơn hàng tự động. |
| **Kiểm thử Tự động** | **JUnit 5 · Mockito · Vitest · RTL** | 463 Backend Unit/Integration Tests + 68 Frontend Component Tests (100% GREEN). |

---

## 📁 Cấu trúc Thư mục Dự án (Project Structure)

```
Self-Storage-Facility-Rental-and-Management-System/
├── backend/                               # Mã nguồn Backend (Spring Boot 3 + Java 17)
│   ├── src/main/java/com/swp391/selfstorage/
│   │   ├── auth/                          # Đăng ký, đăng nhập JWT, đổi mật khẩu OTP
│   │   ├── common/                        # ApiResponse, PageResponse, GlobalExceptionHandler, ErrorCode
│   │   ├── contract/                      # Hợp đồng thuê kho, nghiệm thu Check-in, trả kho & tất toán
│   │   ├── facility/                      # Cơ sở kho, gán quyền nhân sự theo cơ sở (SA-03)
│   │   ├── payment/                       # Giao dịch thanh toán cọc, tiền thuê, phạt quá hạn qua VietQR
│   │   ├── policy/                        # Chính sách cọc BOM, tỷ lệ nhân cọc, quy định thuê
│   │   ├── report/                        # Báo cáo doanh thu, tỷ lệ lấp đầy kho, báo cáo rủi ro nợ
│   │   ├── reservation/                   # Đặt chỗ giữ kho, đệm an toàn 15 ngày, quản lý giỏ thuê
│   │   ├── support/                       # Phiếu sự cố kỹ thuật, phân công nhân viên, nghiệm thu hiện trường
│   │   ├── unit/                          # Danh mục loại kho (UnitType) và ô kho vật lý (StorageUnit)
│   │   └── user/                          # Quản lý tài khoản người dùng, phân quyền vai trò, Audit Logs
│   ├── src/main/resources/
│   │   ├── db/migration/                  # 45 file migration Flyway (V1__init_schema.sql -> V45)
│   │   └── application.yml                # Cấu hình SQL Server, JWT secret, cổng chạy 8080
│   └── src/test/java/                     # 463 test cases kiểm thử Unit, Service, Controller & Repository
│
├── frontend/                              # Mã nguồn Frontend (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── api/                           # Kết nối HTTP Axios/Fetch chuẩn hóa với Backend API
│   │   ├── components/ui/                 # Thư viện UI nguyên tử: Button, Badge, Modal, Card, Table
│   │   ├── features/
│   │   │   ├── customer/                  # Portal khách: Booking, MyUnits, ContractModal, Ticket, Renew
│   │   │   ├── staff/                     # Portal nhân viên: Check-in Desk, Return Inspection, Incidents
│   │   │   ├── manager/                   # Portal quản lý: Mặt bằng kho, Phân công ca, Báo cáo rủi ro quá hạn
│   │   │   ├── bom/                       # Portal BOM: Danh sách cơ sở, Biểu phí, Chính sách, Báo cáo toàn chuỗi
│   │   │   └── admin/                     # Portal Admin: Quản lý người dùng, Gán quyền cơ sở, Audit Logs
│   │   ├── App.tsx                        # Hệ thống Routing bảo vệ theo vai trò (Role-based Auth Guard)
│   │   └── index.css                      # CSS Token, bảng màu thương hiệu chuẩn Mint/Emerald
│   └── package.json                       # Cấu hình dependency, script build và chạy kiểm thử Vitest
│
├── docs/                                  # Toàn bộ kho tài liệu kỹ thuật & phân tích nghiệp vụ
│   ├── DASHBOARD.md                       # Bảng điều hành trung tâm: Sprint, 4 Workstreams, sổ Issue 3 dòng
│   ├── TOPIC.md                           # Chân lý đề tài gốc: 5 Actor, 27 chức năng, 7 luồng nghiệp vụ
│   ├── USER-STORIES-AND-USE-CASES.md      # Đặc tả yêu cầu hợp nhất: User Stories & Phân rã Use Cases chi tiết
│   ├── BUSINESS-RULES.md                  # Quy tắc nghiệp vụ chi tiết (BR-RES, BR-CHK, BR-OVD, BR-SUP...)
│   ├── API-SPEC.md                        # Hợp đồng REST API chi tiết toàn bộ endpoint
│   ├── DATA-DICTIONARY.md                 # Từ điển dữ liệu CSDL (đồng bộ 45 Flyway scripts)
│   ├── PLAN.md                            # Kế hoạch thực thi 5 giai đoạn (P1 -> P5)
│   ├── CONVENTIONS.md                     # Quy chuẩn viết mã và thiết kế REST API
│   ├── diagrams/                          # Sơ đồ Activity Diagram chuẩn UML (.drawio)
│   └── deploy/                            # Bộ tài liệu 7 bước hướng dẫn cài đặt & deploy Production
│
└── CONTRIBUTING.md                        # Quy chuẩn Git: Nhánh, Commit tiếng Việt, Quy tắc Zero-Conflict
```

---

## ⚡ Hướng dẫn Khởi chạy Siêu tốc (Quick Start)

### 1. Yêu cầu môi trường (Prerequisites)
* **Java Development Kit (JDK):** Java 17 LTS (khuyên dùng Eclipse Temurin hoặc Oracle JDK 17).
* **Node.js & npm:** Node.js 20+ và npm 10+.
* **Cơ sở dữ liệu:** Microsoft SQL Server 2022 (cổng mặc định `1433`).

### 2. Thiết lập Cơ sở dữ liệu (Database Setup)
Khởi tạo cơ sở dữ liệu rỗng trong SQL Server Management Studio (SSMS) hoặc Azure Data Studio:
```sql
CREATE DATABASE SelfStorageDB;
GO
```
*(Hệ thống sẽ tự động chạy 45 file migration Flyway để khởi tạo toàn bộ bảng, khóa ngoại và seed data ngay khi Backend khởi động lần đầu).*

### 3. Chạy Backend (Spring Boot)
Mở cửa sổ PowerShell tại thư mục gốc của repository:
```powershell
# Trỏ biến môi trường JDK 17 (nếu máy cài nhiều phiên bản Java)
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'

# Khởi động ứng dụng Spring Boot
mvn -f backend/pom.xml spring-boot:run
```
* Backend sẽ chạy tại: **`http://localhost:8080`**  
* Swagger API Docs: **`http://localhost:8080/swagger-ui/index.html`**

### 4. Chạy Frontend (React Vite)
Mở một cửa sổ PowerShell riêng biệt tại thư mục gốc:
```powershell
# Cài đặt thư viện phụ thuộc (nếu chạy lần đầu)
npm --prefix frontend install

# Khởi chạy Vite Dev Server
npm --prefix frontend run dev
```
* Frontend sẽ chạy tại: **`http://localhost:5173`** (đã cấu hình sẵn proxy API sang port 8080).

---

## 🔑 Tài khoản Trải nghiệm Demo Sẵn sàng (Demo Credentials)

Hệ thống đã nạp sẵn bộ tài khoản demo với dữ liệu thực tế cho cả 5 vai trò.  
Mật khẩu mặc định cho **tất cả tài khoản demo** là: **`password123`**

| Vai trò | Email đăng nhập | Mật khẩu | Phạm vi & Trách nhiệm trải nghiệm |
| :--- | :--- | :---: | :--- |
| 🧑‍💼 **Storage Customer** | `customer@storage.vn`<br>*(hoặc `nhi.customer@gmail.com`)* | `password123` | Đặt chỗ ô kho mới, xem mã mở cửa PIN 24/7, xem Hợp đồng điện tử online, gửi ticket sự cố, gia hạn hoặc báo trả kho. |
| 👷 **Facility Staff** | `staff.q1@smartstorage.vn`<br>*(hoặc `staff@storage.vn`)* | `password123` | Bàn giao Check-in 4 tiêu chí, cấp mã PIN, nghiệm thu trả kho, xử lý sự cố hiện trường có tính phụ phí BOM. |
| 👨‍💼 **Facility Manager** | `fm.q1@smartstorage.vn`<br>*(hoặc `manager@storage.vn`)* | `password123` | Quản lý mặt bằng kho, phân công ca trực nhân viên, điều chuyển ô kho bảo lưu giá thuê & cọc, báo cáo rủi ro nợ quá hạn. |
| 📈 **Operations Manager (BOM)**| `bom@smartstorage.vn`<br>*(hoặc `bom@storage.vn`)* | `password123` | Quản lý danh mục toàn bộ cơ sở, cấu hình chính sách nhân cọc (`depositMultiplier`), xem tỷ lệ lấp đầy kho toàn quốc. |
| 🛡️ **System Administrator** | `admin@smartstorage.vn`<br>*(hoặc `admin@storage.vn`)* | `password123` | Quản trị tài khoản, gán quyền truy cập đa cơ sở (SA-03), xem toàn bộ Audit Logs và lịch sử đăng nhập an ninh. |

---

## 🧪 Đảm bảo Chất lượng & Kiểm thử (Quality Assurance & DoD)

Dự án áp dụng quy trình kiểm thử nghiêm ngặt (Test-Driven Development) và kiểm tra tích hợp liên tục (CI) nhằm triệt tiêu lỗi hồi quy:

* **Backend Test Suite (JUnit 5 + Mockito + WebMvcTest):**
  - **463/463 test cases** vượt qua với tỷ lệ **100% BUILD SUCCESS**.
  - Bao phủ toàn diện các tầng: Controller Validation, Service Business Rules (`BR-GEN`, `BR-RES`, `BR-AVL`, `BR-CHK`, `BR-RET`, `BR-OVD`, `BR-SUP`), Repository Custom Queries.
  ```powershell
  $env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'; mvn -f backend/pom.xml test
  ```
* **Frontend Test Suite (Vitest + React Testing Library):**
  - **68/68 test cases** trên **21 test suites** đạt **100% GREEN**.
  - Kiểm thử tương tác người dùng, tính toán đơn giá, bộ lọc hợp đồng, hiển thị hợp đồng điện tử online và cảnh báo rủi ro quá hạn.
  ```powershell
  npm --prefix frontend test
  ```
* **Production Build Verification:**
  - Lệnh `tsc -b && vite build` hoàn thành nhanh chóng, không có bất kỳ lỗi cú pháp hay TypeScript linting nào.
* **Quy trình Git & CI Bot:**
  - Quy chuẩn Conventional Commits tiếng Việt (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
  - Tự động kiểm tra định dạng tên nhánh bằng CI Bot (`pr-bot.yml`): `^(feature|fix|docs|chore|refactor)/[a-z0-9-]+$`.
  - Cơ chế **Zero-Conflict Rebase** bảo đảm nhánh tính năng luôn nằm trên đỉnh `main` trước khi mở Pull Request.

---

## 📅 Lộ trình Triển khai (Project Roadmap)

Dự án được thực hiện trong **10 tuần (08/09/2026 – 16/11/2026)**, chia thành **5 giai đoạn × 2 tuần**:

| Giai đoạn | Tuần | Thời gian | Trọng tâm công việc | Trạng thái |
| :---: | :---: | :---: | :--- | :---: |
| **P1** | Tuần 1–2 | 08/09 – 21/09 | Phân tích yêu cầu, Business Rules, ERD, Activity Diagrams, UI Design System, Khởi tạo dự án. | ✅ Hoàn thành |
| **P2** | Tuần 3–4 | 22/09 – 05/10 | Kiến trúc lõi: Schema Flyway, Auth JWT, Quản trị Facility / Unit Type / Storage Unit, Khung giá. | ✅ Hoàn thành |
| **P3** | Tuần 5–6 | 06/10 – 19/10 | Flow 1 + Flow 2: Đặt chỗ giữ capacity, Thanh toán cọc VietQR, Check-in Desk & Bàn giao 4 tiêu chuẩn. | ✅ Hoàn thành |
| **P4** | Tuần 7–8 | 20/10 – 02/11 | Flow 3 + Flow 6 + Flow 7: Quản lý kho đang thuê, Hợp đồng online, Trả kho, Gia hạn, Quá hạn & Sự cố. | ✅ Hoàn thành |
| **P5** | Tuần 9–10 | 03/11 – 16/11 | Flow 4: Báo cáo BOM, Kiểm thử tích hợp toàn diện E2E, Tối ưu hóa hiệu năng, Đóng gói deploy & Bảo vệ. | 🚀 Đang tiến hành |

---

## 👨‍💻 Đội ngũ Thực hiện (Development Team)

Dự án được xây dựng bởi **Nhóm 4 thành viên (SWP391 — FPT University)** với 4 Workstream độc lập:

| Thành viên | Vai trò Kỹ thuật | Trục công việc (Workstream) | Trách nhiệm chính |
| :--- | :--- | :--- | :--- |
| **Nguyễn Văn Gia Bình** | **Technical Lead / Fullstack** | **WS2: Cơ sở & Vận hành** | Kiến trúc hệ thống, Quản lý kho & sơ đồ mặt bằng, Check-in Desk, Nghiệm thu trả kho & Tất toán cọc, Điều phối chung. |
| **Lê Thanh Tùng** | **Backend Lead / Core Domain** | **WS4: Quản trị & Điều phối** | Quản lý hợp đồng thuê kho, Bàn phân công nhân viên FM, Luồng tiếp nhận & Nghiệm thu sự cố (Flow 7), Điều chuyển ô kho. |
| **Huỳnh Nhật** | **Backend / Money & Platform** | **WS3: Tài chính & Tự động** | Tích hợp cổng thanh toán VietQR, Quản lý chính sách BOM, Xử lý tính phạt nợ quá hạn (Flow 6.2), Hệ thống báo cáo tài chính. |
| **Nguyễn Phạm Xuân Nhi** | **Frontend Lead / UX Designer** | **WS1: Khách hàng & Đặt chỗ**| Thiết kế UI Design System, Portal khách hàng, Quy trình Booking kho realtime, Luồng gia hạn trực tuyến (Flow 6.1). |

---

## 📚 Bản đồ Tài liệu Tham chiếu (Documentation Map)

| Tài liệu | Đường dẫn | Nội dung & Mục đích |
| :--- | :--- | :--- |
| **Bảng điều hành trung tâm** | [docs/DASHBOARD.md](docs/DASHBOARD.md) | Bộ nhớ làm việc duy nhất: Trọng tâm sprint, tiến độ 4 Workstream, sổ theo dõi lỗi 3 dòng. |
| **Đặc tả đề tài gốc** | [docs/TOPIC.md](docs/TOPIC.md) | Chân lý nghiệp vụ: 5 tác nhân, 27 mã chức năng (`SC-*`, `FS-*`, `FM-*`, `BM-*`, `SA-*`), 7 luồng nghiệp vụ. |
| **Yêu cầu & Use Cases hợp nhất** | [docs/USER-STORIES-AND-USE-CASES.md](docs/USER-STORIES-AND-USE-CASES.md) | Toàn bộ User Stories theo chuẩn Gherkin, phân rã Use Cases chi tiết cho tất cả các luồng. |
| **Quy định Nghiệp vụ** | [docs/BUSINESS-RULES.md](docs/BUSINESS-RULES.md) | Định nghĩa toàn bộ quy tắc nghiệp vụ (`BR-*`), bảng thông số thời gian, tỷ lệ cọc và phí phạt. |
| **Hợp đồng REST API** | [docs/API-SPEC.md](docs/API-SPEC.md) | Chi tiết endpoint, HTTP Method, Request/Response payload và chuẩn mã lỗi hệ thống. |
| **Từ điển Dữ liệu** | [docs/DATA-DICTIONARY.md](docs/DATA-DICTIONARY.md) | Ý nghĩa, kiểu dữ liệu, ràng buộc và chỉ mục của từng cột trong database (khớp 45 Flyway scripts). |
| **Hướng dẫn Triển khai Deploy** | [docs/deploy/README.md](docs/deploy/README.md) | Trọn bộ 7 tài liệu hướng dẫn cài đặt môi trường, cấu hình biến môi trường, deploy Production và bảo mật. |
| **Quy chuẩn Đóng góp Mã nguồn** | [CONTRIBUTING.md](CONTRIBUTING.md) | Quy trình 5 bước: Tạo nhánh, lập kế hoạch, TDD, nghiệm thu và mở Pull Request qua GitHub CLI. |

---

<p align="center">
  <b>© 2026 SmartStorage Team. All rights reserved.</b><br>
  <i>Built with passion & precision for FPT University Capstone Project SWP391.</i>
</p>

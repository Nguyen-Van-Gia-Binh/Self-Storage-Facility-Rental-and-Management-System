# Trung tâm Tra cứu & Trực quan hóa Sơ đồ Kỹ thuật (Interactive Diagrams Hub)

> **Dự án:** Self-Storage Facility Rental and Management System (SWP391 — FPT University Fall 2026)  
> **Công nghệ sơ đồ:** 100% Code-backed Standalone HTML Diagrams (Archify 3.2.0 Engine)  
> **Chất lượng:** Đạt chuẩn **Showcase Profile** (Exit code 0, 0 crossovers, 100% Verified Sources từ commit sạch).  
> **Cách mở:** Tất cả các file `.html` bên dưới đều là ứng dụng độc lập, tự chứa (self-contained). Bạn chỉ cần **nhấp đúp chuột để mở trực tiếp trên mọi trình duyệt web** (Google Chrome, Microsoft Edge, Safari) mà không cần cài đặt web server.

---

## 📑 Bảng Chỉ mục Tổng hợp 19 Sơ đồ Kỹ thuật Hệ thống

| Phân hệ / Luồng Nghiệp vụ | Mã Flow | Sơ đồ Trực quan (HTML Standalone) | Phân loại | Người phụ trách chính | Quy tắc Cốt lõi / Điểm neo |
| :--- | :---: | :--- | :---: | :--- | :--- |
| **Storage Unit Reservation & Waitlist CRM** | **Flow 1** | • [flow-1-reservation-workflow.html](flow-1-reservation/flow-1-reservation-workflow.html)<br>• [flow-1-reservation-sequence.html](flow-1-reservation/flow-1-reservation-sequence.html) | Workflow<br>Sequence | **Nguyễn Phạm Xuân Nhi**<br>*(WS1: Khách hàng & Đặt chỗ)* | Cửa sổ 30 ngày (`BR-RES-01`), Tạm giữ 48h (`BR-RES-02`), Buffer 15 ngày (`BR-AVL-01..04`), Waitlist Telesales khóa 2h (`BR-WAT-02`), Late-binding FM gán ô (`FM-02`). |
| **Check-in, Handover & Auto-Activation** | **Flow 2** | • [flow2-checkin-handover-workflow.html](flow-2-checkin-handover/flow2-checkin-handover-workflow.html)<br>• [flow2-contract-checkin-lifecycle.html](flow-2-checkin-handover/flow2-contract-checkin-lifecycle.html) | Workflow<br>Lifecycle | **Lê Thanh Tùng**<br>*(WS4: Quản trị & Điều phối)* | Nghiệm thu hiện trường 4 tiêu chí (`BR-CHK-02`), Ký số e-Form, Cấp PIN 6 số 24/7, Đổi ô hỏng (`BR-CHK-03`), Scheduler tự kích hoạt T+11 giữ 100% doanh thu (`BR-CAN-04`, `BR-CHK-05`). |
| **Rented Unit Mgmt, Win-Win Early Return** | **Flow 3** | • [flow3-return-settlement-workflow.html](flow-3-return-settlement/flow3-return-settlement-workflow.html)<br>• [flow3-return-settlement-sequence.html](flow-3-return-settlement/flow3-return-settlement-sequence.html) | Workflow<br>Sequence | **Nguyễn Văn Gia Bình**<br>*(WS2: Cơ sở & Vận hành)* | Công thức Trả kho sớm Win-Win (`BR-RET-06`): Hoàn 100% tiền thuê ngày chưa dùng + Phạt tịch thu 100% cọc gốc; Nghiệm thu hiện trường, duyệt quyết toán hoàn cọc / cấn trừ nợ. |
| **BOM Policy, Master Unit Type & Revenue** | **Flow 4** | • [flow4-bom-policy-architecture.html](flow-4-bom-pricing/flow4-bom-policy-architecture.html)<br>• [flow4-revenue-occupancy-dataflow.html](flow-4-bom-pricing/flow4-revenue-occupancy-dataflow.html) | Architecture<br>Dataflow | **Huỳnh Nhật**<br>*(WS3: Tài chính & Tự động)* | Danh mục Kiểu kho Master (`BM-01`), Bảng giá Base vs Cơ sở (`BR-PRI-01..04`), Snapshot cọc bất biến (`BR-DEP-01`), Công thức Usage Rate chuẩn và bóc tách 4 dòng doanh thu (`BM-03..05`). |
| **Facility Storage & Staff Dispatching** | **Flow 5** | • [flow5-facility-storage-workflow.html](flow-5-facility-staff/flow5-facility-storage-workflow.html)<br>• [flow5-facility-hierarchy-tree.html](flow-5-facility-staff/flow5-facility-hierarchy-tree.html) | Workflow<br>Tree | **Lê Thanh Tùng**<br>*(WS4: Quản trị & Điều phối)* | Khởi tạo ô kho vật lý từ Master BOM, Cây phân cấp `System -> Facility -> Unit & Staff`, Điều phối ca trực hằng ngày của FM cho Staff (`FS-06`, `FM-05`). |
| **Renewal T-20 & Overdue Lifecycle** | **Flow 6** | • [flow-6-1-renewal-workflow.html](flow-6-renewal-overdue/flow-6-1-renewal-workflow.html)<br>• [flow-6-2-overdue-lifecycle.html](flow-6-renewal-overdue/flow-6-2-overdue-lifecycle.html) | Workflow<br>Lifecycle | **Nguyễn Phạm Xuân Nhi** (6.1)<br>**Nguyễn Văn Gia Bình** (6.2) | **6.1:** Khóa tự do gia hạn trước T-20 (`BR-REN-01..09`), bảo lưu cọc gốc (`BR-DEP-01`).<br>**6.2:** Ân hạn D+1..D+3 (`BR-OVD-01`), Phạt 10% cọc/ngày D+4..D+9 (`BR-OVD-02`), Khóa PIN D+7 (`BR-OVD-05`), Niêm phong D+10 (`BR-OVD-07`). |
| **Support Request, Damage & Unit Swap** | **Flow 7** | • [flow7-support-ticket-workflow.html](flow-7-support-incident/flow7-support-ticket-workflow.html)<br>• [flow7-damage-compensation-sequence.html](flow-7-support-incident/flow7-damage-compensation-sequence.html) | Workflow<br>Sequence | **Lê Thanh Tùng**<br>*(WS4: Quản trị & Điều phối)* | Tiếp nhận ticket sự cố 2 nhánh (Lỗi cơ sở: miễn phí; Lỗi khách: thu phí), Cấp lại mã PIN khẩn cấp, Đền bù thiệt hại (Gói mặc định 10M vs Mở rộng 50M `BR-SUP-04`), Quy trình đổi ô kho sự cố. |
| **JWT Security, RBAC Multi-Facility & Cron** | **Flow SYS** | • [flow-sys-security-architecture.html](flow-sys-security-cron/flow-sys-security-architecture.html)<br>• [flow-sys-cron-schedulers-sequence.html](flow-sys-security-cron/flow-sys-cron-schedulers-sequence.html) | Architecture<br>Sequence | **Lê Thanh Tùng** (Security)<br>**Huỳnh Nhật** (Cron Config) | Chuỗi lọc `JwtAuthenticationFilter -> SecurityContext -> @PreAuthorize`, Cơ chế bảo vệ dữ liệu chống IDOR đa cơ sở `FacilitySecurityService`, Tác vụ nền Auto-Activate T+11 & Overdue Cron 00:00:00. |
| **Hệ thống & CSDL Vật lý (Database Models)** | **System & DB** | • [database-physical-erd.html](system-and-db/database-physical-erd.html)<br>• [system-architecture.html](system-and-db/system-architecture.html)<br>• [full-database.html](system-and-db/full-database.html) | ERD<br>Architecture | **Nhóm phát triển**<br>*(Team SWP391)* | Sơ đồ Physical ERD toàn diện 30 bảng CSDL (Flyway V1 đến V13), Quan hệ khóa ngoại 1:N / N:N, Kiến trúc phân tầng Clean Architecture 5 tầng của hệ thống. |

---

## 🗂️ Cấu trúc Thư mục Chi tiết

```
docs/diagrams/
├── README.md                                    # Bản đồ điều hướng & Index trung tâm (file này)
├── flow-1-reservation/                          # [Flow 1] Khách hàng đặt chỗ & Waitlist CRM
│   ├── flow-1-reservation-workflow.html         # Sơ đồ Quy trình toàn trình (Interactive Workflow)
│   ├── flow-1-reservation-sequence.html         # Sơ đồ Trình tự thanh toán VietQR & Webhook (Sequence)
│   └── meta/                                    # Hồ sơ kiểm định chất lượng (Candidate & Finalize JSON)
├── flow-2-checkin-handover/                     # [Flow 2] Nhận kho, Bàn giao 4 tiêu chí & Kích hoạt T+11
│   ├── flow2-checkin-handover-workflow.html     # Sơ đồ Quy trình tiếp đón, nghiệm thu & đổi ô hỏng
│   ├── flow2-contract-checkin-lifecycle.html    # Sơ đồ Vòng đời hợp đồng PENDING_CHECK_IN -> ACTIVE
│   └── meta/
├── flow-3-return-settlement/                    # [Flow 3] Quản lý kho đang thuê, Trả sớm Win-Win & Tất toán
│   ├── flow3-return-settlement-workflow.html    # Sơ đồ Quy trình trả kho sớm, nghiệm thu & duyệt quyết toán
│   ├── flow3-return-settlement-sequence.html    # Sơ đồ Trình tự tương tác tài chính Customer - Staff - FM
│   └── meta/
├── flow-4-bom-pricing/                          # [Flow 4] Quản lý Chính sách BOM, Giá Base/Cơ sở & Doanh thu
│   ├── flow4-bom-policy-architecture.html       # Sơ đồ Phân tầng Master Catalog & Override bảng giá cơ sở
│   ├── flow4-revenue-occupancy-dataflow.html    # Sơ đồ Dòng chảy dữ liệu Doanh thu & Tỷ lệ lấp đầy Usage Rate
│   └── meta/
├── flow-5-facility-staff/                       # [Flow 5] Sơ đồ Ô kho Cơ sở & Phân công Nhân sự
│   ├── flow5-facility-storage-workflow.html     # Sơ đồ Quy trình phân công ca trực & bàn làm việc Staff
│   ├── flow5-facility-hierarchy-tree.html       # Sơ đồ Cây phân cấp quản lý: System -> Facility -> Unit & Staff
│   └── meta/
├── flow-6-renewal-overdue/                      # [Flow 6] Tự gia hạn T-20 & Vòng đời Xử lý nợ Quá hạn
│   ├── flow-6-1-renewal-workflow.html           # [Flow 6.1] Sơ đồ Gia hạn trực tuyến, khóa T-20 & Late Bumping
│   ├── flow-6-2-overdue-lifecycle.html          # [Flow 6.2] Vòng đời nợ D+1..D+3 ân hạn, D+4 phạt, D+7 khóa PIN, D+10 niêm phong
│   └── meta/
├── flow-7-support-incident/                     # [Flow 7] Yêu cầu Hỗ trợ, Đền bù Thiệt hại & Đổi kho Khẩn cấp
│   ├── flow7-support-ticket-workflow.html       # Sơ đồ Quy trình xử lý sự cố 2 nhánh (Lỗi cơ sở vs Lỗi khách)
│   ├── flow7-damage-compensation-sequence.html  # Sơ đồ Trình tự bồi thường gói bảo vệ 10M/50M & đổi ô kho
│   └── meta/
├── flow-sys-security-cron/                      # [Flow SYS] Bảo mật JWT, Multi-Facility RBAC & Cron Schedulers
│   ├── flow-sys-security-architecture.html      # Sơ đồ Kiến trúc Bảo mật tầng sâu & Chống IDOR đa cơ sở
│   ├── flow-sys-cron-schedulers-sequence.html   # Sơ đồ Trình tự thực thi 2 tác vụ nền Auto-Activate & Overdue
│   └── meta/
├── system-and-db/                               # Tổng thể Hệ thống & Cơ sở Dữ liệu
│   ├── database-physical-erd.html               # Sơ đồ Physical ERD tương tác 30 bảng CSDL thực tế
│   ├── full-database.html                       # Sơ đồ Database ERD mở rộng toàn diện
│   ├── system-architecture.html                 # Sơ đồ Kiến trúc Tổng thể 5 tầng của hệ thống
│   └── meta/
└── legacy-drawio/                               # Lưu trữ các bản vẽ Draw.io, PUML và State Machine cũ
    ├── activity-diagram-flow-1-storage-reservation.drawio
    ├── activity-diagram-flow-2-checkin-handover.drawio
    ├── activity-diagram-flow-4-business-operations.drawio
    ├── activity-diagram-flow-5-facility-staff-management.drawio
    ├── activity-diagram-flow-6-1-storage-renewal.drawio
    ├── activity-diagram-flow-6-2-overdue-handling.drawio
    ├── activity-diagram-flow-7-support-incident-handling.drawio
    ├── erd-conceptual-model.puml
    └── state-machine-*.drawio / *.png
```

---

## 💡 Hướng dẫn Tương tác trên Sơ đồ Archify

Mỗi file sơ đồ HTML được trang bị giao diện người dùng tương tác cao cấp (Archify Showcase UI):

1. **Trích dẫn Mã nguồn Thật (Verified Source Citations):**
   * Nhấp chuột vào bất kỳ node nghiệp vụ nào để mở bảng **Source Code Inspector** bên góc phải.
   * Tất cả các bước đều có đường dẫn chính xác tới từng file và số dòng code thực tế trong backend Java Spring Boot hoặc frontend React TypeScript.
   * Với chế độ `link_mode: "web"`, bạn có thể nhấp trực tiếp vào tên file để mở ngay đúng dòng mã nguồn trên GitHub repository.
2. **Theo dõi Chuyển động Thời gian Thực (Live Signal Animation):**
   * Nhấp nút **Play / Trace** trên thanh điều khiển để quan sát trực quan luồng dữ liệu chạy xuyên suốt qua các tầng hệ thống.
3. **Chuyển đổi Giao diện Sáng / Tối (Light & Dark Theme):**
   * Tự động thích ứng với cấu hình hệ điều hành hoặc chuyển đổi thủ công bằng nút Theme trên thanh tiêu đề.
4. **Phóng to, Thu nhỏ & Toàn màn hình (Zoom & Pan):**
   * Sử dụng con lăn chuột hoặc nút `+` / `-` để phóng to chi tiết các luồng rẽ nhánh phức tạp; hỗ trợ nút chế độ Toàn màn hình (Fullscreen) để trình chiếu trên máy chiếu hội đồng.

---
*Tài liệu được chuẩn hóa và quản lý tập trung bởi Ban Kỹ thuật Dự án SWP391.*

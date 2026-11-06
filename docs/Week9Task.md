# Kế hoạch Tuần 9: Khảo sát Hiện trạng Mã nguồn & Trực quan hóa 7 Flow Nghiệp vụ bằng Archify

> **Dự án:** Self-Storage Facility Rental and Management System (SWP391)  
> **Thời gian:** Giai đoạn 5 (Tuần 9: 03/11 – 09/11/2026)  
> **Người lập kế hoạch & Điều phối:** Nguyễn Văn Gia Bình (Technical Lead)  
> **Mục tiêu:** Trực quan hóa chính xác 100% hiện trạng mã nguồn thực tế (Code-backed Diagrams) của toàn bộ 7 luồng nghiệp vụ và luồng hệ thống bằng công cụ `/archify`; phân định rõ ràng trách nhiệm của 4 thành viên theo 4 Trục công việc (Workstreams); phát hiện và đối soát các điểm sai lệch (Drift Detection) giữa tài liệu thiết kế và mã nguồn đang chạy để hoàn thiện tài liệu đồ án (SRS/SDD) và chuẩn bị bảo vệ tốt nghiệp.

---

## 📑 Mục lục

1. [Bối cảnh & Thách thức Kỹ thuật Tuần 9](#1-bối-cảnh--thách-thức-kỹ-thuật-tuần-9)
2. [Ma trận Phân công Trách nhiệm Nhân sự (RACI Matrix)](#2-ma-trận-phân-công-trách-nhiệm-nhân-sự-raci-matrix)
3. [Bộ 5 Chốt Chặn Chống Bẫy Thực Chiến (Anti-Traps Guardrails)](#3-bộ-5-chốt-chặn-chống-bẫy-thực-chiến-anti-traps-guardrails)
4. [Trọn bộ Sub-prompts Giao việc cho 7 Luồng Nghiệp vụ & Flow SYS](#4-trọn-bộ-sub-prompts-giao-việc-cho-7-luồng-nghiệp-vụ--flow-sys)
   - 4.1. [Sub-prompt Flow 1: Storage Unit Reservation & Waitlist CRM (Xuân Nhi — WS1)](#41-sub-prompt-flow-1-storage-unit-reservation--waitlist-crm-xuân-nhi--ws1)
   - 4.2. [Sub-prompt Flow 2: Check-in, Handover & Auto-Activation (Gia Bình — WS2)](#42-sub-prompt-flow-2-check-in-handover--auto-activation-gia-bình--ws2)
   - 4.3. [Sub-prompt Flow 3: Rented Unit Management, Win-Win Early Return & Settlement (Gia Bình — WS2)](#43-sub-prompt-flow-3-rented-unit-management-win-win-early-return--settlement-gia-bình--ws2)
   - 4.4. [Sub-prompt Flow 4: BOM Policy, Master Unit Type Catalog & Revenue Monitoring (Huỳnh Nhật — WS3)](#44-sub-prompt-flow-4-bom-policy-master-unit-type-catalog--revenue-monitoring-huỳnh-nhật--ws3)
   - 4.5. [Sub-prompt Flow 5: Facility Storage Allocation & Staff Dispatching (Lê Thanh Tùng — WS4)](#45-sub-prompt-flow-5-facility-storage-allocation--staff-dispatching-lê-thanh-tùng--ws4)
   - 4.6. [Sub-prompt Flow 6: Renewal T-20 & Overdue Lifecycle (Xuân Nhi — WS1 & Huỳnh Nhật — WS3)](#46-sub-prompt-flow-6-renewal-t-20--overdue-lifecycle-xuân-nhi--ws1--huỳnh-nhật--ws3)
   - 4.7. [Sub-prompt Flow 7: Support Ticket, Damage Compensation & Unit Swap (Lê Thanh Tùng — WS4)](#47-sub-prompt-flow-7-support-ticket-damage-compensation--unit-swap-lê-thanh-tùng--ws4)
   - 4.8. [Sub-prompt Flow SYS: Authentication, RBAC Multi-Facility & Cron Tasks (Lê Thanh Tùng — WS4 & Huỳnh Nhật — WS3)](#48-sub-prompt-flow-sys-authentication-rbac-multi-facility--cron-tasks-lê-thanh-tùng--ws4--huỳnh-nhật--ws3)
5. [Quy chuẩn Thực thi Kỹ thuật & Khắc phục Lỗi với Archify CLI](#5-quy-chuẩn-thực-thi-kỹ-thuật--khắc-phục-lỗi-với-archify-cli)
   - 5.1. [Cấu trúc Thư mục và Khởi tạo Workspace](#51-cấu-trúc-thư-mục-và-khởi-tạo-workspace)
   - 5.2. [Cấu trúc Metadata và Trích dẫn Bằng chứng](#52-cấu-trúc-metadata-và-trích-dẫn-bằng-chứng)
   - 5.3. [Câu lệnh Finalize Chuẩn hóa](#53-câu-lệnh-finalize-chuẩn-hóa)
   - 5.4. [Hướng dẫn Khắc phục các Lỗi Thường gặp (Repair Contract)](#54-hướng-dẫn-khắc-phục-các-lỗi-thường-gặp-repair-contract)
6. [Tiêu chí Nghiệm thu (DoD) & Biểu mẫu Báo cáo Độ lệch Mã nguồn](#6-tiêu-chí-nghiệm-thu-dod--biểu-mẫu-báo-cáo-độ-lệch-mã-nguồn)

---

## 1. Bối cảnh & Thách thức Kỹ thuật Tuần 9

Hệ thống đang ở **Giai đoạn 5 (Tuần 9: 03/11 – 09/11/2026)**. Toàn bộ 4 Trục công việc (WS1..WS4) đã hoàn tất việc tích hợp các tính năng nghiệp vụ lớn và các trụ cột đổi mới (Waitlist CRM, Late-binding Allocation, Auto-Activation T+11, Trả kho sớm Win-Win, Khóa tự gia hạn T-20). Để chuẩn bị nghiệm thu đồ án, hoàn thiện tài liệu Đặc tả Kiến trúc (Software Architecture Document - SAD) và xây dựng slide bảo vệ tốt nghiệp, toàn bộ 7 luồng nghiệp vụ và luồng hệ thống cần được **trực quan hóa thành các sơ đồ kỹ thuật tương tác độc lập (Standalone HTML)** thông qua công cụ `/archify`.

---

## 2. Ma trận Phân công Trách nhiệm Nhân sự (RACI Matrix)

Quy ước vai trò RACI:
- **R (Responsible):** Thành viên trực tiếp điều tra mã nguồn 5 tầng, xây dựng file `candidate.json` và chạy Archify CLI.
- **A (Accountable):** Thành viên chịu trách nhiệm cao nhất về tính chính xác của sơ đồ và ký duyệt biên bản kiểm chứng.
- **C (Consulted):** Thành viên đóng vai trò cố vấn, hỗ trợ đối soát các điểm giao tiếp API hoặc dữ liệu liên đới.
- **I (Informed):** Thành viên nhận thông báo kết quả sau khi hoàn thành.

| Phân hệ / Luồng Nghiệp vụ | Mã Flow | Nguyễn Phạm Xuân Nhi<br>**(WS1: Khách hàng & Đặt chỗ)** | Nguyễn Văn Gia Bình<br>**(WS2: Cơ sở & Vận hành / Tech Lead)** | Huỳnh Nhật<br>**(WS3: Tài chính & Tự động)** | Lê Thanh Tùng<br>**(WS4: Quản trị & Điều phối / Backend Lead)** |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Storage Unit Reservation & Waitlist CRM** | **Flow 1** | **R / A** | C *(FM Allocation)* | C *(VNPay/Cọc)* | I |
| **Check-in, Handover & Auto-Activation** | **Flow 2** | C *(E-Handover UI)* | **R / A** | I | C *(Auto-Activation Scheduler)* |
| **Rented Unit Mgmt, Win-Win Early Return** | **Flow 3** | C *(My Units UI)* | **R / A** | C *(Refund/Deposit)* | I |
| **BOM Policy, Master Unit Type & Revenue** | **Flow 4** | I | C *(Facility Prices)* | **R / A** | C *(System Auditing)* |
| **Facility Storage & Staff Dispatching** | **Flow 5** | I | C *(Unit Status)* | I | **R / A** |
| **Storage Renewal UI (Tự gia hạn online)** | **Flow 6.1** | **R / A** | C *(Late Exception)* | C *(Payment)* | I |
| **Overdue Lifecycle & Cronjob (D+1..D+10)** | **Flow 6.2** | I | C *(Kho niêm phong)* | **R / A** | C *(Khóa Access Code)* |
| **Support Request, Damage & Unit Swap** | **Flow 7** | C *(Ticket UI)* | C *(Staff on-site)* | I | **R / A** |
| **JWT Security, RBAC Multi-Facility & Cron** | **Flow SYS** | C *(Protected Route)* | C *(Facility Security)* | C *(Cron Config)* | **R / A** |

---

## 3. Bộ 5 Chốt Chặn Chống Bẫy Thực Chiến (Anti-Traps Guardrails)

Để đảm bảo toàn bộ sơ đồ được tạo ra bởi skill `/archify` phản ánh chính xác 100% mã nguồn thực tế đang chạy và không bị gãy vỡ khi kiểm thử tự động, Lead Architect thiết lập **Bộ 5 Chốt chặn Thép** bắt buộc toàn bộ thành viên và Sub-agents phải tuân thủ:

1. **Chống bẫy "Happy-Path-Only":** Bắt buộc mỗi sơ đồ Workflow / Sequence phải thể hiện ít nhất 2 nhánh rẽ Ngoại lệ (Exception / Error / Alternative Path) — ví dụ: hết kho vào Waitlist, ô hỏng đổi ô khác, hủy cọc phạt tiền, quá hạn D+4 tính phạt. CẤM chỉ vẽ một đường thẳng màu hồng mà bỏ qua các trường hợp xử lý lỗi thực tế trong code.
2. **Chống bẫy "Mù tác vụ nền & Bất đồng bộ":** Nếu luồng có yếu tố thời gian hoặc tiền bạc, bắt buộc phải truy vết Cron job (`@Scheduled`) và Webhook bên thứ 3 (chú ý Webhook PayOS chạy bất đồng bộ, không có SecurityContext của user).
3. **Chống bẫy "Nhầm Mock/Log với Production Gateway":** "Code viết sao, vẽ y như vậy". Nếu tính năng gửi SMS/Email chỉ mới là `log.info(...)`, hoặc Payment dùng Mock stub, bắt buộc phải ghi nhãn `[Console Log / Mock Stub]`, cấm tự bịa ra dịch vụ bên ngoài (Twilio, Viettel SMS).
4. **Chống bẫy "Lệch số dòng do sửa dở (Line Drift)":** Số dòng trong `sources` bắt buộc phải trích xuất từ commit sạch `e9b1e80...` (hoặc `git status` clean), không trích dẫn dòng trên file đang sửa dở dang chưa commit kẻo Archify finalize báo lỗi out-of-bounds do lệch commit SHA được ghim.
5. **Chống bẫy "Sập Viewport (Layout Explosion)":** Giới hạn tối đa 6–8 bước trên 1 hàng ngang (`row: 0`). Mọi nhánh rẽ ngoại lệ, fallback, hoặc bước sau đó phải ngắt dòng xuống `row: 1`, `row: 2` hoặc chia Group/Boundary rõ ràng.

---

## 4. Trọn bộ Sub-prompts Giao việc cho 7 Luồng Nghiệp vụ & Flow SYS

Dưới đây là 8 bản hợp đồng giao việc (Task Briefs) hoàn chỉnh, tương ứng với 7 luồng nghiệp vụ và 1 luồng hệ thống. Mỗi bản đều được thiết kế độc lập, phân định rõ người phụ trách theo ma trận RACI và phạm vi mã nguồn làm chủ, sẵn sàng copy-paste trực tiếp giao cho Worker Subagents.

---

### 4.1. Sub-prompt Flow 1: Storage Unit Reservation & Waitlist CRM (Xuân Nhi — WS1)

```markdown
> **Người phụ trách chính (Assignee):** **Nguyễn Phạm Xuân Nhi** (WS1 — Khách hàng & Đặt chỗ)  
> **Phạm vi mã nguồn làm chủ:**  
> - **Backend Package:** `com.swp391.selfstorage.reservation.*`, `com.swp391.selfstorage.waitlist.*`  
> - **Frontend Feature:** `frontend/src/features/customer/*` (Unit Picker, Booking, Waitlist Modal)  
> - **Bảng CSDL cốt lõi:** `reservation`, `reservation_item`, `waitlist_entry`

Bạn là **Senior Fullstack Engineer (WS1)** phụ trách điều tra mã nguồn thực tế của **Flow 1: Storage Unit Reservation Flow (Đặt chỗ ô kho & Danh sách chờ Waitlist CRM)**.
Nhiệm vụ của bạn là khảo sát toàn bộ mã nguồn thực tế từ Frontend đến Backend CSDL và sử dụng skill `/archify` để tạo ra bộ sơ đồ kỹ thuật phản ánh chính xác 100% cách hệ thống đang vận hành.

---

### 1. PHẠM VI NGHIỆP VỤ & TÀI LIỆU ĐỐI CHIẾU
- **Tài liệu lý thuyết:** `docs/WORKFLOWS.md § 2`, `docs/TOPIC.md § 4 (Flow 1)`, `docs/SPEC-WAITLIST-RENEWAL-UNITTYPE-REDESIGN.md`.
- **Mã yêu cầu & Quy tắc nghiệp vụ:** `SC-01`, `SC-02`, `SC-03`, `FM-02`; `BR-RES-01..06`, `BR-AVL-01..05`, `BR-PRI-01..04`, `BR-PAY-01..06`, `BR-DEP-01..06`, `BR-CAN-01..05`.
- **Loại sơ đồ Archify bắt buộc:**
  1. `workflow`: Thể hiện toàn trình quy trình từ lúc khách xem danh mục -> chọn Unit Type -> kiểm tra hạn ngạch -> tạm giữ 48h -> thanh toán Deposit/tiền thuê -> Confirmed -> FM Late-binding gán ô kho vật lý -> và luồng nhánh rẽ Waitlist CRM khi hết kho trống.
  2. `sequence`: Thể hiện chuỗi tương tác HTTP API, PayOS/VietQR Webhook, và giao dịch CSDL khi khách hàng đặt chỗ và thanh toán.

---

### 2. CHECKLIST ĐIỀU TRA MÃ NGUỒN 5 TẦNG BẮT BUỘC (GHI LẠI FILE & DÒNG)
Bạn BẮT BUỘC phải mở đọc từng file sau để lấy line range và xác thực logic:
- [x] **Tầng 1 (Frontend):**
  - Màn hình duyệt kho: `frontend/src/features/customer/pages/UnitPickerPage.tsx#L47-L83`, `HomePage.tsx`.
  - Màn hình đặt chỗ & tính chi phí: `frontend/src/features/customer/pages/BookingPage.tsx#L326-L350`, `#L522-L585`.
  - Modal danh sách chờ Waitlist: `frontend/src/features/customer/components/WaitlistRegistrationModal.tsx#L87-L130`.
  - Màn hình FM Waitlist CRM: `frontend/src/features/manager/WaitlistInboxPage.tsx#L1-L240`.
  - Modal FM phân bổ ô kho (Allocation): `frontend/src/features/manager/pages/AllocationPage.tsx#L173-L205`.
- [x] **Tầng 2 (Security):**
  - Kiểm tra quyền hạn `@PreAuthorize` và phân quyền FM theo cơ sở (`FacilitySecurityService`) tại `ReservationController.java` và `WaitlistController.java`.
- [x] **Tầng 3 (REST Controller & DTOs):**
  - `backend/src/main/java/com/swp391/selfstorage/reservation/ReservationController.java#L40-L105`.
  - `backend/src/main/java/com/swp391/selfstorage/waitlist/WaitlistController.java#L38-L112`.
  - Các DTO: `CreateReservationRequest`, `ReservationResponse`, `CalculatePriceResponse`, `WaitlistRegistrationRequest`.
- [x] **Tầng 4 (Service & Business Rules):**
  - `ReservationServiceImpl.java`: Logic tính tiền thuê, phí bảo hiểm (+50k/tháng), tiền cọc, kiểm tra cửa sổ 30 ngày (`BR-RES-01#L285-L340`), cơ chế dời ngày (`BR-RES-06#L460-L520`), hủy đặt chỗ 3 tầng (`BR-CAN-01..03#L525-L585`), và hàm phân bổ ô `assignUnit#L674-L799`.
  - `WaitlistServiceImpl.java`: Logic xếp hàng FIFO, kiểm tra số điện thoại, khóa độc quyền 2h cho Telesales (`BR-WAT-02#L188-L210`), và chuyển đổi đặt chỗ (`BR-WAT-03#L215-L290`).
  - `AvailabilityServiceImpl.java`: Thuật toán kiểm tra capacity trống theo từng ngày và đệm an toàn 15 ngày (`BR-AVL-01..04#L115-L135`).
- [x] **Tầng 5 (Persistence & DB Migrations):**
  - Entities: `Reservation.java`, `ReservationItem.java`, `WaitlistEntry.java`, `StorageUnit.java`.
  - Flyway Migrations: `V1__init_postgres_schema.sql`, `V10__add_waitlist_and_unittype_sku.sql`, `V12__add_daily_cancel_throttle_to_app_user.sql`, `V13__add_waitlist_contact_phone.sql`.

---

### 3. RÀNG BUỘC KỸ THUẬT VỚI SKILL `/archify`
- **Nguyên tắc "No Evidence, No Diagram":**
  + Mỗi node/bước trong `candidate.json` PHẢI chứa thuộc tính `sources` trích dẫn chính xác file path và line range (ví dụ: `backend/src/main/java/com/swp391/selfstorage/reservation/service/impl/ReservationServiceImpl.java#L85-L120`).
  + Thiết lập `meta.repository`: ghim commit `e9b1e80eeca31117193655839a1ca52cfe9a09dc`, URL `https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System.git`, và `link_mode: "local-only"`.
- **Thư mục lưu trữ:** Tạo thư mục riêng `.archify/workflow-flow1-reservation-<YYYYMMDD-HHMMSS>/` cho file `candidate.json` và HTML đầu ra.
- **Lệnh nghiệm thu bắt buộc:**
  + Chạy: `node .agents/skills/archify/bin/archify.mjs finalize workflow .archify/workflow-flow1-reservation-.../candidate.json .archify/workflow-flow1-reservation-.../flow1-reservation.html --repo-root . --quality showcase --json`
  + Lệnh bắt buộc phải exit code = 0 và vượt qua 4 chốt chặn (`validate`, `deliver`, `check`, `browser-check`).

---

### 4. ĐẦU RA BẮT BUỘC:
1. Đường dẫn file HTML tương tác độc lập đã qua finalize.
2. Báo cáo Độ lệch Mã nguồn (Drift Report): Chỉ rõ các điểm mã nguồn chưa khớp với `docs/WORKFLOWS.md` (nếu có).

---

### ⚠️ QUY TẮC RÀ SOÁT MÃ NGUỒN & 5 CHỐT CHẶN CHỐNG BẪY THỰC CHIẾN:
1. **Checklist chỉ là Điểm Neo (Anchors):** Chạy `Get-ChildItem` quét toàn bộ thư mục package được giao, lần theo `import` và `call sites` tìm hết file vệ tinh (hooks, mappers, sub-components).
2. **Sàng lọc Code Chết (Dead Code Filter):** File/class không có caller hoặc Mock cũ bỏ hoang -> TUYỆT ĐỐI KHÔNG VẼ VÀO SƠ ĐỒ CHÍNH, chỉ ghi vào bảng "Danh sách Mã nguồn Chết tại tài liệu này".
3. **Cấm chỉ vẽ Happy Path (Anti-Happy-Path-Only):** Bắt buộc sơ đồ phải có ít nhất 2 nhánh rẽ ngoại lệ/xử lý lỗi (Exception Paths) của luồng nếu có và phải cover hết được các nhánh rẽ.
4. **Truy vết Tác vụ Nền & Webhook:** Phải chỉ ra Cronjob (`@Scheduled`) hoặc Webhook Controller xử lý bất đồng bộ nếu luồng có tính trạng thái theo thời gian hoặc thanh toán.
5. **Thực tế hóa Mock / Console Log:** Nếu code gửi SMS/Email chỉ mới là `log.info(...)` hoặc thanh toán Mock, phải ghi rõ nhãn `[Console Log / Mock]`, không vẽ dịch vụ bên ngoài chưa tích hợp.
6. **Kỷ luật Số dòng Commit Sạch:** Lấy line range đối chiếu với commit sạch `e9b1e80...`, tránh lệch dòng làm fail lệnh Archify finalize.
7. **Kiểm soát Viewport Archify:** Tối đa 6–8 bước trên 1 hàng ngang; đưa các nhánh xử lý lỗi xuống `row: 1`, `row: 2` để tránh sập layout và lỗi crossover.
```

---

### 4.2. Sub-prompt Flow 2: Check-in, Handover & Auto-Activation (Gia Bình — WS2)

```markdown
> **Người phụ trách chính (Assignee):** **Nguyễn Văn Gia Bình** (WS2 — Cơ sở, Kho & Vận hành / Technical Lead)  
> **Phạm vi mã nguồn làm chủ:**  
> - **Backend Package:** `com.swp391.selfstorage.facility.*`, `com.swp391.selfstorage.unit.*`, `com.swp391.selfstorage.contract.*`  
> - **Frontend Feature:** `frontend/src/features/staff/*` (Check-in Desk, Handover Form, Unit Status)  
> - **Bảng CSDL cốt lõi:** `facility`, `storage_unit`, `rental_contract`, `inspection`

Bạn là **Senior Fullstack Engineer & Tech Lead (WS2)** phụ trách điều tra mã nguồn thực tế của **Flow 2: Storage Check-in and Handover Flow (Nhận kho, Bàn giao & Tự động kích hoạt)**.
Nhiệm vụ của bạn là đối soát mã nguồn thực tế và sinh sơ đồ kỹ thuật bằng skill `/archify`.

---

### 1. PHẠM VI NGHIỆP VỤ & TÀI LIỆU ĐỐI CHIẾU
- **Tài liệu lý thuyết:** `docs/WORKFLOWS.md § 3`, `docs/TOPIC.md § 4 (Flow 2)`, `docs/BUSINESS-RULES.md § BR-CHK`.
- **Mã yêu cầu & Quy tắc nghiệp vụ:** `SC-04`, `FS-01`, `FS-02`, `FS-03`, `FM-02`, `FM-05`; `BR-CHK-01..05`, `BR-ACC-01..04`, `BR-CAN-04`.
- **Loại sơ đồ Archify bắt buộc:**
  1. `workflow`: Toàn trình từ lúc khách đến nhận kho (hoặc Digital Move-in online) -> Staff kiểm tra đơn và kiểm tra hiện trường ô kho -> Xử lý sự cố nếu ô bị hỏng (FM đổi ô khác) -> Ký biên bản bàn giao -> Cấp mã PIN điện tử 24/7 -> Kích hoạt hợp đồng `ACTIVE` và ô `OCCUPIED`.
  2. `lifecycle`: Vòng đời trạng thái của `RentalContract` (`PENDING_CHECK_IN` -> `ACTIVE` hoặc tự động chuyển qua `AutoCheckInActivationScheduler`).

---

### 2. CHECKLIST ĐIỀU TRA MÃ NGUỒN 5 TẦNG BẮT BUỘC
- [ ] **Tầng 1 (Frontend):**
  - Màn hình bàn giao nhân viên: `frontend/src/features/staff/CheckInDeskPage.tsx`, `HandoverFormModal.tsx`.
  - Màn hình khách check-in online: `frontend/src/features/customer/DigitalCheckInPage.tsx` hoặc tương đương.
- [ ] **Tầng 2 (Security):**
  - Phân quyền `STAFF` và `MANAGER` tại cơ sở tiếp nhận (`FacilitySecurityService`).
- [ ] **Tầng 3 (REST Controller & DTOs):**
  - `backend/src/main/java/com/swp391/selfstorage/contract/controller/ContractController.java` (các endpoint `/check-in`, `/handover`).
- [ ] **Tầng 4 (Service & Business Rules):**
  - `ContractServiceImpl.java`: Logic xác nhận check-in, cấp mã PIN số, kích hoạt trạng thái hợp đồng, xử lý trường hợp cơ sở hết ô thay thế thì hoàn tiền trong 3 ngày (`BR-CHK-03`).
  - `AutoCheckInActivationScheduler.java`: Logic quét lúc 00:00 hằng ngày, tự kích hoạt hợp đồng và ô kho sau 10 ngày ân hạn (`cutoffDate = LocalDate.now().minusDays(10)`), bảo toàn 100% doanh thu (`BR-CAN-04`, `BR-CHK-05`).
- [ ] **Tầng 5 (Persistence & DB Migrations):**
  - Entities: `RentalContract.java`, `StorageUnit.java`.
  - Migrations: `V6__allow_null_storage_unit_on_pending_contract.sql`, `V7__add_scheduled_checkin_times_to_rental_contract.sql`, `V11__sync_pending_checkin_reservation_status.sql`.

---

### 3. RÀNG BUỘC KỸ THUẬT VỚI SKILL `/archify`
- Mọi node/state phải có thuộc tính `sources` trích dẫn file và line range thực tế.
- Chạy lệnh finalize và nộp kết quả theo chuẩn Archify Showcase.

---

### ⚠️ QUY TẮC RÀ SOÁT MÃ NGUỒN & 5 CHỐT CHẶN CHỐNG BẪY THỰC CHIẾN:
1. **Checklist chỉ là Điểm Neo (Anchors):** Chạy `Get-ChildItem` quét toàn bộ thư mục package được giao, lần theo `import` và `call sites` tìm hết file vệ tinh (hooks, mappers, sub-components).
2. **Sàng lọc Code Chết (Dead Code Filter):** File/class không có caller hoặc Mock cũ bỏ hoang -> TUYỆT ĐỐI KHÔNG VẼ VÀO SƠ ĐỒ CHÍNH, chỉ ghi vào bảng "Danh sách Mã nguồn Chết tại tài liệu này".
3. **Cấm chỉ vẽ Happy Path (Anti-Happy-Path-Only):** Bắt buộc sơ đồ phải có ít nhất 2 nhánh rẽ ngoại lệ/xử lý lỗi (Exception Paths) của luồng nếu có và phải cover hết được các nhánh rẽ.
4. **Truy vết Tác vụ Nền & Webhook:** Phải chỉ ra Cronjob (`@Scheduled`) hoặc Webhook Controller xử lý bất đồng bộ nếu luồng có tính trạng thái theo thời gian hoặc thanh toán.
5. **Thực tế hóa Mock / Console Log:** Nếu code gửi SMS/Email chỉ mới là `log.info(...)` hoặc thanh toán Mock, phải ghi rõ nhãn `[Console Log / Mock]`, không vẽ dịch vụ bên ngoài chưa tích hợp.
6. **Kỷ luật Số dòng Commit Sạch:** Lấy line range đối chiếu với commit sạch `e9b1e80...`, tránh lệch dòng làm fail lệnh Archify finalize.
7. **Kiểm soát Viewport Archify:** Tối đa 6–8 bước trên 1 hàng ngang; đưa các nhánh xử lý lỗi xuống `row: 1`, `row: 2` để tránh sập layout và lỗi crossover.
```

---

### 4.3. Sub-prompt Flow 3: Rented Unit Management, Win-Win Early Return & Settlement (Gia Bình — WS2)

```markdown
> **Người phụ trách chính (Assignee):** **Nguyễn Văn Gia Bình** (WS2 — Cơ sở, Kho & Vận hành / Technical Lead)  
> **Phạm vi mã nguồn làm chủ:**  
> - **Backend Package:** `com.swp391.selfstorage.contract.*`, `com.swp391.selfstorage.unit.*`  
> - **Frontend Feature:** `frontend/src/features/staff/ReturnInspectionPage.tsx`, `frontend/src/features/customer/MyUnitsPage.tsx`  
> - **Bảng CSDL cốt lõi:** `rental_contract`, `inspection`, `storage_unit`

Bạn là **Senior Fullstack Engineer & Tech Lead (WS2)** phụ trách điều tra mã nguồn thực tế của **Flow 3: Rented Storage Unit Management Flow (Quản lý kho đang thuê, Trả kho sớm Win-Win & Quyết toán cọc)**.

---

### 1. PHẠM VI NGHIỆP VỤ & TÀI LIỆU ĐỐI CHIẾU
- **Tài liệu lý thuyết:** `docs/WORKFLOWS.md § 4`, `docs/TOPIC.md § 4 (Flow 3)`, `docs/BUSINESS-RULES.md § BR-RET`.
- **Mã yêu cầu & Quy tắc nghiệp vụ:** `SC-05`, `FS-03`, `FS-04`, `FM-03`, `FM-04`; `BR-RET-01..06`, `BR-DEP-04..06`.
- **Loại sơ đồ Archify bắt buộc:**
  1. `workflow`: Quy trình tự động chuyển sang trả kho trước 1 tháng nếu không gia hạn; quy trình Trả kho sớm Win-Win (`BR-RET-06`); nhân viên nghiệm thu hiện trường (vệ sinh, hư hại) -> Quản lý cơ sở quyết toán hoàn cọc / thu thêm nợ.
  2. `sequence`: Tương tác API và tính toán tài chính giữa Khách hàng, Staff kiểm tra, Manager duyệt quyết toán và CSDL.

---

### 2. CHECKLIST ĐIỀU TRA MÃ NGUỒN 5 TẦNG BẮT BUỘC
- [ ] **Tầng 1 (Frontend):**
  - Quản lý kho của khách: `frontend/src/features/customer/MyUnitsPage.tsx`.
  - Màn hình nhân viên nghiệm thu trả kho: `frontend/src/features/staff/ReturnInspectionPage.tsx`.
  - Màn hình quản lý quyết toán cọc: `frontend/src/features/manager/ContractSettlementPage.tsx`.
- [ ] **Tầng 2 (Security):**
  - Kiểm tra quyền sở hữu hợp đồng của Customer (`@PreAuthorize`) và thẩm quyền phê duyệt hoàn cọc của Manager.
- [ ] **Tầng 3 (REST Controller & DTOs):**
  - `ContractController.java`, `InspectionController.java`.
  - DTOs: `EarlyReturnRequest`, `ReturnInspectionRequest`, `DepositSettlementResponse`.
- [ ] **Tầng 4 (Service & Business Rules):**
  - `ContractServiceImpl.java`: Logic tính toán hoàn tiền thuê ngày chưa dùng + phạt 100% tiền cọc khi trả sớm (`BR-RET-06`), logic quyết toán cọc cấn trừ thiệt hại hư hỏng.
  - `InspectionServiceImpl.java`: Lập biên bản kiểm tra bàn giao trả kho, đánh giá hiện trạng ô kho.
- [ ] **Tầng 5 (Persistence & DB Migrations):**
  - Entities: `RentalContract.java`, `Inspection.java`, `PaymentTransaction.java`.
  - Migrations: `V3__allow_pending_refund_status.sql`, `V4__backfill_payment_transaction_contract_id.sql`.

---

### 3. RÀNG BUỘC KỸ THUẬT VỚI SKILL `/archify`
- Mọi bước tính toán tiền cọc, hoàn tiền, phạt vi phạm phải trích dẫn trực tiếp dòng code thực tế trong Service.
- Chạy finalize và xuất báo cáo độ lệch mã nguồn.

---

### ⚠️ QUY TẮC RÀ SOÁT MÃ NGUỒN & 5 CHỐT CHẶN CHỐNG BẪY THỰC CHIẾN:
1. **Checklist chỉ là Điểm Neo (Anchors):** Chạy `Get-ChildItem` quét toàn bộ thư mục package được giao, lần theo `import` và `call sites` tìm hết file vệ tinh (hooks, mappers, sub-components).
2. **Sàng lọc Code Chết (Dead Code Filter):** File/class không có caller hoặc Mock cũ bỏ hoang -> TUYỆT ĐỐI KHÔNG VẼ VÀO SƠ ĐỒ CHÍNH, chỉ ghi vào bảng "Danh sách Mã nguồn Chết tại tài liệu này".
3. **Cấm chỉ vẽ Happy Path (Anti-Happy-Path-Only):** Bắt buộc sơ đồ phải có ít nhất 2 nhánh rẽ ngoại lệ/xử lý lỗi (Exception Paths) của luồng nếu có và phải cover hết được các nhánh rẽ.
4. **Truy vết Tác vụ Nền & Webhook:** Phải chỉ ra Cronjob (`@Scheduled`) hoặc Webhook Controller xử lý bất đồng bộ nếu luồng có tính trạng thái theo thời gian hoặc thanh toán.
5. **Thực tế hóa Mock / Console Log:** Nếu code gửi SMS/Email chỉ mới là `log.info(...)` hoặc thanh toán Mock, phải ghi rõ nhãn `[Console Log / Mock]`, không vẽ dịch vụ bên ngoài chưa tích hợp.
6. **Kỷ luật Số dòng Commit Sạch:** Lấy line range đối chiếu với commit sạch `e9b1e80...`, tránh lệch dòng làm fail lệnh Archify finalize.
7. **Kiểm soát Viewport Archify:** Tối đa 6–8 bước trên 1 hàng ngang; đưa các nhánh xử lý lỗi xuống `row: 1`, `row: 2` để tránh sập layout và lỗi crossover.
```

---

### 4.4. Sub-prompt Flow 4: BOM Policy, Master Unit Type Catalog & Revenue Monitoring (Huỳnh Nhật — WS3)

```markdown
> **Người phụ trách chính (Assignee):** **Huỳnh Nhật** (WS3 — Tài chính & Tự động hóa)  
> **Phạm vi mã nguồn làm chủ:**  
> - **Backend Package:** `com.swp391.selfstorage.policy.*`, `com.swp391.selfstorage.payment.*`, `com.swp391.selfstorage.report.*`  
> - **Frontend Feature:** `frontend/src/features/bom/*`, `frontend/src/features/pricing/*`  
> - **Bảng CSDL cốt lõi:** `pricing_rule`, `payment_transaction`, `pricing_rule_version`

Bạn là **Senior Fullstack Engineer (WS3)** phụ trách điều tra mã nguồn thực tế của **Flow 4: Business Rules, Fee Management, and Revenue Monitoring Flow (Chính sách BOM, Danh mục Kiểu kho Master & Báo cáo Doanh thu)**.

---

### 1. PHẠM VI NGHIỆP VỤ & TÀI LIỆU ĐỐI CHIẾU
- **Tài liệu lý thuyết:** `docs/WORKFLOWS.md § 5`, `docs/TOPIC.md § 4 (Flow 4)`, `docs/BUSINESS-RULES.md § BR-PRI`.
- **Mã yêu cầu & Quy tắc nghiệp vụ:** `BM-01`, `BM-02`, `BM-03`, `BM-04`, `BM-05`; `BR-PRI-01..04`, `BR-DEP-01..03`.
- **Loại sơ đồ Archify bắt buộc:**
  1. `architecture`: Cấu trúc phân tầng và ranh giới quản lý của BOM (Master Unit Type Catalog, Bảng giá Base vs Facility Override, Quản lý chính sách toàn hệ thống).
  2. `dataflow`: Dòng chảy dữ liệu thống kê từ các giao dịch thanh toán và hợp đồng -> tổng hợp Doanh thu & Tỷ lệ lấp đầy (`Usage Rate`) toàn hệ thống.

---

### 2. CHECKLIST ĐIỀU TRA MÃ NGUỒN 5 TẦNG BẮT BUỘC
- [ ] **Tầng 1 (Frontend):**
  - Quản lý danh mục kiểu kho: `frontend/src/features/bom/UnitTypeMasterPage.tsx`.
  - Cấu hình bảng giá & chính sách: `frontend/src/features/bom/PricingPolicyPage.tsx`.
  - Dashboard doanh thu & lấp đầy: `frontend/src/features/bom/SystemRevenueDashboardPage.tsx`.
- [ ] **Tầng 2 (Security):**
  - Kiểm tra vai trò bắt buộc `ROLE_BOM` (`Business Operations Manager`) trên các endpoint quản trị.
- [ ] **Tầng 3 (REST Controller & DTOs):**
  - `backend/src/main/java/com/swp391/selfstorage/policy/controller/PolicyController.java`.
  - `backend/src/main/java/com/swp391/selfstorage/report/controller/ReportController.java`.
  - `backend/src/main/java/com/swp391/selfstorage/unit/controller/UnitTypeController.java`.
- [ ] **Tầng 4 (Service & Business Rules):**
  - `PolicyServiceImpl.java`: Cấu hình giá m², tỷ lệ đặt cọc, snapshot bảng giá bất biến khi ký hợp đồng (`BR-PRI-01`).
  - `ReportServiceImpl.java`: Công thức tính doanh thu thực thu, doanh thu dự kiến, và tỷ lệ sử dụng kho `Usage Rate = (Occupied Units / Total Active Units) * 100%`.
- [ ] **Tầng 5 (Persistence & DB Migrations):**
  - Entities: `PricingRule.java`, `UnitType.java`, `PaymentTransaction.java`.
  - Migrations: `V9__sync_facility_unit_type_prices_from_versions.sql`, `V10__add_waitlist_and_unittype_sku.sql`.

---

### 3. RÀNG BUỘC KỸ THUẬT VỚI SKILL `/archify`
- Mọi node thành phần và pipeline dữ liệu phải trích dẫn dòng code thật.
- Chạy finalize và nộp kết quả theo chuẩn Archify Showcase.

---

### ⚠️ QUY TẮC RÀ SOÁT MÃ NGUỒN & 5 CHỐT CHẶN CHỐNG BẪY THỰC CHIẾN:
1. **Checklist chỉ là Điểm Neo (Anchors):** Chạy `Get-ChildItem` quét toàn bộ thư mục package được giao, lần theo `import` và `call sites` tìm hết file vệ tinh (hooks, mappers, sub-components).
2. **Sàng lọc Code Chết (Dead Code Filter):** File/class không có caller hoặc Mock cũ bỏ hoang -> TUYỆT ĐỐI KHÔNG VẼ VÀO SƠ ĐỒ CHÍNH, chỉ ghi vào bảng "Danh sách Mã nguồn Chết tại tài liệu này".
3. **Cấm chỉ vẽ Happy Path (Anti-Happy-Path-Only):** Bắt buộc sơ đồ phải có ít nhất 2 nhánh rẽ ngoại lệ/xử lý lỗi (Exception Paths) của luồng nếu có và phải cover hết được các nhánh rẽ.
4. **Truy vết Tác vụ Nền & Webhook:** Phải chỉ ra Cronjob (`@Scheduled`) hoặc Webhook Controller xử lý bất đồng bộ nếu luồng có tính trạng thái theo thời gian hoặc thanh toán.
5. **Thực tế hóa Mock / Console Log:** Nếu code gửi SMS/Email chỉ mới là `log.info(...)` hoặc thanh toán Mock, phải ghi rõ nhãn `[Console Log / Mock]`, không vẽ dịch vụ bên ngoài chưa tích hợp.
6. **Kỷ luật Số dòng Commit Sạch:** Lấy line range đối chiếu với commit sạch `e9b1e80...`, tránh lệch dòng làm fail lệnh Archify finalize.
7. **Kiểm soát Viewport Archify:** Tối đa 6–8 bước trên 1 hàng ngang; đưa các nhánh xử lý lỗi xuống `row: 1`, `row: 2` để tránh sập layout và lỗi crossover.
```

---

### 4.5. Sub-prompt Flow 5: Facility Storage Allocation & Staff Dispatching (Lê Thanh Tùng — WS4)

```markdown
> **Người phụ trách chính (Assignee):** **Lê Thanh Tùng** (WS4 — Quản trị, Điều phối & Backend Lead)  
> **Phạm vi mã nguồn làm chủ:**  
> - **Backend Package:** `com.swp391.selfstorage.user.*`, `com.swp391.selfstorage.facility.*`  
> - **Frontend Feature:** `frontend/src/features/manager/*`, `frontend/src/features/admin/*`  
> - **Bảng CSDL cốt lõi:** `app_user`, `user_facility_assignment`, `facility`

Bạn là **Senior Fullstack & Backend Lead (WS4)** phụ trách điều tra mã nguồn thực tế của **Flow 5: Facility Storage and Staff Management Flow (Quản lý Ô kho tại Cơ sở & Phân công Nhân sự)**.

---

### 1. PHẠM VI NGHIỆP VỤ & TÀI LIỆU ĐỐI CHIẾU
- **Tài liệu lý thuyết:** `docs/WORKFLOWS.md § 6`, `docs/TOPIC.md § 4 (Flow 5)`.
- **Mã yêu cầu & Quy tắc nghiệp vụ:** `FM-01`, `FM-05`, `FM-06`, `FS-06`, `BM-01`, `SA-02`, `SA-03`.
- **Loại sơ đồ Archify bắt buộc:**
  1. `workflow`: Quy trình FM khởi tạo danh sách Storage Unit từ Unit Type Master của BOM -> phân công công việc ca trực (Check-in, Nghiệm thu, Sự cố) cho Staff trong ngày -> Staff nhận việc và báo cáo hoàn thành.
  2. `tree`: Sơ đồ cây phân cấp quản lý thực tế trong CSDL: `System -> Facility -> Zone/Floor -> Storage Unit (Physical) & Staff Assignment`.

---

### 2. CHECKLIST ĐIỀU TRA MÃ NGUỒN 5 TẦNG BẮT BUỘC
- [ ] **Tầng 1 (Frontend):**
  - Màn hình sơ đồ kho & trạng thái ô kho: `frontend/src/features/manager/FacilityUnitsPage.tsx`.
  - Màn hình phân công công việc nhân viên: `frontend/src/features/manager/StaffAssignmentPage.tsx`.
  - Bàn làm việc công việc hằng ngày của nhân viên: `frontend/src/features/staff/StaffDailyTasksPage.tsx`.
- [ ] **Tầng 2 (Security):**
  - Kiểm tra `FacilitySecurityService`: FM chỉ được quản lý ô kho và nhân sự thuộc cơ sở mình phụ trách (`user_facility_assignment`).
- [ ] **Tầng 3 (REST Controller & DTOs):**
  - `FacilityController.java`, `StorageUnitController.java`, `UserController.java`.
- [ ] **Tầng 4 (Service & Business Rules):**
  - `StorageUnitServiceImpl.java`: Logic khởi tạo ô kho, cập nhật trạng thái ô kho (`AVAILABLE`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`, `INACTIVE`), ràng buộc không cho xóa vật lý (Soft Delete).
  - `UserServiceImpl.java` / `StaffAssignmentServiceImpl`: Logic gán ca trực và giao việc.
- [ ] **Tầng 5 (Persistence & DB Migrations):**
  - Entities: `Facility.java`, `StorageUnit.java`, `AppUser.java`, `UserFacilityAssignment.java`.
  - Migrations: `V1__init_postgres_schema.sql`, `V8__add_performance_indexes.sql`.

---

### 3. RÀNG BUỘC KỸ THUẬT VỚI SKILL `/archify`
- Mọi node trong sơ đồ phải có sources trích dẫn chính xác.
- Chạy finalize và nộp kết quả theo chuẩn Archify Showcase.

---

### ⚠️ QUY TẮC RÀ SOÁT MÃ NGUỒN & 5 CHỐT CHẶN CHỐNG BẪY THỰC CHIẾN:
1. **Checklist chỉ là Điểm Neo (Anchors):** Chạy `Get-ChildItem` quét toàn bộ thư mục package được giao, lần theo `import` và `call sites` tìm hết file vệ tinh (hooks, mappers, sub-components).
2. **Sàng lọc Code Chết (Dead Code Filter):** File/class không có caller hoặc Mock cũ bỏ hoang -> TUYỆT ĐỐI KHÔNG VẼ VÀO SƠ ĐỒ CHÍNH, chỉ ghi vào bảng "Danh sách Mã nguồn Chết tại tài liệu này".
3. **Cấm chỉ vẽ Happy Path (Anti-Happy-Path-Only):** Bắt buộc sơ đồ phải có ít nhất 2 nhánh rẽ ngoại lệ/xử lý lỗi (Exception Paths) của luồng nếu có và phải cover hết được các nhánh rẽ.
4. **Truy vết Tác vụ Nền & Webhook:** Phải chỉ ra Cronjob (`@Scheduled`) hoặc Webhook Controller xử lý bất đồng bộ nếu luồng có tính trạng thái theo thời gian hoặc thanh toán.
5. **Thực tế hóa Mock / Console Log:** Nếu code gửi SMS/Email chỉ mới là `log.info(...)` hoặc thanh toán Mock, phải ghi rõ nhãn `[Console Log / Mock]`, không vẽ dịch vụ bên ngoài chưa tích hợp.
6. **Kỷ luật Số dòng Commit Sạch:** Lấy line range đối chiếu với commit sạch `e9b1e80...`, tránh lệch dòng làm fail lệnh Archify finalize.
7. **Kiểm soát Viewport Archify:** Tối đa 6–8 bước trên 1 hàng ngang; đưa các nhánh xử lý lỗi xuống `row: 1`, `row: 2` để tránh sập layout và lỗi crossover.
```

---

### 4.6. Sub-prompt Flow 6: Renewal T-20 & Overdue Lifecycle (Xuân Nhi — WS1 & Huỳnh Nhật — WS3)

```markdown
> **Người phụ trách chính (Assignee):**  
> - **Sub-flow 6.1 (Gia hạn trực tuyến):** **Nguyễn Phạm Xuân Nhi** (WS1 — Khách hàng & Đặt chỗ)  
> - **Sub-flow 6.2 (Xử lý Quá hạn & Cronjob):** **Huỳnh Nhật** (WS3 — Tài chính & Tự động hóa)  
> **Phạm vi mã nguồn làm chủ:**  
> - **Backend Package:** `com.swp391.selfstorage.contract.*` (Renewal), `com.swp391.selfstorage.policy.scheduler.*`, `com.swp391.selfstorage.policy.service.*`  
> - **Frontend Feature:** `frontend/src/features/customer/RenewalModal.tsx`, `frontend/src/features/manager/OverdueContractsPage.tsx`  
> - **Bảng CSDL cốt lõi:** `rental_contract`, `overdue_log`, `payment_transaction`

Bạn là **Senior Fullstack Engineer (WS1/WS3)** phụ trách điều tra mã nguồn thực tế của **Flow 6: Storage Renewal and Overdue Handling Flow (Gia hạn Hợp đồng & Xử lý Quá hạn)**.

---

### 1. PHẠM VI NGHIỆP VỤ & TÀI LIỆU ĐỐI CHIẾU
- **Tài liệu lý thuyết:** `docs/WORKFLOWS.md § 7`, `docs/TOPIC.md § 5 (Flow 6)`, `docs/BUSINESS-RULES.md § BR-REN, BR-OVD`.
- **Mã yêu cầu & Quy tắc nghiệp vụ:** `SC-03`, `SC-05`, `FM-03`, `FM-04`, `FM-06`, `BM-02`, `BM-03`; `BR-REN-01..05`, `BR-OVD-01..06`.
- **Loại sơ đồ Archify bắt buộc:**
  1. `workflow`: Thể hiện Sub-flow 6.1 (Gia hạn tự phục vụ trước T-20 ngày, khóa quyền sau T-20 và quy trình FM duyệt ngoại lệ + phí 200k) và cơ chế Late-binding bumping nếu có xung đột kho.
  2. `lifecycle`: Chuỗi trạng thái hợp đồng và ô kho trong Sub-flow 6.2 từ ngày đáo hạn (D+0) -> Ân hạn 3 ngày (D+1..D+3) -> Phạt 10% tiền cọc mỗi ngày (D+4..D+10) -> Chấm dứt hợp đồng, khóa mã PIN và niêm phong kho (sau D+10).

---

### 2. CHECKLIST ĐIỀU TRA MÃ NGUỒN 5 TẦNG BẮT BUỘC
- [x] **Tầng 1 (Frontend):**
  - Màn hình gia hạn hợp đồng của khách: `frontend/src/features/customer/pages/RenewalPage.tsx#L60-L95`, `RenewalExpiryBanner.tsx#L204-L231`.
  - Màn hình kiểm tra nợ & đối soát thanh toán gia hạn: `frontend/src/features/customer/hooks/useRenewalPricing.ts#L35-L68`, `useRenewalPayment.ts#L95-L130`.
  - Bảng theo dõi nợ quá hạn BOM / FM: `frontend/src/features/bom/components/OverdueContractsTable.tsx#L1-L180`.
- [x] **Tầng 2 (Security):**
  - Auth Guard kiểm tra JWT Token tại `RenewalPage.tsx#L50-L56`, phân quyền Manager theo cơ sở tại các endpoint liên quan.
- [x] **Tầng 3 (REST Controller & DTOs):**
  - `ContractRenewalController.java#L38-L70` (`POST /contracts/{id}/renewals/quote`, `POST /contracts/{id}/renewals`, `GET /{id}/renewals`).
  - Các DTO: `RenewalRequest`, `RenewalQuoteResponse`, `RenewalResponse`.
- [x] **Tầng 4 (Service & Business Rules):**
  - `RenewalServiceImpl.java#L69-L76` (Khóa tự gia hạn khi qua mốc T-20 `BR-REN-01..09`), `#L92-L109` (Check trùng lịch `BR-REN-03`), `#L111-L122` (Snapshot giá `BR-REN-05`), `#L146-L150` (Khôi phục ACTIVE sau khi tất toán nợ quá hạn `BR-REN-06`).
  - `OverdueProcessingServiceImpl.java#L93-L107` (Ân hạn 3 ngày `BR-OVD-01..02`), `#L108-L124` (Phạt 10% cọc/ngày `BR-OVD-02`), `#L125-L131` (Khóa mã PIN tại D+7 `BR-OVD-05`), `#L132-L160` (Chấm dứt cưỡng chế & niêm phong kho tại D+10 `BR-OVD-07`).
  - `OverdueCronJob.java#L25-L40`: Cronjob chạy tự động `00:00:00` hàng ngày (`Asia/Ho_Chi_Minh`) gọi `processOverdueContracts()`.
- [x] **Tầng 5 (Persistence & DB Migrations):**
  - Entities: `RentalContract.java`, `ContractRenewal.java`, `StorageUnit.java`.
  - Migrations: `V1__init_postgres_schema.sql`, `V18__allow_contract_renewal_in_payment_transaction.sql`, `V29__store_renewal_months_on_payment.sql`.

---

### 3. RÀNG BUỘC KỸ THUẬT VỚI SKILL `/archify`
- Trích dẫn chính xác logic tính toán phạt của cron job và kiểm tra ngày hiệu lực.
- Chạy finalize và nộp kết quả theo chuẩn Archify Showcase.

---

### ⚠️ QUY TẮC RÀ SOÁT MÃ NGUỒN & 5 CHỐT CHẶN CHỐNG BẪY THỰC CHIẾN:
1. **Checklist chỉ là Điểm Neo (Anchors):** Chạy `Get-ChildItem` quét toàn bộ thư mục package được giao, lần theo `import` và `call sites` tìm hết file vệ tinh (hooks, mappers, sub-components).
2. **Sàng lọc Code Chết (Dead Code Filter):** File/class không có caller hoặc Mock cũ bỏ hoang -> TUYỆT ĐỐI KHÔNG VẼ VÀO SƠ ĐỒ CHÍNH, chỉ ghi vào bảng "Danh sách Mã nguồn Chết tại tài liệu này".
3. **Cấm chỉ vẽ Happy Path (Anti-Happy-Path-Only):** Bắt buộc sơ đồ phải có ít nhất 2 nhánh rẽ ngoại lệ/xử lý lỗi (Exception Paths) của luồng nếu có và phải cover hết được các nhánh rẽ.
4. **Truy vết Tác vụ Nền & Webhook:** Phải chỉ ra Cronjob (`@Scheduled`) hoặc Webhook Controller xử lý bất đồng bộ nếu luồng có tính trạng thái theo thời gian hoặc thanh toán.
5. **Thực tế hóa Mock / Console Log:** Nếu code gửi SMS/Email chỉ mới là `log.info(...)` hoặc thanh toán Mock, phải ghi rõ nhãn `[Console Log / Mock]`, không vẽ dịch vụ bên ngoài chưa tích hợp.
6. **Kỷ luật Số dòng Commit Sạch:** Lấy line range đối chiếu với commit sạch `e9b1e80...`, tránh lệch dòng làm fail lệnh Archify finalize.
7. **Kiểm soát Viewport Archify:** Tối đa 6–8 bước trên 1 hàng ngang; đưa các nhánh xử lý lỗi xuống `row: 1`, `row: 2` để tránh sập layout và lỗi crossover.
```

---

### 4.7. Sub-prompt Flow 7: Support Ticket, Damage Compensation & Unit Swap (Lê Thanh Tùng — WS4)

```markdown
> **Người phụ trách chính (Assignee):** **Lê Thanh Tùng** (WS4 — Quản trị, Điều phối & Backend Lead)  
> **Phạm vi mã nguồn làm chủ:**  
> - **Backend Package:** `com.swp391.selfstorage.support.*`  
> - **Frontend Feature:** `frontend/src/features/manager/IncidentManagementPage.tsx`, `frontend/src/features/customer/CreateSupportTicketPage.tsx`  
> - **Bảng CSDL cốt lõi:** `support_request`, `activity_log`

Bạn là **Senior Fullstack & Backend Lead (WS4)** phụ trách điều tra mã nguồn thực tế của **Flow 7: Support Request and Issue Handling Flow (Yêu cầu Hỗ trợ & Xử lý Sự cố)**.

---

### 1. PHẠM VI NGHIỆP VỤ & TÀI LIỆU ĐỐI CHIẾU
- **Tài liệu lý thuyết:** `docs/WORKFLOWS.md § 8`, `docs/TOPIC.md § 5 (Flow 7)`, `docs/BUSINESS-RULES.md § BR-SUP`.
- **Mã yêu cầu & Quy tắc nghiệp vụ:** `SC-06`, `FS-03`, `FS-05`, `FM-05`; `BR-SUP-01..05`.
- **Loại sơ đồ Archify bắt buộc:**
  1. `workflow`: Khách tạo ticket sự cố (quên PIN, hỏng khóa, ẩm dột) -> FM tiếp nhận & phân công Staff -> Staff xử lý hiện trường (miễn phí lỗi cơ sở hoặc tính phí nếu lỗi do khách) -> Nghiệm thu đóng ticket.
  2. `sequence`: Trình tự cấp lại mã PIN điện tử tức thời hoặc quy trình bồi thường thiệt hại hàng hóa (gói mặc định 10M vs gói bảo vệ mở rộng 50M theo `BR-SUP-04`).

---

### 2. CHECKLIST ĐIỀU TRA MÃ NGUỒN 5 TẦNG BẮT BUỘC
- [ ] **Tầng 1 (Frontend):**
  - Form gửi ticket của khách: `frontend/src/features/customer/CreateSupportTicketPage.tsx`.
  - Bàn điều phối sự cố của FM: `frontend/src/features/manager/IncidentManagementPage.tsx`.
  - Màn hình tiếp nhận và xử lý sự cố của Staff: `frontend/src/features/staff/StaffTicketProcessingPage.tsx`.
- [ ] **Tầng 2 (Security):**
  - Phân quyền xử lý ticket theo cơ sở của Staff và Manager.
- [ ] **Tầng 3 (REST Controller & DTOs):**
  - `backend/src/main/java/com/swp391/selfstorage/support/controller/SupportRequestController.java`.
- [ ] **Tầng 4 (Service & Business Rules):**
  - `SupportRequestServiceImpl.java`: Logic tạo ticket, phân công nhân viên, đổi trạng thái ticket (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), tính phí đền bù hư hỏng tài sản.
- [ ] **Tầng 5 (Persistence & DB Migrations):**
  - Entity: `SupportRequest.java`.
  - Migrations: `V1__init_postgres_schema.sql`.

---

### 3. RÀNG BUỘC KỸ THUẬT VỚI SKILL `/archify`
- Mọi node nghiệp vụ phải có sources trích dẫn chính xác file và line range.
- Chạy finalize và nộp kết quả theo chuẩn Archify Showcase.

---

### ⚠️ QUY TẮC RÀ SOÁT MÃ NGUỒN & 5 CHỐT CHẶN CHỐNG BẪY THỰC CHIẾN:
1. **Checklist chỉ là Điểm Neo (Anchors):** Chạy `Get-ChildItem` quét toàn bộ thư mục package được giao, lần theo `import` và `call sites` tìm hết file vệ tinh (hooks, mappers, sub-components).
2. **Sàng lọc Code Chết (Dead Code Filter):** File/class không có caller hoặc Mock cũ bỏ hoang -> TUYỆT ĐỐI KHÔNG VẼ VÀO SƠ ĐỒ CHÍNH, chỉ ghi vào bảng "Danh sách Mã nguồn Chết tại tài liệu này".
3. **Cấm chỉ vẽ Happy Path (Anti-Happy-Path-Only):** Bắt buộc sơ đồ phải có ít nhất 2 nhánh rẽ ngoại lệ/xử lý lỗi (Exception Paths) của luồng nếu có và phải cover hết được các nhánh rẽ.
4. **Truy vết Tác vụ Nền & Webhook:** Phải chỉ ra Cronjob (`@Scheduled`) hoặc Webhook Controller xử lý bất đồng bộ nếu luồng có tính trạng thái theo thời gian hoặc thanh toán.
5. **Thực tế hóa Mock / Console Log:** Nếu code gửi SMS/Email chỉ mới là `log.info(...)` hoặc thanh toán Mock, phải ghi rõ nhãn `[Console Log / Mock]`, không vẽ dịch vụ bên ngoài chưa tích hợp.
6. **Kỷ luật Số dòng Commit Sạch:** Lấy line range đối chiếu với commit sạch `e9b1e80...`, tránh lệch dòng làm fail lệnh Archify finalize.
7. **Kiểm soát Viewport Archify:** Tối đa 6–8 bước trên 1 hàng ngang; đưa các nhánh xử lý lỗi xuống `row: 1`, `row: 2` để tránh sập layout và lỗi crossover.
```

---

### 4.8. Sub-prompt Flow SYS: Authentication, RBAC Multi-Facility & Cron Tasks (Lê Thanh Tùng — WS4 & Huỳnh Nhật — WS3)

```markdown
> **Người phụ trách chính (Assignee):** **Lê Thanh Tùng** (WS4 — Backend Lead, Security & RBAC) phối hợp cùng **Huỳnh Nhật** (WS3 — Cron Config)  
> **Phạm vi mã nguồn làm chủ:**  
> - **Backend Package:** `com.swp391.selfstorage.auth.*`, `com.swp391.selfstorage.common.security.*`, `com.swp391.selfstorage.common.config.*`  
> - **Frontend Feature:** `frontend/src/features/auth/*`, `frontend/src/routes/ProtectedRoute.tsx`  
> - **Bảng CSDL cốt lõi:** `app_user`, `user_facility_assignment`, `activity_log`

Bạn là **Senior Backend Lead (WS4)** phụ trách điều tra mã nguồn thực tế của **Flow SYS: Authentication, Authorization, Multi-Facility RBAC & Scheduled Cron Jobs**.

---

### 1. PHẠM VI NGHIỆP VỤ & TÀI LIỆU ĐỐI CHIẾU
- **Tài liệu lý thuyết:** `docs/WORKFLOWS.md § 9, 10`, `docs/CONVENTIONS.md`, `docs/TOPIC.md § 3.5`.
- **Mã yêu cầu:** `SA-01`, `SA-02`, `SA-03`, `SA-04`; `BR-GEN-06` (Múi giờ UTC+7), `BR-GEN-07` (Phân quyền đa cơ sở).
- **Loại sơ đồ Archify bắt buộc:**
  1. `architecture`: Kiến trúc bảo mật tầng sâu: `HTTP Request -> JwtAuthenticationFilter -> SecurityContext -> @PreAuthorize RBAC -> FacilitySecurityService (Data Boundary Enforcement) -> DB Audit Listener`.
  2. `sequence`: Chuỗi thực thi của 2 Tác vụ nền tự động ngầm:
     - `AutoCheckInActivationScheduler`: Quét kích hoạt hợp đồng T+11.
     - `OverdueCronJob`: Quét tính phạt quá hạn hằng đêm lúc 00:00:00 (UTC+7).

---

### 2. CHECKLIST ĐIỀU TRA MÃ NGUỒN 5 TẦNG BẮT BUỘC
- [ ] **Tầng 1 (Frontend):**
  - Context xác thực: `frontend/src/features/auth/AuthContext.tsx`.
  - Bộ điều hướng phân quyền: `frontend/src/routes/ProtectedRoute.tsx`.
- [ ] **Tầng 2 (Security & Filters):**
  - `backend/src/main/java/com/swp391/selfstorage/auth/security/JwtAuthenticationFilter.java`.
  - `backend/src/main/java/com/swp391/selfstorage/auth/security/SecurityConfig.java`.
  - `backend/src/main/java/com/swp391/selfstorage/common/security/FacilitySecurityService.java`.
- [ ] **Tầng 3 (REST Controller & DTOs):**
  - `AuthController.java` (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/refresh`).
- [ ] **Tầng 4 (Service & Configuration):**
  - `SchedulerConfig.java` (`@EnableScheduling`).
  - `AutoCheckInActivationScheduler.java` (`@Scheduled`).
  - `OverdueCronJob.java` (`@Scheduled`).
- [ ] **Tầng 5 (Persistence & DB Migrations):**
  - Entities: `AppUser.java`, `UserFacilityAssignment.java`, `ActivityLog.java`.
  - Migrations: `V1__init_postgres_schema.sql`, `V8__add_performance_indexes.sql`.

---

### 3. RÀNG BUỘC KỸ THUẬT VỚI SKILL `/archify`
- Mọi boundary và component phải dẫn chứng chính xác file cấu hình và lớp lọc.
- Chạy finalize và nộp kết quả theo chuẩn Archify Showcase.

---

### ⚠️ QUY TẮC RÀ SOÁT MÃ NGUỒN & 5 CHỐT CHẶN CHỐNG BẪY THỰC CHIẾN:
1. **Checklist chỉ là Điểm Neo (Anchors):** Chạy `Get-ChildItem` quét toàn bộ thư mục package được giao, lần theo `import` và `call sites` tìm hết file vệ tinh (hooks, mappers, sub-components).
2. **Sàng lọc Code Chết (Dead Code Filter):** File/class không có caller hoặc Mock cũ bỏ hoang -> TUYỆT ĐỐI KHÔNG VẼ VÀO SƠ ĐỒ CHÍNH, chỉ ghi vào bảng "Danh sách Mã nguồn Chết tại tài liệu này".
3. **Cấm chỉ vẽ Happy Path (Anti-Happy-Path-Only):** Bắt buộc sơ đồ phải có ít nhất 2 nhánh rẽ ngoại lệ/xử lý lỗi (Exception Paths) của luồng nếu có và phải cover hết được các nhánh rẽ.
4. **Truy vết Tác vụ Nền & Webhook:** Phải chỉ ra Cronjob (`@Scheduled`) hoặc Webhook Controller xử lý bất đồng bộ nếu luồng có tính trạng thái theo thời gian hoặc thanh toán.
5. **Thực tế hóa Mock / Console Log:** Nếu code gửi SMS/Email chỉ mới là `log.info(...)` hoặc thanh toán Mock, phải ghi rõ nhãn `[Console Log / Mock]`, không vẽ dịch vụ bên ngoài chưa tích hợp.
6. **Kỷ luật Số dòng Commit Sạch:** Lấy line range đối chiếu với commit sạch `e9b1e80...`, tránh lệch dòng làm fail lệnh Archify finalize.
7. **Kiểm soát Viewport Archify:** Tối đa 6–8 bước trên 1 hàng ngang; đưa các nhánh xử lý lỗi xuống `row: 1`, `row: 2` để tránh sập layout và lỗi crossover.
```

---

## 5. Quy chuẩn Thực thi Kỹ thuật & Khắc phục Lỗi với Archify CLI

### 5.1. Cấu trúc Thư mục và Khởi tạo Workspace
Mỗi sơ đồ do Subagent tạo ra phải đặt trong thư mục độc lập theo định dạng:
```
.archify/<type>-flow<n>-<slug>-<YYYYMMDD-HHMMSS>/
├── candidate.json
└── <slug>.html
```

### 5.2. Cấu trúc Metadata và Trích dẫn Bằng chứng
File `candidate.json` bắt buộc phải có cấu trúc repository snapshot để phục vụ đối soát tự động:
```json
{
  "$schema": "https://raw.githubusercontent.com/.../workflow.schema.json",
  "meta": {
    "title": "Flow 1: Storage Unit Reservation & Waitlist CRM",
    "quality_profile": "showcase",
    "repository": {
      "url": "https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System.git",
      "commit": "e9b1e80eeca31117193655839a1ca52cfe9a09dc",
      "link_mode": "local-only"
    }
  },
  "nodes": [
    {
      "id": "check_capacity",
      "label": "Kiểm tra Hạn ngạch trống (Availability Check)",
      "sources": [
        "backend/src/main/java/com/swp391/selfstorage/reservation/service/impl/AvailabilityServiceImpl.java#L45-L78"
      ]
    }
  ]
}
```

### 5.3. Câu lệnh Finalize Chuẩn hóa
Chạy lệnh kiểm thử tích hợp 4 cổng chất lượng (`validate`, `deliver`, `check`, `browser-check`):
```powershell
node .agents/skills/archify/bin/archify.mjs finalize <type> <candidate.json> <output.html> --repo-root . --quality showcase --json
```

### 5.4. Hướng dẫn Khắc phục các Lỗi Thường gặp (Repair Contract)
1. **Lỗi Giao cắt Tuyến đường (Crossover signals):**
   - Khi terminal thông báo `resolvedCrossovers` hoặc `routesOverSuggestedBends`, sao chép candidate sang bản mới và điều chỉnh tọa độ `col`/`row` hoặc vị trí các node lân cận để giải tỏa luồng dây, sau đó chạy lại finalize với cờ `--out-dir .../review-2`.
2. **Lỗi Tràn Khung nhìn (Workflow Viewport Overflow):**
   - Không kéo dài quá 8 bước theo chiều ngang. Khi luồng quá dài, hãy ngắt dòng hợp lý bằng cách đưa các nhánh rẽ xử lý lỗi xuống các hàng (`row`) bên dưới.
3. **Lỗi Không tìm thấy Dòng mã nguồn (Source Citation Out of Bounds):**
   - Archify kiểm tra đối chiếu trực tiếp với commit SHA được ghim trong `meta.repository`. Nếu số dòng bị lệch so với commit `e9b1e80eeca31117193655839a1ca52cfe9a09dc`, lệnh finalize sẽ thất bại. Subagent phải đọc số dòng trực tiếp từ mã nguồn thực tế tại commit đó.

---

## 6. Tiêu chí Nghiệm thu (DoD) & Biểu mẫu Báo cáo Độ lệch Mã nguồn

### 6.1. Bảng Tiêu chí Nghiệm thu (Definition of Done)

| Tiêu chí | Mô tả yêu cầu | Cách kiểm tra |
| :--- | :--- | :--- |
| **1. Phân định Trách nhiệm** | Mỗi sơ đồ có người phụ trách rõ ràng theo đúng Workstream phân công | Khớp với Ma trận RACI tại Mục 2.1 |
| **2. Mã thực thi Archify** | Lệnh `archify finalize` trả về Exit code 0 | `echo $LASTEXITCODE` bằng `0` |
| **3. Bốn cổng kiểm định** | Vượt qua đầy đủ: `validate`, `deliver`, `strict check`, `browser-check` | Receipt ghi nhận `gatesPassed: true` |
| **4. Trích dẫn 100% bằng chứng** | Tất cả các node nghiệp vụ đều có `sources` gắn kèm file và dòng code thật | Không có node nào dùng sources giả lập |
| **5. Độc lập & Tự chứa** | File `.html` mở được trực tiếp trên trình duyệt mà không cần cài thêm server | Mở file html xem trực quan |
| **6. Báo cáo Độ lệch** | Có tài liệu chỉ ra các điểm sai lệch giữa thiết kế và mã nguồn thực tế | Đính kèm Drift Report theo mẫu bên dưới |

---

### 6.2. Biểu mẫu Báo cáo Độ lệch Mã nguồn (Codebase Drift Report Template)

Mỗi Worker Subagent sau khi hoàn thành việc vẽ sơ đồ bắt buộc phải điền báo cáo theo mẫu sau:

```markdown
### 📊 BÁO CÁO ĐỘ LỆCH MÃ NGUỒN: FLOW <SỐ> — <TÊN LUỒNG>

- **Người phụ trách (Assignee):** [Tên thành viên] (Trục WS)
- **Sơ đồ HTML:** `.archify/<thư-mục>/<tên-file>.html`
- **Tình trạng nghiệm thu:** [x] Finalize thành công 4 gates (Exit code 0)

#### 1. Bảng đối soát thiết kế vs thực tế:
| Bước nghiệp vụ theo Thiết kế (`docs/WORKFLOWS.md`) | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :--- | :--- | :--- | :--- |
| 1. Kiểm tra hạn ngạch kho đệm 15 ngày | Đã cài đặt hoàn chỉnh tại AvailabilityServiceImpl | `AvailabilityServiceImpl.java#L45-L78` | `[Implemented]` |
| 2. Gửi SMS mã PIN tự động khi Auto-Activate | Chưa có tích hợp SMS Gateway, hiện chỉ log console | `AutoCheckInActivationScheduler.java#L65` | `[Partially Implemented]` |
| 3. Chức năng đề xuất miễn giảm phí quá hạn | Tài liệu cấm miễn giảm, code không có endpoint này | `OverdueProcessingServiceImpl.java` | `[Compliant with BR-OVD-06]` |

#### 2. Danh sách Mã nguồn Chết / Cần dọn dẹp (Dead Code Candidates):
| STT | File / Class / Method | Vị trí (Package / Directory) | Lý do nghi ngờ (Không caller, Mock cũ, mồ côi) | Đề xuất xử lý |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `LegacyMockPaymentService.java` | `backend/.../payment/` | Đã thay thế bằng PayOS, không còn nơi nào gọi | Xóa bỏ |
| 2 | `OldFilterModal.tsx` | `frontend/.../components/` | Không còn route hay trang nào import | Xóa bỏ |
```

---

---

### 6.1. Báo cáo Độ lệch Mã nguồn & Danh sách Mã nguồn Chết: Flow 1 (Nguyễn Phạm Xuân Nhi — WS1)

#### 📊 BÁO CÁO ĐỘ LỆCH MÃ NGUỒN: FLOW 1 — STORAGE UNIT RESERVATION & WAITLIST CRM

- **Người phụ trách (Assignee):** **Nguyễn Phạm Xuân Nhi** (WS1 — Khách hàng & Đặt chỗ)
- **Sơ đồ HTML Workflow:** `docs/diagrams/flow-1-reservation-workflow.html`
- **Sơ đồ HTML Sequence:** `docs/diagrams/flow-1-reservation-sequence.html`
- **Tình trạng nghiệm thu:** [x] Finalize thành công 4 gates (Exit code 0, showcase profile)

##### 1. Bảng đối soát thiết kế vs thực tế:
| Bước nghiệp vụ theo Thiết kế (`docs/WORKFLOWS.md` & `BR-*`) | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :--- | :--- | :--- | :--- |
| **1. Cửa sổ đặt trước tối đa 30 ngày (`BR-RES-01`)** | Đã khóa trực tiếp trên UI & Backend nếu `startDate > now + 30 days`, tự động gợi ý sang đăng ký Waitlist | `ReservationServiceImpl.java#L285-L305`<br>`BookingPage.tsx#L326-L360` | `[Implemented]` |
| **2. Tạm giữ ô kho 48h (`BR-RES-02` / `BR-DEP-03`)** | Đã thiết lập `expiresAt = createdAt + 48h`. Cronjob chạy ngầm tự động mở khóa đơn PENDING | `ReservationServiceImpl.java#L310-L330`<br>`BookingPaymentStep.tsx#L98-L107` | `[Implemented]` |
| **3. Kiểm tra công suất đệm an toàn 15 ngày (`BR-AVL-01..04`)** | Cài đặt thuật toán trừ ô đang thuê, ô bận và ô chưa gán; áp dụng khoảng đệm 15 ngày dự phòng khách gia hạn | `AvailabilityServiceImpl.java#L115-L135` | `[Implemented]` |
| **4. Waitlist Telesales CRM & Khóa độc quyền 2h (`BR-WAT-01..06`)** | Lưu thông tin khách chờ, Telesales bấm gọi khóa 2h chống trùng khách; chuyển đổi sang đơn đặt chỗ thành công | `WaitlistServiceImpl.java#L188-L210`<br>`WaitlistController.java#L38-L112` | `[Implemented]` |
| **5. Dời ngày nhận kho có phí theo ngày (`BR-RES-06`)** | Cho phép dời lịch nhận kho, tính phí chênh lệch theo ngày và cập nhật ngày kết thúc hợp đồng tương ứng | `ReservationServiceImpl.java#L460-L520` | `[Implemented]` |
| **6. Hủy đặt chỗ phạt cọc 3 tầng (`BR-CAN-01..03`)** | Hủy trước 7 ngày phạt 0%; hủy 3–7 ngày phạt 50%; hủy dưới 3 ngày phạt 100% tiền cọc | `ReservationServiceImpl.java#L525-L585` | `[Implemented]` |
| **7. Cơ chế Phân bổ Kho Trễ (Late-Binding `FM-02`)** | Khách chỉ đặt Unit Type; quản lý chi nhánh (FM) trực tiếp gán ô vật lý cụ thể trước ngày nhận kho | `ReservationServiceImpl.java#L674-L799`<br>`AllocationPage.tsx#L173-L205` | `[Implemented]` |
| **8. Thanh toán VNPay & Webhook IPN (`BR-PAY-01`)** | Tích hợp cổng VNPay / VietQR, sinh URL kèm chữ ký SHA-512, lắng nghe IPN Webhook tự động cập nhật CONFIRMED | `PaymentServiceImpl.java#L95-L150`<br>`BookingPaymentStep.tsx#L170-L201` | `[Implemented]` |
| **9. Gửi SMS / Email mã PIN truy cập ô kho** | Chưa tích hợp nhà mạng viễn thông SMS Gateway (Twilio/SpeedSMS); hiện tại code chỉ ghi nhận `log.info(...)` | `ReservationServiceImpl.java#L375` | `[Partially Implemented - Console Log]` |

##### 2. Danh sách Mã nguồn Chết / Cần dọn dẹp (Dead Code Candidates):
| STT | File / Class / Method | Vị trí (Package / Directory) | Lý do nghi ngờ (Không caller, Mock cũ, mồ côi) | Đề xuất xử lý |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `UnitAccordionGrid.tsx` | `frontend/src/features/customer/components/` | Component hiển thị ô kho cũ dạng accordion, không còn trang hay route nào import | Xóa bỏ (Dead Code) |
| 2 | `StorageTypeTabs.tsx` | `frontend/src/features/customer/components/` | Component chuyển tab loại kho cũ, đã bị thay thế hoàn toàn bởi bộ lọc trên `UnitPickerPage.tsx` | Xóa bỏ (Dead Code) |
| 3 | `PendingReservationCard.tsx` | `frontend/src/features/customer/components/` | Thẻ đơn hàng cũ mồ côi, đã được gom vào bảng quản lý tập trung `MyUnitsTable.tsx` | Xóa bỏ (Dead Code) |
| 4 | `RentedUnitCard.tsx` | `frontend/src/features/customer/components/` | Thẻ hợp đồng cũ mồ côi, hiện đã được thay thế bằng `MyUnitsTable.tsx` | Xóa bỏ (Dead Code) |
| 5 | `DELETE /api/v1/reservations/{code}` | `ReservationController.java#L156-L161` | Endpoint xóa cứng (Hard Delete) cũ, xung đột với quy tắc Soft Delete và chính sách phạt cọc 3 tầng | Gỡ bỏ Endpoint |
| 6 | `cancelReservation(String code)` | `ReservationServiceImpl.java#L590-L623` | Hàm helper cũ không kiểm tra token người dùng và không áp dụng chính sách hoàn cọc `BR-CAN-01..03` | Xóa bỏ |

---

### 6.3. Báo cáo Độ lệch Mã nguồn & Danh sách Mã nguồn Chết: Flow 3 (Nguyễn Văn Gia Bình — WS2)

#### 📊 BÁO CÁO ĐỘ LỆCH MÃ NGUỒN: FLOW 3 — RENTED STORAGE UNIT MANAGEMENT & DEPOSIT SETTLEMENT

- **Người phụ trách (Assignee):** **Nguyễn Văn Gia Bình** (WS2 — Cơ sở, Kho & Vận hành / Technical Lead)
- **Sơ đồ HTML Standalone:**
  - Workflow: [flow3-return-settlement-workflow.html](file:///c:/Users/admin/Documents/A_FPT/Tempory_Project/Self-Storage-Facility-Rental-and-Management-System/.archify/workflow-flow3-return-settlement-20261106-110500/flow3-return-settlement-workflow.html)
  - Sequence: [flow3-return-settlement-sequence.html](file:///c:/Users/admin/Documents/A_FPT/Tempory_Project/Self-Storage-Facility-Rental-and-Management-System/.archify/sequence-flow3-return-settlement-20261106-110500/flow3-return-settlement-sequence.html)
- **Commit Snapshot:** [`aa2e49023f059a4173225f87f7fb325341466ee2`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/tree/aa2e49023f059a4173225f87f7fb325341466ee2) (Commit mới nhất trên nhánh chính `main`)
- **Tình trạng nghiệm thu:** `[x] Finalize thành công 4 gates (validate, deliver, check, browser-check: 100% PASS, Exit code 0) — Đã bật link_mode: "web" cho phép click trực tiếp vào từng dòng code GitHub.`

---

#### 1. Bảng đối soát thiết kế vs thực tế (Design vs Actual Implementation):

| Bước nghiệp vụ theo Thiết kế (`docs/WORKFLOWS.md § 4` & Checklist) | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :--- | :--- | :--- | :--- |
| **1. Controller & Service Nghiệm thu riêng biệt (`InspectionController`, `InspectionServiceImpl`)** | Không tồn tại controller hay service `inspection` riêng. Toàn bộ logic nghiệm thu trả kho được gộp vào `ContractController` và `ContractServiceImpl` để đảm bảo tính toàn vẹn giao dịch của hợp đồng. | `ContractController.java#L162-L181`<br>`ContractServiceImpl.java#L1060-L1130` | `[Architectural Consolidation]` |
| **2. Bảng CSDL nghiệm thu `inspection`** | Không có bảng `inspection`. Hệ thống sử dụng bảng `return_request` với các cột nghiệm thu mở rộng (`cleanliness_passed`, `key_card_returned`, `no_structural_damage`, `evidence_image_urls`, `customer_signature_url`, `damage_assessment_fee`). | `V1__init_postgres_schema.sql#L417-L440`<br>`ReturnRequest.java#L15-L85` | `[Schema Divergence]` |
| **3. Màn hình quản lý quyết toán cọc riêng (`ContractSettlementPage.tsx`)** | Không có trang độc lập. Toàn bộ giao diện quyết toán cọc và phê duyệt được nhúng trực tiếp trong `ContractDetailPage.tsx` thông qua component `SettlementApprovalModal.tsx`. | `ContractDetailPage.tsx#L120-L180`<br>`SettlementApprovalModal.tsx#L45-L130` | `[UI Consolidation]` |
| **4. Công thức Win-Win Trả kho sớm (`BR-RET-06`)** | Đã cài đặt chuẩn xác: Hoàn 100% tiền thuê ngày chưa dùng (`unusedDays * dailyRent`), phạt tịch thu 100% tiền cọc ban đầu (`depositPenalty = depositAmount`). Tiền net = tổng thiệt hại/nợ - tiền thuê hoàn lại. | `ContractServiceImpl.java#L1455-L1485` | `[Fully Implemented]` |
| **5. Cơ chế xử lý nợ thâm hụt (`UNH-RET-02`)** | Khi tiền bồi thường hư hại vượt quá tiền hoàn (`netBalance > 0`), hệ thống không đóng hợp đồng ngay mà tạo giao dịch `SETTLEMENT PENDING`. Khách hàng quét mã PayOS VietQR thanh toán đủ thì Webhook mới kích hoạt `SettlementDebtPaidEvent` để chuyển sang `CLOSED`. | `PaymentEventListener.java#L50-L65`<br>`ContractEventListener.java#L45-L75` | `[Fully Implemented]` |
| **6. Kênh hoàn tiền cọc tự động qua Ngân hàng** | Khi có số dư hoàn trả (`refundableAmount > 0`), hệ thống tạo `PaymentTransaction` với trạng thái `PENDING_REFUND`. Hiện tại chưa tích hợp cổng Payout tự động (VietQR Disburse), nhân viên kế toán chuyển khoản thủ công sau đó cập nhật đối soát. | `PaymentEventListener.java#L35-L48` | `[Console Log / Manual Bank Transfer]` |
| **7. Hủy yêu cầu trả kho (`UNH-RET-01`)** | Khách hàng hoặc quản lý có thể hủy yêu cầu trả kho nếu khách đổi ý trước ngày nghiệm thu bàn giao. Hợp đồng hoàn nguyên về `ACTIVE`. | `ContractServiceImpl.java#L1035-L1055` | `[Fully Implemented]` |

---

#### 2. Danh sách Mã nguồn Chết / Cần dọn dẹp (Dead Code Candidates):

| STT | File / Class / Method | Vị trí (Package / Directory) | Lý do nghi ngờ (Không caller, Mock cũ, mồ côi) | Đề xuất xử lý |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `ReturnInspectionForm.tsx` | `frontend/src/features/manager/components/` | File trùng lặp hoàn toàn với `frontend/src/features/staff/components/ReturnInspectionForm.tsx`. Không có bất kỳ trang hay router nào của Manager import component này (Quản lý chỉ xem kết quả nghiệm thu và duyệt quyết toán cọc trong `SettlementApprovalModal.tsx`). | Xóa bỏ để tránh trùng lặp code và nhầm lẫn trách nhiệm vai trò. |

---

### 6.6. Báo cáo Độ lệch Mã nguồn & Danh sách Mã nguồn Chết: Flow 6 (Nguyễn Phạm Xuân Nhi & Huỳnh Nhật — WS1/WS3)

#### 📊 BÁO CÁO ĐỘ LỆCH MÃ NGUỒN: FLOW 6 — RENEWAL & OVERDUE LIFECYCLE

- **Người phụ trách (Assignee):** **Nguyễn Phạm Xuân Nhi** (WS1 — Sub-flow 6.1) & **Huỳnh Nhật** (WS3 — Sub-flow 6.2)
- **Sơ đồ HTML Workflow (6.1):** `docs/diagrams/flow-6-1-renewal-workflow.html`
- **Sơ đồ HTML Lifecycle (6.2):** `docs/diagrams/flow-6-2-overdue-lifecycle.html`
- **Tình trạng nghiệm thu:** [x] Finalize thành công 4 gates (Exit code 0, showcase profile)

##### 1. Bảng đối soát thiết kế vs thực tế:
| Bước nghiệp vụ theo Thiết kế (`docs/WORKFLOWS.md` & `BR-*`) | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :--- | :--- | :--- | :--- |
| **1. Khóa tự do gia hạn trực tuyến tại mốc T-20 (`BR-REN-01..09`)** | Đã cài đặt kiểm tra `daysUntilEnd < 20`, ném lỗi `RENEWAL_DEADLINE_PASSED` và vô hiệu hóa nút gia hạn tự phục vụ trên Portal | `RenewalServiceImpl.java#L69-L76`<br>`RenewalPage.tsx#L60-L95` | `[Implemented]` |
| **2. Kiểm tra xung đột lịch đặt trước (`BR-REN-03` / `CAPACITY_NOT_AVAILABLE`)** | Tự động kiểm tra `existsOverlappingReservationForUnit` và `existsOverlappingContractForUnit`; nếu trùng kích hoạt Conflict View | `RenewalServiceImpl.java#L92-L109`<br>`useRenewalPricing.ts#L47-L56` | `[Implemented]` |
| **3. Snapshot đơn giá thuê & Bảo lưu tiền cọc gốc (`BR-DEP-01` / `BR-REN-05`)** | Lấy snapshot đơn giá tháng hiện tại của cơ sở, tiền cọc được bảo lưu từ hợp đồng cũ (không thu thêm cọc) | `RenewalServiceImpl.java#L111-L122` | `[Implemented]` |
| **4. Gia hạn cho hợp đồng OVERDUE đã tất toán phạt (`BR-REN-06`)** | Cho phép gia hạn nếu `overdueFeeAccrued == 0`; sau khi gia hạn thành công tự động khôi phục hợp đồng sang `ACTIVE` | `RenewalServiceImpl.java#L146-L150`<br>`RenewalExpiryBanner.tsx#L179-L200` | `[Implemented]` |
| **5. Cơ chế FM duyệt ngoại lệ và Late-Binding Bumping (`BR-REN-10`, `BR-BMP-01`)** | Đã hoàn thiện tài liệu đặc tả và quy trình nghiệp vụ; mã nguồn backend đang hỗ trợ Reassign Unit thủ công | `SPEC-WAITLIST-RENEWAL-UNITTYPE-REDESIGN.md#L118-L133` | `[Compliant with Spec]` |
| **6. Thời gian ân hạn 3 ngày D+1..D+3 (`BR-OVD-01`, `BR-OVD-02`)** | Cronjob chạy 00:00:00 hàng ngày, chuyển OVERDUE nhưng reset `overdueFeeAccrued = 0`; cho phép trả kho nhận 100% cọc | `OverdueProcessingServiceImpl.java#L93-L107`<br>`OverdueCronJob.java#L25-L40` | `[Implemented]` |
| **7. Phạt 10% tiền cọc/ngày từ D+4 đến D+9 (`BR-OVD-03`, `BR-OVD-04`)** | Tự động tính phí phạt lũy tiến theo ngày dựa trên tỷ lệ phạt của policy, chạm trần tối đa 100% tiền cọc | `OverdueProcessingServiceImpl.java#L108-L124` | `[Implemented]` |
| **8. Khóa mã PIN điện tử mở kho tại mốc D+7 (`BR-OVD-05`)** | Khi chạm mốc D+7, cronjob tự động set `accessCode = null`, chặn toàn bộ quyền ra vào của khách quá hạn | `OverdueProcessingServiceImpl.java#L125-L131` | `[Implemented]` |
| **9. Cưỡng chế chấm dứt & Niêm phong ô kho tại D+10 (`BR-OVD-07`)** | Hợp đồng chuyển `TERMINATED`, cấn trừ cọc, ô kho chuyển sang `MAINTENANCE` để niêm phong đồ tồn và kiểm kê | `OverdueProcessingServiceImpl.java#L132-L160` | `[Implemented]` |
| **10. Tự động hoàn tất bảo trì ô kho sau 15 ngày (D+15+)** | Sau 15 ngày bảo trì dọn dẹp đồ tồn, ô kho tự động chuyển về `AVAILABLE` (hoặc `RESERVED` nếu có khách mới chờ) | `OverdueProcessingServiceImpl.java#L70-L82` | `[Implemented]` |

##### 2. Danh sách Mã nguồn Chết / Cần dọn dẹp (Dead Code Candidates):
| STT | File / Class / Method | Vị trí (Package / Directory) | Lý do nghi ngờ (Không caller, Mock cũ, mồ côi) | Đề xuất xử lý |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `RenewalModal.tsx` | `frontend/src/features/customer/` | Modal cũ đã được thay thế hoàn toàn bởi trang quy trình 3 bước `RenewalPage.tsx` | Xóa bỏ (Dead Code) |
| 2 | `LateRenewalApprovalPage.tsx` | `frontend/src/features/manager/` | File trang chưa được tích hợp router, quy trình duyệt ngoại lệ hiện được xử lý trực tiếp trên Allocation Workbench | Tạm đóng / Gỡ bỏ |
| 3 | `OverdueContractsPage.tsx` | `frontend/src/features/manager/` | Trang quản lý nợ cũ, đã được chuyển sang phân hệ BOM tập trung `OverdueContractsTable.tsx` | Xóa bỏ (Dead Code) |

---

### 6.4. Báo cáo Độ lệch Mã nguồn & Danh sách Mã nguồn Chết: Flow 2 (Nguyễn Văn Gia Bình — WS2)

#### 📊 BÁO CÁO ĐỘ LỆCH MÃ NGUỒN: FLOW 2 — STORAGE CHECK-IN AND HANDOVER FLOW

- **Người phụ trách (Assignee):** **Nguyễn Văn Gia Bình** (WS2 — Cơ sở, Kho & Vận hành / Technical Lead)
- **Sơ đồ HTML Archify Standalone:**
  - Sơ đồ Quy trình Nghiệp vụ (Workflow): [.archify/workflow-flow2-checkin-handover-20261106-121730/flow2-checkin-handover-workflow.html](file:///c:/Users/admin/Documents/A_FPT/Tempory_Project/Self-Storage-Facility-Rental-and-Management-System/.archify/workflow-flow2-checkin-handover-20261106-121730/flow2-checkin-handover-workflow.html)
  - Sơ đồ Vòng đời Trạng thái (Lifecycle): [.archify/lifecycle-flow2-contract-checkin-20261106-121730/flow2-contract-checkin-lifecycle.html](file:///c:/Users/admin/Documents/A_FPT/Tempory_Project/Self-Storage-Facility-Rental-and-Management-System/.archify/lifecycle-flow2-contract-checkin-20261106-121730/flow2-contract-checkin-lifecycle.html)
- **Tình trạng nghiệm thu:** [x] Finalize thành công 4 gates (`validate: pass`, `deliver: pass`, `check: pass`, `browser-check: pass`) trên profile `showcase`, 0 diagnostics, Exit code 0.
- **Commit Snapshot đối chiếu:** `aa2e49023f059a4173225f87f7fb325341466ee2`

##### 1. Bảng đối soát thiết kế vs thực tế:

| Bước nghiệp vụ theo Thiết kế (`docs/WORKFLOWS.md § 3`) | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :--- | :--- | :--- | :--- |
| **1. Bàn làm việc Bàn giao Nhân viên (`FS-01`, `FS-02`)** | Thiết kế ghi `CheckInDeskPage.tsx`, thực tế tổ chức hợp nhất thành `StaffCheckInPage.tsx` tích hợp component `CustomerVerificationCard`, `HandoverInspectionForm`, `EvidencePhotoCapture`, và `SignaturePad`. | `frontend/src/features/staff/pages/StaffCheckInPage.tsx#L35-L330`<br>`frontend/src/features/staff/components/CustomerVerificationCard.tsx#L1-L85` | `[Implemented - Consolidated UI]` |
| **2. Thẻ nhận kho Online Khách hàng (`SC-04`)** | Thiết kế ghi `DigitalCheckInPage.tsx`, thực tế tối ưu trải nghiệm dưới dạng modal `DigitalMoveInPassModal.tsx` hiển thị mã QR hợp đồng, sơ đồ chỉ dẫn, mã kho và hotline ngay sau thanh toán hoặc từ `MyUnitsPage.tsx`. | `frontend/src/features/customer/components/DigitalMoveInPassModal.tsx#L38-L225` | `[Implemented - Modal UX]` |
| **3. Bản ghi Biên bản Bàn giao & Entity (`BR-CHK-02`, `FS-02`)** | Không tách riêng `InspectionController`/`InspectionServiceImpl`. Biên bản bàn giao được mô hình hóa qua entity `HandoverRecord`, xử lý đồng bộ transactional trong `ContractController.checkIn()` và `ContractServiceImpl.checkIn()`. | `backend/src/main/java/com/swp391/selfstorage/contract/entity/HandoverRecord.java#L9-L53`<br>`backend/src/main/java/com/swp391/selfstorage/contract/service/impl/ContractServiceImpl.java#L194-L242` | `[Architectural Simplification - Compliant]` |
| **4. Kiểm tra Hiện trường 4 Tiêu chí (`BR-CHK-02`)** | Cài đặt đầy đủ 4 tiêu chí bắt buộc: Vệ sinh sạch sẽ, cửa cuốn trơn tru, tường vách kiên cố, khóa thông minh hoạt động. Khách và nhân viên phải tích chọn đủ 4 điểm mới mở khóa khung ký số. | `frontend/src/features/staff/components/HandoverInspectionForm.tsx#L22-L56`<br>`frontend/src/features/staff/components/SignaturePad.tsx#L1-L60` | `[Fully Implemented]` |
| **5. Xử lý Ô hỏng Hiện trường & Đổi ô (`BR-CHK-03`, `FM-02`, `FS-03`)** | Nhân viên từ chối bàn giao qua `/handover-rejection` (ô chuyển `MAINTENANCE`, hợp đồng `TERMINATED`, hoàn tiền 100% trong 3 ngày). Nếu còn ô trống cùng loại, Quản lý (FM) thực hiện đổi ô ngoại lệ qua `/reassign-unit`. | `backend/src/main/java/com/swp391/selfstorage/contract/controller/ContractController.java#L134-L160`<br>`backend/src/main/java/com/swp391/selfstorage/contract/service/impl/ContractServiceImpl.java#L245-L281`, `L628-L730` | `[Fully Implemented]` |
| **6. Tự động Kích hoạt T+11 & Khách không đến (`BR-CAN-04`, `BR-CHK-05`)** | Tác vụ nền `AutoCheckInActivationScheduler` chạy lúc 00:00 hằng ngày: sau 10 ngày ân hạn (`cutoffDate = LocalDate.now().minusDays(10)`), tự kích hoạt hợp đồng sang `ACTIVE`, ô sang `OCCUPIED`, giữ 100% doanh thu. Mã PIN tự sinh nhưng hiện mới ghi log console `[Console Log / Mock Stub]`. | `backend/src/main/java/com/swp391/selfstorage/contract/scheduler/AutoCheckInActivationScheduler.java#L36-L78` | `[Implemented - Notification Mocked]` |
| **7. Dời lịch nhận kho & Hủy hợp đồng (`BR-CAN-01..04`, `BR-RES-06`)** | Cho phép khách hàng dời ngày bắt đầu thuê trước 48h (tối đa 1-7 ngày) qua `/reschedule-period`. Cho phép hủy nhận kho trước hạn qua `/cancel` với chính sách hoàn tiền 3 tầng, trả ô kho về trạng thái `AVAILABLE`. | `backend/src/main/java/com/swp391/selfstorage/contract/service/impl/ContractServiceImpl.java#L1553-L1610`, `L1713-L1820`<br>`frontend/src/features/customer/components/CancelCheckInModal.tsx#L28-L75` | `[Fully Implemented]` |

##### 2. Danh sách Mã nguồn Chết / Cần dọn dẹp (Dead Code Candidates):

| STT | File / Class / Method | Vị trí (Package / Directory) | Hiện trạng kiểm tra & Caller Call-sites | Đề xuất xử lý |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `AccessCodePinModal.tsx` | `frontend/src/features/staff/components/` | Component modal hiển thị mã PIN 6 số cho nhân viên xem và hỗ trợ khách hàng đọc lại mã tại quầy. Đã được import và sử dụng trong `StaffCheckInPage.tsx`. | **Giữ lại & Sử dụng tốt** (Không phải dead code). |
| 2 | `CustomerVerificationCard.tsx` | `frontend/src/features/staff/components/` | Thẻ kiểm tra danh tính khách hàng (họ tên, CCCD, số điện thoại, mã hợp đồng). Được tích hợp trực tiếp vào `StaffCheckInPage.tsx`. | **Giữ lại & Sử dụng tốt** (Không phải dead code). |
| 3 | `HandoverRejectionModal.tsx` | `frontend/src/features/staff/components/` | Modal lý do từ chối bàn giao khi phát hiện lỗi vật lý ô kho. Gọi trực tiếp API `POST /contracts/{id}/handover-rejection`. | **Giữ lại & Sử dụng tốt** (Không phải dead code). |
| 4 | `Notification Stubs` trong `AutoCheckInActivationScheduler.java#L65` | `backend/.../contract/scheduler/` | Tác vụ tự động kích hoạt T+11 sinh mã PIN nhưng chưa có kết nối SMS Provider (Twilio/eSMS), chỉ ghi `log.info(...)`. | **Cần tích hợp thật** khi sang giai đoạn sản xuất (Production). |

---

### 6.6. Báo cáo Độ lệch Mã nguồn & Danh sách Mã nguồn Chết: Flow 6 (Nguyễn Phạm Xuân Nhi & Huỳnh Nhật — WS1/WS3)

#### 📊 BÁO CÁO ĐỘ LỆCH MÃ NGUỒN: FLOW 6 — RENEWAL & OVERDUE LIFECYCLE

- **Người phụ trách (Assignee):** **Nguyễn Phạm Xuân Nhi** (WS1 — Sub-flow 6.1) & **Huỳnh Nhật** (WS3 — Sub-flow 6.2)
- **Sơ đồ HTML Workflow (6.1):** `docs/diagrams/flow-6-1-renewal-workflow.html`
- **Sơ đồ HTML Lifecycle (6.2):** `docs/diagrams/flow-6-2-overdue-lifecycle.html`
- **Tình trạng nghiệm thu:** [x] Finalize thành công 4 gates (Exit code 0, showcase profile)

##### 1. Bảng đối soát thiết kế vs thực tế:
| Bước nghiệp vụ theo Thiết kế (`docs/WORKFLOWS.md` & `BR-*`) | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :--- | :--- | :--- | :--- |
| **1. Khóa tự do gia hạn trực tuyến tại mốc T-20 (`BR-REN-01..09`)** | Đã cài đặt kiểm tra `daysUntilEnd < 20`, ném lỗi `RENEWAL_DEADLINE_PASSED` và vô hiệu hóa nút gia hạn tự phục vụ trên Portal | `RenewalServiceImpl.java#L69-L76`<br>`RenewalPage.tsx#L60-L95` | `[Implemented]` |
| **2. Kiểm tra xung đột lịch đặt trước (`BR-REN-03` / `CAPACITY_NOT_AVAILABLE`)** | Tự động kiểm tra `existsOverlappingReservationForUnit` và `existsOverlappingContractForUnit`; nếu trùng kích hoạt Conflict View | `RenewalServiceImpl.java#L92-L109`<br>`useRenewalPricing.ts#L47-L56` | `[Implemented]` |
| **3. Snapshot đơn giá thuê & Bảo lưu tiền cọc gốc (`BR-DEP-01` / `BR-REN-05`)** | Lấy snapshot đơn giá tháng hiện tại của cơ sở, tiền cọc được bảo lưu từ hợp đồng cũ (không thu thêm cọc) | `RenewalServiceImpl.java#L111-L122` | `[Implemented]` |
| **4. Gia hạn cho hợp đồng OVERDUE đã tất toán phạt (`BR-REN-06`)** | Cho phép gia hạn nếu `overdueFeeAccrued == 0`; sau khi gia hạn thành công tự động khôi phục hợp đồng sang `ACTIVE` | `RenewalServiceImpl.java#L146-L150`<br>`RenewalExpiryBanner.tsx#L179-L200` | `[Implemented]` |
| **5. Cơ chế FM duyệt ngoại lệ và Late-Binding Bumping (`BR-REN-10`, `BR-BMP-01`)** | Đã hoàn thiện tài liệu đặc tả và quy trình nghiệp vụ; mã nguồn backend đang hỗ trợ Reassign Unit thủ công | `SPEC-WAITLIST-RENEWAL-UNITTYPE-REDESIGN.md#L118-L133` | `[Compliant with Spec]` |
| **6. Thời gian ân hạn 3 ngày D+1..D+3 (`BR-OVD-01`, `BR-OVD-02`)** | Cronjob chạy 00:00:00 hàng ngày, chuyển OVERDUE nhưng reset `overdueFeeAccrued = 0`; cho phép trả kho nhận 100% cọc | `OverdueProcessingServiceImpl.java#L93-L107`<br>`OverdueCronJob.java#L25-L40` | `[Implemented]` |
| **7. Phạt 10% tiền cọc/ngày từ D+4 đến D+9 (`BR-OVD-03`, `BR-OVD-04`)** | Tự động tính phí phạt lũy tiến theo ngày dựa trên tỷ lệ phạt của policy, chạm trần tối đa 100% tiền cọc | `OverdueProcessingServiceImpl.java#L108-L124` | `[Implemented]` |
| **8. Khóa mã PIN điện tử mở kho tại mốc D+7 (`BR-OVD-05`)** | Khi chạm mốc D+7, cronjob tự động set `accessCode = null`, chặn toàn bộ quyền ra vào của khách quá hạn | `OverdueProcessingServiceImpl.java#L125-L131` | `[Implemented]` |
| **9. Cưỡng chế chấm dứt & Niêm phong ô kho tại D+10 (`BR-OVD-07`)** | Hợp đồng chuyển `TERMINATED`, cấn trừ cọc, ô kho chuyển sang `MAINTENANCE` để niêm phong đồ tồn và kiểm kê | `OverdueProcessingServiceImpl.java#L132-L160` | `[Implemented]` |
| **10. Tự động hoàn tất bảo trì ô kho sau 15 ngày (D+15+)** | Sau 15 ngày bảo trì dọn dẹp đồ tồn, ô kho tự động chuyển về `AVAILABLE` (hoặc `RESERVED` nếu có khách mới chờ) | `OverdueProcessingServiceImpl.java#L70-L82` | `[Implemented]` |

##### 2. Danh sách Mã nguồn Chết / Cần dọn dẹp (Dead Code Candidates):
| STT | File / Class / Method | Vị trí (Package / Directory) | Lý do nghi ngờ (Không caller, Mock cũ, mồ côi) | Đề xuất xử lý |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `RenewalModal.tsx` | `frontend/src/features/customer/` | Modal cũ đã được thay thế hoàn toàn bởi trang quy trình 3 bước `RenewalPage.tsx` | Xóa bỏ (Dead Code) |
| 2 | `LateRenewalApprovalPage.tsx` | `frontend/src/features/manager/` | File trang chưa được tích hợp router, quy trình duyệt ngoại lệ hiện được xử lý trực tiếp trên Allocation Workbench | Tạm đóng / Gỡ bỏ |
| 3 | `OverdueContractsPage.tsx` | `frontend/src/features/manager/` | Trang quản lý nợ cũ, đã được chuyển sang phân hệ BOM tập trung `OverdueContractsTable.tsx` | Xóa bỏ (Dead Code) |

---

### 6.7. Báo cáo Độ lệch Mã nguồn & Danh sách Mã nguồn Chết: Flow 7 (Lê Thanh Tùng — WS4)

#### 📊 BÁO CÁO ĐỘ LỆCH MÃ NGUỒN: FLOW 7 — SUPPORT REQUEST, DAMAGE COMPENSATION & UNIT SWAP

- **Người phụ trách (Assignee):** **Lê Thanh Tùng** (WS4 — Backend Lead, Security & Incident Handling)
- **Sơ đồ HTML Workflow:** `docs/diagrams/flow7-support-ticket-workflow.html`
- **Sơ đồ HTML Sequence:** `docs/diagrams/flow7-damage-compensation-sequence.html`
- **Tình trạng nghiệm thu:** [x] Finalize thành công 4 gates (Exit code 0, showcase profile, 0 diagnostics)
- **Commit Snapshot đối chiếu:** `346974f7c7ac2b3e2ce0f2625b679eebd936de25`

##### 1. Bảng đối soát thiết kế vs thực tế:
| Bước nghiệp vụ theo Thiết kế (`docs/WORKFLOWS.md § 8` & `BR-SUP`) | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :--- | :--- | :--- | :--- |
| **1. Cam kết SLA cứng 2 giờ/24 giờ & Đồng hồ đếm ngược (`BR-SUP-01`)** | Đã bãi bỏ theo quyết định nghiệp vụ mới nhất. Hệ thống chuyển sang xử lý linh hoạt theo ca trực cơ sở; trường `slaDueAt` để null, `isUrgent` do khách chọn. | `CustomerSupportServiceImpl.java#L110-L114`<br>`SupportPage.tsx#L50-L75` | `[Business Policy Drift / Verified in Code]` |
| **2. Khóa an toàn Điều chuyển Kho Khẩn cấp (`BR-SUP-05`)** | Đã cài đặt Safety Lock: Khi nhân viên khảo sát phát hiện thấm dột/hư hại kết cấu, bật `relocationRequired = true`. Hệ thống CẤM đóng ticket ở trạng thái `CLOSED` khi chưa hoàn tất đổi kho (`reassignUnit`). | `StaffSupportServiceImpl.java#L148-L168`<br>`StaffSupportServiceImpl.java#L202-L210` | `[Fully Implemented / Security Gate]` |
| **3. Phân định Trách nhiệm & Tính Phụ phí Sửa chữa (`BR-SUP-02`)** | Khảo sát hiện trường xác định nguyên nhân: Lỗi cơ sở sửa miễn phí 100%. Lỗi do khách thuê ghi nhận phụ phí sửa chữa vào hóa đơn kỳ sau. | `StaffSupportServiceImpl.java#L171-L215`<br>`StaffIncidentDetailView.tsx#L50-L85` | `[Fully Implemented]` |
| **4. Hạn mức Bảo hiểm Hàng hóa & Miễn trừ Hàng cấm (`BR-SUP-04`)** | Gói Tiêu chuẩn bồi thường tối đa 10,000,000 VNĐ; Gói Mở rộng nâng trần lên 50,000,000 VNĐ. Khách khai báo hàng cấm (tiền mặt, kim khí quý, chất cháy nổ) miễn trừ trách nhiệm 100% (0đ). | `CustomerSupportServiceImpl.java#L126-L131`<br>`StaffSupportController.java#L75-L85` | `[Compliant with Policy / Manual Approval]` |
| **5. Cronjob Tự động Đóng sau 48h (`SupportAutoCloseJob`)** | Cronjob chạy ngầm hàng đêm lúc 00:30 UTC+7: Tự động quét các phiếu RESOLVED quá 48h sang CLOSED. Ràng buộc an toàn: Chỉ đóng khi `relocation_required = false`. | `SupportAutoCloseJob.java#L27-L55` | `[Fully Implemented Background Job]` |
| **6. CSDL Bằng chứng Nghiệm thu Sự cố Đa hình (`support_attachment`)** | Cấu trúc đa hình `support_attachment` với `entity_type = 'SUPPORT_REQUEST'` (ảnh khách gửi) và `'SUPPORT_RESOLUTION'` (ảnh nhân viên nghiệm thu sau sửa, tối đa 5 ảnh). | `StaffSupportServiceImpl.java#L218-L230`<br>`V1__init_postgres_schema.sql#L645-L655` | `[Polymorphic Architecture Consolidation]` |

##### 2. Danh sách Mã nguồn Chết / Cần dọn dẹp (Dead Code Candidates):
| STT | File / Component | Vị trí (Package / Directory) | Lý do phát hiện | Đề xuất giải pháp |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `IncidentManagementPage.tsx` | `frontend/src/features/manager/pages/` | Trang quản lý gộp cũ không có router import, đã được thay thế bởi luồng Drill-down (`IncidentDashboardPage` -> `IncidentListPage` -> `IncidentDetailPage`) | Xóa bỏ (Dead Code) |
| 2 | `CloseIncidentModal.tsx` | `frontend/src/features/manager/components/` | Modal đóng sự cố cũ mồ côi, chức năng đã tích hợp vào `IncidentDetailPage.tsx` và `StaffIncidentDetailView.tsx` | Xóa bỏ (Dead Code) |

---
*Tài liệu này là căn cứ vận hành chính thức cho Sprint Tuần 9. Mọi thay đổi về phạm vi hoặc quy chuẩn kỹ thuật phải được Lead phê duyệt.*

# Bảng Điều hành Trung tâm (Project Dashboard)

> **Self-Storage Facility Rental and Management System (SWP391)**  
> **Bộ nhớ làm việc duy nhất (Single Working Memory)** dành cho Nhóm phát triển và Trợ lý AI.  
> _Tất cả trạng thái sprint, phân công 4 Workstream và sổ theo dõi Issue/Bug được cập nhật trực tiếp tại đây._

---

## Mục lục

1. [🎯 Trọng tâm hiện tại (Current Focus)](#1--trọng-tâm-hiện-tại-current-focus)
2. [🚨 Sổ Vấn đề & Bug Tinh gọn (Lean Issue Tracker)](#2--sổ-vấn-đề--bug-tinh-gọn-lean-issue-tracker)
3. [📊 Ma trận Tiến độ 4 Workstream](#3--ma-trận-tiến-độ-4-workstream)
4. [🤖 Chỉ dẫn Tương tác dành cho AI](#4--chỉ-dẫn-tương-tác-dành-cho-ai)

---

## 1. 🎯 Trọng tâm hiện tại (Current Focus)

- **Giai đoạn:** Giai đoạn Tích hợp Toàn diện, Kiểm thử & Khắc phục Lỗi Hệ thống (Full-System QA, Integration & Bug Fixing — Tuần 9).
- **Mục tiêu chính:** Toàn bộ 4 thành viên tập trung lập kế hoạch kiểm thử, thiết kế test cases (Unit, WebMvc, E2E), rà soát báo cáo độ lệch mã nguồn (Code Drift Reports) và fix triệt để các bug trên các Flow được phân công.
- **Tài liệu đặc tả & Khung kiểm thử:** Xem chi tiết tại [`docs/Week9Task.md`](Week9Task.md) và [`docs/TASK-ASSIGNMENT-6-PILLARS.md`](TASK-ASSIGNMENT-6-PILLARS.md).
- **Trực quan hóa kiến trúc:** 16+ sơ đồ Archify HTML đã hoàn thiện và đối soát tại [`docs/diagrams/README.md`](diagrams/README.md).

### Phân công Trách nhiệm (4 Workstreams):

| Workstream                    | Người phụ trách & Vai trò                                   | Phân hệ & Luồng nghiệp vụ phụ trách                                                                                                                                                                                              | Trọng tâm kiểm thử & QA Tuần 9                                                                                    |
| :---------------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **WS1: Khách hàng & Đặt chỗ** | **Nguyễn Phạm Xuân Nhi**<br>_(Frontend Lead / UX Designer)_ | • **Flow 1:** Storage Reservation & Waitlist CRM<br>• **Sub-flow 6.1:** Gia hạn kho trực tuyến (Storage Renewal UI)                                                                                                              | Thiết kế kịch bản E2E đặt kho real-time, đăng ký Waitlist khi hết kho, và thanh toán gia hạn trực tuyến.          |
| **WS2: Cơ sở & Vận hành**     | **Nguyễn Văn Gia Bình**<br>_(Technical Lead / Fullstack)_   | • **Flow 3:** Quản lý kho đang thuê, Trả sớm Win-Win & Tất toán<br>• **Sub-flow 6.2:** Hợp đồng Quá hạn & Vòng đời ô kho (D+1..D+10)                                                                                             | Viết Integration test hoàn cọc trả sớm, kiểm thử cronjob tính phạt quá hạn lũy tiến và mở khóa thanh toán nợ.     |
| **WS3: Tài chính & Tự động**  | **Huỳnh Nhật**<br>_(Automation & BOM Lead)_                 | • **Flow 4:** Chính sách giá BOM, Danh mục Hạng kho & Doanh thu<br>• **Flow SYS:** Cron jobs tự động ngầm<br>• **Payment:** Cổng thanh toán VietQR                                                                               | WebMvcTest bảng giá BOM, kiểm thử đối soát tự động webhook VietQR và thuật toán tính tỷ lệ lấp đầy cơ sở.         |
| **WS4: Quản trị & Điều phối** | **Lê Thanh Tùng**<br>_(Backend Lead / Security)_            | • **Flow 2:** Check-in, Bàn giao kho & Auto-Activation<br>• **Flow 5:** Quản lý ô kho cơ sở & Phân công nhân sự<br>• **Flow 7:** Yêu cầu hỗ trợ, Bồi thường sự cố & Đổi kho<br>• **Flow SYS:** Bảo mật 5 lớp JWT & RBAC đa cơ sở | Kiểm thử bảo mật chống IDOR (`@facilitySecurity`), biên bản Check-in 4 tiêu chí cấp PIN 24/7 và xử lý bồi thường. |

---

## 2. 🚨 Sổ Vấn đề & Bug Tinh gọn (Lean Issue Tracker)

> **Quy tắc 3 Dòng:** Mỗi vấn đề chỉ tóm tắt tối đa 30 từ, nêu thẳng hiện tượng cốt lõi và hướng xử lý.  
> Không viết dài dòng. Khi giải quyết xong, đổi trạng thái sang `RESOLVED` kèm mã commit/PR.

| Mã Issue  | Hiện tượng & Vấn đề cốt lõi                                                                                               | Hướng xử lý & Trạng thái kỹ thuật                                                                                                           |    PIC     |      Trạng thái      |
| :-------: | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ | :--------: | :------------------: |
| `ISS-137` | Hoàn thiện giao diện Bàn làm việc Phân bổ Ô kho (Unit Allocation Workbench) cho FM và điều phối merge nhánh.              | Hoàn thiện FM gán ô AVAILABLE trước ngày Check-in; hoàn tất kiểm thử tích hợp toàn hệ thống và squash-merge vào main.                       |    Nhật    | `RESOLVED (PR #277)` |
| `ISS-138` | Màn hình Gán ô kho (Allocation Workbench) nút bấm bị tàng hình và backend ném AbstractMethodError khi phân công tiếp đón. | Thay token màu Tailwind teal-600, hiện thực assignUnit & reassignStaff trong ReservationServiceImpl, test xanh 100%.                        |  Gia Bình  |      `RESOLVED`      |
| `ISS-139` | Tái cấu trúc 3 phân hệ cốt lõi: Waitlist Telesales CRM, Gia hạn T-20 & Điều chuyển Bumping, và BOM Master Unit Type.      | Hoàn tất đồng bộ 5 bộ đặc tả theo mô hình FM CRM Telesales chốt đơn 2h và đếm ngược T-20; chuẩn bị Flyway V10.                              |  Gia Bình  |      `RESOLVED`      |
| `ISS-140` | Tích hợp giao diện Đăng ký Waitlist khi hết kho, Chặn Spam bom hàng 5 lần/ngày và Banner sự cố khẩn cấp.                  | Hoàn tất WaitlistRegistrationModal, Flyway V12 daily_cancel_count, khóa tự gia hạn T-20, test xanh 535/535 backend, build FE 0 lỗi.         |  Gia Bình  |      `RESOLVED`      |
| `ISS-141` | Sửa lỗi 404 API Waitlist, lỗi 409 hủy nhận kho hợp đồng PENDING_CHECK_IN và tinh chỉnh Allocation Modal.                  | Bỏ double context path /api/v1 tại WaitlistController, thêm POST /contracts/{id}/cancel giải phóng kho & hoàn cọc 100% (PR #271).           |  Gia Bình  | `RESOLVED (PR #271)` |
| `ISS-142` | Cửa sổ đặt trước 30 ngày (BR-RES-01), Smart Waitlist Modal kèm SĐT & Feasibility Check và kích hoạt FM Waitlist CRM.      | Khóa đặt trực tiếp > 30 ngày, mở đăng ký Waitlist cho thuê xa, thêm SĐT bắt buộc & Flyway V13, kích hoạt WaitlistInboxPage.                 |  Gia Bình  |      `RESOLVED`      |
| `ISS-143` | Trực quan hóa tương tác Flow 5 (Quản lý Ô kho & Phân công Nhân sự) bằng Archify theo chuẩn Showcase Tuần 9.               | Khảo sát 5 tầng mã nguồn, hoàn thành 2 sơ đồ interactive HTML (workflow và tree) đạt 4/4 gates Archify, lập Báo cáo Độ lệch Flow 5.         | Thanh Tùng |      `RESOLVED`      |
| `ISS-144` | Trực quan hóa Archify Flow 7: Xử lý sự cố, bồi thường hàng hóa (BR-SUP-04) và khóa di dời khẩn cấp (BR-SUP-05).           | Hoàn thành sơ đồ Workflow và Sequence đạt chuẩn Showcase 0 lỗi; phát hiện dead code IncidentManagementPage; đối soát bãi bỏ SLA cứng.       | Thanh Tùng |      `RESOLVED`      |
| `ISS-145` | Trực quan hóa Archify Flow SYS: Bảo mật tầng sâu 5 lớp, Multi-Facility RBAC (SA-03) và Cronjobs ngầm hằng đêm (BR-OVD).   | Hoàn thành 2 sơ đồ Architecture & Sequence Showcase 0 lỗi; lập Báo cáo Độ lệch xác nhận quản lý phiên qua tokenStorage và D+1..D+15 policy. | Thanh Tùng |      `RESOLVED`      |
| `ISS-146` | Kiểm thử E2E Flow 1 (Reservation & Waitlist CRM) và Flow 6.1 (Gia hạn online).                                            | Hoàn thành bộ test Flow1AndFlow6E2E (6 kịch bản E2E), 145/145 tests FE và 108 tests BE xanh 100%, FE build 0 lỗi.            |  Xuân Nhi  |      `RESOLVED`      |
| `ISS-147` | Kiểm thử tích hợp Flow 3 (Trả sớm Win-Win) và Flow 6.2 (Cronjob Quá hạn D+1..D+10).                                       | Hoàn thành bộ kiểm thử 74 BE tests, 330 FE tests, 11 Playwright E2E/DDT tests (466ms), chuẩn hóa seed credentials (PR #305, #307, #309). |  Gia Bình  | `RESOLVED (PR #305, #307, #309)` |
| `ISS-148` | Nâng cấp VNPay 3 lớp phòng thủ, QueryDR đối soát tự động, Net MRR, Quỹ ký cược & Cronjob quét quá hạn độc lập.            | Hoàn tất QueryDR 15p, Webhook, Net MRR, Escrow Deposit Liability, Chunked Overdue Cronjob, 553/553 tests xanh, FE build 0 lỗi.              |    Nhật    |      `RESOLVED`      |
| `ISS-149` | Kiểm thử bảo mật Flow SYS (Multi-Facility RBAC), Flow 2 (Check-in) & Flow 7 (Incident).                                   | Hoàn thành 45 BE tests (IDOR @facilitySecurity, Check-in 4 tiêu chí, bồi thường sự cố BR-SUP-04) và 334 FE tests, test xanh 100%, FE build 0 lỗi. | Thanh Tùng | `RESOLVED` |
| `ISS-150` | Nâng cấp sơ đồ 2D mặt bằng trực quan (FacilityFloorPlanMapModal) có cầu thang chuyển tầng & bảo mật phân công đa cơ sở.    | Thêm ràng buộc STAFF_NOT_IN_FACILITY, sơ đồ 2D 6 màu, click Cầu thang chuyển tầng, test xanh 100%, FE build 0 lỗi.                         |  Gia Bình  |      `RESOLVED`      |
| `ISS-151` | Chuẩn hóa danh mục Hạng kho Self-Storage (2 môi trường Tiêu Chuẩn/Máy Lạnh, 5 Size XS..XL), chuyển quyền Master cho BOM.   | Thêm Flyway V16, dọn sạch kho logistics cũ, phân quyền BOM quản trị Master Type, FM chỉ đọc, FE modal 2 môi trường, test xanh 100%.         |  Gia Bình  |      `RESOLVED`      |
| `ISS-152` | Tích hợp bộ lọc trạng thái Hiện tại & Tương lai cho Sơ đồ 2D mặt bằng và Chi tiết ô kho phục vụ FM sắp xếp công việc.      | Bổ sung Horizon Filter (Sắp đón 7d, Sắp trả 14d, Timeline Simulator), dọn sạch sơ đồ thừa ở chi tiết ô kho, test xanh 100%, FE build 0 lỗi. |  Gia Bình  |      `RESOLVED`      |
| `ISS-153` | Chuẩn hóa giao diện Flow 1, bản in hợp đồng pháp lý (NĐ 30/2020), phân trang màu thương hiệu và tối ưu UX gia hạn.         | Bỏ đường kẻ web trên bản in hợp đồng, sửa nút phân trang bg-brand-600, rút gọn cảnh báo gia hạn, test xanh 100%, FE build 0 lỗi.            |  Xuân Nhi  |      `RESOLVED`      |
| `ISS-154` | Vòng lặp đối soát VNPay vô tận (mã 99), thiếu Index CSDL và bẫy Long Transaction khi gọi QueryDR trong lock DB.             | Thêm Hard Timeout 48h, Flyway V19 Index, tách HTTP I/O khỏi Tx, chuẩn hóa Enum, 574 tests xanh, FE build 0 lỗi.                             |    Nhật    |      `RESOLVED`      |
| `ISS-155` | Đồng bộ luồng xử lý sự cố tiếp đón Check-in: Phân nhánh Đổi ô kho 2D vs Hủy hoàn cọc 100%, đồng bộ trạng thái Chờ gán lại và giải mã thông tin khách hàng trên hàng đợi FM. | Hoàn tất phân nhánh rejectHandover (RELOCATE / CANCEL), upsert HandoverRecord, hàng đợi gán lại FM 2D, badge Chờ gán lại ô kho, test xanh 100%, FE build 0 lỗi. |  Gia Bình  |      `RESOLVED`      |
| `ISS-156` | Tối ưu hóa hiệu năng và bảo mật Flow 7 & Flow SYS: Double-Gate SecurityConfig (.authenticated), JPQL Bulk Update SupportAutoCloseJob, Flyway V20 Index và Deprecated slaDueAt. | Khóa chặt SecurityConfig (.authenticated), bulk update SupportAutoCloseJob 1 câu SQL, Flyway V20 idx_support_request_status_resolved_at, 77/77 tests xanh, FE build 0 lỗi. | Thanh Tùng |      `RESOLVED`      |
| `E2E-WS2-01` | Hoàn tất thiết lập Playwright E2E Multi-Actor cho Flow 3 (BR-RET-05 Win-Win) và đóng gói trọn bộ vũ khí thuyết trình live demo. | Xây dựng test suite 3 context độc lập, dataset DDT quyết toán cọc và đóng gói vũ khí live demo (`3791b88`). | Gia Bình | `VERIFIED` |
| `ISS-157` | Hỗ trợ Đền bù Nâng hạng ô kho (Upgrade Compensation) khi đổi ô sự cố: Tự động mở khóa ô lớn hơn cùng môi trường với màu sắc hổ phách riêng biệt trên Sơ đồ 2D khi hết ô cùng loại. | Cập nhật ContractServiceImpl & StorageUnitRepository cho phép nâng hạng đền bù khi availableSameType == 0, bảo lưu nguyên đơn giá/tiền cọc, Sơ đồ 2D hiển thị màu vàng hổ phách riêng biệt kèm badge Nâng hạng, test xanh 100%, FE build 0 lỗi. |  Gia Bình  |      `RESOLVED`      |
| `ISS-158` | Khắc phục compiler error PAYMENT_PROCESSING_FAILED, lỗi 403 Forbidden VNPay Sandbox, stale state HĐĐT và KPI Quá hạn sai lệch. | Bổ sung enum ErrorCode, whitelist SecurityConfig cho /payments/vnpay/**, đồng bộ getStatusBadge Chờ nhận kho, tách TERMINATED khỏi KPI Overdue, test xanh 100%, FE build 0 lỗi. |  Gia Bình  |      `RESOLVED`      |
| `ISS-159` | Dời ngày nhận kho có thu phí qua VNPay Sandbox (BR-RES-06 Phương án 2) và Khóa dời lịch vĩnh viễn tối đa 1 lần duy nhất. | Tích hợp checkout RESCHEDULE_FEE qua VNPay Sandbox, Flyway V21 rescheduled_start_date, cập nhật ngày khi thanh toán thành công, khóa dời lịch khi rescheduleCount >= 1 ở cả BE & FE, test xanh 100%, FE build 0 lỗi. |  Gia Bình  |      `RESOLVED`      |
| `ISS-160` | Audit toàn diện Flow 4 (BOM): Lỗi chặn Graceful Deactivation (CAT-03), rò rỉ gia hạn kho INACTIVE (CAT-04), sai mẫu số Occupancy (REP-03), thiếu Optimistic Lock giá (CON-01) và race condition thanh toán (CON-02). | Mở khóa Graceful Deactivation, chặn gia hạn/thanh toán UnitType INACTIVE kèm hoàn tiền tự động, trừ Maintenance khỏi mẫu số Occupancy, thêm Flyway V24 @Version, khóa RBAC BOM cho cron quá hạn, test xanh 100%. |  Gia Bình  |      `RESOLVED`      |
| `ISS-161` | Kích hoạt chức năng Check-in online 24/7 (Vé nhận kho thông minh): Mở quyền STORAGE_CUSTOMER check-in, cấp mã PIN Smart Lock và đồng bộ Hợp đồng ACTIVE. | Mở @PreAuthorize("isAuthenticated()") kiểm tra chính chủ, Flyway V25 allow null staff_id, ContractServiceImpl upsert HandoverRecord, FE DigitalMoveInPassModal kết nối Real API & hiển thị PIN từ backend, test xanh 599/599 BE, 156/156 FE, build 0 lỗi. |  Gia Bình  |      `RESOLVED`      |
| `ISS-162` | Khắc phục lỗi hiển thị trùng lặp đơn gán ô kho (RSV & CTR) và gán nhầm nhãn "Sự cố bàn giao" trên Hàng đợi Gán ô kho (Allocation Workbench) của Quản lý cơ sở (FM). | Siết chặt điều kiện findRelocationTickets chỉ nhận relocationRequired = true, bổ sung tập kiểm tra trùng lặp matchedContractIds & matchedContractCodes tại AllocationPage, test xanh 100%, FE build 0 lỗi. |  Gia Bình  |      `RESOLVED`      |
| `ISS-163` | Bỏ tự động tạo Ticket Sự Cố (SupportRequest) khi từ chối nhận kho đổi ô tại quầy tiếp đón check-in: Tránh tạo task rác cho nhân viên quầy và FM. | Loại bỏ tạo ticket INC-HD-... trong rejectHandover, loại bỏ tạo ticket giả INC-REASSIGN-... trong reassignUnit, đồng bộ HandoverRecord rejected & giải tỏa cờ khi đổi ô mới, 95 BE tests xanh, 6 FE tests xanh, FE build 0 lỗi. |  Gia Bình  |      `RESOLVED`      |

_(Lịch sử thảo luận chi tiết của các vấn đề cũ trước đây được lưu tại [docs/\_archive/OPEN-ISSUES-LEGACY.md](_archive/OPEN-ISSUES-LEGACY.md))_

---

## 3. 📊 Ma trận Tiến độ 4 Workstream

| Phân hệ / Tính năng                    | Luồng (Flow) |     Phụ trách chính     | Backend API | Frontend UI | E2E / Integration Test | Ghi chú Trọng tâm Tuần 9                                            |
| :------------------------------------- | :----------: | :---------------------: | :---------: | :---------: | :--------------------: | :------------------------------------------------------------------ |
| **Catalog, Đặt chỗ & Waitlist CRM**    |  **Flow 1**  |     Xuân Nhi (WS1)      | ✅ Sẵn sàng | ✅ Sẵn sàng |     ✅ Đã kiểm thử     | Hoàn thành E2E test đặt kho, Waitlist CRM & Check-in online 24/7    |
| **Bàn giao kho & Auto-Activation**     |  **Flow 2**  |    Thanh Tùng (WS4)     | ✅ Sẵn sàng | ✅ Sẵn sàng |     ✅ Đã kiểm thử     | Hoàn thành test case ký biên bản Check-in 4 tiêu chí & cấp PIN 24/7   |
| **Quản lý kho đang thuê & Trả sớm**    |  **Flow 3**  |     Gia Bình (WS2)      | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đã kiểm chứng (Playwright E2E) | Hoàn tất kịch bản nghiệm thu hoàn cọc trả sớm Win-Win Multi-Actor |
| **Bảng giá BOM & Tỷ lệ lấp đầy**       |  **Flow 4**  |    Huỳnh Nhật (WS3)     | ✅ Sẵn sàng | ✅ Sẵn sàng |     ✅ Đã kiểm thử     | Hoàn tất Net MRR, Quỹ ký cược Escrow, và Báo cáo CSV/KPI Enterprise |
| **Quản lý ô kho & Phân công nhân sự**  |  **Flow 5**  |    Thanh Tùng (WS4)     | ✅ Sẵn sàng | ✅ Sẵn sàng |     ✅ Đã kiểm thử     | Hoàn thành kiểm thử gán ô kho và điều phối nhân viên theo ca trực cơ sở |
| **Tự gia hạn thuê online**             | **Flow 6.1** |     Xuân Nhi (WS1)      | ✅ Sẵn sàng | ✅ Sẵn sàng |     ✅ Đã kiểm thử     | Hoàn thành E2E test tự gia hạn online, xử lý xung đột capacity chu kỳ sau |
| **Cronjob Quá hạn & Khóa mã**          | **Flow 6.2** |     Gia Bình (WS2)      | ✅ Sẵn sàng | ✅ Sẵn sàng |     ✅ Đã kiểm thử     | Hoàn tất kiểm thử cronjob tính phạt quá hạn D+4, khóa PIN D+7 và khôi phục nộp phạt VietQR |
| **Xử lý sự cố & Bồi thường thiệt hại** |  **Flow 7**  |    Thanh Tùng (WS4)     | ✅ Sẵn sàng | ✅ Sẵn sàng |     ✅ Đã kiểm thử     | Hoàn thành kiểm thử quy trình bồi thường thiệt hại và điều chuyển ô kho sự cố |
| **Bảo mật JWT RBAC & Tác vụ ngầm**     | **Flow SYS** | Tùng (WS4) & Nhật (WS3) | ✅ Sẵn sàng | ✅ Sẵn sàng |     ✅ Đã kiểm thử     | Hoàn tất Multi-Facility RBAC, Cronjob quá hạn độc lập và VNPay 3 lớp QueryDR |

---

## 4. 🤖 Chỉ dẫn Tương tác dành cho AI

Khi bắt đầu một phiên làm việc mới với Antigravity / Gemini / Claude:

1. **Đọc Dashboard trước:** Luôn đọc file này để biết trạng thái mới nhất của dự án và Workstream bạn đang tham gia.
2. **Tuân thủ quy chuẩn Zero-Conflict:** Chỉ chỉnh sửa trong phạm vi Backend/Frontend của Workstream được giao (xem [docs/PLAN.md](PLAN.md)).
3. **Cập nhật trạng thái sau khi xong task:**
   - Nếu giải quyết xong một issue trong bảng: Đổi trạng thái sang `RESOLVED`.
   - Nếu phát hiện vấn đề kỹ thuật mới: Thêm 1 dòng mới vào Bảng Sổ Vấn đề theo đúng Quy tắc 3 dòng.

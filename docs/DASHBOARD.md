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

| Workstream | Người phụ trách & Vai trò | Phân hệ & Luồng nghiệp vụ phụ trách | Trọng tâm kiểm thử & QA Tuần 9 |
| :--- | :--- | :--- | :--- |
| **WS1: Khách hàng & Đặt chỗ** | **Nguyễn Phạm Xuân Nhi**<br>*(Frontend Lead / UX Designer)* | • **Flow 1:** Storage Reservation & Waitlist CRM<br>• **Sub-flow 6.1:** Gia hạn kho trực tuyến (Storage Renewal UI) | Thiết kế kịch bản E2E đặt kho real-time, đăng ký Waitlist khi hết kho, và thanh toán gia hạn trực tuyến. |
| **WS2: Cơ sở & Vận hành** | **Nguyễn Văn Gia Bình**<br>*(Technical Lead / Fullstack)* | • **Flow 3:** Quản lý kho đang thuê, Trả sớm Win-Win & Tất toán<br>• **Sub-flow 6.2:** Hợp đồng Quá hạn & Vòng đời ô kho (D+1..D+10) | Viết Integration test hoàn cọc trả sớm, kiểm thử cronjob tính phạt quá hạn lũy tiến và mở khóa thanh toán nợ. |
| **WS3: Tài chính & Tự động** | **Huỳnh Nhật**<br>*(Automation & BOM Lead)* | • **Flow 4:** Chính sách giá BOM, Danh mục Hạng kho & Doanh thu<br>• **Flow SYS:** Cron jobs tự động ngầm<br>• **Payment:** Cổng thanh toán VietQR | WebMvcTest bảng giá BOM, kiểm thử đối soát tự động webhook VietQR và thuật toán tính tỷ lệ lấp đầy cơ sở. |
| **WS4: Quản trị & Điều phối** | **Lê Thanh Tùng**<br>*(Backend Lead / Security)* | • **Flow 2:** Check-in, Bàn giao kho & Auto-Activation<br>• **Flow 5:** Quản lý ô kho cơ sở & Phân công nhân sự<br>• **Flow 7:** Yêu cầu hỗ trợ, Bồi thường sự cố & Đổi kho<br>• **Flow SYS:** Bảo mật 5 lớp JWT & RBAC đa cơ sở | Kiểm thử bảo mật chống IDOR (`@facilitySecurity`), biên bản Check-in 4 tiêu chí cấp PIN 24/7 và xử lý bồi thường. |

---

## 2. 🚨 Sổ Vấn đề & Bug Tinh gọn (Lean Issue Tracker)

> **Quy tắc 3 Dòng:** Mỗi vấn đề chỉ tóm tắt tối đa 30 từ, nêu thẳng hiện tượng cốt lõi và hướng xử lý.  
> Không viết dài dòng. Khi giải quyết xong, đổi trạng thái sang `RESOLVED` kèm mã commit/PR.

| Mã Issue | Hiện tượng & Vấn đề cốt lõi | Hướng xử lý & Trạng thái kỹ thuật | PIC | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| `ISS-137` | Hoàn thiện giao diện Bàn làm việc Phân bổ Ô kho (Unit Allocation Workbench) cho FM và điều phối merge nhánh. | Hoàn thiện FM gán ô AVAILABLE trước ngày Check-in; hoàn tất kiểm thử tích hợp toàn hệ thống và squash-merge vào main. | Nhật | `RESOLVED (PR #277)` |
| `ISS-138` | Màn hình Gán ô kho (Allocation Workbench) nút bấm bị tàng hình và backend ném AbstractMethodError khi phân công tiếp đón. | Thay token màu Tailwind teal-600, hiện thực assignUnit & reassignStaff trong ReservationServiceImpl, test xanh 100%. | Gia Bình | `RESOLVED` |
| `ISS-139` | Tái cấu trúc 3 phân hệ cốt lõi: Waitlist Telesales CRM, Gia hạn T-20 & Điều chuyển Bumping, và BOM Master Unit Type. | Hoàn tất đồng bộ 5 bộ đặc tả theo mô hình FM CRM Telesales chốt đơn 2h và đếm ngược T-20; chuẩn bị Flyway V10. | Gia Bình | `RESOLVED` |
| `ISS-140` | Tích hợp giao diện Đăng ký Waitlist khi hết kho, Chặn Spam bom hàng 5 lần/ngày và Banner sự cố khẩn cấp. | Hoàn tất WaitlistRegistrationModal, Flyway V12 daily_cancel_count, khóa tự gia hạn T-20, test xanh 535/535 backend, build FE 0 lỗi. | Gia Bình | `RESOLVED` |
| `ISS-141` | Sửa lỗi 404 API Waitlist, lỗi 409 hủy nhận kho hợp đồng PENDING_CHECK_IN và tinh chỉnh Allocation Modal. | Bỏ double context path /api/v1 tại WaitlistController, thêm POST /contracts/{id}/cancel giải phóng kho & hoàn cọc 100% (PR #271). | Gia Bình | `RESOLVED (PR #271)` |
| `ISS-142` | Cửa sổ đặt trước 30 ngày (BR-RES-01), Smart Waitlist Modal kèm SĐT & Feasibility Check và kích hoạt FM Waitlist CRM. | Khóa đặt trực tiếp > 30 ngày, mở đăng ký Waitlist cho thuê xa, thêm SĐT bắt buộc & Flyway V13, kích hoạt WaitlistInboxPage. | Gia Bình | `RESOLVED` |
| `ISS-143` | Trực quan hóa tương tác Flow 5 (Quản lý Ô kho & Phân công Nhân sự) bằng Archify theo chuẩn Showcase Tuần 9. | Khảo sát 5 tầng mã nguồn, hoàn thành 2 sơ đồ interactive HTML (workflow và tree) đạt 4/4 gates Archify, lập Báo cáo Độ lệch Flow 5. | Thanh Tùng | `RESOLVED` |
| `ISS-144` | Trực quan hóa Archify Flow 7: Xử lý sự cố, bồi thường hàng hóa (BR-SUP-04) và khóa di dời khẩn cấp (BR-SUP-05). | Hoàn thành sơ đồ Workflow và Sequence đạt chuẩn Showcase 0 lỗi; phát hiện dead code IncidentManagementPage; đối soát bãi bỏ SLA cứng. | Thanh Tùng | `RESOLVED` |
| `ISS-145` | Trực quan hóa Archify Flow SYS: Bảo mật tầng sâu 5 lớp, Multi-Facility RBAC (SA-03) và Cronjobs ngầm hằng đêm (BR-OVD). | Hoàn thành 2 sơ đồ Architecture & Sequence Showcase 0 lỗi; lập Báo cáo Độ lệch xác nhận quản lý phiên qua tokenStorage và D+1..D+15 policy. | Thanh Tùng | `RESOLVED` |
| `ISS-146` | Kiểm thử E2E Flow 1 (Reservation & Waitlist CRM) và Flow 6.1 (Gia hạn online). | Thiết kế test cases E2E đặt kho real-time, modal Waitlist khi hết chỗ và luồng gia hạn trực tuyến; rà soát xử lý lỗi thanh toán VietQR. | Xuân Nhi | `OPEN` |
| `ISS-147` | Kiểm thử tích hợp Flow 3 (Trả sớm Win-Win) và Flow 6.2 (Cronjob Quá hạn D+1..D+10). | Viết Integration test kịch bản nghiệm thu hoàn cọc trả kho sớm Win-Win và kiểm thử cronjob tính phạt quá hạn lũy tiến D+4..D+10. | Gia Bình | `OPEN` |
| `ISS-148` | Kiểm thử Flow 4 (BOM Pricing & Revenue) và Đối soát Webhook VietQR tự động. | Viết WebMvcTest kiểm thử cấu hình giá BOM, đối soát webhook thanh toán VietQR bất đồng bộ và kiểm chứng thuật toán tỷ lệ lấp đầy cơ sở. | Nhật | `OPEN` |
| `ISS-149` | Kiểm thử bảo mật Flow SYS (Multi-Facility RBAC), Flow 2 (Check-in) & Flow 7 (Incident). | Kiểm thử bảo mật đa cơ sở chống IDOR (@facilitySecurity), xác thực biên bản bàn giao Check-in 4 tiêu chí và quy trình bồi thường sự cố. | Thanh Tùng | `OPEN` |

_(Lịch sử thảo luận chi tiết của các vấn đề cũ trước đây được lưu tại [docs/\_archive/OPEN-ISSUES-LEGACY.md](_archive/OPEN-ISSUES-LEGACY.md))_

---

## 3. 📊 Ma trận Tiến độ 4 Workstream

| Phân hệ / Tính năng | Luồng (Flow) | Phụ trách chính | Backend API | Frontend UI | E2E / Integration Test | Ghi chú Trọng tâm Tuần 9 |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Catalog, Đặt chỗ & Waitlist CRM** | **Flow 1** | Xuân Nhi (WS1) | ✅ Sẵn sàng | ✅ Sẵn sàng | 🔄 Đang QA | Thiết kế test case đặt kho, Waitlist CRM & thanh toán cọc VietQR |
| **Bàn giao kho & Auto-Activation** | **Flow 2** | Thanh Tùng (WS4) | ✅ Sẵn sàng | ✅ Sẵn sàng | 🔄 Đang QA | Thiết kế test case ký biên bản Check-in 4 tiêu chí & cấp PIN 24/7 |
| **Quản lý kho đang thuê & Trả sớm** | **Flow 3** | Gia Bình (WS2) | ✅ Sẵn sàng | ✅ Sẵn sàng | 🔄 Đang QA | Kiểm thử kịch bản nghiệm thu hoàn cọc trả sớm Win-Win |
| **Bảng giá BOM & Tỷ lệ lấp đầy** | **Flow 4** | Huỳnh Nhật (WS3) | ✅ Sẵn sàng | ✅ Sẵn sàng | 🔄 Đang QA | Kiểm thử cấu hình bảng giá BOM, báo cáo doanh thu & lấp đầy |
| **Quản lý ô kho & Phân công nhân sự** | **Flow 5** | Thanh Tùng (WS4) | ✅ Sẵn sàng | ✅ Sẵn sàng | 🔄 Đang QA | Kiểm thử gán ô kho và điều phối nhân viên theo ca trực cơ sở |
| **Tự gia hạn thuê online** | **Flow 6.1** | Xuân Nhi (WS1) | ✅ Sẵn sàng | ✅ Sẵn sàng | 🔄 Đang QA | Kiểm thử tự gia hạn online và đồng bộ ngày hết hạn hợp đồng |
| **Cronjob Quá hạn & Khóa mã** | **Flow 6.2** | Gia Bình (WS2) | ✅ Sẵn sàng | ✅ Sẵn sàng | 🔄 Đang QA | Kiểm thử tự động tính phạt D+4 và khóa mã PIN D+7 qua cronjob |
| **Xử lý sự cố & Bồi thường thiệt hại** | **Flow 7** | Thanh Tùng (WS4) | ✅ Sẵn sàng | ✅ Sẵn sàng | 🔄 Đang QA | Kiểm thử quy trình bồi thường thiệt hại và điều chuyển ô kho sự cố |
| **Bảo mật JWT RBAC & Tác vụ ngầm** | **Flow SYS** | Tùng (WS4) & Nhật (WS3) | ✅ Sẵn sàng | ✅ Sẵn sàng | 🔄 Đang QA | Kiểm thử phân quyền 5 lớp RBAC, chống IDOR đa cơ sở & cronjobs |

---

## 4. 🤖 Chỉ dẫn Tương tác dành cho AI

Khi bắt đầu một phiên làm việc mới với Antigravity / Gemini / Claude:

1. **Đọc Dashboard trước:** Luôn đọc file này để biết trạng thái mới nhất của dự án và Workstream bạn đang tham gia.
2. **Tuân thủ quy chuẩn Zero-Conflict:** Chỉ chỉnh sửa trong phạm vi Backend/Frontend của Workstream được giao (xem [docs/PLAN.md](PLAN.md)).
3. **Cập nhật trạng thái sau khi xong task:**
   - Nếu giải quyết xong một issue trong bảng: Đổi trạng thái sang `RESOLVED`.
   - Nếu phát hiện vấn đề kỹ thuật mới: Thêm 1 dòng mới vào Bảng Sổ Vấn đề theo đúng Quy tắc 3 dòng.

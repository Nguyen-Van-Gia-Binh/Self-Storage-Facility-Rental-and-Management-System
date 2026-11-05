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

- **Giai đoạn:** Sprint Triển khai & Hiện thực hóa 6 Trụ cột Đổi mới (6 Pillars Implementation).
- **Mục tiêu chính:** Hiện thực hóa mã nguồn cho 6 Trụ cột Đổi mới Nghiệp vụ & Kiến trúc: (1) Check-in Online & Auto-Activation T+11, (2) Trả sớm Win-Win, (3) Bảo vệ hàng hóa 10M & 50M, (4) Cửa sổ đặt trước 30 ngày, (5) Hủy đặt chỗ 3 tầng, (6) Dời ngày có phí theo ngày; kết hợp hoàn thiện FM Allocation Workbench.
- **Kế hoạch chi tiết & Mã nguồn mẫu:** Xem tại [`docs/TASK-ASSIGNMENT-6-PILLARS.md`](TASK-ASSIGNMENT-6-PILLARS.md).
- [Technical Debt] Đã áp dụng Sorted Locking để chống deadlock, nhưng chưa có Integration Test cho case 2 FM đổi ô ngược chiều.

### Phân công Trách nhiệm (4 Workstreams):

| Workstream                    | Người phụ trách                 | Trọng tâm công việc                                                                                     | Nhánh Git / Trạng thái                                       |
| :---------------------------- | :------------------------------ | :------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------- |
| **WS1: Khách hàng & Cơ sở**   | **Gia Bình**                    | Dời ngày có phí theo ngày (`BR-RES-06`) & Gói bảo vệ mở rộng 50M (`BR-SUP-04`)                           | `feature/Tx-paid-reschedule-and-insurance` (Đang triển khai) |
| **WS2: Đặt chỗ & Bàn giao**   | **Xuân Nhi**                    | Cửa sổ đặt trước 30 ngày (`BR-RES-01`), Modal Hủy 3 tầng (`BR-CAN-01..03`), E-Handover IoT UI          | `feature/Tx-booking-cancellation-ui` (Đang triển khai)       |
| **WS3: Tài chính & Tự động**  | **Huỳnh Nhật**                  | Hoàn thiện FM Allocation Workbench & Điều phối kiểm thử / merge vào `main`                              | `feature/Tx-test-all-features` (Chủ trì nhánh tích hợp)      |
| **WS4: Quản trị & Điều phối** | **Thanh Tùng** *(Chủ trì Task)* | Auto-Activation Scheduler T+11 (`BR-CAN-04`) & Quyết toán Trả kho sớm Win-Win (`BR-RET-06`)            | `feature/Tx-auto-activation-and-early-return` (Đang triển khai) |

---

## 2. 🚨 Sổ Vấn đề & Bug Tinh gọn (Lean Issue Tracker)

> **Quy tắc 3 Dòng:** Mỗi vấn đề chỉ tóm tắt tối đa 30 từ, nêu thẳng hiện tượng cốt lõi và hướng xử lý.  
> Không viết dài dòng. Khi giải quyết xong, đổi trạng thái sang `RESOLVED` kèm mã commit/PR.

| `ISS-137` | Hoàn thiện giao diện Bàn làm việc Phân bổ Ô kho (Unit Allocation Workbench) cho FM và điều phối merge nhánh.                                  | Hoàn thiện màn FM click gán ô AVAILABLE trước ngày Check-in; tiếp nhận review PR của Tùng, Nhi, Bình vào feature/Tx-test-all-features và kiểm thử toàn hệ thống trước khi đưa vào main.                                                                                          |      Nhật       |      `OPEN`       |
| `ISS-138` | Màn hình Gán ô kho (Allocation Workbench) nút bấm bị tàng hình và backend ném AbstractMethodError khi phân công tiếp đón.                    | Thay token màu Tailwind teal-600, hiện thực assignUnit & reassignStaff trong ReservationServiceImpl theo phong cách Ponytail, test xanh 100%.                                                                                                                                   |    Gia Bình     |    `RESOLVED`     |

_(Lịch sử thảo luận chi tiết của các vấn đề cũ trước đây được lưu tại [docs/\_archive/OPEN-ISSUES-LEGACY.md](_archive/OPEN-ISSUES-LEGACY.md))_

---

## 3. 📊 Ma trận Tiến độ 4 Workstream

| Phân hệ / Tính năng               | Luồng (Flow) | Backend API | Frontend UI | E2E Test | Ghi chú                                          |
| :-------------------------------- | :----------: | :---------: | :---------: | :------: | :----------------------------------------------- |
| **Catalog & Tìm kiếm kho**        |    Flow 1    | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | Hỗ trợ lọc theo diện tích, loại kho              |
| **Đặt chỗ & Thanh toán cọc**      |    Flow 1    | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | VietQR tích hợp PayOS / Mock                     |
| **Bàn giao kho (Check-in)**       |    Flow 2    | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | Staff e-Form ký nhận & cấp mã                    |
| **Quản lý kho đang thuê**         |    Flow 3    | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | Xem chi tiết, gia hạn, báo trả kho               |
| **Nghiệm thu trả kho & Tất toán** |    Flow 3    | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | Manager phân công, Staff nghiệm thu              |
| **Bảng giá & Chính sách BOM**     |    Flow 4    | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | Cấu hình giá, chiết khấu                         |
| **Điều phối nhân sự cơ sở**       |    Flow 5    | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | Phân công ca trực và tiếp nhận việc              |
| **Gia hạn thuê online**           |   Flow 6.1   | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | Thanh toán tiền thuê chu kỳ mới, bỏ khóa 30 ngày |
| **Cronjob Quá hạn & Khóa mã**     |   Flow 6.2   | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | Tự động tính phí D+1, khóa mã D+7 (BR-OVD-05)    |
| **Xử lý sự cố & Báo cáo**         |    Flow 7    | ✅ Sẵn sàng | ✅ Sẵn sàng |  ✅ Đạt  | Gửi ticket, phản hồi và đóng sự cố               |

---

## 4. 🤖 Chỉ dẫn Tương tác dành cho AI

Khi bắt đầu một phiên làm việc mới với Antigravity / Gemini / Claude:

1. **Đọc Dashboard trước:** Luôn đọc file này để biết trạng thái mới nhất của dự án và Workstream bạn đang tham gia.
2. **Tuân thủ quy chuẩn Zero-Conflict:** Chỉ chỉnh sửa trong phạm vi Backend/Frontend của Workstream được giao (xem [docs/PLAN.md](PLAN.md)).
3. **Cập nhật trạng thái sau khi xong task:**
   - Nếu giải quyết xong một issue trong bảng: Đổi trạng thái sang `RESOLVED`.
   - Nếu phát hiện vấn đề kỹ thuật mới: Thêm 1 dòng mới vào Bảng Sổ Vấn đề theo đúng Quy tắc 3 dòng.

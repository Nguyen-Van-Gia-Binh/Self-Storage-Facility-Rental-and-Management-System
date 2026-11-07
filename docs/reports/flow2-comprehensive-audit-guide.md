# Cẩm Nang Giám Sát Toàn Diện: Flow 2 — Check-in, Bàn Giao Ô Kho & Tự Động Kích Hoạt

> **Dự án:** Self-Storage Facility Rental and Management System (SWP391)  
> **Luồng nghiệp vụ:** **Flow 2 — Storage Check-in, Handover & Auto-Activation Flow**  
> **Người thực hiện:** **Nguyễn Văn Gia Bình** (WS2 — Cơ sở, Kho & Vận hành / Technical Lead)  
> **Người giám sát & Đánh giá (Auditor):** **Lê Thanh Tùng** (WS4 — Backend Lead & Full-System QA)  
> **Vị trí 2 Sơ đồ Archify Showcase hoàn chỉnh:**  
> 1. Sơ đồ Quy trình Nghiệp vụ (Workflow): [`docs/diagrams/flow2-checkin-handover-workflow.html`](../diagrams/flow2-checkin-handover-workflow.html) (gốc tại `.archify/workflow-flow2-checkin-handover-20261106-121730/`)  
> 2. Sơ đồ Vòng đời Trạng thái (Lifecycle): [`docs/diagrams/flow2-contract-checkin-lifecycle.html`](../diagrams/flow2-contract-checkin-lifecycle.html) (gốc tại `.archify/lifecycle-flow2-contract-checkin-20261106-121730/`)  
> **Tình trạng nghiệm thu:** `[x] Finalize thành công 4/4 gates (validate, deliver, check, browser-check: 100% PASS, Profile showcase, 0 diagnostics)`  
> **Commit Snapshot tích hợp:** `346974f7c7ac2b3e2ce0f2625b679eebd936de25` (đã nén vào `main` tại commit `ee94c1c`)

---

## 📌 Mục Lục Theo Dõi
1. [Khái Quát Nghiệp Vụ Flow 2 & Bản Đồ Tác Nhân (Actor Mapping)](#1-khái-quát-nghiệp-vụ-flow-2--bản-đồ-tác-nhân-actor-mapping)
2. [Bộ Chân Lý Quy Tắc Nghiệp Vụ Cốt Lõi (`BR-CHK`, `BR-CAN`, `BR-RES`, `BR-ACC`)](#2-bộ-chân-lý-quy-tắc-nghiệp-vụ-cốt-lõi-br-chk-br-can-br-res-br-acc)
3. [Phân Tích Chi Tiết 2 Sơ Đồ Archify do Gia Bình Xây Dựng](#3-phân-tích-chi-tiết-2-sơ-đồ-archify-do-gia-bình-xây-dựng)
4. [Kiến Trúc Kỹ Thuật 5 Tầng & Trích Dẫn Mã Nguồn Thực Tế (Code-Backed Architecture)](#4-kiến-trúc-kỹ-thuật-5-tầng--trích-dẫn-mã-nguồn-thực-tế-code-backed-architecture)
5. [Báo Cáo Đối Soát Độ Lệch & Tinh Gọn Mã Nguồn (Drift Report Summary)](#5-báo-cáo-đối-soát-độ-lệch--tinh-gọn-mã-nguồn-drift-report-summary)
6. [Sổ Tay & Checklist Kiểm Thử Nghiệm Thu Dành Cho Lê Thanh Tùng](#6-sổ-tay--checklist-kiểm-thử-nghiệm-thu-dành-cho-lê-thanh-tùng)

---

## 1. Khái Quát Nghiệp Vụ Flow 2 & Bản Đồ Tác Nhân (Actor Mapping)

Flow 2 giải quyết toàn bộ giai đoạn chuyển giao kho vật lý từ khi hợp đồng ở trạng thái **Chờ nhận kho (`PENDING_CHECK_IN`)** đến khi chuyển sang **Đang hiệu lực (`ACTIVE`)** kèm mã PIN mở khóa thông minh 24/7.

### 🎭 Ma trận Phân công Trách nhiệm (RACI Matrix):
| Tác nhân (Actor) | Mã vai trò | Trách nhiệm chính trong Flow 2 |
| :--- | :---: | :--- |
| **Storage Customer** | `SC` | Xuất trình Thẻ nhận kho trực tuyến (`DigitalMoveInPassModal`), xuất trình CCCD đối chiếu, đồng kiểm tra 4 tiêu chí hiện trường và thực hiện ký biên bản bàn giao điện tử (`SignaturePad`). |
| **Facility Staff** | `FS` | Tiếp đón khách hàng tại bàn trực (`StaffCheckInPage`), đối chiếu CCCD (`CustomerVerificationCard`), dẫn khách khảo sát ô kho thực tế, lập biên bản nếu ô hỏng (`rejectHandover`) hoặc hoàn tất thủ tục bàn giao (`checkIn`). |
| **Facility Manager** | `FM` | Phân công nhân viên ca trực tiếp đón (`assignCheckInStaff`), phê duyệt đổi ô kho dự phòng khẩn cấp khi phát hiện lỗi vật lý (`reassignUnit`), xử lý hoàn tiền nếu không còn ô thay thế. |
| **System Scheduler** | `SYS` | Tác vụ ngầm tự động kích hoạt T+11 (`AutoCheckInActivationScheduler`) lúc 00:00:00 hằng ngày nếu khách hàng quá hạn 10 ngày không đến nhận kho. |

### 🎯 6 Mã Yêu Cầu Cốt Lõi (`docs/TOPIC.md § 3`):
- **`SC-04` (Digital Move-in Pass):** Khách hàng xem thẻ nhận kho số (chứa mã QR, thông tin ô kho, chỉ dẫn sơ đồ cơ sở).
- **`FS-01` (Customer Reception & Verification):** Nhân viên kiểm tra hàng đợi nhận kho, xác minh danh tính và tình trạng hồ sơ.
- **`FS-02` (Handover Inspection & Protocol):** Nhân viên cùng khách khảo sát thực địa 4 tiêu chí kỹ thuật và ký biên bản.
- **`FS-03` (Defect Reporting):** Báo cáo ô kho không đạt chất lượng bàn giao, kích hoạt chuyển bảo trì.
- **`FM-02` (Unit Reassignment):** Quản lý cơ sở đổi sang ô kho trống tương đương cho khách.
- **`FM-05` (Staff Assignment):** Phân công nhân viên ca trực hỗ trợ khách nhận kho.

---

## 2. Bộ Chân Lý Quy Tắc Nghiệp Vụ Cốt Lõi (`BR-CHK`, `BR-CAN`, `BR-RES`, `BR-ACC`)

Mọi logic kiểm thử, giám sát và vận hành Flow 2 đều phải căn cứ tuyệt đối vào các quy tắc sau:

| Mã quy tắc | Tên quy tắc nghiệp vụ | Định mức / Logic nghiệp vụ thực tế | Vị trí mã nguồn kiểm chứng |
| :--- | :--- | :--- | :--- |
| **`BR-CHK-01`** | **Thời gian & Giấy tờ làm thủ tục** | Khách hàng phải làm thủ tục trong giờ mở cửa cơ sở (08:00 - 20:00). Xuất trình CCCD/Hộ chiếu trùng khớp 100% với hồ sơ đã đăng ký khi ký hợp đồng. | `CustomerVerificationCard.tsx#L76-L109` |
| **`BR-CHK-02`** | **4 Tiêu chí Khảo sát Hiện trường** | Bắt buộc kiểm tra đủ **4 tiêu chí**: (1) Vệ sinh sạch sẽ không rác bẩn, (2) Cửa cuốn trơn tru dễ đóng mở, (3) Vách ngăn kiên cố không thủng rách/thấm nước, (4) Khóa thông minh hoạt động tốt. Kèm ảnh chụp bằng chứng. | `HandoverInspectionForm.tsx#L22-L56`<br>`EvidencePhotoCapture.tsx#L44-L70` |
| **`BR-CHK-03`** | **Ký Biên bản Bàn giao Điện tử** | Chỉ khi tích chọn đủ 4/4 tiêu chí ở `BR-CHK-02`, nút ký số mới mở khóa. Khách hàng và nhân viên ký trực tiếp trên màn hình cảm ứng, lưu vào bảng `handover_record`. | `SignaturePad.tsx#L1-L60`<br>`HandoverRecord.java#L25-L33` |
| **`BR-CHK-04`** | **Kích hoạt Hiệu lực & Cấp Mã PIN** | Hợp đồng chuyển sang `ACTIVE`, ô kho chuyển sang `OCCUPIED`, đặt chỗ chuyển `FULFILLED`. Hệ thống sinh mã PIN điện tử ngẫu nhiên 6 chữ số cấp cho khách hàng mở khóa 24/7. | `ContractServiceImpl.java#L209-L242`<br>`AccessCodePinModal.tsx#L14-L57` |
| **`BR-CHK-05`** | **Khách không đến nhận kho đúng hẹn** | Ô kho vật lý vẫn được bảo lưu độc quyền cho khách trong toàn bộ thời hạn thuê, không được tự ý gán cho người khác nếu hợp đồng chưa chấm dứt. | `RentalContract.java#L61-L64` |
| **`BR-CHK-06`** | **Xử lý Ô hỏng Hiện trường & Đổi ô** | Khi phát hiện ô kho hỏng kết cấu, nhân viên gọi `rejectHandover`: Ô kho chuyển `MAINTENANCE`, hợp đồng chuyển `TERMINATED`, hoàn tiền 100% trong 3 ngày làm việc. Nếu cơ sở còn ô trống cùng loại, Quản lý (FM) thực hiện đổi ô (`reassignUnit`). | `ContractServiceImpl.java#L245-L281`<br>`ContractServiceImpl.java#L628-L730` |
| **`BR-CAN-01`** | **Hủy nhận kho trước 48h (Cooling-off)** | Khách hàng được quyền hủy nhận kho trước giờ bắt đầu thuê $\ge 48$ giờ (hoặc trong 48h sau đặt): Hoàn lại **100% tiền cọc + 100% tiền thuê**, giải phóng ô kho về `AVAILABLE`. | `ContractServiceImpl.java#L1748-L1760` |
| **`BR-CAN-02`** | **Hủy trong vòng 48h trước nhận kho** | Khách hủy nhận kho trong phạm vi $< 48$ giờ trước ngày bắt đầu: Phạt **50% tiền cọc**, hoàn lại 50% tiền cọc còn lại + 100% tiền thuê. | `ContractServiceImpl.java#L1762-L1775` |
| **`BR-CAN-03`** | **Hủy khi đã đến hoặc quá ngày bắt đầu** | Khách hủy sau khi đã đến ngày bắt đầu nhận kho: Phạt **100% tiền cọc**, tiền thuê chỉ hoàn lại các tháng tương lai chưa sử dụng. | `ContractServiceImpl.java#L1776-L1790` |
| **`BR-CAN-04`** | **Tự động Kích hoạt Mặc định T+11** | Nếu khách hàng không đến nhận kho sau **10 ngày ân hạn** kể từ ngày bắt đầu thuê (chạm mốc ngày thứ 11 - T+11), hệ thống tự động coi như đã bàn giao mặc định: chuyển `ACTIVE`, cấp PIN 6 số, giữ lại **100% doanh thu**. | `AutoCheckInActivationScheduler.java#L36-L78` |
| **`BR-RES-06`** | **Dời Lịch Nhận Kho Trực tuyến** | Khách hàng được quyền dời ngày bắt đầu nhận kho trước $\ge 48$ giờ, thời gian dời được phép từ **1 đến tối đa 7 ngày** (kèm kiểm tra không xung đột lịch với các hợp đồng/đặt chỗ kế tiếp). | `ContractServiceImpl.java#L1577-L1590` |
| **`BR-ACC-01`** | **Chuẩn Mã PIN Thông minh** | Mã PIN điện tử gồm 6 chữ số ngẫu nhiên không trùng lặp, mở cửa ô kho thông minh 24/7 không cần qua quầy lễ tân. | `ContractServiceImpl.java#L209` |

---

## 3. Phân Tích Chi Tiết 2 Sơ Đồ Archify do Gia Bình Xây Dựng

Để phục vụ công tác thanh tra, giám sát chất lượng đồ án, nhóm đã tạo **2 file HTML standalone** tương tác cao bằng `/archify`:

### 3.1. Sơ đồ 1 — Quy trình Nghiệp vụ Đa làn (Workflow Diagram)
- **Tệp xem trực tiếp:** [`docs/diagrams/flow2-checkin-handover-workflow.html`](../diagrams/flow2-checkin-handover-workflow.html)
- **Cấu trúc khung vẽ:**
  - **6 Làn bơi (Lanes):**
    1. *Khách hàng (Customer Portal):* `Thẻ nhận kho số (SC-04)` $\rightarrow$ `Dời ngày nhận (BR-RES-06)` $\rightarrow$ `Ký nhận bàn giao (BR-CHK-03)` $\rightarrow$ `Cấp mã PIN số (BR-ACC-01)`.
    2. *Nhân viên tiếp đón (Staff Operations):* `Ca trực tiếp đón (FS-01)` $\rightarrow$ `Xác minh CCCD (BR-CHK-01)` $\rightarrow$ `Khảo sát ô kho (BR-CHK-02)`.
    3. *Quản lý cơ sở (Facility Manager):* `Phân công tiếp đón (FM-05)` $\rightarrow$ `FM đổi ô trống (BR-CHK-06 / reassignUnit)`.
    4. *Hệ thống lõi (Backend & DB Service):* `Kiểm tra cơ sở (SA-03)` $\rightarrow$ `Hồ sơ hợp lệ (FS-01)` $\rightarrow$ `Lưu biên bản (HandoverRecord)` $\rightarrow$ `Kích hoạt ACTIVE (BR-CHK-04)`.
    5. *Tác vụ nền tự động (Background Scheduler):* `Tự kích hoạt T+11 (BR-CAN-04 / 00:00 Cron)`.
    6. *Làn Ngoại lệ (Exception Lane):* `Hủy nhận kho (BR-CAN-01)` và `Kho MAINTENANCE (UNH-CHK-01 / rejectHandover)`.
  - **5 Giai đoạn (Phases):**
    - Giai đoạn 1: Tiếp đón & Chuẩn bị (Cột 0–1).
    - Giai đoạn 2: Xác minh CCCD & Phân công nhân sự (Cột 2).
    - Giai đoạn 3: Khảo sát thực địa 4 tiêu chí & Ký biên bản điện tử (Cột 3).
    - Giai đoạn 4: Thẩm định & Lưu biên bản HandoverRecord (Cột 4).
    - Giai đoạn 5: Kích hoạt hợp đồng ACTIVE & Cấp mã PIN 24/7 (Cột 5).
  - **3 Nhánh Ngoại lệ / Rẽ nhánh:**
    - Nhánh A: Khách tự hủy nhận kho trước 48h $\rightarrow$ Hoàn cọc 100% (`BR-CAN-01`).
    - Nhánh B: Ô kho hỏng hóc $\rightarrow$ Từ chối bàn giao $\rightarrow$ Quản lý đổi ô hoặc hoàn tiền 100% (`BR-CHK-06`).
    - Nhánh C: Khách bỏ quên không đến $\rightarrow$ Cronjob T+11 tự động kích hoạt `ACTIVE` (`BR-CAN-04`).

### 3.2. Sơ đồ 2 — Vòng Đời Trạng Thái Kép (Lifecycle Diagram)
- **Tệp xem trực tiếp:** [`docs/diagrams/flow2-contract-checkin-lifecycle.html`](../diagrams/flow2-contract-checkin-lifecycle.html)
- **Máy trạng thái song hành (Contract vs Storage Unit):**

| Trạng thái Hợp đồng (`RentalContract`) | Trạng thái Ô kho vật lý (`StorageUnit`) | Trạng thái Đặt chỗ (`Reservation`) | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `PENDING_CHECK_IN` | `RESERVED` | `CONFIRMED` | Khách đã thanh toán cọc/thuê, đang chờ ngày đến nhận kho. |
| `ACTIVE` *(Bàn giao thành công)* | `OCCUPIED` | `FULFILLED` | Khách đã ký biên bản hoặc T+11 tự động kích hoạt; có mã PIN mở cửa. |
| `CANCELLED` *(Khách hủy trước)* | `AVAILABLE` | `CANCELLED` | Khách chủ động hủy nhận kho qua modal; hoàn tiền theo 3 tầng `BR-CAN`. |
| `TERMINATED` *(Ô hỏng không ô thay)* | `MAINTENANCE` | `CANCELLED` | Nhân viên từ chối bàn giao do hư hỏng; chờ bảo trì và hoàn tiền 100%. |
| `ACTIVE` *(Sau khi FM đổi ô)* | Ô cũ `MAINTENANCE` / Ô mới `OCCUPIED` | `FULFILLED` | Đổi sang ô kho dự phòng cùng loại; hợp đồng cập nhật `storageUnitId` mới. |

---

## 4. Kiến Trúc Kỹ Thuật 5 Tầng & Trích Dẫn Mã Nguồn Thực Tế (Code-Backed Architecture)

Toàn bộ sơ đồ của Bình được kiểm chứng 100% qua các file mã nguồn đang chạy thực tế trong repository:

### 4.1. Tầng 1: Frontend UI/UX Components
- **Bàn làm việc nhân viên:** `frontend/src/features/staff/pages/StaffCheckInPage.tsx#L35-L330`.
- **Thẻ xác minh CCCD:** `frontend/src/features/staff/components/CustomerVerificationCard.tsx#L1-L85`.
- **Form đồng kiểm 4 tiêu chí:** `frontend/src/features/staff/components/HandoverInspectionForm.tsx#L22-L56`.
- **Chụp ảnh bằng chứng:** `frontend/src/features/staff/components/EvidencePhotoCapture.tsx#L44-L70`.
- **Khung ký số điện tử:** `frontend/src/features/staff/components/SignaturePad.tsx#L1-L60`.
- **Modal hiển thị mã PIN 6 số:** `frontend/src/features/staff/components/AccessCodePinModal.tsx#L14-L57`.
- **Modal từ chối nhận kho:** `frontend/src/features/staff/components/HandoverRejectionModal.tsx#L23-L48`.
- **Thẻ nhận kho số (Khách hàng):** `frontend/src/features/customer/components/DigitalMoveInPassModal.tsx#L38-L225`.
- **Modal dời ngày nhận kho:** `frontend/src/features/customer/components/ReschedulePeriodModal.tsx#L25-L80`.
- **Modal hủy nhận kho 3 tầng:** `frontend/src/features/customer/components/CancelCheckInModal.tsx#L28-L75`.

### 4.2. Tầng 2: Security & Route Guard
- **Phân quyền truy cập cơ sở:** `backend/src/main/java/com/swp391/selfstorage/auth/service/FacilitySecurityService.java#L20-L56`.
  - Ngăn chặn nhân viên cơ sở A xem hoặc thao tác trên hợp đồng của cơ sở B (`SA-03`, `BR-GEN-07`).
- **Route Guard:** `frontend/src/components/auth/ProtectedRoute.tsx#L11-L38` (yêu cầu role `STAFF` hoặc `MANAGER`).

### 4.3. Tầng 3: REST API Controllers
- `backend/src/main/java/com/swp391/selfstorage/contract/controller/ContractController.java`:
  - `POST /api/v1/contracts/{id}/check-in`: Thực hiện nhận kho & ký biên bản (`L108-L132`).
  - `POST /api/v1/contracts/{id}/handover-rejection`: Từ chối bàn giao khi ô kho hỏng (`L134-L160`).
  - `POST /api/v1/contracts/{id}/assign-staff`: Phân công nhân viên tiếp đón (`L217-L228`).
  - `POST /api/v1/contracts/{id}/reassign-unit`: FM đổi ô kho trống tương đương (`L162-L188`).
  - `POST /api/v1/contracts/{id}/reschedule-period`: Dời ngày nhận kho (`L230-L245`).
  - `POST /api/v1/contracts/{id}/cancel`: Hủy hợp đồng chờ nhận kho (`L247-L265`).

### 4.4. Tầng 4: Service Layer & Business Transactions
- `backend/src/main/java/com/swp391/selfstorage/contract/service/impl/ContractServiceImpl.java`:
  - `checkIn()` (`L194-L242`): Khóa bi quan `findByIdForUpdate`, sinh mã PIN 6 số, cập nhật hợp đồng `ACTIVE`, ô kho `OCCUPIED`, lưu thực thể `HandoverRecord`, hoàn tất `Reservation`.
  - `rejectHandover()` (`L245-L281`): Khóa ô kho sang `MAINTENANCE`, hợp đồng sang `TERMINATED`, lưu biên bản từ chối có lý do hư hại.
  - `reassignUnit()` (`L628-L730`): Đổi ô kho sang ô trống cùng loại khi có ticket hư hại đang mở.
  - `rescheduleRentalPeriod()` (`L1553-L1610`): Dời ngày từ 1-7 ngày, ràng buộc gửi trước 48h.
  - `cancelPendingContract()` (`L1713-L1820`): Xử lý hoàn tiền 3 tầng theo chính sách hủy.

### 4.5. Tầng 5: Schedulers & Database Schema
- **Tác vụ nền T+11:** `backend/src/main/java/com/swp391/selfstorage/contract/scheduler/AutoCheckInActivationScheduler.java#L36-L78` (chạy 00:00 hằng ngày, tự kích hoạt hợp đồng quá hạn 10 ngày nhận kho).
- **Thực thể Biên bản:** `backend/src/main/java/com/swp391/selfstorage/contract/entity/HandoverRecord.java#L9-L53` (bảng `handover_record`).
- **Thực thể Hợp đồng:** `backend/src/main/java/com/swp391/selfstorage/contract/entity/RentalContract.java` (bảng `rental_contract`).
- **Thực thể Ô kho:** `backend/src/main/java/com/swp391/selfstorage/unit/entity/StorageUnit.java` (bảng `storage_unit`).

---

## 5. Báo Cáo Đối Soát Độ Lệch & Tinh Gọn Mã Nguồn (Drift Report Summary)

Dưới đây là 7 phát hiện kiến trúc thực tế được ghi nhận trong Báo cáo Độ lệch của Gia Bình:

1. **Giao diện Tiếp đón Nhân viên:** Thiết kế ban đầu ghi `CheckInDeskPage.tsx`, thực tế đã được tổ chức hợp nhất thành `StaffCheckInPage.tsx` tích hợp đồng thời 4 thẻ chức năng (`CustomerVerificationCard`, `HandoverInspectionForm`, `EvidencePhotoCapture`, `SignaturePad`).
2. **Thẻ Nhận Kho Khách hàng:** Thiết kế ban đầu ghi màn hình độc lập `DigitalCheckInPage.tsx`, thực tế tối ưu hóa UX dưới dạng modal `DigitalMoveInPassModal.tsx` bật lên trực tiếp sau khi thanh toán cọc thành công hoặc từ trang "Kho của tôi".
3. **Mô hình hóa Biên bản Bàn giao:** Hệ thống không tạo `InspectionController` riêng mà gộp transactional trực tiếp vào `ContractController.checkIn()` và lưu bảng `handover_record`.
4. **Kiểm tra Hiện trường 4 Tiêu chí:** Cài đặt chặt chẽ `BR-CHK-02`, bắt buộc tích đủ 4 điểm mới mở khóa nút ký số.
5. **Xử lý Ô hỏng Hiện trường:** Đã cài đặt hoàn chỉnh luồng từ chối `rejectHandover` và cơ chế FM đổi ô `reassignUnit`.
6. **Tự động Kích hoạt T+11:** Đã cài đặt cronjob `AutoCheckInActivationScheduler`, tuy nhiên việc gửi SMS/Email thông báo mã PIN hiện đang dừng ở mức `log.info(...)` (`[Console Log / Mock Stub]`), cần tích hợp Twilio/eSMS khi lên Production.
7. **Dời ngày & Hủy nhận kho:** Đã hoàn thiện API và giao diện modal cho cả 2 nghiệp vụ `rescheduleRentalPeriod` (BR-RES-06) và `cancelPendingContract` (BR-CAN-01..03).
8. **Khắc phục lỗi nối dây sơ đồ #1 (Auditor Fix bởi Lê Thanh Tùng):** Phát hiện và sửa lỗi nghiêm trọng trên sơ đồ Archify của Gia Bình: gốc mũi tên *"Khách hủy nhận"* (BR-CAN-01) bị cắm nhầm vào node `Kiểm tra cơ sở (FacilitySecurity)` ở Backend. Đã biên dịch lại sơ đồ, chuyển gốc xuất phát đúng về `Thẻ nhận kho số (Move-in Pass QR)` của Khách hàng.
9. **Khắc phục lỗi đứt luồng sơ đồ #2 (Auditor Fix bởi Lê Thanh Tùng):** Phát hiện node `FM đổi ô trống (reassignUnit)` là ngõ cụt (Dead-end không có mũi tên đi tiếp). Thực tế sau khi FM đổi ô trống dự phòng, Hợp đồng vẫn giữ `PENDING_CHECK_IN`, Nhân viên và Khách hàng sẽ tiếp tục tiến hành nghiệm thu ô mới và ký biên bản số (`HandoverRecord`). Đã bổ sung cạnh nối `edge_swap_to_save` (`Ký nhận ô mới`) từ `FM đổi ô trống` dẫn xuống `Lưu biên bản (HandoverRecord)` -> tiếp tục sang `Kích hoạt ACTIVE` và `Cấp PIN 24/7`. Sơ đồ khép kín 100% vòng đời nghiệp vụ và đạt chuẩn 4/4 cổng Archify Showcase.

---

## 6. Sổ Tay & Checklist Kiểm Thử Nghiệm Thu Dành Cho Lê Thanh Tùng

Là **Full-System QA & Backend Lead**, bạn sử dụng bộ Checklist 6 Kịch bản thực chiến dưới đây để nghiệm thu toàn diện Flow 2:

```markdown
### 📋 CHECKLIST NGHIỆM THU E2E FLOW 2 (TEST CASES)

- [ ] **TC-F2-01: Luồng Bàn Giao Tiêu Chuẩn (Happy Path)**
  - Điều kiện: Hợp đồng `PENDING_CHECK_IN`, ô kho `RESERVED`.
  - Thao tác: Nhân viên mở `StaffCheckInPage`, đối chiếu CCCD -> tích đủ 4/4 tiêu chí khảo sát -> khách ký tên trên `SignaturePad` -> Bấm "Hoàn tất bàn giao".
  - Kỳ vọng: Hợp đồng chuyển `ACTIVE`, ô kho chuyển `OCCUPIED`, modal `AccessCodePinModal` hiển thị mã PIN 6 số, DB tạo bản ghi `handover_record` với `customerConfirmed=true`.

- [ ] **TC-F2-02: Chốt Chặn Bắt Buộc 4 Tiêu Chí (Validation Gate)**
  - Thao tác: Nhân viên chỉ tích 3/4 tiêu chí khảo sát (bỏ quên kiểm tra khóa hoặc vệ sinh).
  - Kỳ vọng: Khung chữ ký `SignaturePad` và nút "Hoàn tất" bị khóa (disabled), thông báo yêu cầu kiểm tra đủ 4 điểm.

- [ ] **TC-F2-03: Ô Kho Bị Hỏng & Từ Chối Bàn Giao (Handover Rejection)**
  - Thao tác: Nhân viên phát hiện cửa cuốn kẹt hỏng nặng -> Bấm "Từ chối bàn giao" -> Chọn lý do hư hỏng -> Xác nhận.
  - Kỳ vọng: Ô kho chuyển sang `MAINTENANCE`, hợp đồng chuyển sang `TERMINATED`, tạo bản ghi `handover_record` với `rejected=true`, thông báo hoàn tiền 100% trong 3 ngày.

- [ ] **TC-F2-04: Quản Lý Đổi Ô Kho Dự Phòng Cùng Loại (FM Unit Swap)**
  - Thao tác: Sau khi ô cũ hỏng, Quản lý mở modal đổi ô -> Chọn ô trống `AVAILABLE` cùng loại trong cơ sở -> Xác nhận đổi.
  - Kỳ vọng: Hợp đồng cập nhật `storageUnitId` mới, ô cũ giữ `MAINTENANCE`, ô mới chuyển `RESERVED`, tiếp tục luồng bàn giao bình thường.

- [ ] **TC-F2-05: Khách Hàng Dời Ngày Nhận Kho Trực Tuyến (Reschedule)**
  - Thao tác: Khách hàng mở modal `ReschedulePeriodModal` trên Portal trước ngày bắt đầu $\ge 48$h -> Chọn dời 3 ngày.
  - Kỳ vọng: Hệ thống kiểm tra không trùng lịch, cập nhật `startDate` mới, giữ nguyên hợp đồng `PENDING_CHECK_IN`. Nếu gửi yêu cầu khi còn $< 48$h, hệ thống ném lỗi 400.

- [ ] **TC-F2-06: Tác Vụ Ngầm Tự Động Kích Hoạt T+11 (Auto-Activation Cron)**
  - Thao tác: Chạy unit test / trigger scheduler với hợp đồng `PENDING_CHECK_IN` có `startDate <= today - 11 ngày`.
  - Kỳ vọng: Hợp đồng tự động chuyển sang `ACTIVE`, tự sinh mã PIN 6 số, ô kho chuyển `OCCUPIED`, giữ nguyên 100% doanh thu gói thuê (`BR-CAN-04`).
```

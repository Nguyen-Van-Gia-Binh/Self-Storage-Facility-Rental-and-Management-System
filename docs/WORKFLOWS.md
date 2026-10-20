# WORKFLOWS.md — Bản đồ Luồng đi Toàn hệ thống (End-to-End Workflows)

> **Dự án:** Self-Storage Facility Rental and Management System (SWP391)  
> **Ngăn xếp công nghệ:** Spring Boot 3 (Java 17 LTS) · React 18 (TypeScript + Vite) · SQL Server 2022 · Flyway · JWT  
> **Mục đích tài liệu:** Cung cấp **bản đồ kỹ thuật toàn diện** mô tả chi tiết từng bước đi của dữ liệu và logic trên toàn bộ 7 luồng nghiệp vụ chính và luồng hệ thống. Tài liệu mô tả song song cả **Luồng chuẩn thành công (Happy Path)** lẫn **Các kịch bản rẽ nhánh, ngoại lệ & xử lý lỗi (Unhappy & Exception Cases)**, giúp lập trình viên và kiểm thử viên lần theo chính xác từ **Giao diện (Frontend) → REST Controller → Service Layer → Repository / CSDL → Scheduled Jobs**.
>
> **Tài liệu tham chiếu chuẩn:**
> - Nghiệp vụ & Yêu cầu: [`docs/TOPIC.md`](TOPIC.md) · [`docs/USER-STORIES-AND-USE-CASES.md`](USER-STORIES-AND-USE-CASES.md) · [`docs/BUSINESS-RULES.md`](BUSINESS-RULES.md)
> - Cấu trúc dữ liệu & API: [`docs/DATA-DICTIONARY.md`](DATA-DICTIONARY.md) · [`docs/API-SPEC.md`](API-SPEC.md)

---

## 📑 Mục lục

1. [Tổng quan Kiến trúc & Nguyên tắc Luồng dữ liệu](#1-tổng-quan-kiến-trúc--nguyên-tắc-luồng-dữ-liệu)
2. [Flow 1 — Reservation: Đặt chỗ & Thanh toán giữ ô kho](#flow-1--reservation-đặt-chỗ--thanh-toán-giữ-ô-kho)
   - 2.1. [Happy Path: Đặt chỗ & Thanh toán thành công](#21-happy-path-đặt-chỗ--thanh-toán-thành-công)
   - 2.2. [Unhappy & Exception Cases: Xử lý Lỗi & Ngoại lệ Đặt chỗ](#22-unhappy--exception-cases-xử-lý-lỗi--ngoại-lệ-đặt-chỗ)
3. [Flow 2 — Check-in & Handover: Nhận kho & Bàn giao](#flow-2--check-in--handover-nhận-kho--bàn-giao)
   - 3.1. [Happy Path: Nghiệm thu đạt chuẩn & Kích hoạt mã PIN](#31-happy-path-nghiệm-thu-đạt-chuẩn--kích-hoạt-mã-pin)
   - 3.2. [Unhappy & Exception Cases: Từ chối bàn giao, Hoàn tiền & Sự cố thiết bị](#32-unhappy--exception-cases-từ-chối-bàn-giao-hoàn-tiền--sự-cố-thiết-bị)
4. [Flow 3 — Return & Settlement: Trả kho, Nghiệm thu & Quyết toán cọc](#flow-3--return--settlement-trả-kho-nghiệm-thu--quyết-toán-cọc)
   - 4.1. [Happy Path: Trả kho sạch đẹp & Hoàn cọc 100%](#41-happy-path-trả-kho-sạch-đẹp--hoàn-cọc-100)
   - 4.2. [Unhappy & Exception Cases: Quyết toán âm, Nợ quá hạn & Hủy báo trả kho](#42-unhappy--exception-cases-quyết-toán-âm-nợ-quá-hạn--hủy-báo-trả-kho)
5. [Flow 4 — BOM Policy & Pricing: Thiết lập Chính sách, Giá thuê & Báo cáo tổng thể](#flow-4--bom-policy--pricing-thiết-lập-chính-sách-giá-thuê--báo-cáo-tổng-thể)
   - 5.1. [Happy Path: Ban hành chính sách, niêm yết giá & Báo cáo KPI](#51-happy-path-ban-hành-chính-sách-niêm-yết-giá--báo-cáo-kpi)
   - 5.2. [Unhappy & Exception Cases: Vi phạm ngày hiệu lực, Snapshot bất biến & Chặn xóa cơ sở](#52-unhappy--exception-cases-vi-phạm-ngày-hiệu-lực-snapshot-bất-biến--chặn-xóa-cơ-sở)
6. [Flow 5 — Facility & Staff Management: Quản lý Cơ sở, Ô kho & Phân công nhân sự](#flow-5--facility--staff-management-quản-lý-cơ-sở-ô-kho--phân-công-nhân-sự)
   - 6.1. [Happy Path: Drill-down 4 cấp quản lý kho & Phân ca trực nhân viên](#61-happy-path-drill-down-4-cấp-quản-lý-kho--phân-ca-trực-nhân-viên)
   - 6.2. [Unhappy & Exception Cases: Xung đột ca trực, Bảo trì khẩn cấp & Phân quyền đa cơ sở](#62-unhappy--exception-cases-xung-đột-ca-trực-bảo-trì-khẩn-cấp--phân-quyền-đa-cơ-sở)
7. [Flow 6 — Contract Lifecycle: Gia hạn hợp đồng & Xử lý Quá hạn (Overdue)](#flow-6--contract-lifecycle-gia-hạn-hợp-đồng--xử-lý-quá-hạn-overdue)
   - 7.1. [Sub-flow 6.1: Gia hạn hợp đồng (Happy & Xung đột lịch)](#71-sub-flow-61-gia-hạn-hợp-đồng-happy--xung-đột-lịch)
   - 7.2. [Sub-flow 6.2: Xử lý Quá hạn (Chuỗi Unhappy Cases D+1 đến D+10)](#72-sub-flow-62-xử-lý-quá-hạn-chuỗi-unhappy-cases-d1-đến-d10)
8. [Flow 7 — Support Ticket & Incident: Xử lý Sự cố & Yêu cầu hỗ trợ](#flow-7--support-ticket--incident-xử-lý-sự-cố--yêu-cầu-hỗ-trợ)
   - 8.1. [Happy Path: Báo hỏng hạ tầng & Nhân viên xử lý miễn phí 0đ](#81-happy-path-báo-hỏng-hạ-tầng--nhân-viên-xử-lý-miễn-phí-0đ)
   - 8.2. [Unhappy & Exception Cases: Bồi thường lỗi khách, Điều chuyển kho & Cấp lại mã PIN](#82-unhappy--exception-cases-bồi-thường-lỗi-khách-điều-chuyển-kho--cấp-lại-mã-pin)
9. [Flow SYS — Authentication, Authorization & Security](#flow-sys--authentication-authorization--security)
10. [Hệ thống Tác vụ Tự động ngầm (Scheduled Cron Jobs)](#10-hệ-thống-tác-vụ-tự-động-ngầm-scheduled-cron-jobs)
11. [Biểu đồ Vòng đời Trạng thái (Entity State Machines)](#11-biểu-đồ-vòng-đời-trạng-thái-entity-state-machines)
12. [Bảng Tra cứu Nhanh Mã Nguồn (Quick Code Index)](#12-bảng-tra-cứu-nhanh-mã-nguồn-quick-code-index)

---

## 1. Tổng quan Kiến trúc & Nguyên tắc Luồng dữ liệu

Mỗi luồng nghiệp vụ trong hệ thống tuân thủ mô hình phân tầng chặt chẽ:

```
[Người dùng (UI Client)]
       │
       ▼ (HTTP REST Call kèm Bearer JWT)
[JwtAuthenticationFilter / SecurityConfig] ──► Nạp UserPrincipal vào SecurityContext
       │
       ▼
[REST Controller (@RestController)] ────────► Validate DTO, phân quyền @PreAuthorize
       │
       ▼
[Service Interface & ServiceImpl] ─────────► Thực thi Business Rules, Transactional (@Transactional)
       │
       ▼
[Spring Data JPA Repository] ───────────────► Truy vấn SQL Server / Flyway schema
       │
       ▼
[SQL Server Database] ──────────────────────► Ràng buộc khóa ngoại, cờ soft-delete, audit timestamps
```

* **Quy chuẩn múi giờ:** Toàn bộ hệ thống Backend và Cron job chạy theo múi giờ chuẩn Việt Nam `Asia/Ho_Chi_Minh` (UTC+7) (`BR-GEN-06`).
* **Quy chuẩn bảo mật:** Khách hàng (`CUSTOMER`) chỉ được thao tác trên tài nguyên của chính mình; Nhân viên (`STAFF`) và Quản lý cơ sở (`MANAGER`) bị giới hạn dữ liệu trong phạm vi cơ sở được phân công thông qua `FacilitySecurityService` (`BR-GEN-07`).

---

## Flow 1 — Reservation: Đặt chỗ & Thanh toán giữ ô kho

* **Mã nghiệp vụ liên quan:** `SC-01`, `SC-02`, `SC-03`
* **Diễn viên (Actors):** `Storage Customer` (chủ trì), `Facility Manager` (theo dõi)
* **Quy tắc nghiệp vụ cốt lõi:** `BR-RES-01..06`, `BR-AVL-01..05`, `BR-PRI-01..04`, `BR-PAY-01..06`, `BR-DEP-01..06`, `BR-CAN-01..05`, `BR-GEN-02`

### 2.1. Happy Path: Đặt chỗ & Thanh toán thành công

```
[Customer Browser]
       │
       ├─► 1. Xem danh mục cơ sở & ô kho
       │      Frontend: HomePage.tsx (tại CustomerRoutes)
       │      API: GET /api/v1/facilities
       │      Backend: FacilityController.listFacilities() ──► FacilityServiceImpl ──► FacilityRepository
       │
       ├─► 2. Lựa chọn ô kho & kiểm tra ô trống khả dụng (Sơ đồ mặt bằng)
       │      Frontend: UnitPickerPage.tsx
       │      API: GET /api/v1/storage-units/available?facilityId={id}&typeId={typeId}&startDate={date}&months={n}
       │      Backend: StorageUnitController ──► AvailabilityServiceImpl.checkAvailability()
       │               Kiểm tra lịch overlap với hợp đồng ACTIVE/OVERDUE/RESERVED kèm đệm 15 ngày [BR-AVL-01, ISS-48]
       │
       ├─► 3. Điền thông tin đặt chỗ & Xem trước bảng kê chi phí (Cost Breakdown Preview)
       │      Frontend: BookingPage.tsx
       │      API: POST /api/v1/reservations/preview
       │      Backend: ReservationController.previewCost() ──► ReservationServiceImpl.calculateCost()
       │               - Đơn giá snapshot từ bảng giá hiệu lực của cơ sở [BR-PRI-01]
       │               - Tiền thuê = Đơn giá m² × Diện tích × Số tháng [BR-PRI-01]
       │               - Tiền cọc = Đơn giá 1 tháng × depositMultiplier từ PolicyVersion hiện hành [BR-DEP-01]
       │               - Tổng thanh toán ban đầu = Tiền thuê + Tiền cọc [BR-DEP-02]
       │
       ├─► 4. Xác nhận đặt chỗ & Khóa giữ chỗ (Lock Capacity 48 giờ)
       │      Frontend: BookingPage.tsx ──► Điều hướng sang PaymentPage.tsx
       │      API: POST /api/v1/reservations (yêu cầu đăng nhập, cấm Anonymous booking [ISS-42])
       │      Backend: ReservationController.createReservation() ──► ReservationServiceImpl
       │               - Kiểm tra khách có vi phạm hợp đồng OVERDUE nợ đọng không? [BR-OVD-09]
       │               - Khóa giữ chỗ nguyên tử (Optimistic Lock / Capacity Check) [BR-RES-02]
       │               - Snapshot PolicyVersion hiện tại vào cột policy_snapshot [BR-GEN-02]
       │               - Tạo Reservation (status: PENDING_PAYMENT, hold_expires_at: now + 48h) [BR-DEP-03]
       │               - Tạo sẵn RentalContract ở trạng thái PENDING_CHECK_IN
       │
       ├─► 5. Thanh toán trực tuyến (VietQR / Cổng Sandbox)
       │      Frontend: PaymentPage.tsx / SandboxCheckoutPage.tsx
       │      API: POST /api/v1/payment/create-qr hoặc POST /api/v1/payment/initiate
       │      Backend: PaymentController ──► PaymentServiceImpl
       │               - Tạo PaymentTransaction (type: INITIAL_PAYMENT, status: PENDING)
       │               - Sinh mã VietQR kèm cú pháp nội dung chuyển khoản chuẩn hóa
       │
       ├─► 6. Xác nhận thanh toán thành công (Webhook / Callback / Sandbox Confirm)
       │      API: POST /api/v1/payment/callback hoặc POST /api/v1/payment/sandbox-pay
       │      Backend: PaymentController.handleCallback() ──► PaymentServiceImpl.confirmPayment()
       │               - Đánh dấu PaymentTransaction.status = SUCCESS
       │               - Cập nhật Reservation.status = CONFIRMED [BR-PAY-02]
       │               - Cập nhật StorageUnit.status = RESERVED [BR-AVL-04]
       │               - Hợp đồng Contract.status duy trì PENDING_CHECK_IN, sẵn sàng chờ nhận kho
       │
       └─► 7. Khách hàng theo dõi hợp đồng đặt chỗ
              Frontend: MyUnitsPage.tsx (hiển thị thẻ hợp đồng "Chờ nhận kho" kèm thời hạn ân hạn)
```

### 2.2. Unhappy & Exception Cases: Xử lý Lỗi & Ngoại lệ Đặt chỗ

| Mã kịch bản | Tình huống ngoại lệ / Lỗi | Điều kiện kích hoạt | Xử lý Backend & HTTP Status | Hiển thị Giao diện (Frontend) | Quy tắc nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UNH-RES-01** | **Chặn khách nợ xấu (Overdue Debt Block)** | Khách hàng đang có ít nhất 1 hợp đồng `OVERDUE` còn nợ đọng tiền phạt. | `POST /reservations` trả về `400 Bad Request` kèm mã lỗi `CUSTOMER_HAS_OVERDUE_DEBT`. Không cho tạo đơn mới. | Hiển thị thông báo đỏ: *"Quý khách đang có hợp đồng quá hạn chưa thanh lý nợ. Vui lòng tất toán nợ trước khi đặt kho mới."* Kèm nút chuyển nhanh đến tab Quá hạn. | `BR-OVD-09` |
| **UNH-RES-02** | **Xung đột đặt trùng ô kho (Race Condition)** | 2 khách hàng cùng bấm xác nhận đặt đúng 1 ô kho tại cùng 1 giây. | Áp dụng `@Version` hoặc kiểm tra tính khả dụng nguyên tử (`SELECT ... FOR UPDATE`). Giao dịch của người đến sau thất bại, ném `409 Conflict` (`UNIT_ALREADY_RESERVED`). | Thông báo: *"Ô kho này vừa được khách hàng khác đặt giữ chỗ trước. Vui lòng chọn ô kho khác."* Tự động reload sơ đồ kho. | `BR-RES-02`<br>`BR-AVL-03` |
| **UNH-RES-03** | **Hết hạn giữ chỗ 48h (Hold Timeout)** | Khách hàng không quét mã QR nộp tiền trong vòng 48 giờ kể từ khi tạo đơn. | `ReservationHoldExpiryJob` quét ngầm mỗi 2 phút: Cập nhật `Reservation.status = EXPIRED`, hủy hợp đồng tạm, giải phóng ô kho để người khác thuê. | Thẻ đơn hàng chuyển sang tab "Đã kết thúc / Hết hạn". Nút thanh toán bị vô hiệu hóa. | `BR-DEP-03` |
| **UNH-RES-04** | **Khách tự hủy đơn trước khi nhận kho (Cancellation)** | Khách hàng bấm nút "Hủy đơn đặt chỗ" trước ngày hẹn nhận kho (`POST /reservations/{id}/cancel`). | Áp dụng chính sách hoàn cọc bậc thang theo thời gian: <br>• Hủy trước ≥ 7 ngày: Hoàn 100% cọc + 100% tiền thuê (`BR-CAN-01`).<br>• Hủy trước 3–6 ngày: Hoàn 50% cọc + 100% tiền thuê (`BR-CAN-02`).<br>• Hủy trước < 3 ngày: Mất 100% cọc, chỉ hoàn tiền thuê (`BR-CAN-03`).<br>Cập nhật `Reservation.status = CANCELLED`, `StorageUnit.status = AVAILABLE`. | Modal hiển thị rõ số tiền cọc được hoàn và số tiền bị khấu trừ trước khi khách bấm xác nhận hủy. | `BR-CAN-01..05` |
| **UNH-RES-05** | **Khách không đến nhận kho (No-Show)** | Khách đã cọc thành công nhưng không đến quầy nhận kho và quá hạn ân hạn (`checkinGraceDays`). | Tác vụ ngầm quét chuyển `Reservation.status = NO_SHOW`, `RentalContract.status = CANCELLED`, tịch thu 100% tiền cọc ban đầu, mở lại ô kho `AVAILABLE`. | Gửi email thông báo hủy hợp đồng do quá hạn nhận kho. | `BR-CHK-05` |

---

## Flow 2 — Check-in & Handover: Nhận kho & Bàn giao

* **Mã nghiệp vụ liên quan:** `FS-01`, `FS-02`, `FM-02`, `SC-04`
* **Diễn viên (Actors):** `Facility Staff` (thực hiện tại quầy), `Storage Customer` (nhận kho), `Facility Manager` (phân công)
* **Quy tắc nghiệp vụ cốt lõi:** `BR-CHK-01..06`, `BR-ACC-01..03`, `BR-CAN-05`

### 3.1. Happy Path: Nghiệm thu đạt chuẩn & Kích hoạt mã PIN

```
[Facility Staff Desk — StaffDashboardPage.tsx / StaffCheckInPage.tsx]
       │
       ├─► 1. Nhân viên xem Danh sách nhiệm vụ ca trực hôm nay
       │      Frontend: StaffDashboardPage.tsx (StaffWeekCalendarStrip, DailyTasksOverview)
       │      API: GET /api/v1/staff/daily-tasks?date={TODAY}
       │      Backend: StaffDailyTaskController ──► StaffDailyTaskServiceImpl.getDailyTasks()
       │               - Truy vấn các hợp đồng PENDING_CHECK_IN thuộc cơ sở của nhân viên
       │               - Lấy động số ngày ân hạn nhận kho (checkinGraceDays) từ PolicyVersion hiện hành [BR-CHK-05, ISS-116]
       │
       ├─► 2. Khách hàng đến cơ sở: Tra cứu hợp đồng & Xác minh danh tính
       │      Frontend: StaffCheckInPage.tsx ──► CustomerVerificationCard.tsx
       │      API: GET /api/v1/contracts/{id}
       │      Backend: ContractController.getContractById() ──► Đối chiếu CCCD/SĐT khách hàng
       │
       ├─► 3. Nhân viên dẫn khách kiểm tra thực tế hiện trường ô kho
       │      Khảo sát 4 tiêu chí: Vệ sinh sạch sẽ, Cửa cuốn trơn tru, PCCC/thông gió, Khóa IoT [BR-CHK-02]
       │
       └─► 4. Ô kho ĐẠT CHUẨN — Tiến hành Bàn giao & Kích hoạt:
              Frontend: HandoverInspectionForm.tsx ──► EvidencePhotoCapture.tsx ──► SignaturePad.tsx
              API: POST /api/v1/contracts/{id}/check-in
              Backend: ContractController.checkIn() ──► ContractServiceImpl.checkIn()
                       - Lưu biên bản: chữ ký điện tử khách hàng, ảnh hiện trường, ghi chú [BR-CHK-03]
                       - Cập nhật Contract.status: PENDING_CHECK_IN ──► ACTIVE [BR-CHK-04]
                       - Cập nhật StorageUnit.status: RESERVED ──► OCCUPIED [BR-CHK-04]
                       - Cập nhật Reservation.status: CONFIRMED ──► FULFILLED
                       - Sinh mã PIN truy cập ngẫu nhiên 6 chữ số và kích hoạt ACTIVE [BR-ACC-01]
              Frontend: AccessCodePinModal.tsx hiển thị mã PIN và hướng dẫn khách mở cửa kho 24/7
```

### 3.2. Unhappy & Exception Cases: Từ chối bàn giao, Hoàn tiền & Sự cố thiết bị

| Mã kịch bản | Tình huống ngoại lệ / Lỗi | Điều kiện kích hoạt | Xử lý Backend & HTTP Status | Hiển thị Giao diện (Frontend) | Quy tắc nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UNH-CHK-01** | **Từ chối bàn giao do ô kho lỗi (Reject Handover)** | Hiện trường ô kho bị ẩm dột, kẹt cửa cuốn nặng, bẩn thỉu hoặc hệ thống điện hỏng không đảm bảo tiêu chuẩn (`BR-CHK-02`). | Nhân viên gọi `POST /contracts/{id}/reject-handover`. Backend chuyển `StorageUnit.status ──► MAINTENANCE`, `Contract.status ──► REJECTED_HANDOVER`, bắn sự kiện kích hoạt lệnh hoàn tiền 100% (cọc + toàn bộ phí thuê đã nộp). | Staff mở `HandoverRejectionModal.tsx`, chọn lý do (ẩm mốc, lỗi khóa). Sau khi xác nhận, hiện thông báo đã kích hoạt hoàn tiền tự động cho khách. | `BR-CHK-06`<br>`BR-CAN-05` |
| **UNH-CHK-02** | **Sai lệch thông tin CCCD / Khách không đủ giấy tờ** | Người đến nhận kho không mang CCCD hoặc thông tin không khớp với người đại diện hợp đồng. | Nhân viên tạm dừng quy trình bàn giao. Hợp đồng giữ nguyên `PENDING_CHECK_IN`. Nhân viên ghi chú vào nhật ký tiếp đón. | Thẻ xác minh hiển thị cảnh báo chưa đạt điều kiện nhận kho. Nút "Tiến hành bàn giao" bị khóa mờ. | `BR-CHK-01` |
| **UNH-CHK-03** | **Bàn phím số / Khóa IoT bị lỗi sau khi ký biên bản** | Bàn phím số tại cửa ô kho bị liệt nút hoặc không kết nối được mạng sau khi sinh mã PIN. | Nhân viên gọi `POST /api/v1/customer/access/regenerate-pin` để cấp lại mã khác hoặc liên hệ Quản lý cơ sở để kích hoạt quy trình Điều chuyển ô kho khẩn cấp (`Relocation`). | Nhân viên bấm nút "Cấp lại PIN" hoặc "Yêu cầu đổi ô kho" ngay trên màn hình hoàn tất bàn giao. | `BR-ACC-03`<br>`BR-AVL-05` |
| **UNH-CHK-04** | **Khách đến trễ trong thời hạn ân hạn (Grace Period)** | Khách đến nhận kho sau ngày bắt đầu hợp đồng 1–2 ngày nhưng vẫn trong khoảng ân hạn (`checkinGraceDays`). | Hệ thống vẫn cho phép nhân viên thực hiện check-in bình thường, hợp đồng kích hoạt `ACTIVE`. Thời hạn kết thúc hợp đồng vẫn giữ nguyên theo mốc thỏa thuận ban đầu. | StaffDailyTask vẫn hiển thị task này kèm nhãn cảnh báo: *"Ân hạn nhận kho: Còn X ngày"*. | `BR-CHK-05` |

---

## Flow 3 — Return & Settlement: Trả kho, Nghiệm thu & Quyết toán cọc

* **Mã nghiệp vụ liên quan:** `SC-05`, `FS-03`, `FM-03`
* **Diễn viên (Actors):** `Storage Customer` (báo trả), `Facility Staff` (nghiệm thu thực tế), `Facility Manager` (phê duyệt quyết toán cọc)
* **Quy tắc nghiệp vụ cốt lõi:** `BR-RET-01..12`, `BR-DEP-04..05`, `BR-ACC-03`

### 4.1. Happy Path: Trả kho sạch đẹp & Hoàn cọc 100%

```
[Storage Customer — MyUnitsPage.tsx]
       │
       ├─► 1. Khách hàng thông báo trả kho trước hạn hoặc đúng hạn
       │      Frontend: MyUnitsPage.tsx (bấm "Báo trả kho")
       │      API: POST /api/v1/customer/contracts/{id}/return-notice
       │      Backend: CustomerRentalController ──► Contract.status ──► PENDING_RETURN [BR-RET-02]
       │               Mã PIN vẫn hoạt động bình thường để khách vào dọn dẹp đồ đạc [ISS-45]
       │
[Facility Manager — ContractsHubPage.tsx / WorkListPage.tsx]
       │
       ├─► 2. Quản lý phân công nhân viên nghiệm thu trả kho
       │      API: POST /api/v1/contracts/{id}/assign-return-staff
       │
[Facility Staff — StaffReturnInspectionPage.tsx]
       │
       ├─► 3. Nhân viên kiểm tra hiện trường & Nộp biên bản nghiệm thu
       │      Frontend: StaffReturnInspectionPage.tsx ──► ReturnInspectionForm.tsx
       │      API: POST /api/v1/contracts/{id}/return-inspection
       │      Backend: ContractController.submitReturnInspection()
       │               - Chụp ảnh hiện trạng kho đã dọn sạch, không hư hỏng
       │               - Thu hồi mã PIN: AccessCredential.status ──► REVOKED [BR-RET-09]
       │               - Đánh dấu cờ inspectionDone = true [ISS-50]
       │
[Facility Manager — ContractDetailPage.tsx]
       │
       ├─► 4. Quản lý xem trước quyết toán cọc (Settlement Preview)
       │      API: GET /api/v1/contracts/{id}/settlement-preview
       │      Công thức: Hoàn cọc = Tiền cọc ban đầu - Phí hư hại (0đ) - Phí dọn dẹp (0đ) - Nợ phạt (0đ) = 100% cọc [BR-RET-04]
       │
       ├─► 5. Quản lý phê duyệt hoàn cọc (Approve Settlement)
       │      API: POST /api/v1/contracts/{id}/approve-settlement
       │      Backend: Contract.status ──► CLOSED, StorageUnit.status ──► CLEANING
       │               Tạo lệnh hoàn trả 100% cọc qua tài khoản ngân hàng khách (trong 7 ngày làm việc) [BR-RET-05]
       │
       └─► 6. Hoàn tất vệ sinh ô kho
              API: POST /api/v1/contracts/{id}/complete-cleaning
              Backend: Chuyển StorageUnit.status ──► AVAILABLE (hoặc RESERVED nếu đã có người đặt trước) [BR-RET-09]
```

### 4.2. Unhappy & Exception Cases: Quyết toán âm, Nợ quá hạn & Hủy báo trả kho

| Mã kịch bản | Tình huống ngoại lệ / Lỗi | Điều kiện kích hoạt | Xử lý Backend & HTTP Status | Hiển thị Giao diện (Frontend) | Quy tắc nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UNH-RET-01** | **Chặn trả kho khi đang nợ phạt quá hạn (Block on Debt)** | Hợp đồng đang ở mốc quá hạn `D+4` trở đi có tiền phạt tích lũy chưa nộp. | Nếu gọi `POST /return-notice`, Backend trả về `400 Bad Request` (`MUST_SETTLE_OVERDUE_DEBT_FIRST`). Bắt buộc thanh toán sạch nợ phạt mới cho báo trả kho. | Nút "Báo trả kho" bị khóa mờ trên UI. Hiển thị thông báo: *"Vui lòng nộp phạt quá hạn trước khi thực hiện trả kho."* | `BR-RET-11`<br>`ISS-46` |
| **UNH-RET-02** | **Quyết toán âm (Khấu trừ vượt tiền cọc - Negative Settlement)** | Khách hàng làm hư hại vách ngăn nặng, xả rác bẩn: Chi phí đền bù (DAMAGE) + dọn dẹp (CLEANING) > Tiền cọc ban đầu. | `settlementPreview` trả về số âm (`refundAmount < 0`). Quản lý phê duyệt sẽ sinh khoản thu bổ sung `SETTLEMENT_DEFICIT`. Contract chuyển `PENDING_SETTLEMENT_PAYMENT`. Chỉ chuyển `CLOSED` sau khi khách trả đủ tiền bù. | Quản lý xem bảng cân đối màu đỏ cảnh báo âm tiền. Khách hàng nhận hóa đơn quét mã VietQR thanh toán bù phần chênh lệch. | `BR-RET-04` |
| **UNH-RET-03** | **Khách đổi ý muốn tiếp tục thuê (Hủy báo trả kho)** | Khách đã bấm báo trả kho nhưng sau đó muốn tiếp tục sử dụng kho (nhân viên chưa bấm bắt đầu nghiệm thu). | Khách gọi `POST /api/v1/customer/contracts/{id}/cancel-return`. Backend kiểm tra nếu chưa nghiệm thu thì chuyển `Contract.status ──► ACTIVE`, xóa task nghiệm thu của nhân viên. | Khách bấm nút "Hủy yêu cầu trả kho" trên `MyUnitsPage.tsx`. Thẻ hợp đồng trở về trạng thái hoạt động bình thường. | `BR-RET-12` |
| **UNH-RET-04** | **Khách hàng bỏ rơi đồ đạc / Không đến bàn giao trả kho** | Hợp đồng hết hạn, khách không liên lạc được hoặc không dọn dẹp đồ đạc ra khỏi kho. | Quản lý và nhân viên lập biên bản hiện trường đơn phương, chụp ảnh niêm phong đồ, chuyển kho sang `MAINTENANCE` để xử lý tài sản vô chủ, tịch thu 100% tiền cọc. | Manager xem danh sách kho cần xử lý cưỡng chế trên `ContractDashboardPage.tsx`. | `BR-OVD-11` |

---

## Flow 4 — BOM Policy & Pricing: Thiết lập Chính sách, Giá thuê & Báo cáo tổng thể

* **Mã nghiệp vụ liên quan:** `BM-01`, `BM-02`, `BM-03`, `BM-04`
* **Diễn viên (Actors):** `Business Operations Manager (BOM)` (chủ trì), `Facility Manager` (thực thi)
* **Quy tắc nghiệp vụ cốt lõi:** `BR-GEN-01..05`, `BR-PRI-01..04`, `BR-DEP-01`

### 5.1. Happy Path: Ban hành chính sách, niêm yết giá & Báo cáo KPI

```
[BOM Portal — BomRoutes.tsx]
       │
       ├─► 1. Quản lý Cơ sở kinh doanh (Facility Management)
       │      Frontend: BomFacilityManagementPage.tsx (/bom/facilities)
       │      API: GET/POST/PUT /api/v1/facilities
       │      Backend: Tự động sinh mã cơ sở thông minh FAC-... chống trùng [ISS-107]
       │
       ├─► 2. Thiết lập & Ban hành Phiên bản Chính sách Vận hành (Policy Versioning)
       │      Frontend: BomPolicyPage.tsx (/bom/policies)
       │      API: POST /api/v1/policies
       │      Backend: PolicyController ──► Cấu hình depositMultiplier, checkinGraceDays, overdueGraceDays...
       │               Ngày hiệu lực effectiveFrom >= Ngày hiện tại [BR-GEN-01]
       │
       ├─► 3. Quản lý Bảng giá thuê theo m² (Pricing Management)
       │      Frontend: BomPricingManagementPage.tsx (/bom/pricing)
       │      API: PUT /api/v1/pricing/facilities/{facilityId}
       │      Backend: PricingController ──► Cập nhật base_price_per_m2_monthly, lưu audit vào PriceAuditService [BR-GEN-05]
       │
       └─► 4. Báo cáo Doanh thu & Tỷ lệ lấp đầy Toàn hệ thống
              Frontend: BomDashboardPage.tsx (/bom/revenue, /bom/reports)
              API: GET /api/v1/reports/system/overview, GET /api/v1/reports/system/revenue
              Backend: SystemReportController ──► Tính toán Usage Rate = (OCCUPIED + RESERVED) / Tổng số ô kho [BM-04]
```

### 5.2. Unhappy & Exception Cases: Vi phạm ngày hiệu lực, Snapshot bất biến & Chặn xóa cơ sở

| Mã kịch bản | Tình huống ngoại lệ / Lỗi | Điều kiện kích hoạt | Xử lý Backend & HTTP Status | Hiển thị Giao diện (Frontend) | Quy tắc nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UNH-BOM-01** | **Vi phạm ngày hiệu lực chính sách (Past Date Policy)** | BOM đặt ngày bắt đầu hiệu lực `effectiveFrom` ở thời điểm trong quá khứ. | Backend ném `400 Bad Request` kèm thông báo *"Ngày hiệu lực của chính sách mới phải lớn hơn hoặc bằng ngày hiện tại"*. | Ô chọn ngày báo đỏ kèm thông báo lỗi trực quan trên form. | `BR-GEN-01` |
| **UNH-BOM-02** | **Chặn vô hiệu hóa / Xóa cơ sở đang hoạt động** | BOM bấm chuyển trạng thái cơ sở sang `INACTIVE` khi cơ sở đó vẫn còn hợp đồng `ACTIVE`, `OVERDUE` hoặc `PENDING_CHECK_IN`. | Backend kiểm tra ràng buộc toàn vẹn, từ chối cập nhật và ném `409 Conflict` (`FACILITY_HAS_ACTIVE_CONTRACTS`). | Modal cảnh báo: *"Không thể ngừng hoạt động cơ sở này vì hiện còn N hợp đồng đang lưu trữ hoặc chờ nhận kho."* | `BR-GEN-07` |
| **UNH-BOM-03** | **Bảo vệ Snapshot giá cũ khi BOM tăng giá thuê** | BOM cập nhật tăng giá thuê m² của một loại ô kho từ 150.000 đ lên 200.000 đ. | Backend đảm bảo tính toàn vẹn: Các hợp đồng và đơn đặt chỗ cũ vẫn giữ nguyên giá cũ được snapshot tại thời điểm tạo (`BR-GEN-05`). Chỉ các đơn tạo mới sau đó mới áp dụng giá mới. | Lịch sử điều chỉnh giá hiển thị rõ ràng trên `BomPriceAuditPage.tsx`. | `BR-GEN-05`<br>`BR-PRI-01` |
| **UNH-BOM-04** | **Loại kho chưa niêm yết giá (Unpriced Unit Type)** | Loại ô kho mới được tạo nhưng BOM chưa cài đặt bảng giá cho chi nhánh cơ sở. | Backend loại bỏ các ô kho thuộc loại này khỏi kết quả tìm kiếm khả dụng của khách hàng (`AvailabilityService`). | Trên giao diện Khách hàng, các loại kho chưa có giá sẽ bị ẩn hoàn toàn, không cho phép đặt chỗ ảo (`ISS-113`). | `ISS-113` |

---

## Flow 5 — Facility & Staff Management: Quản lý Cơ sở, Ô kho & Phân công nhân sự

* **Mã nghiệp vụ liên quan:** `FM-01`, `FM-04`, `FM-05`
* **Diễn viên (Actors):** `Facility Manager` (quản lý tại chi nhánh), `Facility Staff` (nhận phân công)
* **Quy tắc nghiệp vụ cốt lõi:** `BR-GEN-07`, `BR-AVL-01..05`

### 6.1. Happy Path: Drill-down 4 cấp quản lý kho & Phân ca trực nhân viên

```
[Facility Manager Portal — ManagerRoutes.tsx]
       │
       ├─► 1. Quản lý Ô kho Drill-down 4 cấp độ (FM-01)
       │      Frontend: FacilityListPage ──► UnitTypeListPage ──► StorageUnitListPage ──► StorageUnitDetailPage
       │      Backend: StorageUnitController ──► Giám sát trạng thái vật lý của từng ô kho
       │
       ├─► 2. Điều phối Nhân sự & Lịch trực Drill-down 4 cấp độ (FM-05)
       │      Frontend: StaffSchedulePage ──► ShiftCalendarPage ──► WorkListPage ──► WorkDetailPage
       │      API: POST /api/v1/manager/assignments
       │      Backend: StaffAssignmentController ──► Phân công ca trực (Sáng / Chiều / Tối) và gán task
       │
       └─► 3. Giám sát Báo cáo Sức khỏe Cơ sở
              Frontend: FacilityReportsPage.tsx (/manager/reports)
              Backend: FacilityReportController ──► Thống kê ô kho theo trạng thái và cảnh báo hợp đồng sắp hết hạn
```

### 6.2. Unhappy & Exception Cases: Xung đột ca trực, Bảo trì khẩn cấp & Phân quyền đa cơ sở

| Mã kịch bản | Tình huống ngoại lệ / Lỗi | Điều kiện kích hoạt | Xử lý Backend & HTTP Status | Hiển thị Giao diện (Frontend) | Quy tắc nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UNH-MGR-01** | **Xung đột lịch phân công ca trực (Shift Conflict)** | Quản lý gán cùng 1 nhân viên vào 2 ca trực trùng khung giờ trong cùng 1 ngày. | Backend kiểm tra khung giờ ca trực, từ chối lưu và ném `400 Bad Request` (`STAFF_ALREADY_ASSIGNED_IN_SHIFT`). | Lịch phân ca `ShiftCalendarPage.tsx` hiển thị cảnh báo trùng ca trực của nhân viên. | `FM-05` |
| **UNH-MGR-02** | **Ô kho bị sự cố đột xuất cần bảo trì khẩn cấp** | Ô kho đang `AVAILABLE` bị dột nước hoặc hỏng bóng đèn. | Quản lý gọi `PATCH /api/v1/storage-units/{id}/status` chuyển sang `MAINTENANCE`. Backend lập tức loại bỏ ô này khỏi sơ đồ chọn kho của khách (`UnitPickerPage.tsx`). | Thẻ ô kho trên sơ đồ đổi sang màu xám bảo trì, vô hiệu hóa click chọn. | `BR-AVL-02` |
| **UNH-MGR-03** | **Từ chối truy cập dữ liệu cơ sở khác (Multi-Facility Breach)** | Quản lý cơ sở A cố tình gọi API tra cứu danh sách hợp đồng hoặc ô kho của cơ sở B. | `FacilitySecurityService` đối soát danh sách `facilityIds` trong JWT token, ném `403 Forbidden` (`ACCESS_DENIED_TO_FACILITY`). | Giao diện hiển thị trang báo lỗi 403 trang nhã, không để lộ dữ liệu nhạy cảm của cơ sở bạn. | `SA-03`<br>`ISS-41` |

---

## Flow 6 — Contract Lifecycle: Gia hạn hợp đồng & Xử lý Quá hạn (Overdue)

* **Mã nghiệp vụ liên quan:** `SC-03`, `FM-02`, `BM-02`
* **Diễn viên (Actors):** `Storage Customer`, `Facility Manager`, `Tác vụ ngầm OverdueCronJob`
* **Quy tắc nghiệp vụ cốt lõi:** `BR-REN-01..10`, `BR-OVD-01..11`

### 7.1. Sub-flow 6.1: Gia hạn hợp đồng (Happy & Xung đột lịch)

```
[Customer — RenewalPage.tsx]
       │
       ├─► 1. Khách hàng bấm "Gia hạn" trên thẻ hợp đồng ACTIVE
       │      API: GET /api/v1/contracts/{id}/renewal/preview?months={n}
       │      Backend: RenewalServiceImpl.previewRenewal()
       │               - Khách đang thuê được ưu tiên giữ chỗ gia hạn đến hết ngày đáo hạn [BR-REN-01]
       │               - Đơn giá thuê áp dụng theo biểu giá hiện hành tại thời điểm gia hạn [BR-REN-05]
       │
       ├─► 2. Khởi tạo gia hạn & Khóa giữ chỗ 48h
       │      API: POST /api/v1/contracts/{id}/renewal/initiate
       │      Backend: Khóa ô kho 48h ở trạng thái PENDING_RENEWAL [BR-REN-10]
       │               Sinh mã VietQR thanh toán tiền thuê kỳ mới
       │
       └─► 3. Thanh toán thành công (Webhook Callback)
              Backend: Cộng thêm N tháng vào end_date: Contract.end_date = Contract.end_date + N tháng [BR-REN-04]
                       Hợp đồng quay trở về trạng thái ACTIVE, lưu lịch sử gia hạn
```

* **Ngoại lệ Xung đột lịch gia hạn (UNH-REN-01):** Nếu khách để hợp đồng bước sang quá hạn mới bấm gia hạn và ô kho đó đã được một khách hàng mới đặt giữ chỗ cho kỳ tiếp theo (`BR-REN-09`), hệ thống sẽ ném lỗi `409 Conflict` (`RENEWAL_PERIOD_CONFLICT`). Giao diện thông báo: *"Ô kho đã có người đặt trước cho giai đoạn tới, không thể gia hạn tiếp. Vui lòng liên hệ quản lý để đổi ô kho khác."*

### 7.2. Sub-flow 6.2: Xử lý Quá hạn (Chuỗi Unhappy Cases D+1 đến D+10)

Khi hợp đồng đến ngày kết thúc (`end_date`) mà khách chưa thanh toán gia hạn hoặc chưa hoàn tất trả kho:

```
[00:00:00 HẰNG ĐÊM — Tác vụ OverdueCronJob quét toàn bộ hợp đồng ACTIVE đã quá ngày end_date]
       │
       ├─► MỐC 1: Ngày D+1 đến D+3 (Giai đoạn Ân hạn — Grace Period) [BR-OVD-01, BR-OVD-02]
       │   - Trạng thái hợp đồng: OVERDUE
       │   - Phí phạt phát sinh = 0 VNĐ (Ân hạn hỗ trợ khách hàng)
       │   - Quyền ra vào kho: Mã PIN vẫn HOẠT ĐỘNG BÌNH THƯỜNG (Khách vào lấy đồ bình thường)
       │   - Giao diện khách (MyUnitsPage.tsx):
       │     + HIỆN nút "Báo trả kho" (Khách trả kho xong trong mốc này vẫn được hoàn 100% tiền cọc)
       │     + ẨN nút "Đóng nợ phạt" (do nợ phạt = 0)
       │     + KHÓA nút "Gia hạn" (mất quyền ưu tiên giữ chỗ cho đến khi xử lý hợp đồng)
       │
       ├─► MỐC 2: Ngày D+4 đến D+6 (Bắt đầu tính Phạt lũy tiến) [BR-OVD-03, BR-OVD-04]
       │   - Tính phí phạt quá hạn cộng dồn hằng đêm: 10%/ngày dựa trên đơn giá thuê ngày của hợp đồng
       │   - Quyền ra vào kho: Mã PIN vẫn hoạt động bình thường
       │   - Giao diện khách (MyUnitsPage.tsx):
       │     + ẨN nút "Báo trả kho" (Bắt buộc phải trả hết nợ phạt mới được mở lại quyền trả kho) [ISS-46]
       │     + HIỆN nút "Đóng nợ phạt" (Quét mã VietQR nộp phạt: POST /api/v1/customer/contracts/{id}/overdue-payment)
       │
       ├─► MỐC 3: Ngày D+7 đến D+9 (Khóa Quyền truy cập ô kho) [BR-OVD-05, ISS-47]
       │   - Hệ thống tự động chuyển mã PIN: AccessCredential.status ──► SUSPENDED
       │   - Khách hàng không thể tự nhập mã PIN mở khóa kho; muốn vào phải liên hệ nhân viên trực quầy
       │   - Phí phạt tiếp tục tích lũy thêm 10%/ngày
       │   - Sau khi khách hàng thanh toán hết nợ phạt ──► Mã PIN tự động kích hoạt lại ACTIVE ngay lập tức
       │
       └─► MỐC 4: Ngày D+10 trở đi (Chấm dứt Hợp đồng đơn phương do Quá hạn) [BR-OVD-07, BR-OVD-11]
           - Trạng thái hợp đồng chuyển thành: TERMINATED_OVERDUE
           - Quyền truy cập bị thu hồi vĩnh viễn: AccessCredential.status ──► REVOKED
           - Chốt trần nợ phạt tối đa: Không vượt quá 70% tổng giá trị hợp đồng [BR-OVD-07]
           - Ô kho chuyển sang MAINTENANCE để nhân viên tiến hành niêm phong, dọn dẹp hoặc thanh lý tài sản bỏ lại [BR-OVD-11]
```

---

## Flow 7 — Support Ticket & Incident: Xử lý Sự cố & Yêu cầu hỗ trợ

* **Mã nghiệp vụ liên quan:** `SC-06`, `FS-04`, `FM-05`
* **Diễn viên (Actors):** `Storage Customer` (gửi yêu cầu), `Facility Staff` (xử lý tại chỗ), `Facility Manager` (điều phối)
* **Quy tắc nghiệp vụ cốt lõi:** `BR-SUP-01..03`, `BR-ACC-03`, `BR-AVL-05`

### 8.1. Happy Path: Báo hỏng hạ tầng & Nhân viên xử lý miễn phí 0đ

```
[Customer — SupportPage.tsx]
       │
       ├─► 1. Khách gửi phiếu yêu cầu hỗ trợ sự cố
       │      API: POST /api/v1/customer/support ──► Sinh mã SUP-YYYYMM-NNNN chống trùng
       │      Trạng thái ban đầu: OPEN
       │
[Manager — IncidentListPage.tsx]
       │
       ├─► 2. Quản lý phân công nhân viên ca trực
       │      API: POST /api/v1/support/{id}/assign ──► Trạng thái: IN_PROGRESS
       │
[Staff — StaffIncidentPage.tsx]
       │
       └─► 3. Nhân viên xử lý xong sự cố hạ tầng (Lỗi cơ sở: kẹt ổ khóa, dột trần)
              API: POST /api/v1/support/{id}/resolve
              Backend: Phụ phí = 0 đ (Cơ sở chịu hoàn toàn chi phí)
                       Nộp ảnh hiện trường sau khi sửa xong
                       SupportRequest.status ──► CLOSED ngay lập tức [BR-SUP-03]
```

### 8.2. Unhappy & Exception Cases: Bồi thường lỗi khách, Điều chuyển kho & Cấp lại mã PIN

| Mã kịch bản | Tình huống ngoại lệ / Lỗi | Điều kiện kích hoạt | Xử lý Backend & HTTP Status | Hiển thị Giao diện (Frontend) | Quy tắc nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UNH-SUP-01** | **Bồi thường sự cố do lỗi khách hàng (Customer Fault)** | Sự cố do khách sơ suất gây ra (làm gãy khóa, bôi bẩn vách ngăn kho). | Nhân viên chọn loại phụ phí từ bảng `ExtraFeeType`, nhập số tiền đền bù. Bắt buộc nhân viên phải xác nhận đã thu đủ tiền bồi thường mới cho phép đóng ticket. | Form nghiệm thu hiện ô nhập phụ phí và checkbox xác nhận thu tiền trước khi nộp. | `BR-SUP-02` |
| **UNH-SUP-02** | **Sự cố nặng cần đổi ô kho khẩn cấp (Emergency Relocation)** | Ô kho bị ngập nước hoặc ẩm mốc nặng không thể tiếp tục lưu trữ tài sản. | Quản lý thực hiện đổi ô kho dự phòng (`Relocation`). Hệ thống bảo lưu 100% đơn giá thuê và tiền cọc ban đầu của khách hàng (`BR-AVL-05`), sinh Phụ lục điều chuyển hợp đồng. | Quản lý thao tác chọn ô kho mới trên `IncidentDetailPage.tsx`. Hợp đồng khách tự động cập nhật mã ô kho mới. | `BR-AVL-05`<br>`BR-SUP-02` |
| **UNH-SUP-03** | **Khách quên mã PIN vào ban đêm (Lost PIN Self-Service)** | Khách hàng đến cơ sở ngoài giờ làm việc và quên mã PIN mở khóa. | Khách gọi `POST /api/v1/customer/access/regenerate-pin`. Backend sinh ngay ngẫu nhiên mã PIN 6 chữ số mới và cập nhật tức thì vào CSDL mà không cần chờ nhân viên trực duyệt. | Khách bấm nút "Cấp lại PIN mới" trên `SupportPage.tsx` hoặc thẻ hợp đồng, mã PIN mới hiện ngay trên màn hình. | `BR-ACC-03` |

---

## Flow SYS — Authentication, Authorization & Security

* **Mã nghiệp vụ liên quan:** `SA-01`, `SA-02`, `SA-03`, `SA-04`
* **Diễn viên (Actors):** Mọi người dùng (`CUSTOMER`, `STAFF`, `MANAGER`, `BOM`, `ADMIN`)
* **Quy tắc nghiệp vụ cốt lõi:** JWT Stateless, Phân quyền RBAC, Ngăn chặn Header Spoofing (`ISS-40`), Ngăn chặn rò rỉ dữ liệu đa cơ sở (`ISS-41`)

### 9.1. Trình tự thực thi chuẩn (Happy Path)

```
[Browser Client]
       │
       ├─► 1. Đăng ký tài khoản Khách hàng: POST /api/v1/auth/register (Mã hóa mật khẩu BCrypt, User.role = CUSTOMER)
       ├─► 2. Đăng nhập: POST /api/v1/auth/login ──► Trả về Access Token + Refresh Token (Payload mang userId, role, facilityIds)
       ├─► 3. Bảo vệ API: Mọi request gửi kèm Bearer Token ──► JwtAuthenticationFilter nạp UserPrincipal vào SecurityContext
       └─► 4. Quản trị viên quản lý tài khoản nội bộ: CRUD /api/v1/admin/users (Tạo Staff, Manager, BOM; gán cơ sở)
```

### 9.2. Kịch bản Ngoại lệ & Bảo mật (Security Exception Cases)

| Mã kịch bản | Tình huống ngoại lệ / Lỗi | Điều kiện kích hoạt | Xử lý Backend & HTTP Status | Hiển thị Giao diện (Frontend) |
| :--- | :--- | :--- | :--- | :--- |
| **UNH-SYS-01** | **Xác thực thất bại / Tài khoản bị khóa** | Nhập sai mật khẩu hoặc tài khoản đã bị Admin chuyển sang `INACTIVE`. | Backend trả về `401 Unauthorized` hoặc `403 Forbidden` (`ACCOUNT_DISABLED`). | Hiển thị thông báo lỗi đăng nhập: *"Tài khoản hoặc mật khẩu không chính xác hoặc đã bị khóa."* |
| **UNH-SYS-02** | **Token hết hạn (Token Expired)** | Access Token hết hạn trong khi người dùng đang thao tác. | Gửi Refresh Token qua `POST /api/v1/auth/refresh`. Nếu refresh token cũng hết hạn, trả về `401 Unauthorized`. | Tự động refresh ngầm; nếu thất bại thì xóa `tokenStorage` và điều hướng về trang đăng nhập kèm thông báo phiên hết hạn. |
| **UNH-SYS-03** | **Tấn công giả mạo Header (Header Spoofing Attack)** | Kẻ xấu gửi request kèm header `X-Staff-Id: 99` để mạo danh nhân viên. | Backend loại bỏ hoàn toàn việc đọc header client giả mạo, chỉ lấy danh tính từ token JWT được ký điện tử (`@AuthenticationPrincipal UserPrincipal`) (`ISS-40`). | Request mạo danh bị từ chối hoặc chỉ thực thi đúng quyền của token thực tế. |

---

## 10. Hệ thống Tác vụ Tự động ngầm (Scheduled Cron Jobs)

Hệ thống cấu hình 3 tác vụ tự động chạy nền (Background Scheduled Tasks) độc lập, đảm bảo tự động hóa việc tính toán thời hạn và quản lý dữ liệu:

| Tên Cron Job | Lịch biểu (Cron / Fixed Delay) | Múi giờ | Mục đích & Tác động CSDL | Tập tin mã nguồn |
| :--- | :--- | :--- | :--- | :--- |
| **`ReservationHoldExpiryJob`** | `fixedDelay = 120000` (Mỗi 2 phút quét 1 lần) | Server Time | Quét các đơn đặt chỗ `PENDING_PAYMENT` có `hold_expires_at < now`. Chuyển trạng thái sang `EXPIRED`, giải phóng ô kho để khách khác có thể đặt. | `backend/.../reservation/scheduler/ReservationHoldExpiryJob.java` |
| **`OverdueCronJob`** | `0 0 0 * * ?` (Đúng 00:00:00 hằng đêm) | `Asia/Ho_Chi_Minh` | Quét toàn bộ hợp đồng quá hạn. D+1: Chuyển `OVERDUE`; D+4..D+6: Tính phí phạt 10%/ngày; D+7: Khóa mã PIN sang `SUSPENDED`; D+10: Chấm dứt sang `TERMINATED_OVERDUE`, khóa vĩnh viễn mã PIN sang `REVOKED`. | `backend/.../policy/scheduler/OverdueCronJob.java` |
| **`SupportAutoCloseJob`** | `0 30 0 * * ?` (Đúng 00:30:00 hằng đêm) | `Asia/Ho_Chi_Minh` | Quét các phiếu sự cố ở trạng thái `RESOLVED`. Nếu đã qua số ngày làm việc quy định trong chính sách (`supportAutoCloseWorkingDays`, mặc định 7 ngày), tự động chuyển sang `CLOSED`. | `backend/.../support/scheduler/SupportAutoCloseJob.java` |

---

## 11. Biểu đồ Vòng đời Trạng thái (Entity State Machines)

### 11.1. Đơn đặt chỗ (Reservation)

```
       [Tạo đơn giữ chỗ]
              │
              ▼
       PENDING_PAYMENT ────────(Hết 48h không nộp tiền)──────► EXPIRED
              │
              ├─(Thanh toán thành công)─► CONFIRMED
              │                               │
              │                               ├─(Khách đến nhận kho)──► FULFILLED
              │                               │
              │                               ├─(Khách hủy đơn)───────► CANCELLED
              │                               │
              │                               └─(Quá ân hạn không đến)─► NO_SHOW
              ▼
          CANCELLED
```

### 11.2. Hợp đồng thuê kho (RentalContract)

```
  [Đặt chỗ thành công]
           │
           ▼
   PENDING_CHECK_IN ─────────(Từ chối bàn giao / Không đến)───────► CANCELLED / NO_SHOW
           │
      (Check-in đạt)
           ▼
        ACTIVE ──────────────(Khởi tạo gia hạn 48h)─────────────► PENDING_RENEWAL
           │                                                              │
           │                                                              ├─(Nộp tiền OK)──► ACTIVE
           │                                                              └─(Hết 48h)──────► ACTIVE
           │
           ├─(Báo trả kho)──► PENDING_RETURN ──► (Duyệt quyết toán cọc)──► CLOSED
           │                         ▲
           │                         │ (Sau khi đóng hết nợ phạt)
      (Đến ngày end_date)            │
           ▼                         │
        OVERDUE ─────────────────────┴─(D+10 không xử lý)─────────► TERMINATED_OVERDUE
```

### 11.3. Ô kho vật lý (StorageUnit)

```
        AVAILABLE ──────────(Khách đặt chỗ & nộp tiền)──────────► RESERVED
            ▲                                                          │
            │                                                      (Check-in)
            │                                                          ▼
            ├────────(Hoàn tất vệ sinh / Không ai đặt trước)────── OCCUPIED
            │                                                          │
            │                                                      (Trả kho)
            ▼                                                          ▼
       MAINTENANCE ◄────────(Từ chối bàn giao / Báo hỏng)──────── CLEANING
```

### 11.4. Mã PIN truy cập (AccessCredential)

```
  [Sau khi Check-in thành công]
                │
                ▼
             ACTIVE ◄──────────────(Đóng sạch nợ phạt D+7..D+9)──────────┐
                │                                                         │
                ├─────────(Đến ngày D+7 quá hạn chưa trả)─────────► SUSPENDED
                │                                                         │
                ├─────────(Hoàn tất trả kho hoặc chạm mốc D+10)───────────┤
                ▼                                                         ▼
             REVOKED ◄────────────────────────────────────────────────────┘
```

---

## 12. Bảng Tra cứu Nhanh Mã Nguồn (Quick Code Index)

### 12.1. Phân hệ Backend (Spring Boot)

| Phân hệ / Nghiệp vụ | Controller | Service chính | Repository chính |
| :--- | :--- | :--- | :--- |
| **Đặt chỗ (Flow 1)** | `ReservationController`<br>`CustomerRentalController` | `ReservationServiceImpl`<br>`CustomerRentalServiceImpl` | `ReservationRepository`<br>`RentalContractRepository` |
| **Thanh toán (Flow 1, 6)** | `PaymentController` | `PaymentServiceImpl` | `PaymentTransactionRepository` |
| **Bàn giao / Check-in (Flow 2)** | `ContractController` | `ContractServiceImpl` | `RentalContractRepository`<br>`HandoverRecordRepository` |
| **Nghiệm thu / Trả kho (Flow 3)** | `ContractController`<br>`CustomerRentalController` | `ContractServiceImpl` | `RentalContractRepository`<br>`ReturnInspectionRepository` |
| **Chính sách & Biểu giá (Flow 4)** | `PolicyController`<br>`PricingController`<br>`SurchargeController` | `PolicyServiceImpl`<br>`PricingServiceImpl`<br>`SurchargeServiceImpl` | `PolicyVersionRepository`<br>`FacilityUnitTypePriceRepository`<br>`ExtraFeeTypeRepository` |
| **Báo cáo hệ thống & Cơ sở (Flow 4, 5)** | `SystemReportController`<br>`FacilityReportController` | `SystemReportServiceImpl`<br>`FacilityReportServiceImpl` | `FacilityRepository`<br>`RentalContractRepository` |
| **Cơ sở & Ô kho (Flow 5)** | `FacilityController`<br>`StorageUnitController`<br>`UnitTypeController` | `FacilityServiceImpl`<br>`StorageUnitServiceImpl`<br>`UnitTypeServiceImpl` | `FacilityRepository`<br>`StorageUnitRepository`<br>`UnitTypeRepository` |
| **Phân công ca trực (Flow 5)** | `StaffAssignmentController`<br>`StaffDailyTaskController` | `StaffAssignmentServiceImpl`<br>`StaffDailyTaskServiceImpl` | `StaffShiftRepository`<br>`DailyTaskRepository` |
| **Gia hạn hợp đồng (Flow 6.1)** | `ContractRenewalController` | `RenewalServiceImpl` | `ContractRenewalHistoryRepository` |
| **Xử lý Quá hạn (Flow 6.2)** | `OverdueCronJob` (Scheduler) | `OverdueProcessingServiceImpl` | `RentalContractRepository`<br>`AccessCredentialRepository` |
| **Yêu cầu hỗ trợ & Sự cố (Flow 7)** | `CustomerSupportController`<br>`StaffSupportController` | `CustomerSupportServiceImpl`<br>`StaffSupportServiceImpl` | `SupportRequestRepository` |
| **Bảo mật & Người dùng (SYS)** | `AuthController`<br>`UserController`<br>`AuditLogController` | `AuthServiceImpl`<br>`UserServiceImpl`<br>`AuditLogServiceImpl` | `UserRepository`<br>`AuditLogRepository` |

### 12.2. Phân hệ Frontend (React + TypeScript)

| Vai trò (Actor) | Tuyến đường (Route) | Trang Giao diện (Page Component) |
| :--- | :--- | :--- |
| **Khách hàng (`CUSTOMER`)** | `/customer` | `HomePage.tsx` |
| | `/customer/units` | `UnitPickerPage.tsx` |
| | `/customer/booking` | `BookingPage.tsx` |
| | `/customer/payment` | `PaymentPage.tsx` / `SandboxCheckoutPage.tsx` |
| | `/customer/my-units` | `MyUnitsPage.tsx` |
| | `/customer/renew/:contractId` | `RenewalPage.tsx` |
| | `/customer/support` | `SupportPage.tsx` |
| **Nhân viên quầy (`STAFF`)** | `/staff` | `StaffDashboardPage.tsx` |
| | `/staff/check-in` | `StaffCheckInPage.tsx` |
| | `/staff/return` | `StaffReturnInspectionPage.tsx` |
| | `/staff/incidents` | `StaffIncidentPage.tsx` |
| **Quản lý cơ sở (`MANAGER`)** | `/manager` | `ManagerDashboardPage.tsx` |
| | `/manager/facilities` | `FacilityListPage.tsx` |
| | `/manager/facilities/:facilityId` | `UnitTypeListPage.tsx` |
| | `/manager/facilities/:facilityId/unit-types/:typeId` | `StorageUnitListPage.tsx` |
| | `.../units/:unitId` | `StorageUnitDetailPage.tsx` |
| | `/manager/contracts` | `ContractDashboardPage.tsx` |
| | `/manager/contracts/:contractId` | `ContractDetailPage.tsx` |
| | `/manager/staff-schedule` | `StaffSchedulePage.tsx` / `ShiftCalendarPage.tsx` |
| | `/manager/staff-schedule/.../shifts` | `WorkListPage.tsx` / `WorkDetailPage.tsx` |
| | `/manager/incidents` | `IncidentDashboardPage.tsx` / `IncidentListPage.tsx` / `IncidentDetailPage.tsx` |
| | `/manager/reports` | `FacilityReportsPage.tsx` |
| **Điều hành cấp cao (`BOM`)** | `/bom/facilities` | `BomFacilityManagementPage.tsx` |
| | `/bom/pricing` | `BomPricingManagementPage.tsx` |
| | `/bom/policies` | `BomPolicyPage.tsx` |
| | `/bom/price-audit` | `BomPriceAuditPage.tsx` |
| | `/bom/revenue` / `/bom/reports` | `BomDashboardPage.tsx` |
| **Quản trị hệ thống (`ADMIN`)** | `/admin/users` | `AdminUsersPage.tsx` |
| | `/admin/roles` | `AdminUsersPage.tsx` (Lọc theo Quản lý cơ sở) |
| | `/admin/facility-assignments` | `AdminUsersPage.tsx` (Lọc theo Nhân viên quầy) |
| | `/admin/activity-logs` | `AdminAuditLogsPage.tsx` |
| **Xác thực (`AUTH`)** | `/auth/login` | `LoginPage.tsx` |
| | `/auth/register` | `RegisterPage.tsx` |
| | `/auth/forgot-password` | `ForgotPasswordPage.tsx` |

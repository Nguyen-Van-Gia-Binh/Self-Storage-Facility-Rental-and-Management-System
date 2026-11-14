# WORKFLOWS.md — Bản đồ Luồng đi Toàn hệ thống (End-to-End Workflows)

> **Dự án:** Self-Storage Facility Rental and Management System (SWP391)  
> **Ngăn xếp công nghệ:** Spring Boot 3 (Java 17 LTS) · React 18 (TypeScript + Vite) · SQL Server 2022 · Flyway · JWT  
> **Mục đích tài liệu:** Cung cấp **bản đồ kỹ thuật toàn diện** mô tả chi tiết từng bước đi của dữ liệu và logic trên toàn bộ 7 luồng nghiệp vụ chính và luồng hệ thống. Tài liệu mô tả song song cả **Luồng chuẩn thành công (Happy Path)** lẫn **Các kịch bản rẽ nhánh, ngoại lệ & xử lý lỗi (Unhappy & Exception Cases)**, giúp lập trình viên và kiểm thử viên lần theo chính xác từ **Giao diện (Frontend) → REST Controller → Service Layer → Repository / CSDL → Scheduled Jobs**.
>
> **Tài liệu tham chiếu chuẩn:**
>
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
   - 7.2. [Sub-flow 6.2: Xử lý Quá hạn (Vòng đời 8 Ngày Khép kín D+1 đến D+8)](#72-sub-flow-62-xử-lý-quá-hạn-vòng-đời-8-ngày-khép-kín-d1-đến-d8)
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

- **Quy chuẩn múi giờ:** Toàn bộ hệ thống Backend và Cron job chạy theo múi giờ chuẩn Việt Nam `Asia/Ho_Chi_Minh` (UTC+7) (`BR-GEN-06`).
- **Quy chuẩn bảo mật:** Khách hàng (`CUSTOMER`) chỉ được thao tác trên tài nguyên của chính mình; Nhân viên (`STAFF`) và Quản lý cơ sở (`MANAGER`) bị giới hạn dữ liệu trong phạm vi cơ sở được phân công thông qua `FacilitySecurityService` (`BR-GEN-07`).

---

## Flow 1 — Reservation: Đặt chỗ & Thanh toán giữ ô kho

- **Mã nghiệp vụ liên quan:** `SC-01`, `SC-02`, `SC-03`
- **Diễn viên (Actors):** `Storage Customer` (chủ trì), `Facility Manager` (theo dõi)
- **Quy tắc nghiệp vụ cốt lõi:** `BR-RES-01..06`, `BR-AVL-01..05`, `BR-PRI-01..04`, `BR-PAY-01..06`, `BR-DEP-01..06`, `BR-CAN-01..05`, `BR-GEN-02`, `BR-SUP-04`

### 2.1. Happy Path: Đặt chỗ & Thanh toán thành công

```
[Customer Browser]
       │
       ├─► 1. Xem danh mục cơ sở & ô kho
       │      Frontend: HomePage.tsx (tại CustomerRoutes)
       │      API: GET /api/v1/facilities
       │      Backend: FacilityController.listFacilities() ──► FacilityServiceImpl ──► FacilityRepository
       │
       ├─► 2. Chọn hạng kho và kiểm tra hạn ngạch còn trống
       │      Frontend: UnitPickerPage.tsx (khách chọn Unit Type, không chọn ô vật lý)
       │      API: kiểm tra capacity theo facilityId, unitTypeId, startDate, months
       │      Backend: AvailabilityServiceImpl.checkAvailability()
       │               Trừ suất cho mỗi nghĩa vụ giao kỳ, kèm đệm 15 ngày [BR-AVL-01, BR-AVL-04]
       │
       ├─► 3. Điền thông tin đặt chỗ & Xem trước bảng kê chi phí (Cost Breakdown Preview)
       │      Frontend: BookingPage.tsx
       │      API: POST /api/v1/reservations/preview
       │      Backend: ReservationController.previewCost() ──► ReservationServiceImpl.calculateCost()
       │               - Đơn giá snapshot từ bảng giá hiệu lực của cơ sở [BR-PRI-01]
       │               - Tiền thuê = Đơn giá m² × Diện tích × Số tháng [BR-PRI-01]
       │               - Tiền cọc = Đơn giá 1 tháng × depositMultiplier từ PolicyVersion hiện hành [BR-DEP-01]
       │               - Tùy chọn Gói Bảo vệ Hàng hóa Mở rộng = 50.000 đ × Số tháng (bảo vệ tới 50 triệu) [BR-SUP-04]
       │               - Tổng thanh toán ban đầu = Tiền thuê + Tiền cọc + Phí bảo vệ (nếu có) [BR-DEP-02, BR-SUP-04]
       │
       ├─► 4. Xác nhận đặt chỗ & Khóa giữ chỗ (Lock Capacity 48 giờ)
       │      Frontend: BookingPage.tsx ──► Điều hướng sang PaymentPage.tsx
       │      API: POST /api/v1/reservations (yêu cầu đăng nhập, cấm Anonymous booking [ISS-42])
       │      Backend: ReservationController.createReservation() ──► ReservationServiceImpl
       │               - Kiểm tra khách có vi phạm hợp đồng OVERDUE nợ đọng không? [BR-OVD-09]
       │               - Giữ hạn ngạch hạng kho nguyên tử [BR-RES-02, BR-AVL-03]
       │               - Snapshot PolicyVersion hiện tại vào cột policy_snapshot [BR-GEN-02]
       │               - Tạo Reservation (status: PENDING_PAYMENT, storage_unit_id: null, hold_expires_at: now + 48h) [BR-DEP-03]
       │               - Tạo sẵn RentalContract PENDING_CHECK_IN, storage_unit_id vẫn null
       │
       ├─► 5. Thanh toán trực tuyến (VNPay Sandbox)
       │      Frontend: PaymentPage.tsx / SandboxCheckoutPage.tsx
       │      API: POST /api/v1/payments/checkout
       │      Backend: PaymentController ──► PaymentServiceImpl
       │               - Tạo PaymentTransaction (type: CHARGE, status: PENDING)
       │               - Tạo URL chuyển hướng cổng thanh toán VNPay Sandbox (HMAC-SHA512)
       │
       ├─► 6. Xác nhận thanh toán thành công (Webhook / Callback / Sandbox Confirm)
       │      API: POST /api/v1/payment/callback hoặc POST /api/v1/payment/sandbox-pay
       │      Backend: PaymentController.handleCallback() ──► PaymentServiceImpl.confirmPayment()
       │               - Đánh dấu PaymentTransaction.status = SUCCESS
       │               - Cập nhật Reservation.status = CONFIRMED [BR-PAY-02]
       │               - Không đổi trạng thái StorageUnit; storage_unit_id vẫn null [BR-AVL-04]
       │               - Hợp đồng Contract.status duy trì PENDING_CHECK_IN, chờ FM gán ô
       │
       ├─► 6b. FM phân bổ ô vật lý trước ngày Check-in
       │      Frontend: hàng đợi phân bổ trên cổng Facility Manager (sơ đồ mặt bằng dành cho FM)
       │      API: PATCH /api/v1/reservations/{id}/assign-unit
       │      Backend: gán storage_unit_id của ô AVAILABLE cùng Unit Type
       │               - StorageUnit AVAILABLE ──► RESERVED [BR-AVL-04]
       │               - Đổi ô trước startDate: ô cũ về AVAILABLE, ô mới sang RESERVED
       │
       └─► 7. Khách hàng theo dõi hợp đồng đặt chỗ
              Frontend: MyUnitsPage.tsx (hiển thị thẻ hợp đồng "Chờ nhận kho" kèm thời hạn ân hạn)
```

### 2.2. Unhappy & Exception Cases: Xử lý Lỗi & Ngoại lệ Đặt chỗ

| Mã kịch bản    | Tình huống ngoại lệ / Lỗi                              | Điều kiện kích hoạt                                                                              | Xử lý Backend & HTTP Status                                                                                                                                                                                                                                                                                                                                                                                 | Hiển thị Giao diện (Frontend)                                                                                                                                     | Quy tắc nghiệp vụ          |
| :------------- | :----------------------------------------------------- | :----------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------- |
| **UNH-RES-01** | **Chặn khách nợ xấu (Overdue Debt Block)**             | Khách hàng đang có ít nhất 1 hợp đồng `OVERDUE` còn nợ đọng tiền phạt.                           | `POST /reservations` trả về `400 Bad Request` kèm mã lỗi `CUSTOMER_HAS_OVERDUE_DEBT`. Không cho tạo đơn mới.                                                                                                                                                                                                                                                                                                | Hiển thị thông báo đỏ: _"Quý khách đang có hợp đồng quá hạn chưa thanh lý nợ. Vui lòng tất toán nợ trước khi đặt kho mới."_ Kèm nút chuyển nhanh đến tab Quá hạn. | `BR-OVD-09`                |
| **UNH-RES-02** | **Hết suất hạng kho (Race Condition)**                 | 2 khách cùng xác nhận suất hạn ngạch cuối của một Unit Type tại cùng 1 giây.                     | Giữ hạn ngạch nguyên tử. Giao dịch đến sau thất bại, `409 Conflict` (`CAPACITY_NOT_AVAILABLE`).                                                                                                                                                                                                                                                                                                             | Thông báo: _"Loại ô kho vừa hết chỗ, vui lòng chọn lại."_                                                                                                         | `BR-RES-02`<br>`BR-AVL-03` |
| **UNH-RES-03** | **Hết hạn giữ chỗ 48h (Hold Timeout)**                 | Khách hàng không quét mã QR nộp tiền trong vòng 48 giờ kể từ khi tạo đơn.                        | `ReservationHoldExpiryJob` quét ngầm: `Reservation.status = EXPIRED`, hủy hợp đồng tạm, nhả hạn ngạch hạng kho. Không có ô vật lý nào đổi trạng thái.                                                                                                                                                                                                                                                       | Thẻ đơn hàng chuyển sang tab "Đã kết thúc / Hết hạn". Nút thanh toán bị vô hiệu hóa.                                                                              | `BR-DEP-03`                |
| **UNH-RES-04** | **Khách tự hủy đơn trước khi nhận kho (Cancellation)** | Khách hàng bấm nút "Hủy đơn đặt chỗ" trước ngày hẹn nhận kho (`POST /reservations/{id}/cancel`). | Áp dụng chính sách hoàn cọc 3 tầng chuẩn Airbnb/Booking: <br>• Hủy trước ≥ 7 ngày: Hoàn 100% cọc + 100% tiền thuê (`BR-CAN-01`).<br>• Hủy từ 2 đến 6 ngày (≥ 48h và < 7 ngày): Phạt 50% cọc (hoàn 50% cọc) + 100% tiền thuê (`BR-CAN-02`).<br>• Hủy sát nút < 48h: Phạt 100% cọc (tịch thu trọn 1 tháng cọc) + 100% tiền thuê (`BR-CAN-03`).<br>Cập nhật `Reservation.status = CANCELLED`. Nếu FM đã gán ô thì trả ô đó về `AVAILABLE`; nếu chưa gán thì chỉ nhả hạn ngạch. | Modal hiển thị rõ số tiền cọc được hoàn và số tiền bị khấu trừ trước khi khách bấm xác nhận hủy. | `BR-CAN-01..05` |
| **UNH-RES-05** | **Dời ngày nhận kho có thu phí chiếm dụng (Paid Reschedule)** | Khách bấm "Dời ngày nhận kho" trước ngày bắt đầu ≥ 48h (`POST /contracts/{id}/reschedule-period`). | Tính phí dời ngày = Số ngày dời × (Đơn giá tháng / 30). Tối đa dời 7 ngày (`reschedule.max_days = 7`) và **chỉ được dời tối đa 1 lần duy nhất** (`reschedule.max_times = 1`). Khách thanh toán phí dời ngày. Hệ thống kiểm tra capacity khung ngày mới; nếu hợp lệ, tịnh tiến `newEndDate = oldEndDate + số_ngày_dời` và cập nhật lịch gán ô. Nếu dời > 7 ngày, báo < 48h hoặc đã dời 1 lần thì hệ thống từ chối và hướng dẫn chọn Nhận kho Online hoặc Hủy đơn. | Form cho chọn dời 1..7 ngày, hiển thị bảng tính phí dời ngày và nút thanh toán phí trước khi xác nhận. | `BR-RES-06`<br>`BR-PRI-03` |
| **UNH-RES-06** | **Đặt trước vượt quá cửa sổ 30 ngày (Advance Booking Window Block)** | Khách chọn ngày bắt đầu thuê vượt quá 30 ngày so với ngày hiện tại (`startDate > today + 30`). | Backend từ chối `400 Bad Request` kèm mã lỗi `START_DATE_TOO_FAR_IN_ADVANCE`. Chặn găm giữ tài nguyên kho quá xa. | DatePicker vô hiệu hóa toàn bộ ngày sau `today + 30 days`, hiển thị tooltip cảnh báo: _"Chỉ được đặt kho trước tối đa 30 ngày"_. | `BR-RES-01` |

---

## Flow 2 — Check-in & Handover: Nhận kho & Bàn giao

- **Mã nghiệp vụ liên quan:** `FS-01`, `FS-02`, `FM-02`, `SC-04`
- **Diễn viên (Actors):** `Facility Staff` (thực hiện tại quầy), `Storage Customer` (nhận kho), `Facility Manager` (phân công)
- **Quy tắc nghiệp vụ cốt lõi:** `BR-CHK-01..06`, `BR-ACC-01..03`, `BR-CAN-05`

### 3.1. Happy Path: Nhận kho Đa kênh (Online Digital Move-In & On-site Handover)

Quy trình hỗ trợ linh hoạt 2 nhánh nhận kho theo chuẩn Contactless Self-Storage hiện đại:

#### Nhánh A: Check-in Online (Digital Move-In trên Customer Portal)

```
[Storage Customer — MyUnitsPage.tsx / Mobile Web]
       │
       ├─► 1. Khách hàng bấm "Nhận kho Online (E-Check-in)"
       │      Frontend: MyUnitsPage.tsx ──► DigitalMoveInPassModal.tsx
       │      API: GET /api/v1/customer/contracts/{id}/move-in-preview
       │      Backend: Trả về thông tin ô kho đã gán (unitNumber), ảnh hiện trạng nghiệm thu sạch sẽ của cơ sở
       │
       ├─► 2. Khách hàng xác thực CCCD & Ký số điện tử (E-Signature)
       │      Frontend: ESignHandoverModal.tsx (Xem biên bản bàn giao điện tử, vẽ chữ ký số)
       │      API: POST /api/v1/customer/contracts/{id}/online-check-in
       │      Backend: CustomerRentalController.onlineCheckIn()
       │               - Kiểm tra storage_unit_id đã được FM phân bổ [BR-CHK-02]
       │               - Lưu chữ ký số và biên bản bàn giao số [BR-CHK-03]
       │               - Contract.status: PENDING_CHECK_IN ──► ACTIVE [BR-CHK-04]
       │               - StorageUnit.status: RESERVED ──► OCCUPIED [BR-CHK-04]
       │               - Sinh mã PIN ngẫu nhiên 6 số & mã QR mở khóa 24/7 [BR-ACC-01]
       │
       └─► 3. Kích hoạt tức thì: Cấp mã PIN & Hướng dẫn mở cửa 24/7 trên App + Email + SMS
```

#### Nhánh B: Check-in On-site tại quầy (Với Facility Staff)

> **Quy tắc phân công & Bàn giao (BR-CHK-02):** Trong giai đoạn chuẩn bị (`PENDING_CHECK_IN`), Quản lý cơ sở (FM) có thể thực hiện **Gán ô kho cụ thể** (`assignUnit`) trước hoặc **Phân công nhân viên tiếp đón** (`assignCheckInStaff`) trước tùy ý. Tuy nhiên, tại thời điểm tiếp đón khách tại quầy (**Check-in Gate**), hệ thống bắt buộc phải có đủ cả hai: Ô kho vật lý cụ thể và Nhân viên tiếp đón đại diện cơ sở!

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
                       - Từ chối 409 UNIT_NOT_YET_ALLOCATED nếu storage_unit_id còn null [BR-CHK-02]
                       - Lưu biên bản: chữ ký điện tử khách hàng, ảnh hiện trường, ghi chú [BR-CHK-03]
                       - Cập nhật Contract.status: PENDING_CHECK_IN ──► ACTIVE [BR-CHK-04]
                       - Cập nhật StorageUnit.status: RESERVED ──► OCCUPIED [BR-CHK-04]
                       - Cập nhật Reservation.status: CONFIRMED ──► FULFILLED
                       - Sinh mã PIN truy cập ngẫu nhiên 6 chữ số và kích hoạt ACTIVE [BR-ACC-01]
              Frontend: AccessCodePinModal.tsx hiển thị mã PIN và hướng dẫn khách mở cửa kho 24/7
```

### 3.2. Unhappy & Exception Cases: Từ chối bàn giao, Hoàn tiền & Sự cố thiết bị

| Mã kịch bản    | Tình huống ngoại lệ / Lỗi                                     | Điều kiện kích hoạt                                                                                       | Xử lý Backend & HTTP Status                                                                                                                                                                                                                                                                       | Hiển thị Giao diện (Frontend)                                                                                                | Quy tắc nghiệp vụ          |
| :------------- | :------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- | :------------------------- |
| **UNH-CHK-01** | **Ô đã gán bị lỗi lúc bàn giao**                              | Hiện trường ô kho bị ẩm dột, kẹt cửa cuốn, bẩn hoặc điện hỏng, không đạt `BR-CHK-02`.                     | Staff báo lỗi. Ô đó sang `MAINTENANCE`. FM gọi `PATCH /reservations/{id}/assign-unit` (hoặc đổi ô trên hợp đồng) sang ô `AVAILABLE` cùng loại; hợp đồng giữ `PENDING_CHECK_IN` và cập nhật `storage_unit_id`. Chỉ khi hết ô thay thế mới hủy và hoàn 100% cọc cùng phí thuê.                      | Staff báo lỗi trên màn bàn giao. FM chọn ô khác trên sơ đồ cơ sở. Nhân viên bàn giao tiếp trên ô mới.                        | `BR-CHK-06`<br>`BR-AVL-04` |
| **UNH-CHK-02** | **Sai lệch thông tin CCCD / Khách không đủ giấy tờ**          | Người đến nhận kho không mang CCCD hoặc thông tin không khớp với người đại diện hợp đồng.                 | Nhân viên tạm dừng quy trình bàn giao. Hợp đồng giữ nguyên `PENDING_CHECK_IN`. Nhân viên ghi chú vào nhật ký tiếp đón.                                                                                                                                                                            | Thẻ xác minh hiển thị cảnh báo chưa đạt điều kiện nhận kho. Nút "Tiến hành bàn giao" bị khóa mờ.                             | `BR-CHK-01`                |
| **UNH-CHK-03** | **Bàn phím số / Khóa IoT bị lỗi sau khi ký biên bản**         | Bàn phím số tại cửa ô kho bị liệt nút hoặc không kết nối được mạng sau khi sinh mã PIN.                   | Nhân viên tạo phiếu sự cố `SupportCategory.LOCK_ACCESS` (`isUrgent = true`) hoặc báo Quản lý cơ sở điều chuyển sang ô kho khác qua `POST /api/v1/contracts/{id}/reassign-unit` (`Relocation`).                                                                                                                                      | Nhân viên báo lỗi khóa / yêu cầu đổi ô kho để Quản lý điều phối ô thay thế.                                                  | `BR-SUP-01`<br>`BR-AVL-05` |
| **UNH-CHK-04** | **Khách đến trễ trong thời hạn ân hạn (Grace Period)**        | Khách đến nhận kho sau ngày bắt đầu hợp đồng 1–2 ngày nhưng vẫn trong khoảng ân hạn (`checkinGraceDays`). | Hệ thống vẫn cho phép thực hiện Check-in Online hoặc Check-in tại quầy, kích hoạt `ACTIVE`. Thời hạn kết thúc hợp đồng giữ nguyên theo thỏa thuận ban đầu.                                                                                                                                        | Giao diện hiển thị nhãn cảnh báo: _"Ân hạn nhận kho: Còn X ngày"_ kèm nút Nhận kho Online hoặc Dời ngày (`BR-RES-06`).       | `BR-CHK-05`                |
| **UNH-CHK-05** | **Khách không Check-in Online và không đến quầy quá 10 ngày** | Quá 10 ngày ân hạn (`checkin.grace_days`) mà khách không nhận kho, không dời lịch và không hủy đơn.       | Scheduled job `AutoCheckInActivationScheduler` chạy lúc 00:00 ngày T+11: Tự động chuyển Contract sang `ACTIVE`, StorageUnit sang `OCCUPIED`, cấp mã PIN gửi qua Email/SMS (Deemed Acceptance) [BR-CAN-04, BR-CHK-05]. Không hủy đơn và không hoàn tiền, bảo toàn 100% doanh thu cho doanh nghiệp. | Hợp đồng tự động chuyển vào danh sách "Đang hoạt động" trên Customer Portal kèm mã PIN 24/7 để khách sử dụng bất cứ khi nào. | `BR-CAN-04`<br>`BR-CHK-05` |

---

## Flow 3 — Return & Settlement: Trả kho, Nghiệm thu & Quyết toán cọc

- **Mã nghiệp vụ liên quan:** `SC-05`, `FS-03`, `FM-03`
- **Diễn viên (Actors):** `Storage Customer` (báo trả), `Facility Staff` (nghiệm thu thực tế), `Facility Manager` (phê duyệt quyết toán cọc)
- **Quy tắc nghiệp vụ cốt lõi:** `BR-RET-01..12`, `BR-DEP-04..05`, `BR-ACC-03`

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
       │               - Thu hồi mã PIN: RentalContract.accessCode = null [BR-RET-09]
       │               - Đánh dấu cờ inspectionDone = true [ISS-50]
       │
[Facility Manager — ContractDetailPage.tsx]
       │
       ├─► 4. Quản lý xem trước quyết toán cọc (Settlement Preview)
       │      API: GET /api/v1/contracts/{id}/settlement-preview
       │      Công thức đúng hạn: Hoàn tiền = Tiền cọc ban đầu - Phí hư hại (0đ) - Phí dọn dẹp (0đ) - Nợ phạt (0đ) = 100% cọc [BR-RET-04]
       │      Công thức trả sớm: Hoàn tiền = Tiền thuê chưa dùng (100%) + Cọc - Phạt trả sớm (100% cọc) - Hư hại - Phụ phí = Tiền thuê chưa dùng - Hư hại [BR-RET-06]
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

| Mã kịch bản    | Tình huống ngoại lệ / Lỗi                                                 | Điều kiện kích hoạt                                                                                                | Xử lý Backend & HTTP Status                                                                                                                                                                                                                                                          | Hiển thị Giao diện (Frontend)                                                                                                                                    | Quy tắc nghiệp vụ          |
| :------------- | :------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------- |
| **UNH-RET-01** | **Chặn trả kho khi đang nợ phạt quá hạn (Block on Debt)**                 | Hợp đồng đang ở mốc quá hạn `D+4` trở đi có tiền phạt tích lũy chưa nộp.                                           | Nếu gọi `POST /return-notice`, Backend trả về `400 Bad Request` (`MUST_SETTLE_OVERDUE_DEBT_FIRST`). Bắt buộc thanh toán sạch nợ phạt mới cho báo trả kho.                                                                                                                            | Nút "Báo trả kho" bị khóa mờ trên UI. Hiển thị thông báo: _"Vui lòng nộp phạt quá hạn trước khi thực hiện trả kho."_                                             | `BR-RET-11`<br>`ISS-46`    |
| **UNH-RET-02** | **Quyết toán âm (Khấu trừ vượt tiền cọc - Negative Settlement)**          | Khách hàng làm hư hại vách ngăn nặng, xả rác bẩn: Chi phí đền bù (DAMAGE) + dọn dẹp (CLEANING) > Tiền cọc ban đầu. | `settlementPreview` trả về số âm (`refundAmount < 0`). Quản lý phê duyệt sẽ sinh khoản thu bổ sung `SETTLEMENT_DEFICIT`. Contract chuyển `PENDING_SETTLEMENT_PAYMENT`. Chỉ chuyển `CLOSED` sau khi khách trả đủ tiền bù.                                                             | Quản lý xem bảng cân đối màu đỏ cảnh báo âm tiền. Khách hàng nhận hóa đơn thanh toán qua cổng VNPay Sandbox cho phần chênh lệch.                                 | `BR-RET-04`                |
| **UNH-RET-03** | **Khách đổi ý muốn tiếp tục thuê (Hủy báo trả kho)**                      | Khách đã bấm báo trả kho nhưng sau đó muốn tiếp tục sử dụng kho (nhân viên chưa bấm bắt đầu nghiệm thu).           | Khách gọi `POST /api/v1/customer/contracts/{id}/cancel-return`. Backend kiểm tra nếu chưa nghiệm thu thì chuyển `Contract.status ──► ACTIVE`, xóa task nghiệm thu của nhân viên.                                                                                                     | Khách bấm nút "Hủy yêu cầu trả kho" trên `MyUnitsPage.tsx`. Thẻ hợp đồng trở về trạng thái hoạt động bình thường.                                                | `BR-RET-12`                |
| **UNH-RET-04** | **Khách hàng bỏ rơi đồ đạc / Không đến bàn giao trả kho**                 | Hợp đồng hết hạn, khách không liên lạc được hoặc không dọn dẹp đồ đạc ra khỏi kho.                                 | Quản lý và nhân viên lập biên bản hiện trường đơn phương, chụp ảnh niêm phong đồ, chuyển kho sang `MAINTENANCE` để xử lý tài sản vô chủ, tịch thu 100% tiền cọc.                                                                                                                     | Manager xem danh sách kho cần xử lý cưỡng chế trên `ContractDashboardPage.tsx`.                                                                                  | `BR-OVD-11`                |
| **UNH-RET-05** | **Khấu trừ Hư hỏng & Phạt Cọc khi Trả kho Sớm (Early Return Settlement)** | Khách hàng báo trả kho trước hạn, có phát sinh hư hại cơ khí hoặc xả rác bẩn tại hiện trường.                      | Backend tính toán: Hoàn 100% tiền thuê phần chưa dùng (`return.early_refund_rate = 100%`), phạt 100% tiền cọc Deposit (`return.early_penalty_rate = 100%`), trừ chi phí `DAMAGE`/`CLEANING` do Staff lập biên bản. Nếu kết quả âm $\rightarrow$ sinh khoản thu `SETTLEMENT_DEFICIT`. | Frontend hiển thị bảng quyết toán chi tiết: số tiền thuê thừa được hoàn, tiền cọc bị trừ làm phí vi phạm cam kết, và khoản thực nhận sau khi trừ chi phí hư hại. | `BR-RET-06`<br>`BR-RET-04` |

---

## Flow 4 — BOM Policy & Pricing: Thiết lập Chính sách, Giá thuê & Báo cáo tổng thể

- **Mã nghiệp vụ liên quan:** `BM-01`, `BM-02`, `BM-03`, `BM-04`
- **Diễn viên (Actors):** `Business Operations Manager (BOM)` (chủ trì), `Facility Manager` (thực thi)
- **Quy tắc nghiệp vụ cốt lõi:** `BR-GEN-01..05`, `BR-PRI-01..04`, `BR-DEP-01`

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

| Mã kịch bản    | Tình huống ngoại lệ / Lỗi                               | Điều kiện kích hoạt                                                                                                        | Xử lý Backend & HTTP Status                                                                                                                                                        | Hiển thị Giao diện (Frontend)                                                                                  | Quy tắc nghiệp vụ          |
| :------------- | :------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :------------------------- |
| **UNH-BOM-01** | **Vi phạm ngày hiệu lực chính sách (Past Date Policy)** | BOM đặt ngày bắt đầu hiệu lực `effectiveFrom` ở thời điểm trong quá khứ.                                                   | Backend ném `400 Bad Request` kèm thông báo _"Ngày hiệu lực của chính sách mới phải lớn hơn hoặc bằng ngày hiện tại"_.                                                             | Ô chọn ngày báo đỏ kèm thông báo lỗi trực quan trên form.                                                      | `BR-GEN-01`                |
| **UNH-BOM-02** | **Chặn vô hiệu hóa / Xóa cơ sở đang hoạt động**         | BOM bấm chuyển trạng thái cơ sở sang `INACTIVE` khi cơ sở đó vẫn còn hợp đồng `ACTIVE`, `OVERDUE` hoặc `PENDING_CHECK_IN`. | Backend kiểm tra ràng buộc toàn vẹn, từ chối cập nhật và ném `409 Conflict` (`FACILITY_HAS_ACTIVE_CONTRACTS`).                                                                     | Modal cảnh báo: _"Không thể ngừng hoạt động cơ sở này vì hiện còn N hợp đồng đang lưu trữ hoặc chờ nhận kho."_ | `BR-GEN-07`                |
| **UNH-BOM-03** | **Bảo vệ Snapshot giá cũ khi BOM tăng giá thuê**        | BOM cập nhật tăng giá thuê m² của một loại ô kho từ 150.000 đ lên 200.000 đ.                                               | Backend đảm bảo tính toàn vẹn: Các hợp đồng và đơn đặt chỗ cũ vẫn giữ nguyên giá cũ được snapshot tại thời điểm tạo (`BR-GEN-05`). Chỉ các đơn tạo mới sau đó mới áp dụng giá mới. | Lịch sử điều chỉnh giá hiển thị rõ ràng trên `BomPriceAuditPage.tsx`.                                          | `BR-GEN-05`<br>`BR-PRI-01` |
| **UNH-BOM-04** | **Loại kho chưa niêm yết giá (Unpriced Unit Type)**     | Loại ô kho mới được tạo nhưng BOM chưa cài đặt bảng giá cho chi nhánh cơ sở.                                               | Backend loại bỏ các ô kho thuộc loại này khỏi kết quả tìm kiếm khả dụng của khách hàng (`AvailabilityService`).                                                                    | Trên giao diện Khách hàng, các loại kho chưa có giá sẽ bị ẩn hoàn toàn, không cho phép đặt chỗ ảo (`ISS-113`). | `ISS-113`                  |

---

## Flow 5 — Facility & Staff Management: Quản lý Cơ sở, Ô kho & Phân công nhân sự

- **Mã nghiệp vụ liên quan:** `FM-01`, `FM-04`, `FM-05`
- **Diễn viên (Actors):** `Facility Manager` (quản lý tại chi nhánh), `Facility Staff` (nhận phân công)
- **Quy tắc nghiệp vụ cốt lõi:** `BR-GEN-07`, `BR-AVL-01..05`

### 6.1. Happy Path: Drill-down 4 cấp quản lý kho & Phân ca trực nhân viên

```
[Facility Manager Portal — ManagerRoutes.tsx]
       │
       ├─► 1. Quản lý Ô kho Drill-down 4 cấp độ (FM-01)
       │      Frontend: FacilityListPage ──► UnitTypeListPage ──► StorageUnitListPage ──► StorageUnitDetailPage
       │      Backend: StorageUnitController ──► Giám sát trạng thái vật lý của từng ô kho
       │
       ├─► 2. Điều phối Nhân sự & Giao việc thực địa (FM-05)
       │      Frontend: StaffSchedulePage ──► ShiftCalendarPage ──► WorkListPage ──► WorkDetailPage
       │      API: GET /api/v1/support-requests/staff-workload, POST /api/v1/staff-assignments
       │      Backend: StaffAssignmentController ──► Kiểm tra Staff ACTIVE & thuộc cơ sở, lưu StaffDailyAssignment (Check-in / Return / Incident)
       │
       └─► 3. Giám sát Báo cáo Sức khỏe Cơ sở
              Frontend: FacilityReportsPage.tsx (/manager/reports)
              Backend: FacilityReportController ──► Thống kê ô kho theo trạng thái và cảnh báo hợp đồng sắp hết hạn
```

### 6.2. Unhappy & Exception Cases: Nhân sự không thuộc cơ sở, Bảo trì khẩn cấp & Phân quyền đa cơ sở

| Mã kịch bản    | Tình huống ngoại lệ / Lỗi                                       | Điều kiện kích hoạt                                                                | Xử lý Backend & HTTP Status                                                                                                                                                                  | Hiển thị Giao diện (Frontend)                                                               | Quy tắc nghiệp vụ   |
| :------------- | :-------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ | :------------------ |
| **UNH-MGR-01** | **Nhân viên không thuộc cơ sở / không ACTIVE**                  | Quản lý điều phối nhiệm vụ cho nhân viên chưa gắn với cơ sở hoặc đang ngưng hoạt động. | Backend kiểm tra `UserStatus.ACTIVE` và `UserFacilityAssignmentRepository.existsByUserIdAndFacilityId`, từ chối phân công và ném `400 Bad Request` (`STAFF_NOT_IN_FACILITY`).               | Giao diện điều phối `ShiftCalendarPage.tsx` báo lỗi và yêu cầu chọn nhân viên hợp lệ của cơ sở. | `FM-05`             |
| **UNH-MGR-02** | **Ô kho bị sự cố đột xuất cần bảo trì khẩn cấp**                | Ô kho đang `AVAILABLE` bị dột nước hoặc hỏng bóng đèn.                             | Quản lý gọi `PATCH /api/v1/storage-units/{id}/status` chuyển sang `MAINTENANCE`. Ô này ra khỏi hạn ngạch hạng kho và khỏi danh sách ô FM được gán. Khách không chọn ô này trên cổng đặt chỗ. | Thẻ ô trên sơ đồ FM/Staff chuyển xám bảo trì và không gán được.                             | `BR-AVL-04`         |
| **UNH-MGR-03** | **Từ chối truy cập dữ liệu cơ sở khác (Multi-Facility Breach)** | Quản lý cơ sở A cố tình gọi API tra cứu danh sách hợp đồng hoặc ô kho của cơ sở B. | `FacilitySecurityService` đối soát danh sách `facilityIds` trong JWT token, ném `403 Forbidden` (`ACCESS_DENIED_TO_FACILITY`).                                                               | Giao diện hiển thị trang báo lỗi 403 trang nhã, không để lộ dữ liệu nhạy cảm của cơ sở bạn. | `SA-03`<br>`ISS-41` |

---

## Flow 6 — Contract Lifecycle: Gia hạn hợp đồng & Xử lý Quá hạn (Overdue)

- **Mã nghiệp vụ liên quan:** `SC-03`, `FM-02`, `BM-02`
- **Diễn viên (Actors):** `Storage Customer`, `Facility Manager`, `Tác vụ ngầm OverdueCronJob`
- **Quy tắc nghiệp vụ cốt lõi:** `BR-REN-01..10`, `BR-OVD-01..11`

### 7.1. Sub-flow 6.1: Gia hạn hợp đồng (Tự phục vụ >= 20d, Force Renewal FM < 20d & Chống xung đột)

#### A. Khách hàng tự gia hạn trực tuyến (Khi còn >= 20 ngày đến hết hạn — BR-REN-01..09)
```
[Customer — MyUnitsTable.tsx / RentedUnitCard.tsx]
       │
       ├─► 1. Khách hàng bấm "Gia hạn" trên thẻ hợp đồng ACTIVE (daysRemaining >= 20)
       │      API: POST /api/v1/contracts/{id}/renewals/quote
       │      Backend: RenewalServiceImpl.getRenewalQuote()
       │               - Chặn hợp đồng OVERDUE (400 RENEWAL_NOT_ALLOWED) và unitType INACTIVE (400 UNIT_TYPE_INACTIVE)
       │               - Chặn nếu còn < 20 ngày đến endDate (400 RENEWAL_DEADLINE_PASSED — BR-REN-09)
       │               - Kiểm tra trùng lịch với Waitlist / Reservation trong khoảng rentalBufferDays (409 CAPACITY_NOT_AVAILABLE)
       │               - Bảo lưu tiền cọc cũ (BR-DEP-01); tính phí thuê N tháng (1..12) theo biểu giá BOM hiện hành (BR-REN-05)
       │
       ├─► 2. Khởi tạo thanh toán gia hạn trực tuyến (VNPay Sandbox / VietQR)
       │      API: POST /api/v1/payments/checkout (purpose = CONTRACT_RENEWAL)
       │      Backend: PaymentServiceImpl chạy lại getRenewalQuote() để xác thực & tạo phiên thanh toán
       │
       └─► 3. Thanh toán thành công (AFTER_COMMIT Event)
              Backend: ContractEventListener -> RenewalServiceImpl.processRenewal() (REQUIRES_NEW, idempotent theo paymentTransactionId)
                       Cộng thêm N tháng vào endDate (Contract.endDate = Contract.endDate + N tháng, BR-REN-04)
                       Hợp đồng giữ nguyên trạng thái ACTIVE và lưu bản ghi ContractRenewal
```

#### B. Quản lý cơ sở duyệt Gia hạn Ngoại lệ tại Quầy (Từ T-20 đến T-0 — BR-REN-10)
```
[Facility Manager — ContractDetailPage.tsx]
       │
       ├─► 1. Khách cũ đến quầy xin gia hạn sau khi cổng online đã bị khóa (0 <= daysRemaining < 20)
       │      FM bấm nút "Gia hạn Ngoại lệ (Force Renewal)" trên màn hình chi tiết hợp đồng
       │
       ├─► 2. FM chọn số tháng gia hạn (1..12 tháng), xem bảng tính toán chi phí:
       │      API: POST /api/v1/contracts/{id}/renewals/force-preview
       │      Backend: RenewalServiceImpl.getForceRenewalQuote()
       │               - Kiểm tra ô kho hiện tại: nếu khách mới trong Waitlist/Đặt trước ĐÃ ĐÓNG CỌC
       │                 => Trả 409 Conflict (CAPACITY_ALREADY_COMMITTED), khóa cứng nút Duyệt!
       │               - Nếu ô kho CHƯA BỊ CỌC: Cho phép duyệt, tính tiền:
       │                 Tổng thanh toán = (Đơn giá BOM hiện hành × N tháng) + Phí xử lý muộn 200.000 VNĐ
       │
       └─► 3. FM xác nhận thu tiền mặt/chuyển khoản tại quầy và kích hoạt gia hạn:
              API: POST /api/v1/contracts/{id}/renewals/force
              Backend: RenewalServiceImpl.processForceRenewal()
                       - Cập nhật Contract: endDateExclusive += N tháng, rentalMonths += N tháng
                       - Lưu ContractRenewal: isForceRenewal = true, lateAdminFee = 200.000 VNĐ, paymentMethod = CASH/BANK_TRANSFER
                       - Hủy lời mời giữ chỗ (nếu có) của khách Waitlist chưa cọc, đưa khách đó về đầu hàng đợi
```

- **Ngoại lệ Xung đột & Quá hạn gia hạn (UNH-REN-01):**
  - Nếu hợp đồng đã sang `OVERDUE` (từ D+1), hệ thống trả `400 Bad Request` (`RENEWAL_NOT_ALLOWED`). Tuyệt đối khóa mọi loại gia hạn online/offline.
  - Nếu khách tự thao tác khi thời gian còn lại nhỏ hơn 20 ngày, hệ thống trả `400 Bad Request` (`RENEWAL_DEADLINE_PASSED`, `BR-REN-09`).
  - Nếu ô kho đã có khách mới đặt cọc thành công cho chu kỳ kế tiếp, hệ thống trả `409 Conflict` (`CAPACITY_NOT_AVAILABLE`). Khách cũ bắt buộc phải trả kho đúng hạn T-0 hoặc ký hợp đồng đổi sang ô kho khác nếu cơ sở còn chỗ.

### 7.2. Sub-flow 6.2: Xử lý Quá hạn (Vòng đời 8 Ngày Khép kín D+1 đến D+8)

Khi hợp đồng đến ngày kết thúc (`end_date`) mà khách chưa thanh toán gia hạn hoặc chưa hoàn tất trả kho:

```
[00:00:00 HẰNG ĐÊM — Tác vụ OverdueCronJob quét toàn bộ hợp đồng ACTIVE đã quá ngày end_date]
       │
       ├─► MỐC D+1: Kích hoạt Trạng thái Quá hạn & Khóa An ninh ("No Pay, No PIN") [BR-OVD-01, BR-OVD-05, BR-REN-06]
       │   - Trạng thái hợp đồng: OVERDUE
       │   - Khóa mã PIN ngay từ 00:00 D+1 (accessCode = null) để chống tẩu tán tài sản bỏ trốn
       │   - Khóa tự gia hạn Online (BR-REN-06)
       │   - Giao diện khách (MyUnitsPage.tsx):
       │     + Cột mã PIN hiển thị nhãn hồng "Đã khóa PIN (Đóng phí để mở)"
       │     + HIỆN nút "Đóng phí & Mở PIN" (Thanh toán qua VNPay Sandbox: POST /api/v1/payments/checkout)
       │     + ẨN nút "Báo trả kho" (Phải trả hết nợ quá hạn mới mở khóa nút Báo trả kho theo BR-RET-01)
       │
       ├─► GIAI ĐOẠN 1: Ngày D+1 đến D+3 (Thu phí Lưu kho Quá hạn, Miễn phạt vi phạm) [BR-OVD-02]
       │   - Phí lưu kho quá hạn: 5% tiền cọc Deposit / ngày (lũy kế 3 ngày = 15% cọc)
       │   - Miễn phạt vi phạm cam kết hợp đồng (Ân hạn nhân văn)
       │   - Khách thanh toán VNPay Sandbox trả hết phí quá hạn (purpose = OVERDUE_PENALTY) -> PaymentServiceImpl xóa nợ overdueFeeAccrued = 0, cấp lại mã PIN 6 số nếu đang trống và giữ nguyên trạng thái OVERDUE (BR-OVD-08) để mở luồng Báo trả kho (submitReturnNotice)
       │
       ├─► GIAI ĐOẠN 2: Ngày D+4 đến D+7 (Phạt vi phạm Hợp đồng +10%/ngày) [BR-OVD-03, BR-OVD-04]
       │   - Tính phí phạt quá hạn cộng dồn hằng đêm: 10% cọc / ngày trên nền 15% của Giai đoạn 1
       │   - Mốc D+4 = 25% cọc, D+5 = 35% cọc, D+6 = 45% cọc, D+7 chạm trần tối đa = 55% cọc (BR-OVD-04)
       │   - Mã PIN tiếp tục bị khóa cho đến khi khách thanh toán qua VNPay Sandbox đủ 100% nợ quá hạn tích lũy
       │
       ├─► MỐC D+7: Cưỡng chế Chấm dứt & Niêm phong về Kho Tổng [BR-OVD-07, BR-OVD-11]
       │   - Trạng thái hợp đồng chuyển thành: TERMINATED
       │   - Thu hồi mã PIN vĩnh viễn
       │   - Khấu trừ trọn vẹn 45% tiền cọc còn lại làm chi phí cắt khóa, kiểm kê, niêm phong và vận chuyển về Kho Tổng
       │     => Tổng tiêu thụ vừa khít 100% tiền cọc: 15% + 40% + 45% = 100% Cọc (depositBalance = 0 VND)
       │   - Ô kho tại cơ sở chuyển sang trạng thái: MAINTENANCE (1 ngày dọn dẹp vệ sinh)
       │
       └─► MỐC D+8: Tự động Giải phóng Ô kho & Tiếp nhận Chuộc đồ 30 ngày tại Kho Tổng [BR-AVL-02, BR-OVD-11]
           - Đúng ngày D+8 (rental.buffer_days = 8): Ô kho tự động giải phóng về AVAILABLE để đón khách thuê mới
           - Tại Kho Tổng (D+8 đến D+37): Khách hàng có 30 ngày liên hệ Quản lý cơ sở (FM) nộp phụ phí phát sinh để nhận lại đồ
           - Sau 30 ngày: Cơ sở tiến hành thanh lý ngoại tuyến tài sản theo hợp đồng và đóng hợp đồng (CLOSED)
```

---

## Flow 7 — Support Ticket & Incident: Xử lý Sự cố & Yêu cầu hỗ trợ

- **Mã nghiệp vụ liên quan:** `SC-06`, `FS-05`, `FM-05`
- **Diễn viên (Actors):** `Storage Customer` (gửi yêu cầu & xác nhận), `Facility Staff` (xử lý tại chỗ), `Facility Manager` (điều phối & đổi ô kho khẩn cấp)
- **Quy tắc nghiệp vụ cốt lõi:** `BR-SUP-01..05`, `BR-AVL-05`, `BR-ACC-04`

### 8.1. Happy Path: Báo hỏng hạ tầng & Nhân viên xử lý tại chỗ

```
[Customer — SupportPage.tsx]
       │
       ├─► 1. Khách gửi phiếu yêu cầu hỗ trợ sự cố
       │      API: POST /api/v1/support-requests ──► Sinh mã SUP-YYYYMM-XXXX
       │      Backend: CustomerSupportServiceImpl.createSupportRequest()
       │               - Trạng thái ban đầu: NEW; slaDueAt = null (bãi bỏ SLA cứng 2h/24h theo BR-SUP-01)
       │               - Hỗ trợ 5 danh mục SupportCategory: UNIT_DAMAGE, LOCK_ACCESS, PAYMENT, BELONGINGS, OTHER
       │
[Manager — IncidentListPage.tsx / IncidentDetailPage.tsx]
       │
       ├─► 2. Quản lý xem tải nhân viên & phân công nhân viên tại cơ sở
       │      API: GET /api/v1/support-requests/staff-workload?facilityId=...
       │      API: PATCH /api/v1/support-requests/{id}/assign ──► Trạng thái: ASSIGNED
       │
[Staff — StaffIncidentPage.tsx]
       │
       ├─► 3. Nhân viên tiếp nhận xử lý hiện trường
       │      API: PATCH /api/v1/support-requests/{id}/in-progress ──► Trạng thái: IN_PROGRESS
       │
       └─► 4. Nhân viên hoàn tất xử lý & đóng sự cố thông thường (!relocationRequired)
              API: PATCH /api/v1/support-requests/{id}/resolve (tối đa 5 ảnh SUPPORT_RESOLUTION)
              Backend: StaffSupportServiceImpl.resolveSupportRequest()
                       Nếu relocationRequired = false: SupportRequest.status ──► CLOSED ngay lập tức
                       Nếu relocationRequired = true: SupportRequest.status ──► RESOLVED (chờ FM đổi ô kho hoặc Khách xác nhận)
```

### 8.2. Unhappy & Exception Cases: Đổi ô kho khẩn cấp, Sự cố PIN/Khóa, Phản hồi & Tự động đóng

| Mã kịch bản    | Tình huống ngoại lệ / Lỗi                                               | Điều kiện kích hoạt                                                                           | Xử lý Backend & HTTP Status                                                                                                                                                                                                                                   | Hiển thị Giao diện (Frontend)                                                                                        | Quy tắc nghiệp vụ          |
| :------------- | :---------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------- | :------------------------- |
| **UNH-SUP-01** | **Khách chưa hài lòng sau khi xử lý (`satisfied = false`)**             | Sự cố đã được xử lý (`RESOLVED`) nhưng khách kiểm tra thấy chưa đạt khi xác nhận.             | Khách gọi `PATCH /api/v1/support-requests/{id}/confirm` với `satisfied = false`. `CustomerSupportServiceImpl.confirmResolution()` đẩy trạng thái quay lại `IN_PROGRESS` và nối `[Khách phản hồi]` vào `resolutionNote`.                                    | Trên `SupportPage.tsx`, phiếu quay về trạng thái Đang xử lý để nhân viên tiếp tục khắc phục.                         | `BR-SUP-02`                |
| **UNH-SUP-02** | **Sự cố nặng cần đổi ô kho khẩn cấp (`relocationRequired = true`)**     | Ô kho bị ngập nước/hư hại nặng; Staff bật cờ `PATCH /support-requests/{id}/relocation-required`. | Staff chỉ được chuyển tối đa sang `RESOLVED`; nếu cố đóng `CLOSED` khi chưa đổi kho sẽ bị chặn (`400 VALIDATION_FAILED`). FM gọi `POST /api/v1/contracts/{id}/reassign-unit` đổi sang ô mới cùng `UnitType` (hoặc nâng cấp diện tích lớn hơn cùng môi trường), giữ nguyên đơn giá & cọc (`BR-AVL-05`), chuyển ô cũ sang `MAINTENANCE` và đóng ticket `CLOSED`. | Staff thấy nút đánh dấu cần di dời; FM thao tác chọn ô kho thay thế trên `IncidentDetailPage.tsx` / `ContractDetailPage.tsx`. | `BR-AVL-05`<br>`BR-SUP-02` |
| **UNH-SUP-03** | **Sự cố khóa / Quên mã PIN ra vào (`SupportCategory.LOCK_ACCESS`)**   | Khách gặp sự cố ổ khóa hoặc quên mã PIN khi tiếp cận ô kho.                                   | Khách tạo phiếu danh mục `LOCK_ACCESS`. `SupportRequest.isUrgent()` tự động trả về `true` để ưu tiên điều phối xử lý nhanh. (Riêng trường hợp khóa PIN do quá hạn, thanh toán `OVERDUE_PENALTY` sẽ tự cấp lại PIN 6 số nếu `accessCode` đang trống).          | Phiếu gắn huy hiệu Khẩn cấp (`isUrgent`) nổi bật trên hàng đợi của Staff/Manager.                                    | `BR-SUP-01`<br>`BR-OVD-08` |
| **UNH-SUP-04** | **Tự động đóng phiếu `RESOLVED` quá hạn xác nhận (`SupportAutoCloseJob`)** | Phiếu `RESOLVED` (với `relocationRequired = false`) quá thời hạn không có phản hồi từ khách.   | `SupportAutoCloseJob` chạy lúc `00:30:00` hằng đêm (`Asia/Ho_Chi_Minh`), đối chiếu `supportAutoCloseWorkingDays` từ `PolicyVersion` hiện hành (mặc định **7 ngày làm việc**) và tự động đóng sang `CLOSED`.                                               | Phiếu tự chuyển sang tab Đã đóng sau 7 ngày làm việc nếu không phát sinh mở lại.                                     | `BR-SUP-05`                |

---

## Flow SYS — Authentication, Authorization & Security

- **Mã nghiệp vụ liên quan:** `SA-01`, `SA-02`, `SA-03`, `SA-04`
- **Diễn viên (Actors):** Mọi người dùng (`CUSTOMER`, `STAFF`, `MANAGER`, `BOM`, `ADMIN`)
- **Quy tắc nghiệp vụ cốt lõi:** JWT Stateless, Phân quyền RBAC, Ngăn chặn Header Spoofing (`ISS-40`), Ngăn chặn rò rỉ dữ liệu đa cơ sở (`ISS-41`)

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

| Mã kịch bản    | Tình huống ngoại lệ / Lỗi                            | Điều kiện kích hoạt                                                   | Xử lý Backend & HTTP Status                                                                                                                                     | Hiển thị Giao diện (Frontend)                                                                                           |
| :------------- | :--------------------------------------------------- | :-------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **UNH-SYS-01** | **Xác thực thất bại / Tài khoản bị khóa**            | Nhập sai mật khẩu hoặc tài khoản đã bị Admin chuyển sang `INACTIVE`.  | Backend trả về `401 Unauthorized` hoặc `403 Forbidden` (`ACCOUNT_DISABLED`).                                                                                    | Hiển thị thông báo lỗi đăng nhập: _"Tài khoản hoặc mật khẩu không chính xác hoặc đã bị khóa."_                          |
| **UNH-SYS-02** | **Token hết hạn (Token Expired)**                    | Access Token hết hạn trong khi người dùng đang thao tác.              | Gửi Refresh Token qua `POST /api/v1/auth/refresh`. Nếu refresh token cũng hết hạn, trả về `401 Unauthorized`.                                                   | Tự động refresh ngầm; nếu thất bại thì xóa `tokenStorage` và điều hướng về trang đăng nhập kèm thông báo phiên hết hạn. |
| **UNH-SYS-03** | **Tấn công giả mạo Header (Header Spoofing Attack)** | Kẻ xấu gửi request kèm header `X-Staff-Id: 99` để mạo danh nhân viên. | Backend loại bỏ hoàn toàn việc đọc header client giả mạo, chỉ lấy danh tính từ token JWT được ký điện tử (`@AuthenticationPrincipal UserPrincipal`) (`ISS-40`). | Request mạo danh bị từ chối hoặc chỉ thực thi đúng quyền của token thực tế.                                             |

---

## 10. Hệ thống Tác vụ Tự động ngầm (Scheduled Cron Jobs)

Hệ thống cấu hình 3 tác vụ tự động chạy nền (Background Scheduled Tasks) độc lập, đảm bảo tự động hóa việc tính toán thời hạn và quản lý dữ liệu:

| Tên Cron Job                   | Lịch biểu (Cron / Fixed Delay)                | Múi giờ            | Mục đích & Tác động CSDL                                                                                                                                                                                   | Tập tin mã nguồn                                                  |
| :----------------------------- | :-------------------------------------------- | :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **`ReservationHoldExpiryJob`** | `fixedDelay = 120000` (Mỗi 2 phút quét 1 lần) | Server Time        | Quét các đơn đặt chỗ `PENDING_PAYMENT` có `hold_expires_at < now`. Chuyển trạng thái sang `EXPIRED`, giải phóng ô kho để khách khác có thể đặt.                                                            | `backend/.../reservation/scheduler/ReservationHoldExpiryJob.java` |
| **`OverdueCronJob`**           | `0 0 0 * * ?` (Đúng 00:00:00 hằng đêm)        | `Asia/Ho_Chi_Minh` | Quét toàn bộ hợp đồng quá hạn theo vòng đời 8 ngày. D+1: Chuyển `OVERDUE` & khóa mã PIN (`accessCode = null`); D+1..D+3: phí `5%/ngày`; D+4..D+6: phạt `+10%/ngày` (trần `55%`); D+7: Chấm dứt sang `TERMINATED`, thanh lý cọc (`depositBalance = 0`), chuyển ô kho sang `MAINTENANCE`; D+8: Giải phóng ô kho về `AVAILABLE` / `RESERVED`. | `backend/.../policy/scheduler/OverdueCronJob.java`                |
| **`SupportAutoCloseJob`**      | `0 30 0 * * ?` (Đúng 00:30:00 hằng đêm)       | `Asia/Ho_Chi_Minh` | Quét các phiếu sự cố ở trạng thái `RESOLVED`. Nếu đã qua số ngày làm việc quy định trong chính sách (`supportAutoCloseWorkingDays`, mặc định 7 ngày), tự động chuyển sang `CLOSED`.                        | `backend/.../support/scheduler/SupportAutoCloseJob.java`          |

---

## 11. Biểu đồ Vòng đời Trạng thái (Entity State Machines)

### 11.1. Đơn đặt chỗ (Reservation)

```
       [Tạo đơn giữ chỗ / Chuyển từ Waitlist]
              │
              ▼
       PENDING_PAYMENT ────────(Hết 48h không nộp tiền)──────► EXPIRED
              │
              ├─(Khách hủy khi chưa thanh toán)────────────────► CANCELLED
              │
              └─(Thanh toán VNPay thành công)─► CONFIRMED
                                                   │
                                                   ├─(Check-in / Auto-Activation T+11)──► FULFILLED
                                                   ├─(Khách hủy trong graceDays)─────────► CANCELLED
                                                   └─(Khách hủy quá graceDays)───────────► NO_SHOW
```

### 11.2. Hợp đồng thuê kho (RentalContract)

```
  [Đặt chỗ thành công / Tạo trực tiếp]
           │
           ▼
   PENDING_CHECK_IN ──┬─(Hủy hợp đồng)────────────────────────────► CANCELLED
           │          └─(Từ chối bàn giao / Hủy reservation)──────► TERMINATED ──(Duyệt quyết toán)──► CLOSED
           │
      (Check-in đạt / Auto-Activation T+11)
           ▼
        ACTIVE ◄──────(Gia hạn thành công trước T-20 qua CONTRACT_RENEWAL)───┐
           │                                                                  │
           ├──────────────────────────────────────────────────────────────────┘
           │
           ├─(Báo trả kho / Hủy trả kho)──► PENDING_RETURN ──► RETURNED ──(Duyệt quyết toán)──► CLOSED
           │                                       ▲
           │                                       │ (Trả nợ OVERDUE_PENALTY -> giữ OVERDUE -> Báo trả kho)
      (Đến ngày endDate)                           │
           ▼                                       │
        OVERDUE ───────────────────────────────────┴─(D+7 không xử lý)──► TERMINATED ──(Thanh lý 30 ngày)──► CLOSED
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

### 11.4. Mã PIN truy cập (`RentalContract.accessCode`)

```
  [Sau khi Check-in / Auto-Activation thành công]
                │
                ▼
         Đang hoạt động ◄───────(Thanh toán OVERDUE_PENALTY D+1..D+6 -> cấp lại 6 số)──┐
          (6 chữ số)                                                                   │
                │                                                                      │
                ├─────────(Đến ngày D+1 quá hạn chưa gia hạn)──────────► Đã khóa PIN ──┘
                │                                                     (accessCode = null)
                ├─────────(Hoàn tất trả kho RETURNED hoặc chạm mốc D+7 TERMINATED)─────┐
                ▼                                                                      ▼
          Thu hồi vĩnh viễn ◄──────────────────────────────────────────────────────────┘
         (accessCode = null)
```

---

## 12. Bảng Tra cứu Nhanh Mã Nguồn (Quick Code Index)

### 12.1. Phân hệ Backend (Spring Boot)

| Phân hệ / Nghiệp vụ                      | Controller                                                              | Service chính                                                              | Repository chính                                                                           |
| :--------------------------------------- | :---------------------------------------------------------------------- | :------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| **Đặt chỗ (Flow 1)**                     | `ReservationController`<br>`CustomerRentalController`                   | `ReservationServiceImpl`<br>`CustomerRentalServiceImpl`                    | `ReservationRepository`<br>`RentalContractRepository`                                      |
| **Thanh toán (Flow 1, 6)**               | `PaymentController`                                                     | `PaymentServiceImpl`                                                       | `PaymentTransactionRepository`                                                             |
| **Bàn giao / Check-in (Flow 2)**         | `ContractController`                                                    | `ContractServiceImpl`                                                      | `RentalContractRepository`<br>`HandoverRecordRepository`                                   |
| **Nghiệm thu / Trả kho (Flow 3)**        | `ContractController`<br>`CustomerRentalController`                      | `ContractServiceImpl`                                                      | `RentalContractRepository`<br>`ReturnInspectionRepository`                                 |
| **Chính sách & Biểu giá (Flow 4)**       | `PolicyController`<br>`PricingController`<br>`SurchargeController`      | `PolicyServiceImpl`<br>`PricingServiceImpl`<br>`SurchargeServiceImpl`      | `PolicyVersionRepository`<br>`FacilityUnitTypePriceRepository`<br>`ExtraFeeTypeRepository` |
| **Báo cáo hệ thống & Cơ sở (Flow 4, 5)** | `SystemReportController`<br>`FacilityReportController`                  | `SystemReportServiceImpl`<br>`FacilityReportServiceImpl`                   | `FacilityRepository`<br>`RentalContractRepository`                                         |
| **Cơ sở & Ô kho (Flow 5)**               | `FacilityController`<br>`StorageUnitController`<br>`UnitTypeController` | `FacilityServiceImpl`<br>`StorageUnitServiceImpl`<br>`UnitTypeServiceImpl` | `FacilityRepository`<br>`StorageUnitRepository`<br>`UnitTypeRepository`                    |
| **Phân công nhiệm vụ (Flow 5)**          | `StaffAssignmentController`<br>`StaffDailyTaskController`               | `StaffAssignmentServiceImpl`<br>`StaffDailyTaskServiceImpl`                | `StaffDailyAssignmentRepository`                                                           |
| **Gia hạn hợp đồng (Flow 6.1)**          | `ContractRenewalController`                                             | `RenewalServiceImpl`                                                       | `ContractRenewalRepository`                                                                |
| **Xử lý Quá hạn (Flow 6.2)**             | `OverdueCronJob` (Scheduler)                                            | `OverdueProcessingServiceImpl`                                             | `RentalContractRepository`<br>`StorageUnitRepository`<br>`PolicyVersionRepository`         |
| **Yêu cầu hỗ trợ & Sự cố (Flow 7)**      | `CustomerSupportController`<br>`StaffSupportController`                 | `CustomerSupportServiceImpl`<br>`StaffSupportServiceImpl`                  | `SupportRequestRepository`                                                                 |
| **Bảo mật & Người dùng (SYS)**           | `AuthController`<br>`UserController`<br>`AuditLogController`            | `AuthServiceImpl`<br>`UserServiceImpl`<br>`AuditLogServiceImpl`            | `UserRepository`<br>`AuditLogRepository`                                                   |

### 12.2. Phân hệ Frontend (React + TypeScript)

| Vai trò (Actor)                 | Tuyến đường (Route)                                  | Trang Giao diện (Page Component)                                                |
| :------------------------------ | :--------------------------------------------------- | :------------------------------------------------------------------------------ |
| **Khách hàng (`CUSTOMER`)**     | `/customer`                                          | `HomePage.tsx`                                                                  |
|                                 | `/customer/units`                                    | `UnitPickerPage.tsx`                                                            |
|                                 | `/customer/booking`                                  | `BookingPage.tsx`                                                               |
|                                 | `/customer/payment`                                  | `PaymentPage.tsx` / `SandboxCheckoutPage.tsx`                                   |
|                                 | `/customer/my-units`                                 | `MyUnitsPage.tsx`                                                               |
|                                 | `/customer/renew/:contractId`                        | `RenewalPage.tsx`                                                               |
|                                 | `/customer/support`                                  | `SupportPage.tsx`                                                               |
| **Nhân viên quầy (`STAFF`)**    | `/staff`                                             | `StaffDashboardPage.tsx`                                                        |
|                                 | `/staff/check-in`                                    | `StaffCheckInPage.tsx`                                                          |
|                                 | `/staff/return`                                      | `StaffReturnInspectionPage.tsx`                                                 |
|                                 | `/staff/incidents`                                   | `StaffIncidentPage.tsx`                                                         |
| **Quản lý cơ sở (`MANAGER`)**   | `/manager`                                           | `ManagerDashboardPage.tsx`                                                      |
|                                 | `/manager/facilities`                                | `FacilityListPage.tsx`                                                          |
|                                 | `/manager/facilities/:facilityId`                    | `UnitTypeListPage.tsx`                                                          |
|                                 | `/manager/facilities/:facilityId/unit-types/:typeId` | `StorageUnitListPage.tsx`                                                       |
|                                 | `.../units/:unitId`                                  | `StorageUnitDetailPage.tsx`                                                     |
|                                 | `/manager/contracts`                                 | `ContractDashboardPage.tsx`                                                     |
|                                 | `/manager/contracts/:contractId`                     | `ContractDetailPage.tsx`                                                        |
|                                 | `/manager/staff-schedule`                            | `StaffSchedulePage.tsx` / `ShiftCalendarPage.tsx`                               |
|                                 | `/manager/staff-schedule/.../shifts`                 | `WorkListPage.tsx` / `WorkDetailPage.tsx`                                       |
|                                 | `/manager/incidents`                                 | `IncidentDashboardPage.tsx` / `IncidentListPage.tsx` / `IncidentDetailPage.tsx` |
|                                 | `/manager/reports`                                   | `FacilityReportsPage.tsx`                                                       |
| **Điều hành cấp cao (`BOM`)**   | `/bom/facilities`                                    | `BomFacilityManagementPage.tsx`                                                 |
|                                 | `/bom/pricing`                                       | `BomPricingManagementPage.tsx`                                                  |
|                                 | `/bom/policies`                                      | `BomPolicyPage.tsx`                                                             |
|                                 | `/bom/price-audit`                                   | `BomPriceAuditPage.tsx`                                                         |
|                                 | `/bom/revenue` / `/bom/reports`                      | `BomDashboardPage.tsx`                                                          |
| **Quản trị hệ thống (`ADMIN`)** | `/admin/users`                                       | `AdminUsersPage.tsx`                                                            |
|                                 | `/admin/roles`                                       | `AdminUsersPage.tsx` (Lọc theo Quản lý cơ sở)                                   |
|                                 | `/admin/facility-assignments`                        | `AdminUsersPage.tsx` (Lọc theo Nhân viên quầy)                                  |
|                                 | `/admin/activity-logs`                               | `AdminAuditLogsPage.tsx`                                                        |
| **Xác thực (`AUTH`)**           | `/auth/login`                                        | `LoginPage.tsx`                                                                 |
|                                 | `/auth/register`                                     | `RegisterPage.tsx`                                                              |
|                                 | `/auth/forgot-password`                              | `ForgotPasswordPage.tsx`                                                        |

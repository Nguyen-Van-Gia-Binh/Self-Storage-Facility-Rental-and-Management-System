# 🧪 MA TRẬN TEST TOÀN DIỆN FLOW 7: SUPPORT REQUEST, INCIDENT HANDLING, DAMAGE SURCHARGES & EMERGENCY RELOCATION

> **Phạm vi:** Gửi yêu cầu hỗ trợ & Báo cáo sự cố (Support Request / Incident) · Tự động cấp/đổi mã PIN ra vào (`BR-SUP-02`) · Phân công & Xử lý sự cố đa cơ sở (`BR-SUP-01`, `BR-SUP-03`) · Thu phụ phí hư hại / vệ sinh & cấn trừ Tiền cọc (`BR-SUP-04`, `BR-RET-04`) · Đổi kho khẩn cấp & Từ chối bàn giao (`UC-F7-02`, `UC-F2-03`) · Tự động đóng Ticket sau 72h (`BR-SUP-05`).

---

## 1. Bảng Ma trận 10 Test Cases Chuẩn Bảo vệ Đồ án

### NHÓM 1: KHÁCH HÀNG GỬI YÊU CẦU HỖ TRỢ & CẤP LẠI MÃ PIN (`SC-06`, `BR-SUP-02`)
*Mục tiêu: Đảm bảo luồng tự phục vụ của khách hàng hoạt động mượt mà nhưng tuyệt đối không tạo lỗ hổng vượt rào bảo mật khi hợp đồng đang bị khóa quá hạn (D+7).*

| ID | Tên Test Case | Kịch bản (Scenario) | Kỳ vọng (Expected Result) | Tại sao HĐ hỏi? | Trạng thái & Test Tự động |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SUP-TC-01** | Tạo yêu cầu hỗ trợ thành công | Khách hàng có hợp đồng `ACTIVE` gửi Ticket báo cáo sự cố (`UNIT_ISSUE` / `OTHER`) kèm ảnh minh họa. | Tạo thành công với mã `SR-YYYYMMDD-NNNN`, trạng thái `NEW`, tự động gắn `facilityId` theo hợp đồng. | Kiểm tra luồng tạo Ticket chuẩn & sinh mã tự động. | ✅ Đã cài đặt (`CustomerSupportServiceTest`) |
| **SUP-TC-02** | Tự động cấp lại PIN khi quên mã (`ACCESS_ISSUE`) | Khách hàng có hợp đồng `ACTIVE` gửi Ticket loại `ACCESS_ISSUE`. | Hệ thống tự động sinh mã PIN 6 số mới, lưu vào hợp đồng và đóng Ticket ngay lập tức (`RESOLVED`). | Kiểm tra quy tắc tự động hóa `BR-SUP-02`. | ✅ Đã cài đặt (`CustomerSupportServiceTest`) |
| **SUP-TC-03** | **Chặn lách luật đổi PIN khi quá hạn D+7 (`SUP-01`)** | Hợp đồng `OVERDUE` ở ngày D+7 đã bị Cron Job xóa trắng `accessCode` để khóa kho. Khách gọi trực tiếp API `PUT /api/v1/my-Wait/contracts/{id}/pin` để tự đặt PIN mới. | Hệ thống chặn đứng với lỗi `403 Forbidden` (`ACCESS_SUSPENDED_OVERDUE`), giữ nguyên `accessCode = null`. | **Lỗ hổng bảo mật sống còn:** Nếu chỉ chặn ở `SupportRequest` mà quên chặn ở API đổi PIN trực tiếp, khách nợ tiền vẫn mở được kho lấy hàng trốn nợ. | ✅ Đã cài đặt (`CustomerRentalServiceTest#shouldThrowAccessSuspendedOverdue_whenOverdueContractPinIsLockedAtDay7`) |

### NHÓM 2: PHÂN CÔNG, VÒNG ĐỜI TICKET & ĐA CƠ SỞ (`FS-05`, `FM-05`, `BR-SUP-01`, `BR-SUP-03`)
*Mục tiêu: Đảm bảo State Machine chặt chẽ, phân quyền đa cơ sở (Multi-Facility Isolation) và không sinh bản ghi rác khi phân công lại.*

| ID | Tên Test Case | Kịch bản (Scenario) | Kỳ vọng (Expected Result) | Tại sao HĐ hỏi? | Trạng thái & Test Tự động |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SUP-TC-04** | **Chống trùng lặp `StaffDailyAssignment` khi phân công lại (`SUP-02`)** | Manager phân công Ticket cho Staff A, sau đó đổi sang phân công cho Staff B. Thử phân công lại một Ticket đã `CLOSED`. | Hệ thống **Upsert** (cập nhật bản ghi `StaffDailyAssignment` hiện có sang Staff B thay vì `INSERT` trùng), giữ đúng `ticket.getFacilityId()`. Nếu Ticket đã `CLOSED`/`AUTO_CLOSED`, chặn với `400 Bad Request` (`INVALID_STATUS_TRANSITION`). | Kiểm tra tính toàn vẹn dữ liệu bảng phân công công việc hàng ngày và chặn thao tác trên Ticket đã đóng. | ✅ Đã cài đặt (`StaffSupportServiceTest#shouldUpsertStaffDailyAssignment_whenReassigning_andRejectClosedTicket`) |
| **SUP-TC-05** | **State Machine & Chặn Staff xử lý Ticket chưa gán (`SUP-03`)** | 1) Gọi `startInProgress` khi Ticket đang ở `NEW` hoặc `RESOLVED`.<br>2) Staff cố tình gọi `resolveSupportRequest` trên một Ticket đang `NEW` hoặc gán cho người khác. | 1) Chặn `startInProgress` ngoài trạng thái `ASSIGNED` (`INVALID_STATUS_TRANSITION`).<br>2) Chặn Staff xử lý Ticket chưa gán cho mình (`SUPPORT_REQUEST_NOT_ASSIGNED_TO_STAFF` / `SUPPORT_REQUEST_CANNOT_BE_RESOLVED`). | Kiểm tra tính chặt chẽ của State Machine `NEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`. | ✅ Đã cài đặt (`StaffSupportServiceTest#shouldRejectStartInProgress_whenStatusIsNotAssigned`, `StaffSupportServiceTest#shouldRejectStaffOperatingOnUnassignedTicket`) |
| **SUP-TC-06** | **Cách ly Đa cơ sở & Đồng bộ chỉ số `AUTO_CLOSED` (`SUP-04`, `SUP-06`)** | 1) Manager Cơ sở 1 gọi API thao tác trên Ticket của Cơ sở 2.<br>2) Thống kê Workload của Staff và Tiến độ công việc ngày (`StaffDailyTask`) khi có Ticket được hệ thống tự động đóng sau 72h (`AUTO_CLOSED`). | 1) Chặn ngay với `403 Forbidden` (`SUPPORT_REQUEST_FACILITY_MISMATCH`).<br>2) Cả `getStaffWorkload` lẫn `StaffDailyTaskServiceImpl` đều tính `RESOLVED`, `CLOSED` và `AUTO_CLOSED` vào số lượng hoàn thành bằng 1 câu query duy nhất. | Kiểm tra bảo mật Multi-Facility và tính nhất quán số liệu báo cáo vận hành. | ✅ Đã cài đặt (`StaffSupportServiceTest#shouldRejectManagerOperatingOnDifferentFacilityTicket_andCountAutoClosedInWorkload`) |
| **SUP-TC-09** | **Bảo mật `@PreAuthorize` trên `StaffSupportController`** | 1) Tài khoản `STORAGE_CUSTOMER` gọi `GET /api/v1/staff/support-requests`.<br>2) Tài khoản `FACILITY_STAFF` gọi API `PUT /assign` (chỉ dành cho Manager). | Cả 2 trường hợp đều bị chặn ở tầng Filter/Method Security với `403 Forbidden`. | Kiểm chứng annotation `@EnableMethodSecurity` thực sự bảo vệ các endpoint nội bộ. | ✅ Đã cài đặt (`StaffSupportControllerTest`) |

### NHÓM 3: ĐỔI KHO KHẨN CẤP & TỪ CHỐI BÀN GIAO (`UC-F7-02`, `UC-F2-03`)
*Mục tiêu: Chống Race Condition khi cấp kho thay thế và bảo vệ quyền lợi hoàn tiền 100% khi kho không đạt chuẩn bàn giao.*

| ID | Tên Test Case | Kịch bản (Scenario) | Kỳ vọng (Expected Result) | Tại sao HĐ hỏi? | Trạng thái & Test Tự động |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SUP-TC-07** | **Khóa bi quan (`PESSIMISTIC_WRITE`) & Xác thực chủ sở hữu Ticket khi Đổi kho (`SUP-05`)** | Manager thực hiện `POST /api/v1/contracts/{id}/reassign-unit` sang ô kho mới. Thử truyền `supportRequestId` của một hợp đồng khác. | 1) Sử dụng `findByIdForUpdate` (`PESSIMISTIC_WRITE`) khóa dòng ô kho cũ & mới trong DB để chống 2 giao dịch cùng cấp 1 ô kho.<br>2) Nếu `ticket.getContractId() != contract.getId()`, chặn ngay với `400 Bad Request`. | **Câu hỏi Concurrency & Integrity kinh điển:** Điều gì xảy ra nếu Manager đang chọn ô kho B để đổi cho khách thì khách khác vừa đặt thuê ô kho B? | ✅ Đã cài đặt (`ContractServiceTest#shouldUsePessimisticLockAndRejectForeignTicket_onReassignUnit`) |
| **SUP-TC-08** | Từ chối bàn giao (`rejectHandover`) — Hoàn tiền 100% | Khi Check-in lần đầu, ô kho bị hỏng và khách không đồng ý đổi sang ô khác (`POST /api/v1/contracts/{id}/reject-handover`). | Hợp đồng chuyển sang `TERMINATED`, ô kho lỗi chuyển sang `MAINTENANCE`, và hệ thống tạo lệnh `REFUND` hoàn trả **100% (`totalRentalFee + depositAmount`)** với trạng thái `PENDING_REFUND`. | Kiểm tra sự khác biệt giữa Huỷ đặt chỗ do khách (phạt 20% tiền thuê) và Từ chối bàn giao do lỗi cơ sở (hoàn 100%). | ✅ Đã cài đặt (`ContractServiceTest#rejectHandover_shouldTerminateContractSetUnitMaintenanceAndCreateFullRefundPayment`) |

### NHÓM 4: PHỤ PHÍ SỰ CỐ & CẤN TRỪ TIỀN CỌC (`BR-SUP-04`, `BR-RET-04`, `SUP-07`)
*Mục tiêu: Giải quyết bài toán thực tế: Khách làm hỏng kho trong lúc đang thuê, nếu khách trả tiền ngay hoặc không chịu trả tiền thì xử lý thế nào?*

| ID | Tên Test Case | Kịch bản (Scenario) | Kỳ vọng (Expected Result) | Tại sao HĐ hỏi? | Trạng thái & Test Tự động |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SUP-TC-10** | **Áp phí hư hại (`DAMAGE`/`CLEANING`) — Thu tại chỗ (`PAID`) vs Ghi nợ trừ Cọc (`UNPAID`) (`SUP-07`)** | Trong khi xử lý sự cố do lỗi khách hàng:<br>- **TH1:** Khách thanh toán trực tiếp tại quầy (`paid = true`).<br>- **TH2:** Khách chưa trả / chối bỏ (`paid = false`). | - **TH1 (`paid = true`):** Lưu `ContractExtraCharge` với trạng thái `PAID` (Ghi nhận doanh thu phụ phí, **không** bị trừ lại vào Tiền cọc khi trả kho).<br>- **TH2 (`paid = false`):** Lưu `ContractExtraCharge` với trạng thái `UNPAID`. Khi khách Trả kho (Flow 6) hoặc bị Thanh lý D+10 (Flow 5), hệ thống tự động gom toàn bộ khoản `UNPAID` để **cấn trừ trực tiếp vào Tiền cọc (`Deposit`)**. | **Câu hỏi thực tế của Hội đồng:** *"Nếu khách làm hỏng cửa kho mà không chịu trả tiền sửa chữa thì hệ thống của em làm sao thu hồi tiền?"* | ✅ Đã cài đặt (`ContractReturnServiceTest#testApplyCatalogFee_SupportsDamageAndPaidVsUnpaidStatus`) |

---

## 2. 🎯 5 Câu Hỏi "Grill-Me" Hội Đồng Sẽ Hỏi Về Flow 7

1. **"Nếu khách làm hỏng kho trong quá trình thuê và nhân viên lập phiếu thu phụ phí sửa chữa, nhưng khách chây ì không trả tiền thì hệ thống xử lý thế nào (`SUP-07`)?"**
   - **Trả lời:** *"Dạ, đó chính là lý do mô hình Self-Storage luôn thu **Tiền cọc đảm bảo (`Deposit`)** trước khi bàn giao kho ạ. Khi nhân viên đóng Ticket sự cố có kèm phụ phí (`DAMAGE` hoặc `CLEANING`), giao diện cho phép chọn 1 trong 2 hình thức: (1) **Đã thu trực tiếp tại chỗ (`PAID`)** nếu khách trả tiền ngay — hệ thống chỉ ghi nhận lịch sử phụ phí và không đụng vào tiền cọc; hoặc (2) **Khách chưa trả — Ghi nợ trừ Cọc (`UNPAID`)**. Với các khoản `UNPAID`, hệ thống vẫn cho phép nhân viên hoàn tất sửa chữa và đóng Ticket để không làm tắc nghẽn vận hành, sau đó khi kết thúc hợp đồng (Trả kho hoặc Thanh lý quá hạn D+10), `ContractServiceImpl` sẽ tự động tổng hợp toàn bộ các khoản `ContractExtraCharge` có trạng thái `UNPAID` để **khấu trừ trực tiếp vào Tiền cọc (`Deposit`)** trước khi hoàn phần dư cho khách theo đúng quy tắc `BR-RET-04` ạ."*

2. **"Khi hợp đồng quá hạn đến ngày D+7, hệ thống khóa mã PIN của khách. Vậy nếu khách vào trang Quản lý hợp đồng bấm 'Đổi mã PIN' hoặc gửi Ticket 'Quên mã PIN' thì có tự mở khóa được không (`SUP-01`)?"**
   - **Trả lời:** *"Dạ hoàn toàn không thể ạ! Nhóm em đã rà soát và khóa chặt cả 2 cổng: Thứ nhất, ở luồng gửi Ticket `ACCESS_ISSUE`, hệ thống kiểm tra nếu hợp đồng đang bị đình chỉ quyền truy cập D+7 (`OVERDUE` và `accessCode == null`) thì từ chối cấp mã mới. Thứ hai, ở API đổi mã PIN trực tiếp (`PUT /api/v1/my-rentals/contracts/{id}/pin`), hàm `changeContractPin` cũng kiểm tra điều kiện này và ném lỗi `403 Forbidden` (`ACCESS_SUSPENDED_OVERDUE`). Khách bắt buộc phải thanh toán hết tiền thuê và phí phạt quá hạn (Flow 5) thì hệ thống mới tự động kích hoạt lại mã PIN ạ."*

3. **"Trong lúc Manager đang thao tác Đổi kho khẩn cấp (`reassignUnit`) sang ô kho trống B, nếu có một khách hàng trên web vừa bấm đặt thuê đúng ô kho B đó thì sao (`SUP-05`)?"**
   - **Trả lời:** *"Dạ, chúng em sử dụng **Pessimistic Write Lock (`@Lock(LockModeType.PESSIMISTIC_WRITE)` — `SELECT ... WITH (UPDLOCK, ROWLOCK)`)** thông qua hàm `storageUnitRepository.findByIdForUpdate()` cho cả ô kho cũ lẫn ô kho mới trong cùng một Transaction. Nhờ đó, ngay khi giao dịch đổi kho bắt đầu kiểm tra trạng thái `AVAILABLE` của ô kho B, dòng dữ liệu đó bị khóa ở tầng Database cho đến khi cập nhật xong sang `OCCUPIED`, triệt tiêu hoàn toàn nguy cơ 2 người cùng chiếm 1 ô kho (Double Allocation) ạ."*

4. **"Tại sao trong `StaffAssignmentServiceImpl` trước đây lại có nguy cơ nhân bản bản ghi phân công, và nhóm em đã xử lý thế nào (`SUP-02`)?"**
   - **Trả lời:** *"Dạ, khi kiểm toán mã nguồn (Code Audit), chúng em phát hiện nếu Manager đổi người phụ trách Ticket từ Staff A sang Staff B, việc gọi `new StaffDailyAssignment()` sẽ tạo ra 2 dòng phân công cho cùng 1 Ticket trong bảng công việc ngày. Chúng em đã chuẩn hóa lại tại `StaffSupportServiceImpl.assignStaff()` theo cơ chế **Upsert**: truy vấn `findByReferenceTypeAndReferenceId('SUPPORT_REQUEST', ticketId)`, nếu đã có thì cập nhật `staffId` mới trên chính bản ghi đó, nếu chưa có mới tạo mới, đồng thời luôn lấy `facilityId` chuẩn từ chính Ticket thay vì gán cứng ạ."*

5. **"Làm sao hệ thống biết khi nào một Ticket hỗ trợ đã hoàn tất nếu khách hàng quên bấm xác nhận đóng Ticket (`BR-SUP-05`, `SUP-06`)?"**
   - **Trả lời:** *"Dạ, khi nhân viên xử lý xong và chuyển trạng thái sang `RESOLVED`, hệ thống ghi nhận mốc thời gian `resolvedAt`. Nếu khách hàng hài lòng hoặc quên không phản hồi, sau **72 giờ**, tiến trình ngầm `SupportAutoCloseScheduler` chạy định kỳ mỗi giờ sẽ tự động chuyển các Ticket `RESOLVED` quá 72h sang trạng thái `AUTO_CLOSED`. Đồng thời, toàn bộ các API thống kê hiệu suất nhân viên (`getStaffWorkload`, `StaffDailyTask`) đều quy đổi đồng nhất cả 3 trạng thái `RESOLVED`, `CLOSED` và `AUTO_CLOSED` vào nhóm công việc đã hoàn thành ạ."*

---

## 3. 🚀 Hướng Dẫn Smoke Test Thực Tế (Trình Duyệt & Postman)

### Kịch bản 1: Xử lý Sự cố kèm Phụ phí Hư hại — Thu tại chỗ (`PAID`) vs Ghi nợ trừ Cọc (`UNPAID`) (`SUP-07`)
1. **Bước 1 (Staff mở Modal Hoàn tất xử lý sự cố):**
   - Đăng nhập tài khoản **Staff** (`staff.hn1@selfstorage.vn`), mở chi tiết một Ticket đang ở trạng thái `ASSIGNED` hoặc `IN_PROGRESS`, bấm **"Hoàn tất xử lý"**.
2. **Bước 2 (Chọn Danh mục phí & Trạng thái thu tiền):**
   - Tích chọn **"Áp dụng phí dịch vụ / đền bù hư hại"**, chọn biểu phí (VD: Phí sửa chữa bản lề cửa / Phí vệ sinh kho).
   - Chọn 1 trong 2 tùy chọn:
     - **Đã thu trực tiếp tại chỗ (`PAID`):** Khoản phí được lưu với trạng thái `PAID`.
     - **Khách chưa trả — Ghi nợ trừ Cọc (`UNPAID`):** Khoản phí được lưu với trạng thái `UNPAID`, chờ khấu trừ tự động vào Tiền cọc khi khách trả kho.
   - Bấm **"Hoàn tất xử lý"** -> Hệ thống lưu phụ phí và chuyển Ticket sang `RESOLVED` thành công (nếu API lưu phí lỗi, Modal sẽ chặn lại và báo lỗi rõ ràng thay vì đóng nhầm Ticket).

### Kịch bản 2: Kiểm thử Chặn đổi PIN khi hợp đồng bị khóa D+7 (`SUP-01`)
1. Dùng tài khoản Khách hàng có hợp đồng `OVERDUE` đã qua ngày D+7 (`accessCode = null`), gọi API:
   ```http
   PUT /api/v1/my-rentals/contracts/{contractId}/pin
   Content-Type: application/json

   { "newPin": "654321" }
   ```
2. **Kết quả:** Hệ thống trả về `403 Forbidden` kèm mã lỗi `"ACCESS_SUSPENDED_OVERDUE"` (*"Quyền truy cập kho đã bị đình chỉ do quá hạn thanh toán. Vui lòng thanh toán khoản quá hạn để kích hoạt lại mã PIN."*).


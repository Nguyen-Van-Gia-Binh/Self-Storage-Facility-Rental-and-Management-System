# 🧪 MA TRẬN TEST TOÀN DIỆN FLOW 4: BOM (BUSINESS OPERATIONS MANAGER)

> **Phạm vi:** Master Unit Type Catalog · Cấu hình Giá & Chính sách (Pricing & Policy) · Báo cáo Doanh thu & Tỷ lệ lấp đầy (MRR, Cash Flow, Occupancy Rate, Deposit Liability) · Bảo mật RBAC · Concurrency & Edge Cases.

---

## 1. Bảng Ma trận 19 Test Cases Chuẩn Bảo vệ Đồ án

### NHÓM 1: QUẢN LÝ DANH MỤC (MASTER UNIT TYPE CATALOG)
*Mục tiêu: Đảm bảo danh mục sản phẩm toàn cầu được quản lý chặt chẽ.*

| ID | Tên Test Case | Kịch bản (Scenario) | Kỳ vọng (Expected Result) | Tại sao HĐ hỏi? | Trạng thái & Test Tự động |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CAT-01** | Tạo Unit Type mới | BOM tạo "Kho Lạnh Size S" (Mã `UT-CHL-S`, DxRxC: 2x2x3). | Tạo thành công, tự động tính diện tích `4m2`, thể tích `12m3`. | Kiểm tra logic tính toán cơ bản. | ✅ Đã cài đặt (`UnitTypeEntityTest`, `UnitTypeServiceTest`) |
| **CAT-02** | Trùng mã Unit Type | Tạo Unit Type với mã `UT-CHL-S` đã tồn tại. | Báo lỗi Duplicate Code (`409 Conflict` / `400 Bad Request`). | Validate dữ liệu đầu vào. | ✅ Đã cài đặt (`UnitTypeServiceTest`) |
| **CAT-03** | Graceful Deactivation (Vô hiệu hóa mềm) | BOM chuyển trạng thái "Kho Lạnh S" sang `INACTIVE`. | Khách hàng mới KHÔNG thấy loại kho này trên trang Booking. Khách cũ vẫn tiếp tục thuê đến hết hợp đồng. | **Câu hỏi kinh điển về Quản lý vòng đời sản phẩm.** | ✅ Đã cài đặt (`UnitTypeServiceTest#shouldGracefullyDeactivateUnitType_evenWhenActiveOrReservedUnitsExist`) |
| **CAT-04** | Chặn gia hạn khi Unit Type INACTIVE | Khách đang thuê "Kho Lạnh S" (đã bị INACTIVE) bấm "Gia hạn". | Hệ thống chặn, báo lỗi `UNIT_TYPE_INACTIVE`: *"Loại kho này đã ngừng kinh doanh, vui lòng liên hệ ban quản lý."* | Kiểm tra sự đồng bộ giữa Flow 4 và Flow 6. | ✅ Đã cài đặt (`RenewalServiceTest#testGetRenewalQuote_inactiveUnitType_throwsUnitTypeInactive`) |

### NHÓM 2: CẤU HÌNH GIÁ & CHÍNH SÁCH (PRICING & POLICY)
*Mục tiêu: Đảm bảo tính bất biến của dữ liệu (Snapshot) và tính linh hoạt.*

| ID | Tên Test Case | Kịch bản (Scenario) | Kỳ vọng (Expected Result) | Tại sao HĐ hỏi? | Trạng thái & Test Tự động |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PRI-01** | Cập nhật giá theo Cơ sở | BOM tăng giá Kho Thường tại Q1 từ 4tr lên 5tr. | Giá tại Q1 thành 5tr, giá tại Q7 vẫn giữ nguyên. | Kiểm tra tính độc lập của dữ liệu (Multi-facility). | ✅ Đã cài đặt (`PricingServiceTest`) |
| **PRI-02** | Giá trị âm hoặc không hợp lệ | BOM nhập giá `-5.000.000`. | Validate chặn lại, báo lỗi `400`. | Kiểm tra Validate DTO. | ✅ Đã cài đặt (`PricingServiceTest`) |
| **PRI-03** | **Price Snapshot (Cực kỳ quan trọng)** | Khách A ký hợp đồng giá 4tr. Hôm sau BOM tăng giá lên 5tr. | Hợp đồng của A vẫn tính giá **4tr** (Snapshot). Khách B ký mới bị tính giá 5tr. | **Hội đồng rất hay hỏi câu này.** Kiểm tra xem có lưu Snapshot hay Join bảng giá trực tiếp. | ✅ Đã cài đặt (`PricingServiceTest#shouldPreserveContractMonthlyPriceSnapshot_whenBomIncreasesPrice`) |
| **PRI-04** | Bulk Update giá | BOM chọn 3 loại kho tại Q1, bấm tăng giá 10%. | Cả 3 loại kho tăng 10%. Lịch sử thay đổi giá được ghi vào `PriceAudit`. | Kiểm tra tính năng nâng cao và Audit Log. | ✅ Đã cài đặt (`PriceAuditServiceTest`, `BomPricingManagementPage.tsx`) |
| **POL-01** | Policy Versioning | BOM đổi tỷ lệ cọc từ 1.0 sang 1.5. | Hệ thống sinh ra `Policy V2`. Các hợp đồng cũ vẫn giữ `Policy V1`. | Kiểm tra hiểu biết về Immutable Data. | ✅ Đã cài đặt (`PolicyServiceTest`) |

### NHÓM 3: BÁO CÁO DOANH THU & TỶ LỆ LẤP ĐẦY (REPORTS)
*Mục tiêu: Đảm bảo con số kế toán chính xác tuyệt đối.*

| ID | Tên Test Case | Kịch bản (Scenario) | Kỳ vọng (Expected Result) | Tại sao HĐ hỏi? | Trạng thái & Test Tự động |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REP-01** | Chỉ số MRR | Có 3 hợp đồng ACTIVE: 2tr, 3tr, 5tr. Có 1 hợp đồng OVERDUE 4tr. | MRR hiển thị **10tr** (Chỉ tính ACTIVE). Không cộng OVERDUE. | Kiểm tra hiểu biết về kế toán. | ✅ Đã cài đặt (`SystemReportServiceTest`) |
| **REP-02** | Dòng tiền (Cash Flow) vs MRR | Khách đóng trước 6 tháng (12tr). | Cash Flow hôm nay: **+12tr**. MRR tháng này: **+2tr**. | Kiểm tra sự phân biệt giữa Tiền mặt thu vào và Doanh thu thực tế. | ✅ Đã cài đặt (`SystemReportServiceTest#testSystemRevenueReport_CashFlowVsMrr_6MonthsPrepaid`) |
| **REP-03** | Tỷ lệ lấp đầy (Occupancy Rate) | Cơ sở có 10 ô. 6 ô Đang thuê, 1 ô Bảo trì (Maintenance). | Occupancy = `6 / (10 - 1) = 66.7%`. Không tính ô bảo trì vào mẫu số. | **Kiểm tra công thức đặc thù của ngành.** | ✅ Đã cài đặt (`SystemReportServiceTest#testSystemOccupancyReport_ExcludesMaintenanceFromDenominator`) |
| **REP-04** | Tiền cọc (Deposit Liability) | Tổng cọc thu của khách là 50tr (gồm cả khoản đang `PENDING_REFUND` chưa chuyển đi). Đã hoàn trả thành công 10tr. | Báo cáo hiển thị "Tiền cọc đang giữ: **40tr**". Tuyệt đối không cộng 40tr vào cột Doanh thu. | Kiểm tra tư duy kế toán (Nợ phải trả). | ✅ Đã cài đặt (`SystemReportServiceTest#testSystemRevenueReport_PendingRefundStillCountsAsDepositLiability`) |
| **REP-05** | Xuất file CSV có dấu | Xuất báo cáo CSV, mở bằng Excel. | Tiếng Việt hiển thị đúng, không bị lỗi font (Đã dùng UTF-8 BOM `\uFEFF`). | Chi tiết nhỏ nhưng thể hiện sự chuyên nghiệp. | ✅ Đã cài đặt (`SystemReportServiceTest#testExportSystemReport_Revenue`) |

### NHÓM 4: BẢO MẬT & PHÂN QUYỀN (SECURITY & RBAC)
*Mục tiêu: BOM là role quyền lực nhất, phải được bảo vệ nghiêm ngặt.*

| ID | Tên Test Case | Kịch bản (Scenario) | Kỳ vọng (Expected Result) | Tại sao HĐ hỏi? | Trạng thái & Test Tự động |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | FM truy cập API của BOM | Manager (FM) dùng Postman gọi API `PUT /facilities/1/prices/7`. | Trả về `403 Forbidden`. | Ngăn chặn nhân viên tự sửa giá. | ✅ Đã cài đặt (`PricingControllerTest#shouldReturn403_whenFacilityManagerAttemptsToUpdatePrice`) |
| **SEC-02** | Khách xem báo cáo doanh thu | Customer gọi API `GET /reports/system/revenue`. | Trả về `403 Forbidden`. | Bảo mật dữ liệu tài chính nhạy cảm. | ✅ Đã cài đặt (`SystemReportControllerTest#testGetSystemRevenueReport_CustomerForbidden`) |
| **SEC-03** | BOM thao tác đúng quyền | BOM gọi API `PUT /facilities/1/prices/7`. | Trả về `200 OK`, cập nhật thành công. | Đảm bảo luồng chính hoạt động. | ✅ Đã cài đặt (`PricingControllerTest#shouldReturn200_whenBomUpdatesPrice`) |
| **SEC-EXTRA** | Chặn gọi trái phép Cron quá hạn | Customer gọi `POST /policies/cron/process-overdue?date=2099-01-01`. | Trả về `403 Forbidden` (Chỉ `BUSINESS_OPERATIONS_MANAGER` được phép kích hoạt). | Chống tấn công phá hoại hàng loạt hợp đồng. | ✅ Đã cài đặt (`PolicyControllerTest#testTriggerOverdueProcessing_CustomerForbidden`) |

### NHÓM 5: CONCURRENCY & EDGE CASES (TRANH CHẤP & BIÊN)
*Mục tiêu: Những kịch bản "chết người" khi chạy thực tế.*

| ID | Tên Test Case | Kịch bản (Scenario) | Kỳ vọng (Expected Result) | Tại sao HĐ hỏi? | Trạng thái & Test Tự động |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CON-01** | Sửa giá cùng lúc | 2 tài khoản BOM cùng sửa giá 1 loại kho trong cùng 1 giây. | Dùng Optimistic Locking (`@Version`). Người commit sau nhận lỗi `409 Conflict` (`OPTIMISTIC_LOCK_CONFLICT`) và phải load lại trang. | Kiểm tra tư duy Concurrency. | ✅ Đã cài đặt (`PricingServiceTest`, `PricingControllerTest`) |
| **CON-02** | Vô hiệu hóa Unit Type đang có người đặt | BOM bấm INACTIVE "Kho Lạnh S", cùng lúc Khách hàng đang thao tác thanh toán thuê kho đó. | Giao dịch thanh toán bị chặn (`UNIT_TYPE_INACTIVE` `409 Conflict`), đơn tự động chuyển `EXPIRED` và tạo lệnh hoàn tiền `REFUND` (`PENDING_REFUND`). | Race condition giữa Master Data và Transaction. | ✅ Đã cài đặt (`ReservationConfirmTest#shouldExpireAndTriggerRefund_whenUnitTypeDeactivatedDuringPayment`) |
| **CON-03** | Lọc báo cáo sai ngày | Chọn `From Date > To Date`. | Báo lỗi `400 Bad Request` (`VALIDATION_FAILED`) hoặc trả mảng rỗng `[]`. | Kiểm tra Validate tham số tìm kiếm. | ✅ Đã cài đặt (`SystemReportServiceTest#testSystemRevenueReport_InvalidDateRange`) |

---

## 2. 🎯 5 Câu Hỏi "Grill-Me" Hội Đồng Sẽ Hỏi Về Flow 4

1. **"Tại sao em lại cho phép BOM tắt (`INACTIVE`) một loại kho khi vẫn còn khách đang thuê (`CAT-03`)?"**
   - **Trả lời:** *"Dạ, đây là cơ chế **Graceful Deactivation** chuẩn của doanh nghiệp. BOM cần được quyền dừng kinh doanh một loại kho ngay lập tức nếu có lỗi kỹ thuật hoặc hết vòng đời sản phẩm. Khách hiện tại vẫn được bảo vệ quyền lợi đến hết hợp đồng, nhưng chúng em chặn tất cả các giao dịch đặt mới (`CAT-03`) và gia hạn mới (`CAT-04`) ạ."*

2. **"Làm sao em đảm bảo giá thuê của khách không bị thay đổi khi BOM điều chỉnh bảng giá (`PRI-03`)?"**
   - **Trả lời:** *"Dạ, nhóm em áp dụng cơ chế **Snapshot (Ảnh chụp dữ liệu bất biến)**. Khi ký hợp đồng, đơn giá thuê tháng và phiên bản chính sách được đóng băng (ghi cứng vào bảng `rental_contract`: `monthly_price`, `total_rental_fee`, `policy_version_id`). Mọi thay đổi từ bảng giá của BOM chỉ cập nhật bảng `facility_unit_type_price` và thêm bản ghi lịch sử `facility_unit_type_price_version` cho các hợp đồng được tạo mới sau đó ạ."*

3. **"Nếu 2 Quản lý (BOM) cùng sửa giá trong 1 giây thì sao (`CON-01`)?"**
   - **Trả lời:** *"Dạ, em dùng **Optimistic Locking** với annotation `@Version` (Flyway `V22`). Giao dịch của người nào commit DB trước sẽ thắng và tăng `version` lên `1`. Người sau sẽ nhận thông báo `409 Conflict` (`OPTIMISTIC_LOCK_CONFLICT`), giao diện tự động hiển thị Toast cảnh báo và tải lại bảng giá mới nhất để tránh ghi đè dữ liệu của nhau (Lost Update) ạ."*

4. **"Tại sao em lại tách biệt MRR và Cash Flow (`REP-02`)? Sao không cộng gộp hết vào Doanh thu cho nhanh?"**
   - **Trả lời:** *"Dạ, nếu cộng gộp, báo cáo sẽ bị ảo. Ví dụ khách đóng trước 6 tháng (12 triệu), nếu tính hết vào doanh thu tháng này, doanh thu sẽ tăng vọt, nhưng thực tế 5 tháng sau không có tiền thu mới. `Cash Flow` phản ánh dòng tiền mặt thực thu trong kỳ (`+12tr`), còn `Net MRR` (Monthly Recurring Revenue = `total_rental_fee / rental_months = +2tr/tháng`) giúp Ban giám đốc thấy được quy mô doanh thu định kỳ ổn định hàng tháng sau chiết khấu. Đây là chuẩn báo cáo tài chính của các mô hình kinh doanh thuê bao (Subscription / Self-Storage) ạ."*

5. **"Tại sao ô kho đang bảo trì lại không bị tính vào Tỷ lệ lấp đầy (`REP-03`), và việc đổi công thức có làm lệch số liệu báo cáo cũ không?"**
   - **Trả lời:** *"Dạ, sau khi rà soát lại chuẩn ngành, nhóm em đã cập nhật đồng bộ công thức `Occupancy Rate = Occupied / (Total - OutOfService - Maintenance)` để loại trừ các ô kho đang bảo trì khỏi mẫu số (`exploitableUnits`). Điều này khiến các báo cáo cũ có thể chênh lệch nhẹ (ví dụ từ `60%` lên `66.7%`), nhưng nó phản ánh đúng hiệu suất khai thác thương mại thực tế của phần tài sản đang sẵn sàng vận hành tại cơ sở ạ."*

---

## 3. 🚀 Hướng Dẫn Smoke Test Thực Tế (Trình Duyệt & Postman)

### Kịch bản 1: Kiểm thử Vòng đời Loại kho (`CAT-03` & `CAT-04`)
1. **Bước 1 (BOM tắt kinh doanh loại kho đang có người thuê - `CAT-03`):**
   - Đăng nhập tài khoản **BOM** (`bom@selfstorage.vn`) hoặc gọi:
     ```http
     PATCH /api/v1/facilities/1/unit-types/7/status?isActive=false
     ```
   - **Kết quả:** Trả về `200 OK`, trạng thái `isActive = false` dù đang có hợp đồng `ACTIVE` của khách cũ.
2. **Bước 2 (Khách hàng mới tìm kho trên trang Booking - `CAT-03`):**
   - Mở trang Đặt kho công khai hoặc gọi `GET /api/v1/facilities/1/unit-types/availability?startDate=2026-11-15&months=1`.
   - **Kết quả:** Loại kho `id=7` hoàn toàn biến mất khỏi danh sách đặt mới; trong khi hợp đồng `ACTIVE` hiện tại của khách cũ vẫn hoạt động bình thường.
3. **Bước 3 (Khách cũ mở trang Gia hạn trên trình duyệt & gọi Postman - `CAT-04`):**
   - Khách mở trang **Gia hạn Hợp đồng** (`/customer/contracts/{id}/renew`): Hệ thống hiển thị ngay **Banner cảnh báo màu đỏ** (*"Loại kho này đã ngừng kinh doanh, vui lòng liên hệ ban quản lý."*) kèm nút **Tìm & Thuê ô kho mới** / **Lên lịch trả kho**, đồng thời **khóa nút tiếp tục gia hạn** (`Đã khóa gia hạn`).
   - Nếu khách cố tình dùng Postman gọi thẳng API:
     ```http
     POST /api/v1/contracts/{contractId}/renewals/quote
     Content-Type: application/json

     { "renewalMonths": 3 }
     ```
   - **Kết quả:** Hệ thống chặn lại với mã `409 Conflict` (`errorCode: "UNIT_TYPE_INACTIVE"`).

### Kịch bản 2: Kiểm thử Báo cáo Tỷ lệ lấp đầy (`REP-03`) & Quỹ tiền cọc (`REP-04`)
1. Mở trang **BOM Dashboard** (`/bom/dashboard`):
   - Kiểm tra chỉ số **Tỷ lệ lấp đầy (Occupancy Rate)**: Mẫu số `totalExploitableUnits` đã trừ cả `OUT_OF_SERVICE` lẫn `MAINTENANCE` (`Occupied / (Total - OutOfService - Maintenance)`).
   - Kiểm tra chỉ số **Quỹ ký cược (Deposit Liability)**: Hiển thị tổng tiền cọc đang giữ của các hợp đồng đang mở (`PENDING_CHECK_IN`, `ACTIVE`, `OVERDUE`, `PENDING_RETURN`) cộng với các khoản hoàn cọc đang chờ kế toán chuyển khoản (`PENDING_REFUND`), tách biệt hoàn toàn với cột **Tổng doanh thu (`totalRevenue`)**.



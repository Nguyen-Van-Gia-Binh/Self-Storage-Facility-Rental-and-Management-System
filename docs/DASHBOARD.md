# Bảng Điều hành Trung tâm (Project Dashboard)

> **Self-Storage Facility Rental and Management System (SWP391)**  
> **Bộ nhớ làm việc duy nhất (Single Working Memory)** dành cho Nhóm phát triển và Trợ lý AI.  
> *Tất cả trạng thái sprint, phân công 4 Workstream và sổ theo dõi Issue/Bug được cập nhật trực tiếp tại đây.*

---

## Mục lục
1. [🎯 Trọng tâm hiện tại (Current Focus)](#1--trọng-tâm-hiện-tại-current-focus)
2. [🚨 Sổ Vấn đề & Bug Tinh gọn (Lean Issue Tracker)](#2--sổ-vấn-đề--bug-tinh-gọn-lean-issue-tracker)
3. [📊 Ma trận Tiến độ 4 Workstream](#3--ma-trận-tiến-độ-4-workstream)
4. [🤖 Chỉ dẫn Tương tác dành cho AI](#4--chỉ-dẫn-tương-tác-dành-cho-ai)

---

## 1. 🎯 Trọng tâm hiện tại (Current Focus)

* **Giai đoạn:** Sprint Hoàn thiện Nghiệp vụ & Kiểm thử Tích hợp (Integration & Polish).
* **Mục tiêu chính:** Đồng bộ luồng điều phối nhân sự, kiểm thử e2e các luồng chính (Booking → Check-in → Return), xử lý các điểm nghẽn giao diện và tối ưu hóa hiệu năng.

### Phân công Trách nhiệm (4 Workstreams):
| Workstream | Người phụ trách | Trọng tâm công việc | Nhánh Git / Trạng thái |
| :--- | :--- | :--- | :--- |
| **WS1: Khách hàng & Đặt chỗ** | **Xuân Nhi** | Hoàn thiện Flow 1 (Booking), Flow 6.1 (Gia hạn), Bộ lọc Catalog | `main` (Hoàn thành cơ bản) |
| **WS2: Cơ sở & Vận hành** | **Gia Bình** | Flow 2 (Check-in Desk), Flow 3 (Nghiệm thu Trả kho), Sơ đồ ô kho | `main` (Đã nối Real API) |
| **WS3: Tài chính & Tự động** | **Huỳnh Nhật** | Flow 4 (Bảng giá BOM), Flow 6.2 (Phí quá hạn & Thanh toán nợ), VietQR | `main` (Hoàn thành cơ bản) |
| **WS4: Quản trị & Điều phối** | **Thanh Tùng** | Flow 5 (Điều phối nhân viên FM), Flow 7 (Ticket sự cố), Báo cáo | `main` (Đã merge API điều phối #160) |

---

## 2. 🚨 Sổ Vấn đề & Bug Tinh gọn (Lean Issue Tracker)

> **Quy tắc 3 Dòng:** Mỗi vấn đề chỉ tóm tắt tối đa 30 từ, nêu thẳng hiện tượng cốt lõi và hướng xử lý.  
> Không viết dài dòng. Khi giải quyết xong, đổi trạng thái sang `RESOLVED` kèm mã commit/PR.

| Mã | Hiện tượng & Vấn đề cốt lõi | Hướng xử lý | Phụ trách | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| `ISS-13` | Cột `end_date` trong Contract/Renewal chưa rõ là bao gồm hay loại trừ ngày cuối. | Thống nhất quy ước khoảng nửa mở `[start_date, end_date_exclusive)`. | Tùng / Nhật | `OPEN` |
| `ISS-14` | Dư thừa nơi lưu nợ quá hạn và chi phí hư hỏng (Contract vs Ledger). | Chỉ định Contract là bản chính; Ledger là lịch sử giao dịch. | Tùng / Nhật | `OPEN` |
| `ISS-15` | Sổ cái `ledger_entry.amount` chưa quy ước âm/dương cho hoàn tiền. | Quy định `amount` luôn dương, chiều tiền do `entry_type` (`CREDIT`/`DEBIT`) xác định. | Nhật | `OPEN` |
| `ISS-17` | Nguy cơ race condition khi hai khách đặt cùng 1 ô kho cùng lúc. | Bổ sung `@Version` (`rowversion`) trên bảng `storage_unit` để khóa lạc quan. | Tùng / Bình | `OPEN` |
| `ISS-18` | Ràng buộc duy nhất trên `handover_record` chặn việc tạo lại sau khi hủy bàn giao. | Chuyển sang Unique Index có điều kiện: `WHERE status <> 'CANCELLED'`. | Tùng | `OPEN` |
| `ISS-23` | Bảng danh mục `unit_type` thiếu cờ ngừng hoạt động (Soft Delete). | Đã bổ sung `is_active BIT` qua migration `V4` và API cập nhật. | Bình | `RESOLVED` (#157) |
| `ISS-35` | Giao diện thiếu thông tin tầng, diện tích, thể tích ô kho. | Đã thêm cột `floor`, `position` và tính toán động `areaM2`, `volumeM3`. | Bình | `RESOLVED` (#157) |
| `ISS-36` | Màn hình Staff Return Inspection hiển thị lẫn lộn nhiệm vụ khác cơ sở. | Đã bổ sung bộ chọn cơ sở và ràng buộc chỉ xem nhiệm vụ được Manager phân công. | Bình / Tùng | `RESOLVED` (#160) |
| `ISS-37` | Sơ đồ mặt bằng và số ô trống chưa phản ánh động theo kỳ hạn thuê. | Đã hỗ trợ tham số startDate/rentalMonths tại API storage-units và đồng bộ UI. | Bình / Nhi | `RESOLVED` |
| `ISS-38` | Khách chưa đăng nhập bị lỗi 403 đỏ ở Hỗ trợ, thấy ô ảo ở Kho của tôi và đặt kho sai ID. | Bổ sung Auth Guard đồng bộ, prompt đăng nhập trang nhã và bảo vệ Booking flow. | Nhi | `RESOLVED` |
| `ISS-39` | Thiếu role canonical trong `@PreAuthorize` StaffSupportController và alias authorities. | Đã bổ sung canonical role + alias vào UserPrincipal và controller. | Bình | `RESOLVED` |
| `ISS-40` | Lỗ hổng Header Spoofing cho phép giả mạo `X-Staff-Id`, `X-Manager-Id`. | Bỏ header giả mạo, xác thực danh tính qua `@AuthenticationPrincipal UserPrincipal`. | Bình | `RESOLVED` |
| `ISS-41` | Rò rỉ dữ liệu đa cơ sở của FM và Staff khi thao tác contract/storage-unit. | Tích hợp `FacilitySecurityService` và kiểm tra quyền cơ sở gán cho nhân sự. | Bình | `RESOLVED` |
| `ISS-42` | Đặt chỗ ẩn danh (Anonymous booking) tự động gán khách hàng mặc định ID=1L. | Bắt buộc xác thực, ném UNAUTHORIZED nếu chưa đăng nhập và kích hoạt Auth Guard. | Bình / Nhi | `RESOLVED` |
| `ISS-43` | Rò rỉ phiên làm việc do `clearSession()` không xóa sạch mock override và sessionStorage. | Dọn sạch toàn bộ key `smartstorage_*`, `selfstorage_*` và `sessionStorage`. | Bình | `RESOLVED` |
| `ISS-44` | Đặt chỗ hiển thị mock Tân Bình Flagship và gọi sai endpoint catalog ô kho. | Nối Real API `/facilities`, `/storage-units` và ánh xạ động tên cơ sở theo ID. | Bình / Nhi | `RESOLVED` |
| `ISS-45` | Hợp đồng PENDING_RETURN bị mất mã PIN trên API và hiển thị nút Gia hạn trên UI. | Giữ accessCode cho PENDING_RETURN, ẩn nút Gia hạn theo BR-REN-02, thêm migration V26. | Bình | `RESOLVED` (#167) |
| `ISS-46` | Nộp phạt quá hạn OVERDUE_PENALTY tự chuyển hợp đồng về ACTIVE (sai BR-OVD-08). | Giữ nguyên OVERDUE, xóa nợ phạt về 0 để mở quyền báo trả kho (PENDING_RETURN). | Bình / Nhật | `RESOLVED` |
| `ISS-47` | Thiếu khóa mã PIN tại mốc D+7 (BR-OVD-05) ở backend, còn frontend khóa sớm ở D+4. | Cronjob khóa accessCode tại D+7; Frontend chỉ khóa hiển thị mã PIN khi D+7. | Bình | `RESOLVED` |
| `ISS-48` | Thiếu đệm an toàn 15 ngày gối đầu và lỗi tự động chọn sẵn ô kho mặc định. | Cập nhật SQL buffer 15 ngày (DATEADD) và bỏ auto-select trên UnitPickerPage. | Bình / Nhi | `RESOLVED` |
| `ISS-49` | PaymentController và các trang thanh toán thiếu Auth Guard. | Thêm @PreAuthorize("isAuthenticated()") và Auth Guard redirect login. | Bình | `RESOLVED` |
| `ISS-50` | Staff nộp biên bản nghiệm thu không xóa task; Customer hiển thị chờ nghiệm thu; Manager không hiện nút duyệt quyết toán. | Bổ sung cờ `isInspected` & `inspectionDone`, xóa task sau khi nộp và mở nút Duyệt quyết toán cho FM. | Bình | `RESOLVED` |
| `ISS-51` | Nhân viên check-in sai kích thước ô kho, trả kho thiếu tự nhận việc, đổi cơ sở tự do (Lỗi 29-32). | Khóa cơ sở theo ca, tính chuẩn kích thước S/M/L, thêm nút tự nhận việc và thẻ sự cố SUP. | Bình | `RESOLVED` |
| `ISS-52` | Báo cáo rủi ro nợ quá hạn chia sai giai đoạn D+11..D+30 và quá 30 ngày (sai BR-OVD-01..03). | Tái cấu trúc 4 bucket: Ân hạn (D+1..3), Phạt (D+4..6), Khóa PIN (D+7..10), Thanh lý (D+10+). | Bình | `RESOLVED` |
| `ISS-53` | Phân công nhân sự cơ sở lỗi API DTO mismatch và thiếu validation (Lỗi 27). | Tạo API POST /staff-assignments, validate bắt buộc chọn nhân viên, bảo toàn thẻ việc. | Bình | `RESOLVED` |
| `ISS-54` | Radio "Khẩn cấp 2h" tự nhảy về bình thường và thiếu đồng hồ đếm ngược SLA (Lỗi 26). | Sửa dependency form, tạo component SlaCountdownBadge đếm ngược thời gian thực. | Bình | `RESOLVED` |
| `ISS-55` | FM truy cập toàn bộ 9 cơ sở toàn quốc và thấy cơ sở rác sadas (Lỗi 25, SA-03). | Migration V28 dọn sadas, bổ sung GET /facilities/my-assigned-facilities, cô lập đa cơ sở. | Bình | `RESOLVED` |
| `ISS-56` | Sự cố phân công từ FM không hiển thị bên Staff; thiếu giao diện và chức năng xử lý sự cố cho Staff (FS-05). | Sửa mapping supportTasks, tạo trang /staff/incidents, bổ sung modal tiếp nhận/nghiệm thu và gắn menu sidebar. | Bình | `RESOLVED` |
| `ISS-57` | PR #175 ép cứng cơ sở 2 khiến Staff không thấy đơn Check-in/Return từ FM; mất đồng bộ phân công hai chiều. | Phục hồi bộ chọn cơ sở linh hoạt, tab Việc của tôi cho Check-in, đồng bộ ReturnRequest.inspectedBy và gọi API hai chiều. | Bình | `RESOLVED` |
| `ISS-58` | Jackson serialize thiếu `@JsonProperty("isActive")` khiến Unit Catalog hiển thị Vô hiệu và khóa nút Thêm ô kho vật lý. | Bổ sung `@JsonProperty("isActive")` ở DTO Backend, đồng bộ types và resilience cho Frontend. | Bình | `RESOLVED` |
| `ISS-59` | Dữ liệu mẫu chứa Tân Bình Flagship, sai thuật ngữ ngăn tủ/tủ đồ, SLA hoàn cọc 24-48h (Lỗi 3, 4). | Chuẩn hóa toàn bộ ô kho trên UI, đổi SLA cọc 7 ngày LV, xóa sạch mock facility/pricing, nối Real DB API và migration V33. | Bình | `RESOLVED` |
| `ISS-60` | Lỗi font Mojibake tên người dùng seed data do Windows Cp1252 và thừa menu Admin (Lỗi 13, SA-01..03). | Ép UTF-8 Flyway application.yml, update tên DB chuẩn Unicode và tinh gọn 2 menu Admin. | Bình | `RESOLVED` |
| `ISS-61` | Khóa PIN quá sớm tại D+4 khiến khách không dọn được kho; nộp phạt xong không mở lại PIN (Lỗi 7, BR-OVD-05). | Sửa logic chỉ khóa an ninh tại D+7 khi còn nợ; D+4..D+6 mở PIN dọn đồ; nộp phạt xong mở lại PIN. | Bình | `RESOLVED` |
| `ISS-62` | Nộp phạt xong chuyển badge xanh Đang hoạt động gây ngộ nhận còn hạn thuê (Lỗi 8). | Đổi badge cam Đã tất toán phạt — Chờ dọn kho / trả kho, thêm banner nhắc nhở, mở sáng nút Báo trả kho. | Bình | `RESOLVED` |
| `ISS-63` | Hợp đồng PENDING_RETURN vẫn mở nút Gia hạn gây lỗi thanh toán; thiếu luồng hủy trả kho (Lỗi 9, BR-RET-12). | Ẩn nút Gia hạn khi PENDING_RETURN; bổ sung API POST /cancel-return và nút Hủy yêu cầu trả kho. | Bình | `RESOLVED` |
| `ISS-64` | Khóa cứng gia hạn trước 30 ngày, cấm gia hạn sau nộp phạt, thiếu xử lý trùng lịch đặt trước (Lỗi 10, BR-REN-01..06). | Bỏ khóa 30 ngày, cho phép gia hạn sau nộp phạt, hiển thị Conflict Notice View khi ô kho bị đặt trước. | Bình | `RESOLVED` |
| `ISS-65` | Báo cáo BOM hiện 0 và 0/0 ô vì kỳ lọc lệch và facilityId=all không được xử lý (Lỗi 20, BM-04). | Kỳ mặc định 30 ngày, lấp đầy theo Usage Rate, mẫu số 0 hiện "Không xác định". | Bình | `RESOLVED` |
| `ISS-66` | FM tạo loại ô kho bị chặn bởi validation backend bắt buộc đơn giá > 0 (Lỗi 22, FM-01, BR-GEN-01). | Nới lỏng Create/UpdateUnitTypeRequest cho phép giá 0/null; móc nối với BOM AppliedPriceLookup và hiện badge "Chờ BOM duyệt giá". | Tùng | `RESOLVED` (#197) |
| `ISS-67` | `BookingPriceSummary` & `VietQRPaymentModal` hiển thị cứng "Tiền cọc (1 tháng)" dù BOM đã cấu hình `depositMultiplier` = N (BR-DEP-01). | Truyền `depositMultiplier` từ `useActivePolicy` vào component, đổi label sang `N × tháng tiền thuê` theo policy; áp dụng đồng bộ cho luồng Gia hạn. | Nhi | `RESOLVED` (#198) |
| `ISS-68` | Deadlock giao dịch SQL Server khi đăng ký tài khoản mới và màn hình trắng khi chuyển hướng đăng nhập. | Tách commit `app_user` trước khi ghi `login_history`, thêm alias `/login`, `/register` và fallback route chống trắng trang. | Tùng | `RESOLVED` |
| `ISS-70` | Vé sự cố hiển thị vi phạm SLA 2h và đếm ngược gây áp lực sai thực tế vận hành. | Bãi bỏ cam kết SLA 2h, phân loại Khẩn cấp/Bình thường và đếm ngược; đơn giản hóa phân công theo ca trực. | Tùng | `RESOLVED` |
| `ISS-71` | Modal nghiệm thu sự cố thiếu danh mục phụ phí BOM và cơ chế phân định lỗi công ty vs khách hàng. | Móc nối API phụ phí BOM multi-select, phân định 2 nút trách nhiệm lỗi và khóa nghiệm thu nếu chưa thu phí khách. | Tùng | `RESOLVED` |
| `ISS-72` | Giao diện khách hàng thừa tab Chờ nghiệm thu và banner nhắc đóng vé gây rườm rà. | Bỏ tab Chờ nghiệm thu và banner nhắc nhở; đóng thẳng ticket sau khi Staff nghiệm thu hiện trường. | Tùng | `RESOLVED` |
| `ISS-73` | Vé sự cố đã hoàn thành ở tab Sự cố Kỹ thuật trên bàn Phân công nhân sự vẫn hiện nút Điều chuyển. | Thay bằng badge "Đã xong" màu xanh, ẩn điều chuyển trên các vé đã hoàn thành/đã đóng. | Tùng | `RESOLVED` |
| `ISS-74` | Lệch số lượng và thông tin ticket sự cố giữa màn hình Phân công nhân sự và Xử lý sự cố theo cơ sở. | Đồng bộ lưu cơ sở qua localStorage, chuẩn hóa facilityId ở Backend qua COALESCE(su.facilityId, rc.facilityId). | Tùng | `RESOLVED` |
| `ISS-75` | Khách đặt kho ở cơ sở/ô kho bị ngừng hoạt động không có popup cảnh báo và bị tự động điều hướng sai cơ sở. | Bỏ fallback ngầm facList[0], chặn đặt kho cơ sở inactive, bổ sung Popup cảnh báo khi cơ sở/ô kho ngừng hoạt động và điều hướng về trang chủ/danh sách cơ sở. | Nhi | `RESOLVED` |
| `ISS-76` | Bấm "Xác nhận ô kho này & Tiếp tục" chưa gọi database kiểm tra tính sẵn sàng thời gian thực (trùng lịch hoặc bảo trì). | Bổ sung kiểm tra database thời gian thực trong handleProceedToBooking, hiển thị popup cảnh báo nếu ô kho vừa bị khóa/bảo trì/người khác đặt và refresh sơ đồ. | Nhi | `RESOLVED` |
| `ISS-77` | Nút "Sửa lại thông tin" ở màn thanh toán VietQR cho phép quay lại khi đơn giữ chỗ đã tạo, gây treo reservation. | Đổi thành nút "Hủy giữ chỗ" kèm modal xác nhận, gọi API hủy reservation giải phóng ô kho và xóa draft. | Nhi | `RESOLVED` |
| `ISS-78` | Trang "Kho của tôi" thiếu mục hiển thị đơn đang giữ chỗ 48h, khiến khách không xem được thời gian và thanh toán tiếp. | Thêm thẻ KPI, tab Đang giữ chỗ, component PendingReservationCard kèm đếm ngược 48h, nút Thanh toán VietQR và Hủy giữ chỗ. | Nhi | `RESOLVED` |
| `ISS-79` | Hủy yêu cầu trả kho dùng window.confirm thô; Tạo/Hủy vé hỗ trợ thiếu Modal popup thông báo và xác nhận đồng bộ. | Thay window.confirm bằng Modal xác nhận custom chuẩn Design System; Bổ sung Modal thông báo tạo vé thành công (kèm mã SUP) và Modal xác nhận trước khi hủy vé. | Nhi | `RESOLVED` |
| `ISS-80` | Loại kho mới tạo chưa được BOM niêm yết giá vẫn cho phép Customer chọn đặt chỗ (sai US-BM-03.1 AC-5). | Khóa chọn thẻ loại kho chưa niêm yết (badge "Chưa niêm yết giá", disable nút chọn) và chặn ở API Reservation backend. | Nhi | `RESOLVED` |
| `ISS-81` | Logo thương hiệu không đồng bộ giữa các phân hệ (Customer/Dashboard dùng icon Box 1 khối, Auth dùng icon Boxes 3 khối). | Chuẩn hóa thống nhất Logo toàn hệ thống sử dụng icon Boxes 3 khối thông minh (`lucide-react`), tạo component Logo dùng chung và đồng bộ favicon. | Nhi | `RESOLVED` |
| `ISS-82` | Khách thanh toán đơn đang giữ chỗ 48h bị chặn "Hết chỗ" do tính trùng đơn của mình và BookingPage tạo lại reservation mới. | Hỗ trợ `reservationId` chuyển thẳng Bước 3 thanh toán VietQR cho đơn cũ, không tạo trùng và không bị chặn bởi availability. | Nhi | `RESOLVED` |
| `ISS-83` | Vé sự cố khách hàng tạo không hiển thị bên Manager do thiếu liên kết hợp đồng/cơ sở và lệch enum status OPEN vs NEW. | Bổ sung fallback tự động gán hợp đồng ACTIVE, thêm @JsonIgnoreProperties/facilityId, đổi tab Frontend sang NEW và alias an toàn ở Backend. | Tùng | `RESOLVED` |

*(Lịch sử thảo luận chi tiết của các vấn đề cũ trước đây được lưu tại [docs/_archive/OPEN-ISSUES-LEGACY.md](_archive/OPEN-ISSUES-LEGACY.md))*

---

## 3. 📊 Ma trận Tiến độ 4 Workstream

| Phân hệ / Tính năng | Luồng (Flow) | Backend API | Frontend UI | E2E Test | Ghi chú |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Catalog & Tìm kiếm kho** | Flow 1 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Hỗ trợ lọc theo diện tích, loại kho |
| **Đặt chỗ & Thanh toán cọc** | Flow 1 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | VietQR tích hợp PayOS / Mock |
| **Bàn giao kho (Check-in)** | Flow 2 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Staff e-Form ký nhận & cấp mã |
| **Quản lý kho đang thuê** | Flow 3 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Xem chi tiết, gia hạn, báo trả kho |
| **Nghiệm thu trả kho & Tất toán**| Flow 3 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Manager phân công, Staff nghiệm thu |
| **Bảng giá & Chính sách BOM** | Flow 4 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Cấu hình giá, chiết khấu |
| **Điều phối nhân sự cơ sở** | Flow 5 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Phân công ca trực và tiếp nhận việc |
| **Gia hạn thuê online** | Flow 6.1 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Thanh toán tiền thuê chu kỳ mới, bỏ khóa 30 ngày |
| **Cronjob Quá hạn & Khóa mã** | Flow 6.2 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Tự động tính phí D+1, khóa mã D+7 (BR-OVD-05) |
| **Xử lý sự cố & Báo cáo** | Flow 7 | ✅ Sẵn sàng | ✅ Sẵn sàng | ✅ Đạt | Gửi ticket, phản hồi và đóng sự cố |

---

## 4. 🤖 Chỉ dẫn Tương tác dành cho AI

Khi bắt đầu một phiên làm việc mới với Antigravity / Gemini / Claude:
1. **Đọc Dashboard trước:** Luôn đọc file này để biết trạng thái mới nhất của dự án và Workstream bạn đang tham gia.
2. **Tuân thủ quy chuẩn Zero-Conflict:** Chỉ chỉnh sửa trong phạm vi Backend/Frontend của Workstream được giao (xem [docs/PLAN.md](PLAN.md)).
3. **Cập nhật trạng thái sau khi xong task:** 
   - Nếu giải quyết xong một issue trong bảng: Đổi trạng thái sang `RESOLVED`.
   - Nếu phát hiện vấn đề kỹ thuật mới: Thêm 1 dòng mới vào Bảng Sổ Vấn đề theo đúng Quy tắc 3 dòng.

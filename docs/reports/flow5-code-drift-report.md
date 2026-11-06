# Báo cáo Độ lệch Mã nguồn: Flow 5 — Facility Storage Allocation & Staff Dispatching

> **Dự án:** Self-Storage Facility Rental and Management System (SWP391)  
> **Người phụ trách (Assignee):** **Lê Thanh Tùng** (WS4 — Backend Lead & Quản trị)  
> **Phân hệ đối soát:** Flow 5 — Quản lý Ô kho tại Cơ sở & Phân công Nhân sự  
> **Tài liệu đối chiếu:** `docs/WORKFLOWS.md § 6`, `docs/TOPIC.md § 4 (Flow 5)`, `docs/Week9Task.md § 4.5`, `docs/BUSINESS-RULES.md § 16 (BR-BOM, BR-FM)`  
> **Sơ đồ HTML Archify đã nghiệm thu:**  
> 1. `docs/diagrams/flow5-facility-storage-workflow.html` (Interactive Workflow Diagram — Exit Code 0, Showcase)  
> 2. `docs/diagrams/flow5-facility-hierarchy-tree.html` (Interactive Hierarchy Tree Diagram — Exit Code 0, Showcase)  
> **Tình trạng nghiệm thu:** [x] Finalize thành công 4 gates (`validate`, `deliver`, `check`, `browser-check`)

---

## 1. Bảng đối soát Thiết kế vs Thực tế Mã nguồn

| STT | Bước nghiệp vụ theo Thiết kế (`docs/WORKFLOWS.md § 6`) | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Khởi tạo ô kho gắn liền BOM UnitType (`BR-FM-01`)** | FM chọn `unitTypeId` từ Master Catalog do BOM ban hành; hệ thống chặn việc FM tự định nghĩa kích thước hay đơn giá cơ sở | `StorageUnitServiceImpl.java#L166-L186`, `StorageUnitListPage.tsx#L176-L188` | `[Implemented & Compliant]` |
| **2** | **Chống trùng mã ô kho trong cùng cơ sở** | Truy vấn `storageUnitRepository.existsByFacilityIdAndCode()` trước khi lưu, quăng lỗi `409 Conflict` nếu trùng | `StorageUnitServiceImpl.java#L170-L173` | `[Implemented]` |
| **3** | **Khởi tạo ô kho hàng loạt (Batch Provisioning)** | Hỗ trợ tạo dải ô kho tự động theo tiền tố (`prefix`) và dải số (`startNumber..endNumber`) với số tầng và vị trí | `StorageUnitServiceImpl.java#L189-L215` | `[Implemented]` |
| **4** | **Phân công ca trực hằng ngày linh hoạt (`FM-05`, `FS-06`)** | Thay vì gán nhân viên cứng theo ô kho, hệ thống phân công động theo ca trực hằng ngày (`work_date`) cho 3 loại việc: Handover (Check-in), Return (Nghiệm thu trả kho), Support (Xử lý sự cố) | `StaffAssignmentServiceImpl.java#L38-L146`, `StaffDailyTaskController.java#L28-L51` | `[Implemented & Enhanced]` |
| **5** | **Khóa an toàn Soft Delete ô kho (`BR-BOM-02`)** | Tuyệt đối chặn thao tác xóa hoặc đổi trạng thái sang `INACTIVE` nếu ô kho đang ở trạng thái `OCCUPIED` hoặc có hợp đồng hiệu lực | `StorageUnitServiceImpl.java#L222-L225` | `[Implemented & Compliant]` |
| **6** | **Cách ly dữ liệu đa cơ sở (`SA-03`, IDOR Protection)** | Sử dụng `FacilitySecurityService` qua SpEL `@PreAuthorize("@facilitySecurity.canAccessFacility(#facilityId)")` để đảm bảo FM/Staff chỉ truy cập đúng cơ sở được phân công | `FacilitySecurityService.java#L20-L56`, `StorageUnitController.java#L56, L76` | `[Implemented & Compliant]` |
| **7** | **Thông báo ca trực thời gian thực cho nhân viên** | Hệ thống lưu bản ghi vào `staff_daily_assignment` và ghi nhận `log.info(...)`. Chưa tích hợp WebSocket Push hoặc SMS thông báo đến thiết bị di động của nhân viên | `StaffAssignmentServiceImpl.java#L133-L135` | `[Partially Implemented - Console Log & DB Only]` |
| **8** | **Chuyển khoang sang chế độ bảo trì khẩn cấp (`MAINTENANCE`)** | FM có quyền đưa ô kho ẩm dột/hỏng khóa vào bảo trì; ô kho này lập tức bị loại khỏi danh sách gợi ý gán kho khi Check-in | `StorageUnitServiceImpl.java#L218-L237`, `StorageUnitStatus.java#L11-L21` | `[Implemented]` |

---

## 2. Danh sách Mã nguồn Chết / Cần dọn dẹp (Dead Code Candidates)

| STT | File / Class / Method | Vị trí (Package / Directory) | Lý do nghi ngờ (Không caller, Mock cũ, mồ côi) | Đề xuất xử lý |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Constructor 3 tham số `StorageUnitServiceImpl` | `backend/src/main/java/com/swp391/selfstorage/unit/service/StorageUnitServiceImpl.java#L44-L49` | Constructor cũ khi chưa có `policyVersionRepository` và `priceRepository`, chỉ còn các file test cũ gọi | Giữ lại phục vụ unit test cũ, đánh dấu `@Deprecated` để chuyển dần sang constructor 5 tham số |
| **2** | Legacy Mock endpoints trong staff controller (nếu có) | `backend/src/main/java/com/swp391/selfstorage/support/StaffDailyTaskController.java#L53-L64` | Endpoint `/reports/staff/{staffId}/daily-tasks` trùng lặp hoàn toàn chức năng với `/staff/{staffId}/daily-tasks` | Đánh dấu `@Deprecated` và đồng nhất về `/staff/{staffId}/daily-tasks` trong API-SPEC § 12 |

---

## 3. Kết luận Nghiệm thu Flow 5

1. **Tính Toàn vẹn & Sẵn sàng Triển khai:** Luồng Flow 5 đã phản ánh trung thực 100% hiện trạng mã nguồn Java Spring Boot và React TypeScript. Hai sơ đồ Archify (`flow5-facility-storage-workflow.html` và `flow5-facility-hierarchy-tree.html`) đã đạt chuẩn **Showcase** và vượt qua toàn bộ 4 cổng kiểm định nghiêm ngặt.
2. **Tuân thủ Tuyệt đối Quy tắc Nghiệp vụ:** Toàn bộ các chốt chặn `BR-FM-01` (chọn UnitType từ BOM), `BR-BOM-02` (chặn xóa ô đang thuê), và `SA-03` (cách ly phân quyền đa cơ sở) đều đã được kiểm chứng bằng dòng code thực tế, không có tình trạng "vẽ chay" hay giả định Happy-Path-Only.


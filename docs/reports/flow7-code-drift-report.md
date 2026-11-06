# Báo Cáo Độ Lệch Mã Nguồn & Danh Sách Mã Nguồn Chết: Flow 7

> **Dự án:** Self-Storage Facility Rental and Management System  
> **Luồng nghiệp vụ:** **Flow 7 — Support Request, Damage Compensation & Unit Swap (Yêu cầu Hỗ trợ, Bồi thường Thiệt hại & Điều chuyển Kho)**  
> **Người phụ trách (Assignee):** **Lê Thanh Tùng** (WS4 — Backend Lead, Security & Incident Handling)  
> **Sơ đồ HTML Standalone hoàn thiện:**  
> - **Sơ đồ Quy trình Nghiệp vụ (Workflow):** [`docs/diagrams/flow7-support-ticket-workflow.html`](../diagrams/flow7-support-ticket-workflow.html)  
> - **Sơ đồ Trình tự Bồi thường & Đổi kho (Sequence):** [`docs/diagrams/flow7-damage-compensation-sequence.html`](../diagrams/flow7-damage-compensation-sequence.html)  
> **Commit Snapshot đối chiếu:** `346974f7c7ac2b3e2ce0f2625b679eebd936de25`  
> **Tình trạng nghiệm thu Archify:** `[x] Finalize thành công 4/4 gates (validate, deliver, check, browser-check: 100% PASS, 0 diagnostics, Exit code 0, Profile showcase)`

---

## 1. Bảng Đối Soát Thiết Kế vs Thực Tế Mã Nguồn (Design vs Actual Implementation)

| STT | Bước nghiệp vụ theo Thiết kế (`docs/WORKFLOWS.md § 8` & `BR-SUP`) | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Cam kết SLA cứng 2 giờ/24 giờ & Đồng hồ đếm ngược (`BR-SUP-01`)** | **Đã bãi bỏ theo quyết định nghiệp vụ mới nhất**. Hệ thống chuyển sang xử lý linh hoạt theo ca trực cơ sở; trường `slaDueAt` để `null`, mức độ khẩn cấp `isUrgent` do khách chọn (mặc định `false`). | `CustomerSupportServiceImpl.java#L110-L114`<br>`SupportPage.tsx#L50-L75` | `[Business Policy Drift / Verified in Code]` |
| **2** | **Khóa an toàn Điều chuyển Kho Khẩn cấp (`BR-SUP-05`)** | Đã cài đặt **Safety Lock cấp hệ thống**: Khi nhân viên khảo sát phát hiện thấm dột/hư hại kết cấu, bật `relocationRequired = true`. Hệ thống **CẤM** đóng ticket ở trạng thái `CLOSED` khi chưa hoàn tất đổi kho (`reassignUnit`). | `StaffSupportServiceImpl.java#L148-L168`<br>`StaffSupportServiceImpl.java#L202-L210` | `[Fully Implemented / Security Gate]` |
| **3** | **Phân định Trách nhiệm & Tính Phụ phí Sửa chữa (`BR-SUP-02`)** | Khảo sát hiện trường xác định nguyên nhân: Lỗi cơ sở (hỏng khóa, rò rỉ mái) $\rightarrow$ Sửa miễn phí 100%. Lỗi do khách thuê (làm gãy chìa, tự ý cạy phá, rác bẩn) $\rightarrow$ Ghi nhận phụ phí sửa chữa vào kỳ thanh toán tiếp theo. | `StaffSupportServiceImpl.java#L171-L215`<br>`StaffIncidentDetailView.tsx#L50-L85` | `[Fully Implemented]` |
| **4** | **Hạn mức Bảo hiểm Hàng hóa & Miễn trừ Hàng cấm (`BR-SUP-04`)** | Gói Tiêu chuẩn mặc định bồi thường tối đa 10,000,000 VNĐ; Gói bảo vệ mở rộng (50,000đ/tháng) nâng trần lên 50,000,000 VNĐ. Khách hàng khai báo hàng cấm (tiền mặt, kim khí quý, chất cháy nổ) bị miễn trừ trách nhiệm 100% (0đ bồi thường). | `CustomerSupportServiceImpl.java#L126-L131`<br>`StaffSupportController.java#L75-L85` | `[Compliant with Policy / Manual Approval]` |
| **5** | **Cronjob Tự động Đóng sau 48h (`SupportAutoCloseJob`)** | Cronjob chạy ngầm định kỳ hàng đêm lúc 00:30:00 (UTC+7): Tự động quét các phiếu ở trạng thái `RESOLVED` quá 48h (2 ngày) không có phản hồi từ khách hàng sang `CLOSED`. **Ràng buộc an toàn:** Chỉ đóng khi `relocation_required = false`. | `SupportAutoCloseJob.java#L27-L55` | `[Fully Implemented Background Job]` |
| **6** | **CSDL Bằng chứng Nghiệm thu Sự cố Đa hình (`support_attachment`)** | Thay vì tạo bảng riêng cho từng loại ảnh, hệ thống dùng cấu trúc đa hình `support_attachment` với `entity_type = 'SUPPORT_REQUEST'` (ảnh khách gửi ban đầu) và `'SUPPORT_RESOLUTION'` (ảnh nhân viên nghiệm thu sau sửa, tối đa 5 ảnh). | `StaffSupportServiceImpl.java#L218-L230`<br>`V1__init_postgres_schema.sql#L645-L655` | `[Polymorphic Architecture Consolidation]` |

---

## 2. Danh Sách Mã Nguồn Chết / Cần Dọn Dẹp (Dead Code Candidates)

| STT | File / Component | Vị trí (Package / Directory) | Lý do phát hiện | Đề xuất giải pháp |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `IncidentManagementPage.tsx` | `frontend/src/features/manager/pages/` | Trang quản lý sự cố gộp cũ, không còn được bất kỳ router nào (`ManagerRoutes.tsx`) import hay sử dụng. Quy trình quản lý sự cố hiện đã được phân rã thành luồng Drill-down chuẩn: `IncidentDashboardPage.tsx` $\rightarrow$ `IncidentListPage.tsx` $\rightarrow$ `IncidentDetailPage.tsx`. | **Xóa bỏ (Dead Code)** để giải phóng dung lượng và tránh nhầm lẫn cho team frontend. |
| **2** | `CloseIncidentModal.tsx` | `frontend/src/features/manager/components/` | Component đóng sự cố độc lập cũ không có caller; chức năng giải quyết sự cố và phê duyệt đã được tích hợp trực tiếp vào `IncidentDetailPage.tsx` và `StaffIncidentDetailView.tsx`. | **Xóa bỏ (Dead Code)**. |

---

## 3. Tổng Kết Chất Lượng Bàn Giao (DoD Compliance)

- [x] **Độ bao phủ quy tắc nghiệp vụ:** Phản ánh đầy đủ `SC-06`, `FS-03`, `FS-05`, `FM-05`, `BR-SUP-01..05`.
- [x] **Xử lý ngoại lệ đầy đủ:** Đã trực quan hóa 3 nhánh rẽ ngoại lệ: Hợp đồng vô hiệu (400), Phụ phí lỗi do khách (`BR-SUP-02`), và Khóa điều chuyển ô kho khẩn cấp (`BR-SUP-05`).
- [x] **Trực quan hóa tác vụ ngầm:** Thể hiện rõ ràng tác vụ cronjob hằng đêm `SupportAutoCloseJob` (00:30 UTC+7).
- [x] **Kiểm thử hồi quy & Build toàn vẹn:** Cả 2 sơ đồ Archify đạt chuẩn Showcase, 0 diagnostics, sẵn sàng tích hợp vào tài liệu kiến trúc SAD.

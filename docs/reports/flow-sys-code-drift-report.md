# Báo Cáo Độ Lệch Mã Nguồn & Danh Sách Mã Nguồn Chết: Flow SYS

> **Dự án:** Self-Storage Facility Rental and Management System  
> **Phân hệ cốt lõi:** **Flow SYS — Authentication, Multi-Facility RBAC Data Boundary & Scheduled Background Cronjobs**  
> **Người phụ trách (Assignee):** **Lê Thanh Tùng** (WS4 — Backend Lead, Security & Multi-Facility RBAC) phối hợp cùng **Huỳnh Nhật** (WS3 — Cron Config)  
> **Sơ đồ HTML Standalone hoàn thiện:**  
> - **Sơ đồ Kiến trúc Bảo mật Tầng sâu & RBAC (Architecture):** [`docs/diagrams/flow-sys-security-architecture.html`](../diagrams/flow-sys-security-architecture.html)  
> - **Sơ đồ Trình tự Tác vụ Ngầm Tự động (Sequence):** [`docs/diagrams/flow-sys-cron-schedulers-sequence.html`](../diagrams/flow-sys-cron-schedulers-sequence.html)  
> **Commit Snapshot đối chiếu:** `7b81ffe7c2be1fa5d46f0543b6710f3dc9ed5729`  
> **Tình trạng nghiệm thu Archify:** `[x] Finalize thành công 4/4 gates (validate, deliver, check, browser-check: 100% PASS, 0 diagnostics, Exit code 0, Profile showcase)`

---

## 1. Bảng Đối Soát Thiết Kế vs Thực Tế Mã Nguồn (Design vs Actual Implementation)

| STT | Khía cạnh Bảo mật & Cron theo Thiết kế | Hiện trạng Mã nguồn Thực tế | File & Dòng Code kiểm chứng | Đánh giá Trạng thái |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Quản lý Phiên Đăng nhập & Token Client (`SA-01`)** | Tài liệu phân tích ban đầu (`Week9Task.md § 4.8`) giả định sử dụng `AuthContext.tsx`. Thực tế hệ thống sử dụng module singleton `tokenStorage` gọn nhẹ, lưu trữ JWT và thông tin phiên `UserSession` an toàn trên `localStorage`, tự động dọn dẹp khi token hết hạn. Phân quyền điều hướng do `ProtectedRoute.tsx` đảm nhiệm. | `tokenStorage.ts#L90-L150`<br>`ProtectedRoute.tsx#L11-L38` | `[Architecture Refinement / Zero-Drift]` |
| **2** | **Bộ lọc Xác thực Tầng sâu (Spring Security Filter Chain)** | Triển khai mô hình Stateless Session với `JwtAuthenticationFilter` kế thừa `OncePerRequestFilter`, được đưa vào trước `UsernamePasswordAuthenticationFilter`. Trích xuất Bearer token, giải mã Claims qua `JwtTokenProvider`, và thiết lập `UserPrincipal` vào `SecurityContextHolder`. | `SecurityConfig.java#L47-L77`<br>`JwtAuthenticationFilter.java#L32-L57`<br>`JwtTokenProvider.java#L45-L59` | `[Fully Implemented / Production Ready]` |
| **3** | **Multi-Facility RBAC & Chống Lỗ hổng IDOR (`SA-03` & `BR-GEN-07`)** | Cài đặt kiểm soát biên dữ liệu cơ sở qua `FacilitySecurityService` (`@facilitySecurity`):<br>- `ADMIN` & `BOM`: Có quyền toàn cục trên tất cả cơ sở kho (`isGlobalManagerOrAdmin`).<br>- `FACILITY_MANAGER` & `FACILITY_STAFF`: Bắt buộc đối soát với danh sách `facilityIds` từ bảng `user_facility_assignment`.<br>- Chặn đứng nguy cơ tấn công IDOR bằng SpEL `@PreAuthorize("@facilitySecurity.canAccessFacility(#id)")`. | `FacilitySecurityService.java#L18-L56`<br>`UserPrincipal.java#L22-L35`<br>`UserFacilityAssignment.java#L13-L35` | `[Security Gate / Verified in Code]` |
| **4** | **Tự động Kích hoạt Hợp đồng T+11 (`BR-CAN-04` & `BR-CHK-05`)** | Tác vụ ngầm `AutoCheckInActivationScheduler` chạy định kỳ lúc 00:00:00 hằng ngày (`0 0 0 * * ?`): Quét toàn bộ hợp đồng `PENDING_CHECK_IN` có ngày bắt đầu trước mốc `cutoffDate` (T+11), tự động kích hoạt sang `ACTIVE`, tự sinh mã PIN 6 chữ số nếu khách chưa tạo, chuyển ô kho sang `OCCUPIED` và giữ chỗ sang `FULFILLED`. | `AutoCheckInActivationScheduler.java#L36-L75` | `[Fully Implemented Background Job]` |
| **5** | **Quét Phạt Quá Hạn Hằng Đêm 00:00:00 UTC+7 (`BR-OVD-01..05`)** | Tác vụ ngầm `OverdueCronJob` chạy lúc 00:00:00 hằng đêm cố định theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh`):<br>- **D+1..D+3:** Ân hạn, chuyển `OVERDUE`, phạt = 0đ (`BR-OVD-01, 02`).<br>- **D+4..D+9:** Tính phạt lũy tiến theo ngày dựa trên biểu phí hợp đồng (`BR-OVD-03, 04`).<br>- **D+7:** Thu hồi mã PIN (`setAccessCode(null)`), khóa quyền mở khóa vật lý (`BR-OVD-05`).<br>- **D+10:** Cưỡng chế chấm dứt (`TERMINATED`), khấu trừ cọc, chuyển ô kho sang `MAINTENANCE` niêm phong (`BR-OVD-07`).<br>- **D+15:** Tự động hoàn tất bảo trì, chuyển ô kho về `AVAILABLE` hoặc `RESERVED`. | `OverdueCronJob.java#L24-L41`<br>`OverdueProcessingServiceImpl.java#L40-L160` | `[Fully Implemented / Multi-tier Policy]` |
| **6** | **Kho Lưu trữ Nhật ký Kiểm toán (Audit Vault & LoginHistory)** | Tách bạch 2 bảng nhật ký chuyên biệt:<br>1. `audit_log`: Ghi nhận toàn bộ thao tác thay đổi dữ liệu nhạy cảm kèm `before_value` và `after_value`.<br>2. `login_history`: Ghi nhận lịch sử đăng nhập, địa chỉ IP, User-Agent và trạng thái đăng nhập thành công hay thất bại. | `AuditLog.java#L15-L48`<br>`LoginHistory.java#L1-L40`<br>`V1__init_postgres_schema.sql` | `[Fully Implemented / Compliance]` |

---

## 2. Danh Sách Mã Nguồn Chết / Khuyến Nghị Tinh Gọn (Dead Code & Optimization Candidates)

| STT | File / Component | Vị trí (Package / Directory) | Hiện trạng & Lý do phát hiện | Đề xuất giải pháp |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `AuthContext.tsx` (Giả định trong Spec) | `frontend/src/context/` | Không tồn tại trong dự án thực tế. Ứng dụng hoạt động xuất sắc và mượt mà qua cơ chế `tokenStorage` singleton; việc tạo thêm React Context là không cần thiết và gây re-render thừa. | **Giữ nguyên kiến trúc hiện tại**, cập nhật tài liệu kỹ thuật đồng bộ với `tokenStorage.ts`. |
| **2** | Whitelist endpoints trong `SecurityConfig.java` | `backend/com.swp391.selfstorage.common.config.SecurityConfig` | Dòng 68 hiện để `.anyRequest().permitAll()` để hỗ trợ giai đoạn phát triển song song của 4 Workstreams, trong khi các hàm nghiệp vụ được bảo vệ chặt chẽ bởi `@PreAuthorize` và `@EnableMethodSecurity`. | Khi triển khai Production, chuyển `.anyRequest().permitAll()` thành `.anyRequest().authenticated()` để bảo vệ hai lớp (Double-gate Security). |

---

## 3. Tổng Kết Chất Lượng Bàn Giao (DoD Compliance)

- [x] **Bao phủ 100% yêu cầu bảo mật và quy tắc nghiệp vụ:** Khớp chính xác với `SA-01..04`, `BR-GEN-06, 07`, `BR-CAN-04`, `BR-OVD-01..07`.
- [x] **Trực quan hóa chuẩn xác 2 sơ đồ Archify:** Cả 2 sơ đồ `flow-sys-security-architecture.html` và `flow-sys-cron-schedulers-sequence.html` đều vượt qua 4/4 cổng kiểm định với profile `showcase`, 0 diagnostics.
- [x] **Bảo chứng mã nguồn GitHub thực tế:** Tất cả các node và message đều được gắn liên kết trực tiếp tới file và số dòng code thực tế trong repository.
- [x] **Sẵn sàng tích hợp báo cáo SAD:** Toàn bộ bằng chứng và phân tích độ lệch mã nguồn đã được tổng hợp hoàn chỉnh, sẵn sàng cho buổi bảo vệ đồ án.


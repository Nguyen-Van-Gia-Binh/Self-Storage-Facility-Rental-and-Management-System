# GEMINI.md — Hướng dẫn làm việc cho Trợ lý AI (Antigravity / Gemini)

> **Dự án:** Self-Storage Facility Rental and Management System (SWP391)  
> **Thời lượng:** 10 tuần · 5 giai đoạn · 4 thành viên (4 Workstreams độc lập)  
> **Ngăn xếp công nghệ:** Spring Boot 3 (Java 17 LTS) · React 18 (TypeScript + Vite) · SQL Server 2022 · Flyway · JWT

Tài liệu này là chỉ dẫn cốt lõi dành riêng cho các tác nhân AI khi làm việc trong repository này, nhằm đảm bảo tối đa tính nhất quán, triệt tiêu xung đột mã nguồn và tuân thủ tuyệt đối quy trình kỹ thuật của nhóm.

---

## 1. Trọng tâm & Ranh giới Workstream 2 (Nguyễn Văn Gia Bình)

Dự án vận hành theo **4 Trục công việc độc lập (Vertical Bounded Contexts)** để triệt tiêu merge conflict ([docs/PLAN.md § 2, § 6](docs/PLAN.md)). Bạn đang làm việc cùng **Nguyễn Văn Gia Bình**, người phụ trách **Workstream 2 (WS2: Cơ sở, Kho & Vận hành)**.

### 🔹 Ranh giới quyền hạn của WS2:
* **Backend Packages sở hữu độc quyền:**
  * `com.swp391.selfstorage.facility` (Quản lý cơ sở `BM-01`, tra cứu `SC-01`)
  * `com.swp391.selfstorage.unit` (Quản lý loại ô kho `FM-01`, ô kho vật lý)
  * `com.swp391.selfstorage.contract` (Hợp đồng thuê, Check-in `FS-01`..`03`, Return `FS-04`, `FM-04`)
* **Bảng CSDL làm chủ:**
  * `facility`, `unit_type`, `facility_unit_type_price`, `storage_unit`, `rental_contract`, `inspection`, `handover_record`.
* **Frontend Portal làm chủ:**
  * `frontend/src/features/staff/` (Staff Desk, Handover e-Form, Return Inspection, Unit Status)
  * Trang công khai danh mục cơ sở & ô kho (`T2.16`).

### ⚠️ Quy tắc 6 Zero-Conflict:
1. **Không sửa chéo:** Tuyệt đối không chỉnh sửa Entity/Repository/Service thuộc package của Workstream khác (`reservation/`, `payment/`, `policy/`, `auth/`, `user/`, `support/`, `report/`).
2. **Giao tiếp lỏng lẻo qua ID & DTO:** Chỉ tham chiếu `id` hoặc gọi qua Interface Service / Common DTO.
3. **Mã dùng chung đặt ở Common:** Nếu cần tiện ích, mã lỗi, hoặc DTO chia sẻ, đặt tại `common/` và giữ tương thích ngược.

---

## 2. Quy trình làm việc chuẩn (Task Workflow theo CONTRIBUTING.md)

Mọi task khi được giao bắt buộc tuân thủ quy trình 5 bước nghiêm ngặt sau:

### Bước 1: Nhận task & Tạo nhánh Git riêng biệt (Branch Creation)
- **CẤM code thẳng trên `main`**. Trước khi bắt tay vào làm, đồng bộ `main` và tạo nhánh mới theo chuẩn [CONTRIBUTING.md § 2](CONTRIBUTING.md#2-đặt-tên-nhánh):
  - Định dạng: `<loại>/<mã-task>-<mô-tả-ngắn>` (ví dụ: `feature/T2.8-manage-unit-type-api`, `fix/T2.7-facility-status-check`).
  - Lệnh:
    ```powershell
    git checkout main; git pull origin main; git checkout -b feature/<mã-task>-<mô-tả-ngắn>
    ```

### Bước 2: Lập kế hoạch trước khi code (Writing Plans)
- Phân tích yêu cầu từ [docs/PLAN.md](docs/PLAN.md), [docs/API-SPEC.md](docs/API-SPEC.md), [docs/USER-STORIES-*.md](docs/USER-STORIES-BM-SA.md).
- Soạn thảo kế hoạch triển khai chi tiết lưu vào file `docs/superpowers/plans/YYYY-MM-DD-<tên-tính-năng>.md`.
- Chia nhỏ thành các **Bite-sized tasks** (mỗi task gồm đầy đủ: Files cần tạo/sửa, Interface, Test code, Implementation code).
- Trình người dùng duyệt kế hoạch trước khi thực thi mã nguồn.

### Bước 3: Chu trình TDD & Commit từng bước nhỏ (TDD & Atomic Commits)
1. **Viết test trước:** Tạo test case (Unit test / DataJpaTest / WebMvcTest).
2. **Xác nhận test lỗi (Red):** Chạy test để đảm bảo test thất bại do chưa có code hoặc thiếu chức năng.
3. **Viết code tối thiểu (Green):** Cài đặt logic vừa đủ để pass test.
4. **Xác nhận test thành công:** Chạy lại test suite để thấy `BUILD SUCCESS`.
5. **Cập nhật checkbox:** Đánh dấu `- [x]` ngay trong file plan sau khi hoàn thành task.
6. **Commit thường xuyên:** Commit ngay khi test pass theo chuẩn Conventional Commits tiếng Việt (`feat(scope): mô tả`).

### Bước 4: Kiểm thử toàn diện & Hỏi ý kiến người dùng nghiệm thu
- Chạy toàn bộ test suite dự án (`mvn clean test`) đảm bảo 100% xanh, không gây lỗi hồi quy.
- **Dừng lại và hỏi người dùng**: Báo cáo kết quả và hỏi rõ người dùng: *"Tôi đã hoàn thành task và kiểm thử toàn bộ đều xanh. Bạn xem qua kết quả có OK không để tôi đẩy nhánh lên origin và tạo nội dung Pull Request?"*

### Bước 5: Push nhánh lên remote & Soạn sẵn nội dung Pull Request
- Khi người dùng phản hồi **"OK"** hoặc đồng ý:
  1. Tự động đẩy nhánh lên remote repository:
     ```powershell
     git push -u origin <tên-nhánh>
     ```
  2. Soạn sẵn toàn bộ nội dung Pull Request theo mẫu chuẩn tại [CONTRIBUTING.md § 4](CONTRIBUTING.md#4-pull-request) (gồm: Tiêu đề `[<mã-task>] <loại>(<phạm-vi>): <mô-tả>`, Nhiệm vụ, Nội dung thay đổi, Phạm vi nghiệp vụ, Cách kiểm thử, Checklist).
  3. Cung cấp đường link tạo PR trên GitHub để người dùng bấm tạo PR cho bạn bè / nhóm review và duyệt merge (Squash and merge) vào `main`.

---

## 3. Quy chuẩn Môi trường & Hệ thống (Windows & Tooling)

* **Hệ điều hành & Shell:** Windows 11 với **PowerShell**.
  * **CẤM** dùng cú pháp `&&` nối lệnh (PowerShell sẽ báo lỗi cú pháp). Luôn dùng dấu chấm phẩy `;` để ngăn cách lệnh:
    ```powershell
    # ĐÚNG
    git add . ; git commit -m "feat: message"
    # SAI (Lỗi cú pháp PowerShell)
    git add . && git commit -m "feat: message"
    ```
  * **CẤM** dùng lệnh `cd`. Luôn chỉ định working directory rõ ràng qua tham số công cụ hoặc chạy lệnh có đường dẫn cụ thể.
* **Môi trường Java & Maven:**
  * Chuẩn của dự án là **Java 17 LTS** (khớp chính xác với `pom.xml` và `java --version` trên máy: `17.0.12`). Cài đặt tại `C:\Program Files\Java\jdk-17`.
  * Khi chạy các lệnh Maven trên terminal, đảm bảo trỏ đúng JDK 17 bằng cách dùng `$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'` nếu biến môi trường hệ thống đang trỏ tới JDK khác.
  * Đồng thời duy trì cấu hình `-Dnet.bytebuddy.experimental=true` trong `pom.xml` để đảm bảo tương thích đa phiên bản.
* **Cơ sở dữ liệu:** SQL Server 2022 qua cổng mặc định `1433`.

---

## 4. Quy chuẩn Database & API

* **Flyway Migration là Chân lý duy nhất (Single Source of Truth):**
  * Mọi thay đổi schema đều phải tạo file migration mới theo thứ tự phiên bản tăng dần trong `backend/src/main/resources/db/migration/` (ví dụ: `V3__add_facility_details.sql`, `V4__...`).
  * Tuyệt đối không chỉnh sửa nội dung các file migration cũ đã áp dụng (`V1`, `V2`...).
  * Đồng bộ ngay các cột mới vào tài liệu [docs/DATA-DICTIONARY.md](docs/DATA-DICTIONARY.md).
* **Quy tắc xóa dữ liệu (Soft Delete):**
  * Không sử dụng `DELETE` vật lý (Hard Delete) đối với các bảng danh mục (`facility`, `unit_type`, `storage_unit`) và dữ liệu hợp đồng/giao dịch.
  * Sử dụng cờ trạng thái: `status = 'ACTIVE' | 'INACTIVE'`.
  * Trước khi chuyển sang `INACTIVE`, bắt buộc kiểm tra các ràng buộc nghiệp vụ (ví dụ: không đóng cơ sở/ô kho khi còn hợp đồng `ACTIVE` hoặc `OVERDUE`).
* **Chuẩn hóa API Response:**
  * Kết quả đơn lẻ: `ApiResponse<T>`
  * Kết quả phân trang: `PageResponse<T>` (`content`, `page`, `size`, `totalElements`, `totalPages`)
  * Trả về đúng HTTP status code: `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict`.

---

## 5. Quy ước Ngôn ngữ & Git Commit

* **Ngôn ngữ trong mã nguồn (Code):**
  * 100% bằng **Tiếng Anh**: Tên class, interface, method, variable, package, bảng CSDL, tên cột, API path, enum constants.
  * Dùng chuẩn từ vựng domain theo [docs/TOPIC.md § 7](docs/TOPIC.md#7-thuật-ngữ-glossary): `Facility`, `StorageUnit`, `UnitType`, `Reservation`, `RentalContract`, `Deposit`, `Inspection`.
* **Ngôn ngữ trong Commit Message:**
  * Viết bằng **Tiếng Việt**, tuân thủ chuẩn **Conventional Commits**:
    * `feat(facility): cài đặt FacilityController với 5 REST endpoints`
    * `fix(contract): sửa lỗi tính phí quá hạn ngày D+4`
    * `docs(data-dict): cập nhật từ điển dữ liệu bảng facility`
    * `test(facility): bổ sung unit test cho FacilityService`
    * `refactor(unit): tối ưu hóa query kiểm tra capacity trống`
    * `chore(db): tạo migration V3 bổ sung thông tin liên hệ cơ sở`
* **Ngôn ngữ trong Tài liệu & Giao tiếp:**
  * Tài liệu giải thích, Walkthrough, Implementation Plan, và phản hồi trao đổi với người dùng viết bằng **Tiếng Việt**.

---

## 6. Bản đồ tài liệu tham chiếu (Documentation Map)

| Tài liệu | Vai trò / Phạm vi |
| :--- | :--- |
| [docs/TOPIC.md](docs/TOPIC.md) | **Chân lý nghiệp vụ cao nhất** — 5 Actor, 27 mã yêu cầu (`SC-*`, `FS-*`, `FM-*`, `BM-*`, `SA-*`), 7 luồng nghiệp vụ. |
| [docs/PLAN.md](docs/PLAN.md) | **Kế hoạch 5 giai đoạn & 4 Trục** — Phân công chi tiết từng task, deadline, quy tắc Zero-Conflict. |
| [docs/API-SPEC.md](docs/API-SPEC.md) | **Hợp đồng giao tiếp API** — Chi tiết endpoint, HTTP status, request/response body, mã lỗi. |
| [docs/BUSINESS-RULES.md](docs/BUSINESS-RULES.md) | **Quy định nghiệp vụ chi tiết** (`BR-*`) — Tiền cọc, biểu giá, quá hạn, hoàn tiền, bàn giao. |
| [docs/DATA-DICTIONARY.md](docs/DATA-DICTIONARY.md) | **Từ điển dữ liệu** — Ý nghĩa, kiểu dữ liệu và ràng buộc của từng cột trong database. |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | **Quy ước kỹ thuật** — Chuẩn cấu trúc package, đặt tên hàm, biến, quy chuẩn REST API. |

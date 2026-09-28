# GEMINI.md — Hướng dẫn làm việc cho Trợ lý AI (Antigravity / Gemini)

> **Dự án:** Self-Storage Facility Rental and Management System (SWP391)
> **Thời lượng:** 10 tuần · 5 giai đoạn · 4 thành viên (4 Workstreams độc lập)
> **Ngăn xếp công nghệ:** Spring Boot 3 (Java 17 LTS) · React 18 (TypeScript + Vite) · SQL Server 2022 · Flyway · JWT

Tài liệu này là chỉ dẫn cốt lõi dành riêng cho các tác nhân AI khi làm việc trong repository này, nhằm đảm bảo tối đa tính nhất quán, triệt tiêu xung đột mã nguồn và tuân thủ tuyệt đối quy trình kỹ thuật của nhóm.

---

## 1. Trọng tâm Giai đoạn: Kiểm thử Toàn diện, Rà soát & Sửa lỗi Hệ thống (Full-System QA & Bug Fixing)

Dự án đã hoàn thành giai đoạn phân chia 4 Trục công việc (WS1..WS4) và hiện bước vào **Giai đoạn Tích hợp Toàn diện & Khắc phục Lỗi Hệ thống (End-to-End Testing, QA & Bug Fixing)**. Bạn đang làm việc cùng **Nguyễn Văn Gia Bình** (Lead kỹ thuật), phụ trách **kiểm tra, đánh giá và sửa lỗi xuyên suốt trên toàn bộ hệ thống** (cả Backend lẫn Frontend).

### 🔹 Phạm vi quyền hạn & Trách nhiệm:

* **Toàn quyền can thiệp Backend (`com.swp391.selfstorage.*`):**
  * Sửa lỗi và tối ưu hóa ở tất cả các package: `facility`, `unit`, `contract`, `reservation`, `payment`, `policy`, `auth`, `user`, `support`, `report`, `common`.
* **Toàn quyền can thiệp Frontend (`frontend/src/*`):**
  * Sửa lỗi UI/UX, logic kết nối API, state management và routing trên tất cả các phân hệ: `customer`, `staff`, `manager`, `bom`, `admin`, `auth`, `common`.
* **Bảng CSDL & Migration:**
  * Chủ động rà soát schema, thêm migration Flyway mới (`V...__*.sql`) khi cần bổ sung cột hoặc ràng buộc dữ liệu, đồng bộ ngay vào `docs/DATA-DICTIONARY.md`.

### ⚠️ Quy tắc Vàng khi Sửa lỗi Toàn hệ thống:

1. **Bảo toàn Tính Toàn vẹn (System Integrity):** Khi sửa lỗi ở một module (ví dụ `contract`), phải kiểm tra kỹ tác động liên đới tới các module liên quan (`reservation`, `payment`, `inspection`) để không làm gãy các luồng đang hoạt động tốt.
2. **Kỷ luật TDD & Kiểm thử Hồi quy:** Viết test kiểm chứng lỗi trước khi sửa. Luôn chạy `mvn clean test` (Backend) và `npm run build` (Frontend) đảm bảo xanh 100% trước khi tạo PR.
3. **Cập nhật Bảng Điều hành:** Ghi nhận và cập nhật ngay trạng thái các lỗi đã khắc phục vào [docs/DASHBOARD.md](docs/DASHBOARD.md) theo Quy tắc 3 Dòng.

---

## 2. Quy trình làm việc chuẩn (Task Workflow theo CONTRIBUTING.md)

Mọi task khi được giao bắt buộc tuân thủ quy trình 5 bước nghiêm ngặt sau:

### Bước 1: Nhận task & Tạo nhánh Git riêng biệt (Branch Creation)

- **CẤM code thẳng trên `main` và CẤM tái sử dụng nhánh cũ đã merge/đang có PR**.
  - Dự án sử dụng cơ chế **Squash and merge** trên GitHub. Khi một PR được merge, GitHub sẽ nén toàn bộ commit thành một commit duy nhất trên `main`. Nếu tái sử dụng nhánh cũ hoặc rẽ nhánh từ commit cũ, Git sẽ báo **CONFLIC / xung đột hàng loạt** do lệch lịch sử commit.
- **Quy tắc bắt buộc:** Mỗi task BẮT BUỘC phải là một nhánh mới tinh, rẽ trực tiếp từ `main` mới nhất trên remote:
  - **Quy chuẩn tên nhánh được kiểm tra tự động bởi CI (`pr-bot.yml`):**
    - Regex CI: `^(feature|fix|docs|chore|refactor)/((T[0-9]+\.[0-9]+|Tx)-)?[a-z0-9-]+$`
    - `<loại>`: Chỉ một trong 5 từ: `feature`, `fix`, `docs`, `chore`, `refactor`.
    - Tiền tố mã task `(T<số>.<số>-|Tx-)` là **tùy chọn**: Có thể dùng mã task (ví dụ: `fix/Tx-login-loop`, `feature/T2.12-staff-api`) hoặc đặt tên ngắn gọn không cần mã task (ví dụ: `fix/navbar-ui`, `chore/clean-docs`, `fix/staff-desk-filter`).
    - Tên nhánh dùng chữ thường, ngăn cách bằng dấu gạch ngang `-`, không dấu tiếng Việt.
  - Lệnh tạo nhánh chuẩn:
    ```powershell
    git checkout main; git fetch origin main; git pull origin main; git checkout -b fix/<mô-tả-ngắn>
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

- Chạy toàn bộ test suite dự án (`mvn clean test` và `npm run build`) đảm bảo 100% xanh, không gây lỗi hồi quy.
- **Dừng lại và hỏi người dùng**: Báo cáo kết quả và hỏi rõ người dùng: *"Tôi đã hoàn thành task và kiểm thử toàn bộ đều xanh. Bạn xem qua kết quả có OK không để tôi đẩy nhánh lên origin và tự động tạo Pull Request bằng GitHub CLI (`gh pr create`)?"*

### Bước 5: Push nhánh & Tự động tạo Pull Request bằng GitHub CLI (`gh`)

- Khi người dùng phản hồi **"OK"** hoặc đồng ý:
  1. **Đồng bộ chống xung đột (Pre-push Rebase):** Luôn fetch `origin main` và rebase để đảm bảo nhánh luôn nằm trên đỉnh `main` mới nhất (tránh conflict khi mở PR):
     ```powershell
     git fetch origin main; git rebase origin/main
     ```
  2. **Đẩy nhánh lên remote repository:**
     ```powershell
     git push -u origin <tên-nhánh>
     ```
  3. **Tự động tạo Pull Request bằng GitHub CLI (`gh`):**
     - Máy tính đã cài đặt và đăng nhập sẵn GitHub CLI (`gh`).
     - Tác nhân AI tự động gọi lệnh `gh pr create` với:
       - `--title`: Chuẩn Conventional Commits (ví dụ: `feat(staff): kết nối Real API` hoặc `[T2.12] feat(...)`).
       - `--body`: Soạn sẵn đầy đủ nội dung theo mẫu chuẩn [CONTRIBUTING.md § 4](CONTRIBUTING.md#4-pull-request) (Mục tiêu, Chi tiết thay đổi, Hướng dẫn kiểm thử, Checklist DoD).
     - Lệnh mẫu:
       ```powershell
       gh pr create --title "<tiêu-đề-PR>" --body "<nội-dung-markdown>"
       ```
  4. Cung cấp đường link PR vừa tạo trên GitHub để người dùng tiện theo dõi bot CI (`pr-bot.yml`) tự động verify và squash-merge vào `main`.
  5. **Sau khi PR được merge vào `main`:** Xóa nhánh tính năng cả trên remote lẫn local để tránh nhầm lẫn cho các task sau.

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

| Tài liệu                                                              | Vai trò / Phạm vi                                                                                                                                       |
| :---------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/DASHBOARD.md](docs/DASHBOARD.md)                                   | **Bảng điều hành trung tâm & Bộ nhớ làm việc duy nhất** — Trọng tâm sprint hiện tại, tiến độ 4 Workstream, sổ Issue/Bug 3 dòng. |
| [docs/USER-STORIES-AND-USE-CASES.md](docs/USER-STORIES-AND-USE-CASES.md) | **Tài liệu Yêu cầu hợp nhất** — Quy tắc viết, toàn bộ User Stories (5 actor) & Phân rã 7 luồng Use Cases.                             |
| [docs/TOPIC.md](docs/TOPIC.md)                                           | **Chân lý nghiệp vụ cao nhất** — 5 Actor, 27 mã yêu cầu (`SC-*`, `FS-*`, `FM-*`, `BM-*`, `SA-*`), 7 luồng nghiệp vụ.          |
| [docs/PLAN.md](docs/PLAN.md)                                             | **Kế hoạch 5 giai đoạn & 4 Trục** — Phân công chi tiết từng task, deadline, quy tắc Zero-Conflict.                                       |
| [docs/API-SPEC.md](docs/API-SPEC.md)                                     | **Hợp đồng giao tiếp API** — Chi tiết endpoint, HTTP status, request/response body, mã lỗi.                                                 |
| [docs/BUSINESS-RULES.md](docs/BUSINESS-RULES.md)                         | **Quy định nghiệp vụ chi tiết** (`BR-*`) — Tiền cọc, biểu giá, quá hạn, hoàn tiền, bàn giao.                                       |
| [docs/DATA-DICTIONARY.md](docs/DATA-DICTIONARY.md)                       | **Từ điển dữ liệu** — Ý nghĩa, kiểu dữ liệu và ràng buộc của từng cột trong database.                                              |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md)                               | **Quy ước kỹ thuật** — Chuẩn cấu trúc package, đặt tên hàm, biến, quy chuẩn REST API.                                                 |

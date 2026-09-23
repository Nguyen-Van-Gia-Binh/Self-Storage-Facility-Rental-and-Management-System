# Test Suite: Bảo mật, REST API & Kiểm thử Phi chức năng (Security, REST API & Non-Functional Testing)

> **Tài liệu tham chiếu:** [API-SPEC.md](../API-SPEC.md) · [USE-CASES.md § 9](../USE-CASES.md#9-use-case-nền-tảng-ngoài-7-luồng) · [BUSINESS-RULES.md § 1, 11](../BUSINESS-RULES.md) · [CONVENTIONS.md](../CONVENTIONS.md)  
> **Workstream phụ trách:** WS4 (Admin & Nền tảng) · Phối hợp: WS1, WS2, WS3  
> **Mã Use Case bao phủ:** `UC-SYS-01`, `UC-SYS-02`, `UC-SYS-03`  
> **Mã Yêu cầu bao phủ:** `SA-01`, `SA-02`, `SA-03`, `SA-04`, và toàn bộ HTTP API Endpoints

---

## 1. Danh sách ca kiểm thử (Test Cases Summary)

### Phân nhóm A: Xác thực, Phân quyền & Bảo mật (Security & RBAC)
| Test Case ID | Test Summary | Category | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-SEC-001` | Đăng ký tài khoản mới và Đăng nhập trả Token JWT hợp lệ (`UC-SYS-01`) | Auth | Positive | P1 |
| `TC-SEC-002` | Gọi API với Token JWT đã hết hạn hoặc chữ ký bị giả mạo (Trả về `401 Unauthorized`) | Auth | Negative / Security | P1 |
| `TC-SEC-003` | Cơ chế Refresh Token: Cấp lại Access Token mới mà không bắt người dùng đăng nhập lại | Auth | Positive | P2 |
| `TC-SEC-004` | Kiểm thử ma trận phân quyền RBAC: Storage Customer gọi API xóa Facility của BOM (`403 Forbidden`) | RBAC | Security | P1 |
| `TC-SEC-005` | Kiểm thử lỗ hổng IDOR: Khách A cố tình đọc/sửa hợp đồng của Khách B qua URL (`403 Forbidden`) | IDOR | Security | P1 |
| `TC-SEC-006` | Kiểm tra phòng chống tấn công SQL Injection và XSS trên các form tìm kiếm và bình luận | Vulnerability | Security | P1 |
| `TC-SEC-007` | Ghi nhận nhật ký kiểm toán (Audit Activity Log) cho các thao tác nhạy cảm (`UC-SYS-03`, `SA-04`) | Audit | Compliance | P2 |

### Phân nhóm B: Kiểm thử Hợp đồng REST API (REST API Contract Testing)
| Test Case ID | Test Summary | HTTP Status | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-API-001` | Kiểm thử Response chuẩn hóa đơn lẻ `ApiResponse<T>` và phân trang `PageResponse<T>` | `200 OK` | Contract | P1 |
| `TC-API-002` | Tạo mới tài nguyên thành công trả về `201 Created` kèm Location header | `201 Created` | Contract | P1 |
| `TC-API-003` | Gửi Request Body thiếu trường bắt buộc hoặc sai định dạng trả về `400 Bad Request` | `400 Bad Request` | Validation | P1 |
| `TC-API-004` | Truy vấn tài nguyên với định danh ID không tồn tại trả về `404 Not Found` | `404 Not Found` | Negative | P1 |
| `TC-API-005` | Xung đột đặt chỗ trùng ô kho giữa 2 phiên đồng thời trả về `409 Conflict` | `409 Conflict` | Integrity | P1 |

### Phân nhóm C: Kiểm thử Phi chức năng & Dữ liệu (Non-Functional & Data Integrity)
| Test Case ID | Test Summary | Category | Test Type | Priority |
|:---:|---|:---:|:---:|:---:|
| `TC-NFR-001` | Kiểm chứng quy tắc làm tròn tiền tệ lên đến 1.000 VND trên mọi hóa đơn (`BR-GEN-04`) | Financial / BVA | Calculation | P1 |
| `TC-NFR-002` | Kiểm thử tính toàn vẹn Soft Delete: Không xóa vật lý dữ liệu danh mục và lịch sử | Data Integrity | Constraint | P1 |
| `TC-NFR-003` | Kiểm thử tải đồng thời (Concurrency Stress Test): 50 luồng tranh chấp 1 ô kho duy nhất | Performance | Concurrency | P1 |

---

## 2. Chi tiết các ca kiểm thử Bảo mật (Security Test Specifications)

### `TC-SEC-001`: Đăng ký tài khoản mới và Đăng nhập trả Token JWT hợp lệ
* **Traceability:** `UC-SYS-01` · `CONVENTIONS.md`
* **Test Type:** Security / Authentication · **Priority:** P1 (Critical)
* **Pre-conditions:** Khách hàng chưa có tài khoản.
* **Test Steps:**
  1. Gửi request `POST /api/v1/auth/register` với thông tin: Email: `testuser@example.com`, Mật khẩu: `Pass@123456`, Họ tên: "Nguyễn Văn Test", SĐT: `0912345678`.
  2. Gửi request `POST /api/v1/auth/login` với email và mật khẩu vừa tạo.
* **Expected Result:**
  - Bước 1: Tài khoản được tạo thành công, mật khẩu trong CSDL được băm an toàn bằng `BCrypt` (không lưu plaintext).
  - Bước 2: API đăng nhập trả về mã `200 OK` kèm `accessToken` (định dạng JWT), `refreshToken`, và thông tin vai trò `ROLE_CUSTOMER`.
  - Token giải mã (decode) chứa đúng `sub`, `roles`, `iat`, `exp`.

---

### `TC-SEC-002`: Gọi API với Token JWT đã hết hạn hoặc chữ ký bị giả mạo
* **Traceability:** `UC-SYS-01` · `API-SPEC.md`
* **Test Type:** Security (Negative) · **Priority:** P1 (Critical)
* **Pre-conditions:** Có 1 token JWT đã hết hạn (expired) và 1 token bị chỉnh sửa payload nhưng giữ nguyên signature.
* **Test Steps:**
  1. Gửi request `GET /api/v1/customer/contracts` kèm header `Authorization: Bearer <expired_token>`.
  2. Gửi request kèm header `Authorization: Bearer <tampered_token>`.
* **Expected Result:**
  - Cả 2 request đều bị chặn ngay tại `JwtAuthenticationFilter`.
  - Backend trả về mã lỗi HTTP `401 Unauthorized` kèm message: *"Token đã hết hạn hoặc không hợp lệ"*.

---

### `TC-SEC-003`: Cơ chế Refresh Token: Cấp lại Access Token mới
* **Traceability:** `UC-SYS-01`
* **Test Type:** Security / Session · **Priority:** P2 (High)
* **Pre-conditions:** Access Token đã hết hạn, nhưng Refresh Token vẫn còn thời hạn (chưa quá 7 ngày).
* **Test Steps:**
  1. Gửi request `POST /api/v1/auth/refresh-token` kèm `refreshToken`.
* **Expected Result:**
  - API trả về mã `200 OK` kèm cặp `accessToken` mới.
  - Người dùng có thể tiếp tục sử dụng ứng dụng mà không bị văng ra màn hình đăng nhập.

---

### `TC-SEC-004`: Kiểm thử ma trận phân quyền RBAC
* **Traceability:** `SA-02` · `UC-F5-07` · `TOPIC.md § 2`
* **Test Type:** Security / Access Control · **Priority:** P1 (Critical)
* **Pre-conditions:** Đã đăng nhập bằng tài khoản Storage Customer (`ROLE_CUSTOMER`).
* **Test Steps & Endpoints:**
  - Gửi `DELETE /api/v1/bom/facilities/1` (Endpoint chỉ dành cho BOM).
  - Gửi `POST /api/v1/manager/roster` (Endpoint chỉ dành cho Facility Manager).
  - Gửi `GET /api/v1/admin/audit-logs` (Endpoint chỉ dành cho System Administrator).
* **Expected Result:**
  - Cả 3 request trên đều bị chặn bởi Spring Security (`@PreAuthorize`).
  - Backend trả về đúng mã lỗi HTTP `403 Forbidden` kèm thông báo: *"Bạn không có quyền thực hiện thao tác này"*.

---

### `TC-SEC-005`: Kiểm thử lỗ hổng IDOR: Khách A cố tình đọc/sửa hợp đồng của Khách B
* **Traceability:** `SC-05` · `UC-F3-01`
* **Test Type:** Security / IDOR · **Priority:** P1 (Critical)
* **Pre-conditions:**
  - Khách A sở hữu hợp đồng `CTR-101`.
  - Khách B sở hữu hợp đồng `CTR-202`.
  - Khách A đăng nhập nhận token của Khách A.
* **Test Steps:**
  1. Khách A gửi request tra cứu hợp đồng của Khách B: `GET /api/v1/customer/contracts/CTR-202`.
  2. Khách A gửi request cập nhật người ủy quyền trên hợp đồng của Khách B: `POST /api/v1/customer/contracts/CTR-202/authorized-persons`.
* **Expected Result:**
  - Service layer kiểm tra quyền sở hữu (`contract.getCustomerId() == currentUserId`).
  - Hệ thống từ chối và trả về mã lỗi HTTP `403 Forbidden` (hoặc `404 Not Found` để che giấu sự tồn tại của ID).
  - Dữ liệu của Khách B không bị lộ hay thay đổi.

---

### `TC-SEC-006`: Kiểm tra phòng chống tấn công SQL Injection và XSS
* **Traceability:** `CONVENTIONS.md`
* **Test Type:** Security / Vulnerability · **Priority:** P1 (Critical)
* **Pre-conditions:** Sử dụng form tìm kiếm cơ sở và form gửi yêu cầu hỗ trợ.
* **Test Steps & Payloads:**
  - Payload SQLi: `' OR '1'='1` hoặc `1; DROP TABLE facility; --` tại ô tìm kiếm cơ sở.
  - Payload XSS: `<script>alert('XSS')</script>` hoặc `<img src=x onerror=alert(1)>` tại mô tả ticket hỗ trợ.
* **Expected Result:**
  - SQLi: Spring Data JPA sử dụng Hibernate Parametrized Queries / PreparedStatement ➔ Chuỗi truy vấn được escape an toàn, không gây lỗi cú pháp SQL hoặc rò rỉ dữ liệu.
  - XSS: React frontend tự động encode HTML entities, văn bản hiển thị nguyên dạng mã ký tự chứ không thực thi script JavaScript.

---

### `TC-SEC-007`: Ghi nhận nhật ký kiểm toán (Audit Activity Log) cho các thao tác nhạy cảm
* **Traceability:** `SA-04` · `UC-SYS-03`
* **Test Type:** Audit / Compliance · **Priority:** P2 (High)
* **Pre-conditions:** BOM thực hiện cập nhật bảng giá hoặc hủy cơ sở; FM duyệt hoàn tiền cọc.
* **Test Steps:**
  1. Thực hiện một thao tác nhạy cảm (Ví dụ: FM duyệt hoàn cọc 1.500.000đ cho hợp đồng `CTR-3001`).
  2. System Administrator đăng nhập vào trang "Nhật ký hoạt động" (`/admin/audit-logs`).
* **Expected Result:**
  - Bảng `activity_log` có một bản ghi mới với: `user_id`, `action = 'APPROVE_DEPOSIT_REFUND'`, `target_id = 'CTR-3001'`, `ip_address`, `timestamp`, và `details` (JSON ghi rõ số tiền hoàn và trạng thái).

---

## 3. Chi tiết các ca kiểm thử REST API (REST API Contract Testing)

### `TC-API-001`: Kiểm thử Response chuẩn hóa đơn lẻ ApiResponse và phân trang PageResponse
* **Traceability:** `API-SPEC.md` · `CONVENTIONS.md`
* **Test Type:** API Contract · **Priority:** P1 (Critical)
* **Test Steps:**
  1. Gọi `GET /api/v1/facilities/1` (kết quả đơn lẻ).
  2. Gọi `GET /api/v1/facilities?page=0&size=10` (kết quả phân trang).
* **Expected Result:**
  - Response đơn lẻ:
    ```json
    {
      "success": true,
      "message": "Lấy thông tin cơ sở thành công",
      "data": { "id": 1, "name": "Cơ sở Quận 9", ... }
    }
    ```
  - Response phân trang:
    ```json
    {
      "success": true,
      "message": "Thành công",
      "data": {
        "content": [ ... ],
        "page": 0,
        "size": 10,
        "totalElements": 25,
        "totalPages": 3
      }
    }
    ```

---

### `TC-API-002`: Tạo mới tài nguyên thành công trả về 201 Created
* **Traceability:** `API-SPEC.md`
* **Test Type:** API Contract · **Priority:** P1 (Critical)
* **Test Steps:**
  1. Gửi `POST /api/v1/reservations` với payload hợp lệ.
* **Expected Result:**
  - HTTP Status Code trả về đúng: `201 Created`.
  - Body chứa thông tin đơn vừa tạo kèm `id` và thời gian đếm ngược thanh toán.

---

### `TC-API-003`: Gửi Request Body thiếu trường bắt buộc trả về 400 Bad Request
* **Traceability:** `API-SPEC.md`
* **Test Type:** Validation / API · **Priority:** P1 (Critical)
* **Test Steps:**
  1. Gửi `POST /api/v1/reservations` với body rỗng `{}` hoặc thiếu `facilityId`.
* **Expected Result:**
  - HTTP Status Code: `400 Bad Request`.
  - Response body chứa danh sách chi tiết các trường bị lỗi:
    ```json
    {
      "success": false,
      "message": "Dữ liệu yêu cầu không hợp lệ",
      "errors": [
        { "field": "facilityId", "message": "Mã cơ sở không được để trống" },
        { "field": "unitId", "message": "Vui lòng chọn ô kho cụ thể" }
      ]
    }
    ```

---

### `TC-API-004`: Truy vấn tài nguyên với định danh ID không tồn tại trả về 404 Not Found
* **Traceability:** `API-SPEC.md`
* **Test Type:** API Contract · **Priority:** P1 (Critical)
* **Test Steps:**
  1. Gửi `GET /api/v1/facilities/999999`.
* **Expected Result:**
  - HTTP Status Code: `404 Not Found`.
  - Message: *"Không tìm thấy cơ sở với mã 999999"*.

---

### `TC-API-005`: Xung đột đặt chỗ trùng ô kho giữa 2 phiên đồng thời trả về 409 Conflict
* **Traceability:** `API-SPEC.md` · `BR-AVL-03`
* **Test Type:** API Contract / Concurrency · **Priority:** P1 (Critical)
* **Test Steps:**
  1. Gửi request đặt giữ ô kho `S-005` khi ô kho này vừa được đặt giữ bởi người khác cách đó 1 giây.
* **Expected Result:**
  - HTTP Status Code: `409 Conflict`.
  - Message: *"Ô kho đã được đặt giữ bởi khách hàng khác. Vui lòng chọn ô kho khác."*

---

## 4. Chi tiết các ca kiểm thử Phi chức năng (Non-Functional Specifications)

### `TC-NFR-001`: Kiểm chứng quy tắc làm tròn tiền tệ lên đến 1.000 VND
* **Traceability:** `BR-GEN-04`
* **Test Type:** Calculation / Financial BVA · **Priority:** P1 (Critical)
* **Pre-conditions:** Áp dụng công thức tính giảm giá, phụ phí hoặc tỷ lệ hoàn tiền lẻ.
* **Test Steps & Data:**
  - Ca 1: Tính phí hoàn tiền: $1.234.100\ \text{đ} \implies$ Kỳ vọng làm tròn thành: $1.235.000\ \text{VND}$.
  - Ca 2: Tính tiền phạt: $155.001\ \text{đ} \implies$ Kỳ vọng làm tròn thành: $156.000\ \text{VND}$.
  - Ca 3: Đúng chẵn nghìn: $1.500.000\ \text{đ} \implies$ Giữ nguyên $1.500.000\ \text{VND}$.
* **Expected Result:**
  - Mọi dòng chi phí (Line Item) trong CSDL và hiển thị trên giao diện đều có 3 chữ số cuối cùng là `000`. Không bao giờ xuất hiện số lẻ dưới 1.000đ.

---

### `TC-NFR-002`: Kiểm thử tính toàn vẹn Soft Delete (Không xóa vật lý)
* **Traceability:** `CONVENTIONS.md` · `DATA-DICTIONARY.md`
* **Test Type:** Data Integrity · **Priority:** P1 (Critical)
* **Test Steps:**
  1. Quản lý thực hiện xóa một ô kho hoặc một cơ sở không còn sử dụng.
  2. Kiểm tra trực tiếp trong bảng CSDL SQL Server bằng câu lệnh SQL `SELECT * FROM storage_unit WHERE id = :id`.
* **Expected Result:**
  - Bản ghi vẫn tồn tại trong CSDL (không bị `DELETE` vật lý).
  - Cột `status` đổi thành `'INACTIVE'` hoặc `'DELETED'`.
  - Các hợp đồng trong quá khứ liên kết với ô kho này vẫn truy vấn được toàn vẹn thông tin lịch sử.

---

### `TC-NFR-003`: Kiểm thử tải đồng thời (Concurrency Stress Test)
* **Traceability:** `BR-AVL-03`
* **Test Type:** Performance / Stress Test · **Priority:** P1 (Critical)
* **Pre-conditions:** Còn đúng 1 ô kho duy nhất `S-099`.
* **Test Steps:**
  1. Dùng công cụ kiểm thử tải (JMeter / k6 / Script đa luồng Java) kích hoạt 50 request đặt chỗ đồng thời nhắm vào ô kho `S-099`.
* **Expected Result:**
  - Đúng **1 request duy nhất** nhận mã phản hồi `201 Created` thành công.
  - **49 request còn lại** đều nhận mã phản hồi `409 Conflict`.
  - Không xảy ra tình trạng Deadlock CSDL, thời gian phản hồi trung bình < 1 giây.

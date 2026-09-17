# API Specification — Self-Storage Facility Rental and Management System

> **Stack:** Spring Boot (Java 17) · SQL Server · JWT · springdoc-openapi  
> **Base URL:** `http://localhost:8080/api/v1` (dev) · `https://<domain>/api/v1` (prod)  
> **Swagger UI:** `/swagger-ui.html`  
> **Tài liệu liên quan:** [CONVENTIONS.md](CONVENTIONS.md) · [BUSINESS-RULES.md](BUSINESS-RULES.md) · [PLAN.md](PLAN.md)

---

## Mục lục

1. [Quy ước chung](#1-quy-ước-chung)
2. [Xác thực và phân quyền](#2-xác-thực-và-phân-quyền)
3. [Module Auth — Đăng nhập & JWT](#3-module-auth--đăng-nhập--jwt)
4. [Module User — Quản lý tài khoản](#4-module-user--quản-lý-tài-khoản)
5. [Module Facility — Quản lý cơ sở](#5-module-facility--quản-lý-cơ-sở)
6. [Module Unit — Loại ô kho & Ô kho](#6-module-unit--loại-ô-kho--ô-kho)
7. [Module Reservation — Đặt chỗ](#7-module-reservation--đặt-chỗ)
8. [Module Contract — Hợp đồng thuê](#8-module-contract--hợp-đồng-thuê)
9. [Module Payment — Thanh toán & Hóa đơn](#9-module-payment--thanh-toán--hóa-đơn)
10. [Module Policy — Chính sách & Giá](#10-module-policy--chính-sách--giá)
11. [Module Support — Yêu cầu hỗ trợ](#11-module-support--yêu-cầu-hỗ-trợ)
12. [Module Report — Báo cáo & Giám sát](#12-module-report--báo-cáo--giám-sát)
13. [Enum reference](#13-enum-reference)
14. [Error code reference](#14-error-code-reference)

---

## 1. Quy ước chung

### 1.1. Cấu trúc URL

| Quy tắc | Ví dụ |
|---------|-------|
| Tiền tố `/api/v1` | `/api/v1/facilities` |
| Tài nguyên là danh từ số nhiều, `kebab-case` | `/api/v1/storage-units` |
| Lồng tối đa hai cấp | `/api/v1/facilities/{facilityId}/storage-units` |
| Hành động không CRUD → tài nguyên con | `POST /api/v1/reservations/{id}/cancellation` |

### 1.2. Mã trạng thái HTTP

| Mã | Ý nghĩa |
|----|---------|
| `200 OK` | Đọc hoặc cập nhật thành công |
| `201 Created` | Tạo mới thành công — kèm header `Location: /api/v1/<resource>/{id}` |
| `204 No Content` | Xóa / vô hiệu hóa thành công, không có body |
| `400 Bad Request` | Sai định dạng hoặc thiếu trường bắt buộc |
| `401 Unauthorized` | Chưa đăng nhập hoặc token hết hạn |
| `403 Forbidden` | Đã đăng nhập nhưng không đủ quyền |
| `404 Not Found` | Tài nguyên không tồn tại |
| `409 Conflict` | Vi phạm quy tắc trạng thái nghiệp vụ |
| `422 Unprocessable Entity` | Dữ liệu hợp lệ về định dạng nhưng sai nghiệp vụ |
| `500 Internal Server Error` | Lỗi không lường trước |

### 1.3. Cấu trúc response

**Thành công — đơn lẻ:**
```json
{
  "id": 1042,
  "code": "RSV-2026-001042",
  "status": "PENDING_PAYMENT"
}
```

**Thành công — danh sách (phân trang):**
```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 137,
  "totalPages": 7
}
```

**Lỗi — mọi trường hợp:**
```json
{
  "timestamp": "2026-09-08T10:15:30+07:00",
  "status": 409,
  "errorCode": "CAPACITY_NOT_AVAILABLE",
  "message": "Loại ô kho vừa hết capacity cho kỳ thuê đã chọn.",
  "path": "/api/v1/reservations",
  "details": [
    { "field": "unitTypeId", "message": "Không còn ô kho trống cho loại đã chọn" }
  ]
}
```

### 1.4. Tham số phân trang & lọc

| Tham số | Mô tả | Mặc định |
|---------|-------|:--------:|
| `page` | Số trang, đếm từ 0 | `0` |
| `size` | Số phần tử mỗi trang (tối đa 100) | `20` |
| `sort` | `<trường>,<asc\|desc>` — có thể lặp | tùy endpoint |
| `keyword` | Tìm kiếm chuỗi (full-text trên trường chính của resource) | — |

### 1.5. Định dạng dữ liệu

| Kiểu | Định dạng |
|------|-----------|
| Tên trường JSON | `camelCase` |
| Ngày | `yyyy-MM-dd` |
| Mốc thời gian | ISO-8601 kèm offset: `2026-10-01T09:00:00+07:00` |
| Tiền | Số nguyên VND: `800000` |
| Enum | `UPPER_SNAKE_CASE` — đúng tên hằng Java |
| Giá trị rỗng | `null` — không dùng chuỗi rỗng hay `0` |

---

## 2. Xác thực và phân quyền

### 2.1. Bearer Token

Mọi endpoint yêu cầu xác thực phải gửi kèm header:

```
Authorization: Bearer <access_token>
```

Access token là JWT được ký bởi server, có thời hạn 30 phút. Khi hết hạn dùng `POST /api/v1/auth/refresh`.

### 2.2. Vai trò

| Giá trị trong JWT | Tên vai trò | Mô tả |
|-------------------|-------------|-------|
| `CUSTOMER` | Storage Customer | Khách thuê kho |
| `FACILITY_STAFF` | Facility Staff | Nhân viên cơ sở |
| `FACILITY_MANAGER` | Facility Manager | Quản lý cơ sở |
| `BUSINESS_MANAGER` | Business Operations Manager | Quản lý vận hành kinh doanh |
| `ADMIN` | System Administrator | Quản trị hệ thống |

### 2.3. Phân quyền dữ liệu theo cơ sở

`FACILITY_STAFF` và `FACILITY_MANAGER` chỉ được xem / thao tác dữ liệu thuộc các Facility được gán trong JWT (`facilityIds[]`). Truy cập dữ liệu của Facility khác trả `403`.

### 2.4. Endpoint công khai (không cần token)

```
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /api/v1/facilities
GET  /api/v1/facilities/{id}
GET  /api/v1/facilities/{facilityId}/unit-types
GET  /api/v1/facilities/{facilityId}/unit-types/{unitTypeId}/availability
```

---

## 3. Module Auth — Đăng nhập & JWT

**Package:** `com.swp391.selfstorage.auth`  
**Yêu cầu:** `SA-01` (một phần), `T2.3`

---

### `POST /api/v1/auth/register`

Đăng ký tài khoản Storage Customer mới.

**Auth:** Công khai  
**Request body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "nva@example.com",
  "phone": "0901234567",
  "password": "P@ssw0rd123"
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|--------|------|:--------:|-----------|
| `fullName` | `string` | ✓ | 2–100 ký tự |
| `email` | `string` | ✓ | Format email hợp lệ, duy nhất |
| `phone` | `string` | ✗ | 10–11 chữ số |
| `password` | `string` | ✓ | Tối thiểu 8 ký tự |

**Response `201`:**
```json
{
  "id": 15,
  "fullName": "Nguyễn Văn A",
  "email": "nva@example.com",
  "role": "CUSTOMER",
  "createdAt": "2026-09-15T08:30:00+07:00"
}
```

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `400` | `VALIDATION_ERROR` | Thiếu trường hoặc sai định dạng |
| `409` | `EMAIL_ALREADY_EXISTS` | Email đã tồn tại trong hệ thống |

---

### `POST /api/v1/auth/login`

Đăng nhập và lấy JWT.

**Auth:** Công khai  
**Request body:**
```json
{
  "email": "nva@example.com",
  "password": "P@ssw0rd123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 1800,
  "user": {
    "id": 15,
    "fullName": "Nguyễn Văn A",
    "email": "nva@example.com",
    "role": "CUSTOMER",
    "facilityIds": []
  }
}
```

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `400` | `VALIDATION_ERROR` | Thiếu email hoặc password |
| `401` | `INVALID_CREDENTIALS` | Sai email hoặc mật khẩu |
| `403` | `ACCOUNT_DISABLED` | Tài khoản bị vô hiệu hóa |

---

### `POST /api/v1/auth/refresh`

Làm mới access token bằng refresh token.

**Auth:** Công khai  
**Request body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Response `200`:** Trả về cùng cấu trúc với `POST /auth/login` nhưng không có `user`.

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `401` | `REFRESH_TOKEN_EXPIRED` | Refresh token hết hạn hoặc không hợp lệ |

---

### `POST /api/v1/auth/logout`

Vô hiệu hóa refresh token hiện tại.

**Auth:** Bất kỳ vai trò đã đăng nhập  
**Request body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Response `204`:** Không có body.

---

### `POST /api/v1/auth/change-password`

Đổi mật khẩu (người dùng tự thực hiện).

**Auth:** Bất kỳ vai trò đã đăng nhập  
**Request body:**
```json
{
  "currentPassword": "P@ssw0rd123",
  "newPassword": "NewP@ss456"
}
```

**Response `204`:** Không có body.

---

## 4. Module User — Quản lý tài khoản

**Package:** `com.swp391.selfstorage.user`  
**Yêu cầu:** `SA-01`, `SA-02`, `SA-04` · **Tasks:** `T2.4`, `T2.5`

---

### `GET /api/v1/users`

Lấy danh sách người dùng có phân trang.

**Auth:** `ADMIN`  
**Query params:** `page`, `size`, `sort`, `keyword` (tìm theo tên/email), `role`, `isActive`

**Response `200`:**
```json
{
  "content": [
    {
      "id": 15,
      "fullName": "Nguyễn Văn A",
      "email": "nva@example.com",
      "phone": "0901234567",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-09-15T08:30:00+07:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 87,
  "totalPages": 5
}
```

---

### `GET /api/v1/users/{id}`

Lấy thông tin chi tiết một người dùng.

**Auth:** `ADMIN` — hoặc chính người dùng đó (bất kỳ vai trò)  
**Path param:** `id` — ID người dùng

**Response `200`:**
```json
{
  "id": 15,
  "fullName": "Nguyễn Văn A",
  "email": "nva@example.com",
  "phone": "0901234567",
  "role": "CUSTOMER",
  "facilityIds": [],
  "isActive": true,
  "createdAt": "2026-09-15T08:30:00+07:00",
  "updatedAt": "2026-09-16T10:00:00+07:00"
}
```

---

### `PUT /api/v1/users/{id}`

Cập nhật thông tin cá nhân.

**Auth:** `ADMIN` hoặc chính người dùng  
**Request body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0901234567"
}
```

**Response `200`:** Trả về `UserResponse` đã cập nhật.

---

### `PATCH /api/v1/users/{id}/role`

Gán vai trò cho người dùng — `SA-02`.

**Auth:** `ADMIN`  
**Request body:**
```json
{
  "role": "FACILITY_STAFF",
  "facilityIds": [1, 2]
}
```

> `facilityIds` bắt buộc khi role là `FACILITY_STAFF` hoặc `FACILITY_MANAGER`.

**Response `200`:** Trả về `UserResponse` đã cập nhật.

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `400` | `VALIDATION_ERROR` | Role yêu cầu facilityIds nhưng không được cung cấp |
| `404` | `FACILITY_NOT_FOUND` | Một trong các facilityIds không tồn tại |

---

### `PATCH /api/v1/users/{id}/status`

Kích hoạt / vô hiệu hóa tài khoản — `SA-01`.

**Auth:** `ADMIN`  
**Request body:**
```json
{
  "isActive": false
}
```

**Response `200`:** Trả về `UserResponse` đã cập nhật.

---

### `GET /api/v1/users/{id}/activity-logs`

Lịch sử đăng nhập và nhật ký hoạt động — `SA-04`.

**Auth:** `ADMIN`  
**Query params:** `page`, `size`, `sort=createdAt,desc`, `from` (yyyy-MM-dd), `to` (yyyy-MM-dd)

**Response `200`:**
```json
{
  "content": [
    {
      "id": 201,
      "userId": 15,
      "action": "LOGIN",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-09-16T08:00:00+07:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3
}
```

---

## 5. Module Facility — Quản lý cơ sở

**Package:** `com.swp391.selfstorage.facility`  
**Yêu cầu:** `BM-01`, `SC-01` · **Tasks:** `T2.7`, `T2.10`

---

### `GET /api/v1/facilities`

Danh sách cơ sở lưu trữ (công khai).

**Auth:** Công khai  
**Query params:** `page`, `size`, `keyword` (tìm theo tên/địa chỉ), `isActive`

**Response `200`:**
```json
{
  "content": [
    {
      "id": 1,
      "name": "Kho Quận 1",
      "address": "123 Lê Lợi, Quận 1, TP.HCM",
      "phone": "028-1234-5678",
      "description": "Kho tự phục vụ trung tâm thành phố",
      "isActive": true,
      "createdAt": "2026-09-08T00:00:00+07:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 3,
  "totalPages": 1
}
```

---

### `GET /api/v1/facilities/{id}`

Chi tiết một cơ sở (công khai).

**Auth:** Công khai  
**Response `200`:**
```json
{
  "id": 1,
  "name": "Kho Quận 1",
  "address": "123 Lê Lợi, Quận 1, TP.HCM",
  "phone": "028-1234-5678",
  "description": "Kho tự phục vụ trung tâm thành phố",
  "openingHours": "06:00–22:00",
  "isActive": true,
  "createdAt": "2026-09-08T00:00:00+07:00",
  "updatedAt": "2026-09-08T00:00:00+07:00"
}
```

---

### `POST /api/v1/facilities`

Tạo cơ sở mới — `BM-01`.

**Auth:** `BUSINESS_MANAGER`  
**Request body:**
```json
{
  "name": "Kho Quận 3",
  "address": "456 Võ Thị Sáu, Quận 3, TP.HCM",
  "phone": "028-8765-4321",
  "description": "Kho mới khu vực trung tâm",
  "openingHours": "06:00–22:00"
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|--------|------|:--------:|-----------|
| `name` | `string` | ✓ | 2–200 ký tự, duy nhất |
| `address` | `string` | ✓ | 10–500 ký tự |
| `phone` | `string` | ✗ | Định dạng số điện thoại |
| `description` | `string` | ✗ | Tối đa 2000 ký tự |
| `openingHours` | `string` | ✗ | Ví dụ: `06:00–22:00` |

**Response `201`:** Trả về `FacilityResponse` đầy đủ.

---

### `PUT /api/v1/facilities/{id}`

Cập nhật thông tin cơ sở.

**Auth:** `BUSINESS_MANAGER`  
**Request body:** Giống `POST /api/v1/facilities` — phải cung cấp đầy đủ các trường.

**Response `200`:** Trả về `FacilityResponse` đã cập nhật.

---

### `PATCH /api/v1/facilities/{id}/status`

Kích hoạt / vô hiệu hóa cơ sở.

**Auth:** `BUSINESS_MANAGER`  
**Request body:**
```json
{
  "isActive": false
}
```

**Response `200`:** Trả về `FacilityResponse`.

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `409` | `FACILITY_HAS_ACTIVE_CONTRACTS` | Không thể vô hiệu hóa khi còn hợp đồng đang `ACTIVE` |

---

## 6. Module Unit — Loại ô kho & Ô kho

**Package:** `com.swp391.selfstorage.unit`  
**Yêu cầu:** `FM-01`, `SC-01` · **Tasks:** `T2.8`, `T2.10`

---

### `GET /api/v1/facilities/{facilityId}/unit-types`

Danh sách loại ô kho tại một cơ sở (công khai).

**Auth:** Công khai  
**Query params:** `page`, `size`, `isActive`

**Response `200`:**
```json
{
  "content": [
    {
      "id": 7,
      "facilityId": 1,
      "name": "Loại S — 3m²",
      "description": "Phù hợp đồ cá nhân, hành lý",
      "widthM": 1.5,
      "depthM": 2.0,
      "heightM": 2.5,
      "areaM2": 3.0,
      "monthlyPrice": 800000,
      "totalUnits": 10,
      "isActive": true
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 4,
  "totalPages": 1
}
```

---

### `GET /api/v1/facilities/{facilityId}/unit-types/{unitTypeId}/availability`

Kiểm tra availability cho một khoảng thuê (công khai) — `SC-01`, `BR-AVL-01`.

**Auth:** Công khai  
**Query params:**

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|:--------:|-------|
| `startDate` | `yyyy-MM-dd` | ✓ | Ngày bắt đầu thuê |
| `rentalMonths` | `integer` | ✓ | Số tháng thuê (≥ 1) |

**Response `200`:**
```json
{
  "facilityId": 1,
  "unitTypeId": 7,
  "startDate": "2026-10-01",
  "endDateExclusive": "2027-01-01",
  "rentalMonths": 3,
  "availableSlots": 3,
  "monthlyPrice": 800000,
  "totalRentalFee": 2400000,
  "depositAmount": 800000
}
```

> Xem công thức tính tiền tại [BUSINESS-RULES.md § 4](BUSINESS-RULES.md#4-pricing-và-payment).

---

### `POST /api/v1/facilities/{facilityId}/unit-types`

Tạo loại ô kho mới — `FM-01`.

**Auth:** `FACILITY_MANAGER` (được gán facilityId), `BUSINESS_MANAGER`  
**Request body:**
```json
{
  "name": "Loại M — 6m²",
  "description": "Phù hợp đồ nội thất nhỏ",
  "widthM": 2.0,
  "depthM": 3.0,
  "heightM": 2.5,
  "monthlyPrice": 1500000
}
```

**Response `201`:** Trả về `UnitTypeResponse` đầy đủ.

---

### `PUT /api/v1/facilities/{facilityId}/unit-types/{unitTypeId}`

Cập nhật loại ô kho.

**Auth:** `FACILITY_MANAGER` (được gán), `BUSINESS_MANAGER`  
**Request body:** Giống POST.

**Response `200`:** Trả về `UnitTypeResponse` đã cập nhật.

---

### `PATCH /api/v1/facilities/{facilityId}/unit-types/{unitTypeId}/price`

Cập nhật đơn giá tháng — `BM-03`.

**Auth:** `BUSINESS_MANAGER`  
**Request body:**
```json
{
  "monthlyPrice": 1700000,
  "effectiveDate": "2026-11-01"
}
```

> Giá mới chỉ áp dụng cho Reservation tạo từ `effectiveDate` trở đi — `BR-GEN-05`.

**Response `200`:** Trả về `UnitTypeResponse`.

---

### `GET /api/v1/facilities/{facilityId}/storage-units`

Danh sách ô kho vật lý tại cơ sở.

**Auth:** `FACILITY_MANAGER` (được gán), `FACILITY_STAFF` (được gán), `BUSINESS_MANAGER`  
**Query params:** `page`, `size`, `unitTypeId`, `status`

**Response `200`:**
```json
{
  "content": [
    {
      "id": 42,
      "facilityId": 1,
      "unitTypeId": 7,
      "code": "S-101",
      "floor": 1,
      "position": "A1",
      "status": "AVAILABLE",
      "isActive": true
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 10,
  "totalPages": 1
}
```

---

### `POST /api/v1/facilities/{facilityId}/storage-units`

Thêm ô kho vật lý mới — `FM-01`.

**Auth:** `FACILITY_MANAGER` (được gán), `BUSINESS_MANAGER`  
**Request body:**
```json
{
  "unitTypeId": 7,
  "code": "S-102",
  "floor": 1,
  "position": "A2"
}
```

**Response `201`:** Trả về `StorageUnitResponse`.

---

### `PATCH /api/v1/facilities/{facilityId}/storage-units/{unitId}/status`

Cập nhật trạng thái ô kho — `FS-03`.

**Auth:** `FACILITY_STAFF` (được gán), `FACILITY_MANAGER` (được gán)  
**Request body:**
```json
{
  "status": "MAINTENANCE",
  "reason": "Sửa khóa cửa"
}
```

> Giá trị `status` hợp lệ: `AVAILABLE`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`, `OUT_OF_SERVICE`.  
> Xem quy tắc chuyển trạng thái: [BUSINESS-RULES.md § 13](BUSINESS-RULES.md#13-vòng-đời-trạng-thái).

**Response `200`:** Trả về `StorageUnitResponse`.

---

## 7. Module Reservation — Đặt chỗ

**Package:** `com.swp391.selfstorage.reservation`  
**Yêu cầu:** `SC-02`, `FM-02` · **Tasks:** `T3.1`, `T3.2`

---

### `POST /api/v1/reservations`

Tạo đặt chỗ mới — `SC-02`, `BR-RES-01`, `BR-RES-02`, `BR-AVL-03`.

**Auth:** `CUSTOMER`  
**Request body:**
```json
{
  "facilityId": 1,
  "unitTypeId": 7,
  "startDate": "2026-10-01",
  "rentalMonths": 3
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|--------|------|:--------:|-----------|
| `facilityId` | `long` | ✓ | Cơ sở đang hoạt động |
| `unitTypeId` | `long` | ✓ | Loại ô kho đang hoạt động tại facilityId |
| `startDate` | `yyyy-MM-dd` | ✓ | Không ở quá khứ |
| `rentalMonths` | `integer` | ✓ | ≥ 1 |

**Response `201`:**
```json
{
  "id": 1042,
  "code": "RSV-2026-001042",
  "customerId": 15,
  "facilityId": 1,
  "unitTypeId": 7,
  "storageUnitId": null,
  "startDate": "2026-10-01",
  "endDateExclusive": "2027-01-01",
  "rentalMonths": 3,
  "monthlyPrice": 800000,
  "depositAmount": 800000,
  "totalRentalFee": 2400000,
  "status": "PENDING_PAYMENT",
  "holdExpiresAt": "2026-09-10T16:30:00+07:00",
  "createdAt": "2026-09-08T16:30:00+07:00"
}
```

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `404` | `FACILITY_NOT_FOUND` | facilityId không tồn tại |
| `404` | `UNIT_TYPE_NOT_FOUND` | unitTypeId không tồn tại tại facility |
| `409` | `CAPACITY_NOT_AVAILABLE` | Không còn capacity — `BR-AVL-03` |
| `409` | `CONTRACT_OVERDUE` | Khách có hợp đồng đang `OVERDUE` — `BR-OVD-09` |
| `422` | `INVALID_START_DATE` | startDate trong quá khứ |

---

### `GET /api/v1/reservations`

Danh sách đặt chỗ.

**Auth:**
- `CUSTOMER` → chỉ thấy Reservation của chính mình
- `FACILITY_MANAGER` → Reservation thuộc Facility được gán
- `BUSINESS_MANAGER`, `ADMIN` → toàn bộ

**Query params:** `page`, `size`, `sort`, `status`, `facilityId`, `customerId`, `startDateFrom`, `startDateTo`

**Response `200`:** Danh sách phân trang `ReservationResponse`.

---

### `GET /api/v1/reservations/{id}`

Chi tiết một đặt chỗ.

**Auth:** `CUSTOMER` (chính mình), `FACILITY_MANAGER` (của Facility), `FACILITY_STAFF` (của Facility), `BUSINESS_MANAGER`, `ADMIN`

**Response `200`:** Trả về `ReservationResponse` đầy đủ.

---

### `POST /api/v1/reservations/{id}/cancellation`

Hủy đặt chỗ — `BR-RES-04`.

**Auth:** `CUSTOMER` (chủ Reservation), `FACILITY_MANAGER` (của Facility)  
**Request body:**
```json
{
  "reason": "Thay đổi kế hoạch"
}
```

**Response `200`:**
```json
{
  "id": 1042,
  "status": "CANCELLED",
  "cancelledAt": "2026-09-09T10:00:00+07:00",
  "cancelReason": "Thay đổi kế hoạch"
}
```

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `409` | `RESERVATION_ALREADY_CANCELLED` | Reservation đã hủy trước đó |
| `409` | `RESERVATION_EXPIRED` | Hết thời gian giữ chỗ |
| `422` | `CANNOT_CANCEL_FULFILLED` | Reservation đã `FULFILLED` — hủy theo quy trình Return |

---

### `PATCH /api/v1/reservations/{id}/assign-unit`

Facility Manager gán Storage Unit sau khi khách thanh toán — `FM-02`, `BR-AVL-04`.

**Auth:** `FACILITY_MANAGER` (của Facility)  
**Request body:**
```json
{
  "storageUnitId": 42
}
```

**Response `200`:**
```json
{
  "id": 1042,
  "storageUnitId": 42,
  "storageUnitCode": "S-101",
  "status": "CONFIRMED"
}
```

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `409` | `UNIT_ASSIGNMENT_FAILED` | Unit không hợp lệ hoặc đã bị chiếm đồng thời — `BR-AVL-04` |
| `409` | `RESERVATION_NOT_PAID` | Reservation chưa thanh toán đủ |

---

## 8. Module Contract — Hợp đồng thuê

**Package:** `com.swp391.selfstorage.contract`  
**Yêu cầu:** `SC-04`, `SC-05`, `FS-01`, `FS-02`, `FS-04`, `FM-03`, `FM-04` · **Tasks:** `T3.4`–`T3.8`, `T4.1`–`T4.3`, `T4.5`

---

### `GET /api/v1/contracts`

Danh sách hợp đồng.

**Auth:**
- `CUSTOMER` → chỉ thấy hợp đồng của mình
- `FACILITY_STAFF`, `FACILITY_MANAGER` → hợp đồng thuộc Facility được gán
- `BUSINESS_MANAGER`, `ADMIN` → toàn bộ

**Query params:** `page`, `size`, `sort`, `status`, `facilityId`, `customerId`, `keyword` (tìm theo code)

**Response `200`:** Danh sách phân trang `ContractSummaryResponse`.

---

### `GET /api/v1/contracts/{id}`

Chi tiết hợp đồng.

**Auth:** `CUSTOMER` (chính mình), `FACILITY_STAFF`, `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN`

**Response `200`:**
```json
{
  "id": 500,
  "code": "CTR-2026-000500",
  "reservationId": 1042,
  "customerId": 15,
  "facilityId": 1,
  "storageUnitId": 42,
  "unitTypeId": 7,
  "startDate": "2026-10-01",
  "endDateExclusive": "2027-01-01",
  "rentalMonths": 3,
  "monthlyPrice": 800000,
  "totalRentalFee": 2400000,
  "depositAmount": 800000,
  "depositBalance": 800000,
  "accessCode": "482019",
  "status": "ACTIVE",
  "checkinDate": "2026-10-01",
  "returnDate": null,
  "policySnapshot": {},
  "createdAt": "2026-09-09T09:00:00+07:00"
}
```

---

### `POST /api/v1/contracts/{id}/check-in`

Nhân viên xác nhận bàn giao kho — `SC-04`, `FS-02`.

**Auth:** `FACILITY_STAFF` (được gán Facility)  
**Request body:**
```json
{
  "checkinDate": "2026-10-01",
  "accessCardCode": "CARD-ABC-001",
  "notes": "Khách đã được hướng dẫn sử dụng"
}
```

**Response `200`:**
```json
{
  "id": 500,
  "status": "ACTIVE",
  "checkinDate": "2026-10-01",
  "accessCode": "482019"
}
```

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `404` | `CONTRACT_NOT_FOUND` | contractId không tồn tại |
| `409` | `CONTRACT_NOT_PENDING_CHECKIN` | Hợp đồng không ở trạng thái `PENDING_CHECK_IN` |

---

### `POST /api/v1/contracts/{id}/return-notices`

Gửi thông báo trả kho — `SC-05`, `BR-RET-01`.

**Auth:** `CUSTOMER` (chính mình), `FACILITY_STAFF`, `FACILITY_MANAGER`  
**Request body:**
```json
{
  "intendedReturnDate": "2027-01-01",
  "notes": "Khách muốn trả kho đúng hạn"
}
```

**Response `201`:**
```json
{
  "id": 300,
  "contractId": 500,
  "intendedReturnDate": "2027-01-01",
  "status": "PENDING_INSPECTION",
  "createdAt": "2026-12-20T09:00:00+07:00"
}
```

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `422` | `RETURN_NOTICE_TOO_SHORT` | Ngày trả cách ngày nộp ít hơn `return.notice_days` — `BR-RET-01` |

---

### `POST /api/v1/contracts/{id}/return-inspections`

Xác nhận kiểm tra hiện trạng khi trả kho — `FS-04`, `FM-04`.

**Auth:** `FACILITY_STAFF` (được gán)  
**Request body:**
```json
{
  "returnDate": "2027-01-01",
  "condition": "GOOD",
  "damageNotes": null,
  "extraCharge": 0
}
```

> `condition`: `GOOD`, `MINOR_DAMAGE`, `MAJOR_DAMAGE`.

**Response `200`:**
```json
{
  "id": 500,
  "status": "PENDING_RETURN",
  "returnDate": "2027-01-01",
  "depositRefundAmount": 800000,
  "overdueFee": 0,
  "extraCharge": 0
}
```

---

### `POST /api/v1/contracts/{id}/renewals`

Gia hạn hợp đồng — `SC-05`, `BR-REN-*`.

**Auth:** `CUSTOMER` (chính mình)  
**Request body:**
```json
{
  "renewalMonths": 3
}
```

| Trường | Ràng buộc |
|--------|-----------|
| `renewalMonths` | ≥ `renewal.min_months`, ≤ `renewal.max_months` |

**Response `201`:**
```json
{
  "id": 600,
  "contractId": 500,
  "renewalMonths": 3,
  "newEndDateExclusive": "2027-04-01",
  "monthlyPrice": 800000,
  "totalRenewalFee": 2400000,
  "status": "PENDING_PAYMENT",
  "createdAt": "2026-12-25T09:00:00+07:00"
}
```

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `409` | `RENEWAL_NOT_ALLOWED` | Hợp đồng không ở trạng thái `ACTIVE` — `BR-REN-*` |
| `409` | `CONTRACT_OVERDUE` | Phải xử lý phí quá hạn trước |
| `409` | `CAPACITY_NOT_AVAILABLE` | Không còn capacity cho kỳ mới — `BR-REN-05` |

---

## 9. Module Payment — Thanh toán & Hóa đơn

**Package:** `com.swp391.selfstorage.payment`  
**Yêu cầu:** `SC-03` · **Tasks:** `T3.3`

---

### `POST /api/v1/payments`

Tạo giao dịch thanh toán.

**Auth:** `CUSTOMER`  
**Request body:**
```json
{
  "referenceType": "RESERVATION",
  "referenceId": 1042,
  "amount": 3200000,
  "method": "BANK_TRANSFER",
  "transactionRef": "VNP20260908001"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|:--------:|-------|
| `referenceType` | `string` | ✓ | `RESERVATION`, `RENEWAL`, `OVERDUE_FEE`, `EXTRA_CHARGE` |
| `referenceId` | `long` | ✓ | ID của đối tượng liên quan |
| `amount` | `long` | ✓ | Số tiền VND |
| `method` | `string` | ✓ | `BANK_TRANSFER`, `CREDIT_CARD`, `CASH` |
| `transactionRef` | `string` | ✗ | Mã giao dịch từ cổng thanh toán |

**Response `201`:**
```json
{
  "id": 9001,
  "referenceType": "RESERVATION",
  "referenceId": 1042,
  "amount": 3200000,
  "method": "BANK_TRANSFER",
  "status": "COMPLETED",
  "transactionRef": "VNP20260908001",
  "paidAt": "2026-09-08T09:00:00+07:00"
}
```

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `409` | `PAYMENT_FAILED` | Thanh toán thất bại ở cổng thanh toán |
| `409` | `RESERVATION_EXPIRED` | Reservation đã hết hạn giữ chỗ |
| `422` | `AMOUNT_MISMATCH` | Số tiền không khớp với tổng phải trả |

---

### `GET /api/v1/payments`

Danh sách giao dịch thanh toán.

**Auth:**
- `CUSTOMER` → chỉ thấy giao dịch của mình
- `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN` → theo phạm vi phân quyền

**Query params:** `page`, `size`, `sort`, `referenceType`, `referenceId`, `status`, `from`, `to`

**Response `200`:** Danh sách phân trang `PaymentResponse`.

---

### `GET /api/v1/payments/{id}`

Chi tiết giao dịch.

**Auth:** `CUSTOMER` (của mình), `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN`

**Response `200`:** Trả về `PaymentResponse` đầy đủ.

---

### `GET /api/v1/contracts/{contractId}/invoices`

Danh sách hóa đơn của hợp đồng.

**Auth:** `CUSTOMER` (của mình), `FACILITY_STAFF`, `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN`

**Response `200`:**
```json
{
  "content": [
    {
      "id": 701,
      "contractId": 500,
      "type": "RENTAL_FEE",
      "amount": 3200000,
      "status": "PAID",
      "issuedAt": "2026-09-08T09:00:00+07:00",
      "paidAt": "2026-09-08T09:05:00+07:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 2,
  "totalPages": 1
}
```

---

## 10. Module Policy — Chính sách & Giá

**Package:** `com.swp391.selfstorage.policy`  
**Yêu cầu:** `BM-02`, `BM-03` · **Tasks:** `T2.9`, `T4.4`

---

### `GET /api/v1/policies`

Danh sách phiên bản chính sách.

**Auth:** `BUSINESS_MANAGER`, `ADMIN`, `FACILITY_MANAGER`  
**Query params:** `page`, `size`, `sort=effectiveDate,desc`, `isActive`

**Response `200`:**
```json
{
  "content": [
    {
      "id": 1,
      "version": "2026-Q4",
      "effectiveDate": "2026-10-01",
      "isActive": true,
      "depositMultiplier": 1.0,
      "reservationHoldHours": 48,
      "rentalDailyDivisor": 30,
      "checkinGraceDays": 3,
      "cancelFullRefundHours": 48,
      "cancelLateRefundRate": 0.5,
      "renewalMinMonths": 1,
      "renewalMaxMonths": 12,
      "overdueGraceDays": 3,
      "overdueDailyRate": 0.05,
      "overdueCapRate": 0.5,
      "returnNoticeDays": 7,
      "createdAt": "2026-09-01T00:00:00+07:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

---

### `POST /api/v1/policies`

Tạo phiên bản chính sách mới — `BM-02`.

**Auth:** `BUSINESS_MANAGER`  
**Request body:** Cùng cấu trúc với policy object trong GET, bao gồm đầy đủ tham số cấu hình.

**Response `201`:** Trả về `PolicyResponse` đầy đủ.

---

### `GET /api/v1/policies/active`

Lấy phiên bản chính sách đang hiệu lực.

**Auth:** Bất kỳ vai trò đã đăng nhập  
**Response `200`:** Trả về `PolicyResponse` của phiên bản đang hoạt động.

---

### `GET /api/v1/surcharges`

Danh sách phụ phí — `BM-03`.

**Auth:** `BUSINESS_MANAGER`, `FACILITY_MANAGER`  
**Query params:** `facilityId`, `unitTypeId`, `isActive`

**Response `200`:** Danh sách phân trang `SurchargeResponse`.

---

### `POST /api/v1/surcharges`

Tạo phụ phí mới.

**Auth:** `BUSINESS_MANAGER`  
**Request body:**
```json
{
  "name": "Phụ phí tầng 3",
  "facilityId": 1,
  "unitTypeId": null,
  "amount": 200000,
  "type": "FIXED",
  "effectiveDate": "2026-10-01"
}
```

> `type`: `FIXED` (số tiền cố định) hoặc `PERCENTAGE` (% trên giá tháng).

**Response `201`:** Trả về `SurchargeResponse`.

---

## 11. Module Support — Yêu cầu hỗ trợ

**Package:** `com.swp391.selfstorage.support`  
**Yêu cầu:** `SC-06`, `FS-05`, `FM-05` · **Tasks:** `T4.7`, `T4.8`

---

### `POST /api/v1/support-requests`

Gửi yêu cầu hỗ trợ — `SC-06`.

**Auth:** `CUSTOMER`  
**Request body:**
```json
{
  "contractId": 500,
  "type": "ACCESS_ISSUE",
  "title": "Mã truy cập không hoạt động",
  "description": "Tôi nhập đúng mã PIN nhưng cửa không mở",
  "isUrgent": true
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|:--------:|-------|
| `contractId` | `long` | ✓ | Hợp đồng liên quan |
| `type` | `string` | ✓ | `ACCESS_ISSUE`, `LOCK_ISSUE`, `DAMAGE`, `BILLING`, `OTHER` |
| `title` | `string` | ✓ | 5–200 ký tự |
| `description` | `string` | ✓ | 10–2000 ký tự |
| `isUrgent` | `boolean` | ✗ | Mặc định `false` — Urgent SLA 2 giờ — `BR-SUP-01` |

**Response `201`:**
```json
{
  "id": 800,
  "code": "SUP-2026-000800",
  "contractId": 500,
  "customerId": 15,
  "type": "ACCESS_ISSUE",
  "title": "Mã truy cập không hoạt động",
  "isUrgent": true,
  "status": "OPEN",
  "assignedStaffId": null,
  "createdAt": "2026-10-15T14:00:00+07:00",
  "slaDeadline": "2026-10-15T16:00:00+07:00"
}
```

---

### `GET /api/v1/support-requests`

Danh sách yêu cầu hỗ trợ.

**Auth:**
- `CUSTOMER` → chỉ của mình
- `FACILITY_STAFF`, `FACILITY_MANAGER` → thuộc Facility được gán
- `BUSINESS_MANAGER`, `ADMIN` → toàn bộ

**Query params:** `page`, `size`, `status`, `type`, `facilityId`, `isUrgent`, `assignedStaffId`

**Response `200`:** Danh sách phân trang `SupportRequestSummaryResponse`.

---

### `GET /api/v1/support-requests/{id}`

Chi tiết yêu cầu hỗ trợ.

**Auth:** `CUSTOMER` (của mình), `FACILITY_STAFF`, `FACILITY_MANAGER`, `BUSINESS_MANAGER`, `ADMIN`

**Response `200`:** Trả về `SupportRequestResponse` đầy đủ kèm lịch sử hoạt động.

---

### `PATCH /api/v1/support-requests/{id}/assign`

Phân công nhân viên xử lý — `FM-05`.

**Auth:** `FACILITY_MANAGER` (được gán)  
**Request body:**
```json
{
  "staffId": 8
}
```

**Response `200`:**
```json
{
  "id": 800,
  "assignedStaffId": 8,
  "status": "IN_PROGRESS"
}
```

---

### `PATCH /api/v1/support-requests/{id}/resolve`

Nhân viên cập nhật kết quả xử lý — `FS-05`.

**Auth:** `FACILITY_STAFF` (được phân công)  
**Request body:**
```json
{
  "resolution": "Đã reset mã PIN và bàn giao mã mới cho khách",
  "resolvedAt": "2026-10-15T15:30:00+07:00"
}
```

**Response `200`:**
```json
{
  "id": 800,
  "status": "RESOLVED",
  "resolution": "Đã reset mã PIN và bàn giao mã mới cho khách",
  "resolvedAt": "2026-10-15T15:30:00+07:00"
}
```

---

### `PATCH /api/v1/support-requests/{id}/close`

Đóng yêu cầu hỗ trợ.

**Auth:** `CUSTOMER` (của mình), `FACILITY_MANAGER`, `ADMIN`  
**Request body:**
```json
{
  "customerFeedback": "Đã xử lý tốt, cảm ơn"
}
```

**Response `200`:**
```json
{
  "id": 800,
  "status": "CLOSED",
  "closedAt": "2026-10-16T09:00:00+07:00"
}
```

---

### `DELETE /api/v1/support-requests/{id}`

Hủy yêu cầu hỗ trợ chưa được tiếp nhận.

**Auth:** `CUSTOMER` (của mình)  
**Response `204`:** Không có body.

**Lỗi:**

| Status | errorCode | Điều kiện |
|--------|-----------|-----------|
| `409` | `SUPPORT_ALREADY_IN_PROGRESS` | Yêu cầu đang được xử lý, không thể hủy |

---

## 12. Module Report — Báo cáo & Giám sát

**Package:** `com.swp391.selfstorage.report`  
**Yêu cầu:** `FM-06`, `BM-04`, `BM-05`, `FS-06` · **Tasks:** `T5.1`, `T5.2`, `T5.3`

---

### `GET /api/v1/reports/facility/{facilityId}/overview`

Tổng quan cơ sở — `FM-06`.

**Auth:** `FACILITY_MANAGER` (được gán), `BUSINESS_MANAGER`, `ADMIN`  
**Query params:** `month` (yyyy-MM)

**Response `200`:**
```json
{
  "facilityId": 1,
  "month": "2026-10",
  "totalUnits": 30,
  "availableUnits": 5,
  "occupiedUnits": 22,
  "maintenanceUnits": 3,
  "occupancyRate": 0.733,
  "activeContracts": 22,
  "overdueContracts": 2,
  "newContracts": 5,
  "returnedContracts": 3,
  "totalRevenue": 25600000,
  "rentalRevenue": 24000000,
  "surchargeRevenue": 1600000,
  "depositBalance": 17600000
}
```

---

### `GET /api/v1/reports/facility/{facilityId}/contracts`

Danh sách hợp đồng theo trạng thái — `FM-06`.

**Auth:** `FACILITY_MANAGER` (được gán), `BUSINESS_MANAGER`, `ADMIN`  
**Query params:** `page`, `size`, `status`, `expiringSoonDays`

**Response `200`:** Danh sách phân trang `ContractSummaryResponse`.

---

### `GET /api/v1/reports/system/revenue`

Báo cáo doanh thu toàn hệ thống — `BM-04`.

**Auth:** `BUSINESS_MANAGER`, `ADMIN`  
**Query params:** `from` (yyyy-MM-dd), `to` (yyyy-MM-dd), `facilityId`

**Response `200`:**
```json
{
  "from": "2026-10-01",
  "to": "2026-10-31",
  "totalRevenue": 120000000,
  "rentalRevenue": 110000000,
  "surchargeRevenue": 8000000,
  "overdueFeeRevenue": 2000000,
  "byFacility": [
    {
      "facilityId": 1,
      "facilityName": "Kho Quận 1",
      "revenue": 60000000
    }
  ]
}
```

---

### `GET /api/v1/reports/system/occupancy`

Báo cáo tỷ lệ lấp đầy theo thời gian — `BM-04`.

**Auth:** `BUSINESS_MANAGER`, `ADMIN`  
**Query params:** `from` (yyyy-MM), `to` (yyyy-MM), `facilityId`

**Response `200`:**
```json
{
  "data": [
    {
      "month": "2026-10",
      "facilityId": 1,
      "occupancyRate": 0.733,
      "availableUnits": 5,
      "occupiedUnits": 22,
      "totalUnits": 30
    }
  ]
}
```

---

### `GET /api/v1/reports/system/overdue`

Báo cáo danh sách hợp đồng quá hạn — `BM-05`.

**Auth:** `BUSINESS_MANAGER`, `ADMIN`  
**Query params:** `page`, `size`, `facilityId`, `minOverdueDays`

**Response `200`:** Danh sách phân trang `ContractSummaryResponse` kèm `overdueDays` và `accruedOverdueFee`.

---

### `GET /api/v1/reports/system/export`

Xuất báo cáo file — `BM-05`.

**Auth:** `BUSINESS_MANAGER`, `ADMIN`  
**Query params:** `type` (`REVENUE` | `OCCUPANCY` | `OVERDUE`), `from`, `to`, `facilityId`, `format` (`CSV` | `XLSX`)

**Response `200`:** File download với header `Content-Disposition: attachment; filename=report_<type>_<from>_<to>.<format>`.

---

### `GET /api/v1/reports/staff/{staffId}/daily-tasks`

Danh sách công việc hằng ngày của nhân viên — `FS-06`.

**Auth:** `FACILITY_STAFF` (chính mình), `FACILITY_MANAGER` (của Facility)  
**Query params:** `date` (yyyy-MM-dd, mặc định hôm nay)

**Response `200`:**
```json
{
  "date": "2026-10-01",
  "staffId": 8,
  "pendingCheckIns": [
    {
      "reservationId": 1042,
      "customerName": "Nguyễn Văn A",
      "unitCode": "S-101",
      "startDate": "2026-10-01"
    }
  ],
  "pendingReturns": [],
  "openSupportRequests": []
}
```

---

## 13. Enum reference

### `ReservationStatus`

| Giá trị | Mô tả |
|---------|-------|
| `PENDING_PAYMENT` | Đang chờ thanh toán — đang giữ capacity |
| `CONFIRMED` | Đã thanh toán, đã gán Storage Unit |
| `FULFILLED` | Check-in thành công — sinh Contract `ACTIVE` |
| `CANCELLED` | Đã hủy — capacity được giải phóng |
| `EXPIRED` | Hết `holdExpiresAt` mà chưa thanh toán |

### `ContractStatus`

| Giá trị | Mô tả |
|---------|-------|
| `PENDING_CHECK_IN` | Đã sinh sau thanh toán, chờ khách đến nhận |
| `ACTIVE` | Đang thuê bình thường |
| `OVERDUE` | Quá ngày hết hạn, chưa gia hạn / chưa trả |
| `PENDING_RETURN` | Đã nộp thông báo trả, chờ kiểm tra |
| `RETURNED` | Đã trả kho hoàn tất |
| `TERMINATED` | Hợp đồng chấm dứt cưỡng chế (D+60) |

### `StorageUnitStatus`

| Giá trị | Mô tả |
|---------|-------|
| `AVAILABLE` | Trống, sẵn sàng cho thuê |
| `RESERVED` | Được giữ cho Reservation đã xác nhận |
| `OCCUPIED` | Đang có khách sử dụng |
| `MAINTENANCE` | Đang bảo trì — không cho thuê |
| `OUT_OF_SERVICE` | Ngừng hoạt động |

### `SupportRequestStatus`

| Giá trị | Mô tả |
|---------|-------|
| `OPEN` | Mới gửi, chưa phân công |
| `IN_PROGRESS` | Đang xử lý |
| `RESOLVED` | Đã xử lý, chờ khách xác nhận |
| `CLOSED` | Đã đóng |
| `CANCELLED` | Khách hủy |

### `PaymentStatus`

| Giá trị | Mô tả |
|---------|-------|
| `PENDING` | Đang xử lý |
| `COMPLETED` | Thành công |
| `FAILED` | Thất bại |
| `REFUNDED` | Đã hoàn tiền |

---

## 14. Error code reference

Toàn bộ `errorCode` do `GlobalExceptionHandler` sinh, **ổn định** để Frontend so khớp.

| errorCode | HTTP | Mô tả |
|-----------|:----:|-------|
| `VALIDATION_ERROR` | 400 | Lỗi validation Bean / `@Valid` |
| `INVALID_CREDENTIALS` | 401 | Sai email hoặc mật khẩu |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh token hết hạn |
| `ACCOUNT_DISABLED` | 403 | Tài khoản bị vô hiệu hóa |
| `ACCESS_DENIED` | 403 | Không đủ quyền theo vai trò |
| `FACILITY_ACCESS_DENIED` | 403 | Cơ sở không thuộc phạm vi được gán |
| `USER_NOT_FOUND` | 404 | Người dùng không tồn tại |
| `FACILITY_NOT_FOUND` | 404 | Cơ sở không tồn tại |
| `UNIT_TYPE_NOT_FOUND` | 404 | Loại ô kho không tồn tại |
| `STORAGE_UNIT_NOT_FOUND` | 404 | Ô kho không tồn tại |
| `RESERVATION_NOT_FOUND` | 404 | Đặt chỗ không tồn tại |
| `CONTRACT_NOT_FOUND` | 404 | Hợp đồng không tồn tại |
| `PAYMENT_NOT_FOUND` | 404 | Giao dịch không tồn tại |
| `SUPPORT_REQUEST_NOT_FOUND` | 404 | Yêu cầu hỗ trợ không tồn tại |
| `EMAIL_ALREADY_EXISTS` | 409 | Email đã tồn tại |
| `CAPACITY_NOT_AVAILABLE` | 409 | Hết capacity cho kỳ thuê — `BR-AVL-03` |
| `UNIT_ASSIGNMENT_FAILED` | 409 | Gán Storage Unit thất bại đồng thời — `BR-AVL-04` |
| `RESERVATION_EXPIRED` | 409 | Hết thời gian giữ chỗ |
| `RESERVATION_ALREADY_CANCELLED` | 409 | Reservation đã hủy |
| `RESERVATION_NOT_PAID` | 409 | Reservation chưa thanh toán, không thể gán unit |
| `PAYMENT_FAILED` | 409 | Cổng thanh toán từ chối |
| `AMOUNT_MISMATCH` | 422 | Số tiền không khớp tổng phải trả |
| `CONTRACT_OVERDUE` | 409 | Hợp đồng đang quá hạn |
| `CONTRACT_TERMINATED` | 409 | Hợp đồng đã chấm dứt |
| `CONTRACT_NOT_PENDING_CHECKIN` | 409 | Hợp đồng không ở trạng thái chờ check-in |
| `RENEWAL_NOT_ALLOWED` | 409 | Không đủ điều kiện gia hạn — `BR-REN-*` |
| `RETURN_NOTICE_TOO_SHORT` | 422 | Báo trả quá gần ngày trả — `BR-RET-01` |
| `INSUFFICIENT_DEPOSIT_BALANCE` | 409 | Số dư cọc không đủ để khấu trừ |
| `CANNOT_CANCEL_FULFILLED` | 422 | Reservation đã hoàn tất — phải đi qua Return |
| `INVALID_START_DATE` | 422 | Ngày bắt đầu trong quá khứ |
| `FACILITY_HAS_ACTIVE_CONTRACTS` | 409 | Không thể vô hiệu hóa cơ sở còn hợp đồng |
| `SUPPORT_ALREADY_IN_PROGRESS` | 409 | Không thể hủy khi đang xử lý |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi không lường trước |

---

> **Hướng dẫn mở rộng cho thành viên:**  
> Khi implement endpoint mới, thêm vào đúng section của module liên quan theo mẫu:
> `Method + URL` → Mô tả ngắn → **Auth** (vai trò) → **Request body** + bảng trường → **Response** schema mẫu → **Lỗi** bảng.  
> Mọi thay đổi API contract sau khi đã công bố **phải** thông báo nhóm và cập nhật file này **cùng Pull Request** với code — theo quy ước `T2.18` và [CONVENTIONS.md § 6.8](CONVENTIONS.md#68-quy-trình-chốt-api-contract).

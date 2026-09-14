# Coding Convention và Quy ước API

> **Self-Storage Facility Rental and Management System** — quy ước viết code cho Backend, Frontend,
> cơ sở dữ liệu và giao kèo API giữa hai phía.
>
> Nhiệm vụ **T1.18** · Giai đoạn 1 · [PLAN.md](PLAN.md).
> Quy trình Git và Pull Request: [CONTRIBUTING.md](../CONTRIBUTING.md)
>
> **Stack:** Spring Boot (Java 17) · React + TypeScript · SQL Server · Flyway · JWT

---

## Mục lục

1. [Nguyên tắc chung](#1-nguyên-tắc-chung)
2. [Cấu trúc repository](#2-cấu-trúc-repository)
3. [Backend — Spring Boot và Java](#3-backend--spring-boot-và-java)
4. [Frontend — React và TypeScript](#4-frontend--react-và-typescript)
5. [Cơ sở dữ liệu — SQL Server và Flyway](#5-cơ-sở-dữ-liệu--sql-server-và-flyway)
6. [Quy ước REST API](#6-quy-ước-rest-api)
7. [Bảo mật và cấu hình](#7-bảo-mật-và-cấu-hình)
8. [Checklist review code](#8-checklist-review-code)

---

## 1. Nguyên tắc chung

| Nguyên tắc | Nội dung |
|------------|----------|
| **Ngôn ngữ trong code** | Toàn bộ định danh (class, biến, hàm, bảng, endpoint) viết **tiếng Anh**. Thuật ngữ nghiệp vụ dùng đúng từ ở [TOPIC.md § 7](TOPIC.md#7-thuật-ngữ-glossary): `Facility`, `StorageUnit`, `UnitType`, `Reservation`, `Deposit`, `Renewal`, `Overdue`, `Return` |
| **Ngôn ngữ trong tài liệu** | Tài liệu và mô tả Pull Request viết **tiếng Việt**, giữ nguyên thuật ngữ tiếng Anh |
| **Ngôn ngữ trong sơ đồ** | Sơ đồ PlantUML trong `docs/diagrams/` — tiêu đề, nhãn, ghi chú và comment — viết **tiếng Anh**. Thuật ngữ nghiệp vụ dùng đúng từ ở [TOPIC.md § 7](TOPIC.md#7-thuật-ngữ-glossary); mã `UC-*`, `BR-*`, `US-*` giữ nguyên |
| **Comment** | Chỉ viết comment giải thích **tại sao**, không diễn giải lại code đang làm gì. Comment tiếng Việt được chấp nhận |
| **Encoding và xuống dòng** | UTF-8 không BOM, xuống dòng `LF`. Cấu hình sẵn trong `.gitattributes` và `.editorconfig` |
| **Độ dài dòng** | Tối đa **120 ký tự** cho cả Java và TypeScript |
| **Thụt lề** | 4 space cho Java, 2 space cho TypeScript / JSON / YAML. Không dùng tab |
| **Không commit code chết** | Không để lại code bị comment, `System.out.println`, `console.log` gỡ lỗi hay `TODO` không có mã task đi kèm |

---

## 2. Cấu trúc repository

```
.
├── backend/                  # Spring Boot
│   └── src/main/java/com/swp391/selfstorage/...
├── frontend/                 # React + TypeScript
│   └── src/...
├── docs/                     # Tài liệu phân tích và thiết kế
├── CONTRIBUTING.md           # Quy trình Git và Pull Request
└── README.md
```

Hai thư mục `backend/` và `frontend/` được khởi tạo ở task **T1.16** và **T1.17**.

---

## 3. Backend — Spring Boot và Java

### 3.1. Cấu trúc package

Package gốc: **`com.swp391.selfstorage`**. Chia theo **module nghiệp vụ** trước, chia theo tầng kỹ
thuật sau — như vậy code của một nghiệp vụ nằm cùng một chỗ, dễ tìm và dễ chia việc giữa hai người
làm Backend.

```
com.swp391.selfstorage
├── SelfStorageApplication.java
├── common/                       # Dùng chung, không phụ thuộc module nào
│   ├── exception/                # BusinessException, ErrorCode, GlobalExceptionHandler
│   ├── dto/                      # ApiError, PageResponse
│   ├── config/                   # SecurityConfig, JacksonConfig, OpenApiConfig
│   └── util/
├── auth/                         # Đăng nhập, JWT, phân quyền
├── user/                         # SA-01, SA-02, SA-03, SA-04
├── facility/                     # BM-01, FM-01
├── unit/                         # UnitType, StorageUnit
├── reservation/                  # Flow 1
├── contract/                     # Flow 2, Flow 3, Flow 6
├── payment/                      # SC-03, phí, hoá đơn
├── policy/                       # BM-02, BM-03 — chính sách và khung giá
├── support/                      # Flow 7
└── report/                       # FM-06, BM-04, BM-05
```

Mỗi module có cấu trúc giống nhau:

```
reservation/
├── ReservationController.java
├── service/    ReservationService.java, ReservationServiceImpl.java
├── repository/ ReservationRepository.java
├── entity/     Reservation.java, ReservationStatus.java
├── dto/        CreateReservationRequest.java, ReservationResponse.java
└── mapper/     ReservationMapper.java
```

**Quy tắc phụ thuộc:** module được phép gọi `common`; module nghiệp vụ gọi nhau **qua tầng service**,
không bao giờ gọi thẳng `Repository` hay `Entity` của module khác. Cấm phụ thuộc vòng — nếu hai module
cần nhau hai chiều thì tách phần chung ra `common` hoặc bàn lại ranh giới module.

### 3.2. Quy ước đặt tên

| Thành phần | Quy tắc | Ví dụ |
|------------|---------|-------|
| Package | chữ thường, một từ, không gạch dưới | `reservation`, `payment` |
| Class | `PascalCase`, danh từ | `StorageUnit`, `ReservationService` |
| Interface service | tên nghiệp vụ, **không** có tiền tố `I` | `ReservationService` |
| Lớp cài đặt | hậu tố `Impl` | `ReservationServiceImpl` |
| Controller | hậu tố `Controller` | `ReservationController` |
| Repository | hậu tố `Repository` | `StorageUnitRepository` |
| Entity | danh từ số ít | `RentalContract` |
| Enum | `PascalCase`, giá trị `UPPER_SNAKE_CASE` | `ContractStatus.PENDING_RETURN` |
| DTO vào | hậu tố `Request` | `CreateReservationRequest` |
| DTO ra | hậu tố `Response` | `ReservationResponse` |
| Phương thức | `camelCase`, động từ | `calculateOverdueFee()` |
| Hằng số | `UPPER_SNAKE_CASE` | `MAX_RENEWAL_MONTHS` |
| Test | hậu tố `Test` | `ReservationServiceTest` |

**Đặt tên phương thức theo tầng:**

- Controller: `createReservation`, `getReservationById`, `cancelReservation`
- Service: động từ nghiệp vụ — `reserveUnit`, `confirmPayment`, `applyOverdueFee`
- Repository: theo cú pháp Spring Data — `findByCustomerIdAndStatus`, `existsByUnitIdAndStatusIn`

### 3.3. Trách nhiệm từng tầng

| Tầng | Được làm | Không được làm |
|------|----------|----------------|
| **Controller** | Nhận request, validate cú pháp bằng `@Valid`, gọi service, trả DTO | Chứa logic nghiệp vụ, gọi `Repository`, trả `Entity` ra ngoài |
| **Service** | Toàn bộ logic nghiệp vụ và business rule, quản lý `@Transactional` | Biết tới `HttpServletRequest`, `ResponseEntity` hay bất kỳ thứ gì thuộc tầng web |
| **Repository** | Truy vấn dữ liệu | Chứa logic nghiệp vụ |
| **Entity** | Ánh xạ bảng, ràng buộc dữ liệu | Bị trả thẳng qua API |

**Bắt buộc:** `Entity` **không bao giờ** xuất hiện trong chữ ký của Controller. Chuyển đổi qua
`Mapper` (MapStruct hoặc method tĩnh viết tay, chọn một và dùng thống nhất).

### 3.4. Business rule trong code

Mọi tham số ở [BUSINESS-RULES.md § 2](BUSINESS-RULES.md#2-bảng-tham-số-cấu-hình) **phải đọc từ bảng
chính sách trong CSDL**, không hard-code trong Java. Trong code, mỗi hàm hiện thực một quy tắc phải
ghi mã quy tắc ở Javadoc:

```java
/**
 * Tính phí quá hạn theo BR-OVD-03 và BR-OVD-04.
 * Ân hạn overdue.grace_days ngày đầu không tính phí; tổng phí không vượt overdue.cap_rate.
 */
public Money calculateOverdueFee(RentalContract contract, LocalDate asOfDate) { ... }
```

Nhờ vậy khi chính sách đổi, tìm theo mã `BR-*` là ra hết chỗ cần sửa.

### 3.5. Xử lý lỗi

- Lỗi nghiệp vụ ném `BusinessException` kèm một giá trị `ErrorCode` (enum). **Không** ném
  `RuntimeException` trần.
- `GlobalExceptionHandler` (`@RestControllerAdvice`) là **nơi duy nhất** dịch exception thành HTTP
  response theo định dạng ở § 6.4.
- Không nuốt exception: cấm `catch (Exception e) {}` rỗng. Bắt được thì phải xử lý hoặc ném tiếp kèm
  ngữ cảnh.
- Không dùng exception cho luồng bình thường (ví dụ: "không tìm thấy" khi tra cứu danh sách).

### 3.6. Validation

- Ràng buộc cú pháp đặt trên DTO bằng Bean Validation: `@NotNull`, `@Min`, `@Future`, `@Email`.
- Ràng buộc **nghiệp vụ** (capacity theo khoảng thuê, hợp đồng đang `Overdue`) đặt ở tầng service, không đặt
  bằng annotation.
- Mọi endpoint nhận body đều phải có `@Valid`.

### 3.7. Test

- Bắt buộc **unit test cho tầng service** — đúng theo Definition of Done ở [PLAN.md § 6](PLAN.md#6-quy-ước-làm-việc).
- Đặt tên test theo mẫu `should<KếtQuả>_when<ĐiềuKiện>`:
  `shouldRejectReservation_whenCustomerHasOverdueContract`.
- Mock repository bằng Mockito; test tích hợp dùng `@SpringBootTest` với Testcontainers hoặc CSDL test riêng.
- Mỗi business rule ở `BUSINESS-RULES.md` phải có ít nhất một test tương ứng, tên test ghi mã `BR-*`
  trong `@DisplayName`.

### 3.8. Công cụ

| Công cụ | Vai trò |
|---------|---------|
| **Lombok** | `@Getter`, `@Builder`, `@RequiredArgsConstructor`. **Không** dùng `@Data` trên Entity (sinh `equals`/`hashCode` sai với JPA) |
| **Spotless + google-java-format (AOSP)** | Format tự động, chạy `mvn spotless:apply` trước khi commit |
| **springdoc-openapi** | Sinh tài liệu API tại `/swagger-ui.html` — đây là bản API contract mà Frontend mock theo |

**Tiêm phụ thuộc bằng constructor** (`@RequiredArgsConstructor` + field `private final`). Cấm
`@Autowired` trên field.

---

## 4. Frontend — React và TypeScript

### 4.1. Cấu trúc thư mục

```
frontend/src/
├── api/            # Lớp gọi HTTP, mỗi module một file: reservationApi.ts
├── components/     # Component dùng chung: Button, Modal, DataTable
├── features/       # Chia theo module nghiệp vụ, đối xứng với backend
│   ├── reservation/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types.ts
│   └── contract/
├── layouts/        # Khung giao diện theo vai trò: CustomerLayout, StaffLayout
├── hooks/          # Hook dùng chung
├── routes/         # Khai báo route và route guard theo vai trò
├── types/          # Kiểu dùng chung, khớp DTO backend
└── utils/          # Định dạng tiền, ngày, tiện ích
```

### 4.2. Quy ước đặt tên

| Thành phần | Quy tắc | Ví dụ |
|------------|---------|-------|
| File component | `PascalCase.tsx` | `ReservationForm.tsx` |
| File khác | `camelCase.ts` | `reservationApi.ts`, `formatCurrency.ts` |
| Thư mục | `kebab-case` | `unit-type/` |
| Component | `PascalCase` | `ReservationForm` |
| Hook | tiền tố `use` | `useReservation`, `useOverdueSummary` |
| Biến, hàm | `camelCase` | `handleSubmit`, `isLoading` |
| Hằng số | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE` |
| Type / Interface | `PascalCase`, **không** có tiền tố `I` | `ReservationResponse` |
| Props | tên component + `Props` | `ReservationFormProps` |

### 4.3. Component

- Chỉ dùng **function component** và hook. Không viết class component.
- Một file một component được export. Component phụ chỉ dùng nội bộ thì để cùng file.
- Component quá **250 dòng** là dấu hiệu phải tách — tách phần logic ra custom hook trước.
- Props luôn khai báo kiểu tường minh, **không** dùng `any`. Cần kiểu chưa rõ thì dùng `unknown` rồi
  thu hẹp.
- Không gọi `fetch`/`axios` trực tiếp trong component. Mọi lời gọi đi qua `api/` và được bọc trong
  custom hook.

### 4.4. Gọi API và state

- Một client HTTP dùng chung (`api/client.ts`) lo việc gắn JWT, base URL và chuẩn hóa lỗi.
- Kiểu TypeScript của response **phải khớp** DTO backend công bố trên Swagger. Lệch kiểu thì sửa
  cùng lúc ở cả hai phía trong cùng một Pull Request.
- State cục bộ dùng `useState`; state chia sẻ theo vai trò dùng Context; dữ liệu từ server nên quản
  lý bằng React Query nếu nhóm thống nhất dùng.
- Mọi màn hình gọi API phải xử lý đủ **ba trạng thái**: đang tải, lỗi, rỗng. Không để màn hình trắng.

### 4.5. Công cụ

ESLint (`eslint-config-airbnb-typescript`) + Prettier, cấu hình chung trong repo. `npm run lint` phải
sạch trước khi mở Pull Request. TypeScript bật `strict: true`.

---

## 5. Cơ sở dữ liệu — SQL Server và Flyway

### 5.1. Đặt tên

| Đối tượng | Quy tắc | Ví dụ |
|-----------|---------|-------|
| Bảng | `snake_case`, **danh từ số ít** | `storage_unit`, `rental_contract` |
| Cột | `snake_case` | `start_date`, `monthly_price` |
| Khóa chính | luôn là `id`, kiểu `BIGINT IDENTITY` | `id` |
| Khóa ngoại | `<bảng tham chiếu>_id` | `facility_id`, `unit_type_id` |
| Cột boolean | tiền tố `is_` hoặc `has_` | `is_active` |
| Cột thời gian | hậu tố `_at` cho mốc, `_date` cho ngày | `created_at`, `end_date` |
| Chỉ mục | `ix_<bảng>_<cột>` | `ix_reservation_customer_id` |
| Ràng buộc | `fk_`, `uq_`, `ck_` + `<bảng>_<cột>` | `fk_reservation_facility_id` |

Bảng nào cũng có `created_at`, `updated_at`. Ánh xạ `snake_case` ↔ `camelCase` để Hibernate lo bằng
`CamelCaseToUnderscoresNamingStrategy`; **không** rải `@Column(name = ...)` khắp nơi.

### 5.2. Flyway

- File đặt tại `backend/src/main/resources/db/migration/`.
- Tên file: **`V<số>__<mô_tả_snake_case>.sql`** — `V1__create_core_tables.sql`,
  `V7__add_overdue_fee_to_contract.sql`. Script chạy lại được dùng tiền tố `R__`.
- Số phiên bản tăng dần, **không trùng**. Trước khi đặt số, `git pull` để xem số lớn nhất hiện có.
- **Migration đã merge vào `main` là bất biến.** Sai thì viết migration mới để sửa, tuyệt đối không
  sửa file cũ — người khác đã chạy nó rồi.
- Mỗi migration làm một việc, có tiêu đề bằng comment ở đầu file.
- Dữ liệu mẫu (task T2.2) tách riêng, không trộn vào migration cấu trúc.

### 5.3. Kiểu dữ liệu

| Loại | Kiểu SQL Server | Kiểu Java |
|------|-----------------|-----------|
| Tiền | `BIGINT` (đơn vị đồng, không phần thập phân) | `long` |
| Ngày | `DATE` | `LocalDate` |
| Mốc thời gian | `DATETIMEOFFSET` | `OffsetDateTime` |
| Chuỗi ngắn | `NVARCHAR(n)` | `String` |
| Chuỗi dài | `NVARCHAR(MAX)` | `String` |
| Enum | `VARCHAR(30)` lưu tên hằng | `@Enumerated(EnumType.STRING)` |

Luôn dùng `NVARCHAR` cho dữ liệu có tiếng Việt. Enum lưu **tên chuỗi**, không lưu số thứ tự — thêm
giá trị mới sẽ không làm hỏng dữ liệu cũ.

---

## 6. Quy ước REST API

### 6.1. Đường dẫn

- Tiền tố: **`/api/v1`**. Đổi phá vỡ tương thích thì tăng lên `/api/v2`.
- Tài nguyên là **danh từ số nhiều, `kebab-case`**: `/api/v1/storage-units`.
- Lồng nhau tối đa **hai cấp**: `/api/v1/facilities/{facilityId}/storage-units`.
- Hành động không CRUD được biểu diễn bằng tài nguyên con:
  `POST /api/v1/contracts/{id}/renewals`, `POST /api/v1/reservations/{id}/cancellation`.

| Method | Dùng khi | Ví dụ |
|--------|----------|-------|
| `GET` | Đọc, không đổi dữ liệu | `GET /api/v1/facilities` |
| `POST` | Tạo mới hoặc kích hoạt hành động | `POST /api/v1/reservations` |
| `PUT` | Thay thế toàn bộ tài nguyên | `PUT /api/v1/storage-units/{id}` |
| `PATCH` | Sửa một phần | `PATCH /api/v1/storage-units/{id}/status` |
| `DELETE` | Xóa hoặc vô hiệu hóa | `DELETE /api/v1/support-requests/{id}` |

### 6.2. Mã trạng thái HTTP

| Mã | Dùng khi |
|----|----------|
| `200 OK` | Đọc hoặc cập nhật thành công |
| `201 Created` | Tạo mới thành công, kèm header `Location` |
| `204 No Content` | Xóa thành công, không có body |
| `400 Bad Request` | Sai định dạng hoặc thiếu trường bắt buộc |
| `401 Unauthorized` | Chưa đăng nhập hoặc token hết hạn |
| `403 Forbidden` | Đã đăng nhập nhưng không đủ quyền theo vai trò hoặc không thuộc cơ sở được gán |
| `404 Not Found` | Tài nguyên không tồn tại |
| `409 Conflict` | Vi phạm quy tắc nghiệp vụ về trạng thái — capacity cuối vừa được giữ, hợp đồng đang `Overdue` |
| `422 Unprocessable Entity` | Dữ liệu đúng định dạng nhưng sai nghiệp vụ — thời hạn thuê nhỏ hơn 1 tháng |
| `500 Internal Server Error` | Lỗi không lường trước. **Không bao giờ** lộ stack trace ra client |

### 6.3. Response thành công

Trả thẳng đối tượng tài nguyên, không bọc thêm lớp `data` thừa:

```json
{
  "id": 1042,
  "code": "RSV-2026-001042",
  "facilityId": 3,
  "unitTypeId": 7,
  "startDate": "2026-10-01",
  "rentalMonths": 3,
  "depositAmount": 800000,
  "totalRentalFee": 2400000,
  "status": "PENDING_PAYMENT",
  "holdExpiresAt": "2026-09-10T16:30:00+07:00"
}
```

Danh sách luôn phân trang, dùng đúng cấu trúc `Page` của Spring Data:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 137,
  "totalPages": 7
}
```

### 6.4. Response lỗi

Mọi lỗi dùng **chung một cấu trúc**, do `GlobalExceptionHandler` sinh ra:

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

- `errorCode` là `UPPER_SNAKE_CASE`, lấy từ enum `ErrorCode`, **ổn định** để Frontend so khớp.
- `message` viết tiếng Việt, dùng được trực tiếp làm nội dung hiển thị cho người dùng.
- `details` chỉ có khi lỗi gắn với từng trường cụ thể.

Một số `errorCode` nghiệp vụ đã chốt: `CAPACITY_NOT_AVAILABLE` · `UNIT_ASSIGNMENT_FAILED` · `RESERVATION_EXPIRED` ·
`RESERVATION_ALREADY_CANCELLED` · `PAYMENT_FAILED` · `CONTRACT_OVERDUE` · `CONTRACT_TERMINATED` ·
`RENEWAL_NOT_ALLOWED` · `RETURN_NOTICE_TOO_SHORT` · `INSUFFICIENT_DEPOSIT_BALANCE`.

### 6.5. Phân trang, sắp xếp, lọc

| Tham số | Ý nghĩa | Mặc định |
|---------|---------|:--------:|
| `page` | Trang, đếm từ 0 | `0` |
| `size` | Số phần tử mỗi trang, tối đa 100 | `20` |
| `sort` | `<trường>,<asc\|desc>`, lặp được nhiều lần | tùy endpoint |
| `keyword` | Tìm kiếm chuỗi | — |

Lọc dùng tham số query đặt tên đúng bằng tên trường: `GET /api/v1/contracts?status=OVERDUE&facilityId=3`.

### 6.6. Định dạng dữ liệu

- Tên trường JSON: **`camelCase`**.
- Ngày: `yyyy-MM-dd`. Mốc thời gian: ISO-8601 có offset — `2026-10-01T09:00:00+07:00`.
- Tiền: **số nguyên đơn vị đồng**, không phần thập phân, không định dạng phân cách. Việc hiển thị
  `800.000 đ` là của Frontend.
- Enum: chuỗi `UPPER_SNAKE_CASE` đúng bằng tên hằng phía Java — `PENDING_PAYMENT`, `PENDING_RETURN`.
- Trường không có giá trị thì để `null`, không dùng chuỗi rỗng hay `0` thay thế.

### 6.7. Xác thực và phân quyền

- `Authorization: Bearer <JWT>` cho mọi endpoint trừ nhóm công khai: đăng nhập, đăng ký, tra cứu
  Facility, Unit Type và Availability (`SC-01`).
- JWT chứa `userId`, `role` và danh sách `facilityIds` được gán — phục vụ phân quyền dữ liệu theo cơ
  sở ở `SA-03`.
- Phân quyền theo vai trò khai báo bằng `@PreAuthorize("hasRole('FACILITY_STAFF')")` ở tầng
  Controller. Kiểm tra "bản ghi này có thuộc cơ sở của tôi không" đặt ở tầng **service** — vì đó là
  quy tắc dữ liệu, không phải quy tắc route.
- Truy cập dữ liệu của cơ sở khác trả `403`, **không** trả `404` — trừ khi việc lộ sự tồn tại của bản
  ghi là vấn đề.

### 6.8. Quy trình chốt API contract

Theo [PLAN.md § 6](PLAN.md#6-quy-ước-làm-việc), Backend công bố endpoint và schema trước, Frontend mock
theo đó để hai bên chạy song song:

1. Backend mở Pull Request khai báo Controller và DTO kèm annotation OpenAPI, **chưa** cần cài đặt.
2. Frontend đọc Swagger, sinh type TypeScript và dựng mock.
3. Đổi contract sau khi đã công bố thì phải báo trong nhóm và sửa cả hai phía trong **cùng một Pull
   Request**.

---

## 7. Bảo mật và cấu hình

- **Không commit bí mật.** Chuỗi kết nối CSDL, khóa ký JWT, khóa cổng thanh toán đọc từ biến môi
  trường. File `.env` và `application-local.yml` nằm trong `.gitignore`. Repo chỉ chứa
  `.env.example` với giá trị giả.
- Mật khẩu băm bằng **BCrypt**, không bao giờ lưu dạng thô và không bao giờ trả về trong response.
- Không ghi log dữ liệu nhạy cảm: mật khẩu, JWT đầy đủ, Access Code, thông tin thanh toán.
- Truy vấn luôn dùng tham số ràng buộc (Spring Data hoặc `@Query` có tham số). Cấm nối chuỗi SQL.
- Tệp người dùng tải lên (ảnh Support Request, ảnh biên bản bàn giao) phải kiểm tra kiểu MIME và
  giới hạn dung lượng ở phía server, không tin kiểm tra phía client.
- CORS chỉ mở cho origin của Frontend, khai báo trong `SecurityConfig`.

---

## 8. Checklist review code

Người review đối chiếu danh sách này trước khi duyệt Pull Request:

- [ ] Đặt tên đúng quy ước ở § 3.2 (Backend) hoặc § 4.2 (Frontend)
- [ ] Controller không chứa logic nghiệp vụ, không trả `Entity` ra ngoài
- [ ] Business rule mới có ghi mã `BR-*` trong Javadoc và **không** hard-code tham số
- [ ] Có unit test cho tầng service, test bao phủ cả nhánh thất bại
- [ ] Lỗi ném ra là `BusinessException` kèm `ErrorCode`, không phải exception trần
- [ ] Endpoint mới tuân thủ § 6: đường dẫn, mã trạng thái, cấu trúc response, định dạng ngày và tiền
- [ ] Migration Flyway có số phiên bản mới, không sửa file đã merge
- [ ] Frontend xử lý đủ ba trạng thái đang tải / lỗi / rỗng
- [ ] Không còn `console.log`, `System.out.println`, code bị comment
- [ ] Không có bí mật hay dữ liệu thật bị commit
- [ ] Tài liệu liên quan trong `docs/` đã cập nhật nếu thay đổi chạm tới nghiệp vụ

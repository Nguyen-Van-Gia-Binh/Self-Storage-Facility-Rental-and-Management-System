# Biến Môi trường (Environment Variables)

Tổng hợp tất cả biến môi trường và cấu hình cho cả Backend và Frontend.

## Backend — Spring Boot

Các biến này được đặt trong biến môi trường hệ thống hoặc file `application-local.yml`.
Nguồn tham chiếu: `backend/src/main/resources/application.yml`.

### Cơ sở dữ liệu

| Biến môi trường | Giá trị mặc định | Mô tả | Bắt buộc |
|----------------|-----------------|-------|----------|
| `DB_URL` | `jdbc:sqlserver://localhost:1433;databaseName=SelfStorageDB;encrypt=true;trustServerCertificate=true` | JDBC connection string SQL Server | ✅ |
| `DB_USERNAME` | `sa` | Username đăng nhập SQL Server | ✅ |
| `DB_PASSWORD` | `YourPassword123` | Mật khẩu SQL Server | ✅ (đổi mặc định!) |

> **Cảnh báo bảo mật:** Không dùng mật khẩu mặc định `YourPassword123` trong production.

### JWT Authentication

| Cấu hình YAML | Giá trị mặc định | Mô tả | Bắt buộc |
|---------------|-----------------|-------|----------|
| `jwt.secret` | `404E635266...` (256-bit hex) | Secret key ký JWT HS256 — tối thiểu 32 bytes | ✅ (đổi mặc định!) |
| `jwt.access-token-expiration-ms` | `900000` | Thời hạn access token = **15 phút** | ✅ |
| `jwt.refresh-token-expiration-ms` | `604800000` | Thời hạn refresh token = **7 ngày** | ✅ |

### Email (Forgot Password OTP)

| Cấu hình YAML | Biến môi trường | Giá trị mặc định | Mô tả | Bắt buộc |
|---------------|----------------|-----------------|-------|----------|
| `spring.mail.host` | — | `smtp.gmail.com` | SMTP host (đã cố định) | Khi dùng email |
| `spring.mail.port` | — | `587` | SMTP port (STARTTLS) | Khi dùng email |
| `spring.mail.username` | `SPRING_MAIL_USERNAME` | _(trống)_ | Gmail dùng để gửi OTP | Khi dùng email |
| `spring.mail.password` | `SPRING_MAIL_PASSWORD` | _(trống)_ | Gmail App Password | Khi dùng email |

> **Lưu ý:** Nếu không cần tính năng Forgot Password khi dev local, có thể để trống `mail.username` và `mail.password`. Lỗi chỉ xảy ra khi gọi endpoint `/api/v1/auth/forgot-password`.
>
> Tạo Gmail App Password tại: https://myaccount.google.com/apppasswords (cần bật 2FA)

### Google OAuth 2.0

| Biến môi trường | Giá trị mặc định | Mô tả | Bắt buộc |
|----------------|-----------------|-------|----------|
| `GOOGLE_CLIENT_ID` | _(trống)_ | Google OAuth 2.0 Client ID | Chỉ khi dùng Google Login |

> Tạo Google Client ID tại: https://console.cloud.google.com/apis/credentials

### Server

| Cấu hình YAML | Giá trị mặc định | Mô tả |
|---------------|-----------------|-------|
| `server.port` | `8080` | Port Backend lắng nghe |
| `server.servlet.context-path` | `/api/v1` | Prefix đường dẫn API |

### Flyway

| Cấu hình YAML | Giá trị mặc định | Mô tả |
|---------------|-----------------|-------|
| `spring.flyway.enabled` | `true` | Bật tự động migrate khi khởi động |
| `spring.flyway.baseline-on-migrate` | `true` | Bỏ qua migration thấp hơn baseline |
| `spring.flyway.locations` | `classpath:db/migration` | Thư mục chứa file migration |

### OpenAPI / Swagger

| Cấu hình YAML | URL kết quả |
|---------------|------------|
| `springdoc.api-docs.path: /v3/api-docs` | http://localhost:8080/api/v1/v3/api-docs |
| `springdoc.swagger-ui.path: /swagger-ui.html` | http://localhost:8080/api/v1/swagger-ui.html |

---

## Frontend — Vite + React

Đặt trong `frontend/.env`. Nguồn tham chiếu: `frontend/.env.example`.

> **Quan trọng:** Vite chỉ nhúng biến có prefix `VITE_` vào bundle JavaScript.
> Không đặt secrets/credentials vào biến `VITE_*` — chúng sẽ hiển thị công khai trong source code trình duyệt.

| Biến | Ví dụ | Mô tả | Bắt buộc |
|------|-------|-------|----------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Base URL của Backend API | ✅ |

---

## Template `application-local.yml` đầy đủ (cho dev)

Tạo tại `backend/src/main/resources/application-local.yml`:

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=SelfStorageDB;encrypt=true;trustServerCertificate=true
    username: sa
    password: YourPassword123

  mail:
    username: your-gmail@gmail.com   # Để trống nếu không cần email
    password: your-app-password      # Gmail App Password (không phải mật khẩu Gmail)

jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  access-token-expiration-ms: 900000
  refresh-token-expiration-ms: 604800000

google:
  client-id:   # Để trống nếu không cần Google Login
```

---

## Template cho Production

### Backend (biến môi trường hệ thống):

```env
DB_URL=jdbc:sqlserver://<prod-server>:1433;databaseName=SelfStorageDB;encrypt=true;trustServerCertificate=false
DB_USERNAME=<prod-db-user>
DB_PASSWORD=<strong-random-password>
SPRING_MAIL_USERNAME=<gmail>
SPRING_MAIL_PASSWORD=<gmail-app-password>
GOOGLE_CLIENT_ID=<google-client-id>
```

### Frontend (`frontend/.env.production`):

```env
VITE_API_BASE_URL=https://<your-domain>/api/v1
```

---

## Tạo JWT Secret ngẫu nhiên (PowerShell)

```powershell
# Tạo 32 bytes ngẫu nhiên và chuyển sang chuỗi hex 64 ký tự
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[System.BitConverter]::ToString($bytes) -replace '-', ''
# Kỳ vọng: chuỗi 64 ký tự như: 3A8F2C1D...
```

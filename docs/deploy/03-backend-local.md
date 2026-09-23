# Chạy Backend Spring Boot (Local)

## Yêu cầu

- Java 17 đã cài và `JAVA_HOME` trỏ đúng (xem [01-prerequisites.md](01-prerequisites.md))
- SQL Server 2022 đang chạy với database `SelfStorageDB` đã tạo (xem [02-database-setup.md](02-database-setup.md))
- Maven 3.9+ (hoặc dùng wrapper `.\mvnw` đi kèm source)

## Cấu hình biến môi trường Backend

Backend đọc config theo thứ tự ưu tiên:
1. **Biến môi trường hệ thống** (cao nhất — dùng cho production)
2. **`application-local.yml`** (dành cho dev cục bộ, không commit)
3. **`application.yml`** (giá trị mặc định)

### Cách A — Dùng `application-local.yml` (khuyến nghị cho dev)

Tạo file `backend/src/main/resources/application-local.yml` (file này đã có trong `.gitignore`):

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=SelfStorageDB;encrypt=true;trustServerCertificate=true
    username: sa
    password: YourPassword123   # Thay bằng mật khẩu SA thực của bạn

  # Email — cần cho tính năng Forgot Password (tùy chọn khi dev local)
  mail:
    username: your-gmail@gmail.com   # Gmail dùng để gửi OTP
    password: your-app-password      # App Password (không phải mật khẩu Gmail thường)

jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  access-token-expiration-ms: 900000
  refresh-token-expiration-ms: 604800000

# Google OAuth 2.0 (tùy chọn — bỏ trống nếu không dùng Google Login)
google:
  client-id:
```

> **Cảnh báo:** `application-local.yml` đã có trong `.gitignore`. Không commit file này lên Git.

> **Lưu ý Email:** Nếu không cần tính năng Forgot Password khi dev, có thể để trống `mail.username` và `mail.password`. Hệ thống sẽ báo lỗi chỉ khi gọi endpoint `/auth/forgot-password`.

### Cách B — Dùng biến môi trường hệ thống (PowerShell)

```powershell
$env:DB_URL      = "jdbc:sqlserver://localhost:1433;databaseName=SelfStorageDB;encrypt=true;trustServerCertificate=true"
$env:DB_USERNAME = "sa"
$env:DB_PASSWORD = "YourPassword123"
# Email (tùy chọn)
$env:SPRING_MAIL_USERNAME = "your-gmail@gmail.com"
$env:SPRING_MAIL_PASSWORD = "your-app-password"
```

## Build Backend

```powershell
# Đặt đúng JAVA_HOME nếu máy có nhiều JDK
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"

# Build và bỏ qua test (lần đầu — chỉ verify build thành công)
mvn -f backend/pom.xml clean package -DskipTests

# Build kèm toàn bộ test suite
mvn -f backend/pom.xml clean package "-Dnet.bytebuddy.experimental=true"
```

Kết quả build thành công:

```
[INFO] BUILD SUCCESS
[INFO] Total time: xx.xxx s
```

JAR file: `backend/target/self-storage-backend-1.0.0-SNAPSHOT.jar`

## Chạy Backend

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"

# Chạy từ Maven (tự động reload khi code thay đổi)
mvn -f backend/pom.xml spring-boot:run

# Hoặc chạy trực tiếp từ JAR đã build
java -jar backend/target/self-storage-backend-1.0.0-SNAPSHOT.jar
```

## Xác nhận Backend chạy thành công

Log console phải có:

```
INFO  c.s.s.SelfStorageApplication - Started SelfStorageApplication in X.XXX seconds
INFO  o.s.b.w.e.t.TomcatWebServer  - Tomcat started on port(s): 8080
```

Kiểm tra phản hồi API:

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/facilities" -UseBasicParsing
# Kỳ vọng: StatusCode 200 hoặc 401 (endpoint cần auth)
# Không được: Connection refused hoặc 500
```

Mở trình duyệt: **http://localhost:8080/api/v1/swagger-ui.html**

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|---------|
| `java.lang.UnsupportedClassVersionError` | Đang dùng JDK < 17 | Kiểm tra lại `java -version` và `$env:JAVA_HOME` |
| `Port 8080 already in use` | Port bị chiếm | `netstat -ano \| findstr :8080` → `taskkill /PID <pid> /F` |
| `Failed to configure a DataSource` | Sai cấu hình DB | Kiểm tra `application-local.yml` hoặc biến `DB_*` |
| `FlywayException: Validate failed` | Migration bị sửa | `git checkout -- backend/src/main/resources/db/migration/` |
| `BUILD FAILURE` | Lỗi compile | Đọc ERROR message; thường do sai Java version |
| `Mail server connection failed` | Sai cấu hình SMTP | Kiểm tra `mail.username` và `mail.password`; hoặc để trống nếu không cần email |

## Bước tiếp theo

Tiếp tục với [04-frontend-local.md](04-frontend-local.md) để khởi động Frontend.

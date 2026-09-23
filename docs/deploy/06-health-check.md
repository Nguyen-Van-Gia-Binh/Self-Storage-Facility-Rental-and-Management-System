# Kiểm tra Sức khỏe Hệ thống (Health Check)

Chạy các kiểm tra **theo thứ tự từ trên xuống dưới** sau khi khởi động Backend và Frontend.
Mỗi kiểm tra phải **PASS** trước khi chuyển sang bước tiếp theo.

## Checklist kiểm tra

### ✅ 1. SQL Server đang chạy

```powershell
Get-Service -Name "MSSQLSERVER"
# Kỳ vọng: Status = Running
```

### ✅ 2. Backend khởi động thành công

Log console Backend phải có:

```
INFO  c.s.s.SelfStorageApplication - Started SelfStorageApplication in X.XXX seconds
```

Không được có dòng `ERROR` liên quan đến Flyway hoặc DataSource.

### ✅ 3. Flyway migrations chạy thành công

Trong log Backend:

```
INFO  o.f.c.internal.command.DbValidate - Successfully validated 14 migrations
```

Hoặc:

```
INFO  o.f.core.internal.command.DbMigrate - Schema of "dbo" is up to date. No migration necessary.
```

### ✅ 4. Backend API phản hồi

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/facilities" -UseBasicParsing
# Kỳ vọng: StatusCode 200 hoặc 401 (nếu cần auth)
# Không được: Connection refused hoặc 500
```

### ✅ 5. Swagger UI truy cập được

Mở trình duyệt: **http://localhost:8080/api/v1/swagger-ui.html**

Kỳ vọng: Trang Swagger UI hiển thị danh sách đầy đủ endpoint API của hệ thống.

### ✅ 6. Đăng nhập thành công (kiểm tra Auth)

Chạy lệnh PowerShell để test endpoint login:

```powershell
$body = '{"email":"admin@smartstorage.vn","password":"password123"}'
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
# Kỳ vọng: StatusCode 200 với body JSON chứa accessToken và refreshToken
```

### ✅ 7. Frontend dev server truy cập được

Mở trình duyệt: **http://localhost:5173**

Kỳ vọng: Trang web hiển thị bình thường, Console trình duyệt (F12) không có lỗi đỏ nghiêm trọng.

### ✅ 8. Frontend gọi API thành công

Tại trang đăng nhập trên http://localhost:5173:
1. Nhập email: `admin@smartstorage.vn`
2. Nhập password: `password123`
3. Nhấp nút **Đăng nhập**
4. Kỳ vọng: Chuyển hướng thành công vào Dashboard tương ứng với vai trò, Console (F12) tab Network ghi nhận request `POST /api/v1/auth/login` trả về HTTP `200 OK`.

---

## Danh sách tài khoản demo (Seed bởi Flyway V12 & V13)

Tất cả tài khoản demo bên dưới có mật khẩu mặc định: **`password123`**

| Email | Vai trò | Tên người dùng | Phạm vi / Cơ sở |
|-------|---------|----------------|-----------------|
| `admin@smartstorage.vn` | `SYSTEM_ADMINISTRATOR` | Lê Thanh Tùng | Toàn hệ thống |
| `bom@smartstorage.vn` | `BUSINESS_OPERATIONS_MANAGER` | Huỳnh Nhật | Ban giám đốc vận hành |
| `fm.q1@smartstorage.vn` | `FACILITY_MANAGER` | Nguyễn Văn Gia Bình | Cầu Giấy (FAC-CG) & Quận 7 (FAC-Q7) |
| `staff.q1@smartstorage.vn` | `FACILITY_STAFF` | Trần Văn Hùng | Cầu Giấy (FAC-CG) |
| `nhi.customer@gmail.com` | `STORAGE_CUSTOMER` | Nguyễn Phạm Xuân Nhi | Khách hàng thuê kho |

> **Cảnh báo bảo mật:** Các tài khoản demo chỉ phục vụ môi trường phát triển (Development) và kiểm thử (Staging). Tuyệt đối xóa hoặc thay đổi mật khẩu trước khi triển khai hệ thống thực tế trên Production.

---

## Xử lý khi có bước kiểm tra bị FAIL

| Bước kiểm tra thất bại | Nguyên nhân tiềm ẩn | Tài liệu hướng dẫn khắc phục |
|------------------------|---------------------|-----------------------------|
| Bước 1 — SQL Server không chạy | Service bị tắt hoặc sai cấu hình instance | [01-prerequisites.md](01-prerequisites.md) & [02-database-setup.md](02-database-setup.md) |
| Bước 2 — Backend không khởi động | Sai cổng port 8080 hoặc sai JAVA_HOME | [03-backend-local.md § Xử lý lỗi](03-backend-local.md) |
| Bước 3 — Flyway migration lỗi | File migration bị chỉnh sửa (checksum mismatch) | [02-database-setup.md § Xử lý lỗi](02-database-setup.md) |
| Bước 4 — API trả về 500 | Lỗi kết nối CSDL hoặc cấu hình JPA sai | Đọc stack trace chi tiết trong log console của Backend |
| Bước 6 — Đăng nhập lỗi 401 | Sai mật khẩu hoặc JWT secret không tương thích | Kiểm tra cấu hình `jwt` trong `application.yml` |
| Bước 7/8 — Frontend không load hoặc lỗi Network | Vite chưa cài dependencies hoặc Backend chưa bật | [04-frontend-local.md § Xử lý lỗi](04-frontend-local.md) |

# Cài đặt Cơ sở dữ liệu

## Yêu cầu

- SQL Server 2022 đang chạy (xem [01-prerequisites.md](01-prerequisites.md))
- Tài khoản SA với mật khẩu đã cấu hình khi cài

## Bước 1: Tạo database SelfStorageDB

**Cách 1 — Dùng SSMS:**

1. Mở SSMS, kết nối tới `localhost,1433` với thông tin đăng nhập SA
2. Mở **New Query** và chạy:

```sql
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SelfStorageDB')
BEGIN
    CREATE DATABASE SelfStorageDB;
    PRINT 'Database SelfStorageDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database SelfStorageDB already exists.';
END
```

**Cách 2 — Dùng `sqlcmd` (PowerShell):**

```powershell
sqlcmd -S localhost,1433 -U sa -P "YourPassword123" -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SelfStorageDB') CREATE DATABASE SelfStorageDB"
```

## Bước 2: Flyway migrations chạy tự động khi Backend khởi động

Flyway được cấu hình `baseline-on-migrate: true` trong `application.yml`.
Khi Backend Spring Boot khởi động lần đầu, Flyway tự động chạy tuần tự V1 → V14.

Migrations nằm tại: `backend/src/main/resources/db/migration/`

| File | Nội dung |
|------|----------|
| `V1__init_schema.sql` | Tạo toàn bộ bảng cốt lõi |
| `V2__seed_data.sql` | Dữ liệu seed ban đầu |
| `V3__add_facility_details.sql` | Bổ sung cột chi tiết facility |
| `V4__add_storage_unit_floor_position.sql` | Cột tầng và vị trí ô kho |
| `V5__create_contract_and_handover.sql` | Bảng hợp đồng và bàn giao |
| `V6__create_return_request_and_extra_charge_enhancements.sql` | Phiếu trả kho |
| `V7__seed_policy_and_contract_test_data.sql` | Dữ liệu test policy |
| `V8__add_reservation_cancel_reason.sql` | Lý do huỷ đặt chỗ |
| `V9__allow_null_extra_fee_type_id.sql` | Cho phép NULL extra fee |
| `V10__update_login_history_and_audit_log.sql` | Lịch sử đăng nhập và audit log |
| `V11__fix_seed_user_passwords.sql` | Sửa mật khẩu seed ban đầu |
| `V12__add_smartstorage_demo_accounts.sql` | Tài khoản demo SmartStorage |
| `V13__fix_all_demo_user_passwords.sql` | Đồng bộ mật khẩu tài khoản demo |
| `V14__create_password_reset_otp_table.sql` | Bảng OTP reset mật khẩu |

> **Quy tắc bắt buộc:** Không bao giờ sửa nội dung các file V1…V14 đã áp dụng.
> Nếu cần thay đổi schema, tạo file mới `V15__<mô-tả>.sql`.

## Bước 3: Xác nhận migration thành công

Sau khi Backend khởi động (xem [03-backend-local.md](03-backend-local.md)), kiểm tra log:

```
INFO  o.f.c.internal.command.DbValidate - Successfully validated 14 migrations
INFO  o.f.core.internal.command.DbMigrate - Schema of "dbo" is up to date. No migration necessary.
```

Hoặc truy vấn trong SSMS:

```sql
USE SelfStorageDB;
SELECT version, description, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

Kỳ vọng: 14 dòng với cột `success = 1` cho tất cả.

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|---------|
| `Cannot open database "SelfStorageDB"` | Database chưa tạo | Chạy lại Bước 1 |
| `Login failed for user 'sa'` | Sai mật khẩu SA | Kiểm tra `DB_PASSWORD` trong `application-local.yml` |
| `Validate failed: Migration checksum mismatch` | File V1–V14 bị sửa | `git checkout -- backend/src/main/resources/db/migration/` |
| `TCP Provider: No connection could be made` | SQL Server chưa chạy | `Start-Service MSSQLSERVER` (PowerShell Administrator) |
| `SA login is disabled` | SA bị tắt mặc định | Bật trong SQL Server Configuration Manager hoặc SSMS |

## Bước tiếp theo

Tiếp tục với [03-backend-local.md](03-backend-local.md) để khởi động Backend và kích hoạt Flyway migrations.

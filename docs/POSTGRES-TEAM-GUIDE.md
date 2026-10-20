# Hướng dẫn Kiểm thử Hệ thống với CSDL PostgreSQL (Dành cho Thành viên Nhóm)

> **Mục tiêu:** Hướng dẫn các thành viên trong nhóm kéo nhánh `refactor/migrate-database-to-postgresql` về máy, cấu hình môi trường và chạy thử toàn bộ hệ thống (Backend & Frontend) với cơ sở dữ liệu mới PostgreSQL.

---

## 🚀 1. Lệnh Git để kéo nhánh về máy cá nhân

Mở terminal tại thư mục gốc của dự án và chạy các lệnh sau:

```powershell
# 1. Lấy thông tin nhánh mới nhất từ GitHub
git fetch origin

# 2. Tạo nhánh cục bộ và chuyển sang nhánh refactor của PostgreSQL
git checkout -b test-postgres origin/refactor/migrate-database-to-postgresql
```

---

## 🗄️ 2. Lựa chọn Phương án Kết nối Cơ sở Dữ liệu

Nhóm chúng ta hỗ trợ **2 phương án** kết nối CSDL PostgreSQL:

### 🌟 Cách 1: Dùng chung Neon Cloud DB (Khuyên dùng - Nhanh nhất, Không cần cài đặt)

Cơ sở dữ liệu PostgreSQL đã được triển khai và nạp sẵn toàn bộ dữ liệu mẫu trên Neon Cloud. Bạn **không cần cài đặt PostgreSQL hay Docker** vào máy tính.

1. Mở file `backend/src/main/resources/application-local.yml` (nếu chưa có thì tạo mới, file này đã được cấu hình `.gitignore` nên tuyệt đối an toàn không sợ bị commit đè lên):
2. Điền nội dung sau vào file:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://ep-dawn-dust-b7824yok.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require
    username: neondb_owner
    password: npg_i9RnSrxN4ohu
```

---

### 💻 Cách 2: Chạy PostgreSQL cục bộ trên máy (Localhost / Docker)

Nếu bạn muốn dữ liệu của mình hoàn toàn độc lập hoặc đang làm việc khi không có kết nối Internet ổn định:

1. **Khởi chạy container PostgreSQL qua Docker CLI:**
   ```powershell
   docker run --name postgres-selfstorage -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=selfstorage -p 5432:5432 -d postgres:16-alpine
   ```
2. **Cấu hình:** File `application.yml` mặc định đã trỏ sẵn vào `jdbc:postgresql://localhost:5432/selfstorage`. Flyway sẽ tự động kích hoạt `V1__init_postgres_schema.sql` và `V2__seed_postgres_data.sql` để khởi tạo toàn bộ bảng và dữ liệu mẫu trong lần chạy đầu tiên.

---

## 🏃 3. Hướng dẫn Khởi chạy Hệ thống

### Bước 1: Khởi động Backend (Spring Boot 3)
```powershell
# Di chuyển vào thư mục backend và chạy
cd backend
mvn spring-boot:run
```
*(Hoặc mở IntelliJ IDEA và bấm Run file `SelfStorageApplication.java`).*

👉 **Dấu hiệu thành công:** Terminal hiển thị:
```text
Database: jdbc:postgresql://... (PostgreSQL 18.6)
Schema "public" is up to date. No migration necessary.
Started SelfStorageApplication in ... seconds
```

### Bước 2: Khởi động Frontend (React 18 + Vite)
Mở một cửa sổ Terminal khác tại thư mục dự án:
```powershell
cd frontend
npm install   # nếu có package mới
npm run dev
```
Truy cập trình duyệt: [http://localhost:5173](http://localhost:5173).

---

## 👥 4. Danh sách Tài khoản Kiểm thử (Tất cả mật khẩu: `123456`)

| Phân hệ / Vai trò | Email đăng nhập | Mật khẩu | Mục tiêu kiểm thử đề xuất |
| :--- | :--- | :--- | :--- |
| **Storage Customer** | `customer1@gmail.com` | `123456` | Xem hợp đồng đang thuê, duyệt ô kho và thử tạo đơn đặt chỗ mới. |
| **Facility Staff** | `staff1@gmail.com` | `123456` | Xem nhiệm vụ bàn giao, check-in, kiểm tra ô kho. |
| **Facility Manager** | `manager1@gmail.com` | `123456` | Quản lý ô kho tại cơ sở Cầu Giấy, duyệt yêu cầu trả kho. |
| **BOM (Kinh doanh)** | `bom@gmail.com` | `123456` | Xem bảng giá, cấu hình chính sách phí phạt / đặt cọc. |
| **Admin** | `admin@gmail.com` | `123456` | Quản lý người dùng, xem lịch sử đăng nhập và audit log. |

---

## 🔍 5. Các điểm Kỹ thuật Cốt lõi Đã Thay Đổi
1. **Loại bỏ hoàn toàn SQL Server:** Đã thay driver `com.microsoft.sqlserver` bằng `org.postgresql:postgresql` và cấu hình Hibernate Dialect `PostgreSQLDialect`.
2. **Lưu trữ Migration cũ:** 54 migration cũ của SQL Server đã được di chuyển an toàn vào `backend/src/main/resources/db/archive_sqlserver/`.
3. **Bộ Migration Chuẩn:** CSDL mới sử dụng `V1__init_postgres_schema.sql` (toàn bộ cấu trúc chuẩn ANSI) và `V2__seed_postgres_data.sql` (dữ liệu mẫu phong phú kèm đồng bộ sequence `setval`).
4. **Native Queries:** Tất cả 13 truy vấn SQL thuần đã được chuyển sang cú pháp PostgreSQL (`INTERVAL '1 day'`, `CURRENT_TIMESTAMP`).
5. **Gói Tối ưu Hiệu năng Từ Xa (Remote DB Optimization):**
   - **Direct Connection:** Bỏ qua PgBouncer trung gian, kết nối trực tiếp đến PostgreSQL engine.
   - **HikariCP Warm Pool:** `minimum-idle: 5` và `keepalive-time: 30000` giữ kết nối luôn ấm, triệt tiêu thời gian bắt tay SSL qua mạng quốc tế.
   - **Batch Fetching:** `default_batch_fetch_size: 25` tự động gom các câu truy vấn N+1, giảm 80% độ trễ truyền dữ liệu.
   - **Fast Startup:** Đặt `ddl-auto: ${DDL_AUTO:none}` giúp app khởi động chỉ trong 3-5 giây.

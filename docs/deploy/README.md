# Hướng dẫn Triển khai — Self-Storage System

Bộ tài liệu này hướng dẫn cài đặt, cấu hình và chạy toàn bộ hệ thống
**Self-Storage Facility Rental and Management System** trên máy cục bộ và môi trường production.

## Kiến trúc triển khai

```
┌─────────────────────────────────────────────────────┐
│  Browser (port 5173 dev / port 80 prod)             │
│  React 19 + TypeScript + Vite (frontend/dist/)      │
└────────────────────┬────────────────────────────────┘
                     │ HTTP /api/v1/*
┌────────────────────▼────────────────────────────────┐
│  Spring Boot 3.2.5 (port 8080)                      │
│  /api/v1 · JWT Auth · OpenAPI /swagger-ui.html      │
└────────────────────┬────────────────────────────────┘
                     │ JDBC port 1433
┌────────────────────▼────────────────────────────────┐
│  SQL Server 2022                                    │
│  database: SelfStorageDB · Flyway V1…V14           │
└─────────────────────────────────────────────────────┘
```

## Tài liệu theo thứ tự

| Bước | File | Nội dung |
|------|------|----------|
| 1 | [01-prerequisites.md](01-prerequisites.md) | Yêu cầu phần mềm (JDK 17, Node 20+, SQL Server 2022) |
| 2 | [02-database-setup.md](02-database-setup.md) | Tạo database SelfStorageDB + chạy Flyway migrations |
| 3 | [03-backend-local.md](03-backend-local.md) | Build và chạy Backend Spring Boot |
| 4 | [04-frontend-local.md](04-frontend-local.md) | Cấu hình .env và chạy Frontend Vite |
| 5 | [05-environment-variables.md](05-environment-variables.md) | Bảng tra cứu tất cả biến môi trường |
| 6 | [06-health-check.md](06-health-check.md) | Kiểm tra sức khỏe hệ thống sau khi chạy |
| 7 | [07-production-deploy.md](07-production-deploy.md) | Deploy production: JAR + static files |

## Cổng dịch vụ mặc định

| Dịch vụ | Địa chỉ |
|---------|---------|
| Backend API | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/api/v1/swagger-ui.html |
| Frontend Dev | http://localhost:5173 |
| SQL Server | localhost:1433 |

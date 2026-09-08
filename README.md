# Self-Storage Facility Rental and Management System

**Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ**

Hệ thống quản lý toàn bộ vòng đời dịch vụ cho thuê kho tự phục vụ: khách hàng tìm kiếm và đặt chỗ
ô kho, nhận bàn giao tại cơ sở, sử dụng và gia hạn, cho tới khi trả kho — song song với các nghiệp vụ
vận hành phía sau như quản lý ô kho, phân công nhân viên, thu phí, xử lý quá hạn và báo cáo doanh thu.

> 📄 Đặc tả đề tài đầy đủ: **[docs/TOPIC.md](docs/TOPIC.md)**

---

## Tác nhân (Actors)

| Tác nhân | Vai trò |
|----------|---------|
| **Storage Customer** | Xem dịch vụ, đặt chỗ, thanh toán, check-in, quản lý ô kho đang thuê, gửi yêu cầu hỗ trợ |
| **Facility Staff** | Kiểm tra đặt chỗ, bàn giao / thu hồi ô kho, cập nhật trạng thái, xử lý sự cố tại chỗ |
| **Facility Manager** | Quản lý ô kho, phân bổ ô kho, theo dõi hợp đồng, phân công nhân viên, xem báo cáo cơ sở |
| **Business Operations Manager** | Quản lý danh sách cơ sở, chính sách thuê, giá và phí, báo cáo toàn hệ thống |
| **System Administrator** | Quản lý tài khoản, phân quyền vai trò và dữ liệu, theo dõi nhật ký hoạt động |

Chi tiết chức năng của từng tác nhân: [docs/TOPIC.md § 3](docs/TOPIC.md#3-yêu-cầu-chức-năng-theo-tác-nhân)

---

## Phạm vi nghiệp vụ

### Luồng chính

| # | Luồng | Mô tả ngắn |
|---|-------|-----------|
| 1 | **Storage Unit Reservation** | Đặt chỗ ô kho: chọn cơ sở, loại ô kho, ngày bắt đầu, thời hạn thuê và thanh toán cọc |
| 2 | **Storage Check-in and Handover** | Check-in theo lịch hẹn và bàn giao ô kho kèm khóa / thẻ / mã truy cập |
| 3 | **Rented Storage Unit Management** | Quản lý các ô kho đang thuê, theo dõi hợp đồng và quy trình trả kho |
| 4 | **Business Rules, Fee Management & Revenue Monitoring** | Chính sách thuê, khung giá, phụ phí và giám sát doanh thu toàn hệ thống |
| 5 | **Facility Storage and Staff Management** | Quản lý danh mục ô kho và phân công nhân viên tại cơ sở |

### Luồng bổ sung

| # | Luồng | Mô tả ngắn |
|---|-------|-----------|
| 6 | **Storage Renewal and Overdue Handling** | Gia hạn thuê, thu phí gia hạn và xử lý các trường hợp quá hạn |
| 7 | **Support Request and Issue Handling** | Tiếp nhận yêu cầu hỗ trợ và xử lý sự cố (khóa, mã truy cập, hư hỏng, thanh toán) |

Chi tiết từng luồng: [docs/TOPIC.md § 4–5](docs/TOPIC.md#4-các-luồng-nghiệp-vụ-chính-flow-15)

---

## Cấu trúc thư mục

```
.
├── README.md          # Tài liệu tổng quan (file này)
└── docs/
    └── TOPIC.md       # Đặc tả đề tài: actors, chức năng, luồng nghiệp vụ, glossary
```

Cấu trúc mã nguồn sẽ được bổ sung khi bắt đầu triển khai.

---

## Trạng thái dự án

| Hạng mục | Trạng thái |
|----------|-----------|
| Đặc tả đề tài | ✅ Hoàn thành — [docs/TOPIC.md](docs/TOPIC.md) |
| Phân tích yêu cầu (use case, user story) | ⬜ Chưa bắt đầu |
| Thiết kế cơ sở dữ liệu (ERD) | ⬜ Chưa bắt đầu |
| Thiết kế giao diện (wireframe / UI) | ⬜ Chưa bắt đầu |
| Công nghệ sử dụng | ⬜ Chưa chốt |
| Triển khai mã nguồn | ⬜ Chưa bắt đầu |

---

## Việc tiếp theo

1. Phân rã 7 luồng nghiệp vụ thành use case và user story chi tiết.
2. Xác định các quy tắc nghiệp vụ (business rules) về cọc, gia hạn, hủy, trả kho và quá hạn.
3. Thiết kế mô hình dữ liệu: Facility, Storage Unit, Unit Type, Reservation, Contract, Payment, Support Request, User & Role.
4. Chốt công nghệ (frontend / backend / database) và khởi tạo khung dự án.
5. Bổ sung hướng dẫn cài đặt và chạy dự án vào README này.

---

## Tài liệu

- [docs/TOPIC.md](docs/TOPIC.md) — Đặc tả đề tài đầy đủ, kèm nguyên văn đề bài ở phần phụ lục.

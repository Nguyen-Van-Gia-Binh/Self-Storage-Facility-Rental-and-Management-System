# SmartStorage — Frontend Client (React + TypeScript)

> **Self-Storage Facility Rental and Management System** — Cổng giao diện người dùng cho hệ thống thuê kho tự quản thông minh.
> 
> Nhiệm vụ **T1.17** · Giai đoạn 1 · [docs/PLAN.md](../docs/PLAN.md)  
> Quy ước lập trình: [docs/CONVENTIONS.md § 4](../docs/CONVENTIONS.md#4-frontend--react-và-typescript)  
> Thiết kế giao diện: [docs/WIREFRAMES-CUSTOMER.md](../docs/WIREFRAMES-CUSTOMER.md)

---

## 1. Công nghệ sử dụng

- **Core:** React 19 + TypeScript (Strict Mode)
- **Build Tool:** Vite (Hot Module Replacement siêu tốc)
- **Styling:** Tailwind CSS + PostCSS + Autoprefixer
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Format & Lint:** ESLint + Prettier

---

## 2. Cấu trúc thư mục

Thực hiện chuẩn hóa theo [docs/CONVENTIONS.md § 4.1](../docs/CONVENTIONS.md#41-cấu-trúc-thư-mục):

```text
frontend/src/
├── api/            # Lớp gọi HTTP API, đóng gói fetch/axios và gắn JWT
├── components/     # Các UI Component dùng chung (Button, Card, Badge, Input...)
│   └── ui/
├── features/       # Chia theo module nghiệp vụ (đối xứng với backend)
│   ├── customer/   # Customer Portal (SC-01 -> SC-06)
│   ├── reservation/# Flow 1: Đặt chỗ & Thanh toán VietQR
│   ├── contract/   # Flow 2, Flow 3, Flow 6: Quản lý hợp đồng, trả kho, gia hạn
│   └── support/    # Flow 7: Yêu cầu hỗ trợ kỹ thuật
├── layouts/        # Khung giao diện (CustomerLayout, StaffLayout, AdminLayout)
├── hooks/          # Custom hook dùng chung
├── routes/         # Khai báo cấu hình router và route guard
├── types/          # Kiểu dữ liệu TypeScript dùng chung, khớp DTO Backend
└── utils/          # Tiện ích định dạng tiền VNĐ, ngày tháng
```

---

## 3. Hướng dẫn cài đặt và chạy ứng dụng

### Yêu cầu môi trường
- **Node.js:** >= 20.x (Khuyến nghị bản LTS)
- **npm:** >= 10.x

### Cài đặt thư viện
```bash
cd frontend
npm install
```

### Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:5173`

### Kiểm tra build sản phẩm
```bash
npm run build
```

---

## 4. Tác giả phụ trách
- **Nguyễn Phạm Xuân Nhi** — Frontend Lead ([PLAN.md](../docs/PLAN.md) § 2)

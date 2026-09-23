# Chạy Frontend (Local Dev)

## Yêu cầu

- Node.js **≥ 20 LTS** và npm đã cài (xem [01-prerequisites.md](01-prerequisites.md))
- Backend đang chạy tại `http://localhost:8080` (xem [03-backend-local.md](03-backend-local.md))

## Cấu hình biến môi trường Frontend

Tạo file `frontend/.env` từ file mẫu:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Nội dung mặc định của `frontend/.env`:

```env
# Cấu hình API Backend Base URL
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

> **Lưu ý:** `frontend/.env` đã có trong `.gitignore`. Không commit file này lên Git.
> Chỉ commit `frontend/.env.example` (không chứa giá trị nhạy cảm).

## Proxy trong Vite (đã cấu hình sẵn)

File `frontend/vite.config.ts` đã cấu hình proxy, **không cần sửa**:

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
},
```

Proxy này tự động chuyển tiếp request từ Frontend tới `/api/*` sang Backend,
giúp tránh lỗi CORS khi dev cục bộ mà không cần cấu hình thêm.

## Cài đặt dependencies

```powershell
# Chạy một lần, hoặc khi package.json thay đổi
npm install --prefix frontend
```

Kết quả thành công: không có lỗi đỏ, thư mục `frontend/node_modules/` được tạo.

## Chạy Frontend Dev Server

```powershell
npm run dev --prefix frontend
```

Kết quả thành công:

```
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Mở trình duyệt: **http://localhost:5173**

## Scripts có sẵn

| Script | Lệnh | Mục đích |
|--------|------|----------|
| Dev server | `npm run dev --prefix frontend` | Hot-reload dev server trên port 5173 |
| Build production | `npm run build --prefix frontend` | Build tĩnh vào `frontend/dist/` |
| Lint | `npm run lint --prefix frontend` | ESLint + TypeScript check |
| Preview build | `npm run preview --prefix frontend` | Xem thử bản build production cục bộ |

## Stack kỹ thuật

| Thư viện | Phiên bản | Mục đích |
|----------|-----------|----------|
| React | 19.2.8 | UI framework |
| React Router DOM | 7.18.3 | Client-side routing |
| TypeScript | ~6.0.2 | Type safety |
| Vite | 8.3.0 | Build tool + dev server |
| TailwindCSS | 3.4.19 | Utility-first CSS |
| Lucide React | 1.46.0 | Icon library |

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|---------|
| `Cannot find module 'vite'` | Chưa cài dependencies | `npm install --prefix frontend` |
| `Port 5173 already in use` | Port bị chiếm | `netstat -ano \| findstr :5173` → kill tiến trình |
| `Network Error` khi gọi API | Backend chưa chạy | Đảm bảo Backend đang chạy tại port 8080 |
| Trang trắng sau đăng nhập | JWT hết hạn hoặc sai URL | Kiểm tra `VITE_API_BASE_URL` trong `frontend/.env` |
| `TypeScript error` khi build | Lỗi type | `npm run lint --prefix frontend` để xem chi tiết |

## Bước tiếp theo

Sau khi cả Backend và Frontend đang chạy, kiểm tra hệ thống theo [06-health-check.md](06-health-check.md).

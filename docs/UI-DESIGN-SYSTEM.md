# Hướng dẫn Hệ thống Thiết kế Giao diện (UI Design System & Frontend Guidelines)

> **Mã nhiệm vụ:** T1.18 · Giai đoạn 1 · [PLAN.md](PLAN.md)  
> **Người biên soạn & Phụ trách:** Nguyễn Phạm Xuân Nhi  
> **Áp dụng cho:** Toàn bộ thành viên phát triển giao diện 5 Portal (`Customer`, `Staff`, `Manager`, `Business Ops`, `Admin`)  
> **Công nghệ nền tảng:** React 19 + TypeScript + Vite + Tailwind CSS v3 + Lucide React  
> **Cảm hứng thiết kế:** Dub.co SaaS Dashboard + Bảng màu Clean Mint Teal & Deep Pine

---

## 1. Triết lý Thiết kế (Design Philosophy)

Hệ thống quản lý kho tự quản thông minh (**SmartStorage**) là sản phẩm kết hợp giữa dịch vụ lưu trữ vật lý an toàn và giải pháp công nghệ hiện đại (Smart Lock, IoT, thanh toán trực tuyến). 

Giao diện cần đạt được 3 tiêu chí cốt lõi:
1. **Sạch sẽ & Sắc nét (Clean & Sharp)**: Lấy cảm hứng từ Dub.co — sử dụng đường viền siêu mảnh 1px (`border-slate-200`), thẻ bo góc nhẹ nhàng (`rounded-xl`), hạn chế đổ bóng đen sì gây nặng nề.
2. **Tin cậy & Công nghệ (Trust & Tech-forward)**: Bảng màu Mint Teal kết hợp Đen thông trầm mang lại cảm giác kho bãi sạch đẹp, bảo mật cao cấp, thân thiện môi trường.
3. **Mô-đun hóa dễ làm theo (LEGO Pattern)**: 4 thành viên phát triển 4 luồng chức năng riêng biệt chỉ cần ghép nối các linh kiện dùng chung (`Button`, `Card`, `Badge`, `Input`) đã được đóng gói sẵn trong `src/components/ui/`.

---

## 2. Bảng mã màu chuẩn hóa (Design Tokens)

Toàn bộ mã màu đã được cài đặt sẵn vào file `frontend/tailwind.config.js`. Khi viết mã giao diện, **tuyệt đối không hardcode mã hex lạ**, chỉ sử dụng các class Tailwind bên dưới:

### 2.1. Màu thương hiệu & Nền tảng (Brand & Surface)

| Tên màu | Mã HEX | Class Tailwind tương ứng | Vai trò áp dụng |
| :--- | :---: | :--- | :--- |
| **Clean Mint Teal** | `#57b29a` | `bg-brand-500`, `text-brand-500`, `focus:ring-brand-500` | **Màu chính (Primary):** Nút kêu gọi hành động (CTA), icon nổi bật, tab đang chọn, viền active. |
| **Mint Hover** | `#439782` | `hover:bg-brand-600` | Trạng thái rê chuột (Hover) của nút chính. |
| **Soft Mint Mist** | `#f2f9f7` | `bg-[#f2f9f7]`, `bg-brand-50` | **Màu nền ứng dụng (App Background):** Nền toàn trang, tạo cảm giác dịu mắt, sạch sẽ. |
| **Deep Pine Obsidian**| `#0a1614` | `bg-[#0a1614]`, `text-[#0a1614]` | **Màu chữ chính & Nền Sidebar:** Màu chữ tiêu đề tương phản cao; nền thanh menu trái của Dashboard. |
| **Soft Sky Blue** | `#96b3cf` | `text-[#96b3cf]`, `border-[#96b3cf]` | **Màu phụ (Secondary):** Icon phụ, đường viền nhẹ, text bổ trợ trong sidebar tối. |
| **Denim Periwinkle**| `#7c94c3` | `text-[#7c94c3]`, `bg-[#7c94c3]` | **Màu điểm nhấn (Accent):** Link thứ 2, trạng thái focus bổ sung, biểu đồ so sánh. |
| **Canvas White** | `#ffffff` | `bg-white` | Nền thẻ Card, ô nhập Input, bảng dữ liệu Table. |

---

### 2.2. Màu trạng thái vòng đời ngăn kho (Unit Lifecycle Statuses - BẮT BUỘC)

Hệ thống quản lý kho tự quản có **6 trạng thái ngăn kho nghiệp vụ bắt buộc** (theo sơ đồ State Machine). Tất cả thành viên phải hiển thị đúng màu sắc để người dùng không bị nhầm lẫn:

| Trạng thái kho | Ý nghĩa nghiệp vụ | Class Tailwind khuyến nghị | Component mẫu |
| :--- | :--- | :--- | :--- |
| **`AVAILABLE`** | Kho trống, sẵn sàng cho thuê | `bg-emerald-50 text-emerald-700 border-emerald-300` | `<Badge variant="available">Còn trống</Badge>` |
| **`RESERVED`** | Đã đặt giữ chỗ (chờ thanh toán / check-in) | `bg-sky-50 text-sky-700 border-sky-300` | `<Badge variant="reserved">Đã đặt chỗ</Badge>` |
| **`OCCUPIED`** | Đang có khách thuê (Active) | `bg-slate-100 text-slate-700 border-slate-300` | `<Badge variant="occupied">Đang thuê</Badge>` |
| **`MAINTENANCE`** | Đang sửa chữa, kẹt khóa, khử khuẩn | `bg-amber-50 text-amber-700 border-amber-300` | `<Badge variant="maintenance">Bảo trì</Badge>` |
| **`OVERDUE`** | Hết hạn thuê nhưng chưa trả kho / nợ tiền | `bg-red-50 text-red-700 border-red-300` | `<Badge variant="overdue">Quá hạn</Badge>` |
| **`LOCKED`** | Bị niêm phong / Khóa an ninh khẩn cấp | `bg-rose-100 text-rose-800 border-rose-300` | `<Badge variant="locked">Khóa an ninh</Badge>` |

---

## 3. Quy chuẩn Kiểu chữ (Typography)

* **Phông chữ chuẩn:** **Inter** (đã nhúng Google Fonts trực tiếp trong `frontend/index.html`).
* **Hỗ trợ song ngữ:** Hỗ trợ 100% tiếng Việt có dấu (`ă, â, đ, ê, ô, ơ, ư`) và tiếng Anh. Không bị lỗi nhảy dòng (line-height jumping).
* **Cấp bậc cỡ chữ (Type Scale):**
  * **Tiêu đề trang (Page Title - H1):** `text-2xl sm:text-3xl font-bold tracking-tight text-slate-900`
  * **Tiêu đề phân mục (Section Title - H2):** `text-lg sm:text-xl font-semibold text-slate-900`
  * **Tiêu đề thẻ/bảng (Card Title - H3):** `text-sm sm:text-base font-semibold text-slate-800`
  * **Nội dung chính (Body Text):** `text-sm text-slate-600 font-normal leading-relaxed`
  * **Thông tin phụ / Metadata (Caption):** `text-xs text-slate-500 font-medium`

---

## 4. Khung giao diện (Layout Architecture)

Hệ thống được chia thành **2 khung giao diện mẫu (Layouts)** đặt tại `src/layouts/`:

### 4.1. Khung khách hàng: `<CustomerLayout>`
* **Vị trí:** `src/layouts/CustomerLayout.tsx`
* **Dành cho:** **Customer Portal (B2C)** — Khám phá cơ sở, chọn kích thước kho, đặt lịch thuê, thanh toán VietQR, thẻ mở cửa số.
* **Đặc điểm:** 
  * Header dính đỉnh trang (`sticky top-0`) có Logo, liên kết nhanh, nút gạt song ngữ, nút "Đăng nhập" và "Thuê kho ngay".
  * Chiều rộng nội dung giới hạn: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
  * Footer chứa thông tin hỗ trợ kỹ thuật, hotline 24/7 và cam kết an ninh.

### 4.2. Khung quản trị nội bộ: `<DashboardLayout>`
* **Vị trí:** `src/layouts/DashboardLayout.tsx`
* **Dành cho:** 4 Portal nghiệp vụ (**Staff**, **Manager**, **Business Operations**, **System Admin**).
* **Đặc điểm:**
  * **Sidebar cố định bên trái (260px)**: Nền đen thông trầm (`#0a1614`), icon Lucide sắc nét, tab đang kích hoạt có vệt sáng xanh Mint (`#57b29a`).
  * **Topbar trên cùng**: Chứa tên chi nhánh hiện tại (Facility Switcher), ô tìm kiếm nhanh (mã tủ, số hợp đồng, CCCD), nút đổi ngôn ngữ `VI/EN`, chuông thông báo và avatar người dùng.
  * Hỗ trợ giao diện co giãn trên điện thoại (Mobile Drawer) với nút Hamburger Menu.

```tsx
// Ví dụ sử dụng trong trang của Staff hoặc Manager:
import { DashboardLayout } from '@/layouts';

export const ManagerDashboardPage = () => {
  return (
    <DashboardLayout 
      portalRole="manager" 
      userName="Nguyễn Văn An" 
      facilityName="Cơ sở Quận 7 - Nam Sài Gòn"
    >
      <div className="space-y-6">
        {/* Nội dung màn hình của bạn */}
      </div>
    </DashboardLayout>
  );
};
```

---

## 5. Thư viện Linh kiện Dùng chung (`src/components/ui/`)

Tất cả các bạn khi viết trang **bắt buộc** tái sử dụng các linh kiện sau thay vì tự viết lại HTML thô:

### 5.1. Nút bấm (`Button`)
```tsx
import { Button } from '@/components/ui/Button';

// Nút chính (Mint Teal):
<Button variant="primary">Lưu thay đổi</Button>

// Nút phụ / Hủy bỏ:
<Button variant="outline">Quay lại</Button>

// Nút hành động nguy hiểm:
<Button variant="danger">Hủy hợp đồng</Button>

// Nút trạng thái đang tải dữ liệu:
<Button variant="primary" isLoading>Đang xử lý...</Button>
```

### 5.2. Thẻ chứa (`Card`)
Mặc định bo góc 12px chuẩn Dub (`rounded-xl`), viền 1px mỏng, đổ bóng nhẹ:
```tsx
import { Card } from '@/components/ui/Card';

<Card hoverable className="p-6">
  <h3 className="font-semibold text-slate-900">Tủ kho A102</h3>
  <p className="text-sm text-slate-500 mt-1">Kích thước: 1.2m x 1.5m</p>
</Card>
```

### 5.3. Nhãn trạng thái (`Badge`)
Thiết kế hình viên thuốc (`rounded-full`) chuẩn chỉnh:
```tsx
import { Badge } from '@/components/ui/Badge';

// Trạng thái kho:
<Badge variant="available">Còn trống</Badge>
<Badge variant="reserved">Đã đặt giữ chỗ</Badge>
<Badge variant="occupied">Đang thuê</Badge>
<Badge variant="maintenance">Bảo trì</Badge>
<Badge variant="overdue">Quá hạn</Badge>
<Badge variant="locked">Khóa an ninh</Badge>

// Trạng thái chung:
<Badge variant="success">Đã thanh toán</Badge>
<Badge variant="warning">Chờ duyệt</Badge>
<Badge variant="danger">Thất bại</Badge>
```

### 5.4. Ô nhập liệu form (`Input`)
Tự động kèm nhãn (Label), báo lỗi (Error) và mô tả phụ (Helper text):
```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Số Căn cước công dân / Hộ chiếu"
  placeholder="Nhập 12 số CCCD..."
  helperText="Dùng để đối chiếu khi nhận kho tại cơ sở"
  error={errors.idCard}
/>
```

---

## 6. Bảng Tra Cứu Nhanh Cho Lập Trình Viên (Developer Quick Reference)

Bảng tổng hợp nhanh các quy tắc định dạng và component bắt buộc khi xây dựng màn hình:

| Hạng mục | Quy chuẩn bắt buộc | Class Tailwind / Component tương ứng |
| :--- | :--- | :--- |
| **Màu chính (Primary)** | Xanh Mint Teal (`#57b29a`) | `bg-brand-500 text-white hover:bg-brand-600` |
| **Nền toàn ứng dụng** | Trắng sương bạc hà (`#f2f9f7`) | `bg-[#f2f9f7]` (hoặc `bg-brand-50`) |
| **Màu chữ chính** | Đen thông trầm (`#0a1614`) | `text-[#0a1614]` |
| **Thẻ chứa nội dung** | Bo góc 12px, viền 1px, shadow nhẹ | `<Card className="p-6">` (`rounded-xl border border-slate-200`) |
| **Layout B2C (Customer)** | Menu trên đỉnh, giới hạn max-w-7xl | `<CustomerLayout>{children}</CustomerLayout>` |
| **Layout B2B (Nội bộ)** | Sidebar cố định 260px bên trái | `<DashboardLayout portalRole="staff\|manager\|business_ops\|admin">{children}</DashboardLayout>` |
| **Trạng thái kho: Trống** | Xanh lục bảo (`#10b981`) | `<Badge variant="available">Còn trống</Badge>` |
| **Trạng thái kho: Đặt chỗ** | Xanh da trời (`#38bdf8`) | `<Badge variant="reserved">Đã đặt chỗ</Badge>` |
| **Trạng thái kho: Đang thuê**| Xám than (`#64748b`) | `<Badge variant="occupied">Đang thuê</Badge>` |
| **Trạng thái kho: Bảo trì** | Vàng hổ phách (`#f59e0b`) | `<Badge variant="maintenance">Bảo trì</Badge>` |
| **Trạng thái kho: Quá hạn** | Đỏ tươi (`#ef4444`) | `<Badge variant="overdue">Quá hạn</Badge>` |
| **Trạng thái kho: Khóa** | Đỏ đô (`#e11d48`) | `<Badge variant="locked">Khóa an ninh</Badge>` |

---

## 7. Hướng dẫn Khởi chạy & Cấu hình Môi trường (Developer Setup)

Dành cho tất cả thành viên khi clone hoặc pull code mới nhất về máy:

### 7.1. Yêu cầu môi trường
* **Node.js**: Phiên bản 20.x trở lên (Khuyến nghị LTS).
* **Trình quản lý gói**: `npm` (kèm theo Node.js).

### 7.2. Các bước cài đặt và chạy ứng dụng
1. Mở terminal tại thư mục gốc của repo và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện phụ thuộc (chỉ cần chạy lần đầu hoặc khi có thư viện mới):
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ phát triển (Dev Server):
   ```bash
   npm run dev
   ```
   *Truy cập giao diện tại:* `http://localhost:5173`

---

## 8. Quy tắc Phát triển Tính năng (Feature Development Workflow)

Nhóm chia việc theo luồng chức năng (Vertical Flow). Mỗi thành viên phụ trách một luồng sẽ phát triển giao diện theo cấu trúc sau:

### 8.1. Vị trí đặt file mã nguồn
* Toàn bộ màn hình và linh kiện riêng của từng luồng đặt trong `src/features/{tên_luồng}/`:
  * `src/features/customer/` — Luồng khách hàng thuê kho, tra cứu, thanh toán VietQR.
  * `src/features/handover/` — Luồng nhân viên check-in, nghiệm thu bàn giao và trả kho.
  * `src/features/rentals/` — Luồng quản lý hợp đồng thuê, gia hạn và tính tiền cọc.
  * `src/features/operations/` — Luồng quản lý cơ sở, sơ đồ ngăn kho, điều phối bảo trì.
  * `src/features/support/` — Luồng gửi ticket sự cố kỹ thuật và xử lý khiếu nại.

### 8.2. Quy tắc viết code
1. **Tuyệt đối không hardcode đường dẫn tương đối dài dòng**: Luôn dùng alias `@/` đã cấu hình trong `tsconfig.app.json`:
   * *Đúng:* `import { Button } from '@/components/ui/Button';`
   * *Sai:* `import { Button } from '../../../components/ui/Button';`
2. **Khai báo kiểu dữ liệu TypeScript rõ ràng (Strict Typing)**:
   * Mọi component và hàm phải định nghĩa rõ interface Props, không dùng kiểu `any`.
3. **Gọi API Backend**:
   * Sử dụng client đã đóng gói sẵn tại `src/api/client.ts` (tự động đính kèm JWT token xác thực).

---

## 9. Tiêu chuẩn Kiểm tra trước khi tạo Pull Request (PR Quality Gate)

Trước khi commit và tạo PR lên GitHub, thành viên **bắt buộc chạy 2 lệnh sau** trong thư mục `frontend/` trên máy mình:

```bash
# 1. Kiểm tra lỗi định dạng và quy chuẩn ESLint (Bắt buộc 0 lỗi)
npm run lint

# 2. Kiểm tra biên dịch TypeScript và đóng gói Vite (Bắt buộc build thành công)
npm run build
```

> [!CAUTION]
> Nếu lệnh `npm run lint` hoặc `npm run build` báo lỗi đỏ, hãy sửa triệt để trên máy local trước khi đẩy code lên GitHub để không làm vỡ build của nhánh `main`.



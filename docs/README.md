# Cổng Điều hướng Tài liệu (Documentation Hub)

> **Self-Storage Facility Rental and Management System (SWP391)**  
> **Ngăn xếp công nghệ:** Spring Boot 3 (Java 17 LTS) · React 18 (TypeScript + Vite) · SQL Server 2022 · Flyway · JWT  
> **Tôn chỉ quản lý:** Tinh gọn (Lean) · Một nguồn chân lý duy nhất (Single Source of Truth) · Tối ưu cho AI & Con người.

---

## 🗺️ 1. Bản đồ Tra cứu Nhanh: "Bạn đang cần gì?"

Bảng dưới đây giúp bạn và Trợ lý AI định vị chính xác tài liệu cần mở trong vòng 30 giây:

| Mục đích công việc / Câu hỏi cần trả lời | Tài liệu cần mở ngay |
| :--- | :--- |
| 🚀 **Xem hôm nay ai làm gì, tiến độ sprint và các bug cần sửa?** | ➔ [**`DASHBOARD.md`**](DASHBOARD.md) *(Bảng điều hành trung tâm)* |
| 📖 **Tìm hiểu bản chất đề tài, 5 Actor và 7 luồng nghiệp vụ gốc?** | ➔ [**`TOPIC.md`**](TOPIC.md) *(Chân lý nghiệp vụ cao nhất)* |
| 📋 **Tra cứu User Story, Acceptance Criteria (AC) hoặc Phân rã Use Case?** | ➔ [**`USER-STORIES-AND-USE-CASES.md`**](USER-STORIES-AND-USE-CASES.md) |
| 💰 **Kiểm tra công thức tính cọc, giá thuê, phí phạt quá hạn, hoàn tiền?** | ➔ [**`BUSINESS-RULES.md`**](BUSINESS-RULES.md) *(Bảng thông số & Quy tắc)* |
| 🔌 **Lập trình Backend: xem REST endpoints, request/response body, mã lỗi?** | ➔ [**`API-SPEC.md`**](API-SPEC.md) *(Hợp đồng API chuẩn)* |
| 🗄️ **Lập trình Database: xem cấu trúc bảng, kiểu dữ liệu, quan hệ khóa ngoại?** | ➔ [**`DATA-DICTIONARY.md`**](DATA-DICTIONARY.md) *(Từ điển dữ liệu CSDL)* |
| 🎨 **Lập trình Frontend: xem bảng màu, typography, responsive, token layout?** | ➔ [**`UI-DESIGN-SYSTEM.md`**](UI-DESIGN-SYSTEM.md) *(Hệ thống giao diện)* |
| 📐 **Quy chuẩn kỹ thuật: đặt tên package, biến, hàm, chuẩn REST API?** | ➔ [**`CONVENTIONS.md`**](CONVENTIONS.md) *(Quy ước kỹ thuật)* |
| 🗓️ **Tra cứu mã nhiệm vụ (`T1.1` → `T5.x`), rủi ro và khung kế hoạch 10 tuần?** | ➔ [**`PLAN.md`**](PLAN.md) *(Khung kế hoạch tổng thể)* |

---

## 📚 2. Phân tầng Kiến trúc Tài liệu (3 Tầng Cốt lõi)

Hệ thống tài liệu được tổ chức thành 3 tầng phân cấp rõ ràng, triệt tiêu sự chồng chéo:

```
┌────────────────────────────────────────────────────────────────────────┐
│              TẦNG 1: VẬN HÀNH & BỘ NHỚ LÀM VIỆC (Lớp Sống)            │
│  • DASHBOARD.md  : Bảng điều hành realtime, issue/bug 3 dòng, 4 Trục  │
│  • PLAN.md       : Khung kế hoạch tổng thể, tra cứu mã task T*.*      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ tham chiếu nghiệp vụ
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             TẦNG 2: CHÂN LÝ NGHIỆP VỤ & ĐẶC TẢ YÊU CẦU                 │
│  • TOPIC.md                     : 5 Actor, 27 mã yêu cầu, 7 Luồng gốc  │
│  • USER-STORIES-AND-USE-CASES.md: Toàn bộ User Stories & Use Cases     │
│  • BUSINESS-RULES.md            : Quy định BR-*, tham số & công thức   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ cụ thể hóa kỹ thuật
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              TẦNG 3: HỢP ĐỒNG KỸ THUẬT & THỰC THI (Code Contracts)     │
│  • API-SPEC.md        : Hợp đồng REST API giữa Backend và Frontend     │
│  • DATA-DICTIONARY.md : Schema CSDL thực tế (đồng bộ Flyway migration) │
│  • UI-DESIGN-SYSTEM.md: Design tokens & Component styling cho React    │
│  • CONVENTIONS.md     : Quy tắc đặt tên và tiêu chuẩn mã nguồn         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚖️ 3. Ba Quy tắc Vàng Quản lý & Vận hành Tài liệu

Để tài liệu không bị "chết" hay lệch pha so với mã nguồn thực tế, mọi thành viên và Trợ lý AI bắt buộc tuân thủ:

### Quy tắc 1: Mã nguồn và Tài liệu luôn song hành (Code & Docs in Sync)
* **Khi có migration CSDL mới (`V...__*.sql`):** Bắt buộc cập nhật ngay các cột, bảng hoặc ràng buộc mới vào [**`DATA-DICTIONARY.md`**](DATA-DICTIONARY.md) trong cùng một Pull Request.
* **Khi bổ sung hoặc sửa đổi REST Endpoint:** Cập nhật ngay request/response vào [**`API-SPEC.md`**](API-SPEC.md).

### Quy tắc 2: Kỷ luật Sổ Issue 3 Dòng trên `DASHBOARD.md`
* Không ghi chép vấn đề dài dòng. Mỗi bug hoặc vấn đề phát sinh chỉ ghi tối đa 30 từ:
  $$\text{Mã Issue} \longrightarrow \text{Hiện tượng cốt lõi} \longrightarrow \text{Hướng xử lý} \longrightarrow \text{Người phụ trách} \longrightarrow \text{Trạng thái}$$
* Khi lỗi được sửa xong, đổi trạng thái sang `RESOLVED` kèm mã PR/commit.

### Quy tắc 3: Tuân thủ Chuẩn mực User Story & Acceptance Criteria
* Mọi User Story mới phải nối tiếp vào cuối nhóm chức năng trong [**`USER-STORIES-AND-USE-CASES.md`**](USER-STORIES-AND-USE-CASES.md) (tuyệt đối không đánh số lại mã cũ).
* Bắt buộc viết Acceptance Criteria theo chuẩn **Given - When - Then**, và mỗi story **bắt buộc phải có ít nhất 1 nhánh ngoại lệ / thất bại (Negative Path)** để phục vụ viết Test tự động.

---

## 🗃️ 4. Cấu trúc Thư mục & Khu vực Lưu trữ

```
docs/
├── README.md                      # File này: Cổng điều hướng tài liệu toàn dự án
├── DASHBOARD.md                   # Bảng điều hành trung tâm (Cập nhật thường xuyên)
├── USER-STORIES-AND-USE-CASES.md  # Tài liệu hợp nhất: Quy tắc, Stories & Use Cases
├── TOPIC.md                       # Chân lý nghiệp vụ gốc
├── BUSINESS-RULES.md              # Bảng quy tắc nghiệp vụ chi tiết (BR-*)
├── API-SPEC.md                    # Hợp đồng REST API Backend - Frontend
├── DATA-DICTIONARY.md             # Từ điển cấu trúc CSDL Flyway
├── UI-DESIGN-SYSTEM.md            # Quy chuẩn thiết kế giao diện
├── CONVENTIONS.md                 # Quy chuẩn kỹ thuật viết mã
├── PLAN.md                        # Khung kế hoạch tổng thể 10 tuần
│
├── diagrams/                      # Sơ đồ Activity Diagrams trực quan (.drawio)
├── testing/                       # Kế hoạch & Danh mục Test Cases chi tiết theo flow
├── superpowers/                   # Kế hoạch chi tiết của các đợt triển khai (Plans)
└── _archive/                      # Thư mục lưu trữ: Chứa toàn bộ tài liệu & sơ đồ cũ
                                   # (Bảo toàn lịch sử dự án, không làm rác thư mục chính)
```

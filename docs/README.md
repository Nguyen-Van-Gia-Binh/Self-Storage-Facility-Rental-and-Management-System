# Cổng Điều hướng Tài liệu Toàn dự án (Documentation Master Hub)

> **Self-Storage Facility Rental and Management System (SWP391)**  
> **Ngăn xếp công nghệ:** Spring Boot 3 (Java 17 LTS) · React 18 (TypeScript + Vite) · SQL Server 2022 · Flyway · JWT  
> **Tôn chỉ quản lý:** Tinh gọn (Lean) · Kiến trúc 3 Tầng Chuẩn Công Nghiệp · Một Nguồn Chân Lý Duy Nhất (Single Source of Truth).

---

## 🏛️ KIẾN TRÚC PHÂN TẦNG TÀI LIỆU DỰ ÁN (3-TIER DOCUMENTATION STACK)

Toàn bộ hệ thống tài liệu phục vụ bảo vệ đồ án và vận hành kỹ thuật được chuẩn hóa thành **3 Tầng Phân Cấp Khép Kín**:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                     TẦNG 1: VẬN HÀNH & QUẢN TRỊ (OPERATIONAL LAYER)                              │
│  "Quy trình làm việc chuyên nghiệp, tiến độ minh bạch, triệt tiêu xung đột mã nguồn"             │
│  • DASHBOARD.md : Sổ Issue 3 dòng, tiến độ sprint 4 Workstreams, bộ nhớ làm việc duy nhất       │
│  • PLAN.md      : Khung kế hoạch 10 tuần, mã task tổng thể T*.*, ma trận phân quyền & rủi ro      │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │ tham chiếu yêu cầu
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   TẦNG 2: NGHIỆP VỤ & MIỀN BÀI TOÁN (DOMAIN & BUSINESS LAYER)                    │
│  "Chân lý bài toán không thể bàn cãi: 5 Actor, 27 mã chức năng, luật kinh doanh chuẩn hóa"        │
│  • TOPIC.md                   : Chân lý gốc, 5 Actor, 27 mã yêu cầu SC/FS/FM/BM/SA, 7 luồng      │
│  • USER-STORIES-AND-USE-CASES : 27 User Stories (Given-When-Then) & Phân rã Use Case F1..F7, SYS │
│  • BUSINESS-RULES.md          : Quy tắc BR-*, bảng tham số tài chính phạt/cọc/hoàn tiền          │
│  • DEFENSE-SPECIFICATION.md   : Sơ đồ Swimlane liên làn, Statechart thực thể, ma trận bảo vệ     │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │ hiện thực hóa mã nguồn
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   TẦNG 3: KỸ THUẬT & THỰC THI (TECHNICAL & EXECUTION LAYER)                      │
│  "Hợp đồng công nghệ vững chắc: Traceability 1-1 từ Giao diện ➔ API ➔ Service ➔ Database"        │
│  • WORKFLOWS.md       : Luồng kỹ thuật End-to-End (UI ➔ Controller ➔ Service ➔ DB ➔ Cron Job)    │
│  • API-SPEC.md        : Hợp đồng REST API Backend - Frontend (Endpoints, Request/Response, Mã lỗi)│
│  • DATA-DICTIONARY.md : Cấu trúc bảng CSDL (Flyway Migration), khóa ngoại, chỉ mục, enum types   │
│  • CONVENTIONS.md     : Chuẩn convention code Java/React, quy tắc commit tiếng Việt, package     │
│  • UI-DESIGN-SYSTEM.md: Design tokens, bảng màu UI, component styling cho React                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📑 BẢN ĐỒ CHI TIẾT TỪNG TẦNG TÀI LIỆU

### 🟢 Tầng 1: Vận hành & Quản trị (Operational Layer)
* **Ý nghĩa:** Chứng minh với Hội đồng phương pháp làm việc chuẩn Agile/Scrum của nhóm: có kế hoạch phân bổ, theo dõi task chặt chẽ và cơ chế phối hợp không xung đột giữa 4 Workstreams.

| Tài liệu | Vai trò cốt lõi | Nội dung chính |
| :--- | :--- | :--- |
| [**`docs/DASHBOARD.md`**](DASHBOARD.md) | **Bộ nhớ làm việc duy nhất** | • Sổ theo dõi Issue 3 dòng (Mã ➔ Hiện tượng ➔ Xử lý ➔ PIC ➔ Trạng thái)<br>• Tiến độ sprint 4 Workstreams (WS1: Customer, WS2: Staff, WS3: Facility, WS4: BOM)<br>• Trọng tâm kiểm thử và lỗi hệ thống cần khắc phục |
| [**`docs/PLAN.md`**](PLAN.md) | **Kế hoạch triển khai tổng thể** | • Lộ trình 10 tuần (5 giai đoạn)<br>• Mã task tổng thể `T1.1` → `T5.x`<br>• Quy tắc Zero-Conflict & Branching strategy chuẩn Git Flow<br>• Bản đồ độ phủ 27 mã yêu cầu chức năng |

---

### 🔵 Tầng 2: Nghiệp vụ & Miền bài toán (Domain & Business Layer)
* **Ý nghĩa:** Trọng tâm trả lời các câu hỏi nghiệp vụ của Thầy Cô. Cung cấp căn cứ định lượng (công thức, tham số) và trực quan (Statechart, Swimlane) cho toàn bộ quy trình kho tự quản.

| Tài liệu | Vai trò cốt lõi | Nội dung chính |
| :--- | :--- | :--- |
| [**`docs/TOPIC.md`**](TOPIC.md) | **Chân lý nghiệp vụ cao nhất** | • 5 Nhóm tác nhân (`SC`, `FS`, `FM`, `BM`, `SA`)<br>• 27 Mã chức năng nghiệp vụ<br>• Phạm vi 7 luồng nghiệp vụ chính và thuật ngữ miền (Glossary) |
| [**`docs/USER-STORIES-AND-USE-CASES.md`**](USER-STORIES-AND-USE-CASES.md) | **Đặc tả Yêu cầu hợp nhất** | • 27 User Stories chuẩn format (Given - When - Then) có đầy đủ Happy Path & Negative Path<br>• Phân rã Use Cases chi tiết (`UC-F1-*` .. `UC-F7-*`, `UC-SYS-*`) |
| [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md) | **Quy tắc nghiệp vụ chi tiết** | • Mã hóa quy tắc: `BR-DEP-*` (Cọc), `BR-PRI-*` (Giá), `BR-OVD-*` (Quá hạn), `BR-RET-*` (Nghiệm thu hoàn cọc)<br>• Bảng tham số tài chính cố định (Parameter Table) |
| [**`docs/DEFENSE-SPECIFICATION.md`**](DEFENSE-SPECIFICATION.md) | **Hồ sơ Đặc tả Bảo vệ Đồ án** | • Sơ đồ Swimlane liên làn khép kín từng luồng<br>• Biểu đồ máy trạng thái (Statechart: Contract, Reservation, Unit, PIN, Ticket)<br>• Ma trận `| Func | Rules |` và ví dụ tính toán tài chính thực tế |
| [**`docs/DEFENSE-EXAMINATION-CRITIQUE.md`**](DEFENSE-EXAMINATION-CRITIQUE.md) | **Cẩm nang Phản biện & Câu hỏi Sát thủ Hội đồng** | • Đánh giá độc lập 7 luồng theo 4 lăng kính: Edge Cases, Pháp lý/Dòng tiền, Concurrency, Câu hỏi sát thủ của Giảng viên Phản biện Trưởng |
| [**`docs/GAP-ANALYSIS-UNIT-ALLOCATION-REDESIGN.md`**](GAP-ANALYSIS-UNIT-ALLOCATION-REDESIGN.md) | **Báo cáo Rà soát Tái cấu trúc Phân bổ Ô kho** | • Bảng đối chiếu lệch pha 24 mục chi tiết As-Is vs To-Be trên 7 tài liệu đặc tả, CSDL và API |

---

### 🟠 Tầng 3: Kỹ thuật & Thực thi (Technical & Execution Layer)
* **Ý nghĩa:** Chứng minh năng lực lập trình và sự chuyên nghiệp trong triển khai: khả năng truy vết 1-1 từ nút bấm UI đến từng dòng code backend và lệnh SQL trong database.

| Tài liệu | Vai trò cốt lõi | Nội dung chính |
| :--- | :--- | :--- |
| [**`docs/WORKFLOWS.md`**](WORKFLOWS.md) | **Bản đồ Luồng đi Kỹ thuật** | • Luồng End-to-End: Frontend UI ➔ Controller ➔ Service ➔ Repository / DB ➔ Scheduled Cron Jobs<br>• Phân tích song song Happy Path và Unhappy / Exception Cases<br>• Bảng tra cứu nhanh mã nguồn (Quick Code Index) |
| [**`docs/API-SPEC.md`**](API-SPEC.md) | **Hợp đồng REST API** | • Đặc tả chi tiết từng endpoint: HTTP Method, URL, Header JWT, Request DTO, Response Body, Mã HTTP (200, 201, 400, 404, 409) |
| [**`docs/DATA-DICTIONARY.md`**](DATA-DICTIONARY.md) | **Từ điển Cấu trúc CSDL** | • Đồng bộ 100% với Flyway Migration (`V1`..`V45`)<br>• Mô tả chi tiết kiểu dữ liệu, khóa chính, khóa ngoại, chỉ mục (Index) và enum constraints |
| [**`docs/CONVENTIONS.md`**](CONVENTIONS.md) | **Quy chuẩn Kỹ thuật Mã nguồn** | • Quy chuẩn cấu trúc package, đặt tên hàm, biến, Interface/Impl<br>• Chuẩn Conventional Commits tiếng Việt |
| [**`docs/UI-DESIGN-SYSTEM.md`**](UI-DESIGN-SYSTEM.md) | **Hệ thống Giao diện** | • Bảng mã màu tokens, typography, layout responsive, icons và style components cho React |

---

## 🗺️ BẢNG TRA CỨU NHANH CHO HỘI ĐỒNG THẦY CÔ & NHÓM PHÁT TRIỂN

| Câu hỏi cần trả lời ngay khi Bảo vệ / Lập trình | Mở tài liệu nào? | Tầng |
| :--- | :--- | :---: |
| 📌 **Xem phân công ai làm task gì, tiến độ sprint và danh sách bug?** | ➔ [**`docs/DASHBOARD.md`**](DASHBOARD.md) & [**`docs/PLAN.md`**](PLAN.md) | **Tầng 1** |
| 📌 **Hội đồng hỏi 5 Actor và 27 chức năng hệ thống gồm những gì?** | ➔ [**`docs/TOPIC.md`**](TOPIC.md) | **Tầng 2** |
| 📌 **Hội đồng hỏi chi tiết kịch bản kiểm thử Given-When-Then?** | ➔ [**`docs/USER-STORIES-AND-USE-CASES.md`**](USER-STORIES-AND-USE-CASES.md) | **Tầng 2** |
| 📌 **Hội đồng hỏi công thức phạt quá hạn, tính cọc, điều kiện hoàn tiền?** | ➔ [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md) | **Tầng 2** |
| 📌 **Hội đồng hỏi sơ đồ Swimlane liên làn và vòng đời trạng thái kho/hợp đồng?** | ➔ [**`docs/DEFENSE-SPECIFICATION.md`**](DEFENSE-SPECIFICATION.md) | **Tầng 2** |
| 📌 **Chuẩn bị trả lời các câu hỏi hóc búa, bẫy pháp lý, edge cases của Hội đồng?** | ➔ [**`docs/DEFENSE-EXAMINATION-CRITIQUE.md`**](DEFENSE-EXAMINATION-CRITIQUE.md) | **Tầng 2** |
| 📌 **Hội đồng chỉ vào nút bấm UI và hỏi hàm/controller nào xử lý?** | ➔ [**`docs/WORKFLOWS.md` § 12**](WORKFLOWS.md#12-bảng-tra-cứu-nhanh-mã-nguồn-quick-code-index) | **Tầng 3** |
| 📌 **Kiểm tra hợp đồng dữ liệu REST API (Request/Response DTO)?** | ➔ [**`docs/API-SPEC.md`**](API-SPEC.md) | **Tầng 3** |
| 📌 **Kiểm tra cấu trúc bảng database, kiểu dữ liệu và khóa ngoại?** | ➔ [**`docs/DATA-DICTIONARY.md`**](DATA-DICTIONARY.md) | **Tầng 3** |

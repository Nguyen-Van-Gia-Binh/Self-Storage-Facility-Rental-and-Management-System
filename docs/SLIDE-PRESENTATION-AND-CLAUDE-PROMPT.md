# TÀI LIỆU TOÀN DIỆN: NGỮ CẢNH DỰ ÁN & SIÊU PROMPT TẠO SLIDE CHO CLAUDE
> **Dự án:** Self-Storage Facility Rental and Management System (SWP391 - FPT University Fall 2026)  
> **Thời lượng thuyết trình:** 5 phút Slide (4 Slides) + 25 - 30 phút Demo trực tiếp (5 Actors)

---

## MỤC LỤC TÀI LIỆU
1. **[PHẦN 1] BỘ NGỮ CẢNH DỰ ÁN TOÀN DIỆN (DEEP PROJECT CONTEXT)**
   - 1.1. Thông tin chung & Đội ngũ phát triển (Team & Roles)
   - 1.2. Bối cảnh & Lý do hình thành (Context & The "WHY?")
   - 1.3. Giải pháp: Đối tượng & Tính năng (What & Who & Core Features)
   - 1.4. Điểm sáng Nghiệp vụ & Kỹ thuật độc quyền (Unique Innovations)
   - 1.5. Ngăn xếp Công nghệ & Kiến trúc (Tech Stack & Architecture)
   - 1.6. Kịch bản Demo chi tiết 25–30 phút (End-to-End Demo Script)
2. **[PHẦN 2] SIÊU PROMPT DÀNH CHO CLAUDE (MASTER PROMPT FOR CLAUDE)**
   - Copy-paste trực tiếp toàn bộ khối prompt này vào Claude để sinh Slide đỉnh cao.

---

# PHẦN 1: BỘ NGỮ CẢNH DỰ ÁN TOÀN DIỆN (DEEP PROJECT CONTEXT)

### 1.1. Thông tin chung & Đội ngũ phát triển
- **Tên đề tài (Tiếng Anh):** Self-Storage Facility Rental and Management System
- **Tên đề tài (Tiếng Việt):** Hệ thống Nền tảng Quản lý & Cho thuê Kho Lưu trữ Tự phục vụ Thông minh
- **Môn học:** SWP391 — Đồ án Kỹ thuật Phần mềm (Chuyên ngành SE, Đại học FPT TP.HCM, Fall 2026)
- **Quy mô dự án:** 10 tuần phát triển qua 5 giai đoạn (P1 → P5), 4 thành viên Fullstack theo mô hình **Vertical Slice / Feature-Driven Development (4 Workstreams độc lập)**:
  1. **Nguyễn Văn Gia Bình** (Technical Lead / Workstream 2): Phụ trách **Cơ sở, Kho & Vận hành** (Flow 2: Lễ tân Check-in & Bàn giao 4 tiêu chí; Flow 3: Quản lý vòng đời hợp đồng, Nghiệm thu trả kho & Hoàn cọc).
  2. **Nguyễn Phạm Xuân Nhi** (Workstream 1): Phụ trách **Khách hàng & Đặt chỗ** (Flow 1: Sơ đồ mặt bằng 2D trực quan, Đặt chỗ kho giữ capacity; Flow 6.1: Cổng khách hàng My Units & Gia hạn trực tuyến).
  3. **Huỳnh Nhật** (Workstream 3): Phụ trách **Tài chính & Tự động hóa** (Flow 4: Bảng giá động BOM, Biểu phụ phí dịch vụ, Báo cáo doanh thu toàn hệ thống; Flow 6.2: Schedulers tự động tính phạt nợ quá hạn 3 giai đoạn).
  4. **Lê Thanh Tùng** (Workstream 4): Phụ trách **Quản trị & Điều phối** (Flow 5: Điều phối ca trực nhân sự FM; Flow 7: Trung tâm xử lý sự cố kỹ thuật 2 nhánh; Identity & Phân quyền bảo mật cô lập đa cơ sở SA-03).

---

### 1.2. Bối cảnh & Lý do hình thành (Context & The "WHY?")
#### 🏙️ Bối cảnh thị trường (The Context):
- **Đô thị hóa nhanh chóng tại Việt Nam:** Diện tích căn hộ chung cư tại các đô thị lớn (TP.HCM, Hà Nội) ngày càng thu hẹp (50m² - 70m²), không gian sống gia đình bị quá tải đồ đạc theo mùa, đồ kỷ niệm.
- **Sự bùng nổ của Thương mại điện tử (E-Commerce) & Doanh nghiệp SME/Startup:** Nhu cầu lưu kho tài liệu, hàng mẫu, hàng tồn kho ngắn hạn tăng vọt nhưng chi phí thuê kho logistics truyền thống quá đắt đỏ và yêu cầu diện tích quá lớn.
- **Mô hình Self-Storage (Kho tự quản mini):** Khách hàng thuê ô kho cá nhân có diện tích linh hoạt (từ 1m² đến 20m²), tự khóa, tự quản lý và tiếp cận 24/7.

#### ❌ Nỗi đau thực tế trước khi có hệ thống (The "WHY?"):
1. **Đối với Khách hàng:**
   - Mù mờ thông tin: Phải gọi điện thoại hỏi từng cơ sở xem còn kho trống không, kích thước thế nào, giá cả không minh bạch.
   - Thủ tục rườm rà: Ký hợp đồng giấy tận nơi trong giờ hành chính, đặt cọc giữ chỗ thiếu an toàn, thanh toán thủ công.
   - Bất tiện truy cập: Phải phụ thuộc giờ mở cửa của nhân viên, dễ quên hạn hợp đồng dẫn đến mất tiền cọc.
2. **Đối với Doanh nghiệp vận hành (Nhân viên, Quản lý, Chủ chuỗi kho):**
   - Rủi ro đặt trùng (Double Booking): Quản lý kho bằng sổ sách / Excel rời rạc dẫn đến cấp trùng ô kho.
   - Bàn giao lỏng lẻo: Không có biên bản hiện trạng rõ ràng, dễ xảy ra tranh chấp hư hỏng hoặc mất mát khi trả kho.
   - Tranh chấp sự cố: Khi kho bị ngấm nước, ẩm mốc hoặc kẹt khóa, không phân định được lỗi do cơ sở hay do khách, gây mất uy tín.
   - Rủi ro nợ xấu & "Bỏ kho": Khách quá hạn không trả phí nhưng doanh nghiệp không có cơ chế cưỡng chế và xử lý tài sản đúng pháp luật.
   - Quản trị chuỗi mù mờ: BOM không nắm được doanh thu thuần thực tế, tỷ lệ lấp đầy (occupancy rate) giữa các chi nhánh để điều chỉnh giá kịp thời.

---

### 1.3. Giải pháp: Đối tượng & Tính năng (What & Who & Core Features)
Hệ thống giải quyết toàn diện bằng **nền tảng Web Portal tích hợp số hóa 100% vòng đời dịch vụ** phục vụ **5 nhóm tác nhân (Actors)** với **27 mã yêu cầu chức năng chuẩn**:

#### 1. Storage Customer (Khách thuê kho — `/customer/*`):
- `SC-01`: Tra cứu trực quan mặt bằng 2D, kích thước (dài × rộng × cao), thể tích (m³), giá niêm yết theo từng cơ sở.
- `SC-02`: Đặt chỗ kho giữ chỗ tức thì có đệm an toàn 15 ngày gối đầu chống xung đột (`BR-RES-05`).
- `SC-03`: Thanh toán tích hợp cổng thanh toán trực tuyến / VietQR động đối soát tức thời.
- `SC-04`: Thẻ nhận kho điện tử (Move-in Pass) kèm mã PIN số thông minh mở cửa 24/7.
- `SC-05`: Quản lý kho cá nhân (My Units), theo dõi hợp đồng điện tử 4 điều khoản pháp lý, gia hạn trực tuyến.
- `SC-06`: Gửi phiếu yêu cầu hỗ trợ / báo cáo sự cố kèm hình ảnh camera hiện trường.

#### 2. Facility Staff (Nhân viên vận hành — `/staff/*`):
- `FS-01`: Tiếp đón khách hàng nhận kho theo mã đặt chỗ / QR Code Move-in Pass.
- `FS-02`: Lập biên bản bàn giao điện tử 4 tiêu chí hiện trường (`BR-CHK-02`) và cấp mã PIN truy cập.
- `FS-03`: Giám sát và cập nhật trạng thái ô kho thực tế (Trống, Đang thuê, Bảo trì, Chờ bàn giao).
- `FS-04`: Nghiệm thu hiện trường khi khách trả kho, chụp ảnh đối soát và nộp biên bản đánh giá hư hại.
- `FS-05`: Tiếp nhận xử lý sự cố kỹ thuật tại cơ sở (kẹt khóa, chống ẩm, điện chiếu sáng).
- `FS-06`: Bảng điều khiển nhiệm vụ ca trực trong ngày (tích hợp 3 nghiệp vụ Tiếp đón, Nghiệm thu, Sự cố).

#### 3. Facility Manager (Quản lý cơ sở — `/manager/*`):
- `FM-01`: Quản lý sơ đồ ô kho, tầng, vị trí và trạng thái chi tiết của cơ sở phụ trách.
- `FM-02`: Phân bổ và điều chuyển ô kho linh hoạt cho khách hàng.
- `FM-03`: Giám sát hợp đồng thuê, tình trạng đóng cọc, tiền thuê và cảnh báo hạn hợp đồng.
- `FM-04`: Điều hành quy trình trả kho, duyệt biên bản quyết toán hoàn cọc, xử lý thu phí hư hỏng.
- `FM-05`: Phân công nhiệm vụ và lịch trực cho nhân viên cơ sở.
- `FM-06`: Báo cáo tài chính cơ sở (Doanh thu phí thuê, dịch vụ, quá hạn, chi phí cơ sở chịu) & tỷ lệ lấp đầy.

#### 4. Business Operations Manager (Quản lý vận hành kinh doanh — `/bom/*`):
- `BM-01`: Quản lý danh mục toàn bộ chuỗi cơ sở trên cả nước.
- `BM-02`: Thiết lập chính sách thuê thống nhất: hệ số cọc, thời gian ân hạn, khung phạt quá hạn.
- `BM-03`: Cấu hình bảng giá niêm yết theo m², chính sách chiết khấu kỳ hạn (3, 6, 12 tháng) và danh mục biểu phụ phí.
- `BM-04`: Giám sát hiệu quả kinh doanh, tỷ lệ lấp đầy so sánh giữa các chi nhánh.
- `BM-05`: Báo cáo tài chính hợp nhất toàn hệ thống, xuất báo cáo quản trị chuyên sâu.

#### 5. System Administrator (Quản trị hệ thống — `/admin/*`):
- `SA-01`: Quản lý danh sách tài khoản người dùng và thông tin định danh.
- `SA-02`: Phân quyền vai trò (Role-Based Access Control - RBAC).
- `SA-03`: Thiết lập cơ chế cô lập dữ liệu đa cơ sở (Multi-Facility Data Isolation) — Manager & Staff chỉ thấy dữ liệu cơ sở được gán.
- `SA-04`: Giám sát nhật ký hoạt động hệ thống (Audit Logs) và lịch sử đăng nhập bảo mật.

---

### 1.4. Điểm sáng Nghiệp vụ & Kỹ thuật Độc quyền (Unique Innovations)

1. **Vòng đời thuê kho số hóa 100% không giấy tờ:**
   - Từ lúc chọn kho trên sơ đồ 2D đến thanh toán VietQR động và nhận thẻ số Move-in Pass chỉ mất chưa đầy 2 phút.
2. **Khoảng đệm an toàn 15 ngày gối đầu (`BR-RES-05`):**
   - Ngăn chặn triệt để xung đột lịch nhận kho bằng cách tự động đặt khoảng cách tối thiểu giữa ngày hết hạn của hợp đồng cũ và ngày nhận của khách mới, dành thời gian bảo dưỡng, xịt khuẩn.
3. **Biên bản Bàn giao Check-in 4 tiêu chí (`BR-CHK-02`):**
   - Đảm bảo tính minh bạch: Vệ sinh ô kho, Độ kín & Cửa cuốn, Chống ẩm & PCCC, Khóa điện tử IoT.
4. **Cơ chế Điều chuyển Ô kho Bảo lưu 100% Quyền lợi (`BR-AVL-05`, `BR-SUP-02`):**
   - Khi kho gặp sự cố kỹ thuật cần đổi ô kho mới: Hệ thống tự động phát hành **Phụ lục hợp đồng điều chuyển**, chuyển sang ô kho tương đương hoặc tốt hơn nhưng **giữ nguyên 100% đơn giá và tiền cọc ban đầu**.
5. **Quản trị Rủi ro Nợ quá hạn 3 Giai đoạn Nhân văn (`BR-OVD-01..03`):**
   - **D+1 → D+3 (Giai đoạn Ân hạn):** Miễn phạt 100%, gửi thông báo SMS/Email nhắc nhở, mã PIN vẫn hoạt động.
   - **D+4 → D+6 (Giai đoạn Phạt phát sinh):** Phạt lũy tiến 10%/ngày trên tiền cọc (tối đa 30%), mở mã PIN để khách dọn đồ.
   - **D+7 → D+10 (Giai đoạn Cưỡng chế & Khóa cửa):** Tự động khóa mã PIN, phạt tối đa 70% cọc, gửi tối hậu thư niêm phong.
   - **Mốc 23:59 D+10 (Chấm dứt hợp đồng):** Hệ thống tự động hủy hợp đồng, thu hồi cọc và kích hoạt quy trình thanh lý tài sản.
6. **Xử lý Sự cố Phân định Trách nhiệm 2 Nhánh (`BR-SUP-02`):**
   - Lỗi cơ sở: Công ty chịu 100% chi phí.
   - Lỗi khách hàng: Tính phụ phí theo danh mục BOM, khách thanh toán mới được nghiệm thu.

---

### 1.5. Ngăn xếp Công nghệ & Kiến trúc (Tech Stack & Architecture)

#### 🏛️ Kiến trúc tổng thể:
- **Clean Architecture / Layered Architecture:** Controller → Service Layer → Repository → Database.
- **Tách biệt độc lập:** Multi-module Maven Backend & Single Page Application (SPA) React Frontend.
- **Mô hình bảo mật:** Stateless JWT Authentication + Spring Security RBAC + Data Isolation Layer (SA-03).
- **Kiến trúc Cache 2 cấp (TwoLevelCache):** L1 Local Memory (Caffeine) siêu tốc + L2 Distributed Cache (Redis Upstash) đảm bảo tính sẵn sàng cao.

#### 💻 Ngăn xếp Công nghệ chi tiết:
| Phân tầng | Công nghệ sử dụng | Điểm nổi bật & Vai trò |
| :--- | :--- | :--- |
| **Backend Core** | **Java 17 LTS + Spring Boot 3.2.5** | Nền tảng enterprise mạnh mẽ, type-safe, xử lý giao dịch ACID cao cấp |
| **Frontend UI** | **React 19 + TypeScript + Vite** | SPA tốc độ cao, type-safe 100%, giao diện responsive chuẩn Tailwind CSS |
| **Icons & Visuals** | **Lucide React + Tailwind CSS** | Giao diện hiện đại, trực quan, hỗ trợ Donut SVG chart thuần không phụ thuộc lib ngoài |
| **Database** | **PostgreSQL (Neon Cloud Singapore)** | CSDL quan hệ chuẩn ACID, độ trễ mạng thấp (<50ms), mở rộng linh hoạt |
| **Database Migration** | **Flyway (45 Migrations)** | Version control schema CSDL duy nhất, tự động migrate khi triển khai |
| **Cache & Performance** | **Redis (Upstash Cloud) + Caffeine** | Giảm 80% thời gian phản hồi truy vấn sơ đồ kho và bảng giá |
| **Authentication** | **JWT (HS256) + Google OAuth 2.0** | Đăng nhập một chạm an toàn, mã hóa mật khẩu BCrypt |
| **Payment Gateway** | **VietQR / PayOS Banking API** | Sinh mã QR động chuẩn Napas 24/7, tự động callback webhook |
| **CI / CD Pipeline** | **GitHub Actions (`pr-bot.yml`)** | Tự động build, kiểm tra format, chạy test backend/frontend trước khi merge |

---

### 1.6. Kịch bản Demo Chi tiết (25 – 30 Phút)

Một kịch bản câu chuyện liền mạch xuyên suốt 5 diễn viên:

```
[BƯỚC 1: BOM CONFIG (4-5 phút)]
   BOM đăng nhập -> Xem dashboard doanh thu & lấp đầy toàn quốc.
   -> Thiết lập bảng giá theo m² & chương trình chiết khấu kỳ hạn.
   -> Cấu hình chính sách cọc & bảng phụ phí dịch vụ.

[BƯỚC 2: CUSTOMER BOOKING & PAYMENT (5-6 phút)]
   Khách hàng (Nhi) vào Portal -> Xem bản đồ chi nhánh & sơ đồ kho 2D trực quan.
   -> Chọn ô kho A-101 (tầng 1) -> Chọn kỳ hạn 3 tháng -> Hệ thống giữ capacity.
   -> Quét mã VietQR thanh toán tiền cọc & tiền thuê kỳ 1.
   -> Nhận Thẻ số Move-in Pass & Mã PIN 24/7 tức thời.

[BƯỚC 3: STAFF CHECK-IN & BÀN GIAO (5 phút)]
   Khách đến cơ sở -> Nhân viên (Bình) mở "Nhiệm vụ ca trực".
   -> Tiếp đón khách theo Move-in Pass -> Mở biên bản bàn giao 4 tiêu chí.
   -> Chụp ảnh nghiệm thu camera -> Khách ký điện tử -> Hợp đồng chuyển ACTIVE.

[BƯỚC 4: SUPPORT & INCIDENT RELOCATION (5 phút)]
   Khách báo sự cố ô kho bị thấm trần -> Nhân viên kiểm tra, xác nhận lỗi cơ sở.
   -> Quản lý cơ sở (Tùng) duyệt đổi ô kho sang A-102.
   -> Hệ thống tự động sinh Phụ lục điều chuyển ô kho, bảo lưu 100% giá và cọc.
   -> Đổi kho xong -> Ticket sự cố tự động hoàn tất.

[BƯỚC 5: OVERDUE CRONJOB & RETURN SETTLEMENT (5-6 phút)]
   Kích hoạt cronjob mô phỏng hợp đồng quá hạn -> Khách bị tính phạt nợ D+4.
   -> Khách nộp phạt -> Nộp yêu cầu trả kho.
   -> Nhân viên nộp biên bản nghiệm thu trả kho hiện trường.
   -> Quản lý duyệt quyết toán cọc & hoàn tiền.
   -> BOM/Manager xem báo cáo doanh thu cập nhật thời gian thực.
```

---

# PHẦN 2: SIÊU PROMPT DÀNH CHO CLAUDE (MASTER PROMPT FOR CLAUDE)

> 💡 **HƯỚNG DẪN:** Copy toàn bộ nội dung trong khung bên dưới và gửi cho Claude. Claude sẽ tạo ra bài thuyết trình 4 slide chuẩn chỉnh kèm kịch bản thuyết trình (Speaker Notes) 5 phút và hướng dẫn Demo 30 phút.

```markdown
Bạn là một Chuyên gia Kiến trúc Giải pháp Phần mềm (Software Solution Architect) và Chuyên gia Thuyết trình Đồ án Công nghệ cấp cao.

Tôi chuẩn bị bước vào buổi bảo vệ đồ án chuyên ngành SWP391 tại FPT University cho dự án:
"Self-Storage Facility Rental and Management System" (Hệ thống Nền tảng Quản lý & Cho thuê Kho Lưu trữ Tự phục vụ Thông minh).

QUY ĐỊNH BẮT BUỘC TỪ GIẢNG VIÊN:
- Thời lượng thuyết trình Slide: CHÍNH XÁC 5 PHÚT (Không được dài hơn, nội dung phải cô đọng, sắc sảo, đánh thẳng vào trọng tâm).
- Thời lượng Demo trực tiếp hệ thống: 25 ĐẾN 30 PHÚT (Bao quát 5 Tác nhân và 7 Luồng nghiệp vụ).
- Cấu trúc Slide CHÍNH XÁC 4 SLIDE như sau:
  + Slide 1: Intro: Team - Project
  + Slide 2: Problems: WHY ? + Context (Bối cảnh & Nỗi đau thị trường)
  + Slide 3: Solutions (What + Who) (Giải pháp, 5 Actors & Tính năng cốt lõi)
  + Slide 4: Technology + Architecture (Kiến trúc & Ngăn xếp công nghệ)
  ⇒ Sau đó chuyển sang phần DEMO (Kịch bản điều phối 25-30 phút).

DƯỚI ĐÂY LÀ TOÀN BỘ NGỮ CẢNH DỰ ÁN CỦA CHÚNG TÔI:
1. ĐỘI NGŨ PHÁT TRIỂN (4 thành viên Fullstack theo mô hình Vertical Bounded Context):
   - Nguyễn Văn Gia Bình (Tech Lead / Workstream 2): Phụ trách Cơ sở, Kho & Vận hành (Check-in 4 tiêu chí, Vòng đời Hợp đồng, Trả kho & Hoàn cọc).
   - Nguyễn Phạm Xuân Nhi (Workstream 1): Phụ trách Khách hàng & Đặt chỗ (Sơ đồ 2D trực quan, Đặt cọc giữ capacity, Cổng My Units, Gia hạn).
   - Huỳnh Nhật (Workstream 3): Phụ trách Tài chính & Tự động hóa (Bảng giá BOM, Biểu phí, Schedulers quá hạn D+1..D+10, Cổng thanh toán VietQR).
   - Lê Thanh Tùng (Workstream 4): Phụ trách Quản trị & Điều phối (Phân công ca trực FM, Xử lý sự cố 2 nhánh & Đổi kho, Phân quyền bảo mật cô lập đa cơ sở SA-03).

2. BỐI CẢNH & VẤN ĐỀ (Slide 2 - WHY & Context):
   - Bối cảnh: Đô thị hóa, căn hộ chung cư 50-70m² quá tải đồ đạc; Thương mại điện tử SME/Startup cần kho trung chuyển mini linh hoạt 1-20m².
   - Vấn đề thực tế (The Pain Points):
     * Khách hàng: Mù mờ tình trạng kho trống, ký hợp đồng giấy thủ công, thanh toán cọc rủi ro, quên hạn hợp đồng.
     * Cơ sở vận hành: Quản lý bằng Excel/sổ sách gây đặt trùng (Double Booking), bàn giao lỏng lẻo dễ tranh chấp hư hại, không phân định được lỗi sự cố (cơ sở vs khách), không có quy trình thu hồi nợ quá hạn pháp lý.
     * Ban giám đốc (BOM): Mù mờ doanh thu thực tế, không có số liệu tỷ lệ lấp đầy (Occupancy Rate) để tối ưu giá thuê.

3. GIẢI PHÁP & TÍNH NĂNG (Slide 3 - What & Who):
   - Nền tảng số hóa 100% vòng đời thuê kho, phục vụ 5 Actors qua 27 mã yêu cầu chuẩn:
     * Storage Customer (/customer/*): Xem sơ đồ 2D mặt bằng thời gian thực, đặt chỗ với đệm an toàn 15 ngày (BR-RES-05), thanh toán VietQR, nhận thẻ số Move-in Pass & mã PIN 24/7, xem hợp đồng online, gia hạn, gửi ticket sự cố.
     * Facility Staff (/staff/*): Tiếp đón tại quầy, lập biên bản bàn giao điện tử 4 tiêu chí (BR-CHK-02), kiểm tra nghiệm thu trả kho, xử lý sự cố hiện trường trên 1 tab ca trực duy nhất.
     * Facility Manager (/manager/*): Quản lý mặt bằng kho, phân bổ ô kho, điều chuyển ô kho bảo lưu 100% quyền lợi khách hàng (BR-AVL-05, BR-SUP-02), phân công ca trực, duyệt hoàn cọc.
     * Business Operations Manager (/bom/*): Bảng giá m² động, chiết khấu kỳ hạn, danh mục phụ phí, biểu đồ Donut doanh thu, so sánh tỷ lệ lấp đầy toàn quốc.
     * System Administrator (/admin/*): Quản lý tài khoản, RBAC, cô lập dữ liệu đa cơ sở (SA-03), Audit Logs an ninh.

4. CÔNG NGHỆ & KIẾN TRÚC (Slide 4 - Tech & Architecture):
   - Kiến trúc phân lớp hướng đối tượng (Layered Architecture): Controller -> Service -> Repository -> Database.
   - Backend: Java 17 LTS, Spring Boot 3.2.5, Spring Security JWT, Multi-Facility Data Isolation (@AuthenticationPrincipal).
   - Frontend: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, SVG Charts thuần.
   - CSDL & Lưu trữ: PostgreSQL 16 (Neon Cloud Singapore, latency <50ms), Flyway 45 migrations.
   - Hiệu năng & Mở rộng: Cache 2 cấp (L1 Caffeine in-memory + L2 Redis Upstash distributed), VietQR / PayOS Banking API.
   - CI/CD: GitHub Actions (pr-bot.yml) tự động test & kiểm tra chuẩn commit/branch.

YÊU CẦU ĐẦU RA BẠN CẦN THỰC HIỆN CHO TÔI:
1. Soạn thảo chi tiết 4 SLIDE THUYẾT TRÌNH (Trình bày dưới dạng nội dung Slide trực quan, có cấu trúc Header, Bullet Points ngắn gọn, Callout Box ấn tượng, số liệu biết nói).
2. Viết KỊCH BẢN THUYẾT TRÌNH CHI TIẾT (SPEAKER NOTES) CHO TỪNG SLIDE:
   - Căn đúng tổng thời gian nói = 5 PHÚT (Slide 1: 45s, Slide 2: 75s, Slide 3: 90s, Slide 4: 90s).
   - Giọng điệu chuyên nghiệp, tự tin, hấp dẫn như một Tech Startup thuyết trình trước nhà đầu tư và hội đồng giám khảo.
3. KỊCH BẢN ĐIỀU PHỐI DEMO 25 - 30 PHÚT:
   - Chia thành 5 màn trình diễn tương ứng 5 Actors.
   - Chỉ rõ từng thao tác click chuột, tài khoản đăng nhập, điểm nhấn kỹ thuật cần nhấn mạnh để hội đồng chấm điểm tối đa.
```

---

*Tài liệu này được biên soạn độc quyền cho đồ án SWP391 - FPT University Fall 2026. Mọi số liệu, mã yêu cầu và quy tắc kinh doanh đều khớp 100% với tài liệu đặc tả [docs/TOPIC.md](TOPIC.md), [docs/BUSINESS-RULES.md](BUSINESS-RULES.md) và [docs/WORKFLOWS.md](WORKFLOWS.md).*


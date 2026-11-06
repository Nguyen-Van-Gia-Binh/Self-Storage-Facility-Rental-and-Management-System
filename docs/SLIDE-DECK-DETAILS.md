# BỘ NỘI DUNG SLIDE & KỊCH BẢN THUYẾT TRÌNH (SLIDE CONTENT & SPEAKER NOTES)
> **Đồ án:** Self-Storage Facility Rental and Management System (SWP391 — FPT University Fall 2026)  
> **Thời lượng phân bổ:** Thuyết trình Slide: **5 phút** + Demo trực tiếp: **25 – 30 phút**  
> **Phạm vi phân công:** Slide 3 (Solutions: What & Who) & Slide 4 (Technology + Architecture)

---

## MỤC LỤC
1. [Cấu trúc Tổng quan Bài Thuyết trình (Presentation Overview)](#1-cấu-trúc-tổng-quan-bài-thuyết-trình)
2. [Slide 1: Intro — Đề tài & Đội ngũ Phát triển](#slide-1-intro--đề-tài--đội-ngũ-phát-triển)
3. [Slide 2: Problems — Bối cảnh & Lý do hình thành (Context & The "WHY?")](#slide-2-problems--bối-cảnh--lý-do-hình-thành)
4. [Slide 3.1: Solution Overview — Hệ sinh thái 5 Tác nhân (What & Who)](#slide-31-solution-overview--hệ-sinh-thái-5-tác-nhân-what--who)
5. [Slide 3.2: Customer Solution — Sơ đồ 2D, VietQR & Thẻ Move-in Pass](#slide-32-customer-solution--sơ-đồ-2d-vietqr--thẻ-move-in-pass)
6. [Slide 3.3: Operations Solution — Bàn giao 4 Tiêu chí & Điều chuyển Ô kho](#slide-33-operations-solution--bàn-giao-4-tiêu-chí--điều-chuyển-ô-kho)
7. [Slide 3.4: Business & Rules — Biểu đồ Donut Doanh thu & Nợ quá hạn 3 giai đoạn](#slide-34-business--rules--biểu-đồ-donut-doanh-thu--nợ-quá-hạn-3-giai-đoạn)
8. [Slide 4.1: Architecture & Security — Kiến trúc Phân tầng & Cô lập Đa cơ sở](#slide-41-architecture--security--kiến-trúc-phân-tầng--cô-lập-đa-cơ-sở)
9. [Slide 4.2: Tech Stack & Quality — Ngăn xếp Công nghệ, CSDL & Kỷ luật CI/CD](#slide-42-tech-stack--quality--ngăn-xếp-công-nghệ-csdl--kỷ-luật-cicd)
10. [Kịch bản Demo Hệ thống Thực tế (25 – 30 phút)](#kịch-bản-demo-hệ-thống-thực-tế-25--30-phút)

---

# 1. CẤU TRÚC TỔNG QUAN BÀI THUYẾT TRÌNH

| Phần | Tiêu đề Slide | Nội dung trọng tâm | Thời lượng nói |
| :--- | :--- | :--- | :--- |
| **Phần 1** | **Slide 1: Intro** | Giới thiệu Đề tài, Tên trường, 4 Thành viên & 4 Trục công việc | ~30 giây |
| **Phần 2** | **Slide 2: Problems** | Bối cảnh đô thị hóa, nhu cầu kho mini & Nỗi đau quy trình thủ công | ~45 giây |
| **Phần 3** | **Slide 3.1: Solution Overview** | Mô hình khép kín 100% không giấy tờ & 5 Tác nhân (27 mã yêu cầu) | ~45 giây |
| | **Slide 3.2: Customer Solution** | Sơ đồ kho 2D, Đệm 15 ngày, VietQR động, Thẻ Move-in Pass & PIN 24/7 | ~45 giây |
| | **Slide 3.3: Operations Solution** | Bàn giao Check-in 4 tiêu chí, Đổi ô kho bảo lưu 100% quyền lợi | ~45 giây |
| | **Slide 3.4: Business & Rules** | Bảng giá m² động, Biểu đồ Donut doanh thu, Xử lý nợ quá hạn D+1..D+10 | ~45 giây |
| **Phần 4** | **Slide 4.1: Architecture & Security**| Layered Architecture, TwoLevelCache (Redis L2), Cô lập dữ liệu SA-03 | ~45 giây |
| | **Slide 4.2: Tech Stack & Quality** | Spring Boot 3, React 19, PostgreSQL Neon, Flyway 45 migrations, CI/CD | ~40 giây |
| **Chuyển giao**| **Transition to Demo** | Mời Hội đồng theo dõi phần Demo trực tiếp qua 5 tài khoản | ~10 giây |
| **Tổng cộng** | **Toàn bộ Slide** | **Căn chuẩn chính xác theo yêu cầu giảng viên** | **~5 PHÚT** |

---

# SLIDE 1: INTRO — ĐỀ TÀI & ĐỘI NGŨ PHÁT TRIỂN

### 🖼️ Bố cục trình bày trên Slide:
* **Tiêu đề lớn:** SELF-STORAGE FACILITY RENTAL AND MANAGEMENT SYSTEM
* **Phụ đề:** Hệ thống Nền tảng Quản lý & Cho thuê Kho Lưu trữ Tự phục vụ Thông minh
* **Thông tin đồ án:** Chuyên ngành Kỹ thuật Phần mềm (SE) — SWP391 — FPT University (Fall 2026)
* **Đội ngũ phát triển (4 Workstreams độc lập):**
  * **Nguyễn Văn Gia Bình:** Technical Lead / Cơ sở, Kho & Vận hành (Xử lý quá hạn & Cronjob Flow 6.2, Vòng đời Hợp đồng, Trả kho & Hoàn cọc).
  * **Nguyễn Phạm Xuân Nhi:** Khách hàng & Đặt chỗ (Sơ đồ mặt bằng 2D, Đặt cọc giữ capacity, Cổng My Units & Gia hạn).
  * **Huỳnh Nhật:** Tài chính & Tự động hóa (Bảng giá BOM, Biểu phụ phí, Báo cáo doanh thu toàn hệ thống, Cổng VietQR).
  * **Lê Thanh Tùng:** Quản trị & Điều phối (Lễ tân Check-in & Bàn giao kho Flow 2, Phân công ca trực FM, Xử lý sự cố 2 nhánh & Đổi kho, Phân quyền cô lập SA-03).

### 🎙️ Lời thoại thuyết trình (Speaker Notes):
> *"Kính thưa quý thầy cô trong Hội đồng giám khảo, em xin đại diện nhóm trình bày đồ án tốt nghiệp chuyên ngành SWP391 với đề tài: **Hệ thống Quản lý và Cho thuê Kho Lưu trữ Tự phục vụ Thông minh (Self-Storage Facility Rental and Management System)**.  
> Đội ngũ phát triển gồm 4 thành viên, vận hành theo mô hình Feature-Driven Development với 4 Trục công việc độc lập: Bạn Gia Bình làm Tech Lead phụ trách vận hành và xử lý quá hạn; Bạn Xuân Nhi phụ trách phân hệ khách hàng và đặt chỗ; Bạn Huỳnh Nhật phụ trách tài chính và báo cáo doanh thu; và Em là Thanh Tùng phụ trách quản trị điều phối, check-in bàn giao và an ninh hệ thống."*

---

# SLIDE 2: PROBLEMS — BỐI CẢNH & LÝ DO HÌNH THÀNH

### 🖼️ Bố cục trình bày trên Slide:
* **Bối cảnh thực tế (Market Context):**
  * Tốc độ đô thị hóa nhanh tại các thành phố lớn khiến căn hộ chung cư (50–70m²) bị quá tải đồ đạc theo mùa.
  * Sự bùng nổ của E-commerce và doanh nghiệp SME/Startup tạo ra nhu cầu lưu kho hàng mẫu, hồ sơ ngắn hạn linh hoạt từ 1m² đến 20m².
* **3 Nỗi đau lớn của mô hình truyền thống (The Core Pains):**
  1. **Khách hàng:** Mù mờ thông tin diện tích/giá cả; quy trình giấy tờ thủ công trong giờ hành chính; rủi ro mất cọc; bất tiện khi ra vào.
  2. **Cơ sở vận hành:** Quản lý sổ sách/Excel dễ đặt trùng (Double Booking); bàn giao lỏng lẻo dễ tranh chấp hư hỏng; sự cố hiện trường không phân định rõ trách nhiệm; rủi ro khách "bỏ kho" quỵt nợ.
  3. **Ban Giám đốc (BOM):** Thiếu số liệu thời gian thực về tỷ lệ lấp đầy (Occupancy Rate) và doanh thu thuần giữa các chi nhánh để tối ưu giá.

### 🎙️ Lời thoại thuyết trình (Speaker Notes):
> *"Tại Việt Nam hiện nay, khi diện tích nhà ở đô thị ngày càng thu hẹp và thương mại điện tử phát triển mạnh, nhu cầu thuê kho tự quản mini (Self-Storage) đang bùng nổ.  
> Tuy nhiên, hầu hết các đơn vị hiện nay vẫn vận hành theo phương thức truyền thống: khách muốn thuê phải gọi điện hỏi từng ô kho, đến tận nơi ký hợp đồng giấy và chuyển khoản thủ công. Về phía doanh nghiệp, việc dùng Excel rời rạc dẫn đến rủi ro đặt trùng kho, bàn giao lỏng lẻo gây tranh chấp tài sản, và đặc biệt là không có cơ chế thu hồi nợ quá hạn chuẩn mực.  
> Đó chính là lý do nhóm em xây dựng nền tảng này để chuyển đổi số toàn diện ngành Self-Storage."*

---

# SLIDE 3.1: SOLUTION OVERVIEW — HỆ SINH THÁI 5 TÁC NHÂN (WHAT & WHO)

### 🖼️ Bố cục trình bày trên Slide:
* **Mô hình vòng đời số hóa 100% không giấy tờ (Zero-Paper Lifecycle):**
  * **Sơ đồ 2D thời gian thực** ➔ **Thanh toán VietQR động** ➔ **Check-in 4 Tiêu chí** ➔ **Truy cập 24/7 bằng Mã PIN** ➔ **Hợp đồng điện tử** ➔ **Nghiệm thu hoàn cọc**.
* **Hệ sinh thái 5 Tác nhân với 27 mã yêu cầu chức năng chuẩn (`docs/TOPIC.md`):**
  * 👤 **Storage Customer (`SC-01..06`):** Khách thuê chủ động đặt chỗ, thanh toán, quản lý kho cá nhân 24/7.
  * 🧑‍💼 **Facility Staff (`FS-01..06`):** Nhân viên lễ tân Check-in, bàn giao hiện trường, nghiệm thu trả kho trên 1 bàn làm việc duy nhất.
  * 👔 **Facility Manager (`FM-01..06`):** Quản lý mặt bằng kho, điều chuyển ô kho, phân công ca trực và giám sát tài chính cơ sở.
  * 🏢 **Business Operations Manager (`BM-01..05`):** Ban giám đốc chuỗi thiết lập bảng giá m², chính sách cọc và báo cáo hợp nhất toàn quốc.
  * 🛡️ **System Administrator (`SA-01..04`):** Quản trị tài khoản, phân quyền vai trò (RBAC) và cô lập dữ liệu đa cơ sở (`SA-03`).

### 🎙️ Lời thoại thuyết trình (Speaker Notes):
> *"Giải pháp của nhóm em là **nền tảng Web Portal tích hợp số hóa 100% toàn bộ vòng đời dịch vụ thuê kho tự phục vụ**.  
> Thay vì dùng giấy tờ, toàn bộ quy trình từ lúc khách xem sơ đồ kho 2D, thanh toán VietQR động, nhận kho bằng mã PIN 24/7, cho tới nghiệm thu hoàn cọc đều diễn ra minh bạch trên hệ thống.  
> Nền tảng phục vụ **5 nhóm tác nhân** thông qua **27 mã yêu cầu nghiệp vụ chuẩn**: từ Khách hàng, Nhân viên cơ sở, Quản lý chi nhánh cho đến Giám đốc kinh doanh chuỗi và Quản trị hệ thống, đảm bảo liên thông dữ liệu không độ trễ."*

---

# SLIDE 3.2: CUSTOMER SOLUTION — SƠ ĐỒ 2D, VIETQR & THẺ MOVE-IN PASS

### 🖼️ Bố cục trình bày trên Slide:
* **1. Sơ đồ mặt bằng 2D trực quan (`SC-01`, `SC-02`):**
  * Khách hàng chọn cơ sở, tầng và vị trí ô kho theo thời gian thực (Real-time Availability).
  * Hiển thị minh bạch kích thước (dài × rộng × cao), thể tích (m³) và đơn giá niêm yết theo từng loại kho.
  * **Thuật toán Đệm an toàn 15 ngày gối đầu (`BR-RES-05`):** Tự động khóa khoảng cách giữa các hợp đồng thuê kế tiếp để cơ sở vệ sinh, khử khuẩn, triệt tiêu lỗi trùng lịch.
* **2. Thanh toán VietQR động & Move-in Pass (`SC-03`, `SC-04`):**
  * **VietQR động:** Tự động sinh mã QR chuẩn Napas 24/7 đối soát mã đơn tức thì, kích hoạt hợp đồng ngay khi nhận tiền cọc.
  * **Thẻ Move-in Pass & Mã PIN 24/7:** Khách nhận Thẻ số điện tử hiển thị mã QR làm thủ tục tại quầy và Mã PIN cá nhân mở khóa kho 24/7.
* **3. Cổng quản lý cá nhân My Units (`SC-05`, `SC-06`):**
  * Hợp đồng điện tử 4 điều khoản pháp lý (hỗ trợ in ấn chuẩn A4).
  * Gia hạn trực tuyến, báo trả kho online và gửi ticket sự cố đính kèm ảnh camera hiện trường.

### 🎙️ Lời thoại thuyết trình (Speaker Notes):
> *"Tại phân hệ Khách hàng, điểm đột phá lớn nhất là **Sơ đồ kho 2D thời gian thực**. Khách hàng có thể tự do xem sơ đồ từng tầng, kích thước chi tiết và thể tích m³.  
> Khi khách đặt chỗ, hệ thống tự động áp dụng thuật toán **Đệm an toàn 15 ngày gối đầu** để ngăn chặn tuyệt đối việc khách mới đến nhận kho khi ô kho cũ chưa kịp vệ sinh bảo dưỡng.  
> Quá trình thanh toán diễn ra trong vài giây thông qua **VietQR động đối soát tự động**. Ngay sau khi cọc thành công, khách nhận ngay **Move-in Pass điện tử** và **Mã PIN mở cửa 24/7**, kèm theo hợp đồng pháp lý trực tuyến minh bạch."*

---

# SLIDE 3.3: OPERATIONS SOLUTION — BÀN GIAO 4 TIÊU CHÍ & ĐIỀU CHUYỂN Ô KHO

### 🖼️ Bố cục trình bày trên Slide:
* **1. Bàn làm việc Ca trực Nhân viên (Staff Desk — `/staff`):**
  * Tinh giản toàn bộ nghiệp vụ hiện trường về **1 tab Ca trực duy nhất (`FS-06`)**: Tiếp đón Check-in, Nghiệm thu trả kho và Xử lý sự cố kỹ thuật.
  * **Biên bản Bàn giao Check-in chuẩn 4 tiêu chí (`BR-CHK-02`):** Đối soát thực tế gồm: Vệ sinh ô kho, Cửa cuốn an toàn, Chống ẩm & PCCC, Khóa điện tử IoT; chụp ảnh lưu vết và ký xác nhận điện tử.
* **2. Điều chuyển Ô kho Bảo lưu 100% Quyền lợi (`FM-02`, `BR-AVL-05`, `BR-SUP-02`):**
  * Khi ô kho gặp sự cố kỹ thuật cần đổi kho khẩn cấp: Quản lý cơ sở thực hiện đổi ô kho tương đương trên hệ thống.
  * Hệ thống tự động sinh **Phụ lục điều chuyển hợp đồng** và **khẳng định giữ nguyên 100% giá thuê và tiền cọc ban đầu** cho khách hàng.
  * **Khóa đóng ticket tự động:** Ticket sự cố đổi kho sẽ bị khóa chặt, tuyệt đối không cho phép đóng (`CLOSED`) cho đến khi Quản lý hoàn tất cấp ô kho mới.
* **3. Nghiệm thu trả kho & Quyết toán cọc:**
  * Nhân viên nộp biên bản nghiệm thu hiện trạng; Quản lý cơ sở đối soát và duyệt hoàn cọc nhanh chóng.

### 🎙️ Lời thoại thuyết trình (Speaker Notes):
> *"Ở phân hệ vận hành hiện trường, nhóm em thiết kế cho Nhân viên cơ sở một **Bàn làm việc ca trực tập trung**. Khi bàn giao kho, nhân viên bắt buộc nghiệm thu theo **Biên bản điện tử 4 tiêu chí chuẩn**: vệ sinh, cửa cuốn, PCCC và khóa điện tử.  
> Về phía Quản lý cơ sở, khi kho bị sự cố kỹ thuật, hệ thống hỗ trợ tính năng **Đổi ô kho bảo lưu quyền lợi**. Quản lý chuyển khách sang ô kho mới nhưng hệ thống tự động sinh Phụ lục hợp đồng giữ nguyên đơn giá và tiền cọc ban đầu.  
> Đặc biệt, ticket sự cố sẽ bị khóa chặt, không cho phép đóng cho đến khi việc đổi kho thực sự hoàn thành."*

---

# SLIDE 3.4: BUSINESS & RULES — BIỂU ĐỒ DONUT DOANH THU & NỢ QUÁ HẠN 3 GIAI ĐOẠN

### 🖼️ Bố cục trình bày trên Slide:
* **1. Quản trị Doanh thu & Bảng giá BOM (`BM-01..05`):**
  * **Bảng giá m² động & Chiết khấu kỳ hạn:** Cấu hình đơn giá thuê theo loại kho, tự động áp dụng chiết khấu khi thuê dài hạn (3, 6, 12 tháng) và danh mục phụ phí dịch vụ.
  * **Biểu đồ Donut phân bổ Nguồn thu:** Trực quan hóa tỷ trọng các dòng tiền (Tiền thuê, Cọc giữ chỗ, Phụ phí dịch vụ, Phạt quá hạn) và chi phí công ty chi trả theo thời gian thực.
  * **Chỉ số Lấp đầy (Usage Rate):** So sánh hiệu suất khai thác mặt bằng giữa các chi nhánh trên toàn quốc.
* **2. Quy trình Quản trị Nợ Quá hạn 3 Giai đoạn Nhân văn (`BR-OVD-01..03`):**
  * 🟡 **D+1 ➔ D+3 (Giai đoạn Ân hạn):** Miễn phạt 100%, gửi thông báo SMS/Email nhắc nợ, duy trì mã PIN mở cửa kho.
  * 🟠 **D+4 ➔ D+6 (Giai đoạn Phạt phát sinh):** Phạt lũy tiến 10%/ngày trên tiền cọc (trần 30%), vẫn mở mã PIN để khách chủ động đến dọn kho hoặc nộp tiền.
  * 🔴 **D+7 ➔ D+10 (Giai đoạn Cưỡng chế & Khóa mã PIN):** Tự động vô hiệu hóa mã PIN, phạt tối đa 70% cọc, gửi thông báo niêm phong khẩn.
  * ⛔ **Mốc 23:59 D+10 (Chấm dứt hợp đồng):** Hệ thống tự động hủy hợp đồng, thu hồi toàn bộ tiền cọc và kích hoạt quy trình thanh lý tài sản tồn đọng.

### 🎙️ Lời thoại thuyết trình (Speaker Notes):
> *"Đối với Ban Giám đốc (BOM), hệ thống cung cấp **Biểu đồ Donut phân tích nguồn thu** thời gian thực, giúp bóc tách rõ ràng doanh thu thuần từ tiền thuê, phụ phí và chi phí sự cố công ty chịu.  
> Một điểm sáng nghiệp vụ lớn của đồ án là cơ chế **Quản trị rủi ro nợ quá hạn 3 giai đoạn nhân văn chạy bằng Scheduler tự động**:  
> Từ D+1 đến D+3 được ân hạn miễn phạt; từ D+4 đến D+6 tính phạt nhẹ nhưng vẫn mở mã PIN để khách có cơ hội dọn đồ; và chỉ khóa an ninh khi bước sang D+7. Đến đúng 23h59 ngày D+10, hợp đồng mới tự động chấm dứt để bảo vệ quyền lợi doanh nghiệp.  
> Quy trình này vừa đảm bảo tính nghiêm minh pháp lý, vừa giữ được sự hài lòng của khách hàng."*

---

# SLIDE 4.1: ARCHITECTURE & SECURITY — KIẾN TRÚC PHÂN TẦNG & CÔ LẬP ĐA CƠ SỞ

### 🖼️ Bố cục trình bày trên Slide:
* **1. Kiến trúc Phân tầng Hướng đối tượng (Layered Architecture):**
  * **Presentation Layer:** React 19 SPA giao tiếp qua RESTful API với chuẩn đóng gói `ApiResponse<T>` và `PageResponse<T>`.
  * **Controller Layer:** Tiếp nhận yêu cầu, kiểm tra tính hợp lệ dữ liệu bằng Jakarta Validation (`@Valid`).
  * **Service Layer:** Xử lý toàn bộ Business Rules, quản lý transaction ACID (`@Transactional`) và lắng nghe sự kiện (`Spring ApplicationEventPublisher`).
  * **Persistence Layer:** Spring Data JPA / Hibernate tương tác với cơ sở dữ liệu quan hệ.
* **2. Kiến trúc Cache 2 cấp độ (TwoLevelCache):**
  * **L1 Cache (In-Memory Caffeine):** Phản hồi siêu tốc trong microsecond tại local node.
  * **L2 Cache (Distributed Redis Upstash Cloud):** Đồng bộ dữ liệu bảng giá và sơ đồ ô kho trống, giảm 80% tải truy vấn xuống CSDL.
* **3. Bảo mật & Cô lập Dữ liệu Đa cơ sở (`SA-03`):**
  * Stateless JWT Authentication (HS256) tích hợp Spring Security.
  * Cơ chế `@AuthenticationPrincipal`: Tự động trích xuất cơ sở mà Quản lý / Nhân viên được phân công, **ngăn chặn triệt để lỗ hổng Header Spoofing / IDOR**. Quản lý chi nhánh nào chỉ thấy dữ liệu chi nhánh đó.

### 🎙️ Lời thoại thuyết trình (Speaker Notes):
> *"Về mặt kỹ thuật, hệ thống được xây dựng theo **Kiến trúc Phân lớp Hướng đối tượng chuẩn Enterprise (Layered Architecture)**, tách biệt hoàn toàn giữa Presentation, Service xử lý nghiệp vụ và Persistence.  
> Để tối ưu hóa hiệu năng khi hàng nghìn khách hàng cùng truy cập sơ đồ kho, nhóm em đã thiết kế kiến trúc **Cache 2 cấp độ (TwoLevelCache)** kết hợp giữa **Caffeine L1** trong bộ nhớ và **Redis Upstash L2** phân tán.  
> Về bảo mật, hệ thống đáp ứng nghiêm ngặt tiêu chuẩn **SA-03: Cô lập dữ liệu đa cơ sở**. Quản lý hay nhân viên chi nhánh nào chỉ được phép thấy dữ liệu của chi nhánh đó, được mã hóa qua JWT và lọc tự động tại Service layer, chống hoàn toàn nguy cơ rò rỉ dữ liệu giữa các cơ sở."*

---

# SLIDE 4.2: TECH STACK & QUALITY — NGĂN XẾP CÔNG NGHỆ, CSDL & KỶ LUẬT CI/CD

### 🖼️ Bố cục trình bày trên Slide:
* **Ngăn xếp Công nghệ Hiện đại (Fullstack Tech Stack):**
  * ☕ **Backend Core:** Java 17 LTS, Spring Boot 3.2.5, Spring Security JWT, Spring Data JPA.
  * ⚛️ **Frontend UI:** React 19, TypeScript 5+, Vite, Tailwind CSS, Lucide React (SVG Donut Chart thuần).
  * 🐘 **Database:** PostgreSQL 16 Hosted trên Neon Cloud Singapore (độ trễ mạng cực thấp <50ms).
  * 💳 **Payment:** VietQR / PayOS Banking API chuẩn Napas 24/7.
* **Quản trị Schema & Dữ liệu:**
  * **Flyway Migration:** Quản lý tập trung qua **45 file migrations SQL**, đảm bảo tính toàn vẹn và đồng bộ schema qua mọi môi trường triển khai.
* **Kỷ luật Kỹ thuật & Kiểm thử Tự động:**
  * **CI/CD Pipeline (GitHub Actions `pr-bot.yml`):** Tự động kiểm tra quy chuẩn nhánh, định dạng commit tiếng Việt, build test frontend/backend trước khi squash-merge.
  * **Test Suite:** **463+ Unit/Integration Tests Backend** và **68+ Component Tests Vitest Frontend** đạt tỷ lệ xanh **100% Passed**.

### 🎙️ Lời thoại thuyết trình (Speaker Notes):
> *"Về công nghệ cụ thể: Backend sử dụng **Java 17 LTS và Spring Boot 3.2.5** đảm bảo tính ổn định và xử lý giao dịch tài chính chuẩn ACID; Frontend sử dụng **React 19 cùng TypeScript và Vite** cho trải nghiệm SPA mượt mà và an toàn kiểu dữ liệu.  
> Cơ sở dữ liệu được đặt trên **PostgreSQL Neon Singapore** và được quản trị nghiêm ngặt bằng **45 file migration Flyway**.  
> Toàn bộ quá trình phát triển tuân thủ kỷ luật kỹ thuật cao: kiểm thử tự động qua **GitHub Actions CI**, với hơn **460 test backend** và **test Vitest frontend** đều đạt trạng thái xanh 100%.  
> Ngay sau đây, nhóm em xin phép bước vào phần **Demo trực tiếp hệ thống (25 phút)** để minh họa trọn vẹn các tính năng này!"*

---

# KỊCH BẢN DEMO HỆ THỐNG THỰC TẾ (25 – 30 PHÚT)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   LỘ TRÌNH DEMO LIÊN HOÀN 5 ACTORS                     │
│                                                                        │
│  [MÀN 1: BOM] ──► [MÀN 2: CUSTOMER] ──► [MÀN 3: STAFF]                │
│   (4-5 phút)        (5-6 phút)            (5 phút)                     │
│  Thiết lập giá      Sơ đồ 2D, VietQR,    Check-in 4 tiêu chí,          │
│   & chính sách       Move-in Pass, PIN    Bàn giao nhận kho            │
│                                                   │                    │
│                                                   ▼                    │
│  [MÀN 5: CRONJOB] ◄── [MÀN 4: MANAGER & INCIDENT]                      │
│   (5-6 phút)                   (5 phút)                                │
│  Quá hạn D+4, nộp phạt,     Sự cố thấm dột, Đổi ô kho                  │
│  Nghiệm thu hoàn cọc        Bảo lưu 100% quyền lợi                     │
└────────────────────────────────────────────────────────────────────────┘
```

### 🎬 Màn 1: Ban Giám Đốc (BOM) — Thiết Lập Bảng Giá & Báo Cáo Doanh Thu (4–5 phút)
- **Tài khoản:** `bom@selfstorage.com` / `Password123!`
- **Thao tác demo:**
  1. Vào `/bom/revenue` ➔ Giới thiệu **Biểu đồ Donut phân bổ nguồn thu** và tỷ lệ lấp đầy giữa các cơ sở.
  2. Vào `/bom/pricing` ➔ Trình diễn tạo mới hoặc cập nhật đơn giá kho theo m², cấu hình mức chiết khấu kỳ hạn (3, 6, 12 tháng).
  3. Cấu hình bảng phụ phí (bốc xếp, khóa thay thế) ➔ Nhấn mạnh tính linh hoạt theo quy tắc `BM-03`.

### 🎬 Màn 2: Khách Hàng (Customer) — Thuê Kho, VietQR & Nhận Pass (5–6 phút)
- **Tài khoản:** Khách hàng mới hoặc `customer1@gmail.com`
- **Thao tác demo:**
  1. Vào trang chủ ➔ Chọn cơ sở "Tân Bình" ➔ Mở **Sơ đồ mặt bằng 2D**.
  2. Chọn ô kho A-101 ➔ Hệ thống kiểm tra tính sẵn sàng và áp dụng **Đệm an toàn 15 ngày gối đầu**.
  3. Chọn thời hạn thuê 3 tháng ➔ Hệ thống tự động áp chiết khấu BOM vừa cấu hình.
  4. Quét mã **VietQR động** ➔ Mô phỏng webhook thanh toán thành công.
  5. Cổng `/customer/my-units` lập tức hiển thị: Hợp đồng số 4 điều khoản, Thẻ số **Move-in Pass** và **Mã PIN mở cửa 24/7**.

### 🎬 Màn 3: Nhân Viên (Staff) — Tiếp Đón Check-In & Bàn Giao 4 Tiêu Chí (5 phút)
- **Tài khoản:** `staff.tanbinh@selfstorage.com`
- **Thao tác demo:**
  1. Mở phân hệ Staff `/staff` ➔ Chỉ có **1 tab duy nhất: "Nhiệm vụ ca trực"**.
  2. Nhận diện khách theo mã Move-in Pass ➔ Mở màn hình **Check-in bàn giao**.
  3. Thực hiện kiểm tra theo **Biên bản bàn giao 4 tiêu chí điện tử** (Vệ sinh, Cửa cuốn, Chống ẩm/PCCC, Khóa điện tử IoT).
  4. Bật camera chụp ảnh hiện trường thực tế ➔ Khách ký điện tử ➔ Hợp đồng chuyển sang trạng thái `ACTIVE`.

### 🎬 Màn 4: Quản Lý (Manager) — Điều Phối Sự Cố & Đổi Ô Kho Bảo Lưu Quyền Lợi (5 phút)
- **Tài khoản:** `manager.tanbinh@selfstorage.com`
- **Thao tác demo:**
  1. Khách hàng gửi ticket sự cố: "Kho A-101 bị dột trần kỹ thuật".
  2. Staff xác nhận lỗi do cơ sở (Công ty chịu 100% chi phí).
  3. Manager vào `/manager/incidents` ➔ Nhấn nút **"Tiến hành đổi ô kho"** sang ô kho mới A-102.
  4. Trình diễn: Hệ thống tự động phát hành **Phụ lục điều chuyển**, giữ nguyên 100% tiền thuê và cọc ban đầu.
  5. Chứng minh: Ticket sự cố chỉ tự động chuyển sang `CLOSED` sau khi ô kho mới đã được cập nhật thành công.

### 🎬 Màn 5: Quá Hạn Tự Động, Nộp Phạt & Quyết Toán Trả Kho (5–6 phút)
- **Thao tác demo:**
  1. Chạy Trigger Scheduler mô phỏng hợp đồng quá hạn đến ngày D+4 ➔ Hệ thống tự động tính phạt lũy tiến 10%/ngày.
  2. Khách hàng đăng nhập ➔ Mã PIN vẫn mở để dọn đồ, khách thanh toán tiền phạt quá hạn trực tuyến.
  3. Khách bấm "Báo trả kho" ➔ Staff thực hiện nghiệm thu trả kho hiện trường, chụp ảnh không hư hại.
  4. Manager vào `/manager/contracts` ➔ Banner chờ nghiệm thu biến mất, mở nút xanh **"Duyệt quyết toán & Hoàn cọc"**.
  5. Manager duyệt hoàn cọc ➔ Báo cáo doanh thu `/manager/reports` và `/bom/revenue` tự động cập nhật số liệu chuẩn xác ngay lập tức.

---

*Tài liệu nội dung Slide và Kịch bản này được đồng bộ 100% với mã nguồn thực tế và tài liệu đặc tả của dự án SWP391.*

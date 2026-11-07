# 05. TÀI LIỆU HƯỚNG DẪN THUYẾT TRÌNH & PHÂN CÔNG NHIỆM VỤ NHÓM 5 NGƯỜI
## CHỦ ĐỀ: TỰ ĐỘNG HÓA KIỂM THỬ E2E VỚI PLAYWRIGHT & PLAYWRIGHT CODEGEN

> **Môn học:** Software Testing (Kiểm thử phần mềm)  
> **Chủ đề lựa chọn:** Topic 4 (Công cụ E2E Test hiện đại) kết hợp Topic 5 (Record & Playback Codegen)  
> **Trưởng nhóm kỹ thuật (Tech Lead):** Nguyễn Văn Gia Bình  
> **Repository GitHub dự án:** [https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System)  
> **Nhánh mã nguồn kiểm thử (Branch):** [`feature/playwright-e2e-suite`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/tree/feature/playwright-e2e-suite)  
> **Thời lượng bài thuyết trình:** 10 – 12 phút (chuẩn thuyết trình nhóm trên lớp)

---

## 📢 LƯU Ý BẮT BUỘC DÀNH CHO CÁC THÀNH VIÊN TRONG NHÓM (ĐỌC KỸ TRƯỚC KHI LÀM SLIDE)

1. **Phần Kỹ thuật & Mã nguồn:** Bạn **Gia Bình** đã chịu trách nhiệm nghiên cứu, thiết lập cấu hình Playwright, viết toàn bộ Fixture đa vai trò và kịch bản test hoàn chỉnh 100%.
2. **Trách nhiệm Soạn Slide:** Tài liệu này phân công cụ thể phần việc cho từng người. **Từng thành viên tự chịu trách nhiệm tự tìm hiểu, tự đọc mã nguồn trên GitHub của Bình và tự soạn slide cho phần của mình**. Không ai làm giùm ai!
3. **Đường dẫn thư mục Code trên GitHub để tự vào đọc và trích xuất thông tin:**
   - Cấu hình Playwright & Môi trường: [`frontend/playwright.config.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/playwright.config.ts)
   - Fixture 3 Actor mở 3 context độc lập: [`frontend/e2e/fixtures/actors.fixture.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/fixtures/actors.fixture.ts)
   - Kịch bản liên hoàn 4 giai đoạn Flow 3: [`frontend/e2e/flow3-return-settlement.spec.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/flow3-return-settlement.spec.ts)
   - Dữ liệu Data-Driven Testing (DDT): [`frontend/e2e/data/settlement-cases.json`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/data/settlement-cases.json)
   - Đặc tả nghiệp vụ Flow 3 & Quy tắc cọc: [`docs-local/MyE2ETask/01-E2E-TEST-MATRIX.md`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/docs-local/MyE2ETask/01-E2E-TEST-MATRIX.md) và [`docs-local/MyE2ETask/02-TEST-SCENARIOS-DETAIL.md`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/docs-local/MyE2ETask/02-TEST-SCENARIOS-DETAIL.md)

---

## 🎯 BẢNG TỔNG QUAN PHÂN CHIA NHIỆM VỤ 5 THÀNH VIÊN

| Thành viên | Vai trò & Trọng trách | Slide phụ trách | Nội dung chính cần trình bày | Thời lượng nói |
| :--- | :--- | :---: | :--- | :---: |
| **1. Công Tuấn** | Gánh Lý thuyết nền tảng & Bóc phốt Selenium | **Slide 1, 2** | Đặt vấn đề E2E Testing; Phân tích 3 điểm nghẽn Selenium; Bảng so sánh Selenium vs Cypress vs Playwright. | ~2.5 phút |
| **2. Phạm Ngọc Hưng** | Gánh Kỹ thuật Playwright & Topic 5 Codegen | **Slide 3** | Giao thức WebSocket CDP; Cơ chế Auto-waiting 5 bước; Tính năng Codegen (Record & Playback ra TypeScript). | ~2.0 phút |
| **3. Băng Sơn** | Gánh Nghiệp vụ AUT & Kiến trúc Multi-Actor | **Slide 4, 5** | Hệ thống Self-Storage (Flow 3 Trả kho sớm Win-Win); Kiến trúc `actors.fixture.ts` mở 3 Context; Data-Driven Testing với JSON. | ~2.5 phút |
| **4. Gia Bình** | **CHUYÊN TRÁCH DEMO LIVE TRÊN MÁY TÍNH** | **Slide 6, 7** | Bật Playwright UI Mode chạy tự động 3 vai trò trong 15s; Trình diễn Trace Viewer tua ngược timeline soi DOM & Network Spring Boot. | ~2.5 phút |
| **5. Xuân Nhi** | Việc nhẹ nhàng: Tổng kết & Điều phối Q&A | **Slide 8** | Tóm tắt các con số định lượng đạt được; Lời cảm ơn Thầy Cô và mời Thầy Cô nhận xét / đặt câu hỏi cho nhóm. | ~1.5 phút |

---

## 🔍 HƯỚNG DẪN CHI TIẾT TỪNG NGƯỜI ĐỂ TỰ SOẠN SLIDE & TỰ LUYỆN NÓI

---

### 👤 PHẦN 1: CÔNG TUẤN (Slide 1 & Slide 2)
> **Mục tiêu:** Tạo ấn tượng mở đầu chuyên nghiệp, giải thích vì sao nhóm chọn Playwright thay vì bám vào Selenium đã cũ.

#### 📚 Hướng dẫn Tuấn tự tìm hiểu:
* Tra cứu từ khóa: `"Selenium WebDriver architecture vs CDP"`, `"why selenium is flaky"`.
* Đọc tài liệu: [https://www.selenium.dev/documentation/webdriver/](https://www.selenium.dev/documentation/webdriver/) và [https://playwright.dev/docs/why-playwright](https://playwright.dev/docs/why-playwright).

#### 🖼️ Nội dung cần đưa lên Slide:
* **Slide 1 (Trang bìa & Đặt vấn đề):**
  - Tên đề tài: *TỰ ĐỘNG HÓA KIỂM THỬ E2E ĐA VAI TRÒ VỚI PLAYWRIGHT & PLAYWRIGHT CODEGEN*.
  - Tên môn học, Giảng viên hướng dẫn, danh sách 5 thành viên nhóm.
  - Vấn đề: Kiểm thử hồi quy trong Agile cần nhanh, nhẹ; hệ thống doanh nghiệp đòi hỏi kiểm thử nhiều người dùng cùng lúc (Multi-Actor).
* **Slide 2 (Tại sao Selenium truyền thống không còn là lựa chọn duy nhất?):**
  - Bóc phốt 3 điểm nghẽn của Selenium:
    1. *Giao thức HTTP trung gian qua Driver (ChromeDriver/GeckoDriver):* Chậm, có độ trễ cao, phụ thuộc `Thread.sleep` thụ động gây lỗi Flaky Test (lúc pass lúc fail).
    2. *Tốn tài nguyên RAM:* Muốn test 3 vai trò phải bật 3 cửa sổ Chrome vật lý độc lập (~2GB RAM), dễ treo máy CI/CD.
    3. *Rò rỉ phiên (Session Bleeding):* Trên cùng 1 trình duyệt thì Cookies bị đè, không test được 2 tài khoản cùng lúc.
  - Đưa Bảng so sánh 3 thế hệ:

| Tiêu chí | Selenium (Thế hệ 1) | Cypress (Thế hệ 2) | Playwright (Thế hệ 3 — Đột phá) |
| :--- | :--- | :--- | :--- |
| **Kiến trúc giao tiếp** | HTTP Request qua Driver trung gian | Chạy trong iframe trình duyệt | **WebSocket 2 chiều trực tiếp qua CDP** |
| **Độ ổn định** | Thấp (Dễ fail ngẫu nhiên do sleep) | Trung bình (Bị giới hạn 1 process) | **Rất cao (Auto-waiting trước mọi click)** |
| **Hỗ trợ Đa vai trò** | Bật nhiều Browser nặng máy | Không hỗ trợ đa tab | **Cực nhẹ qua Multi-Contexts ảo** |
| **Record & Sinh mã** | Selenium IDE (Thô sơ, lỗi thời) | Cypress Studio (Hạn chế) | **Playwright Codegen (Chuẩn TypeScript)** |

#### 🎙️ Lời thoại mẫu cho Tuấn:
> *"Kính thưa Thầy và các bạn, em là Công Tuấn. Hôm nay nhóm em xin trình bày giải pháp kiểm thử E2E hiện đại nhất hiện nay là Playwright của Microsoft kết hợp tính năng Codegen.*  
> *Chắc hẳn Thầy và các bạn đều quen thuộc với Selenium. Tuy nhiên, Selenium ra đời từ năm 2004 với kiến trúc gửi từng lệnh HTTP qua Driver trung gian, dẫn đến việc test rất chậm, hay bị lỗi ngẫu nhiên do mạng, và đặc biệt là cực kỳ ngốn RAM khi muốn kiểm thử nhiều tài khoản cùng lúc. Playwright ra đời giải quyết triệt để các vấn đề này bằng kết nối WebSocket trực tiếp.*  
> *Sau đây, bạn Ngọc Hưng sẽ trình bày sâu hơn về vũ khí kỹ thuật của Playwright và tính năng Record & Playback dành cho người mới."*

---

### 👤 PHẦN 2: PHẠM NGỌC HƯNG (Slide 3)
> **Mục tiêu:** Chứng minh năng lực kỹ thuật của Playwright và giải quyết yêu cầu Topic 5 của Thầy về Record & Playback.

#### 📚 Hướng dẫn Hưng tự tìm hiểu:
* Tra cứu doc chính thức của Playwright: [https://playwright.dev/docs/codegen](https://playwright.dev/docs/codegen) và [https://playwright.dev/docs/actionability](https://playwright.dev/docs/actionability).
* Xem file config mà Bình đã cấu hình: [`frontend/playwright.config.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/playwright.config.ts) trên GitHub.

#### 🖼️ Nội dung cần đưa lên Slide 3 (Vũ khí tối thượng: Playwright & Codegen):
1. **Cơ chế Auto-waiting thông minh:** Trước khi bấm một nút, Playwright tự động chạy 5 bước kiểm tra: *Đã gắn vào DOM chưa? -> Đã hiển thị chưa? -> Đã dừng chuyển động animation chưa? -> Đã kích hoạt enabled chưa? -> Đã sẵn sàng nhận click chưa?* ➔ Triệt tiêu hoàn toàn `Thread.sleep`!
2. **Playwright Codegen (Record & Replay cho Tester mới):**
   - Chỉ cần gõ lệnh `npx playwright codegen <URL>`.
   - Mở giao diện web lên click chuột, điền form như người dùng bình thường.
   - Cửa sổ bên cạnh **tự động phân tích và gõ ra code TypeScript chuẩn** theo các bộ chọn hướng người dùng (`getByRole`, `getByLabel`), không cần biết viết XPath phức tạp.
   - Giúp người mới vào nghề tạo ngay kịch bản test trong vài phút!

#### 🎙️ Lời thoại mẫu cho Hưng:
> *"Em chào Thầy, em là Ngọc Hưng. Em xin phép trình bày về 2 điểm đột phá kỹ thuật của Playwright:*  
> *Thứ nhất là Auto-waiting: Playwright tự động đợi giao diện ổn định và phần tử sẵn sàng mới tương tác, giúp loại bỏ hoàn toàn các dòng code sleep chờ đợi vô nghĩa.*  
> *Thứ hai, để giải quyết bài toán của các bạn Tester mới chưa thạo code, Playwright trang bị tính năng Codegen — Record & Playback thế hệ mới. Khi bật Codegen, Tester chỉ cần thao tác tự nhiên trên màn hình web, công cụ sẽ tự động ghi lại và sinh ra mã nguồn TypeScript chuẩn mực theo các thuộc tính thân thiện với người dùng. Đây chính là cây cầu nối hoàn hảo giữa Manual Tester và Automation Tester.*  
> *Tiếp theo, bạn Băng Sơn sẽ giới thiệu bài toán thực tế mà nhóm đã áp dụng Playwright để kiểm thử tự động."*

---

### 👤 PHẦN 3: BĂNG SƠN (Slide 4 & Slide 5)
> **Mục tiêu:** Làm nổi bật độ phức tạp của bài toán kiểm thử thực tế (AUT) và kiến trúc Multi-Actor Fixture do Bình thiết kế.

#### 📚 Hướng dẫn Sơn tự tìm hiểu:
* Vào GitHub đọc trực tiếp 2 file code cốt lõi của Bình:
  - [`frontend/e2e/fixtures/actors.fixture.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/fixtures/actors.fixture.ts) (Xem cách dùng `test.extend` và `browser.newContext()`).
  - [`frontend/e2e/data/settlement-cases.json`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/data/settlement-cases.json) (Xem 3 kịch bản tính tiền cọc).
* Đọc tài liệu Playwright: [https://playwright.dev/docs/browser-contexts](https://playwright.dev/docs/browser-contexts) và [https://playwright.dev/docs/test-fixtures](https://playwright.dev/docs/test-fixtures).

#### 🖼️ Nội dung cần đưa lên Slide:
* **Slide 4 (Ứng dụng Kiểm thử Thực tế - AUT):**
  - Hệ thống: *Self-Storage Facility Rental and Management System* (Hệ thống Quản lý và Cho thuê Kho tự quản thông minh).
  - Quy trình kiểm thử: **Flow 3 — Quản lý kho, Đăng ký trả sớm Win-Win và Nghiệm thu hoàn cọc** (`BR-RET-01..05`).
  - Nhấn mạnh độ khó: Luồng này cần **3 vai trò người dùng độc lập** phối hợp liên hoàn:
    1. *Khách hàng (Customer):* Báo trả kho trước hạn trên Portal khách.
    2. *Nhân viên (Staff):* Mở biên bản nghiệm thu hiện trường 4 tiêu chí (vệ sinh, ổ khóa, không ẩm mốc, hoàn trả chìa).
    3. *Quản lý (Manager):* Duyệt biên bản và hoàn tiền cọc vào tài khoản khách.
  - Khó khăn: Nếu test tay mất 15–20 phút, liên tục logout/login dễ nhầm lẫn.
* **Slide 5 (Kiến trúc Multi-Actor Fixture & Data-Driven Testing):**
  - Đưa sơ đồ kiến trúc: 1 Browser Instance chia làm 3 `BrowserContext` ảo độc lập (Customer Context, Staff Context, Manager Context) với 3 Cookie Jar và Token JWT tách biệt 100%, không bao giờ bị đè phiên.
  - Data-Driven Testing (DDT): Đưa dữ liệu 3 bài toán cọc từ file JSON:
    - *Case 1:* Cọc 2M, Hư hại 0đ ➔ Hoàn 100% cọc (2M).
    - *Case 2:* Cọc 3M, Móp cửa 800k ➔ Khấu trừ cọc, hoàn 2.2M.
    - *Case 3:* Sập vách 2.5M, Cọc 1.5M ➔ Cọc về 0đ, sinh hóa đơn thu thêm 1M.

#### 🎙️ Lời thoại mẫu cho Sơn:
> *"Kính thưa Thầy, em là Băng Sơn. Để kiểm chứng sức mạnh của Playwright, nhóm em không test trên các trang demo mẫu mà áp dụng trực tiếp vào Hệ thống Kho tự quản Self-Storage của nhóm.*  
> *Thách thức lớn nhất trong quy trình Trả kho sớm Win-Win là có 3 vai trò tương tác liên hoàn: Khách gửi yêu cầu, Nhân viên nghiệm thu và Quản lý phê duyệt hoàn cọc. Nếu dùng cách thông thường, ta phải đăng nhập ra vào liên tục hoặc mở 3 trình duyệt rất nặng.*  
> *Để giải quyết, nhóm em đã xây dựng Fixture `actors.fixture.ts` bằng kỹ thuật Multi-Browser Contexts của Playwright: Chỉ một tiến trình trình duyệt nhưng tạo ra 3 profile ảo độc lập, sở hữu 3 Token JWT riêng biệt. Đồng thời, nhóm tách toàn bộ dữ liệu cọc ra file JSON để chạy Data-Driven Testing tự động.*  
> *Sau đây, bạn Gia Bình - Tech Lead của nhóm sẽ trực tiếp bấm máy Demo Live kịch bản này trên máy tính ạ."*

---

### 👤 PHẦN 4: GIA BÌNH (Slide 6 & Slide 7)
> **Mục tiêu:** Trình diễn thực tế (Live Demo) mượt mà, chứng minh hệ thống hoạt động thật 100%, khoe vũ khí Trace Viewer.

#### 💻 Thao tác của Bình trên máy tính (Rất nhàn, chỉ cần mở lệnh và bấm nút):
1. **Thao tác 1 (Chạy Test Tự động trên UI Runner):**
   - Mở terminal gõ: `npm --prefix frontend run test:e2e:ui`
   - Bấm nút **Play (▶️)** tại file `flow3-return-settlement.spec.ts`.
   - Màn hình sẽ tự động chạy qua 3 vai trò trong **15 giây** và hiện tích xanh `Passed 100%`!
2. **Thao tác 2 (Mở Trace Viewer - Cỗ máy thời gian):**
   - Click đúp vào test case vừa chạy để mở cửa sổ **Trace Viewer**.
   - Kéo nhẹ thanh Timeline tua lại từng giây: Cho Thầy thấy màn hình lúc click chuột và tab Network bắt trọn vẹn API Spring Boot trả về `200 OK`.

#### 🎙️ Lời thoại của Bình (Chỉ nói đúng 1.5 - 2 phút, không cần học lý thuyết):
> *"Kính thưa Thầy, em là Gia Bình. Bây giờ em xin phép khởi chạy kịch bản tự động hóa 3 vai trò này bằng Playwright UI Runner.*  
> *(Bấm nút Play)*  
> *Như Thầy thấy trên màn hình: Context Khách hàng tự động mở gửi yêu cầu trả sớm; ngay lập tức Context Nhân viên nhận việc tích biên bản 4 tiêu chí; và Context Quản lý bấm duyệt hoàn cọc. Toàn bộ quy trình diễn ra tuần tự, mượt mà chỉ trong **15 giây** và đạt kết quả Passed 100%.*  
> *Đặc biệt, Playwright cung cấp công cụ gỡ lỗi tối thượng là **Trace Viewer** — Cỗ máy thời gian.*  
> *(Kéo thanh timeline)*  
> *Khi em kéo thanh timeline, toàn bộ giao diện được tua lại từng mili-giây. Ở tab Network, Thầy có thể thấy rõ API Spring Boot trả về mã 200 OK và số tiền hoàn cọc 2.000.000 VND một cách minh bạch.*  
> *Sau đây em xin nhường lời cho bạn Xuân Nhi để tổng kết bài thuyết trình của nhóm ạ."*

---

### 👤 PHẦN 5: XUÂN NHI (Slide 8)
> **Mục tiêu:** Việc nhẹ nhàng nhất nhóm, tóm tắt các con số ấn tượng, kết thúc bài thuyết trình duyên dáng và mời Thầy Cô nhận xét.

#### 📚 Hướng dẫn Nhi:
* Đọc Slide 8, nói chậm rãi, rõ ràng, phong thái tự tin.

#### 🖼️ Nội dung cần đưa lên Slide 8 (Kết luận & Q&A):
* 3 con số định lượng ấn tượng:
  1. **Rút ngắn 75%** thời gian viết test ban đầu nhờ Codegen.
  2. Thời gian chạy luồng 3 bên giảm từ **15 phút (thủ công)** xuống còn **15 giây (Playwright tự động)**.
  3. **Tiết kiệm 90% RAM** so với việc mở nhiều trình duyệt Selenium.
* Lời cảm ơn Thầy Cô và các bạn.

#### 🎙️ Lời thoại mẫu cho Nhi:
> *"Em chào Thầy và các bạn, em là Xuân Nhi. Để tổng kết lại bài thuyết trình hôm nay, nhóm em xin đúc kết 3 giá trị nổi bật mà Playwright mang lại:*  
> *Thứ nhất, tính năng Codegen giúp giảm 75% thời gian viết test ban đầu cho các bạn mới.*  
> *Thứ hai, luồng nghiệp vụ 3 bên phức tạp được tự động hóa hoàn toàn trong 15 giây với độ tin cậy tuyệt đối.*  
> *Thứ ba, kiến trúc Multi-Contexts giúp tiết kiệm tối đa tài nguyên máy tính và sẵn sàng tích hợp vào CI/CD cho đồ án tốt nghiệp.*  
> *Nhóm em xin chân thành cảm ơn Thầy và các bạn đã chú ý lắng nghe. Nhóm em rất mong nhận được những góp ý quý báu và câu hỏi nhận xét từ Thầy ạ!"*

---

## 🛡️ BỘ ĐỐI ĐÁP CHẤT VẤN HỘI ĐỒNG (Q&A CHEAT-SHEET CHO CẢ NHÓM)

Nếu Thầy giáo hỏi bất ngờ, các bạn nam cứ tự tin trả lời theo các ý sau:

### ❓ Câu 1 (Nếu hỏi Tuấn/Hưng): *"Codegen có thay thế được Tester không? Nhược điểm là gì?"*
* **Trả lời:** *"Dạ thưa Thầy, Codegen không thể thay thế được Tester. Nó chỉ là công cụ hỗ trợ tạo bản nháp ban đầu. Nhược điểm của nó là không tự sinh được logic kiểm tra số dư hay điều kiện rẽ nhánh phức tạp. Vai trò của Tester là dùng Codegen để record nhanh khung sườn, sau đó tự tay viết thêm assertion và tổ chức thành các Fixture chuẩn như nhóm em đã làm ạ."*

### ❓ Câu 2 (Nếu hỏi Sơn): *"Tại sao 3 vai trò cùng đăng nhập mà không bị đè token JWT của nhau?"*
* **Trả lời:** *"Dạ thưa Thầy, nhờ kiến trúc `BrowserContext` của Playwright. Mỗi Context là một profile ẩn danh riêng biệt, sở hữu Cookie Jar và LocalStorage tách rời 100%. Dù chạy trên cùng 1 trình duyệt, Token của Khách hàng và Token của Quản lý nằm ở 2 ngăn nhớ khác nhau nên không bao giờ bị đè ạ."*

### ❓ Câu 3 (Nếu hỏi Bình): *"Nếu chạy test nhiều lần thì database có bị rác không?"*
* **Trả lời:** *"Dạ thưa Thầy, nhóm em sử dụng cơ chế Seed Data chuẩn của Flyway và định danh các mã hợp đồng kiểm thử riêng (`CTR-2026-001`), đồng thời có các kịch bản rollback trạng thái tự động nên hoàn toàn không ảnh hưởng tới dữ liệu hoạt động bình thường của hệ thống ạ."*

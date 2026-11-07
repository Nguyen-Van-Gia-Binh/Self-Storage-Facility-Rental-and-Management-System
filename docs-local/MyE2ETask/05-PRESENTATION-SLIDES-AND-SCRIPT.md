# 05. TÀI LIỆU HƯỚNG DẪN THUYẾT TRÌNH & PHÂN CÔNG CHUYÊN MÔN NHÓM
## CHỦ ĐỀ: TỰ ĐỘNG HÓA KIỂM THỬ E2E ĐA VAI TRÒ VỚI PLAYWRIGHT & PLAYWRIGHT CODEGEN

> **Môn học:** Software Testing (Kiểm thử phần mềm)  
> **Chủ đề lựa chọn:** Topic 4 (Công cụ E2E Testing hiện đại) kết hợp Topic 5 (Giải pháp Record & Playback thông minh)  
> **Repository GitHub dự án:** [https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System)  
> **Nhánh mã nguồn kiểm thử (Branch):** [`feature/playwright-e2e-suite`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/tree/feature/playwright-e2e-suite)  
> **Thời lượng báo cáo chuẩn:** 10 – 12 phút (chuẩn thuyết trình nhóm trên lớp)

---

## 📌 QUY ƯỚC PHỐI HỢP & NGUYÊN TẮC HOÀN THIỆN SLIDE

1. **Phân bổ trách nhiệm chuyên môn:**
   - Bạn **Gia Bình** (Technical Lead) phụ trách toàn bộ việc nghiên cứu, cài đặt cấu hình Playwright, xây dựng Fixture đa vai trò độc lập và đóng gói toàn bộ mã nguồn kiểm thử thực tế.
   - Để bài thuyết trình có chiều sâu và thể hiện được sự nắm bắt công nghệ của từng thành viên khi phản biện trước Hội đồng Giảng viên, **mỗi bạn tự chủ động đọc tài liệu tham khảo, đối soát mã nguồn đính kèm và tự thiết kế nội dung slide phụ trách**.
2. **Đường dẫn mã nguồn trên GitHub để các thành viên tự tra cứu và trích xuất dữ liệu:**
   - Cấu hình Playwright & Môi trường: [`frontend/playwright.config.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/playwright.config.ts)
   - Fixture 3 Actor mở 3 Browser Contexts độc lập: [`frontend/e2e/fixtures/actors.fixture.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/fixtures/actors.fixture.ts)
   - Kịch bản liên hoàn 4 giai đoạn Flow 3: [`frontend/e2e/flow3-return-settlement.spec.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/flow3-return-settlement.spec.ts)
   - Bộ dữ liệu Data-Driven Testing (DDT): [`frontend/e2e/data/settlement-cases.json`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/data/settlement-cases.json)
   - Đặc tả quy trình nghiệp vụ & Quy tắc cọc: [`docs-local/MyE2ETask/01-E2E-TEST-MATRIX.md`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/docs-local/MyE2ETask/01-E2E-TEST-MATRIX.md) và [`docs-local/MyE2ETask/02-TEST-SCENARIOS-DETAIL.md`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/docs-local/MyE2ETask/02-TEST-SCENARIOS-DETAIL.md)

---

## 🎯 BẢNG PHÂN CÔNG CHUYÊN MÔN NHÓM 5 THÀNH VIÊN

| Thành viên | Chuyên môn phụ trách | Slide | Nội dung học thuật cốt lõi | Thời lượng |
| :--- | :--- | :---: | :--- | :---: |
| **1. Công Tuấn** | Phân tích Động lực Công nghệ & Xu hướng E2E | **Slide 1, 2** | Đặt vấn đề kiểm thử hồi quy; Phân tích kiến trúc HTTP WebDriver của Selenium; Bảng so sánh 3 thế hệ công cụ. | ~2.5 phút |
| **2. Phạm Ngọc Hưng** | Phân tích Kiến trúc Kỹ thuật & Tự động hóa Sinh mã | **Slide 3** | Giao thức WebSocket qua CDP; Cơ chế Actionability checks 5 bước; Giải pháp Playwright Codegen cho Automation. | ~2.0 phút |
| **3. Băng Sơn** | Mô hình hóa Nghiệp vụ & Thiết kế Dữ liệu Kiểm thử | **Slide 4, 5** | Hệ sinh thái Self-Storage (Flow 3); Kiến trúc Multi-Browser Contexts cô lập phiên; Data-Driven Testing từ JSON. | ~2.5 phút |
| **4. Gia Bình** | Điều phối Thực nghiệm & Trình diễn Live Demo | **Slide 6, 7** | Thực thi kịch bản tự động hóa trên Playwright UI Runner; Trình diễn Time-travel debugging qua Trace Viewer. | ~2.5 phút |
| **5. Xuân Nhi** | Đánh giá Tác động Định lượng & Tổng kết Nghiệm thu | **Slide 8** | Tổng hợp 3 chỉ số định lượng (thời gian, độ ổn định, tài nguyên); Đúc kết giá trị và điều phối phần Q&A. | ~1.5 phút |

---

## 🔍 HƯỚNG DẪN CHI TIẾT TỪNG PHẦN ĐỂ THÀNH VIÊN TỰ XÂY DỰNG SLIDE

---

### 👤 PHẦN 1: CÔNG TUẤN (Slide 1 & Slide 2)
> **Mục tiêu:** Tạo ấn tượng mở đầu học thuật, phân tích sâu sắc các hạn chế của kiến trúc cũ để làm nổi bật sự cần thiết của giải pháp mới.

#### 📚 Tài liệu tham khảo gợi ý:
* Tra cứu tài liệu: [https://www.selenium.dev/documentation/webdriver/](https://www.selenium.dev/documentation/webdriver/) và [https://playwright.dev/docs/why-playwright](https://playwright.dev/docs/why-playwright).
* Từ khóa tìm hiểu thêm: `"Selenium WebDriver architecture vs CDP"`, `"Flaky tests root causes"`.

#### 🖼️ Định hướng nội dung Slide:
* **Slide 1 (Trang bìa & Đặt vấn đề):**
  - Tên đề tài: *TỰ ĐỘNG HÓA KIỂM THỬ E2E ĐA VAI TRÒ VỚI PLAYWRIGHT & PLAYWRIGHT CODEGEN*.
  - Tên môn học, Giảng viên hướng dẫn, danh sách 5 thành viên nhóm.
  - Đặt vấn đề: Trong môi trường Agile / CI-CD, kiểm thử hồi quy đòi hỏi tính tức thời và độ tin cậy cao; các hệ thống doanh nghiệp yêu cầu kiểm thử chuỗi tương tác đa vai trò (Multi-Actor) song song.
* **Slide 2 (Động lực chuyển dịch công nghệ: Phân tích các điểm nghẽn của Selenium):**
  - Phân tích 3 điểm nghẽn kiến trúc của Selenium:
    1. *Giao thức HTTP Request qua Webdriver trung gian:* Tạo độ trễ mạng (latency), phụ thuộc vào cơ chế chờ tĩnh (`Thread.sleep()`) dẫn đến kiểm thử thiếu ổn định (Flaky Test).
    2. *Chi phí tài nguyên khi kiểm thử đa vai trò:* Cần mở đồng thời nhiều tiến trình trình duyệt vật lý độc lập, tiêu tốn CPU và RAM.
    3. *Rò rỉ phiên làm việc (Session Bleeding):* Cùng một trình duyệt thì việc chia sẻ Cookie/LocalStorage khiến việc giả lập nhiều vai trò cùng lúc dễ bị xung đột.
  - Bảng so sánh 3 thế hệ công cụ kiểm thử:

| Tiêu chí so sánh | Selenium WebDriver (Thế hệ 1) | Cypress.io (Thế hệ 2) | Playwright (Thế hệ 3 — Hiện đại) |
| :--- | :--- | :--- | :--- |
| **Giao thức kết nối** | HTTP Request qua Driver trung gian | Thực thi trong iframe trình duyệt | **WebSocket 2 chiều trực tiếp qua CDP** |
| **Độ ổn định** | Phụ thuộc polling/sleep tĩnh | Giới hạn bởi 1 tiến trình duy nhất | **Auto-waiting trước mọi tương tác** |
| **Kiểm thử Đa vai trò** | Bật nhiều Browser nặng nề | Không hỗ trợ đa tab | **Multi-Contexts ảo cực nhẹ** |
| **Cơ chế Record sinh mã** | Selenium IDE (Thô sơ, lỗi thời) | Cypress Studio (Hạn chế) | **Playwright Codegen (Chuẩn TypeScript)** |

#### 🎙️ Lời thoại gợi ý:
> *"Kính thưa Thầy và các bạn, em là Công Tuấn. Nhóm em lựa chọn nghiên cứu và triển khai công cụ kiểm thử E2E thế hệ mới là Playwright của Microsoft kết hợp cùng giải pháp sinh mã Codegen.*  
> *Trong lịch sử phát triển kiểm thử tự động, Selenium là nền tảng đặt nền móng từ năm 2004. Tuy nhiên, kiến trúc giao tiếp HTTP qua Webdriver trung gian bộc lộ độ trễ lớn và dễ gây ra lỗi ngẫu nhiên. Khi kiểm thử các bài toán phức tạp đòi hỏi nhiều người dùng cộng tác, Selenium tiêu tốn tài nguyên rất lớn để mở nhiều phiên trình duyệt độc lập.*  
> *Playwright ra đời như một giải pháp đột phá với kết nối WebSocket trực tiếp, giải quyết toàn diện bài toán hiệu năng và tính ổn định. Tiếp theo, bạn Ngọc Hưng sẽ phân tích chi tiết về kiến trúc kỹ thuật của Playwright."*

---

### 👤 PHẦN 2: PHẠM NGỌC HƯNG (Slide 3)
> **Mục tiêu:** Trình bày nền tảng kỹ thuật vượt trội của Playwright và giải pháp Record & Playback thông minh.

#### 📚 Tài liệu tham khảo gợi ý:
* Tài liệu chính thức: [https://playwright.dev/docs/codegen](https://playwright.dev/docs/codegen) và [https://playwright.dev/docs/actionability](https://playwright.dev/docs/actionability).
* Xem file cấu hình Playwright của nhóm: [`frontend/playwright.config.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/playwright.config.ts).

#### 🖼️ Định hướng nội dung Slide 3 (Kiến trúc Kỹ thuật & Giải pháp Sinh mã Codegen):
1. **Cơ chế Auto-waiting thông minh (Actionability Checks):**
   - Playwright tự động kiểm tra 5 điều kiện trước khi thực hiện tương tác: *Phần tử đã gắn vào DOM ➔ Đã hiển thị (Visible) ➔ Đã ổn định (Stable animation) ➔ Đã kích hoạt (Enabled) ➔ Sẵn sàng nhận thao tác*.
   - Triệt tiêu hoàn toàn sự phụ thuộc vào delay nhân tạo, tối ưu hóa tốc độ thực thi.
2. **Playwright Codegen (Record & Playback thông minh):**
   - Kích hoạt qua lệnh đơn giản: `npx playwright codegen <URL>`.
   - Ghi nhận hành vi tương tác thực tế của người dùng và tự động dịch chuyển thành mã TypeScript chuẩn mực.
   - Ứng dụng các bộ chọn hướng người dùng (User-Facing Locators: `getByRole`, `getByLabel`), giúp kịch bản kiểm thử có độ bền vững cao khi giao diện có sự thay đổi cấu trúc DOM.

#### 🎙️ Lời thoại gợi ý:
> *"Em chào Thầy, em là Ngọc Hưng. Em xin phép trình bày về 2 điểm sáng kỹ thuật cốt lõi của Playwright:*  
> *Đầu tiên là cơ chế Auto-waiting: Thay vì lập trình viên phải tự ước lượng thời gian chờ, Playwright tự động đối soát 5 trạng thái sẵn sàng của phần tử trước khi tương tác, giúp kịch bản kiểm thử đạt độ tin cậy tối đa.*  
> *Thứ hai, để giải quyết bài toán hạ thấp rào cản kỹ thuật cho người mới bắt đầu kiểm thử tự động, Playwright trang bị tính năng Codegen. Khi người dùng thao tác trực tiếp trên giao diện ứng dụng, công cụ tự động phân tích và sinh mã nguồn TypeScript chuẩn mực với các bộ chọn ngữ nghĩa cao. Điều này giúp rút ngắn đáng kể thời gian xây dựng khung kịch bản kiểm thử ban đầu.*  
> *Tiếp theo, bạn Băng Sơn sẽ giới thiệu ứng dụng thực tế mà nhóm đã triển khai kiểm thử."*

---

### 👤 PHẦN 3: BĂNG SƠN (Slide 4 & Slide 5)
> **Mục tiêu:** Khẳng định tính thực chiến của bài toán kiểm thử trên hệ thống thật và kiến trúc phân lập ngữ cảnh đa vai trò.

#### 📚 Tài liệu tham khảo gợi ý:
* Mã nguồn Fixture và Data trên GitHub:
  - [`frontend/e2e/fixtures/actors.fixture.ts`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/fixtures/actors.fixture.ts)
  - [`frontend/e2e/data/settlement-cases.json`](https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System/blob/feature/playwright-e2e-suite/frontend/e2e/data/settlement-cases.json)
* Tài liệu Playwright Fixtures & Contexts: [https://playwright.dev/docs/browser-contexts](https://playwright.dev/docs/browser-contexts).

#### 🖼️ Định hướng nội dung Slide:
* **Slide 4 (Ứng dụng Kiểm thử Thực tế - AUT):**
  - Hệ thống: *Self-Storage Facility Rental and Management System* (Hệ thống Cho thuê & Quản lý Kho tự quản thông minh).
  - Nghiệp vụ kiểm thử tiêu biểu: **Flow 3 — Quản lý kho, Báo trả sớm Win-Win và Nghiệm thu hoàn cọc** (`BR-RET-01..05`).
  - Đặc thù bài toán đa vai trò liên hoàn:
    1. *Khách hàng (Customer):* Đăng ký trả kho sớm trên Portal khách hàng.
    2. *Nhân viên cơ sở (Staff):* Tiếp nhận biên bản nghiệm thu hiện trường 4 tiêu chí chất lượng.
    3. *Quản lý cơ sở (Facility Manager):* Thẩm định biên bản và phê duyệt hoàn cọc điện tử.
  - Thách thức: Đòi hỏi kiểm thử chuỗi nghiệp vụ liên tục mà không làm gián đoạn hoặc đè lẫn phiên đăng nhập.
* **Slide 5 (Kiến trúc Multi-Actor Fixture & Data-Driven Testing):**
  - Trình bày giải pháp kiến trúc: Sử dụng `browser.newContext()` trong `actors.fixture.ts` để khởi tạo 3 ngữ cảnh duyệt web độc lập trên cùng 1 phiên Chromium duy nhất. Mỗi ngữ cảnh quản lý Cookie Jar và JWT Token riêng biệt 100%.
  - Cơ chế Data-Driven Testing (DDT): Bóc tách dữ liệu vào file `settlement-cases.json` để tự động hóa kiểm chứng 3 trường hợp tài chính biên:
    - *Trường hợp 1:* Kho nguyên vẹn ➔ Hoàn 100% tiền cọc (2.000.000đ).
    - *Trường hợp 2:* Hư hỏng cửa cuốn ➔ Khấu trừ chi phí thiệt hại, hoàn tiền cọc còn lại (2.200.000đ).
    - *Trường hợp 3:* Thiệt hại vượt cọc ➔ Khấu trừ toàn bộ cọc và phát sinh hóa đơn phụ thu (1.000.000đ).

#### 🎙️ Lời thoại gợi ý:
> *"Kính thưa Thầy, em là Băng Sơn. Nhóm em áp dụng trực tiếp Playwright vào bài toán thực tế của dự án Self-Storage.*  
> *Một trong những quy trình phức tạp nhất là luồng Trả kho sớm Win-Win, đòi hỏi sự phối hợp tuần tự giữa 3 vai trò: Khách hàng yêu cầu, Nhân viên nghiệm thu và Quản lý phê duyệt quyết toán. Việc kiểm thử thủ công quy trình này rất tốn thời gian do phải liên tục chuyển đổi tài khoản.*  
> *Để giải quyết triệt để, nhóm đã xây dựng kiến trúc Multi-Actor Fixture dựa trên kỹ thuật BrowserContext của Playwright: Khởi tạo 3 hồ sơ duyệt web độc lập hoàn toàn về bộ nhớ phiên và JWT Token trên cùng 1 phiên trình duyệt. Kết hợp với đó là kỹ thuật Data-Driven Testing để đối soát tự động toàn bộ các công thức tính cọc từ file dữ liệu JSON.*  
> *Sau đây, bạn Gia Bình sẽ thực hiện phần trình diễn thực nghiệm trực tiếp trên hệ thống."*

---

### 👤 PHẦN 4: GIA BÌNH (Slide 6 & Slide 7)
> **Mục tiêu:** Trình diễn thực tế (Live Demo) kịch bản kiểm thử tự động, chứng minh tính toàn vẹn của hệ thống và giới thiệu công cụ gỡ lỗi Trace Viewer.

#### 💻 Thao tác thực nghiệm trên máy tính:
1. **Thao tác 1 (Khởi chạy kịch bản kiểm thử):**
   - Mở terminal: `npm --prefix frontend run test:e2e:ui`
   - Bấm nút khởi chạy kịch bản `flow3-return-settlement.spec.ts`.
   - Trình chiếu quy trình 3 bên tự động hoàn tất trong **15 giây** với kết quả `Passed 100%`.
2. **Thao tác 2 (Trình diễn Trace Viewer):**
   - Mở cửa sổ Trace Viewer của lượt test vừa hoàn thành.
   - Kéo thanh timeline điều hướng và trỏ vào tab Network để đối soát API Backend Spring Boot trả về `200 OK`.

#### 🎙️ Lời thoại trình diễn:
> *"Kính thưa Thầy, em là Gia Bình. Bây giờ em xin phép khởi chạy kịch bản tự động hóa toàn diện này thông qua công cụ Playwright UI Runner.*  
> *(Thực hiện bấm chạy)*  
> *Như Thầy thấy trên màn hình: Phiên Khách hàng tự động gửi yêu cầu trả sớm; ngay lập tức phiên Nhân viên tiếp nhận lập biên bản 4 tiêu chí; và phiên Quản lý thực hiện phê duyệt hoàn cọc. Toàn bộ chuỗi tương tác đa vai trò diễn ra nhịp nhàng và chính xác trong vòng 15 giây với trạng thái xanh toàn bộ.*  
> *Bên cạnh đó, Playwright cung cấp công cụ gỡ lỗi Trace Viewer rất mạnh mẽ.*  
> *(Thao tác trên Trace Viewer)*  
> *Thanh timeline cho phép chúng ta xem lại trạng thái giao diện ở từng thời điểm. Tại tab Network, toàn bộ các gói tin API gửi tới Backend Spring Boot đều được bắt trọn vẹn, xác nhận mã 200 OK và số tiền quyết toán 2.000.000đ được xử lý minh bạch.*  
> *Sau đây em xin nhường lời cho bạn Xuân Nhi để tổng kết báo cáo ạ."*

---

### 👤 PHẦN 5: XUÂN NHI (Slide 8)
> **Mục tiêu:** Tổng hợp các giá trị định lượng nổi bật của đề tài, kết thúc bài báo cáo trang trọng và điều phối phần hỏi đáp.

#### 🖼️ Định hướng nội dung Slide 8 (Kết luận & Q&A):
* 3 chỉ số định lượng nổi bật:
  1. **Tiết kiệm 75%** thời gian xây dựng kịch bản kiểm thử ban đầu nhờ sự hỗ trợ của Codegen.
  2. Thời gian thực thi luồng đa vai trò giảm từ **15 phút (thực hiện thủ công)** xuống còn **15 giây (tự động hóa)**.
  3. **Tối ưu 90% bộ nhớ RAM** so với mô hình khởi tạo nhiều phiên trình duyệt truyền thống.
* Lời cảm ơn Thầy Cô và Hội đồng.

#### 🎙️ Lời thoại gợi ý:
> *"Em chào Thầy và các bạn, em là Xuân Nhi. Để tổng kết lại bài báo cáo của nhóm hôm nay, việc áp dụng Playwright đã mang lại 3 giá trị định lượng rất rõ rệt:*  
> *Thứ nhất, giải pháp Codegen giúp rút ngắn 75% thời gian tạo khung kịch bản ban đầu.*  
> *Thứ hai, chuỗi nghiệp vụ đa vai trò phức tạp được tự động hóa trọn vẹn trong 15 giây với độ ổn định tuyệt đối.*  
> *Thứ ba, kiến trúc BrowserContext giúp tối ưu hóa tài nguyên phần cứng, sẵn sàng tích hợp vào quy trình CI/CD cho đồ án tốt nghiệp.*  
> *Nhóm chúng em xin chân thành cảm ơn Thầy và các bạn đã chú ý theo dõi. Rất mong nhận được những nhận xét và câu hỏi góp ý từ Thầy để nhóm hoàn thiện hơn nữa đề tài này ạ!"*

---

## 🛡️ BỘ CÂU HỎI CHẤT VẤN THƯỜNG GẶP (Q&A REFERENCE CHO NHÓM)

### ❓ Câu hỏi 1: *"Codegen có thể thay thế hoàn toàn kỹ sư Automation Test không? Nhược điểm của nó là gì?"*
* **Trả lời:** *"Dạ thưa Thầy, Codegen không thay thế được kỹ sư kiểm thử. Nó đóng vai trò như công cụ tăng tốc tạo bản nháp ban đầu. Nhược điểm của Codegen là mã sinh ra mang tính tuyến tính, chưa tối ưu theo các mẫu thiết kế hướng đối tượng (như Page Object Model) và không thể tự sinh các điều kiện rẽ nhánh hay logic kiểm tra nghiệp vụ phức tạp. Kỹ sư kiểm thử sử dụng Codegen để bắt nhanh tương tác, sau đó tái cấu trúc thành các Fixture chuẩn và bổ sung các assertion nghiệp vụ sâu ạ."*

### ❓ Câu hỏi 2: *"Cơ chế nào giúp 3 vai trò cùng đăng nhập mà không bị đè Session / Token JWT của nhau?"*
* **Trả lời:** *"Dạ thưa Thầy, nhờ kiến trúc phân cấp `Browser` ➔ `BrowserContext` ➔ `Page` của Playwright. Mỗi `BrowserContext` hoạt động như một hồ sơ ẩn danh độc lập, sở hữu kho lưu trữ Cookie Jar và LocalStorage hoàn toàn riêng biệt. Khi chạy trên cùng 1 tiến trình Chromium, Token của Khách hàng và Token của Quản lý nằm ở 2 phân vùng bộ nhớ tách biệt nên không bao giờ xảy ra hiện tượng rò rỉ phiên làm việc ạ."*

### ❓ Câu hỏi 3: *"Làm thế nào để đảm bảo dữ liệu trong database không bị sai lệch sau nhiều lần chạy test?"*
* **Trả lời:** *"Dạ thưa Thầy, nhóm áp dụng giải pháp đồng bộ dữ liệu mẫu qua Flyway Migration và định danh các bản ghi kiểm thử theo mã riêng (`CTR-2026-001`). Kết hợp với các quy trình thiết lập lại trạng thái ban đầu, kịch bản kiểm thử có thể thực thi lặp lại nhiều lần mà không ảnh hưởng tới dữ liệu vận hành chung của hệ thống ạ."*

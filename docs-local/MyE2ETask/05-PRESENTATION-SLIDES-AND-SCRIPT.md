# 05. GÓI VŨ KHÍ THUYẾT TRÌNH: E2E AUTOMATION TEST VỚI PLAYWRIGHT & CODEGEN

> **Môn học:** Software Testing (Kiểm thử phần mềm)  
> **Chủ đề lựa chọn:** Topic 4 (E2E Test Tool hiện đại) kết hợp Topic 5 (Record & Playback Codegen)  
> **Người trình bày:** Nguyễn Văn Gia Bình  
> **Thời lượng chuẩn:** 5 - 7 phút thuyết trình & Demo Live  
> **Mục tiêu:** Thuyết phục tuyệt đối Giảng viên và Hội đồng bằng nền tảng lý thuyết học thuật vững chắc, sự so sánh đối chiếu đa chiều giữa các thế hệ công cụ kiểm thử, và màn trình diễn thực tế (Live Demo) mượt mà không tì vết.

---

## PHẦN 1: NỘI DUNG 7 SLIDE THUYẾT TRÌNH CHUẨN MỰC (ACADEMIC & TECHNICAL DEPTH)

```
========================================================================================
[SLIDE 1] TRANG BÌA & ĐẶT VẤN ĐỀ (PROBLEM STATEMENT)
========================================================================================
```

### 🎯 Slide 1: Trang bìa & Đặt vấn đề

* **Tiêu đề chính (Title):** TỰ ĐỘNG HÓA KIỂM THỬ E2E ĐA VAI TRÒ VỚI PLAYWRIGHT & PLAYWRIGHT CODEGEN
* **Phụ đề (Subtitle):** Giải pháp đột phá kết hợp Record & Playback thông minh cho Tester mới và Multi-Browser Contexts cho Hệ thống Phức tạp.
* **Người thực hiện:** Nguyễn Văn Gia Bình — Technical Lead & Automation QA.
* **Bối cảnh & Động lực nghiên cứu (Problem Statement):**
  * Trong xu hướng phát triển phần mềm hiện đại (Agile / CI-CD), kiểm thử hồi quy (Regression Testing) đòi hỏi tốc độ nhanh và độ tin cậy tuyệt đối.
  * Các ứng dụng Enterprise thực tế không còn là Single-User đơn giản, mà là chuỗi tương tác cộng tác phức tạp giữa nhiều vai trò người dùng (Multi-Actor Workflow) diễn ra theo thời gian thực.
  * Làm thế nào để vừa hạ thấp rào cản kỹ thuật cho Tester mới (thông qua Record & Playback), vừa đáp ứng kiến trúc kiểm thử tự động đa vai trò song song với chi phí tài nguyên tối thiểu?

---

```
========================================================================================
[SLIDE 2] TẠI SAO SELENIUM TRUYỀN THỐNG KHÔNG CÒN LÀ LỰA CHỌN DUY NHẤT?
========================================================================================
```

### ⚔️ Slide 2: Tại sao Selenium truyền thống không còn là lựa chọn duy nhất?

* **Điểm nghẽn 1: Tốc độ & Flakiness (Kiến trúc HTTP Webdriver trung gian):**
  * Selenium giao tiếp qua giao thức HTTP JSON Wire / W3C WebDriver tới một Driver trung gian (ChromeDriver, GeckoDriver). Mỗi lệnh là một HTTP Request riêng biệt gây độ trễ (latency).
  * Kiểm thử phụ thuộc vào cơ chế Polling và các hàm chờ thụ động (`Thread.sleep()`, explicit wait tĩnh), dẫn đến tình trạng Flaky Tests (test pass/fail ngẫu nhiên do mạng hoặc rendering chậm).
* **Điểm nghẽn 2: Rào cản kiểm thử Đa Vai trò (Session Isolation):**
  * Để chạy đồng thời 2–3 vai trò người dùng khác nhau (ví dụ: Khách hàng và Nhân viên), Selenium buộc phải mở 2–3 cửa sổ trình duyệt vật lý độc lập (Browser Instances), ngốn hàng Gigabyte RAM và tiêu tốn CPU.
  * Trong cùng 1 trình duyệt, Cookies và LocalStorage bị ghi đè, dẫn đến hiện tượng **Session Bleeding** (rò rỉ phiên làm việc giữa các vai trò).
* **Điểm nghẽn 3: Rào cản cho Tester mới bắt đầu:**
  * Cần cấu hình Driver phức tạp, khớp phiên bản trình duyệt thủ công.
  * Viết Selector bằng tay đòi hỏi kiến thức sâu về DOM / XPath; khi giao diện thay đổi nhỏ thì hàng loạt mã kiểm thử bị gãy (Brittle Selectors).

#### 📊 Bảng so sánh 3 Thế hệ Công cụ Kiểm thử E2E:

| Tiêu chí kỹ thuật | Selenium WebDriver (Thế hệ 1) | Cypress.io (Thế hệ 2) | Playwright (Thế hệ 3 — Đột phá) |
| :--- | :--- | :--- | :--- |
| **Kiến trúc giao tiếp** | HTTP Request qua Driver trung gian | Chạy trực tiếp trong iframe trình duyệt | **WebSocket 2 chiều trực tiếp qua CDP** |
| **Độ ổn định (Flakiness)** | Thấp (Dễ fail ngẫu nhiên do sleep/wait) | Trung bình (Bị giới hạn trong 1 process) | **Rất cao (Auto-waiting trước mọi hành động)** |
| **Hỗ trợ Đa tab / Đa cửa sổ** | Hỗ trợ nhưng chậm, tốn RAM | **Không hỗ trợ** (Bị giới hạn bởi iframe) | **Hỗ trợ hoàn hảo qua Multi-Contexts** |
| **Kiểm thử Đa vai trò (Multi-Actor)** | Mở nhiều Browser nặng nề | Rất khó, phải clear cookies liên tục | **Cực nhẹ (Mỗi context là 1 profile độc lập)** |
| **Công cụ Record & Code Generation** | Selenium IDE (Lỗi thời, xuất code thô) | Cypress Studio (Hạn chế, ít cập nhật) | **Playwright Codegen (Sinh TypeScript chuẩn)** |
| **Môi trường trình duyệt** | Chromium, Firefox, WebKit, IE | Chủ yếu Chromium, Firefox hạn chế | **Chromium, Firefox, WebKit (100% native)** |

---

```
========================================================================================
[SLIDE 3] VŨ KHÍ TỐI THƯỢNG — PLAYWRIGHT & TÍNH NĂNG CODEGEN
========================================================================================
```

### 🚀 Slide 3: Vũ khí tối thượng — Playwright & Tính năng Codegen

* **1. Cơ chế Auto-waiting Thông minh (Actionability Checks):**
  * Playwright tự động thực hiện 5 bước kiểm tra trạng thái phần tử trước khi click hoặc nhập liệu: *Attached to DOM ➔ Visible ➔ Stable (hết hiệu ứng animation) ➔ Enabled ➔ Editable*.
  * Loại bỏ hoàn toàn `Thread.sleep` hay delay nhân tạo, giảm thời gian thực thi kịch bản xuống mức tối đa.
* **2. Playwright Codegen (Record & Replay Thế hệ mới):**
  * Chỉ với một dòng lệnh: `npx playwright codegen <URL>`
  * Tester tương tác trực tiếp trên giao diện như người dùng thật.
  * Công cụ tự động phân tích và sinh mã TypeScript chuẩn mực theo các Locator hướng người dùng (User-Facing Locators: `getByRole`, `getByText`, `getByLabel`), đảm bảo test bền vững khi cấu trúc DOM thay đổi.
* **3. Multi-Browser Contexts (Bí quyết cho Multi-Actor Testing):**
  * Khởi tạo các phiên trình duyệt ảo (Incognito-like context) chỉ mất **vài mili-giây**, chia sẻ chung một Single Browser Instance.
  * Bộ nhớ Cache, Cookies, LocalStorage, IndexedDB tách biệt 100%. Khách hàng và Quản trị viên thao tác song song mà không bao giờ đá phiên của nhau.

---

```
========================================================================================
[SLIDE 4] ỨNG DỤNG KIỂM THỬ THỰC TẾ (APPLICATION UNDER TEST - AUT)
========================================================================================
```

### 🏢 Slide 4: Ứng dụng Kiểm thử Thực tế (AUT - Application Under Test)

* **Hệ thống được kiểm thử:** *Self-Storage Facility Rental and Management System* (Hệ thống Thuê và Quản lý Kho tự quản thông minh).
* **Nghiệp vụ cốt lõi được chọn:** **Flow 3 — Quản lý kho đang thuê, Đăng ký trả sớm Win-Win và Nghiệm thu hoàn cọc** (`BR-RET-01..05`, `BR-CHK-01..02`).
* **Đặc thù nghiệp vụ phức tạp:**
  * Đây là luồng cộng tác liên hoàn giữa **3 vai trò người dùng** trên 3 Portal riêng biệt:
    1. **Khách hàng (Customer - An):** Báo trả kho trước hạn theo chính sách Win-Win (`BR-RET-05`), cam kết dọn sạch tài sản.
    2. **Nhân viên cơ sở (Staff - SG Desk):** Tiếp nhận yêu cầu, tới kho nghiệm thu thực tế theo 4 tiêu chí đạt chuẩn (`BR-CHK-02`), ghi nhận chi phí hư hại.
    3. **Quản lý cơ sở (Facility Manager - SG):** Thẩm định biên bản, tính toán tiền cọc hoàn lại theo quy tắc tài chính (`BR-RET-01`), bấm duyệt thanh lý.
* **Tại sao đây là "Bài toán ác mộng" của kiểm thử truyền thống?**
  * Nếu test thủ công: Một Tester phải liên tục đăng xuất, đăng nhập lại 3 tài khoản khác nhau, tốn 15–20 phút mỗi vòng kiểm thử và rất dễ thao tác nhầm thứ tự.
  * Nếu dùng Selenium: Mở 3 trình duyệt Chrome cùng lúc ngốn ~2GB RAM, máy ảo CI/CD dễ bị treo do quá tải tài nguyên.

---

```
========================================================================================
[SLIDE 5] KIẾN TRÚC MULTI-ACTOR FIXTURE & DATA-DRIVEN TESTING (DDT)
========================================================================================
```

### 🔄 Slide 5: Kiến trúc Multi-Actor Fixture & Data-Driven Testing (DDT)

* **1. Custom Test Fixture (`actors.fixture.ts`):**
  * Mở rộng hàm `test.extend<ActorPages>` của Playwright để cung cấp sẵn 3 đối tượng đại diện cho 3 vai trò:
    * `customerPage`: Đăng nhập sẵn tài khoản Khách hàng `customer.an@gmail.com`.
    * `staffPage`: Đăng nhập sẵn tài khoản Nhân viên `staff.sg@smartstorage.vn`.
    * `managerPage`: Đăng nhập sẵn tài khoản Quản lý `manager.sg@smartstorage.vn`.
  * Cả 3 context hoạt động song song trong một vòng đời test (Test Lifecycle), tự động giải phóng bộ nhớ khi test kết thúc.

```
                    ┌───────────────────────────────────────────────┐
                    │          Single Browser Instance              │
                    └───────┬───────────────┬───────────────┬───────┘
                            │               │               │
            ┌───────────────▼──┐    ┌───────▼──────────┐    ┌▼──────────────┐
            │ Context 1        │    │ Context 2        │    │ Context 3     │
            │ Customer An      │    │ Staff SG         │    │ Manager SG    │
            │ Token: Bearer A  │    │ Token: Bearer B  │    │ Token: Bearer C│
            └───────────────┬──┘    └───────┬──────────┘    └┬──────────────┘
                            │               │                │
            [1. Báo trả sớm]                │                │
                            └───────► [2. Nghiệm thu]        │
                                            └───────► [3. Duyệt hoàn cọc]
                                                             │
            [4. Tất toán & Thu hồi PIN] ◄────────────────────┘
```

* **2. Data-Driven Testing (DDT) với `settlement-cases.json`:**
  * Tách biệt hoàn toàn mã kiểm thử và dữ liệu kiểm thử. Tự động hóa kiểm chứng 3 bài toán quyết toán tiền cọc biên (`BR-RET-01..03`):
    * **Kịch bản 1 (`TC-F3-01`):** Cọc 2.000.000đ, Thiệt hại 0đ ➔ Hoàn 100% cọc (2.000.000đ), hợp đồng hoàn tất `COMPLETED`.
    * **Kịch bản 2 (`TC-F3-02`):** Cọc 3.000.000đ, Hư hỏng cửa 800.000đ ➔ Khấu trừ cọc, hoàn 2.200.000đ, hợp đồng `COMPLETED`.
    * **Kịch bản 3 (`TC-F3-03`):** Cọc 1.500.000đ, Sập vách ngăn 2.500.000đ ➔ Cọc về 0đ, sinh hóa đơn phụ thu 1.000.000đ, hợp đồng `PENDING_COMPENSATION_PAYMENT`.

---

```
========================================================================================
[SLIDE 6] BẰNG CHỨNG KIỂM THỬ — TRACE VIEWER & HTML REPORT
========================================================================================
```

### 🔍 Slide 6: Bằng chứng Kiểm thử — Trace Viewer & HTML Report

* **1. Playwright Trace Viewer — "Cỗ máy thời gian" (Time-Travel Debugging):**
  * Ghi lại toàn bộ hành trình kiểm thử với độ chi tiết tuyệt đối:
    * **Timeline Screencast:** Xem lại từng khung hình giao diện tại đúng mili-giây xảy ra lỗi.
    * **DOM Snapshots:** Chụp lại trạng thái DOM *Trước (Before)*, *Tại thời điểm (Action)*, và *Sau (After)* khi click chuột.
    * **Network Interception:** Bắt trọn vẹn toàn bộ HTTP Request/Response giữa Frontend React và Backend Spring Boot (Headers, Payload JSON, Status Code 200/400/409).
    * **Console Logs & Call Stack:** Theo dõi lỗi JavaScript phát sinh ở tầng client.
* **2. Báo cáo Tương tác HTML (Interactive HTML Report):**
  * Tự động xuất báo cáo trực quan với cây phân cấp kịch bản, thời gian thực thi từng bước, ảnh chụp màn hình khi fail và video ghi hình đính kèm.
  * Phục vụ như bằng chứng nghiệm thu kỹ thuật không thể chối cãi khi bảo vệ đồ án và bàn giao sản phẩm.

---

```
========================================================================================
[SLIDE 7] KẾT LUẬN & ĐÚC KẾT KINH NGHIỆM
========================================================================================
```

### 💡 Slide 7: Kết luận & Đúc kết Kinh nghiệm

* **1. Hiệu quả định lượng vượt bậc:**
  * **Rút ngắn 75%** thời gian viết mã kịch bản kiểm thử ban đầu nhờ tính năng Record & Playback của Codegen.
  * Thời gian chạy luồng nghiệp vụ 3 bên giảm từ **15 phút (thủ công)** xuống còn **12 – 18 giây (Playwright tự động)**.
  * **Triệt tiêu 100%** lỗi rò rỉ session (Session Bleeding) nhờ kiến trúc Multi-Contexts.
* **2. Khả năng sẵn sàng triển khai CI/CD:**
  * Bộ test suite có thể chạy Headless trên GitHub Actions Linux runner chỉ với 1 CPU core và 2GB RAM.
  * Tự động upload Trace và Video lên GitHub Artifacts mỗi khi có Pull Request mới.
* **3. Đóng góp cho Dự án:**
  * Đảm bảo tính toàn vẹn của nghiệp vụ tài chính và vòng đời kho tự quản cho toàn bộ đồ án SWP391.

---

## PHẦN 2: "PHAO" LỜI THOẠI DEMO LIVE (CHEAT-SHEET 5 - 7 PHÚT)

> **Quy tắc vàng khi Demo Live:**
> 1. Mở sẵn Visual Studio Code và các cửa sổ Terminal ở thư mục dự án.
> 2. Đảm bảo Backend Spring Boot (`http://localhost:8080`) và Frontend React (`http://localhost:5173`) đang chạy ngầm ổn định.
> 3. Phong thái tự tin, dõng dạc, vừa nói vừa trỏ tay vào màn hình chiếu khớp chính xác với thao tác chuột.

---

### ⏱️ Phút 0:00 – 1:30: Dẫn nhập & Biểu diễn Record bằng Codegen

| Thời gian | Lời thoại thuyết trình (Spoken Script) | Thao tác máy tính (Computer Actions) |
| :--- | :--- | :--- |
| **0:00 - 0:40** | *"Kính thưa Thầy và các bạn, em là Nguyễn Văn Gia Bình. Hôm nay em xin trình bày giải pháp Tự động hóa kiểm thử E2E sử dụng Playwright kết hợp Playwright Codegen.<br><br>Trong thực tế, rào cản lớn nhất của các bạn mới làm quen với Automation Testing là việc phải tra cứu DOM và viết từng dòng mã Selector thủ công rất tốn thời gian. Playwright giải quyết triệt để bài toán này với tính năng **Codegen** — Record & Playback thế hệ mới."* | • Chiếu Slide 1 & 2.<br>• Bật Terminal tại thư mục `frontend`. |
| **0:40 - 1:30** | *"Bây giờ em sẽ bật Codegen để ghi lại thao tác người dùng trên hệ thống Self-Storage của em.*<br><br>*(Gõ lệnh)*: `npm run test:e2e:codegen`<br><br>*Như Thầy thấy, hai cửa sổ xuất hiện song song: Bên trái là trình duyệt Chromium, bên phải là Playwright Inspector.<br>Em thao tác đăng nhập tài khoản khách hàng `customer.an@gmail.com`, vào menu Kho của tôi và bấm nút Báo trả kho.<br><br>Quan sát bên cửa sổ Inspector: Từng cú click chuột, từng ký tự nhập vào đều được tự động chuyển hóa thành mã nguồn TypeScript chuẩn mực với các bộ chọn hướng người dùng như `getByRole`, `getByLabel` — hoàn toàn không dùng XPath cứng nhắc. Đây chính là vũ khí giúp tăng tốc độ viết test lên gấp 4 lần!"* | • Gõ: `npm run test:e2e:codegen`<br>• Cửa sổ Chromium và Inspector hiện lên.<br>• Thao tác nhanh: Nhập email, password, bấm Login.<br>• Bấm vào menu "Kho của tôi".<br>• Trỏ chuột vào cửa sổ Inspector chỉ cho Thầy thấy các dòng mã TypeScript được sinh ra trong thời gian thực.<br>• Tắt cửa sổ Codegen. |

---

### ⏱️ Phút 1:30 – 3:30: Chạy Tự động Đa Vai trò với Playwright UI Mode

| Thời gian | Lời thoại thuyết trình (Spoken Script) | Thao tác máy tính (Computer Actions) |
| :--- | :--- | :--- |
| **1:30 - 2:00** | *"Tuy nhiên, giá trị thật sự của Playwright không dừng lại ở Record đơn lẻ, mà nằm ở khả năng kiểm thử các quy trình phức tạp đa người dùng.<br><br>Trong hệ thống Self-Storage của em, nghiệp vụ **Trả kho sớm Win-Win (Flow 3)** đòi hỏi 3 đối tượng người dùng độc lập: Khách hàng yêu cầu, Nhân viên nghiệm thu và Quản lý duyệt hoàn cọc.<br>Nếu dùng Selenium truyền thống, ta phải mở 3 trình duyệt nặng nề hoặc đăng nhập ra vào liên tục. Với Playwright, em sử dụng kỹ thuật **Multi-Browser Contexts** trong file `actors.fixture.ts`."* | • Chiếu Slide 4 & 5.<br>• Mở nhanh file `frontend/e2e/fixtures/actors.fixture.ts` trên VS Code (lướt qua 5 giây để chứng minh có code fixture thật). |
| **2:00 - 3:30** | *"Bây giờ, em xin phép khởi chạy kịch bản tự động hóa toàn diện này bằng **Playwright UI Mode**.*<br><br>*(Gõ lệnh)*: `npm run test:e2e:ui`<br><br>*Em chọn file kiểm thử `flow3-return-settlement.spec.ts` và bấm nút **Run**.*<br><br>*Kính mời Thầy theo dõi luồng thực thi diễn ra tuần tự trong chớp mắt:<br>1. **Bước 1 — Khách hàng:** Context khách hàng mở ra, bấm nút 'Báo trả kho sớm', tích chọn cam kết dọn sạch tài sản theo chính sách Win-Win và gửi yêu cầu.<br>2. **Bước 2 — Nhân viên hiện trường:** Context nhân viên tiếp nhận ngay lập tức, mở biên bản nghiệm thu, tích đủ 4 tiêu chí vệ sinh, ổ khóa và ghi nhận thiệt hại = 0đ.<br>3. **Bước 3 — Quản lý cơ sở:** Context quản lý mở danh sách chờ, thẩm định biên bản và bấm nút Duyệt quyết toán hoàn trả 100% tiền cọc 2.000.000đ.<br>4. **Bước 4 — Đối soát:** Quay lại phía Khách hàng, trạng thái hợp đồng đã chuyển thành Hoàn tất và mã PIN kho lập tức bị thu hồi.*<br><br>*Toàn bộ luồng liên hoàn 3 bên chỉ diễn ra trong vòng **15 giây**, thanh trạng thái xanh 100%!"* | • Gõ: `npm run test:e2e:ui`<br>• Giao diện Playwright Test Runner hiện lên.<br>• Bấm nút Run tại `flow3-return-settlement.spec.ts`.<br>• Trỏ chuột theo các bước chạy trên màn hình để Thầy thấy 3 role phối hợp nhịp nhàng.<br>• Chỉ vào tích xanh Passed và thời gian thực thi (ví dụ: `Passed - 14.8s`). |

---

### ⏱️ Phút 3:30 – 5:00: Trình diễn "Cỗ máy thời gian" Playwright Trace Viewer

| Thời gian | Lời thoại thuyết trình (Spoken Script) | Thao tác máy tính (Computer Actions) |
| :--- | :--- | :--- |
| **3:30 - 4:15** | *"Một câu hỏi đặt ra: Nếu một kịch bản phức tạp như vậy bị lỗi ở bước của Quản lý, làm sao Tester biết được lỗi do Frontend hay do Backend API?<br><br>Playwright cung cấp công cụ gỡ lỗi tối thượng mang tên **Trace Viewer** — được mệnh danh là Cỗ máy thời gian.*<br><br>*Em bấm mở Trace của lượt chạy vừa rồi. Thầy có thể thấy một thanh Timeline từ 0 giây đến 15 giây.*<br>*Khi em kéo con trỏ chuột trên thanh Timeline, toàn bộ giao diện của ứng dụng được tua lại từng khung hình một."* | • Trên giao diện UI Runner, click đúp vào bước kiểm thử vừa chạy để mở cửa sổ **Trace Viewer**.<br>• Rê chuột dọc theo thanh Timeline screencast trên đỉnh màn hình để giao diện phía dưới thay đổi theo từng mili-giây. |
| **4:15 - 5:00** | *"Đặc biệt hơn, ở tab **Actions**, em bấm vào bước 'Duyệt hoàn cọc'. Phía dưới hiển thị 3 trạng thái DOM Snapshot: Trước khi click, Đang click, và Sau khi click.<br><br>Và đây là tab **Network**: Toàn bộ các cuộc gọi API tới Backend Spring Boot được ghi nhận 100%. Em mở request `POST /api/v1/manager/contracts/CTR-2026-001/settlement`: Status trả về `200 OK`, Payload trả về đúng số tiền hoàn cọc `2,000,000 VND`.<br><br>Nhờ Trace Viewer, mọi lỗi Flaky hay lỗi sai lệch dữ liệu đều được phát hiện gốc rễ trong vài giây mà không cần phải chạy lại test!"* | • Bấm vào một Action cụ thể trong danh sách bên trái.<br>• Click chuyển qua lại giữa 2 tab: `Before` và `After` trên snapshot viewer.<br>• Chuyển sang tab `Network` ở bảng điều khiển bên dưới.<br>• Click vào request API để hiển thị Request/Response JSON minh bạch cho Thầy thấy. |

---

### ⏱️ Phút 5:00 – 6:00: Trình chiếu Báo cáo HTML & Video Backup

| Thời gian | Lời thoại thuyết trình (Spoken Script) | Thao tác máy tính (Computer Actions) |
| :--- | :--- | :--- |
| **5:00 - 5:40** | *"Không chỉ hỗ trợ chạy trực quan, Playwright còn tự động đóng gói toàn bộ kết quả thành một **Interactive HTML Report** hoàn chỉnh.*<br><br>*(Gõ lệnh)*: `npm run test:e2e:report`<br><br>*Báo cáo này thống kê chi tiết tỷ lệ thành công, thời gian chạy từng test step. Đặc biệt, đối với các bài toán tài chính biên, kỹ thuật Data-Driven Testing đã đối soát thành công cả 3 kịch bản cọc: Hoàn 100%, Khấu trừ một phần, và Bồi thường vượt cọc.<br><br>Tất cả các lượt chạy test đều được tự động quay video màn hình lưu trong thư mục `test-results`, sẵn sàng đính kèm vào báo cáo nghiệm thu phần mềm."* | • Mở terminal gõ: `npm run test:e2e:report`<br>• Trình duyệt mở trang HTML Report tổng quan.<br>• Cuộn nhanh qua bảng danh sách test case.<br>• Mở một test case có đính kèm video và click play video chạy 3 giây. |
| **5:40 - 6:00** | *"Tổng kết lại, việc kết hợp giữa Playwright Codegen và kiến trúc Multi-Contexts đã giúp nhóm em rút ngắn 75% thời gian phát triển kịch bản kiểm thử, kiểm thử toàn vẹn luồng nghiệp vụ 3 bên trong 15 giây và cung cấp bằng chứng nghiệm thu vững chắc.<br><br>Em xin chân thành cảm ơn Thầy và các bạn đã lắng nghe. Em rất mong nhận được những câu hỏi và nhận xét từ Thầy ạ!"* | • Chuyển về Slide 7 (Kết luận & Q&A).<br>• Đứng thẳng, hướng mắt về phía Thầy Cô, mỉm cười và sẵn sàng bước vào phần trả lời chất vấn. |

---

## PHẦN 3: PHƯƠNG ÁN DỰ PHÒNG KHI MÁY CHIẾU LỖI HOẶC SỰ CỐ KỸ THUẬT (BACKUP PLAN)

Khi đi thuyết trình trực tiếp tại giảng đường, các sự cố ngoài ý muốn như mất mạng Wi-Fi, máy chiếu chập chờn, cổng kết nối HDMI lỏng hoặc Backend bị lỗi đột xuất hoàn toàn có thể xảy ra. Dưới đây là phương án ứng phó chi tiết đã được chuẩn bị sẵn:

### 🛡️ Ma trận Rủi ro & Giải pháp Dự phòng (Risk Contingency Matrix)

| Rủi ro kỹ thuật | Mức độ | Kế hoạch ứng phó tức thời (Plan B) | Thao tác khắc phục trong 10 giây |
| :--- | :---: | :--- | :--- |
| **Mất kết nối mạng Wi-Fi trường** | Trung bình | Toàn bộ hệ thống và kịch bản E2E được thiết kế chạy **100% trên `localhost`** (Frontend cổng `5173`, Backend cổng `8080`, DB SQL Server local). Hoàn toàn không phụ thuộc Internet. | Tiếp tục demo bình thường, nhấn mạnh với Thầy: *"Hệ thống kiểm thử của em độc lập 100% với môi trường bên ngoài."* |
| **Máy chiếu trường bị giật lag / đơ UI Mode** | Nghiêm trọng | Không dùng giao diện đồ họa nặng `playwright test --ui`. Chuyển ngay sang chế độ dòng lệnh Console siêu nhẹ hoặc mở Báo cáo tĩnh đã biên dịch sẵn. | Gõ lệnh Console: `npx playwright test flow3-return-settlement.spec.ts`<br>Hoặc mở file HTML Report tĩnh: `frontend/playwright-report/index.html`. |
| **Backend Spring Boot bị tắt hoặc lỗi cổng 8080** | Rất cao | Mở thư mục Video quay sẵn toàn bộ quá trình chạy test thành công có độ nét cao (Full HD 60fps) được lưu trữ tại `frontend/test-results/`. | Bật Windows Explorer ➔ Vào `frontend/test-results/` ➔ Mở video file `.webm` bằng trình phát Windows Media Player hoặc Chrome. |
| **Máy chiếu bị mất tín hiệu hoàn toàn** | Khẩn cấp | Sử dụng máy tính cá nhân quay màn hình về phía Thầy Cô, trình bày trực tiếp trên màn hình laptop kết hợp tập tài liệu in sẵn `04-DEMO-SCRIPT-DEFENSE.md` và `05-PRESENTATION-SLIDES-AND-SCRIPT.md`. | Bình tĩnh bước lại gần bàn Thầy Cô, mở laptop và tiếp tục thuyết trình không gián đoạn. |

### 📂 Danh mục Đường dẫn File Dự phòng (Offline Assets Index)

1. **Báo cáo HTML tĩnh xem offline (Double-click mở ngay bằng Chrome/Edge):**
   * Đường dẫn tuyệt đối: `c:\Users\admin\Documents\A_FPT\Tempory_Project\Self-Storage-Facility-Rental-and-Management-System\frontend\playwright-report\index.html`
2. **Video ghi hình tự động từng lượt chạy test:**
   * Thư mục chứa video: `c:\Users\admin\Documents\A_FPT\Tempory_Project\Self-Storage-Facility-Rental-and-Management-System\frontend\test-results\`
   * Định dạng video: WebM chuẩn chất lượng cao, ghi trọn vẹn tương tác chuột và bàn phím.
3. **File lưu vết Trace Offline:**
   * Mở xem lại bất kỳ lúc nào bằng lệnh: `npx playwright show-trace frontend/test-results/<tên-thư-mục-test>/trace.zip`

---

## PHẦN 4: BỘ CÂU HỎI THƯỜNG GẶP CỦA GIẢNG VIÊN MÔN KIỂM THỬ (Q&A CHEAT-SHEET)

### ❓ Câu hỏi 1: *"Codegen có thể thay thế hoàn toàn kỹ sư Automation Test không? Nhược điểm của Codegen là gì?"*

* **Trả lời mẫu ghi điểm 10:**
  > *"Dạ thưa Thầy, **Codegen không thể thay thế được kỹ sư Automation Test**.  
  > Codegen là công cụ hỗ trợ tăng tốc độ (Accelerator), đóng vai trò như bản nháp ban đầu.  
  > Nhược điểm của Codegen gồm 3 điểm chính:  
  > 1. **Thiếu tính tái sử dụng:** Code sinh ra tuyến tính (flat script), không tự động áp dụng các mẫu thiết kế chuẩn như Page Object Model (POM) hay Screenplay Pattern.  
  > 2. **Không tự sinh được Assertion nghiệp vụ sâu:** Codegen chủ yếu ghi lại thao tác người dùng (Click, Type), không tự biết được logic nghiệp vụ như so sánh số dư tài khoản hay kiểm tra công thức tài chính.  
  > 3. **Không tự xử lý dữ liệu động:** Không thể tự sinh vòng lặp Data-Driven Testing từ JSON/Database.  
  > Do đó, vai trò của kỹ sư kiểm thử là sử dụng Codegen để record nhanh các khung thao tác cơ bản, sau đó tái cấu trúc thành các Fixture, bóc tách dữ liệu vào file JSON và bổ sung các câu lệnh `expect` kiểm chứng nghiệp vụ chặt chẽ như nhóm em đã làm ạ."*

---

### ❓ Câu hỏi 2: *"Cơ chế nào bên dưới giúp Playwright chạy cùng lúc 3 vai trò Khách hàng - Nhân viên - Quản lý mà không bị đè Session / Token của nhau?"*

* **Trả lời mẫu ghi điểm 10:**
  > *"Dạ thưa Thầy, bí mật nằm ở kiến trúc **BrowserContext** của Playwright:  
  > Trong trình duyệt, Playwright phân cấp thành 3 tầng: `Browser` ➔ `BrowserContext` ➔ `Page`.  
  > - Tầng `Browser` đại diện cho tiến trình trình duyệt vật lý (Chromium Process).  
  > - Tầng `BrowserContext` tương đương với một cửa sổ ẩn danh (Incognito Profile) hoàn toàn độc lập. Mỗi Context sở hữu bộ nhớ riêng biệt về Cookie Jar, LocalStorage, SessionStorage và HTTP Cache.  
  > Trong file `actors.fixture.ts`, nhóm em khởi tạo 3 BrowserContext riêng biệt trên cùng 1 Browser duy nhất. Khi Khách hàng nhận JWT Token A và Quản lý nhận JWT Token B, hai Token này nằm ở hai Cookie Jar tách biệt 100%, không bao giờ xảy ra hiện tượng rò rỉ phiên (Session Bleeding), trong khi vẫn tiết kiệm tối đa CPU và RAM vì không phải khởi động nhiều tiến trình Chromium khác nhau ạ."*

---

### ❓ Câu hỏi 3: *"Tại sao nhóm chọn Playwright thay vì Cypress — công cụ vốn đang rất phổ biến trong cộng đồng React?"*

* **Trả lời mẫu ghi điểm 10:**
  > *"Dạ thưa Thầy, Cypress là một công cụ rất tốt ở thế hệ thứ 2, tuy nhiên khi đối mặt với hệ thống Enterprise có quy trình Multi-Actor như dự án của nhóm em thì Cypress bộc lộ 3 hạn chế chí mạng:  
  > 1. **Kiến trúc In-Browser:** Cypress thực thi mã test bên trong chính iframe của trình duyệt. Điều này khiến Cypress bị giới hạn bởi sandbox bảo mật của browser, không hỗ trợ mở nhiều tab hoặc đa cửa sổ (multi-tab/multi-window) một cách tự nhiên.  
  > 2. **Không hỗ trợ Multi-Context song song:** Cypress không thể duy trì đồng thời 2 phiên người dùng trong cùng một bài test; muốn đổi vai trò buộc phải clear cookies và login lại từ đầu rất chậm.  
  > 3. **Tốc độ và hỗ trợ giao thức:** Playwright giao tiếp out-of-process qua WebSocket trực tiếp bằng giao thức Chrome DevTools Protocol (CDP), hỗ trợ cả Chromium, Firefox và WebKit gốc với hiệu năng vượt trội hơn hẳn ạ."*

---

### ❓ Câu hỏi 4: *"Làm thế nào để đảm bảo dữ liệu kiểm thử không bị rác (dirty data) sau khi chạy kịch bản E2E nhiều lần?"*

* **Trả lời mẫu ghi điểm 10:**
  > *"Dạ thưa Thầy, để duy trì tính độc lập và lặp lại (Idempotency) của kiểm thử tự động, nhóm em áp dụng chiến lược 2 lớp:  
  > - **Lớp 1 (Seed Data chuẩn qua Flyway):** Cơ sở dữ liệu kiểm thử được nạp dữ liệu mẫu ban đầu đồng nhất thông qua các migration script của Flyway.  
  > - **Lớp 2 (Data Teardown / Reset API):** Nhóm xây dựng các endpoint dọn dẹp hoặc tận dụng transaction rollback trong môi trường test. Ngoài ra, trong file `settlement-cases.json`, các mã hợp đồng kiểm thử (`CTR-2026-001`, `CTR-2026-002`...) được định danh riêng cho test suite, giúp việc truy vết và hoàn trả trạng thái về ban đầu diễn ra hoàn toàn tự động mà không ảnh hưởng tới dữ liệu hoạt động bình thường của hệ thống ạ."*

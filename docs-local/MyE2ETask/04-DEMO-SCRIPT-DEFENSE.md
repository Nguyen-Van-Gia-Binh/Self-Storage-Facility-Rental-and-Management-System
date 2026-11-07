# 04. Kịch bản Thuyết trình & Demo Live Bảo vệ Đồ án (Defense Demo Script)

> **Người trình bày:** **Nguyễn Văn Gia Bình** (Technical Lead / Phụ trách WS2)  
> **Thời lượng chuẩn:** **5 phút** súc tích, mạch lạc, thuyết phục tuyệt đối Hội đồng Thầy Cô.  
> **Hai điểm sáng công nghệ & nghiệp vụ cần nhấn mạnh:**  
> 1. **Chính sách Trả sớm Win-Win (`BR-RET-05`):** Giải phóng mặt bằng sớm, khách nhận 100% cọc, công ty bảo toàn doanh thu.  
> 2. **Cơ chế Quản trị Nợ quá hạn 3 Giai đoạn Nhân văn (`BR-OVD-01..03`):** Ân hạn ➔ Phạt lũy tiến ➔ Khóa an ninh ➔ Tự động mở khóa tức thời qua VietQR.

---

## ⏱️ DÒNG THỜI GIAN DEMO LIVE 5 PHÚT (TIMELINE)

### 🎙️ Phút 0:00 – 1:00: Mở đầu & Khẳng định Giá trị Nghiệp vụ Cốt lõi
* **Lời thoại dẫn dắt:**
  > *"Kính thưa Thầy Cô trong Hội đồng phản biện, em là Nguyễn Văn Gia Bình, phụ trách vai trò Technical Lead và Trục nghiệp vụ Vận hành & Vòng đời Hợp đồng.  
  > Trong các hệ thống kho truyền thống, việc trả kho trước hạn và xử lý quá hạn thường dẫn đến tranh chấp pháp lý và khiếu nại dòng tiền. Tại hệ thống Self-Storage của nhóm em, hai bài toán này đã được số hóa và tự động hóa 100% bằng kiến trúc State Machine khép kín và cơ chế thanh toán tức thời."*
* **Slide / Màn hình:** Chiếu sơ đồ tương tác Archify [`docs/diagrams/flow-3-return-settlement/flow3-return-settlement-workflow.html`](../../diagrams/flow-3-return-settlement/flow3-return-settlement-workflow.html) và [`docs/diagrams/flow-6-renewal-overdue/flow-6-2-overdue-lifecycle.html`](../../diagrams/flow-6-renewal-overdue/flow-6-2-overdue-lifecycle.html).

---

### 🖥️ Phút 1:00 – 2:30: Demo Live Flow 3 — Trả sớm Win-Win & Quyết toán điện tử
* **Bước 1 (Portal Khách hàng):**
  - Đăng nhập tài khoản `customer_an`, vào tab "Kho của tôi".
  - Bấm nút `[Đăng ký trả kho sớm]` trên hợp đồng `CTR-2026-001` (vốn còn hạn 3 tháng nữa).
  - Chỉ cho Hội đồng thấy thông báo minh bạch: Hệ thống cam kết hoàn 100% tiền cọc 2.000.000 VND và bảo lưu tiền thuê các tháng đã trả trước. Khách tích đồng ý và bấm gửi yêu cầu.
* **Bước 2 (Portal Nhân viên Tiếp đón tại Hiện trường):**
  - Chuyển sang trình duyệt của Nhân viên `staff_01`, mở trang "Nghiệm thu trả kho".
  - Mở biên bản kiểm tra: Tích chọn 4 tiêu chí chuẩn (`BR-CHK-02`), nhập tình trạng kho nguyên vẹn, chi phí bồi thường = 0 VND.
  - Bấm ký xác nhận điện tử trực tiếp.
* **Bước 3 (Portal Quản lý Cơ sở - FM):**
  - Quản lý mở danh sách quyết toán, bấm duyệt hoàn cọc 2.000.000 VND.
* **Điểm nhấn ăn điểm với Hội đồng:**
  - Mở sơ đồ mặt bằng kho: Ô kho `Q9-L1-008` ngay lập tức đổi màu từ **Đang thuê (Xanh đậm)** sang **Đang dọn dẹp vệ sinh (Vàng nhạt)** để chuẩn bị đón khách mới.
  - Mã PIN của khách cũ lập tức bị thu hồi trên hệ thống IoT.

---

### 🚨 Phút 2:30 – 4:00: Demo Live Sub-flow 6.2 — Vòng đời Quá hạn 3 Giai đoạn
* **Bước 1 (Giả lập ngày D+2 — Giai đoạn Ân hạn):**
  - Mở hợp đồng mẫu quá hạn 2 ngày.
  - Chỉ cho Hội đồng: Banner màu vàng nhắc nhở, tiền phạt = **0 VND**, mã PIN **vẫn mở** để khách dọn đồ.
* **Bước 2 (Giả lập ngày D+5 — Giai đoạn Phạt lũy tiến 10%/ngày):**
  - Kích hoạt Cronjob quét ngày D+5.
  - Hệ thống tự động tính: Quá hạn 5 ngày ➔ Phạt 2 ngày từ D+4 ➔ Phí phạt = $2 \times 10\% \times 2.000.000 = \mathbf{400.000\text{ VND}}$.
* **Bước 3 (Giả lập ngày D+7 — Khóa an ninh tự động):**
  - Chạy quét ngày D+7: Hợp đồng chuyển ngay sang `OVERDUE_LOCKED`.
  - Banner chuyển sang màu đỏ rực. Mã PIN tại cửa bị **KHÓA NGAY LẬP TỨC**.
* **Bước 4 (Tự động mở khóa tức thời qua VietQR):**
  - Khách bấm `[Nộp phạt & Mở khóa]`.
  - Màn hình sinh mã VietQR động đúng số tiền phạt 400.000 VND.
  - Sau khi giả lập thanh toán: Hệ thống nhận Webhook, hợp đồng tự động chuyển sang `OVERDUE_CLEARED`, mã PIN được cấp lại ngay lập tức để khách vào lấy hàng.

---

### 📊 Phút 4:00 – 5:00: Trình chiếu Bằng chứng Kiểm thử (Zero-Drift & Test Automation)
* **Chứng minh năng lực kỹ thuật:**
  - Bật terminal chạy lệnh `mvn test -Dtest=ContractReturnServiceTest,OverdueCronJobTest`.
  - Kết quả: **`BUILD SUCCESS` (100% Passed)**.
  - Chiếu sơ đồ Archify đối soát: Từng nút bấm, từng dòng mã nguồn `@Scheduled` và `@facilitySecurity` đều đã được kiểm chứng 1-1 với kiến trúc backend.
* **Lời kết:**
  > *"Hệ thống đảm bảo tính nhân văn đối với khách hàng nhưng bảo vệ tuyệt đối an ninh và dòng tiền cho doanh nghiệp. Em xin kết thúc phần trình bày và sẵn sàng lắng nghe câu hỏi từ Thầy Cô."*

---

## 🎯 BỘ CÂU HỎI "SÁT THỦ" CỦA HỘI ĐỒNG VÀ PHƯƠNG ÁN ĐỐI ĐÁP ĐIỂM 10

### ❓ Câu hỏi 1: *"Nếu khách hàng làm hư hỏng ô kho với chi phí lớn hơn tiền cọc, hệ thống của em giải quyết thế nào?"*
* **Trả lời chuẩn:**  
  > *"Dạ thưa Thầy Cô, theo quy tắc `BR-RET-03` đã được nhóm cài đặt tại `ContractSettlementService`, khi chi phí thiệt hại vượt quá tiền cọc, toàn bộ tiền cọc sẽ bị khấu trừ về 0 (`refund_amount = 0`), đồng thời hệ thống tự động sinh một hóa đơn phụ phí bồi thường phát sinh (`invoice.type = DAMAGE_COMPENSATION`). Hợp đồng được giữ ở trạng thái `PENDING_COMPENSATION_PAYMENT`. Khách hàng phải thanh toán đủ hóa đơn này thì mới được hoàn tất thanh lý hợp đồng ạ."*

### ❓ Câu hỏi 2: *"Tại sao ở ngày D+4 đến D+6 bị phạt tiền mà các em vẫn để mã PIN mở cửa kho?"*
* **Trả lời chuẩn:**  
  > *"Dạ thưa Thầy Cô, đây là tính nhân văn và thực tế trong quản lý kho tự quản theo quy tắc `BR-OVD-02`: Nếu khóa kho ngay từ ngày D+4 thì khách không thể vào dọn hàng, dẫn đến họ bỏ mặc luôn hàng hóa và tranh chấp pháp lý kéo dài. Nhóm để mã PIN mở đến hết ngày D+6 nhằm khuyến khích khách hàng tự nguyện vào dọn đồ trả kho sớm. Chỉ khi đến ngày D+7 (đã quá 1 tuần), hệ thống mới kích hoạt khóa an ninh cưỡng chế theo `BR-OVD-03` ạ."*

### ❓ Câu hỏi 3: *"Nếu khách bấm Yêu cầu trả kho, nhưng đồng thời Quản lý đang thực hiện đổi ô kho khác do sự cố thì có bị xung đột dữ liệu không?"*
* **Trả lời chuẩn:**  
  > *"Dạ thưa Thầy Cô, hệ thống áp dụng cơ chế Pessimistic Locking với câu lệnh `SELECT ... FOR UPDATE` (hoặc Sorted Locking trên cặp ID) tại `ContractReturnServiceImpl`. Khi một tiến trình đang xử lý trả kho, bản ghi hợp đồng sẽ bị khóa; tiến trình đổi kho buộc phải đợi hoặc bị từ chối với lỗi `409 Conflict: Contract is currently in return process`, do đó triệt tiêu hoàn toàn nguy cơ Race Condition ạ."*

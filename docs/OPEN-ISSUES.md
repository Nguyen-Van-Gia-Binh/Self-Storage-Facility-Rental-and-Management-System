# Sổ vấn đề mở

> Nơi ghi những phát hiện **chưa giải quyết được** trong lúc review tài liệu.
>
> Mục đích: cho phép **đóng một vòng review mà không phải giải quyết hết mọi thứ**. Xem
> [REVIEW-CHECKLIST.md § 1](REVIEW-CHECKLIST.md#1-mô-hình-3-lớp-và-luật-dừng).

---

## Cách dùng

- Quá **15 phút** không giải quyết được một phát hiện → ghi vào đây rồi đi tiếp.
- Vấn đề cần cả nhóm quyết thì thuộc về buổi họp, không thuộc vòng review của một người.
- Giải quyết xong thì đổi trạng thái sang **Đã chốt** kèm ngày và kết luận — **không xóa dòng**, để
  còn tra lại vì sao chọn phương án đó.
- Trạng thái: `Mở` · `Đang bàn` · `Đã chốt`

---

## Danh sách

| Mã | Vấn đề | Tài liệu liên quan | Chờ ai quyết | Trạng thái |
|----|--------|--------------------|--------------|------------|
| `ISS-02` | **`SA-01` và `SA-04` không thuộc "Phạm vi liên quan" của flow nào** trong `TOPIC.md § 4–5`. Hiện xử lý bằng cách tách thành `UC-SYS-02`, `UC-SYS-03` đứng ngoài 7 flow. Phương án thay thế: bổ sung hai mã này vào Flow 5 trong `TOPIC.md` | `USE-CASES.md § 9`, `TOPIC.md § 4` | Cả nhóm | Mở |
| `ISS-03` | **Actor `System` không có trong ma trận `TOPIC.md § 6`.** Được thêm vào bảng use case để biểu diễn scheduled job. Cần quyết: bổ sung vào § 6 hay giữ ngoài và ghi chú | `USE-CASES.md § 1`, `TOPIC.md § 6` | Bình | Mở |
| `ISS-04` | **`UC-F2-06`, `UC-F3-09`, `UC-F7-07` có phải use case độc lập không?** Cả ba đều là "cập nhật trạng thái ô kho", có thể chỉ là hệ quả của use case khác chứ không phải mục tiêu riêng của actor | `USE-CASES.md` | Bình | Mở |
| `ISS-06` | **File `.puml` chưa từng được render** nên chưa xác nhận không có lỗi cú pháp. Phải mở bằng extension PlantUML trong VS Code để kiểm | `diagrams/use-case-diagram.puml` | Bình | Mở |
| `ISS-09` | **Ba nhóm quy tắc Vận hành & An ninh đã được merge nhưng chưa được nhóm duyệt:** `BR-CHK-*` (Check-in & Handover), `BR-ACC-*` (Access Credential), `BR-SUP-*` (Support SLA). Cần review semantic và biểu quyết trước khi coi là baseline chính thức | `BUSINESS-RULES.md`, `USER-STORIES-FS-FM.md` | Bình + Tùng | Đang bàn |

---

## Đã chốt

| Mã | Vấn đề | Kết luận | Ngày |
|----|--------|----------|------|
| `ISS-00` | `US-SC-02.2` có 5 acceptance criteria nhưng cả 5 đều là happy path, vi phạm quy ước "mỗi story phải có ít nhất một AC cho nhánh thất bại" ở `USER-STORIES-SC.md § 1` | Bổ sung `AC-6`: bảng giá thay đổi trong lúc khách đang ở màn hình xác nhận thì hệ thống từ chối tạo Reservation theo giá cũ và bắt xác nhận lại | 08/09/2026 |
| `ISS-01` | Chu kỳ thanh toán chưa được đề bài xác định | Chọn trả trước **toàn bộ phí thuê N tháng cùng Deposit** trong một giao dịch theo `BR-GEN-03`, `BR-PAY-01`; không hỗ trợ thu từng tháng trong baseline | 09/09/2026 |
| `ISS-05` | Chiều quan hệ `include` giữa lịch hẹn, thanh toán và phân bổ Storage Unit chưa rõ | Giữ `UCF107 ..> UCF108` vì thanh toán thành công phải dẫn tới phân bổ unit; bỏ `UCF109 ..> UCF107` vì xem/nhận lại lịch hẹn không thực hiện thanh toán lần nữa | 09/09/2026 |
| `ISS-08` | `BR-DEP-06` cho phép đổi Unit Type nhưng không có use case và mâu thuẫn `BR-REN-08` | Baseline không hỗ trợ đổi Unit Type / Storage Unit trên Reservation hoặc Contract hiện hữu: trước Check-in hủy và đặt lại, sau Check-in Return rồi tạo Reservation mới | 09/09/2026 |
| `ISS-10` | Actor của Flow 6 chưa khớp baseline tự động | Đổi `UC-F6-04`, `UC-F6-07`, `UC-F6-08` sang System; `UC-F6-09` giữ Facility Manager cho xử lý tài sản sau khi hệ thống tự chấm dứt tại D+60; đồng bộ PlantUML | 09/09/2026 |
| `ISS-11` | FS/FM stories vừa merge chưa khớp baseline Flow 3/6 | Đã sửa capacity hold, state *Maintenance* / *Closed*, Renewal và Overdue tự động, hai nhánh thanh toán nợ, xử lý tài sản D+60 và công thức Usage Rate | 09/09/2026 |
| `ISS-07` | `BR-OVD-10` miễn/giảm phí theo vụ không có UC/story riêng | Thêm `UC-F6-12` (FM đề xuất) và `UC-F4-13` (BM duyệt), story `US-FM-04.4` và `US-BM-03.4`; `UC-F4-09` chỉ còn chính sách/chương trình chung | 09/09/2026 |

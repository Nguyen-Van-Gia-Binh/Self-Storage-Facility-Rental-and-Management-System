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
| `ISS-01` | **Chu kỳ thanh toán.** Đề bài không nói rõ. Hiện đang chốt ở `BR-GEN-03`: khách trả trước **toàn bộ** phí thuê N tháng cùng Deposit khi đặt chỗ. Phương án thay thế là thu theo từng tháng — nếu đổi thì [BUSINESS-RULES.md § 6](BUSINESS-RULES.md#6-overdue--quá-hạn) phải viết lại đáng kể và T4.5, T4.6 bị ảnh hưởng | `BUSINESS-RULES.md` | Cả nhóm | Mở |
| `ISS-02` | **`SA-01` và `SA-04` không thuộc "Phạm vi liên quan" của flow nào** trong `TOPIC.md § 4–5`. Hiện xử lý bằng cách tách thành `UC-SYS-02`, `UC-SYS-03` đứng ngoài 7 flow. Phương án thay thế: bổ sung hai mã này vào Flow 5 trong `TOPIC.md` | `USE-CASES.md § 9`, `TOPIC.md § 4` | Cả nhóm | Mở |
| `ISS-03` | **Actor `System` không có trong ma trận `TOPIC.md § 6`.** Được thêm vào bảng use case để biểu diễn scheduled job. Cần quyết: bổ sung vào § 6 hay giữ ngoài và ghi chú | `USE-CASES.md § 1`, `TOPIC.md § 6` | Bình | Mở |
| `ISS-04` | **`UC-F2-06`, `UC-F3-09`, `UC-F7-07` có phải use case độc lập không?** Cả ba đều là "cập nhật trạng thái ô kho", có thể chỉ là hệ quả của use case khác chứ không phải mục tiêu riêng của actor | `USE-CASES.md` | Bình | Mở |
| `ISS-05` | **Chiều quan hệ include đáng ngờ** trong Use Case Diagram: `UCF109 ..> UCF107` ("Nhận lịch hẹn" include "Thanh toán") và `UCF107 ..> UCF108` ("Thanh toán" include "Phân bổ ô kho") | `diagrams/use-case-diagram.puml` | Bình | Mở |
| `ISS-06` | **File `.puml` chưa từng được render** nên chưa xác nhận không có lỗi cú pháp. Phải mở bằng extension PlantUML trong VS Code để kiểm | `diagrams/use-case-diagram.puml` | Bình | Mở |

---

## Đã chốt

| Mã | Vấn đề | Kết luận | Ngày |
|----|--------|----------|------|
| `ISS-00` | `US-SC-02.2` có 5 acceptance criteria nhưng cả 5 đều là happy path, vi phạm quy ước "mỗi story phải có ít nhất một AC cho nhánh thất bại" ở `USER-STORIES.md § 1` | Bổ sung `AC-6`: bảng giá thay đổi trong lúc khách đang ở màn hình xác nhận thì hệ thống từ chối tạo Reservation theo giá cũ và bắt xác nhận lại | 08/09/2026 |

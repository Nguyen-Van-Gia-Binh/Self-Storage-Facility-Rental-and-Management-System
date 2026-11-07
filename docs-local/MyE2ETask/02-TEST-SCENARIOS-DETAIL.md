# 02. Đặc tả Chi tiết Kịch bản Kiểm thử (Test Scenarios Detail)

> **Người thực hiện:** **Nguyễn Văn Gia Bình** (Technical Lead / WS2)  
> **Cấu trúc chuẩn:** Định dạng **Gherkin (Given - When - Then)** có đối soát trực tiếp mã nguồn và cơ sở dữ liệu.

---

## 📦 NHÓM 1: CÁC CA KIỂM THỬ FLOW 3 (TRẢ SỚM WIN-WIN & TẤT TOÁN)

### 📌 `TC-F3-01`: Khách hàng chủ động trả kho sớm (Win-Win Early Return) — Kho nguyên vẹn
* **Mức độ ưu tiên:** P0 (Critical Happy Path)
* **Quy tắc nghiệp vụ:** `BR-RET-01` (Hoàn 100% cọc), `BR-RET-05` (Không hoàn tiền thuê còn lại).
* **Dữ liệu giả lập (Pre-conditions):**
  - Khách hàng: `customer_an` (ID: 101).
  - Hợp đồng: Mã `CTR-2026-001`, thời hạn thuê 6 tháng (01/08/2026 – 31/01/2027), đơn giá 2.000.000 VND/tháng.
  - Đã thanh toán trước 6 tháng: 12.000.000 VND.
  - Tiền cọc đang giữ (`deposit_amount`): 2.000.000 VND.
  - Ô kho đang gán: `Q9-L1-008` (Cơ sở Quận 9), trạng thái hợp đồng `ACTIVE`.
* **Kịch bản thực thi (Test Steps):**
  1. **Bước 1 (Khách thao tác):** Ngày 05/11/2026 (trước hạn gần 3 tháng), khách vào trang "Kho của tôi" (`/customer/my-units`), bấm nút `[Đăng ký trả kho sớm]`.
  2. **Bước 2:** Modal `ScheduleReturnModal` hiển thị thông báo chính sách Win-Win:  
     > *"Bạn đang yêu cầu trả kho sớm vào ngày 08/11/2026. Tiền cọc 2.000.000 VND sẽ được hoàn lại 100% nếu kho nguyên vẹn. Tiền thuê của các tháng còn lại sẽ không được hoàn trả."*
  3. **Bước 3:** Khách tích chọn xác nhận đồng ý điều khoản và bấm `[Xác nhận trả kho]`.
  4. **Bước 4 (Nhân viên nghiệm thu):** Nhân viên `staff_01` truy cập `/staff/inspections`, mở biên bản kiểm tra ô `Q9-L1-008`:
     - Tích đủ 4 tiêu chí đạt chuẩn: Vệ sinh sạch sẽ, cửa khóa tốt, không ẩm mốc, khóa IoT nguyên vẹn.
     - Chi phí thiệt hại nhập: `0 VND`. Bấm `[Hoàn thành nghiệm thu]`.
  5. **Bước 5 (Quản lý phê duyệt):** Quản lý `manager_01` vào `/manager/settlements`, kiểm tra biên bản và bấm `[Phê duyệt hoàn cọc]`.
* **Kết quả kỳ vọng (Expected Results):**
  - **Database:**
    - Bảng `rental_contract`: `status = 'COMPLETED'`, `actual_return_date = '2026-11-08'`.
    - Bảng `contract_settlement`: `refund_amount = 2000000.00`, `damage_fee = 0.00`, `status = 'APPROVED'`.
    - Bảng `storage_unit`: Trạng thái ô `Q9-L1-008` chuyển sang `CLEANING` (thời gian đệm dọn dẹp vệ sinh trước khi mở lại `AVAILABLE`).
    - Bảng `access_code`: Mã PIN của khách hàng bị chuyển sang `REVOKED`.
  - **Frontend UI:**
    - Trên thẻ kho của khách hàng: Hiển thị nhãn `Đã tất toán (Hoàn cọc 2.000.000 VND)`. Mã PIN biến mất.

---

### 📌 `TC-F3-02`: Nghiệm thu hiện trường phát hiện hư hại hoặc mất chìa cơ (Khấu trừ cọc)
* **Mức độ ưu tiên:** P0 (Negative / Financial Integrity)
* **Quy tắc nghiệp vụ:** `BR-RET-02` (Khấu trừ thiệt hại vào cọc), `BR-CHK-02` (Biên bản 4 tiêu chí).
* **Dữ liệu giả lập:**
  - Hợp đồng `CTR-2026-002` (Khách `customer_binh`), Tiền cọc giữ: 3.000.000 VND. Ô kho: `CG-L2-015` (Cầu Giấy).
* **Kịch bản thực thi:**
  1. Khách hàng gửi yêu cầu trả kho.
  2. Nhân viên `staff_02` mở màn hình nghiệm thu hiện trường:
     - Tích chọn: Cửa cuốn bị móp méo và mất chìa khóa cơ dự phòng.
     - Tải lên 2 ảnh chụp hiện trường vi phạm.
     - Nhập phụ phí thiệt hại theo biểu giá quy định của BOM: `800.000 VND` (Sửa cửa: 500k, Thay ổ khóa: 300k).
     - Bấm `[Ký biên bản & Gửi quản lý]`.
  3. Quản lý kiểm tra và duyệt quyết toán.
* **Kết quả kỳ vọng:**
  - **Database:**
    - Bảng `contract_settlement`:
      - `damage_fee`: `800000.00`
      - `deposit_amount`: `3000000.00`
      - `refund_amount`: `2200000.00` ($3.000.000 - 800.000 = 2.200.000\text{ VND}$)
      - `status`: `APPROVED`
  - **Frontend UI:**
    - Màn hình khách hàng hiển thị bảng sao kê chi tiết: Tiền cọc (3M) - Chi phí khắc phục hư hại (800k) = Số tiền thực nhận (2.2M).

---

### 📌 `TC-F3-03`: Bồi thường hư hại vượt quá tiền cọc (Sinh hóa đơn thu thêm)
* **Mức độ ưu tiên:** P1 (Boundary Financial Case)
* **Quy tắc nghiệp vụ:** `BR-RET-03` (Phụ phí vượt cọc), `BR-PRI-06` (Hóa đơn đền bù).
* **Dữ liệu giả lập:**
  - Hợp đồng `CTR-2026-003`, Tiền cọc giữ: 1.500.000 VND.
* **Kịch bản thực thi:**
  1. Nhân viên nghiệm thu phát hiện khách làm sập vách ngăn ngăn cách 2 ô kho.
  2. Đánh giá tổng chi phí phục hồi: `2.500.000 VND`.
  3. Quản lý duyệt biên bản bồi thường.
* **Kết quả kỳ vọng:**
  - **Database:**
    - `refund_amount = 0.00` (Cọc bị khấu trừ 100%).
    - Bảng `invoice` tự động sinh 1 hóa đơn phụ thu mới: `amount = 1000000.00` ($2.500.000 - 1.500.000$), `type = 'DAMAGE_COMPENSATION'`, `status = 'UNPAID'`.
    - Hợp đồng giữ trạng thái `PENDING_COMPENSATION_PAYMENT` (chỉ chuyển `COMPLETED` khi khách nộp đủ 1.000.000 VND còn thiếu).

---

### 📌 `TC-F3-04`: Khách hàng đổi ý bấm Hủy yêu cầu trả kho (Cancel Return Request)
* **Mức độ ưu tiên:** P1 (Edge Case / Rollback)
* **Quy tắc nghiệp vụ:** `BR-CAN-06` (Khách được hủy yêu cầu nếu Staff chưa bắt đầu kiểm tra).
* **Kịch bản thực thi:**
  1. Hợp đồng đang ở trạng thái `PENDING_RETURN`.
  2. Khách hàng đổi ý, bấm nút `[Hủy yêu cầu trả kho]` trên Portal.
  3. Modal cảnh báo hiển thị: *"Bạn có chắc chắn muốn hủy yêu cầu trả kho và tiếp tục sử dụng ô kho này?"* ➔ Bấm `[Đồng ý hủy]`.
* **Kết quả kỳ vọng:**
  - **Database:**
    - Bảng `rental_contract`: `status` phục hồi ngay về `ACTIVE`.
    - Yêu cầu nghiệm thu trong bảng `inspection_task` bị hủy (`status = 'CANCELLED'`).
    - Mã PIN mở cửa và quyền ra vào kho của khách hàng được duy trì bình thường, không bị gián đoạn.

---

## ⏰ NHÓM 2: CÁC CA KIỂM THỬ SUB-FLOW 6.2 (VÒNG ĐỜI QUÁ HẠN D+1..D+10)

### 📌 `TC-F6-01`: Hết hạn hợp đồng chưa dọn kho — Giai đoạn Ân hạn (D+1 đến D+3)
* **Mức độ ưu tiên:** P0 (Core Overdue Policy)
* **Quy tắc nghiệp vụ:** `BR-OVD-01` (Ân hạn nhắc nợ, miễn phạt 100%, duy trì mã PIN).
* **Dữ liệu giả lập:**
  - Hợp đồng `CTR-2026-004`, Ngày hết hạn: `05/11/2026`. Tiền cọc: 2.000.000 VND.
  - Hiện tại: `07/11/2026` (Ngày D+2 sau khi hết hạn). Khách chưa gia hạn và chưa bàn giao kho.
* **Kịch bản thực thi:**
  - Chạy `OverdueCronJob` quét tại thời điểm 00:00:00 ngày 07/11/2026.
* **Kết quả kỳ vọng:**
  - **Database:**
    - Bảng `rental_contract`: `status = 'OVERDUE'`.
    - Bảng `overdue_log`: Ghi nhận `overdue_days = 2`, `penalty_rate = 0.00`, `penalty_amount = 0.00`.
    - Bảng `access_code`: `status = 'ACTIVE'` (Mã PIN vẫn mở cửa bình thường).
  - **Frontend UI:**
    - Thẻ kho của khách xuất hiện Banner màu vàng:  
      > ⚠️ *"Hợp đồng của bạn đã hết hạn 2 ngày. Bạn đang trong thời gian ân hạn 3 ngày (Miễn phí phạt). Vui lòng dọn dẹp hàng hóa hoặc liên hệ gia hạn ngay."*

---

### 📌 `TC-F6-02`: Bắt đầu tính phạt trễ hạn — Giai đoạn D+4 đến D+6
* **Mức độ ưu tiên:** P0 (Financial Calculation)
* **Quy tắc nghiệp vụ:** `BR-OVD-02` (Phạt 10%/ngày tiền cọc, tối đa 30% ở giai đoạn này).
* **Dữ liệu giả lập:**
  - Hợp đồng `CTR-2026-004`, Ngày hết hạn: `05/11/2026`.
  - Giả lập thời gian hệ thống: `10/11/2026` (Ngày D+5).
* **Kịch bản thực thi:**
  - `OverdueCronJob` thực thi quét lúc 00:00:00 ngày D+5.
* **Kết quả kỳ vọng:**
  - **Database:**
    - Số ngày phạt tính từ D+4: $5 - 3 = 2$ ngày phạt.
    - Mức phạt: $2 \times 10\% = 20\%$ tiền cọc.
    - Tiền phạt tích lũy: $20\% \times 2.000.000 = \mathbf{400.000\text{ VND}}$.
    - `access_code`: Vẫn giữ `ACTIVE` để khách vào dọn kho.
  - **Frontend UI:**
    - Banner chuyển sang màu Cam cảnh báo:  
      > ⚠️ *"Hợp đồng quá hạn 5 ngày. Phí phạt chậm trả tích lũy: 400.000 VND (10%/ngày). Vui lòng thanh toán và hoàn tất dọn kho trước ngày D+7 để tránh bị khóa an ninh."*

---

### 📌 `TC-F6-03`: Khóa an ninh & Trần phạt tối đa — Giai đoạn D+7 đến D+10
* **Mức độ ưu tiên:** P0 (Security & Lockout Enforcement)
* **Quy tắc nghiệp vụ:** `BR-OVD-03` (Khóa mã PIN/QR, phạt tối đa trần 70% cọc).
* **Dữ liệu giả lập:**
  - Giả lập thời gian hệ thống: `12/11/2026` (Ngày D+7) và `15/11/2026` (Ngày D+10).
* **Kịch bản thực thi:**
  - `OverdueCronJob` quét lúc 00:00:00 ngày D+7 và D+10.
* **Kết quả kỳ vọng:**
  - **Ngày D+7:**
    - `rental_contract`: `status = 'OVERDUE_LOCKED'`.
    - `access_code`: `status = 'LOCKED'`. Khách hàng dùng mã PIN hoặc quét QR tại cửa kho đều bị từ chối (`403 Access Denied: Contract Overdue Locked`).
    - Tiền phạt: Ngày D+7 = $(7 - 3) \times 10\% = 40\%$ cọc = `800.000 VND`.
  - **Ngày D+10:**
    - Tiền phạt tích lũy chạm trần: $7 \times 10\% = 70\%$ cọc = `1.400.000 VND`.
  - **Frontend UI:**
    - Banner chuyển sang màu Đỏ khẩn cấp:  
      > ⛔ *"Ô KHO ĐÃ BỊ KHÓA AN NINH DO QUÁ HẠN 7 NGÀY. Mã PIN mở cửa đã bị vô hiệu hóa. Vui lòng thanh toán khoản phạt 800.000 VND để mở khóa hoặc liên hệ Ban Quản lý."*

---

### 📌 `TC-F6-04`: Khách nộp phạt quá hạn qua VietQR ➔ Tự động mở khóa tức thời
* **Mức độ ưu tiên:** P0 (Self-Healing / Recovery Flow)
* **Quy tắc nghiệp vụ:** `BR-OVD-04` (Khách trả đủ nợ quá hạn -> mở khóa kho).
* **Kịch bản thực thi:**
  1. Hợp đồng đang ở `OVERDUE_LOCKED`, nợ phạt: 800.000 VND.
  2. Khách bấm nút `[Nộp phạt & Mở khóa]` trên portal.
  3. Hệ thống sinh mã VietQR động đúng số tiền 800.000 VND kèm nội dung chuyển khoản chuẩn.
  4. Khách thanh toán -> Webhook PayOS trả về `PAID`.
* **Kết quả kỳ vọng:**
  - **Database:**
    - Bảng `payment_transaction`: `status = 'SUCCESS'`.
    - Bảng `rental_contract`: `status` chuyển sang `OVERDUE_CLEARED`.
    - Bảng `access_code`: Kích hoạt mở lại `status = 'ACTIVE'`, cấp mã PIN tạm thời 24h để khách đến lấy hàng.
  - **Frontend UI:**
    - Mở quyền bấm nút `[Đăng ký trả kho ngay]` để khách hẹn giờ hoàn tất dọn kho và tất toán.

---

### 📌 `TC-F6-05`: Quá hạn trên 10 ngày (D+11 trở đi) — Chấm dứt & Niêm phong
* **Mức độ ưu tiên:** P1 (Default / Asset Liquidation)
* **Quy tắc nghiệp vụ:** `BR-OVD-05` (Tịch thu 100% cọc, kiểm kê niêm phong).
* **Kịch bản thực thi:**
  - Hợp đồng vượt mốc D+10 (ngày D+11) mà khách vẫn bặt vô âm tín.
  - Quản lý cơ sở thực hiện quy trình cưỡng chế theo hợp đồng.
* **Kết quả kỳ vọng:**
  - Hợp đồng: Chuyển sang `TERMINATED_DEFAULTED`.
  - Toàn bộ tiền cọc 2.000.000 VND bị tịch thu chuyển vào quỹ bồi thường rủi ro của cơ sở.
  - Nhân viên cùng bảo vệ tiến hành cắt khóa cơ, lập biên bản kiểm kê tài sản tồn đọng và chuyển vào kho thanh lý (`AUCTION_PENDING`).

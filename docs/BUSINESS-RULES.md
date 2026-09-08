# Business Rules — Quy tắc nghiệp vụ

> **Self-Storage Facility Rental and Management System** — chốt quy tắc về **Deposit**, **Renewal**,
> **Cancellation**, **Return** và **Overdue**.
>
> Nhiệm vụ **T1.5** · Giai đoạn 1 · [PLAN.md](PLAN.md).
> Tài liệu liên quan: [TOPIC.md](TOPIC.md) · [USE-CASES.md](USE-CASES.md) ·
> [USER-STORIES.md](USER-STORIES.md) · [USER-STORIES-BM-SA.md](USER-STORIES-BM-SA.md)

---

## Mục lục

1. [Nguyên tắc chung](#1-nguyên-tắc-chung)
2. [Bảng tham số cấu hình](#2-bảng-tham-số-cấu-hình)
3. [Deposit — Tiền cọc](#3-deposit--tiền-cọc)
4. [Cancellation — Hủy đặt chỗ](#4-cancellation--hủy-đặt-chỗ)
5. [Renewal — Gia hạn](#5-renewal--gia-hạn)
6. [Overdue — Quá hạn](#6-overdue--quá-hạn)
7. [Return — Trả kho](#7-return--trả-kho)
8. [Vòng đời trạng thái](#8-vòng-đời-trạng-thái)
9. [Ví dụ tính tiền](#9-ví-dụ-tính-tiền)
10. [Bản đồ quy tắc × use case](#10-bản-đồ-quy-tắc--use-case)

---

## 1. Nguyên tắc chung

| Mã | Quy tắc |
|----|---------|
| `BR-GEN-01` | **Mọi con số trong tài liệu này là tham số cấu hình, không hard-code.** Business Operations Manager sửa được qua `BM-02` (chính sách) và `BM-03` (giá, phí). Giá trị ở § 2 là giá trị mặc định khi khởi tạo hệ thống |
| `BR-GEN-02` | **Chính sách có phiên bản.** Hợp đồng bị ràng buộc bởi phiên bản chính sách **tại thời điểm ký**. Thay đổi chính sách sau đó chỉ áp cho hợp đồng mới và cho lần Renewal kế tiếp, không hồi tố |
| `BR-GEN-03` | **Chu kỳ thuê tính theo tháng.** Khách chọn thời hạn N tháng và **thanh toán trước toàn bộ** phí thuê N tháng cùng tiền Deposit khi đặt chỗ. Hết N tháng thì gia hạn (§ 5) hoặc trả kho (§ 7) |
| `BR-GEN-04` | Đơn vị tiền tệ là **VND**. Mọi khoản tính ra tiền được làm tròn lên đến **1.000 đ** |
| `BR-GEN-05` | Giá thuê một ô kho lấy theo **Unit Type × Facility** tại thời điểm tạo Reservation, khóa giá trong suốt thời hạn hợp đồng |
| `BR-GEN-06` | Mốc thời gian nghiệp vụ tính theo **ngày lịch**, múi giờ `Asia/Ho_Chi_Minh`, mốc đổi ngày là 00:00. Riêng "ngày làm việc" loại trừ Thứ Bảy, Chủ Nhật và ngày lễ |

---

## 2. Bảng tham số cấu hình

Toàn bộ tham số nghiệp vụ nằm ở một chỗ để tra nhanh. Cột **Khóa cấu hình** là tên khóa dùng trong
bảng chính sách của hệ thống (`BM-02`, `BM-03`).

| Khóa cấu hình | Ý nghĩa | Mặc định | Quy tắc |
|---------------|---------|:--------:|---------|
| `deposit.multiplier` | Hệ số Deposit trên tiền thuê một tháng | `1.0` | `BR-DEP-01` |
| `reservation.hold_hours` | Thời gian giữ chỗ chờ thanh toán | `48 giờ` | `BR-DEP-03` |
| `checkin.grace_days` | Số ngày được phép check-in trễ kể từ ngày bắt đầu thuê | `3 ngày` | `BR-CAN-04` |
| `cancel.full_refund_hours` | Hủy trước ngày bắt đầu bao nhiêu giờ thì hoàn 100% | `48 giờ` | `BR-CAN-01` |
| `cancel.late_refund_rate` | Tỷ lệ hoàn Deposit khi hủy muộn | `50%` | `BR-CAN-02` |
| `cancel.no_show_refund_rate` | Tỷ lệ hoàn Deposit khi no-show | `0%` | `BR-CAN-04` |
| `renewal.reminder_days` | Các mốc nhắc hạn trước ngày hết hạn | `7, 3, 1` | `BR-REN-01` |
| `renewal.min_months` | Thời hạn gia hạn tối thiểu | `1 tháng` | `BR-REN-03` |
| `overdue.grace_days` | Ân hạn sau ngày hết hạn, chưa tính phí | `3 ngày` | `BR-OVD-02` |
| `overdue.daily_rate` | Phí quá hạn mỗi ngày, tính trên tiền thuê một tháng | `5%` | `BR-OVD-03` |
| `overdue.cap_rate` | Trần tổng phí quá hạn của một kỳ | `50%` | `BR-OVD-04` |
| `overdue.lock_access_days` | Số ngày quá hạn thì khóa Access Code | `10 ngày` | `BR-OVD-05` |
| `overdue.notice_days` | Số ngày quá hạn thì gửi thông báo chấm dứt | `30 ngày` | `BR-OVD-06` |
| `overdue.termination_days` | Số ngày quá hạn thì chấm dứt hợp đồng | `60 ngày` | `BR-OVD-07` |
| `return.notice_days` | Số ngày báo trước khi trả kho | `7 ngày` | `BR-RET-01` |
| `return.refund_working_days` | Số ngày làm việc để hoàn Deposit | `7 ngày` | `BR-RET-05` |
| `return.early_refund_rate` | Tỷ lệ hoàn tiền thuê phần chưa dùng khi trả sớm | `0%` | `BR-RET-06` |

---

## 3. Deposit — Tiền cọc

| Mã | Quy tắc |
|----|---------|
| `BR-DEP-01` | Deposit = `deposit.multiplier` × tiền thuê **một tháng** của Unit Type được đặt. Mặc định bằng đúng một tháng tiền thuê |
| `BR-DEP-02` | Deposit được thu **cùng lúc** với phí thuê của toàn bộ thời hạn, trong một giao dịch duy nhất khi khách xác nhận Reservation (`UC-F1-07`) |
| `BR-DEP-03` | Khi Reservation được tạo, hệ thống **giữ chỗ** một ô kho trong `reservation.hold_hours`. Hết thời gian này mà chưa thanh toán đủ, Reservation tự chuyển sang *Expired* và ô kho trở lại *Available* (`UC-F1-11`) |
| `BR-DEP-04` | Deposit **không sinh lãi**, không được dùng để cấn trừ phí thuê hay phí gia hạn trong lúc hợp đồng còn hiệu lực. Chỉ được cấn trừ khi quyết toán lúc trả kho hoặc chấm dứt hợp đồng |
| `BR-DEP-05` | Một hợp đồng giữ đúng **một** khoản Deposit. Gia hạn hợp đồng **không** phát sinh Deposit mới |
| `BR-DEP-06` | Nếu khách đổi sang Unit Type có giá cao hơn, phần chênh lệch Deposit phải nộp bổ sung trước khi việc đổi có hiệu lực. Đổi sang Unit Type rẻ hơn thì phần dư được hoàn khi quyết toán, không hoàn ngay |

---

## 4. Cancellation — Hủy đặt chỗ

Áp dụng cho Reservation **chưa** check-in. Sau khi đã check-in thì không còn là hủy đặt chỗ mà là trả
kho sớm, xử lý theo § 7.

| Mã | Quy tắc |
|----|---------|
| `BR-CAN-01` | Hủy **trước** ngày bắt đầu thuê từ `cancel.full_refund_hours` trở lên → hoàn **100%** Deposit và **100%** phí thuê đã đóng |
| `BR-CAN-02` | Hủy **trong vòng** `cancel.full_refund_hours` trước ngày bắt đầu thuê → hoàn `cancel.late_refund_rate` (50%) Deposit và **100%** phí thuê |
| `BR-CAN-03` | Reservation *Expired* do quá hạn thanh toán (`BR-DEP-03`) không phát sinh hoàn tiền vì chưa thu tiền |
| `BR-CAN-04` | Khách không đến check-in trong `checkin.grace_days` kể từ ngày bắt đầu thuê → Reservation chuyển **No-show**: hoàn `cancel.no_show_refund_rate` (0%) Deposit, hoàn **100%** phí thuê sau khi trừ tiền thuê của những ngày đã giữ ô kho, ô kho trở lại *Available* |
| `BR-CAN-05` | Cơ sở hủy vì lý do từ phía nhà cung cấp (ô kho hư hỏng, cơ sở đóng cửa) → hoàn **100%** mọi khoản, kèm ưu tiên bố trí ô kho tương đương. Không áp dụng tỷ lệ phạt nào (`UC-F1-12`) |
| `BR-CAN-06` | Tiền hoàn được chuyển về phương thức thanh toán gốc trong `return.refund_working_days` ngày làm việc kể từ khi hủy được ghi nhận |
| `BR-CAN-07` | Mỗi Reservation chỉ hủy được **một lần**; đã hủy thì không khôi phục, khách phải đặt lại từ đầu |

---

## 5. Renewal — Gia hạn

| Mã | Quy tắc |
|----|---------|
| `BR-REN-01` | Hệ thống gửi nhắc hạn tự động vào các mốc `renewal.reminder_days` — **7, 3 và 1 ngày** trước ngày hết hạn hợp đồng (`UC-F6-01`) |
| `BR-REN-02` | Gia hạn chỉ hợp lệ khi hợp đồng đang ở trạng thái *Active* hoặc *Overdue* và **không** có khoản nợ phí quá hạn chưa thanh toán |
| `BR-REN-03` | Thời hạn gia hạn tối thiểu là `renewal.min_months` (1 tháng), tính theo bội số tháng nguyên |
| `BR-REN-04` | Gia hạn **có hiệu lực khi thanh toán thành công**. Ngày bắt đầu kỳ mới là ngày liền sau ngày kết thúc kỳ cũ, không phụ thuộc ngày thanh toán |
| `BR-REN-05` | Giá gia hạn áp theo **bảng giá tại thời điểm gia hạn**, không phải giá của kỳ đầu. Nếu giá tăng, hệ thống phải hiển thị rõ mức chênh lệch trước khi khách xác nhận |
| `BR-REN-06` | Gia hạn khi hợp đồng đang *Overdue*: khách phải thanh toán **phí quá hạn phát sinh + phí thuê kỳ mới** trong cùng một giao dịch. Thanh toán xong, hợp đồng trở lại *Active* và Access Code được mở lại nếu đang bị khóa |
| `BR-REN-07` | Gia hạn không được vượt quá **12 tháng** trong một lần thao tác, để tránh khóa giá quá dài |
| `BR-REN-08` | Sau khi gia hạn thành công, ô kho giữ nguyên — hệ thống **không** đổi ô kho cho khách. Muốn đổi ô kho thì phải trả kho rồi đặt hợp đồng mới |

---

## 6. Overdue — Quá hạn

Ngày quá hạn ký hiệu **D+n**, đếm từ ngày liền sau ngày kết thúc hợp đồng.

| Mã | Quy tắc |
|----|---------|
| `BR-OVD-01` | Hợp đồng chuyển sang *Overdue* vào **D+1** nếu chưa gia hạn và chưa hoàn tất trả kho (`UC-F6-05`) |
| `BR-OVD-02` | **D+1 → D+3** là giai đoạn ân hạn `overdue.grace_days`: **chưa** tính phí quá hạn, khách **vẫn** truy cập ô kho bình thường |
| `BR-OVD-03` | Từ **D+4**, phí quá hạn = `overdue.daily_rate` (5%) × tiền thuê **một tháng** × số ngày tính phí. Phí được cộng dồn theo ngày |
| `BR-OVD-04` | Tổng phí quá hạn của một kỳ không vượt quá `overdue.cap_rate` (50%) tiền thuê một tháng. Với mức 5%/ngày, trần đạt được sau **10 ngày tính phí**, tức **D+13**; từ D+14 phí ngừng tăng |
| `BR-OVD-05` | Tại **D+10**, hệ thống khóa Access Code / vô hiệu Access Card, ô kho chuyển trạng thái *Overdue*. Khách **không** vào được ô kho cho tới khi thanh toán đủ (`UC-F6-07`) |
| `BR-OVD-06` | Tại **D+30**, hệ thống gửi **thông báo chấm dứt hợp đồng** qua email và trong ứng dụng, nêu rõ hạn chót và hệ quả (`UC-F6-08`) |
| `BR-OVD-07` | Tại **D+60**, hợp đồng bị **chấm dứt**. Tài sản trong ô kho được xử lý theo chính sách của Business Operations Manager; Deposit bị cấn trừ toàn bộ nợ phí thuê, phí quá hạn và chi phí xử lý (`UC-F6-09`) |
| `BR-OVD-08` | Khách thanh toán đủ nợ ở bất kỳ thời điểm nào **trước D+60** → hợp đồng trở lại *Active* (nếu có gia hạn kèm theo) hoặc chuyển sang quy trình trả kho, Access Code được mở lại trong vòng 1 giờ (`UC-F3-13`, `UC-F6-03`) |
| `BR-OVD-09` | Khách đang có hợp đồng *Overdue* **không được** tạo Reservation mới tại bất kỳ cơ sở nào trong hệ thống |
| `BR-OVD-10` | Miễn hoặc giảm phí quá hạn phải do Facility Manager đề xuất và Business Operations Manager duyệt theo `BM-03`; mọi lần miễn giảm đều ghi nhật ký kèm lý do |

**Tóm tắt mốc thời gian:**

| Mốc | Phí quá hạn | Truy cập ô kho | Trạng thái hợp đồng |
|-----|-------------|----------------|---------------------|
| D+1 → D+3 | Không | Bình thường | Overdue (ân hạn) |
| D+4 → D+9 | 5%/ngày, cộng dồn | Bình thường | Overdue |
| D+10 → D+13 | 5%/ngày tới khi chạm trần 50% | **Bị khóa** | Overdue |
| D+14 → D+29 | Giữ nguyên ở trần 50% | Bị khóa | Overdue |
| D+30 → D+59 | Giữ nguyên ở trần 50% | Bị khóa | Overdue, đã gửi thông báo chấm dứt |
| D+60 | Chốt sổ, cấn trừ Deposit | Bị khóa | **Terminated** |

---

## 7. Return — Trả kho

| Mã | Quy tắc |
|----|---------|
| `BR-RET-01` | Khách phải đăng ký trả kho trước ít nhất `return.notice_days` (7 ngày) so với ngày muốn trả, kèm chọn khung giờ hẹn để Facility Staff kiểm tra (`UC-F3-05`) |
| `BR-RET-02` | Trả kho chỉ hoàn tất khi Facility Staff đã kiểm tra và xác nhận hiện trạng ô kho tại chỗ (`FS-04`, `UC-F3-06`). Khách dọn hết đồ nhưng chưa có xác nhận thì hợp đồng **vẫn** hiệu lực và vẫn tính phí |
| `BR-RET-03` | Ô kho được coi là **nguyên trạng** khi: trống hoàn toàn, không hư hỏng kết cấu, cửa và khóa còn nguyên, sạch ở mức sử dụng bình thường |
| `BR-RET-04` | Quyết toán khi trả kho: **Số tiền hoàn = Deposit − chi phí khắc phục hư hỏng − phí quá hạn còn nợ − phụ phí chưa thanh toán**. Nếu kết quả **âm**, khách phải nộp bổ sung phần thiếu trước khi hợp đồng đóng (`UC-F3-13`) |
| `BR-RET-05` | Tiền hoàn được chuyển về phương thức thanh toán gốc trong `return.refund_working_days` (7 ngày làm việc) kể từ ngày Facility Staff xác nhận |
| `BR-RET-06` | **Trả sớm không được hoàn** tiền thuê của phần thời hạn chưa dùng (`return.early_refund_rate` = 0%). Quy tắc này phải hiển thị rõ trước khi khách xác nhận đặt chỗ |
| `BR-RET-07` | Khách không trả kho đúng ngày kết thúc hợp đồng thì chuyển sang xử lý quá hạn theo § 6, kể cả khi đã đăng ký trả kho trước đó |
| `BR-RET-08` | Chi phí khắc phục hư hỏng phải có biên bản kiểm tra kèm ảnh chụp do Facility Staff lập, khách ký xác nhận. Khách không đồng ý thì mở Support Request theo Flow 7 và Facility Manager phân xử |
| `BR-RET-09` | Sau khi xác nhận trả, Facility Staff thu hồi Access Card, vô hiệu Access Code (`UC-F3-07`), ô kho chuyển *Cleaning* rồi về *Available* khi dọn xong (`UC-F3-09`) |

---

## 8. Vòng đời trạng thái

### 8.1. Reservation

`Pending Payment` → `Confirmed` → `Checked-in`
Nhánh kết thúc sớm: `Expired` (quá hạn thanh toán, `BR-DEP-03`) · `Cancelled` (`BR-CAN-01/02`) · `No-show` (`BR-CAN-04`)

### 8.2. Contract — Hợp đồng thuê

| Trạng thái | Ý nghĩa | Chuyển sang |
|------------|---------|-------------|
| `Active` | Đang thuê, trong thời hạn | `Pending Return`, `Overdue` |
| `Pending Return` | Đã đăng ký trả kho, chờ kiểm tra | `Closed`, `Overdue` |
| `Overdue` | Quá hạn, chưa gia hạn cũng chưa trả | `Active` (gia hạn, `BR-REN-06`), `Pending Return`, `Terminated` |
| `Closed` | Đã trả kho và quyết toán xong | — |
| `Terminated` | Chấm dứt do quá hạn quá `overdue.termination_days` | — |

### 8.3. Storage Unit

| Trạng thái | Ý nghĩa |
|------------|---------|
| `Available` | Trống, sẵn sàng cho thuê |
| `Reserved` | Đang được giữ chỗ hoặc đã đặt, chưa bàn giao |
| `Occupied` | Đã bàn giao, khách đang sử dụng |
| `Overdue` | Hợp đồng quá hạn, truy cập bị khóa (`BR-OVD-05`) |
| `Cleaning` | Vừa trả, đang dọn dẹp trước khi mở bán lại |
| `Maintenance` | Đang kiểm tra hoặc sửa chữa, không cho thuê được |
| `Out of service` | Ngừng khai thác |

---

## 9. Ví dụ tính tiền

**Giả thiết:** Unit Type M tại cơ sở Q7, giá **800.000 đ/tháng**. Khách thuê **3 tháng**,
bắt đầu 01/10/2026, kết thúc 31/12/2026.

| Tình huống | Cách tính | Kết quả |
|------------|-----------|---------|
| **Thanh toán khi đặt chỗ** | Phí thuê `800.000 × 3` + Deposit `800.000 × 1.0` | **3.200.000 đ** |
| **Hủy ngày 27/09** (trước 48h) | Hoàn 100% phí thuê + 100% Deposit | Hoàn **3.200.000 đ** |
| **Hủy ngày 30/09** (trong 48h) | Hoàn 100% phí thuê `2.400.000` + 50% Deposit `400.000` | Hoàn **2.800.000 đ** |
| **No-show đến hết 03/10** | Hoàn 0% Deposit; hoàn phí thuê trừ 3 ngày giữ ô kho `2.400.000 − 800.000 × 3/30` | Hoàn **2.320.000 đ** |
| **Quá hạn 7 ngày** (tới 07/01/2027) | Ân hạn D+1→D+3 miễn phí; tính phí 4 ngày `800.000 × 5% × 4` | Nợ **160.000 đ** |
| **Quá hạn 20 ngày** | Đã chạm trần từ D+13: `800.000 × 50%` | Nợ **400.000 đ** (không tăng thêm) |
| **Gia hạn 2 tháng khi đang quá hạn 7 ngày**, giá mới 850.000 đ/tháng | Phí quá hạn `160.000` + phí thuê `850.000 × 2` | Phải trả **1.860.000 đ** |
| **Trả kho đúng hạn, ô kho nguyên trạng** | Hoàn đủ Deposit | Hoàn **800.000 đ** |
| **Trả kho đúng hạn, cửa hỏng, chi phí sửa 300.000** | `800.000 − 300.000` | Hoàn **500.000 đ** |
| **Trả kho sau khi quá hạn 20 ngày, hư hỏng 600.000** | `800.000 − 400.000 − 600.000 = −200.000` | Khách **nộp thêm 200.000 đ** |

---

## 10. Bản đồ quy tắc × use case

| Nhóm quy tắc | Use case chịu ảnh hưởng | Use case cấu hình |
|--------------|-------------------------|-------------------|
| **Deposit** `BR-DEP-*` | `UC-F1-05` `UC-F1-06` `UC-F1-07` `UC-F1-11` `UC-F3-08` | `UC-F4-02` |
| **Cancellation** `BR-CAN-*` | `UC-F1-10` `UC-F1-12` `UC-F2-08` | `UC-F4-04` |
| **Renewal** `BR-REN-*` | `UC-F6-01` `UC-F6-02` `UC-F6-03` `UC-F6-04` | `UC-F4-03` `UC-F4-07` |
| **Overdue** `BR-OVD-*` | `UC-F6-05` `UC-F6-06` `UC-F6-07` `UC-F6-08` `UC-F6-09` `UC-F6-10` `UC-F3-13` | `UC-F4-06` `UC-F4-08` |
| **Return** `BR-RET-*` | `UC-F3-05` `UC-F3-06` `UC-F3-07` `UC-F3-08` `UC-F3-09` `UC-F3-13` | `UC-F4-05` |
| **Chung** `BR-GEN-*` | Toàn bộ | `UC-F4-07` `UC-F4-09` |

> **Quy trình đổi quy tắc:** theo [PLAN.md § 7](PLAN.md#7-rủi-ro-và-đối-sách), business rules phải chốt
> xong trong Giai đoạn 1. Mọi thay đổi sau đó phải qua họp nhóm, cập nhật tài liệu này trước, rồi mới
> sửa code — vì các mốc ở § 6 đã được cài trong scheduled job của task T4.6.

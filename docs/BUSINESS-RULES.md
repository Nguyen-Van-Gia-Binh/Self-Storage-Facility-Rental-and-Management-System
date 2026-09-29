# Business Rules — Quy tắc nghiệp vụ

> **Self-Storage Facility Rental and Management System** — baseline quy tắc về **Reservation**,
> **Availability**, **Pricing**, **Payment**, **Deposit**, **Cancellation**, **Renewal**, **Overdue**
> và **Return**.
>
> Nhiệm vụ **T1.5** · Giai đoạn 1 · [PLAN.md](PLAN.md).
> Tài liệu liên quan: [TOPIC.md](TOPIC.md) · [USE-CASES.md](USE-CASES.md) ·
> [USER-STORIES-SC.md](USER-STORIES-SC.md) · [USER-STORIES-FS-FM.md](USER-STORIES-FS-FM.md) ·
> [USER-STORIES-BM-SA.md](USER-STORIES-BM-SA.md)

---

## Mục lục

1. [Nguyên tắc chung](#1-nguyên-tắc-chung)
2. [Bảng tham số cấu hình](#2-bảng-tham-số-cấu-hình)
3. [Reservation và Availability](#3-reservation-và-availability)
4. [Pricing và Payment](#4-pricing-và-payment)
5. [Deposit — Tiền cọc](#5-deposit--tiền-cọc)
6. [Cancellation — Hủy đặt chỗ](#6-cancellation--hủy-đặt-chỗ)
7. [Renewal — Gia hạn](#7-renewal--gia-hạn)
8. [Overdue — Quá hạn](#8-overdue--quá-hạn)
9. [Return — Trả kho](#9-return--trả-kho)
10. [Check-in & Handover — Bàn giao ô kho](#10-check-in--handover--bàn-giao-ô-kho)
11. [Access & Security — Phương tiện truy cập](#11-access--security--phương-tiện-truy-cập)
12. [Support & On-site SLA — Hỗ trợ và xử lý sự cố](#12-support--on-site-sla--hỗ-trợ-và-xử-lý-sự-cố)
13. [Vòng đời trạng thái](#13-vòng-đời-trạng-thái)
14. [Ví dụ tính tiền](#14-ví-dụ-tính-tiền)
15. [Bản đồ quy tắc × use case](#15-bản-đồ-quy-tắc--use-case)

---

## 1. Nguyên tắc chung

| Mã | Quy tắc |
|----|---------|
| `BR-GEN-01` | **Mọi con số trong tài liệu này là tham số cấu hình, không hard-code.** Business Operations Manager (BOM) là vai trò duy nhất sửa được qua `BM-02` (chính sách) và `BM-03` (giá, phí); Facility Manager (FM) tuyệt đối không có quyền định giá niêm yết. Khi BOM cập nhật giá hoặc chính sách, ngày hiệu lực áp dụng không được ở quá khứ (`effective_from >= CURRENT_DATE`). Giá trị ở § 2 là giá trị mặc định khi khởi tạo hệ thống |
| `BR-GEN-02` | **Chính sách có phiên bản.** Reservation lưu phiên bản chính sách đang hiệu lực tại thời điểm tạo; Contract kế thừa snapshot đó khi Reservation được xác nhận. Thay đổi sau đó không hồi tố. Mỗi lần Renewal dùng giá và phiên bản chính sách đang hiệu lực tại thời điểm gia hạn cho kỳ mới |
| `BR-GEN-03` | **Chu kỳ thuê tính theo tháng.** Khách chọn thời hạn N tháng nguyên và **thanh toán trước toàn bộ** phí thuê N tháng cùng Deposit khi đặt chỗ. Hết N tháng thì gia hạn (§ 7) hoặc trả kho (§ 9) |
| `BR-GEN-04` | Đơn vị tiền tệ là **VND**. Mỗi line item được làm tròn lên đến **1.000 đ** sau khi áp công thức và tỷ lệ; tổng thanh toán là tổng các line item đã làm tròn, không làm tròn lại theo cách khác |
| `BR-GEN-05` | Đơn giá tháng được tính theo **đơn giá diện tích (VNĐ / m² / tháng) × diện tích quy chuẩn (m²)** của **Unit Type × Facility** tại thời điểm tạo Reservation (`Giá thuê 1 tháng = Đơn giá m² × Diện tích`) và được lưu thành snapshot. Số BOM nhập trên bảng giá là **đơn giá 1 m²** của Unit Type tại Facility đó. Snapshot này không đổi trong thời hạn thuê ban đầu |
| `BR-GEN-06` | Múi giờ nghiệp vụ là `Asia/Ho_Chi_Minh`. Tham số theo **giờ** dùng chênh lệch timestamp chính xác; tham số theo **ngày lịch** đổi ngày lúc 00:00; "ngày làm việc" loại trừ Thứ Bảy, Chủ Nhật và ngày lễ |
| `BR-GEN-07` | **Định danh Facility.** Mã cơ sở do Business Operations Manager nhập khi tạo và không sửa sau đó. Dạng `FAC-` cộng viết tắt 2–4 ký tự: ký tự đầu là chữ in hoa, các ký tự sau là chữ in hoa hoặc số (`^FAC-[A-Z][A-Z0-9]{1,3}$`). Quận đánh số dùng `Q` + số (`FAC-Q7`). Địa danh chữ lấy chữ cái đầu mỗi tiếng, bỏ dấu (`FAC-CG`, `FAC-HBT`). Viết tắt đã dùng thì thêm một số (`FAC-CG2`). Số điện thoại liên hệ, nếu có, gồm đúng 10 chữ số và bắt đầu bằng 0. Giờ hoạt động là hai mốc mở cửa và đóng cửa do BOM chọn, lưu `HH:mm–HH:mm`; đóng cửa sớm hơn mở cửa là ca qua đêm |

---

## 2. Bảng tham số cấu hình

Toàn bộ tham số nghiệp vụ nằm ở một chỗ để tra nhanh. Cột **Khóa cấu hình** là tên khóa dùng trong
bảng chính sách của hệ thống (`BM-02`, `BM-03`).

| Khóa cấu hình | Ý nghĩa | Mặc định | Quy tắc |
|---------------|---------|:--------:|---------|
| `deposit.multiplier` | Hệ số Deposit trên tiền thuê một tháng | `1.0` | `BR-DEP-01` |
| `reservation.hold_hours` | Thời gian giữ chỗ chờ thanh toán | `48 giờ` | `BR-DEP-03` |
| `rental.daily_divisor` | Số ngày quy ước của một tháng khi tính phần tiền thuê theo ngày | `30 ngày` | `BR-PRI-03` |
| `rental.buffer_days` | Khoảng đệm an toàn sau ngày hết hạn hợp đồng trước khi mở ô kho cho lượt thuê kế tiếp | `15 ngày` | `BR-AVL-02` |
| `checkin.grace_days` | Số ngày được phép check-in trễ kể từ ngày bắt đầu thuê | `10 ngày` | `BR-CAN-04`, `BR-CHK-05` |
| `cancel.full_refund_hours` | Hủy trước ngày bắt đầu bao nhiêu giờ thì hoàn 100% | `48 giờ` | `BR-CAN-01` |
| `cancel.late_refund_rate` | Tỷ lệ hoàn Deposit khi hủy muộn (trong vòng 48h) | `0%` | `BR-CAN-02` |
| `cancel.no_show_refund_rate` | Tỷ lệ hoàn Deposit khi no-show | `0%` | `BR-CAN-04` |
| `renewal.reminder_days` | Các mốc nhắc gia hạn tự động: từ mốc trước 2 tháng (60 ngày) và đếm ngược 7, 3, 1 ngày trước thời điểm khóa gia hạn (mốc trước 1 tháng) | `60 ngày, và 7, 3, 1 ngày trước mốc khóa` | `BR-REN-01` |
| `renewal.min_months` | Thời hạn gia hạn tối thiểu | `1 tháng` | `BR-REN-03` |
| `renewal.max_months` | Thời hạn gia hạn tối đa trong một lần | `12 tháng` | `BR-REN-07` |
| `overdue.grace_days` | Ân hạn sau ngày hết hạn, gửi thông báo dọn đồ, chưa tính phí (hoàn 100% cọc nếu dọn xong) | `3 ngày` | `BR-OVD-02` |
| `overdue.daily_rate` | Phí quá hạn mỗi ngày, tính trên tiền cọc Deposit (D+4..D+10) | `10%` | `BR-OVD-03` |
| `overdue.cap_rate` | Trần tổng phí quá hạn (tối đa 7 ngày tính phí = 70% tiền cọc) | `70%` | `BR-OVD-04` |
| `overdue.lock_access_days` | Số ngày quá hạn thì khóa mã truy cập Access Code | `7 ngày` | `BR-OVD-05`, `BR-ACC-02` |
| `overdue.termination_days` | Số ngày quá hạn thì chấm dứt hợp đồng và chuyển kho sang dọn dẹp | `10 ngày` | `BR-OVD-04`, `BR-OVD-07` |
| `checkin.refund_working_days` | Số ngày làm việc để FM xử lý hoàn tiền khi từ chối nhận kho | `3 ngày` | `BR-CHK-06` |
| `return.notice_days` | Mốc tự động đánh dấu trả kho nếu không gia hạn trước ngày hết hạn | `30 ngày` | `BR-REN-01`, `BR-RET-01` |
| `return.refund_working_days` | Số ngày làm việc để hoàn Deposit sau khi nghiệm thu | `7 ngày` | `BR-RET-05` |
| `return.early_refund_rate` | Tỷ lệ hoàn tiền thuê phần chưa dùng khi trả sớm | `0%` | `BR-RET-06` |
| `access.pin_length` | Độ dài chữ số của mã PIN truy cập (không dùng thẻ RFID) | `6 số` | `BR-ACC-01` |
| `support.urgent_sla_hours` | Thời hạn cam kết xử lý sự cố truy cập khẩn cấp tại cơ sở | `2 giờ` | `BR-SUP-01` |
| `support.auto_close_working_days` | Số ngày làm việc chờ khách phản hồi trước khi tự đóng Support Request | `7 ngày` | `BR-SUP-03` |

---

## 3. Reservation và Availability

### 3.1. Reservation

| Mã | Quy tắc |
|----|---------|
| `BR-RES-01` | Reservation chỉ được tạo khi Facility và Unit Type đang hoạt động, ngày bắt đầu không ở quá khứ và thời hạn thuê là số tháng nguyên dương. Khoảng thuê dùng dạng **[ngày bắt đầu, ngày kết thúc loại trừ)**; ngày kết thúc loại trừ = ngày bắt đầu cộng N tháng |
| `BR-RES-02` | Khi tạo thành công, Reservation ở trạng thái *Pending Payment*, gắn trực tiếp và tạm giữ chính Storage Unit mà khách hàng đã chọn trên sơ đồ/danh sách trong `reservation.hold_hours` (48 giờ), ngăn không cho khách hàng khác chọn trùng ô kho này |
| `BR-RES-03` | Một Storage Customer có thể có nhiều Reservation *Pending Payment*; mỗi Reservation giữ capacity và hết hạn độc lập. Khách có Contract *Overdue* bị chặn theo `BR-OVD-09` |
| `BR-RES-04` | Reservation *Pending Payment* có thể được khách hủy; vì chưa thu tiền nên không phát sinh hoàn tiền và capacity được giải phóng ngay |
| `BR-RES-05` | Reservation chỉ hoàn tất ở trạng thái *Fulfilled* sau Check-in / Handover thành công. Từ thời điểm đó, việc kết thúc thuê đi theo Return (§ 9), không đi theo Cancellation (§ 6) |

### 3.2. Availability

| Mã | Quy tắc |
|----|---------|
| `BR-AVL-01` | Availability của một Unit Type tại Facility cho một khoảng thuê bằng số Storage Unit có thể khai thác trừ một slot cho mỗi nghĩa vụ phục vụ có khoảng thời gian giao nhau. Nghĩa vụ gồm Reservation *Pending Payment* hoặc Reservation đã sinh Contract; một Reservation và Contract kế thừa của nó chỉ tính **một lần**. Storage Unit *Maintenance* hoặc *Out of service* không được tính vào capacity có thể khai thác |
| `BR-AVL-02` | Hai khoảng thuê dạng `[start, endExclusive)` giao nhau khi `startA < endExclusiveB` và `startB < endExclusiveA`. Bổ sung khoảng đệm an toàn `rental.buffer_days` (15 ngày): Một ô kho sau khi kết thúc kỳ thuê cũ sẽ tự động có 15 ngày đệm (cho ân hạn dọn đồ, bảo dưỡng và vệ sinh); hợp đồng mới của khách tiếp theo chỉ được phép bắt đầu từ `ngày kết thúc cũ + rental.buffer_days` (15 ngày) trở đi để tránh đặt trùng/nhầm trước khi hoàn tất nghiệm thu và dọn dẹp |
| `BR-AVL-03` | Việc kiểm tra và giữ capacity khi tạo Reservation phải là một thao tác nguyên tử: khi capacity cuối cùng đã được giữ, yêu cầu đồng thời còn lại phải bị từ chối; hệ thống không được overbook |
| `BR-AVL-04` | Khách hàng trực tiếp chọn ô kho vật lý cụ thể trên sơ đồ mặt bằng / danh sách ô kho khả dụng ngay tại bước đặt chỗ (`UC-F1-04`). Khi tạo đơn, hệ thống tạm giữ chính ô kho đó trong 48h (`BR-RES-02`, `BR-DEP-03`). Sau khi thanh toán thành công (`UC-F1-07`), hệ thống tự động khóa chính thức ô kho khách đã chọn: chuyển Reservation sang *Confirmed* và Storage Unit sang *Reserved* (`UC-F1-08`, `BR-PAY-02`). Nếu unit đang *Occupied* và kỳ Occupied kết thúc trước ngày bắt đầu kỳ mới (đã bao gồm khoảng đệm 15 ngày) → **không đổi** trạng thái unit; đây là future claim. Khẳng định 100% ô kho được khách tự chọn và định danh ngay từ đầu, hoàn toàn không có bước phân bổ ô kho sau thanh toán |
| `BR-AVL-05` | **Xử lý sự cố ô kho đã chọn trước thời điểm Check-in:** Do ô kho đã được định danh ngay từ lúc tạo đơn, nếu trước ngày bắt đầu thuê mà ô kho vật lý đó phát sinh sự cố bất khả kháng (hư hỏng kết cấu, ngập dột, bảo dưỡng đột xuất), cơ sở phải thông báo ngay cho khách hàng. Khách hàng có quyền chọn đổi sang ô kho tương đương cùng Unit Type (nếu cơ sở còn ô kho trống) hoặc hủy đặt chỗ để nhận lại 100% tiền thuê và tiền cọc theo `BR-CAN-05`. Hệ thống tuyệt đối không tự ý phân bổ lại ô kho khác khi chưa có sự đồng ý của khách |

---

## 4. Pricing và Payment

### 4.1. Pricing

| Mã | Quy tắc |
|----|---------|
| `BR-PRI-01` | Phí thuê gộp = (đơn giá diện tích snapshot × diện tích quy chuẩn m²) × N tháng. Khoản giảm giá, nếu có, chỉ trừ vào phí thuê; Deposit tính trên đơn giá tháng trước giảm giá, trừ khi chính sách giảm giá quy định rõ khác đi |
| `BR-PRI-02` | Tổng phải trả ban đầu = phí thuê gộp − giảm giá + Deposit + phụ phí trả trước (nếu có). Bảng xác nhận phải hiển thị tách từng thành phần trước khi khách đồng ý |
| `BR-PRI-03` | Khi business rule yêu cầu quy đổi tiền thuê theo ngày, tiền một ngày = đơn giá tháng ÷ `rental.daily_divisor`; số tiền cuối cùng làm tròn theo `BR-GEN-04` |

### 4.2. Payment

| Mã | Quy tắc |
|----|---------|
| `BR-PAY-01` | Khoản thanh toán ban đầu phải gồm **toàn bộ phí thuê N tháng + Deposit + phụ phí trả trước**, thực hiện trong một giao dịch; không chấp nhận thanh toán một phần |
| `BR-PAY-02` | Reservation chỉ chuyển *Confirmed* sau khi giao dịch thanh toán được xác nhận thành công và Storage Unit khách đã chọn được khóa chính thức sang *Reserved* theo `BR-AVL-04` |
| `BR-PAY-03` | Thanh toán thất bại không làm đổi trạng thái Reservation; khách được thử lại khi Reservation còn *Pending Payment* và chưa hết thời hạn giữ capacity |
| `BR-PAY-04` | Mỗi Reservation chỉ được ghi nhận một giao dịch thanh toán ban đầu thành công. Giao dịch đến sau khi Reservation đã *Expired*, *Cancelled* hoặc *Confirmed* không được làm thay đổi số dư hay trạng thái |
| `BR-PAY-05` | Hoàn tiền là giao dịch tài chính tách khỏi việc hủy Reservation / đóng Contract. Hoàn tiền thất bại không khôi phục trạng thái nghiệp vụ; khoản hoàn chuyển *Refund Failed* để retry hoặc xử lý thủ công và phải giữ đầy đủ lịch sử |
| `BR-PAY-06` | Mọi biến động tiền phải có ledger entry bất biến, tối thiểu gồm *Collected*, *Adjusted*, *Deducted*, *Refunded* và *Outstanding*, liên kết Reservation / Contract và giao dịch gốc. Không chỉ lưu một trường số dư Deposit hiện tại |

---

## 5. Deposit — Tiền cọc

| Mã | Quy tắc |
|----|---------|
| `BR-DEP-01` | Deposit = `deposit.multiplier` × tiền thuê **một tháng** của Unit Type được đặt. Mặc định bằng đúng một tháng tiền thuê |
| `BR-DEP-02` | Deposit được thu **cùng lúc** với phí thuê của toàn bộ thời hạn, trong một giao dịch duy nhất khi khách xác nhận Reservation (`UC-F1-07`) |
| `BR-DEP-03` | Khi Reservation được tạo, capacity slot ở `BR-RES-02` được giữ trong `reservation.hold_hours`. Hết thời gian này mà chưa thanh toán đủ, Reservation chuyển *Expired* và capacity được giải phóng (`UC-F1-11`); không có Storage Unit cụ thể nào phải đổi trạng thái |
| `BR-DEP-04` | Deposit **không sinh lãi**, không được dùng để cấn trừ phí thuê hay phí gia hạn trong lúc hợp đồng còn hiệu lực. Chỉ được cấn trừ khi quyết toán lúc trả kho hoặc chấm dứt hợp đồng |
| `BR-DEP-05` | Một hợp đồng giữ đúng **một** khoản Deposit. Gia hạn hợp đồng **không** phát sinh Deposit mới |
| `BR-DEP-06` | Baseline hiện tại **không hỗ trợ đổi Unit Type hoặc Storage Unit trên Reservation/Contract hiện hữu**. Trước Check-in, khách hủy và đặt lại; sau Check-in, khách hoàn tất Return rồi tạo Reservation mới |

---

## 6. Cancellation — Hủy đặt chỗ

Áp dụng cho Reservation **chưa** check-in. Sau khi đã check-in thì không còn là hủy đặt chỗ mà là trả
kho sớm, xử lý theo § 9.

| Mã | Quy tắc |
|----|---------|
| `BR-CAN-01` | Nếu chênh lệch từ timestamp yêu cầu hủy đến 00:00 ngày bắt đầu thuê từ `cancel.full_refund_hours` trở lên → hoàn **100%** Deposit và **100%** phí thuê đã đóng |
| `BR-CAN-02` | Nếu chênh lệch trên nhỏ hơn `cancel.full_refund_hours` (48 giờ) nhưng yêu cầu vẫn được gửi trước 00:00 ngày bắt đầu thuê → khách hàng **bị phạt 100% tiền cọc Deposit** (`cancel.late_refund_rate` = 0%, không hoàn cọc) và được hoàn **100%** phí thuê đã đóng |
| `BR-CAN-03` | Reservation *Expired* do quá hạn thanh toán (`BR-DEP-03`) không phát sinh hoàn tiền vì chưa thu tiền |
| `BR-CAN-04` | Nếu hết `checkin.grace_days` (10 ngày lịch) kể từ ngày bắt đầu thuê mà khách chưa Check-in, tại 00:00 ngày kế tiếp hệ thống tự động chuyển Reservation sang *No-show*: hoàn `cancel.no_show_refund_rate` (0%) Deposit, hoàn phí thuê sau khi trừ số ngày từ ngày bắt đầu đến hết ân hạn theo `BR-PRI-03`; unit được giải phóng |
| `BR-CAN-05` | Cơ sở hủy vì lý do từ phía nhà cung cấp (ô kho hư hỏng, cơ sở đóng cửa) → hoàn **100%** mọi khoản, kèm ưu tiên bố trí ô kho tương đương. Không áp dụng tỷ lệ phạt nào (`UC-F1-12`) |
| `BR-CAN-06` | Tiền hoàn được chuyển về phương thức thanh toán gốc (VietQR / Chuyển khoản ngân hàng) trong `return.refund_working_days` (từ 3 đến 7 ngày làm việc) kể từ khi hủy được ghi nhận; mọi giao dịch hoàn tiền có mã tham chiếu và ledger entry bất biến theo `BR-PAY-06` |
| `BR-CAN-07` | Mỗi Reservation chỉ hủy được **một lần**; đã hủy thì không khôi phục, khách phải đặt lại từ đầu |
| `BR-CAN-08` | Khách chủ động hủy từ 00:00 ngày bắt đầu thuê đến trước thời điểm thành *No-show* được quyết toán như `BR-CAN-04`, nhưng chỉ trừ tiền thuê từ ngày bắt đầu đến hết ngày ghi nhận hủy; Reservation chuyển *Cancelled* |

---

## 7. Renewal — Gia hạn

| Mã | Quy tắc |
|----|---------|
| `BR-REN-01` | Hệ thống gửi nhắc gia hạn tự động từ **trước 2 tháng (60 ngày)** trước ngày hết hạn và gửi các thông báo nhắc khẩn cấp vào các mốc **7, 3 và 1 ngày trước thời điểm khóa gia hạn** (mốc trước 1 tháng / 30 ngày) (`UC-F6-01`). Trước ngày hết hạn 1 tháng, nếu khách không gửi yêu cầu gia hạn thành công thì hệ thống tự động khóa tính năng gia hạn và kích hoạt tiến trình chuẩn bị trả kho khi đến hạn (không còn nút trả kho thủ công) |
| `BR-REN-02` | Gia hạn chỉ hợp lệ khi Contract đang *Active* và thực hiện trước ngày hết hạn ít nhất 1 tháng. Khi hợp đồng đã qua mốc 1 tháng trước khi hết hạn hoặc đang trong tiến trình trả kho, khách không thể tự gia hạn mà hệ thống sẽ tiếp tục tiến trình trả kho khi hết hạn |
| `BR-REN-03` | Thời hạn gia hạn tối thiểu là `renewal.min_months` (1 tháng), tính theo bội số tháng nguyên |
| `BR-REN-04` | Gia hạn được hệ thống **tự động ghi nhận khi thanh toán thành công**, không cần Facility Manager duyệt thủ công. Ngày bắt đầu kỳ mới là ngày liền sau ngày kết thúc kỳ cũ, không phụ thuộc ngày thanh toán |
| `BR-REN-05` | Giá gia hạn áp theo **bảng giá tại thời điểm gia hạn** (tính theo đơn giá m² × diện tích quy chuẩn), không phải giá của kỳ đầu. Nếu giá tăng, hệ thống phải hiển thị rõ mức chênh lệch trước khi khách xác nhận |
| `BR-REN-06` | **Cấm tuyệt đối gia hạn khi hợp đồng đang *Overdue*:** Hợp đồng quá hạn không được phép gia hạn dưới bất kỳ hình thức nào; giao diện người dùng **tuyệt đối không hiển thị nút gia hạn**. Khách muốn tiếp tục sử dụng ô kho bắt buộc phải: (1) Thanh toán toàn bộ tiền phạt quá hạn đang nợ; (2) Tiến hành đặt chỗ mới (Reservation) từ đầu nếu ô kho đó chưa bị người khác đặt trước |
| `BR-REN-07` | Gia hạn không được vượt quá `renewal.max_months` (**12 tháng**) trong một lần thao tác, để tránh khóa giá quá dài |
| `BR-REN-08` | Sau khi gia hạn thành công, ô kho giữ nguyên — hệ thống **không** đổi ô kho cho khách. Muốn đổi ô kho thì phải trả kho rồi đặt hợp đồng mới |
| `BR-REN-09` | Trước khi nhận thanh toán Renewal, hệ thống phải kiểm tra Availability cho khoảng gia hạn theo `BR-AVL-01` xem ô kho có bất kỳ ai đặt trước trong tương lai hay không. Nếu bị trùng lịch đặt trước (không còn capacity), yêu cầu gia hạn bị từ chối trước khi thu tiền và hệ thống hiển thị lý do kèm hướng dẫn khách chuẩn bị trả kho khi hết hạn hoặc tạo Reservation đặt ô kho khác |
| `BR-REN-10` | Khi khách hàng xác nhận tạo mã thanh toán VietQR gia hạn hợp đồng, hệ thống tạm khóa capacity và giữ chỗ ô kho trong vòng **48 giờ** kể từ khi sinh mã QR (`reservation.hold_hours = 48`). Trong 48 giờ này, hợp đồng mang trạng thái chờ thanh toán (`PENDING_RENEWAL`). Nếu quá 48 giờ mà chưa thanh toán hoặc khách chủ động hủy lệnh, giao dịch chuyển sang `FAILED` và giải phóng capacity. Khi đến hạn hợp đồng mà chưa thanh toán thành công, hợp đồng chuyển *Overdue* theo `BR-OVD-01` |

---

## 8. Overdue — Quá hạn

Ngày quá hạn ký hiệu **D+n**, đếm từ ngày liền sau ngày kết thúc hợp đồng.

| Mã | Quy tắc |
|----|---------|
| `BR-OVD-01` | Hợp đồng chuyển sang *Overdue* vào **D+1** nếu chưa gia hạn và chưa hoàn tất trả kho (`UC-F6-05`) |
| `BR-OVD-02` | **D+1 → D+3** là giai đoạn ân hạn `overdue.grace_days`: hệ thống gửi thông báo nhắc dọn đồ mỗi ngày, **chưa** tính phí quá hạn (phí phạt = 0 VND), khách **vẫn** truy cập ô kho bình thường. Nếu khách hoàn tất dọn đồ và nghiệm thu trả kho trong 3 ngày này thì được hoàn trả 100% tiền cọc Deposit theo quy trình Flow 3. Trên giao diện người dùng, nút **"Báo trả kho"** vẫn được mở để khách hẹn nhân viên nghiệm thu; **không hiển thị nút đóng nợ phạt** do chưa phát sinh nợ; **không hiển thị nút gia hạn** |
| `BR-OVD-03` | Từ **D+4 đến D+7**, phí quá hạn = `overdue.daily_rate` (10%) × tiền cọc **Deposit** × số ngày tính phí. Phí được cộng dồn theo ngày và hệ thống tiếp tục gửi thông báo nhắc dọn đồ hàng ngày. Trên giao diện người dùng, nút **"Báo trả kho" bị khóa/ẩn**, hiển thị nút **"Đóng nợ phạt quá hạn"**; khách bắt buộc phải thanh toán hết nợ phạt quá hạn trước khi được hoàn tất thủ tục trả kho |
| `BR-OVD-04` | Tổng phí quá hạn của một kỳ không vượt quá trần quy định `overdue.cap_rate`. Với mức 10%/ngày tính từ D+4 đến D+10 (tổng cộng tối đa 7 ngày tính phí = 70% tiền cọc), phí chốt lại tại D+10 và cấn trừ vào Deposit, không tăng thêm |
| `BR-OVD-05` | Tại **D+7** (`overdue.lock_access_days`), scheduled job tự động chuyển Access Code sang *Suspended*. Quyền tự do ra vào ô kho của khách bị khóa hoàn toàn (`UC-F6-07`). Khách muốn vào kho dọn đồ phải đóng nợ phạt trực tuyến hoặc liên hệ quầy tiếp tân để nhân viên hỗ trợ giám sát |
| `BR-OVD-06` | Hệ thống gửi **thông báo dọn đồ** tự động mỗi ngày một lần trong suốt 10 ngày quá hạn (`UC-F6-08`) qua email và ứng dụng |
| `BR-OVD-07` | Tại **D+10** (`overdue.termination_days`), hợp đồng chính thức chấm dứt do quá hạn (`TERMINATED_OVERDUE`, `UC-F6-11`), Storage Unit chuyển sang trạng thái *Cleaning* hoặc *Maintenance*. Hệ thống tự động tạo nhiệm vụ kiểm kê niêm phong đồ đạc về kho tổng cho Facility Staff |
| `BR-OVD-08` | Trong thời gian từ D+1 đến trước D+10, khách có thể nộp phạt để dọn đồ trả kho; **tuyệt đối không thể gia hạn hợp đồng cũ** (không có nút gia hạn). Khi đã qua D+10, hợp đồng đã bị chấm dứt vĩnh viễn, khách muốn thuê tiếp phải giải quyết xong nợ cũ và lập hợp đồng mới từ đầu |
| `BR-OVD-09` | Khách đang có hợp đồng *Overdue* **không được** tạo Reservation mới tại bất kỳ cơ sở nào trong hệ thống. Giao diện người dùng **tuyệt đối không hiển thị** nút thuê ô kho mới trên bất kỳ thẻ hợp đồng quá hạn nào |
| `BR-OVD-10` | Hệ thống **không hỗ trợ** tính năng đề xuất hoặc phê duyệt miễn/giảm phí quá hạn theo vụ trên phần mềm. Mọi trường hợp ngoại lệ (nếu có) do quản lý cơ sở và ban vận hành tự xử lý ngoại tuyến (offline) |
| `BR-OVD-11` | **Xử lý tài sản tồn sau D+10:** Facility Staff theo phân công của Facility Manager tiến hành dọn dẹp ô kho, kiểm kê và niêm phong toàn bộ đồ đạc của khách chuyển về kho tổng để Facility Manager tự xử lý thủ công ngoại tuyến (offline). Phần mềm không xây dựng quy trình thanh lý phức tạp (`UC-F6-09`) |

**Tóm tắt mốc thời gian:**

| Mốc | Phí quá hạn | Thông báo | Truy cập ô kho | Trạng thái hợp đồng | Trạng thái ô kho | Hành vi giao diện (Nút thao tác) |
|-----|-------------|-----------|----------------|---------------------|-------------------|-----------------------------------|
| D+1 → D+3 | Không (ân hạn, hoàn 100% cọc) | Nhắc dọn đồ (hàng ngày) | Bình thường | Overdue (ân hạn) | Occupied | **Hiện nút "Báo trả kho"**; Ẩn nút đóng phạt; **Ẩn nút gia hạn**; Ẩn nút thuê mới |
| D+4 → D+6 | 10% cọc/ngày, cộng dồn | Nhắc dọn đồ & cảnh báo nợ (hàng ngày) | Bình thường | Overdue | Occupied | **Khóa nút "Báo trả kho"**; **Hiện nút "Đóng nợ phạt quá hạn"**; **Ẩn nút gia hạn**; Ẩn nút thuê mới |
| D+7 → D+9 | 10% cọc/ngày, tích lũy nợ | Cảnh báo bị khóa mã cửa & thông báo nợ | **Khóa Access Code (Suspended)** | Overdue (khóa truy cập) | Occupied | Khóa truy cập tự động; **Hiện nút "Đóng nợ phạt quá hạn"**; **Ẩn nút gia hạn**; Khách liên hệ nhân viên |
| D+10 | Chốt phí trần 70% cọc, cấn trừ cọc | Thông báo chấm dứt vĩnh viễn | **Khóa Access Code vĩnh viễn (Revoked)** | **Terminated** | **Cleaning / Maintenance** (niêm phong đồ về kho tổng) | Khóa toàn bộ thao tác khách; Quản lý/Nhân viên kích hoạt Sealing |

---

## 9. Return — Trả kho

| Mã | Quy tắc |
|----|---------|
| `BR-RET-01` | **Quy trình trả kho tự động:** Trước ngày hết hạn hợp đồng 1 tháng, nếu khách không gửi yêu cầu gia hạn (Renew), hệ thống tự động coi như khách không tiếp tục thuê và tự động chuyển sang tiến trình trả kho khi đến hạn. Hết hạn hợp đồng, khách muốn thuê tiếp phải tạo hợp đồng mới (`UC-F3-05`) |
| `BR-RET-02` | Trả kho chỉ hoàn tất khi Facility Staff đã kiểm tra và xác nhận hiện trạng ô kho tại chỗ (`FS-04`, `UC-F3-06`). Khi khách bấm "Báo trả kho", hợp đồng chuyển sang `PENDING_RETURN`; thông tin được gửi về Facility Manager để phân công Facility Staff xuống trực tiếp kiểm tra hiện trạng. Khách dọn hết đồ nhưng chưa có biên bản nghiệm thu từ nhân viên thì hợp đồng **vẫn** chưa thể đóng |
| `BR-RET-03` | Ô kho được coi là **nguyên trạng** khi: trống hoàn toàn, không hư hỏng kết cấu, cửa và khóa còn nguyên, sạch ở mức sử dụng bình thường |
| `BR-RET-04` | Quyết toán khi trả kho: **Số tiền hoàn = Deposit − chi phí khắc phục hư hỏng − phí quá hạn còn nợ − phụ phí chưa thanh toán**. Nếu kết quả **âm**, khách phải nộp bổ sung phần thiếu trước khi hợp đồng đóng (`UC-F3-13`) |
| `BR-RET-05` | Tiền hoàn được chuyển về phương thức thanh toán gốc trong `return.refund_working_days` (7 ngày làm việc) kể từ ngày Facility Staff xác nhận |
| `BR-RET-06` | **Trả sớm không được hoàn** tiền thuê của phần thời hạn chưa dùng (`return.early_refund_rate` = 0%). Quy tắc này phải hiển thị rõ trước khi khách xác nhận đặt chỗ. **Nút "Báo trả kho" luôn hiển thị trên giao diện chi tiết hợp đồng của khách hàng trong suốt thời gian Contract đang ở trạng thái *Active***, cho phép khách chủ động hẹn lịch nghiệm thu trả kho sớm bất cứ lúc nào |
| `BR-RET-07` | Khách không dọn đồ và không hoàn tất trả kho đúng ngày kết thúc hợp đồng thì chuyển sang xử lý quá hạn theo § 8 |
| `BR-RET-08` | Chi phí khắc phục hư hỏng phải có biên bản kiểm tra kèm ảnh chụp do Facility Staff lập, khách ký xác nhận |
| `BR-RET-09` | Sau khi xác nhận trả kho (`BR-RET-02`), Facility Staff thu hồi chìa khóa cơ (nếu có), vô hiệu hóa Access Code (`UC-F3-07`) (không sử dụng thẻ từ RFID), ô kho chuyển *Cleaning*. Khi dọn xong (`UC-F3-09`): nếu unit còn Reservation *Confirmed* chưa Check-in → *Reserved*; không thì *Available* |
| `BR-RET-10` | Khách hàng sau khi dọn sạch đồ đạc và tài sản trong ngăn tủ sẽ thực hiện "Báo trả kho" trên ứng dụng kèm cam kết hiện trạng. Hệ thống chuyển hợp đồng sang *Pending Return* và gửi thông báo đến Facility Manager để điều phối Facility Staff xuống nghiệm thu thực tế tại chỗ (`FS-04`, `FM-04`) |
| `BR-RET-11` | Contract *Overdue* được phép yêu cầu trả kho trước D+10 để giảm phí phạt. Nợ quá hạn, hư hỏng và phụ phí được cấn trừ cùng Deposit theo `BR-RET-04` |
| `BR-RET-12` | Khách chỉ được hủy yêu cầu Return trước khi Facility Staff bắt đầu inspection và khi Contract chưa hết hạn |

---

## 10. Check-in & Handover — Bàn giao ô kho

Áp dụng khi khách hàng đến cơ sở để nhận ô kho đã đặt chỗ (`FS-01`, `FS-02`).

| Mã | Quy tắc |
|----|---------|
| `BR-CHK-01` | **Xác minh danh tính khi nhận kho:** Khách hàng xuất trình CCCD/Hộ chiếu trùng khớp với thông tin đã đăng ký trên đơn Reservation hoặc giấy ủy quyền hợp lệ được hệ thống ghi nhận (`UC-F2-02`) |
| `BR-CHK-02` | **Điều kiện tiên quyết để Handover:** Reservation phải *Confirmed*, đã thanh toán đủ toàn bộ phí thuê N tháng và Deposit (`BR-PAY-01`); ô kho vật lý (mà khách đã chọn và định danh từ bước đặt chỗ) phải thực tế trống, sạch và không hư hại kết cấu (`UC-F2-03`). Hoàn toàn không còn bước phân bổ kho sau thanh toán |
| `BR-CHK-03` | **Biên bản bàn giao tại chỗ:** Quá trình bàn giao bắt buộc phải lập biên bản nghiệm thu hiện trạng có chữ ký số/xác nhận điện tử của cả Facility Staff và khách hàng, kèm hình ảnh chụp hiện trạng ô kho trước khi giao mã PIN / chìa khóa (`UC-F2-03`) |
| `BR-CHK-04` | **Kích hoạt Contract và chuyển trạng thái unit:** Sau khi ký biên bản Handover, Storage Unit chuyển *Reserved* → *Occupied* (`UC-F2-06`), Contract chuyển *Pending Check-in* → *Active* (`UC-F2-07`). Khoảng thuê vẫn theo ngày bắt đầu và kết thúc đã chốt trong Reservation; Check-in trễ không dời ngày kết thúc |
| `BR-CHK-05` | **Xử lý No-show khi check-in trễ:** Khách được phép đến nhận kho trễ tối đa `checkin.grace_days` (10 ngày) tính từ ngày bắt đầu thuê. Quá thời hạn này mà khách chưa hoàn tất Check-in, hệ thống tự động đánh dấu Reservation sang *No-show* lúc 00:00 ngày tiếp theo, hủy Contract và giải phóng Storage Unit về *Available* theo `BR-CAN-04` (`UC-F2-08`) |
| `BR-CHK-06` | **Xử lý ô kho hư hỏng tại chỗ hoặc từ chối ký:** Khi kiểm tra thực tế, nếu ô kho bị hư hại/sự cố kỹ thuật không đạt yêu cầu hoặc khách từ chối ký biên bản bàn giao, nhân viên báo cáo sự cố lên hệ thống; hệ thống tự động chuyển Storage Unit sang *Maintenance*. Lượt Handover bị hủy và Facility Manager thực hiện hoàn tiền 100% (Deposit + phí thuê) cho khách trong vòng 3 ngày làm việc (`checkin.refund_working_days`) theo `BR-CAN-05` |

---

## 11. Access & Security — Phương tiện truy cập

Quy tắc quản lý mã Access Code và chìa khóa vật lý tại cơ sở (`FS-02`, `FS-05`). Hệ thống **loại bỏ hoàn toàn thẻ từ RFID**.

| Mã | Quy tắc |
|----|---------|
| `BR-ACC-01` | **Định dạng và cấp phát mã Access Code:** Hệ thống tự động sinh mã PIN ngẫu nhiên gồm `access.pin_length` (6 chữ số); hoặc sinh mã QR động bảo mật hiển thị trên ứng dụng của khách (`UC-F2-04`). Đối với ô kho dùng khóa cơ, nhân viên bàn giao chìa khóa vật lý kèm theo |
| `BR-ACC-02` | **Phạm vi và hiệu lực truy cập:** Access Credential (PIN / QR) chỉ mở cổng chung của đúng Facility và Storage Unit đã thuê theo hợp đồng. Credential dùng được khi Contract *Active*, trong giai đoạn *Overdue* trước D+7; tại D+7 tự động chuyển *Suspended* theo `BR-OVD-05` |
| `BR-ACC-03` | **Cấp lại và thu hồi phương tiện truy cập:** Khách hàng có thể yêu cầu cấp lại mã PIN trực tiếp trên ứng dụng; hệ thống tự động sinh ngẫu nhiên mã PIN mới và kích hoạt tức thì (real-time) mà không cần duyệt thủ công. Đối với ô kho dùng khóa cơ bị mất chìa, nhân viên cơ sở tiếp nhận và cấp chìa thay thế tại quầy tiếp tân sau khi đối chiếu CCCD (`UC-F7-05`). Khi hoàn tất thủ tục trả kho hoặc hợp đồng bị chấm dứt tại D+10, mọi mã truy cập bị vô hiệu hóa vĩnh viễn trên hệ thống (`UC-F3-07`, `BR-RET-09`) |

---

## 12. Support & On-site SLA — Hỗ trợ và xử lý sự cố

Quy tắc xử lý các yêu cầu hỗ trợ và sự cố phát sinh tại cơ sở (`FS-05`, `FM-05`).

| Mã | Quy tắc |
|----|---------|
| `BR-SUP-01` | **Thời hạn cam kết xử lý sự cố (SLA):**<br>- *Sự cố quyền truy cập số (quên PIN, lỗi mã QR):* Hệ thống tự động cấp phát lại ngay lập tức (real-time, < 1 phút) trên ứng dụng của khách (`UC-F7-05`).<br>- *Sự cố cơ học / hạ tầng tại chỗ (kẹt khóa cửa ô kho, mất chìa cơ, hư hỏng bản lề):* Nhân viên cơ sở và FM bắt buộc phải tiếp nhận và có mặt xử lý tại chỗ trong vòng `support.urgent_sla_hours` (2 giờ) kể từ khi tạo ticket (`UC-F7-04`). Dashboard của FM và Staff có đồng hồ đếm ngược SLA để theo dõi tiến độ xử lý |
| `BR-SUP-02` | **Trách nhiệm và chi phí khắc phục hư hại:** Nếu hư hỏng do lỗi kỹ thuật hoặc hạ tầng cơ sở (thấm dột, chập điện đèn kho), cơ sở chịu 100% chi phí sửa chữa và ưu tiên di dời đồ sang ô kho dự phòng nếu cần (`UC-F7-06`); nếu do lỗi chủ quan của khách, chi phí sửa chữa được tính theo bảng phụ phí `BM-03` |
| `BR-SUP-03` | **Quy trình nghiệm thu và đóng Support Request:** Nhân viên phải tải ảnh sau khắc phục và khách xác nhận nghiệm thu (`UC-F7-08`). Nếu khách không phản hồi trong `support.auto_close_working_days`, hệ thống tự đóng yêu cầu và ghi rõ lý do tự động |

---

## 13. Vòng đời trạng thái

### 13.1. Reservation

`Pending Payment` → `Confirmed` → `Fulfilled`
Nhánh kết thúc sớm: `Expired` (quá hạn thanh toán, `BR-DEP-03`) · `Cancelled` (`BR-CAN-01/02`) · `No-show` (`BR-CAN-04`)

*Pending Payment* chỉ giữ capacity. *Confirmed* đã gắn một Storage Unit cụ thể mà khách chọn. *Fulfilled* nghĩa là
Check-in / Handover đã hoàn tất và Contract đã chuyển *Active*.

### 13.2. Contract — Hợp đồng thuê

| Trạng thái | Ý nghĩa | Chuyển sang |
|------------|---------|-------------|
| `Pending Check-in` | Đã thanh toán và tạo Contract, chờ Check-in / Handover | `Active`, `Cancelled` nếu Reservation bị hủy / No-show |
| `Active` | Đang thuê, trong thời hạn | `Pending Return`, `Overdue` |
| `Pending Return` | Đã đăng ký trả kho, chờ kiểm tra | `Closed`, `Overdue` |
| `Overdue` | Quá hạn, phải nộp phạt để trả kho, không cho gia hạn | `Pending Return` (sau khi đóng nợ phạt), `Terminated` |
| `Cancelled` | Contract chưa kích hoạt, bị hủy cùng Reservation trước Check-in | — |
| `Closed` | Đã trả kho và quyết toán xong | — |
| `Terminated` | Chấm dứt do quá hạn quá `overdue.termination_days` | — |

### 13.3. Storage Unit

| Trạng thái | Ý nghĩa |
|------------|---------|
| `Available` | Trống, sẵn sàng cho thuê |
| `Reserved` | Đã khóa giữ cho Reservation *Confirmed* chưa Check-in **và** không còn Contract *Occupied* trên unit đó; capacity hold của *Pending Payment* không đổi trạng thái unit |
| `Occupied` | Đã bàn giao, khách đang sử dụng. Có thể mang future claim: Reservation *Confirmed* khác đã gắn `unit_id` cho kỳ liền sau, nhưng trạng thái unit vẫn *Occupied* |
| `Cleaning` | Vừa trả, đang dọn dẹp trước khi mở bán lại |
| `Maintenance` | Đang kiểm tra hoặc sửa chữa, không cho thuê được |
| `Out of service` | Ngừng khai thác |

### 13.4. Access Credential

| Trạng thái | Ý nghĩa |
|------------|---------|
| `Active` | Access Code / Access Card đang sử dụng được |
| `Suspended` | Tạm khóa do Overdue hoặc quyết định vận hành; có thể mở lại |
| `Revoked` | Đã thu hồi / vô hiệu vĩnh viễn sau Return hoặc chấm dứt Contract |

---

## 14. Ví dụ tính tiền

**Giả thiết:** Unit Type M tại cơ sở Q7, diện tích quy chuẩn **4 m²**, đơn giá diện tích **200.000 đ/m²/tháng** → Đơn giá thuê một tháng = `4 × 200.000 = 800.000 đ/tháng`. Khách thuê **3 tháng**, bắt đầu 01/10/2026, kết thúc 31/12/2026. Tiền cọc Deposit = 1 tháng tiền thuê = **800.000 đ**.

| Tình huống | Cách tính | Kết quả | Quy tắc áp dụng |
|------------|-----------|---------|-----------------|
| **Thanh toán khi đặt chỗ** | Phí thuê 3 tháng `800.000 × 3` + Deposit `800.000 × 1.0` | **3.200.000 đ** | `BR-PRI-01`, `BR-PAY-01` |
| **Hủy ngày 27/09** (trước 48h) | Hoàn 100% phí thuê + 100% Deposit | Hoàn **3.200.000 đ** | `BR-CAN-01` |
| **Hủy ngày 30/09** (trong 48h) | Phạt 100% Deposit (`cancel.late_refund_rate` = 0%); Hoàn 100% phí thuê `2.400.000 đ` | Hoàn **2.400.000 đ** (mất cọc 800k) | `BR-CAN-02` |
| **No-show đến hết 10/10** (10 ngày ân hạn nhận kho) | Mất 100% Deposit (`0%`); hoàn phí thuê trừ 10 ngày giữ ô kho `2.400.000 − (800.000 × 10/30)` | Hoàn **2.133.000 đ** | `BR-CAN-04` |
| **Quá hạn 3 ngày** (tới 03/01/2027) | Ân hạn D+1→D+3 miễn phí phạt; hoàn tất nghiệm thu trả kho nguyên trạng | Phạt **0 đ**, Hoàn đủ Deposit **800.000 đ** | `BR-OVD-02`, `BR-RET-04` |
| **Quá hạn 5 ngày** (D+5) | Phạt 2 ngày tính phí (D+4, D+5): `800.000 × 10% × 2` | Nợ phạt **160.000 đ** (phải nộp phạt để trả kho) | `BR-OVD-03` |
| **Quá hạn 7 ngày** (D+7) | Phạt 4 ngày tính phí (D+4..D+7): `800.000 × 10% × 4`; Access Code bị khóa Suspended | Nợ phạt **320.000 đ**; **Khóa mã cửa** | `BR-OVD-03`, `BR-OVD-05` |
| **Quá hạn chạm mốc D+10** (Terminated) | Phạt trần 7 ngày tính phí (D+4..D+10): `800.000 × 70%` = `560.000 đ`; Chấm dứt HĐ vĩnh viễn, cấn trừ cọc | Cọc còn lại: `800.000 − 560.000` = **Còn thừa 240.000 đ** (niêm phong đồ về kho tổng) | `BR-OVD-04`, `BR-OVD-07`, `BR-OVD-11` |
| **Trả kho đúng hạn, ô kho nguyên trạng** | Hoàn đủ Deposit | Hoàn **800.000 đ** | `BR-RET-04` |
| **Trả kho đúng hạn, cửa hỏng, chi phí sửa 300.000 đ** | Quyết toán cọc trừ chi phí sửa: `800.000 − 300.000` | Hoàn **500.000 đ** | `BR-RET-04` |
| **Trả kho trễ vào D+6, nợ phạt 3 ngày (240k) và hư hỏng 200k** | Quyết toán cọc trừ nợ phạt và sửa chữa: `800.000 − 240.000 − 200.000` | Hoàn **360.000 đ** | `BR-RET-04`, `BR-RET-11` |

---

## 15. Bản đồ quy tắc × use case

| Nhóm quy tắc | Use case chịu ảnh hưởng | Use case cấu hình |
|--------------|-------------------------|-------------------|
| **Reservation** `BR-RES-*` | `UC-F1-03` `UC-F1-04` `UC-F1-06` `UC-F1-09` `UC-F1-11` | `UC-F4-02` |
| **Availability** `BR-AVL-*` | `UC-F1-03` `UC-F1-04` `UC-F1-06` `UC-F1-08` `UC-F1-11` | — |
| **Pricing** `BR-PRI-*` | `UC-F1-05` `UC-F1-07` `UC-F3-13` | `UC-F4-07` `UC-F4-09` |
| **Payment** `BR-PAY-*` | `UC-F1-07` `UC-F1-08` `UC-F6-03` `UC-F3-13` | — |
| **Deposit** `BR-DEP-*` | `UC-F1-05` `UC-F1-06` `UC-F1-07` `UC-F1-11` `UC-F3-08` | `UC-F4-02` |
| **Cancellation** `BR-CAN-*` | `UC-F1-10` `UC-F1-12` `UC-F2-08` | `UC-F4-04` |
| **Renewal** `BR-REN-*` | `UC-F6-01` `UC-F6-02` `UC-F6-03` `UC-F6-04` | `UC-F4-03` `UC-F4-07` |
| **Overdue** `BR-OVD-*` | `UC-F6-05` `UC-F6-06` `UC-F6-07` `UC-F6-08` `UC-F6-09` `UC-F6-10` `UC-F6-11` `UC-F3-13` | `UC-F4-06` `UC-F4-08` |
| **Return** `BR-RET-*` | `UC-F3-05` `UC-F3-06` `UC-F3-07` `UC-F3-08` `UC-F3-09` `UC-F3-13` | `UC-F4-05` |
| **Check-in & Handover** `BR-CHK-*` | `UC-F2-01` `UC-F2-02` `UC-F2-03` `UC-F2-06` `UC-F2-07` `UC-F2-08` | `UC-F4-04` |
| **Access & Security** `BR-ACC-*` | `UC-F2-04` `UC-F3-07` `UC-F6-07` `UC-F7-05` | `UC-F4-06` |
| **Support & On-site SLA** `BR-SUP-*` | `UC-F7-03` `UC-F7-04` `UC-F7-05` `UC-F7-06` `UC-F7-08` | `UC-F4-09` |
| **Chung** `BR-GEN-*` | Toàn bộ | `UC-F4-01` `UC-F4-07` `UC-F4-09` |

> **Quy trình đổi quy tắc:** theo [PLAN.md § 7](PLAN.md#7-rủi-ro-và-đối-sách), business rules phải chốt
> xong trong Giai đoạn 1. Mọi thay đổi sau đó phải qua họp nhóm, cập nhật tài liệu này trước, rồi mới
> sửa code — vì các mốc ở § 8 sẽ được cài trong scheduled job của task T4.6.

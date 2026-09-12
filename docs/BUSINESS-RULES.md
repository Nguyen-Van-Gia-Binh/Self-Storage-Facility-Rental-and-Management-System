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
| `BR-GEN-01` | **Mọi con số trong tài liệu này là tham số cấu hình, không hard-code.** Business Operations Manager sửa được qua `BM-02` (chính sách) và `BM-03` (giá, phí). Giá trị ở § 2 là giá trị mặc định khi khởi tạo hệ thống |
| `BR-GEN-02` | **Chính sách có phiên bản.** Reservation lưu phiên bản chính sách đang hiệu lực tại thời điểm tạo; Contract kế thừa snapshot đó khi Reservation được xác nhận. Thay đổi sau đó không hồi tố. Mỗi lần Renewal dùng giá và phiên bản chính sách đang hiệu lực tại thời điểm gia hạn cho kỳ mới |
| `BR-GEN-03` | **Chu kỳ thuê tính theo tháng.** Khách chọn thời hạn N tháng nguyên và **thanh toán trước toàn bộ** phí thuê N tháng cùng Deposit khi đặt chỗ. Hết N tháng thì gia hạn (§ 7) hoặc trả kho (§ 9) |
| `BR-GEN-04` | Đơn vị tiền tệ là **VND**. Mỗi line item được làm tròn lên đến **1.000 đ** sau khi áp công thức và tỷ lệ; tổng thanh toán là tổng các line item đã làm tròn, không làm tròn lại theo cách khác |
| `BR-GEN-05` | Đơn giá tháng lấy theo **Unit Type × Facility** tại thời điểm tạo Reservation và được lưu thành snapshot. Snapshot này không đổi trong thời hạn thuê ban đầu |
| `BR-GEN-06` | Múi giờ nghiệp vụ là `Asia/Ho_Chi_Minh`. Tham số theo **giờ** dùng chênh lệch timestamp chính xác; tham số theo **ngày lịch** đổi ngày lúc 00:00; "ngày làm việc" loại trừ Thứ Bảy, Chủ Nhật và ngày lễ |

---

## 2. Bảng tham số cấu hình

Toàn bộ tham số nghiệp vụ nằm ở một chỗ để tra nhanh. Cột **Khóa cấu hình** là tên khóa dùng trong
bảng chính sách của hệ thống (`BM-02`, `BM-03`).

| Khóa cấu hình | Ý nghĩa | Mặc định | Quy tắc |
|---------------|---------|:--------:|---------|
| `deposit.multiplier` | Hệ số Deposit trên tiền thuê một tháng | `1.0` | `BR-DEP-01` |
| `reservation.hold_hours` | Thời gian giữ chỗ chờ thanh toán | `48 giờ` | `BR-DEP-03` |
| `rental.daily_divisor` | Số ngày quy ước của một tháng khi tính phần tiền thuê theo ngày | `30 ngày` | `BR-PRI-03` |
| `checkin.grace_days` | Số ngày được phép check-in trễ kể từ ngày bắt đầu thuê | `3 ngày` | `BR-CAN-04`, `BR-CHK-05` |
| `cancel.full_refund_hours` | Hủy trước ngày bắt đầu bao nhiêu giờ thì hoàn 100% | `48 giờ` | `BR-CAN-01` |
| `cancel.late_refund_rate` | Tỷ lệ hoàn Deposit khi hủy muộn | `50%` | `BR-CAN-02` |
| `cancel.no_show_refund_rate` | Tỷ lệ hoàn Deposit khi no-show | `0%` | `BR-CAN-04` |
| `renewal.reminder_days` | Các mốc nhắc hạn trước ngày hết hạn | `7, 3, 1` | `BR-REN-01` |
| `renewal.min_months` | Thời hạn gia hạn tối thiểu | `1 tháng` | `BR-REN-03` |
| `renewal.max_months` | Thời hạn gia hạn tối đa trong một lần | `12 tháng` | `BR-REN-07` |
| `overdue.grace_days` | Ân hạn sau ngày hết hạn, chưa tính phí | `3 ngày` | `BR-OVD-02` |
| `overdue.daily_rate` | Phí quá hạn mỗi ngày, tính trên tiền thuê một tháng | `5%` | `BR-OVD-03` |
| `overdue.cap_rate` | Trần tổng phí quá hạn của một kỳ | `50%` | `BR-OVD-04` |
| `overdue.lock_access_days` | Số ngày quá hạn thì khóa Access Code | `10 ngày` | `BR-OVD-05`, `BR-ACC-02` |
| `overdue.notice_days` | Số ngày quá hạn thì gửi thông báo chấm dứt | `30 ngày` | `BR-OVD-06` |
| `overdue.termination_days` | Số ngày quá hạn thì chấm dứt hợp đồng | `60 ngày` | `BR-OVD-07` |
| `return.notice_days` | Số ngày báo trước khi trả kho | `7 ngày` | `BR-RET-01` |
| `return.refund_working_days` | Số ngày làm việc để hoàn Deposit | `7 ngày` | `BR-RET-05` |
| `return.early_refund_rate` | Tỷ lệ hoàn tiền thuê phần chưa dùng khi trả sớm | `0%` | `BR-RET-06` |
| `access.pin_length` | Độ dài chữ số của mã PIN truy cập | `6 số` | `BR-ACC-01` |
| `support.urgent_sla_hours` | Thời hạn cam kết xử lý sự cố truy cập khẩn cấp tại cơ sở | `2 giờ` | `BR-SUP-01` |
| `support.auto_close_working_days` | Số ngày làm việc chờ khách phản hồi trước khi tự đóng Support Request | `7 ngày` | `BR-SUP-03` |

---

## 3. Reservation và Availability

### 3.1. Reservation

| Mã | Quy tắc |
|----|---------|
| `BR-RES-01` | Reservation chỉ được tạo khi Facility và Unit Type đang hoạt động, ngày bắt đầu không ở quá khứ và thời hạn thuê là số tháng nguyên dương. Khoảng thuê dùng dạng **[ngày bắt đầu, ngày kết thúc loại trừ)**; ngày kết thúc loại trừ = ngày bắt đầu cộng N tháng |
| `BR-RES-02` | Khi tạo thành công, Reservation ở trạng thái *Pending Payment*, giữ một capacity slot theo **Facility × Unit Type × khoảng thuê**, chưa gắn Storage Unit cụ thể |
| `BR-RES-03` | Một Storage Customer có thể có nhiều Reservation *Pending Payment*; mỗi Reservation giữ capacity và hết hạn độc lập. Khách có Contract *Overdue* bị chặn theo `BR-OVD-09` |
| `BR-RES-04` | Reservation *Pending Payment* có thể được khách hủy; vì chưa thu tiền nên không phát sinh hoàn tiền và capacity được giải phóng ngay |
| `BR-RES-05` | Reservation chỉ hoàn tất ở trạng thái *Fulfilled* sau Check-in / Handover thành công. Từ thời điểm đó, việc kết thúc thuê đi theo Return (§ 9), không đi theo Cancellation (§ 6) |

### 3.2. Availability

| Mã | Quy tắc |
|----|---------|
| `BR-AVL-01` | Availability của một Unit Type tại Facility cho một khoảng thuê bằng số Storage Unit có thể khai thác trừ một slot cho mỗi nghĩa vụ phục vụ có khoảng thời gian giao nhau. Nghĩa vụ gồm Reservation *Pending Payment* hoặc Reservation đã sinh Contract; một Reservation và Contract kế thừa của nó chỉ tính **một lần**. Storage Unit *Maintenance* hoặc *Out of service* không được tính vào capacity có thể khai thác |
| `BR-AVL-02` | Hai khoảng thuê dạng `[start, endExclusive)` giao nhau khi `startA < endExclusiveB` và `startB < endExclusiveA`. Hai kỳ liền kề tại cùng một mốc không giao nhau |
| `BR-AVL-03` | Việc kiểm tra và giữ capacity khi tạo Reservation phải là một thao tác nguyên tử: khi capacity cuối cùng đã được giữ, yêu cầu đồng thời còn lại phải bị từ chối; hệ thống không được overbook |
| `BR-AVL-04` | Sau khi thanh toán đủ thành công, Facility Manager xem danh sách và chọn thủ công một Storage Unit để gán cho Reservation (`UC-F1-08`). Hệ thống chỉ hiển thị các unit hợp lệ đúng Facility × Unit Type có khoảng Occupied/Reserved **không giao** với kỳ thuê mới (loại trừ unit *Maintenance* hoặc *Out of service*). Khi Facility Manager xác nhận chọn, hệ thống thực hiện thao tác nguyên tử gắn `unit_id` và chuyển Reservation sang *Confirmed* để chống overbook đồng thời. Nếu unit đang *Available* → *Reserved*. Nếu đang *Occupied* và kỳ Occupied kết thúc trước ngày bắt đầu kỳ mới → **không đổi** trạng thái unit; đây là future claim |
| `BR-AVL-05` | Nếu không thể phân bổ unit do capacity thay đổi ngoài dự kiến, Reservation không được xác nhận; khoản vừa thu phải được hoàn toàn bộ về phương thức gốc. Không được tạo Contract không có Storage Unit |

---

## 4. Pricing và Payment

### 4.1. Pricing

| Mã | Quy tắc |
|----|---------|
| `BR-PRI-01` | Phí thuê gộp = đơn giá tháng snapshot × N tháng. Khoản giảm giá, nếu có, chỉ trừ vào phí thuê; Deposit tính trên đơn giá tháng trước giảm giá, trừ khi chính sách giảm giá quy định rõ khác đi |
| `BR-PRI-02` | Tổng phải trả ban đầu = phí thuê gộp − giảm giá + Deposit + phụ phí trả trước (nếu có). Bảng xác nhận phải hiển thị tách từng thành phần trước khi khách đồng ý |
| `BR-PRI-03` | Khi business rule yêu cầu quy đổi tiền thuê theo ngày, tiền một ngày = đơn giá tháng ÷ `rental.daily_divisor`; số tiền cuối cùng làm tròn theo `BR-GEN-04` |

### 4.2. Payment

| Mã | Quy tắc |
|----|---------|
| `BR-PAY-01` | Khoản thanh toán ban đầu phải gồm **toàn bộ phí thuê N tháng + Deposit + phụ phí trả trước**, thực hiện trong một giao dịch; không chấp nhận thanh toán một phần |
| `BR-PAY-02` | Reservation chỉ chuyển *Confirmed* sau khi giao dịch được xác nhận thành công và một Storage Unit cụ thể được phân bổ theo `BR-AVL-04` |
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
| `BR-CAN-02` | Nếu chênh lệch trên nhỏ hơn `cancel.full_refund_hours` nhưng yêu cầu vẫn được gửi trước 00:00 ngày bắt đầu thuê → hoàn `cancel.late_refund_rate` (50%) Deposit và **100%** phí thuê |
| `BR-CAN-03` | Reservation *Expired* do quá hạn thanh toán (`BR-DEP-03`) không phát sinh hoàn tiền vì chưa thu tiền |
| `BR-CAN-04` | Nếu hết `checkin.grace_days` ngày lịch kể từ ngày bắt đầu thuê mà khách chưa Check-in, tại 00:00 ngày kế tiếp Reservation chuyển *No-show*: hoàn `cancel.no_show_refund_rate` (0%) Deposit, hoàn phí thuê sau khi trừ số ngày từ ngày bắt đầu đến hết ân hạn theo `BR-PRI-03`; unit được giải phóng |
| `BR-CAN-05` | Cơ sở hủy vì lý do từ phía nhà cung cấp (ô kho hư hỏng, cơ sở đóng cửa) → hoàn **100%** mọi khoản, kèm ưu tiên bố trí ô kho tương đương. Không áp dụng tỷ lệ phạt nào (`UC-F1-12`) |
| `BR-CAN-06` | Tiền hoàn được chuyển về phương thức thanh toán gốc trong `return.refund_working_days` ngày làm việc kể từ khi hủy được ghi nhận |
| `BR-CAN-07` | Mỗi Reservation chỉ hủy được **một lần**; đã hủy thì không khôi phục, khách phải đặt lại từ đầu |
| `BR-CAN-08` | Khách chủ động hủy từ 00:00 ngày bắt đầu thuê đến trước thời điểm thành *No-show* được quyết toán như `BR-CAN-04`, nhưng chỉ trừ tiền thuê từ ngày bắt đầu đến hết ngày ghi nhận hủy; Reservation chuyển *Cancelled* |

---

## 7. Renewal — Gia hạn

| Mã | Quy tắc |
|----|---------|
| `BR-REN-01` | Hệ thống gửi nhắc hạn tự động vào các mốc `renewal.reminder_days` — **7, 3 và 1 ngày** trước ngày hết hạn hợp đồng (`UC-F6-01`) |
| `BR-REN-02` | Gia hạn chỉ hợp lệ khi Contract đang *Active* hoặc *Overdue*. Nếu còn nợ quá hạn, khách không được chỉ thanh toán phí kỳ mới mà phải tất toán nợ, có thể trong cùng giao dịch theo `BR-REN-06` |
| `BR-REN-03` | Thời hạn gia hạn tối thiểu là `renewal.min_months` (1 tháng), tính theo bội số tháng nguyên |
| `BR-REN-04` | Gia hạn được hệ thống **tự động ghi nhận khi thanh toán thành công**, không cần Facility Manager duyệt thủ công. Ngày bắt đầu kỳ mới là ngày liền sau ngày kết thúc kỳ cũ, không phụ thuộc ngày thanh toán |
| `BR-REN-05` | Giá gia hạn áp theo **bảng giá tại thời điểm gia hạn**, không phải giá của kỳ đầu. Nếu giá tăng, hệ thống phải hiển thị rõ mức chênh lệch trước khi khách xác nhận |
| `BR-REN-06` | Gia hạn khi hợp đồng đang *Overdue*: khách phải thanh toán **phí quá hạn phát sinh + phí thuê kỳ mới** trong cùng một giao dịch. Thanh toán xong, hợp đồng trở lại *Active* và Access Code được mở lại nếu đang bị khóa |
| `BR-REN-07` | Gia hạn không được vượt quá `renewal.max_months` (**12 tháng**) trong một lần thao tác, để tránh khóa giá quá dài |
| `BR-REN-08` | Sau khi gia hạn thành công, ô kho giữ nguyên — hệ thống **không** đổi ô kho cho khách. Muốn đổi ô kho thì phải trả kho rồi đặt hợp đồng mới |
| `BR-REN-09` | Trước khi nhận thanh toán Renewal, hệ thống phải kiểm tra Availability cho khoảng gia hạn theo `BR-AVL-01`. Capacity commitment đã được tạo trước — kể cả Reservation *Pending Payment* — được ưu tiên; Renewal không được hủy hoặc đẩy lùi commitment đó. Nếu không còn capacity, yêu cầu gia hạn bị từ chối và khách được hướng dẫn Return hoặc tạo Reservation mới |
| `BR-REN-10` | Yêu cầu Renewal chưa thanh toán chỉ là báo giá, không kéo dài Contract và không giữ capacity. Nếu Contract hết hạn trước khi thanh toán thành công thì chuyển *Overdue* theo `BR-OVD-01`; khách tiếp tục theo `BR-REN-06` |

---

## 8. Overdue — Quá hạn

Ngày quá hạn ký hiệu **D+n**, đếm từ ngày liền sau ngày kết thúc hợp đồng.

| Mã | Quy tắc |
|----|---------|
| `BR-OVD-01` | Hợp đồng chuyển sang *Overdue* vào **D+1** nếu chưa gia hạn và chưa hoàn tất trả kho (`UC-F6-05`) |
| `BR-OVD-02` | **D+1 → D+3** là giai đoạn ân hạn `overdue.grace_days`: **chưa** tính phí quá hạn, khách **vẫn** truy cập ô kho bình thường |
| `BR-OVD-03` | Từ **D+4**, phí quá hạn = `overdue.daily_rate` (5%) × tiền thuê **một tháng** × số ngày tính phí. Phí được cộng dồn theo ngày |
| `BR-OVD-04` | Tổng phí quá hạn của một kỳ không vượt quá `overdue.cap_rate` (50%) tiền thuê một tháng. Với mức 5%/ngày, trần đạt được sau **10 ngày tính phí**, tức **D+13**; từ D+14 phí ngừng tăng |
| `BR-OVD-05` | Tại **D+10**, scheduled job tự động chuyển Access Code / Access Card sang *Suspended*. Storage Unit vẫn *Occupied* vì tài sản và Contract chưa được giải phóng; khách không vào được ô kho cho tới khi chọn và hoàn tất một phương án ở `BR-OVD-08` (`UC-F6-07`) |
| `BR-OVD-06` | Tại **D+30**, scheduled job tự động gửi **thông báo chấm dứt hợp đồng** qua email và trong ứng dụng, nêu rõ hạn chót và hệ quả (`UC-F6-08`) |
| `BR-OVD-07` | Tại **D+60**, scheduled job (`UC-F6-11`) tự động chuyển Contract sang *Terminated*, Access Credential sang *Revoked*, chốt nợ và cấn trừ Deposit, rồi tạo nhiệm vụ xử lý tài sản. Không tự động thanh lý hoặc tiêu hủy tài sản |
| `BR-OVD-08` | Trước D+60, khách phải chọn một trong hai phương án: (a) thanh toán toàn bộ nợ **kèm Renewal** → Contract trở lại *Active* và Access được mở trong 1 giờ; (b) chọn Return → Contract chuyển *Pending Return*, nợ được quyết toán theo `BR-RET-04` và Access chỉ mở theo lịch trả kho. Không hỗ trợ thanh toán nợ riêng mà không chọn Renewal hoặc Return |
| `BR-OVD-09` | Khách đang có hợp đồng *Overdue* **không được** tạo Reservation mới tại bất kỳ cơ sở nào trong hệ thống |
| `BR-OVD-10` | Miễn hoặc giảm phí quá hạn theo vụ phải do Facility Manager đề xuất kèm lý do và chứng cứ; Business Operations Manager duyệt hoặc từ chối, không được tự đề xuất rồi tự duyệt. Quyết định chỉ áp cho khoản chưa tất toán và phải sinh ledger entry cùng audit log; thay đổi chính sách chung ở `BM-03` không thay thế quy trình này |
| `BR-OVD-11` | Sau khi `UC-F6-11` chấm dứt Contract, Facility Manager thực hiện `UC-F6-09`: lập biên bản tài sản kèm ảnh, niêm phong và chuyển tài sản sang khu vực lưu giữ an toàn trước khi unit được chuyển *Cleaning*. Mọi bước phải ghi audit log; xử lý pháp lý tiếp theo cần quyết định thủ công của Business Operations Manager, không có scheduled job tự bán hoặc tiêu hủy |

**Tóm tắt mốc thời gian:**

| Mốc | Phí quá hạn | Truy cập ô kho | Trạng thái hợp đồng |
|-----|-------------|----------------|---------------------|
| D+1 → D+3 | Không | Bình thường | Overdue (ân hạn) |
| D+4 → D+9 | 5%/ngày, cộng dồn | Bình thường | Overdue |
| D+10 → D+13 | 5%/ngày tới khi chạm trần 50% | **Bị khóa** | Overdue |
| D+14 → D+29 | Giữ nguyên ở trần 50% | Bị khóa | Overdue |
| D+30 → D+59 | Giữ nguyên ở trần 50% | Bị khóa | Overdue, đã gửi thông báo chấm dứt |
| D+60 | Chốt sổ, cấn trừ Deposit | **Revoked** | **Terminated**, tạo nhiệm vụ xử lý tài sản |

---

## 9. Return — Trả kho

| Mã | Quy tắc |
|----|---------|
| `BR-RET-01` | Khách phải đăng ký trả kho trước ít nhất `return.notice_days` (7 ngày) so với ngày muốn trả, kèm chọn khung giờ hẹn để Facility Staff kiểm tra (`UC-F3-05`) |
| `BR-RET-02` | Trả kho chỉ hoàn tất khi Facility Staff đã kiểm tra và xác nhận hiện trạng ô kho tại chỗ (`FS-04`, `UC-F3-06`). Khách dọn hết đồ nhưng chưa có xác nhận thì hợp đồng **vẫn** hiệu lực và vẫn tính phí |
| `BR-RET-03` | Ô kho được coi là **nguyên trạng** khi: trống hoàn toàn, không hư hỏng kết cấu, cửa và khóa còn nguyên, sạch ở mức sử dụng bình thường |
| `BR-RET-04` | Quyết toán khi trả kho: **Số tiền hoàn = Deposit − chi phí khắc phục hư hỏng − phí quá hạn còn nợ − phụ phí chưa thanh toán**. Nếu kết quả **âm**, khách phải nộp bổ sung phần thiếu trước khi hợp đồng đóng (`UC-F3-13`) |
| `BR-RET-05` | Tiền hoàn được chuyển về phương thức thanh toán gốc trong `return.refund_working_days` (7 ngày làm việc) kể từ ngày Facility Staff xác nhận |
| `BR-RET-06` | **Trả sớm không được hoàn** tiền thuê của phần thời hạn chưa dùng (`return.early_refund_rate` = 0%). Quy tắc này phải hiển thị rõ trước khi khách xác nhận đặt chỗ |
| `BR-RET-07` | Khách không trả kho đúng ngày kết thúc hợp đồng thì chuyển sang xử lý quá hạn theo § 8, kể cả khi đã đăng ký trả kho trước đó |
| `BR-RET-08` | Chi phí khắc phục hư hỏng phải có biên bản kiểm tra kèm ảnh chụp do Facility Staff lập, khách ký xác nhận. Khách không đồng ý thì mở Support Request theo Flow 7 và Facility Manager phân xử |
| `BR-RET-09` | Sau khi xác nhận trả (`BR-RET-02`), Facility Staff thu hồi Access Card, vô hiệu Access Code (`UC-F3-07`), ô kho chuyển *Cleaning*. Khi dọn xong (`UC-F3-09`): nếu unit còn Reservation *Confirmed* chưa Check-in (future claim) → *Reserved*; không thì *Available* |
| `BR-RET-10` | Nếu khách yêu cầu Return khi còn ít hơn `return.notice_days` trước ngày kết thúc, ngày hẹn sớm nhất vẫn là ngày yêu cầu + `return.notice_days`. Contract chuyển *Overdue* từ D+1 nếu chưa hoàn tất Return trước ngày kết thúc và áp dụng phí theo § 8 |
| `BR-RET-11` | Contract *Overdue* được phép yêu cầu Return trước D+60. Contract chuyển *Pending Return*; nợ quá hạn, hư hỏng và phụ phí được quyết toán cùng Deposit theo `BR-RET-04`. Nếu Access đã *Suspended*, chỉ mở trong khung giờ Return đã xác nhận. *Pending Return* **không dừng** đồng hồ D+60. Chưa nghiệm thu xong trước D+60 → *Terminated*, hủy lịch Return, tiếp `BR-OVD-11` |
| `BR-RET-12` | Khách chỉ được hủy yêu cầu Return trước khi Facility Staff bắt đầu inspection và khi Contract chưa hết hạn. Khi hủy hợp lệ, Contract trở lại *Active*; nếu đã hết hạn thì không được quay lại *Active* mà phải tiếp tục Renewal hoặc Return theo `BR-OVD-08` |

---

## 10. Check-in & Handover — Bàn giao ô kho

Áp dụng khi khách hàng đến cơ sở để nhận ô kho đã đặt chỗ (`FS-01`, `FS-02`).

| Mã | Quy tắc |
|----|---------|
| `BR-CHK-01` | **Xác minh danh tính khi nhận kho:** Khách hàng hoặc người đại diện phải xuất trình bản gốc CCCD/Hộ chiếu trùng khớp với thông tin đã đăng ký trên đơn Reservation hoặc giấy ủy quyền hợp lệ được hệ thống ghi nhận (`UC-F2-02`) |
| `BR-CHK-02` | **Điều kiện tiên quyết để Handover:** Reservation phải *Confirmed*, đã thanh toán đủ toàn bộ phí thuê N tháng và Deposit (`BR-PAY-01`), đồng thời đã phân bổ Storage Unit; unit thực tế phải trống, sạch và không hư hại kết cấu (`UC-F2-03`) |
| `BR-CHK-03` | **Biên bản bàn giao tại chỗ:** Quá trình bàn giao bắt buộc phải lập biên bản nghiệm thu hiện trạng có chữ ký số/xác nhận điện tử của cả Facility Staff và khách hàng, kèm hình ảnh chụp hiện trạng ô kho trước khi giao chìa/mã (`UC-F2-03`) |
| `BR-CHK-04` | **Kích hoạt Contract và chuyển trạng thái unit:** Sau khi ký biên bản Handover, Storage Unit chuyển *Reserved* → *Occupied* (`UC-F2-06`), Contract chuyển *Pending Check-in* → *Active* (`UC-F2-07`). Khoảng thuê vẫn theo ngày bắt đầu và kết thúc đã chốt trong Reservation; Check-in trễ không dời ngày kết thúc |
| `BR-CHK-05` | **Xử lý No-show khi check-in trễ:** Khách được phép đến nhận kho trễ tối đa `checkin.grace_days` (3 ngày) tính từ ngày bắt đầu thuê. Quá thời hạn này mà khách không đến nhận và không báo hoãn, đơn bị đánh dấu *No-show* và xử lý theo `BR-CAN-04` (`UC-F2-08`) |

---

## 11. Access & Security — Phương tiện truy cập

Quy tắc quản lý mã Access Code, thẻ từ RFID hoặc chìa khóa cơ tại cơ sở (`FS-02`, `FS-05`).

| Mã | Quy tắc |
|----|---------|
| `BR-ACC-01` | **Định dạng và cấp phát mã Access Code:** Hệ thống tự động sinh mã PIN cá nhân ngẫu nhiên gồm `access.pin_length` (6 chữ số), không chứa chuỗi lặp hoặc tiến liên tiếp (vd: không dùng 111111, 123456); hoặc sinh mã QR động bảo mật hiển thị trên ứng dụng của khách (`UC-F2-04`) |
| `BR-ACC-02` | **Phạm vi và hiệu lực truy cập:** Access Credential chỉ mở cổng chung của đúng Facility và Storage Unit được phân bổ. Credential dùng được khi Contract *Active*, trong giai đoạn *Overdue* trước D+10, hoặc trong lịch Return đã xác nhận; tại D+10 tự chuyển *Suspended* theo `BR-OVD-05` |
| `BR-ACC-03` | **Cấp lại và thu hồi phương tiện truy cập:** Chỉ chủ hợp đồng hoặc người được ủy quyền hợp pháp mới được yêu cầu cấp lại mã/thay khóa cơ khi báo mất/hỏng (`UC-F7-05`); khi hoàn tất thủ tục trả kho hoặc hợp đồng bị chấm dứt, mọi phương tiện truy cập phải bị vô hiệu hóa ngay lập tức trên hệ thống (`UC-F3-07`, `BR-RET-09`) |

---

## 12. Support & On-site SLA — Hỗ trợ và xử lý sự cố

Quy tắc xử lý các yêu cầu hỗ trợ và sự cố phát sinh tại cơ sở (`FS-05`, `FM-05`).

| Mã | Quy tắc |
|----|---------|
| `BR-SUP-01` | **Thời hạn cam kết xử lý sự cố tại chỗ (SLA):** Các sự cố khẩn cấp liên quan đến quyền truy cập (quên mã PIN, kẹt khóa cửa ô kho, mất chìa khóa) phải được nhân viên cơ sở tiếp nhận và bắt đầu xử lý trong vòng `support.urgent_sla_hours` (2 giờ) kể từ khi tạo ticket (`UC-F7-04`, `UC-F7-05`) |
| `BR-SUP-02` | **Trách nhiệm và chi phí khắc phục hư hại:** Nếu hư hỏng do lỗi kỹ thuật hoặc hạ tầng cơ sở (thấm dột, chập điện đèn kho), cơ sở chịu 100% chi phí sửa chữa và ưu tiên di dời đồ sang ô kho dự phòng nếu cần (`UC-F7-06`); nếu do lỗi chủ quan của khách, chi phí sửa chữa được tính theo bảng phụ phí `BM-03` |
| `BR-SUP-03` | **Quy trình nghiệm thu và đóng Support Request:** Nhân viên phải tải ảnh sau khắc phục và khách xác nhận nghiệm thu (`UC-F7-08`). Nếu khách không phản hồi trong `support.auto_close_working_days`, hệ thống tự đóng yêu cầu và ghi rõ lý do tự động |

---

## 13. Vòng đời trạng thái

### 13.1. Reservation

`Pending Payment` → `Confirmed` → `Fulfilled`
Nhánh kết thúc sớm: `Expired` (quá hạn thanh toán, `BR-DEP-03`) · `Cancelled` (`BR-CAN-01/02`) · `No-show` (`BR-CAN-04`)

*Pending Payment* chỉ giữ capacity. *Confirmed* đã gắn một Storage Unit cụ thể. *Fulfilled* nghĩa là
Check-in / Handover đã hoàn tất và Contract đã chuyển *Active*.

### 13.2. Contract — Hợp đồng thuê

| Trạng thái | Ý nghĩa | Chuyển sang |
|------------|---------|-------------|
| `Pending Check-in` | Đã thanh toán và tạo Contract, chờ Check-in / Handover | `Active`, `Cancelled` nếu Reservation bị hủy / No-show |
| `Active` | Đang thuê, trong thời hạn | `Pending Return`, `Overdue` |
| `Pending Return` | Đã đăng ký trả kho, chờ kiểm tra | `Closed`, `Overdue` |
| `Overdue` | Quá hạn, chưa gia hạn cũng chưa trả | `Active` (gia hạn, `BR-REN-06`), `Pending Return`, `Terminated` |
| `Cancelled` | Contract chưa kích hoạt, bị hủy cùng Reservation trước Check-in | — |
| `Closed` | Đã trả kho và quyết toán xong | — |
| `Terminated` | Chấm dứt do quá hạn quá `overdue.termination_days` | — |

### 13.3. Storage Unit

| Trạng thái | Ý nghĩa |
|------------|---------|
| `Available` | Trống, sẵn sàng cho thuê |
| `Reserved` | Đã phân bổ cho Reservation *Confirmed* chưa Check-in **và** không còn Contract *Occupied* trên unit đó; capacity hold của *Pending Payment* không đổi trạng thái unit |
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
| **Overdue** `BR-OVD-*` | `UC-F6-05` `UC-F6-06` `UC-F6-07` `UC-F6-08` `UC-F6-09` `UC-F6-10` `UC-F6-11` `UC-F6-12` `UC-F3-13` `UC-F4-13` | `UC-F4-06` `UC-F4-08` |
| **Return** `BR-RET-*` | `UC-F3-05` `UC-F3-06` `UC-F3-07` `UC-F3-08` `UC-F3-09` `UC-F3-13` | `UC-F4-05` |
| **Check-in & Handover** `BR-CHK-*` | `UC-F2-01` `UC-F2-02` `UC-F2-03` `UC-F2-06` `UC-F2-07` `UC-F2-08` | `UC-F4-04` |
| **Access & Security** `BR-ACC-*` | `UC-F2-04` `UC-F3-07` `UC-F6-07` `UC-F7-05` | `UC-F4-06` |
| **Support & On-site SLA** `BR-SUP-*` | `UC-F7-03` `UC-F7-04` `UC-F7-05` `UC-F7-06` `UC-F7-08` | `UC-F4-09` |
| **Chung** `BR-GEN-*` | Toàn bộ | `UC-F4-07` `UC-F4-09` |

> **Quy trình đổi quy tắc:** theo [PLAN.md § 7](PLAN.md#7-rủi-ro-và-đối-sách), business rules phải chốt
> xong trong Giai đoạn 1. Mọi thay đổi sau đó phải qua họp nhóm, cập nhật tài liệu này trước, rồi mới
> sửa code — vì các mốc ở § 8 sẽ được cài trong scheduled job của task T4.6.

# User Story — Business Operations Manager và System Administrator

> **Self-Storage Facility Rental and Management System** — user story và acceptance criteria cho
> **Business Operations Manager** (`BM-01` → `BM-05`) và **System Administrator** (`SA-01` → `SA-04`).
>
> Nhiệm vụ **T1.4** · Giai đoạn 1 · [PLAN.md](PLAN.md).
> Tài liệu liên quan: [USE-CASES.md](USE-CASES.md) · [BUSINESS-RULES.md](BUSINESS-RULES.md) ·
> [USER-STORIES.md](USER-STORIES.md) (quy ước viết và story của Storage Customer).
>
> User story của Facility Staff và Facility Manager nằm ở nhiệm vụ **T1.3** (`FS-*`, `FM-*` — Tùng).

---

## Mục lục

1. [Quy ước viết user story](#1-quy-ước-viết-user-story)
2. [BM-01 — Quản lý danh sách cơ sở](#2-bm-01--quản-lý-danh-sách-cơ-sở)
3. [BM-02 — Thiết lập chính sách thuê](#3-bm-02--thiết-lập-chính-sách-thuê)
4. [BM-03 — Quản lý giá và phí](#4-bm-03--quản-lý-giá-và-phí)
5. [BM-04 — Giám sát hiệu quả vận hành](#5-bm-04--giám-sát-hiệu-quả-vận-hành)
6. [BM-05 — Báo cáo toàn hệ thống](#6-bm-05--báo-cáo-toàn-hệ-thống)
7. [SA-01 — Quản lý tài khoản người dùng](#7-sa-01--quản-lý-tài-khoản-người-dùng)
8. [SA-02 — Phân quyền vai trò](#8-sa-02--phân-quyền-vai-trò)
9. [SA-03 — Cấu hình quyền truy cập dữ liệu](#9-sa-03--cấu-hình-quyền-truy-cập-dữ-liệu)
10. [SA-04 — Theo dõi nhật ký](#10-sa-04--theo-dõi-nhật-ký)
11. [Bảng tổng hợp](#11-bảng-tổng-hợp)

---

## 1. Quy ước viết user story

Áp dụng nguyên các quy ước đã chốt ở [USER-STORIES.md § 1](USER-STORIES.md#1-quy-ước-viết-user-story):

| Hạng mục | Quy ước |
|----------|---------|
| **Mã story** | `US-<mã yêu cầu>.<số thứ tự>` — ví dụ `US-BM-02.3` là story thứ ba của `BM-02`. Không đánh số lại, story mới nối tiếp vào cuối nhóm |
| **Câu chuyện** | *Là* `<actor>`, *tôi muốn* `<mục tiêu>`, *để* `<giá trị nhận được>` |
| **Acceptance criteria** | Viết theo **Given – When – Then**, đánh số `AC-1`, `AC-2`… Mỗi story bắt buộc có ít nhất một AC cho **nhánh thất bại** |
| **Độ ưu tiên** | MoSCoW — **Must** (không có thì hệ thống không chạy được), **Should** (quan trọng, có thể lùi), **Could** (làm nếu còn thời gian) |
| **Story point** | Thang Fibonacci 1 · 2 · 3 · 5 · 8, ước lượng theo độ phức tạp chứ không theo giờ công |
| **Giai đoạn** | Bám theo [bản đồ phủ yêu cầu của PLAN.md § 5](PLAN.md#5-bản-đồ-phủ-yêu-cầu) |
| **Tham chiếu** | Mọi story trỏ về use case ở [USE-CASES.md](USE-CASES.md) và quy tắc ở [BUSINESS-RULES.md](BUSINESS-RULES.md) khi story chạm tiền, mốc thời hạn hoặc phiên bản chính sách |

Tổng cộng **19 user story**, **95 acceptance criteria**, **95 story point**.

---

## 2. BM-01 — Quản lý danh sách cơ sở

*Quản lý toàn bộ cơ sở lưu trữ trong hệ thống.*

### `US-BM-01.1` — Thêm và chỉnh sửa Facility

> **Là** Business Operations Manager, **tôi muốn** tạo mới và sửa thông tin Facility, **để** hệ thống
> có đúng danh sách cơ sở đang kinh doanh.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-01` | Must | 5 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi đã đăng nhập với vai trò Business Operations Manager, *when* tôi mở danh
  sách cơ sở, *then* tôi thấy mọi Facility trong hệ thống kèm mã, tên, địa chỉ, trạng thái
  (*Active* / *Inactive*) và số Storage Unit.
- **AC-2** — *Given* tôi nhập đủ mã cơ sở, tên, địa chỉ, *when* tôi lưu Facility mới, *then* hệ thống
  tạo bản ghi ở trạng thái *Active* và Facility xuất hiện trên trang công khai của Storage Customer
  theo `UC-F1-01`.
- **AC-3** — *Given* tôi sửa tên hoặc địa chỉ một Facility *Active*, *when* tôi lưu, *then* thay đổi
  có hiệu lực ngay với các Reservation và hợp đồng mới; hợp đồng đã ký giữ nguyên địa chỉ đã ghi trên
  hợp đồng.
- **AC-4** — *Given* mã cơ sở tôi nhập đã tồn tại, *when* tôi lưu, *then* hệ thống từ chối và hiển
  thị "Mã cơ sở đã được dùng", không tạo bản ghi trùng.
- **AC-5** — *Given* tôi bỏ trống tên hoặc địa chỉ, *when* tôi lưu, *then* hệ thống từ chối và nêu
  từng trường bắt buộc còn thiếu, không ghi một phần dữ liệu.

---

### `US-BM-01.2` — Ngừng khai thác Facility

> **Là** Business Operations Manager, **tôi muốn** ngừng khai thác một Facility, **để** không nhận
> đặt chỗ mới khi cơ sở đóng hoặc không còn vận hành.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-01` | Must | 5 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* Facility không còn hợp đồng *Active* hoặc *Overdue* và không còn Reservation
  *Pending Payment* hoặc *Confirmed*, *when* tôi chuyển trạng thái sang *Inactive*, *then* Facility
  biến mất khỏi trang công khai và không tạo Reservation mới được.
- **AC-2** — *Given* Facility còn hợp đồng *Active* hoặc *Overdue*, *when* tôi bấm ngừng khai thác,
  *then* hệ thống từ chối và liệt kê số hợp đồng còn hiệu lực — tôi không đóng cơ sở khi khách vẫn
  đang thuê.
- **AC-3** — *Given* Facility còn Reservation *Confirmed* chưa check-in, *when* tôi vẫn cần đóng cơ
  sở vì lý do nhà cung cấp, *then* tôi phải hủy từng Reservation theo `UC-F1-12` và `BR-CAN-05`
  (hoàn 100% mọi khoản) trước khi Facility chuyển *Inactive*.
- **AC-4** — *Given* Facility đã *Inactive*, *when* Storage Customer mở đường dẫn cũ, *then* hệ thống
  báo cơ sở không còn hoạt động, đúng hành vi đã mô tả ở `US-SC-01.2`.
- **AC-5** — *Given* Facility đang *Inactive*, *when* tôi kích hoạt lại, *then* trạng thái về *Active*
  và Facility xuất hiện lại trên trang công khai; các ô kho vẫn giữ trạng thái hiện tại, không tự mở
  bán ô đang *Occupied* hay *Cleaning*.

---

## 3. BM-02 — Thiết lập chính sách thuê

*Chính sách chung về đặt cọc, gia hạn, hủy, trả kho và xử lý quá hạn.*

Mọi thay đổi đều tạo **phiên bản chính sách mới** theo `BR-GEN-02`. Giá trị mặc định khi khởi tạo
hệ thống lấy từ [BUSINESS-RULES.md § 2](BUSINESS-RULES.md#2-bảng-tham-số-cấu-hình).

### `US-BM-02.1` — Thiết lập chính sách Deposit

> **Là** Business Operations Manager, **tôi muốn** sửa hệ số Deposit và thời gian giữ chỗ, **để**
> thu cọc đúng chính sách đang áp dụng.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-02` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở chính sách Deposit, *when* trang tải xong, *then* tôi thấy
  `deposit.multiplier` và `reservation.hold_hours` đang hiệu lực, kèm ngày ban hành phiên bản.
- **AC-2** — *Given* tôi nhập `deposit.multiplier` = `1.0` và `reservation.hold_hours` = `48`, *when*
  tôi ban hành phiên bản mới, *then* Reservation tạo **sau** thời điểm ban hành tính Deposit theo
  `BR-DEP-01` và giữ chỗ theo `BR-DEP-03`.
- **AC-3** — *Given* đã có Reservation *Pending Payment* hoặc hợp đồng đang hiệu lực, *when* tôi ban
  hành phiên bản Deposit mới, *then* các bản ghi cũ **không** bị đổi số tiền cọc hay thời hạn giữ chỗ
  theo `BR-GEN-02`.
- **AC-4** — *Given* tôi nhập `deposit.multiplier` nhỏ hơn hoặc bằng 0, hoặc
  `reservation.hold_hours` không phải số nguyên dương, *when* tôi lưu, *then* hệ thống từ chối và
  nêu trường sai, không ban hành phiên bản.
- **AC-5** — *Given* tôi chưa xác nhận "Ban hành", *when* tôi rời màn hình, *then* bản nháp không
  thay thế phiên bản đang hiệu lực.

---

### `US-BM-02.2` — Thiết lập chính sách Renewal

> **Là** Business Operations Manager, **tôi muốn** cấu hình mốc nhắc hạn và thời hạn gia hạn tối
> thiểu, **để** khách được nhắc và gia hạn đúng quy tắc.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-03` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở chính sách Renewal, *when* trang tải xong, *then* tôi thấy
  `renewal.reminder_days` (mặc định `7, 3, 1`) và `renewal.min_months` (mặc định `1`) theo
  `BR-REN-01` và `BR-REN-03`.
- **AC-2** — *Given* tôi ban hành phiên bản mới, *when* scheduled job chạy, *then* chỉ hợp đồng chưa
  hết hạn nhận nhắc theo danh sách ngày mới; hợp đồng đã gửi nhắc theo phiên bản cũ không bị gửi trùng
  trong cùng một mốc.
- **AC-3** — *Given* tôi nhập `renewal.min_months` khác số nguyên dương, hoặc một mốc trong
  `renewal.reminder_days` nhỏ hơn hoặc bằng 0, *when* tôi lưu, *then* hệ thống từ chối.
- **AC-4** — *Given* tôi nhập hai mốc nhắc trùng nhau, *when* tôi lưu, *then* hệ thống từ chối và
  yêu cầu các mốc phân biệt.
- **AC-5** — *Given* giới hạn 12 tháng mỗi lần gia hạn ở `BR-REN-07`, *when* tôi xem màn hình chính
  sách, *then* hệ thống hiển thị trần này là quy tắc cố định của hệ thống, không phải tham số tôi sửa
  được trên màn này.

---

### `US-BM-02.3` — Thiết lập chính sách Cancellation

> **Là** Business Operations Manager, **tôi muốn** đặt mốc hoàn 100% và tỷ lệ hoàn khi hủy muộn hoặc
> no-show, **để** hoàn tiền thống nhất trên toàn hệ thống.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-04` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở chính sách Cancellation, *when* trang tải xong, *then* tôi thấy
  `cancel.full_refund_hours`, `cancel.late_refund_rate`, `cancel.no_show_refund_rate` và
  `checkin.grace_days` đang hiệu lực.
- **AC-2** — *Given* tôi ban hành phiên bản mới, *when* Storage Customer hủy Reservation tạo **sau**
  thời điểm ban hành, *then* số tiền hoàn tính theo `BR-CAN-01` hoặc `BR-CAN-02` của phiên bản đó.
- **AC-3** — *Given* Reservation đã *Confirmed* trước khi ban hành, *when* khách hủy, *then* hệ thống
  vẫn tính theo phiên bản gắn với Reservation đó theo `BR-GEN-02`.
- **AC-4** — *Given* tôi nhập tỷ lệ hoàn nhỏ hơn 0% hoặc lớn hơn 100%, hoặc
  `cancel.full_refund_hours` / `checkin.grace_days` không phải số không âm, *when* tôi lưu, *then*
  hệ thống từ chối.
- **AC-5** — *Given* `BR-CAN-05` (cơ sở hủy thì hoàn 100%), *when* tôi xem màn hình, *then* quy tắc
  này được nêu là bắt buộc, không có ô nhập tỷ lệ phạt cho trường hợp nhà cung cấp hủy.

---

### `US-BM-02.4` — Thiết lập chính sách Return

> **Là** Business Operations Manager, **tôi muốn** đặt số ngày báo trả, thời hạn hoàn Deposit và tỷ
> lệ hoàn khi trả sớm, **để** quyết toán trả kho thống nhất.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-05` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở chính sách Return, *when* trang tải xong, *then* tôi thấy
  `return.notice_days`, `return.refund_working_days` và `return.early_refund_rate` đang hiệu lực.
- **AC-2** — *Given* tôi ban hành phiên bản mới, *when* khách đăng ký Return trên hợp đồng ký **sau**
  thời điểm ban hành, *then* hệ thống áp `BR-RET-01`, `BR-RET-05` và `BR-RET-06` của phiên bản đó.
- **AC-3** — *Given* `return.early_refund_rate` đang là `0%`, *when* phiên bản được ban hành, *then*
  màn hình đặt chỗ của Storage Customer phải hiển thị quy tắc không hoàn phần thuê chưa dùng, đúng
  `BR-RET-06`.
- **AC-4** — *Given* tôi nhập `return.notice_days` hoặc `return.refund_working_days` không phải số
  nguyên không âm, hoặc tỷ lệ hoàn ngoài đoạn 0–100%, *when* tôi lưu, *then* hệ thống từ chối.
- **AC-5** — *Given* công thức quyết toán `BR-RET-04` (Deposit trừ hư hỏng, phí quá hạn, phụ phí),
  *when* tôi xem màn hình, *then* công thức được nêu để đối chiếu, không phải tham số tôi xóa được.

---

### `US-BM-02.5` — Thiết lập chính sách Overdue

> **Là** Business Operations Manager, **tôi muốn** đặt ân hạn, phí ngày, trần phí và các mốc khóa /
> thông báo / chấm dứt, **để** xử lý quá hạn đúng một bộ mốc trên toàn hệ thống.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-06` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở chính sách Overdue, *when* trang tải xong, *then* tôi thấy
  `overdue.grace_days`, `overdue.daily_rate`, `overdue.cap_rate`, `overdue.lock_access_days`,
  `overdue.notice_days` và `overdue.termination_days` đang hiệu lực.
- **AC-2** — *Given* các mốc thỏa `grace_days` < `lock_access_days` < `notice_days` <
  `termination_days`, *when* tôi ban hành, *then* scheduled job của `UC-F6-05` đến `UC-F6-09` dùng
  đúng bộ mốc mới cho hợp đồng hết hạn **sau** thời điểm ban hành.
- **AC-3** — *Given* tôi nhập mốc lệch thứ tự (ví dụ khóa ngày 30 trong khi thông báo ngày 10),
  *when* tôi lưu, *then* hệ thống từ chối và nêu "Các mốc quá hạn phải tăng dần:
  ân hạn → khóa truy cập → thông báo chấm dứt → chấm dứt".
- **AC-4** — *Given* tôi nhập `overdue.daily_rate` hoặc `overdue.cap_rate` nhỏ hơn hoặc bằng 0% hoặc
  lớn hơn 100%, *when* tôi lưu, *then* hệ thống từ chối.
- **AC-5** — *Given* hợp đồng đã *Overdue* trước khi ban hành, *when* phiên bản mới có hiệu lực,
  *then* các mốc D+n của hợp đồng đó **không** bị dịch theo `BR-GEN-02`.
- **AC-6** — *Given* `BR-OVD-09` (khách Overdue không đặt chỗ mới), *when* tôi xem màn hình, *then*
  quy tắc này được nêu là bắt buộc, không có công tắc tắt trên màn chính sách này.

---

## 4. BM-03 — Quản lý giá và phí

*Khung giá thuê, phụ phí, phí quá hạn, chính sách giảm giá / miễn phí.*

### `US-BM-03.1` — Quản lý khung giá thuê theo Unit Type và Facility

> **Là** Business Operations Manager, **tôi muốn** đặt giá thuê tháng cho từng cặp Unit Type ×
> Facility, **để** khách thấy đúng giá của cơ sở họ chọn.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-07` | Must | 5 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi chọn một Facility, *when* bảng giá tải xong, *then* mỗi Unit Type đang bán
  tại cơ sở đó có một đơn giá tháng (VND), làm tròn theo `BR-GEN-04`.
- **AC-2** — *Given* tôi lưu giá mới cho một cặp Unit Type × Facility, *when* Storage Customer mở
  `UC-F1-02`, *then* giá hiển thị là giá vừa lưu; cơ sở khác với cùng Unit Type không bị đổi giá.
- **AC-3** — *Given* đã có Reservation *Pending Payment* hoặc hợp đồng đang khóa giá theo
  `BR-GEN-05`, *when* tôi đổi bảng giá, *then* các bản ghi đó giữ nguyên đơn giá đã khóa.
- **AC-4** — *Given* tôi nhập giá nhỏ hơn hoặc bằng 0, hoặc không phải số nguyên nghìn đồng, *when*
  tôi lưu, *then* hệ thống từ chối.
- **AC-5** — *Given* một Unit Type chưa có giá tại Facility đang chọn, *when* Storage Customer xem
  loại đó, *then* hệ thống không cho đặt chỗ và hiển thị "Chưa niêm yết giá" — tôi phải nhập giá trước
  khi loại đó mở bán.

---

### `US-BM-03.2` — Quản lý phụ phí và phí quá hạn

> **Là** Business Operations Manager, **tôi muốn** cấu hình phí quá hạn và các khoản phụ phí, **để**
> hệ thống tính đúng khi khách trả chậm hoặc phát sinh dịch vụ.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-08` | Must | 5 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở bảng phí, *when* trang tải xong, *then* tôi thấy `overdue.daily_rate` và
  `overdue.cap_rate` dùng cho `BR-OVD-03` và `BR-OVD-04`, cùng danh sách phụ phí có mã, tên, số tiền
  hoặc cách tính (ví dụ cấp lại Access Card).
- **AC-2** — *Given* tôi thêm phụ phí "Cấp lại Access Card" với số tiền cố định, *when* tôi lưu,
  *then* Facility Staff chọn được khoản này khi ghi nhận phụ thu cho hợp đồng, và khách thấy khoản đó
  ở `UC-F3-13`.
- **AC-3** — *Given* tôi sửa `overdue.daily_rate`, *when* phiên bản có hiệu lực, *then* chỉ hợp đồng
  chuyển *Overdue* **sau** thời điểm đó dùng mức mới; hợp đồng đang cộng dồn phí giữ nguyên cách tính
  của phiên bản đã gắn.
- **AC-4** — *Given* tôi nhập số tiền phụ phí nhỏ hơn 0, hoặc trùng mã phụ phí đã có, *when* tôi lưu,
  *then* hệ thống từ chối.
- **AC-5** — *Given* phụ phí đang được gán cho ít nhất một hợp đồng chưa tất toán, *when* tôi xóa
  phụ phí đó khỏi danh mục, *then* hệ thống từ chối và yêu cầu ngừng sử dụng (vô hiệu) thay vì xóa.

---

### `US-BM-03.3` — Quản lý chính sách giảm giá và miễn phí

> **Là** Business Operations Manager, **tôi muốn** ban hành chương trình giảm giá hoặc khung miễn
> phí, **để** áp dụng thống nhất khi ước tính chi phí và thu tiền.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-09` | Should | 3 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi tạo chương trình giảm giá với tên, mức giảm (số tiền hoặc %), thời gian hiệu
  lực và phạm vi (toàn hệ thống hoặc một Facility / Unit Type), *when* tôi ban hành, *then* màn ước
  tính `UC-F1-05` hiện khoản giảm thành một dòng riêng như `US-SC-02.2`.
- **AC-2** — *Given* hôm nay nằm ngoài khoảng hiệu lực của chương trình, *when* khách đặt chỗ,
  *then* hệ thống **không** cộng dòng giảm giá.
- **AC-3** — *Given* tôi nhập mức giảm lớn hơn 100% hoặc thời gian kết thúc trước thời gian bắt đầu,
  *when* tôi lưu, *then* hệ thống từ chối.
- **AC-4** — *Given* story này chỉ cấu hình **chính sách / chương trình**, *when* Facility Manager
  đề xuất miễn một khoản phí quá hạn của **một hợp đồng cụ thể**, *then* màn hình này không phải nơi
  duyệt vụ đó — việc duyệt theo vụ còn mở ở [ISS-07](OPEN-ISSUES.md).

---

## 5. BM-04 — Giám sát hiệu quả vận hành

*Theo dõi doanh thu, tỷ lệ lấp đầy kho và hiệu quả hoạt động của từng cơ sở.*

### `US-BM-04.1` — Giám sát doanh thu theo cơ sở và toàn hệ thống

> **Là** Business Operations Manager, **tôi muốn** xem doanh thu đã ghi nhận theo cơ sở và theo kỳ,
> **để** biết cơ sở nào đang mang tiền về.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-10` | Must | 5 | P5 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi chọn khoảng ngày và (tuỳ chọn) một Facility, *when* dashboard tải xong,
  *then* tôi thấy tổng doanh thu đã thu thành công, tách Deposit, phí thuê, phí gia hạn, phí quá hạn
  và phụ phí — đơn vị VND, làm tròn `BR-GEN-04`.
- **AC-2** — *Given* tôi xem toàn hệ thống, *when* bảng theo cơ sở hiển thị, *then* tổng từng dòng
  cộng lại đúng bằng tổng hệ thống của cùng kỳ, không lệch do làm tròn hai lần.
- **AC-3** — *Given* một giao dịch hoàn tiền, *when* tôi xem kỳ chứa ngày hoàn, *then* khoản hoàn
  được ghi âm hoặc cột hoàn riêng, không bị tính vào doanh thu đã thu.
- **AC-4** — *Given* tôi chọn ngày kết thúc trước ngày bắt đầu, *when* tôi áp dụng bộ lọc, *then*
  hệ thống từ chối và giữ nguyên kỳ đang xem.
- **AC-5** — *Given* kỳ tôi chọn chưa có giao dịch nào, *when* dashboard tải xong, *then* hệ thống
  hiện trạng thái rỗng "Chưa có giao dịch trong kỳ" với các tổng bằng 0, không báo lỗi.

---

### `US-BM-04.2` — Giám sát Usage Rate và hiệu quả vận hành

> **Là** Business Operations Manager, **tôi muốn** xem Usage Rate từng Facility, **để** so hiệu quả
> lấp đầy giữa các cơ sở.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-11` | Must | 5 | P5 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở dashboard vận hành, *when* dữ liệu tải xong, *then* mỗi Facility có
  Usage Rate = (số Storage Unit *Occupied* + *Overdue*) / (tổng ô không ở trạng thái ngừng dùng),
  tính tại thời điểm xem.
- **AC-2** — *Given* một Facility, *when* tôi xem chi tiết, *then* tôi thấy số ô *Available*,
  *Occupied*, *Overdue*, *Cleaning* và số hợp đồng *Overdue* đang mở.
- **AC-3** — *Given* hai Facility, *when* tôi sắp xếp theo Usage Rate, *then* thứ tự giảm dần hoặc
  tăng dần đúng với số đã tính, không làm tròn trước khi so.
- **AC-4** — *Given* Facility chưa có Storage Unit nào, *when* Usage Rate được tính, *then* hệ thống
  hiển thị "Không xác định" chứ không chia cho 0.
- **AC-5** — *Given* tôi không có vai trò Business Operations Manager, *when* tôi gọi đúng đường dẫn
  dashboard, *then* hệ thống từ chối với lỗi không đủ quyền.

---

## 6. BM-05 — Báo cáo toàn hệ thống

*Xem và xuất báo cáo theo cơ sở, loại ô kho, doanh thu và tình trạng thuê.*

### `US-BM-05.1` — Xem và xuất báo cáo theo cơ sở, Unit Type, doanh thu và tình trạng thuê

> **Là** Business Operations Manager, **tôi muốn** xem và xuất báo cáo hệ thống, **để** nộp số liệu
> theo kỳ mà không phải chép tay.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F4-12` | Must | 8 | P5 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi chọn kỳ, một hoặc mọi Facility, *when* tôi xem báo cáo, *then* tôi thấy các
  lát cắt: theo Facility, theo Unit Type, theo doanh thu (các loại khoản như `US-BM-04.1`) và theo
  tình trạng thuê (số hợp đồng *Active* / *Overdue* / *Terminated*, số Reservation *Confirmed*).
- **AC-2** — *Given* báo cáo đang hiển thị, *when* tôi xuất, *then* hệ thống tạo file CSV hoặc PDF
  chứa cùng số liệu trên màn hình, kèm kỳ, người xuất và thời điểm xuất (`Asia/Ho_Chi_Minh`).
- **AC-3** — *Given* xuất thành công, *when* tôi mở file, *then* tổng doanh thu và số hợp đồng khớp
  từng ô với màn hình tại cùng bộ lọc.
- **AC-4** — *Given* không có dữ liệu trong kỳ, *when* tôi xuất, *then* file vẫn được tạo với hàng
  tiêu đề và ghi chú "Không có dữ liệu", không báo lỗi hệ thống.
- **AC-5** — *Given* tôi bấm xuất hai lần liên tiếp, *when* hệ thống xử lý, *then* mỗi lần tạo một
  file độc lập; lần thứ hai không ghi đè nhật ký lần thứ nhất.

---

## 7. SA-01 — Quản lý tài khoản người dùng

*Quản lý tài khoản người dùng trong hệ thống.*

### `US-SA-01.1` — Tạo và cập nhật tài khoản

> **Là** System Administrator, **tôi muốn** tạo tài khoản nhân sự và sửa thông tin liên hệ, **để**
> Facility Staff, Facility Manager và Business Operations Manager đăng nhập được.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-SYS-02` | Must | 5 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi nhập email, họ tên và vai trò ban đầu, *when* tôi tạo tài khoản, *then* hệ
  thống gửi hướng dẫn đặt mật khẩu tới email đó và tài khoản ở trạng thái *Active*.
- **AC-2** — *Given* Storage Customer tự đăng ký theo `UC-SYS-01`, *when* tôi mở danh sách người
  dùng, *then* tôi thấy tài khoản đó và sửa được họ tên, số điện thoại; tôi **không** đổi email đã
  dùng để đăng nhập.
- **AC-3** — *Given* email tôi nhập đã tồn tại, *when* tôi tạo tài khoản, *then* hệ thống từ chối
  với "Email đã được dùng", không tạo bản ghi thứ hai.
- **AC-4** — *Given* email không đúng định dạng, *when* tôi lưu, *then* hệ thống từ chối trước khi
  gửi thư.
- **AC-5** — *Given* tôi không phải System Administrator, *when* tôi gọi API tạo tài khoản nhân sự,
  *then* hệ thống trả về lỗi không đủ quyền.

---

### `US-SA-01.2` — Khóa, mở khóa và vô hiệu hóa tài khoản

> **Là** System Administrator, **tôi muốn** khóa hoặc vô hiệu hóa tài khoản, **để** người không còn
> được phép không đăng nhập được.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-SYS-02` | Must | 3 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tài khoản đang *Active*, *when* tôi khóa, *then* phiên đăng nhập hiện tại bị
  thu hồi và lần đăng nhập kế tiếp bị từ chối với "Tài khoản đang bị khóa".
- **AC-2** — *Given* tài khoản đang bị khóa, *when* tôi mở khóa, *then* người dùng đăng nhập được
  lại bằng mật khẩu hiện tại, không cần tạo tài khoản mới.
- **AC-3** — *Given* tôi vô hiệu hóa tài khoản, *when* thao tác xong, *then* tài khoản không xuất
  hiện trong bộ lọc mặc định "Đang hoạt động", không đăng nhập được, và **không** thể tạo tài khoản
  mới trùng email đó.
- **AC-4** — *Given* đây là tài khoản System Administrator *Active* cuối cùng, *when* tôi khóa hoặc
  vô hiệu hóa chính nó, *then* hệ thống từ chối — hệ thống luôn còn ít nhất một SA đăng nhập được.
- **AC-5** — *Given* tôi thao tác trên chính tài khoản đang đăng nhập và vẫn còn SA khác *Active*,
  *when* tôi vô hiệu hóa chính mình, *then* tôi bị đăng xuất ngay sau khi lưu.

---

## 8. SA-02 — Phân quyền vai trò

*Gán vai trò Storage Customer, Facility Staff, Facility Manager, Business Operations Manager.*

### `US-SA-02.1` — Gán vai trò cho người dùng

> **Là** System Administrator, **tôi muốn** gán đúng một vai trò cho từng tài khoản, **để** người
> dùng chỉ thấy đúng portal của họ.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F5-07` | Must | 5 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tài khoản chưa có vai trò nghiệp vụ, *when* tôi gán một trong bốn vai trò
  Storage Customer, Facility Staff, Facility Manager, Business Operations Manager, *then* lần đăng
  nhập kế tiếp mở đúng portal của vai trò đó.
- **AC-2** — *Given* tài khoản đang là Facility Staff, *when* tôi đổi sang Facility Manager, *then*
  phiên cũ bị thu hồi; quyền Staff hết hiệu lực ngay, quyền Manager chỉ có sau khi tôi gán Facility
  ở `US-SA-03.1`.
- **AC-3** — *Given* tôi để trống vai trò hoặc chọn giá trị không thuộc bốn vai trò trên, *when* tôi
  lưu, *then* hệ thống từ chối.
- **AC-4** — *Given* tài khoản là System Administrator, *when* tôi đổi sang một vai trò nghiệp vụ,
  *then* hệ thống chỉ cho phép nếu vẫn còn ít nhất một SA *Active* khác — cùng ràng buộc với
  `US-SA-01.2`.
- **AC-5** — *Given* đề bài không liệt kê System Administrator trong bốn vai trò gán được, *when*
  tôi mở danh sách vai trò trên màn gán, *then* không có lựa chọn "tự phong SA" cho tài khoản thường;
  tài khoản SA chỉ được tạo theo quy trình bàn giao ban đầu của hệ thống.

---

## 9. SA-03 — Cấu hình quyền truy cập dữ liệu

*Phân quyền dữ liệu theo vai trò người dùng và theo cơ sở được gán.*

### `US-SA-03.1` — Gán quyền dữ liệu theo vai trò và theo Facility

> **Là** System Administrator, **tôi muốn** gán Facility cho Facility Staff và Facility Manager,
> **để** họ chỉ xem và sửa dữ liệu của cơ sở mình phụ trách.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F5-08` | Must | 8 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* người dùng là Facility Manager, *when* tôi gán một hoặc nhiều Facility, *then*
  người đó chỉ gọi được API và chỉ thấy trên giao diện các ô kho, hợp đồng, Reservation của đúng các
  Facility đó.
- **AC-2** — *Given* người dùng là Facility Staff, *when* tôi gán Facility, *then* danh sách công
  việc hằng ngày `UC-F5-05` chỉ gồm khách của cơ sở được gán.
- **AC-3** — *Given* người dùng là Business Operations Manager hoặc System Administrator, *when* tôi
  mở cấu hình Facility, *then* không bắt buộc gán cơ sở — hai vai trò này xem dữ liệu toàn hệ thống.
- **AC-4** — *Given* Facility Manager chưa được gán Facility nào, *when* người đó đăng nhập, *then*
  hệ thống cho vào portal nhưng mọi danh sách nghiệp vụ rỗng và thao tác ghi bị từ chối với "Chưa
  được gán cơ sở".
- **AC-5** — *Given* tôi gán Facility *Inactive*, *when* tôi lưu, *then* hệ thống từ chối — chỉ gán
  Facility *Active*.
- **AC-6** — *Given* Facility Staff đang xem dữ liệu cơ sở A, *when* tôi gỡ A khỏi tài khoản đó,
  *then* phiên bị thu hồi hoặc lần tải trang kế tiếp không còn dữ liệu cơ sở A.

---

## 10. SA-04 — Theo dõi nhật ký

*Theo dõi lịch sử đăng nhập và nhật ký hoạt động của người dùng.*

### `US-SA-04.1` — Xem lịch sử đăng nhập

> **Là** System Administrator, **tôi muốn** xem lịch sử đăng nhập, **để** biết tài khoản nào vào hệ
> thống lúc nào.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-SYS-03` | Must | 3 | P5 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở nhật ký đăng nhập, *when* trang tải xong, *then* mỗi dòng gồm thời điểm
  (`Asia/Ho_Chi_Minh`), email, kết quả (*Thành công* / *Thất bại*), lý do thất bại nếu có.
- **AC-2** — *Given* tôi lọc theo email hoặc khoảng ngày, *when* áp dụng, *then* chỉ còn bản ghi
  khớp bộ lọc.
- **AC-3** — *Given* không có bản ghi khớp, *when* kết quả trả về, *then* hệ thống hiện trạng thái
  rỗng, không báo lỗi.
- **AC-4** — *Given* tôi không phải System Administrator, *when* tôi gọi API nhật ký đăng nhập,
  *then* hệ thống từ chối.

---

### `US-SA-04.2` — Xem nhật ký hoạt động người dùng

> **Là** System Administrator, **tôi muốn** xem nhật ký thao tác nghiệp vụ, **để** lần được ai đã
> đổi chính sách, giá, vai trò hoặc trạng thái tài khoản.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-SYS-03` | Must | 5 | P5 |

**Acceptance Criteria**

- **AC-1** — *Given* Business Operations Manager vừa ban hành chính sách hoặc System Administrator
  vừa đổi vai trò, *when* tôi mở nhật ký hoạt động, *then* có bản ghi gồm thời điểm, người thực hiện,
  hành động, đối tượng (mã chính sách, mã tài khoản, mã Facility) và giá trị trước / sau khi đổi.
- **AC-2** — *Given* tôi lọc theo loại hành động hoặc theo người dùng, *when* áp dụng, *then* danh
  sách chỉ còn bản ghi khớp.
- **AC-3** — *Given* tôi xuất nhật ký, *when* file tạo xong, *then* CSV chứa đúng các cột đang xem
  và không chứa mật khẩu hay Access Code.
- **AC-4** — *Given* không có hoạt động trong khoảng lọc, *when* tôi xem, *then* hệ thống hiện trạng
  thái rỗng.
- **AC-5** — *Given* tôi không phải System Administrator, *when* tôi gọi API nhật ký hoạt động,
  *then* hệ thống từ chối.

---

## 11. Bảng tổng hợp

| Mã story | Tên | Mã yêu cầu | Ưu tiên | Point | Giai đoạn | Số AC |
|----------|-----|------------|---------|:-----:|:---------:|:-----:|
| `US-BM-01.1` | Thêm và chỉnh sửa Facility | `BM-01` | Must | 5 | P2 | 5 |
| `US-BM-01.2` | Ngừng khai thác Facility | `BM-01` | Must | 5 | P2 | 5 |
| `US-BM-02.1` | Thiết lập chính sách Deposit | `BM-02` | Must | 5 | P4 | 5 |
| `US-BM-02.2` | Thiết lập chính sách Renewal | `BM-02` | Must | 5 | P4 | 5 |
| `US-BM-02.3` | Thiết lập chính sách Cancellation | `BM-02` | Must | 5 | P4 | 5 |
| `US-BM-02.4` | Thiết lập chính sách Return | `BM-02` | Must | 5 | P4 | 5 |
| `US-BM-02.5` | Thiết lập chính sách Overdue | `BM-02` | Must | 5 | P4 | 6 |
| `US-BM-03.1` | Quản lý khung giá thuê theo Unit Type và Facility | `BM-03` | Must | 5 | P2 | 5 |
| `US-BM-03.2` | Quản lý phụ phí và phí quá hạn | `BM-03` | Must | 5 | P2 | 5 |
| `US-BM-03.3` | Quản lý chính sách giảm giá và miễn phí | `BM-03` | Should | 3 | P2 | 4 |
| `US-BM-04.1` | Giám sát doanh thu theo cơ sở và toàn hệ thống | `BM-04` | Must | 5 | P5 | 5 |
| `US-BM-04.2` | Giám sát Usage Rate và hiệu quả vận hành | `BM-04` | Must | 5 | P5 | 5 |
| `US-BM-05.1` | Xem và xuất báo cáo theo cơ sở, Unit Type, doanh thu và tình trạng thuê | `BM-05` | Must | 8 | P5 | 5 |
| `US-SA-01.1` | Tạo và cập nhật tài khoản | `SA-01` | Must | 5 | P2 | 5 |
| `US-SA-01.2` | Khóa, mở khóa và vô hiệu hóa tài khoản | `SA-01` | Must | 3 | P2 | 5 |
| `US-SA-02.1` | Gán vai trò cho người dùng | `SA-02` | Must | 5 | P2 | 5 |
| `US-SA-03.1` | Gán quyền dữ liệu theo vai trò và theo Facility | `SA-03` | Must | 8 | P2 | 6 |
| `US-SA-04.1` | Xem lịch sử đăng nhập | `SA-04` | Must | 3 | P5 | 4 |
| `US-SA-04.2` | Xem nhật ký hoạt động người dùng | `SA-04` | Must | 5 | P5 | 5 |

**Theo giai đoạn:** P2 — 9 story / 44 point · P4 — 5 story / 25 point · P5 — 5 story / 26 point.
**Theo ưu tiên:** Must — 18 story / 92 point · Should — 1 story / 3 point · Could — 0 story.
**Theo actor:** Business Operations Manager — 13 story / 66 point · System Administrator — 6 story / 29 point.
**Tổng:** 19 story · 95 story point · 95 acceptance criteria.

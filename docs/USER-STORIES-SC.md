# User Story — Storage Customer

> **Self-Storage Facility Rental and Management System** — user story và acceptance criteria cho
> toàn bộ chức năng của **Storage Customer** (`SC-01` → `SC-06`).
>
> Nhiệm vụ **T1.2** · Giai đoạn 1 · [PLAN.md](PLAN.md).
> Tài liệu liên quan: [USE-CASES.md](USE-CASES.md) · [BUSINESS-RULES.md](BUSINESS-RULES.md)
>
> User story của các actor còn lại: **T1.3** (`FS-*`, `FM-*` — Tùng) và **T1.4**
> ([USER-STORIES-BM-SA.md](USER-STORIES-BM-SA.md) — `BM-*`, `SA-*`).

---

## Mục lục

1. [Quy ước viết user story](#1-quy-ước-viết-user-story)
2. [SC-01 — Xem thông tin dịch vụ](#2-sc-01--xem-thông-tin-dịch-vụ)
3. [SC-02 — Đặt chỗ ô kho](#3-sc-02--đặt-chỗ-ô-kho)
4. [SC-03 — Thanh toán](#4-sc-03--thanh-toán)
5. [SC-04 — Check-in nhận kho](#5-sc-04--check-in-nhận-kho)
6. [SC-05 — Quản lý ô kho đã thuê](#6-sc-05--quản-lý-ô-kho-đã-thuê)
7. [SC-06 — Gửi yêu cầu hỗ trợ](#7-sc-06--gửi-yêu-cầu-hỗ-trợ)
8. [Bảng tổng hợp](#8-bảng-tổng-hợp)

---

## 1. Quy ước viết user story

| Hạng mục | Quy ước |
|----------|---------|
| **Mã story** | `US-<mã yêu cầu>.<số thứ tự>` — ví dụ `US-SC-02.3` là story thứ ba của `SC-02`. Không đánh số lại, story mới nối tiếp vào cuối nhóm |
| **Câu chuyện** | *Là* `<actor>`, *tôi muốn* `<mục tiêu>`, *để* `<giá trị nhận được>` |
| **Acceptance criteria** | Viết theo **Given – When – Then**, đánh số `AC-1`, `AC-2`… Mỗi story bắt buộc có ít nhất một AC cho **nhánh thất bại** |
| **Độ ưu tiên** | MoSCoW — **Must** (không có thì hệ thống không chạy được), **Should** (quan trọng, có thể lùi), **Could** (làm nếu còn thời gian) |
| **Story point** | Thang Fibonacci 1 · 2 · 3 · 5 · 8, ước lượng theo độ phức tạp chứ không theo giờ công |
| **Giai đoạn** | Bám theo [bản đồ phủ yêu cầu của PLAN.md § 5](PLAN.md#5-bản-đồ-phủ-yêu-cầu) |
| **Tham chiếu** | Mọi story trỏ về use case ở [USE-CASES.md](USE-CASES.md) và quy tắc ở [BUSINESS-RULES.md](BUSINESS-RULES.md) |

Tổng cộng **22 user story**, **111 acceptance criteria**, **95 story point**.

---

## 2. SC-01 — Xem thông tin dịch vụ

*Xem danh sách cơ sở lưu trữ, loại ô kho, kích thước, giá thuê và các ô kho còn trống.*

### `US-SC-01.1` — Tìm cơ sở lưu trữ phù hợp

> **Là** Storage Customer, **tôi muốn** tìm và lọc danh sách Facility theo khu vực, **để** chọn được
> cơ sở gần chỗ tôi ở nhất.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-01` | Must | 3 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi đang ở trang danh sách cơ sở, *when* trang tải xong, *then* tôi thấy danh
  sách Facility đang hoạt động kèm tên, địa chỉ, số ô kho còn trống và khoảng giá thuê từ – đến.
- **AC-2** — *Given* tôi nhập từ khóa vào ô tìm kiếm, *when* tôi tìm, *then* hệ thống trả về các
  Facility có tên hoặc địa chỉ khớp từ khóa, không phân biệt hoa thường và không phân biệt dấu.
- **AC-3** — *Given* tôi chọn bộ lọc tỉnh/thành hoặc quận/huyện, *when* áp dụng, *then* chỉ những
  Facility thuộc khu vực đó được hiển thị, và bộ lọc đang áp dụng được hiển thị rõ để gỡ bỏ.
- **AC-4** — *Given* không có Facility nào khớp điều kiện lọc, *when* danh sách trả về rỗng, *then*
  hệ thống hiển thị thông báo "Không tìm thấy cơ sở phù hợp" kèm nút xóa bộ lọc, **không** hiển thị
  trang trắng hay lỗi.
- **AC-5** — *Given* tôi **chưa đăng nhập**, *when* tôi mở trang danh sách cơ sở, *then* tôi vẫn xem
  được đầy đủ thông tin — đây là trang công khai.

---

### `US-SC-01.2` — Xem chi tiết loại ô kho và giá thuê

> **Là** Storage Customer, **tôi muốn** xem các Unit Type của một Facility kèm kích thước và giá,
> **để** chọn được kích thước vừa với lượng đồ cần gửi.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-02` | Must | 3 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở trang chi tiết một Facility, *when* trang tải xong, *then* tôi thấy danh
  sách Unit Type kèm kích thước (dài × rộng × cao), diện tích, giá thuê theo tháng và capacity hiện
  có của từng loại.
- **AC-2** — *Given* một Unit Type có capacity, *when* tôi xem, *then* nút "Đặt chỗ" ở trạng thái
  bật; *given* Unit Type không còn capacity, *then* nút bị vô hiệu hóa kèm nhãn "Tạm hết".
- **AC-3** — *Given* giá thuê được cấu hình theo `BM-03`, *when* trang hiển thị giá, *then* giá phải
  là giá hiện hành của **đúng cơ sở đó** — hai cơ sở khác nhau có thể có giá khác nhau cho cùng
  Unit Type.
- **AC-4** — *Given* tôi xem một Unit Type, *when* trang hiển thị, *then* hệ thống nêu rõ số tiền
  Deposit tương ứng theo `BR-DEP-01` (mặc định bằng một tháng tiền thuê).
- **AC-5** — *Given* Facility đang bị ngừng khai thác, *when* tôi truy cập đường dẫn cũ, *then* hệ
  thống trả về thông báo cơ sở không còn hoạt động thay vì hiển thị dữ liệu cũ.

---

### `US-SC-01.3` — Kiểm tra ô kho còn trống theo thời gian

> **Là** Storage Customer, **tôi muốn** kiểm tra ô kho còn trống theo ngày bắt đầu và thời hạn thuê
> dự kiến, **để** biết chắc có chỗ trước khi đặt.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-03` | Must | 5 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi chọn Facility, Unit Type, ngày bắt đầu và số tháng thuê, *when* tôi bấm
  kiểm tra, *then* hệ thống trả về số ô kho còn trống cho **đúng khoảng thời gian** đó.
- **AC-2** — *Given* tôi chọn ngày bắt đầu trong quá khứ, *when* tôi bấm kiểm tra, *then* hệ thống
  báo lỗi "Ngày bắt đầu phải từ hôm nay trở đi" và không gọi tra cứu.
- **AC-3** — *Given* thời hạn thuê tôi nhập nhỏ hơn 1 tháng hoặc không phải số tháng nguyên, *when*
  tôi gửi, *then* hệ thống báo lỗi theo `BR-GEN-03`.
- **AC-4** — *Given* có capacity slot đang được Reservation khác giữ cho khoảng thuê giao nhau,
  *when* hệ thống tính Availability, *then* slot đó chỉ bị trừ **một lần** theo `BR-AVL-01` và không
  được trả cho hai khách.
- **AC-5** — *Given* không còn ô kho trống của Unit Type đã chọn, *when* kết quả trả về, *then* hệ
  thống gợi ý các Unit Type khác còn trống tại cùng cơ sở, hoặc cùng Unit Type ở cơ sở lân cận.

---

## 3. SC-02 — Đặt chỗ ô kho

*Đặt chỗ bằng cách chọn cơ sở, loại ô kho, ngày bắt đầu và thời hạn thuê.*

### `US-SC-02.1` — Tạo đặt chỗ ô kho

> **Là** Storage Customer, **tôi muốn** tạo Reservation bằng cách xem sơ đồ cơ sở, chọn ô kho cụ thể, ngày bắt
> đầu và thời hạn thuê, **để** giữ được đúng ô kho phù hợp cho kỳ thuê của mình.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-04`, `UC-F1-06` | Must | 8 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi đã đăng nhập và chọn đủ Facility, ô kho cụ thể trên sơ đồ/danh sách, ngày bắt đầu, số tháng thuê,
  *when* tôi xác nhận, *then* hệ thống tạo Reservation *Pending Payment* và tạm giữ chính Storage Unit đó
  cho đúng khoảng thuê theo `BR-RES-02`.
- **AC-2** — *Given* Reservation vừa tạo, *when* hệ thống giữ capacity, *then* slot được giữ đúng
  `reservation.hold_hours` (48 giờ) theo `BR-DEP-03`, và thời hạn còn lại được hiển thị dạng đếm
  ngược trên màn hình thanh toán.
- **AC-3** — *Given* tôi **chưa đăng nhập**, *when* tôi bấm "Đặt chỗ", *then* hệ thống chuyển tôi
  sang màn hình đăng nhập và **giữ nguyên** lựa chọn để quay lại đúng bước đang dở.
- **AC-4** — *Given* capacity slot cuối cùng vừa được yêu cầu đồng thời khác giữ trước, *when* tôi
  xác nhận, *then* hệ thống báo "Loại ô kho vừa hết chỗ, vui lòng chọn lại" và không overbook theo
  `BR-AVL-03`.
- **AC-5** — *Given* tôi đang có hợp đồng ở trạng thái *Overdue*, *when* tôi cố tạo Reservation mới,
  *then* hệ thống từ chối và nêu lý do theo `BR-OVD-09`.
- **AC-6** — *Given* tôi đã có một Reservation *Pending Payment* chưa thanh toán, *when* tôi tạo
  thêm Reservation mới, *then* hệ thống cho phép — mỗi Reservation giữ capacity và hết hạn độc lập
  theo `BR-RES-03`.

---

### `US-SC-02.2` — Xem ước tính chi phí trước khi xác nhận

> **Là** Storage Customer, **tôi muốn** thấy bảng chi tiết các khoản phải trả trước khi xác nhận,
> **để** không bị bất ngờ về số tiền.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-05` | Must | 3 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi đã chọn xong Unit Type và thời hạn, *when* màn hình xác nhận hiển thị,
  *then* tôi thấy tách bạch: đơn giá tháng, số tháng, tổng phí thuê, tiền Deposit, và tổng cộng.
- **AC-2** — *Given* bảng chi phí hiển thị, *when* tôi đọc, *then* mọi số tiền đã được làm tròn lên
  đến 1.000 đ theo `BR-GEN-04` và hiển thị đơn vị VND.
- **AC-3** — *Given* có chương trình giảm giá đang áp dụng theo `BM-03`, *when* bảng chi phí hiển
  thị, *then* khoản giảm được thể hiện thành một dòng riêng kèm tên chương trình.
- **AC-4** — *Given* tôi đổi số tháng thuê, *when* giá trị thay đổi, *then* bảng chi phí được tính
  lại ngay mà không phải tải lại trang.
- **AC-5** — *Given* tôi đang ở màn hình xác nhận, *when* tôi đọc điều khoản, *then* hệ thống hiển
  thị rõ quy tắc hoàn tiền khi hủy (`BR-CAN-01`, `BR-CAN-02`) và quy tắc **không hoàn tiền khi trả
  sớm** (`BR-RET-06`), và tôi phải tích xác nhận đã đọc mới đặt được.
- **AC-6** — *Given* bảng giá bị Business Operations Manager thay đổi trong lúc tôi còn đang ở màn
  hình xác nhận, *when* tôi bấm đặt chỗ, *then* hệ thống **từ chối** tạo Reservation theo mức giá cũ,
  hiển thị bảng chi phí đã cập nhật kèm cảnh báo giá vừa thay đổi, và yêu cầu tôi xác nhận lại — tôi
  không bao giờ bị tính một mức giá khác với mức vừa nhìn thấy.

---

### `US-SC-02.3` — Nhận xác nhận đặt chỗ và lịch hẹn check-in

> **Là** Storage Customer, **tôi muốn** nhận xác nhận đặt chỗ kèm lịch hẹn check-in, **để** biết khi
> nào và đến đâu để nhận ô kho.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-09` | Must | 3 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi vừa thanh toán thành công, *when* giao dịch được ghi nhận, *then*
  Reservation chuyển sang *Confirmed* và tôi thấy màn hình xác nhận kèm mã đặt chỗ.
- **AC-2** — *Given* Reservation đã *Confirmed*, *when* tôi xem chi tiết, *then* tôi thấy mã ô kho
  được phân bổ, vị trí ô kho trong cơ sở, địa chỉ cơ sở, ngày giờ hẹn check-in và giấy tờ cần mang.
- **AC-3** — *Given* Reservation chuyển sang *Confirmed*, *when* hệ thống xử lý xong, *then* tôi
  nhận được email xác nhận trong vòng 5 phút; email gửi lỗi thì hệ thống ghi log và thử lại, đồng
  thời thông tin vẫn xem được đầy đủ trong ứng dụng.
- **AC-4** — *Given* tôi mở lại ứng dụng sau đó, *when* tôi vào mục đặt chỗ của tôi, *then* tôi tra
  cứu lại được toàn bộ Reservation đang hiệu lực và đã kết thúc.

---

### `US-SC-02.4` — Hủy đặt chỗ trước khi nhận kho

> **Là** Storage Customer, **tôi muốn** hủy Reservation và biết trước số tiền được hoàn, **để** chủ
> động khi kế hoạch thay đổi.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-10` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* Reservation của tôi đang *Confirmed* và chưa Check-in, *when* tôi bấm hủy,
  *then* hệ thống hiển thị **trước** số tiền sẽ được hoàn, tính theo `BR-CAN-01`, `BR-CAN-02` hoặc
  `BR-CAN-08` tùy thời điểm hủy, và yêu cầu tôi xác nhận lần nữa.
- **AC-2** — *Given* tôi hủy sớm hơn 48 giờ so với ngày bắt đầu thuê, *when* tôi xác nhận, *then* số
  tiền hoàn bằng 100% phí thuê cộng 100% Deposit.
- **AC-3** — *Given* tôi hủy trong vòng 48 giờ trước ngày bắt đầu, *when* tôi xác nhận, *then* số
  tiền hoàn bằng 100% phí thuê cộng 50% Deposit theo `BR-CAN-02`.
- **AC-4** — *Given* tôi đã hủy Reservation, *when* việc hủy hoàn tất, *then* ô kho trở lại
  *Available* ngay và Reservation chuyển sang *Cancelled*; hoàn tiền được theo dõi riêng và lỗi hoàn
  tiền không khôi phục Reservation theo `BR-PAY-05`.
- **AC-5** — *Given* Reservation đã ở trạng thái *Cancelled*, *when* tôi cố hủy lần nữa hoặc khôi
  phục, *then* hệ thống từ chối theo `BR-CAN-07`.
- **AC-6** — *Given* tôi đã check-in nhận kho, *when* tôi mở Reservation đó, *then* **không** có nút
  hủy — trường hợp này phải đi theo quy trình trả kho ở `US-SC-05.4`.

---

## 4. SC-03 — Thanh toán

*Thanh toán tiền cọc, phí thuê, phí gia hạn hoặc các khoản phụ thu.*

### `US-SC-03.1` — Thanh toán Deposit và phí thuê N tháng

> **Là** Storage Customer, **tôi muốn** thanh toán Deposit và toàn bộ phí thuê N tháng trong một
> lần, **để** hoàn tất đặt chỗ.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-07` | Must | 8 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* Reservation của tôi đang *Pending Payment*, *when* tôi mở màn hình thanh toán,
  *then* tôi thấy tách bạch toàn bộ phí thuê N tháng, Deposit, giảm giá và phụ phí trả trước; không
  chấp nhận thanh toán một phần theo `BR-PAY-01`.
- **AC-2** — *Given* tôi chọn phương thức thanh toán và xác nhận, *when* cổng thanh toán trả về
  thành công và unit được phân bổ, *then* hệ thống ghi nhận một giao dịch, chuyển Reservation sang
  *Confirmed*, tạo Contract *Pending Check-in* và gửi biên nhận theo `BR-PAY-02`.
- **AC-3** — *Given* Deposit và phí thuê được thu, *when* giao dịch được ghi nhận, *then* hai khoản
  được ghi **tách bạch** trong sổ giao dịch theo `BR-DEP-02`, vì Deposit sẽ được quyết toán riêng khi
  trả kho.
- **AC-4** — *Given* cổng thanh toán trả về thất bại, *when* tôi quay lại ứng dụng, *then*
  Reservation **vẫn** ở *Pending Payment*, capacity vẫn được giữ tới hết 48 giờ, và tôi thanh toán
  lại được theo `BR-PAY-03`.
- **AC-5** — *Given* tôi bấm thanh toán hai lần liên tiếp hoặc cổng gửi callback trùng, *when* hệ
  thống xử lý, *then* chỉ **một** giao dịch được ghi nhận và tôi không bị trừ tiền hai lần.
- **AC-6** — *Given* tôi thanh toán sau khi thời hạn giữ chỗ 48 giờ đã hết, *when* tôi gửi giao dịch,
  *then* hệ thống từ chối vì Reservation đã *Expired* theo `BR-DEP-03` và hướng dẫn tôi đặt lại.
- **AC-7** — *Given* giao dịch vừa thành công nhưng không thể phân bổ Storage Unit do thay đổi ngoài
  dự kiến, *when* hệ thống hoàn tất xử lý, *then* Reservation không được xác nhận và toàn bộ khoản
  vừa thu được hoàn về phương thức gốc theo `BR-AVL-05`.

---

### `US-SC-03.2` — Thanh toán phí gia hạn

> **Là** Storage Customer, **tôi muốn** thanh toán phí gia hạn, **để** tiếp tục sử dụng ô kho mà
> không bị gián đoạn.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F6-03` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi chọn gia hạn N tháng, *when* màn hình thanh toán hiển thị, *then* số tiền
  được tính theo **bảng giá tại thời điểm gia hạn** theo `BR-REN-05`, và mức chênh so với giá cũ
  được nêu rõ nếu giá đã thay đổi.
- **AC-2** — *Given* thanh toán gia hạn thành công, *when* giao dịch được ghi nhận, *then* ngày kết
  thúc hợp đồng được dời thêm đúng N tháng, tính từ ngày kết thúc cũ chứ không phải ngày thanh toán,
  theo `BR-REN-04`, không chờ Facility Manager duyệt thủ công.
- **AC-3** — *Given* hợp đồng của tôi đang *Overdue*, *when* tôi gia hạn, *then* hệ thống gộp **phí
  quá hạn còn nợ + phí thuê kỳ mới** vào một giao dịch theo `BR-REN-06`, và không cho tôi thanh toán
  riêng phần phí thuê.
- **AC-4** — *Given* thanh toán gia hạn thất bại, *when* tôi quay lại, *then* Contract không bị dời
  hạn và không phát sinh khoản nợ mới; nếu hết hạn trước lần thanh toán thành công thì Contract
  chuyển *Overdue* theo `BR-REN-10`.
- **AC-5** — *Given* tôi gia hạn khi hợp đồng đang *Overdue* và bị khóa truy cập, *when* thanh toán
  thành công, *then* Access Code của tôi được mở lại trong vòng 1 giờ theo `BR-OVD-08`.

---

### `US-SC-03.3` — Thanh toán phụ phí và khoản nộp bổ sung

> **Là** Storage Customer, **tôi muốn** thanh toán các khoản phụ thu phát sinh, **để** tất toán hợp
> đồng dứt điểm.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-13` | Should | 3 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* có khoản phụ thu được ghi nhận cho hợp đồng của tôi (chi phí khắc phục hư hỏng,
  cấp lại chìa khóa vật lý), *when* tôi mở hợp đồng, *then* khoản đó hiện trong mục "Cần thanh toán" kèm
  lý do và ngày phát sinh.
- **AC-2** — *Given* quyết toán trả kho cho kết quả âm theo `BR-RET-04`, *when* hợp đồng chuyển sang
  chờ tất toán, *then* hệ thống hiển thị đúng số tiền tôi phải nộp thêm và không cho đóng hợp đồng
  tới khi nộp đủ.
- **AC-3** — *Given* tôi thanh toán khoản phụ thu thành công, *when* giao dịch hoàn tất, *then* mục
  "Cần thanh toán" về 0 và trạng thái hợp đồng được cập nhật tương ứng.
- **AC-4** — *Given* khoản phụ thu do lập nhầm, *when* Facility Manager hủy khoản đó, *then* khoản
  biến mất khỏi mục cần thanh toán của tôi và lý do hủy được ghi nhật ký.

---

### `US-SC-03.4` — Xem lịch sử giao dịch và hóa đơn

> **Là** Storage Customer, **tôi muốn** xem lại toàn bộ giao dịch và tải hóa đơn, **để** đối chiếu
> chi tiêu và làm chứng từ.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-02` | Should | 3 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở mục lịch sử thanh toán, *when* trang tải xong, *then* tôi thấy danh sách
  giao dịch sắp xếp mới nhất trước, mỗi dòng gồm ngày, loại khoản (Deposit / phí thuê / phí gia hạn /
  phí quá hạn / phụ thu / hoàn tiền), số tiền và trạng thái.
- **AC-2** — *Given* tôi chọn một giao dịch thành công, *when* tôi bấm tải hóa đơn, *then* hệ thống
  xuất file PDF chứa thông tin cơ sở, ô kho, kỳ thuê và chi tiết các khoản.
- **AC-3** — *Given* tôi có nhiều hợp đồng, *when* tôi lọc theo hợp đồng hoặc theo khoảng thời gian,
  *then* danh sách chỉ hiển thị giao dịch khớp điều kiện lọc.
- **AC-4** — *Given* tôi chưa phát sinh giao dịch nào, *when* tôi mở mục này, *then* hệ thống hiển
  thị trạng thái rỗng có hướng dẫn, không phải bảng trắng.

---

## 5. SC-04 — Check-in nhận kho

*Đến nhận ô kho được cấp theo lịch hẹn đã đặt.*

### `US-SC-04.1` — Xem lịch hẹn check-in

> **Là** Storage Customer, **tôi muốn** xem lịch hẹn check-in và những thứ cần mang theo, **để** đến
> nhận kho đúng hẹn và không thiếu giấy tờ.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-09`, `UC-F2-05` | Must | 2 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi có Reservation *Confirmed*, *when* tôi mở chi tiết, *then* tôi thấy ngày
  giờ hẹn, địa chỉ cơ sở, mã ô kho, vị trí ô kho và danh sách giấy tờ cần mang.
- **AC-2** — *Given* lịch hẹn của tôi là ngày mai, *when* hệ thống chạy tác vụ nhắc lịch, *then* tôi
  nhận được thông báo nhắc trước 1 ngày.
- **AC-3** — *Given* tôi mở chi tiết Reservation, *when* trang hiển thị, *then* có mã đặt chỗ dạng
  QR hoặc mã ngắn để Facility Staff tra cứu nhanh ở `UC-F2-01`.
- **AC-4** — *Given* tôi đã quá `checkin.grace_days` (3 ngày) mà chưa đến, *when* tôi mở Reservation,
  *then* hệ thống hiển thị cảnh báo nguy cơ bị đánh No-show và mất Deposit theo `BR-CAN-04`.

---

### `US-SC-04.2` — Xác nhận đã nhận ô kho

> **Là** Storage Customer, **tôi muốn** xác nhận đã nhận ô kho và nhận Access Code, **để** bắt đầu sử
> dụng và có bằng chứng bàn giao.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-05` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* Facility Staff đã lập biên bản bàn giao ở `UC-F2-03`, *when* tôi xác nhận trên
  ứng dụng, *then* Reservation chuyển sang *Fulfilled* và Contract chuyển từ *Pending Check-in*
  sang *Active*.
- **AC-2** — *Given* tôi đã xác nhận check-in, *when* hệ thống xử lý xong, *then* Access Code của tôi
  hiển thị trong ứng dụng và trạng thái ô kho chuyển sang *Occupied* theo `UC-F2-06`.
- **AC-3** — *Given* tôi đã xác nhận check-in, *when* tôi mở biên bản bàn giao, *then* tôi xem lại
  được hiện trạng ô kho lúc nhận, kèm ảnh chụp do Facility Staff đính kèm.
- **AC-4** — *Given* Facility Staff **chưa** lập biên bản bàn giao, *when* tôi cố xác nhận check-in,
  *then* hệ thống từ chối và nêu rõ đang chờ nhân viên bàn giao.
- **AC-5** — *Given* tôi không đồng ý với hiện trạng ô kho ghi trong biên bản, *when* tôi từ chối
  xác nhận, *then* hệ thống mở một Support Request theo Flow 7 và không chuyển hợp đồng sang *Active*.

---

### `US-SC-04.3` — Đổi lịch hẹn check-in

> **Là** Storage Customer, **tôi muốn** đổi ngày giờ hẹn check-in, **để** không mất chỗ khi bận đột
> xuất.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-09`, `UC-F2-08` | Could | 3 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* lịch hẹn của tôi chưa diễn ra, *when* tôi chọn khung giờ khác còn trống, *then*
  lịch hẹn được cập nhật và tôi nhận thông báo xác nhận.
- **AC-2** — *Given* tôi đổi lịch, *when* hệ thống cập nhật, *then* ngày bắt đầu thuê và ngày kết
  thúc hợp đồng **không** đổi — đổi lịch hẹn không kéo dài thời hạn thuê.
- **AC-3** — *Given* ngày tôi muốn đổi sang vượt quá `checkin.grace_days` kể từ ngày bắt đầu thuê,
  *when* tôi chọn, *then* hệ thống từ chối và giải thích theo `BR-CAN-04`.
- **AC-4** — *Given* lịch hẹn đã qua, *when* tôi mở màn hình đổi lịch, *then* chức năng bị vô hiệu và
  tôi được hướng dẫn liên hệ cơ sở.

---

## 6. SC-05 — Quản lý ô kho đã thuê

*Theo dõi và quản lý một hoặc nhiều ô kho đang thuê.*

### `US-SC-05.1` — Xem danh sách ô kho đang thuê

> **Là** Storage Customer thuê nhiều ô kho, **tôi muốn** xem tất cả ô kho của mình trong một màn
> hình, **để** nắm nhanh cái nào sắp hết hạn và cái nào cần xử lý.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-01` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi đang thuê nhiều ô kho, *when* tôi mở trang quản lý, *then* mỗi ô kho là một
  thẻ riêng gồm mã ô kho, cơ sở, Unit Type, ngày kết thúc và trạng thái hợp đồng.
- **AC-2** — *Given* một hợp đồng còn dưới 7 ngày là hết hạn, *when* danh sách hiển thị, *then* thẻ
  đó có cảnh báo trực quan kèm nút "Gia hạn".
- **AC-3** — *Given* một hợp đồng đang *Overdue*, *when* danh sách hiển thị, *then* thẻ đó được đánh
  dấu nổi bật kèm số ngày quá hạn và số tiền đang nợ.
- **AC-4** — *Given* tôi có hợp đồng đã đóng, *when* tôi chuyển sang tab lịch sử, *then* tôi xem lại
  được các hợp đồng *Closed* và *Terminated* cùng kết quả quyết toán.
- **AC-5** — *Given* tôi chưa thuê ô kho nào, *when* tôi mở trang này, *then* hệ thống hiển thị
  trạng thái rỗng kèm nút dẫn tới trang đặt chỗ.

---

### `US-SC-05.2` — Xem chi tiết hợp đồng và lịch sử truy cập

> **Là** Storage Customer, **tôi muốn** xem chi tiết một hợp đồng và lịch sử ra vào ô kho, **để**
> kiểm soát được ai đã truy cập và khi nào.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-02`, `UC-F3-04` | Should | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở một hợp đồng, *when* trang tải xong, *then* tôi thấy kỳ thuê, đơn giá,
  Deposit đang giữ, các lần gia hạn đã thực hiện và tình trạng thanh toán.
- **AC-2** — *Given* hợp đồng đang *Active*, *when* tôi xem, *then* Access Code hiện hành được hiển
  thị kèm trạng thái hoạt động hoặc bị khóa.
- **AC-3** — *Given* đã có lượt ra vào được ghi nhận, *when* tôi mở tab lịch sử truy cập, *then* tôi
  thấy danh sách thời điểm ra vào kèm người truy cập, mới nhất trước.
- **AC-4** — *Given* hợp đồng không thuộc về tôi, *when* tôi truy cập bằng đường dẫn trực tiếp,
  *then* hệ thống trả về lỗi không có quyền, theo phân quyền dữ liệu ở `SA-03`.

---

### `US-SC-05.3` — Nhận nhắc hạn và gia hạn hợp đồng

> **Là** Storage Customer, **tôi muốn** được nhắc trước khi hợp đồng hết hạn và gia hạn ngay trong
> ứng dụng, **để** không bị khóa kho vì quên hạn.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F6-01`, `UC-F6-02` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* hợp đồng của tôi còn 30 ngày (1 tháng), 7, 3 hoặc 1 ngày là hết hạn, *when* tác vụ nhắc hạn chạy,
  *then* tôi nhận thông báo nhắc hạn theo `BR-REN-01`; nếu trước 1 tháng tôi không gia hạn, hệ thống tự động ghi nhận chuẩn bị trả kho khi đến hạn.
- **AC-2** — *Given* tôi bấm gia hạn, *when* màn hình mở ra, *then* tôi chọn được số tháng gia hạn
  từ 1 tới 12 tháng theo `BR-REN-03` và `BR-REN-07`, và thấy ngay số tiền tương ứng.
- **AC-3** — *Given* tôi gia hạn thành công, *when* hệ thống xử lý xong, *then* ô kho của tôi
  **giữ nguyên**, không bị đổi sang ô khác, theo `BR-REN-08`.
- **AC-4** — *Given* tôi đang nợ phí quá hạn chưa thanh toán, *when* tôi mở màn hình gia hạn, *then*
  khoản nợ được gộp vào tổng phải trả theo `BR-REN-06`, hiển thị thành dòng riêng.
- **AC-5** — *Given* hợp đồng của tôi đã *Terminated*, *when* tôi cố gia hạn, *then* hệ thống từ chối
  theo `BR-REN-02` và hướng dẫn tôi đặt hợp đồng mới.
- **AC-6** — *Given* capacity cho khoảng gia hạn đã được Reservation khác cam kết trước, *when* tôi
  xác nhận Renewal, *then* hệ thống từ chối trước khi thu tiền, không hủy commitment cũ và hướng dẫn
  tôi Return hoặc tạo Reservation mới theo `BR-REN-09`.

---

### `US-SC-05.4` — Đăng ký trả kho

> **Là** Storage Customer, **tôi muốn** đăng ký trả kho và đặt lịch hẹn kiểm tra, **để** kết thúc hợp
> đồng và lấy lại tiền cọc.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-05` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* Contract của tôi đang *Active*, *when* tôi đăng ký Return, *then* hệ thống yêu
  cầu ngày hẹn cách hiện tại ít nhất `return.notice_days` (7 ngày); nếu ngày đó sau hạn Contract,
  hệ thống cảnh báo Contract sẽ vào *Overdue* theo `BR-RET-10`.
- **AC-2** — *Given* tôi chọn ngày trả hợp lệ, *when* tôi xác nhận, *then* hợp đồng chuyển *Pending
  Return* và một lịch hẹn kiểm tra được tạo. Nếu ngày hẹn sau ngày kết thúc, Contract vẫn chuyển
  *Overdue* từ D+1 theo `BR-RET-10` dù đang *Pending Return*.
- **AC-3** — *Given* tôi đăng ký trả kho **sớm** hơn ngày kết thúc hợp đồng, *when* màn hình xác nhận
  hiển thị, *then* hệ thống nêu rõ phần phí thuê chưa dùng **không được hoàn** theo `BR-RET-06`, và
  tôi phải xác nhận đã đọc.
- **AC-4** — *Given* tôi đã đăng ký trả kho, *when* tôi xem hợp đồng, *then* tôi thấy số tiền Deposit
  dự kiến được hoàn, kèm ghi chú rằng con số cuối phụ thuộc kết quả kiểm tra hiện trạng theo
  `BR-RET-04`.
- **AC-5** — *Given* tôi đã đăng ký Return, Facility Staff chưa bắt đầu inspection và Contract chưa
  hết hạn, *when* tôi hủy yêu cầu, *then* Contract trở lại *Active* và lịch hẹn bị hủy; các trường
  hợp còn lại bị từ chối theo `BR-RET-12`.
- **AC-6** — *Given* tôi không có mặt vào ngày hẹn kiểm tra và hợp đồng đã qua ngày kết thúc, *when*
  tác vụ quá hạn chạy, *then* hợp đồng chuyển sang *Overdue* theo `BR-RET-07`.
- **AC-7** — *Given* Contract đang *Overdue* nhưng chưa tới D+10, *when* tôi chọn Return, *then*
  Contract chuyển *Pending Return*, khoản nợ được đưa vào quyết toán và Access chỉ mở trong lịch
  Return đã xác nhận theo `BR-RET-11`.

---

### `US-SC-05.5` — Theo dõi tình trạng quá hạn và khoản nợ

> **Là** Storage Customer đang quá hạn, **tôi muốn** biết chính xác mình nợ bao nhiêu và điều gì sắp
> xảy ra, **để** kịp xử lý trước khi bị khóa kho hoặc mất tài sản.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F6-01`, `UC-F3-02` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* hợp đồng của tôi vào *Overdue*, *when* tôi mở hợp đồng, *then* tôi thấy số ngày
  quá hạn, phí quá hạn đã phát sinh và tổng số tiền cần thanh toán.
- **AC-2** — *Given* tôi đang trong 3 ngày ân hạn (D+1..D+3), *when* tôi xem, *then* hệ thống nêu rõ
  chưa phát sinh phí và ngày bắt đầu tính phí theo `BR-OVD-02`.
- **AC-3** — *Given* phí quá hạn của tôi đã chạm trần 35%, *when* tôi xem, *then* hệ thống nêu rõ
  phí đã đạt mức tối đa và không tăng thêm, theo `BR-OVD-03`.
- **AC-4** — *Given* tôi quá hạn trong khoảng D+4 đến D+9, *when* hệ thống gửi thông báo nhắc nợ hằng
  ngày, *then* tôi nhận được thông báo nêu rõ số phí phát sinh và hạn chót D+10 sẽ bị chấm dứt hợp
  đồng theo `BR-OVD-04`, `BR-OVD-06`.
- **AC-5** — *Given* hợp đồng của tôi chạm mốc D+10, *when* hệ thống xử lý, *then* hợp đồng chuyển
  *Terminated*, mã truy cập bị thu hồi và Facility Manager lập danh sách thu dọn ô kho theo
  `BR-OVD-05`, `BR-OVD-07`, `BR-OVD-11`.
- **AC-6** — *Given* tôi thanh toán đủ khoản nợ trước D+10, *when* giao dịch thành công, *then* hệ
  thống cho phép tôi hoàn tất thủ tục trả kho hoặc tạo hợp đồng thuê mới theo `BR-OVD-08`.

---

## 7. SC-06 — Gửi yêu cầu hỗ trợ

*Báo sự cố liên quan tới ô kho, khóa, mã truy cập, thanh toán hoặc tài sản lưu trữ.*

### `US-SC-06.1` — Gửi yêu cầu hỗ trợ

> **Là** Storage Customer, **tôi muốn** gửi yêu cầu hỗ trợ kèm mô tả và ảnh, **để** sự cố của tôi
> được xử lý đúng người và đủ thông tin.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F7-01` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi đang thuê ít nhất một ô kho, *when* tôi tạo yêu cầu hỗ trợ, *then* tôi chọn
  được loại sự cố: ô kho, khóa, Access Code, thanh toán, tài sản lưu trữ hoặc khác.
- **AC-2** — *Given* tôi chọn loại sự cố và nhập mô tả, *when* tôi gửi, *then* hệ thống tạo yêu cầu
  với mã theo dõi, trạng thái *Mới*, và gắn đúng ô kho cùng cơ sở liên quan.
- **AC-3** — *Given* tôi muốn minh họa sự cố, *when* tôi đính kèm ảnh, *then* hệ thống nhận tối đa 5
  ảnh, mỗi ảnh không quá 5 MB, và báo lỗi rõ ràng nếu vượt giới hạn.
- **AC-4** — *Given* tôi để trống mô tả hoặc không chọn loại sự cố, *when* tôi gửi, *then* hệ thống
  chặn và chỉ rõ trường còn thiếu.
- **AC-5** — *Given* yêu cầu được tạo, *when* hệ thống xử lý xong, *then* yêu cầu xuất hiện trong
  hàng đợi tiếp nhận của Facility Staff tại đúng cơ sở đó, theo `UC-F7-03`.

---

### `US-SC-06.2` — Theo dõi và trao đổi về yêu cầu hỗ trợ

> **Là** Storage Customer, **tôi muốn** theo dõi tiến độ và trao đổi thêm với nhân viên, **để** biết
> sự cố của mình đang được xử lý tới đâu.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F7-02` | Must | 3 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi đã gửi yêu cầu, *when* tôi mở danh sách yêu cầu của mình, *then* tôi thấy
  mã, loại sự cố, ngày gửi và trạng thái hiện tại của từng yêu cầu.
- **AC-2** — *Given* trạng thái yêu cầu thay đổi, *when* nhân viên cập nhật, *then* tôi nhận thông
  báo và mốc thời gian thay đổi được ghi vào dòng thời gian của yêu cầu.
- **AC-3** — *Given* yêu cầu chưa đóng, *when* tôi gửi thêm bình luận hoặc ảnh, *then* nội dung được
  thêm vào yêu cầu và nhân viên phụ trách nhận được thông báo.
- **AC-4** — *Given* yêu cầu đã đóng, *when* tôi mở lại, *then* tôi chỉ xem được lịch sử, không gửi
  thêm bình luận, và có nút mở yêu cầu mới tham chiếu tới yêu cầu cũ.

---

### `US-SC-06.3` — Xác nhận kết quả xử lý

> **Là** Storage Customer, **tôi muốn** xác nhận sự cố đã được xử lý xong, **để** yêu cầu chỉ đóng
> khi vấn đề thực sự được giải quyết.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F7-08` | Should | 3 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* Facility Staff đánh dấu đã xử lý xong, *when* tôi mở yêu cầu, *then* tôi thấy
  mô tả kết quả xử lý và hai lựa chọn: xác nhận hài lòng hoặc báo chưa giải quyết được.
- **AC-2** — *Given* tôi xác nhận hài lòng, *when* tôi gửi, *then* yêu cầu chuyển sang *Đã đóng* và
  không thể chỉnh sửa nữa.
- **AC-3** — *Given* tôi báo chưa giải quyết được kèm lý do, *when* tôi gửi, *then* yêu cầu quay lại
  trạng thái *Đang xử lý* và được đẩy lên Facility Manager theo `UC-F7-04`.
- **AC-4** — *Given* tôi không phản hồi trong 7 ngày kể từ khi nhân viên báo xử lý xong, *when* tác
  vụ nền chạy, *then* yêu cầu tự động đóng và tôi nhận thông báo về việc đóng tự động.

---

## 8. Bảng tổng hợp

| Mã story | Tên | Mã yêu cầu | Ưu tiên | Point | Giai đoạn | Số AC |
|----------|-----|------------|---------|:-----:|:---------:|:-----:|
| `US-SC-01.1` | Tìm cơ sở lưu trữ phù hợp | `SC-01` | Must | 3 | P2 | 5 |
| `US-SC-01.2` | Xem chi tiết loại ô kho và giá thuê | `SC-01` | Must | 3 | P2 | 5 |
| `US-SC-01.3` | Kiểm tra ô kho còn trống theo thời gian | `SC-01` | Must | 5 | P2 | 5 |
| `US-SC-02.1` | Tạo đặt chỗ ô kho | `SC-02` | Must | 8 | P3 | 6 |
| `US-SC-02.2` | Xem ước tính chi phí trước khi xác nhận | `SC-02` | Must | 3 | P3 | 6 |
| `US-SC-02.3` | Nhận xác nhận đặt chỗ và lịch hẹn check-in | `SC-02` | Must | 3 | P3 | 4 |
| `US-SC-02.4` | Hủy đặt chỗ trước khi nhận kho | `SC-02` | Must | 5 | P3 | 6 |
| `US-SC-03.1` | Thanh toán Deposit và phí thuê N tháng | `SC-03` | Must | 8 | P3 | 7 |
| `US-SC-03.2` | Thanh toán phí gia hạn | `SC-03` | Must | 5 | P4 | 5 |
| `US-SC-03.3` | Thanh toán phụ phí và khoản nộp bổ sung | `SC-03` | Should | 3 | P4 | 4 |
| `US-SC-03.4` | Xem lịch sử giao dịch và hóa đơn | `SC-03` | Should | 3 | P4 | 4 |
| `US-SC-04.1` | Xem lịch hẹn check-in | `SC-04` | Must | 2 | P3 | 4 |
| `US-SC-04.2` | Xác nhận đã nhận ô kho | `SC-04` | Must | 5 | P3 | 5 |
| `US-SC-04.3` | Đổi lịch hẹn check-in | `SC-04` | Could | 3 | P3 | 4 |
| `US-SC-05.1` | Xem danh sách ô kho đang thuê | `SC-05` | Must | 5 | P4 | 5 |
| `US-SC-05.2` | Xem chi tiết hợp đồng và lịch sử truy cập | `SC-05` | Should | 5 | P4 | 4 |
| `US-SC-05.3` | Nhận nhắc hạn và gia hạn hợp đồng | `SC-05` | Must | 5 | P4 | 6 |
| `US-SC-05.4` | Đăng ký trả kho | `SC-05` | Must | 5 | P4 | 7 |
| `US-SC-05.5` | Theo dõi tình trạng quá hạn và khoản nợ | `SC-05` | Must | 5 | P4 | 6 |
| `US-SC-06.1` | Gửi yêu cầu hỗ trợ | `SC-06` | Must | 5 | P4 | 5 |
| `US-SC-06.2` | Theo dõi và trao đổi về yêu cầu hỗ trợ | `SC-06` | Must | 3 | P4 | 4 |
| `US-SC-06.3` | Xác nhận kết quả xử lý | `SC-06` | Should | 3 | P4 | 4 |

**Theo giai đoạn:** P2 — 3 story / 11 point · P3 — 8 story / 37 point · P4 — 11 story / 47 point.
**Theo ưu tiên:** Must — 17 story / 78 point · Should — 4 story / 14 point · Could — 1 story / 3 point.
**Tổng:** 22 story · 95 story point · 111 acceptance criteria.

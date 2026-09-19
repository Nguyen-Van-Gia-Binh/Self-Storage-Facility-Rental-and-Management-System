# User Story — Facility Staff và Facility Manager

> **Self-Storage Facility Rental and Management System** — user story và acceptance criteria cho
> **Facility Staff** (`FS-01` → `FS-06`) và **Facility Manager** (`FM-01` → `FM-06`).
>
> Nhiệm vụ **T1.3** · Giai đoạn 1 · [PLAN.md](PLAN.md).
> Tài liệu liên quan: [USE-CASES.md](USE-CASES.md) · [BUSINESS-RULES.md](BUSINESS-RULES.md) ·
> [USER-STORIES-SC.md](USER-STORIES-SC.md) (Storage Customer) ·
> [USER-STORIES-BM-SA.md](USER-STORIES-BM-SA.md) (Business Operations Manager và System Administrator).

---

## Mục lục

1. [Quy ước viết user story](#1-quy-ước-viết-user-story)
2. [FS-01 — Kiểm tra đặt chỗ](#2-fs-01--kiểm-tra-đặt-chỗ)
3. [FS-02 — Hỗ trợ check-in và bàn giao](#3-fs-02--hỗ-trợ-check-in-và-bàn-giao)
4. [FS-03 — Cập nhật trạng thái ô kho](#4-fs-03--cập-nhật-trạng-thái-ô-kho)
5. [FS-04 — Xác nhận tình trạng khi trả kho](#5-fs-04--xác-nhận-tình-trạng-khi-trả-kho)
6. [FS-05 — Xử lý sự cố tại chỗ](#6-fs-05--xử-lý-sự-cố-tại-chỗ)
7. [FS-06 — Theo dõi công việc hằng ngày](#7-fs-06--theo-dõi-công-việc-hằng-ngày)
8. [FM-01 — Quản lý ô kho tại cơ sở](#8-fm-01--quản-lý-ô-kho-tại-cơ-sở)
9. [FM-02 — Phân bổ ô kho cho khách](#9-fm-02--phân-bổ-ô-kho-cho-khách)
10. [FM-03 — Theo dõi khách và hợp đồng](#10-fm-03--theo-dõi-khách-và-hợp-đồng)
11. [FM-04 — Quản lý quy trình vận hành thuê](#11-fm-04--quản-lý-quy-trình-vận-hành-thuê)
12. [FM-05 — Phân công nhân viên](#12-fm-05--phân-công-nhân-viên)
13. [FM-06 — Xem báo cáo cơ sở](#13-fm-06--xem-báo-cáo-cơ-sở)
14. [Bảng tổng hợp](#14-bảng-tổng-hợp)

---

## 1. Quy ước viết user story

Áp dụng thống nhất với quy ước đã chốt tại [USER-STORIES-SC.md § 1](USER-STORIES-SC.md#1-quy-ước-viết-user-story):

| Hạng mục | Quy ước |
|----------|---------|
| **Mã story** | `US-<mã yêu cầu>.<số thứ tự>` — ví dụ `US-FS-01.1`, `US-FM-02.1`. Không đánh số lại |
| **Câu chuyện** | *Là* `<actor>`, *tôi muốn* `<mục tiêu>`, *để* `<giá trị nhận được>` |
| **Acceptance criteria** | Viết theo **Given – When – Then**, đánh số `AC-1`, `AC-2`… Mỗi story bắt buộc có ít nhất một AC cho **nhánh thất bại / ngoại lệ** |
| **Độ ưu tiên** | MoSCoW — **Must** (bắt buộc cho MVP), **Should** (quan trọng, có thể lùi), **Could** (làm nếu dư thời gian) |
| **Story point** | Thang Fibonacci 1 · 2 · 3 · 5 · 8, đo độ phức tạp logic và rủi ro |
| **Giai đoạn** | Bám sát [PLAN.md § 5](PLAN.md#5-bản-đồ-phủ-yêu-cầu): P2 (Nền tảng danh mục), P3 (Flow 1 & 2), P4 (Flow 3, 6, 7), P5 (Báo cáo cơ sở) |
| **Tham chiếu** | Mọi story đều trỏ về use case tại [USE-CASES.md](USE-CASES.md) và ràng buộc tại [BUSINESS-RULES.md](BUSINESS-RULES.md) |

Tổng cộng **23 user story**, **94 acceptance criteria**, **111 story point**.

---

## 2. FS-01 — Kiểm tra đặt chỗ

*Kiểm tra thông tin đặt chỗ của khách khi khách đến nhận ô kho.*

### `US-FS-01.1` — Tra cứu và xác minh thông tin đặt chỗ của khách

> **Là** Facility Staff, **tôi muốn** tra cứu đơn đặt chỗ bằng mã Reservation, số điện thoại hoặc CCCD của khách, **để** xác minh khách hàng đến đúng lịch hẹn và đủ điều kiện nhận kho.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-01`, `UC-F2-02` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi đã đăng nhập với vai trò Facility Staff tại Facility phụ trách, *when* tôi nhập mã Reservation, số điện thoại hoặc số CCCD vào ô tìm kiếm, *then* hệ thống hiển thị họ tên khách, Unit Type, ngày hẹn, toàn bộ phí thuê N tháng và Deposit đã thu, cùng Storage Unit đã phân bổ sau Payment.
- **AC-2** — *Given* khách xuất trình giấy tờ tùy thân, *when* tôi đối chiếu thông tin trên hệ thống, *then* tên và số giấy tờ phải trùng khớp với thông tin đăng ký trên đơn đặt chỗ theo `BR-CHK-01` và `UC-F2-02`.
- **AC-3** — *Given* khách chưa thanh toán đủ toàn bộ phí thuê N tháng và Deposit theo `BR-PAY-01` và `BR-CHK-02`, *when* xem chi tiết, *then* hệ thống hiển thị cảnh báo "Chưa hoàn tất Payment" và vô hiệu thao tác Handover.
- **AC-4** — *Given* đơn đặt chỗ thuộc một Facility khác, *when* tôi tra cứu, *then* hệ thống thông báo "Đơn đặt chỗ thuộc cơ sở khác" và nêu rõ tên cơ sở đúng để hướng dẫn khách.
- **AC-5** — *Given* mã Reservation không tồn tại hoặc đã bị hủy, *when* tôi tìm kiếm, *then* hệ thống thông báo "Không tìm thấy thông tin đặt chỗ hợp lệ".

---

### `US-FS-01.2` — Xử lý khách đến trễ hoặc lỡ hẹn check-in

> **Là** Facility Staff, **tôi muốn** theo dõi khách đến trễ hoặc lỡ hẹn Check-in, **để** hỗ trợ khách trong thời gian grace period và biết kết quả No-show do hệ thống xử lý.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-08` | Should | 3 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* khách đến sau khung giờ hẹn trong ngày nhưng trước giờ đóng cửa cơ sở, *when* tôi mở đơn đặt chỗ, *then* hệ thống cho phép tiếp tục quy trình bàn giao bình thường và ghi nhận mốc thời gian thực tế.
- **AC-2** — *Given* hết ngày hẹn mà khách chưa đến, *when* tôi rà soát danh sách, *then* hệ thống hiển thị số ngày còn lại trong `checkin.grace_days` (tối đa 10 ngày); Facility Staff không tự chuyển Reservation thành *No-show*.
- **AC-3** — *Given* hết `checkin.grace_days` (10 ngày) mà khách chưa hoàn tất Check-in, *when* scheduled job chạy lúc 00:00 ngày tiếp theo, *then* hệ thống tự động chuyển Reservation sang *No-show*, Storage Unit đã phân bổ trở lại *Available* và tiền được quyết toán theo `BR-CAN-04`, `BR-CHK-05`.
- **AC-4** — *Given* khách đến khi đơn đặt chỗ đã quá hạn 10 ngày và bị hệ thống tự động đánh dấu No-show, *when* tôi tra cứu, *then* hệ thống hiển thị lý do No-show tự động và tôi hướng dẫn khách thực hiện đặt chỗ mới.

---

## 3. FS-02 — Hỗ trợ check-in và bàn giao

*Hỗ trợ check-in và bàn giao ô kho, khóa, thẻ truy cập hoặc mã truy cập.*

### `US-FS-02.1` — Bàn giao ô kho và lập biên bản bàn giao tại chỗ

> **Là** Facility Staff, **tôi muốn** cùng khách kiểm tra ô kho thực tế và xác nhận biên bản bàn giao trên hệ thống, **để** chính thức giao quyền sử dụng ô kho cho khách hàng.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-03` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* đơn đặt chỗ đã hợp lệ và khách đã đến tận nơi, *when* tôi dẫn khách kiểm tra ô kho, *then* tôi và khách kiểm tra hiện trạng cửa, khóa, sàn kho và thiết bị đi kèm.
- **AC-2** — *Given* ô kho sạch sẽ và nguyên vẹn theo `BR-CHK-02` và `UC-F2-03`, *when* tôi tạo biên bản bàn giao, *then* hệ thống ghi nhận mã biên bản, mã ô kho, thời gian bàn giao, tên nhân viên thực hiện và họ tên khách theo `BR-CHK-03`.
- **AC-3** — *Given* Storage Unit phát sinh lỗi vật lý hoặc khách không đồng ý nhận kho, *when* tôi báo cáo tại màn hình Handover, *then* hệ thống hủy lượt Handover này, chuyển unit sang *Maintenance* và chuyển lệnh cho Facility Manager xử lý hoàn tiền 100% trong 3 ngày làm việc theo `BR-CHK-06`.
- **AC-4** — *Given* ô kho đạt yêu cầu và khách đồng ý nhận kho, *when* khách xác nhận ký số biên bản bàn giao điện tử, *then* biên bản được lưu trữ vĩnh viễn và gửi bản sao PDF về email của khách.

---

### `US-FS-02.2` — Cấp phương tiện truy cập ô kho

> **Là** Facility Staff, **tôi muốn** cấp chìa khóa vật lý hoặc kích hoạt mã Access Code cho khách, **để** khách có phương tiện ra vào ô kho thuận tiện và an toàn.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-04` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* ô kho sử dụng khóa điện tử, *when* tôi bấm "Kích hoạt Access Code", *then* hệ thống sinh mã PIN cá nhân 6 số duy nhất theo `BR-ACC-01` hoặc kích hoạt mã QR mở khóa và hiển thị trên ứng dụng của khách theo `UC-F2-04`.
- **AC-2** — *Given* ô kho sử dụng khóa cơ vật lý, *when* tôi bàn giao chìa khóa cho khách, *then* tôi ghi nhận mã định danh chìa khóa vật lý vào biên bản bàn giao của hợp đồng thuê.
- **AC-3** — *Given* hệ thống loại bỏ hoàn toàn thẻ từ RFID, *when* cấp phát phương tiện truy cập, *then* giao diện chỉ cho phép kích hoạt mã PIN/QR điện tử hoặc ghi nhận chìa khóa cơ, không có tùy chọn nhập thẻ từ.
- **AC-4** — *Given* hệ thống cấp mã truy cập thành công, *when* kiểm tra quyền truy cập, *then* mã chỉ có hiệu lực mở đúng ô kho đã phân bổ và cửa cổng chung của đúng cơ sở đó trong thời hạn hợp đồng theo `BR-ACC-02`.

---

## 4. FS-03 — Cập nhật trạng thái ô kho

*Cập nhật trạng thái ô kho sau bàn giao, trong quá trình sử dụng, sau khi trả kho, hoặc khi cần kiểm tra / bảo trì.*

### `US-FS-03.1` — Cập nhật trạng thái ô kho sau bàn giao

> **Là** Facility Staff, **tôi muốn** trạng thái ô kho tự động chuyển sang "Đang sử dụng" ngay sau khi hoàn tất bàn giao, **để** sơ đồ kho cập nhật chính xác và tránh bàn giao nhầm cho người khác.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-06` | Must | 3 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* biên bản bàn giao `US-FS-02.1` vừa được ký duyệt, *when* giao dịch lưu thành công, *then* trạng thái của Storage Unit tương ứng lập tức chuyển từ *Reserved* sang *Occupied* theo `BR-CHK-04` và `UC-F2-06`.
- **AC-2** — *Given* ô kho đã chuyển sang *Occupied*, *when* người khác xem sơ đồ cơ sở, *then* ô kho đó hiển thị màu xanh đậm/trạng thái đã thuê và không thể gán cho bất kỳ đơn đặt chỗ nào khác.
- **AC-3** — *Given* quá trình lưu biên bản bàn giao thất bại do lỗi mạng, *when* hệ thống phục hồi, *then* giao dịch được rollback và trạng thái ô kho không bị đổi sai lệch.

---

### `US-FS-03.2` — Cập nhật trạng thái sau khi thu hồi kho

> **Là** Facility Staff, **tôi muốn** vô hiệu hóa mã truy cập và chuyển trạng thái ô kho sang chờ vệ sinh sau khi khách trả kho, **để** ngăn chặn việc ra vào trái phép và chuẩn bị ô kho cho lượt thuê mới.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-07`, `UC-F3-09` | Must | 3 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* Facility Staff đã xác nhận inspection theo `BR-RET-02`, *when* tôi bấm "Thu hồi quyền truy cập", *then* Access Code / PIN bị vô hiệu ngay theo `BR-ACC-03` và `BR-RET-09`.
- **AC-2** — *Given* khách dùng thẻ từ hoặc chìa khóa cơ, *when* khách bàn giao lại thẻ/chìa, *then* tôi xác nhận đã thu hồi vật phẩm trên hệ thống.
- **AC-3** — *Given* quyền truy cập đã thu hồi, *when* biên bản Return được xác nhận, *then* Storage Unit tự động chuyển từ *Occupied* sang *Cleaning* theo `BR-RET-09`.
- **AC-4** — *Given* ô kho đã dọn xong, *when* tôi bấm "Sẵn sàng khai thác", *then* unit chuyển *Reserved* nếu còn Reservation *Confirmed* chưa Check-in (future claim); không thì *Available* theo `BR-RET-09`.

---

### `US-FS-03.3` — Đánh dấu ô kho cần bảo trì hoặc hoàn tất sửa chữa

> **Là** Facility Staff, **tôi muốn** chuyển trạng thái ô kho sang bảo trì khi phát hiện hư hại hoặc chuyển lại trạng thái trống sau khi sửa chữa xong, **để** phản ánh đúng tình trạng khai thác của cơ sở.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-12`, `UC-F7-07` | Should | 3 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* Storage Unit đang *Available* bị phát sinh sự cố (thấm dột, kẹt cửa, hỏng đèn), *when* tôi báo cáo bảo trì, *then* trạng thái chuyển sang *Maintenance* kèm ghi chú nguyên nhân.
- **AC-2** — *Given* Storage Unit đang *Maintenance*, *when* hệ thống tính Availability hoặc tìm unit để phân bổ, *then* loại trừ unit này theo `BR-AVL-01`.
- **AC-3** — *Given* công tác sửa chữa bảo dưỡng đã hoàn tất, *when* tôi nghiệm thu và cập nhật "Hoàn tất bảo trì", *then* trạng thái ô kho trở lại *Available*.
- **AC-4** — *Given* ô kho đang có khách thuê (*Occupied*), *when* tôi muốn chuyển sang bảo trì, *then* hệ thống từ chối thao tác trực tiếp và yêu cầu xử lý qua quy trình Support Ticket hoặc chuyển kho.

---

## 5. FS-04 — Xác nhận tình trạng khi trả kho

*Kiểm tra và xác nhận tình trạng ô kho khi khách trả kho.*

### `US-FS-04.1` — Kiểm tra hiện trạng ô kho và lập biên bản nghiệm thu trả kho

> **Là** Facility Staff, **tôi muốn** cùng khách kiểm tra thực tế ô kho lúc trả kho và nhập kết quả nghiệm thu vào hệ thống, **để** làm căn cứ hoàn trả tiền cọc hoặc tính phí bồi thường hư hại.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-06` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* khách hàng làm thủ tục trả kho, *when* tôi mở yêu cầu trả kho của hợp đồng tương ứng, *then* hệ thống hiển thị danh mục kiểm tra (Checklist): Toàn bộ tài sản đã dọn sạch, Sàn và tường nguyên vẹn, Ổ khóa và bản lề không biến dạng.
- **AC-2** — *Given* ô kho nguyên vẹn và sạch sẽ theo `BR-RET-02`, *when* tôi tích chọn đạt tất cả tiêu chí và lưu, *then* hệ thống ghi nhận kết quả "Đạt tiêu chuẩn trả kho - Đề xuất hoàn 100% Deposit".
- **AC-3** — *Given* ô kho bị hư hại hoặc còn rác bẩn chưa dọn, *when* tôi ghi nhận, *then* hệ thống bắt buộc tôi nhập mô tả hư hại, tải lên ít nhất 1 ảnh chụp hiện trường và chọn loại phụ phí khấu trừ theo `BR-RET-04` và `BR-RET-08`.
- **AC-4** — *Given* biên bản kiểm tra được tạo xong, *when* tôi và khách xác nhận, *then* biên bản nghiệm thu được gửi lên Facility Manager để thực hiện quyết toán hợp đồng theo `UC-F3-08`.

---

## 6. FS-05 — Xử lý sự cố tại chỗ

*Tiếp nhận và xử lý on-site problems như mất chìa khóa, lỗi mã truy cập, ô kho hư hỏng, hoặc yêu cầu hỗ trợ của khách.*

### `US-FS-05.1` — Xử lý sự cố mất chìa khóa hoặc lỗi mã truy cập

> **Là** Facility Staff, **tôi muốn** xác minh danh tính khách tại quầy và cấp lại mã truy cập hoặc hỗ trợ cắt khóa/thay khóa cơ, **để** khách hàng lấy lại quyền vào ô kho kịp thời khi gặp sự cố.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F7-03`, `UC-F7-05` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* khách báo quên hoặc hỏng mã PIN/QR, *when* tôi đối chiếu đúng CCCD của chủ hợp đồng, *then* hệ thống cho phép tôi bấm "Cấp lại Access Code", sinh mã mới và thu hồi mã cũ theo `BR-ACC-03` và `UC-F7-05`, đảm bảo SLA tại chỗ theo `BR-SUP-01`.
- **AC-2** — *Given* khách báo mất chìa khóa cơ, *when* xác minh danh tính thành công, *then* tôi hỗ trợ cắt khóa cơ cũ, cấp ổ khóa mới và thu phí cấp lại khóa theo quy định phụ phí tại `BM-03`.
- **AC-3** — *Given* người đến yêu cầu mở khóa không phải chủ hợp đồng và không có tên trong danh sách người được ủy quyền (`UC-F3-03`), *when* tôi kiểm tra, *then* hệ thống từ chối cấp quyền và tôi không được phép mở kho.
- **AC-4** — *Given* sự cố được xử lý xong, *when* tôi cập nhật yêu cầu, *then* thời gian xử lý và hình thức hỗ trợ được ghi vào nhật ký lịch sử của ô kho.

---

### `US-FS-05.2` — Khắc phục hư hỏng vật lý của ô kho và đóng yêu cầu hỗ trợ

> **Là** Facility Staff, **tôi muốn** xử lý các sự cố cơ sở vật chất (kẹt cửa cuốn, ẩm mốc, đèn hỏng) và ghi nhận kết quả, **để** đảm bảo an toàn cho tài sản của khách hàng.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F7-06`, `UC-F7-08` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi được phân công một ticket sự cố hư hỏng ô kho, *when* tôi đến hiện trường kiểm tra, *then* tôi chuyển trạng thái ticket sang *In Progress*.
- **AC-2** — *Given* sự cố được khắc phục tại chỗ (tra dầu bản lề, thay bóng đèn, gia cố vách), *when* hoàn thành, *then* tôi chụp ảnh hiện trạng sau sửa chữa và tải lên hệ thống; nếu do hư hỏng kỹ thuật từ phía cơ sở thì khách được miễn phí sửa chữa theo `BR-SUP-02`.
- **AC-3** — *Given* sự cố nghiêm trọng không thể khắc phục ngay (dột trần lớn gây ướt đồ), *when* tôi ghi nhận, *then* hệ thống cho phép đẩy cờ khẩn cấp lên Facility Manager để kích hoạt phương án di dời đồ sang ô kho dự phòng.
- **AC-4** — *Given* việc sửa chữa hoàn tất, *when* tôi bấm "Đã xử lý", *then* hệ thống gửi thông báo cho khách hàng xác nhận nghiệm thu theo `US-SC-06.3` và thực hiện quy trình đóng ticket theo `BR-SUP-03`.

---

## 7. FS-06 — Theo dõi công việc hằng ngày

*Theo dõi danh sách khách hàng cần nhận kho, trả kho hoặc cần hỗ trợ trong ngày.*

### `US-FS-06.1` — Theo dõi danh sách công việc bàn giao, trả kho và sự cố trong ngày

> **Là** Facility Staff, **tôi muốn** xem danh sách tổng hợp các lượt khách hẹn check-in, hẹn trả kho và các sự cố cần xử lý trong ca trực của mình, **để** chủ động sắp xếp thời gian tiếp đón và không bỏ sót công việc.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F5-05` | Must | 3 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở màn hình ca trực hằng ngày, *when* trang tải xong, *then* tôi thấy 3 tab công việc rõ ràng: (1) Lịch hẹn nhận kho trong ngày, (2) Lịch hẹn trả kho trong ngày, (3) Danh sách sự cố và nhiệm vụ vận hành (bao gồm nhiệm vụ gắn/tháo khóa ngoài Overlock được hệ thống tự động giao theo `US-FM-04.3`).
- **AC-2** — *Given* danh sách lịch hẹn nhận kho, *when* tôi xem chi tiết, *then* hiển thị giờ hẹn, tên khách, số điện thoại, mã ô kho được gán và trạng thái (Chưa đến / Đã đến / Đã bàn giao).
- **AC-3** — *Given* có một khách hàng mới đặt lịch hẹn check-in gấp trong ngày, *when* cơ sở dữ liệu cập nhật, *then* danh sách tự động làm mới và hiển thị huy hiệu thông báo việc mới.
- **AC-4** — *Given* tôi lọc công việc theo trạng thái "Chưa xử lý", *when* áp dụng, *then* chỉ hiển thị các lượt hẹn và sự cố còn tồn đọng trong ca trực.

---

## 8. FM-01 — Quản lý ô kho tại cơ sở

*Quản lý ô kho tại cơ sở phụ trách, bao gồm loại ô kho, kích thước, vị trí, giá thuê và trạng thái ô kho.*

### `US-FM-01.1` — Quản lý danh mục loại ô kho tại cơ sở

> **Là** Facility Manager, **tôi muốn** cấu hình danh mục Unit Type và kích thước tiêu chuẩn cho cơ sở của mình, **để** chuẩn hóa không gian cho thuê theo đúng thiết kế mặt bằng.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F5-01` | Must | 5 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở trang danh mục Unit Type tại cơ sở, *when* trang hiển thị, *then* liệt kê các loại ô kho hiện có kèm kích thước (dài × rộng × cao), thể tích m³, diện tích m² và tiện ích đi kèm (máy lạnh, ổ cắm điện).
- **AC-2** — *Given* tôi thêm một Unit Type mới, *when* tôi nhập tên loại kho và kích thước hợp lệ, *then* hệ thống lưu thông tin và cho phép gán loại này cho các ô kho vật lý.
- **AC-3** — *Given* một Unit Type đang có ô kho được thuê hoặc đặt chỗ, *when* tôi muốn xóa loại này, *then* hệ thống từ chối xóa và hiển thị thông báo "Đang có ô kho thuộc loại này được sử dụng".
- **AC-4** — *Given* kích thước nhập vào có số âm hoặc bằng 0, *when* bấm lưu, *then* hệ thống báo lỗi validation.

---

### `US-FM-01.2` — Quản lý danh sách ô kho vật lý, vị trí và trạng thái

> **Là** Facility Manager, **tôi muốn** tạo mới, chỉnh sửa thông tin mã số, tầng, dãy và cập nhật trạng thái ô kho, **để** sơ đồ kho của cơ sở luôn phản ánh chính xác thực tế khai thác.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F5-02`, `UC-F5-03` | Must | 5 | P2 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở danh sách Storage Unit của Facility, *when* trang tải xong, *then* hiển thị mã, vị trí, Unit Type, giá niêm yết và một trong các trạng thái *Available*, *Reserved*, *Occupied*, *Cleaning*, *Maintenance*, *Out of service*; Access *Suspended* được hiển thị riêng.
- **AC-2** — *Given* tôi thêm danh sách ô kho hàng loạt theo mẫu (vd: Dãy B, Tầng 2, từ B-201 đến B-220), *when* tôi xác nhận, *then* hệ thống sinh đúng 20 bản ghi ô kho ở trạng thái *Available*.
- **AC-3** — *Given* mã ô kho bị trùng lặp trong cùng một Facility, *when* lưu dữ liệu, *then* hệ thống chặn lại và báo lỗi trùng mã định danh.
- **AC-4** — *Given* ô kho đang ở trạng thái *Occupied*, *when* tôi muốn đổi mã số hoặc xóa ô kho, *then* hệ thống không cho phép thực hiện để bảo toàn tính toàn vẹn của hợp đồng đang chạy.

---

## 9. FM-02 — Phân bổ ô kho cho khách

*Phân bổ ô kho phù hợp cho khách hàng dựa trên loại ô kho, thời hạn thuê và tình trạng còn trống.*

### `US-FM-02.1` — Giám sát đơn đặt chỗ và ô kho khách chọn cho Reservation

> **Là** Facility Manager, **tôi muốn** giám sát các đơn đặt chỗ và ô kho khách đã tự chọn sau Payment, **để** xử lý ngoại lệ mà không tạo Contract thiếu unit.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-08` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* Payment gồm toàn bộ phí thuê N tháng và Deposit thành công (`UC-F1-07`), *when* giao dịch được xác nhận, *then* hệ thống nguyên tử khóa Storage Unit khách đã chọn theo `BR-AVL-04`; Reservation chuyển *Confirmed*.
- **AC-2** — *Given* unit khách chọn đang *Available*, *when* thanh toán thành công, *then* unit chuyển *Reserved*. *Given* unit đang *Occupied* và kỳ Occupied kết thúc trước ngày bắt đầu kỳ mới, *when* thanh toán thành công, *then* unit **vẫn** *Occupied* (future claim) và màn hình giám sát nêu rõ claim; tôi không phải duyệt thủ công.
- **AC-3** — *Given* khóa ô kho thất bại do sự cố ngoài dự kiến, *when* tôi xem hàng đợi ngoại lệ, *then* không có Contract thiếu unit, Reservation không được xác nhận và khoản vừa thu được hoàn theo `BR-AVL-05`.
- **AC-4** — *Given* đặt chỗ thành công, *when* hệ thống lưu dữ liệu, *then* thông báo kèm mã Storage Unit tự động gửi cho khách; nhiệm vụ Handover chỉ xuất hiện khi ngày bắt đầu đã tới và unit đã *Reserved*.

---

### `US-FM-02.2` — Giám sát kích hoạt hợp đồng thuê sau bàn giao

> **Là** Facility Manager, **tôi muốn** theo dõi việc kích hoạt hợp đồng thuê ngay sau khi nhân viên bàn giao xong, **để** ghi nhận chính xác thời điểm bắt đầu tính tiền thuê và trách nhiệm pháp lý.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-11`, `UC-F2-07` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* Facility Staff hoàn tất biên bản bàn giao và khách đã nhận kho (`US-FS-02.1`), *when* giao dịch hoàn tất, *then* hợp đồng thuê chuyển sang trạng thái *Active* và ngày bắt đầu thuê được chốt chính thức.
- **AC-2** — *Given* Reservation *Pending Payment* hết 48 giờ theo `BR-DEP-03`, *when* scheduled job chạy (`UC-F1-11`), *then* Reservation chuyển *Expired* và capacity được giải phóng; không có Contract hoặc Storage Unit cụ thể phải hủy.
- **AC-3** — *Given* hợp đồng vừa kích hoạt, *when* tôi tra cứu danh mục hợp đồng cơ sở, *then* hợp đồng mới hiển thị đầy đủ thông tin: Mã HĐ, Tên khách, Mã ô kho, Ngày hết hạn dự kiến và Số tiền cọc đang giữ.

---

## 10. FM-03 — Theo dõi khách và hợp đồng

*Theo dõi khách hàng đang thuê, hợp đồng thuê, thời hạn thuê và tình trạng thanh toán.*

### `US-FM-03.1` — Giám sát danh sách khách hàng và hợp đồng thuê đang hiệu lực

> **Là** Facility Manager, **tôi muốn** theo dõi toàn bộ danh sách hợp đồng thuê đang hoạt động tại cơ sở, **để** nắm rõ ai đang sử dụng ô kho nào và ngày hết hạn của từng người.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-10` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở danh mục Contract của Facility, *when* trang hiển thị, *then* danh sách có các trạng thái thật *Active* và *Overdue*; nhãn tính toán "Near Expiration" hiển thị riêng cho Contract còn tối đa 7 ngày.
- **AC-2** — *Given* tôi lọc theo trạng thái "Sắp hết hạn", *when* áp dụng, *then* hiển thị danh sách các hợp đồng có ngày kết thúc trong vòng 7 ngày tới để quản lý chủ động theo dõi gia hạn.
- **AC-3** — *Given* tôi nhấp vào một hợp đồng, *when* xem chi tiết, *then* hiển thị thông tin khách hàng, số điện thoại khẩn cấp, danh sách người được ủy quyền ra vào và biên bản bàn giao ban đầu.
- **AC-4** — *Given* tôi tìm kiếm theo tên khách hoặc mã ô kho, *when* nhập từ khóa, *then* hệ thống trả về đúng các hợp đồng khớp điều kiện tìm kiếm.

---

### `US-FM-03.2` — Theo dõi tình trạng thanh toán và công nợ của từng hợp đồng

> **Là** Facility Manager, **tôi muốn** theo dõi lịch sử thanh toán, kỳ đóng tiền tiếp theo và các khoản nợ của từng khách hàng, **để** kiểm soát dòng tiền và phát hiện sớm các trường hợp chậm thanh toán.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-11` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* một Contract đang thuê, *when* tôi xem chi tiết tài chính, *then* hiển thị Deposit, toàn bộ phí thuê N tháng đã thanh toán, ngày kết thúc hiện tại, báo giá Renewal nếu có và tổng nợ tồn đọng.
- **AC-2** — *Given* khách hàng có phát sinh khoản phụ phí (phí cấp lại khóa, phí vệ sinh), *when* khoản phí được tạo, *then* hệ thống cập nhật vào bảng kê công nợ của hợp đồng kèm trạng thái (Chưa thu / Đã thu).
- **AC-3** — *Given* Contract đã qua ngày kết thúc hơn `overdue.grace_days`, *when* tôi mở danh sách nợ, *then* Contract được cảnh báo kèm số ngày Overdue và phí tạm tính theo `BR-OVD-03`.
- **AC-4** — *Given* tôi xuất danh sách công nợ cơ sở, *when* file tạo xong, *then* báo cáo định dạng Excel chứa đầy đủ danh sách các khoản phải thu của cơ sở phụ trách.

---

## 11. FM-04 — Quản lý quy trình vận hành thuê

*Quản lý quy trình bàn giao ô kho, trả kho, gia hạn hợp đồng và xử lý quá hạn tại cơ sở.*

### `US-FM-04.1` — Phê duyệt quyết toán hợp đồng và hoàn trả tiền cọc khi trả kho

> **Là** Facility Manager, **tôi muốn** xem xét biên bản nghiệm thu của nhân viên để phê duyệt quyết toán và hoàn trả tiền cọc cho khách, **để** kết thúc hợp đồng thuê minh bạch và đúng quy định.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-05`, `UC-F3-08` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* nhân viên đã nộp biên bản nghiệm thu ô kho đạt chuẩn (`US-FS-04.1`), *when* tôi mở yêu cầu duyệt trả kho, *then* hệ thống hiển thị số tiền cọc ban đầu và gợi ý hoàn trả 100% cọc theo `BR-RET-04` và `BR-DEP-04`.
- **AC-2** — *Given* biên bản nghiệm thu có ghi nhận hư hại và đề xuất trừ cọc theo `BR-RET-04` và `BR-RET-08`, *when* tôi xem xét ảnh chụp và báo giá sửa chữa, *then* tôi có thể điều chỉnh số tiền khấu trừ trước khi phê duyệt.
- **AC-3** — *Given* tôi bấm "Phê duyệt quyết toán", *when* hệ thống xác nhận, *then* lệnh hoàn Deposit được chuyển sang cổng Payment, Contract chuyển *Closed* và hóa đơn quyết toán được gửi cho khách.
- **AC-4** — *Given* khách hàng vẫn còn nợ tiền thuê hoặc phụ phí chưa thanh toán, *when* thực hiện quyết toán, *then* hệ thống tự động cấn trừ công nợ vào tiền cọc trước khi hoàn trả phần dư.

---

### `US-FM-04.2` — Giám sát gia hạn Contract tự động

> **Là** Facility Manager, **tôi muốn** giám sát Renewal được hệ thống ghi nhận sau Payment, **để** xử lý ngoại lệ mà không làm chậm quyền sử dụng của khách.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F6-04` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* khách thanh toán Renewal thành công (`UC-F6-03`), *when* hệ thống nhận giao dịch, *then* Contract tự động dời ngày kết thúc theo `BR-REN-03`, `BR-REN-04`, không chờ Facility Manager duyệt.
- **AC-2** — *Given* capacity commitment tạo trước giao với khoảng Renewal, *when* khách xác nhận gia hạn, *then* hệ thống từ chối trước khi thu tiền và màn hình của tôi hiển thị lý do theo `BR-REN-09`.
- **AC-3** — *Given* Contract đang *Overdue*, *when* khách chọn Renewal, *then* hệ thống chỉ kích hoạt lại Contract và Access sau khi giao dịch gồm toàn bộ nợ cùng phí kỳ mới thành công theo `BR-REN-06`.

---

### `US-FM-04.3` — Xử lý hợp đồng quá hạn, khóa quyền truy cập và xử lý tài sản tồn đọng

> **Là** Facility Manager, **tôi muốn** giám sát quy trình tự động xử lý hợp đồng quá hạn từ D+4 đến D+10 và phân công dọn dẹp kho sau D+10, **để** thu hồi công nợ và giải phóng ô kho nhanh chóng.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F6-05`, `UC-F6-06`, `UC-F6-07`, `UC-F6-08`, `UC-F6-09`, `UC-F6-11` | Must | 8 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* ngày kết thúc đã qua, chưa Renewal và chưa hoàn tất Return, *when* scheduled job D+1 chạy (`UC-F6-05`), *then* Contract chuyển *Overdue* theo `BR-OVD-01`.
- **AC-2** — *Given* Contract trong khoảng D+4 đến D+10, *when* hệ thống chạy tính phí hàng ngày, *then* phí phạt 5%/ngày được cộng dồn và thông báo nhắc dọn đồ được gửi tự động mỗi ngày theo `BR-OVD-03` và `BR-OVD-06`.
- **AC-3** — *Given* Contract chạm mốc D+10 mà khách chưa xử lý xong, *when* scheduled job chạy (`UC-F6-07`, `UC-F6-11`), *then* mã Access Code tự động chuyển *Suspended*, Contract chuyển *Terminated* và chốt công nợ cấn trừ tiền cọc theo `BR-OVD-04`, `BR-OVD-05`.
- **AC-4** — *Given* Contract bị chấm dứt tại D+10, *when* giao dịch lưu thành công, *then* ô kho chuyển sang trạng thái *Cleaning* hoặc *Maintaining* và tự động tạo nhiệm vụ dọn dẹp cho Facility Staff theo `BR-OVD-07`.
- **AC-5** — *Given* nhiệm vụ dọn dẹp được tạo tại D+10, *when* nhân viên thực hiện (`UC-F6-09`), *then* đồ đạc tồn đọng của khách được kiểm kê, niêm phong và chuyển về kho tổng để tôi tự xử lý ngoại tuyến (offline) theo `BR-OVD-11`.
- **AC-6** — *Given* khách thanh toán nợ trước D+10, *when* giao dịch thành công, *then* hợp đồng và quyền truy cập được kích hoạt lại; khi đã quá D+10, hợp đồng đã bị chấm dứt vĩnh viễn và khách muốn thuê phải tạo hợp đồng mới theo `BR-OVD-08`.
- **AC-7** — *Given* khách hàng đang có hợp đồng quá hạn, *when* khách cố gắng tạo đơn đặt chỗ mới trên hệ thống, *then* hệ thống từ chối và cảnh báo yêu cầu tất toán hợp đồng quá hạn theo `BR-OVD-09`.

---

### `US-FM-04.4` — Đề xuất miễn hoặc giảm phí quá hạn theo vụ

> **Là** Facility Manager, **tôi muốn** đề xuất miễn hoặc giảm phí quá hạn của một Contract cụ thể, **để** Business Operations Manager duyệt theo `BR-OVD-10` mà tôi không tự quyết.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F6-12` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* Contract đang *Overdue* còn khoản phí chưa tất toán, *when* tôi gửi đề xuất kèm lý do và chứng cứ, *then* hệ thống ghi đề xuất ở trạng thái chờ duyệt và **không** tự trừ phí.
- **AC-2** — *Given* tôi là người đề xuất, *when* tôi cố tự duyệt, *then* hệ thống từ chối theo `BR-OVD-10`.
- **AC-3** — *Given* khoản phí đã tất toán hoặc Contract đã *Terminated*, *when* tôi đề xuất, *then* hệ thống từ chối vì chỉ áp cho khoản chưa tất toán.
- **AC-4** — *Given* Business Operations Manager từ chối, *when* tôi xem lại, *then* phí giữ nguyên, audit log ghi người đề xuất, người từ chối và lý do.

---

## 12. FM-05 — Phân công nhân viên

*Phân công Facility Staff hỗ trợ bàn giao, kiểm tra ô kho hoặc xử lý sự cố.*

### `US-FM-05.1` — Phân công công việc bàn giao, nghiệm thu và sự cố cho nhân viên cơ sở

> **Là** Facility Manager, **tôi muốn** phân công cụ thể từng ca trực hoặc từng nhiệm vụ (bàn giao, trả kho, sửa chữa) cho nhân viên dưới quyền, **để** công việc tại cơ sở được vận hành trơn tru và rõ ràng trách nhiệm.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-09`, `UC-F5-04`, `UC-F7-04` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* danh sách các lượt hẹn check-in và trả kho trong ngày, *when* tôi chọn nhiệm vụ và chọn nhân viên trực từ danh sách Staff của cơ sở, *then* nhiệm vụ được gán cho nhân viên đó và xuất hiện ngay trên màn hình ca trực của họ (`US-FS-06.1`).
- **AC-2** — *Given* có một sự cố hỏng hóc khẩn cấp do khách báo về (`US-SC-06.1`), *when* tôi tiếp nhận, *then* tôi có thể gán nhân viên phụ trách kèm mức độ ưu tiên "Khẩn cấp (High)" và hạn xử lý theo SLA `BR-SUP-01` và `UC-F7-04`.
- **AC-3** — *Given* một nhân viên đang có quá nhiều nhiệm vụ tồn đọng hoặc báo nghỉ phép, *when* tôi mở danh sách phân công, *then* hệ thống hiển thị số lượng task đang gán của từng nhân viên để tôi phân bổ đồng đều.
- **AC-4** — *Given* tôi muốn điều chuyển nhiệm vụ từ nhân viên A sang nhân viên B, *when* tôi cập nhật người phụ trách, *then* hệ thống gửi thông báo thay đổi phân công đến cả hai nhân viên.

---

## 13. FM-06 — Xem báo cáo cơ sở

*Xem báo cáo cơ sở về ô kho trống, ô kho đã thuê, doanh thu, tỷ lệ sử dụng (Usage Rate) và các trường hợp quá hạn.*

### `US-FM-06.1` — Xem báo cáo thống kê hoạt động cơ sở, tỷ lệ lấp đầy, doanh thu và nợ quá hạn

> **Là** Facility Manager, **tôi muốn** xem báo cáo tổng hợp tình hình vận hành cơ sở theo thời gian thực, **để** đánh giá hiệu quả khai thác mặt bằng và báo cáo lên cấp quản lý.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F5-06`, `UC-F6-10` | Must | 8 | P5 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi mở Dashboard báo cáo cơ sở, *when* trang tải xong, *then* hiển thị 4 thẻ chỉ số chính: Tổng số ô kho, Số ô kho đang thuê (*Occupied*), Số ô kho trống (*Available*), Số ô kho bảo trì (*Maintenance*).
- **AC-2** — *Given* các số liệu Storage Unit, *when* hệ thống tính toán, *then* hiển thị Usage Rate = số unit *Occupied* / tổng unit không *Out of service*; Contract *Overdue* vẫn dùng unit *Occupied* nên không bị cộng hai lần.
- **AC-3** — *Given* tôi chọn khoảng thời gian (tháng này, quý này), *when* xem báo cáo tài chính, *then* hiển thị tổng doanh thu thu được từ phí thuê, phí cọc và các khoản phụ thu tại cơ sở phụ trách.
- **AC-4** — *Given* danh sách nợ quá hạn, *when* xem báo cáo rủi ro, *then* hiển thị bảng chi tiết các hợp đồng quá hạn kèm tổng số tiền nợ đọng phân theo độ tuổi nợ (D+1 đến D+10, D+11 đến D+30, trên D+30).
- **AC-5** — *Given* tôi là Facility Manager của Cơ sở A, *when* tôi mở báo cáo, *then* hệ thống **chỉ hiển thị dữ liệu của Cơ sở A**, tuyệt đối không xem được doanh thu hay ô kho của Cơ sở B theo đúng phân quyền `SA-03`.

---

## 14. Bảng tổng hợp

| Mã story | Tên | Mã yêu cầu | Ưu tiên | Point | Giai đoạn | Số AC |
|----------|-----|------------|---------|:-----:|:---------:|:-----:|
| `US-FS-01.1` | Tra cứu và xác minh thông tin đặt chỗ của khách | `FS-01` | Must | 5 | P3 | 5 |
| `US-FS-01.2` | Xử lý khách đến trễ hoặc lỡ hẹn check-in | `FS-01` | Should | 3 | P3 | 4 |
| `US-FS-02.1` | Bàn giao ô kho và lập biên bản bàn giao tại chỗ | `FS-02` | Must | 5 | P3 | 4 |
| `US-FS-02.2` | Cấp phương tiện truy cập ô kho | `FS-02` | Must | 5 | P3 | 4 |
| `US-FS-03.1` | Cập nhật trạng thái ô kho sau bàn giao | `FS-03` | Must | 3 | P3 | 3 |
| `US-FS-03.2` | Cập nhật trạng thái sau khi thu hồi kho | `FS-03` | Must | 3 | P4 | 4 |
| `US-FS-03.3` | Đánh dấu ô kho cần bảo trì hoặc hoàn tất sửa chữa | `FS-03` | Should | 3 | P4 | 4 |
| `US-FS-04.1` | Kiểm tra hiện trạng ô kho và lập biên bản nghiệm thu trả kho | `FS-04` | Must | 5 | P4 | 4 |
| `US-FS-05.1` | Xử lý sự cố mất chìa khóa hoặc lỗi mã truy cập | `FS-05` | Must | 5 | P4 | 4 |
| `US-FS-05.2` | Khắc phục hư hỏng vật lý của ô kho và đóng yêu cầu hỗ trợ | `FS-05` | Must | 5 | P4 | 4 |
| `US-FS-06.1` | Theo dõi danh sách công việc bàn giao, trả kho và sự cố trong ngày | `FS-06` | Must | 3 | P4 | 4 |
| `US-FM-01.1` | Quản lý danh mục loại ô kho tại cơ sở | `FM-01` | Must | 5 | P2 | 4 |
| `US-FM-01.2` | Quản lý danh sách ô kho vật lý, vị trí và trạng thái | `FM-01` | Must | 5 | P2 | 4 |
| `US-FM-02.1` | Giám sát đơn đặt chỗ và ô kho khách chọn cho Reservation | `FM-02` | Must | 5 | P3 | 4 |
| `US-FM-02.2` | Giám sát kích hoạt hợp đồng thuê sau bàn giao | `FM-02` | Must | 5 | P3 | 3 |
| `US-FM-03.1` | Giám sát danh sách khách hàng và hợp đồng thuê đang hiệu lực | `FM-03` | Must | 5 | P4 | 4 |
| `US-FM-03.2` | Theo dõi tình trạng thanh toán và công nợ của từng hợp đồng | `FM-03` | Must | 5 | P4 | 4 |
| `US-FM-04.1` | Phê duyệt quyết toán hợp đồng và hoàn trả tiền cọc khi trả kho | `FM-04` | Must | 5 | P4 | 4 |
| `US-FM-04.2` | Giám sát gia hạn Contract tự động | `FM-04` | Must | 5 | P4 | 3 |
| `US-FM-04.3` | Xử lý hợp đồng quá hạn, khóa quyền truy cập và xử lý tài sản tồn đọng | `FM-04` | Must | 8 | P4 | 7 |
| `US-FM-04.4` | Đề xuất miễn hoặc giảm phí quá hạn theo vụ | `FM-04` | Must | 5 | P4 | 4 |
| `US-FM-05.1` | Phân công công việc bàn giao, nghiệm thu và sự cố cho nhân viên cơ sở | `FM-05` | Must | 5 | P3 | 4 |
| `US-FM-06.1` | Xem báo cáo thống kê hoạt động cơ sở, tỷ lệ lấp đầy, doanh thu và nợ quá hạn | `FM-06` | Must | 8 | P5 | 5 |

**Theo giai đoạn:** P2 — 2 story / 10 point · P3 — 7 story / 31 point · P4 — 12 story / 58 point · P5 — 2 story / 12 point.
**Theo ưu tiên:** Must — 21 story / 105 point · Should — 2 story / 6 point · Could — 0 story.
**Theo actor:** Facility Staff — 11 story / 45 point · Facility Manager — 12 story / 66 point.
**Tổng:** 23 story · 111 story point · 94 acceptance criteria.

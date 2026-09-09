# User Story — Facility Staff và Facility Manager

> **Self-Storage Facility Rental and Management System** — user story và acceptance criteria cho
> **Facility Staff** (`FS-01` → `FS-06`) và **Facility Manager** (`FM-01` → `FM-06`).
>
> Nhiệm vụ **T1.3** · Giai đoạn 1 · [PLAN.md](PLAN.md).
> Tài liệu liên quan: [USE-CASES.md](USE-CASES.md) · [BUSINESS-RULES.md](BUSINESS-RULES.md) ·
> [USER-STORIES.md](USER-STORIES.md) (Storage Customer) · USER-STORIES-BM-SA.md (nhiệm vụ T1.4 — Business Manager & Admin).

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

Áp dụng thống nhất với quy ước đã chốt tại [USER-STORIES.md § 1](USER-STORIES.md#1-quy-ước-viết-user-story):

| Hạng mục | Quy ước |
|----------|---------|
| **Mã story** | `US-<mã yêu cầu>.<số thứ tự>` — ví dụ `US-FS-01.1`, `US-FM-02.1`. Không đánh số lại |
| **Câu chuyện** | *Là* `<actor>`, *tôi muốn* `<mục tiêu>`, *để* `<giá trị nhận được>` |
| **Acceptance criteria** | Viết theo **Given – When – Then**, đánh số `AC-1`, `AC-2`… Mỗi story bắt buộc có ít nhất một AC cho **nhánh thất bại / ngoại lệ** |
| **Độ ưu tiên** | MoSCoW — **Must** (bắt buộc cho MVP), **Should** (quan trọng, có thể lùi), **Could** (làm nếu dư thời gian) |
| **Story point** | Thang Fibonacci 1 · 2 · 3 · 5 · 8, đo độ phức tạp logic và rủi ro |
| **Giai đoạn** | Bám sát [PLAN.md § 5](PLAN.md#5-bản-đồ-phủ-yêu-cầu): P2 (Nền tảng danh mục), P3 (Flow 1 & 2), P4 (Flow 3, 6, 7), P5 (Báo cáo cơ sở) |
| **Tham chiếu** | Mọi story đều trỏ về use case tại [USE-CASES.md](USE-CASES.md) và ràng buộc tại [BUSINESS-RULES.md](BUSINESS-RULES.md) |

Tổng cộng **22 user story**, **87 acceptance criteria**, **106 story point**.

---

## 2. FS-01 — Kiểm tra đặt chỗ

*Kiểm tra thông tin đặt chỗ của khách khi khách đến nhận ô kho.*

### `US-FS-01.1` — Tra cứu và xác minh thông tin đặt chỗ của khách

> **Là** Facility Staff, **tôi muốn** tra cứu đơn đặt chỗ bằng mã Reservation, số điện thoại hoặc CCCD của khách, **để** xác minh khách hàng đến đúng lịch hẹn và đủ điều kiện nhận kho.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-01`, `UC-F2-02` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* tôi đã đăng nhập với vai trò Facility Staff tại cơ sở phụ trách, *when* tôi nhập mã Reservation, số điện thoại hoặc số CCCD vào ô tìm kiếm, *then* hệ thống hiển thị chi tiết đơn đặt chỗ gồm họ tên khách, loại ô kho, ngày hẹn, số tiền cọc đã đóng và ô kho cụ thể đã được gán.
- **AC-2** — *Given* khách xuất trình giấy tờ tùy thân, *when* tôi đối chiếu thông tin trên hệ thống, *then* tên và số giấy tờ phải trùng khớp với thông tin đăng ký trên đơn đặt chỗ theo `BR-CHK-01` và `UC-F2-02`.
- **AC-3** — *Given* khách chưa thanh toán đủ tiền cọc hoặc tiền thuê kỳ đầu theo `BR-DEP-02` và `BR-CHK-02`, *when* xem chi tiết, *then* hệ thống hiển thị cảnh báo đỏ "Chưa hoàn tất thanh toán" và nút tiến hành bàn giao bị vô hiệu hóa.
- **AC-4** — *Given* đơn đặt chỗ thuộc một Facility khác, *when* tôi tra cứu, *then* hệ thống thông báo "Đơn đặt chỗ thuộc cơ sở khác" và nêu rõ tên cơ sở đúng để hướng dẫn khách.
- **AC-5** — *Given* mã Reservation không tồn tại hoặc đã bị hủy, *when* tôi tìm kiếm, *then* hệ thống thông báo "Không tìm thấy thông tin đặt chỗ hợp lệ".

---

### `US-FS-01.2` — Xử lý khách đến trễ hoặc lỡ hẹn check-in

> **Là** Facility Staff, **tôi muốn** ghi nhận tình trạng khách đến trễ hoặc cập nhật trạng thái vắng mặt, **để** cơ sở chủ động điều phối ô kho và xử lý giữ chỗ theo quy định.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-08` | Should | 3 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* khách đến sau khung giờ hẹn trong ngày nhưng trước giờ đóng cửa cơ sở, *when* tôi mở đơn đặt chỗ, *then* hệ thống cho phép tiếp tục quy trình bàn giao bình thường và ghi nhận mốc thời gian thực tế.
- **AC-2** — *Given* hết ngày làm việc mà khách không đến và không liên hệ dời lịch, *when* tôi rà soát danh sách trong ngày, *then* hệ thống cho phép đánh dấu trạng thái "Vắng mặt (No-show)" theo `BR-CAN-04` và `BR-CHK-05`.
- **AC-3** — *Given* đơn đặt chỗ bị đánh dấu No-show quá thời hạn giữ chỗ 48 giờ theo `BR-DEP-03`, *when* hệ thống quét tự động, *then* đơn tự động chuyển sang trạng thái hết hạn và ô kho tạm giữ được giải phóng về trạng thái *Available*.
- **AC-4** — *Given* khách đến khi đơn đặt chỗ đã bị hủy tự động do quá hạn, *when* tôi tra cứu, *then* hệ thống hiển thị lý do hủy và hướng dẫn khách thực hiện đặt chỗ mới.

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
- **AC-3** — *Given* ô kho phát sinh lỗi vật lý (ví dụ: kẹt cửa, ẩm mốc), *when* tôi báo cáo tại màn hình bàn giao, *then* hệ thống cho phép hủy lượt bàn giao này, chuyển ô kho sang trạng thái *Under Maintenance* và gửi thông báo cho Facility Manager để gán ô kho thay thế.
- **AC-4** — *Given* biên bản bàn giao đã hoàn tất, *when* khách xác nhận (ký điện tử hoặc nhập mã xác nhận), *then* biên bản được lưu trữ vĩnh viễn và gửi bản sao PDF về email của khách.

---

### `US-FS-02.2` — Cấp phương tiện truy cập ô kho

> **Là** Facility Staff, **tôi muốn** cấp chìa khóa vật lý, thẻ từ hoặc kích hoạt mã Access Code cho khách, **để** khách có phương tiện ra vào ô kho thuận tiện và an toàn.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F2-04` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* ô kho sử dụng khóa điện tử, *when* tôi bấm "Kích hoạt Access Code", *then* hệ thống sinh mã PIN cá nhân 6 số duy nhất theo `BR-ACC-01` hoặc kích hoạt mã QR mở khóa và hiển thị trên ứng dụng của khách theo `UC-F2-04`.
- **AC-2** — *Given* ô kho sử dụng khóa cơ hoặc thẻ từ RFID, *when* tôi phát thẻ/chìa, *then* tôi nhập mã số thẻ vật lý vào hệ thống để liên kết với hợp đồng thuê của khách.
- **AC-3** — *Given* mã số thẻ từ đã bị trùng với một ô kho khác đang sử dụng, *when* tôi lưu thông tin, *then* hệ thống báo lỗi trùng mã thẻ và yêu cầu đổi thẻ khác.
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

- **AC-1** — *Given* khách hoàn tất thủ tục trả kho, *when* tôi bấm "Thu hồi quyền truy cập", *then* mã Access Code / PIN của khách bị vô hiệu hóa ngay lập tức theo `BR-ACC-03` và `BR-RET-09`.
- **AC-2** — *Given* khách dùng thẻ từ hoặc chìa khóa cơ, *when* khách bàn giao lại thẻ/chìa, *then* tôi xác nhận đã thu hồi vật phẩm trên hệ thống.
- **AC-3** — *Given* quyền truy cập đã thu hồi, *when* biên bản trả kho được xác nhận, *then* trạng thái ô kho tự động chuyển từ *Occupied* sang *Cleaning* (Chờ vệ sinh) theo `BR-RET-03`.
- **AC-4** — *Given* ô kho đã được dọn dẹp sạch sẽ, *when* tôi kiểm tra đạt yêu cầu và bấm "Sẵn sàng khai thác", *then* trạng thái ô kho chuyển sang *Available* để tiếp tục cho khách mới thuê.

---

### `US-FS-03.3` — Đánh dấu ô kho cần bảo trì hoặc hoàn tất sửa chữa

> **Là** Facility Staff, **tôi muốn** chuyển trạng thái ô kho sang bảo trì khi phát hiện hư hại hoặc chuyển lại trạng thái trống sau khi sửa chữa xong, **để** phản ánh đúng tình trạng khai thác của cơ sở.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F3-12`, `UC-F7-07` | Should | 3 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* ô kho đang trống (*Available*) bị phát sinh sự cố (thấm dột, kẹt cửa, hỏng đèn), *when* tôi báo cáo bảo trì, *then* trạng thái chuyển sang *Under Maintenance* kèm ghi chú nguyên nhân.
- **AC-2** — *Given* ô kho đang ở trạng thái *Under Maintenance*, *when* người quản lý tìm phòng trống để gán khách, *then* hệ thống loại trừ ô kho này khỏi danh sách gợi ý.
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

- **AC-1** — *Given* tôi mở danh sách ô kho của cơ sở, *when* trang tải xong, *then* hiển thị bảng ô kho gồm mã số (vd: A-101), khu vực dãy, tầng, loại ô kho, giá niêm yết và trạng thái hiện tại (*Available*, *Reserved*, *Occupied*, *Under Maintenance*, *Locked Overdue*).
- **AC-2** — *Given* tôi thêm danh sách ô kho hàng loạt theo mẫu (vd: Dãy B, Tầng 2, từ B-201 đến B-220), *when* tôi xác nhận, *then* hệ thống sinh đúng 20 bản ghi ô kho ở trạng thái *Available*.
- **AC-3** — *Given* mã ô kho bị trùng lặp trong cùng một Facility, *when* lưu dữ liệu, *then* hệ thống chặn lại và báo lỗi trùng mã định danh.
- **AC-4** — *Given* ô kho đang ở trạng thái *Occupied*, *when* tôi muốn đổi mã số hoặc xóa ô kho, *then* hệ thống không cho phép thực hiện để bảo toàn tính toàn vẹn của hợp đồng đang chạy.

---

## 9. FM-02 — Phân bổ ô kho cho khách

*Phân bổ ô kho phù hợp cho khách hàng dựa trên loại ô kho, thời hạn thuê và tình trạng còn trống.*

### `US-FM-02.1` — Phân bổ ô kho vật lý cho đơn đặt chỗ của khách

> **Là** Facility Manager, **tôi muốn** gán một ô kho vật lý cụ thể đang trống cho đơn đặt chỗ của khách hàng, **để** nhân viên có số phòng chính xác để chuẩn bị bàn giao khi khách đến.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-08` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* có đơn đặt chỗ mới đã thanh toán tiền cọc thành công (`UC-F1-07`), *when* tôi mở danh sách chờ phân bổ, *then* hệ thống hiển thị đơn đặt chỗ kèm gợi ý các ô kho trống (*Available*) có cùng Unit Type tại cơ sở.
- **AC-2** — *Given* tôi chọn một ô kho cụ thể từ danh sách gợi ý và bấm "Xác nhận phân bổ", *then* ô kho đó chuyển trạng thái sang *Reserved* và được liên kết với mã Reservation của khách.
- **AC-3** — *Given* ô kho vừa được người khác chọn hoặc vừa chuyển sang bảo trì trong lúc tôi đang thao tác, *when* tôi bấm gán, *then* hệ thống báo lỗi xung đột trạng thái và yêu cầu chọn ô kho trống khác.
- **AC-4** — *Given* phân bổ thành công, *when* hệ thống lưu dữ liệu, *then* một thông báo xác nhận kèm số ô kho (vd: "Ô kho B-104") tự động gửi đến ứng dụng/email của khách và đưa vào danh sách làm việc của nhân viên trực.

---

### `US-FM-02.2` — Giám sát kích hoạt hợp đồng thuê sau bàn giao

> **Là** Facility Manager, **tôi muốn** theo dõi việc kích hoạt hợp đồng thuê ngay sau khi nhân viên bàn giao xong, **để** ghi nhận chính xác thời điểm bắt đầu tính tiền thuê và trách nhiệm pháp lý.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F1-11`, `UC-F2-07` | Must | 5 | P3 |

**Acceptance Criteria**

- **AC-1** — *Given* Facility Staff hoàn tất biên bản bàn giao và khách đã nhận kho (`US-FS-02.1`), *when* giao dịch hoàn tất, *then* hợp đồng thuê chuyển sang trạng thái *Active* và ngày bắt đầu thuê được chốt chính thức.
- **AC-2** — *Given* đơn đặt chỗ chưa thanh toán bị quá hạn thời gian giữ chỗ 48h theo `BR-DEP-03`, *when* tác vụ nền chạy tự động (`UC-F1-11`), *then* hợp đồng nháp tự động hủy và ô kho được mở lại cho khách khác đặt.
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

- **AC-1** — *Given* tôi mở danh mục hợp đồng cơ sở, *when* trang hiển thị, *then* danh sách liệt kê đầy đủ các hợp đồng có trạng thái *Active*, *Near Expiration* (sắp hết hạn trong vòng 7 ngày) và *Overdue*.
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

- **AC-1** — *Given* một hợp đồng đang thuê, *when* tôi xem chi tiết tài chính, *then* hiển thị rõ: Tiền cọc đang ký gửi, Số tiền thuê đã thanh toán, Hạn thanh toán kỳ tiếp theo và tổng nợ tồn đọng (nếu có).
- **AC-2** — *Given* khách hàng có phát sinh khoản phụ phí (phí cấp lại khóa, phí vệ sinh), *when* khoản phí được tạo, *then* hệ thống cập nhật vào bảng kê công nợ của hợp đồng kèm trạng thái (Chưa thu / Đã thu).
- **AC-3** — *Given* một khách hàng đã quá hạn đóng tiền trên 3 ngày theo `BR-OVD-02`, *when* tôi mở danh sách nợ, *then* hợp đồng được tô màu đỏ cảnh báo kèm số ngày quá hạn và tiền phạt tạm tính.
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
- **AC-3** — *Given* tôi bấm "Phê duyệt quyết toán", *when* hệ thống xác nhận, *then* lệnh hoàn cọc được chuyển sang cổng thanh toán/bộ phận kế toán, hợp đồng chuyển sang trạng thái *Terminated* và gửi hóa đơn quyết toán cho khách.
- **AC-4** — *Given* khách hàng vẫn còn nợ tiền thuê hoặc phụ phí chưa thanh toán, *when* thực hiện quyết toán, *then* hệ thống tự động cấn trừ công nợ vào tiền cọc trước khi hoàn trả phần dư.

---

### `US-FM-04.2` — Phê duyệt và ghi nhận gia hạn hợp đồng thuê

> **Là** Facility Manager, **tôi muốn** duyệt yêu cầu gia hạn và cập nhật ngày kết thúc mới cho hợp đồng sau khi khách thanh toán phí gia hạn, **để** duy trì quyền sử dụng kho liên tục cho khách hàng.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F6-04` | Must | 5 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* khách hàng đã nộp yêu cầu gia hạn và thanh toán đủ phí gia hạn qua cổng thanh toán (`UC-F6-03`), *when* hệ thống nhận được giao dịch thành công, *then* hợp đồng tự động gia hạn thêm thời gian tương ứng theo `BR-REN-03`.
- **AC-2** — *Given* khách hàng đóng tiền gia hạn trực tiếp bằng tiền mặt tại cơ sở, *when* tôi kiểm tra và nhập xác nhận thu tiền, *then* hệ thống cập nhật ngày kết thúc mới (*End Date*) và gia hạn hiệu lực của mã Access Code.
- **AC-3** — *Given* ô kho đang nằm trong danh sách thu hồi để đại tu mặt bằng, *when* khách yêu cầu gia hạn, *then* hệ thống cảnh báo "Ô kho không thuộc diện được gia hạn" để tôi trực tiếp liên hệ hỗ trợ khách đổi ô kho khác.

---

### `US-FM-04.3` — Xử lý hợp đồng quá hạn, khóa quyền truy cập và xử lý tài sản tồn đọng

> **Là** Facility Manager, **tôi muốn** giám sát quy trình tự động xử lý hợp đồng quá hạn, vô hiệu hóa quyền truy cập và lập biên bản xử lý tài sản, **để** thu hồi công nợ và giải phóng ô kho theo đúng luật.

| Use case | Ưu tiên | Story point | Giai đoạn |
|----------|---------|:-----------:|:---------:|
| `UC-F6-05`, `UC-F6-06`, `UC-F6-07`, `UC-F6-08`, `UC-F6-09` | Must | 8 | P4 |

**Acceptance Criteria**

- **AC-1** — *Given* hợp đồng quá hạn chạm mốc D+10 mà khách chưa thanh toán theo `BR-OVD-05` và `BR-ACC-02`, *when* tác vụ hệ thống chạy định kỳ (`UC-F6-07`), *then* hệ thống tự động vô hiệu hóa mã Access Code của khách, đồng thời tự động tạo nhiệm vụ gắn khóa ngoài vật lý (Overlock task) đẩy vào ca trực của Facility Staff (`US-FS-06.1`) và hiển thị trạng thái "Đã khóa truy cập" trên danh sách của tôi; tôi cũng có thể chủ động bấm khóa thủ công nếu cần can thiệp sớm.
- **AC-2** — *Given* hợp đồng quá hạn chạm mốc D+30 theo `BR-OVD-06`, *when* tác vụ hệ thống chạy định kỳ (`UC-F6-08`), *then* hệ thống tự động gửi "Thông báo chấm dứt hợp đồng và yêu cầu thanh lý tài sản" qua email và ứng dụng của khách, đồng thời tự động kết xuất văn bản PDF thông báo có đóng dấu điện tử để tôi in gửi chuyển phát bảo đảm đến địa chỉ thư tín của khách.
- **AC-3** — *Given* hợp đồng quá hạn đến mốc D+60 và khách không phản hồi theo `BR-OVD-07`, *when* tôi kích hoạt thủ tục xử lý tài sản, *then* hệ thống hướng dẫn lập hội đồng kiểm kê, chụp ảnh niêm phong đồ đạc và chấm dứt hợp đồng.
- **AC-4** — *Given* khách hàng quá hạn đến cơ sở thanh toán toàn bộ tiền nợ và tiền phạt quá hạn theo `BR-OVD-03`, *when* thanh toán được ghi nhận, *then* hệ thống cho phép mở lại mã Access Code theo `BR-OVD-08` và tự động gửi thông báo yêu cầu nhân viên tháo khóa ngoài.

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
- **AC-2** — *Given* các số liệu ô kho, *when* hệ thống tính toán, *then* hiển thị **Tỷ lệ lấp đầy (Usage Rate %)** theo công thức: `(Số ô kho đang thuê / Tổng số ô kho) * 100%` kèm biểu đồ tròn trực quan.
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
| `US-FM-02.1` | Phân bổ ô kho vật lý cho đơn đặt chỗ của khách | `FM-02` | Must | 5 | P3 | 4 |
| `US-FM-02.2` | Giám sát kích hoạt hợp đồng thuê sau bàn giao | `FM-02` | Must | 5 | P3 | 3 |
| `US-FM-03.1` | Giám sát danh sách khách hàng và hợp đồng thuê đang hiệu lực | `FM-03` | Must | 5 | P4 | 4 |
| `US-FM-03.2` | Theo dõi tình trạng thanh toán và công nợ của từng hợp đồng | `FM-03` | Must | 5 | P4 | 4 |
| `US-FM-04.1` | Phê duyệt quyết toán hợp đồng và hoàn trả tiền cọc khi trả kho | `FM-04` | Must | 5 | P4 | 4 |
| `US-FM-04.2` | Phê duyệt và ghi nhận gia hạn hợp đồng thuê | `FM-04` | Must | 5 | P4 | 3 |
| `US-FM-04.3` | Xử lý hợp đồng quá hạn, khóa quyền truy cập và xử lý tài sản tồn đọng | `FM-04` | Must | 8 | P4 | 4 |
| `US-FM-05.1` | Phân công công việc bàn giao, nghiệm thu và sự cố cho nhân viên cơ sở | `FM-05` | Must | 5 | P3 | 4 |
| `US-FM-06.1` | Xem báo cáo thống kê hoạt động cơ sở, tỷ lệ lấp đầy, doanh thu và nợ quá hạn | `FM-06` | Must | 8 | P5 | 5 |

**Theo giai đoạn:** P2 — 2 story / 10 point · P3 — 7 story / 31 point · P4 — 11 story / 53 point · P5 — 2 story / 12 point.
**Theo ưu tiên:** Must — 20 story / 100 point · Should — 2 story / 6 point · Could — 0 story.
**Theo actor:** Facility Staff — 11 story / 45 point · Facility Manager — 11 story / 61 point.
**Tổng:** 22 story · 106 story point · 87 acceptance criteria.

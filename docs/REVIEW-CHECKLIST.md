# Checklist review tài liệu Giai đoạn 1

> Quy trình tự review 5 nhiệm vụ phân tích của Team Leader / BA, kèm **điều kiện dừng rõ ràng** cho
> từng nhiệm vụ.
>
> Áp dụng cho: **T1.1** · **T1.2** · **T1.5** · **T1.6** · **T1.18** — [PLAN.md](PLAN.md).
> Ghi phát hiện chưa giải quyết vào: [OPEN-ISSUES.md](OPEN-ISSUES.md)

---

## Mục lục

1. [Mô hình 3 lớp và luật dừng](#1-mô-hình-3-lớp-và-luật-dừng)
2. [Thứ tự và lịch review](#2-thứ-tự-và-lịch-review)
3. [T1.1 — Phân rã use case](#3-t11--phân-rã-use-case)
4. [T1.6 — Use Case Diagram](#4-t16--use-case-diagram)
5. [T1.5 — Business rules](#5-t15--business-rules)
6. [T1.2 — User story](#6-t12--user-story)
7. [T1.18 — Convention và Git workflow](#7-t118--convention-và-git-workflow)
8. [Luật chống review vô hạn](#8-luật-chống-review-vô-hạn)

---

## 1. Mô hình 3 lớp và luật dừng

Tự review bằng cách "đọc lại xem có ổn không" gần như luôn thất bại — người viết sẽ đọc lại chính
suy nghĩ của mình chứ không đọc văn bản. Vì vậy mỗi tài liệu đi qua **ba lớp có tiêu chí nhị phân**.

| Lớp                              | Câu hỏi                                           | Ai làm                   | Điều kiện xanh                              |
| --------------------------------- | --------------------------------------------------- | ------------------------- | ---------------------------------------------- |
| **1 · Nhất quán**        | Mã tham chiếu có tồn tại? Số liệu có khớp? | Máy                      | `bash docs/check-docs.sh` trả về 0         |
| **2 · Đầy đủ**         | Có bỏ sót gì so với tài liệu nguồn không?  | Người, đối chiếu 1-1 | Không còn ô trống trong bảng đối chiếu |
| **3 · Đúng nghiệp vụ** | Nội dung có đúng và dùng được không?      | Người, phán đoán     | Mọi câu hỏi thử thách đã có kết luận |

Lớp sau chỉ bắt đầu khi lớp trước đã xanh — sửa ở lớp 1 thường làm hỏng đúng thứ vừa đọc kỹ ở lớp 3.

### Luật dừng chung

> Ở lớp 3, một phát hiện **không cần được giải quyết** để review kết thúc. Nó chỉ cần được **ghi
> lại**. Mỗi câu hỏi thử thách phải rơi vào một trong hai ô: **"đạt"** hoặc **"đã ghi vào
> OPEN-ISSUES.md"**. Không được để ô thứ ba là *"chưa nghĩ tới"*.

[OPEN-ISSUES.md](OPEN-ISSUES.md) là cái van xả cho phép đóng review mà không phải giải quyết hết mọi
thứ. Vấn đề chờ cả nhóm quyết thì thuộc về buổi họp, không thuộc về vòng review của một người.

### Ranh giới giữa máy và người

Cái gì máy kiểm được thì đừng kiểm bằng mắt; cái gì cần phán đoán thì đừng cố tự động hoá. Ví dụ có
thật: phép kiểm *"acceptance criteria này có nhánh thất bại không"* từng được thử tự động hoá bằng từ
khoá — nó báo 7 story thiếu, soi tay thì chỉ **1** là thật, 6 là báo nhầm. Những phép kiểm mang tính
ngữ nghĩa như vậy luôn thuộc lớp 3.

---

## 2. Thứ tự và lịch review

Review theo **chiều phụ thuộc**, không theo deadline — sửa ở đầu nguồn trước để không phải sửa hạ
nguồn hai lần.

```
T1.1 ──▶ T1.6        Use Case Diagram sinh ra từ danh sách use case
T1.5 ──▶ T1.2        Acceptance criteria trích dẫn mã BR
T1.18                Độc lập, nhưng cần người khác đọc → khởi động sớm nhất
```

| Ngày     | Việc                                                    | Lý do                                                                 |
| --------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| 08/09     | Gửi T1.18 cho 3 thành viên,**rồi** review T1.1 | T1.18 chờ phản hồi người khác, gửi trước để chạy song song |
| 09/09     | T1.6                                                     | Nhanh, cùng hạn 14/09 với T1.1                                      |
| 10–11/09 | T1.5                                                     | Nặng nhất, cần thời gian tính tay                                 |
| 12/09     | T1.2                                                     | Làm sau khi T1.5 đã chốt số                                       |
| 13/09     | Họp nhóm đóng T1.18 và T1.5                         | Cả hai cần cả nhóm xác nhận                                      |
| 14/09     | Hạn nộp T1.1, T1.6, T1.18                              |                                                                        |
| 21/09     | Hạn nộp T1.2, T1.5 · Báo cáo#1                      |                                                                        |

---

## 3. T1.1 — Phân rã use case

**Tài liệu:** [USE-CASES.md](USE-CASES.md) · **Hạn:** 14/09

### Lớp 1 — máy

- [ ] `bash docs/check-docs.sh` trả về 0

### Lớp 2 — đối chiếu nguồn

Mở [TOPIC.md § 4–5](TOPIC.md#4-các-luồng-nghiệp-vụ-chính-flow-15), lấy dòng *"Nội dung dự kiến"* của
từng flow. Mỗi flow là một câu gồm 4–5 mệnh đề nối bằng `→`. Tách ra, mỗi mệnh đề phải trỏ về ít nhất
một mã UC.

- [X] Flow 1 — mọi mệnh đề đã có UC tương ứng
- [X] Flow 2 — mọi mệnh đề đã có UC tương ứng
- [X] Flow 3 — mọi mệnh đề đã có UC tương ứng
- [X] Flow 4 — mọi mệnh đề đã có UC tương ứng
- [X] Flow 5 — mọi mệnh đề đã có UC tương ứng
- [X] Flow 6 — mọi mệnh đề đã có UC tương ứng
- [X] Flow 7 — mọi mệnh đề đã có UC tương ứng
- [X] Ma trận [TOPIC.md § 6](TOPIC.md#6-ma-trận-tác-nhân--luồng-nghiệp-vụ): actor có ● hoặc ○ ở flow nào thì có mặt trong bảng UC của flow đó

> **Kết quả đã biết trước:** bảng UC có một actor tên `System` mà § 6 không có. Đây là chủ ý — dùng để
> biểu diễn scheduled job, đã ghi ở [USE-CASES.md § 1](USE-CASES.md#1-quy-ước-mã-use-case). Không
> phải lỗi, nhưng cần quyết có bổ sung `System` vào § 6 hay không → [ISS-03](OPEN-ISSUES.md).

### Lớp 3 — phán đoán

- [X] **Use case hay chỉ là một bước?** Với mỗi UC đáng nghi, hỏi: *"actor làm xong cái này đã đạt
  được thứ gì có giá trị chưa?"* Nếu phải làm tiếp mới có giá trị thì nó là bước, không phải use
  case. Ba UC cần quyết giữ hay gộp: `UC-F2-06`, `UC-F3-09`, `UC-F7-07` — cả ba đều là "cập nhật
  trạng thái ô kho", có thể chỉ là hệ quả của UC khác.
- [X] **Mỗi UC đều có người khởi tạo?** Không có UC nào mà không actor nào bấm được.
- [X] **Độ hạt có đều không?** So `UC-F4-01` (quản lý toàn bộ Facility — rất to) với `UC-F1-09` (nhận
  lịch hẹn — rất nhỏ). Không cần đều tuyệt đối, nhưng lệch quá thì ước lượng công ở P2–P5 sẽ sai.

> ### ⛔ ĐIỂM DỪNG T1.1
>
> Script xanh · 7 dòng "Nội dung dự kiến" tick hết · ma trận § 6 đã đối chiếu · 3 UC đáng nghi đã có
> kết luận giữ hay gộp.
> **Không cần đọc lại cả 78 use case lần hai.**

---

## 4. T1.6 — Use Case Diagram

**Tài liệu:** [diagrams/_archive/use-case-diagram.puml](diagrams/_archive/use-case-diagram.puml) · **Hạn:** 14/09

> ⚠️ File `.puml` này **chưa từng được render**. Lỗi cú pháp là hoàn toàn có thể. Phép kiểm đầu tiên
> vì thế là phép kiểm quan trọng nhất.

### Lớp 1 — máy

- [X] Cài extension *PlantUML* trong VS Code, mở file, bấm `Alt+D` → render ra ảnh, **không báo lỗi
  cú pháp**
- [X] `Ctrl+Shift+P` → *PlantUML: Export Current Diagram* → xuất được PNG hoặc SVG

### Lớp 2 — đối chiếu

Đếm trên **ảnh đã render**, không đếm trong file nguồn — chỉ ảnh mới cho biết có phần tử nào bị mất
khi render không.

- [X] Đủ **6 actor**: 5 actor của đề bài + `System`
- [X] Đủ **8 package**: Flow 1–7 và nhóm Nền tảng
- [X] Đủ **78 oval** use case

### Lớp 3 — phán đoán

Rà 27 quan hệ `include` / `extend` ở cuối file. Quy tắc chiều mũi tên: `include` đi từ use case
**gọi** sang use case **bị gọi**; `extend` đi từ use case **mở rộng** sang use case **gốc**.

- [X] Đã bỏ `UCF109 ..> UCF107`: xem / nhận lại lịch hẹn không gọi thanh toán lần nữa (`ISS-05`)
- [X] Giữ `UCF107 ..> UCF108`: thanh toán thành công gọi khóa Storage Unit theo `BR-AVL-04`
- [ ] Không có oval nào mồ côi — mọi use case đều nối với ít nhất một actor, hoặc với một use case
  khác qua include/extend

> ### ⛔ ĐIỂM DỪNG T1.6
>
> Xuất được PNG không lỗi · đếm đủ 6 / 8 / 78 · 2 quan hệ đáng ngờ đã có kết luận.
> **Không cần rà hết 27 quan hệ nếu 2 quan hệ trên đúng và ảnh đọc được.**

---

## 5. T1.5 — Business rules

**Tài liệu:** [BUSINESS-RULES.md](BUSINESS-RULES.md) · **Hạn:** 21/09

Đây là nhiệm vụ rủi ro cao nhất — [PLAN.md § 7](PLAN.md#7-rủi-ro-và-đối-sách) ghi rõ chốt muộn thì
phải sửa lại code ở P3 và P4. Cũng là nhiệm vụ **không được review bằng cách đọc lại quy tắc**: đọc
quy tắc thì cái nào cũng thấy hợp lý.

### Lớp 3 — chạy kịch bản và tính tay

Cách duy nhất hiệu quả. **Tự tính trước, rồi mới mở tài liệu đối chiếu.** Dùng Unit Type
800.000 đ/tháng, thuê 3 tháng. Mỗi kịch bản phải ra **một con số** và **một chuỗi trạng thái**.

- [ ] **KB1** — Đặt rồi không thanh toán trong 48h → Reservation thành gì, capacity được giải phóng
  thế nào, Storage Unit có đổi trạng thái không, có mất tiền không
- [ ] **KB2** — Hủy trước 48h so với hủy trong 48h → hoàn bao nhiêu, khác nhau chỗ nào
- [ ] **KB3** — No-show hết 3 ngày → hoàn bao nhiêu, ai giữ tiền
- [X] **KB4** — Trả đúng hạn, nguyên trạng → hoàn **800.000 đ** Deposit trong 7 ngày làm việc;
  Contract *Closed*, unit *Cleaning* → *Available*, Access *Revoked*
- [X] **KB5** — Quá hạn 7 / 20 / 35 / 61 ngày → phí lần lượt **160.000 / 400.000 / 400.000 /
  400.000 đ**; Access lần lượt *Active / Suspended / Suspended / Revoked*; ngày 61 Contract đã *Terminated*
- [X] **KB6** — Overdue 7 ngày, Renewal 2 tháng giá mới 850.000 đ → trả **1.860.000 đ**; Contract
  *Active* và Access mở lại trong 1 giờ
- [X] **KB7** — Return với hư hỏng **1.000.000 đ**, không có nợ khác → Deposit 800.000 đ bị cấn hết,
  khách còn nợ **200.000 đ** và Contract chưa đóng trước khi nộp đủ
- [X] **KB8** — Return sớm 1 tháng, nguyên trạng → hoàn tiền thuê chưa dùng **0 đ**, hoàn Deposit
  **800.000 đ**
- [X] **KB9** — Hai khách đồng thời tranh capacity slot cuối → đúng một Reservation *Pending Payment*;
  yêu cầu còn lại bị từ chối, không thu tiền và không overbook
- [X] **KB10** — Payment **3.200.000 đ** thành công nhưng khóa unit thất bại → hoàn đủ
  **3.200.000 đ**, Reservation không *Confirmed* và không tạo Contract
- [X] **KB11** — Giá/policy đổi trong 48 giờ giữ capacity → Reservation cũ dùng snapshot lúc tạo;
  với dữ liệu mẫu vẫn thu **3.200.000 đ**
- [X] **KB12** — Hủy vào cuối ngày thuê thứ hai trước Check-in → trừ **54.000 đ** tiền thuê,
  hoàn **2.346.000 đ**, hoàn Deposit **0 đ**; Reservation *Cancelled*, unit *Available*
- [X] **KB13** — Contract tới D+10 → phí **280.000 đ**, Contract *Overdue*, unit *Occupied*,
  Access *Suspended*
- [X] **KB14** — Hủy đủ điều kiện hoàn **3.200.000 đ** nhưng refund thất bại → Reservation vẫn
  *Cancelled*, giao dịch hoàn *Refund Failed* để retry
- [X] **KB15** — Renewal xung đột commitment tạo trước → commitment cũ được ưu tiên, Renewal bị từ
  chối và thu **0 đ**
- [X] **KB16** — Yêu cầu Return trước hạn 3 ngày → hẹn sớm nhất sau 7 ngày, tức D+4; tại lịch hẹn
  Contract *Overdue*, Access còn dùng được và phí là **40.000 đ**
- [X] **KB17** — Contract tới D+10, không có chi phí khác → phí tính theo `BR-OVD-02` (7 ngày × 5% = 35% tiền cọc, chạm trần 35%); Contract *Terminated*, Access *Revoked*, ô kho chuyển *Cleaning*/*Maintaining*; Facility Manager phân công nhân viên thu dọn đồ về kho chung
- [X] **KB18** — Facility Manager đề xuất giảm **100.000 đ** từ phí 400.000 đ → Business Operations
  Manager duyệt còn **300.000 đ**; ledger có *Adjusted* và audit log lưu người đề xuất, người duyệt, lý do
- [X] **KB19** — Thanh toán Reservation bắt đầu sau khi Contract Occupied hiện tại kết thúc →
  Reservation *Confirmed* gắn `unit_id`, unit **vẫn** *Occupied*; sau Return/Cleaning unit mới
  *Reserved* cho claim đó, không nhảy *Available*

> **Quy tắc phát hiện lỗ hổng:** kịch bản nào tính ra *"tùy"*, *"không rõ"*, hoặc ra **hai** con số
> khác nhau tùy cách đọc → quy tắc đang thiếu hoặc mâu thuẫn. Ghi vào `OPEN-ISSUES.md`.

### Lớp 3 — kiểm mâu thuẫn

- [X] Vẽ một trục thời gian, đặt hết mọi mốc lên đó: 48h giữ chỗ · 3 ngày check-in · 3 ngày báo trả ·
  D+1..D+3 ân hạn · D+4 tính phí · D+10 chấm dứt. Kiểm không có mốc nào chồng chéo hoặc sai thứ tự

### Lớp 3 — kiểm khả thi dữ liệu

- [X] Với mỗi nhóm `BR-*`, trả lời: *"để tính được cái này, hệ thống phải lưu trường dữ liệu gì?"*
  Danh sách trả lời chính là đầu vào cho **T1.10** (ERD) — làm luôn ở đây thì Tùng đỡ phải đoán

### Điều kiện phụ thuộc người khác

- [ ] Cả nhóm đã duyệt bảng tham số [§ 2](BUSINESS-RULES.md#2-bảng-tham-số-cấu-hình) trong một buổi họp

> ### ⛔ ĐIỂM DỪNG T1.5
>
> 19 kịch bản đều ra **một** kết quả duy nhất · trục thời gian không mâu thuẫn · mỗi nhóm BR đã liệt kê
> trường dữ liệu cần · **và cả nhóm đã duyệt bảng § 2**.
> Điều kiện cuối là bắt buộc: `PLAN.md § 7` quy định mọi thay đổi sau đó phải qua họp nhóm, nên chưa
> họp thì T1.5 chưa đóng dù bạn thấy nó hoàn hảo.

---

## 6. T1.2 — User story

**Tài liệu:** [USER-STORIES-SC.md](USER-STORIES-SC.md) · **Hạn:** 21/09

### Lớp 3 — phép kiểm chính: "viết được test case thủ công không?"

Đừng đọc tuần tự cả 111 acceptance criteria — đến cái thứ 30 sẽ mệt và duyệt bừa phần còn lại. Thay
vào đó **lấy mẫu 10 AC ngẫu nhiên**, với mỗi cái thử viết một test case thủ công 3 bước: *chuẩn bị dữ
liệu → thao tác → kết quả quan sát được*. Viết không nổi nghĩa là AC mơ hồ.

- [ ] Đã lấy mẫu 10 AC và thử viết test case

| Kết quả           | Hành động                        |
| ------------------- | ----------------------------------- |
| 10/10 viết được | Dừng, không đọc phần còn lại |
| 1/10 hỏng          | Sửa cái đó, dừng               |
| ≥ 2/10 hỏng       | Rà toàn bộ file                  |

### Lớp 3 — hai phép kiểm đã chạy sẵn

- [X] **Từ ngữ mơ hồ** ("nhanh chóng", "dễ dàng", "hợp lý", "phù hợp"…) — kết quả: **0 dòng**, đạt
- [X] **Story thiếu AC nhánh thất bại** — thử tự động hoá bằng từ khoá, báo 7 story nhưng soi tay chỉ
  **1 là thật**: `US-SC-02.2` có 5 AC và cả 5 đều là happy path, vi phạm chính quy ước ở
  [§ 1](USER-STORIES-SC.md#1-quy-ước-viết-user-story). **Đã sửa** — bổ sung `AC-6` về trường hợp bảng
  giá thay đổi trong lúc khách đang xem màn hình xác nhận
- [ ] Rà bằng mắt các story còn lại: mỗi story có ít nhất một AC mô tả nhánh thất bại, từ chối, hoặc
  dữ liệu rỗng

### Lớp 3 — story point

So theo **cặp**, không so tuyệt đối. Chỉ cần so 3–4 cặp.

- [ ] Đặt `US-SC-02.1` (8 điểm) cạnh `US-SC-02.2` (3 điểm) — có thật sự tốn gần 3 lần công không?
- [ ] Đặt `US-SC-03.1` (8 điểm) cạnh `US-SC-04.1` (2 điểm)
- [ ] Đặt hai story cùng 5 điểm bất kỳ cạnh nhau — có tương đương nhau không?

> ### ⛔ ĐIỂM DỪNG T1.2
>
> Mẫu 10 AC viết được test case thủ công · mọi story đều có nhánh thất bại · 3 cặp story point đã so
> lại.
> **Không cần đọc tuần tự cả 22 story.**

---

## 7. T1.18 — Convention và Git workflow

**Tài liệu:** [CONVENTIONS.md](CONVENTIONS.md) và [CONTRIBUTING.md](../CONTRIBUTING.md) · **Hạn:** 14/09

Đây là tài liệu **quy trình**, không phải tài liệu nội dung. Review bằng cách đọc là vô nghĩa — phải
review bằng cách **thử làm theo** và bằng **người khác**.

### Phép kiểm 1 — tự đi hết một vòng

Lấy task **T1.16** (khởi tạo Spring Boot skeleton) làm ví dụ, đi đủ các bước. Chỗ nào phải dừng lại
tự nghĩ *"ờ cái này ghi sao ta"* chính là chỗ tài liệu viết chưa đủ rõ.

- [ ] Đặt tên nhánh theo quy ước § 2
- [ ] Tạo nhánh, commit theo Conventional Commits § 3
- [ ] Mở Pull Request nháp, điền mô tả theo template § 4.3
- [ ] Chạy `bash docs/check-docs.sh` như Definition of Done yêu cầu

### Phép kiểm 2 — người khác làm mà không hỏi bạn

Gửi 2 file cho Tùng, Nhật, Nhi. Mỗi người tự đặt tên nhánh và viết commit message cho task sắp làm
của họ, **không được hỏi bạn**. So kết quả với quy ước. Ai làm sai chỗ nào thì **chỗ đó viết chưa
rõ** — không phải người đó đọc ẩu.

- [ ] Lê Thanh Tùng — đã thử, kết quả khớp quy ước
- [ ] Huỳnh Nhật — đã thử, kết quả khớp quy ước
- [ ] Nguyễn Phạm Xuân Nhi — đã thử, kết quả khớp quy ước

### Phép kiểm 3 — ba câu hỏi tài liệu phải tự trả lời được

Nếu người đọc phải nhắn hỏi bạn một trong ba câu này, bổ sung vào tài liệu.

- [ ] Migration Flyway của tôi trùng số với người khác thì xử lý thế nào?
- [ ] Pull Request của tôi ai review, và bao lâu thì có phản hồi?
- [ ] Tôi lỡ commit file `.env` rồi thì phải làm gì?

> ### ⛔ ĐIỂM DỪNG T1.18
>
> Tên nhiệm vụ trong `PLAN.md` là *"**thống nhất** coding convention, Git workflow và quy ước API"* —
> chữ "thống nhất" nghĩa là điểm dừng nằm ở người khác, không nằm ở bạn.
> Đóng khi: đã đi hết một vòng git thật · **cả 3 thành viên còn lại xác nhận đã đọc và không còn câu
> hỏi mở** · 3 câu hỏi trên đều tra được trong tài liệu.
> Bạn tự thấy hoàn hảo mà nhóm chưa xác nhận thì T1.18 vẫn chưa xong.

---

## 8. Luật chống review vô hạn

1. **Tối đa 2 vòng mỗi tài liệu.** Vòng 3 không phải của bạn — người viết ra tài liệu có điểm mù cố
   định, đọc lần ba không tìm thêm được gì. Vòng 3 thuộc về buổi họp nhóm hoặc về người nhận T1.3 và
   T1.4.
2. **Quá 15 phút không giải quyết được một phát hiện → ghi vào [OPEN-ISSUES.md](OPEN-ISSUES.md) và đi
   tiếp.** Vấn đề mở không chặn việc đóng review.
3. **Không sửa văn phong ở vòng review.** Chỉ sửa 4 loại: sai sự thật · mâu thuẫn nội bộ · thiếu sót ·
   mơ hồ tới mức không code được. *"Câu này viết hay hơn được"* không thuộc 4 loại đó.
4. **Phép thử cuối cùng:** mở tài liệu, đọc 5 phút bất kỳ, không thêm được mục nào vào danh sách sửa
   → xong. Đọc thêm 30 phút nữa cũng vậy.

---

## 9. Nghiệm thu Bộ tài liệu kiểm thử hệ thống (Master Test Plan & Test Suites)

Áp dụng cho: `docs/testing/` · Tiêu chuẩn IEEE 829.

- [x] **Lớp 1 (Nhất quán):** Chạy `bash docs/testing/verify-test-suite.sh` trả về mã 0 (All Checks Passed).
- [x] **Lớp 2 (Đầy đủ):** Toàn bộ 27 mã yêu cầu (`SC-*`, `FS-*`, `FM-*`, `BM-*`, `SA-*`) và 76 Use Cases đều có mã Test Case kiểm chứng.
- [x] **Lớp 3 (Đúng nghiệp vụ):**
  - Không có test case sử dụng thẻ từ RFID (chỉ dùng PIN 6 số hoặc chìa khóa cơ).
  - Kiểm thử đúng quy tắc làm tròn 1.000 VND và hệ số cọc 1.0 tháng (`BR-GEN-04`, `BR-DEP-01`).
  - Kiểm thử đúng logic Overdue: D+1..D+3 ân hạn, D+4..D+10 phạt 10%/ngày (trần 70%), D+10 khóa PIN và niêm phong kho offline (`BR-OVD-02`..`07`).


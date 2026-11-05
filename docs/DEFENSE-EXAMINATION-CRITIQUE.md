# TÀI LIỆU RÀ SOÁT & ĐẶT CÂU HỎI PHẢN BIỆN TOÀN DIỆN

## (Comprehensive Thesis Defense Examination & Architecture Critique Guide)

> **Dự án:** Hệ thống Quản lý và Cho thuê Kho Tự Quản (Self-Storage Facility Rental & Management System)  
> **Học phần:** SWP391 / Đồ án Tốt nghiệp CNTT (Capstone Project)  
> **Chức danh phản biện:** Giảng viên Phản biện Trưởng (Lead Thesis Examiner)  
> **Hội đồng:** Kiến trúc Phần mềm, Hệ thống Phân tán & Vận hành Thương mại / Cho thuê (Rental & Inventory Systems)  
> **Tài liệu đối chiếu:** [`docs/TOPIC.md`](TOPIC.md) · [`docs/DEFENSE-SPECIFICATION.md`](DEFENSE-SPECIFICATION.md) · [`docs/BUSINESS-RULES.md`](BUSINESS-RULES.md) · [`docs/WORKFLOWS.md`](WORKFLOWS.md)

---

## ⚠️ LỜI MỞ ĐẦU TỪ CHỦ TỊCH HỘI ĐỒNG PHẢN BIỆN

> _"Thưa các bạn sinh viên,_
>
> _Khi các bạn bước vào phòng bảo vệ Đồ án Tốt nghiệp với một hệ thống Quản lý và Cho thuê Kho Tự quản (Self-Storage), Hội đồng **không chấm điểm việc các bạn vẽ giao diện đẹp mắt hay viết được vài hàm CRUD thêm-nếm-sửa-xóa cơ bản**. Một sinh viên năm hai học qua một khóa cấp tốc cũng có thể tạo được một trang web cho phép bấm nút 'Đặt kho' và 'Thanh toán'._
>
> \*Hội đồng chúng tôi ngồi đây để kiểm tra bản lĩnh kỹ thuật thực chiến và tư duy hệ thống của các bạn: **Liệu hệ thống này có thể sống sót và bảo vệ được dòng tiền, tài sản của doanh nghiệp khi ném vào môi trường thực tế đầy rẫy sự khắc nghiệt, gian lận, xung đột đồng thời và tranh chấp pháp lý hay không?\***
>
> _Tài liệu này được biên soạn với lập trường độc lập tuyệt đối, vào vai **'Kẻ đóng vai ác' (Devil's Advocate)**. Tôi sẽ không quan tâm đến việc các bạn tự biện minh 'em thiết kế như thế là chạy được rồi'. Tôi sẽ soi chiếu hệ thống qua 4 lăng kính tàn nhẫn nhất: **Lỗ hổng nghiệp vụ biên (Edge Cases), Bẫy pháp lý & Kế toán dòng tiền (Financial & Legal Pitfalls), Xung đột dữ liệu & Concurrency (Tech & Concurrency), và Những câu hỏi sát thủ hạ gục sinh viên tại chỗ**. Hãy đọc, tự chất vấn bản thân và chuẩn bị tinh thần thép trước khi đối diện với Hội đồng!"_

---

## MỤC LỤC CHI TIẾT

- [1. FLOW 1: Storage Unit Reservation Flow (Đặt chỗ & Giữ ô kho)](#1-flow-1-storage-unit-reservation-flow-đặt-chỗ--giữ-ô-kho)
- [2. FLOW 2: Storage Check-in and Handover Flow (Check-in & Bàn giao ô kho)](#2-flow-2-storage-check-in-and-handover-flow-check-in--bàn-giao-ô-kho)
- [3. FLOW 3: Rented Storage Unit Management Flow (Quản lý kho đang thuê & Trả kho)](#3-flow-3-rented-storage-unit-management-flow-quản-lý-kho-đang-thuê--trả-kho)
- [4. FLOW 4: Business Rules, Fee Management & Revenue Monitoring Flow (Quy định, Phí & Doanh thu)](#4-flow-4-business-rules-fee-management--revenue-monitoring-flow-quy-định-phí--doanh-thu)
- [5. FLOW 5: Facility Storage & Staff Management Flow (Quản lý cơ sở, Ô kho & Nhân sự)](#5-flow-5-facility-storage--staff-management-flow-quản-lý-cơ-sở-ô-kho--nhân-sự)
- [6. FLOW 6: Storage Renewal & Overdue Handling Flow (Gia hạn & Xử lý quá hạn D+1..D+10)](#6-flow-6-storage-renewal--overdue-handling-flow-gia-hạn--xử-lý-quá-hạn-d1d10)
- [7. FLOW 7: Support Request & Issue Handling Flow (Hỗ trợ & Xử lý sự cố on-site)](#7-flow-7-support-request--issue-handling-flow-hỗ-trợ--xử-lý-sự-cố-on-site)
- [8. CẨM NANG BẢN LĨNH PHÒNG THỦ: CÁCH TRẢ LỜI ĐẠT ĐIỂM XUẤT SẮC](#8-cẩm-nang-bản-lĩnh-phòng-thủ-cách-trả-lời-đạt-điểm-xuất-sắc)

---

# 1. FLOW 1: Storage Unit Reservation Flow (Đặt chỗ & Giữ ô kho)

> **Mô tả danh nghĩa:** Khách hàng tìm kiếm cơ sở, chọn loại ô kho cụ thể trên sơ đồ mặt bằng, giữ chỗ tối đa 48 giờ (`BR-DEP-03`), nộp tiền cọc (1 tháng) và tiền thuê (N tháng), hủy hoàn tiền 100% nếu trước 48h (`BR-CAN-01`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Storage Customer] ──(Chọn ô kho)──> [Tạm giữ 48h] ──(Cổng VNPAY) ──> [Pending Check-in]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1. Lỗ hổng Nghiệp vụ & Kịch bản Biên (Business Logic & Edge Cases)

1. **Cuộc tấn công Găm kho / Tê liệt kho hàng (Inventory Hoarding Attack):**
   - _Kịch bản:_ Đối thủ cạnh tranh hoặc kẻ phá hoại viết script tạo 50 tài khoản ảo, bấm giữ chỗ (Hold 48h) toàn bộ ô kho trống tại cơ sở `FAC-Q7` vào dịp cao điểm (cuối năm). Vì hệ thống cho phép giữ kho 48 tiếng mà **chưa bắt trả tiền ngay** (`PENDING_PAYMENT`), toàn bộ kho biến thành `RESERVED`. Khách hàng thật vào thấy báo hết kho và rời đi. Sau 48h, hệ thống tự nhả kho ra, script bot lại lập tức đặt lại. Cơ sở bị tê liệt doanh thu hoàn toàn mà không thu được 1 đồng cọc nào!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn thiết kế cơ chế bảo vệ tài nguyên vật lý (Inventory Protection) thế nào? Tại sao lại cho phép giữ ô kho vật lý cố định tới 48 tiếng mà không yêu cầu thanh toán trong 15-30 phút như mô hình rạp chiếu phim (CGV) hay đặt vé máy bay?"** Giảng viên muốn kiểm tra xem sinh viên có phân biệt được giữa việc "Khóa tạm thời (Soft Lock)" và "Giữ chỗ chính thức (Hard Hold)" hay không.
2. **Xung đột Quyền ưu tiên: Khách mới đặt trước (Future Claim) vs Khách cũ muốn Gia hạn (Renewal Preemption):**
   - _Kịch bản:_ Ô kho `U-101` hợp đồng hiện tại sẽ hết hạn vào ngày 30/11. Hệ thống áp dụng khoảng đệm an toàn 15 ngày (`BR-AVL-02`), nên cho phép khách B đặt giữ chỗ từ ngày 16/12 trở đi. Đến ngày 20/11, khách A (đang thuê kho `U-101`) đến quầy yêu cầu gia hạn thêm 6 tháng. Theo tập quán thương mại cho thuê mặt bằng, khách đang thuê luôn có quyền ưu tiên tiếp tục thuê (Right of First Refusal).
   - _Lỗ hổng:_ Nếu hệ thống từ chối khách A vì khách B đã đặt, doanh nghiệp mất khách hàng trung thành, phát sinh chi phí dọn dẹp và rủi ro gián đoạn kinh doanh. Nếu hệ thống cho khách A gia hạn, thì hợp đồng của khách B (đã trả cọc đầy đủ) sẽ bị hủy ngang thế nào? Ai đền bù cho khách B?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Logic quản lý Capacity theo dòng thời gian (Time-slotted Inventory Allocation) của các bạn có giải quyết được bài toán xung đột quyền lợi giữa Khách hiện hữu và Khách đặt trước trong tương lai không?"**
3. **Bẫy hủy đặt chỗ sát tích tắc (Sub-second Cancellation Boundary):**
   - _Kịch bản:_ Quy tắc `BR-CAN-01` quy định hủy trước ngày bắt đầu 48 giờ thì được hoàn 100% cọc; trong vòng 48 giờ thì mất 100% cọc (`BR-CAN-02`). Khách bấm hủy lúc 47 giờ 59 phút 59 giây.
   - _Lỗ hổng:_ Múi giờ server chạy UTC, client chạy GMT+7; hoặc server bị lệch giờ NTP vài giây. Khách hàng chụp màn hình lúc 48:00:01 đòi hoàn cọc, hệ thống ghi nhận 47:59:58 phạt 100% cọc. Khách kiện công ty lừa đảo.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Hệ thống có cơ chế đồng bộ thời gian (NTP Sync), quy chuẩn múi giờ (`BR-GEN-06`), và xử lý độ trễ mạng (Network Latency Buffer) khi tính toán các mốc thời gian tài chính nhạy cảm hay không?"**

---

### 1.2. Bẫy Pháp lý & Kế toán Dòng tiền (Financial & Legal Risks)

1. **Phạt mất 100% cọc khi hủy muộn (BR-CAN-02) / No-show (BR-CAN-04) — Bẫy vi phạm Bộ luật Dân sự:**
   - _Phân tích pháp lý:_ Theo Điều 328 Bộ luật Dân sự 2015, đặt cọc là để bảo đảm giao kết hoặc thực hiện hợp đồng. Khi khách hủy hoặc No-show, doanh nghiệp được quyền sở hữu tài sản đặt cọc (ở đây là 1 tháng cọc). **NHƯNG:** Tại bước Flow 1, hệ thống đã bắt khách hàng nộp trước: `Tổng tiền = Tiền cọc (1 tháng) + Tiền thuê (N tháng)`.
   - _Bẫy chết người:_ Khi khách No-show, hệ thống giữ lại 1 tháng cọc và... giữ luôn N tháng tiền thuê hay hoàn lại tiền thuê? Nếu giữ lại N tháng tiền thuê là hành vi **"Chiếm đoạt tài sản trái pháp luật"** vì dịch vụ chưa từng được cung ứng và hợp đồng chưa từng phát sinh sử dụng thực tế. Nếu hoàn lại tiền thuê, quy trình kế toán hoàn tiền và đối soát thuế xử lý thế nào?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn có phân tách rạch ròi giữa 'Tiền đặt cọc giữ chỗ' và 'Tiền trả trước dịch vụ (Prepaid Rental)' trong cơ sở dữ liệu và sổ cái kế toán hay đang gộp chung thành một cục tiền thanh toán?"**
2. **Kế toán Thuế GTGT (VAT) đối với Tiền phạt cọc:**
   - _Phân tích tài chính:_ Khi khách nộp tiền giữ chỗ, tiền cọc không chịu thuế GTGT (theo quy định của Bộ Tài chính). Nhưng khi khách hủy muộn và bị phạt mất cọc 100%, khoản tiền cọc này chuyển dịch từ "Nợ phải trả giữ hộ (Deposit Escrow)" sang "Thu nhập khác của doanh nghiệp".
   - _Lỗ hổng:_ Hệ thống của các bạn có tự động xuất hóa đơn điện tử điều chỉnh hoặc hạch toán bút toán chuyển đổi doanh thu này không, hay để sót dẫn đến vi phạm trốn thuế doanh nghiệp?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Kiểm tra hiểu biết của sinh viên về vòng đời dòng tiền (Cash Lifecycle) và tính pháp lý của việc chuyển đổi mục đích khoản thu trong cơ sở dữ liệu."**
3. **Chi phí cổng thanh toán (Gateway Surcharge) khi hoàn tiền 100%:**
   - _Kịch bản:_ Khách thanh toán 10.000.000đ qua cổng VNPAY/Thẻ tín dụng. Cổng thanh toán trừ ngay 2.2% phí xử lý (doanh nghiệp thực nhận 9.780.000đ). Sau 1 ngày, khách hủy hợp lệ trước 48h (`BR-CAN-01`). Hệ thống hoàn trả khách 10.000.000đ.
   - _Hậu quả:_ Doanh nghiệp mất trắng 220.000đ chi phí xử lý cổng cho một giao dịch rác. Nếu đối thủ chơi xấu liên tục nạp 100 triệu rồi bấm hủy hợp lệ, doanh nghiệp sẽ bị cạn kiệt dòng tiền vì gánh phí ngân hàng!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Quy tắc nghiệp vụ của các bạn có tính toán đến cơ chế xử lý phí hoàn tiền (Refund Processing Fee) và hạn mức hủy tối đa trên một tài khoản để chống phá hoại tài chính không?"**

---

### 1.3. Bẫy Kỹ thuật, Dữ liệu & Xung đột (Concurrency, State Machine & Tech)

1. **Race Condition kinh điển: Double-Booking cùng một Miligiây:**
   - _Kịch bản:_ Hai người dùng cùng mở sơ đồ ô kho, cùng nhìn thấy ô `U-204` đang `AVAILABLE`. Đúng 14:00:00.120, cả hai người cùng bấm "Xác nhận Giữ chỗ".
   - _Bẫy kỹ thuật:_ Nếu code backend viết theo kiểu nghiệp dư:
     ```java
     // LỖ HỔNG NGHIỆP DƯ: Check-then-Act không có Lock
     StorageUnit unit = unitRepository.findById(id);
     if (unit.getStatus() == UnitStatus.AVAILABLE) {
         unit.setStatus(UnitStatus.RESERVED);
         unitRepository.save(unit);
     }
     ```
     Cả hai luồng (Thread A và Thread B) đều đọc thấy `AVAILABLE` trước khi luồng nào kịp `save()`. Kết quả: Hệ thống tạo ra 2 bản ghi `Reservation` cùng giữ 1 ô kho `U-204`!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn giải quyết bài toán Concurrency này bằng giải pháp nào? Pessimistic Locking (`PESSIMISTIC_WRITE`), Optimistic Locking (`@Version`), hay Database Unique Constraint? Tác động của cơ chế lock đó tới throughput và độ trễ của hệ thống ra sao?"**
2. **Cơn ác mộng Webhook / IPN Callback: Đứt gãy giao dịch phân tán (Distributed Partial Failure):**
   - _Kịch bản:_ Khách quét QR thành công trên cổng VNPAY, tiền trong tài khoản khách đã bị trừ 5.000.000đ. Cổng thanh toán gọi Webhook (IPN) về server của bạn. Đúng lúc đó, server của bạn bị sập nguồn, restart, hoặc mạng nội bộ chập chờn dẫn đến HTTP 504 Gateway Timeout.
   - _Hậu quả:_ Phía VNPAY báo thành công, nhưng database của bạn đơn vẫn là `PENDING_PAYMENT`. Hết 48h, Cron Job quét tự động chuyển đơn sang `EXPIRED` và mở ô kho cho người khác thuê. Sáng hôm sau khách hàng mang biên lai trừ tiền đến nhận kho thì ô kho đã có chủ mới!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn đã thiết kế cơ chế Đối soát chủ động (Reconciliation Job), Cơ chế Idempotent Consumer cho IPN, và Xử lý bù trừ (Compensation Transaction) như thế nào để xử lý trạng thái bất nhất giữa Hệ thống và Cổng thanh toán?"**
3. **Idempotency & Tấn công Replay Webhook:**
   - _Kịch bản:_ Cổng thanh toán gửi IPN 3 lần do cơ chế retry tự động khi mạng chậm. Nếu hệ thống không kiểm tra tính Idempotent (Idempotency Key), code xử lý IPN sẽ chạy 3 lần: sinh ra 3 hợp đồng, gửi 3 email xác nhận, hoặc ghi nhận doanh thu gấp 3 lần vào bảng báo cáo tài chính!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Entity PaymentTransaction của các bạn đảm bảo Idempotent thế nào? Có Unique Constraint trên mã giao dịch ngân hàng `transaction_id` không?"**

---

### 1.4. Top Câu hỏi Sát thủ Giảng viên chắc chắn sẽ hỏi

#### ❓ Câu hỏi 1:

> _"Tôi mở 2 tab trình duyệt trên 2 máy tính khác nhau, cùng đăng nhập 2 tài khoản, cùng bấm thanh toán ô kho U-101 tại đúng 1 tích tắc. Trình bày chính xác luồng dữ liệu dưới tầng Database: Transaction Isolation Level nào đang được dùng, câu lệnh SQL nào được bắn xuống, bảng nào bị lock và một trong hai người sẽ nhận mã lỗi HTTP gì?"_

- **Mục đích sâu xa của giảng viên:** Vạch trần ngay lập tức sinh viên học vẹt kiến trúc, chỉ biết gọi Spring Data JPA `save()` mà không hiểu bản chất Transaction trong RDBMS. Nếu sinh viên trả lời lúng túng hoặc bảo "Spring Boot tự xử lý", giảng viên sẽ đánh rớt ngay phần Kiến trúc Dữ liệu.

#### ❓ Câu hỏi 2:

> _"Nếu người dùng thanh toán thành công lúc 47 giờ 59 phút, tiền tài khoản ngân hàng đã trừ, nhưng Webhook của VNPAY bị trễ 5 phút do nghẽn mạng và gửi đến lúc 48 giờ 04 phút — tức là sau khi Cron Job hết hạn của các bạn đã vừa chạy quét xong và hủy đơn. Hệ thống của các bạn xử lý thảm họa này như thế nào?"_

- **Mục đích sâu xa của giảng viên:** Kiểm tra tư duy thiết kế hệ thống phân tán (Distributed Systems). Giảng viên muốn xem sinh viên có thiết kế trạng thái chuyển tiếp an toàn (State Machine Transition Rules) và cơ chế tự động mở lại giao dịch hoặc kích hoạt hoàn tiền tự động (Auto-refund Compensation) hay để mặc khách hàng mất tiền và mất kho.

---

# 2. FLOW 2: Storage Check-in and Handover Flow (Check-in & Bàn giao ô kho)

> **Mô tả danh nghĩa:** Khách hàng đến cơ sở trong vòng 10 ngày (`BR-CHK-05`), xuất trình CCCD (`BR-CHK-01`), kiểm tra hiện trạng thiết bị ô kho (`BR-CHK-02`), ký biên bản bàn giao điện tử (`BR-CHK-03`), nhận mã PIN 6 số (`BR-ACC-01`). Nếu ô kho lỗi do cơ sở, FM hủy và hoàn tiền 100% trong 3 ngày (`BR-CHK-06`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Khách đến cơ sở] ──(Đối chiếu CCCD)──> [Đồng kiểm ô kho] ──(Ký Handover) ──> [Cấp PIN]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Lỗ hổng Nghiệp vụ & Kịch bản Biên (Business Logic & Edge Cases)

1. **Vấn đề Hàng cấm & Hàng nguy hại (The Contraband & Hazardous Dilemma):**
   - _Kịch bản thực tế:_ Khách hàng chở đến cơ sở 20 thùng carton dán kín bên trong chứa: 500 quả pháo nổ, hoặc 200 bình ắc quy Lithium đã chai phòng nguy cơ nổ, hoặc 10 kg ma túy đá.
   - _Bẫy nghiệp vụ:_ Nhân viên bàn giao có quyền mở từng thùng đồ của khách ra kiểm tra không?
     - Nếu nhân viên **mở đồ kiểm tra**: Vi phạm quyền riêng tư và quyền bảo mật tài sản cá nhân. Khách hàng có thể kiện nhân viên làm trầy xước đồ quý giá, hoặc sau này mất đồ sẽ vu cáo nhân viên lấy trộm lúc mở kiểm tra.
     - Nếu nhân viên **không kiểm tra**: Kho hàng trở thành ổ chứa chất cháy nổ hoặc hàng phi pháp. Khi hỏa hoạn xảy ra thiêu rụi cả tòa nhà, hoặc công an khám xét bắt giữ, Ban Giám đốc và nhân viên trực có bị truy cứu trách nhiệm hình sự về tội "Chứa chấp, tàng trữ hàng cấm" không?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Trong biên bản bàn giao điện tử (HandoverRecord) và Điều khoản sử dụng, các bạn đã thiết kế cơ chế Tuyên bố miễn trừ trách nhiệm (Liability Disclaimer) và Cam kết chủng loại hàng hóa lưu trữ (Storage Goods Declaration) thế nào để bảo vệ nhân viên và pháp nhân công ty?"**
2. **Kịch bản "Người sống trong kho" (Living / Squatting in Self-Storage):**
   - _Kịch bản:_ Đây là vấn nạn kinh điển trên toàn thế giới trong ngành Self-Storage. Khách hàng thuê ô kho có máy lạnh, sau khi nhận mã PIN đã dọn nệm vào ngủ qua đêm, cắm nồi cơm điện trộm vào ổ cắm hành lang, biến ô kho thành phòng trọ giá siêu rẻ.
   - _Lỗ hổng:_ Hệ thống phần mềm quản lý việc ra vào (Access Control) có phát hiện được một mã PIN mở cửa vào ban đêm nhưng không có sự kiện mở cửa đi ra (Exit Event) trong suốt 12 tiếng liên tục không?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Hệ thống của các bạn chỉ lưu trữ mã PIN thụ động hay có logic phân tích hành vi truy cập bất thường (Access Anomaly Detection) để cảnh báo cho nhân viên trực ca?"**
3. **Ủy quyền nhận kho & Nhận kho hộ (Proxy Check-in & Subletting):**
   - _Kịch bản:_ Người ký hợp đồng điện tử là anh Nam (đang công tác nước ngoài), nhưng người mang đồ đến nhận kho lại là bác tài xế xe tải chở hàng thuê. Bác tài xế không có CCCD của anh Nam, chỉ có tin nhắn Zalo chuyển tiếp mã đơn.
   - _Lỗ hổng:_ Nếu nhân viên từ chối: Bác tài xế và xe tải 5 tấn bị mắc kẹt tại bãi xe cơ sở, phát sinh chi phí phạt giờ đỗ xe hàng triệu đồng, khách chửi bới. Nếu nhân viên đồng ý bàn giao: Sau này anh Nam phủ nhận, tố cáo nhân viên tự ý giao quyền mở kho chứa hàng giá trị cho người lạ.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Quy trình Check-in trên phần mềm có tính năng Ủy quyền nhận kho số (Digital Proxy Authorization) với xác thực OTP/eKYC của chính chủ hay hoàn toàn phó mặc cho nhân viên trực tự cảm tính quyết định?"**

---

### 2.2. Bẫy Pháp lý & Kế toán Dòng tiền (Financial & Legal Risks)

1. **Bản chất Hợp đồng: Hợp đồng Thuê địa điểm (Lease) hay Hợp đồng Gửi giữ tài sản (Bailment)?**
   - _Phân tích pháp lý tối quan trọng:_
     - Nếu là **Hợp đồng gửi giữ tài sản** (Điều 554 Bộ luật Dân sự): Doanh nghiệp nhận bảo quản tài sản và PHẢI BỒI THƯỜNG TOÀN BỘ GIÁ TRỊ HÀNG HÓA nếu mất mát, hư hỏng.
     - Nếu là **Hợp đồng cho thuê địa điểm/mặt bằng tự quản**: Doanh nghiệp chỉ cho thuê không gian 4 bức tường và ổ khóa; khách hàng tự quản lý đồ bên trong, doanh nghiệp không chịu trách nhiệm về nội dung đồ đạc.
   - _Bẫy chết người:_ Nếu biên bản HandoverRecord của các bạn cho phép nhân viên ghi nhận danh sách đồ của khách vào hệ thống ("Khách gửi 1 tủ lạnh, 2 tivi Sony..."), tòa án sẽ phán quyết đây là HỢP ĐỒNG GỬI GIỮ! Khi xảy ra cháy nổ hoặc mất cắp, doanh nghiệp sẽ phải đền tiền tỷ thay vì chỉ chịu trách nhiệm về cơ sở hạ tầng.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Mô hình dữ liệu và quy trình bàn giao của các bạn được thiết kế thế nào để không biến hệ thống Self-Storage thành một Dịch vụ Gửi giữ chịu rủi ro bồi thường vô hạn?"**
2. **Ký biên bản bàn giao điện tử (Electronic Handover Signature) có giá trị trước Tòa không?**
   - _Phân tích kỹ thuật & pháp lý:_ Sinh viên rất thích làm tính năng "Khách vẽ chữ ký nguệch ngoạc lên màn hình cảm ứng rồi lưu thành file PNG `signature.png` vào database".
   - _Vấn đề:_ Theo Luật Giao dịch điện tử 2023, một bức ảnh vẽ tay lưu trong database không có chữ ký số (Digital Signature), không gắn dấu thời gian (Timestamp Authority), và nhân viên IT có thể vào database đổi file ảnh bất cứ lúc nào. Khi ra Tòa, chứng cứ này bị tuyên vô giá trị vì không đảm bảo tính toàn vẹn (Integrity) và tính chống chối bỏ (Non-repudiation).
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn bảo vệ tính pháp lý của biên bản bàn giao điện tử bằng cách nào? Có cơ chế băm dữ liệu (SHA-256 Hashing), lưu trữ bất biến (Immutable Audit Log) hay ký số OTP không?"**

---

### 2.3. Bẫy Kỹ thuật, Dữ liệu & Xung đột (Concurrency, State Machine & Tech)

1. **Sập mạng Internet tại cơ sở kho (Offline Operation & Hardware Fallback):**
   - _Kịch bản:_ Hầu hết các cơ sở kho tự quản đặt tại tầng hầm hoặc nhà kho biệt lập, sóng viễn thông và internet rất chập chờn. Đúng lúc khách đến bàn giao, mạng cáp quang bị đứt, máy tính nhân viên mất kết nối tới Backend Cloud.
   - _Vấn đề kỹ thuật:_ Khóa cửa ô kho là khóa thông minh (Smart Lock) kết nối Internet hay khóa độc lập? Nếu Backend sập, làm sao sinh được mã PIN 6 số mà ổ khóa vật lý ở cửa kho hiểu được?
     - Nếu hệ thống bắt buộc phải có Internet mới cấp được PIN: Toàn bộ cơ sở bị đình trệ, khách hàng đứng chờ ngoài trời nắng bức xúc.
     - Nếu khóa chạy thuật toán Offline (như mã TOTP hoặc Master Algorithm mã hóa theo thời gian): Làm sao Backend đồng bộ được trạng thái khi có mạng trở lại?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Kiến trúc phần mềm của các bạn xử lý kịch bản Mất kết nối ngoại vi (Network Partitioning / Offline-first Capability) giữa Phần mềm máy chủ và Thiết bị IoT thực tế tại cơ sở ra sao?"**
2. **Xung đột giữa Cron Job No-Show và Thao tác Bàn giao tại Quầy:**
   - _Kịch bản:_ Quy tắc `BR-CHK-05` quy định sau 10 ngày không đến nhận kho sẽ bị tính là `NO_SHOW` và hủy cọc. Đúng 23:59:59 của ngày thứ 10, khách hàng vội vã chạy đến quầy. Nhân viên bấm nút "Hoàn tất bàn giao" lúc 00:00:01 ngày thứ 11. Cùng tích tắc đó, Cron Job đêm chạy quét hợp đồng quá 10 ngày chưa check-in và bắn lệnh cập nhật `status = NO_SHOW`.
   - _Hậu quả:_ Giao dịch của nhân viên bị lỗi (hoặc ngược lại, hợp đồng vừa chuyển `ACTIVE` vừa bị đánh dấu `NO_SHOW`), mã PIN vừa sinh ra lập tức bị vô hiệu hóa.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"State Machine của Entity RentalContract xử lý kịch bản tranh chấp trạng thái (State Transition Race Condition) này bằng cơ chế khóa bi quan hay optimistic locking thế nào?"**

---

### 2.4. Top Câu hỏi Sát thủ Giảng viên chắc chắn sẽ hỏi

#### ❓ Câu hỏi 1:

> _"Tại bước bàn giao kho, nếu nhân viên và khách hàng phát hiện ô kho bị ẩm mốc hoặc rò rỉ nước từ trần nhà, theo quy tắc BR-CHK-06 cơ sở phải hoàn tiền 100% trong 3 ngày. Nhưng nếu lúc đó cơ sở còn 5 ô kho khác cùng loại đang trống hoàn toàn, tại sao hệ thống không cho phép 'Đổi ô kho ngay lập tức tại quầy' mà bắt khách hàng hủy hợp đồng, chờ 3 ngày lấy lại tiền rồi đặt lại từ đầu? Trải nghiệm khách hàng và tối ưu doanh thu ở đâu trong thiết kế này?"_

- **Mục đích sâu xa của giảng viên:** Bắt bài sự cứng nhắc và thiếu tư duy sản phẩm thực tế của nhóm sinh viên. Một hệ thống phần mềm thương mại thực chiến phải hỗ trợ nghiệp vụ "In-flight Unit Swap / Instant Reallocation" thay vì bắt khách hàng chịu quy trình hoàn tiền phiền toái.

#### ❓ Câu hỏi 2:

> _"Mã PIN 6 số cấp cho khách hàng được sinh ra và mã hóa thế nào trong cơ sở dữ liệu? Nếu nhân viên quản trị cơ sở dữ liệu (Database Administrator - DBA) xem trộm bảng AccessCredential, họ có đọc được mã PIN của khách để lẻn vào mở trộm kho hay không? Hệ thống đã áp dụng chuẩn mã hóa nào (Bcrypt, Argon2, hay lưu Plaintext)?"_

- **Mục đích sâu xa của giảng viên:** Đánh vào tiêu chuẩn bảo mật dữ liệu định danh (Credential Security). Sinh viên thường lưu mã PIN dạng chuỗi rõ ràng (Plaintext) để tiện gửi email/hiển thị cho khách xem lại mà không hề biết mình đã vi phạm nghiêm trọng nguyên tắc Zero-Trust Security.

---

# 3. FLOW 3: Rented Storage Unit Management Flow (Quản lý kho đang thuê & Trả kho)

> **Mô tả danh nghĩa:** Khách sử dụng kho bằng mã PIN/QR, gửi yêu cầu trả kho trước tối thiểu 30 ngày (`BR-RET-01`), trả sớm hoàn 100% tiền thuê thừa sau khi phạt cọc Deposit và trừ hư hại (`BR-RET-06`), nhân viên nghiệm thu hiện trạng sạch sẽ không hư hại (`BR-RET-03`), FM quyết toán hoàn tiền trừ hư hại/nợ (`BR-RET-04`), hoàn tiền sau 7 ngày làm việc (`BR-RET-05`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Khách báo trả kho trước 30d] ──> [Nghiệm thu dọn sạch] ──> [Quyết toán cọc] ──> [Đóng]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1. Lỗ hổng Nghiệp vụ & Kịch bản Biên (Business Logic & Edge Cases)

1. **Vấn nạn "Bỏ lại rác thải độc hại / Xà bần xây dựng" (Hazardous Waste Abandonment):**
   - _Kịch bản thực tế:_ Khách hàng thuê kho chứa đồ đạc gia đình. Khi hết hạn, khách dọn đi nhưng để lại 3 bộ sofa rách nát, sơn tường hóa chất và 1 tấn xà bần phế thải. Khách bấm "Hoàn tất trả kho" trên app rồi biến mất.
   - _Lỗ hổng tài chính:_ Chi phí gọi xe môi trường đô thị đến bốc dỡ và xử lý rác thải cồng kềnh là **10.000.000 VNĐ**. Tiền đặt cọc của khách chỉ có **1.500.000 VNĐ** (tương đương 1 tháng thuê).
   - _Bẫy thực tế:_ Sau khi FM nghiệm thu và trừ hết 1.500.000đ tiền cọc, hợp đồng vẫn bị **ÂM 8.500.000 VNĐ**. Khách hàng đã tắt máy, khóa tài khoản, không quay lại. Hệ thống của các bạn xử lý con số âm này thế nào?
     - Ghi nhận nợ xấu (Bad Debt)?
     - Có quy trình chuyển hồ sơ khởi kiện dân sự hoặc gửi báo cáo lịch sử tín dụng (CIC) không?
     - Hay hệ thống chỉ biết ghi một dòng âm tiền vào database rồi để đấy vĩnh viễn?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn thiết kế bài toán xử lý chi phí vượt trần tiền cọc (Excess Damage Recovery) thế nào khi tiền cọc không đủ bù đắp thiệt hại thực tế?"**
2. **Khách hàng thông báo trả kho trước 30 ngày nhưng... không chịu dọn đồ ra:**
   - _Kịch bản:_ Ngày 01/10 khách gửi yêu cầu trả kho vào ngày 31/10. Hệ thống đã lên lịch nghiệm thu và mở bán ô kho này cho khách mới từ ngày 15/11 (sau 15 ngày đệm `BR-AVL-02`). Đến ngày 31/10, nhân viên đến kiểm tra thì thấy kho vẫn khóa chặt và đầy ắp đồ đạc. Khách hàng bảo: _"Tôi bận chưa dọn kịp, cho tôi để thêm 1 tuần nữa"_.
   - _Hậu quả dây chuyền:_ Hợp đồng cũ chưa thể `CLOSED`, ô kho không thể chuyển sang `CLEANING`, và hợp đồng mới của khách tiếp theo vào ngày 15/11 chắc chắn bị vỡ trận!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"State Machine của các bạn có trạng thái ngoại lệ 'Trả kho thất bại do chưa giải phóng mặt bằng' không? Quy trình phạt và hủy lịch đặt tiếp theo được phần mềm kích hoạt tự động ra sao?"**

---

### 3.2. Bẫy Pháp lý & Kế toán Dòng tiền (Financial & Legal Risks)

1. **Rủi ro Rửa tiền (AML - Anti-Money Laundering) khi Hoàn tiền Cọc (Deposit Refund):**
   - _Kịch bản:_ Kẻ xấu thuê ô kho ngắn hạn, thanh toán 50.000.000đ tiền thuê và cọc bằng Thẻ tín dụng đánh cắp (Stolen Credit Card). Sau 1 tháng, đối tượng báo trả kho và yêu cầu công ty chuyển khoản tiền hoàn cọc vào một tài khoản ngân hàng nội địa đứng tên một người hoàn toàn khác.
   - _Hậu quả pháp lý:_ Doanh nghiệp vô tình trở thành công cụ rửa tiền cho tội phạm mạng. Khi chủ thẻ thực sự khiếu nại (Chargeback), ngân hàng sẽ trừ lại 50.000.000đ từ tài khoản công ty, trong khi công ty đã chuyển tiền thật cho kẻ lừa đảo!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Chính sách hoàn tiền của các bạn có ràng buộc nguyên tắc 'Hoàn tiền về đúng nguồn gốc thanh toán ban đầu (Refund to Original Payment Method)' để tuân thủ quy định phòng chống rửa tiền quốc tế hay không?"**
2. **Bẫy tranh chấp mức khấu trừ hư hỏng (Damage Assessment Disputes):**
   - _Kịch bản:_ Khi nghiệm thu, nhân viên ghi nhận: _"Tường bị thủng 1 lỗ, khấu trừ 2.000.000đ tiền cọc"_. Khách hàng không đồng ý, khẳng định lỗ thủng này đã có từ trước khi nhận kho và nhân viên cố tình gài bẫy để ăn chặn tiền cọc.
   - _Lỗ hổng chứng cứ:_ Nếu hệ thống chỉ lưu text mô tả mà không có hình ảnh hiện trạng được ký số lúc Check-in để đối chiếu với ảnh chụp lúc Return, doanh nghiệp sẽ cầm chắc phần thua khi bị khách kiện ra Hội bảo vệ người tiêu dùng.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Mô hình dữ liệu của các bạn lưu trữ bằng chứng kiểm định (Inspection Audit Trail) như thế nào? Hai thực thể HandoverRecord (Flow 2) và ReturnInspection (Flow 3) có liên kết dữ liệu ảnh để so sánh sai khác (Visual Diff) hay không?"**

---

### 3.3. Bẫy Kỹ thuật, Dữ liệu & Xung đột (Concurrency, State Machine & Tech)

1. **Khách đã bấm Trả kho thành công nhưng Mã PIN vẫn mở được cửa:**
   - _Kịch bản:_ Khách hàng hoàn tất thủ tục trả kho lúc 17:00, hợp đồng chuyển sang `CLOSED`, mã PIN trên database chuyển sang `REVOKED`. Tuy nhiên, lệnh revoke gửi xuống bộ điều khiển khóa thông minh tại cơ sở bị timeout do mất kết nối MQTT/WebSocket.
   - _Hậu quả:_ Tối hôm đó, khách quay lại vẫn dùng mã PIN cũ mở cửa ô kho. Nếu ô kho đó nhân viên đã dọn sạch và đang để tạm đồ của cơ sở, tài sản sẽ bị mất trộm mà không để lại dấu vết hợp lệ.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn kiểm soát trạng thái thực tế của Hardware Lock thế nào? Có cơ chế xác nhận 2 chiều (Hardware Acknowledgment Handshake) trước khi chuyển trạng thái Hợp đồng sang CLOSED hay chỉ cập nhật dữ liệu ảo trên web?"**
2. **Race condition giữa Cron Job Tự động Gia hạn và Yêu cầu Trả kho lúc nửa đêm:**
   - _Kịch bản:_ Hợp đồng hết hạn vào ngày 31/10. Khách hàng vào web bấm "Xác nhận trả kho" lúc 23:59:50 ngày 31/10. Đúng 00:00:00 ngày 01/11, Cron Job quét hợp đồng quá hạn hoặc tự động gia hạn kích hoạt.
   - _Hậu quả:_ Giao dịch trả kho đang thực hiện thì bị Cron Job chen ngang, tự động phạt quá hạn hoặc trừ tiền thẻ tín dụng của khách để gia hạn thêm 1 tháng!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Tính toàn vẹn của State Machine khi có sự cạnh tranh giữa User Action và Background Scheduled Job được bảo vệ bằng cơ chế phân tán nào?"**

---

### 3.4. Top Câu hỏi Sát thủ Giảng viên chắc chắn sẽ hỏi

#### ❓ Câu hỏi 1:

> _"Quy tắc BR-RET-06 nêu rõ: Khách hàng trả kho trước hạn sẽ KHÔNG ĐƯỢC HOÀN LẠI TIỀN THUÊ cho khoảng thời gian chưa sử dụng (Hoàn 0%). Nếu khách hàng thuê 12 tháng, trả trước 24 triệu, mới ở được 1 tháng có việc đột xuất phải trả kho, công ty nuốt trọn 11 tháng tiền thuê (22 triệu) của họ. Dưới góc độ Luật Bảo vệ Quyền lợi Người tiêu dùng và tính công bằng thương mại, điều khoản này có bị Tòa án tuyên là 'Điều khoản vô hiệu do áp đặt bất lợi quá mức cho người tiêu dùng' hay không? Hệ thống các bạn có cơ chế ngoại lệ nào để Manager duyệt hoàn tiền nhân đạo không?"_

- **Mục đích sâu xa của giảng viên:** Thử thách khả năng nhìn nhận rủi ro pháp lý và sự linh hoạt của hệ thống. Một phần mềm doanh nghiệp tốt không bao giờ "đóng cứng" một chính sách tàn nhẫn mà luôn phải bảo đảm tính công bằng thương mại và tuân thủ Luật Bảo vệ Quyền lợi Người tiêu dùng.
- **Câu trả lời mẫu xuất sắc đạt điểm tuyệt đối trước Hội đồng:**
  \*"Dạ thưa Thầy, nhóm em đã nhận thức rất rõ rủi ro pháp lý theo Điều 25 Luật Bảo vệ Quyền lợi Người tiêu dùng. Do đó, nhóm đã hoàn thiện quy tắc `BR-RET-06` theo mô hình **Công bằng Thương mại (Win-Win Settlement)**:
  1. **Bảo vệ quyền lợi khách hàng:** Hệ thống **hoàn trả 100% tiền thuê của các tháng/ngày chưa sử dụng** (`return.early_refund_rate = 100%`), tuyệt đối không giữ trắng tiền dịch vụ chưa cung ứng.
  2. **Bảo vệ lợi ích doanh nghiệp:** Khách hàng đơn phương chấm dứt hợp đồng sớm sẽ bị **phạt 100% tiền cọc Deposit** (tương đương 1 tháng tiền thuê). Đây là khoản bồi thường thiệt hại ấn định trước (Liquidated Damages) hoàn toàn hợp pháp nhằm bù đắp rủi ro phòng trống và chi phí vệ sinh/tìm khách thuê mới.
  3. **Bảo toàn tài sản cơ sở:** Nếu Staff nghiệm thu phát hiện hư hỏng (cửa, khóa, vách) hoặc xả rác bẩn do lỗi khách hàng, chi phí sửa chữa theo danh mục niêm yết của BOM sẽ được khấu trừ trực tiếp vào số tiền thuê hoàn lại trước khi chuyển tiền."\*

#### ❓ Câu hỏi 2:

> _"Quy trình hoàn tiền cọc mất 7 ngày làm việc (BR-RET-05). Trong 7 ngày đó, tiền của khách nằm ở đâu? Trên hệ thống phần mềm, ai là người bấm nút chuyển tiền? Hệ thống tự động gọi API Ngân hàng/Cổng thanh toán để chuyển tiền hay kế toán phải ra ngân hàng nộp ủy nhiệm chi thủ công? Giải thích luồng đối soát giữa Kế toán và Phần mềm?"_

- **Mục đích sâu xa của giảng viên:** Đánh vào khoảng trống giữa "phần mềm mô phỏng của sinh viên" và "vận hành ngân hàng thực tế". Sinh viên hay nghĩ cứ bấm nút "Duyệt hoàn tiền" là tiền tự bay về ví khách hàng một cách thần kỳ.

---

# 4. FLOW 4: Business Rules, Fee Management & Revenue Monitoring Flow (Quy định, Phí & Doanh thu)

> **Mô tả danh nghĩa:** BOM là vai trò duy nhất cập nhật chính sách và biểu giá (`BR-GEN-01`), áp dụng phiên bản không hồi tố (`BR-GEN-02`), định giá theo đơn giá m² từng cơ sở (`BR-GEN-05`), xem báo cáo KPI doanh thu và tỷ lệ lấp đầy làm tròn 1.000 VNĐ (`BR-GEN-04`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [BOM cập nhật Giá / Policy] ──> [Sinh Policy Version mới] ──> [Báo cáo Doanh thu / KPI]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1. Lỗ hổng Nghiệp vụ & Kịch bản Biên (Business Logic & Edge Cases)

1. **Hiệu ứng Biến động Giá trong lúc Đang Đặt hàng (In-flight Price Flip):**
   - _Kịch bản:_ BOM ban hành biểu giá mới tăng giá thuê ô kho loại L từ 200.000đ/m² lên 300.000đ/m² lúc 10:00:00 sáng. Khách hàng mở web lúc 09:58:00 nhìn thấy giá 200.000đ/m² và tiến hành điền thông tin. Đến 10:01:00 khách mới bấm nút "Chuyển sang Cổng thanh toán".
   - _Lỗ hổng:_ Hệ thống sẽ tính tiền theo giá cũ hay giá mới?
     - Nếu tính giá mới: Khi sang cổng thanh toán, khách thấy số tiền tăng vọt từ 2 triệu lên 3 triệu. Khách tố cáo doanh nghiệp lừa đảo kiểu "Treo đầu dê bán thịt chó" (Bait-and-Switch).
     - Nếu tính giá cũ: Làm sao hệ thống biết giá cũ vẫn hợp lệ mà không bị hacker lợi dụng sửa dữ liệu payload gửi lên?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Khái niệm Cart Price Lock / Quotation TTL (Time-To-Live) của các bạn được thiết kế thế nào? Khi một phiên đặt chỗ được mở ra, giá được bảo lưu trong bao lâu trước khi buộc phải refresh lại theo Policy mới nhất?"**
2. **Xung đột Giá khi Gia hạn Hợp đồng (Renewal Pricing Paradox):**
   - _Kịch bản:_ Khách hàng ký hợp đồng 1 năm vào tháng 01/2026 với giá ưu đãi 1.000.000đ/tháng. Đến tháng 06/2026, BOM cập nhật biểu giá tăng lên 1.800.000đ/tháng. Đến tháng 12/2026, hợp đồng đến kỳ gia hạn.
   - _Lỗ hổng logic:_ Theo quy tắc `BR-GEN-02`: _"Mỗi lần Renewal dùng giá và phiên bản chính sách đang hiệu lực tại thời điểm gia hạn cho kỳ mới"_.
     - Khách hàng không hề biết giá đã tăng 80% vì không có ai báo cho họ.
     - Khi khách bấm gia hạn (hoặc hệ thống tự động gia hạn), tài khoản bị trừ 1.800.000đ. Khách hàng làm loạn, từ chối thanh toán và khiếu nại.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Quy trình thông báo thay đổi biểu giá đối với hợp đồng tái tục (Price Change Advance Notice SLA) có được tích hợp vào luồng gửi email tự động của Flow 6 trước khi áp giá mới hay không?"**

---

### 4.2. Bẫy Pháp lý & Kế toán Dòng tiền (Financial & Legal Risks)

1. **Sai lầm Kế toán Chết người: Nhầm lẫn giữa Dòng tiền (Cash Inflow) và Doanh thu Thực nhận (Accrued Revenue):**
   - _Tình huống kinh điển:_ Khách hàng thuê ô kho 12 tháng, nộp 1 cục 24.000.000 VNĐ vào ngày 01/01/2026.
   - _Câu hỏi kiểm tra:_ Trên Dashboard KPI của BOM, doanh thu tháng 01/2026 hiển thị con số nào? **24.000.000đ** hay **2.000.000đ**?
   - _Hậu quả nếu sinh viên trả lời 24 triệu:_ **CỰC KỲ NGUY HIỂM VỀ KẾ TOÁN TÀI CHÍNH!**
     - Theo Chuẩn mực Kế toán Việt Nam (VAS 14) và Quốc tế (IFRS 15), 24 triệu nộp vào ngày 01/01 chỉ là **DÒNG TIỀN (Cash Flow)**.
     - Doanh nghiệp chỉ được ghi nhận **Doanh thu thực tế (Earned Revenue)** là 2.000.000đ mỗi tháng khi tháng đó kết thúc và dịch vụ kho đã được cung ứng hoàn tất.
     - 22.000.000đ còn lại là **"Doanh thu chưa thực hiện (Unearned Revenue / Nợ phải trả)"**. Nếu công ty phá sản hoặc khách đòi hủy hợp đồng hợp pháp ở tháng 2, công ty phải nợ tiền khách, số tiền đó không phải là lãi của công ty!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn thiết kế báo cáo tài chính cho BOM theo phương pháp Kế toán Tiền mặt (Cash Accounting) nghiệp dư hay Kế toán Dồn tích (Accrual Accounting) chuẩn doanh nghiệp?"**
2. **Vấn đề Làm tròn tiền tệ 1.000 VNĐ (BR-GEN-04) và Lệch sổ cái:**
   - _Kịch bản:_ Quy tắc `BR-GEN-04` yêu cầu làm tròn lên đến 1.000 VNĐ cho từng line item. Nếu một hợp đồng có 10 loại phí phụ (phí kho, phí bảo hiểm, phí dịch vụ xe đẩy, phí mã PIN...), việc làm tròn từng line item rồi mới cộng tổng sẽ tạo ra chênh lệch (Rounding Discrepancy) so với việc cộng tổng rồi mới làm tròn.
   - _Hậu quả:_ Khi kết nối với hệ thống Hóa đơn điện tử của Tổng cục Thuế, số thuế GTGT 8% hoặc 10% bị lệch đúng 1 đồng hoặc vài trăm đồng, hệ thống thuế sẽ **từ chối cấp mã hóa đơn điện tử** vì không khớp bài toán kiểm tra số học!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Thuật toán làm tròn tiền tệ và khớp số liệu hóa đơn thuế (Tax Reconciliation) của các bạn được xử lý ở tầng code hay tầng CSDL?"**

---

### 4.3. Bẫy Kỹ thuật, Dữ liệu & Xung đột (Concurrency, State Machine & Tech)

1. **Dashboard Analytics làm treo đứng Cơ sở dữ liệu Vận hành (OLTP vs OLAP):**
   - _Kịch bản:_ BOM mở trang Dashboard KPI xem biểu đồ doanh thu theo ngày, tỷ lệ lấp đầy toàn bộ 10 cơ sở, phân tích churn rate trong 3 năm. Câu query thực hiện `JOIN` 8 bảng lớn (`RentalContract`, `PaymentTransaction`, `StorageUnit`, `HandoverRecord`, `ReturnInspection`...), thực hiện `GROUP BY`, `SUM()`, `AVG()` trên hàng triệu dòng dữ liệu.
   - _Hậu quả kỹ thuật:_ Database SQL Server bị chiếm dụng 100% CPU, bảng dữ liệu bị khóa (Table Lock / Deadlock). Đúng lúc đó khách hàng ngoài quầy không thể check-in, app mobile của khách báo lỗi kết nối.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn có hiểu về ranh giới giữa Xử lý Giao dịch (OLTP) và Phân tích Dữ liệu (OLAP)? Có giải pháp caching (Redis), Materialized View, Read Replica hay chạy báo cáo bất đồng bộ (Async Report Generation) không?"**
2. **Bảo toàn Snapshot Chính sách (Policy Snapshot Immutability):**
   - _Kịch bản:_ Khi BOM sửa một tham số chính sách (ví dụ phí phạt quá hạn tăng từ 10% lên 15%), làm sao đảm bảo các hợp đồng đang chạy vẫn giữ nguyên snapshot 10% như lúc ký kết?
   - _Bẫy kỹ thuật:_ Nếu trong bảng `RentalContract` chỉ lưu khóa ngoại `policy_id` trỏ sang bảng `Policy`, khi BOM sửa dòng record đó trong bảng `Policy`, toàn bộ hợp đồng cũ trong lịch sử sẽ bị nhảy số tiền phạt theo!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn hiện thực hóa cơ chế Immutable Snapshot như thế nào? Bằng bảng trung gian `ContractPolicySnapshot`, clone dòng policy với version mới, hay lưu JSON document snapshot trong bảng contract?"**

---

### 4.4. Top Câu hỏi Sát thủ Giảng viên chắc chắn sẽ hỏi

#### ❓ Câu hỏi 1:

> _"Em hãy mở màn hình Báo cáo Doanh thu của BOM lên cho Hội đồng xem. Chỉ cho tôi thấy công thức tính chỉ số 'Tỷ lệ lấp đầy (Occupancy Rate)'. Nếu một cơ sở có 100 ô kho, trong đó 10 ô đang dọn dẹp (CLEANING), 5 ô đang bảo trì hỏng khóa (MAINTENANCE), 80 ô đang có khách ở (OCCUPIED), và 5 ô đang trống (AVAILABLE), thì Tỷ lệ lấp đầy là 80% hay 80/85 = 94.1%? Nếu tính sai mẫu số, báo cáo gửi lên Hội đồng Quản trị sẽ bị sai lệch nghiêm trọng về hiệu quả khai thác tài sản!"_

- **Mục đích sâu xa của giảng viên:** Kiểm tra định nghĩa nghiệp vụ chính xác về công suất vận hành (Operational Capacity vs Nominal Capacity) trong ngành bất động sản cho thuê.

#### ❓ Câu hỏi 2:

> _"Khi BOM thay đổi đơn giá thuê m² của một cơ sở, tại sao hệ thống không cho phép áp dụng hiệu lực hồi tố về quá khứ (`effective_from >= CURRENT_DATE` theo BR-GEN-01)? Nếu lỡ tay BOM nhập nhầm giá 100.000đ thành 10.000đ và bấm Xác nhận lúc nửa đêm, sau đó phát hiện ra lúc 8 giờ sáng, quy trình khắc phục sự cố dữ liệu (Data Incident Rollback) này được hệ thống hỗ trợ ra sao?"_

- **Mục đích sâu xa của giảng viên:** Đánh vào quy trình kiểm soát thay đổi (Change Management & Maker-Checker Pattern) trong các hệ thống doanh nghiệp lớn. Một tham số tài chính nhạy cảm không bao giờ nên do 1 người tự bấm đổi mà không có quy trình phê duyệt kép (Dual Authorization).

---

# 5. FLOW 5: Facility Storage & Staff Management Flow (Quản lý cơ sở, Ô kho & Nhân sự)

> **Mô tả danh nghĩa:** BOM tạo cơ sở (`FAC-XX`), phân quyền cho FM; FM quản lý danh mục ô kho, sơ đồ mặt bằng, phân công ca trực hàng tuần cho nhân viên (không trùng ca); nhân viên điểm danh nhận ca và kiểm kê hiện trạng định kỳ.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [BOM tạo Facility] ──> [FM tạo Sơ đồ Ô kho & Phân ca] ──> [Staff Nhận ca & Kiểm kê]   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.1. Lỗ hổng Nghiệp vụ & Kịch bản Biên (Business Logic & Edge Cases)

1. **Xóa hoặc Vô hiệu hóa Ô kho / Cơ sở đang có Hợp đồng Hoạt động (Cascade Delete Trap):**
   - _Kịch bản:_ FM thao tác trên màn hình danh mục ô kho, thấy ô `U-302` đã cũ nên bấm "Xóa" hoặc chuyển sang trạng thái `INACTIVE`. Nhưng thực tế ô `U-302` đang có khách thuê chứa đầy tài sản giá trị bên trong và hợp đồng còn hiệu lực 6 tháng nữa.
   - _Lỗ hổng:_ Hệ thống xử lý thế nào?
     - Nếu hệ thống cho phép sửa/xóa: Bảng `RentalContract` bị mồ côi khóa ngoại (Orphaned Record), khách hàng đăng nhập app không tìm thấy ô kho của mình, mã PIN bị lỗi khóa cửa.
     - Nếu hệ thống chặn bằng Foreign Key: Giao diện bắn ra lỗi màn hình đỏ `Internal Server Error (500) Foreign Key Constraint Violation` xấu xí, người dùng không hiểu vì sao không xóa được.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn áp dụng chiến lược Xóa mềm (Soft Delete) và Ràng buộc Nghiệp vụ Chặn trước (Pre-condition Guard Clauses) như thế nào để ngăn chặn việc phá hủy tính toàn vẹn dữ liệu vận hành?"**
2. **Khoảng trống Ca trực & Lỗ hổng An ninh Nửa đêm (Shift Coverage Gaps):**
   - _Kịch bản:_ Cơ sở Self-Storage mở cửa 24/7 cho khách dùng mã PIN vào lấy đồ bất kể ngày đêm. Tuy nhiên, FM chỉ xếp lịch phân ca trực cho nhân viên từ 07:00 đến 22:00. Khung giờ từ 22:00 đến 07:00 sáng hôm sau là "Ca trống" (Zero-Staffing).
   - _Hậu quả thực tế:_ Vào lúc 02:00 sáng, một ô kho bị chập điện phát hỏa, còi báo động réo vang, hoặc có kẻ trộm đột nhập cạy khóa cửa kho của khách. Hệ thống không có nhân viên trực tiếp nhận cảnh báo.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Hệ thống phân ca của các bạn có quy tắc cảnh báo 'Lỗ hổng ca trực (Uncovered Shift Warning)' đối với các cơ sở hoạt động 24/7 hay hoàn toàn cho phép FM muốn xếp thế nào thì xếp?"**
3. **Hiện tượng "Cho thuê chui / Gian lận bỏ túi riêng" (Under-the-table Rental Fraud):**
   - _Kịch bản gian lận kinh điển:_ Nhân viên trực cơ sở thấy ô `U-105` trên hệ thống đang báo `AVAILABLE` (trống). Một khách vãng lai đến quầy hỏi thuê gấp 3 ngày để chứa đồ hội chợ. Nhân viên không nhập thông tin lên phần mềm, tự cầm tiền mặt 1.000.000đ của khách bỏ vào túi riêng, dùng chìa khóa vạn năng (Master Key) mở ô `U-105` cho khách dùng. Sau 3 ngày khách đi, kho lại sạch sẽ như chưa có chuyện gì xảy ra.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Hệ thống phần mềm của các bạn có cơ chế Đối soát Cảm biến Cửa (IoT Door Sensor vs Software Status) để phát hiện ra một ô kho đang AVAILABLE nhưng lại có lịch sử mở cửa vật lý hay không?"**

---

### 5.2. Bẫy Pháp lý & Kế toán Dòng tiền (Financial & Legal Risks)

1. **Rủi ro Vi phạm Bộ luật Lao động về Giờ làm việc & Ca trực:**
   - _Phân tích pháp lý:_ Theo Điều 105 Bộ luật Lao động 2019, thời giờ làm việc bình thường không quá 8 giờ trong 1 ngày và không quá 48 giờ trong 1 tuần; làm ca đêm phải được tính phụ cấp đặc thù.
   - _Lỗ hổng:_ Nếu FM trên hệ thống xếp cho một nhân viên làm liên tục 2 ca liền nhau (16 tiếng/ngày), hoặc xếp 7 ngày liên tục không có ngày nghỉ tuần.
   - _Hậu quả:_ Doanh nghiệp vi phạm pháp luật lao động, bị thanh tra phạt tiền. Hơn nữa, nhân viên kiệt sức ngủ gật trong ca trực dẫn đến sự cố cháy nổ thì doanh nghiệp không thể đẩy trách nhiệm cho nhân viên được.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Module quản lý nhân sự (Staff Scheduling) có tích hợp các ràng buộc nghiệp vụ lao động (Labor Law Validation Rules: Max hours/day, Min rest between shifts) hay chỉ là một cuốn sổ tay xếp lịch thô sơ?"**
2. **Thu hồi Quyền hạn Tức thì khi Sa thải Nhân viên (Emergency Privilege Revocation):**
   - _Kịch bản:_ Lúc 14:00, phát hiện nhân viên A có hành vi trộm cắp tài sản của khách. FM quyết định đuổi việc ngay lập tức và bấm nút "Khóa tài khoản" nhân viên A trên web.
   - _Bẫy công nghệ JWT:_ Nếu các bạn dùng chuẩn **JSON Web Token (JWT) Stateless** thông thường không lưu trạng thái trên server, Token đã cấp cho nhân viên A trên điện thoại vẫn còn hạn dùng tới 24 giờ nữa! Nhân viên A vẫn có thể dùng Token đó gọi API mở cửa các ô kho, xuất dữ liệu khách hàng hoặc xóa log để tẩu tán chứng cứ!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn hiện thực hóa cơ chế Thu hồi Token tức thì (Instant Token Invalidation / Distributed Blacklist qua Redis) như thế nào để đối phó với rủi ro an ninh nội bộ?"**

---

### 5.3. Bẫy Kỹ thuật, Dữ liệu & Xung đột (Concurrency, State Machine & Tech)

1. **Thuật toán Kiểm tra Trùng Ca trực (Shift Overlap Detection):**
   - _Kịch bản kỹ thuật:_ Hai người quản lý cùng mở giao diện phân ca, cùng xếp lịch cho nhân viên Nguyễn Văn B vào ca sáng ngày Thứ Hai trên 2 cơ sở khác nhau cách nhau 20km. Cả hai cùng bấm Lưu lúc 09:00:00.
   - _Bẫy kỹ thuật:_ Thuật toán kiểm tra trùng lịch có kiểm tra khoảng thời gian giao nhau dạng:
     $$\text{start}_A < \text{end}_B \quad \text{AND} \quad \text{start}_B < \text{end}_A$$
     được thực thi ở đâu? Nếu chỉ kiểm tra ở tầng code Java rồi mới gọi `save()`, race condition sẽ khiến nhân viên B bị phân thân vào 2 ca trực cùng lúc!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn thiết kế Exclusion Constraint dưới Database SQL Server như thế nào để đảm bảo 1 nhân viên không bao giờ bị xếp trùng khung giờ ở mức dữ liệu nguyên tử?"**
2. **Quy mô Sơ đồ Mặt bằng (Floor Plan Rendering & Large JSON Payload):**
   - _Kịch bản:_ Một cơ sở lớn có 1.000 ô kho chia làm 5 tầng. Khi người dùng mở sơ đồ kho, hệ thống tải toàn bộ 1.000 ô kho kèm tọa độ X, Y, chiều dài, rộng, trạng thái, giá tiền trong 1 API call.
   - _Hậu quả:_ Payload JSON nặng 15MB. Trình duyệt client bị đơ (DOM Freeze), thiết bị di động bị crash vì tràn bộ nhớ RAM khi vẽ SVG/Canvas.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn tối ưu hóa việc phân trang dữ liệu không gian (Spatial Pagination / Viewport-based Fetching) trên sơ đồ mặt bằng thế nào?"**

---

### 5.4. Top Câu hỏi Sát thủ Giảng viên chắc chắn sẽ hỏi

#### ❓ Câu hỏi 1:

> _"Trong hệ thống phân quyền (RBAC) của các bạn, nếu một Facility Manager muốn tự tạo cho mình một ô kho miễn phí để dùng riêng hoặc tự duyệt cho tài khoản cá nhân của mình thuê kho với giá 0 đồng, hệ thống có cơ chế nào để ngăn chặn hành vi 'Vừa đá bóng vừa thổi còi' (Self-Approval Fraud) này không?"_

- **Mục đích sâu xa của giảng viên:** Kiểm tra nguyên tắc Phân tách Trách nhiệm (Separation of Duties - SoD) trong an toàn thông tin doanh nghiệp.

#### ❓ Câu hỏi 2:

> _"Khi một nhân viên chuyển ca trực (Handover of Shift), nếu trong ca cũ đang có 3 Ticket sự cố chưa giải quyết và 2 lịch hẹn nhận kho bị trễ hẹn, hệ thống chuyển giao trách nhiệm giữa 2 nhân viên (Shift Handover Protocol) như thế nào để không ai đùn đẩy trách nhiệm cho nhau?"_

- **Mục đích sâu xa của giảng viên:** Đánh vào tính liên tục trong vận hành (Operational Continuity) của phần mềm quản lý dịch vụ.

---

# 6. FLOW 6: Storage Renewal & Overdue Handling Flow (Gia hạn & Xử lý quá hạn D+1..D+10)

> **Mô tả danh nghĩa:** Nhắc gia hạn trước 60 ngày (`BR-REN-01`), khóa gia hạn online trước 30 ngày. Quá hạn: D+1..D+3 ân hạn 0đ (`BR-OVD-02`); D+4..D+10 phạt 10% cọc/ngày (`BR-OVD-03`), trần phạt 70% (`BR-OVD-04`); D+7 khóa PIN (`BR-OVD-05`); D+10 đơn phương chấm dứt hợp đồng, tịch thu cọc, niêm phong tài sản chuyển kho thanh lý (`BR-OVD-07`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Hết hạn] ──> [D+1..D+3: Ân hạn] ──> [D+4..D+6: Phạt 10%] ──> [D+7: Khóa PIN] ──> [D+10: Chấm dứt & Niêm phong]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1. Lỗ hổng Nghiệp vụ & Kịch bản Biên (Business Logic & Edge Cases)

1. **Khách hàng gặp Sự cố Bất khả kháng (Force Majeure Event):**
   - _Kịch bản đau xót:_ Khách hàng thuê kho chứa toàn bộ kỷ vật gia đình, sổ tờ nhà đất, đồ gia bảo. Đúng ngày hết hạn hợp đồng, khách bị tai nạn giao thông nghiêm trọng phải nằm phòng hồi sức cấp cứu hôn mê 15 ngày, điện thoại bị hỏng không thể nhận SMS/Email.
   - _Hậu quả quy trình:_ Đúng ngày D+7, hệ thống tự động khóa mã PIN. Đến ngày D+10, Cron Job tự động đánh dấu `TERMINATED_OVERDUE`, nhân viên cưa khóa, gom toàn bộ kỷ vật đem bán đấu giá hoặc ném ra bãi rác. Ngày thứ 20, gia đình khách hàng tỉnh dậy mang tiền đến nộp thì tài sản đã bị tiêu hủy sạch sẽ!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Hệ thống có cơ chế 'Đóng băng khẩn cấp (Emergency Grace Suspension)' hoặc thẩm định nhân đạo trước khi kích hoạt quy trình tiêu hủy tài sản không, hay phó mặc hoàn toàn cho Cron Job vô cảm?"**
2. **Lỗ hổng "Treo trạng thái để né phạt" (Pending Renewal Loophole):**
   - _Kịch bản lươn lẹo:_ Đến ngày D+3 (ngày cuối cùng của thời gian ân hạn miễn phí), khách vào app bấm "Gia hạn thêm 1 tháng". Hệ thống chuyển hợp đồng sang trạng thái `PENDING_RENEWAL` và chờ khách thanh toán. Khách cố tình **không thanh toán**.
   - _Lỗ hổng:_ Nếu Cron Job phạt quá hạn chỉ quét các hợp đồng có trạng thái `ACTIVE` hoặc `OVERDUE` mà bỏ qua `PENDING_RENEWAL`, khách hàng có thể ung dung để đồ trong kho thêm vài tuần mà không bị tính 1 đồng phí phạt nào!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"State Machine của các bạn có thời hạn hết hạn cho trạng thái PENDING_RENEWAL (Renewal Payment TTL) không? Nếu quá 24h không thanh toán gia hạn thì hệ thống tính ngày quá hạn ngược về thời điểm nào?"**

---

### 6.2. Bẫy Pháp lý & Kế toán Dòng tiền (Financial & Legal Risks)

1. **🚨 BẪY TỬ THẦN PHÁP LÝ: Tự ý Cưa khóa, Niêm phong & Thanh lý Tài sản tại D+10:**
   - _Phân tích pháp lý sống còn theo Pháp luật Việt Nam:_
     - Theo **Điều 158 Bộ luật Hình sự 2015**: Hành vi tự ý xâm phạm chỗ ở, nơi cất giữ tài sản hợp pháp của người khác khi chưa có sự đồng ý của họ hoặc lệnh của cơ quan có thẩm quyền cấu thành tội _"Xâm phạm chỗ ở của người khác"_.
     - Theo **Điều 178 Bộ luật Hình sự 2015**: Việc tự ý cưa phá khóa, dịch chuyển hoặc bán tài sản của người khác cấu thành tội _"Hủy hoại hoặc cố ý làm hư hỏng tài sản"_ hoặc _"Công nhiên chiếm đoạt tài sản"_.
     - Theo **Bộ luật Tố tụng Dân sự**: Việc xử lý tài sản thế chấp/cầm cố hoặc tài sản trong hợp đồng thuê bắt buộc phải có Phán quyết của Tòa án hoặc sự chứng kiến lập vi bằng của **Thừa phát lại (Bailiff)** và Công an khu vực. Doanh nghiệp KHÔNG CÓ THẨM QUYỀN TỰ XỬ ÁN (Self-help Eviction)!
   - _Bẫy lớn nhất:_ Sinh viên viết vào đặc tả: _"Tại D+10 nhân viên cưa khóa, niêm phong đồ chuyển kho thanh lý"_. Nếu làm đúng như vậy ngoài đời, Ban Giám đốc và nhân viên cơ sở sẽ **BỊ KHỞI TỐ HÌNH SỰ** ngay lập tức khi khách hàng làm đơn tố cáo!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn giải thích căn cứ pháp lý nào cho phép phần mềm tự động kích hoạt lệnh 'Tịch thu và Thanh lý tài sản' của công dân? Quy trình xử lý niêm phong tài sản có tích hợp bước tải lên Vi bằng Thừa phát lại và Biên bản Công an không?"**
2. **Mức phạt 10% tiền cọc mỗi ngày (BR-OVD-03) — Vi phạm Luật Thương mại về Trần Phạt Vi phạm:**
   - _Phân tích pháp lý:_ Quy tắc `BR-OVD-03` phạt 10% tiền cọc/ngày, tối đa 70% (`BR-OVD-04`).
   - _Vấn đề luật định:_ Theo **Điều 301 Luật Thương mại 2005**: _"Mức phạt đối với vi phạm nghĩa vụ hợp đồng do các bên thoả thuận trong hợp đồng, nhưng không quá 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm"_.
   - _Hậu quả:_ Việc phạt 10% một ngày (tương đương 300%/tháng) vượt xa trần chế tài của Luật Thương mại và Luật Dân sự. Khi xảy ra kiện tụng, toàn bộ điều khoản phạt này sẽ bị Tòa án tuyên bố **VÔ HIỆU TOÀN PHẦN**, doanh nghiệp không những không thu được tiền phạt mà còn phải bồi thường án phí cho khách!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn căn cứ vào đâu để đưa ra con số phạt 10%/ngày? Có sự tham vấn của chuyên gia pháp lý khi xây dựng bộ quy tắc nghiệp vụ BR-\* không?"**

---

### 6.3. Bẫy Kỹ thuật, Dữ liệu & Xung đột (Concurrency, State Machine & Tech)

1. **Hiểm họa Distributed Cron Job: Phạt trùng lặp khi chạy Đa máy chủ (Multi-instance Cluster):**
   - _Kịch bản kỹ thuật:_ Khi hệ thống triển khai thực tế trên Production, backend chạy trên 3 Kubernetes Pods hoặc 3 máy chủ ảo phía sau Load Balancer để đảm bảo High Availability (HA). Đúng 00:00:00 ngày D+4, tác vụ Scheduled Cron Job quét phạt quá hạn kích hoạt.
   - _Thảm họa:_ Vì Cron Job được cài đặt trong code Spring Boot (`@Scheduled`), **cả 3 Pods đều đồng loạt kích hoạt job tại cùng 1 giây!** Mỗi Pod quét qua danh sách hợp đồng quá hạn và cộng 10% tiền phạt.
   - _Kết quả:_ Khách hàng ngủ một đêm dậy thấy tài khoản bị phạt 30% thay vì 10%!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn đã áp dụng giải pháp Khóa phân tán (Distributed Lock) như `ShedLock` hay `Redis Lock` cho tác vụ Scheduled Job như thế nào để đảm bảo trên toàn cụm server chỉ có duy nhất 1 job được chạy tại một thời điểm?"**
2. **Cron Job Chết giữa chừng (Partial Failure & Batch Resumption):**
   - _Kịch bản:_ Hệ thống có 5.000 hợp đồng quá hạn cần quét phạt mỗi đêm. Cron Job chạy đến hợp đồng thứ 2.500 thì máy chủ bị mất điện đột ngột hoặc tràn bộ nhớ Heap (OOM Crash).
   - _Vấn đề:_ Khi server khởi động lại lúc 02:00 sáng, làm sao Cron Job biết hợp đồng nào đã bị phạt của ngày hôm nay, hợp đồng nào chưa để chạy tiếp? Nếu chạy lại từ đầu, 2.500 người đầu tiên sẽ bị phạt 2 lần!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn thiết kế cơ chế Giao dịch từng mẻ (Batch Processing với Spring Batch hoặc Chunk-based Transactions) và Bảng đánh dấu Idempotent Log thế nào để hỗ trợ phục hồi điểm dừng (Resumable Job Execution)?"**

---

### 6.4. Top Câu hỏi Sát thủ Giảng viên chắc chắn sẽ hỏi

#### ❓ Câu hỏi 1:

> _"Nếu vào đúng ngày D+7 lúc 23:59:58 khách hàng nộp tiền phạt thành công qua cổng thanh toán, nhưng lúc 00:00:01 Cron Job của hệ thống lại chạy lệnh Khóa mã PIN (SUSPENDED). Khách hàng lái xe tải chở đồ đến kho lúc 00:15 sáng bấm mã PIN không mở được cửa. Lỗi này do ai? Kiến trúc của các bạn có đảm bảo tính Event-driven để việc thanh toán thành công lập tức giải phóng lệnh khóa cửa theo thời gian thực hay không?"_

- **Mục đích sâu xa của giảng viên:** Bóc trần sự rời rạc giữa kiến trúc Hướng sự kiện (Event-Driven Architecture) và các tác vụ theo lô định kỳ (Batch Jobs).

#### ❓ Câu hỏi 2:

> _"Tại sao thời hạn gia hạn tối thiểu lại bắt buộc là 1 tháng (`BR-REN-03`)? Nếu khách hàng chỉ cần để đồ thêm đúng 3 ngày để chờ nhận nhà mới, họ có bắt buộc phải trả tiền cả tháng không? Tại sao hệ thống không hỗ trợ tính tiền theo ngày (Daily Prorated Extension) để tối ưu quyền lợi khách hàng?"_

- **Mục đích sâu xa của giảng viên:** Thử thách sự nhạy bén về mô hình kinh doanh linh hoạt của phần mềm quản lý hiện đại.

---

# 7. FLOW 7: Support Request & Issue Handling Flow (Hỗ trợ & Xử lý sự cố on-site)

> **Mô tả danh nghĩa:** Khách gửi Ticket báo lỗi kèm ảnh (`BR-SUP-01`), nhân viên xử lý trong ca trực (`BR-SUP-02`), cấp lại PIN miễn phí nếu lỗi cơ sở (`BR-ACC-04`), đổi kho khẩn cấp nếu sự cố nghiêm trọng (ẩm, dột, cháy) (`BR-SUP-05`), tự đóng sau 7 ngày không phản hồi (`BR-SUP-03`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Khách gửi Ticket kèm ảnh] ──> [Nhân viên kiểm tra hiện trường] ──> [Đổi kho / Sửa] ──> [Đóng]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1. Lỗ hổng Nghiệp vụ & Kịch bản Biên (Business Logic & Edge Cases)

1. **Quy trình "Đổi kho Khẩn cấp" (Emergency Unit Relocation) khi Vắng mặt Khách hàng:**
   - _Kịch bản thảm họa:_ Tầng 2 bị vỡ ống nước cứu hỏa, nước tràn vào ô kho `U-201`. Khách hàng đang đi công tác nước ngoài không nghe máy. Nếu không di dời gấp, toàn bộ hàng hóa điện tử trị giá 500 triệu của khách sẽ bị ngâm nước phá hủy.
   - _Bẫy nghiệp vụ & pháp lý:_ Nhân viên cơ sở có quyền tự cưa khóa mở kho và khuân đồ của khách sang ô kho mới `U-305` không?
     - Nếu **không di dời**: Hàng hỏng 100%, doanh nghiệp phải đền 500 triệu vì lỗi hạ tầng cơ sở.
     - Nếu **tự di dời**: Khi khách về, khách kiểm tra và tuyên bố: _"Trong ngăn kéo bàn có 1 bọc chứa 20 cây vàng SJC, giờ chuyển kho sang đây đã bị mất trộm rồi"_. Nhân viên cơ sở lấy gì chứng minh mình trong sạch?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Quy trình xử lý sự cố khẩn cấp on-site của các bạn có quy định bắt buộc phải có Hội đồng 3 bên (Nhân viên, Bảo vệ, Tổ trưởng dân phố/Công an) cùng lập Biên bản kiểm kê có ghi hình Camera (Video Audit) trước khi điều chuyển kho hay chỉ là một nút bấm trên app?"**
2. **Không có Ô kho cùng loại để Đổi khẩn cấp (Unit Allocation Exhaustion):**
   - _Kịch bản:_ Ô kho loại L của khách bị hỏng chốt cửa không khóa được. Khách yêu cầu đổi kho khẩn cấp. Tuy nhiên, toàn bộ các ô kho loại L khác trong cơ sở đều đã có người thuê (`OCCUPIED`) hoặc đang sửa (`MAINTENANCE`).
   - _Lỗ hổng quy trình:_ Phần mềm xử lý thế nào?
     - Cho phép nâng cấp miễn phí (Free Upgrade) lên ô kho loại XL to hơn mà không phụ thu tiền?
     - Hay chia đồ của khách ra làm 2 ô kho loại S và M?
     - Ai là người có thẩm quyền phê duyệt việc bù chênh lệch chi phí này trên phần mềm?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Logic nghiệp vụ đổi kho khẩn cấp (`BR-SUP-05`) của các bạn có hỗ trợ giải thuật Tìm kho thay thế tối ưu (Alternative Allocation Algorithm) hay chỉ tìm mù một kho cùng kích thước?"**

---

### 7.2. Bẫy Pháp lý & Kế toán Dòng tiền (Financial & Legal Risks)

1. **Thẩm quyền Duyệt Đền bù Thiệt hại (Damage Compensation Authority):**
   - _Kịch bản:_ Nhân viên trực làm rơi thang va vào làm móp méo chiếc đàn Piano đắt tiền của khách trong lúc bảo trì hành lang. Nhân viên tự ý thương lượng: _"Thôi em đền cho anh 5.000.000đ trừ thẳng vào tiền thuê tháng sau nhé"_.
   - _Bẫy tài chính:_ Nhân viên hoặc Facility Manager có thẩm quyền tự quyết toán tiền đền bù này không? Khoản tiền đền bù 5 triệu đó được hạch toán vào tài khoản chi phí nào của công ty? Có cần hóa đơn chứng từ sửa chữa thực tế không?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn kiểm soát thẩm quyền phê duyệt tài chính (Financial Approval Matrix) trong phân hệ Xử lý sự cố thế nào để tránh thất thoát ngân sách công ty?"**
2. **Giới hạn Trách nhiệm Bồi thường (Limitation of Liability Clause):**
   - _Phân tích rủi ro:_ Khách thuê một ô kho giá 500.000đ/tháng nhưng cất giữ tranh nghệ thuật trị giá 2 tỷ đồng mà không mua bảo hiểm hàng hóa riêng. Khi xảy ra sự cố ẩm mốc làm hỏng tranh, khách kiện đòi đền 2 tỷ.
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Trong điều khoản dịch vụ mà hệ thống bắt khách tick 'Đồng ý' khi tạo tài khoản, mức giới hạn bồi thường tối đa của cơ sở được quy định là bao nhiêu? (Ví dụ: Không vượt quá 03 tháng tiền thuê hoặc tối đa 10.000.000 VNĐ)?"**
   - _Câu trả lời đạt điểm 10 phản biện:_
     - **Bản chất pháp lý dịch vụ:** Hợp đồng Self-Storage là hợp đồng **cho thuê không gian mặt bằng**, không phải hợp đồng gửi giữ tài sản có kiểm kê (No-Bailment Principle). Khách hàng nắm giữ chìa khóa và mật mã PIN riêng, toàn quyền tiếp cận 24/7. Do đó, cơ sở không quản lý danh mục hiện vật bên trong kho của khách.
     - **Cơ chế 2 tầng bồi thường theo `BR-SUP-04`:**
       1. *Tầng 1 - Hạn mức cơ bản mặc định của cơ sở (Default Liability Cap):* Khi hư hỏng do lỗi kỹ thuật hạ tầng của cơ sở (vỡ đường ống nước, chập điện cơ sở), công ty bồi thường theo giá trị tổn thất thực tế có chứng từ hợp pháp, **tối đa không quá 10.000.000 VNĐ / ô kho** (`support.goods_liability_cap = 10.000.000 đ`). Mức trần cố định này loại bỏ mọi mập mờ, công thức phức tạp hay tranh chấp.
       2. *Tầng 2 - Gói Bảo vệ Hàng hóa Mở rộng tùy chọn (Tenant Protection Plan Add-on):* Với khách hàng lưu trữ đồ giá trị cao (> 10 triệu, 20 triệu, 50 triệu), hệ thống cung cấp checkbox dịch vụ gia tăng ngay tại bước đặt kho với mức phí **50.000 đ/tháng** (`insurance.monthly_fee`). Khi tích chọn, hạn mức bồi thường được nâng lên tới **50.000.000 VNĐ** (`insurance.coverage_cap`) thông qua đối tác bảo hiểm liên kết (Bảo Việt / PVI).
       3. *Miễn trừ tuyệt đối với hàng cấm:* Hợp đồng có điều khoản loại trừ 100% trách nhiệm đối với tiền mặt, vàng bạc đá quý, đồ cháy nổ, đồ tươi sống.

---

### 7.3. Bẫy Kỹ thuật, Dữ liệu & Xung đột (Concurrency, State Machine & Tech)

1. **Lỗ hổng Tải tệp Độc hại (Malicious File Upload Vulnerability):**
   - _Kịch bản tấn công:_ Màn hình gửi Ticket hỗ trợ cho phép khách tải lên ảnh chụp sự cố (`.jpg`, `.png`). Kẻ tấn công đổi tên một file mã độc web-shell từ `backdoor.jsp` hoặc `exploit.php` thành `anh_hong_kho.png` rồi tải lên server.
   - _Thảm họa an ninh:_ Nếu backend chỉ kiểm tra đuôi file danh nghĩa mà không kiểm tra cấu trúc nhị phân thực tế (Magic Bytes / MIME Type Verification) và lưu trữ trực tiếp trên ổ cứng web server, hacker có thể kích hoạt thực thi mã từ xa (Remote Code Execution - RCE) và chiếm toàn quyền kiểm soát toàn bộ cơ sở dữ liệu hệ thống!
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Các bạn bảo vệ endpoint Upload File như thế nào? Có sử dụng Cloud Object Storage (S3 / Azure Blob) với Presigned URL, giới hạn dung lượng, và quét mã độc tự động không?"**
2. **SLA Breach & Escalation Timeout Dead-end:**
   - _Kịch bản:_ Khách gửi ticket báo sự cố khẩn cấp: _"Chập điện bốc khói tại ô kho 102"_. Nhân viên trực ca hôm đó lơ là không mở app.
   - _Vấn đề kỹ thuật:_ Sau 15 phút hoặc 30 phút không có ai tiếp nhận ticket, hệ thống có tự động kích hoạt tiến trình Báo động leo thang (Escalation Trigger) để bắn SMS/Cuộc gọi khẩn cấp tới Quản lý cơ sở và Ban Giám đốc không, hay ticket cứ nằm im trong database cho đến khi cơ sở bị thiêu rụi?
   - _Ý đồ giảng viên muốn xoáy vào:_ **"Kiến trúc của các bạn có tích hợp Timer-based SLA Tracking và Automated Escalation Service hay chỉ là bảng Ticket CRUD đơn giản?"**

---

### 7.4. Top Câu hỏi Sát thủ Giảng viên chắc chắn sẽ hỏi

#### ❓ Câu hỏi 1:

> _"Tại sao quy tắc BR-SUP-01 lại ghi 'Bãi bỏ thời hạn cứng 2 giờ xử lý khẩn cấp'? Nếu một khách hàng bị kẹt khóa cửa không thể lấy hàng ra để kịp giao cho đối tác lúc 8 giờ sáng, mà nhân viên cơ sở bảo 'chúng tôi xử lý linh hoạt theo ca trực, chiều mới rảnh', thiệt hại kinh doanh của khách hàng ai sẽ chịu? Việc bãi bỏ SLA cứng là bước lùi về mặt chất lượng dịch vụ hay là cách các bạn trốn tránh bài toán kỹ thuật đo lường SLA?"_

- **Mục đích sâu xa của giảng viên:** Đập tan các lý do ngụy biện của nhóm khi lược bỏ các ràng buộc kỹ thuật khó để làm cho bài toán dễ đi một cách phi thực tế.

#### ❓ Câu hỏi 2:

> _"Nếu khách hàng liên tục spam gửi 1.000 Ticket khiếu nại trong vòng 1 phút đính kèm các file ảnh dung lượng lớn, hệ thống của các bạn có cơ chế Rate Limiting (chống spam) và Quota Storage như thế nào để bảo vệ server không bị nghẽn mạng và sập ổ đĩa?"_

- **Mục đích sâu xa của giảng viên:** Kiểm tra khả năng phòng thủ từ chối dịch vụ (DDoS / Resource Exhaustion Protection) ở tầng API Gateway / Reverse Proxy.

---

# 8. CẨM NANG BẢN LĨNH PHÒNG THỦ: CÁCH TRẢ LỜI ĐẠT ĐIỂM XUẤT SẮC

Khi đứng trước Hội đồng bảo vệ Đồ án Tốt nghiệp (SWP391 / Capstone), sự khác biệt giữa một **Nhóm sinh viên Trung bình (Điểm 5 - 6)** và một **Nhóm Kỹ sư Trưởng Xuất sắc (Điểm 9 - 10)** nằm ở **Thái độ và Cách tiếp cận vấn đề**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MA TRẬN ĐÁNH GIÁ BẢN LĨNH PHÒNG THỦ                             │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│    CÂU TRẢ LỜI ĐÁNH RỚT (THẤT BẠI) │    CÂU TRẢ LỜI ĐẠT ĐIỂM XUẤT SẮC (SENIOR LEVEL)     │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ • "Dạ hệ thống của em chỉ làm mô │ • "Dạ thưa Thầy/Cô, đây là một edge-case rất thực tế.  │
│   hình đồ án nên không tính đến │   Dưới góc độ kiến trúc, chúng em đã lường trước và   │
│   trường hợp đó..."            │   thiết kế giải pháp theo 2 tầng: Tầng nghiệp vụ...   │
│                                │   và Tầng kỹ thuật..."                                │
│ • "Dạ framework Spring Boot và │ • "Dạ, để chống Race condition ở điểm này, chúng em    │
│   SQL Server tự xử lý rồi ạ..." │   không tin tưởng vào bộ nhớ mà sử dụng cơ chế Lock    │
│                                │   tại tầng CSDL với cú pháp PESSIMISTIC_WRITE..."     │
│ • "Dạ tại vì yêu cầu đề bài     │ • "Dạ, quy tắc này ban đầu được thiết kế theo baseline│
│   không nói nên em không làm..."│   tuy nhiên khi đối chiếu với Luật Dân sự 2015, chúng │
│                                │   em đề xuất giải pháp bổ sung thêm biên bản..."      │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

### 3 Nguyên tắc Vàng khi Trả lời Phản biện:

1. **Thừa nhận tính thực tế của câu hỏi trước khi trả lời:** Luôn bắt đầu bằng việc xác nhận: _"Cảm ơn Thầy/Cô, đây là một kịch bản rủi ro rất sâu sắc mà các hệ thống vận hành thực tế thường xuyên gặp phải..."_. Điều này chứng minh bạn có tư duy phản biện chứ không bảo thủ.
2. **Tách biệt rõ ràng 3 tầng giải pháp:**
   - **Tầng Nghiệp vụ & Pháp lý (Business & Legal):** Điều khoản hợp đồng, cam kết miễn trừ, biên bản đối soát.
   - **Tầng Dữ liệu & Tính toàn vẹn (Data Integrity):** Constraints, Isolation Level, State Machine, Audit Log.
   - **Tầng Ứng dụng & Ngoại vi (Application & Infrastructure):** Distributed Lock, Queue, Caching, Retry/Fallback.
3. **Thành thật về giới hạn của hệ thống kèm Phương án Khắc phục (Roadmap):** Nếu một tính năng thực sự nhóm chưa kịp code, tuyệt đối không nói dối là "em có làm rồi nhưng quên test". Hãy dõng dạc trả lời: _"Dạ trong phạm vi 10 tuần của học phần SWP391, nhóm đã hoàn thiện toàn bộ luồng chính và đã thiết kế sẵn mô hình dữ liệu (Schema) cho kịch bản này. Để đưa vào sản xuất thương mại thực tế, giải pháp hoàn thiện sẽ là tích hợp thêm module X và dịch vụ Y theo thiết kế kiến trúc tại trang Z của tài liệu."_ Hội đồng sẽ đánh giá cực kỳ cao sự trưởng thành và trung thực đó!

---

_Tài liệu phản biện nội bộ — Lưu hành phục vụ đợt Đánh giá & Bảo vệ Đồ án SWP391._

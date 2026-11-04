# BẢNG ĐỐI CHIẾU LỆCH PHA & KẾ HOẠCH TÁI CẤU TRÚC: CHUYỂN ĐỔI MÔ HÌNH PHÂN BỔ Ô KHO
## (Architectural Gap Analysis: Transition from Unit-Level Hard Booking to Category Capacity & Late Binding Allocation)

> **Tài liệu:** Báo cáo Rà soát Kiến trúc & Đối chiếu Lệch pha (Gap Analysis Specification)  
> **Dự án:** Hệ thống Quản lý và Cho thuê Kho Tự Quản (Self-Storage Facility Rental & Management System)  
> **Chủ trì kỹ thuật:** Lead Software Architect & Technical Lead  
> **Giai đoạn:** Giai đoạn 1 — Thẩm định & Rà soát Lệch pha (Phase 1: Architecture Review & Gap Analysis)  
> **Phạm vi tác động:** Toàn bộ 7 tài liệu đặc tả nghiệp vụ, mô hình CSDL (Flyway Migration), REST API, và Giao diện (Customer & FM Portal).

---

## 1. BỐI CẢNH & NGUYÊN NHÂN TÁI CẤU TRÚC KIẾN TRÚC

### 1.1. Hiện trạng Hệ thống cũ (As-Is: Unit-Level Hard Booking)
Hệ thống trước đây áp dụng cơ chế **Gán cứng Ô kho Vật lý ngay từ đầu (Immediate Hard-Binding)**:
1. **Đặt chỗ Online (Customer Portal):** Khách hàng xem sơ đồ mặt bằng và click chọn đích danh một ô kho vật lý cụ thể (ví dụ: `U-101`). Hệ thống khóa `StorageUnit` sang `RESERVED` và gắn cứng `storage_unit_id` vào cả `Reservation` lẫn `RentalContract`.
2. **Nhận kho & Bàn giao (On-site Check-in):** Nhân viên cơ sở (Staff) mở hợp đồng và bắt buộc bàn giao đúng ô kho `U-101`. Nếu `U-101` gặp sự cố (ẩm dột, hỏng khóa, khách cũ chưa dọn xong), hệ thống bó tay, bắt buộc phải hủy hợp đồng và kích hoạt quy trình hoàn tiền trong 3 ngày (`BR-CHK-06`), bắt khách phải về đặt lại từ đầu.
3. **Gia hạn & Đặt trước (Renewal vs Future Reservations):** Lịch đặt trước tương lai được gắn cứng theo mã ô kho vật lý. Nếu khách đang ở `U-101` muốn gia hạn mà trước đó đã có một khách mới đặt trước ô `U-101`, hệ thống chặn không cho gia hạn, ép khách cũ phải dọn đồ rời đi dù cơ sở còn nhiều ô trống cùng loại khác.

### 1.2. Mục tiêu Mô hình mới (To-Be: Category-Based Booking & Late-Binding Allocation)
Chuyển đổi sang mô hình **Quản lý Hạn ngạch theo Hạng kho & Phân bổ Ô kho linh hoạt (Category Capacity & JIT Allocation)** — chuẩn mực vận hành của các tập đoàn Self-Storage toàn cầu (Public Storage, Extra Space) và ngành Khách sạn/Hàng không:
1. **Đặt chỗ Online (Customer Portal):** Khách hàng chỉ chọn Cơ sở (`facility_id`), Hạng kho (`unit_type_id`, ví dụ: Loại S, M, L) và Thời hạn thuê. Không hiển thị sơ đồ chọn ô cụ thể. Hệ thống kiểm tra và trừ hạn ngạch khả dụng (Capacity). Bản ghi `Reservation` và `RentalContract` ban đầu để trống `storage_unit_id = NULL`.
2. **Phân bổ Ô kho (Pre-Checkin Staging by FM):** Quản lý cơ sở (Facility Manager - FM) là người chủ động phân bổ thủ công một ô kho vật lý cụ thể đang `AVAILABLE` vào hợp đồng của khách trước ngày check-in. FM có quyền linh hoạt điều chỉnh ô kho cho tới trước ngày check-in ($T-1$). Khi FM phân bổ, ô kho chuyển sang `RESERVED`.
3. **Nhận kho & Bàn giao (On-site Check-in):** Nhân viên tiếp đón khách, mở hợp đồng đã được FM gán sẵn ô kho để cùng khách kiểm tra thực tế. Nếu ô kho phát sinh lỗi đột xuất tại hiện trường, Staff báo cáo lên FM $\rightarrow$ FM thao tác đổi ô kho trên hệ thống sang ô `AVAILABLE` khác cùng loại $\rightarrow$ Staff tiếp tục bàn giao và kích hoạt hợp đồng sang `ACTIVE`, ô kho sang `OCCUPIED`.
4. **Gia hạn & Đặt trước (Renewal Preemption):** Khách hàng đang thuê tại ô kho có quyền ưu tiên gia hạn (Preemption Right). Các đơn đặt trước tương lai chỉ giữ hạn ngạch số lượng theo Hạng kho. Nếu FM đã lỡ tạm gán ô đang thuê cho đơn tương lai, hệ thống tự động gỡ gán khỏi đơn tương lai đó (đưa về `storage_unit_id = NULL`) và thông báo FM chọn ô khác.

---

## 2. KẾT QUẢ ĐỒNG THUẬN THIẾT KẾ (GRILL-ME ARCHITECTURE DECISIONS)

Qua chuỗi phỏng vấn làm rõ kiến trúc (`/grill-me`), các quyết định cốt lõi đã được thống nhất 100%:

| Mã Quyết định | Nhánh Thiết kế | Quyết định Thống nhất | Lý do & Ý nghĩa Kiến trúc |
| :---: | :--- | :--- | :--- |
| **DEC-01** | **Chủ thể Phân bổ Ô kho** | **Facility Manager (FM) phân bổ thủ công.** | Phù hợp nguyên tắc Phân tách Trách nhiệm (SoD). Nhân viên trực ca không được tự ý gán ô bừa bãi để tránh tiêu cực. |
| **DEC-02** | **Cửa sổ Thời gian Phân bổ** | FM có thể phân bổ và đổi ô linh hoạt từ khi có đơn đến **trước ngày Check-in ($T-1$)**. | Đảm bảo tính chủ động trong điều phối mặt bằng và kế hoạch dọn dẹp, bảo dưỡng của cơ sở. |
| **DEC-03** | **Sự cố ngày Check-in ($T$)** | Staff báo cáo sự cố $\rightarrow$ **FM thao tác đổi ô trên hệ thống** $\rightarrow$ Staff bàn giao ô mới. | Giữ vững luồng kiểm soát của FM; không làm gãy hợp đồng của khách và không bắt khách hủy cọc/hoàn tiền. |
| **DEC-04** | **Xung đột Gia hạn (Renewal)** | **Ưu tiên khách đang thuê (Preemption):** Tự động gỡ gán ô khỏi đơn tương lai, thông báo FM. | Bảo vệ khách hàng trung thành, giảm chi phí dọn dẹp và duy trì dòng tiền ổn định cho doanh nghiệp. |
| **DEC-05** | **Vòng đời Trạng thái Ô kho** | Khi FM gán: `StorageUnit` $\rightarrow$ `RESERVED`. Khi Check-in đạt: $\rightarrow$ `OCCUPIED`. | Khóa tạm thời ô kho để chuẩn bị vệ sinh; ngăn chặn FM khác hoặc cơ sở gán trùng ô. |
| **DEC-06** | **Lưới An toàn Tự động (Safety Net)** | Cảnh báo đỏ $T-3$ $\rightarrow$ 00:00 ngày $T$ Auto-assign $\rightarrow$ Auto-upgrade $\rightarrow$ `PENDING_EMERGENCY_RESOLUTION`. | Đảm bảo hệ thống không bao giờ bị nghẽn (dead-end) khi FM bận hoặc quên nhiệm vụ. |

---

## 3. THẨM ĐỊNH THỰC TẾ: NHỮNG ĐIỀU NÊN LÀM VÀ NÊN BỎ

### 3.1. Những điều NÊN LÀM (Adopt & Enforce)
1. **Áp dụng triệt để mô hình Category-based Capacity:** Tách rời hoàn toàn giữa "Nghĩa vụ phục vụ theo hợp đồng (Contractual Capacity Obligation)" và "Tài sản vật lý cụ thể (Physical Unit Asset)".
2. **Chuyển `rental_contract.storage_unit_id` sang `NULLABLE`:** Hợp đồng ở trạng thái `PENDING_CHECK_IN` hoàn toàn hợp lệ khi chưa có `storage_unit_id`.
3. **Cơ chế Đổi ô kho tại chỗ (On-site Unit Swapping):** Thay thế điều khoản cứng nhắc của `BR-CHK-06` (bắt hủy hợp đồng hoàn tiền 3 ngày) bằng quy trình đổi kho cùng loại do FM thao tác.
4. **Quyền ưu tiên gia hạn (Renewal Preemption):** Khách hàng cũ luôn được bảo lưu ô đang ở, gỡ bỏ nguy cơ bị khách mới cướp chỗ.

### 3.2. Những điều NÊN BỎ / CẦN CẢNH GIÁC (Drop & Guard)
1. **BỎ Sơ đồ mặt bằng trên Customer Portal:** Khách hàng không cần và không được chọn ô cụ thể trên sơ đồ khi đặt online.
2. **CẢNH BÁO: KHÔNG ĐƯỢC BỎ Sơ đồ mặt bằng trên Staff/FM Portal:** Nhân viên và FM bắt buộc phải có sơ đồ mặt bằng trực quan để theo dõi ô nào `AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE` và phục vụ thao tác gán ô.
3. **CẢNH BÁO: Thuật toán Capacity theo Dòng thời gian (Time-slotted Capacity):** Không gán ô trước không có nghĩa là đếm số ô trống hiện tại! Thuật toán kiểm tra capacity bắt buộc phải quét theo từng ngày trong khoảng $[start, endExclusive)$:
   $$\text{Capacity Available}(t) = \text{Total Units of Type} - \text{Occupied}(t) - \text{Confirmed Reservations}(t) - \text{Buffer}$$

### 3.3. Xử lý Kịch bản Biên Tối hậu: Bể kho Toàn Cơ sở (Facility-Wide Exhaustion)
Khi một cơ sở gặp sự cố thảm họa (ngập lụt, hỏa hoạn, nhiều ô bị hỏng kết cấu cùng lúc) khiến toàn bộ các ô cùng loại và các ô hạng cao hơn đều kín chỗ:
* **Hệ thống chuyển Hợp đồng sang `PENDING_EMERGENCY_RESOLUTION`:** Gửi cảnh báo khẩn cấp tới Giám đốc Vận hành (BOM) và FM.
* **Chính sách Bumping / Walk Policy quốc tế:**
  * *Phương án 1 (Điều chuyển cơ sở lân cận):* Chuyển sang cơ sở gần nhất cùng chuỗi; công ty đài thọ 100% cước xe tải vận chuyển đồ + Giảm 30% tiền thuê tháng đầu.
  * *Phương án 2 (Hủy bất khả kháng & Bồi thường):* Hoàn 100% tiền thuê + 100% tiền cọc ngay lập tức + Chi trả khoản bồi thường vi phạm nghĩa vụ bàn giao (tương đương 1 tháng tiền thuê) kèm Voucher ưu đãi.

---

## 4. GIAI ĐOẠN 1: BẢNG ĐỐI CHIẾU LỆCH PHA CHI TIẾT (GAP ANALYSIS MATRIX)

Quét toàn bộ 7 tài liệu đặc tả nền tảng trong thư mục `docs/`:

| STT | Tên file & Mục/Dòng | Đoạn văn / Quy tắc CŨ hiện tại (As-Is) | Cần sửa thành MỚI như thế nào (To-Be) | Mức độ ảnh hưởng |
| :---: | :--- | :--- | :--- | :---: |
| **1** | [**`docs/TOPIC.md`**](TOPIC.md)<br>§ 3.2, Mục `FM-02` (Dòng 72) | `FM-02: Phân bổ ô kho cho khách: Giữ capacity theo Unit Type khi chờ thanh toán và gán Storage Unit cụ thể sau khi thanh toán thành công` | **Chuẩn hóa thời điểm gán:** `FM-02: Phân bổ ô kho cho khách: Quản lý hàng đợi đơn đặt chỗ theo Unit Type, FM chủ động phân bổ ô kho vật lý cụ thể (Storage Unit) từ danh sách AVAILABLE trước ngày Check-in, có thể điều chỉnh đến trước ngày check-in.` | **Trung bình** |
| **2** | [**`docs/TOPIC.md`**](TOPIC.md)<br>§ 4, `Flow 1` (Dòng 111) | `Khách xem cơ sở, sơ đồ và tự chọn ô kho, ngày bắt đầu và thời hạn thuê → xem bảng ước tính chi phí... hệ thống giữ ô kho trong 48h → khách thanh toán... hệ thống khóa Reserved ô kho...` | **Bỏ chọn ô trên sơ đồ:** `Khách xem cơ sở, chọn Hạng kho (Unit Type), ngày bắt đầu và thời hạn thuê → xem bảng ước tính chi phí... hệ thống giữ Capacity Hạng kho trong 48h → khách thanh toán → hệ thống xác nhận Confirmed (chưa gán mã ô kho cụ thể).` | **Cao** |
| **3** | [**`docs/TOPIC.md`**](TOPIC.md)<br>§ 4, `Flow 2` (Dòng 122) | `Nhân viên tra cứu đặt chỗ → hai bên kiểm tra thực tế ô kho. Nếu ô kho không đạt chuẩn: nhân viên báo sự cố, quản lý đổi kho khác hoặc nếu khách từ chối nhận thì FM hoàn tiền...` | **Làm rõ thẩm quyền đổi ô:** `Nhân viên tra cứu đơn check-in (đã được FM gán ô trước đó) → đồng kiểm hiện trường. Nếu ô kho phát sinh lỗi, nhân viên báo lên hệ thống để FM thao tác đổi ô kho AVAILABLE khác cùng loại, sau đó nhân viên mới tiến hành bàn giao.` | **Trung bình** |
| **4** | [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md)<br>§ 3.1, `BR-RES-02` (Dòng 87) | `Khi tạo thành công, Reservation ở trạng thái Pending Payment, gắn trực tiếp và tạm giữ chính Storage Unit mà khách hàng đã chọn trên sơ đồ/danh sách trong reservation.hold_hours (48 giờ), ngăn không cho khách hàng khác chọn trùng ô kho này` | `Khi tạo thành công, Reservation ở trạng thái Pending Payment chỉ giữ hạn ngạch số lượng (Capacity slot) của Unit Type tại Facility trong reservation.hold_hours (48 giờ); hoàn toàn không gắn cứng Storage Unit cụ thể (storage_unit_id = NULL).` | **Cao** |
| **5** | [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md)<br>§ 3.2, `BR-AVL-04` (Dòng 100) | `Khách hàng trực tiếp chọn ô kho vật lý cụ thể trên sơ đồ mặt bằng / danh sách ô kho khả dụng ngay tại bước đặt chỗ (UC-F1-04)... Khẳng định 100% ô kho được khách tự chọn và định danh ngay từ đầu, hoàn toàn không có bước phân bổ ô kho sau thanh toán` | **THAY THẾ HOÀN TOÀN:** `Khách hàng chỉ chọn Facility, Unit Type và Thời hạn thuê. Hệ thống kiểm tra và trừ Capacity của Unit Type. FM là người phân bổ Storage Unit vật lý cụ thể từ danh sách Available trước ngày check-in. Bãi bỏ việc khách tự chọn ô vật lý online.` | **Cực cao** (Quy tắc then chốt) |
| **6** | [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md)<br>§ 3.2, `BR-AVL-05` (Dòng 101) | `Do ô kho đã được định danh ngay từ lúc tạo đơn, nếu trước ngày bắt đầu thuê mà ô kho vật lý đó phát sinh sự cố bất khả kháng... cơ sở phải thông báo ngay... khách có quyền chọn đổi hoặc hủy...` | `Đơn vị giữ chỗ là Hạng kho (Unit Type) nên việc bảo dưỡng/sự cố 1 ô kho cụ thể không làm hỏng đơn đặt chỗ của khách. FM linh hoạt gán ô kho khác cùng loại còn trống trước ngày nhận kho mà không cần hủy hợp đồng.` | **Trung bình** |
| **7** | [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md)<br>§ 4.2, `BR-PAY-02` (Dòng 121) | `Reservation chỉ chuyển Confirmed sau khi giao dịch thanh toán được xác nhận thành công và Storage Unit khách đã chọn được khóa chính thức sang Reserved theo BR-AVL-04` | `Reservation chuyển Confirmed sau khi giao dịch thanh toán thành công, ghi nhận chính thức Capacity của Unit Type. Storage Unit vật lý vẫn giữ trạng thái AVAILABLE và chưa gán mã cho đến khi FM thực hiện phân bổ.` | **Cao** |
| **8** | [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md)<br>§ 5, `BR-DEP-06` (Dòng 138) | `Baseline hiện tại không hỗ trợ đổi Unit Type hoặc Storage Unit trên Reservation/Contract hiện hữu. Trước Check-in, khách hủy và đặt lại...` | **Bổ sung ngoại lệ phân bổ:** `Cho phép FM linh hoạt gán và điều chỉnh Storage Unit khác cùng loại cho Reservation/Contract cho tới trước ngày Check-in, hoặc xử lý đổi ô khi xảy ra sự cố tại quầy Check-in.` | **Trung bình** |
| **9** | [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md)<br>§ 7, `BR-REN-09` (Dòng 180) | `Trước khi nhận thanh toán Renewal, hệ thống phải kiểm tra Availability... xem ô kho có bất kỳ ai đặt trước trong tương lai hay không. Nếu bị trùng lịch đặt trước (không còn capacity), yêu cầu gia hạn bị từ chối...` | **SỬA ĐỔI HOÀN TOÀN (Renewal Preemption):** `Khách hàng đang thuê có quyền ưu tiên gia hạn tại chính ô kho mình đang ở. Nếu ô kho đã được FM tạm gán cho một đơn đặt trước tương lai, hệ thống tự động gỡ gán khỏi đơn tương lai đó (trả về hàng đợi chờ FM gán ô khác) để ưu tiên cho khách cũ.` | **Cao** |
| **10** | [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md)<br>§ 10, `BR-CHK-02` (Dòng 232) | `Điều kiện tiên quyết để Handover: ...ô kho vật lý (mà khách đã chọn và định danh từ bước đặt chỗ) phải thực tế trống, sạch... Hoàn toàn không còn bước phân bổ kho sau thanh toán` | `Điều kiện tiên quyết để Handover: Reservation phải Confirmed, đã thanh toán đủ tiền; ô kho vật lý do FM phân bổ trước ngày check-in (hoặc được FM đổi tại quầy nếu có sự cố) phải thực tế sạch sẽ, nguyên vẹn.` | **Cao** |
| **11** | [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md)<br>§ 10, `BR-CHK-04` (Dòng 234) | `Sau khi ký biên bản Handover, Storage Unit chuyển Reserved → Occupied (UC-F2-06), Contract chuyển Pending Check-in → Active (UC-F2-07)` | `Storage Unit chính thức được gắn vào Contract (storage_unit_id) và chuyển trạng thái từ RESERVED sang OCCUPIED. Contract chuyển từ PENDING_CHECK_IN sang ACTIVE.` | **Trung bình** |
| **12** | [**`docs/BUSINESS-RULES.md`**](BUSINESS-RULES.md)<br>§ 10, `BR-CHK-06` (Dòng 236) | `Khi kiểm tra thực tế, nếu ô kho bị hư hại... Lượt Handover bị hủy và Facility Manager thực hiện hoàn tiền 100% trong vòng 3 ngày làm việc...` | **BỔ SUNG BƯỚC ĐỔI Ô TRƯỚC KHI HOÀN TIỀN:** `Nếu ô kho dự kiến bàn giao bị lỗi, Staff báo sự cố lên hệ thống; FM lập tức thao tác đổi sang một ô kho AVAILABLE khác cùng loại tại cơ sở để Staff bàn giao ngay. Chỉ hủy và kích hoạt hoàn tiền khi cơ sở đã hết sạch ô thay thế.` | **Cao** |
| **13** | [**`docs/USER-STORIES-AND-USE-CASES.md`**](USER-STORIES-AND-USE-CASES.md)<br>§ 1.2, `US-SC-02.1` | `Khách hàng xem sơ đồ cơ sở, bấm chọn đích danh ô kho vật lý (ví dụ U-101)...` | **Cập nhật User Story:** Khách hàng xem danh mục các Hạng kho (kèm kích thước, tiện ích, giá niêm yết) $\rightarrow$ Chọn số lượng và thời gian thuê $\rightarrow$ Xem bảng tính giá $\rightarrow$ Đặt chỗ. | **Cao** |
| **14** | [**`docs/USER-STORIES-AND-USE-CASES.md`**](USER-STORIES-AND-USE-CASES.md)<br>§ 2.1, `UC-F1-04` | `Tạo Reservation — chọn Facility, ô kho cụ thể trên sơ đồ, ngày bắt đầu, thời hạn thuê` | **Đổi tên & Phạm vi:** `Tạo Reservation — chọn Facility, Hạng kho (Unit Type), ngày bắt đầu, thời hạn thuê`. | **Cao** |
| **15** | [**`docs/USER-STORIES-AND-USE-CASES.md`**](USER-STORIES-AND-USE-CASES.md)<br>§ 2.1, `UC-F1-06` & `UC-F1-08` | `Giữ ô kho cụ thể đã chọn trong 48h` & `Khóa chính thức Storage Unit khách đã chọn sau khi thanh toán thành công` | **Sửa phạm vi:** Giữ Capacity theo Hạng kho 48h và Bảo lưu hạn ngạch Capacity Unit Type sau khi thanh toán thành công (`storage_unit_id` trên DB vẫn giữ `NULL`). | **Cao** |
| **16** | [**`docs/USER-STORIES-AND-USE-CASES.md`**](USER-STORIES-AND-USE-CASES.md)<br>§ 1.3, `US-FM-02.1` | `FM-02: Giám sát đơn đặt chỗ và ô kho khách chọn cho Reservation` | **Viết lại User Story cho FM:** `Là Quản lý cơ sở (FM), tôi muốn truy cập Bàn làm việc Phân bổ (Allocation Workbench) để xem danh sách các đơn đặt chỗ chờ gán ô, chủ động chọn ô kho vật lý AVAILABLE cùng loại và có thể điều chỉnh trước ngày check-in.` | **Cao** |
| **17** | [**`docs/USER-STORIES-AND-USE-CASES.md`**](USER-STORIES-AND-USE-CASES.md)<br>§ 2.2, `UC-F2-03` | `Bàn giao ô kho và lập biên bản bàn giao điện tử` | **Bổ sung nghiệp vụ:** Biên bản bàn giao hiển thị ô kho đã được FM phân bổ. Bổ sung luồng phụ: nếu ô hỏng, Staff gửi tín hiệu đổi ô $\rightarrow$ FM đổi ô trên hệ thống $\rightarrow$ Staff tiếp tục bàn giao. | **Trung bình** |
| **18** | [**`docs/DEFENSE-SPECIFICATION.md`**](DEFENSE-SPECIFICATION.md)<br>§ 1.1.1, Swimlane Flow 1 | Bước B3: `Tạo Reservation (PENDING_PAYMENT), Ô kho chuyển RESERVED...` | **Sửa luồng Swimlane:** Bước B3 chỉ trừ Capacity Unit Type. Bổ sung làn FM: FM thực hiện bước phân bổ ô kho từ danh sách AVAILABLE trước ngày check-in. | **Cao** |
| **19** | [**`docs/DEFENSE-SPECIFICATION.md`**](DEFENSE-SPECIFICATION.md)<br>§ 1.2.3, State Chart `StorageUnit` | `AVAILABLE → RESERVED (khi khách tạo đơn online)` | **Sửa State Chart:** `AVAILABLE` chỉ chuyển sang `RESERVED` khi **FM thực hiện phân bổ ô kho** cho hợp đồng chờ nhận. Khi Check-in thành công chuyển sang `OCCUPIED`. | **Cao** |
| **20** | [**`docs/WORKFLOWS.md`**](WORKFLOWS.md)<br>§ 2.1, Flow 1 Bước 2 & 4 (Dòng 88-112) | `Lựa chọn ô kho & kiểm tra ô trống khả dụng (Sơ đồ mặt bằng) tại UnitPickerPage.tsx` | **Sửa Workflow Frontend/Backend:** Khách chọn Hạng kho tại `UnitTypeSelectionPage.tsx`. Bỏ gọi API lấy danh sách tọa độ sơ đồ ô kho cho khách online. `POST /reservations` lưu `storage_unit_id = null`. | **Cao** |
| **21** | [**`docs/WORKFLOWS.md`**](WORKFLOWS.md)<br>§ 3.1 & 3.2, Flow 2 (`UNH-CHK-01`) | `Hiện trường ô kho bị ẩm dột... Backend chuyển Contract REJECTED_HANDOVER, kích hoạt hoàn tiền 100%` | **Cập nhật xử lý ngoại lệ:** Staff bấm "Báo lỗi ô kho", FM chọn ô kho AVAILABLE khác cùng loại trên Portal; hợp đồng cập nhật `storage_unit_id` mới và tiếp tục bàn giao ngay trong ca trực. | **Cao** |
| **22** | [**`docs/API-SPEC.md`**](API-SPEC.md)<br>Endpoint `PUT /api/v1/reservations/{id}/assign-unit` | Mô tả: `FM gán Storage Unit sau khi khách thanh toán` | **Chuẩn hóa quy tắc API:** FM gọi endpoint này để gán hoặc đổi `storageUnitId` bất kỳ lúc nào trước `startDate`. Bổ sung kiểm tra quyền RBAC: chỉ `FACILITY_MANAGER` phụ trách cơ sở mới được gọi. | **Trung bình** |
| **23** | [**`docs/API-SPEC.md`**](API-SPEC.md)<br>Endpoint `POST /api/v1/contracts/{id}/check-in` | Request/Response của Check-in | **Ràng buộc kiểm tra:** API check-in bắt buộc `storage_unit_id` trên Contract phải khác `NULL` (đã được FM gán). Nếu `NULL` trả về mã lỗi `409 UNIT_NOT_YET_ALLOCATED`. | **Trung bình** |
| **24** | [**`docs/DATA-DICTIONARY.md`**](DATA-DICTIONARY.md)<br>Bảng `rental_contract` (Dòng 280) | `storage_unit_id`: `BIGINT`, **Bắt buộc = Có** (`NOT NULL`) | **ĐIỀU CHỈNH SCHEMA CƠ SỞ DỮ LIỆU:** Sửa thành `storage_unit_id`: `BIGINT`, **Bắt buộc = Không** (`NULLABLE`). Chỉ bắt buộc `NOT NULL` khi hợp đồng chuyển sang trạng thái `ACTIVE`. | **Cao** (Yêu cầu Flyway Migration) |

---

## 5. LỘ TRÌNH THỰC THI GIAI ĐOẠN 2 (EXECUTION ROADMAP)

Sau khi báo cáo Giai đoạn 1 này được thông qua, công việc kỹ thuật sẽ được triển khai theo 4 bước khép kín:

```mermaid
flowchart LR
    Step1["Bước 1: Đồng bộ 7 Tài liệu Đặc tả"] --> Step2["Bước 2: Viết Flyway Migration DB"]
    Step2 --> Step3["Bước 3: Tái cấu trúc Backend Service & API"]
    Step3 --> Step4["Bước 4: Cập nhật Frontend UI (Customer & FM)"]
```

1. **Bước 1 — Cập nhật Đồng bộ Tài liệu Đặc tả (`docs/`):**
   * Chỉnh sửa 24 vị trí lệch pha đã nêu trong Bảng đối chiếu ở trên trên 7 file tài liệu.
2. **Bước 2 — Migration Cơ sở dữ liệu (Flyway Script):**
   * Tạo script migration `V...__allow_null_storage_unit_for_pending_contracts.sql`:
     ```sql
     ALTER TABLE rental_contract ALTER COLUMN storage_unit_id DROP NOT NULL;
     ```
   * Cập nhật `docs/DATA-DICTIONARY.md`.
3. **Bước 3 — Tái cấu trúc Backend Services & REST APIs:**
   * `ReservationServiceImpl`: Bỏ tham số `storageUnitId` khi tạo đơn đặt chỗ; chỉ kiểm tra `AvailabilityService` theo `unit_type_id`.
   * `FacilityAllocationController` & `Service`: Cài đặt logic cho FM phân bổ ô kho (`PUT /api/v1/reservations/{id}/assign-unit`), đổi trạng thái ô sang `RESERVED`, cho phép đổi ô trước $T-1$.
   * `RenewalServiceImpl`: Cài đặt logic ưu tiên gia hạn (Preemption Right) — tự động gỡ gán khỏi đơn tương lai nếu trùng ô kho.
   * `ContractServiceImpl.checkIn()`: Xác thực `storage_unit_id != null` trước khi ký biên bản và kích hoạt `ACTIVE`.
   * `ScheduledJobs`: Bổ sung tác vụ tự động quét $T-3$ cảnh báo đỏ và 00:00 Auto-assign / Auto-upgrade nếu FM quên.
4. **Bước 4 — Tái cấu trúc Giao diện Frontend (React):**
   * **Customer Portal:** Chuyển đổi màn hình chọn ô kho (`UnitPickerPage.tsx`) thành màn hình chọn Hạng kho thuần túy (`UnitTypeSelectionPage.tsx`), hiển thị ảnh mẫu 3D, kích thước, tiện ích và số lượng còn trống.
   * **Facility Manager Portal:** Xây dựng màn hình **"Bàn làm việc Phân bổ Ô kho (Unit Allocation Workbench)"**: hiển thị danh sách đơn chờ nhận kho kèm sơ đồ mặt bằng trực quan để FM click chọn gán ô nhanh chóng.

---
*Báo cáo Giai đoạn 1 đã hoàn tất đầy đủ. Mời Lead xem xét và duyệt bảng đối chiếu lệch pha để chuyển sang thực thi Giai đoạn 2.*


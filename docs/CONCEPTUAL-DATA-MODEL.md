# MÔ HÌNH DỮ LIỆU QUAN NIỆM (CONCEPTUAL DATA MODEL - CDM)
**Hệ thống**: Self-Storage Facility Rental and Management System  
**Quy mô**: **Đầy đủ 24 Thực thể** khớp 100% với CSDL [database/Storage_Self.sql](../database/Storage_Self.sql) và [docs/DATA-DICTIONARY.md](DATA-DICTIONARY.md)  
**Chuẩn thiết kế theo yêu cầu Giảng viên**: **Entity-Only CDM (Zero Attributes)** — Chỉ thể hiện Thực thể và Bản số Quan hệ, ẩn toàn bộ thuộc tính chi tiết để tập trung vào kiến trúc tổng thể.  
**File sơ đồ PlantUML**: [docs/diagrams/erd-conceptual-model.puml](diagrams/erd-conceptual-model.puml)  
**Sơ đồ đối ứng mức Vật lý/CSDL (Đầy đủ thuộc tính)**: [docs/diagrams/erd-database-model.puml](diagrams/erd-database-model.puml)

---

## 1. Bảng đối chiếu 24 Thực thể giữa Mô hình Quan niệm & CSDL Vật lý

| STT | Tên Thực thể Quan niệm | Tên Bảng CSDL tương ứng | Phân hệ nghiệp vụ | Ý nghĩa nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `app_user` | `app_user` | 1. Người dùng & An ninh | Tài khoản người dùng (Customer, Staff, Manager, BOM, Admin) |
| **2** | `user_facility_assignment` | `user_facility_assignment` | 1. Người dùng & An ninh | Phân công nhân sự theo cơ sở kho (`SA-03`) |
| **3** | `login_history` | `login_history` | 1. Người dùng & An ninh | Lịch sử đăng nhập, IP, thiết bị (`SA-04`) |
| **4** | `audit_log` | `audit_log` | 1. Người dùng & An ninh | Nhật ký kiểm toán các thao tác nhạy cảm hệ thống |
| **5** | `facility` | `facility` | 2. Cơ sở & Danh mục ô kho | Cơ sở kho tự quản (`BM-01`) |
| **6** | `unit_type` | `unit_type` | 2. Cơ sở & Danh mục ô kho | Danh mục kích thước kho chuẩn (S, M, L, XL - `FM-01`) |
| **7** | `facility_unit_type_price` | `facility_unit_type_price` | 2. Cơ sở & Danh mục ô kho | Bảng giá niêm yết theo Cơ sở $\times$ Loại kho (`US-BM-03.1`) |
| **8** | `storage_unit` | `storage_unit` | 2. Cơ sở & Danh mục ô kho | Ô kho vật lý cụ thể (A-101, B-205 - `FM-01`) |
| **9** | `policy_version` | `policy_version` | 3. Chính sách & Biểu phí | Phiên bản chính sách vận hành (`BR-GEN-02`, cọc, ân hạn, phạt nợ) |
| **10** | `extra_fee_type` | `extra_fee_type` | 3. Chính sách & Biểu phí | Danh mục loại phụ phí (phí cấp lại thẻ, vệ sinh, hư hỏng) |
| **11** | `discount_program` | `discount_program` | 3. Chính sách & Biểu phí | Chương trình khuyến mãi, ưu đãi giảm giá (`US-BM-03.3`) |
| **12** | `reservation` | `reservation` | 4. Vòng đời Đặt chỗ & HĐ | Đơn đặt giữ chỗ ô kho (`Flow 1`) |
| **13** | `rental_contract` | `rental_contract` | 4. Vòng đời Đặt chỗ & HĐ | Hợp đồng thuê chính thức (`Flow 2, 3, 6`) |
| **14** | `handover_record` | `handover_record` | 4. Vòng đời Đặt chỗ & HĐ | Biên bản bàn giao Check-in có chữ ký 2 bên (`BR-CHK-03`) |
| **15** | `access_credential` | `access_credential` | 4. Vòng đời Đặt chỗ & HĐ | Quyền mở kho: PIN 6 số, mã QR, thẻ từ, chìa cơ (`BR-ACC-*`) |
| **16** | `contract_renewal` | `contract_renewal` | 4. Vòng đời Đặt chỗ & HĐ | Lịch sử các lần gia hạn hợp đồng (`BR-REN-*`) |
| **17** | `return_request` | `return_request` | 4. Vòng đời Đặt chỗ & HĐ | Yêu cầu trả kho và biên bản nghiệm thu hoàn cọc (`BR-RET-*`) |
| **18** | `payment_transaction` | `payment_transaction` | 5. Tài chính & Sổ cái | Giao dịch cổng thanh toán điện tử (`BR-PAY-*`) |
| **19** | `ledger_entry` | `ledger_entry` | 5. Tài chính & Sổ cái | Sổ cái tài chính bất biến (Immutable Ledger - `BR-PAY-06`) |
| **20** | `contract_extra_charge` | `contract_extra_charge` | 5. Tài chính & Sổ cái | Phụ phí phát sinh trên hợp đồng (`BR-RET-08`) |
| **21** | `overdue_fee_adjustment_request`| `overdue_fee_adjustment_request` | 5. Tài chính & Sổ cái | Đề xuất xin miễn/giảm phạt nợ quá hạn chờ BOM duyệt (`BR-OVD-10`) |
| **22** | `support_request` | `support_request` | 6. Vận hành & Hỗ trợ | Phiếu khiếu nại, sự cố kỹ thuật của khách (`Flow 7`) |
| **23** | `staff_daily_assignment` | `staff_daily_assignment` | 6. Vận hành & Hỗ trợ | Bảng phân công ca trực thực địa cho nhân viên (`FM-05`) |
| **24** | `attachment` | `attachment` | 6. Vận hành & Hỗ trợ | Tệp đính kèm đa hình (ảnh hiện trường, ảnh biên bản) |

---

## 2. Điểm cải tiến và Tuân thủ chỉ đạo của Giảng viên

1. **Bảo toàn 100% thực thể:**
   - Không bị mất bất kỳ một bảng nào so với file CSDL vật lý [Storage_Self.sql](../database/Storage_Self.sql). Cô giáo đối chiếu từ tài liệu SRS $\rightarrow$ ERD Quan niệm $\rightarrow$ CSDL Vật lý sẽ thấy **khớp từng thực thể một**.
2. **Loại bỏ 100% thuộc tính (Zero Attributes):**
   - Chỉ giữ hộp Tên thực thể + Chú thích tiếng Việt ngắn gọn. Giúp sơ đồ cực kỳ gọn nhẹ, thoáng mắt, dễ dàng in ấn và chiếu trên màn hình slide bảo vệ.
3. **Bố cục 6 phân hệ mạch lạc, không giao cắt (Zero Crossing):**
   - Nhóm 1 (Người dùng) $\rightarrow$ Nhóm 2 (Cơ sở kho) $\rightarrow$ Nhóm 3 (Chính sách) $\rightarrow$ Nhóm 4 (Vòng đời Đặt chỗ & Hợp đồng) $\rightarrow$ Nhóm 5 (Tài chính & Sổ cái) $\rightarrow$ Nhóm 6 (Vận hành & Hỗ trợ).
   - Đường nét thẳng vuông góc (orthogonal), khoảng cách rộng rãi (`nodesep 50`, `ranksep 40`) không bị dính chữ hay đè nét.

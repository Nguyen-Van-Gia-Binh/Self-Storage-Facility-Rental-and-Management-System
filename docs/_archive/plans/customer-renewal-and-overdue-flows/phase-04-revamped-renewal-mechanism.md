# Phase 04: Đổi Mới Cơ Chế Gia Hạn: Bỏ Khóa 30 Ngày, Cho Phép Gia Hạn Sau Nộp Phạt, Xử Lý Xung Đột Đặt Trước

## Mục tiêu
Đổi mới toàn diện cơ chế gia hạn hợp đồng theo định hướng thực tế và thân thiện với khách hàng (Notion Audit Issue 10):
1. **Bỏ khóa cứng gia hạn trước 30 ngày:** Mốc 30 ngày chỉ là mốc nhắc nhở (Reminder/Notice) chuẩn bị trả kho nếu không gia hạn; khách hàng vẫn có quyền gia hạn bình thường bất cứ lúc nào.
2. **Cho phép gia hạn khi Quá hạn (Overdue) sau khi nộp phạt:** Khách hàng quá hạn sau khi nộp hết tiền phạt (`penaltyFee === 0`) được quyền gia hạn trực tuyến tiếp tục kỳ thuê mới.
3. **Xử lý xung đột ô kho đã có người đặt trước (Availability Conflict):** Nếu ô kho đã có khách hàng khác đặt giữ chỗ trước cho chu kỳ tiếp theo, hệ thống từ chối gia hạn kèm màn hình hướng dẫn và nút dẫn sang đặt ô kho mới tương đương.

---

## Chi tiết Triển khai

### 1. Tài liệu Nghiệp vụ: Cập Nhật `docs/BUSINESS-RULES.md`
- **`BR-REN-01` & `BR-REN-02`:** Cập nhật lại định nghĩa: Mốc trước ngày hết hạn 30 ngày là thời điểm bắt đầu kích hoạt cảnh báo nhắc gia hạn tự động và chuẩn bị trả kho. Khách hàng vẫn được phép gia hạn trực tuyến bất cứ lúc nào miễn là ô kho chưa có khách hàng khác đặt trước.
- **`BR-REN-06`:** Cho phép hợp đồng `OVERDUE` được gia hạn sau khi đã tất toán toàn bộ tiền phạt quá hạn phát sinh.

### 2. Backend: Cải Tiến `RenewalServiceImpl.java`
- **File:** `backend/src/main/java/com/swp391/selfstorage/contract/service/impl/RenewalServiceImpl.java`
- **Thay đổi:**
  - Tại `getValidContractForRenewal(Long contractId)`:
    - **Xóa bỏ kiểm tra `daysRemaining < 30`** (bỏ ném `ErrorCode.RENEWAL_NOT_ALLOWED` khi dưới 30 ngày).
    - Với hợp đồng `OVERDUE`:
      - Nếu `contract.getOverdueFeeAccrued() > 0`: Ném `CustomException(ErrorCode.RENEWAL_NOT_ALLOWED, "Hợp đồng đang có nợ phạt quá hạn. Vui lòng thanh toán nợ phạt trước khi gia hạn.")`.
      - Nếu `contract.getOverdueFeeAccrued() == 0`: Cho phép tiếp tục luồng gia hạn (Quote và Process Renewal).
    - Với hợp đồng `TERMINATED` hoặc `CLOSED`: Vẫn từ chối gia hạn theo quy định.
  - Tại kiểm tra trùng lịch capacity (dòng 76-92):
    - Khi `hasUpcomingReservation || hasOtherContract`: Ném ngoại lệ `CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE, "Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo. Quý khách vui lòng chọn thuê ô kho mới hoặc lên lịch trả kho.")`.

### 3. Frontend: Nâng Cấp `RentedUnitCard.tsx`
- **File:** `frontend/src/features/customer/components/RentedUnitCard.tsx`
- **Thay đổi:**
  - **Xóa bỏ biến và trạng thái `isCutoffLocked`:** Không còn nút bị disabled mang nhãn `Gia hạn hợp đồng (Đã khóa)`.
  - Khi hợp đồng đang `ACTIVE` và `daysRemaining < 30`:
    - Vẫn hiển thị nút xanh: **"Gia hạn hợp đồng trực tuyến"**.
    - Hiển thị badge hoặc dòng nhắc: `⏳ Còn {daysRemaining} ngày — Hãy gia hạn sớm trước khi có người khác đặt trước ô kho này`.
  - Khi hợp đồng `OVERDUE`:
    - Nếu `penaltyFee > 0`: Hiển thị nút **"Đóng nợ phạt ({formatVND(penaltyFee)})"**.
    - Nếu `penaltyFee === 0`: Nút tự động chuyển thành **"Gia hạn hợp đồng trực tuyến"** (kèm nút "Báo trả kho").

### 4. Frontend: Nâng Cấp Màn Hình Xung Đột Trùng Lịch trên `RenewalPage.tsx`
- **File:** `frontend/src/features/customer/pages/RenewalPage.tsx`
- **Thay đổi:**
  - Bỏ đoạn throw error client-side `remDays < 30`.
  - Bắt lỗi khi API trả về mã lỗi `CAPACITY_NOT_AVAILABLE` hoặc message trùng lịch:
    - Render một màn hình cảnh báo thân thiện (Conflict Notice View):
      - Biểu tượng đồng hồ cát / cảnh báo màu cam.
      - **Tiêu đề:** *"Ô kho {unitNumber} đã có người đặt trước cho kỳ tiếp theo"*
      - **Nội dung:** *"Rất tiếc, khoảng thời gian tiếp theo của ô kho này đã được một khách hàng khác đặt chỗ trước. Bạn không thể tiếp tục gia hạn trên ô kho này."*
      - **2 Nút hành động trực quan:**
        1. Nút chính (Primary): **"Tìm & Thuê ô kho mới tại cơ sở này"** $\rightarrow$ Dẫn tới `/customer/unit-picker?facilityId={facilityId}&unitTypeId={unitTypeId}`.
        2. Nút phụ (Outline): **"Lên lịch nghiệm thu & Trả kho"** $\rightarrow$ Mở popup `ScheduleReturnModal` để khách hẹn nhân viên nghiệm thu hoàn cọc.

### 5. Tests to Write / Update
- **Backend Test:** `backend/src/test/java/com/swp391/selfstorage/contract/service/RenewalServiceTest.java`
  - Cập nhật test case: Cho phép lấy báo giá gia hạn khi `daysRemaining < 30`.
  - Bổ sung test case: Hợp đồng `OVERDUE` có nợ phạt = 0 được phép lấy quote và thanh toán gia hạn thành công.
  - Bổ sung test case: Khi ô kho có future reservation thì ném lỗi `CAPACITY_NOT_AVAILABLE`.
- **Frontend Test:** `frontend/src/features/customer/components/__tests__/RenewalRevampFlow.test.tsx`
  - Test hiển thị nút Gia hạn khi còn dưới 30 ngày (không bị disabled).
  - Test hiển thị nút Gia hạn sau khi nộp phạt quá hạn về 0.
  - Test màn hình hiển thị hướng dẫn khi ô kho bị trùng lịch người khác đặt trước.

---

## Tiêu chí Nghiệm thu (Acceptance Criteria)
1. Khách hàng thuê kho còn dưới 30 ngày vẫn gia hạn online mượt mà.
2. Khách hàng quá hạn sau khi nộp phạt xong có thể tiếp tục gia hạn ô kho của mình.
3. Nếu ô kho đã có người đặt trước, hệ thống hiển thị màn hình hướng dẫn và cung cấp nút đặt ô kho mới tương đương.
4. Mọi test suite đều vượt qua 100%.

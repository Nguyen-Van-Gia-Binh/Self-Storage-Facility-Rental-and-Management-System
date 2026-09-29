# Phase 01: Chuẩn Hóa Thời Điểm Tự Động Khóa Mã Mở Cửa Chính Xác Tại Mốc D+7

## Mục tiêu
Khắc phục lỗi khóa PIN sớm tại D+4 trong API khách hàng ([CustomerRentalServiceImpl.java](file:///c:/Users/admin/Documents/A_FPT/Tempory_Project/Self-Storage-Facility-Rental-and-Management-System/backend/src/main/java/com/swp391/selfstorage/reservation/service/CustomerRentalServiceImpl.java)), đảm bảo đúng quy định Business Rules `BR-OVD-02`, `BR-OVD-03` và `BR-OVD-05`:
- D+1 .. D+3 (ân hạn): Mã mở cửa bình thường, phí phạt = 0.
- D+4 .. D+6 (phạt ngày): Phí phạt phát sinh 10%/ngày, mã mở cửa VẪN BÌNH THƯỜNG để khách vào dọn đồ trả kho.
- D+7 (quá hạn an ninh): Khóa mã truy cập PIN/QR (Access Code sang `Suspended`), khách bắt buộc đóng phạt hoặc liên hệ quầy để nhân viên hỗ trợ.
- Khi khách đã nộp phạt thành công (`overdueFeeAccrued == 0`): Mở lại quyền truy cập tạm thời cho khách dọn đồ.

---

## Chi tiết Triển khai

### 1. Backend: Sửa Logic Mapping tại `CustomerRentalServiceImpl.java`
- **File:** `backend/src/main/java/com/swp391/selfstorage/reservation/service/CustomerRentalServiceImpl.java`
- **Thay đổi:**
  - Thay vì kiểm tra `if (fee > 0)` để set `accessCode = null` và `accessCodeLocked = true`:
  - Kiểm tra theo số ngày quá hạn `overdueDays`:
    - Nếu `overdueDays < 7`: Luôn giữ `accessCode = contract.getAccessCode()` và `accessCodeLocked = false`.
    - Nếu `overdueDays >= 7`:
      - Nếu `fee > 0` (chưa nộp phạt): Set `accessCode = null` và `accessCodeLocked = true`.
      - Nếu `fee == 0` (đã tất toán nợ phạt): Trả lại `accessCode = contract.getAccessCode()` và `accessCodeLocked = false` để khách dọn đồ.
  - Cập nhật câu ghi chú hướng dẫn:
    - Nếu `overdueDays >= 7 && fee > 0`: "Mã PIN của quý khách hiện đang tạm khóa an ninh từ mốc D+7 do hợp đồng quá hạn. Vui lòng thanh toán khoản nợ phạt để mở khóa quyền truy cập."
    - Nếu `overdueDays >= 4 && overdueDays < 7`: "Hợp đồng đã quá hạn {overdueDays} ngày và đang phát sinh phí phạt. Quý khách vui lòng dọn đồ hoặc thanh toán nợ phạt sớm trước mốc D+7 để tránh bị khóa mã cửa."

### 2. Frontend: Đồng bộ Thẻ Ô Kho `RentedUnitCard.tsx`
- **File:** `frontend/src/features/customer/components/RentedUnitCard.tsx`
- **Thay đổi:**
  - Đảm bảo hiển thị cảnh báo đỏ khóa an ninh chỉ khi `contract.status === 'OVERDUE' && overdueDays >= 7 && !contract.accessPin`.
  - Ở giai đoạn D+4 .. D+6: Hiển thị mã PIN kèm nhãn cảnh báo nợ phạt quá hạn, không chặn mã PIN của khách.

### 3. Tests to Write / Update
- **Backend Test:** `backend/src/test/java/com/swp391/selfstorage/reservation/service/CustomerRentalServiceTest.java`
  - Bổ sung test case `shouldKeepPinActive_atOverdueDays4to6_withAccruedPenalty()`: Kiểm tra hợp đồng D+5 có nợ phạt 200.000 đ vẫn có `accessCodeLocked = false` và `accessCode != null`.
  - Cập nhật test case `shouldLockPin_andCalculateOverdueFee_whenOverdueExceedsGracePeriod()` thành mốc `overdueDays >= 7` thì `accessCodeLocked = true`.
  - Bổ sung test case `shouldReopenPin_whenOverdueDebtPaidZero_evenAfterD7()`: Kiểm tra khi `overdueFeeAccrued == 0` tại D+8 thì PIN được mở lại.

---

## Tiêu chí Nghiệm thu (Acceptance Criteria)
1. Hợp đồng ở D+4, D+5, D+6 vẫn trả về mã PIN đầy đủ trên API và hiển thị mã PIN trên giao diện khách hàng.
2. Đúng 00:00 ngày D+7 hoặc khi `overdueDays >= 7` và còn nợ phạt, mã PIN bị ẩn và hiển thị cảnh báo đỏ khóa an ninh.
3. Test suite `CustomerRentalServiceTest` pass 100%.

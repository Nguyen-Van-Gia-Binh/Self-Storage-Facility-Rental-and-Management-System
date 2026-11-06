# Phase 02: Backend Lưu Vết Đơn Chờ Thanh Toán Gia Hạn (48 Giờ) & Tối Ưu Checkout Link

## Mục tiêu
Bổ sung trường thông tin giao dịch chờ thanh toán gia hạn (`PENDING_RENEWAL`) vào phản hồi tóm tắt hợp đồng thuê của khách hàng (`CustomerRentalSummaryResponse`). Tự động xử lý hết hạn giao dịch sau 48 giờ (`BR-REN-10`). Tối ưu `PaymentService` để tái sử dụng mã đơn thanh toán (`orderCode`) đang chờ thay vì tạo đơn rác trùng lặp khi khách bấm gia hạn nhiều lần.

## Phạm vi công việc (Concrete Tasks)

- [ ] **Step 2.1: Mở rộng DTO `CustomerRentalSummaryResponse.java`**
  - Bổ sung 5 trường mới:
    ```java
    private Boolean hasPendingRenewal;
    private Long pendingRenewalOrderCode;
    private Integer pendingRenewalMonths;
    private Long pendingRenewalAmount;
    private String pendingRenewalExpiresAt;
    ```
  - Bổ sung đầy đủ getters & setters cho 5 trường trên.

- [ ] **Step 2.2: Cập nhật `CustomerRentalServiceImpl.java` để tra cứu pending transaction**
  - Inject `@Autowired(required = false) PaymentTransactionRepository paymentTransactionRepository` vào constructor của `CustomerRentalServiceImpl`.
  - Trong phương thức `populateSummaryFields(CustomerRentalSummaryResponse res, RentalContract contract)`:
    - Nếu `paymentTransactionRepository != null`:
      - Tra cứu: `paymentTransactionRepository.findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(contract.getId(), "CONTRACT_RENEWAL")`.
      - Nếu tìm thấy bản ghi `txn` có `status = "PENDING"`:
        - Tính thời điểm hết hạn: `expiresAt = txn.getCreatedAt().plusHours(48)`.
        - Nếu `LocalDateTime.now().isBefore(expiresAt)`:
          - Gán `res.setHasPendingRenewal(true);`
          - Gán `res.setPendingRenewalOrderCode(txn.getOrderCode());`
          - Gán `res.setPendingRenewalMonths(txn.getRenewalMonths());`
          - Gán `res.setPendingRenewalAmount(txn.getAmount());`
          - Gán `res.setPendingRenewalExpiresAt(expiresAt.toString());`
        - Nếu đã quá 48h (`LocalDateTime.now().isAfter(expiresAt)`):
          - Đánh dấu đơn thất bại/hết hạn: `txn.setStatus("FAILED");`
          - `paymentTransactionRepository.save(txn);`
          - Gán `res.setHasPendingRenewal(false);`
      - Nếu không có giao dịch PENDING:
        - Gán `res.setHasPendingRenewal(false);`

- [ ] **Step 2.3: Tối ưu `PaymentServiceImpl.java` cho luồng gia hạn và hủy giao dịch**
  - Trong phương thức `createCheckoutLink`:
    - Tại nhánh xử lý `CONTRACT_RENEWAL`:
      - Tra cứu giao dịch `PENDING` gần nhất của hợp đồng: `findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(contract.getId(), "CONTRACT_RENEWAL")`.
      - Nếu tồn tại giao dịch `PENDING` và còn hạn (< 48h):
        - Nếu số tháng yêu cầu khớp (`txn.getRenewalMonths().equals(months)`):
          - Lấy lại link checkout hiện có hoặc khởi tạo response tái sử dụng `txn.getOrderCode()`, tránh insert thêm record rác.
        - Nếu khách thay đổi số tháng:
          - Đánh dấu giao dịch cũ `txn.setStatus("FAILED")` và lưu DB, sau đó sinh giao dịch mới cho số tháng mới.
  - Trong phương thức `processSandboxTransfer`:
    - Đảm bảo khi nhận `action = "CANCEL"`: Set `payment.setStatus("FAILED")`, lưu DB và trả về `paymentMapper.toResponse(payment)`.

- [ ] **Step 2.4: Viết Unit Test Backend kiểm chứng (TDD)**
  - File: `backend/src/test/java/com/swp391/selfstorage/reservation/service/CustomerRentalServiceTest.java`
  - Bổ sung các test cases:
    - `testPopulateSummaryFields_WithPendingRenewalPayment_Within48Hours()`: Assert `hasPendingRenewal == true` và `pendingRenewalOrderCode` được nạp đúng.
    - `testPopulateSummaryFields_WithExpiredRenewalPayment_After48Hours()`: Assert `hasPendingRenewal == false` và transaction được cập nhật sang `FAILED`.
  - Chạy `mvn test -Dtest=CustomerRentalServiceTest,PaymentServiceTest` -> xác nhận Green 100%.

- [ ] **Step 2.5: Commit Git Phase 2**
  - Message: `feat(payment): lưu vết đơn chờ thanh toán gia hạn 48h và tối ưu checkout`

## Files / Modules Affected
- `backend/src/main/java/com/swp391/selfstorage/reservation/dto/CustomerRentalSummaryResponse.java` (MODIFY)
- `backend/src/main/java/com/swp391/selfstorage/reservation/service/CustomerRentalServiceImpl.java` (MODIFY)
- `backend/src/main/java/com/swp391/selfstorage/payment/service/impl/PaymentServiceImpl.java` (MODIFY)
- `backend/src/test/java/com/swp391/selfstorage/reservation/service/CustomerRentalServiceTest.java` (MODIFY)

## Dependencies
- Không phụ thuộc Phase 01. Phase 03 và Phase 04 ở Frontend sẽ phụ thuộc vào các trường DTO và logic của Phase 02 này.

## Tests to Write First (TDD)
- `CustomerRentalServiceTest.java`:
  - `testPopulateSummaryFields_WithPendingRenewalPayment_Within48Hours`
  - `testPopulateSummaryFields_WithExpiredRenewalPayment_After48Hours`
- `PaymentServiceTest.java`:
  - Kiểm tra tái sử dụng orderCode khi đã có pending renewal cùng số tháng.
  - Kiểm tra chuyển FAILED giao dịch cũ khi đổi số tháng gia hạn.

## Verification & Acceptance Criteria
- Lệnh kiểm tra: `mvn test -Dtest=CustomerRentalServiceTest,PaymentServiceTest`
- Kết quả `BUILD SUCCESS` không có bất kỳ test case nào thất bại.

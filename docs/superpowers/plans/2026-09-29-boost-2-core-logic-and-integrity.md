# Boost-2: Core Logic & Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa 5 nhóm lỗi P0 về logic nghiệp vụ sai, bảo mật chưa đủ, và UX nhập nhằng sau Đợt 1 (PR #166).

**Architecture:** Backend Spring Boot 3 (Java 17) + Frontend React 18 (TypeScript + Vite), kết nối Real API hoàn toàn (không mock data). Tất cả thay đổi backend đều có unit test đi kèm theo TDD.

**Tech Stack:** Java 17, Spring Boot 3, React 18 TypeScript, Vitest, JUnit 5 + Mockito

**Spec:** `docs/BUSINESS-RULES.md` (BR-OVD-05, BR-OVD-08), `docs/USER-STORIES-AND-USE-CASES.md`

## Global Constraints

- Java 17, Spring Boot 3, Maven — chạy `$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'` trước khi test.
- PowerShell: dùng `;` thay `&&` nối lệnh.
- Không sửa migration cũ. Chỉ xóa nợ phạt, giữ OVERDUE — KHÔNG chuyển ACTIVE.
- Frontend kết nối Real API (không mock). `tokenStorage.getAccessToken()` check auth.
- Conventional Commits tiếng Việt cho mỗi commit.

---

## Trạng thái API Frontend (Quan trọng)

Frontend **đã kết nối Real API** cho tất cả các luồng chính:
- `UnitPickerPage` → `fetchFacilities`, `fetchStorageUnitsApi`, `checkUnitAvailability` (Real API)
- `PaymentPage` → `createCheckout`, `pollPaymentStatus` (Real API)
- `SandboxCheckoutPage` → `customerApi.getPaymentStatus`, `customerApi.processSandboxTransfer` (Real API)
- `MyUnitsPage` / `RentedUnitCard` → dữ liệu từ API hợp đồng (Real API)

Không cần sửa kết nối API. Chỉ sửa logic hiển thị và bảo vệ auth guard.

---

## Task 1: Fix Mục 8 — OVERDUE_PENALTY không được chuyển về ACTIVE

**Files:**
- Modify: `backend/src/main/java/com/swp391/selfstorage/payment/service/impl/PaymentServiceImpl.java:226-241` (Sandbox)
- Modify: `backend/src/main/java/com/swp391/selfstorage/payment/service/impl/PaymentServiceImpl.java:336-351` (PayOS Webhook)
- Modify: `backend/src/test/java/com/swp391/selfstorage/payment/service/PaymentServiceTest.java` (thêm test)

**Interfaces:**
- Consumes: `RentalContractRepository.findById(Long)`, `RentalContractRepository.save(RentalContract)`
- Produces: Contract giữ nguyên `OVERDUE`, `overdueFeeAccrued = 0` sau thanh toán phạt

- [ ] **Step 1: Thêm test kiểm chứng hợp đồng KHÔNG chuyển về ACTIVE**

Thêm vào `PaymentServiceTest.java`:
```java
@Test
@DisplayName("Sandbox OVERDUE_PENALTY: Hợp đồng OVERDUE giữ nguyên OVERDUE sau thanh toán phạt (không chuyển ACTIVE)")
void processSandboxTransfer_OverduePenalty_ContractStaysOverdue() {
    PaymentTransaction txn = PaymentTransaction.builder()
            .id(999L).orderCode(88889999L).amount(250_000L)
            .status("PENDING").transactionType("OVERDUE_PENALTY").contractId(80017L)
            .build();
    com.swp391.selfstorage.contract.entity.RentalContract contract =
            new com.swp391.selfstorage.contract.entity.RentalContract();
    contract.setId(80017L);
    contract.setStatus(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE);
    contract.setOverdueFeeAccrued(250_000L);
    when(paymentTransactionRepository.findByOrderCode(88889999L)).thenReturn(Optional.of(txn));
    when(rentalContractRepository.findById(80017L)).thenReturn(Optional.of(contract));
    when(paymentTransactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    paymentService.processSandboxTransfer(88889999L, "TRANSFER_SUCCESS");

    assertEquals(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE, contract.getStatus(),
            "Hợp đồng PHẢI giữ nguyên OVERDUE sau khi nộp phạt — KHÔNG chuyển ACTIVE");
    assertEquals(0L, contract.getOverdueFeeAccrued(), "Nợ phạt phải được xóa về 0");
}

@Test
@DisplayName("PayOS Webhook OVERDUE_PENALTY: Hợp đồng OVERDUE giữ nguyên OVERDUE sau thanh toán phạt")
void processPayOSWebhook_OverduePenalty_ContractStaysOverdue() {
    PaymentTransaction txn = PaymentTransaction.builder()
            .id(1000L).orderCode(77778888L).amount(300_000L)
            .status("PENDING").transactionType("OVERDUE_PENALTY").contractId(90001L)
            .build();
    com.swp391.selfstorage.contract.entity.RentalContract contract =
            new com.swp391.selfstorage.contract.entity.RentalContract();
    contract.setId(90001L);
    contract.setStatus(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE);
    contract.setOverdueFeeAccrued(300_000L);
    when(paymentTransactionRepository.findByOrderCode(77778888L)).thenReturn(Optional.of(txn));
    when(rentalContractRepository.findById(90001L)).thenReturn(Optional.of(contract));
    when(paymentTransactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    Map<String, Object> payload = Map.of("code", "00", "data",
            Map.of("orderCode", 77778888L, "reference", "FT001"));
    paymentService.processPayOSWebhook(payload);

    assertEquals(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE, contract.getStatus(),
            "Hợp đồng PHẢI giữ nguyên OVERDUE — KHÔNG chuyển ACTIVE qua Webhook");
    assertEquals(0L, contract.getOverdueFeeAccrued());
}
```

- [ ] **Step 2: Chạy test để xác nhận test FAIL (Red)**

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
mvn test -pl backend -Dtest="PaymentServiceTest#processSandboxTransfer_OverduePenalty_ContractStaysOverdue,PaymentServiceTest#processPayOSWebhook_OverduePenalty_ContractStaysOverdue" -Dsurefire.failIfNoSpecifiedTests=false
```

- [ ] **Step 3: Sửa PaymentServiceImpl — Sandbox (lines ~226-241)**

Thay khối `else if ("OVERDUE_PENALTY"...) ... c.setStatus(ACTIVE)` bằng:
```java
} else if ("OVERDUE_PENALTY".equalsIgnoreCase(payment.getTransactionType())
        || "EXTRA_FEE_PAYMENT".equalsIgnoreCase(payment.getTransactionType())) {
    if (payment.getContractId() != null) {
        rentalContractRepository.findById(payment.getContractId()).ifPresent(c -> {
            c.setOverdueFeeAccrued(0L);
            // BR-OVD-08: Sau khi nộp phạt, hợp đồng GIỮ NGUYÊN OVERDUE.
            // Khách đã thanh toán xong nợ → được phép Báo trả kho (PENDING_RETURN).
            // Không chuyển về ACTIVE — hợp đồng đã hết hạn thực sự.
            rentalContractRepository.save(c);
            log.info("Sandbox: Xóa nợ phạt về 0 cho contractId={}, giữ nguyên trạng thái OVERDUE", c.getId());
        });
    }
}
```

- [ ] **Step 4: Sửa PaymentServiceImpl — PayOS Webhook (lines ~336-351)**

Tương tự bỏ `c.setStatus(ACTIVE)`:
```java
} else if ("OVERDUE_PENALTY".equalsIgnoreCase(payment.getTransactionType())
        || "EXTRA_FEE_PAYMENT".equalsIgnoreCase(payment.getTransactionType())) {
    if (payment.getContractId() != null) {
        rentalContractRepository.findById(payment.getContractId()).ifPresent(c -> {
            c.setOverdueFeeAccrued(0L);
            // BR-OVD-08: Giữ nguyên OVERDUE, mở khóa quyền Báo trả kho (PENDING_RETURN).
            rentalContractRepository.save(c);
            log.info("PayOS Webhook: Xóa nợ phạt về 0 cho contractId={}, giữ nguyên trạng thái OVERDUE", c.getId());
        });
    }
}
```

- [ ] **Step 5: Chạy test để xác nhận PASS (Green)**

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
mvn test -pl backend -Dtest="PaymentServiceTest" -Dsurefire.failIfNoSpecifiedTests=false
```

- [ ] **Step 6: Commit**

```powershell
git add backend/src/main/java/com/swp391/selfstorage/payment/service/impl/PaymentServiceImpl.java
git add backend/src/test/java/com/swp391/selfstorage/payment/service/PaymentServiceTest.java
git commit -m "fix(payment): giữ nguyên OVERDUE sau thanh toán phạt, không chuyển ACTIVE (BR-OVD-08)"
```

---

## Task 2: Fix Mục 7 — Khóa mã truy cập tại D+7 (BR-OVD-05)

**Files:**
- Modify: `backend/src/main/java/com/swp391/selfstorage/policy/service/impl/OverdueProcessingServiceImpl.java:82-100`
- Modify: `backend/src/test/java/com/swp391/selfstorage/policy/service/OverdueProcessingServiceTest.java` (thêm test D+7)
- Modify: `frontend/src/features/customer/components/RentedUnitCard.tsx:217` (điều kiện khóa PIN)

**Interfaces:**
- Consumes: `RentalContract.getAccessCode()`, `RentalContract.setAccessCode(null)`, `overdueDays >= 7`
- Produces: D+7 → accessCode=null; D+4..D+6 → khách vẫn thấy PIN

- [ ] **Step 1: Thêm test kiểm chứng D+7 khóa PIN**

Thêm vào `OverdueProcessingServiceTest.java`:
```java
@Test
@DisplayName("BR-OVD-05: Mốc D+7 — Khóa mã truy cập (accessCode = null)")
void testAccessCodeLock_D7_ShouldSuspendAccessCode() {
    LocalDate runDate = baseEndDate.plusDays(7); // D+7

    RentalContract contract = RentalContract.builder()
            .id(104L).code("CTR-005").status(ContractStatus.OVERDUE)
            .endDateExclusive(baseEndDate).depositAmount(2_000_000L)
            .depositBalance(2_000_000L).overdueFeeAccrued(400_000L)
            .accessCode("AC-777999").build();

    when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
            .thenReturn(Optional.of(mockPolicy));
    when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
            .thenReturn(List.of(contract));

    overdueProcessingService.processOverdueContracts(runDate);

    assertNull(contract.getAccessCode(), "D+7: accessCode phải bị khóa (null) theo BR-OVD-05");
    assertEquals(ContractStatus.OVERDUE, contract.getStatus(), "D+7: hợp đồng vẫn OVERDUE, chưa TERMINATED");
}

@Test
@DisplayName("BR-OVD-05: Mốc D+5 — Chưa đến D+7, accessCode vẫn còn")
void testAccessCodeLock_D5_ShouldKeepAccessCode() {
    LocalDate runDate = baseEndDate.plusDays(5); // D+5

    RentalContract contract = RentalContract.builder()
            .id(105L).code("CTR-006").status(ContractStatus.OVERDUE)
            .endDateExclusive(baseEndDate).depositAmount(2_000_000L)
            .depositBalance(2_000_000L).overdueFeeAccrued(0L)
            .accessCode("AC-555111").build();

    when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
            .thenReturn(Optional.of(mockPolicy));
    when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
            .thenReturn(List.of(contract));

    overdueProcessingService.processOverdueContracts(runDate);

    assertEquals("AC-555111", contract.getAccessCode(),
            "D+5: accessCode CHƯA bị khóa — khách vẫn vào được để dọn đồ (BR-OVD-05)");
}
```

- [ ] **Step 2: Chạy test để xác nhận FAIL (Red)**

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
mvn test -pl backend -Dtest="OverdueProcessingServiceTest#testAccessCodeLock_D7_ShouldSuspendAccessCode,OverdueProcessingServiceTest#testAccessCodeLock_D5_ShouldKeepAccessCode" -Dsurefire.failIfNoSpecifiedTests=false
```

- [ ] **Step 3: Sửa OverdueProcessingServiceImpl — thêm khóa D+7**

Trong nhánh `else if (overdueDays < terminationDays)` (D+4..D+9), sau khi set penalty, thêm:
```java
// BR-OVD-05: Khóa mã truy cập tại D+7 (nhưng D+4..D+6 vẫn cho vào dọn đồ)
int lockAccessDays = (policy != null && policy.getOverdueLockAccessDays() != null)
        ? policy.getOverdueLockAccessDays() : 7;
if (overdueDays >= lockAccessDays && contract.getAccessCode() != null) {
    contract.setAccessCode(null);
    log.info("Hợp đồng [{}] D+{}: Khóa mã truy cập theo BR-OVD-05.", contract.getCode(), overdueDays);
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS (Green)**

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
mvn test -pl backend -Dtest="OverdueProcessingServiceTest" -Dsurefire.failIfNoSpecifiedTests=false
```

- [ ] **Step 5: Sửa Frontend RentedUnitCard.tsx — điều kiện hiển thị PIN (D+7 thay penaltyFee>0)**

Tại line ~217, sửa:
```tsx
// Cũ: contract.status === 'OVERDUE' && penaltyFee > 0
// Mới: overdueDays >= 7 hoặc accessPin null
```

- [ ] **Step 6: Commit**

```powershell
git add backend/src/main/java/com/swp391/selfstorage/policy/service/impl/OverdueProcessingServiceImpl.java
git add backend/src/test/java/com/swp391/selfstorage/policy/service/OverdueProcessingServiceTest.java
git add frontend/src/features/customer/components/RentedUnitCard.tsx
git commit -m "fix(policy): khóa mã truy cập D+7 theo BR-OVD-05, sửa điều kiện UI PIN card"
```

---

## Task 3: Fix Mục 1 — Buffer 15 ngày & UnitPicker fallback

**Files:**
- Modify: `backend/src/main/java/com/swp391/selfstorage/unit/repository/StorageUnitRepository.java:80-102`
- Modify: `frontend/src/features/customer/pages/UnitPickerPage.tsx:380-386`

- [ ] **Step 1: Sửa SQL buffer 15 ngày trong StorageUnitRepository**

`countOverlappingContracts`: đổi `c.end_date > :startDate` → `DATEADD(day, 15, c.end_date_exclusive) > :startDate`
`findOccupiedUnitIdsByDateRange`: tương tự

- [ ] **Step 2: Sửa UnitPickerPage — bỏ fallback defaultMatchingUnit**

```tsx
const selectedUnit = useMemo(() => {
  if (selectedUnitId) {
    return displayFacilityUnits.find((u) => u.id === selectedUnitId) || null;
  }
  return null; // Không fallback tự động
}, [displayFacilityUnits, selectedUnitId]);
```

- [ ] **Step 3: Commit**

```powershell
git add backend/.../StorageUnitRepository.java frontend/.../UnitPickerPage.tsx
git commit -m "fix(unit): buffer 15 ngày giữa hợp đồng, bỏ auto-select ô kho mặc định"
```

---

## Task 4: Fix Mục 9 — PENDING_RETURN ẩn nút Gia hạn

**Files:**
- Modify: `frontend/src/features/customer/components/RentedUnitCard.tsx:344-390`

Thêm kiểm tra `contract.status === 'PENDING_RETURN'` trước nhánh `isCutoffLocked` và `else` (nút Gia hạn). Trạng thái này không được vào nhánh cuối (render nút Gia hạn).

- [ ] **Step 1: Sửa RentedUnitCard — nhánh PENDING_RETURN đã đúng (xác nhận)**
- [ ] **Step 2: Commit**

---

## Task 5: Fix Mục 2 — Auth Guard PaymentController & Frontend

**Files:**
- Modify: `backend/src/main/java/com/swp391/selfstorage/payment/controller/PaymentController.java`
- Modify: `frontend/src/features/customer/pages/PaymentPage.tsx`
- Modify: `frontend/src/features/customer/pages/SandboxCheckoutPage.tsx`

- [ ] **Step 1: Thêm `@PreAuthorize("isAuthenticated()")` lên 3 endpoint**
- [ ] **Step 2: Thêm Auth Guard `useEffect` trong PaymentPage và SandboxCheckoutPage**
- [ ] **Step 3: Commit**

---

## Task 6: Chạy full test suite và cập nhật DASHBOARD

- [ ] **Step 1:** `mvn clean test -pl backend`
- [ ] **Step 2:** `npm run build` trong `frontend`
- [ ] **Step 3:** Cập nhật `docs/DASHBOARD.md`

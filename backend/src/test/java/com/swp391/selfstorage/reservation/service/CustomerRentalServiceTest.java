package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.reservation.dto.CustomerRentalDetailResponse;
import com.swp391.selfstorage.reservation.dto.CustomerRentalSummaryResponse;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import com.swp391.selfstorage.reservation.dto.AccessLogResponse;
import com.swp391.selfstorage.reservation.dto.ChangePinRequest;
import com.swp391.selfstorage.reservation.entity.AccessLog;
import com.swp391.selfstorage.reservation.repository.AccessLogRepository;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerRentalServiceTest {

    @Mock private RentalContractRepository rentalContractRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @Mock private FacilityRepository facilityRepository;
    @Mock private UnitTypeRepository unitTypeRepository;
    @Mock private AccessLogRepository accessLogRepository;
    @Mock private com.swp391.selfstorage.contract.repository.ReturnRequestRepository returnRequestRepository;
    @Mock private com.swp391.selfstorage.payment.repository.PaymentTransactionRepository paymentTransactionRepository;
    @Mock private com.swp391.selfstorage.policy.repository.PolicyVersionRepository policyVersionRepository;

    @InjectMocks
    private CustomerRentalServiceImpl customerRentalService;

    private UserPrincipal customerUser;
    private Facility facility;
    private StorageUnit storageUnit;
    private UnitType unitType;
    private Reservation reservation;
    private RentalContract activeContract;
    private RentalContract overdueContract;

    @BeforeEach
    void setUp() {
        customerUser = new UserPrincipal(
                15L, "customer@test.com", "pass", "Nguyễn Văn Khách",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, Collections.emptyList(), Collections.emptyList()
        );

        facility = new Facility();
        facility.setId(1L);
        facility.setCode("FAC-01");
        facility.setName("Kho Tự Quản Tân Thuận");
        facility.setAddress("123 Nguyễn Thị Thập, Quận 7");
        facility.setPhone("0281234567");
        facility.setStatus(FacilityStatus.ACTIVE);

        unitType = new UnitType();
        unitType.setId(7L);
        unitType.setCode("UT-S-01");
        unitType.setName("Loại S — 3m²");
        unitType.setWidthM(BigDecimal.valueOf(1.5));
        unitType.setLengthM(BigDecimal.valueOf(2.0));
        unitType.setHeightM(BigDecimal.valueOf(2.5));
        unitType.setActive(true);

        storageUnit = new StorageUnit();
        storageUnit.setId(42L);
        storageUnit.setCode("S-101");
        storageUnit.setFacilityId(1L);
        storageUnit.setUnitTypeId(7L);
        storageUnit.setFloor(1);
        storageUnit.setPosition("Dãy A");
        storageUnit.setStatus(StorageUnitStatus.OCCUPIED);

        reservation = new Reservation();
        reservation.setId(1042L);
        reservation.setCode("RSV-2026-001042");

        activeContract = new RentalContract();
        activeContract.setId(501L);
        activeContract.setCode("CTR-202610-001");
        activeContract.setReservationId(1042L);
        activeContract.setCustomerId(15L);
        activeContract.setFacilityId(1L);
        activeContract.setStorageUnitId(42L);
        activeContract.setUnitTypeId(7L);
        activeContract.setStartDate(LocalDate.now().minusMonths(2));
        activeContract.setEndDateExclusive(LocalDate.now().plusDays(4)); // Còn 4 ngày -> nearExpiration = true
        activeContract.setRentalMonths(3);
        activeContract.setMonthlyPrice(800000L);
        activeContract.setDepositAmount(800000L);
        activeContract.setDepositBalance(800000L);
        activeContract.setStatus(ContractStatus.ACTIVE);
        activeContract.setAccessCode("482019");

        overdueContract = new RentalContract();
        overdueContract.setId(502L);
        overdueContract.setCode("CTR-202610-002");
        overdueContract.setCustomerId(15L);
        overdueContract.setFacilityId(1L);
        overdueContract.setStorageUnitId(42L);
        overdueContract.setUnitTypeId(7L);
        overdueContract.setStartDate(LocalDate.now().minusMonths(3));
        overdueContract.setEndDateExclusive(LocalDate.now().minusDays(6)); // Quá hạn 6 ngày -> phạt và khóa PIN
        overdueContract.setRentalMonths(3);
        overdueContract.setMonthlyPrice(1000000L);
        overdueContract.setDepositAmount(1000000L);
        overdueContract.setStatus(ContractStatus.OVERDUE);
        overdueContract.setAccessCode("999888");
        overdueContract.setOverdueFeeAccrued(300000L);
    }

    @Test
    @DisplayName("US-SC-05.1: Xem danh sách ô kho đang thuê với cờ cảnh báo sắp hết hạn")
    void shouldReturnMyRentals_successfully_withNearExpirationFlag() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<RentalContract> page = new PageImpl<>(List.of(activeContract), pageable, 1);

        when(rentalContractRepository.findByCustomerIdAndStatus(eq(15L), eq(ContractStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(page);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(storageUnit));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(reservation));

        PageResponse<CustomerRentalSummaryResponse> response = customerRentalService.getMyRentals(
                customerUser, "ACTIVE", pageable
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        CustomerRentalSummaryResponse item = response.getContent().get(0);
        assertEquals("CTR-202610-001", item.getContractCode());
        assertEquals("S-101", item.getStorageUnitCode());
        assertEquals("Kho Tự Quản Tân Thuận", item.getFacilityName());
        assertTrue(item.isNearExpiration());
        assertEquals(4, item.getDaysRemaining());
        assertEquals("482019", item.getAccessCode());
        assertFalse(item.isAccessCodeLocked());
    }

    @Test
    @DisplayName("US-SC-05.1 & BR-OVD-05: Hợp đồng quá hạn từ D+7 trở lên bị khóa an ninh mã PIN nếu còn nợ phạt")
    void shouldLockPin_andCalculateOverdueFee_whenOverdueExceedsD7() {
        Pageable pageable = PageRequest.of(0, 10);
        overdueContract.setEndDateExclusive(LocalDate.now().minusDays(7)); // Quá hạn đúng 7 ngày -> Khóa an ninh PIN
        Page<RentalContract> page = new PageImpl<>(List.of(overdueContract), pageable, 1);

        when(rentalContractRepository.findByCustomerIdAndStatus(eq(15L), eq(ContractStatus.OVERDUE), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<CustomerRentalSummaryResponse> response = customerRentalService.getMyRentals(
                customerUser, "OVERDUE", pageable
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        CustomerRentalSummaryResponse item = response.getContent().get(0);
        assertEquals(7, item.getOverdueDays());
        assertTrue(item.isAccessCodeLocked());
        assertNull(item.getAccessCode());
        assertEquals(300000L, item.getOverdueFeeAccrued());
        assertEquals(300000L, item.getTotalOutstandingDebt());
    }

    @Test
    @DisplayName("US-SC-05.1 & BR-OVD-03: Tại D+4..D+6 có nợ phạt nhưng mã PIN vẫn mở để khách vào dọn kho")
    void shouldKeepPinActive_atOverdueDays4to6_withAccruedPenalty() {
        Pageable pageable = PageRequest.of(0, 10);
        overdueContract.setEndDateExclusive(LocalDate.now().minusDays(5)); // D+5
        overdueContract.setOverdueFeeAccrued(200000L);
        Page<RentalContract> page = new PageImpl<>(List.of(overdueContract), pageable, 1);

        when(rentalContractRepository.findByCustomerIdAndStatus(eq(15L), eq(ContractStatus.OVERDUE), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<CustomerRentalSummaryResponse> response = customerRentalService.getMyRentals(
                customerUser, "OVERDUE", pageable
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        CustomerRentalSummaryResponse item = response.getContent().get(0);
        assertEquals(5, item.getOverdueDays());
        assertFalse(item.isAccessCodeLocked());
        assertEquals("999888", item.getAccessCode());
        assertEquals(200000L, item.getOverdueFeeAccrued());
    }

    @Test
    @DisplayName("US-SC-05.1 & BR-OVD-05: Khi đã tất toán nợ phạt về 0 thì mở lại mã PIN dù quá hạn sau D+7")
    void shouldReopenPin_whenOverdueDebtPaidZero_evenAfterD7() {
        Pageable pageable = PageRequest.of(0, 10);
        overdueContract.setEndDateExclusive(LocalDate.now().minusDays(8)); // D+8
        overdueContract.setOverdueFeeAccrued(0L); // Đã nộp phạt xong
        Page<RentalContract> page = new PageImpl<>(List.of(overdueContract), pageable, 1);

        when(rentalContractRepository.findByCustomerIdAndStatus(eq(15L), eq(ContractStatus.OVERDUE), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<CustomerRentalSummaryResponse> response = customerRentalService.getMyRentals(
                customerUser, "OVERDUE", pageable
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        CustomerRentalSummaryResponse item = response.getContent().get(0);
        assertEquals(8, item.getOverdueDays());
        assertFalse(item.isAccessCodeLocked());
        assertEquals("999888", item.getAccessCode());
        assertEquals(0L, item.getOverdueFeeAccrued());
    }

    @Test
    @DisplayName("US-SC-05.1 & BR-RET-09: Hợp đồng PENDING_RETURN vẫn giữ nguyên mã PIN và không bị khóa")
    void shouldKeepPinActive_whenContractIsPendingReturn() {
        Pageable pageable = PageRequest.of(0, 10);
        RentalContract pendingReturnContract = new RentalContract();
        pendingReturnContract.setId(503L);
        pendingReturnContract.setCode("CTR-202610-003");
        pendingReturnContract.setCustomerId(15L);
        pendingReturnContract.setFacilityId(1L);
        pendingReturnContract.setStorageUnitId(42L);
        pendingReturnContract.setUnitTypeId(7L);
        pendingReturnContract.setStatus(ContractStatus.PENDING_RETURN);
        pendingReturnContract.setAccessCode("654321");
        pendingReturnContract.setStartDate(LocalDate.now().minusMonths(2));
        pendingReturnContract.setEndDateExclusive(LocalDate.now().plusDays(10));

        when(rentalContractRepository.findByCustomerIdAndStatus(eq(15L), eq(ContractStatus.PENDING_RETURN), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(pendingReturnContract), pageable, 1));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(storageUnit));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));

        PageResponse<CustomerRentalSummaryResponse> response = customerRentalService.getMyRentals(
                customerUser, "PENDING_RETURN", pageable
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        CustomerRentalSummaryResponse item = response.getContent().get(0);
        assertEquals("654321", item.getAccessCode());
        assertFalse(item.isAccessCodeLocked());
    }

    @Test
    @DisplayName("US-SC-05.1: Lọc tab lịch sử (CLOSED, TERMINATED)")
    void shouldReturnHistoryRentals_whenStatusFilterIsHistory() {
        Pageable pageable = PageRequest.of(0, 10);
        RentalContract closedContract = new RentalContract();
        closedContract.setId(401L);
        closedContract.setCode("CTR-202601-001");
        closedContract.setCustomerId(15L);
        closedContract.setStatus(ContractStatus.CLOSED);

        when(rentalContractRepository.findByCustomerIdAndStatusIn(eq(15L), anyList(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(closedContract), pageable, 1));

        PageResponse<CustomerRentalSummaryResponse> response = customerRentalService.getMyRentals(
                customerUser, "HISTORY", pageable
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("CTR-202601-001", response.getContent().get(0).getContractCode());
    }

    @Test
    @DisplayName("US-SC-05.2: Xem chi tiết hợp đồng và hướng dẫn ra vào ô kho")
    void shouldReturnRentalDetail_successfully_whenBelongsToCustomer() {
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(activeContract));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(storageUnit));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(reservation));

        CustomerRentalDetailResponse detail = customerRentalService.getMyRentalDetail(501L, customerUser);

        assertNotNull(detail);
        assertEquals("CTR-202610-001", detail.getContractCode());
        assertEquals("482019", detail.getAccessCode());
        assertNotNull(detail.getInstructionNotes());
        assertTrue(detail.getInstructionNotes().contains("phím #"));
        assertNotNull(detail.getAllowedActions());
        assertTrue(detail.getAllowedActions().contains("RENEW"));
    }

    @Test
    @DisplayName("US-SC-05.2 & SA-03: Báo lỗi ACCESS_DENIED khi xem hợp đồng của người khác")
    void shouldThrowAccessDenied_whenCustomerViewsOtherCustomerContract() {
        UserPrincipal otherCustomer = new UserPrincipal(
                999L, "other@test.com", "pass", "Other",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, Collections.emptyList(), Collections.emptyList()
        );

        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(activeContract));

        CustomException ex = assertThrows(CustomException.class, () ->
                customerRentalService.getMyRentalDetail(501L, otherCustomer));
        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-05: Đổi mã PIN thành công khi khách hàng sở hữu hợp đồng")
    void shouldChangeContractPin_successfully_whenCustomerOwnsContract() {
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(activeContract));

        ChangePinRequest req = new ChangePinRequest("654321");
        customerRentalService.changeContractPin(501L, req, customerUser);

        assertEquals("654321", activeContract.getAccessCode());
        verify(rentalContractRepository, times(1)).save(activeContract);
        verify(accessLogRepository, times(1)).save(any(AccessLog.class));
    }

    @Test
    @DisplayName("US-SC-05 & BR-ACC-03: Chặn đổi mã PIN nếu không phải chủ sở hữu hợp đồng")
    void shouldThrowAccessDenied_whenOtherCustomerAttemptsToChangePin() {
        UserPrincipal otherCustomer = new UserPrincipal(
                999L, "other@test.com", "pass", "Other",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, Collections.emptyList(), Collections.emptyList()
        );

        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(activeContract));

        ChangePinRequest req = new ChangePinRequest("654321");
        CustomException ex = assertThrows(CustomException.class, () ->
                customerRentalService.changeContractPin(501L, req, otherCustomer));

        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
        verify(rentalContractRepository, never()).save(any());
        verify(accessLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-SC-05 & BR-ACC-02: Báo lỗi khi đổi PIN trên hợp đồng đã kết thúc (CLOSED)")
    void shouldThrowInvalidStatus_whenContractIsClosed() {
        RentalContract closedContract = new RentalContract();
        closedContract.setId(502L);
        closedContract.setCustomerId(customerUser.getId());
        closedContract.setStatus(ContractStatus.CLOSED);

        when(rentalContractRepository.findById(502L)).thenReturn(Optional.of(closedContract));

        ChangePinRequest req = new ChangePinRequest("654321");
        CustomException ex = assertThrows(CustomException.class, () ->
                customerRentalService.changeContractPin(502L, req, customerUser));

        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
        verify(rentalContractRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-SC-05: Lấy danh sách lịch sử ra vào ô kho thành công")
    void shouldReturnAccessLogs_successfully() {
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(activeContract));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(storageUnit));

        AccessLog logItem = new AccessLog(501L, 42L, "PIN_CODE", "Nguyễn Văn Khách", "SUCCESS", "Đổi mã PIN");
        logItem.setId(10L);
        logItem.setAccessedAt(java.time.LocalDateTime.now());

        when(accessLogRepository.findByContractIdOrderByAccessedAtDesc(501L)).thenReturn(List.of(logItem));

        List<AccessLogResponse> logs = customerRentalService.getContractAccessLogs(501L, customerUser);

        assertNotNull(logs);
        assertEquals(1, logs.size());
        assertEquals("S-101", logs.get(0).getUnitNumber());
        assertEquals("SUCCESS", logs.get(0).getStatus());
    }
    @Test
    @DisplayName("US-SC-05.2: Báo có thanh toán gia hạn đang chờ nếu còn trong 48h")
    void testPopulateSummaryFields_WithPendingRenewalPayment_Within48Hours() {
        com.swp391.selfstorage.payment.entity.PaymentTransaction pendingTxn = new com.swp391.selfstorage.payment.entity.PaymentTransaction();
        pendingTxn.setId(901L);
        pendingTxn.setContractId(501L);
        pendingTxn.setTransactionType("CONTRACT_RENEWAL");
        pendingTxn.setStatus("PENDING");
        pendingTxn.setAmount(1600000L);
        pendingTxn.setRenewalMonths(2);
        pendingTxn.setOrderCode(123456789L);
        pendingTxn.setCreatedAt(java.time.Instant.now().minus(24, java.time.temporal.ChronoUnit.HOURS));

        when(rentalContractRepository.findByCustomerIdAndStatus(eq(15L), eq(ContractStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(activeContract), PageRequest.of(0, 10), 1));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(storageUnit));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(reservation));
        
        when(paymentTransactionRepository.findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(501L, "CONTRACT_RENEWAL"))
                .thenReturn(Optional.of(pendingTxn));

        PageResponse<CustomerRentalSummaryResponse> response = customerRentalService.getMyRentals(
                customerUser, "ACTIVE", PageRequest.of(0, 10)
        );

        assertNotNull(response);
        CustomerRentalSummaryResponse item = response.getContent().get(0);
        assertTrue(item.getHasPendingRenewal());
        assertEquals(123456789L, item.getPendingRenewalOrderCode());
        assertEquals(2, item.getPendingRenewalMonths());
        assertEquals(1600000L, item.getPendingRenewalAmount());
        assertNotNull(item.getPendingRenewalExpiresAt());
    }

    @Test
    @DisplayName("US-SC-05.2: Bỏ qua thanh toán gia hạn nếu đã quá 48h")
    void testPopulateSummaryFields_WithExpiredRenewalPayment_After48Hours() {
        com.swp391.selfstorage.payment.entity.PaymentTransaction expiredTxn = new com.swp391.selfstorage.payment.entity.PaymentTransaction();
        expiredTxn.setId(902L);
        expiredTxn.setContractId(501L);
        expiredTxn.setTransactionType("CONTRACT_RENEWAL");
        expiredTxn.setStatus("PENDING");
        expiredTxn.setCreatedAt(java.time.Instant.now().minus(49, java.time.temporal.ChronoUnit.HOURS));

        when(rentalContractRepository.findByCustomerIdAndStatus(eq(15L), eq(ContractStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(activeContract), PageRequest.of(0, 10), 1));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(storageUnit));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(reservation));
        
        when(paymentTransactionRepository.findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(501L, "CONTRACT_RENEWAL"))
                .thenReturn(Optional.of(expiredTxn));

        PageResponse<CustomerRentalSummaryResponse> response = customerRentalService.getMyRentals(
                customerUser, "ACTIVE", PageRequest.of(0, 10)
        );

        assertNotNull(response);
        CustomerRentalSummaryResponse item = response.getContent().get(0);
        assertFalse(item.getHasPendingRenewal());
        assertNull(item.getPendingRenewalOrderCode());
    }
}


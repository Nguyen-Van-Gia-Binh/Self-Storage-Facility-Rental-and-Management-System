package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.repository.*;
import com.swp391.selfstorage.contract.service.impl.ContractServiceImpl;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportRequest;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {

    @Mock
    private RentalContractRepository contractRepository;
    @Mock
    private HandoverRecordRepository handoverRecordRepository;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private StorageUnitRepository storageUnitRepository;
    @Mock
    private ReturnRequestRepository returnRequestRepository;
    @Mock
    private ContractExtraChargeRepository extraChargeRepository;
    @Mock
    private com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository staffDailyAssignmentRepository;
    @Mock
    private SupportRequestRepository supportRequestRepository;
    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;
    @InjectMocks
    private ContractServiceImpl contractService;

    private Reservation confirmedReservation;

    @BeforeEach
    void setUp() {
        confirmedReservation = new Reservation();
        confirmedReservation.setId(1042L);
        confirmedReservation.setCustomerId(15L);
        confirmedReservation.setFacilityId(1L);
        confirmedReservation.setStorageUnitId(42L);
        confirmedReservation.setUnitTypeId(7L);
        confirmedReservation.setStartDate(LocalDate.of(2026, 10, 1));
        confirmedReservation.setEndDateExclusive(LocalDate.of(2027, 1, 1));
        confirmedReservation.setRentalMonths(3);
        confirmedReservation.setMonthlyPriceSnapshot(800_000L);
        confirmedReservation.setTotalRentalFee(2_400_000L);
        confirmedReservation.setDepositAmount(800_000L);
        confirmedReservation.setPolicyVersionId(1L);
        confirmedReservation.setStatus(ReservationStatus.CONFIRMED);
        confirmedReservation.setHoldExpiresAt(OffsetDateTime.now().plusHours(48));

        org.springframework.test.util.ReflectionTestUtils.setField(contractService, "staffDailyAssignmentRepository", staffDailyAssignmentRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(contractService, "supportRequestRepository", supportRequestRepository);
    }

    private SupportRequest openDamageTicket(Long id, Long contractId, Long unitId, boolean relocationRequired) {
        return SupportRequest.builder()
                .id(id)
                .code("SUP-" + id)
                .customerId(15L)
                .contractId(contractId)
                .storageUnitId(unitId)
                .category(SupportCategory.UNIT_DAMAGE)
                .description("Cua khoa hong")
                .status(SupportStatus.IN_PROGRESS)
                .relocationRequired(relocationRequired)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("T3.4: createFromReservation -> Contract PENDING_CHECK_IN voi code CTR-")
    void shouldCreateContract_whenReservationIsConfirmed() {
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(confirmedReservation));
        when(contractRepository.findByReservationId(1042L)).thenReturn(Optional.empty());
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> {
            RentalContract c = inv.getArgument(0);
            c.setId(500L);
            return c;
        });

        ContractResponse response = contractService.createFromReservation(1042L);

        assertNotNull(response);
        assertEquals(ContractStatus.PENDING_CHECK_IN, response.getStatus());
        assertEquals(1042L, response.getReservationId());
        assertTrue(response.getCode().startsWith("CTR-"));
        verify(contractRepository).save(any(RentalContract.class));
    }

    @Test
    @DisplayName("T3.4 Idempotent: Contract da ton tai -> tra ve Contract cu, khong save moi")
    void shouldReturnExistingContract_whenContractAlreadyExists() {
        RentalContract existing = RentalContract.builder()
                .id(500L).reservationId(1042L)
                .status(ContractStatus.PENDING_CHECK_IN).build();
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(confirmedReservation));
        when(contractRepository.findByReservationId(1042L)).thenReturn(Optional.of(existing));

        ContractResponse response = contractService.createFromReservation(1042L);

        assertEquals(500L, response.getId());
        verify(contractRepository, never()).save(any());
    }

    @Test
    @DisplayName("T3.6+T3.7: checkIn -> Contract ACTIVE, Unit OCCUPIED, PIN 6 chu so (BR-ACC-01)")
    void shouldCheckIn_andActivateContractWithPin() {
        RentalContract contract = RentalContract.builder()
                .id(500L).reservationId(1042L).facilityId(1L).storageUnitId(42L)
                .status(ContractStatus.PENDING_CHECK_IN)
                .startDate(LocalDate.of(2026, 10, 1)).build();
        StorageUnit unit = StorageUnit.builder().id(42L).facilityId(1L)
                .status(StorageUnitStatus.RESERVED).build();
        Reservation rsv = new Reservation();
        rsv.setId(1042L);
        rsv.setStatus(ReservationStatus.CONFIRMED);

        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(unit));
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(rsv));
        when(contractRepository.existsByAccessCode(any())).thenReturn(false);
        when(contractRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(storageUnitRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(reservationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(handoverRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CheckInRequest req = new CheckInRequest();
        req.setCheckinDate(LocalDate.of(2026, 10, 1));
        req.setCustomerConfirmed(true);

        CheckInResponse response = contractService.checkIn(500L, req, 8L, List.of(1L));

        assertEquals(ContractStatus.ACTIVE, response.getStatus());
        assertTrue(response.getAccessCode().matches("\\d{6}"), "PIN phai la 6 chu so — BR-ACC-01");
        assertEquals(StorageUnitStatus.OCCUPIED, unit.getStatus());
        assertEquals(ReservationStatus.FULFILLED, rsv.getStatus());
    }

    @Test
    @DisplayName("T3.6: checkIn Contract khong PENDING_CHECK_IN -> nem CONTRACT_NOT_PENDING_CHECKIN")
    void shouldThrow_whenContractNotPendingCheckIn() {
        RentalContract active = RentalContract.builder()
                .id(500L).facilityId(1L).status(ContractStatus.ACTIVE).build();
        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(active));

        CheckInRequest req = new CheckInRequest();
        req.setCheckinDate(LocalDate.now());

        CustomException ex = assertThrows(CustomException.class,
                () -> contractService.checkIn(500L, req, 8L, List.of(1L)));
        assertEquals(ErrorCode.CONTRACT_NOT_PENDING_CHECKIN, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-CHK-02: checkIn khi chưa gán ô thì UNIT_NOT_YET_ALLOCATED")
    void shouldThrow_whenStorageUnitNotAllocated() {
        RentalContract contract = RentalContract.builder()
                .id(500L).facilityId(1L).status(ContractStatus.PENDING_CHECK_IN).build();
        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));

        CheckInRequest req = new CheckInRequest();
        req.setCheckinDate(LocalDate.now());

        CustomException ex = assertThrows(CustomException.class,
                () -> contractService.checkIn(500L, req, 8L, List.of(1L)));

        assertEquals(ErrorCode.UNIT_NOT_YET_ALLOCATED, ex.getErrorCode());
        verify(contractRepository, never()).save(any());
    }

    @Test
    @DisplayName("T3.6 Tu choi: rejectHandover -> Contract TERMINATED, Unit MAINTENANCE (BR-CHK-06)")
    void shouldTerminateContractAndMarkMaintenance_whenHandoverRejected() {
        RentalContract contract = RentalContract.builder()
                .id(500L).facilityId(1L).storageUnitId(42L)
                .status(ContractStatus.PENDING_CHECK_IN).build();
        StorageUnit unit = StorageUnit.builder().id(42L).status(StorageUnitStatus.RESERVED).build();

        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(unit));
        when(contractRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(storageUnitRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(handoverRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        HandoverRejectionRequest req = new HandoverRejectionRequest();
        req.setRejectionReason("Cua khoa hong");
        req.setRejectionAction("TERMINATE_REFUND");

        HandoverRejectionResponse response = contractService.rejectHandover(500L, req, 8L, List.of(1L));

        assertEquals(ContractStatus.TERMINATED, response.getContractStatus());
        assertEquals(StorageUnitStatus.MAINTENANCE, response.getStorageUnitStatus());
        assertEquals(ContractStatus.TERMINATED, contract.getStatus());
        assertEquals(StorageUnitStatus.MAINTENANCE, unit.getStatus());
        assertEquals(LocalDate.now(), contract.getEndDateExclusive());
    }

    @Test
    @DisplayName("Nghiep vu moi: rejectHandover voi RELOCATE -> Contract giu PENDING_CHECK_IN, Unit MAINTENANCE, tao SupportRequest")
    void shouldKeepPendingCheckInAndCreateTicket_whenHandoverRejectedWithRelocate() {
        RentalContract contract = RentalContract.builder()
                .id(501L).facilityId(1L).storageUnitId(42L).customerId(10L)
                .status(ContractStatus.PENDING_CHECK_IN).build();
        StorageUnit unit = StorageUnit.builder().id(42L).status(StorageUnitStatus.RESERVED).build();

        when(contractRepository.findByIdAndFacilityIdIn(501L, List.of(1L))).thenReturn(Optional.of(contract));
        when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(unit));
        when(storageUnitRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(handoverRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(supportRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        HandoverRejectionRequest req = new HandoverRejectionRequest();
        req.setRejectionReason("O kho bi dot nuoc");
        req.setReportedDefects("Nuoc nho giot tren noc");
        req.setRejectionAction("RELOCATE");

        HandoverRejectionResponse response = contractService.rejectHandover(501L, req, 8L, List.of(1L));

        assertEquals(ContractStatus.PENDING_CHECK_IN, response.getContractStatus());
        assertEquals(StorageUnitStatus.MAINTENANCE, response.getStorageUnitStatus());
        assertEquals(ContractStatus.PENDING_CHECK_IN, contract.getStatus());
        assertEquals(StorageUnitStatus.MAINTENANCE, unit.getStatus());
        verify(supportRequestRepository).save(argThat(t ->
                t.getContractId().equals(501L)
                && t.getCategory() == SupportCategory.UNIT_DAMAGE
                && Boolean.TRUE.equals(t.getRelocationRequired())
        ));
    }

    @Test
    @DisplayName("BR-AVL-05: reassignUnit khi PENDING_CHECK_IN co phieu UNIT_DAMAGE va khach dong y -> o cu MAINTENANCE, o moi RESERVED, giu gia")
    void shouldReassignUnitSuccessfully_whenContractPendingCheckIn() {
        RentalContract contract = RentalContract.builder()
                .id(500L).code("CTR-500").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.PENDING_CHECK_IN)
                .startDate(LocalDate.of(2026, 10, 1))
                .endDateExclusive(LocalDate.of(2027, 1, 1))
                .rentalMonths(3).monthlyPrice(800_000L).depositAmount(800_000L).depositBalance(800_000L)
                .build();
        StorageUnit oldUnit = StorageUnit.builder().id(42L).facilityId(1L).code("U-42").unitTypeId(7L).status(StorageUnitStatus.RESERVED).build();
        StorageUnit newUnit = StorageUnit.builder().id(43L).facilityId(1L).code("U-43").unitTypeId(7L).status(StorageUnitStatus.AVAILABLE).build();
        SupportRequest ticket = openDamageTicket(90L, 500L, 42L, false);

        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(supportRequestRepository.findById(90L)).thenReturn(Optional.of(ticket));
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storageUnitRepository.findById(43L)).thenReturn(Optional.of(newUnit));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(oldUnit));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));

        ReassignUnitRequest req = ReassignUnitRequest.builder()
                .newStorageUnitId(43L)
                .reason("Cửa ô kho cũ bị kẹt ray")
                .supportRequestId(90L)
                .customerConsent(true)
                .build();

        ContractSummaryResponse response = contractService.reassignUnit(500L, req, 1L, List.of(1L));

        assertNotNull(response);
        assertEquals(43L, response.getStorageUnitId());
        assertEquals("U-43", response.getStorageUnitCode());
        assertEquals(800_000L, response.getMonthlyPrice());
        assertEquals(800_000L, response.getDepositAmount());
        assertEquals(StorageUnitStatus.MAINTENANCE, oldUnit.getStatus());
        assertEquals(StorageUnitStatus.RESERVED, newUnit.getStatus());
        assertEquals(43L, contract.getStorageUnitId());
        assertEquals(90L, contract.getRelocationSupportRequestId());
        assertEquals(800_000L, contract.getMonthlyPrice());
        assertTrue(ticket.getCustomerNotice().contains("U-43"));
        assertFalse(response.getRelocationEligible());
    }

    @Test
    @DisplayName("BR-SUP-02: reassignUnit khi ACTIVE co co can di doi -> o cu MAINTENANCE, o moi OCCUPIED, giu snapshot gia")
    void shouldReassignUnitSuccessfully_whenContractActive() {
        RentalContract contract = RentalContract.builder()
                .id(500L).code("CTR-500").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.ACTIVE)
                .startDate(LocalDate.of(2026, 10, 1))
                .endDateExclusive(LocalDate.of(2027, 1, 1))
                .rentalMonths(3).monthlyPrice(800_000L).depositAmount(800_000L).depositBalance(800_000L)
                .build();
        StorageUnit oldUnit = StorageUnit.builder().id(42L).facilityId(1L).code("U-42").unitTypeId(7L).status(StorageUnitStatus.OCCUPIED).build();
        StorageUnit newUnit = StorageUnit.builder().id(43L).facilityId(1L).code("U-43").unitTypeId(7L).status(StorageUnitStatus.AVAILABLE).build();
        SupportRequest ticket = openDamageTicket(91L, 500L, 42L, true);

        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(supportRequestRepository.findById(91L)).thenReturn(Optional.of(ticket));
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storageUnitRepository.findById(43L)).thenReturn(Optional.of(newUnit));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(oldUnit));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));

        ReassignUnitRequest req = ReassignUnitRequest.builder()
                .newStorageUnitId(43L)
                .reason("Khong sua tai cho duoc")
                .supportRequestId(91L)
                .build();

        ContractSummaryResponse response = contractService.reassignUnit(500L, req, 1L, List.of(1L));

        assertNotNull(response);
        assertEquals(43L, response.getStorageUnitId());
        assertEquals(StorageUnitStatus.MAINTENANCE, oldUnit.getStatus());
        assertEquals(StorageUnitStatus.OCCUPIED, newUnit.getStatus());
        assertEquals(800_000L, contract.getMonthlyPrice());
        assertEquals(800_000L, contract.getDepositAmount());
        assertEquals(91L, contract.getRelocationSupportRequestId());
        assertEquals(Boolean.FALSE, ticket.getRelocationRequired());
    }

    @Test
    @DisplayName("BR-SUP-02: reassignUnit khi ACTIVE chua danh dau can di doi -> tu choi")
    void shouldThrow_whenActiveTicketNotFlaggedForRelocation() {
        RentalContract contract = RentalContract.builder()
                .id(500L).code("CTR-500").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.ACTIVE).build();
        SupportRequest ticket = openDamageTicket(91L, 500L, 42L, false);
        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(supportRequestRepository.findById(91L)).thenReturn(Optional.of(ticket));

        ReassignUnitRequest req = ReassignUnitRequest.builder()
                .newStorageUnitId(43L)
                .reason("Doi o")
                .supportRequestId(91L)
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> contractService.reassignUnit(500L, req, 1L, List.of(1L)));
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-AVL-05: reassignUnit sang Unit Type khac -> tu choi")
    void shouldThrow_whenNewUnitTypeDiffers() {
        RentalContract contract = RentalContract.builder()
                .id(500L).code("CTR-500").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.PENDING_CHECK_IN).build();
        StorageUnit newUnit = StorageUnit.builder().id(43L).facilityId(1L).code("U-43").unitTypeId(8L).status(StorageUnitStatus.AVAILABLE).build();
        SupportRequest ticket = openDamageTicket(90L, 500L, 42L, false);
        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(supportRequestRepository.findById(90L)).thenReturn(Optional.of(ticket));
        when(storageUnitRepository.findById(43L)).thenReturn(Optional.of(newUnit));

        ReassignUnitRequest req = ReassignUnitRequest.builder()
                .newStorageUnitId(43L)
                .reason("Doi o")
                .supportRequestId(90L)
                .customerConsent(true)
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> contractService.reassignUnit(500L, req, 1L, List.of(1L)));
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("SCR-FM-02.2: reassignUnit khi o kho moi khong AVAILABLE -> nem UNIT_NOT_AVAILABLE")
    void shouldThrow_whenNewUnitNotAvailable() {
        RentalContract contract = RentalContract.builder()
                .id(500L).code("CTR-500").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.ACTIVE).build();
        StorageUnit newUnit = StorageUnit.builder().id(43L).facilityId(1L).code("U-43").unitTypeId(7L).status(StorageUnitStatus.OCCUPIED).build();
        SupportRequest ticket = openDamageTicket(91L, 500L, 42L, true);

        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(supportRequestRepository.findById(91L)).thenReturn(Optional.of(ticket));
        when(storageUnitRepository.findById(43L)).thenReturn(Optional.of(newUnit));

        ReassignUnitRequest req = ReassignUnitRequest.builder()
                .newStorageUnitId(43L)
                .reason("Doi o")
                .supportRequestId(91L)
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> contractService.reassignUnit(500L, req, 1L, List.of(1L)));
        assertEquals(ErrorCode.UNIT_NOT_AVAILABLE, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-OVD-02: getContractById khi qua han D+2 -> overdueDays=2, accruedOverdueFee=0 (An han)")
    void shouldReturnZeroFee_whenOverdueWithinGracePeriod() {
        RentalContract contract = RentalContract.builder()
                .id(600L).code("CTR-600").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .depositAmount(1_000_000L)
                .endDateExclusive(LocalDate.now().minusDays(2))
                .status(ContractStatus.OVERDUE)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(600L, List.of(1L))).thenReturn(Optional.of(contract));

        ContractResponse res = contractService.getContractById(600L, List.of(1L));

        assertNotNull(res);
        assertEquals(2, res.getOverdueDays());
        assertEquals(0L, res.getAccruedOverdueFee());
    }

    @Test
    @DisplayName("BR-OVD-03: getContractById khi qua han D+5 -> overdueDays=5, accruedOverdueFee = 2 ngay phat * 10% = 200.000d")
    void shouldReturnCorrectPenalty_whenOverduePastGracePeriod() {
        RentalContract contract = RentalContract.builder()
                .id(601L).code("CTR-601").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .depositAmount(1_000_000L)
                .endDateExclusive(LocalDate.now().minusDays(5))
                .status(ContractStatus.OVERDUE)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(601L, List.of(1L))).thenReturn(Optional.of(contract));

        ContractResponse res = contractService.getContractById(601L, List.of(1L));

        assertNotNull(res);
        assertEquals(5, res.getOverdueDays());
        // 5 - 3 = 2 ngày phạt * 10% * 1.000.000đ = 200.000đ
        assertEquals(200_000L, res.getAccruedOverdueFee());
    }

    @Test
    @DisplayName("T4.15: FM-05: assignReturnStaff thanh cong khi hop dong PENDING_RETURN")
    void shouldAssignReturnStaff_successfully() {
        RentalContract contract = RentalContract.builder()
                .id(700L).code("CTR-700").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.PENDING_RETURN)
                .build();

        ReturnRequest returnRequest = ReturnRequest.builder()
                .id(99L).contractId(700L)
                .status(ReturnRequestStatus.PENDING)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(700L, List.of(1L))).thenReturn(Optional.of(contract));
        when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(700L)).thenReturn(Optional.of(returnRequest));

        AssignReturnStaffRequest req = AssignReturnStaffRequest.builder()
                .staffId(10L)
                .notes("Nghiem thu o kho")
                .build();

        ContractResponse res = contractService.assignReturnStaff(700L, req, 1L, List.of(1L));

        assertNotNull(res);
        assertEquals(10L, returnRequest.getInspectedBy());
        verify(returnRequestRepository, times(1)).save(returnRequest);
    }

    @Test
    @DisplayName("T4.15: FM-05: assignReturnStaff nem exception khi hop dong khong o trang thai PENDING_RETURN")
    void shouldThrowException_whenContractNotPendingReturn_onAssignReturnStaff() {
        RentalContract contract = RentalContract.builder()
                .id(701L).code("CTR-701").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.ACTIVE)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(701L, List.of(1L))).thenReturn(Optional.of(contract));

        AssignReturnStaffRequest req = AssignReturnStaffRequest.builder()
                .staffId(10L)
                .notes("Nghiem thu")
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> contractService.assignReturnStaff(701L, req, 1L, List.of(1L)));
        assertEquals(ErrorCode.CONTRACT_NOT_PENDING_RETURN, ex.getErrorCode());
    }

    @Test
    @DisplayName("FM-05: assignCheckInStaff thanh cong khi hop dong PENDING_CHECK_IN")
    void shouldAssignCheckInStaff_successfully() {
        RentalContract contract = RentalContract.builder()
                .id(800L).code("CTR-800").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.PENDING_CHECK_IN)
                .startDate(LocalDate.now())
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(800L, List.of(1L))).thenReturn(Optional.of(contract));
        when(staffDailyAssignmentRepository.findByReferenceTypeAndReferenceId("CONTRACT", 800L))
                .thenReturn(Optional.empty());

        AssignReturnStaffRequest req = AssignReturnStaffRequest.builder()
                .staffId(10L)
                .notes("Tiep don khach hang nhan kho")
                .build();

        ContractResponse res = contractService.assignCheckInStaff(800L, req, 1L, List.of(1L));

        assertNotNull(res);
        verify(staffDailyAssignmentRepository, times(1)).save(any(com.swp391.selfstorage.support.entity.StaffDailyAssignment.class));
    }

    @Test
    @DisplayName("FM-05: assignCheckInStaff nem exception khi hop dong khong o trang thai PENDING_CHECK_IN")
    void shouldThrowException_whenContractNotPendingCheckIn_onAssignCheckInStaff() {
        RentalContract contract = RentalContract.builder()
                .id(801L).code("CTR-801").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.ACTIVE)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(801L, List.of(1L))).thenReturn(Optional.of(contract));

        AssignReturnStaffRequest req = AssignReturnStaffRequest.builder()
                .staffId(10L)
                .notes("Phan cong check-in")
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> contractService.assignCheckInStaff(801L, req, 1L, List.of(1L)));
        assertEquals(ErrorCode.CONTRACT_NOT_PENDING_CHECKIN, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-GEN-02: preview phí quá hạn đọc policyVersionId trên hợp đồng")
    void previewUsesSnapshottedPolicy_notTheActiveOne() {
        PolicyVersionRepository policyVersionRepository = mock(PolicyVersionRepository.class);
        ReflectionTestUtils.setField(contractService, "policyVersionRepository", policyVersionRepository);
        PolicyVersion snapshot = PolicyVersion.builder()
                .id(4L)
                .overdueGraceDays(1)
                .overdueDailyRate(BigDecimal.valueOf(0.10))
                .overdueCapRate(BigDecimal.valueOf(0.70))
                .overdueTerminationDays(10)
                .build();
        when(policyVersionRepository.findById(4L)).thenReturn(Optional.of(snapshot));

        RentalContract contract = RentalContract.builder()
                .id(602L).code("CTR-602").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .depositAmount(1_000_000L)
                .endDateExclusive(LocalDate.now().minusDays(5))
                .status(ContractStatus.OVERDUE)
                .policyVersionId(4L)
                .build();
        when(contractRepository.findByIdAndFacilityIdIn(602L, List.of(1L))).thenReturn(Optional.of(contract));

        ContractResponse res = contractService.getContractById(602L, List.of(1L));

        assertEquals(5, res.getOverdueDays());
        // 5 - 1 ngày ân hạn = 4 ngày × 10% × 1.000.000đ. Bản mặc định (ân hạn 3 ngày) chỉ ra 200.000đ.
        assertEquals(400_000L, res.getAccruedOverdueFee());
        verify(policyVersionRepository, never())
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any());
    }

    @Test
    @DisplayName("Nhánh 2: getSettlementPreview & approveSettlement cho hợp đồng TERMINATED do từ chối bàn giao -> hoàn 100% (cọc + tiền thuê)")
    void shouldPreviewAndApproveSettlement_whenContractTerminatedAtCheckIn() {
        RentalContract contract = RentalContract.builder()
                .id(888L).code("CTR-888").facilityId(1L).customerId(10L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.TERMINATED)
                .startDate(LocalDate.now())
                .endDateExclusive(LocalDate.now())
                .rentalMonths(1)
                .monthlyPrice(500_000L)
                .depositAmount(500_000L)
                .depositBalance(500_000L)
                .build();

        ReturnRequest returnReq = ReturnRequest.builder()
                .id(999L)
                .contractId(888L)
                .requestedReturnDate(LocalDate.now())
                .status(ReturnRequestStatus.PENDING)
                .inspectedAt(OffsetDateTime.now())
                .inspectedBy(5L)
                .damageCost(0L)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(888L, List.of(1L))).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));
        when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(888L)).thenReturn(Optional.of(returnReq));
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(extraChargeRepository.findByContractIdAndStatus(888L, ExtraChargeStatus.UNPAID)).thenReturn(List.of());

        // 1. Preview
        SettlementPreviewResponse preview = contractService.getSettlementPreview(888L, List.of(1L));
        assertNotNull(preview);
        assertEquals(500_000L, preview.getDepositAmount());
        assertEquals(1_000_000L, preview.getDepositRefundAmount()); // 100% = cọc 500k + thuê 500k
        assertEquals(0L, preview.getPayableAmount());

        // 2. Approve Settlement
        SettlementApprovalRequest req = SettlementApprovalRequest.builder()
                .approvedNotes("Duyệt hoàn trả 100% do sự cố dột kho lúc bàn giao")
                .build();
        SettlementApprovalResponse approval = contractService.approveSettlement(888L, req, 1L, List.of(1L));
        assertNotNull(approval);
        assertEquals(ContractStatus.CLOSED, contract.getStatus());
        assertEquals(1_000_000L, approval.getDepositRefundAmount());
        assertEquals(0L, approval.getPayableAmount());
    }

    @Test
    @DisplayName("Sự cố bàn giao: Khi action=RELOCATE hoặc null -> Hợp đồng giữ PENDING_CHECK_IN và ô cũ chuyển MAINTENANCE")
    void shouldKeepPendingCheckIn_whenRejectionActionIsRelocate() {
        RentalContract contract = RentalContract.builder()
                .id(777L).code("CTR-777").facilityId(1L).customerId(10L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.PENDING_CHECK_IN).startDate(LocalDate.now()).rentalMonths(1)
                .build();
        StorageUnit oldUnit = StorageUnit.builder().id(42L).code("U-42").facilityId(1L).status(StorageUnitStatus.RESERVED).build();

        when(contractRepository.findByIdAndFacilityIdIn(777L, List.of(1L))).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(oldUnit));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));

        HandoverRejectionRequest req = HandoverRejectionRequest.builder()
                .rejectionReason("Ô kho bị dột trần")
                .reportedDefects("Nước nhỏ giọt nhiều")
                .rejectionAction("RELOCATE")
                .build();

        HandoverRejectionResponse res = contractService.rejectHandover(777L, req, 5L, List.of(1L));

        assertNotNull(res);
        assertEquals(ContractStatus.PENDING_CHECK_IN, contract.getStatus());
        assertEquals(StorageUnitStatus.MAINTENANCE, oldUnit.getStatus());
    }

    @Test
    @DisplayName("Khôi phục hợp đồng: Reassign unit cho hợp đồng từng bị TERMINATED -> chuyển về PENDING_CHECK_IN và phục hồi endDateExclusive")
    void shouldRestorePendingCheckInAndEndDate_whenReassigningTerminatedContract() {
        LocalDate start = LocalDate.now();
        RentalContract contract = RentalContract.builder()
                .id(999L).code("CTR-999").facilityId(1L).customerId(10L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.TERMINATED)
                .startDate(start)
                .endDateExclusive(start) // Bị cắt ngắn khi terminate
                .rentalMonths(2)
                .build();

        StorageUnit oldUnit = StorageUnit.builder().id(42L).facilityId(1L).code("U-42").unitTypeId(7L).status(StorageUnitStatus.MAINTENANCE).build();
        StorageUnit newUnit = StorageUnit.builder().id(43L).facilityId(1L).code("U-43").unitTypeId(7L).status(StorageUnitStatus.AVAILABLE).build();

        when(contractRepository.findByIdAndFacilityIdIn(999L, List.of(1L))).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(oldUnit));
        when(storageUnitRepository.findById(43L)).thenReturn(Optional.of(newUnit));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));

        ReassignUnitRequest req = ReassignUnitRequest.builder()
                .newStorageUnitId(43L)
                .reason("Khách đồng ý đổi sang ô U-43")
                .customerConsent(true)
                .build();

        ContractSummaryResponse summary = contractService.reassignUnit(999L, req, 1L, List.of(1L));

        assertNotNull(summary);
        assertEquals(ContractStatus.PENDING_CHECK_IN, contract.getStatus());
        assertEquals(start.plusMonths(2), contract.getEndDateExclusive());
        assertEquals(StorageUnitStatus.RESERVED, newUnit.getStatus());
    }
}
package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.repository.*;
import com.swp391.selfstorage.contract.service.impl.ContractServiceImpl;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

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

        HandoverRejectionResponse response = contractService.rejectHandover(500L, req, 8L, List.of(1L));

        assertEquals(ContractStatus.TERMINATED, response.getContractStatus());
        assertEquals(StorageUnitStatus.MAINTENANCE, response.getStorageUnitStatus());
        assertEquals(ContractStatus.TERMINATED, contract.getStatus());
        assertEquals(StorageUnitStatus.MAINTENANCE, unit.getStatus());
    }

    @Test
    @DisplayName("SCR-FM-02.2: reassignUnit khi PENDING_CHECK_IN -> Kho cu AVAILABLE, kho moi RESERVED, contract update")
    void shouldReassignUnitSuccessfully_whenContractPendingCheckIn() {
        RentalContract contract = RentalContract.builder()
                .id(500L).code("CTR-500").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.PENDING_CHECK_IN)
                .startDate(LocalDate.of(2026, 10, 1))
                .endDateExclusive(LocalDate.of(2027, 1, 1))
                .rentalMonths(3).monthlyPrice(800_000L).depositAmount(800_000L).depositBalance(800_000L)
                .build();
        StorageUnit oldUnit = StorageUnit.builder().id(42L).facilityId(1L).code("U-42").status(StorageUnitStatus.RESERVED).build();
        StorageUnit newUnit = StorageUnit.builder().id(43L).facilityId(1L).code("U-43").status(StorageUnitStatus.AVAILABLE).build();

        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(storageUnitRepository.findById(43L)).thenReturn(Optional.of(newUnit));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(oldUnit));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));

        ReassignUnitRequest req = ReassignUnitRequest.builder()
                .newStorageUnitId(43L)
                .reason("Cửa ô kho cũ bị kẹt ray")
                .build();

        ContractSummaryResponse response = contractService.reassignUnit(500L, req, 1L, List.of(1L));

        assertNotNull(response);
        assertEquals(43L, response.getStorageUnitId());
        assertEquals("U-43", response.getStorageUnitCode());
        assertEquals(StorageUnitStatus.AVAILABLE, oldUnit.getStatus());
        assertEquals(StorageUnitStatus.RESERVED, newUnit.getStatus());
        assertEquals(43L, contract.getStorageUnitId());
    }

    @Test
    @DisplayName("SCR-FM-02.2: reassignUnit khi ACTIVE -> Kho cu AVAILABLE, kho moi OCCUPIED, contract update")
    void shouldReassignUnitSuccessfully_whenContractActive() {
        RentalContract contract = RentalContract.builder()
                .id(500L).code("CTR-500").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.ACTIVE)
                .startDate(LocalDate.of(2026, 10, 1))
                .endDateExclusive(LocalDate.of(2027, 1, 1))
                .rentalMonths(3).monthlyPrice(800_000L).depositAmount(800_000L).depositBalance(800_000L)
                .build();
        StorageUnit oldUnit = StorageUnit.builder().id(42L).facilityId(1L).code("U-42").status(StorageUnitStatus.OCCUPIED).build();
        StorageUnit newUnit = StorageUnit.builder().id(43L).facilityId(1L).code("U-43").status(StorageUnitStatus.AVAILABLE).build();

        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(storageUnitRepository.findById(43L)).thenReturn(Optional.of(newUnit));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(oldUnit));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));

        ReassignUnitRequest req = ReassignUnitRequest.builder()
                .newStorageUnitId(43L)
                .reason("Khách yêu cầu chuyển ô gần thang máy")
                .build();

        ContractSummaryResponse response = contractService.reassignUnit(500L, req, 1L, List.of(1L));

        assertNotNull(response);
        assertEquals(43L, response.getStorageUnitId());
        assertEquals("U-43", response.getStorageUnitCode());
        assertEquals(StorageUnitStatus.AVAILABLE, oldUnit.getStatus());
        assertEquals(StorageUnitStatus.OCCUPIED, newUnit.getStatus());
        assertEquals(43L, contract.getStorageUnitId());
    }

    @Test
    @DisplayName("SCR-FM-02.2: reassignUnit khi o kho moi khong AVAILABLE -> nem UNIT_NOT_AVAILABLE")
    void shouldThrow_whenNewUnitNotAvailable() {
        RentalContract contract = RentalContract.builder()
                .id(500L).code("CTR-500").facilityId(1L).storageUnitId(42L).unitTypeId(7L)
                .status(ContractStatus.ACTIVE).build();
        StorageUnit newUnit = StorageUnit.builder().id(43L).facilityId(1L).code("U-43").status(StorageUnitStatus.OCCUPIED).build();

        when(contractRepository.findByIdAndFacilityIdIn(500L, List.of(1L))).thenReturn(Optional.of(contract));
        when(storageUnitRepository.findById(43L)).thenReturn(Optional.of(newUnit));

        ReassignUnitRequest req = ReassignUnitRequest.builder()
                .newStorageUnitId(43L)
                .reason("Doi o")
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
}
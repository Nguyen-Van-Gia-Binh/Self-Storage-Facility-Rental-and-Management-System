package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.ContractResponse;
import com.swp391.selfstorage.contract.dto.RescheduleRentalPeriodRequest;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.HandoverRecordRepository;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.repository.ReturnRequestRepository;
import com.swp391.selfstorage.contract.service.impl.ContractServiceImpl;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ContractRescheduleServiceTest {

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
    private com.swp391.selfstorage.contract.repository.ContractExtraChargeRepository extraChargeRepository;
    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;
    @Mock
    private PolicyVersionRepository policyVersionRepository;

    @InjectMocks
    private ContractServiceImpl contractService;

    private RentalContract contract;
    private Reservation reservation;
    private StorageUnit unit1;
    private StorageUnit unit2;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(contractService, "policyVersionRepository", policyVersionRepository);

        contract = RentalContract.builder()
                .id(100L)
                .code("CTR-20261011-001")
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(2L)
                .storageUnitId(201L)
                .reservationId(500L)
                .startDate(LocalDate.now().plusDays(3))
                .endDateExclusive(LocalDate.now().plusDays(3).plusMonths(1))
                .rentalMonths(1)
                .monthlyPrice(1_500_000L)
                .totalRentalFee(1_500_000L)
                .depositAmount(1_500_000L)
                .depositBalance(1_500_000L)
                .status(ContractStatus.PENDING_CHECK_IN)
                .build();

        reservation = new Reservation();
        reservation.setId(500L);
        reservation.setCode("RSV-001");
        reservation.setCustomerId(10L);
        reservation.setFacilityId(1L);
        reservation.setUnitTypeId(2L);
        reservation.setStorageUnitId(201L);
        reservation.setStartDate(contract.getStartDate());
        reservation.setEndDateExclusive(contract.getEndDateExclusive());
        reservation.setRentalMonths(1);
        reservation.setStatus(ReservationStatus.CONFIRMED);

        unit1 = StorageUnit.builder()
                .id(201L)
                .code("Q1-B201")
                .facilityId(1L)
                .unitTypeId(2L)
                .status(StorageUnitStatus.RESERVED)
                .build();

        unit2 = StorageUnit.builder()
                .id(202L)
                .code("Q1-B202")
                .facilityId(1L)
                .unitTypeId(2L)
                .status(StorageUnitStatus.AVAILABLE)
                .build();
    }

    @Test
    @DisplayName("BR-RES-06: Dời ngày thành công khi ô kho hiện tại không có xung đột")
    void reschedule_success_whenCurrentUnitAvailable() {
        LocalDate newStartDate = LocalDate.now().plusDays(10);
        RescheduleRentalPeriodRequest req = new RescheduleRentalPeriodRequest(newStartDate);

        when(contractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(contractRepository.existsOverlappingContractForUnit(eq(201L), eq(newStartDate), any(), anyInt(), eq(100L)))
                .thenReturn(false);
        when(reservationRepository.existsOverlappingReservationForUnit(eq(201L), eq(newStartDate), any(), any(), anyInt()))
                .thenReturn(false);
        when(reservationRepository.findById(500L)).thenReturn(Optional.of(reservation));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));

        ContractResponse response = contractService.rescheduleRentalPeriod(100L, req, 10L);

        assertNotNull(response);
        assertEquals(newStartDate, response.getStartDate());
        assertEquals(newStartDate.plusMonths(1), response.getEndDateExclusive());
        assertEquals(201L, response.getStorageUnitId());
        assertEquals(newStartDate, reservation.getStartDate());
        assertEquals(newStartDate.plusMonths(1), reservation.getEndDateExclusive());
    }

    @Test
    @DisplayName("BR-RES-06: Ô kho hiện tại bị trùng lịch -> Tự động chuyển sang ô kho khác cùng loại còn trống")
    void reschedule_success_switchesToAlternativeUnit_whenCurrentUnitConflict() {
        LocalDate newStartDate = LocalDate.now().plusDays(10);
        RescheduleRentalPeriodRequest req = new RescheduleRentalPeriodRequest(newStartDate);

        when(contractRepository.findById(100L)).thenReturn(Optional.of(contract));
        // Ô kho cũ bị conflict
        when(contractRepository.existsOverlappingContractForUnit(eq(201L), eq(newStartDate), any(), anyInt(), eq(100L)))
                .thenReturn(true);

        // Tìm candidate units
        when(storageUnitRepository.findByFacilityId(1L)).thenReturn(List.of(unit1, unit2));
        // Ô kho 202 trống
        when(contractRepository.existsOverlappingContractForUnit(eq(202L), eq(newStartDate), any(), anyInt(), eq(100L)))
                .thenReturn(false);
        when(reservationRepository.existsOverlappingReservationForUnit(eq(202L), eq(newStartDate), any(), any(), anyInt()))
                .thenReturn(false);

        when(storageUnitRepository.findById(201L)).thenReturn(Optional.of(unit1));
        when(reservationRepository.existsByStorageUnitIdAndStatusIn(eq(201L), anyList())).thenReturn(false);
        when(reservationRepository.findById(500L)).thenReturn(Optional.of(reservation));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));

        ContractResponse response = contractService.rescheduleRentalPeriod(100L, req, 10L);

        assertNotNull(response);
        assertEquals(newStartDate, response.getStartDate());
        assertEquals(202L, response.getStorageUnitId(), "Phải tự động đổi sang ô kho 202 còn trống");
        assertEquals(StorageUnitStatus.AVAILABLE, unit1.getStatus(), "Ô kho cũ trả về AVAILABLE");
        assertEquals(StorageUnitStatus.RESERVED, unit2.getStatus(), "Ô kho mới chuyển sang RESERVED");
    }

    @Test
    @DisplayName("BR-RES-06: Toàn bộ ô kho cùng loại đều kín lịch -> Ném lỗi STORAGE_UNIT_UNAVAILABLE")
    void reschedule_throws_whenAllUnitsConflict() {
        LocalDate newStartDate = LocalDate.now().plusDays(10);
        RescheduleRentalPeriodRequest req = new RescheduleRentalPeriodRequest(newStartDate);

        when(contractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(contractRepository.existsOverlappingContractForUnit(eq(201L), eq(newStartDate), any(), anyInt(), eq(100L)))
                .thenReturn(true);
        when(storageUnitRepository.findByFacilityId(1L)).thenReturn(List.of(unit1, unit2));
        // Ô kho 202 cũng bị conflict
        when(contractRepository.existsOverlappingContractForUnit(eq(202L), eq(newStartDate), any(), anyInt(), eq(100L)))
                .thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () ->
                contractService.rescheduleRentalPeriod(100L, req, 10L));
        assertEquals(ErrorCode.UNIT_NOT_AVAILABLE, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-RES-06: Hợp đồng đã ACTIVE (không phải PENDING_CHECK_IN) -> Ném lỗi INVALID_STATUS_TRANSITION")
    void reschedule_throws_whenContractNotPendingCheckIn() {
        contract.setStatus(ContractStatus.ACTIVE);
        LocalDate newStartDate = LocalDate.now().plusDays(10);
        RescheduleRentalPeriodRequest req = new RescheduleRentalPeriodRequest(newStartDate);

        when(contractRepository.findById(100L)).thenReturn(Optional.of(contract));

        CustomException ex = assertThrows(CustomException.class, () ->
                contractService.rescheduleRentalPeriod(100L, req, 10L));
        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-RES-06: Chọn ngày bắt đầu trong quá khứ hoặc hôm nay -> Ném lỗi VALIDATION_FAILED")
    void reschedule_throws_whenNewStartDateInPast() {
        LocalDate pastDate = LocalDate.now();
        RescheduleRentalPeriodRequest req = new RescheduleRentalPeriodRequest(pastDate);

        CustomException ex = assertThrows(CustomException.class, () ->
                contractService.rescheduleRentalPeriod(100L, req, 10L));
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }
}

package com.swp391.selfstorage.contract.scheduler;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutoCheckInActivationSchedulerTest {

    @Mock
    private RentalContractRepository contractRepository;

    @Mock
    private StorageUnitRepository storageUnitRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private AutoCheckInActivationScheduler scheduler;

    @Test
    @DisplayName("BR-CAN-04: Hợp đồng quá 10 ngày ân hạn (T+11) tự động kích hoạt sang ACTIVE, cấp mã PIN, ô kho chuyển OCCUPIED")
    void testAutoActivateOverdueCheckIn() {
        // Given: Hợp đồng bắt đầu 12 ngày trước (> 10 ngày ân hạn)
        LocalDate startDate = LocalDate.now().minusDays(12);
        RentalContract contract = RentalContract.builder()
                .id(100L)
                .code("CTR-20261101-001")
                .reservationId(50L)
                .storageUnitId(200L)
                .startDate(startDate)
                .endDateExclusive(startDate.plusMonths(1))
                .status(ContractStatus.PENDING_CHECK_IN)
                .accessCode(null)
                .build();

        StorageUnit unit = StorageUnit.builder()
                .id(200L)
                .code("A-101")
                .status(StorageUnitStatus.RESERVED)
                .build();

        Reservation reservation = new Reservation();
        reservation.setStatus(ReservationStatus.CONFIRMED);

        when(contractRepository.findByStatus(ContractStatus.PENDING_CHECK_IN))
                .thenReturn(List.of(contract));
        when(storageUnitRepository.findById(200L)).thenReturn(Optional.of(unit));
        when(reservationRepository.findById(50L)).thenReturn(Optional.of(reservation));

        // When
        scheduler.scanAndAutoActivateContracts();

        // Then
        assertEquals(ContractStatus.ACTIVE, contract.getStatus());
        assertNotNull(contract.getAccessCode(), "Mã PIN phải được tự động sinh");
        assertEquals(6, contract.getAccessCode().length(), "Mã PIN phải gồm 6 chữ số");
        assertEquals(LocalDate.now(), contract.getCheckinDate());
        verify(contractRepository).save(contract);

        assertEquals(StorageUnitStatus.OCCUPIED, unit.getStatus(), "Trạng thái ô kho phải chuyển sang OCCUPIED");
        verify(storageUnitRepository).save(unit);

        assertEquals(ReservationStatus.FULFILLED, reservation.getStatus(), "Đơn đặt chỗ phải chuyển sang FULFILLED");
        verify(reservationRepository).save(reservation);
    }

    @Test
    @DisplayName("BR-CAN-04: Hợp đồng vẫn còn trong thời hạn ân hạn 10 ngày -> Không kích hoạt")
    void testDoNotActivateWithinGracePeriod() {
        // Given: Hợp đồng bắt đầu 5 ngày trước (trong vòng 10 ngày)
        LocalDate startDate = LocalDate.now().minusDays(5);
        RentalContract contract = RentalContract.builder()
                .id(101L)
                .code("CTR-20261101-002")
                .startDate(startDate)
                .status(ContractStatus.PENDING_CHECK_IN)
                .build();

        when(contractRepository.findByStatus(ContractStatus.PENDING_CHECK_IN))
                .thenReturn(List.of(contract));

        // When
        scheduler.scanAndAutoActivateContracts();

        // Then
        assertEquals(ContractStatus.PENDING_CHECK_IN, contract.getStatus());
        verify(contractRepository, never()).save(any());
        verify(storageUnitRepository, never()).save(any());
        verify(reservationRepository, never()).save(any());
    }
}

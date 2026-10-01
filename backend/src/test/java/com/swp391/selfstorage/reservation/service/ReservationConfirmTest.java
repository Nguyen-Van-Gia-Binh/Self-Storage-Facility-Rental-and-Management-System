package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationConfirmTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @Mock private FacilityRepository facilityRepository;
    @Mock private UnitTypeRepository unitTypeRepository;
    @Mock private FacilityUnitTypePriceRepository facilityUnitTypePriceRepository;
    @Mock private RentalContractRepository rentalContractRepository;
    @InjectMocks private ReservationServiceImpl service;

    private Reservation pendingReservation;
    private StorageUnit availableUnit;

    @BeforeEach
    void setUp() {
        pendingReservation = new Reservation();
        pendingReservation.setId(1042L);
        pendingReservation.setStorageUnitId(42L);
        pendingReservation.setStatus(ReservationStatus.PENDING_PAYMENT);
        pendingReservation.setHoldExpiresAt(OffsetDateTime.now().plusHours(10));
        pendingReservation.setStartDate(LocalDate.now().plusDays(1));

        availableUnit = new StorageUnit();
        availableUnit.setId(42L);
        availableUnit.setFacilityId(1L);
        availableUnit.setStatus(StorageUnitStatus.AVAILABLE);
    }

    @Test
    @DisplayName("BR-AVL-04: AVAILABLE -> RESERVED, Reservation -> CONFIRMED sau payment")
    void shouldConfirmAndReserveUnit_whenUnitIsAvailable() {
        when(reservationRepository.findByIdWithLock(1042L)).thenReturn(Optional.of(pendingReservation));
        when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(availableUnit));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));

        service.confirmAfterPayment(1042L);

        assertEquals(ReservationStatus.CONFIRMED, pendingReservation.getStatus());
        assertNotNull(pendingReservation.getConfirmedAt());
        assertEquals(StorageUnitStatus.RESERVED, availableUnit.getStatus());
    }

    @Test
    @DisplayName("BR-AVL-04: Unit MAINTENANCE -> nem UNIT_ASSIGNMENT_FAILED, khong save")
    void shouldThrowUnitAssignmentFailed_whenUnitIsInMaintenance() {
        availableUnit.setStatus(StorageUnitStatus.MAINTENANCE);
        when(reservationRepository.findByIdWithLock(1042L)).thenReturn(Optional.of(pendingReservation));
        when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(availableUnit));

        CustomException ex = assertThrows(CustomException.class,
                () -> service.confirmAfterPayment(1042L));
        assertEquals(ErrorCode.UNIT_ASSIGNMENT_FAILED, ex.getErrorCode());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("BR-DEP-03: holdExpiresAt da qua -> nem RESERVATION_EXPIRED, khong lock unit")
    void shouldThrowReservationExpired_whenHoldExpired() {
        pendingReservation.setHoldExpiresAt(OffsetDateTime.now().minusHours(1));
        when(reservationRepository.findByIdWithLock(1042L)).thenReturn(Optional.of(pendingReservation));

        CustomException ex = assertThrows(CustomException.class,
                () -> service.confirmAfterPayment(1042L));
        assertEquals(ErrorCode.RESERVATION_EXPIRED, ex.getErrorCode());
        assertEquals(ReservationStatus.EXPIRED, pendingReservation.getStatus());
        verify(reservationRepository).save(pendingReservation);
        verify(storageUnitRepository, never()).findByIdForUpdate(any());
    }

    @Test
    @DisplayName("BR-AVL-04 Future Claim: unit OCCUPIED -> chi confirm Reservation, khong save unit")
    void shouldConfirmReservationOnly_whenUnitIsOccupiedFutureClaim() {
        availableUnit.setStatus(StorageUnitStatus.OCCUPIED);
        when(reservationRepository.findByIdWithLock(1042L)).thenReturn(Optional.of(pendingReservation));
        when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(availableUnit));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        service.confirmAfterPayment(1042L);

        assertEquals(ReservationStatus.CONFIRMED, pendingReservation.getStatus());
        verify(storageUnitRepository, never()).save(any());
    }
}
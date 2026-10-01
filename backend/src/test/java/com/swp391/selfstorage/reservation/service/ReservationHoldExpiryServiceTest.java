package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationHoldExpiryServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private ReservationHoldExpiryService service;

    @Test
    void expireIfElapsed_marksPendingReservationExpiredWithoutTouchingUnit() {
        Reservation reservation = new Reservation();
        reservation.setId(7L);
        reservation.setStatus(ReservationStatus.PENDING_PAYMENT);
        reservation.setHoldExpiresAt(OffsetDateTime.now().minusMinutes(1));
        when(reservationRepository.findById(7L)).thenReturn(Optional.of(reservation));

        assertTrue(service.expireIfElapsed(7L));

        assertEquals(ReservationStatus.EXPIRED, reservation.getStatus());
        verify(reservationRepository).save(reservation);
    }

    @Test
    void expireIfElapsed_leavesActiveHoldUntouched() {
        Reservation reservation = new Reservation();
        reservation.setId(8L);
        reservation.setStatus(ReservationStatus.PENDING_PAYMENT);
        reservation.setHoldExpiresAt(OffsetDateTime.now().plusHours(1));
        when(reservationRepository.findById(8L)).thenReturn(Optional.of(reservation));

        assertFalse(service.expireIfElapsed(8L));

        assertEquals(ReservationStatus.PENDING_PAYMENT, reservation.getStatus());
        verify(reservationRepository, never()).save(reservation);
    }

    @Test
    void expireElapsedHolds_marksEveryPendingRowReturnedByTheQuery() {
        Reservation first = new Reservation();
        first.setStatus(ReservationStatus.PENDING_PAYMENT);
        Reservation second = new Reservation();
        second.setStatus(ReservationStatus.PENDING_PAYMENT);
        when(reservationRepository.findByStatusAndHoldExpiresAtBefore(
                org.mockito.ArgumentMatchers.eq(ReservationStatus.PENDING_PAYMENT),
                org.mockito.ArgumentMatchers.any())).thenReturn(List.of(first, second));

        assertEquals(2, service.expireElapsedHolds());
        assertEquals(ReservationStatus.EXPIRED, first.getStatus());
        assertEquals(ReservationStatus.EXPIRED, second.getStatus());
    }
}

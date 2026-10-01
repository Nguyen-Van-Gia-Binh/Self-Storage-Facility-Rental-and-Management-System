package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * BR-DEP-03: đơn PENDING_PAYMENT quá holdExpiresAt chuyển EXPIRED.
 * Giao dịch riêng để lần từ chối thanh toán không hoàn tác trạng thái này.
 * Không đổi trạng thái ô kho.
 */
@Service
public class ReservationHoldExpiryService {

    private final ReservationRepository reservationRepository;

    public ReservationHoldExpiryService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expireIfElapsed(Long reservationId) {
        if (reservationId == null) {
            return false;
        }
        Reservation reservation = reservationRepository.findById(reservationId).orElse(null);
        if (!isElapsedPending(reservation)) {
            return false;
        }
        reservation.setStatus(ReservationStatus.EXPIRED);
        reservationRepository.save(reservation);
        return true;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int expireElapsedHolds() {
        List<Reservation> elapsed = reservationRepository.findByStatusAndHoldExpiresAtBefore(
                ReservationStatus.PENDING_PAYMENT, OffsetDateTime.now());
        for (Reservation reservation : elapsed) {
            reservation.setStatus(ReservationStatus.EXPIRED);
        }
        if (!elapsed.isEmpty()) {
            reservationRepository.saveAll(elapsed);
        }
        return elapsed.size();
    }

    private static boolean isElapsedPending(Reservation reservation) {
        return reservation != null
                && reservation.getStatus() == ReservationStatus.PENDING_PAYMENT
                && reservation.getHoldExpiresAt() != null
                && reservation.getHoldExpiresAt().isBefore(OffsetDateTime.now());
    }
}

package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.waitlist.entity.WaitlistStatus;
import com.swp391.selfstorage.waitlist.repository.WaitlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * BR-DEP-03: đơn PENDING_PAYMENT quá holdExpiresAt chuyển EXPIRED.
 * Giao dịch riêng để lần từ chối thanh toán không hoàn tác trạng thái này.
 * Không đổi trạng thái ô kho.
 */
@Service
public class ReservationHoldExpiryService {

    private final ReservationRepository reservationRepository;

    @Autowired(required = false)
    private WaitlistRepository waitlistRepository;

    @Autowired(required = false)
    private com.swp391.selfstorage.user.repository.UserRepository userRepository;

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
        recordSpamCancelForCustomer(reservation.getCustomerId());

        // Guardrail 3 (Tech Lead): Chống mồ côi - Hoàn trả Waitlist về PENDING_FOLLOW_UP
        if (waitlistRepository != null) {
            waitlistRepository.revertWaitlistsForExpiredReservations(
                    Collections.singletonList(reservationId),
                    WaitlistStatus.PENDING_FOLLOW_UP,
                    WaitlistStatus.CONVERTED
            );
        }
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
            for (Reservation r : elapsed) {
                recordSpamCancelForCustomer(r.getCustomerId());
            }

            // Guardrail 3 (Tech Lead): Chống mồ côi - Hoàn trả Waitlist về PENDING_FOLLOW_UP
            if (waitlistRepository != null) {
                List<Long> expiredIds = elapsed.stream().map(Reservation::getId).collect(Collectors.toList());
                waitlistRepository.revertWaitlistsForExpiredReservations(
                        expiredIds,
                        WaitlistStatus.PENDING_FOLLOW_UP,
                        WaitlistStatus.CONVERTED
                );
            }
        }
        return elapsed.size();
    }

    private static boolean isElapsedPending(Reservation reservation) {
        return reservation != null
                && reservation.getStatus() == ReservationStatus.PENDING_PAYMENT
                && reservation.getHoldExpiresAt() != null
                && reservation.getHoldExpiresAt().isBefore(OffsetDateTime.now());
    }

    private void recordSpamCancelForCustomer(Long customerId) {
        if (customerId != null && userRepository != null) {
            userRepository.findById(customerId).ifPresent(user -> {
                java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
                if (user.getLastCancelDate() != null && user.getLastCancelDate().equals(today)) {
                    user.setDailyCancelCount(user.getDailyCancelCount() + 1);
                } else {
                    user.setLastCancelDate(today);
                    user.setDailyCancelCount(1);
                }
                userRepository.save(user);
            });
        }
    }
}

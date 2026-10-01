package com.swp391.selfstorage.reservation.scheduler;

import com.swp391.selfstorage.reservation.service.ReservationHoldExpiryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationHoldExpiryJob {

    private final ReservationHoldExpiryService reservationHoldExpiryService;

    /**
     * Giữ chỗ có thể chỉ còn một giờ, nên quét vài phút một lần thay vì chờ nửa đêm.
     */
    @Scheduled(fixedDelayString = "${app.cron.reservation-hold-expiry-ms:120000}")
    public void expireElapsedHolds() {
        try {
            int expired = reservationHoldExpiryService.expireElapsedHolds();
            if (expired > 0) {
                log.info("Đã chuyển {} đơn giữ chỗ quá hạn sang EXPIRED", expired);
            }
        } catch (Exception ex) {
            log.error("Quét giữ chỗ quá hạn thất bại: {}", ex.getMessage(), ex);
        }
    }
}

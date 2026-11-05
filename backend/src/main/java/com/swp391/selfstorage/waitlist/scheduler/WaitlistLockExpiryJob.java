package com.swp391.selfstorage.waitlist.scheduler;

import com.swp391.selfstorage.waitlist.service.WaitlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Hybrid Lock Timeout (Cron Job 5 phút):
 * Tự động giải phóng các bản ghi CONTACTING quá hạn 2 giờ về WAITING để bảo vệ toàn vẹn dữ liệu Database.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WaitlistLockExpiryJob {

    private final WaitlistService waitlistService;

    @Scheduled(cron = "${app.cron.waitlist-lock-expiry:0 */5 * * * *}")
    public void cleanupExpiredLocks() {
        try {
            int unlocked = waitlistService.cleanupExpiredLocks();
            if (unlocked > 0) {
                log.info("[WaitlistLockExpiryJob] Đã tự động giải phóng {} đơn Waitlist hết hạn tư vấn 2 giờ về WAITING", unlocked);
            }
        } catch (Exception ex) {
            log.error("[WaitlistLockExpiryJob] Lỗi giải phóng khóa Waitlist: {}", ex.getMessage(), ex);
        }
    }
}

package com.swp391.selfstorage.waitlist.scheduler;

import com.swp391.selfstorage.waitlist.service.WaitlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Hybrid Lock Timeout & Waitlist Expiry (Cron Job 5 phút):
 * 1) Tự động giải phóng các bản ghi CONTACTING quá hạn 2 giờ về WAITING để bảo vệ toàn vẹn dữ liệu Database.
 * 2) Tự động chuyển các đơn Waitlist hết ngày mong muốn targetStartDate sang EXPIRED (Lưu trữ theo BR-WAT-06).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WaitlistLockExpiryJob {

    private final WaitlistService waitlistService;

    @Scheduled(cron = "${app.cron.waitlist-lock-expiry:0 */5 * * * ?}", zone = "Asia/Ho_Chi_Minh")
    public void cleanupExpiredLocks() {
        try {
            int unlocked = waitlistService.cleanupExpiredLocks();
            if (unlocked > 0) {
                log.info("[WaitlistLockExpiryJob] Đã tự động giải phóng {} đơn Waitlist hết hạn tư vấn 2 giờ về WAITING", unlocked);
            }
        } catch (Exception ex) {
            log.error("[WaitlistLockExpiryJob] Lỗi giải phóng khóa Waitlist: {}", ex.getMessage(), ex);
        }

        try {
            int expired = waitlistService.expirePastWaitlists();
            if (expired > 0) {
                log.info("[WaitlistLockExpiryJob] Đã tự động lưu trữ {} đơn Waitlist quá ngày mong muốn sang EXPIRED", expired);
            }
        } catch (Exception ex) {
            log.error("[WaitlistLockExpiryJob] Lỗi chuyển Waitlist hết hạn sang EXPIRED: {}", ex.getMessage(), ex);
        }
    }
}

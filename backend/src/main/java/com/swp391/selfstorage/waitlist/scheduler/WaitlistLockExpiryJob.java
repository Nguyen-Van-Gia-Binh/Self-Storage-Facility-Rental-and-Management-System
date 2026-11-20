package com.swp391.selfstorage.waitlist.scheduler;

import com.swp391.selfstorage.waitlist.service.WaitlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Waitlist Expiry Scheduler (Cron Job 5 phút):
 * Tự động chuyển các đơn Waitlist hết ngày mong muốn targetStartDate sang EXPIRED (Lưu trữ theo BR-WAT-06).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WaitlistLockExpiryJob {

    private final WaitlistService waitlistService;

    @Scheduled(cron = "${app.cron.waitlist-expiry:${app.cron.waitlist-lock-expiry:0 */5 * * * ?}}", zone = "Asia/Ho_Chi_Minh")
    public void autoArchiveExpiredWaitlists() {
        try {
            int expired = waitlistService.expirePastWaitlists();
            if (expired > 0) {
                log.info("[WaitlistExpiryJob] Đã tự động lưu trữ {} đơn Waitlist quá ngày mong muốn sang EXPIRED", expired);
            }
        } catch (Exception ex) {
            log.error("[WaitlistExpiryJob] Lỗi chuyển Waitlist hết hạn sang EXPIRED: {}", ex.getMessage(), ex);
        }
    }
}

package com.swp391.selfstorage.support.scheduler;

import java.time.OffsetDateTime;
import java.time.ZoneId;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.PolicyNumbers;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.cron.support-auto-close.enabled", havingValue = "true", matchIfMissing = true)
public class SupportAutoCloseJob {

    private final SupportRequestRepository supportRequestRepository;
    private final PolicyVersionRepository policyVersionRepository;

    @Transactional
    @Scheduled(cron = "${app.cron.support-auto-close:0 30 0 * * ?}", zone = "Asia/Ho_Chi_Minh")
    public void closeResolvedTickets() {
        PolicyVersion policy = policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now())
                .orElse(null);
        int workingDays = policy != null && policy.getSupportAutoCloseWorkingDays() != null
                ? policy.getSupportAutoCloseWorkingDays()
                : 7;
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        OffsetDateTime threshold = PolicyNumbers.minusWorkingDays(now, workingDays);
        if (threshold == null) {
            return;
        }

        int closed = supportRequestRepository.bulkAutoCloseResolvedTickets(
                SupportStatus.CLOSED, SupportStatus.RESOLVED, now, threshold);

        if (closed > 0) {
            log.info("Đã tự đóng {} phiếu hỗ trợ sau {} ngày làm việc (ngưỡng: {})", closed, workingDays, threshold);
        }
    }
}

package com.swp391.selfstorage.support.scheduler;

import java.time.OffsetDateTime;
import java.time.ZoneId;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.PolicyNumbers;
import com.swp391.selfstorage.support.entity.SupportRequest;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class SupportAutoCloseJob {

    private final SupportRequestRepository supportRequestRepository;
    private final PolicyVersionRepository policyVersionRepository;

    @Scheduled(cron = "${app.cron.support-auto-close:0 30 0 * * ?}", zone = "Asia/Ho_Chi_Minh")
    public void closeResolvedTickets() {
        PolicyVersion policy = policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now())
                .orElse(null);
        int workingDays = policy != null && policy.getSupportAutoCloseWorkingDays() != null
                ? policy.getSupportAutoCloseWorkingDays()
                : 7;
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        int closed = 0;
        for (SupportRequest ticket : supportRequestRepository.findByStatus(SupportStatus.RESOLVED)) {
            OffsetDateTime due = PolicyNumbers.plusWorkingDays(ticket.getResolvedAt(), workingDays);
            if (due == null || now.isBefore(due)) {
                continue;
            }
            ticket.setStatus(SupportStatus.CLOSED);
            ticket.setAutoClosedAt(now);
            ticket.setUpdatedAt(now);
            supportRequestRepository.save(ticket);
            closed++;
        }
        if (closed > 0) {
            log.info("Đã tự đóng {} phiếu hỗ trợ sau {} ngày làm việc", closed, workingDays);
        }
    }
}

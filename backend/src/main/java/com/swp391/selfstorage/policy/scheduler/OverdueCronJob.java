package com.swp391.selfstorage.policy.scheduler;

import com.swp391.selfstorage.policy.dto.OverdueProcessingResult;
import com.swp391.selfstorage.policy.service.OverdueProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
@Slf4j
public class OverdueCronJob {

    private final OverdueProcessingService overdueProcessingService;

    /**
     * Tác vụ tự động quét và xử lý hợp đồng quá hạn vào lúc 00:00:00 hằng đêm
     * theo múi giờ chuẩn Việt Nam (Asia/Ho_Chi_Minh).
     */
    @Scheduled(cron = "${app.cron.overdue:0 0 0 * * ?}", zone = "Asia/Ho_Chi_Minh")
    public void runNightlyOverdueProcessing() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        log.info("========== [CRONJOB] BẮT ĐẦU QUÉT QUÁ HẠN HẰNG ĐÊM ({}) ==========", today);

        try {
            OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(today);
            log.info(
                    "========== [CRONJOB] HOÀN TẤT: Quét {} HĐ | Quá hạn mới: {} | Tính phạt: {} | Chấm dứt: {} | Tổng phạt: {} đ ==========",
                    result.getTotalScanned(),
                    result.getMarkedOverdueCount(),
                    result.getPenalizedCount(),
                    result.getTerminatedCount(),
                    result.getTotalPenaltiesAccrued());
        } catch (Exception e) {
            log.error("========== [CRONJOB] GẶP LỖI TRONG QUÁ TRÌNH QUÉT QUÁ HẠN: {} ==========", e.getMessage(), e);
        }
    }
}

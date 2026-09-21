package com.swp391.selfstorage.policy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverdueProcessingResult {

    private int totalScanned;           // Tổng số hợp đồng được rà soát
    private int markedOverdueCount;     // Số hợp đồng mới chuyển sang OVERDUE (D+1..D+3)
    private int penalizedCount;         // Số hợp đồng bị tính phí phạt quá hạn (D+4..D+9)
    private int terminatedCount;        // Số hợp đồng bị cưỡng chế chấm dứt tại D+10
    private long totalPenaltiesAccrued;  // Tổng số tiền phạt phát sinh (VNĐ)
    private OffsetDateTime executedAt;  // Thời điểm thực thi lượt quét
}

package com.swp391.selfstorage.contract.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyCompensationResponse {
    private Long contractId;
    private String contractCode;
    private String customerName;
    private String customerPhone;
    private Long rentRefundAmount;
    private Long depositRefundAmount;
    private Long penaltyAmount;
    private Long totalPayoutAmount;
    private Integer disbursementDeadlineDays;
    private String reason;
    private String status;
    private OffsetDateTime approvedAt;
    private String approvedByName;
    private String message;
}

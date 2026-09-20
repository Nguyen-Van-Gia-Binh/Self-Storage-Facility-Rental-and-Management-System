package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import lombok.*;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SettlementApprovalResponse {
    private Long contractId;
    private ContractStatus status; // CLOSED
    private long depositRefundAmount;
    private long payableAmount;
    private OffsetDateTime settledAt;
    private String message;
}

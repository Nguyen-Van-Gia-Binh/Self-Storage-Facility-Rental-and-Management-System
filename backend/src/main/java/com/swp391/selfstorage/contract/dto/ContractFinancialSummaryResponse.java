package com.swp391.selfstorage.contract.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContractFinancialSummaryResponse {
    private Long contractId;
    private String contractCode;
    private String customerName;
    private String customerPhone;
    private long depositAmount;
    private long depositBalance;
    private long totalRentalFee;
    private long overdueFeeAccrued;
    private long totalUnpaidExtraCharges;
    private long totalOutstandingDebt; // overdueFeeAccrued + totalUnpaidExtraCharges
    private List<ExtraChargeItemDto> extraCharges;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExtraChargeItemDto {
        private Long id;
        private long amount;
        private String reason;
        private String status;
        private String createdAt;
    }
}

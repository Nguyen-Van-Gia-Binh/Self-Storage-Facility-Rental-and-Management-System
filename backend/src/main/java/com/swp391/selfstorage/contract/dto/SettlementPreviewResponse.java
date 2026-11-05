package com.swp391.selfstorage.contract.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SettlementPreviewResponse {
    private Long contractId;
    private long depositAmount;
    private long damageCost;
    private long overdueFee;
    private long unpaidExtraCharges;
    private long depositRefundAmount; // max(0, deposit - damage - overdue - unpaid)
    private long payableAmount;       // max(0, (damage + overdue + unpaid) - deposit)
    private long earlyRentRefund;     // BR-RET-06: Phần tiền thuê hoàn lại của thời gian chưa dùng (100%)
    private boolean earlyReturn;      // BR-RET-06: Đánh dấu trả kho sớm (phạt 100% cọc)
}

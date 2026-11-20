package com.swp391.selfstorage.contract.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SettlementPreviewResponse {
    private Long contractId;
    private long depositAmount;
    private long damageCost;
    private long overdueFee;
    private long unpaidExtraCharges;
    private long depositRefundAmount; // max(0, availableBalance - deductions)
    private long payableAmount;       // max(0, deductions - availableBalance)
    private long earlyRentRefund;     // BR-RET-06: Phần tiền thuê hoàn lại của thời gian chưa dùng (100%)
    private boolean earlyReturn;      // BR-RET-06: Đánh dấu trả kho sớm (phạt 100% cọc)
    private Long pendingSettlementOrderCode; // Mã đơn thu nợ quyết toán đang chờ thanh toán (nếu có)

    // Thông tin phân loại và hỗ trợ giao diện quyết toán
    private String settlementType;    // "EARLY_RETURN", "NORMAL", "OVERDUE_TERMINATED", "REJECTED_CHECKIN"
    private long unusedDays;          // Số ngày thuê chưa sử dụng
    private long dailyRent;           // Giá thuê 1 ngày
    private long depositForfeited;    // Tiền cọc bị phạt giữ lại do trả sớm (BR-RET-06)
    private long totalRentalFee;      // Tổng tiền thuê ban đầu (dùng cho REJECTED_CHECKIN)
    private long compensationAmount;  // Tiền phạt đền bù cọc 2x theo Điều 328 BLDS / BR-BMP-02
    private boolean doubleDepositCompensation; // Đánh dấu hợp đồng đã quyết toán bồi thường phạt cọc gấp đôi
}

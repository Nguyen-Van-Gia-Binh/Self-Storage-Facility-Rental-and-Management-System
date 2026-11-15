package com.swp391.selfstorage.contract.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SettlementApprovalRequest {
    @JsonAlias("damageCost")
    private Long adjustedDamageCost; // Cho phép FM điều chỉnh / cộng thêm chi phí phát sinh (Lưu kho tổng / Hư hại) trước khi duyệt

    @JsonAlias("note")
    private String approvedNotes;

    // Khi FM xác nhận đã thu đủ tiền mặt / chuyển khoản quầy từ khách, đóng hợp đồng CLOSED ngay lập tức
    private Boolean confirmPaid;
}

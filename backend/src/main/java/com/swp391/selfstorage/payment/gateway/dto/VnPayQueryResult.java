package com.swp391.selfstorage.payment.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VnPayQueryResult {

    private String responseCode;
    private String transactionStatus;
    private Long amount;
    private String bankCode;
    private String transactionNo;
    private String payDate;
    private String message;

    /**
     * Giao dịch đã thanh toán thành công (Mã phản hồi 00 và trạng thái giao dịch 00).
     */
    public boolean isSuccess() {
        return "00".equals(responseCode) && "00".equals(transactionStatus);
    }

    /**
     * VNPay xác nhận không tìm thấy giao dịch (Mã 91).
     */
    public boolean isNotFound() {
        return "91".equals(responseCode) || "91".equals(transactionStatus);
    }

    /**
     * Giao dịch bị lỗi / thất bại trên cổng VNPay (Mã 02).
     */
    public boolean isFailed() {
        return "02".equals(transactionStatus);
    }

    /**
     * Giao dịch đang chờ thanh toán / đang xử lý trên cổng VNPay (Mã 01).
     */
    public boolean isPending() {
        return "01".equals(transactionStatus);
    }
}

package com.swp391.selfstorage.payment.event;

/**
 * Khách đã nộp đủ phần thiếu của quyết toán trả kho (BR-RET-04).
 */
public record SettlementDebtPaidEvent(Long contractId, Long paymentId) {
}

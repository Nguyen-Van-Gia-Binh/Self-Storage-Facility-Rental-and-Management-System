package com.swp391.selfstorage.payment.event;

/**
 * Sự kiện phát ra khi thanh toán gia hạn hợp đồng thành công qua cổng PayOS (SC-04).
 */
public record ContractRenewalPaymentCompletedEvent(
        Long contractId,
        Long paymentId,
        Integer renewalMonths,
        Long amount
) {
}

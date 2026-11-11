package com.swp391.selfstorage.payment.mapper;

import org.springframework.stereotype.Component;

import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;

@Component
public class PaymentMapper {

    private static final String DEFAULT_BANK_NAME = "VNPay Sandbox";
    private static final String DEFAULT_ACCOUNT_NUMBER = "VNPAY-ONLINE";

    public PaymentResponse toResponse(PaymentTransaction entity) {
        if (entity == null) {
            return null;
        }

        String transferContent = "SMARTSTORAGE " + (entity.getReservationId() != null
                ? "RSV-" + entity.getReservationId()
                : "PAY-" + entity.getId());

        return PaymentResponse.builder()
                .id(entity.getId())
                .referenceType(entity.getTransactionType())
                .referenceId(entity.getReservationId() != null ? entity.getReservationId() : entity.getContractId())
                .amount(entity.getAmount())
                .method(entity.getPaymentMethod())
                .status(entity.getStatus())
                .orderCode(entity.getOrderCode())
                .transactionRef(entity.getProviderReference())
                .paidAt(entity.getPaidAt() != null ? entity.getPaidAt() : entity.getUpdatedAt())
                .createdAt(entity.getCreatedAt())
                .transferContent(transferContent)
                .bankName(DEFAULT_BANK_NAME)
                .bankAccountNumber(DEFAULT_ACCOUNT_NUMBER)
                .qrCodeUrl(null)
                .build();
    }
}

package com.swp391.selfstorage.payment.mapper;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Component;

import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;

@Component
public class PaymentMapper {

    private static final String DEFAULT_BANK_NAME = "MB Bank (Ngan hang Quan Doi)";
    private static final String DEFAULT_ACCOUNT_NUMBER = "0888567999";

    public PaymentResponse toResponse(PaymentTransaction entity) {
        if (entity == null) {
            return null;
        }

        String transferContent = "SMARTSTORAGE " + (entity.getReservationId() != null
                ? "RSV-" + entity.getReservationId()
                : "PAY-" + entity.getId());

        String encodedContent = URLEncoder.encode(transferContent, StandardCharsets.UTF_8);
        String qrCodeUrl = String.format(
                "https://img.vietqr.io/image/mbbank-%s-compact2.png?amount=%d&addInfo=%s",
                DEFAULT_ACCOUNT_NUMBER,
                entity.getAmount(),
                encodedContent);

        String vietQrPayload = String.format("vietqr://%s/%s?amount=%d&content=%s",
                DEFAULT_BANK_NAME, DEFAULT_ACCOUNT_NUMBER, entity.getAmount(), transferContent);

        return PaymentResponse.builder()
                .id(entity.getId())
                .referenceType(entity.getTransactionType())
                .referenceId(entity.getReservationId() != null ? entity.getReservationId() : entity.getContractId())
                .amount(entity.getAmount())
                .method(entity.getPaymentMethod())
                .status(entity.getStatus())
                .transactionRef(entity.getProviderReference())
                .paidAt(entity.getUpdatedAt())
                .createdAt(entity.getCreatedAt())
                .transferContent(transferContent)
                .bankName(DEFAULT_BANK_NAME)
                .bankAccountNumber(DEFAULT_ACCOUNT_NUMBER)
                .vietQrPayload(vietQrPayload)
                .qrCodeUrl(qrCodeUrl)
                .build();
    }
}

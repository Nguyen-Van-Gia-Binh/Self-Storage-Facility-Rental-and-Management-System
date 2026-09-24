package com.swp391.selfstorage.payment.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long id;
    private String referenceType;
    private Long referenceId;
    private Long amount;
    private String method;
    private String status;
    private String transactionRef;
    private Instant paidAt;
    private Instant createdAt;

    // Tiện ích chuyển khoản VietQR Napas247 / PayOS
    private Long orderCode;
    private String checkoutUrl;
    private String transferContent;
    private String bankName;
    private String bankAccountNumber;
    private String vietQrPayload;
    private String qrCodeUrl;
}

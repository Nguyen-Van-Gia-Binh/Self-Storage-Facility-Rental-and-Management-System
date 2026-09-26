package com.swp391.selfstorage.payment.gateway.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentCheckoutResult {
    private Long orderCode;
    private String checkoutUrl;
    private String qrCode;
    private Long amount;
    private String description;
    private String accountName;
    private String accountNumber;
    private String bin;
}

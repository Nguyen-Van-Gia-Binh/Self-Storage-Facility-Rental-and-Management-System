package com.swp391.selfstorage.payment.gateway.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentCheckoutCommand {
    private Long orderCode;
    private Long amount;
    private String description;
}

package com.swp391.selfstorage.payment.dto;

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
public class CheckoutResponse {

    private Long orderCode;
    private String checkoutUrl;
    private String qrCode;
    private Long amount;
    private String description;
    private String accountName;
    private String accountNumber;
    private String bin;
    private String status;
}

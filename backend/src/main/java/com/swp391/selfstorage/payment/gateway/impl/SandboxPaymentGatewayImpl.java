package com.swp391.selfstorage.payment.gateway.impl;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.context.annotation.Primary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.swp391.selfstorage.payment.gateway.PaymentGateway;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutCommand;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutResult;

@Component
@Primary
public class SandboxPaymentGatewayImpl implements PaymentGateway {

    private final String accountName;
    private final String accountNumber;
    private final String bin;
    private final String bankName;
    private final String checkoutUrl;

    public SandboxPaymentGatewayImpl(
            @Value("${payment.sandbox.account-name:CONG TY CP SMARTSTORAGE VIETNAM}") String accountName,
            @Value("${payment.sandbox.account-number:0888567999}") String accountNumber,
            @Value("${payment.sandbox.bank-bin:970422}") String bin,
            @Value("${payment.sandbox.bank-name:MB Bank (Ngân hàng Quân Đội)}") String bankName,
            @Value("${payment.sandbox.checkout-url:http://localhost:5173/payment/checkout}") String checkoutUrl) {
        this.accountName = accountName;
        this.accountNumber = accountNumber;
        this.bin = bin;
        this.bankName = bankName;
        this.checkoutUrl = checkoutUrl;
    }

    @Override
    public PaymentCheckoutResult createPayment(PaymentCheckoutCommand command) {
        String checkoutLink = checkoutUrl + "?orderCode=" + command.getOrderCode();

        return PaymentCheckoutResult.builder()
                .orderCode(command.getOrderCode())
                .checkoutUrl(checkoutLink)
                .qrCode(checkoutLink)
                .amount(command.getAmount())
                .description(command.getDescription())
                .accountName(accountName)
                .accountNumber(accountNumber)
                .bin(bin)
                .build();
    }
}

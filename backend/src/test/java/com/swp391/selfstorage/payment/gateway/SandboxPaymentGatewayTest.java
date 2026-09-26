package com.swp391.selfstorage.payment.gateway;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutCommand;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutResult;
import com.swp391.selfstorage.payment.gateway.impl.SandboxPaymentGatewayImpl;

class SandboxPaymentGatewayTest {

    private PaymentGateway paymentGateway;

    @BeforeEach
    void setUp() {
        paymentGateway = new SandboxPaymentGatewayImpl(
                "CONG TY CP SMARTSTORAGE VIETNAM",
                "0888567999",
                "970422",
                "MB Bank (Ngân hàng Quân Đội)",
                "http://localhost:5173/payment/checkout"
        );
    }

    @Test
    @DisplayName("Khởi tạo thanh toán Sandbox trả về thông tin VietQR Napas247 hợp lệ")
    void testCreatePayment_Success() {
        PaymentCheckoutCommand command = PaymentCheckoutCommand.builder()
                .orderCode(123456789L)
                .amount(3_200_000L)
                .description("DH100")
                .build();

        PaymentCheckoutResult result = paymentGateway.createPayment(command);

        assertNotNull(result);
        assertEquals(123456789L, result.getOrderCode());
        assertEquals(3_200_000L, result.getAmount());
        assertEquals("0888567999", result.getAccountNumber());
        assertEquals("CONG TY CP SMARTSTORAGE VIETNAM", result.getAccountName());
        assertEquals("http://localhost:5173/payment/checkout?orderCode=123456789", result.getCheckoutUrl());
        assertTrue(result.getQrCode().startsWith("https://img.vietqr.io/image/970422-0888567999-compact2.png"));
        assertTrue(result.getQrCode().contains("amount=3200000"));
    }
}

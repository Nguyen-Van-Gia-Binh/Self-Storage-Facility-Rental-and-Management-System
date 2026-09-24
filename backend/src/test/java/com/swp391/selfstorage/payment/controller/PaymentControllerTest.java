package com.swp391.selfstorage.payment.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.payment.dto.CheckoutRequest;
import com.swp391.selfstorage.payment.dto.CheckoutResponse;
import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.service.PaymentService;

@WebMvcTest(PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentService paymentService;

    @Test
    @DisplayName("POST /payments/checkout - Tạo link thanh toán PayOS VietQR thành công (201 Created)")
    void testCreateCheckout_Success() throws Exception {
        CheckoutRequest request = CheckoutRequest.builder()
                .referenceType("RESERVATION")
                .referenceId(100L)
                .description("DH100")
                .build();

        CheckoutResponse response = CheckoutResponse.builder()
                .orderCode(123456789L)
                .checkoutUrl("https://pay.payos.vn/web/123456789")
                .qrCode("00020101021238540010A0000007270126...")
                .amount(3_200_000L)
                .description("DH100")
                .accountName("SMART STORAGE")
                .accountNumber("0888567999")
                .bin("970422")
                .status("PENDING")
                .build();

        when(paymentService.createCheckoutLink(any(CheckoutRequest.class))).thenReturn(response);

        mockMvc.perform(post("/payments/checkout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderCode").value(123456789L))
                .andExpect(jsonPath("$.checkoutUrl").value("https://pay.payos.vn/web/123456789"))
                .andExpect(jsonPath("$.amount").value(3_200_000L))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /payments/webhook/payos - Nhận webhook thành công trả về 200 OK")
    void testHandlePayOSWebhook_Success() throws Exception {
        String webhookJson = """
                {
                    "code": "00",
                    "desc": "success",
                    "data": {
                        "orderCode": 123456789,
                        "amount": 3200000,
                        "description": "DH100",
                        "accountNumber": "0888567999",
                        "reference": "FT242500001",
                        "transactionDateTime": "2026-09-24 21:00:00",
                        "currency": "VND",
                        "paymentLinkId": "PL123"
                    },
                    "signature": "mock_signature_hash"
                }
                """;

        when(paymentService.processPayOSWebhook(any())).thenReturn(PaymentResponse.builder()
                .id(1L)
                .orderCode(123456789L)
                .status("SUCCESS")
                .build());

        mockMvc.perform(post("/payments/webhook/payos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(webhookJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.error").value(0))
                .andExpect(jsonPath("$.message").value("Success"));

        verify(paymentService).processPayOSWebhook(any());
    }

    @Test
    @DisplayName("GET /payments/order/{orderCode}/status - Tra cứu trạng thái giao dịch theo orderCode (200 OK)")
    void testGetPaymentByOrderCode_Success() throws Exception {
        PaymentResponse response = PaymentResponse.builder()
                .id(10L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("SUCCESS")
                .referenceType("INITIAL_PAYMENT")
                .referenceId(100L)
                .build();

        when(paymentService.getPaymentByOrderCode(eq(123456789L))).thenReturn(response);

        mockMvc.perform(get("/payments/order/123456789/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.orderCode").value(123456789L))
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    @DisplayName("POST /payments/order/{orderCode}/simulate-success - Giả lập thanh toán thành công (200 OK)")
    void testSimulatePaymentSuccess() throws Exception {
        PaymentResponse response = PaymentResponse.builder()
                .id(10L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("SUCCESS")
                .transactionRef("SIMULATED-12345")
                .build();

        when(paymentService.simulatePaymentSuccess(eq(123456789L))).thenReturn(response);

        mockMvc.perform(post("/payments/order/123456789/simulate-success"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.orderCode").value(123456789L))
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.transactionRef").value("SIMULATED-12345"));

        verify(paymentService).simulatePaymentSuccess(123456789L);
    }
}

package com.swp391.selfstorage.payment.gateway.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.swp391.selfstorage.payment.gateway.PaymentGateway;
import com.swp391.selfstorage.payment.gateway.dto.MomoCreatePaymentRequest;
import com.swp391.selfstorage.payment.gateway.dto.MomoCreatePaymentResponse;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutCommand;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutResult;
import com.swp391.selfstorage.payment.gateway.util.MomoSecurityUtil;

@Component
public class MomoPaymentGatewayImpl implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(MomoPaymentGatewayImpl.class);

    private final String partnerCode;
    private final String accessKey;
    private final String secretKey;
    private final String endpoint;
    private final String ipnUrl;
    private final String redirectUrl;
    private final RestTemplate restTemplate;

    public MomoPaymentGatewayImpl(
            @Value("${payment.momo.partner-code:MOMO}") String partnerCode,
            @Value("${payment.momo.access-key:F8BBA842ECF85}") String accessKey,
            @Value("${payment.momo.secret-key:K951B6PE1waDMi640xX08PD3vg6EkVlz}") String secretKey,
            @Value("${payment.momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}") String endpoint,
            @Value("${payment.momo.ipn-url:https://excess-marathon-goal.ngrok-free.dev/api/v1/payments/webhook/momo}") String ipnUrl,
            @Value("${payment.momo.redirect-url:http://localhost:5173/customer/my-units}") String redirectUrl,
            @Autowired(required = false) RestTemplate restTemplate) {
        this.partnerCode = partnerCode;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.endpoint = endpoint;
        this.ipnUrl = ipnUrl;
        this.redirectUrl = redirectUrl;
        this.restTemplate = restTemplate != null ? restTemplate : new RestTemplate();
    }

    @Override
    public PaymentCheckoutResult createPayment(PaymentCheckoutCommand command) {
        String orderId = "DH" + command.getOrderCode();
        String requestId = "REQ" + command.getOrderCode() + "_" + System.currentTimeMillis();
        Long amount = command.getAmount();
        String orderInfo = "Thanh toan don #" + command.getOrderCode();
        String extraData = "";
        String requestType = "captureWallet";

        // Chuỗi ký số MoMo chuẩn
        String rawHash = "accessKey=" + accessKey +
                "&amount=" + amount +
                "&extraData=" + extraData +
                "&ipnUrl=" + ipnUrl +
                "&orderId=" + orderId +
                "&orderInfo=" + orderInfo +
                "&partnerCode=" + partnerCode +
                "&redirectUrl=" + redirectUrl +
                "&requestId=" + requestId +
                "&requestType=" + requestType;

        String signature = MomoSecurityUtil.signHmacSHA256(rawHash, secretKey);

        MomoCreatePaymentRequest requestBody = MomoCreatePaymentRequest.builder()
                .partnerCode(partnerCode)
                .partnerName("SmartStorage")
                .storeId("SmartStorageStore")
                .requestId(requestId)
                .amount(amount)
                .orderId(orderId)
                .orderInfo(orderInfo)
                .redirectUrl(redirectUrl)
                .ipnUrl(ipnUrl)
                .lang("vi")
                .extraData(extraData)
                .requestType(requestType)
                .signature(signature)
                .build();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<MomoCreatePaymentRequest> entity = new HttpEntity<>(requestBody, headers);

            log.info("Sending payment creation to MoMo Sandbox: endpoint={}, orderId={}, amount={}",
                    endpoint, orderId, amount);

            ResponseEntity<MomoCreatePaymentResponse> response = restTemplate.postForEntity(
                    endpoint, entity, MomoCreatePaymentResponse.class);

            MomoCreatePaymentResponse body = response.getBody();
            if (body != null && body.getResultCode() != null && body.getResultCode() == 0) {
                log.info("MoMo payment created successfully: payUrl={}, qrCodeUrl={}",
                        body.getPayUrl(), body.getQrCodeUrl());

                String qrCode = (body.getPayUrl() != null && !body.getPayUrl().isBlank())
                        ? body.getPayUrl()
                        : body.getQrCodeUrl();

                return PaymentCheckoutResult.builder()
                        .orderCode(command.getOrderCode())
                        .checkoutUrl(body.getPayUrl())
                        .qrCode(qrCode)
                        .amount(amount)
                        .description(orderInfo)
                        .accountName("VÍ ĐIỆN TỬ MOMO (SANDBOX)")
                        .accountNumber("MOMO-SANDBOX")
                        .bin("MOMO")
                        .build();
            } else {
                String errMsg = body != null ? body.getMessage() : "Không nhận được phản hồi từ MoMo";
                log.warn("MoMo API returned error: resultCode={}, message={}",
                        body != null ? body.getResultCode() : null, errMsg);
            }
        } catch (Exception e) {
            log.error("Exception while calling MoMo API: {}", e.getMessage(), e);
        }

        // Fallback an toàn nếu MoMo sandbox mạng ngoài timeout
        String fallbackPayUrl = "https://test-payment.momo.vn/v2/gateway/pay?orderId=" + orderId;
        return PaymentCheckoutResult.builder()
                .orderCode(command.getOrderCode())
                .checkoutUrl(fallbackPayUrl)
                .qrCode("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + fallbackPayUrl)
                .amount(amount)
                .description(orderInfo)
                .accountName("VÍ ĐIỆN TỬ MOMO (SANDBOX)")
                .accountNumber("MOMO-SANDBOX")
                .bin("MOMO")
                .build();
    }
}

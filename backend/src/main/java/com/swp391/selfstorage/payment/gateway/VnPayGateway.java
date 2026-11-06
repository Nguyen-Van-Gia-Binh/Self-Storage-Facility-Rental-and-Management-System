package com.swp391.selfstorage.payment.gateway;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.payment.gateway.dto.VnPayQueryResult;

@Component
public class VnPayGateway {

    private static final Logger log = LoggerFactory.getLogger(VnPayGateway.class);
    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;
    private final String frontendReturnUrl;
    private final String queryDrUrl;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public VnPayGateway(
            @Value("${payment.vnpay.tmn-code:}") String tmnCode,
            @Value("${payment.vnpay.hash-secret:}") String hashSecret,
            @Value("${payment.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String payUrl,
            @Value("${payment.vnpay.return-url:http://localhost:8080/api/v1/payments/vnpay/return}") String returnUrl,
            @Value("${payment.vnpay.frontend-return-url:http://localhost:5173/payment/checkout}") String frontendReturnUrl,
            @Value("${payment.vnpay.querydr-url:https://sandbox.vnpayment.vn/merchant_webapi/api/transaction}") String queryDrUrl) {
        this.tmnCode = tmnCode == null ? "" : tmnCode.trim();
        this.hashSecret = hashSecret == null ? "" : hashSecret.trim();
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
        this.frontendReturnUrl = frontendReturnUrl;
        this.queryDrUrl = queryDrUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public boolean configured() {
        return !tmnCode.isEmpty() && !hashSecret.isEmpty();
    }

    public String frontendReturnUrl() {
        return frontendReturnUrl;
    }

    public String buildPayUrl(long orderCode, long amountVnd, String orderInfo, String bankCode, String ip) {
        if (!configured()) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Chưa cấu hình VNPay sandbox (vnp_TmnCode, vnp_HashSecret)");
        }
        if (!"VNBANK".equals(bankCode) && !"INTCARD".equals(bankCode)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Chỉ hỗ trợ VNBANK hoặc INTCARD");
        }
        ZonedDateTime now = ZonedDateTime.now(VN);
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amountVnd * 100L));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", String.valueOf(orderCode));
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", ip == null || ip.isBlank() ? "127.0.0.1" : ip);
        params.put("vnp_CreateDate", STAMP.format(now));
        params.put("vnp_ExpireDate", STAMP.format(now.plusMinutes(15)));
        params.put("vnp_BankCode", bankCode);
        String hashData = signData(params);
        return payUrl + "?" + hashData + "&vnp_SecureHash=" + hmac(hashSecret, hashData);
    }

    public boolean verify(Map<String, String> params) {
        return configured() && verifyParams(hashSecret, params);
    }

    public VnPayQueryResult queryDr(long orderCode) {
        return queryDr(orderCode, null);
    }

    public VnPayQueryResult queryDr(long orderCode, Instant createdAt) {
        if (!configured()) {
            log.warn("VNPay chưa được cấu hình, bỏ qua queryDr cho orderCode={}", orderCode);
            return VnPayQueryResult.builder()
                    .responseCode("99")
                    .transactionStatus("NOT_CONFIGURED")
                    .message("VNPay not configured")
                    .build();
        }
        try {
            ZonedDateTime now = ZonedDateTime.now(VN);
            String createDate = STAMP.format(now);
            String transDate = createdAt != null
                    ? STAMP.format(createdAt.atZone(VN))
                    : createDate;
            String requestId = UUID.randomUUID().toString().replace("-", "");
            String orderInfo = "Query order " + orderCode;
            String ipAddr = "127.0.0.1";

            // Hash format VNPay QueryDR v2.1.0:
            // vnp_RequestId|vnp_Version|vnp_Command|vnp_TmnCode|vnp_TxnRef|vnp_TransactionDate|vnp_CreateDate|vnp_IpAddr|vnp_OrderInfo
            String rawHash = String.join("|",
                    requestId,
                    "2.1.0",
                    "querydr",
                    tmnCode,
                    String.valueOf(orderCode),
                    transDate,
                    createDate,
                    ipAddr,
                    orderInfo);
            String secureHash = hmac(hashSecret, rawHash);

            Map<String, Object> reqBody = new HashMap<>();
            reqBody.put("vnp_RequestId", requestId);
            reqBody.put("vnp_Version", "2.1.0");
            reqBody.put("vnp_Command", "querydr");
            reqBody.put("vnp_TmnCode", tmnCode);
            reqBody.put("vnp_TxnRef", String.valueOf(orderCode));
            reqBody.put("vnp_OrderInfo", orderInfo);
            reqBody.put("vnp_TransactionDate", transDate);
            reqBody.put("vnp_CreateDate", createDate);
            reqBody.put("vnp_IpAddr", ipAddr);
            reqBody.put("vnp_SecureHash", secureHash);

            String jsonPayload = objectMapper.writeValueAsString(reqBody);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(queryDrUrl))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(6))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() == 200 && response.body() != null && !response.body().isBlank()) {
                JsonNode root = objectMapper.readTree(response.body());
                String respCode = root.path("vnp_ResponseCode").asText("");
                String txnStatus = root.path("vnp_TransactionStatus").asText("");
                long amount = root.path("vnp_Amount").asLong(0L);
                String bankCode = root.path("vnp_BankCode").asText("");
                String txnNo = root.path("vnp_TransactionNo").asText("");
                String payDate = root.path("vnp_PayDate").asText("");
                String message = root.path("vnp_Message").asText("");

                log.info("VNPay QueryDR orderCode={} -> respCode={}, txnStatus={}, amount={}",
                        orderCode, respCode, txnStatus, amount);

                return VnPayQueryResult.builder()
                        .responseCode(respCode)
                        .transactionStatus(txnStatus)
                        .amount(amount)
                        .bankCode(bankCode)
                        .transactionNo(txnNo)
                        .payDate(payDate)
                        .message(message)
                        .build();
            } else {
                log.warn("VNPay QueryDR returned HTTP status {}", response.statusCode());
                return VnPayQueryResult.builder()
                        .responseCode(String.valueOf(response.statusCode()))
                        .transactionStatus("HTTP_ERROR")
                        .message("HTTP " + response.statusCode())
                        .build();
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi gọi VNPay QueryDR cho orderCode={}: {}", orderCode, ex.getMessage());
            return VnPayQueryResult.builder()
                    .responseCode("99")
                    .transactionStatus("ERROR")
                    .message(ex.getMessage())
                    .build();
        }
    }

    static boolean verifyParams(String secret, Map<String, String> params) {
        if (secret == null || secret.isBlank() || params == null) {
            return false;
        }
        String received = params.get("vnp_SecureHash");
        if (received == null || received.isBlank()) {
            return false;
        }
        Map<String, String> fields = new TreeMap<>();
        params.forEach((key, value) -> {
            if (key != null && key.startsWith("vnp_")
                    && !"vnp_SecureHash".equals(key)
                    && !"vnp_SecureHashType".equals(key)
                    && value != null && !value.isEmpty()) {
                fields.put(key, value);
            }
        });
        return hmac(secret, signData(fields)).equalsIgnoreCase(received);
    }

    static String signData(Map<String, String> sorted) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : sorted.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isEmpty()) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append('&');
            }
            sb.append(entry.getKey()).append('=').append(encode(entry.getValue()));
        }
        return sb.toString();
    }

    static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    static String hmac(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(raw.length * 2);
            for (byte b : raw) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("HMAC-SHA512 failed", ex);
        }
    }
}

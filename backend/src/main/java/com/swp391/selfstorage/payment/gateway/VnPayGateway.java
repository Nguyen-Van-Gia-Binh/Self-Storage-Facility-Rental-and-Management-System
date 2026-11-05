package com.swp391.selfstorage.payment.gateway;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;

@Component
public class VnPayGateway {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;
    private final String frontendReturnUrl;

    public VnPayGateway(
            @Value("${payment.vnpay.tmn-code:}") String tmnCode,
            @Value("${payment.vnpay.hash-secret:}") String hashSecret,
            @Value("${payment.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String payUrl,
            @Value("${payment.vnpay.return-url:http://localhost:8080/api/v1/payments/vnpay/return}") String returnUrl,
            @Value("${payment.vnpay.frontend-return-url:http://localhost:5173/payment/checkout}") String frontendReturnUrl) {
        this.tmnCode = tmnCode == null ? "" : tmnCode.trim();
        this.hashSecret = hashSecret == null ? "" : hashSecret.trim();
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
        this.frontendReturnUrl = frontendReturnUrl;
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

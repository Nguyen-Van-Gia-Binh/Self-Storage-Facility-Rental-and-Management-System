package com.swp391.selfstorage.payment.gateway;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class VnPayGatewayTest {

    private static final String SECRET = "TESTSECRET";

    @Test
    @DisplayName("Ký rồi verify đúng; khoảng trắng thành %20; bỏ vnp_SecureHash khỏi chuỗi băm")
    void signThenVerify() {
        Map<String, String> fields = new TreeMap<>();
        fields.put("vnp_Amount", "320000000");
        fields.put("vnp_OrderInfo", "DH 100");
        fields.put("vnp_TxnRef", "123456789");

        String signed = VnPayGateway.signData(fields);
        assertTrue(signed.indexOf("vnp_Amount=") < signed.indexOf("vnp_OrderInfo="));
        assertTrue(signed.contains("DH%20100"));
        assertFalse(signed.contains("+"));
        assertFalse(signed.contains("vnp_SecureHash"));

        Map<String, String> returned = new HashMap<>(fields);
        returned.put("vnp_SecureHash", VnPayGateway.hmac(SECRET, signed));
        returned.put("vnp_SecureHashType", "HMACSHA512");

        assertTrue(VnPayGateway.verifyParams(SECRET, returned));
    }

    @Test
    @DisplayName("Sửa vnp_Amount thì chữ ký phải sai")
    void tamperedAmountFails() {
        Map<String, String> fields = new TreeMap<>();
        fields.put("vnp_Amount", "320000000");
        fields.put("vnp_TxnRef", "123456789");
        String hash = VnPayGateway.hmac(SECRET, VnPayGateway.signData(fields));

        Map<String, String> returned = new HashMap<>(fields);
        returned.put("vnp_Amount", "100");
        returned.put("vnp_SecureHash", hash);

        assertFalse(VnPayGateway.verifyParams(SECRET, returned));
    }
}

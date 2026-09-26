package com.swp391.selfstorage.payment.config;

import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class PayOSRemovalTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner();

    @Test
    @DisplayName("Xác nhận bean PayOS bên thứ ba không còn tồn tại trong context hệ thống")
    void testPayOSBeanDoesNotExist() {
        contextRunner.run(context -> {
            assertFalse(context.containsBean("payOS"),
                    "Bean payOS từ SDK bên thứ ba không được phép tồn tại trong hệ thống");
        });
    }
}

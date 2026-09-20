package com.swp391.selfstorage.unit.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class UnitTypeEntityTest {

    @Test
    @DisplayName("Khởi tạo UnitType và tính toán diện tích, thể tích chính xác")
    void testUnitTypeCalculations() {
        UnitType ut = UnitType.builder()
                .code("UT-S")
                .name("Loại S — 3m²")
                .widthM(new BigDecimal("1.50"))
                .lengthM(new BigDecimal("2.00"))
                .heightM(new BigDecimal("2.50"))
                .description("Phù hợp đồ cá nhân")
                .isActive(true)
                .build();

        assertEquals(new BigDecimal("3.00"), ut.getAreaM2());
        assertEquals(new BigDecimal("7.500"), ut.getVolumeM3());
        assertTrue(ut.isActive());
    }
}

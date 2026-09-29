package com.swp391.selfstorage.policy.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * BR-GEN-05 / BR-GEN-04: giá thuê tháng = đơn giá m² × diện tích, làm tròn 1.000 (HALF_UP).
 */
public final class MonthlyRentCalculator {

    private MonthlyRentCalculator() {
    }

    public static long computeMonthlyRent(long pricePerM2, BigDecimal areaM2) {
        if (areaM2 == null || areaM2.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Diện tích phải lớn hơn 0");
        }
        BigDecimal product = BigDecimal.valueOf(pricePerM2).multiply(areaM2);
        return product
                .divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(1000))
                .longValueExact();
    }

    public static Long derivePricePerM2(Long monthlyPrice, BigDecimal areaM2) {
        if (monthlyPrice == null || monthlyPrice <= 0 || areaM2 == null || areaM2.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return BigDecimal.valueOf(monthlyPrice)
                .divide(areaM2, 0, RoundingMode.HALF_UP)
                .longValueExact();
    }
}

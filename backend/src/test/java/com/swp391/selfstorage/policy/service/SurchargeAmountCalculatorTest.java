package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.policy.entity.ExtraFeeType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SurchargeAmountCalculatorTest {

    @Test
    @DisplayName("BR-PRI-02: báo giá đặt chỗ chỉ giữ VALUE_ADDED")
    void prepaidValueAddedDropsOtherGroups() {
        ExtraFeeType pallet = fee("VALUE_ADDED", "Pallet", 50_000L);
        ExtraFeeType cleaning = fee("CLEANING", "Vệ sinh", 80_000L);
        ExtraFeeType damage = fee("DAMAGE", "Bồi thường", 200_000L);
        ExtraFeeType key = fee("ACCESS_KEY", "Khóa cơ", 30_000L);

        List<ExtraFeeType> prepaid = SurchargeAmountCalculator.prepaidValueAdded(
                List.of(pallet, cleaning, damage, key));

        assertEquals(1, prepaid.size());
        assertEquals("Pallet", prepaid.get(0).getName());
        assertEquals(50_000L, SurchargeAmountCalculator.total(
                SurchargeAmountCalculator.lines(prepaid, 800_000L, 3)));
    }

    private static ExtraFeeType fee(String category, String name, long amount) {
        return ExtraFeeType.builder()
                .category(category)
                .name(name)
                .amount(amount)
                .feeType("FIXED")
                .isActive(true)
                .build();
    }
}

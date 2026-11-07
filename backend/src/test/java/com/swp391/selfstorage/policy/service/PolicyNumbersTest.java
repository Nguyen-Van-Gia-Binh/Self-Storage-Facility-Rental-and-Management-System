package com.swp391.selfstorage.policy.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class PolicyNumbersTest {

    @Test
    @DisplayName("plusWorkingDays và minusWorkingDays phải là nghịch đảo của nhau và bỏ qua Thứ 7, Chủ Nhật")
    void testWorkingDaysCalculation() {
        // Thứ 2: 2026-11-02 10:00:00 UTC
        OffsetDateTime monday = OffsetDateTime.of(2026, 11, 2, 10, 0, 0, 0, ZoneOffset.UTC);

        // Cộng 5 ngày làm việc: T2 -> T3(1), T4(2), T5(3), T6(4), T7(skip), CN(skip), T2 tuần sau(5) -> 2026-11-09
        OffsetDateTime nextMonday = PolicyNumbers.plusWorkingDays(monday, 5);
        assertNotNull(nextMonday);
        assertEquals(DayOfWeek.MONDAY, nextMonday.getDayOfWeek());
        assertEquals(9, nextMonday.getDayOfMonth());

        // Trừ 5 ngày làm việc từ nextMonday phải quay về đúng monday ban đầu
        OffsetDateTime backToMonday = PolicyNumbers.minusWorkingDays(nextMonday, 5);
        assertNotNull(backToMonday);
        assertEquals(monday, backToMonday);
    }

    @Test
    @DisplayName("minusWorkingDays khi workingDays = 0 hoặc start = null")
    void testEdgeCases() {
        assertNull(PolicyNumbers.minusWorkingDays(null, 5));
        assertNull(PolicyNumbers.plusWorkingDays(null, 5));

        OffsetDateTime date = OffsetDateTime.of(2026, 11, 6, 15, 30, 0, 0, ZoneOffset.UTC);
        assertEquals(date, PolicyNumbers.minusWorkingDays(date, 0));
        assertEquals(date, PolicyNumbers.plusWorkingDays(date, 0));
    }
}


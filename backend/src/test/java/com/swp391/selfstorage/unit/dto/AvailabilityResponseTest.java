package com.swp391.selfstorage.unit.dto;

import com.swp391.selfstorage.common.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class AvailabilityResponseTest {

    @Test
    @DisplayName("Khởi tạo AvailabilityResponse đầy đủ các trường theo đúng API-SPEC")
    void testAvailabilityResponseBuilder() {
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        LocalDate endDateExclusive = LocalDate.of(2027, 1, 1);

        AvailabilityResponse response = AvailabilityResponse.builder()
                .facilityId(1L)
                .unitTypeId(7L)
                .startDate(startDate)
                .endDateExclusive(endDateExclusive)
                .rentalMonths(3)
                .availableSlots(5L)
                .monthlyPrice(800000L)
                .totalRentalFee(2400000L)
                .depositAmount(800000L)
                .build();

        assertEquals(1L, response.getFacilityId());
        assertEquals(7L, response.getUnitTypeId());
        assertEquals(startDate, response.getStartDate());
        assertEquals(endDateExclusive, response.getEndDateExclusive());
        assertEquals(3, response.getRentalMonths());
        assertEquals(5L, response.getAvailableSlots());
        assertEquals(800000L, response.getMonthlyPrice());
        assertEquals(2400000L, response.getTotalRentalFee());
        assertEquals(800000L, response.getDepositAmount());
    }

    @Test
    @DisplayName("ErrorCode có chứa INVALID_START_DATE với status 400")
    void testErrorCodeInvalidStartDate() {
        assertNotNull(ErrorCode.valueOf("INVALID_START_DATE"));
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ErrorCode.INVALID_START_DATE.getHttpStatus());
    }
}

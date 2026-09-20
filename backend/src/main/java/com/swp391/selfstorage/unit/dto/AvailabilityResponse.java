package com.swp391.selfstorage.unit.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilityResponse {
    private Long facilityId;
    private Long unitTypeId;
    private LocalDate startDate;
    private LocalDate endDateExclusive;
    private Integer rentalMonths;
    private Long availableSlots;
    private Long monthlyPrice;
    private Long totalRentalFee;
    private Long depositAmount;
}

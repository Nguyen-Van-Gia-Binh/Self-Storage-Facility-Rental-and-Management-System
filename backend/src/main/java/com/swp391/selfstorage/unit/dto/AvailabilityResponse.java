package com.swp391.selfstorage.unit.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.swp391.selfstorage.policy.dto.SurchargeLineResponse;

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
    @Builder.Default
    private List<SurchargeLineResponse> surcharges = new ArrayList<>();
    @Builder.Default
    private Long surchargeTotal = 0L;
}

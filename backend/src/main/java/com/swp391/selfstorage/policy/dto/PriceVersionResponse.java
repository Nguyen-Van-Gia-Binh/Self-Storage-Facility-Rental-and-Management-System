package com.swp391.selfstorage.policy.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceVersionResponse {
    private Long id;
    private Long facilityId;
    private Long unitTypeId;
    private String unitTypeCode;
    private String unitTypeName;
    private Long pricePerM2;
    private Long monthlyPrice;
    private LocalDate effectiveFrom;
    private String status;
    private OffsetDateTime createdAt;
}

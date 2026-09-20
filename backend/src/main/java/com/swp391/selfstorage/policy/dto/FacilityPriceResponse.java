package com.swp391.selfstorage.policy.dto;

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
public class FacilityPriceResponse {
    private Long id;
    private Long facilityId;
    private Long unitTypeId;
    private String unitTypeCode;
    private String unitTypeName;
    private Long monthlyPrice;
    private OffsetDateTime updatedAt;
}

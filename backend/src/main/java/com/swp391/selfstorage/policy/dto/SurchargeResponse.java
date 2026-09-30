package com.swp391.selfstorage.policy.dto;

import java.time.Instant;
import java.time.LocalDate;

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
public class SurchargeResponse {
    private Long id;
    private String code;
    private String name;
    /** ACCESS_KEY, CLEANING, DAMAGE hoặc VALUE_ADDED. */
    private String category;
    private Long amount;
    private Long facilityId;
    private String facilityName;
    /** FIXED hoặc PERCENTAGE. JSON field `type` khớp form BOM. */
    private String type;
    private LocalDate effectiveDate;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}

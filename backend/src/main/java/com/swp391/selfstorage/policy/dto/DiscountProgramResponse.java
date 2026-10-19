package com.swp391.selfstorage.policy.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscountProgramResponse {
    private Long id;
    private String name;
    private String discountType; // PERCENT | AMOUNT
    private BigDecimal discountValue;
    private Integer minRentalMonths;
    private LocalDate startDate;
    private LocalDate endDate;
    private String scopeType; // SYSTEM | FACILITY | UNIT_TYPE
    private Long facilityId;
    private String facilityName;
    private Long unitTypeId;
    private String unitTypeName;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

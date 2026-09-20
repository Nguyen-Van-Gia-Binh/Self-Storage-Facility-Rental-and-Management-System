package com.swp391.selfstorage.unit.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitTypeResponse {
    private Long id;
    private Long facilityId;
    private String code;
    private String name;
    private String description;
    private BigDecimal widthM;
    private BigDecimal depthM;
    private BigDecimal heightM;
    private BigDecimal areaM2;
    private BigDecimal volumeM3;
    private Long monthlyPrice;
    private Long totalUnits;
    private boolean isActive;
}

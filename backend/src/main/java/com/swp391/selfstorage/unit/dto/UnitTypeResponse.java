package com.swp391.selfstorage.unit.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("isActive")
    private boolean isActive;

    @JsonProperty("isActive")
    public boolean isActive() {
        return isActive;
    }
}

package com.swp391.selfstorage.report.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityOccupancyDetailDto {
    private Long facilityId;
    private String facilityName;
    private long totalUnits;
    private long availableUnits;
    private long reservedUnits;
    private long occupiedUnits;
    private long cleaningUnits;
    private long maintenanceUnits;
    private long outOfServiceUnits;
    private long overdueContractsCount;
    private double occupancyRate;
}

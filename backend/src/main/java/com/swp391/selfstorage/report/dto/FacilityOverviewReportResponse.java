package com.swp391.selfstorage.report.dto;

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
public class FacilityOverviewReportResponse {
    private Long facilityId;
    private String facilityName;
    private String month;
    private long totalUnits;
    private long availableUnits;
    private long occupiedUnits;
    private long maintenanceUnits;
    private double occupancyRate;
    private long activeContracts;
    private long overdueContracts;
    private long newContracts;
    private long returnedContracts;
    private long totalRevenue;
    private long rentalRevenue;
    private long surchargeRevenue;
    private long depositBalance;
}

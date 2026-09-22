package com.swp391.selfstorage.report.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemOccupancyReportResponse {
    private double overallOccupancyRate;
    private long totalUnits;
    private long totalOccupiedUnits;
    private long totalAvailableUnits;
    private List<FacilityOccupancyDetailDto> facilities;
}

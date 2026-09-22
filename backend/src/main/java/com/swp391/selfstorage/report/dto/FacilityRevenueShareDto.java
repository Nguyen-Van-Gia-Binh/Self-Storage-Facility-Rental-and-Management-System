package com.swp391.selfstorage.report.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityRevenueShareDto {
    private Long facilityId;
    private String facilityName;
    private long revenue;
}

package com.swp391.selfstorage.report.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemRevenueReportResponse {
    private String from;
    private String to;
    private long totalRevenue;
    private long rentalRevenue;
    private long surchargeRevenue;
    private long overdueFeeRevenue;
    private long renewalRevenue;
    private long depositBalance;
    private long totalRefundAmount;
    private List<FacilityRevenueShareDto> byFacility;
}

package com.swp391.selfstorage.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO biểu diễn dữ liệu tài chính theo từng tháng phục vụ biểu đồ xu hướng 12 tháng (BM-04).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyRevenueTrendDto {
    private String month;            // "2026-01", "2026-02", ...
    private String monthLabel;       // "T01/26", "T02/26", ...
    private long rentalRevenue;      // Tiền thuê kho
    private long surchargeRevenue;   // Phụ phí dịch vụ & đền bù
    private long overdueFeeRevenue;  // Phí phạt quá hạn
    private long renewalRevenue;     // Phí gia hạn hợp đồng
    private long cashFlow;           // Dòng tiền thực thu trong tháng
    private long mrr;                // Doanh thu định kỳ (Net MRR) từ các HĐ ACTIVE
}


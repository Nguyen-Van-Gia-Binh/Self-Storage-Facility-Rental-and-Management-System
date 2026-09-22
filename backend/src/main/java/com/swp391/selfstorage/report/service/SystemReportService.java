package com.swp391.selfstorage.report.service;

import com.swp391.selfstorage.report.dto.SystemOccupancyReportResponse;
import com.swp391.selfstorage.report.dto.SystemRevenueReportResponse;

import java.time.LocalDate;

public interface SystemReportService {

    /**
     * Báo cáo doanh thu toàn hệ thống theo kỳ, bóc tách dòng tiền và phân bổ theo
     * cơ sở (BM-04, US-BM-04.1).
     */
    SystemRevenueReportResponse getSystemRevenueReport(LocalDate from, LocalDate to, Long facilityId);

    /**
     * Báo cáo tỷ lệ lấp đầy (Usage Rate / Occupancy) và bóc tách trạng thái ô kho
     * toàn hệ thống (BM-04, US-BM-04.2).
     */
    SystemOccupancyReportResponse getSystemOccupancyReport(Long facilityId);
}

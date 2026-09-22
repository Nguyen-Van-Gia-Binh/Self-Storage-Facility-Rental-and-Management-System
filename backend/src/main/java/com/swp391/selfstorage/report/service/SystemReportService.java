package com.swp391.selfstorage.report.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.report.dto.OverdueContractDetailDto;
import com.swp391.selfstorage.report.dto.ReportExportType;
import com.swp391.selfstorage.report.dto.SystemOccupancyReportResponse;
import com.swp391.selfstorage.report.dto.SystemRevenueReportResponse;
import org.springframework.data.domain.Pageable;

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

    /**
     * Báo cáo danh sách hợp đồng quá hạn phân trang trên toàn hệ thống hoặc theo cơ
     * sở (BM-05).
     */
    PageResponse<OverdueContractDetailDto> getSystemOverdueContracts(Long facilityId, Integer minOverdueDays,
            Pageable pageable);

    /**
     * Xuất dữ liệu báo cáo toàn hệ thống dạng file CSV theo loại báo cáo (BM-05,
     * US-BM-05.1).
     */
    byte[] exportSystemReport(ReportExportType type, LocalDate from, LocalDate to, Long facilityId,
            UserPrincipal currentUser);
}

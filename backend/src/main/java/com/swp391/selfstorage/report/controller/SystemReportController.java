package com.swp391.selfstorage.report.controller;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.report.dto.SystemOccupancyReportResponse;
import com.swp391.selfstorage.report.dto.SystemRevenueReportResponse;
import com.swp391.selfstorage.report.service.SystemReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reports/system")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "System Reports", description = "API báo cáo doanh thu và tỷ lệ lấp đầy toàn hệ thống dành cho BOM và Admin (BM-04)")
public class SystemReportController {

    private final SystemReportService systemReportService;

    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem báo cáo doanh thu toàn hệ thống theo kỳ và phân bổ theo cơ sở (BM-04, US-BM-04.1)")
    public ResponseEntity<ApiResponse<SystemRevenueReportResponse>> getSystemRevenueReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long facilityId) {

        log.info("REST request to get system revenue report: from={}, to={}, facilityId={}", from, to, facilityId);

        SystemRevenueReportResponse response = systemReportService.getSystemRevenueReport(from, to, facilityId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy báo cáo doanh thu toàn hệ thống thành công"));
    }

    @GetMapping("/occupancy")
    @PreAuthorize("hasAnyRole('BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem báo cáo tỷ lệ lấp đầy và bóc tách trạng thái ô kho toàn hệ thống (BM-04, US-BM-04.2)")
    public ResponseEntity<ApiResponse<SystemOccupancyReportResponse>> getSystemOccupancyReport(
            @RequestParam(required = false) Long facilityId) {

        log.info("REST request to get system occupancy report: facilityId={}", facilityId);

        SystemOccupancyReportResponse response = systemReportService.getSystemOccupancyReport(facilityId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy báo cáo tỷ lệ lấp đầy toàn hệ thống thành công"));
    }
}

package com.swp391.selfstorage.report.controller;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.report.dto.OverdueContractDetailDto;
import com.swp391.selfstorage.report.dto.ReportExportType;
import com.swp391.selfstorage.report.dto.SystemOccupancyReportResponse;
import com.swp391.selfstorage.report.dto.SystemRevenueReportResponse;
import com.swp391.selfstorage.report.service.SystemReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports/system")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "System Reports", description = "API báo cáo doanh thu và tỷ lệ lấp đầy toàn hệ thống dành cho BOM và Admin (BM-04)")
public class SystemReportController {

    private final SystemReportService systemReportService;

    /**
     * Chuẩn hóa facilityId từ query: null / rỗng / "all" = toàn hệ thống (BM-04 audit #20).
     */
    static Long parseFacilityIdParam(String facilityId) {
        if (facilityId == null) {
            return null;
        }
        String trimmed = facilityId.trim();
        if (trimmed.isEmpty() || "all".equalsIgnoreCase(trimmed) || "null".equalsIgnoreCase(trimmed)) {
            return null;
        }
        try {
            return Long.valueOf(trimmed);
        } catch (NumberFormatException ex) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "facilityId không hợp lệ: " + facilityId);
        }
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem báo cáo doanh thu toàn hệ thống theo kỳ và phân bổ theo cơ sở (BM-04, US-BM-04.1)")
    public ResponseEntity<ApiResponse<SystemRevenueReportResponse>> getSystemRevenueReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String facilityId) {

        Long resolvedFacilityId = parseFacilityIdParam(facilityId);
        log.info("REST request to get system revenue report: from={}, to={}, facilityId={}", from, to, facilityId);

        SystemRevenueReportResponse response = systemReportService.getSystemRevenueReport(from, to, resolvedFacilityId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy báo cáo doanh thu toàn hệ thống thành công"));
    }

    @GetMapping("/occupancy")
    @PreAuthorize("hasAnyRole('BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem báo cáo tỷ lệ lấp đầy và bóc tách trạng thái ô kho toàn hệ thống (BM-04, US-BM-04.2)")
    public ResponseEntity<ApiResponse<SystemOccupancyReportResponse>> getSystemOccupancyReport(
            @RequestParam(required = false) String facilityId) {

        Long resolvedFacilityId = parseFacilityIdParam(facilityId);
        log.info("REST request to get system occupancy report: facilityId={}", facilityId);

        SystemOccupancyReportResponse response = systemReportService.getSystemOccupancyReport(resolvedFacilityId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy báo cáo tỷ lệ lấp đầy toàn hệ thống thành công"));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem danh sách hợp đồng nợ quá hạn toàn hệ thống hoặc theo cơ sở (BM-05)")
    public ResponseEntity<ApiResponse<PageResponse<OverdueContractDetailDto>>> getSystemOverdueContracts(
            @RequestParam(required = false) String facilityId,
            @RequestParam(required = false) Integer minOverdueDays,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Long resolvedFacilityId = parseFacilityIdParam(facilityId);
        log.info("REST request to get system overdue contracts: facilityId={}, minOverdueDays={}, page={}, size={}",
                facilityId, minOverdueDays, page, size);

        PageResponse<OverdueContractDetailDto> response = systemReportService.getSystemOverdueContracts(
                resolvedFacilityId, minOverdueDays, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách hợp đồng quá hạn thành công"));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xuất dữ liệu báo cáo hệ thống ra file CSV/Excel (BM-05, US-BM-05.1)")
    public ResponseEntity<byte[]> exportSystemReport(
            @RequestParam(required = false, defaultValue = "REVENUE") ReportExportType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String facilityId,
            @RequestParam(required = false, defaultValue = "CSV") String format,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long resolvedFacilityId = parseFacilityIdParam(facilityId);
        log.info("REST request to export system report: type={}, from={}, to={}, facilityId={}, user={}",
                type, from, to, facilityId, currentUser != null ? currentUser.getUsername() : "anonymous");

        byte[] csvData = systemReportService.exportSystemReport(type, from, to, resolvedFacilityId, currentUser);

        String filename = String.format("report_%s_%s.csv", type.name().toLowerCase(), LocalDate.now());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(csvData);
    }

}

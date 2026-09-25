package com.swp391.selfstorage.report.controller;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.contract.dto.ContractSummaryResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.report.dto.FacilityOverviewReportResponse;
import com.swp391.selfstorage.report.dto.OverdueDebtReportResponse;
import com.swp391.selfstorage.report.service.FacilityReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports/facility/{facilityId}")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Facility Reports", description = "API báo cáo thống kê, tỷ lệ lấp đầy và nợ quá hạn cấp cơ sở (FM-06)")
public class FacilityReportController {

    private final FacilityReportService facilityReportService;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem báo cáo tổng quan cơ sở (tỷ lệ lấp đầy, ô kho, doanh thu theo tháng)")
    public ResponseEntity<ApiResponse<FacilityOverviewReportResponse>> getFacilityOverview(
            @PathVariable Long facilityId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("REST request to get facility overview: facilityId={}, month={}, user={}",
                facilityId, month, currentUser != null ? currentUser.getId() : "null");

        FacilityOverviewReportResponse response = facilityReportService.getFacilityOverview(facilityId, month, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy báo cáo tổng quan cơ sở thành công"));
    }

    @GetMapping("/contracts")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem danh sách hợp đồng cơ sở phân trang theo trạng thái hoặc sắp hết hạn")
    public ResponseEntity<ApiResponse<PageResponse<ContractSummaryResponse>>> getFacilityContracts(
            @PathVariable Long facilityId,
            @RequestParam(required = false) ContractStatus status,
            @RequestParam(required = false) Integer expiringSoonDays,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("REST request to get facility contracts: facilityId={}, status={}, expiringSoonDays={}, page={}, size={}",
                facilityId, status, expiringSoonDays, page, size);

        String[] sortParts = sort.split(",");
        Sort.Direction direction = (sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1]))
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParts[0]));

        PageResponse<ContractSummaryResponse> response = facilityReportService.getFacilityContracts(
                facilityId, status, expiringSoonDays, pageable, currentUser);

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách hợp đồng cơ sở thành công"));
    }

    @GetMapping("/overdue-debt")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem báo cáo rủi ro nợ quá hạn và phân loại theo độ tuổi nợ (D+1..D+10, D+11..D+30, >D+30)")
    public ResponseEntity<ApiResponse<OverdueDebtReportResponse>> getFacilityOverdueDebt(
            @PathVariable Long facilityId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("REST request to get facility overdue debt report: facilityId={}, user={}",
                facilityId, currentUser != null ? currentUser.getId() : "null");

        OverdueDebtReportResponse response = facilityReportService.getFacilityOverdueDebt(facilityId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy báo cáo rủi ro nợ quá hạn thành công"));
    }
}

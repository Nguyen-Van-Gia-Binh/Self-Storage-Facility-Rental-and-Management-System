package com.swp391.selfstorage.facility.controller;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.swp391.selfstorage.facility.dto.CreateFacilityRequest;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import com.swp391.selfstorage.facility.dto.UpdateFacilityRequest;
import com.swp391.selfstorage.facility.dto.UpdateFacilityStatusRequest;
import com.swp391.selfstorage.facility.service.FacilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/facilities")
@Tag(name = "Facility", description = "Quản lý cơ sở kho lưu trữ (BM-01, SC-01)")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách cơ sở có phân trang và lọc (Công khai)")
    public ResponseEntity<PageResponse<FacilityResponse>> getFacilities(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(facilityService.getFacilities(keyword, isActive, pageable));
    }

    @GetMapping("/my-assigned-facilities")
    @PreAuthorize("hasAnyRole('MANAGER', 'FACILITY_MANAGER', 'STAFF', 'FACILITY_STAFF', 'ADMIN', 'SYSTEM_ADMINISTRATOR', 'BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Lấy danh sách các cơ sở được phân công cho nhân sự / quản lý hiện tại (Multi-tenancy SA-03, FM-01)")
    public ResponseEntity<ApiResponse<java.util.List<FacilityResponse>>> getMyAssignedFacilities(
            @AuthenticationPrincipal com.swp391.selfstorage.auth.service.UserPrincipal currentUser) {
        java.util.List<FacilityResponse> facilities = facilityService.getMyAssignedFacilities(currentUser);
        return ResponseEntity.ok(ApiResponse.success(facilities, "Lấy danh sách cơ sở được phân công thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết một cơ sở lưu trữ (Công khai)")
    public ResponseEntity<FacilityResponse> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Tạo mới cơ sở kho (BOM)")
    public ResponseEntity<FacilityResponse> createFacility(@Valid @RequestBody CreateFacilityRequest request) {
        FacilityResponse response = facilityService.createFacility(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Cập nhật thông tin cơ sở (BOM)")
    public ResponseEntity<FacilityResponse> updateFacility(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFacilityRequest request) {
        return ResponseEntity.ok(facilityService.updateFacility(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Kích hoạt hoặc ngừng hoạt động cơ sở (BOM)")
    public ResponseEntity<FacilityResponse> updateFacilityStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFacilityStatusRequest request) {
        return ResponseEntity.ok(facilityService.updateFacilityStatus(id, request));
    }
}

package com.swp391.selfstorage.support;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.support.dto.AssignStaffRequest;
import com.swp391.selfstorage.support.dto.RelocationRequiredRequest;
import com.swp391.selfstorage.support.dto.ResolveSupportRequest;
import com.swp391.selfstorage.support.dto.StaffWorkloadResponse;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.service.StaffSupportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Staff Support & Management", description = "Quản lý phân công và cập nhật tiến độ sự cố cho Staff và Management (FM-05, FS-05, T4.8)")
public class StaffSupportController {

    private final StaffSupportService staffSupportService;

    public StaffSupportController(StaffSupportService staffSupportService) {
        this.staffSupportService = staffSupportService;
    }

    @PatchMapping("/support-requests/{id}/assign")
    @PreAuthorize("hasRole('FACILITY_MANAGER') or hasRole('SYSTEM_ADMINISTRATOR') or hasRole('BUSINESS_OPERATIONS_MANAGER') or hasRole('ADMIN') or hasRole('BUSINESS_MANAGER')")
    @Operation(summary = "Phân công nhân viên xử lý sự cố (FM-05, US-FM-05.1, UC-F7-04)")
    public ResponseEntity<ApiResponse<SupportRequestDetailResponse>> assignStaff(
            @PathVariable Long id,
            @Valid @RequestBody AssignStaffRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SupportRequestDetailResponse response = staffSupportService.assignStaff(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Phân công nhân viên thành công"));
    }

    @PatchMapping("/support-requests/{id}/in-progress")
    @PreAuthorize("hasRole('FACILITY_STAFF') or hasRole('FACILITY_MANAGER') or hasRole('SYSTEM_ADMINISTRATOR') or hasRole('ADMIN')")
    @Operation(summary = "Tiếp nhận và bắt đầu kiểm tra hiện trường (FS-05, US-FS-05.2 AC-1)")
    public ResponseEntity<ApiResponse<SupportRequestDetailResponse>> startInProgress(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SupportRequestDetailResponse response = staffSupportService.startInProgress(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Chuyển trạng thái yêu cầu sang đang xử lý"));
    }

    @PatchMapping("/support-requests/{id}/relocation-required")
    @PreAuthorize("hasRole('FACILITY_STAFF') or hasRole('FACILITY_MANAGER') or hasRole('SYSTEM_ADMINISTRATOR') or hasRole('ADMIN')")
    @Operation(summary = "Đánh dấu phiếu hư hỏng ô kho cần di dời khi không sửa tại chỗ được (US-FS-05.2 AC-3)")
    public ResponseEntity<ApiResponse<SupportRequestDetailResponse>> markRelocationRequired(
            @PathVariable Long id,
            @Valid @RequestBody RelocationRequiredRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SupportRequestDetailResponse response = staffSupportService.markRelocationRequired(
                id, Boolean.TRUE.equals(request.getRequired()), currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã cập nhật nhu cầu di dời ô kho"));
    }

    @PatchMapping("/support-requests/{id}/resolve")
    @PreAuthorize("hasRole('FACILITY_STAFF') or hasRole('FACILITY_MANAGER') or hasRole('SYSTEM_ADMINISTRATOR') or hasRole('ADMIN')")
    @Operation(summary = "Hoàn thành xử lý sự cố kèm ảnh hiện trạng và ghi chú (FS-05, US-FS-05.2 AC-2, AC-4)")
    public ResponseEntity<ApiResponse<SupportRequestDetailResponse>> resolveSupportRequest(
            @PathVariable Long id,
            @Valid @RequestBody ResolveSupportRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SupportRequestDetailResponse response = staffSupportService.resolveSupportRequest(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật giải quyết sự cố thành công"));
    }

    @GetMapping("/support-requests/staff-workload")
    @PreAuthorize("hasRole('FACILITY_MANAGER') or hasRole('SYSTEM_ADMINISTRATOR') or hasRole('BUSINESS_OPERATIONS_MANAGER') or hasRole('ADMIN') or hasRole('BUSINESS_MANAGER')")
    @Operation(summary = "Xem khối lượng công việc nhân viên cơ sở để phân bổ nhiệm vụ (FM-05, US-FM-05.1 AC-3)")
    public ResponseEntity<ApiResponse<List<StaffWorkloadResponse>>> getStaffWorkload(
            @RequestParam Long facilityId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<StaffWorkloadResponse> response = staffSupportService.getStaffWorkload(facilityId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách tải công việc nhân viên thành công"));
    }

    @GetMapping("/management/support-requests")
    @PreAuthorize("hasRole('FACILITY_STAFF') or hasRole('FACILITY_MANAGER') or hasRole('SYSTEM_ADMINISTRATOR') or hasRole('BUSINESS_OPERATIONS_MANAGER') or hasRole('ADMIN') or hasRole('BUSINESS_MANAGER')")
    @Operation(summary = "Xem danh sách yêu cầu hỗ trợ dành cho nhân viên và quản lý cơ sở")
    public ResponseEntity<ApiResponse<PageResponse<SupportRequestSummaryResponse>>> getManagementSupportRequests(
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) SupportStatus status,
            @RequestParam(required = false) SupportCategory category,
            @RequestParam(required = false) Long assignedStaffId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        String[] sortParts = sort.split(",");
        Sort sortObj = Sort.by(
                sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1])
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC,
                sortParts[0]
        );
        Pageable pageable = PageRequest.of(page, size, sortObj);

        PageResponse<SupportRequestSummaryResponse> response = staffSupportService.getManagementSupportRequests(
                facilityId, status, category, assignedStaffId, pageable, currentUser
        );
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách yêu cầu quản lý thành công"));
    }

    @GetMapping("/management/support-requests/{id}")
    @PreAuthorize("hasRole('FACILITY_STAFF') or hasRole('FACILITY_MANAGER') or hasRole('SYSTEM_ADMINISTRATOR') or hasRole('BUSINESS_OPERATIONS_MANAGER') or hasRole('ADMIN') or hasRole('BUSINESS_MANAGER')")
    @Operation(summary = "Xem chi tiết yêu cầu hỗ trợ dành cho nhân viên và quản lý cơ sở")
    public ResponseEntity<ApiResponse<SupportRequestDetailResponse>> getManagementSupportRequestDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SupportRequestDetailResponse response = staffSupportService.getManagementSupportRequestDetail(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết yêu cầu quản lý thành công"));
    }
}

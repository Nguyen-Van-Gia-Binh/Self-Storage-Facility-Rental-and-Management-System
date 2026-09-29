package com.swp391.selfstorage.support;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.support.dto.TaskAssignmentRequest;
import com.swp391.selfstorage.support.dto.TaskAssignmentResponse;
import com.swp391.selfstorage.support.service.StaffAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/staff-assignments")
@RequiredArgsConstructor
@Tag(name = "Staff Assignment", description = "Quản lý phân công nhiệm vụ thực địa cơ sở (FM-05, US-FM-05.1)")
public class StaffAssignmentController {

    private final StaffAssignmentService staffAssignmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'FACILITY_MANAGER', 'ADMIN', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Phân công nhân sự cơ sở phụ trách nhiệm vụ thực địa (Check-in, Return, Incident)")
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> assignStaff(
            @Valid @RequestBody TaskAssignmentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("REST request to assign staff to task: taskId={}, contractId={}, staffId={}, type={}",
                request.getTaskId(), request.getContractId(), request.getResolvedStaffId(), request.getTaskType());

        TaskAssignmentResponse response = staffAssignmentService.assignStaff(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }
}

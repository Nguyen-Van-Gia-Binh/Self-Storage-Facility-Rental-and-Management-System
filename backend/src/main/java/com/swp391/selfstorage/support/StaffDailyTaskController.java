package com.swp391.selfstorage.support;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.support.dto.StaffDailyTasksResponse;
import com.swp391.selfstorage.support.service.StaffDailyTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping
@Tag(name = "Staff Daily Tasks", description = "Bảng công việc ca trực hằng ngày của nhân viên cơ sở (FS-06, US-FS-06.1, UC-F5-05, API-SPEC § 12)")
public class StaffDailyTaskController {

    private final StaffDailyTaskService staffDailyTaskService;

    public StaffDailyTaskController(StaffDailyTaskService staffDailyTaskService) {
        this.staffDailyTaskService = staffDailyTaskService;
    }

    @GetMapping("/staff/daily-tasks")
    @PreAuthorize("hasRole('FACILITY_STAFF')")
    @Operation(summary = "Xem bảng công việc ca trực hằng ngày của nhân viên đang đăng nhập (FS-06, US-FS-06.1, UC-F5-05)")
    public ResponseEntity<ApiResponse<StaffDailyTasksResponse>> getMyDailyTasks(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Boolean pendingOnly,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StaffDailyTasksResponse response = staffDailyTaskService.getDailyTasks(currentUser.getId(), date, pendingOnly, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy bảng công việc ca trực thành công"));
    }

    @GetMapping("/staff/{staffId}/daily-tasks")
    @PreAuthorize("hasRole('FACILITY_STAFF') or hasRole('FACILITY_MANAGER') or hasRole('SYSTEM_ADMINISTRATOR') or hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Xem bảng công việc ca trực của nhân viên theo ID (FM-05, FS-06)")
    public ResponseEntity<ApiResponse<StaffDailyTasksResponse>> getStaffDailyTasks(
            @PathVariable Long staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Boolean pendingOnly,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StaffDailyTasksResponse response = staffDailyTaskService.getDailyTasks(staffId, date, pendingOnly, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy bảng công việc ca trực thành công"));
    }

    @GetMapping("/reports/staff/{staffId}/daily-tasks")
    @PreAuthorize("hasRole('FACILITY_STAFF') or hasRole('FACILITY_MANAGER') or hasRole('SYSTEM_ADMINISTRATOR') or hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Báo cáo bảng công việc hằng ngày của nhân viên theo API-SPEC § 12 (FS-06)")
    public ResponseEntity<ApiResponse<StaffDailyTasksResponse>> getStaffDailyTasksReport(
            @PathVariable Long staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Boolean pendingOnly,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StaffDailyTasksResponse response = staffDailyTaskService.getDailyTasks(staffId, date, pendingOnly, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách công việc hằng ngày thành công"));
    }
}

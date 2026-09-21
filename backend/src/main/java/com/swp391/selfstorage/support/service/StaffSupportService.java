package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.support.dto.AssignStaffRequest;
import com.swp391.selfstorage.support.dto.ResolveSupportRequest;
import com.swp391.selfstorage.support.dto.StaffWorkloadResponse;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service nghiệp vụ xử lý phân công nhân viên và tiến độ sự cố cho Management & Staff (FM-05, FS-05, T4.8).
 */
public interface StaffSupportService {

    /**
     * Facility Manager phân công nhân viên xử lý sự cố (US-FM-05.1, UC-F7-04).
     */
    SupportRequestDetailResponse assignStaff(Long requestId, AssignStaffRequest request, UserPrincipal currentUser);

    /**
     * Facility Staff tiếp nhận và bắt đầu kiểm tra/xử lý tại hiện trường (US-FS-05.2 AC-1).
     */
    SupportRequestDetailResponse startInProgress(Long requestId, UserPrincipal currentUser);

    /**
     * Facility Staff cập nhật kết quả xử lý và chuyển sang RESOLVED (US-FS-05.2 AC-2, AC-4, UC-F7-08).
     */
    SupportRequestDetailResponse resolveSupportRequest(Long requestId, ResolveSupportRequest request, UserPrincipal currentUser);

    /**
     * Lấy danh sách khối lượng công việc của nhân viên theo cơ sở (US-FM-05.1 AC-3).
     */
    List<StaffWorkloadResponse> getStaffWorkload(Long facilityId, UserPrincipal currentUser);

    /**
     * Lấy danh sách yêu cầu hỗ trợ dành cho Facility Manager và Facility Staff.
     */
    PageResponse<SupportRequestSummaryResponse> getManagementSupportRequests(
            Long facilityId, SupportStatus status, SupportCategory category,
            Long assignedStaffId, Pageable pageable, UserPrincipal currentUser
    );

    /**
     * Lấy chi tiết yêu cầu hỗ trợ dành cho Management / Staff.
     */
    SupportRequestDetailResponse getManagementSupportRequestDetail(Long requestId, UserPrincipal currentUser);
}

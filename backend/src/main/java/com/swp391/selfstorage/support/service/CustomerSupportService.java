package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.support.dto.ConfirmResolutionRequest;
import com.swp391.selfstorage.support.dto.CreateSupportRequest;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;
import org.springframework.data.domain.Pageable;

public interface CustomerSupportService {

    /**
     * Tạo yêu cầu hỗ trợ mới (US-SC-06.1, UC-F7-01).
     */
    SupportRequestDetailResponse createSupportRequest(CreateSupportRequest request, UserPrincipal currentUser);

    /**
     * Lấy danh sách yêu cầu hỗ trợ của khách hàng có phân trang và lọc (US-SC-06.2, UC-F7-02).
     */
    PageResponse<SupportRequestSummaryResponse> getMySupportRequests(
            UserPrincipal currentUser, SupportStatus status, SupportCategory category, Pageable pageable
    );

    /**
     * Xem chi tiết yêu cầu hỗ trợ (US-SC-06.2).
     */
    SupportRequestDetailResponse getSupportRequestDetail(Long id, UserPrincipal currentUser);

    /**
     * Khách hàng xác nhận kết quả xử lý hoặc báo chưa giải quyết được (US-SC-06.3, UC-F7-08).
     */
    SupportRequestDetailResponse confirmResolution(Long id, ConfirmResolutionRequest request, UserPrincipal currentUser);

    /**
     * Hủy yêu cầu hỗ trợ khi chưa được tiếp nhận (ở trạng thái NEW).
     */
    void cancelSupportRequest(Long id, UserPrincipal currentUser);
}

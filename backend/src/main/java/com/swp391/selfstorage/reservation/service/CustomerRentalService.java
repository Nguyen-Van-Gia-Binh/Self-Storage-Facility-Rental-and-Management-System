package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.reservation.dto.CustomerRentalDetailResponse;
import com.swp391.selfstorage.reservation.dto.CustomerRentalSummaryResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service quản lý danh sách ô kho đang thuê của khách hàng (US-SC-05.1 & US-SC-05.2, Task T4.1)
 */
public interface CustomerRentalService {

    /**
     * Lấy danh sách ô kho đang thuê của khách hàng kèm thông tin mã Access Code, cảnh báo hết hạn và nợ quá hạn
     */
    PageResponse<CustomerRentalSummaryResponse> getMyRentals(
            UserPrincipal currentUser,
            String statusFilter,
            Pageable pageable
    );

    /**
     * Xem chi tiết một hợp đồng thuê ô kho cụ thể của khách hàng
     */
    CustomerRentalDetailResponse getMyRentalDetail(
            Long contractId,
            UserPrincipal currentUser
    );

    /**
     * Đổi mã PIN khóa điện tử cho ô kho (US-SC-05.2, BR-ACC-01)
     */
    void changeContractPin(
            Long contractId,
            com.swp391.selfstorage.reservation.dto.ChangePinRequest request,
            UserPrincipal currentUser
    );

    /**
     * Lấy danh sách lịch sử ra vào ô kho của hợp đồng (US-SC-05.2, BR-ACC-02)
     */
    java.util.List<com.swp391.selfstorage.reservation.dto.AccessLogResponse> getContractAccessLogs(
            Long contractId,
            UserPrincipal currentUser
    );
}


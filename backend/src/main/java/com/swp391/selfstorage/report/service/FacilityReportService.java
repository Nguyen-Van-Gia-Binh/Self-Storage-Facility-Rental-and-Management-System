package com.swp391.selfstorage.report.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.contract.dto.ContractSummaryResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.report.dto.FacilityOverviewReportResponse;
import com.swp391.selfstorage.report.dto.OverdueDebtReportResponse;
import org.springframework.data.domain.Pageable;

public interface FacilityReportService {

    /**
     * Lấy báo cáo tổng quan chỉ số vận hành và doanh thu cấp cơ sở (FM-06, AC-1, AC-2, AC-3, AC-5).
     */
    FacilityOverviewReportResponse getFacilityOverview(Long facilityId, String month, UserPrincipal currentUser);

    /**
     * Lấy danh sách hợp đồng phân trang của cơ sở theo trạng thái hoặc sắp hết hạn (FM-06, AC-5).
     */
    PageResponse<ContractSummaryResponse> getFacilityContracts(
            Long facilityId,
            ContractStatus status,
            Integer expiringSoonDays,
            Pageable pageable,
            UserPrincipal currentUser
    );

    /**
     * Lấy báo cáo rủi ro nợ quá hạn và phân loại theo độ tuổi nợ (FM-06, AC-4, AC-5).
     */
    OverdueDebtReportResponse getFacilityOverdueDebt(Long facilityId, UserPrincipal currentUser);
}

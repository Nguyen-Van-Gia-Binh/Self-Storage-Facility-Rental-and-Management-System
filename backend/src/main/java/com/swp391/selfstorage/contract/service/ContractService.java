package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.contract.dto.*;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ContractService {
    ContractResponse createFromReservation(Long reservationId);
    ContractResponse getContractById(Long contractId, List<Long> facilityIds);
    CheckInResponse checkIn(Long contractId, CheckInRequest request, Long staffId, List<Long> facilityIds);
    HandoverRejectionResponse rejectHandover(Long contractId, HandoverRejectionRequest request,
                                              Long staffId, List<Long> facilityIds);

    // T4.2: Facility Manager Tracking
    PageResponse<ContractSummaryResponse> getContractsPage(ContractFilterRequest filter, Pageable pageable, List<Long> facilityIds);
    ContractFinancialSummaryResponse getContractFinancialSummary(Long contractId, List<Long> facilityIds);
    ContractSummaryResponse reassignUnit(Long contractId, ReassignUnitRequest request, Long managerId, List<Long> facilityIds);

    // T4.3: Return & Settlement Workflow
    ReturnNoticeResponse submitReturnNotice(Long contractId, ReturnNoticeRequest request, List<Long> facilityIds);
    ReturnNoticeResponse cancelReturnNotice(Long contractId, UserPrincipal currentUser);
    ReturnInspectionResponse submitReturnInspection(Long contractId, ReturnInspectionRequest request, Long staffId, List<Long> facilityIds);
    SettlementPreviewResponse getSettlementPreview(Long contractId, List<Long> facilityIds);
    SettlementApprovalResponse approveSettlement(Long contractId, SettlementApprovalRequest request, Long managerId, List<Long> facilityIds);

    /** Đóng hợp đồng sau khi khách nộp đủ phần thiếu (BR-RET-04). */
    void closeContractAfterSettlementPayment(Long contractId);

    /** CLEANING → RESERVED nếu còn Reservation CONFIRMED chưa check-in, không thì AVAILABLE (BR-RET-09). */
    ContractResponse completeCleaning(Long contractId, List<Long> facilityIds);
    ContractResponse assignReturnStaff(Long contractId, AssignReturnStaffRequest request, Long managerId, List<Long> facilityIds);
    ContractResponse assignCheckInStaff(Long contractId, AssignReturnStaffRequest request, Long managerId, List<Long> facilityIds);
}
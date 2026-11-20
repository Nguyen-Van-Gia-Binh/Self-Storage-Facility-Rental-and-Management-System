package com.swp391.selfstorage.contract.controller;

import com.swp391.selfstorage.auth.service.FacilitySecurityService;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.service.ContractService;
import com.swp391.selfstorage.support.entity.AssignmentTaskType;
import com.swp391.selfstorage.support.entity.StaffDailyAssignment;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.user.entity.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
@Tag(name = "Contract", description = "Hợp đồng thuê kho (T3.4–T3.7, T4.2, T4.3)")
public class ContractController {

    private final ContractService contractService;
    private final FacilitySecurityService facilitySecurityService;
    private final StaffDailyAssignmentRepository staffDailyAssignmentRepository;

    private Long requireUserId(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        return currentUser.getId();
    }

    private List<Long> resolveFacilityScope(UserPrincipal currentUser, Long requestedFacilityId) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        UserRole role = currentUser.getRole();
        // 1. Admin & BOM có quyền xem toàn bộ cơ sở
        if (role == UserRole.SYSTEM_ADMINISTRATOR || role == UserRole.BUSINESS_OPERATIONS_MANAGER) {
            return (requestedFacilityId != null) ? List.of(requestedFacilityId) : List.of();
        }
        // 2. Staff & Manager bị giới hạn bởi danh sách cơ sở được phân công
        if (role == UserRole.FACILITY_STAFF || role == UserRole.FACILITY_MANAGER) {
            if (requestedFacilityId != null) {
                facilitySecurityService.validateFacilityAccess(requestedFacilityId);
                return List.of(requestedFacilityId);
            }
            List<Long> assigned = currentUser.getFacilityIds();
            return (assigned != null && !assigned.isEmpty()) ? assigned : List.of(-1L);
        }
        // 3. Customer: không lọc theo facilityId mà kiểm soát theo quyền sở hữu hợp đồng
        return (requestedFacilityId != null) ? List.of(requestedFacilityId) : List.of();
    }

    /**
     * Nhân viên được phân công đúng hợp đồng này vẫn đọc được hợp đồng
     * khi cơ sở mới chưa nằm trong user_facility_assignment.
     */
    private List<Long> scopeForContract(UserPrincipal currentUser, Long contractId) {
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        boolean staffHasTask = currentUser.getRole() == UserRole.FACILITY_STAFF
                && isStaffAssignedToContract(currentUser.getId(), contractId);
        return scopeWhenStaffHasTask(currentUser.getRole(), facilities, staffHasTask);
    }

    static List<Long> scopeWhenStaffHasTask(UserRole role, List<Long> facilityScope, boolean staffHasTask) {
        if (role == UserRole.FACILITY_STAFF && staffHasTask) {
            return List.of();
        }
        return facilityScope;
    }

    private boolean isStaffAssignedToContract(Long staffId, Long contractId) {
        if (staffId == null || contractId == null) {
            return false;
        }
        for (AssignmentTaskType type : List.of(AssignmentTaskType.HANDOVER, AssignmentTaskType.RETURN)) {
            StaffDailyAssignment row = staffDailyAssignmentRepository
                    .findByReferenceTypeAndReferenceIdAndTaskType("CONTRACT", contractId, type)
                    .orElse(null);
            if (row != null && staffId.equals(row.getStaffId())) {
                return true;
            }
        }
        return false;
    }

    /** Tạo hợp đồng trực tiếp tại quầy / chốt khách đặt trước dài hạn (> 30 ngày) / chốt Waitlist */
    @PostMapping("/direct")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR', 'FACILITY_STAFF')")
    @Operation(summary = "Tạo hợp đồng trực tiếp tại quầy / chốt khách đặt trước dài hạn")
    public ResponseEntity<ApiResponse<ContractResponse>> createDirectContract(
            @Valid @RequestBody CreateDirectContractRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ContractResponse response = contractService.createDirectContract(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Tạo hợp đồng trực tiếp thành công"));
    }

    /** T3.5: Chi tiết contract — Staff xác minh khi khách check-in hoặc Customer xem hợp đồng */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Chi tiết hợp đồng")
    public ResponseEntity<ApiResponse<ContractResponse>> getContract(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        List<Long> facilities = scopeForContract(currentUser, id);
        ContractResponse response = contractService.getContractById(id, facilities);
        if (currentUser.getRole() == UserRole.STORAGE_CUSTOMER && !java.util.Objects.equals(response.getCustomerId(), currentUser.getId())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền xem hợp đồng này");
        }
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin hợp đồng thành công"));
    }

    /** T3.6 + T3.7: Xác nhận bàn giao -> Contract ACTIVE, Unit OCCUPIED */
    @PostMapping("/{id}/check-in")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xác nhận bàn giao kho")
    public ResponseEntity<ApiResponse<CheckInResponse>> checkIn(
            @PathVariable Long id,
            @Valid @RequestBody CheckInRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        Long operatorId = requireUserId(currentUser);
        List<Long> facilities = scopeForContract(currentUser, id);

        if (currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
            ContractResponse contract = contractService.getContractById(id, List.of());
            if (!java.util.Objects.equals(contract.getCustomerId(), currentUser.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền check-in hợp đồng này");
            }
            facilities = List.of();
        }

        CheckInResponse response = contractService.checkIn(id, request, operatorId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Bàn giao kho thành công"));
    }

    /** T3.6 từ chối: Unit MAINTENANCE, Contract TERMINATED hoặc PENDING_CHECK_IN (RELOCATE) */
    @PostMapping("/{id}/handover-rejection")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Ghi nhận khách từ chối nhận kho")
    public ResponseEntity<ApiResponse<HandoverRejectionResponse>> rejectHandover(
            @PathVariable Long id,
            @Valid @RequestBody HandoverRejectionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        Long operatorId = requireUserId(currentUser);
        List<Long> facilities = scopeForContract(currentUser, id);

        if (currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
            ContractResponse contract = contractService.getContractById(id, List.of());
            if (!java.util.Objects.equals(contract.getCustomerId(), currentUser.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền thao tác trên hợp đồng này");
            }
            facilities = List.of();
        }

        HandoverRejectionResponse response = contractService.rejectHandover(id, request, operatorId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã ghi nhận từ chối nhận kho"));
    }

    /** T4.2: Danh sách hợp đồng phân trang có lọc đa cơ sở (FM-03) */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'BOM', 'ADMIN')")
    @Operation(summary = "Danh sách hợp đồng phân trang")
    public ResponseEntity<ApiResponse<PageResponse<ContractSummaryResponse>>> getContracts(
            @ModelAttribute ContractFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long requestedFacilityId = filter != null ? filter.getFacilityId() : null;
        List<Long> facilities = resolveFacilityScope(currentUser, requestedFacilityId);

        String[] sortParts = sort.split(",");
        Sort sortObj = Sort.by(
                sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1])
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC,
                sortParts[0]);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        PageResponse<ContractSummaryResponse> response = contractService.getContractsPage(filter, pageable, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách hợp đồng thành công"));
    }

    /** T4.2: Chi tiết tài chính và công nợ hợp đồng */
    @GetMapping("/{id}/financial-summary")
    @PreAuthorize("hasAnyRole('MANAGER', 'BOM', 'ADMIN')")
    @Operation(summary = "Chi tiết công nợ và tài chính hợp đồng")
    public ResponseEntity<ApiResponse<ContractFinancialSummaryResponse>> getFinancialSummary(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        ContractFinancialSummaryResponse response = contractService.getContractFinancialSummary(id, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết tài chính thành công"));
    }

    /** T4.2 / SCR-FM-02.2: Đổi ô kho ngoại lệ cho hợp đồng */
    @PostMapping("/{id}/reassign-unit")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Đổi ô kho ngoại lệ cho hợp đồng")
    public ResponseEntity<ApiResponse<ContractSummaryResponse>> reassignUnit(
            @PathVariable Long id,
            @Valid @RequestBody ReassignUnitRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long managerId = requireUserId(currentUser);
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        ContractSummaryResponse response = contractService.reassignUnit(id, request, managerId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Đổi ô kho thành công"));
    }

    /** BR-BMP-02: Kích hoạt bồi thường phạt cọc gấp đôi khi cơ sở cháy kho 100% (Điều 328 BLDS) */
    @PostMapping("/{id}/emergency-compensation")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Kích hoạt bồi thường phạt cọc gấp đôi khi cơ sở cháy kho 100% (BR-BMP-02 / Điều 328 BLDS)")
    public ResponseEntity<ApiResponse<EmergencyCompensationResponse>> executeDoubleDepositCompensation(
            @PathVariable Long id,
            @Valid @RequestBody EmergencyCompensationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long managerId = requireUserId(currentUser);
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        EmergencyCompensationResponse response = contractService.executeDoubleDepositCompensation(id, request, managerId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    /** T4.3: Khách hoặc Staff đăng ký thông báo trả kho (FS-04) */
    @PostMapping("/{id}/return-notices")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đăng ký thông báo trả kho")
    public ResponseEntity<ApiResponse<ReturnNoticeResponse>> submitReturnNotice(
            @PathVariable Long id,
            @Valid @RequestBody ReturnNoticeRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        if (currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
            ContractResponse contract = contractService.getContractById(id, facilities);
            if (!java.util.Objects.equals(contract.getCustomerId(), currentUser.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền báo trả kho cho hợp đồng này");
            }
        }
        ReturnNoticeResponse response = contractService.submitReturnNotice(id, request, facilities);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Gửi thông báo trả kho thành công"));
    }

    /** BR-RET-12: Hủy yêu cầu trả kho khi nhân viên chưa nghiệm thu */
    @PostMapping("/{id}/cancel-return")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Hủy yêu cầu trả kho khi chưa nghiệm thu (BR-RET-12)")
    public ResponseEntity<ApiResponse<ReturnNoticeResponse>> cancelReturnNotice(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        ReturnNoticeResponse response = contractService.cancelReturnNotice(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Hủy yêu cầu trả kho thành công"));
    }

    /** T4.15 / FS-04: Phân công hoặc tự nhận việc nghiệm thu trả kho */
    @PatchMapping("/{id}/assign-return")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Phân công hoặc tự nhận nhân viên nghiệm thu trả kho")
    public ResponseEntity<ApiResponse<ContractResponse>> assignReturnStaff(
            @PathVariable Long id,
            @Valid @RequestBody AssignReturnStaffRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long operatorId = requireUserId(currentUser);
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        if (currentUser.getRole() == UserRole.FACILITY_STAFF && request.getStaffId() == null) {
            request.setStaffId(operatorId);
        }
        ContractResponse response = contractService.assignReturnStaff(id, request, operatorId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Phân công / Tiếp nhận nhiệm vụ nghiệm thu thành công"));
    }

    /** Manager phân công Staff tiếp đón bàn giao Check-in (FM-05, FS-01) */
    @PatchMapping("/{id}/assign-checkin")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Manager phân công nhân viên tiếp đón bàn giao nhận kho")
    public ResponseEntity<ApiResponse<ContractResponse>> assignCheckInStaff(
            @PathVariable Long id,
            @Valid @RequestBody AssignReturnStaffRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long managerId = requireUserId(currentUser);
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        ContractResponse response = contractService.assignCheckInStaff(id, request, managerId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Phân công nhân viên tiếp đón nhận kho thành công"));
    }

    /** T4.3: Staff xác nhận nghiệm thu hiện trạng khi trả kho (FS-04) */
    @PostMapping("/{id}/return-inspections")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Xác nhận kiểm tra hiện trạng trả kho (Inspection)")
    public ResponseEntity<ApiResponse<ReturnInspectionResponse>> submitReturnInspection(
            @PathVariable Long id,
            @Valid @RequestBody ReturnInspectionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long staffId = requireUserId(currentUser);
        List<Long> facilities = scopeForContract(currentUser, id);
        ReturnInspectionResponse response = contractService.submitReturnInspection(id, request, staffId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Nghiệm thu trả kho thành công"));
    }

    /** Ghi khoản ACCESS_KEY hoặc VALUE_ADDED đang hiệu lực vào hợp đồng đang thuê (BR-PRI-04). */
    @PostMapping("/{id}/catalog-fees")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Ghi phụ phí danh mục vào hợp đồng đang thuê")
    public ResponseEntity<ApiResponse<CatalogFeeChargeResponse>> applyCatalogFee(
            @PathVariable Long id,
            @Valid @RequestBody ApplyCatalogFeeRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long actorId = requireUserId(currentUser);
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        CatalogFeeChargeResponse response = contractService.applyCatalogFee(id, request, actorId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã ghi phụ phí vào hợp đồng"));
    }

    /** FM thu tiền mặt một khoản phụ phí chưa thu. Tạo EXTRA_FEE_PAYMENT SUCCESS để BOM thấy doanh thu. */
    @PostMapping("/{id}/catalog-fees/{chargeId}/collect")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN', 'BUSINESS_OPERATIONS_MANAGER', 'BOM')")
    @Operation(summary = "Thu tiền mặt phụ phí tại quầy")
    public ResponseEntity<ApiResponse<CatalogFeeChargeResponse>> collectCatalogFee(
            @PathVariable Long id,
            @PathVariable Long chargeId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        CatalogFeeChargeResponse response = contractService.collectCatalogFee(id, chargeId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã ghi nhận tiền mặt phụ phí"));
    }

    /** T4.3: Xem trước bảng quyết toán thanh lý và hoàn cọc (FM-04) */
    @GetMapping("/{id}/settlement-preview")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN', 'BUSINESS_OPERATIONS_MANAGER', 'BOM')")
    @Operation(summary = "Xem trước quyết toán thanh lý hợp đồng")
    public ResponseEntity<ApiResponse<SettlementPreviewResponse>> getSettlementPreview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        SettlementPreviewResponse response = contractService.getSettlementPreview(id, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy bảng tính quyết toán thành công"));
    }

    /**
     * T4.3: FM phê duyệt quyết toán, đóng hợp đồng và kích hoạt hoàn cọc (FM-04)
     */
    @PostMapping("/{id}/settlement-approval")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN', 'BUSINESS_OPERATIONS_MANAGER', 'BOM')")
    @Operation(summary = "Phê duyệt quyết toán hợp đồng và hoàn cọc")
    public ResponseEntity<ApiResponse<SettlementApprovalResponse>> approveSettlement(
            @PathVariable Long id,
            @RequestBody(required = false) SettlementApprovalRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long managerId = requireUserId(currentUser);
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        SettlementApprovalResponse response = contractService.approveSettlement(id, request, managerId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    /** BR-RET-09: sau khi dọn xong, ô CLEANING về RESERVED hoặc AVAILABLE. */
    @PostMapping("/{id}/cleaning-complete")
    @PreAuthorize("hasAnyRole('FACILITY_STAFF', 'STAFF', 'FACILITY_MANAGER', 'MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN')")
    @Operation(summary = "Hoàn tất dọn ô kho sau nghiệm thu trả kho")
    public ResponseEntity<ApiResponse<ContractResponse>> completeCleaning(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        ContractResponse response = contractService.completeCleaning(id, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã hoàn tất dọn ô kho"));
    }

    /**
     * BR-RES-06: Dời thời gian thuê trước khi nhận kho khi ở trạng thái PENDING_CHECK_IN.
     */
    @PostMapping("/{id}/reschedule-period")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Dời ngày bắt đầu nhận kho (giữ nguyên thời lượng thuê)")
    public ResponseEntity<ApiResponse<ContractResponse>> rescheduleRentalPeriod(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleRentalPeriodRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long currentUserId = requireUserId(currentUser);
        ContractResponse response = contractService.rescheduleRentalPeriod(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response, "Dời thời gian thuê thành công"));
    }

    /**
     * Hủy nhận kho cho hợp đồng đang ở trạng thái PENDING_CHECK_IN (BR-CAN-01)
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Hủy nhận kho cho hợp đồng đang ở trạng thái PENDING_CHECK_IN (BR-CAN-01)")
    public ResponseEntity<ApiResponse<ContractResponse>> cancelPendingContract(
            @PathVariable Long id,
            @RequestBody(required = false) com.swp391.selfstorage.reservation.dto.CancelReservationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ContractResponse response = contractService.cancelPendingContract(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Hủy nhận kho thành công"));
    }
}
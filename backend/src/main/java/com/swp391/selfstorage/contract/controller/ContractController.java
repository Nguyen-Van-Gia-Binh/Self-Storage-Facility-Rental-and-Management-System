package com.swp391.selfstorage.contract.controller;

import com.swp391.selfstorage.auth.service.FacilitySecurityService;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.service.ContractService;
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
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        ContractResponse response = contractService.getContractById(id, facilities);
        if (currentUser.getRole() == UserRole.STORAGE_CUSTOMER && !response.getCustomerId().equals(currentUser.getId())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền xem hợp đồng này");
        }
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin hợp đồng thành công"));
    }

    /** T3.6 + T3.7: Xác nhận bàn giao -> Contract ACTIVE, Unit OCCUPIED */
    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Xác nhận bàn giao kho")
    public ResponseEntity<ApiResponse<CheckInResponse>> checkIn(
            @PathVariable Long id,
            @Valid @RequestBody CheckInRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long staffId = requireUserId(currentUser);
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        CheckInResponse response = contractService.checkIn(id, request, staffId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Bàn giao kho thành công"));
    }

    /** T3.6 từ chối: Unit MAINTENANCE, Contract TERMINATED */
    @PostMapping("/{id}/handover-rejection")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Ghi nhận khách từ chối nhận kho")
    public ResponseEntity<ApiResponse<HandoverRejectionResponse>> rejectHandover(
            @PathVariable Long id,
            @Valid @RequestBody HandoverRejectionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long staffId = requireUserId(currentUser);
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        HandoverRejectionResponse response = contractService.rejectHandover(id, request, staffId, facilities);
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
            if (!contract.getCustomerId().equals(currentUser.getId())) {
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
        List<Long> facilities = resolveFacilityScope(currentUser, null);
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

    /** T4.3: Xem trước bảng quyết toán thanh lý và hoàn cọc (FM-04) */
    @GetMapping("/{id}/settlement-preview")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
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
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
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
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Hoàn tất dọn ô kho sau nghiệm thu trả kho")
    public ResponseEntity<ApiResponse<ContractResponse>> completeCleaning(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Long> facilities = resolveFacilityScope(currentUser, null);
        ContractResponse response = contractService.completeCleaning(id, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã hoàn tất dọn ô kho"));
    }
}
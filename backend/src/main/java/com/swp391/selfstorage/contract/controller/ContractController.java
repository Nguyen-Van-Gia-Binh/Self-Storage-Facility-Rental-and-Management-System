package com.swp391.selfstorage.contract.controller;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.service.ContractService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
@Tag(name = "Contract", description = "Hop dong thue kho (T3.4–T3.7)")
public class ContractController {

    private final ContractService contractService;

    /** T3.5: Chi tiet contract — Staff xac minh khi khach check-in */
    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết hợp đồng")
    public ResponseEntity<ApiResponse<ContractResponse>> getContract(
            @PathVariable Long id,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        ContractResponse response = contractService.getContractById(id, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Lay thong tin hop dong thanh cong"));
    }

    /** T3.6 + T3.7: Xac nhan ban giao -> Contract ACTIVE, Unit OCCUPIED */
    @PostMapping("/{id}/check-in")
    @Operation(summary = "Xác nhận bàn giao kho")
    public ResponseEntity<ApiResponse<CheckInResponse>> checkIn(
            @PathVariable Long id,
            @Valid @RequestBody CheckInRequest request,
            @RequestHeader(value = "X-Staff-Id", required = false, defaultValue = "1") Long staffId,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        CheckInResponse response = contractService.checkIn(id, request, staffId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Ban giao kho thanh cong"));
    }

    /** T3.6 tu choi: Unit MAINTENANCE, Contract TERMINATED */
    @PostMapping("/{id}/handover-rejection")
    @Operation(summary = "Ghi nhận khách từ chối nhận kho")
    public ResponseEntity<ApiResponse<HandoverRejectionResponse>> rejectHandover(
            @PathVariable Long id,
            @Valid @RequestBody HandoverRejectionRequest request,
            @RequestHeader(value = "X-Staff-Id", required = false, defaultValue = "1") Long staffId,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        HandoverRejectionResponse response = contractService.rejectHandover(id, request, staffId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Da ghi nhan tu choi nhan kho"));
    }

    /** T4.2: Danh sach hop dong phan trang, tim kiem va loc sap het han (FM-03) */
    @GetMapping
    @Operation(summary = "Danh sách hợp đồng phân trang")
    public ResponseEntity<ApiResponse<com.swp391.selfstorage.common.dto.PageResponse<ContractSummaryResponse>>> getContracts(
            @ModelAttribute ContractFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        String[] sortParts = sort.split(",");
        org.springframework.data.domain.Sort sortObj = org.springframework.data.domain.Sort.by(
                sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1])
                        ? org.springframework.data.domain.Sort.Direction.ASC
                        : org.springframework.data.domain.Sort.Direction.DESC,
                sortParts[0]);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
                sortObj);

        com.swp391.selfstorage.common.dto.PageResponse<ContractSummaryResponse> response = contractService
                .getContractsPage(filter, pageable, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Lay danh sach hop dong thanh cong"));
    }

    /** T4.2: Chi tiet tai chinh va cong no hop dong */
    @GetMapping("/{id}/financial-summary")
    @Operation(summary = "Chi tiết công nợ và tài chính hợp đồng")
    public ResponseEntity<ApiResponse<ContractFinancialSummaryResponse>> getFinancialSummary(
            @PathVariable Long id,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        ContractFinancialSummaryResponse response = contractService.getContractFinancialSummary(id, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Lay chi tiet tai chinh thanh cong"));
    }

    /** T4.2 / SCR-FM-02.2: Doi o kho ngoai le cho hop dong */
    @PostMapping("/{id}/reassign-unit")
    @Operation(summary = "Đổi ô kho ngoại lệ cho hợp đồng")
    public ResponseEntity<ApiResponse<ContractSummaryResponse>> reassignUnit(
            @PathVariable Long id,
            @Valid @RequestBody ReassignUnitRequest request,
            @RequestHeader(value = "X-Manager-Id", required = false, defaultValue = "1") Long managerId,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        ContractSummaryResponse response = contractService.reassignUnit(id, request, managerId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Doi o kho thanh cong"));
    }

    /** T4.3: Khach hoac Staff dang ky thong bao tra kho (FS-04) */
    @PostMapping("/{id}/return-notices")
    @Operation(summary = "Đăng ký thông báo trả kho")
    public ResponseEntity<ApiResponse<ReturnNoticeResponse>> submitReturnNotice(
            @PathVariable Long id,
            @Valid @RequestBody ReturnNoticeRequest request,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        ReturnNoticeResponse response = contractService.submitReturnNotice(id, request, facilities);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Gui thong bao tra kho thanh cong"));
    }

    /** T4.15: Manager phan cong Staff nghiem thu tra kho (FM-05, FS-04) */
    @PatchMapping("/{id}/assign-return")
    @Operation(summary = "Manager phân công nhân viên nghiệm thu trả kho")
    public ResponseEntity<ApiResponse<ContractResponse>> assignReturnStaff(
            @PathVariable Long id,
            @Valid @RequestBody AssignReturnStaffRequest request,
            @RequestHeader(value = "X-Manager-Id", required = false, defaultValue = "1") Long managerId,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        ContractResponse response = contractService.assignReturnStaff(id, request, managerId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Phân công nhân viên nghiệm thu thành công"));
    }

    /** T4.3: Staff xac nhan nghiem thu hien trang khi tra kho (FS-04) */
    @PostMapping("/{id}/return-inspections")
    @Operation(summary = "Xác nhận kiểm tra hiện trạng trả kho (Inspection)")
    public ResponseEntity<ApiResponse<ReturnInspectionResponse>> submitReturnInspection(
            @PathVariable Long id,
            @Valid @RequestBody ReturnInspectionRequest request,
            @RequestHeader(value = "X-Staff-Id", required = false, defaultValue = "1") Long staffId,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        ReturnInspectionResponse response = contractService.submitReturnInspection(id, request, staffId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Nghiem thu tra kho thanh cong"));
    }

    /** T4.3: Xem truoc bang quyet toan thanh ly va hoan coc (FM-04) */
    @GetMapping("/{id}/settlement-preview")
    @Operation(summary = "Xem trước quyết toán thanh lý hợp đồng")
    public ResponseEntity<ApiResponse<SettlementPreviewResponse>> getSettlementPreview(
            @PathVariable Long id,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        SettlementPreviewResponse response = contractService.getSettlementPreview(id, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Lay bang tinh quyet toan thanh cong"));
    }

    /**
     * T4.3: FM phe duyet quyet toan, dong hop dong va kich hoat hoan coc (FM-04)
     */
    @PostMapping("/{id}/settlement-approval")
    @Operation(summary = "Phê duyệt quyết toán hợp đồng và hoàn cọc")
    public ResponseEntity<ApiResponse<SettlementApprovalResponse>> approveSettlement(
            @PathVariable Long id,
            @RequestBody(required = false) SettlementApprovalRequest request,
            @RequestHeader(value = "X-Manager-Id", required = false, defaultValue = "1") Long managerId,
            @RequestParam(required = false) List<Long> facilityIds) {
        List<Long> facilities = (facilityIds != null) ? facilityIds : List.of();
        SettlementApprovalResponse response = contractService.approveSettlement(id, request, managerId, facilities);
        return ResponseEntity.ok(ApiResponse.success(response, "Phe duyet quyet toan thanh cong"));
    }
}
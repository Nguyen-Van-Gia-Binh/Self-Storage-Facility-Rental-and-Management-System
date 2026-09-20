package com.swp391.selfstorage.contract;

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
}
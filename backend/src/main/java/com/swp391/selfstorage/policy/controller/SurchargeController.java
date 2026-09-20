package com.swp391.selfstorage.policy.controller;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.policy.dto.CreateSurchargeRequest;
import com.swp391.selfstorage.policy.dto.SurchargeResponse;
import com.swp391.selfstorage.policy.dto.UpdateSurchargeRequest;
import com.swp391.selfstorage.policy.service.SurchargeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/surcharges")
@Tag(name = "Policy & Surcharges", description = "Quản lý chính sách và phụ phí (BM-02, BM-03)")
public class SurchargeController {

    private final SurchargeService surchargeService;

    public SurchargeController(SurchargeService surchargeService) {
        this.surchargeService = surchargeService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách phụ phí có phân trang và lọc theo trạng thái")
    public ResponseEntity<PageResponse<SurchargeResponse>> getSurcharges(
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(surchargeService.getSurcharges(isActive, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết phụ phí theo ID")
    public ResponseEntity<SurchargeResponse> getSurchargeById(@PathVariable Long id) {
        return ResponseEntity.ok(surchargeService.getSurchargeById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Tạo mới khoản phụ phí (BOM)")
    public ResponseEntity<SurchargeResponse> createSurcharge(@Valid @RequestBody CreateSurchargeRequest request) {
        SurchargeResponse response = surchargeService.createSurcharge(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Cập nhật khoản phụ phí (BOM)")
    public ResponseEntity<SurchargeResponse> updateSurcharge(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSurchargeRequest request) {
        return ResponseEntity.ok(surchargeService.updateSurcharge(id, request));
    }
}

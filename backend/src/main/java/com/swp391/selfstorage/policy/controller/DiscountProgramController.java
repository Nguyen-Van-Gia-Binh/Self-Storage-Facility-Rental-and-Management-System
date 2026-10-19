package com.swp391.selfstorage.policy.controller;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.policy.dto.CreateDiscountProgramRequest;
import com.swp391.selfstorage.policy.dto.DiscountProgramResponse;
import com.swp391.selfstorage.policy.dto.UpdateDiscountProgramRequest;
import com.swp391.selfstorage.policy.service.DiscountProgramService;
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
@RequestMapping("/discount-programs")
@Tag(name = "Policy & Discounts", description = "Quản lý chương trình khuyến mãi và ưu đãi giảm giá (BM-03, US-BM-03.3)")
public class DiscountProgramController {

    private final DiscountProgramService discountProgramService;

    public DiscountProgramController(DiscountProgramService discountProgramService) {
        this.discountProgramService = discountProgramService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách chương trình khuyến mãi")
    public ResponseEntity<PageResponse<DiscountProgramResponse>> getDiscountPrograms(
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(discountProgramService.getDiscountPrograms(isActive, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết chương trình khuyến mãi")
    public ResponseEntity<DiscountProgramResponse> getDiscountProgramById(@PathVariable Long id) {
        return ResponseEntity.ok(discountProgramService.getDiscountProgramById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Tạo mới chương trình khuyến mãi (BOM)")
    public ResponseEntity<DiscountProgramResponse> createDiscountProgram(
            @Valid @RequestBody CreateDiscountProgramRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(discountProgramService.createDiscountProgram(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Cập nhật chương trình khuyến mãi (BOM)")
    public ResponseEntity<DiscountProgramResponse> updateDiscountProgram(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDiscountProgramRequest request) {
        return ResponseEntity.ok(discountProgramService.updateDiscountProgram(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Hủy kích hoạt chương trình khuyến mãi (BOM)")
    public ResponseEntity<Void> deleteDiscountProgram(@PathVariable Long id) {
        discountProgramService.deleteDiscountProgram(id);
        return ResponseEntity.noContent().build();
    }
}

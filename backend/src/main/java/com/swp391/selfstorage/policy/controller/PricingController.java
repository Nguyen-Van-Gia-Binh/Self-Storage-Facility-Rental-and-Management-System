package com.swp391.selfstorage.policy.controller;

import com.swp391.selfstorage.policy.dto.FacilityPriceResponse;
import com.swp391.selfstorage.policy.dto.UpdatePriceRequest;
import com.swp391.selfstorage.policy.service.PricingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/facilities/{facilityId}/prices")
@Tag(name = "Policy & Pricing", description = "Quản lý bảng giá thuê cơ sở (BM-03)")
public class PricingController {

    private final PricingService pricingService;

    public PricingController(PricingService pricingService) {
        this.pricingService = pricingService;
    }

    @GetMapping
    @Operation(summary = "Lấy bảng giá của tất cả loại ô kho tại một cơ sở (Công khai/BOM)")
    public ResponseEntity<List<FacilityPriceResponse>> getPricesByFacility(@PathVariable Long facilityId) {
        return ResponseEntity.ok(pricingService.getPricesByFacility(facilityId));
    }

    @PutMapping("/{unitTypeId}")
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Cập nhật đơn giá tháng cho loại ô kho tại cơ sở (BOM)")
    public ResponseEntity<FacilityPriceResponse> updatePrice(
            @PathVariable Long facilityId,
            @PathVariable Long unitTypeId,
            @Valid @RequestBody UpdatePriceRequest request) {
        return ResponseEntity.ok(pricingService.updatePrice(facilityId, unitTypeId, request));
    }
}

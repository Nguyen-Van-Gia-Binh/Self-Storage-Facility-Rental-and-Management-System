package com.swp391.selfstorage.policy.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.swp391.selfstorage.policy.dto.PriceAuditPageResponse;
import com.swp391.selfstorage.policy.service.PriceAuditService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/pricing/audit")
@Tag(name = "Policy & Pricing", description = "Nhật ký mọi phiên bản giá, phụ phí và chính sách (BM-02, BM-03)")
public class PriceAuditController {

    private final PriceAuditService priceAuditService;

    public PriceAuditController(PriceAuditService priceAuditService) {
        this.priceAuditService = priceAuditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Nhật ký mọi phiên bản giá thuê, phụ phí và tham số chính sách")
    public ResponseEntity<PriceAuditPageResponse> search(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long actorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(priceAuditService.search(category, facilityId, from, to, actorId, page, size));
    }
}

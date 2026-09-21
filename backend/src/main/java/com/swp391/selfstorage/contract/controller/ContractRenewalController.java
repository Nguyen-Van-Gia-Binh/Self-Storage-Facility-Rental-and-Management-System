package com.swp391.selfstorage.contract.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.contract.dto.RenewalQuoteResponse;
import com.swp391.selfstorage.contract.dto.RenewalRequest;
import com.swp391.selfstorage.contract.dto.RenewalResponse;
import com.swp391.selfstorage.contract.service.RenewalService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
@Tag(name = "Contract Renewal", description = "Quản lý và xử lý gia hạn hợp đồng thuê (T4.5 - SC-05, BR-REN-*)")
public class ContractRenewalController {

    private final RenewalService renewalService;

    /**
     * 1. Tính toán báo giá xem trước cho khách hàng trước khi thanh toán (Quote
     * Preview).
     */
    @PostMapping("/{id}/renewals/quote")
    @Operation(summary = "Xem trước bảng tính toán chi phí gia hạn hợp đồng")
    public ResponseEntity<ApiResponse<RenewalQuoteResponse>> getRenewalQuote(
            @PathVariable Long id,
            @Valid @RequestBody RenewalRequest request) {
        RenewalQuoteResponse quote = renewalService.getRenewalQuote(id, request);
        return ResponseEntity.ok(ApiResponse.success(quote, "Tính toán phí gia hạn thành công"));
    }

    /**
     * 2. Xử lý gia hạn hợp đồng sau khi thanh toán thành công (SC-05, BR-REN-*).
     */
    @PostMapping("/{id}/renewals")
    @Operation(summary = "Kích hoạt gia hạn hợp đồng thuê sau khi thanh toán")
    public ResponseEntity<ApiResponse<RenewalResponse>> processRenewal(
            @PathVariable Long id,
            @Valid @RequestBody RenewalRequest request,
            @RequestParam(required = false) Long paymentId) {
        RenewalResponse response = renewalService.processRenewal(id, request, paymentId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Gia hạn hợp đồng thành công"));
    }

    /**
     * 3. Lấy lịch sử tất cả các lần gia hạn của hợp đồng.
     */
    @GetMapping("/{id}/renewals")
    @Operation(summary = "Lấy lịch sử các lần gia hạn của hợp đồng")
    public ResponseEntity<ApiResponse<List<RenewalResponse>>> getRenewalHistory(@PathVariable Long id) {
        List<RenewalResponse> history = renewalService.getRenewalHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history, "Lấy lịch sử gia hạn thành công"));
    }
}

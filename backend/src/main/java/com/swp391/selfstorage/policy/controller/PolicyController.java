package com.swp391.selfstorage.policy.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.policy.dto.CreatePolicyRequest;
import com.swp391.selfstorage.policy.dto.OverdueProcessingResult;
import com.swp391.selfstorage.policy.dto.PolicyResponse;
import com.swp391.selfstorage.policy.service.OverdueProcessingService;
import com.swp391.selfstorage.policy.service.PolicyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/policies")
@Tag(name = "Policy Configuration", description = "Cấu hình chính sách cọc, hoàn tiền và gia hạn (BM-02, T4.6)")
public class PolicyController {

    private final PolicyService policyService;
    private final OverdueProcessingService overdueProcessingService;

    public PolicyController(PolicyService policyService, OverdueProcessingService overdueProcessingService) {
        this.policyService = policyService;
        this.overdueProcessingService = overdueProcessingService;
    }

    /**
     * 1. Lấy phiên bản chính sách đang có hiệu lực tại thời điểm hiện tại.
     */
    @GetMapping("/active")
    @Operation(summary = "Lấy phiên bản chính sách đang có hiệu lực hiện tại")
    public ResponseEntity<PolicyResponse> getActivePolicy() {
        return ResponseEntity.ok(policyService.getActivePolicy());
    }

    /**
     * 2. Phân trang danh sách tất cả các phiên bản chính sách đã ban hành.
     * Mặc định sắp xếp giảm dần theo versionNo (phiên bản mới nhất lên đầu).
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách các phiên bản chính sách có phân trang")
    public ResponseEntity<PageResponse<PolicyResponse>> getPolicies(
            @PageableDefault(size = 20, sort = "versionNo", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(policyService.getPolicies(pageable));
    }

    /**
     * 3. Xem chi tiết một phiên bản chính sách theo ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một phiên bản chính sách theo ID")
    public ResponseEntity<PolicyResponse> getPolicyById(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.getPolicyById(id));
    }

    /**
     * 4. Ban hành phiên bản chính sách mới (BOM).
     * Yêu cầu role BUSINESS_OPERATIONS_MANAGER.
     * Trả về HTTP 201 Created khi lưu thành công.
     */
    @PostMapping
    @PreAuthorize("hasRole('BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Ban hành phiên bản chính sách mới (BOM - BM-02)")
    public ResponseEntity<PolicyResponse> createPolicy(
            @Valid @RequestBody CreatePolicyRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long publishedBy = currentUser != null && currentUser.getId() != null ? currentUser.getId() : 4L;
        PolicyResponse response = policyService.createPolicy(request, publishedBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 5. Kích hoạt thủ công tác vụ quét và xử lý hợp đồng quá hạn (T4.6 -
     * Test/Admin).
     */
    @PostMapping("/cron/process-overdue")
    @Operation(summary = "Kích hoạt thủ công tác vụ quét hợp đồng quá hạn (T4.6)")
    public ResponseEntity<ApiResponse<OverdueProcessingResult>> triggerOverdueProcessing(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(targetDate);
        return ResponseEntity.ok(ApiResponse.success(result, "Xử lý quét hợp đồng quá hạn thành công"));
    }
}

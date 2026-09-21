package com.swp391.selfstorage.support;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.support.dto.ConfirmResolutionRequest;
import com.swp391.selfstorage.support.dto.CreateSupportRequest;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.service.CustomerSupportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/support-requests")
@Tag(name = "Customer Support", description = "Gửi và theo dõi yêu cầu hỗ trợ sự cố của khách hàng (SC-06 / Task T4.7)")
public class CustomerSupportController {

    private final CustomerSupportService customerSupportService;

    public CustomerSupportController(CustomerSupportService customerSupportService) {
        this.customerSupportService = customerSupportService;
    }

    @PostMapping
    @PreAuthorize("hasRole('STORAGE_CUSTOMER') or hasRole('CUSTOMER')")
    @Operation(summary = "Gửi yêu cầu hỗ trợ mới (US-SC-06.1, UC-F7-01)")
    public ResponseEntity<ApiResponse<SupportRequestDetailResponse>> createSupportRequest(
            @Valid @RequestBody CreateSupportRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SupportRequestDetailResponse response = customerSupportService.createSupportRequest(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Gửi yêu cầu hỗ trợ thành công"));
    }

    @GetMapping
    @PreAuthorize("hasRole('STORAGE_CUSTOMER') or hasRole('CUSTOMER')")
    @Operation(summary = "Xem danh sách yêu cầu hỗ trợ của tôi (US-SC-06.2, UC-F7-02)")
    public ResponseEntity<ApiResponse<PageResponse<SupportRequestSummaryResponse>>> getMySupportRequests(
            @RequestParam(required = false) SupportStatus status,
            @RequestParam(required = false) SupportCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        String[] sortParts = sort.split(",");
        Sort sortObj = Sort.by(
                sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1])
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC,
                sortParts[0]
        );
        Pageable pageable = PageRequest.of(page, size, sortObj);

        PageResponse<SupportRequestSummaryResponse> response = customerSupportService.getMySupportRequests(
                currentUser, status, category, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách yêu cầu hỗ trợ thành công"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('STORAGE_CUSTOMER') or hasRole('CUSTOMER')")
    @Operation(summary = "Xem chi tiết yêu cầu hỗ trợ (US-SC-06.2)")
    public ResponseEntity<ApiResponse<SupportRequestDetailResponse>> getSupportRequestDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        SupportRequestDetailResponse response = customerSupportService.getSupportRequestDetail(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết yêu cầu hỗ trợ thành công"));
    }

    @PatchMapping(value = {"/{id}/confirm", "/{id}/close"})
    @PreAuthorize("hasRole('STORAGE_CUSTOMER') or hasRole('CUSTOMER')")
    @Operation(summary = "Khách hàng xác nhận kết quả nghiệm thu hoặc đóng yêu cầu (US-SC-06.3, UC-F7-08)")
    public ResponseEntity<ApiResponse<SupportRequestDetailResponse>> confirmResolution(
            @PathVariable Long id,
            @RequestBody(required = false) ConfirmResolutionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if (request == null) {
            request = ConfirmResolutionRequest.builder().satisfied(true).build();
        }
        SupportRequestDetailResponse response = customerSupportService.confirmResolution(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Xác nhận kết quả xử lý thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STORAGE_CUSTOMER') or hasRole('CUSTOMER')")
    @Operation(summary = "Hủy yêu cầu hỗ trợ khi chưa được tiếp nhận")
    public ResponseEntity<Void> cancelSupportRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        customerSupportService.cancelSupportRequest(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}

package com.swp391.selfstorage.reservation;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.reservation.dto.CustomerRentalDetailResponse;
import com.swp391.selfstorage.reservation.dto.CustomerRentalSummaryResponse;
import com.swp391.selfstorage.reservation.service.CustomerRentalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers/me/rentals")
@Tag(name = "Customer Rentals", description = "Quản lý ô kho đang thuê của khách hàng (SC-05 / Task T4.1)")
public class CustomerRentalController {

    private final CustomerRentalService customerRentalService;

    public CustomerRentalController(CustomerRentalService customerRentalService) {
        this.customerRentalService = customerRentalService;
    }

    @GetMapping
    @Operation(summary = "Xem danh sách ô kho đang thuê (My Rentals - US-SC-05.1)")
    public ResponseEntity<ApiResponse<PageResponse<CustomerRentalSummaryResponse>>> getMyRentals(
            @RequestParam(required = false, defaultValue = "ALL") String status,
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

        PageResponse<CustomerRentalSummaryResponse> response = customerRentalService.getMyRentals(
                currentUser, status, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách ô kho đang thuê thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một hợp đồng ô kho cụ thể của khách hàng (US-SC-05.2)")
    public ResponseEntity<ApiResponse<CustomerRentalDetailResponse>> getMyRentalDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        CustomerRentalDetailResponse response = customerRentalService.getMyRentalDetail(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết hợp đồng thành công"));
    }
}

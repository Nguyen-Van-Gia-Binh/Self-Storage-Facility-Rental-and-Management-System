package com.swp391.selfstorage.reservation;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.reservation.dto.*;
import com.swp391.selfstorage.reservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * REST Controller cho Module Reservation (SC-02, FM-02).
 * Base URL: /api/v1/reservations.
 */
@RestController
@RequestMapping("/reservations")
@Tag(name = "Reservation Module", description = "APIs quản lý đặt chỗ kho, tạm giữ capacity 48h và tính giá")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * API tính trước tiền thuê, tiền cọc 1 tháng (BR-DEP-01) và chiết khấu làm tròn (BR-GEN-04).
     */
    @PostMapping("/calculate-price")
    @Operation(summary = "Tính giá dự tính cho đơn giữ chỗ")
    public ResponseEntity<ApiResponse<CalculatePriceResponse>> calculatePrice(
            @Valid @RequestBody CalculatePriceRequest request
    ) {
        CalculatePriceResponse response = reservationService.calculatePrice(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tính giá thành công"));
    }

    /**
     * API tạo đơn đặt chỗ mới & giữ capacity trong 48 giờ (SC-02, BR-RES-02, BR-DEP-03).
     */
    @PostMapping
    @Operation(summary = "Tạo mới đơn giữ chỗ (Customer)")
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ReservationResponse response = reservationService.createReservation(request, currentUser);
        URI location = URI.create("/api/v1/reservations/" + response.getId());
        return ResponseEntity.created(location)
                .body(new ApiResponse<>(HttpStatus.CREATED.value(), "Đặt chỗ thành công", response));
    }

    /**
     * Lấy danh sách đặt chỗ phân trang có lọc theo vai trò và cơ sở (API-SPEC § 7.2, SA-03).
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách đặt chỗ phân trang có lọc")
    public ResponseEntity<ApiResponse<PageResponse<ReservationResponse>>> getReservations(
            @ModelAttribute ReservationFilterParams params,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        PageResponse<ReservationResponse> response = reservationService.getReservations(params, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách đặt chỗ thành công"));
    }

    /**
     * Tra cứu thông tin chi tiết đơn đặt chỗ theo ID hoặc Mã Code.
     */
    @GetMapping("/{identifier}")
    @Operation(summary = "Tra cứu thông tin đơn đặt chỗ theo ID hoặc Mã Code")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservation(
            @PathVariable String identifier,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ReservationResponse response;
        if (identifier.matches("\\d+")) {
            response = reservationService.getReservationById(Long.parseLong(identifier), currentUser);
        } else {
            response = reservationService.getReservationByCode(identifier);
        }
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin đơn đặt chỗ thành công"));
    }

    /**
     * Hủy đơn đặt chỗ theo chuẩn REST API (API-SPEC § 7.4, BR-RES-04).
     */
    @PostMapping("/{id}/cancellation")
    @Operation(summary = "Hủy đơn đặt chỗ kèm lý do")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelReservationPost(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CancelReservationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        ReservationResponse response = reservationService.cancelReservation(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã hủy đơn đặt chỗ thành công"));
    }

    /**
     * Hủy đơn đặt chỗ theo mã code (DELETE) — backward compatibility.
     */
    @DeleteMapping("/{code}")
    @Operation(summary = "Hủy đơn đặt chỗ theo mã code")
    public ResponseEntity<ApiResponse<Void>> cancelReservation(
            @PathVariable String code
    ) {
        reservationService.cancelReservation(code);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã hủy đơn đặt chỗ thành công"));
    }

    /**
     * Tra cứu danh sách đơn đặt chỗ / hợp đồng của khách hàng (My Rentals).
     */
    @GetMapping("/my-rentals")
    @Operation(summary = "Lấy danh sách thuê kho của tôi")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyRentals(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Long customerId = (currentUser != null) ? currentUser.getId() : 1L;
        List<ReservationResponse> list = reservationService.getCustomerReservations(customerId);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách thuê kho thành công"));
    }

    /**
     * T3.5: Tra cứu đặt chỗ khi khách đến check-in — US-FS-01.1
     */
    @GetMapping("/lookup")
    @Operation(summary = "Tra cứu đặt chỗ khi khách check-in tại cơ sở")
    public ResponseEntity<ApiResponse<ReservationResponse>> lookupForCheckIn(
            @RequestParam String query,
            @RequestParam Long facilityId
    ) {
        ReservationResponse response = reservationService.lookupForCheckIn(query, facilityId);
        return ResponseEntity.ok(ApiResponse.success(response, "Tra cứu đặt chỗ thành công"));
    }
}
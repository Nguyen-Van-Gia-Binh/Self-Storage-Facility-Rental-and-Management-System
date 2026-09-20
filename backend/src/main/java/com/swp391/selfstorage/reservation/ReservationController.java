package com.swp391.selfstorage.reservation;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.reservation.dto.CalculatePriceRequest;
import com.swp391.selfstorage.reservation.dto.CalculatePriceResponse;
import com.swp391.selfstorage.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;
import com.swp391.selfstorage.reservation.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * REST Controller cho Workstream 1 (Customer & Reservation Portal).
 * Base URL: /api/v1/reservations (context-path /api/v1 đã cấu hình ở application.yml).
 */
@RestController
@RequestMapping("/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * API tính trước tiền thuê, tiền cọc 1 tháng (BR-DEP-01) và chiết khấu làm tròn (BR-GEN-04).
     */
    @PostMapping("/calculate-price")
    public ResponseEntity<ApiResponse<CalculatePriceResponse>> calculatePrice(
            @Valid @RequestBody CalculatePriceRequest request
    ) {
        CalculatePriceResponse response = reservationService.calculatePrice(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tính giá thành công"));
    }

    /**
     * API tạo đơn đặt chỗ mới & giữ capacity 48 giờ (BR-RES-02, BR-DEP-03).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @Valid @RequestBody CreateReservationRequest request
    ) {
        ReservationResponse response = reservationService.createReservation(request);
        URI location = URI.create("/api/v1/reservations/" + response.getCode());
        return ResponseEntity.created(location)
                .body(new ApiResponse<>(HttpStatus.CREATED.value(), "Đặt chỗ thành công", response));
    }

    /**
     * Tra cứu chi tiết đơn đặt chỗ và mã VietQR.
     */
    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservation(
            @PathVariable String code
    ) {
        ReservationResponse response = reservationService.getReservationByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin đơn đặt chỗ thành công"));
    }

    /**
     * Hủy đơn đặt chỗ khi còn PENDING_PAYMENT (BR-RES-04).
     */
    @DeleteMapping("/{code}")
    public ResponseEntity<ApiResponse<Void>> cancelReservation(
            @PathVariable String code
    ) {
        reservationService.cancelReservation(code);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã hủy đơn đặt chỗ thành công"));
    }

    /**
     * Tra cứu danh sách đơn đặt chỗ / hợp đồng của khách hàng (SCR-SC-04 My Rentals).
     */
    @GetMapping("/my-rentals")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyRentals() {
        // Tạm lấy customerId = 1L (khách demo theo seed V2)
        List<ReservationResponse> list = reservationService.getCustomerReservations(1L);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách thuê kho thành công"));
    }
}

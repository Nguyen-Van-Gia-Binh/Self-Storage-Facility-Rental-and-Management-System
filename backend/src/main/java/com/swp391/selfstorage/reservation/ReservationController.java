package com.swp391.selfstorage.reservation;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.reservation.dto.CalculatePriceRequest;
import com.swp391.selfstorage.reservation.dto.CalculatePriceResponse;
import com.swp391.selfstorage.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;
import com.swp391.selfstorage.reservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * REST Controller cho Workstream 1 & 2 (Customer & Reservation Portal).
 * Base URL: /api/v1/reservations (context-path /api/v1 da cau hinh o application.yml).
 */
@RestController
@RequestMapping("/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * API tinh truoc tien thue, tien coc 1 thang (BR-DEP-01) va chiet khau lam tron (BR-GEN-04).
     */
    @PostMapping("/calculate-price")
    @Operation(summary = "Tính giá dự tính cho đơn giữ chỗ")
    public ResponseEntity<ApiResponse<CalculatePriceResponse>> calculatePrice(
            @Valid @RequestBody CalculatePriceRequest request
    ) {
        CalculatePriceResponse response = reservationService.calculatePrice(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tinh gia thanh cong"));
    }

    /**
     * API tao don dat cho moi & giu capacity 48 gio (BR-RES-02, BR-DEP-03).
     */
    @PostMapping
    @Operation(summary = "Tạo mới đơn giữ chỗ")
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @Valid @RequestBody CreateReservationRequest request
    ) {
        ReservationResponse response = reservationService.createReservation(request);
        URI location = URI.create("/api/v1/reservations/" + response.getCode());
        return ResponseEntity.created(location)
                .body(new ApiResponse<>(HttpStatus.CREATED.value(), "Dat cho thanh cong", response));
    }

    /**
     * Tra cuu chi tiet don dat cho va ma VietQR.
     */
    @GetMapping("/{code}")
    @Operation(summary = "Tra cứu thông tin đơn đặt chỗ theo mã code")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservation(
            @PathVariable String code
    ) {
        ReservationResponse response = reservationService.getReservationByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response, "Lay thong tin don dat cho thanh cong"));
    }

    /**
     * Huy don dat cho khi con PENDING_PAYMENT (BR-RES-04).
     */
    @DeleteMapping("/{code}")
    @Operation(summary = "Hủy đơn đặt chỗ")
    public ResponseEntity<ApiResponse<Void>> cancelReservation(
            @PathVariable String code
    ) {
        reservationService.cancelReservation(code);
        return ResponseEntity.ok(ApiResponse.success(null, "Da huy don dat cho thanh cong"));
    }

    /**
     * Tra cuu danh sach don dat cho / hop dong cua khach hang (SCR-SC-04 My Rentals).
     */
    @GetMapping("/my-rentals")
    @Operation(summary = "Lấy danh sách thuê kho của tôi")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyRentals() {
        // Tam lay customerId = 1L (khach demo theo seed V2)
        List<ReservationResponse> list = reservationService.getCustomerReservations(1L);
        return ResponseEntity.ok(ApiResponse.success(list, "Lay danh sach thue kho thanh cong"));
    }

    /**
     * T3.5: Tra cuu dat cho khi khach den check-in — US-FS-01.1
     */
    @GetMapping("/lookup")
    @Operation(summary = "Tra cứu đặt chỗ khi khách check-in tại cơ sở")
    public ResponseEntity<ApiResponse<ReservationResponse>> lookupForCheckIn(
            @RequestParam String query,
            @RequestParam Long facilityId) {
        ReservationResponse response = reservationService.lookupForCheckIn(query, facilityId);
        return ResponseEntity.ok(ApiResponse.success(response, "Tra cuu dat cho thanh cong"));
    }
}
package com.swp391.selfstorage.reservation;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.reservation.dto.*;
import com.swp391.selfstorage.reservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tạo mới đơn giữ chỗ (Customer)")
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED, "Vui lòng đăng nhập tài khoản để đặt chỗ lưu trữ.");
        }
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
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy danh sách thuê kho của tôi")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyRentals(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED, "Vui lòng đăng nhập để xem danh sách thuê kho");
        }
        List<ReservationResponse> list = reservationService.getCustomerReservations(currentUser.getId());
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

    /**
     * T3.8: Tra cứu thông tin lịch hẹn và hướng dẫn Check-in nhận kho cho khách (US-SC-04.1).
     */
    @GetMapping("/{id}/checkin-info")
    @Operation(summary = "Tra cứu thông tin lịch hẹn và hướng dẫn check-in (US-SC-04.1)")
    public ResponseEntity<ApiResponse<CheckInInfoResponse>> getCheckInInfo(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        CheckInInfoResponse response = reservationService.getCheckInInfo(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin lịch hẹn check-in thành công"));
    }

    /**
     * T3.8: Khách hàng xác nhận đã nhận bàn giao ô kho và nhận Access Code PIN (US-SC-04.2).
     */
    @PostMapping("/{id}/checkin-confirm")
    @Operation(summary = "Khách hàng xác nhận nhận bàn giao ô kho (US-SC-04.2)")
    public ResponseEntity<ApiResponse<CustomerCheckInResponse>> confirmCustomerCheckIn(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CustomerCheckInConfirmRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        CustomerCheckInResponse response = reservationService.confirmCustomerCheckIn(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Xác nhận nhận kho thành công"));
    }

    /**
     * T3.8: Khách hàng dời lịch hẹn Check-in nhận kho trong thời hạn 10 ngày (US-SC-04.3).
     */
    @PatchMapping("/{id}/appointment")
    @Operation(summary = "Khách hàng dời lịch hẹn check-in (US-SC-04.3)")
    public ResponseEntity<ApiResponse<CheckInInfoResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleAppointmentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        CheckInInfoResponse response = reservationService.rescheduleAppointment(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Dời lịch hẹn check-in thành công"));
    }
}
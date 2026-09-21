package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.reservation.dto.CalculatePriceRequest;
import com.swp391.selfstorage.reservation.dto.CalculatePriceResponse;
import com.swp391.selfstorage.reservation.dto.CancelReservationRequest;
import com.swp391.selfstorage.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.reservation.dto.ReservationFilterParams;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;

import java.util.List;

public interface ReservationService {

    /**
     * Tính toán trước biểu giá, chiết khấu và tiền cọc theo BR-PRI-* và BR-DEP-01.
     */
    CalculatePriceResponse calculatePrice(CalculatePriceRequest request);

    /**
     * Tạo đơn đặt chỗ mới và giữ capacity/ô kho trong 48 giờ (SC-02, BR-RES-02, BR-DEP-03).
     */
    ReservationResponse createReservation(CreateReservationRequest request, UserPrincipal currentUser);

    /**
     * Tạo đơn đặt chỗ mới với người dùng mặc định (không qua JWT).
     */
    ReservationResponse createReservation(CreateReservationRequest request);

    /**
     * Lấy danh sách đặt chỗ phân trang có lọc theo vai trò và cơ sở (SA-03).
     */
    PageResponse<ReservationResponse> getReservations(ReservationFilterParams params, UserPrincipal currentUser);

    /**
     * Tra cứu chi tiết đơn đặt chỗ theo ID có kiểm tra quyền truy cập.
     */
    ReservationResponse getReservationById(Long id, UserPrincipal currentUser);

    /**
     * Tra cứu chi tiết đơn đặt chỗ theo mã code (dùng cho thanh toán/QR).
     */
    ReservationResponse getReservationByCode(String code);

    /**
     * Hủy đơn đặt chỗ khi còn PENDING_PAYMENT theo ID (BR-RES-04).
     */
    ReservationResponse cancelReservation(Long id, CancelReservationRequest request, UserPrincipal currentUser);

    /**
     * Hủy đơn đặt chỗ khi còn PENDING_PAYMENT theo Code (backward compatibility).
     */
    void cancelReservation(String code);

    /**
     * Lấy danh sách đặt chỗ của một khách hàng cụ thể.
     */
    List<ReservationResponse> getCustomerReservations(Long customerId);

    /**
     * Xác nhận Reservation sau thanh toán thành công — BR-AVL-04, BR-PAY-02.
     * Dùng Pessimistic Lock để tránh race condition.
     */
    void confirmAfterPayment(Long reservationId);

    /**
     * T3.5: Tra cứu đặt chỗ khi khách đến check-in — US-FS-01.1.
     * query: mã Reservation (RSV-...), số điện thoại, hoặc CCCD.
     */
    ReservationResponse lookupForCheckIn(String query, Long facilityId);
}
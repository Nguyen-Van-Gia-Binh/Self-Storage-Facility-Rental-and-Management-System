package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.reservation.dto.CalculatePriceRequest;
import com.swp391.selfstorage.reservation.dto.CalculatePriceResponse;
import com.swp391.selfstorage.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;

import java.util.List;

public interface ReservationService {

    CalculatePriceResponse calculatePrice(CalculatePriceRequest request);

    ReservationResponse createReservation(CreateReservationRequest request);

    ReservationResponse getReservationByCode(String code);

    void cancelReservation(String code);

    List<ReservationResponse> getCustomerReservations(Long customerId);

    /**
     * Xac nhan Reservation sau thanh toan thanh cong — BR-AVL-04, BR-PAY-02.
     * Dung Pessimistic Lock de tranh race condition.
     * Idempotent: neu da CONFIRMED thi return ngay.
     */
    void confirmAfterPayment(Long reservationId);

    /**
     * T3.5: Tra cuu dat cho khi khach den check-in — US-FS-01.1.
     * query: ma Reservation (RSV-...), so dien thoai, hoac CCCD.
     */
    ReservationResponse lookupForCheckIn(String query, Long facilityId);
}
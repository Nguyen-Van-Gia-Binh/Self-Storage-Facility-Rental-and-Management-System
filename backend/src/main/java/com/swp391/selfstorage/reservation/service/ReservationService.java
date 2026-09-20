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
}

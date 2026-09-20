package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.reservation.dto.CalculatePriceRequest;
import com.swp391.selfstorage.reservation.dto.CalculatePriceResponse;
import com.swp391.selfstorage.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;

    public ReservationServiceImpl(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CalculatePriceResponse calculatePrice(CalculatePriceRequest request) {
        long rate = Math.max(0, request.getMonthlyPrice());
        int months = Math.max(1, request.getMonths());

        long rawRent = rate * months;

        // Chiết khấu: 6 tháng -> 5%, 12 tháng -> 10%
        double discountRate = 0.0;
        if (months >= 12) {
            discountRate = 0.10;
        } else if (months >= 6) {
            discountRate = 0.05;
        }

        // BR-GEN-04: Làm tròn đến 1.000 VNĐ
        long discountAmount = Math.round((rawRent * discountRate) / 1000.0) * 1000;
        long finalRent = rawRent - discountAmount;

        // BR-DEP-01: Tiền cọc an ninh bằng đúng 1 tháng tiền thuê
        long deposit = Math.round(rate / 1000.0) * 1000;

        long totalDueToday = finalRent + deposit;

        return new CalculatePriceResponse(
                rate,
                months,
                rawRent,
                discountRate,
                discountAmount,
                finalRent,
                deposit,
                totalDueToday
        );
    }

    @Override
    public ReservationResponse createReservation(CreateReservationRequest request) {
        // Kiểm tra tránh chọn trùng ô kho đang được giữ chỗ (BR-RES-02, BR-AVL-04)
        if (request.getStorageUnitId() != null) {
            boolean isTaken = reservationRepository.existsByStorageUnitIdAndStatusIn(
                    request.getStorageUnitId(),
                    Arrays.asList(ReservationStatus.PENDING_PAYMENT, ReservationStatus.CONFIRMED)
            );
            if (isTaken) {
                throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "Ô kho này vừa được khách hàng khác giữ chỗ");
            }
        }

        // Giá cơ sở mặc định (nếu chưa có API tra cứu giá chi tiết theo Facility x UnitType thì lấy chuẩn)
        long monthlyPrice = 1200000L; // 1.200.000 đ/tháng cho S, các loại khác có giá tương ứng

        CalculatePriceResponse pricing = calculatePrice(new CalculatePriceRequest(monthlyPrice, request.getRentalMonths()));

        Reservation reservation = new Reservation();
        
        // Sinh mã code: RSV-YYYYMMDD-XXXX
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
        reservation.setCode("RSV-" + datePart + "-" + randomSuffix);

        // Khách hàng vãng lai / tạm gắn ID 1 (Seed Customer) nếu chưa đăng nhập
        reservation.setCustomerId(1L);
        reservation.setFacilityId(request.getFacilityId());
        reservation.setUnitTypeId(request.getUnitTypeId());
        reservation.setStorageUnitId(request.getStorageUnitId());

        // BR-RES-01: Khoảng thời gian [start_date, end_date_exclusive)
        reservation.setStartDate(request.getStartDate());
        reservation.setRentalMonths(request.getRentalMonths());
        reservation.setEndDateExclusive(request.getStartDate().plusMonths(request.getRentalMonths()));

        // Snapshot giá và cọc (BR-GEN-05, BR-DEP-01)
        reservation.setMonthlyPriceSnapshot(pricing.getMonthlyPrice());
        reservation.setPolicyVersionId(1L); // Policy version 1
        reservation.setDiscountAmount(pricing.getDiscountAmount());
        reservation.setDepositAmount(pricing.getDepositAmount());
        reservation.setTotalRentalFee(pricing.getFinalRentTotal());
        reservation.setTotalPayable(pricing.getTotalDueToday());

        // BR-DEP-03: Giữ chỗ 48 giờ
        reservation.setStatus(ReservationStatus.PENDING_PAYMENT);
        reservation.setHoldExpiresAt(OffsetDateTime.now().plusHours(48));

        Reservation saved = reservationRepository.save(reservation);

        return mapToResponse(saved, request.getCustomerPhone(), request.getIdentityNumber());
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationByCode(String code) {
        Reservation reservation = reservationRepository.findByCode(code)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        return mapToResponse(reservation, null, null);
    }

    @Override
    public void cancelReservation(String code) {
        Reservation reservation = reservationRepository.findByCode(code)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        // BR-RES-04: Chỉ cho phép hủy khi còn PENDING_PAYMENT
        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Chỉ có thể hủy đơn đặt chỗ khi chưa thanh toán");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(OffsetDateTime.now());
        reservationRepository.save(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getCustomerReservations(Long customerId) {
        return reservationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(r -> mapToResponse(r, null, null))
                .collect(Collectors.toList());
    }

    private ReservationResponse mapToResponse(Reservation r, String phone, String idCard) {
        ReservationResponse res = new ReservationResponse();
        res.setId(r.getId());
        res.setCode(r.getCode());
        res.setFacilityId(r.getFacilityId());
        res.setFacilityName("SmartStorage Chi Nhánh " + r.getFacilityId());
        res.setUnitTypeId(r.getUnitTypeId());
        res.setUnitTypeName("Ngăn kho lưu trữ thông minh");
        res.setStorageUnitId(r.getStorageUnitId());
        res.setStorageUnitCode(r.getStorageUnitId() != null ? "U-" + r.getStorageUnitId() : "Chưa chọn ô");

        res.setStartDate(r.getStartDate());
        res.setRentalMonths(r.getRentalMonths());
        res.setEndDateExclusive(r.getEndDateExclusive());

        res.setMonthlyPrice(r.getMonthlyPriceSnapshot());
        res.setDiscountAmount(r.getDiscountAmount());
        res.setDepositAmount(r.getDepositAmount());
        res.setTotalRentalFee(r.getTotalRentalFee());
        res.setTotalPayable(r.getTotalPayable());

        res.setStatus(r.getStatus().name());
        res.setHoldExpiresAt(r.getHoldExpiresAt());

        // Thông tin chuyển khoản VietQR Napas247
        String transferContent = "SMARTSTORAGE " + r.getCode();
        res.setTransferContent(transferContent);
        res.setBankName("MB Bank (Ngân hàng Quân Đội)");
        res.setBankAccountNumber("0888 567 999");
        res.setVietQrPayload("vietqr://" + r.getTotalPayable() + "/" + transferContent);

        return res;
    }
}

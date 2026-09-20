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
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
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
    private final StorageUnitRepository storageUnitRepository;

    public ReservationServiceImpl(ReservationRepository reservationRepository,
                                  StorageUnitRepository storageUnitRepository) {
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CalculatePriceResponse calculatePrice(CalculatePriceRequest request) {
        long rate = Math.max(0, request.getMonthlyPrice());
        int months = Math.max(1, request.getMonths());

        long rawRent = rate * months;

        // Chiet khau: 6 thang -> 5%, 12 thang -> 10%
        double discountRate = 0.0;
        if (months >= 12) {
            discountRate = 0.10;
        } else if (months >= 6) {
            discountRate = 0.05;
        }

        // BR-GEN-04: Lam tron den 1.000 VND
        long discountAmount = Math.round((rawRent * discountRate) / 1000.0) * 1000;
        long finalRent = rawRent - discountAmount;

        // BR-DEP-01: Tien coc an ninh bang dung 1 thang tien thue
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
        // Kiem tra tranh chon trung o kho dang duoc giu cho (BR-RES-02, BR-AVL-04)
        if (request.getStorageUnitId() != null) {
            boolean isTaken = reservationRepository.existsByStorageUnitIdAndStatusIn(
                    request.getStorageUnitId(),
                    Arrays.asList(ReservationStatus.PENDING_PAYMENT, ReservationStatus.CONFIRMED)
            );
            if (isTaken) {
                throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "O kho nay vua duoc khach hang khac giu cho");
            }
        }

        // Gia co so mac dinh (neu chua co API tra cuu gia chi tiet theo Facility x UnitType thi lay chuan)
        long monthlyPrice = 1200000L; // 1.200.000 d/thang cho S, cac loai khac co gia tuong ung

        CalculatePriceResponse pricing = calculatePrice(new CalculatePriceRequest(monthlyPrice, request.getRentalMonths()));

        Reservation reservation = new Reservation();
        
        // Sinh ma code: RSV-YYYYMMDD-XXXX
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
        reservation.setCode("RSV-" + datePart + "-" + randomSuffix);

        // Khach hang vang lai / tam gan ID 1 (Seed Customer) neu chua dang nhap
        reservation.setCustomerId(1L);
        reservation.setFacilityId(request.getFacilityId());
        reservation.setUnitTypeId(request.getUnitTypeId());
        reservation.setStorageUnitId(request.getStorageUnitId());

        // BR-RES-01: Khoang thoi gian [start_date, end_date_exclusive)
        reservation.setStartDate(request.getStartDate());
        reservation.setRentalMonths(request.getRentalMonths());
        reservation.setEndDateExclusive(request.getStartDate().plusMonths(request.getRentalMonths()));

        // Snapshot gia va coc (BR-GEN-05, BR-DEP-01)
        reservation.setMonthlyPriceSnapshot(pricing.getMonthlyPrice());
        reservation.setPolicyVersionId(1L); // Policy version 1
        reservation.setDiscountAmount(pricing.getDiscountAmount());
        reservation.setDepositAmount(pricing.getDepositAmount());
        reservation.setTotalRentalFee(pricing.getFinalRentTotal());
        reservation.setTotalPayable(pricing.getTotalDueToday());

        // BR-DEP-03: Giu cho 48 gio
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

        // BR-RES-04: Chi cho phep huy khi con PENDING_PAYMENT
        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Chi co the huy don dat cho khi chua thanh toan");
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

    @Override
    @Transactional(timeout = 5)
    public void confirmAfterPayment(Long reservationId) {
        Reservation rsv = reservationRepository.findByIdWithLock(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        if (rsv.getStatus() == ReservationStatus.CONFIRMED) return; // idempotent
        if (rsv.getStatus() == ReservationStatus.FULFILLED)
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED);
        if (rsv.getHoldExpiresAt().isBefore(OffsetDateTime.now()))
            throw new CustomException(ErrorCode.RESERVATION_EXPIRED);

        if (rsv.getStorageUnitId() != null) {
            StorageUnit unit = storageUnitRepository.findByIdForUpdate(rsv.getStorageUnitId())
                    .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND));

            if (unit.getStatus() == StorageUnitStatus.OCCUPIED) {
                // Future claim: unit dang thue voi ky cu — khong doi status
            } else if (unit.getStatus() == StorageUnitStatus.AVAILABLE
                    || unit.getStatus() == StorageUnitStatus.RESERVED) {
                unit.setStatus(StorageUnitStatus.RESERVED);
                storageUnitRepository.save(unit);
            } else {
                throw new CustomException(ErrorCode.UNIT_ASSIGNMENT_FAILED);
            }
        }

        rsv.setStatus(ReservationStatus.CONFIRMED);
        rsv.setConfirmedAt(OffsetDateTime.now());
        reservationRepository.save(rsv);
    }

    private ReservationResponse mapToResponse(Reservation r, String phone, String idCard) {
        ReservationResponse res = new ReservationResponse();
        res.setId(r.getId());
        res.setCode(r.getCode());
        res.setFacilityId(r.getFacilityId());
        res.setFacilityName("SmartStorage Chi Nhanh " + r.getFacilityId());
        res.setUnitTypeId(r.getUnitTypeId());
        res.setUnitTypeName("Ngan kho luu tru thong minh");
        res.setStorageUnitId(r.getStorageUnitId());
        res.setStorageUnitCode(r.getStorageUnitId() != null ? "U-" + r.getStorageUnitId() : "Chua chon o");

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

        // Thong tin chuyen khoan VietQR Napas247
        String transferContent = "SMARTSTORAGE " + r.getCode();
        res.setTransferContent(transferContent);
        res.setBankName("MB Bank (Ngan hang Quan Doi)");
        res.setBankAccountNumber("0888 567 999");
        res.setVietQrPayload("vietqr://" + r.getTotalPayable() + "/" + transferContent);

        return res;
    }
}
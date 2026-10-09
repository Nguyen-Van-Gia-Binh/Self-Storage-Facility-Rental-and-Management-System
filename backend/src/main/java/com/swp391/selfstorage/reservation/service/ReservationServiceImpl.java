package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.reservation.dto.*;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.policy.dto.SurchargeLineResponse;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.ExtraFeeTypeRepository;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import com.swp391.selfstorage.policy.service.PolicyNumbers;
import com.swp391.selfstorage.policy.service.SurchargeAmountCalculator;
import com.swp391.selfstorage.user.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FacilityRepository facilityRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final FacilityUnitTypePriceRepository facilityUnitTypePriceRepository;
    private final RentalContractRepository rentalContractRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PolicyVersionRepository policyVersionRepository;

    @Autowired(required = false)
    private ExtraFeeTypeRepository extraFeeTypeRepository;

    @Autowired(required = false)
    private AppliedPriceLookup appliedPriceLookup;

    @Autowired(required = false)
    private ReservationHoldExpiryService reservationHoldExpiryService;

    public ReservationServiceImpl(ReservationRepository reservationRepository,
                                  StorageUnitRepository storageUnitRepository,
                                  FacilityRepository facilityRepository,
                                  UnitTypeRepository unitTypeRepository,
                                  FacilityUnitTypePriceRepository facilityUnitTypePriceRepository,
                                  RentalContractRepository rentalContractRepository,
                                  PaymentTransactionRepository paymentTransactionRepository,
                                  PolicyVersionRepository policyVersionRepository) {
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.facilityRepository = facilityRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.facilityUnitTypePriceRepository = facilityUnitTypePriceRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.policyVersionRepository = policyVersionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CalculatePriceResponse calculatePrice(CalculatePriceRequest request) {
        if (request.getFacilityId() == null || request.getUnitTypeId() == null) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Can co so va loai o kho de tinh gia");
        }
        long monthlyPrice = lookupMonthlyPrice(request.getFacilityId(), request.getUnitTypeId());
        PolicyVersion policy = requireActivePolicy();
        int quotedMonths = Math.max(1, request.getMonths());
        BigDecimal multiplier = policy.getDepositMultiplier() != null
                ? policy.getDepositMultiplier()
                : BigDecimal.ONE;
        CalculatePriceResponse response = quote(monthlyPrice, quotedMonths, multiplier);
        applySurcharges(response, request.getFacilityId());
        return response;
    }

    /**
     * Công thức thuê, chiết khấu và cọc. Đơn giá và hệ số cọc do người gọi lấy từ BOM.
     */
    CalculatePriceResponse quote(long monthlyPrice, int months, BigDecimal depositMultiplier) {
        long rate = Math.max(0, monthlyPrice);
        int safeMonths = Math.max(1, months);
        BigDecimal multiplier = depositMultiplier != null ? depositMultiplier : BigDecimal.ONE;

        long rawRent = rate * safeMonths;

        // Chiet khau theo BR-PRI-01: 6 thang -> 5%, 12 thang -> 10%
        double discountRate = 0.0;
        if (safeMonths >= 12) {
            discountRate = 0.10;
        } else if (safeMonths >= 6) {
            discountRate = 0.05;
        }

        // BR-GEN-04: Lam tron den 1.000 VND
        long discountAmount = Math.round((rawRent * discountRate) / 1000.0) * 1000;
        long finalRent = rawRent - discountAmount;

        // BR-DEP-01: Deposit = deposit.multiplier × đơn giá tháng
        long deposit = Math.round((rate * multiplier.doubleValue()) / 1000.0) * 1000;

        long totalDueToday = finalRent + deposit;

        return new CalculatePriceResponse(
                rate,
                safeMonths,
                rawRent,
                discountRate,
                discountAmount,
                finalRent,
                deposit,
                totalDueToday
        );
    }

    private void applySurcharges(CalculatePriceResponse response, Long facilityId) {
        if (extraFeeTypeRepository == null || facilityId == null || response == null) {
            return;
        }
        List<SurchargeLineResponse> lines = SurchargeAmountCalculator.lines(
                SurchargeAmountCalculator.prepaidValueAdded(
                        extraFeeTypeRepository.findApplicable(facilityId, LocalDate.now())),
                response.getMonthlyPrice(),
                response.getRentalMonths());
        response.applySurchargeLines(lines);
    }

    private long lookupMonthlyPrice(Long facilityId, Long unitTypeId) {
        if (appliedPriceLookup != null) {
            return appliedPriceLookup.resolveMonthlyPrice(facilityId, unitTypeId)
                    .filter(p -> p > 0)
                    .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND,
                            "Loai o kho chua duoc cau hinh gia tai co so nay"));
        }
        if (facilityUnitTypePriceRepository == null) {
            throw new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND, "Loai o kho chua duoc cau hinh gia tai co so nay");
        }
        long monthlyPrice = facilityUnitTypePriceRepository
                .findByFacilityIdAndUnitTypeId(facilityId, unitTypeId)
                .map(FacilityUnitTypePrice::getMonthlyPrice)
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND,
                        "Loai o kho chua duoc cau hinh gia tai co so nay"));
        if (monthlyPrice <= 0) {
            throw new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND, "Loai o kho chua duoc cau hinh gia tai co so nay");
        }
        return monthlyPrice;
    }

    @Override
    public ReservationResponse createReservation(CreateReservationRequest request) {
        return createReservation(request, null);
    }

    @Override
    public ReservationResponse createReservation(CreateReservationRequest request, UserPrincipal currentUser) {
        // 1. Xác thực người dùng: Bắt buộc đăng nhập, ném UNAUTHORIZED nếu currentUser == null
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED, "Vui lòng đăng nhập tài khoản để đặt chỗ lưu trữ.");
        }
        Long customerId = currentUser.getId();

        // 2. Kiem tra BR-OVD-09: Chan khach hang dang co hop dong OVERDUE
        if (customerId != null && rentalContractRepository != null && rentalContractRepository.existsByCustomerIdAndStatus(customerId, ContractStatus.OVERDUE)) {
            throw new CustomException(ErrorCode.CONTRACT_OVERDUE);
        }

        // 3. Kiem tra BR-RES-01: Facility va UnitType dang hoat dong
        if (facilityRepository != null) {
            Facility facility = facilityRepository.findById(request.getFacilityId())
                    .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));
            if (facility.getStatus() != FacilityStatus.ACTIVE) {
                throw new CustomException(ErrorCode.FACILITY_NOT_FOUND, "Co so luu tru hien khong hoat dong");
            }
        }

        if (unitTypeRepository != null) {
            UnitType unitType = unitTypeRepository.findById(request.getUnitTypeId())
                    .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));
            if (!unitType.isActive()) {
                throw new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND, "Loai o kho hien khong hoat dong");
            }
        }

        // 4. Kiem tra ngay bat dau khong o qua khu
        if (request.getStartDate() != null && request.getStartDate().isBefore(LocalDate.now())) {
            throw new CustomException(ErrorCode.INVALID_START_DATE);
        }

        int months = Math.max(1, request.getRentalMonths());
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate endDateExclusive = startDate.plusMonths(months);

        // BR-AVL-04: khách phải chọn đúng ô kho vật lý
        if (request.getStorageUnitId() == null) {
            throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "Khach phai chon dung o kho");
        }

        PolicyVersion policy = requireActivePolicy();
        int bufferDays = policy.getRentalBufferDays();
        int holdHours = policy.getReservationHoldHours();

        if (storageUnitRepository == null) {
            throw new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND);
        }
        StorageUnit unit = storageUnitRepository.findByIdForUpdate(request.getStorageUnitId())
                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        if (unit.getFacilityId() != null && !unit.getFacilityId().equals(request.getFacilityId())) {
            throw new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND, "O kho khong thuoc co so hoac loai o kho da chon");
        }
        if (unit.getUnitTypeId() != null && !unit.getUnitTypeId().equals(request.getUnitTypeId())) {
            throw new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND, "O kho khong thuoc co so hoac loai o kho da chon");
        }
        if (unit.getStatus() == StorageUnitStatus.MAINTENANCE || unit.getStatus() == StorageUnitStatus.OUT_OF_SERVICE) {
            throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "O kho dang trong che do bao tri hoac ngung hoat dong");
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (reservationRepository != null && reservationRepository.existsOverlappingReservationForUnit(
                request.getStorageUnitId(), startDate, endDateExclusive, now, bufferDays)) {
            throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "O kho nay da co nguoi khac giu cho trong thoi gian da chon");
        }
        if (rentalContractRepository != null && rentalContractRepository.existsOverlappingContractForUnit(
                request.getStorageUnitId(), startDate, endDateExclusive, bufferDays, 0L)) {
            throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "O kho nay da co hop dong trong thoi gian da chon, ke ca khoang dem an toan");
        }

        long monthlyPrice = lookupMonthlyPrice(request.getFacilityId(), request.getUnitTypeId());
        BigDecimal multiplier = policy.getDepositMultiplier() != null
                ? policy.getDepositMultiplier()
                : BigDecimal.ONE;
        CalculatePriceResponse pricing = quote(monthlyPrice, months, multiplier);
        applySurcharges(pricing, request.getFacilityId());

        // 7. Tao entity Reservation
        Reservation reservation = new Reservation();
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
        reservation.setCode("RSV-" + datePart + "-" + randomSuffix);

        reservation.setCustomerId(customerId);
        reservation.setFacilityId(request.getFacilityId());
        reservation.setUnitTypeId(request.getUnitTypeId());
        reservation.setStorageUnitId(request.getStorageUnitId());

        reservation.setStartDate(request.getStartDate());
        reservation.setRentalMonths(months);
        reservation.setEndDateExclusive(endDateExclusive);

        reservation.setMonthlyPriceSnapshot(pricing.getMonthlyPrice());
        reservation.setPolicyVersionId(policy.getId());
        reservation.setDiscountAmount(pricing.getDiscountAmount());
        reservation.setDepositAmount(pricing.getDepositAmount());
        reservation.setTotalRentalFee(pricing.getFinalRentTotal());
        reservation.setTotalPayable(pricing.getTotalDueToday());

        reservation.setStatus(ReservationStatus.PENDING_PAYMENT);
        reservation.setHoldExpiresAt(OffsetDateTime.now().plusHours(holdHours));

        Reservation saved = reservationRepository.save(reservation);
        return mapToResponse(saved);
    }

    private PolicyVersion requireActivePolicy() {
        if (policyVersionRepository == null) {
            throw new CustomException(ErrorCode.POLICY_NOT_FOUND);
        }
        PolicyVersion policy = policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now())
                .orElseThrow(() -> new CustomException(ErrorCode.POLICY_NOT_FOUND));
        if (policy.getRentalBufferDays() == null || policy.getReservationHoldHours() == null || policy.getId() == null) {
            throw new CustomException(ErrorCode.POLICY_NOT_FOUND, "Chinh sach hieu luc thieu tham so giu cho hoac khoang dem");
        }
        return policy;
    }

    private PolicyVersion policyOf(Reservation reservation) {
        if (reservation != null && reservation.getPolicyVersionId() != null && policyVersionRepository != null) {
            return policyVersionRepository.findById(reservation.getPolicyVersionId()).orElse(null);
        }
        if (policyVersionRepository == null) {
            return null;
        }
        return policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now())
                .orElse(null);
    }

    private String randomPin(int length) {
        int digits = Math.min(10, Math.max(4, length));
        int bound = (int) Math.pow(10, digits);
        return String.format("%0" + digits + "d", ThreadLocalRandom.current().nextInt(bound));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> getReservations(ReservationFilterParams params, UserPrincipal currentUser) {
        Long filterCustomerId = params.getCustomerId();
        Long filterFacilityId = params.getFacilityId();

        // RBAC theo SA-03
        if (currentUser != null) {
            if (currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
                // Khach hang chi duoc xem don cua chinh minh
                filterCustomerId = currentUser.getId();
            } else if (currentUser.getRole() == UserRole.FACILITY_MANAGER || currentUser.getRole() == UserRole.FACILITY_STAFF) {
                List<Long> assignedFacilities = currentUser.getFacilityIds();
                if (filterFacilityId != null) {
                    if (!assignedFacilities.contains(filterFacilityId)) {
                        throw new CustomException(ErrorCode.FACILITY_ACCESS_DENIED);
                    }
                } else if (!assignedFacilities.isEmpty()) {
                    Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
                    Page<Reservation> page = reservationRepository.findByFacilityIdsWithFilters(
                            assignedFacilities,
                            params.getStatus(),
                            params.getStartDateFrom(),
                            params.getStartDateTo(),
                            pageable
                    );
                    return PageResponse.from(page.map(this::mapToResponse));
                }
            }
        }

        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Reservation> page = reservationRepository.findWithFilters(
                filterCustomerId,
                filterFacilityId,
                params.getStatus(),
                params.getStartDateFrom(),
                params.getStartDateTo(),
                pageable
        );

        return PageResponse.from(page.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(Long id, UserPrincipal currentUser) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        validateAccessPermission(reservation, currentUser);

        return mapToResponse(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationByCode(String code) {
        Reservation reservation = reservationRepository.findByCode(code)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        return mapToResponse(reservation);
    }

    @Override
    public ReservationResponse cancelReservation(Long id, CancelReservationRequest request, UserPrincipal currentUser) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        validateAccessPermission(reservation, currentUser);

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_CANCELLED);
        }

        if (reservation.getStatus() == ReservationStatus.FULFILLED) {
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED, "Đơn đặt chỗ đã nhận kho, không thể hủy");
        }

        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Chi co the huy don dat cho khi o trang thai cho thanh toan hoac da xac nhan chua nhan kho");
        }

        OffsetDateTime now = OffsetDateTime.now();
        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason()
                : "Khach hang chu dong huy don";

        // Xử lý hoàn tiền khi đơn đã thanh toán (CONFIRMED) theo BR-CAN-01 & BR-CAN-02
        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            OffsetDateTime startDateTime = reservation.getStartDate().atStartOfDay().atOffset(now.getOffset());
            long hoursUntilStart = Duration.between(now, startDateTime).toHours();
            PolicyVersion cancelPolicy = policyOf(reservation);
            int fullRefundHours = cancelPolicy != null && cancelPolicy.getCancelFullRefundHours() != null
                    ? cancelPolicy.getCancelFullRefundHours()
                    : 48;
            long deposit = reservation.getDepositAmount();
            long rentalFee = Math.max(0, reservation.getTotalPayable() - deposit);
            long refundAmount;

            if (hoursUntilStart >= fullRefundHours) {
                refundAmount = reservation.getTotalPayable();
            } else if (now.isBefore(startDateTime)) {
                BigDecimal lateRate = cancelPolicy != null ? cancelPolicy.getCancelLateRefundRate() : BigDecimal.ZERO;
                refundAmount = rentalFee + PolicyNumbers.share(deposit, lateRate);
            } else {
                BigDecimal noShowRate = cancelPolicy != null ? cancelPolicy.getCancelNoShowRefundRate() : BigDecimal.ZERO;
                long heldDays = Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(reservation.getStartDate(), now.toLocalDate()));
                long daily = PolicyNumbers.dailyRent(reservation.getMonthlyPriceSnapshot(), cancelPolicy);
                long rentCharged = Math.min(rentalFee, daily * heldDays);
                refundAmount = Math.max(0, rentalFee - rentCharged) + PolicyNumbers.share(deposit, noShowRate);
            }

            if (refundAmount > 0) {
                PaymentTransaction refundTxn = PaymentTransaction.builder()
                        .reservationId(reservation.getId())
                        .amount(refundAmount)
                        .transactionType("REFUND")
                        .paymentMethod("BANK_TRANSFER")
                        .status("PENDING_REFUND")
                        .providerReference("REFUND: " + reason)
                        .orderCode(System.currentTimeMillis())
                        .build();
                paymentTransactionRepository.save(refundTxn);
            }

            // Hủy hợp đồng ở trạng thái PENDING_CHECK_IN nếu có
            rentalContractRepository.findByReservationId(reservation.getId()).ifPresent(contract -> {
                contract.setStatus(ContractStatus.TERMINATED);
                rentalContractRepository.save(contract);
            });
        }

        // Giải phóng StorageUnit nếu đã được gán
        if (reservation.getStorageUnitId() != null) {
            storageUnitRepository.findById(reservation.getStorageUnitId()).ifPresent(unit -> {
                unit.setStatus(StorageUnitStatus.AVAILABLE);
                storageUnitRepository.save(unit);
            });
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(now);
        reservation.setCancelReason(reason);

        Reservation saved = reservationRepository.save(reservation);
        return mapToResponse(saved);
    }

    @Override
    public void cancelReservation(String code) {
        Reservation reservation = reservationRepository.findByCode(code)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_CANCELLED);
        }

        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Chi co the huy don dat cho khi chua thanh toan");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(OffsetDateTime.now());
        reservation.setCancelReason("Khach hang huy don qua ma code");
        reservationRepository.save(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getCustomerReservations(Long customerId) {
        return reservationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(timeout = 5)
    public void confirmAfterPayment(Long reservationId) {
        if (reservationHoldExpiryService != null && reservationHoldExpiryService.expireIfElapsed(reservationId)) {
            throw new CustomException(ErrorCode.RESERVATION_EXPIRED);
        }
        Reservation rsv = reservationRepository.findByIdWithLock(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        if (rsv.getStatus() == ReservationStatus.CONFIRMED) return; // idempotent
        if (rsv.getStatus() == ReservationStatus.FULFILLED)
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED);
        if (rsv.getHoldExpiresAt() != null && rsv.getHoldExpiresAt().isBefore(OffsetDateTime.now())) {
            if (rsv.getStatus() == ReservationStatus.PENDING_PAYMENT) {
                rsv.setStatus(ReservationStatus.EXPIRED);
                reservationRepository.save(rsv);
            }
            throw new CustomException(ErrorCode.RESERVATION_EXPIRED);
        }

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

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse lookupForCheckIn(String query, Long facilityId) {
        if (query != null && query.toUpperCase().startsWith("RSV-")) {
            return reservationRepository.findByCodeAndFacilityId(query, facilityId)
                    .map(this::mapToResponse)
                    .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND,
                            "Khong tim thay dat cho voi ma: " + query));
        }
        var results = reservationRepository.findByCustomerContactAndFacility(query, facilityId);
        if (results.isEmpty()) {
            throw new CustomException(ErrorCode.RESERVATION_NOT_FOUND,
                    "Khong tim thay thong tin dat cho hop le");
        }
        return mapToResponse(results.get(0));
    }

    private void validateAccessPermission(Reservation reservation, UserPrincipal currentUser) {
        if (currentUser == null) return;

        UserRole role = currentUser.getRole();
        if (role == UserRole.SYSTEM_ADMINISTRATOR || role == UserRole.BUSINESS_OPERATIONS_MANAGER) {
            return;
        }

        if (role == UserRole.STORAGE_CUSTOMER) {
            if (!reservation.getCustomerId().equals(currentUser.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "Ban khong co quyen truy cap don dat cho nay");
            }
            return;
        }

        if (role == UserRole.FACILITY_MANAGER || role == UserRole.FACILITY_STAFF) {
            if (!currentUser.getFacilityIds().contains(reservation.getFacilityId())) {
                throw new CustomException(ErrorCode.FACILITY_ACCESS_DENIED, "Don dat cho khong thuoc co so ban phu trach");
            }
        }
    }

    private ReservationResponse mapToResponse(Reservation r) {
        String fName = (facilityRepository != null)
                ? facilityRepository.findById(r.getFacilityId()).map(Facility::getName).orElse("Chi nhanh " + r.getFacilityId())
                : "Chi nhanh " + r.getFacilityId();
        String uName = (unitTypeRepository != null)
                ? unitTypeRepository.findById(r.getUnitTypeId()).map(UnitType::getName).orElse("Ngan kho " + r.getUnitTypeId())
                : "Ngan kho " + r.getUnitTypeId();

        return mapToResponse(r, fName, uName);
    }

    private ReservationResponse mapToResponse(Reservation r, String facilityName, String unitTypeName) {
        ReservationResponse res = new ReservationResponse();
        res.setId(r.getId());
        res.setCode(r.getCode());
        res.setCustomerId(r.getCustomerId());
        res.setFacilityId(r.getFacilityId());
        res.setFacilityName(facilityName);
        res.setUnitTypeId(r.getUnitTypeId());
        res.setUnitTypeName(unitTypeName);
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
        res.setCreatedAt(r.getCreatedAt());
        res.setConfirmedAt(r.getConfirmedAt());
        res.setFulfilledAt(r.getFulfilledAt());
        res.setCancelledAt(r.getCancelledAt());
        res.setCancelReason(r.getCancelReason());

        // Thong tin chuyen khoan VietQR Napas247
        String transferContent = "SMARTSTORAGE " + r.getCode();
        res.setTransferContent(transferContent);
        res.setBankName("MB Bank (Ngan hang Quan Doi)");
        res.setBankAccountNumber("0888 567 999");
        res.setVietQrPayload("vietqr://" + r.getTotalPayable() + "/" + transferContent);

        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public CheckInInfoResponse getCheckInInfo(Long reservationId, UserPrincipal currentUser) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        if (currentUser != null && currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
            if (!reservation.getCustomerId().equals(currentUser.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
        }

        CheckInInfoResponse response = new CheckInInfoResponse();
        response.setReservationId(reservation.getId());
        response.setReservationCode(reservation.getCode());
        response.setStatus(reservation.getStatus().name());
        response.setStartDate(reservation.getStartDate());

        PolicyVersion checkInPolicy = policyOf(reservation);
        int checkinGraceDays = checkInPolicy != null && checkInPolicy.getCheckinGraceDays() != null
                ? checkInPolicy.getCheckinGraceDays()
                : 10;
        LocalDate gracePeriodEnd = reservation.getStartDate().plusDays(checkinGraceDays);
        response.setGracePeriodEnd(gracePeriodEnd);
        long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), gracePeriodEnd);
        response.setDaysRemaining(Math.max(0, daysRemaining));

        response.setFacilityId(reservation.getFacilityId());
        if (facilityRepository != null) {
            facilityRepository.findById(reservation.getFacilityId()).ifPresent(f -> {
                response.setFacilityName(f.getName());
                response.setFacilityAddress(f.getAddress());
                response.setFacilityPhone(f.getPhone());
                response.setOpeningHours("07:00 - 21:00 hàng ngày");
            });
        }

        response.setStorageUnitId(reservation.getStorageUnitId());
        if (reservation.getStorageUnitId() != null && storageUnitRepository != null) {
            storageUnitRepository.findById(reservation.getStorageUnitId()).ifPresent(u -> {
                response.setStorageUnitCode(u.getCode());
                response.setFloor(u.getFloor());
                response.setPosition(u.getPosition());
            });
        }

        if (unitTypeRepository != null) {
            unitTypeRepository.findById(reservation.getUnitTypeId()).ifPresent(ut -> {
                response.setUnitTypeName(ut.getName());
                response.setUnitDimensions(String.format("%.1fm x %.1fm x %.1fm",
                        ut.getWidthM() != null ? ut.getWidthM().doubleValue() : 0.0,
                        ut.getLengthM() != null ? ut.getLengthM().doubleValue() : 0.0,
                        ut.getHeightM() != null ? ut.getHeightM().doubleValue() : 0.0));
            });
        }

        if (rentalContractRepository != null) {
            rentalContractRepository.findByReservationId(reservationId).ifPresent(c -> {
                response.setContractId(c.getId());
                response.setContractCode(c.getCode());
            });
        }

        response.setCheckinToken("CHK-" + reservation.getCode().replace("-", "") + "-" +
                (response.getContractId() != null ? response.getContractId() : reservation.getId()));
        response.setRequiredDocuments(List.of(
                "CCCD hoặc Hộ chiếu bản gốc khớp thông tin đăng ký tài khoản",
                "Mã đặt chỗ (" + reservation.getCode() + ") hoặc mã QR Check-in trên ứng dụng",
                "Khóa phụ cá nhân (nếu quý khách có nhu cầu sử dụng thêm khóa cơ riêng)"
        ));
        response.setNotes("Quý khách vui lòng đến nhận kho trong vòng " + checkinGraceDays
                + " ngày kể từ ngày bắt đầu thuê để hoàn tất thủ tục bàn giao và tránh bị hủy do No-show theo điều khoản BR-CAN-04.");

        return response;
    }

    @Override
    @Transactional
    public CustomerCheckInResponse confirmCustomerCheckIn(
            Long reservationId,
            CustomerCheckInConfirmRequest request,
            UserPrincipal currentUser
    ) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        if (currentUser != null && currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
            if (!reservation.getCustomerId().equals(currentUser.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
        }

        if (reservation.getStatus() == ReservationStatus.FULFILLED) {
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED);
        }

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        if (request != null && !request.isConfirmed()) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED);
        }

        reservation.setStatus(ReservationStatus.FULFILLED);
        reservation.setFulfilledAt(OffsetDateTime.now());
        reservationRepository.save(reservation);

        CustomerCheckInResponse response = new CustomerCheckInResponse();
        response.setReservationId(reservation.getId());
        response.setReservationCode(reservation.getCode());
        response.setReservationStatus(ReservationStatus.FULFILLED.name());
        response.setConfirmedAt(reservation.getFulfilledAt());
        response.setMessage("Xác nhận nhận bàn giao ô kho thành công. Chúc mừng bạn đã bắt đầu sử dụng dịch vụ lưu trữ!");

        String unitCode = null;
        if (reservation.getStorageUnitId() != null && storageUnitRepository != null) {
            unitCode = storageUnitRepository.findById(reservation.getStorageUnitId())
                    .map(StorageUnit::getCode)
                    .orElse(null);
        }
        response.setStorageUnitCode(unitCode != null ? unitCode : "S-" + reservation.getStorageUnitId());

        if (rentalContractRepository != null) {
            rentalContractRepository.findByReservationId(reservationId).ifPresent(contract -> {
                response.setContractId(contract.getId());
                response.setContractCode(contract.getCode());
                response.setContractStatus(contract.getStatus().name());

                String accessCode = contract.getAccessCode();
                if (accessCode == null || accessCode.isBlank()) {
                    int length = PolicyNumbers.snapshotInt(contract.getPolicySnapshot(), "accessPinLength",
                            PolicyNumbers.pinLength(policyOf(reservation)));
                    accessCode = randomPin(length);
                    contract.setAccessCode(accessCode);
                    rentalContractRepository.save(contract);
                }
                response.setAccessCode(accessCode);
            });
        }

        if (response.getAccessCode() == null) {
            response.setAccessCode(randomPin(PolicyNumbers.pinLength(policyOf(reservation))));
        }

        return response;
    }

    @Override
    @Transactional
    public CheckInInfoResponse rescheduleAppointment(
            Long reservationId,
            RescheduleAppointmentRequest request,
            UserPrincipal currentUser
    ) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        if (currentUser != null && currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
            if (!reservation.getCustomerId().equals(currentUser.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
        }

        if (reservation.getStatus() != ReservationStatus.CONFIRMED && reservation.getStatus() != ReservationStatus.PENDING_PAYMENT) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        LocalDate newDate = request.getNewAppointmentDate();
        LocalDate minDate = reservation.getStartDate();
        LocalDate maxDate = reservation.getStartDate().plusDays(10);

        if (newDate.isBefore(minDate) || newDate.isAfter(maxDate)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED);
        }

        reservation.setStartDate(newDate);
        reservation.setEndDateExclusive(newDate.plusMonths(reservation.getRentalMonths()));
        reservationRepository.save(reservation);

        return getCheckInInfo(reservationId, currentUser);
    }
}
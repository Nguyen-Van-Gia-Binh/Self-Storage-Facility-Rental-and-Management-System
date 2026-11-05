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
import com.swp391.selfstorage.support.entity.AssignmentTaskType;
import com.swp391.selfstorage.support.entity.StaffDailyAssignment;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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

    @Autowired(required = false)
    private com.swp391.selfstorage.policy.service.DiscountProgramService discountProgramService;

    private final StaffDailyAssignmentRepository staffDailyAssignmentRepository;
    private final UserRepository userRepository;

    @Value("${booking.max-advance-days:30}")
    private int maxAdvanceDays = 30;

    @Autowired
    public ReservationServiceImpl(ReservationRepository reservationRepository,
                                  StorageUnitRepository storageUnitRepository,
                                  FacilityRepository facilityRepository,
                                  UnitTypeRepository unitTypeRepository,
                                  FacilityUnitTypePriceRepository facilityUnitTypePriceRepository,
                                  RentalContractRepository rentalContractRepository,
                                  PaymentTransactionRepository paymentTransactionRepository,
                                  PolicyVersionRepository policyVersionRepository,
                                  StaffDailyAssignmentRepository staffDailyAssignmentRepository,
                                  UserRepository userRepository) {
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.facilityRepository = facilityRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.facilityUnitTypePriceRepository = facilityUnitTypePriceRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.policyVersionRepository = policyVersionRepository;
        this.staffDailyAssignmentRepository = staffDailyAssignmentRepository;
        this.userRepository = userRepository;
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

        long rawRent = Math.max(0, monthlyPrice) * quotedMonths;
        com.swp391.selfstorage.policy.service.DiscountProgramService.BestDiscountResult bestDiscount =
                discountProgramService != null
                        ? discountProgramService.findBestDiscount(request.getFacilityId(), request.getUnitTypeId(), quotedMonths, rawRent, LocalDate.now())
                        : fallbackDiscount(rawRent, quotedMonths);

        CalculatePriceResponse response = quote(monthlyPrice, quotedMonths, multiplier, bestDiscount);
        applySurcharges(response, request.getFacilityId());
        return response;
    }

    /**
     * Tương thích ngược cho các lời gọi quote cũ
     */
    CalculatePriceResponse quote(long monthlyPrice, int months, BigDecimal depositMultiplier) {
        long rate = Math.max(0, monthlyPrice);
        int safeMonths = Math.max(1, months);
        long rawRent = rate * safeMonths;
        return quote(monthlyPrice, months, depositMultiplier, fallbackDiscount(rawRent, safeMonths));
    }

    CalculatePriceResponse quote(long monthlyPrice, int months, BigDecimal depositMultiplier,
                                 com.swp391.selfstorage.policy.service.DiscountProgramService.BestDiscountResult discount) {
        long rate = Math.max(0, monthlyPrice);
        int safeMonths = Math.max(1, months);
        BigDecimal multiplier = depositMultiplier != null ? depositMultiplier : BigDecimal.ONE;

        long rawRent = rate * safeMonths;
        double discountRate = discount != null ? discount.discountRate() : 0.0;
        long discountAmount = discount != null ? discount.discountAmount() : 0L;
        long finalRent = rawRent - discountAmount;

        // BR-DEP-01: Deposit = deposit.multiplier × đơn giá tháng (trước giảm giá)
        long deposit = Math.round((rate * multiplier.doubleValue()) / 1000.0) * 1000;
        long totalDueToday = finalRent + deposit;

        CalculatePriceResponse response = new CalculatePriceResponse(
                rate,
                safeMonths,
                rawRent,
                discountRate,
                discountAmount,
                finalRent,
                deposit,
                totalDueToday
        );
        if (discount != null) {
            response.setDiscountProgramId(discount.programId());
            response.setDiscountProgramName(discount.programName());
        }
        return response;
    }

    private com.swp391.selfstorage.policy.service.DiscountProgramService.BestDiscountResult fallbackDiscount(long rawRent, int safeMonths) {
        double discountRate = 0.0;
        if (safeMonths >= 12) {
            discountRate = 0.10;
        } else if (safeMonths >= 6) {
            discountRate = 0.05;
        }
        long discountAmount = Math.round((rawRent * discountRate) / 1000.0) * 1000;
        return new com.swp391.selfstorage.policy.service.DiscountProgramService.BestDiscountResult(null, null, discountRate, discountAmount);
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

        // 2.1 Kiem tra BR-RES-02: Moi khach hang chi duoc giu cho toi da 1 o kho (PENDING_PAYMENT con han)
        if (customerId != null && reservationRepository != null &&
                reservationRepository.existsActivePendingByCustomerId(customerId, ReservationStatus.PENDING_PAYMENT, OffsetDateTime.now())) {
            throw new CustomException(ErrorCode.PENDING_RESERVATION_EXISTS,
                    "Quý khách đang có 1 đơn giữ chỗ ô kho chưa thanh toán. Vui lòng thanh toán hoặc hủy đơn cũ trước khi đặt ô kho khác.");
        }

        // 2.2 Kiem tra BR-SPAM-01: Chặn khách hàng hủy hoặc bỏ thanh toán >= 5 lần trong ngày
        if (customerId != null && userRepository != null) {
            userRepository.findById(customerId).ifPresent(user -> {
                LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
                if (user.getLastCancelDate() != null && user.getLastCancelDate().equals(today) && user.getDailyCancelCount() >= 5) {
                    throw new CustomException(ErrorCode.BOOKING_SPAM_BLOCKED);
                }
            });
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

        // 4.1 Kiem tra BR-RES-01: Gioi han dat truoc toi da (Advance Booking Window: 30 ngay)
        if (request.getStartDate() != null) {
            long daysUntilStart = ChronoUnit.DAYS.between(LocalDate.now(), request.getStartDate());
            if (daysUntilStart > maxAdvanceDays) {
                throw new CustomException(ErrorCode.ADVANCE_BOOKING_LIMIT_EXCEEDED,
                        "Chỉ được phép đặt trước tối đa " + maxAdvanceDays + " ngày. Vui lòng đăng ký Danh sách chờ nếu muốn thuê xa hơn.");
            }
        }

        int months = Math.max(1, request.getRentalMonths());
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate endDateExclusive = startDate.plusMonths(months);

        PolicyVersion policy = requireActivePolicy();
        int bufferDays = policy.getRentalBufferDays();
        int holdHours = policy.getReservationHoldHours();

        if (storageUnitRepository != null) {
            storageUnitRepository.lockExploitableUnitIds(request.getFacilityId(), request.getUnitTypeId());
            long exploitable = storageUnitRepository.countExploitableUnits(
                    request.getFacilityId(), request.getUnitTypeId(),
                    List.of(StorageUnitStatus.MAINTENANCE, StorageUnitStatus.OUT_OF_SERVICE));
            long busy = storageUnitRepository.countBusyUnits(
                    request.getFacilityId(), request.getUnitTypeId(), startDate, endDateExclusive, bufferDays);
            long unassigned = reservationRepository.countUnassignedOverlappingReservations(
                    request.getFacilityId(), request.getUnitTypeId(), startDate, endDateExclusive,
                    OffsetDateTime.now(), bufferDays);
            if (exploitable - busy - unassigned <= 0) {
                throw new CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE);
            }
        }

        long monthlyPrice = lookupMonthlyPrice(request.getFacilityId(), request.getUnitTypeId());
        BigDecimal multiplier = policy.getDepositMultiplier() != null
                ? policy.getDepositMultiplier()
                : BigDecimal.ONE;
        long rawRent = Math.max(0, monthlyPrice) * months;
        com.swp391.selfstorage.policy.service.DiscountProgramService.BestDiscountResult bestDiscount =
                discountProgramService != null
                        ? discountProgramService.findBestDiscount(request.getFacilityId(), request.getUnitTypeId(), months, rawRent, LocalDate.now())
                        : fallbackDiscount(rawRent, months);
        CalculatePriceResponse pricing = quote(monthlyPrice, months, multiplier, bestDiscount);
        applySurcharges(pricing, request.getFacilityId());

        // 7. Tao entity Reservation
        Reservation reservation = new Reservation();
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
        reservation.setCode("RSV-" + datePart + "-" + randomSuffix);

        reservation.setCustomerId(customerId);
        reservation.setFacilityId(request.getFacilityId());
        reservation.setUnitTypeId(request.getUnitTypeId());
        reservation.setStorageUnitId(null);

        reservation.setStartDate(request.getStartDate());
        reservation.setRentalMonths(months);
        reservation.setEndDateExclusive(endDateExclusive);

        reservation.setMonthlyPriceSnapshot(pricing.getMonthlyPrice());
        reservation.setPolicyVersionId(policy.getId());
        reservation.setDiscountProgramId(pricing.getDiscountProgramId());
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

        Optional<RentalContract> pendingContractOpt = rentalContractRepository != null
                ? rentalContractRepository.findByReservationId(reservation.getId())
                : Optional.empty();
        List<RentalContract> linkedContracts = rentalContractRepository != null
                ? rentalContractRepository.findAllByReservationId(reservation.getId())
                : List.of();
        boolean hasPendingContract = (pendingContractOpt.isPresent() && pendingContractOpt.get().getStatus() == ContractStatus.PENDING_CHECK_IN)
                || linkedContracts.stream().anyMatch(c -> c.getStatus() == ContractStatus.PENDING_CHECK_IN);

        if (reservation.getStatus() == ReservationStatus.FULFILLED && !hasPendingContract) {
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED, "Đơn đặt chỗ đã nhận kho, không thể hủy");
        }

        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT
                && reservation.getStatus() != ReservationStatus.CONFIRMED
                && !hasPendingContract) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Chi co the huy don dat cho khi o trang thai cho thanh toan hoac da xac nhan chua nhan kho");
        }

        OffsetDateTime now = OffsetDateTime.now();
        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason()
                : "Khach hang chu dong huy don";

        boolean isNoShow = false;

        // Xử lý hoàn tiền khi đơn đã thanh toán (CONFIRMED hoặc có hợp đồng PENDING_CHECK_IN) theo BR-CAN-01 & BR-CAN-02
        if (reservation.getStatus() == ReservationStatus.CONFIRMED || hasPendingContract) {
            OffsetDateTime startDateTime = reservation.getStartDate().atStartOfDay().atOffset(now.getOffset());
            long hoursUntilStart = Duration.between(now, startDateTime).toHours();
            PolicyVersion cancelPolicy = policyOf(reservation);
            int fullRefundHours = cancelPolicy != null && cancelPolicy.getCancelFullRefundHours() != null
                    ? cancelPolicy.getCancelFullRefundHours()
                    : 48;
            long deposit = reservation.getDepositAmount();
            long rentalFee = Math.max(0, reservation.getTotalPayable() - deposit);
            long refundAmount;

            boolean isWithinCoolingOff = false;
            if (reservation.getConfirmedAt() != null) {
                isWithinCoolingOff = Duration.between(reservation.getConfirmedAt(), now).toHours() <= fullRefundHours;
            } else if (reservation.getCreatedAt() != null) {
                isWithinCoolingOff = Duration.between(reservation.getCreatedAt().atOffset(now.getOffset()), now).toHours() <= fullRefundHours;
            }

            // Đủ điều kiện hoàn 100% (cả cọc + tiền thuê) nếu:
            // 1. Hủy trong vòng 48 giờ kể từ khi thanh toán (cooling-off period)
            // 2. HOẶC hủy trước ngày bắt đầu thuê >= 48 giờ
            if (isWithinCoolingOff || hoursUntilStart >= fullRefundHours) {
                refundAmount = reservation.getTotalPayable();
            } else if (now.isBefore(startDateTime)) {
                BigDecimal lateRate = cancelPolicy != null ? cancelPolicy.getCancelLateRefundRate() : BigDecimal.ZERO;
                refundAmount = rentalFee + PolicyNumbers.share(deposit, lateRate);
            } else {
                int graceDays = cancelPolicy != null && cancelPolicy.getCheckinGraceDays() != null
                        ? cancelPolicy.getCheckinGraceDays()
                        : 10;
                long heldDays = Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(reservation.getStartDate(), now.toLocalDate()));
                if (heldDays > graceDays) {
                    // Quá hạn ân hạn nhận kho (No-show quá hạn theo BR-CAN-04): Không hoàn tiền cả 2 khoản (0đ), chỉ giải phóng ô kho
                    refundAmount = 0L;
                    isNoShow = true;
                } else {
                    BigDecimal noShowRate = cancelPolicy != null ? cancelPolicy.getCancelNoShowRefundRate() : BigDecimal.ZERO;
                    long daily = PolicyNumbers.dailyRent(reservation.getMonthlyPriceSnapshot(), cancelPolicy);
                    long rentCharged = Math.min(rentalFee, daily * heldDays);
                    refundAmount = Math.max(0, rentalFee - rentCharged) + PolicyNumbers.share(deposit, noShowRate);
                }
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
            if (rentalContractRepository != null) {
                rentalContractRepository.findByReservationId(reservation.getId()).ifPresent(contract -> {
                    if (contract.getStatus() == ContractStatus.PENDING_CHECK_IN) {
                        contract.setStatus(ContractStatus.TERMINATED);
                        rentalContractRepository.save(contract);
                    }
                });
            }
        }

        // Giải phóng StorageUnit nếu đã được gán
        if (reservation.getStorageUnitId() != null) {
            storageUnitRepository.findById(reservation.getStorageUnitId()).ifPresent(unit -> {
                unit.setStatus(StorageUnitStatus.AVAILABLE);
                storageUnitRepository.save(unit);
            });
        }

        reservation.setStatus(isNoShow ? ReservationStatus.NO_SHOW : ReservationStatus.CANCELLED);
        reservation.setCancelledAt(now);
        reservation.setCancelReason(reason);

        // Cap nhat bo dem huy don chong Spam Bom hang (BR-SPAM-01)
        if (reservation.getCustomerId() != null && userRepository != null) {
            userRepository.findById(reservation.getCustomerId()).ifPresent(user -> {
                LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
                if (user.getLastCancelDate() != null && user.getLastCancelDate().equals(today)) {
                    user.setDailyCancelCount(user.getDailyCancelCount() + 1);
                } else {
                    user.setLastCancelDate(today);
                    user.setDailyCancelCount(1);
                }
                userRepository.save(user);
            });
        }

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

        // Cap nhat bo dem huy don chong Spam Bom hang (BR-SPAM-01)
        if (reservation.getCustomerId() != null && userRepository != null) {
            userRepository.findById(reservation.getCustomerId()).ifPresent(user -> {
                LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
                if (user.getLastCancelDate() != null && user.getLastCancelDate().equals(today)) {
                    user.setDailyCancelCount(user.getDailyCancelCount() + 1);
                } else {
                    user.setLastCancelDate(today);
                    user.setDailyCancelCount(1);
                }
                userRepository.save(user);
            });
        }

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
                    || unit.getStatus() == StorageUnitStatus.RESERVED
                    || unit.getStatus() == StorageUnitStatus.CLEANING) {
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
    public ReservationResponse assignUnit(Long reservationId, Long storageUnitId, List<Long> facilityIds) {
        Reservation reservation = reservationRepository.findByIdWithLock(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));
        if (facilityIds == null || !facilityIds.contains(reservation.getFacilityId())) {
            throw new CustomException(ErrorCode.FACILITY_ACCESS_DENIED);
        }
        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new CustomException(ErrorCode.RESERVATION_NOT_PAID);
        }
        if (reservation.getStorageUnitId() != null
                && !LocalDate.now().isBefore(reservation.getStartDate())) {
            throw new CustomException(ErrorCode.ASSIGNMENT_WINDOW_CLOSED);
        }
        if (storageUnitId.equals(reservation.getStorageUnitId())) {
            return mapToResponse(reservation);
        }

        Long previousUnitId = reservation.getStorageUnitId();
        List<Long> lockIds = new ArrayList<>(2);
        lockIds.add(storageUnitId);
        if (previousUnitId != null) {
            lockIds.add(previousUnitId);
        }
        lockIds.sort(Long::compareTo);
        Map<Long, StorageUnit> locked = new java.util.LinkedHashMap<>();
        for (Long id : lockIds) {
            locked.put(id, storageUnitRepository.findByIdForUpdate(id)
                    .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND)));
        }
        StorageUnit unit = locked.get(storageUnitId);
        if (!reservation.getFacilityId().equals(unit.getFacilityId())
                || !reservation.getUnitTypeId().equals(unit.getUnitTypeId())
                || unit.getStatus() != StorageUnitStatus.AVAILABLE) {
            throw new CustomException(ErrorCode.UNIT_ASSIGNMENT_FAILED);
        }

        int bufferDays = requireActivePolicy().getRentalBufferDays();
        boolean overlaps = rentalContractRepository.existsOverlappingContractForUnit(
                unit.getId(), reservation.getStartDate(), reservation.getEndDateExclusive(), bufferDays, 0L)
                || reservationRepository.existsOverlappingReservationForUnit(
                unit.getId(), reservation.getStartDate(), reservation.getEndDateExclusive(),
                OffsetDateTime.now(), bufferDays, reservation.getId());
        if (overlaps) {
            throw new CustomException(ErrorCode.UNIT_ASSIGNMENT_FAILED);
        }

        if (previousUnitId != null) {
            StorageUnit previous = locked.get(previousUnitId);
            if (previous.getStatus() == StorageUnitStatus.RESERVED) {
                previous.setStatus(StorageUnitStatus.AVAILABLE);
                storageUnitRepository.save(previous);
            } else if (previous.getStatus() != StorageUnitStatus.OCCUPIED) {
                throw new CustomException(ErrorCode.UNIT_ASSIGNMENT_FAILED);
            }
        }

        reservation.setStorageUnitId(unit.getId());
        unit.setStatus(StorageUnitStatus.RESERVED);
        storageUnitRepository.save(unit);
        rentalContractRepository.findByReservationId(reservation.getId()).ifPresent(contract -> {
            contract.setStorageUnitId(unit.getId());
            rentalContractRepository.save(contract);
        });
        Reservation saved = reservationRepository.save(reservation);
        return mapToResponse(saved != null ? saved : reservation);
    }

    @Override
    @Transactional
    public ReservationResponse assignUnit(Long reservationId, AssignUnitRequest request, Long managerId, List<Long> facilityIds) {
        ReservationResponse response = this.assignUnit(reservationId, request.getStorageUnitId(), facilityIds);

        if (request.getStaffId() != null) {
            if (userRepository != null) {
                AppUser staff = userRepository.findById(request.getStaffId())
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "Khong tim thay nhan vien"));
                if (staff.getRole() != UserRole.FACILITY_STAFF || staff.getStatus() != UserStatus.ACTIVE) {
                    throw new CustomException(ErrorCode.VALIDATION_FAILED, "Nhan vien tiep don phai co vai tro STAFF va dang hoat dong");
                }
            }

            RentalContract contract = rentalContractRepository.findByReservationId(reservationId).orElse(null);
            if (contract != null) {
                if (request.getScheduledStartTime() != null) {
                    contract.setScheduledStartTime(request.getScheduledStartTime());
                }
                if (request.getScheduledEndTime() != null) {
                    contract.setScheduledEndTime(request.getScheduledEndTime());
                }
                rentalContractRepository.save(contract);

                if (staffDailyAssignmentRepository != null) {
                    Reservation reservation = reservationRepository.findById(reservationId)
                            .or(() -> reservationRepository.findByIdWithLock(reservationId))
                            .orElse(null);

                    Long facilityId = reservation != null ? reservation.getFacilityId() : contract.getFacilityId();
                    LocalDate defaultDate = reservation != null && reservation.getStartDate() != null
                            ? reservation.getStartDate()
                            : (contract.getStartDate() != null ? contract.getStartDate() : LocalDate.now());
                    LocalDate workDate = request.getScheduledDate() != null ? request.getScheduledDate() : defaultDate;

                    StaffDailyAssignment assignment = staffDailyAssignmentRepository
                            .findByReferenceTypeAndReferenceId("CONTRACT", contract.getId())
                            .orElseGet(() -> StaffDailyAssignment.builder()
                                    .referenceType("CONTRACT")
                                    .referenceId(contract.getId())
                                    .facilityId(facilityId)
                                    .taskType(AssignmentTaskType.HANDOVER)
                                    .build());

                    assignment.setStaffId(request.getStaffId());
                    assignment.setAssignedBy(managerId);
                    assignment.setWorkDate(workDate);
                    assignment.setFacilityId(facilityId);
                    assignment.setReferenceType("CONTRACT");
                    assignment.setReferenceId(contract.getId());
                    assignment.setTaskType(AssignmentTaskType.HANDOVER);
                    staffDailyAssignmentRepository.save(assignment);
                }
            }
        }

        return response;
    }

    @Override
    @Transactional
    public ReservationResponse reassignStaff(Long reservationId, Long newStaffId, String reason, Long managerId, List<Long> facilityIds) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        if (facilityIds == null || !facilityIds.contains(reservation.getFacilityId())) {
            throw new CustomException(ErrorCode.FACILITY_ACCESS_DENIED);
        }

        RentalContract contract = rentalContractRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        if (userRepository != null) {
            AppUser newStaff = userRepository.findById(newStaffId)
                    .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "Khong tim thay nhan vien"));
            if (newStaff.getRole() != UserRole.FACILITY_STAFF || newStaff.getStatus() != UserStatus.ACTIVE) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Nhan vien tiep don phai co vai tro STAFF va dang hoat dong");
            }
        }

        if (staffDailyAssignmentRepository != null) {
            StaffDailyAssignment assignment = staffDailyAssignmentRepository
                    .findByReferenceTypeAndReferenceId("CONTRACT", contract.getId())
                    .orElseGet(() -> StaffDailyAssignment.builder()
                            .referenceType("CONTRACT")
                            .referenceId(contract.getId())
                            .facilityId(reservation.getFacilityId())
                            .workDate(contract.getCheckinDate() != null ? contract.getCheckinDate() : reservation.getStartDate())
                            .taskType(AssignmentTaskType.HANDOVER)
                            .build());

            assignment.setStaffId(newStaffId);
            assignment.setAssignedBy(managerId);
            staffDailyAssignmentRepository.save(assignment);
        }

        return mapToResponse(reservation);
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
            storageUnitRepository.findByIdForUpdate(reservation.getStorageUnitId()).ifPresent(u -> {
                u.setStatus(StorageUnitStatus.OCCUPIED);
                storageUnitRepository.save(u);
            });
        }
        response.setStorageUnitCode(unitCode != null ? unitCode : "S-" + reservation.getStorageUnitId());

        if (rentalContractRepository != null) {
            rentalContractRepository.findByReservationId(reservationId).ifPresent(contract -> {
                contract.setStatus(ContractStatus.ACTIVE);
                if (contract.getCheckinDate() == null) {
                    contract.setCheckinDate(LocalDate.now());
                }
                String accessCode = contract.getAccessCode();
                if (accessCode == null || accessCode.isBlank()) {
                    int length = PolicyNumbers.snapshotInt(contract.getPolicySnapshot(), "accessPinLength",
                            PolicyNumbers.pinLength(policyOf(reservation)));
                    accessCode = randomPin(length);
                    contract.setAccessCode(accessCode);
                }
                rentalContractRepository.save(contract);
                response.setContractId(contract.getId());
                response.setContractCode(contract.getCode());
                response.setContractStatus(contract.getStatus().name());
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
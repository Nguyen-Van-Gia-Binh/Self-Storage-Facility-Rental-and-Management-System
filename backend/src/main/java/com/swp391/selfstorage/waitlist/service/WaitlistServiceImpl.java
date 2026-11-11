package com.swp391.selfstorage.waitlist.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.repository.UserRepository;
import com.swp391.selfstorage.contract.dto.CreateDirectContractRequest;
import com.swp391.selfstorage.contract.service.ContractService;
import com.swp391.selfstorage.waitlist.dto.ConvertWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.ConvertWaitlistToContractRequest;
import com.swp391.selfstorage.waitlist.dto.CreateWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.FollowUpWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.RejectWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.WaitlistResponse;
import com.swp391.selfstorage.waitlist.entity.Waitlist;
import com.swp391.selfstorage.waitlist.entity.WaitlistStatus;
import com.swp391.selfstorage.waitlist.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WaitlistServiceImpl implements WaitlistService {

    private final WaitlistRepository waitlistRepository;
    private final FacilityRepository facilityRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final UserRepository userRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final ReservationRepository reservationRepository;
    private final PolicyVersionRepository policyVersionRepository;

    @Autowired(required = false)
    private AppliedPriceLookup appliedPriceLookup;

    @Autowired(required = false)
    private FacilityUnitTypePriceRepository facilityUnitTypePriceRepository;

    @Autowired(required = false)
    private ContractService contractService;

    @Override
    public WaitlistResponse registerWaitlist(CreateWaitlistRequest request, UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED, "Vui lòng đăng nhập để đăng ký danh sách chờ");
        }
        Long customerId = currentUser.getId();

        Facility facility = facilityRepository.findById(request.getFacilityId())
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));
        if (facility.getStatus() != FacilityStatus.ACTIVE) {
            throw new CustomException(ErrorCode.FACILITY_NOT_FOUND, "Cơ sở lưu trữ hiện không hoạt động");
        }

        UnitType unitType = unitTypeRepository.findById(request.getUnitTypeId())
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));
        if (!unitType.isActive()) {
            throw new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND, "Loại ô kho hiện không hoạt động");
        }

        if (request.getTargetStartDate() != null && request.getTargetStartDate().isBefore(LocalDate.now())) {
            throw new CustomException(ErrorCode.INVALID_START_DATE, "Ngày mong muốn thuê phải từ hôm nay trở đi");
        }

        int rentalMonths = Math.max(1, request.getRentalMonths());
        LocalDate targetStartDate = request.getTargetStartDate() != null ? request.getTargetStartDate() : LocalDate.now();

        // BR-WAT-01, BR-WAT-06: Tiếp nhận Waitlist cho 2 trường hợp:
        // 1) Thuê trong vòng 30 ngày nhưng cơ sở đã hết ô kho trống (available == 0 / thời gian bị đặt)
        // 2) Đặt trước hơn 1 tháng (> 30 ngày) vì cổng online BookingPage bị giới hạn tối đa 30 ngày (BR-RES-01)
        long daysUntilStart = ChronoUnit.DAYS.between(LocalDate.now(), targetStartDate);

        // Chặn trùng lặp đơn chờ đang hiệu lực
        boolean exists = waitlistRepository.existsByCustomerIdAndFacilityIdAndUnitTypeIdAndStatusIn(
                customerId, request.getFacilityId(), request.getUnitTypeId(),
                Arrays.asList(WaitlistStatus.WAITING, WaitlistStatus.CONTACTING, WaitlistStatus.PENDING_FOLLOW_UP)
        );
        if (exists) {
            throw new CustomException(ErrorCode.WAITLIST_ALREADY_EXISTS);
        }

        // Nếu trong vòng 30 ngày tới mà hạng kho vẫn còn capacity trống -> hướng dẫn đặt trực tiếp
        if (daysUntilStart <= 30 && storageUnitRepository != null) {
            PolicyVersion policy = policyVersionRepository
                    .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now(ZoneOffset.UTC))
                    .orElse(null);
            int bufferDays = (policy != null && policy.getRentalBufferDays() != null) ? policy.getRentalBufferDays() : 15;
            LocalDate endDateExclusive = targetStartDate.plusMonths(rentalMonths);
            long exploitable = storageUnitRepository.countExploitableUnits(
                    request.getFacilityId(), request.getUnitTypeId(),
                    Arrays.asList(StorageUnitStatus.MAINTENANCE, StorageUnitStatus.OUT_OF_SERVICE));
            long busy = storageUnitRepository.countBusyUnits(
                    request.getFacilityId(), request.getUnitTypeId(), targetStartDate, endDateExclusive, bufferDays);
            long unassigned = reservationRepository.countUnassignedOverlappingReservations(
                    request.getFacilityId(), request.getUnitTypeId(), targetStartDate, endDateExclusive, OffsetDateTime.now(ZoneOffset.UTC), bufferDays);
            long available = Math.max(0, exploitable - busy - unassigned);
            if (available > 0) {
                throw new CustomException(ErrorCode.CAPACITY_AVAILABLE_SHOULD_BOOK_NOW);
            }
        }

        Waitlist waitlist = Waitlist.builder()
                .customerId(customerId)
                .facilityId(request.getFacilityId())
                .unitTypeId(request.getUnitTypeId())
                .targetStartDate(targetStartDate)
                .rentalMonths(rentalMonths)
                .status(WaitlistStatus.WAITING)
                .contactPhone(request.getPhoneNumber())
                .contactNotes(request.getContactNotes())
                .build();

        Waitlist saved = waitlistRepository.save(waitlist);
        return enrichResponses(Collections.singletonList(saved)).get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WaitlistResponse> getMyWaitlists(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        List<Waitlist> list = waitlistRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.getId());
        return enrichResponses(list);
    }

    @Override
    public WaitlistResponse extendWaitlist(Long id, UserPrincipal currentUser) {
        Waitlist waitlist = findWaitlistAndVerifyOwner(id, currentUser);
        if (waitlist.getStatus() != WaitlistStatus.WAITING && waitlist.getStatus() != WaitlistStatus.PENDING_FOLLOW_UP) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Chỉ có thể gia hạn đơn đang chờ");
        }
        // Gia hạn thêm 15 ngày (BR-WAT-06)
        waitlist.setTargetStartDate(waitlist.getTargetStartDate().plusDays(15));
        Waitlist saved = waitlistRepository.save(waitlist);
        return enrichResponses(Collections.singletonList(saved)).get(0);
    }

    @Override
    public WaitlistResponse cancelWaitlist(Long id, UserPrincipal currentUser) {
        Waitlist waitlist = findWaitlistAndVerifyOwner(id, currentUser);
        if (waitlist.getStatus() == WaitlistStatus.CONVERTED) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Đơn chờ đã được chuyển đổi thành công, không thể hủy");
        }
        waitlist.setStatus(WaitlistStatus.CANCELLED);
        Waitlist saved = waitlistRepository.save(waitlist);
        return enrichResponses(Collections.singletonList(saved)).get(0);
    }

    @Override
    public List<WaitlistResponse> getFacilityWaitlists(Long facilityId, UserPrincipal currentUser) {
        // Hybrid Step 1: Lazy Unlock trên câu đọc
        cleanupExpiredLocks();

        List<Waitlist> list = waitlistRepository.findByFacilityIdAndStatusInOrderByCreatedAtAsc(
                facilityId,
                Arrays.asList(WaitlistStatus.WAITING, WaitlistStatus.CONTACTING, WaitlistStatus.PENDING_FOLLOW_UP, WaitlistStatus.CONVERTED)
        );

        return enrichResponses(list);
    }

    @Override
    public WaitlistResponse startContacting(Long id, UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime timeoutAt = null; // Không áp đặt giới hạn 2 giờ tư vấn khách hàng

        // Guardrail 1 (Tech Lead): Atomic Conditional Update chống Race Condition
        int updated = waitlistRepository.atomicStartContacting(
                id, WaitlistStatus.CONTACTING, currentUser.getId(), now, timeoutAt,
                Arrays.asList(WaitlistStatus.WAITING, WaitlistStatus.PENDING_FOLLOW_UP)
        );
        if (updated == 0) {
            throw new CustomException(ErrorCode.WAITLIST_LOCK_CONFLICT);
        }

        Waitlist waitlist = waitlistRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.WAITLIST_NOT_FOUND));
        return enrichResponses(Collections.singletonList(waitlist)).get(0);
    }

    @Override
    public WaitlistResponse convertToReservation(Long id, ConvertWaitlistRequest request, UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        Waitlist waitlist = waitlistRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.WAITLIST_NOT_FOUND));

        if (waitlist.getStatus() != WaitlistStatus.CONTACTING) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Chỉ có thể tạo đơn đặt cọc khi đang ở trạng thái Tư vấn (CONTACTING)");
        }
        if (waitlist.getAssignedFmId() != null && !waitlist.getAssignedFmId().equals(currentUser.getId())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không phải nhân sự đang giữ quyền tư vấn đơn này");
        }

        // Xác định ngày bắt đầu và số tháng thuê thỏa thuận
        LocalDate startDate = (request != null && request.getStartDate() != null)
                ? request.getStartDate()
                : waitlist.getTargetStartDate();
        if (startDate.isBefore(LocalDate.now())) {
            startDate = LocalDate.now();
        }

        int months = (request != null && request.getRentalMonths() != null && request.getRentalMonths() > 0)
                ? request.getRentalMonths()
                : waitlist.getRentalMonths();
        LocalDate endDateExclusive = startDate.plusMonths(months);

        PolicyVersion policy = requireActivePolicy();
        int bufferDays = policy.getRentalBufferDays() != null ? policy.getRentalBufferDays() : 0;

        // Guardrail Sống còn: Capacity Check kiểm tra dung lượng thực tế
        storageUnitRepository.lockExploitableUnitIds(waitlist.getFacilityId(), waitlist.getUnitTypeId());
        long exploitable = storageUnitRepository.countExploitableUnits(
                waitlist.getFacilityId(), waitlist.getUnitTypeId(),
                Arrays.asList(StorageUnitStatus.MAINTENANCE, StorageUnitStatus.OUT_OF_SERVICE));
        long busy = storageUnitRepository.countBusyUnits(
                waitlist.getFacilityId(), waitlist.getUnitTypeId(), startDate, endDateExclusive, bufferDays);
        long unassigned = reservationRepository.countUnassignedOverlappingReservations(
                waitlist.getFacilityId(), waitlist.getUnitTypeId(), startDate, endDateExclusive,
                OffsetDateTime.now(ZoneOffset.UTC), bufferDays);

        if (unassigned > 0 || (exploitable - busy - unassigned) <= 0) {
            // Không chuyển trạng thái sang CONVERTED! Giữ nguyên CONTACTING và ném HTTP 409
            throw new CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE,
                    "Không thể chuyển đổi cho Danh sách chờ: Hiện có " + unassigned
                            + " đơn đặt chỗ của khách đặt trước chưa được gán ô kho. Theo quy chế ưu tiên, Quản lý phải hoàn tất gán ô kho cho khách đặt trước tại mục 'Gán ô kho'!");
        }

        // Tính toán biểu giá
        long monthlyPrice = lookupMonthlyPrice(waitlist.getFacilityId(), waitlist.getUnitTypeId());
        BigDecimal multiplier = policy.getDepositMultiplier() != null ? policy.getDepositMultiplier() : BigDecimal.ONE;
        long rawRent = monthlyPrice * months;
        long deposit = Math.round((monthlyPrice * multiplier.doubleValue()) / 1000.0) * 1000;
        long totalPayable = rawRent + deposit;

        // Khởi tạo đơn Reservation với thời hạn giữ cọc 24 giờ (BR-WAT-03)
        Reservation reservation = new Reservation();
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
        reservation.setCode("RSV-" + datePart + "-" + randomSuffix);
        reservation.setCustomerId(waitlist.getCustomerId());
        reservation.setFacilityId(waitlist.getFacilityId());
        reservation.setUnitTypeId(waitlist.getUnitTypeId());
        reservation.setStorageUnitId(null); // Late binding allocation
        reservation.setStartDate(startDate);
        reservation.setRentalMonths(months);
        reservation.setEndDateExclusive(endDateExclusive);
        reservation.setMonthlyPriceSnapshot(monthlyPrice);
        reservation.setPolicyVersionId(policy.getId());
        reservation.setDiscountAmount(0L);
        reservation.setDepositAmount(deposit);
        reservation.setTotalRentalFee(rawRent);
        reservation.setTotalPayable(totalPayable);
        reservation.setStatus(ReservationStatus.PENDING_PAYMENT);
        reservation.setHoldExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusHours(24));

        Reservation savedReservation = reservationRepository.save(reservation);

        // Cập nhật Waitlist
        waitlist.setStatus(WaitlistStatus.CONVERTED);
        waitlist.setConvertedReservationId(savedReservation.getId());
        waitlist.setContactTimeoutAt(null);
        Waitlist savedWaitlist = waitlistRepository.save(waitlist);

        return enrichResponses(Collections.singletonList(savedWaitlist)).get(0);
    }

    @Override
    public WaitlistResponse convertToContract(Long id, ConvertWaitlistToContractRequest request, UserPrincipal currentUser) {
        Waitlist waitlist = findWaitlistAndVerifyFm(id, currentUser);
        if (waitlist.getStatus() != WaitlistStatus.CONTACTING && waitlist.getStatus() != WaitlistStatus.WAITING && waitlist.getStatus() != WaitlistStatus.PENDING_FOLLOW_UP) {
            throw new CustomException(ErrorCode.WAITLIST_NOT_CONTACTING, "Chỉ có thể tạo hợp đồng cho đơn chờ đang ở trạng thái xử lý");
        }

        LocalDate startDate = (request != null && request.getStartDate() != null)
                ? request.getStartDate()
                : waitlist.getTargetStartDate();
        if (startDate.isBefore(LocalDate.now())) {
            startDate = LocalDate.now();
        }

        int months = (request != null && request.getRentalMonths() != null && request.getRentalMonths() > 0)
                ? request.getRentalMonths()
                : waitlist.getRentalMonths();

        // Quy tắc ưu tiên sống còn: Kiểm tra đơn đặt trước chưa gán ô kho và năng lực khả dụng
        PolicyVersion policy = requireActivePolicy();
        int bufferDays = policy.getRentalBufferDays() != null ? policy.getRentalBufferDays() : 0;
        storageUnitRepository.lockExploitableUnitIds(waitlist.getFacilityId(), waitlist.getUnitTypeId());
        long exploitable = storageUnitRepository.countExploitableUnits(
                waitlist.getFacilityId(), waitlist.getUnitTypeId(),
                Arrays.asList(StorageUnitStatus.MAINTENANCE, StorageUnitStatus.OUT_OF_SERVICE));
        long busy = storageUnitRepository.countBusyUnits(
                waitlist.getFacilityId(), waitlist.getUnitTypeId(), startDate, startDate.plusMonths(months), bufferDays);
        long unassigned = reservationRepository.countUnassignedOverlappingReservations(
                waitlist.getFacilityId(), waitlist.getUnitTypeId(), startDate, startDate.plusMonths(months),
                OffsetDateTime.now(ZoneOffset.UTC), bufferDays);

        if (unassigned > 0 || (exploitable - busy - unassigned) <= 0) {
            throw new CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE,
                    "Không thể tạo hợp đồng cho Danh sách chờ: Hiện có " + unassigned
                            + " đơn đặt chỗ của khách đặt trước chưa được gán ô kho. Theo quy chế ưu tiên, Quản lý phải hoàn tất gán ô kho cho khách đặt trước tại mục 'Gán ô kho'!");
        }

        if (contractService == null) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "Dịch vụ hợp đồng chưa sẵn sàng");
        }

        String phone = (request != null && request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank())
                ? request.getCustomerPhone().trim()
                : waitlist.getContactPhone();

        CreateDirectContractRequest directRequest = CreateDirectContractRequest.builder()
                .customerId(waitlist.getCustomerId())
                .customerPhone(phone)
                .facilityId(waitlist.getFacilityId())
                .unitTypeId(waitlist.getUnitTypeId())
                .storageUnitId(request != null ? request.getStorageUnitId() : null)
                .startDate(startDate)
                .rentalMonths(months)
                .paymentMethod(request != null && request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH")
                .waitlistId(waitlist.getId())
                .notes(request != null ? request.getNotes() : waitlist.getContactNotes())
                .build();

        contractService.createDirectContract(directRequest, currentUser);

        Waitlist updated = waitlistRepository.findById(id).orElse(waitlist);
        return enrichResponses(Collections.singletonList(updated)).get(0);
    }

    @Override
    public WaitlistResponse reject(Long id, RejectWaitlistRequest request, UserPrincipal currentUser) {
        Waitlist waitlist = findWaitlistAndVerifyFm(id, currentUser);
        waitlist.setStatus(WaitlistStatus.REJECTED);
        if (request != null && request.getReason() != null) {
            waitlist.setContactNotes(request.getReason());
        }
        waitlist.setContactTimeoutAt(null);
        Waitlist saved = waitlistRepository.save(waitlist);
        return enrichResponses(Collections.singletonList(saved)).get(0);
    }

    @Override
    public WaitlistResponse followUp(Long id, FollowUpWaitlistRequest request, UserPrincipal currentUser) {
        Waitlist waitlist = findWaitlistAndVerifyFm(id, currentUser);
        waitlist.setStatus(WaitlistStatus.PENDING_FOLLOW_UP);
        if (request != null && request.getContactNotes() != null) {
            waitlist.setContactNotes(request.getContactNotes());
        }
        // Nhả khóa tư vấn để có thể liên hệ lại sau
        waitlist.setAssignedFmId(null);
        waitlist.setContactTimeoutAt(null);
        Waitlist saved = waitlistRepository.save(waitlist);
        return enrichResponses(Collections.singletonList(saved)).get(0);
    }

    @Override
    public int cleanupExpiredLocks() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return waitlistRepository.unlockExpiredContacting(WaitlistStatus.WAITING, WaitlistStatus.CONTACTING, now);
    }

    // --- Helper Methods ---

    private Waitlist findWaitlistAndVerifyOwner(Long id, UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        Waitlist waitlist = waitlistRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.WAITLIST_NOT_FOUND));
        if (!waitlist.getCustomerId().equals(currentUser.getId())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        return waitlist;
    }

    private Waitlist findWaitlistAndVerifyFm(Long id, UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        Waitlist waitlist = waitlistRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.WAITLIST_NOT_FOUND));
        if (waitlist.getStatus() != WaitlistStatus.CONTACTING) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Thao tác chỉ hợp lệ khi đang ở trạng thái CONTACTING");
        }
        if (waitlist.getAssignedFmId() != null && !waitlist.getAssignedFmId().equals(currentUser.getId())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không phải nhân sự đang giữ quyền tư vấn đơn này");
        }
        return waitlist;
    }

    private PolicyVersion requireActivePolicy() {
        return policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now(ZoneOffset.UTC))
                .orElseThrow(() -> new CustomException(ErrorCode.POLICY_NOT_FOUND));
    }

    private long lookupMonthlyPrice(Long facilityId, Long unitTypeId) {
        if (appliedPriceLookup != null) {
            return appliedPriceLookup.resolveMonthlyPrice(facilityId, unitTypeId)
                    .filter(p -> p > 0)
                    .orElse(0L);
        }
        if (facilityUnitTypePriceRepository != null) {
            return facilityUnitTypePriceRepository
                    .findByFacilityIdAndUnitTypeId(facilityId, unitTypeId)
                    .map(FacilityUnitTypePrice::getMonthlyPrice)
                    .orElse(0L);
        }
        return 0L;
    }

    private List<WaitlistResponse> enrichResponses(List<Waitlist> list) {
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }

        // Cache pre-fetching
        List<Long> customerIds = list.stream().map(Waitlist::getCustomerId).distinct().collect(Collectors.toList());
        List<Long> facilityIds = list.stream().map(Waitlist::getFacilityId).distinct().collect(Collectors.toList());
        List<Long> unitTypeIds = list.stream().map(Waitlist::getUnitTypeId).distinct().collect(Collectors.toList());
        List<Long> fmIds = list.stream().map(Waitlist::getAssignedFmId).filter(id -> id != null).distinct().collect(Collectors.toList());
        List<Long> rsvIds = list.stream().map(Waitlist::getConvertedReservationId).filter(id -> id != null).distinct().collect(Collectors.toList());

        Map<Long, AppUser> userMap = userRepository.findAllById(customerIds).stream()
                .collect(Collectors.toMap(AppUser::getId, u -> u));
        Map<Long, AppUser> fmMap = userRepository.findAllById(fmIds).stream()
                .collect(Collectors.toMap(AppUser::getId, u -> u));
        Map<Long, Facility> facilityMap = facilityRepository.findAllById(facilityIds).stream()
                .collect(Collectors.toMap(Facility::getId, f -> f));
        Map<Long, UnitType> unitTypeMap = unitTypeRepository.findAllById(unitTypeIds).stream()
                .collect(Collectors.toMap(UnitType::getId, u -> u));
        Map<Long, Reservation> rsvMap = reservationRepository.findAllById(rsvIds).stream()
                .collect(Collectors.toMap(Reservation::getId, r -> r));

        PolicyVersion policy = policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now(ZoneOffset.UTC))
                .orElse(null);
        int bufferDays = (policy != null && policy.getRentalBufferDays() != null) ? policy.getRentalBufferDays() : 0;

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        return list.stream().map(w -> {
            AppUser customer = userMap.get(w.getCustomerId());
            AppUser fm = fmMap.get(w.getAssignedFmId());
            Facility facility = facilityMap.get(w.getFacilityId());
            UnitType unitType = unitTypeMap.get(w.getUnitTypeId());
            Reservation rsv = rsvMap.get(w.getConvertedReservationId());

            // Tính Available Capacity hiện tại cho Hạng kho này
            long available = 0L;
            long unassignedCount = 0L;
            if (storageUnitRepository != null) {
                LocalDate start = LocalDate.now();
                LocalDate end = start.plusMonths(Math.max(1, w.getRentalMonths()));
                long exploitable = storageUnitRepository.countExploitableUnits(
                        w.getFacilityId(), w.getUnitTypeId(),
                        Arrays.asList(StorageUnitStatus.MAINTENANCE, StorageUnitStatus.OUT_OF_SERVICE));
                long busy = storageUnitRepository.countBusyUnits(
                        w.getFacilityId(), w.getUnitTypeId(), start, end, bufferDays);
                long unassigned = reservationRepository.countUnassignedOverlappingReservations(
                        w.getFacilityId(), w.getUnitTypeId(), start, end, now, bufferDays);
                unassignedCount = unassigned;
                available = Math.max(0, exploitable - busy - unassigned);
            }

            Long remainingSecs = null;
            if (w.getStatus() == WaitlistStatus.CONTACTING && w.getContactTimeoutAt() != null) {
                remainingSecs = Math.max(0, Duration.between(now, w.getContactTimeoutAt()).getSeconds());
            }

            String effectivePhone = w.getContactPhone() != null ? w.getContactPhone() : (customer != null ? customer.getPhone() : null);

            return WaitlistResponse.builder()
                    .id(w.getId())
                    .customerId(w.getCustomerId())
                    .customerName(customer != null ? customer.getFullName() : null)
                    .customerPhone(effectivePhone)
                    .contactPhone(w.getContactPhone())
                    .customerEmail(customer != null ? customer.getEmail() : null)
                    .facilityId(w.getFacilityId())
                    .facilityName(facility != null ? facility.getName() : null)
                    .unitTypeId(w.getUnitTypeId())
                    .unitTypeCode(unitType != null ? unitType.getCode() : null)
                    .unitTypeName(unitType != null ? unitType.getName() : null)
                    .targetStartDate(w.getTargetStartDate())
                    .rentalMonths(w.getRentalMonths())
                    .status(w.getStatus())
                    .assignedFmId(w.getAssignedFmId())
                    .assignedFmName(fm != null ? fm.getFullName() : null)
                    .lastContactedAt(w.getLastContactedAt())
                    .contactTimeoutAt(w.getContactTimeoutAt())
                    .contactNotes(w.getContactNotes())
                    .convertedReservationId(w.getConvertedReservationId())
                    .convertedReservationCode(rsv != null ? rsv.getCode() : null)
                    .convertedContractId(w.getConvertedContractId())
                    .availableCapacity(available)
                    .unassignedReservationCount(unassignedCount)
                    .remainingTimeoutSeconds(remainingSecs)
                    .createdAt(w.getCreatedAt())
                    .updatedAt(w.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    private WaitlistResponse mapToResponse(Waitlist w, AppUser customer, Facility facility, UnitType unitType) {
        String effectivePhone = w.getContactPhone() != null ? w.getContactPhone() : (customer != null ? customer.getPhone() : null);
        return WaitlistResponse.builder()
                .id(w.getId())
                .customerId(w.getCustomerId())
                .customerName(customer != null ? customer.getFullName() : null)
                .customerPhone(effectivePhone)
                .contactPhone(w.getContactPhone())
                .customerEmail(customer != null ? customer.getEmail() : null)
                .facilityId(w.getFacilityId())
                .facilityName(facility != null ? facility.getName() : null)
                .unitTypeId(w.getUnitTypeId())
                .unitTypeCode(unitType != null ? unitType.getCode() : null)
                .unitTypeName(unitType != null ? unitType.getName() : null)
                .targetStartDate(w.getTargetStartDate())
                .rentalMonths(w.getRentalMonths())
                .status(w.getStatus())
                .assignedFmId(w.getAssignedFmId())
                .lastContactedAt(w.getLastContactedAt())
                .contactTimeoutAt(w.getContactTimeoutAt())
                .contactNotes(w.getContactNotes())
                .convertedReservationId(w.getConvertedReservationId())
                .convertedContractId(w.getConvertedContractId())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}

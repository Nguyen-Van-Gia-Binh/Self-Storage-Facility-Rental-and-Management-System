package com.swp391.selfstorage.contract.service.impl;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.event.ContractSettledEvent;
import com.swp391.selfstorage.contract.repository.*;
import com.swp391.selfstorage.contract.service.ContractService;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.support.entity.AssignmentTaskType;
import com.swp391.selfstorage.support.entity.StaffDailyAssignment;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportRequest;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import com.swp391.selfstorage.policy.entity.ExtraFeeType;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.ExtraFeeTypeRepository;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import com.swp391.selfstorage.policy.service.PolicyNumbers;
import com.swp391.selfstorage.policy.service.SurchargeAmountCalculator;
import com.swp391.selfstorage.payment.constant.PaymentStatus;
import com.swp391.selfstorage.payment.constant.PaymentTransactionType;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.waitlist.entity.Waitlist;
import com.swp391.selfstorage.waitlist.entity.WaitlistStatus;
import com.swp391.selfstorage.waitlist.repository.WaitlistRepository;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.service.AuditLogService;
import com.swp391.selfstorage.user.service.UserService;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import com.swp391.selfstorage.reservation.dto.CancelReservationRequest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractServiceImpl implements ContractService {

        private final RentalContractRepository contractRepository;
        private final HandoverRecordRepository handoverRecordRepository;
        private final ReservationRepository reservationRepository;
        private final StorageUnitRepository storageUnitRepository;
        private final ReturnRequestRepository returnRequestRepository;
        private final ContractExtraChargeRepository extraChargeRepository;
        private final ApplicationEventPublisher eventPublisher;

        @Autowired(required = false)
        private FacilityRepository facilityRepository;

        @Autowired(required = false)
        private UnitTypeRepository unitTypeRepository;

        @Autowired(required = false)
        private UserService userService;

        @Autowired(required = false)
        private UserRepository userRepository;

        @Autowired(required = false)
        private PasswordEncoder passwordEncoder;

        @Autowired(required = false)
        private UserFacilityAssignmentRepository userFacilityAssignmentRepository;

        @Autowired(required = false)
        private StaffDailyAssignmentRepository staffDailyAssignmentRepository;

        @Autowired(required = false)
        private PolicyVersionRepository policyVersionRepository;

        @Autowired(required = false)
        private SupportRequestRepository supportRequestRepository;

        @Autowired(required = false)
        private ExtraFeeTypeRepository extraFeeTypeRepository;

	@Autowired(required = false)
	private PaymentTransactionRepository paymentTransactionRepository;

        @Autowired(required = false)
        private AuditLogService auditLogService;

        @Autowired(required = false)
        private WaitlistRepository waitlistRepository;

        @Autowired(required = false)
        private AppliedPriceLookup appliedPriceLookup;

        @Autowired(required = false)
        private FacilityUnitTypePriceRepository facilityUnitTypePriceRepository;

        private static final List<SupportStatus> RELOCATION_TICKET_STATUSES = List.of(
                        SupportStatus.NEW, SupportStatus.ASSIGNED, SupportStatus.IN_PROGRESS, SupportStatus.RESOLVED, SupportStatus.CLOSED);

        private static final String LEGACY_DAMAGE_REASON = "Bồi thường hư hại ô kho";
        private static final Set<String> INSPECTION_FEE_CATEGORIES = Set.of("CLEANING", "DAMAGE");
        private static final Set<String> RENTAL_FEE_CATEGORIES = Set.of("ACCESS_KEY", "VALUE_ADDED", "CLEANING", "DAMAGE");

        @Override
        @Transactional
        public ContractResponse createFromReservation(Long reservationId) {
                var rsv = reservationRepository.findById(reservationId)
                                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

                // Idempotent: tra ve Contract hien co neu da tao (event trung lap)
                Optional<RentalContract> existing = contractRepository.findByReservationId(reservationId);
                if (existing.isPresent())
                        return toResponse(existing.get());

                String code = "CTR-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                                + "-" + ThreadLocalRandom.current().nextInt(1000, 9999);

                Long policyVersionId = rsv.getPolicyVersionId() != null ? rsv.getPolicyVersionId() : 1L;
                PolicyVersion lockedPolicy = policyVersionRepository != null
                                ? policyVersionRepository.findById(policyVersionId).orElse(null)
                                : null;
                int checkinGraceDays = lockedPolicy != null && lockedPolicy.getCheckinGraceDays() != null
                                ? lockedPolicy.getCheckinGraceDays()
                                : 10;
                int accessPinLength = lockedPolicy != null && lockedPolicy.getAccessPinLength() != null
                                ? lockedPolicy.getAccessPinLength()
                                : 6;
                String snapshot = String.format(
                                "{\"policyVersionId\":%d,\"checkinGraceDays\":%d,\"accessPinLength\":%d}",
                                policyVersionId, checkinGraceDays, accessPinLength);

                RentalContract contract = RentalContract.builder()
                                .code(code)
                                .reservationId(rsv.getId())
                                .customerId(rsv.getCustomerId())
                                .customerName(rsv.getCustomerName())
                                .customerPhone(rsv.getCustomerPhone())
                                .customerEmail(rsv.getCustomerEmail())
                                .customerIdentityNumber(rsv.getCustomerIdentityNumber())
                                .facilityId(rsv.getFacilityId())
                                .storageUnitId(rsv.getStorageUnitId())
                                .unitTypeId(rsv.getUnitTypeId())
                                .startDate(rsv.getStartDate())
                                .endDateExclusive(rsv.getEndDateExclusive())
                                .rentalMonths(rsv.getRentalMonths())
                                .monthlyPrice(rsv.getMonthlyPriceSnapshot())
                                .totalRentalFee(rsv.getTotalRentalFee())
                                .depositAmount(rsv.getDepositAmount())
                                .depositBalance(rsv.getDepositAmount())
                                .status(ContractStatus.PENDING_CHECK_IN)
                                .policySnapshot(snapshot)
                                .policyVersionId(policyVersionId)
                                .build();

                return toResponse(contractRepository.save(contract));
        }

        @Override
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void ensureContractForPaidReservation(Long reservationId) {
                createFromReservation(reservationId);
        }

        @Override
        @Transactional(readOnly = true)
        public ContractResponse getContractById(Long contractId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                return contractOpt.map(this::toResponse)
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));
        }

        @Override
        @Transactional(timeout = 5)
        public CheckInResponse checkIn(Long contractId, CheckInRequest request,
                        Long staffId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() != ContractStatus.PENDING_CHECK_IN)
                        throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_CHECKIN);
                if (contract.getStorageUnitId() == null)
                        throw new CustomException(ErrorCode.UNIT_NOT_YET_ALLOCATED);

                // Khách hàng tự check-in online không được check-in trước ngày bắt đầu hợp đồng
                boolean isCustomerOnlineCheckIn = staffId != null && Objects.equals(staffId, contract.getCustomerId());
                if (isCustomerOnlineCheckIn && contract.getStartDate() != null && LocalDate.now().isBefore(contract.getStartDate())) {
                        throw new CustomException(ErrorCode.CHECKIN_BEFORE_START_DATE,
                                        "Chưa đến ngày nhận kho trên hợp đồng (" + contract.getStartDate() + "). Quý khách chỉ có thể check-in online từ ngày bắt đầu hợp đồng.");
                }

                String pin = generateUniquePin(PolicyNumbers.snapshotInt(contract.getPolicySnapshot(), "accessPinLength", 6));
                contract.setAccessCode(pin);
                contract.setStatus(ContractStatus.ACTIVE);
                contract.setCheckinDate(request.getCheckinDate());
                contractRepository.save(contract);

                if (contract.getStorageUnitId() != null) {
                        storageUnitRepository.findByIdForUpdate(contract.getStorageUnitId()).ifPresent(unit -> {
                                unit.setStatus(StorageUnitStatus.OCCUPIED);
                                storageUnitRepository.save(unit);
                        });
                }

                String conditionText = (request.getConditionNote() != null && !request.getConditionNote().isBlank())
                                ? request.getConditionNote()
                                : request.getNotes();
                // Upsert: Cập nhật nếu đã có record trước đó (ví dụ từ chối nhận kho trước khi đổi ô)
                HandoverRecord checkinRecord = handoverRecordRepository.findByContractId(contractId)
                                .orElse(HandoverRecord.builder().contractId(contractId).build());

                Long effectiveStaffId = staffId;
                if (staffId != null && Objects.equals(staffId, contract.getCustomerId())) {
                        // Customer self check-in online: retrieve assigned staff if FM had dispatched one
                        if (staffDailyAssignmentRepository != null) {
                                effectiveStaffId = staffDailyAssignmentRepository
                                                .findByReferenceTypeAndReferenceId("CONTRACT", contractId)
                                                .map(StaffDailyAssignment::getStaffId)
                                                .orElse(null);
                        } else {
                                effectiveStaffId = null;
                        }
                }
                checkinRecord.setStaffId(effectiveStaffId);
                checkinRecord.setHandoverAt(OffsetDateTime.now());
                checkinRecord.setConditionNote(conditionText);
                checkinRecord.setCustomerConfirmed(true);
                checkinRecord.setCustomerConfirmedAt(OffsetDateTime.now());
                checkinRecord.setRejected(false);
                checkinRecord.setRejectionReason(null);
                handoverRecordRepository.save(checkinRecord);

                reservationRepository.findById(contract.getReservationId()).ifPresent(rsv -> {
                        rsv.setStatus(ReservationStatus.FULFILLED);
                        reservationRepository.save(rsv);
                });

                return new CheckInResponse(contractId, ContractStatus.ACTIVE,
                                request.getCheckinDate(), pin);
        }

        @Override
        @Transactional
        public HandoverRejectionResponse rejectHandover(Long contractId, HandoverRejectionRequest request,
                        Long staffId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() != ContractStatus.PENDING_CHECK_IN)
                        throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_CHECKIN);

                Long oldUnitId = contract.getStorageUnitId();
                if (oldUnitId != null) {
                        storageUnitRepository.findByIdForUpdate(oldUnitId).ifPresent(unit -> {
                                unit.setStatus(StorageUnitStatus.MAINTENANCE);
                                storageUnitRepository.save(unit);
                        });
                }

                String action = (request != null && request.getRejectionAction() != null && !request.getRejectionAction().isBlank())
                                ? request.getRejectionAction().toUpperCase().trim()
                                : "RELOCATE";

                boolean isRelocate = "RELOCATE".equals(action);

                if (isRelocate) {
                        // NHÁNH 1: KHÁCH ĐỒNG Ý ĐỔI Ô KHO
                        // Giữ nguyên trạng thái PENDING_CHECK_IN để khách tiếp tục thuê
                        contract.setStatus(ContractStatus.PENDING_CHECK_IN);
                        contractRepository.save(contract);

                        // Không tạo Ticket Sự Cố (SupportRequest) cho nhân viên trực bàn giao.
                        // Nhiệm vụ đổi ô kho mới thuộc thẩm quyền của Quản lý cơ sở (FM) trên sơ đồ 2D (Allocation Workbench).

                        // Upsert: cập nhật record cũ nếu đã tồn tại, tránh vi phạm uq_handover_record_contract_id
                        HandoverRecord relocateRecord = handoverRecordRepository.findByContractId(contractId)
                                        .orElse(HandoverRecord.builder().contractId(contractId).build());
                        relocateRecord.setStaffId(staffId);
                        relocateRecord.setHandoverAt(OffsetDateTime.now());
                        relocateRecord.setRejected(true);
                        relocateRecord.setRejectionReason(request.getRejectionReason());
                        relocateRecord.setConditionNote(request.getReportedDefects());
                        relocateRecord.setCustomerConfirmed(false);
                        relocateRecord.setCustomerConfirmedAt(null);
                        handoverRecordRepository.save(relocateRecord);

                        return new HandoverRejectionResponse(contractId, ContractStatus.PENDING_CHECK_IN,
                                        StorageUnitStatus.MAINTENANCE,
                                        "Đã ghi nhận sự cố ô kho. Hợp đồng đang chờ Quản lý (FM) phân bổ ô kho mới trên sơ đồ 2D.");
                } else {
                        // NHÁNH 2: KHÁCH HỦY THUÊ & HOÀN TIỀN 100%
                        contract.setStatus(ContractStatus.TERMINATED);
                        contract.setEndDateExclusive(LocalDate.now()); // Ngày kết thúc chính là ngày check-in!
                        contract.setRelocationSupportRequestId(null);
                        contractRepository.save(contract);

                        if (supportRequestRepository != null && contractId != null) {
                                List<SupportRequest> openTickets = supportRequestRepository.findByContractIdInAndStatusIn(
                                                List.of(contractId),
                                                List.of(SupportStatus.NEW, SupportStatus.ASSIGNED, SupportStatus.IN_PROGRESS, SupportStatus.RESOLVED));
                                if (openTickets != null) {
                                        for (SupportRequest openTicket : openTickets) {
                                                openTicket.setRelocationRequired(Boolean.FALSE);
                                                openTicket.setStatus(SupportStatus.CLOSED);
                                                openTicket.setUpdatedAt(OffsetDateTime.now());
                                                supportRequestRepository.save(openTicket);
                                        }
                                }
                        }

                        if (returnRequestRepository != null) {
                                returnRequestRepository.save(ReturnRequest.builder()
                                                .contractId(contractId)
                                                .requestedReturnDate(LocalDate.now())
                                                .status(ReturnRequestStatus.PENDING)
                                                .isIntact(false)
                                                .conditionNote("Hủy nhận kho do sự cố mặt bằng: " + request.getRejectionReason()
                                                                + (request.getReportedDefects() != null && !request.getReportedDefects().isBlank()
                                                                                ? " — " + request.getReportedDefects()
                                                                                : ""))
                                                .inspectedAt(OffsetDateTime.now())
                                                .inspectedBy(staffId)
                                                .damageCost(0L)
                                                .depositRefundAmount(contract.getDepositAmount())
                                                .build());
                        }

                        // Upsert: cập nhật record cũ nếu đã tồn tại, tránh vi phạm uq_handover_record_contract_id
                        HandoverRecord cancelRecord = handoverRecordRepository.findByContractId(contractId)
                                        .orElse(HandoverRecord.builder().contractId(contractId).build());
                        cancelRecord.setStaffId(staffId);
                        cancelRecord.setHandoverAt(OffsetDateTime.now());
                        cancelRecord.setRejected(true);
                        cancelRecord.setRejectionReason(request.getRejectionReason());
                        cancelRecord.setConditionNote(request.getReportedDefects());
                        cancelRecord.setCustomerConfirmed(false);
                        cancelRecord.setCustomerConfirmedAt(null);
                        handoverRecordRepository.save(cancelRecord);

                        return new HandoverRejectionResponse(contractId, ContractStatus.TERMINATED,
                                        StorageUnitStatus.MAINTENANCE,
                                        "Đã ghi nhận từ chối nhận kho. FM sẽ xử lý hoàn tiền 100% trong 3 ngày làm việc.");
                }
        }

        // ==========================================
        // T4.2: Facility Manager Tracking API
        // ==========================================

        @Override
        @Transactional(readOnly = true)
        public PageResponse<ContractSummaryResponse> getContractsPage(ContractFilterRequest filter, Pageable pageable,
                        List<Long> facilityIds) {
                Specification<RentalContract> spec = (root, query, cb) -> {
                        var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

                        if (facilityIds != null && !facilityIds.isEmpty()) {
                                predicates.add(root.get("facilityId").in(facilityIds));
                        } else if (filter != null && filter.getFacilityId() != null) {
                                predicates.add(cb.equal(root.get("facilityId"), filter.getFacilityId()));
                        }

                        if (filter != null) {
                                if (filter.getStatus() != null) {
                                        predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                                }
                                if (filter.getCustomerId() != null) {
                                        predicates.add(cb.equal(root.get("customerId"), filter.getCustomerId()));
                                }
                                if (filter.getKeyword() != null && !filter.getKeyword().isBlank()) {
                                        predicates.add(cb.like(root.get("code"),
                                                        "%" + filter.getKeyword().trim() + "%"));
                                }
                                if (Boolean.TRUE.equals(filter.getExpiringSoon())) {
                                        LocalDate now = LocalDate.now();
                                        LocalDate threshold = now.plusDays(7);
                                        predicates.add(cb.equal(root.get("status"), ContractStatus.ACTIVE));
                                        predicates.add(cb.between(root.get("endDateExclusive"), now, threshold));
                                }
                        }
                        return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
                };

                Page<RentalContract> page = contractRepository.findAll(spec, pageable);
                List<RentalContract> contracts = page.getContent();
                if (contracts.isEmpty()) {
                        return new PageResponse<>(
                                        Collections.emptyList(),
                                        page.getNumber(),
                                        page.getSize(),
                                        page.getTotalElements(),
                                        page.getTotalPages());
                }

                LocalDate now = LocalDate.now();
                LocalDate threshold = now.plusDays(7);
                Map<Long, OverduePreviewRates> overdueRatesByPolicy = new HashMap<>();
                Map<Long, SupportRequest> relocationTickets = findRelocationTickets(contracts);

                // --- BATCH LOOKUP PATTERN (Tránh N+1 và RTT mạng) ---
                Set<Long> storageUnitIds = contracts.stream().map(RentalContract::getStorageUnitId).filter(Objects::nonNull).collect(Collectors.toSet());
                Set<Long> unitTypeIds = contracts.stream().map(RentalContract::getUnitTypeId).filter(Objects::nonNull).collect(Collectors.toSet());
                Set<Long> facilityIdsToLoad = contracts.stream().map(RentalContract::getFacilityId).filter(Objects::nonNull).collect(Collectors.toSet());
                Set<Long> customerIds = contracts.stream().map(RentalContract::getCustomerId).filter(Objects::nonNull).collect(Collectors.toSet());
                List<Long> contractIds = contracts.stream().map(RentalContract::getId).filter(Objects::nonNull).toList();

                Map<Long, StorageUnit> storageUnitMap = (storageUnitRepository != null && !storageUnitIds.isEmpty())
                                ? storageUnitRepository.findAllById(storageUnitIds).stream()
                                                .collect(Collectors.toMap(StorageUnit::getId, Function.identity(), (a, b) -> a))
                                : Collections.emptyMap();

                Map<Long, UnitType> unitTypeMap = (unitTypeRepository != null && !unitTypeIds.isEmpty())
                                ? unitTypeRepository.findAllById(unitTypeIds).stream()
                                                .collect(Collectors.toMap(UnitType::getId, Function.identity(), (a, b) -> a))
                                : Collections.emptyMap();

                Map<Long, Facility> facilityMap = (facilityRepository != null && !facilityIdsToLoad.isEmpty())
                                ? facilityRepository.findAllById(facilityIdsToLoad).stream()
                                                .collect(Collectors.toMap(Facility::getId, Function.identity(), (a, b) -> a))
                                : Collections.emptyMap();

                Map<Long, ReturnRequest> latestReturnRequestByContract = new HashMap<>();
                if (returnRequestRepository != null && !contractIds.isEmpty()) {
                        List<ReturnRequest> returnRequests = returnRequestRepository.findByContractIdInOrderByCreatedAtDesc(contractIds);
                        if (returnRequests != null && !returnRequests.isEmpty()) {
                                for (ReturnRequest req : returnRequests) {
                                        latestReturnRequestByContract.putIfAbsent(req.getContractId(), req);
                                }
                        } else {
                                for (Long cId : contractIds) {
                                        returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(cId)
                                                        .ifPresent(req -> latestReturnRequestByContract.put(cId, req));
                                }
                        }
                }

                Map<Long, StaffDailyAssignment> assignmentByContract = new HashMap<>();
                if (staffDailyAssignmentRepository != null && !contractIds.isEmpty()) {
                        List<StaffDailyAssignment> assignments = staffDailyAssignmentRepository
                                        .findByReferenceTypeAndReferenceIdIn("CONTRACT", contractIds);
                        if (assignments != null && !assignments.isEmpty()) {
                                for (StaffDailyAssignment a : assignments) {
                                        if (a.getReferenceId() != null) {
                                                assignmentByContract.putIfAbsent(a.getReferenceId(), a);
                                        }
                                }
                        } else {
                                for (Long cId : contractIds) {
                                        staffDailyAssignmentRepository.findByReferenceTypeAndReferenceId("CONTRACT", cId)
                                                        .ifPresent(a -> assignmentByContract.put(cId, a));
                                }
                        }
                }

                Set<Long> userIdsToLoad = new HashSet<>(customerIds);
                latestReturnRequestByContract.values().forEach(req -> {
                        if (req.getInspectedBy() != null) userIdsToLoad.add(req.getInspectedBy());
                });
                assignmentByContract.values().forEach(assign -> {
                        if (assign.getStaffId() != null) userIdsToLoad.add(assign.getStaffId());
                });

                Map<Long, AppUser> userMap = (userRepository != null && !userIdsToLoad.isEmpty())
                                ? userRepository.findAllById(userIdsToLoad).stream()
                                                .collect(Collectors.toMap(AppUser::getId, Function.identity(), (a, b) -> a))
                                : Collections.emptyMap();

                Set<Long> rejectedHandoverContractIds = new HashSet<>();
                if (handoverRecordRepository != null && !contractIds.isEmpty()) {
                        handoverRecordRepository.findByContractIdIn(contractIds).stream()
                                        .filter(HandoverRecord::isRejected)
                                        .forEach(hr -> rejectedHandoverContractIds.add(hr.getContractId()));
                }

                List<ContractSummaryResponse> content = contracts.stream().map(c -> {
                        boolean nearExp = c.getStatus() == ContractStatus.ACTIVE
                                        && !c.getEndDateExclusive().isBefore(now)
                                        && !c.getEndDateExclusive().isAfter(threshold);

                        StorageUnit su = c.getStorageUnitId() != null ? storageUnitMap.get(c.getStorageUnitId()) : null;
                        boolean isRelocating = (c.getStatus() == ContractStatus.PENDING_CHECK_IN || c.getStatus() == ContractStatus.ACTIVE)
                                        && (relocationTickets.get(c.getId()) != null
                                                        || (su != null && su.getStatus() == StorageUnitStatus.MAINTENANCE)
                                                        || rejectedHandoverContractIds.contains(c.getId()));
                        String storageCode = (isRelocating && c.getStatus() == ContractStatus.PENDING_CHECK_IN)
                                        ? "Chờ gán lại ô kho"
                                        : (su != null ? su.getCode() : (c.getStorageUnitId() != null ? "U-" + c.getStorageUnitId() : "Chưa gán"));
                        Integer floor = su != null ? su.getFloor() : null;
                        String position = su != null ? su.getPosition() : null;

                        UnitType ut = c.getUnitTypeId() != null ? unitTypeMap.get(c.getUnitTypeId()) : null;
                        String unitName = ut != null ? ut.getName() : null;
                        String unitDimensions = ut != null ? String.format(java.util.Locale.US, "%.1fm x %.1fm x %.1fm",
                                        ut.getWidthM() != null ? ut.getWidthM().doubleValue() : 0.0,
                                        ut.getLengthM() != null ? ut.getLengthM().doubleValue() : 0.0,
                                        ut.getHeightM() != null ? ut.getHeightM().doubleValue() : 0.0) : null;

                        Facility f = c.getFacilityId() != null ? facilityMap.get(c.getFacilityId()) : null;
                        String facName = f != null ? f.getName() : null;
                        String facAddress = f != null ? f.getAddress() : null;
                        String facPhone = f != null ? f.getPhone() : null;

                        AppUser custUser = c.getCustomerId() != null ? userMap.get(c.getCustomerId()) : null;
                        String custName = custUser != null ? custUser.getFullName() : "Khách hàng #" + c.getCustomerId();
                        String custPhone = custUser != null && custUser.getPhone() != null ? custUser.getPhone() : "";
                        String custIdentity = custUser != null && custUser.getIdentityNumber() != null ? custUser.getIdentityNumber() : "";
                        String custEmail = custUser != null ? custUser.getEmail() : "";
                        if (custUser == null && userService != null && c.getCustomerId() != null) {
                                try {
                                        var userDto = userService.getUserById(c.getCustomerId());
                                        if (userDto != null) {
                                                custName = userDto.getFullName();
                                                custPhone = userDto.getPhone() != null ? userDto.getPhone() : "";
                                                custIdentity = userDto.getIdentityNumber() != null ? userDto.getIdentityNumber() : "";
                                                custEmail = userDto.getEmail();
                                        }
                                } catch (Exception ignored) {
                                }
                        }

                        Integer overdueDays = null;
                        Long accruedOverdueFee = c.getOverdueFeeAccrued();
                        if (c.getStatus() == ContractStatus.OVERDUE || 
                            (c.getEndDateExclusive() != null && LocalDate.now().isAfter(c.getEndDateExclusive()) 
                             && c.getStatus() != ContractStatus.CLOSED && c.getStatus() != ContractStatus.TERMINATED)) {
                                long days = java.time.temporal.ChronoUnit.DAYS.between(c.getEndDateExclusive(), LocalDate.now());
                                if (days > 0) {
                                        overdueDays = (int) days;
                                        long accrued = previewOverdueFee(days, c.getDepositAmount(),
                                                        overdueRatesFor(c, overdueRatesByPolicy));
                                        if (c.getStatus() == ContractStatus.OVERDUE
                                                        && (c.getOverdueFeeAccrued() > 0 || c.getAccessCode() != null)) {
                                                accruedOverdueFee = c.getOverdueFeeAccrued();
                                        } else if (accruedOverdueFee == null || accruedOverdueFee == 0) {
                                                accruedOverdueFee = accrued;
                                        }
                                }
                        }

                        ContractStatus displayStatus = c.getStatus();
                        Long assignedStaffId = null;
                        String assignedStaffName = null;
                        Boolean isInspected = false;
                        Long damageCost = 0L;
                        String damageNotes = null;
                        LocalDate requestedReturnDate = null;
                        OffsetDateTime returnRequestCreatedAt = null;
                        String appointmentSlot = null;
                        ReturnRequest returnReq = latestReturnRequestByContract.get(c.getId());
                        if (returnReq != null && c.getStatus() != ContractStatus.CLOSED) {
                                if (c.getStatus() != ContractStatus.TERMINATED) {
                                        requestedReturnDate = returnReq.getRequestedReturnDate();
                                        returnRequestCreatedAt = returnReq.getRequestedAt();
                                        appointmentSlot = returnReq.getAppointmentSlot();
                                        if (returnReq.getStatus() == ReturnRequestStatus.PENDING) {
                                                displayStatus = ContractStatus.PENDING_RETURN;
                                        }
                                }
                                if (returnReq.getInspectedAt() != null || c.getStatus() == ContractStatus.TERMINATED) {
                                        isInspected = returnReq.getInspectedAt() != null;
                                        damageCost = returnReq.getDamageCost();
                                        damageNotes = returnReq.getConditionNote();
                                }
                                if (returnReq.getInspectedBy() != null) {
                                        assignedStaffId = returnReq.getInspectedBy();
                                        AppUser staff = userMap.get(assignedStaffId);
                                        if (staff != null) {
                                                assignedStaffName = staff.getFullName();
                                        } else if (userService != null) {
                                                try {
                                                        var staffUser = userService.getUserById(assignedStaffId);
                                                        if (staffUser != null) {
                                                                assignedStaffName = staffUser.getFullName();
                                                        }
                                                } catch (Exception ignored) {
                                                }
                                        }
                                }
                        }

                        if (assignedStaffId == null && assignmentByContract.containsKey(c.getId())) {
                                StaffDailyAssignment assign = assignmentByContract.get(c.getId());
                                if (assign != null && assign.getStaffId() != null) {
                                        assignedStaffId = assign.getStaffId();
                                        AppUser staff = userMap.get(assignedStaffId);
                                        if (staff != null) {
                                                assignedStaffName = staff.getFullName();
                                        } else if (userService != null) {
                                                try {
                                                        var staffUser = userService.getUserById(assignedStaffId);
                                                        if (staffUser != null) {
                                                                assignedStaffName = staffUser.getFullName();
                                                        }
                                                } catch (Exception ignored) {
                                                }
                                        }
                                }
                        }

                        return ContractSummaryResponse.builder()
                                        .id(c.getId())
                                        .code(c.getCode())
                                        .reservationId(c.getReservationId())
                                        .customerId(c.getCustomerId())
                                        .customerName(custName)
                                        .customerPhone(custPhone)
                                        .customerIdentityNumber(custIdentity)
                                        .customerEmail(custEmail)
                                        .facilityId(c.getFacilityId())
                                        .facilityName(facName)
                                        .facilityAddress(facAddress)
                                        .facilityPhone(facPhone)
                                        .storageUnitId(c.getStorageUnitId())
                                        .storageUnitCode(storageCode)
                                        .floor(floor)
                                        .position(position)
                                        .unitTypeId(c.getUnitTypeId())
                                        .unitTypeName(unitName)
                                        .unitDimensions(unitDimensions)
                                        .startDate(c.getStartDate())
                                        .endDateExclusive(c.getEndDateExclusive())
                                        .checkinGraceDays(resolveCheckinGraceDays(c))
                                        .rentalMonths(c.getRentalMonths())
                                        .monthlyPrice(c.getMonthlyPrice())
                                        .depositAmount(c.getDepositAmount())
                                        .depositBalance(c.getDepositBalance())
                                        .status(displayStatus)
                                        .nearExpiration(nearExp)
                                        .overdueDays(overdueDays)
                                        .accruedOverdueFee(accruedOverdueFee)
                                        .assignedStaffId(assignedStaffId)
                                        .assignedStaffName(assignedStaffName)
                                        .isInspected(isInspected)
                                        .damageCost(damageCost)
                                        .damageNotes(damageNotes)
                                        .relocationEligible(isRelocating)
                                        .openSupportRequestId(relocationTickets.containsKey(c.getId())
                                                        ? relocationTickets.get(c.getId()).getId()
                                                        : null)
                                        .requestedReturnDate(requestedReturnDate)
                                        .appointmentSlot(appointmentSlot)
                                        .rescheduleCount(c.getRescheduleCount())
                                        .rescheduledAt(c.getRescheduledAt())
                                        .createdAt(c.getCreatedAt())
                                        .returnRequestCreatedAt(returnRequestCreatedAt)
                                        .build();
                }).toList();

                return new PageResponse<>(
                                content,
                                page.getNumber(),
                                page.getSize(),
                                page.getTotalElements(),
                                page.getTotalPages());
        }

        @Override
        @Transactional(readOnly = true)
        public ContractFinancialSummaryResponse getContractFinancialSummary(Long contractId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                List<ContractExtraCharge> charges = extraChargeRepository.findByContractId(contractId);
                long unpaidCharges = charges.stream()
                                .filter(ch -> ch.getStatus() == ExtraChargeStatus.UNPAID)
                                .mapToLong(ContractExtraCharge::getAmount)
                                .sum();

                List<ContractFinancialSummaryResponse.ExtraChargeItemDto> chargeDtos = charges.stream()
                                .map(ch -> ContractFinancialSummaryResponse.ExtraChargeItemDto.builder()
                                                .id(ch.getId())
                                                .amount(ch.getAmount())
                                                .reason(ch.getReason())
                                                .status(ch.getStatus().name())
                                                .build())
                                .toList();

                String custName = "Khách hàng #" + contract.getCustomerId();
                String custPhone = "";
                if (userService != null && contract.getCustomerId() != null) {
                        try {
                                var userDto = userService.getUserById(contract.getCustomerId());
                                if (userDto != null) {
                                        custName = userDto.getFullName();
                                        custPhone = userDto.getPhone();
                                }
                        } catch (Exception ignored) {
                        }
                }

                return ContractFinancialSummaryResponse.builder()
                                .contractId(contract.getId())
                                .contractCode(contract.getCode())
                                .customerName(custName)
                                .customerPhone(custPhone)
                                .depositAmount(contract.getDepositAmount())
                                .depositBalance(contract.getDepositBalance())
                                .totalRentalFee(contract.getTotalRentalFee())
                                .overdueFeeAccrued(contract.getOverdueFeeAccrued())
                                .totalUnpaidExtraCharges(unpaidCharges)
                                .totalOutstandingDebt(contract.getOverdueFeeAccrued() + unpaidCharges)
                                .extraCharges(chargeDtos)
                                .build();
        }

        @Override
        @Transactional
        public ContractSummaryResponse reassignUnit(Long contractId, ReassignUnitRequest request, Long managerId,
                        List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() != ContractStatus.PENDING_CHECK_IN && contract.getStatus() != ContractStatus.ACTIVE) {
                        if (contract.getStatus() == ContractStatus.TERMINATED && Boolean.TRUE.equals(request.getCustomerConsent())) {
                                contract.setStatus(ContractStatus.PENDING_CHECK_IN);
                                if (contract.getStartDate() != null && contract.getRentalMonths() > 0) {
                                        contract.setEndDateExclusive(contract.getStartDate().plusMonths(contract.getRentalMonths()));
                                }
                        } else {
                                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                                "Chỉ có thể đổi ô kho cho hợp đồng đang chờ nhận kho hoặc đang hoạt động.");
                        }
                }

                SupportRequest ticket = null;
                if (request.getSupportRequestId() != null && supportRequestRepository != null) {
                        ticket = supportRequestRepository.findById(request.getSupportRequestId()).orElse(null);
                        if (ticket != null && ticket.getContractId() != null && !ticket.getContractId().equals(contract.getId())) {
                                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Phiếu sự cố không thuộc hợp đồng này.");
                        }
                }
                if (ticket == null && supportRequestRepository != null) {
                        ticket = supportRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId).orElse(null);
                }
                if (ticket == null && contract.getStorageUnitId() != null && supportRequestRepository != null) {
                        ticket = supportRequestRepository.findByStorageUnitIdInAndStatusIn(
                                        List.of(contract.getStorageUnitId()), RELOCATION_TICKET_STATUSES).stream().findFirst().orElse(null);
                }
                if (contract.getStatus() == ContractStatus.PENDING_CHECK_IN
                                && !Boolean.TRUE.equals(request.getCustomerConsent())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Cần ghi nhận khách đã đồng ý đổi ô trước khi nhận kho.");
                }
                if (contract.getStatus() == ContractStatus.ACTIVE
                                && (ticket == null || !Boolean.TRUE.equals(ticket.getRelocationRequired()))) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Phiếu hư hỏng chưa được đánh dấu cần di dời.");
                }

                if (contract.getStorageUnitId().equals(request.getNewStorageUnitId())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ô kho mới trùng với ô kho hiện tại.");
                }

                StorageUnit newUnit = storageUnitRepository.findByIdForUpdate(request.getNewStorageUnitId())
                                .or(() -> storageUnitRepository.findById(request.getNewStorageUnitId()))
                                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND, "Không tìm thấy ô kho mới."));

                if (!newUnit.getFacilityId().equals(contract.getFacilityId())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ô kho mới phải thuộc cùng cơ sở với hợp đồng.");
                }

                if (newUnit.getStatus() != StorageUnitStatus.AVAILABLE) {
                        throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "Ô kho mới hiện không có sẵn (trạng thái: " + newUnit.getStatus() + ").");
                }

                Long oldUnitId = contract.getStorageUnitId();
                StorageUnit oldUnit = storageUnitRepository.findByIdForUpdate(oldUnitId)
                                .or(() -> storageUnitRepository.findById(oldUnitId))
                                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND, "Không tìm thấy ô kho hiện tại."));
                String oldCode = oldUnit.getCode() != null ? oldUnit.getCode() : ("U-" + oldUnitId);

                if (contract.getUnitTypeId() == null && oldUnit.getUnitTypeId() != null) {
                        contract.setUnitTypeId(oldUnit.getUnitTypeId());
                }

                boolean isSameType = contract.getUnitTypeId() != null && contract.getUnitTypeId().equals(newUnit.getUnitTypeId());
                boolean isUpgradeCompensation = false;
                UnitType newType = null;

                if (!isSameType) {
                        if (contract.getUnitTypeId() == null || newUnit.getUnitTypeId() == null) {
                                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Thông tin loại ô kho không hợp lệ.");
                        }

                        UnitType oldType = unitTypeRepository.findById(contract.getUnitTypeId())
                                        .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND, "Không tìm thấy loại ô kho hiện tại."));
                        newType = unitTypeRepository.findById(newUnit.getUnitTypeId())
                                        .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND, "Không tìm thấy loại ô kho mới."));

                        long availableSameType = storageUnitRepository.countByFacilityIdAndUnitTypeIdAndStatus(
                                        contract.getFacilityId(), contract.getUnitTypeId(), StorageUnitStatus.AVAILABLE);

                        if (availableSameType > 0) {
                                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                                "Cơ sở vẫn còn " + availableSameType + " ô kho trống cùng loại (" + oldType.getName() + "). Vui lòng chọn ô cùng loại cho khách hàng.");
                        }

                        // So sánh môi trường lưu trữ (phải cùng STANDARD hoặc CLIMATE_CONTROLLED)
                        String oldEnv = oldType.getEnvironment() != null ? oldType.getEnvironment().trim().toUpperCase() : "STANDARD";
                        String newEnv = newType.getEnvironment() != null ? newType.getEnvironment().trim().toUpperCase() : "STANDARD";
                        if (!oldEnv.equals(newEnv)) {
                                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                                "Chỉ được nâng hạng đền bù sang ô cùng môi trường lưu trữ (" + oldEnv + ").");
                        }

                        // So sánh diện tích (newArea > oldArea)
                        BigDecimal oldArea = (oldType.getWidthM() != null && oldType.getLengthM() != null)
                                        ? oldType.getWidthM().multiply(oldType.getLengthM())
                                        : BigDecimal.ZERO;
                        BigDecimal newArea = (newType.getWidthM() != null && newType.getLengthM() != null)
                                        ? newType.getWidthM().multiply(newType.getLengthM())
                                        : BigDecimal.ZERO;

                        if (newArea.compareTo(oldArea) <= 0) {
                                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                                "Khi hết ô cùng loại, chỉ được đổi sang ô có kích thước lớn hơn để nâng hạng đền bù cho khách (Diện tích mới: "
                                                                + newArea + " m² phải lớn hơn diện tích cũ: " + oldArea + " m²).");
                        }

                        isUpgradeCompensation = true;
                }

                if (ticket != null && ticket.getStorageUnitId() == null) {
                        ticket.setStorageUnitId(oldUnitId);
                }
                oldUnit.setStatus(StorageUnitStatus.MAINTENANCE);
                storageUnitRepository.save(oldUnit);

                if (contract.getStatus() == ContractStatus.PENDING_CHECK_IN) {
                        newUnit.setStatus(StorageUnitStatus.RESERVED);
                } else {
                        newUnit.setStatus(StorageUnitStatus.OCCUPIED);
                }
                storageUnitRepository.save(newUnit);

                // Sau khi Quản lý hoàn tất đổi ô kho cho hợp đồng:
                // 1. Nếu có phiếu sự cố: giải tỏa cờ yêu cầu di dời và chuyển sang CLOSED
                OffsetDateTime now = OffsetDateTime.now();
                if (ticket != null) {
                        ticket.setRelocationRequired(Boolean.FALSE);
                        ticket.setStatus(SupportStatus.CLOSED);
                        if (ticket.getResolvedAt() == null) {
                                ticket.setResolvedAt(now);
                        }
                        ticket.setCustomerConfirmedAt(now);
                        ticket.setUpdatedAt(now);

                        String oldResolutionNote = ticket.getResolutionNote() != null ? ticket.getResolutionNote() : "";
                        String relocationResolutionInfo = isUpgradeCompensation
                                        ? "\n[Quản lý cơ sở đã nâng hạng đền bù sang ô kho " + newUnit.getCode()
                                                        + (newType != null ? " (" + newType.getName() + ")" : "")
                                                        + " do hết ô cùng loại. Sự cố đã được xử lý và đóng.]"
                                        : "\n[Quản lý cơ sở đã hoàn tất đổi sang ô kho " + newUnit.getCode()
                                                        + ". Sự cố đã được xử lý và đóng.]";
                        ticket.setResolutionNote(oldResolutionNote + relocationResolutionInfo);

                        String notice = isUpgradeCompensation
                                        ? "Cơ sở đã nâng hạng đền bù đổi ô kho từ " + oldCode + " sang " + newUnit.getCode()
                                                        + (newType != null ? " (" + newType.getName() + ")" : "")
                                                        + " do hết ô cùng loại. Giá thuê và tiền cọc giữ nguyên."
                                        : "Cơ sở đã đổi ô kho từ " + oldCode + " sang " + newUnit.getCode()
                                                        + ". Giá thuê và tiền cọc giữ nguyên.";
                        if (notice.length() > 500) {
                                notice = notice.substring(0, 500);
                        }
                        ticket.setCustomerNotice(notice);
                        if (supportRequestRepository != null) {
                                supportRequestRepository.save(ticket);
                        }
                }

                // 2. Cập nhật HandoverRecord nếu có để giải tỏa cờ từ chối bàn giao
                if (handoverRecordRepository != null) {
                        handoverRecordRepository.findByContractId(contractId).ifPresent(hr -> {
                                if (hr.isRejected()) {
                                        hr.setRejected(false);
                                        hr.setRejectionReason(null);
                                        handoverRecordRepository.save(hr);
                                }
                        });
                }

                long monthlyPriceSnapshot = contract.getMonthlyPrice();
                long depositSnapshot = contract.getDepositAmount();
                contract.setStorageUnitId(newUnit.getId());
                contract.setUnitTypeId(newUnit.getUnitTypeId());
                contract.setRelocationSupportRequestId(ticket != null ? ticket.getId() : null);
                contract.setMonthlyPrice(monthlyPriceSnapshot);
                contract.setDepositAmount(depositSnapshot);
                contractRepository.save(contract);

                if (contract.getReservationId() != null && reservationRepository != null) {
                        reservationRepository.findById(contract.getReservationId()).ifPresent(rsv -> {
                                rsv.setStorageUnitId(newUnit.getId());
                                rsv.setUnitTypeId(newUnit.getUnitTypeId());
                                reservationRepository.save(rsv);
                        });
                }

                if (supportRequestRepository != null && contract.getId() != null) {
                        List<SupportRequest> otherOpenTickets = supportRequestRepository.findByContractIdInAndStatusIn(
                                        List.of(contract.getId()),
                                        List.of(SupportStatus.NEW, SupportStatus.ASSIGNED, SupportStatus.IN_PROGRESS, SupportStatus.RESOLVED));
                        if (otherOpenTickets != null) {
                                for (SupportRequest other : otherOpenTickets) {
                                        if (ticket == null || !Objects.equals(other.getId(), ticket.getId())) {
                                                other.setRelocationRequired(Boolean.FALSE);
                                                other.setStatus(SupportStatus.CLOSED);
                                                other.setUpdatedAt(now);
                                                supportRequestRepository.save(other);
                                        }
                                }
                        }
                }

                if (auditLogService != null) {
                        auditLogService.logAction(managerId, "REASSIGN_UNIT", "RENTAL_CONTRACT", contract.getId(),
                                        "unit:" + oldUnitId, "unit:" + newUnit.getId() + (ticket != null ? ",ticket:" + ticket.getId() : ""));
                }

                log.info("Manager {} đã đổi ô kho cho hợp đồng {} từ {} sang {}{}. Lý do: {}",
                                managerId, contract.getCode(), oldCode, newUnit.getCode(),
                                (ticket != null ? " theo phiếu " + ticket.getCode() : ""), request.getReason());

                String storageCode = newUnit.getCode();
                String unitName = (unitTypeRepository != null && contract.getUnitTypeId() != null)
                                ? unitTypeRepository.findById(contract.getUnitTypeId()).map(UnitType::getName).orElse(null)
                                : null;
                String facName = (facilityRepository != null && contract.getFacilityId() != null)
                                ? facilityRepository.findById(contract.getFacilityId()).map(Facility::getName).orElse(null)
                                : null;

                String custName = "Khách hàng #" + contract.getCustomerId();
                String custPhone = "";
                String custIdentity = "";
                String custEmail = "";
                if (userService != null && contract.getCustomerId() != null) {
                        try {
                                var userDto = userService.getUserById(contract.getCustomerId());
                                if (userDto != null) {
                                        custName = userDto.getFullName();
                                        custPhone = userDto.getPhone() != null ? userDto.getPhone() : "";
                                        custIdentity = userDto.getIdentityNumber() != null ? userDto.getIdentityNumber() : "";
                                        custEmail = userDto.getEmail();
                                }
                        } catch (Exception ignored) {
                        }
                }

                LocalDate today = LocalDate.now();
                LocalDate threshold = today.plusDays(7);
                boolean nearExp = contract.getStatus() == ContractStatus.ACTIVE
                                && !contract.getEndDateExclusive().isBefore(today)
                                && !contract.getEndDateExclusive().isAfter(threshold);

                return ContractSummaryResponse.builder()
                                .id(contract.getId())
                                .code(contract.getCode())
                                .reservationId(contract.getReservationId())
                                .customerId(contract.getCustomerId())
                                .customerName(custName)
                                .customerPhone(custPhone)
                                .customerIdentityNumber(custIdentity)
                                .customerEmail(custEmail)
                                .facilityId(contract.getFacilityId())
                                .facilityName(facName)
                                .storageUnitId(newUnit.getId())
                                .storageUnitCode(storageCode)
                                .unitTypeId(contract.getUnitTypeId())
                                .unitTypeName(unitName)
                                .startDate(contract.getStartDate())
                                .endDateExclusive(contract.getEndDateExclusive())
                                .checkinGraceDays(resolveCheckinGraceDays(contract))
                                .rentalMonths(contract.getRentalMonths())
                                .monthlyPrice(contract.getMonthlyPrice())
                                .depositAmount(contract.getDepositAmount())
                                .depositBalance(contract.getDepositBalance())
                                .status(contract.getStatus())
                                .nearExpiration(nearExp)
                                .relocationEligible(false)
                                .openSupportRequestId(null)
                                .rescheduleCount(contract.getRescheduleCount())
                                .rescheduledAt(contract.getRescheduledAt())
                                .build();
        }

        private Map<Long, SupportRequest> findRelocationTickets(List<RentalContract> contracts) {
                Map<Long, SupportRequest> result = new HashMap<>();
                if (supportRequestRepository == null || contracts == null || contracts.isEmpty()) {
                        return result;
                }
                List<Long> contractIds = contracts.stream().map(RentalContract::getId).filter(Objects::nonNull).distinct().toList();
                List<Long> unitIds = contracts.stream().map(RentalContract::getStorageUnitId).filter(Objects::nonNull).distinct().toList();
                Map<Long, SupportRequest> byId = new LinkedHashMap<>();
                if (!contractIds.isEmpty()) {
                        for (SupportRequest ticket : supportRequestRepository.findByContractIdInAndStatusIn(
                                        contractIds, RELOCATION_TICKET_STATUSES)) {
                                byId.putIfAbsent(ticket.getId(), ticket);
                        }
                }
                if (!unitIds.isEmpty()) {
                        for (SupportRequest ticket : supportRequestRepository.findByStorageUnitIdInAndStatusIn(
                                        unitIds, RELOCATION_TICKET_STATUSES)) {
                                byId.putIfAbsent(ticket.getId(), ticket);
                        }
                }
                for (RentalContract contract : contracts) {
                        if (contract.getStatus() != ContractStatus.PENDING_CHECK_IN
                                        && contract.getStatus() != ContractStatus.ACTIVE) {
                                continue;
                        }
                        SupportRequest best = null;
                        for (SupportRequest ticket : byId.values()) {
                                if (!ticketMatchesCurrentUnit(ticket, contract)) {
                                        continue;
                                }
                                if (!Boolean.TRUE.equals(ticket.getRelocationRequired())) {
                                        continue;
                                }
                                if (best == null || isNewerTicket(ticket, best)) {
                                        best = ticket;
                                }
                        }
                        if (best != null && contract.getId() != null) {
                                result.put(contract.getId(), best);
                        }
                }
                return result;
        }

        private static boolean ticketMatchesCurrentUnit(SupportRequest ticket, RentalContract contract) {
                if (ticket.getStorageUnitId() != null) {
                        return ticket.getStorageUnitId().equals(contract.getStorageUnitId());
                }
                return ticket.getContractId() != null && ticket.getContractId().equals(contract.getId());
        }

        private static boolean isNewerTicket(SupportRequest candidate, SupportRequest current) {
                if (candidate.getCreatedAt() == null) {
                        return false;
                }
                if (current.getCreatedAt() == null) {
                        return true;
                }
                return candidate.getCreatedAt().isAfter(current.getCreatedAt());
        }

        // ==========================================
        // T4.3: Return & Settlement Workflow
        // ==========================================

        @Override
        @Transactional
        public ReturnNoticeResponse submitReturnNotice(Long contractId, ReturnNoticeRequest request,
                        List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() != ContractStatus.ACTIVE && contract.getStatus() != ContractStatus.OVERDUE) {
                        throw new CustomException(ErrorCode.CONTRACT_NOT_ACTIVE_OR_OVERDUE);
                }

                if (contract.getStatus() == ContractStatus.OVERDUE && contract.getOverdueFeeAccrued() > 0) {
                        throw new CustomException(ErrorCode.MUST_SETTLE_OVERDUE_DEBT_FIRST);
                }

                LocalDate returnDate = request.getIntendedReturnDate() != null
                                ? request.getIntendedReturnDate()
                                : LocalDate.now();

                ReturnRequest returnRequest = ReturnRequest.builder()
                                .contractId(contract.getId())
                                .requestedReturnDate(returnDate)
                                .conditionNote(request.getNotes())
                                .status(ReturnRequestStatus.PENDING)
                                .build();

                ReturnRequest saved = returnRequestRepository.save(returnRequest);

                if (contract.getStatus() == ContractStatus.OVERDUE) {
                        // BR-OVD-08, BR-RET-10: Khách đang quá hạn bấm Báo trả kho (sau khi đã dọn sạch đồ) -> thu hồi mã PIN ngay
                        contract.setAccessCode(null);
                }
                contract.setStatus(ContractStatus.PENDING_RETURN);
                contract.setReturnDate(returnDate);
                contractRepository.save(contract);

                return ReturnNoticeResponse.builder()
                                .id(saved.getId())
                                .contractId(contract.getId())
                                .intendedReturnDate(saved.getRequestedReturnDate())
                                .status(saved.getStatus())
                                .createdAt(saved.getCreatedAt())
                                .build();
        }

        @Override
        @Transactional
        public ReturnNoticeResponse cancelReturnNotice(Long contractId, UserPrincipal currentUser) {
                RentalContract contract = contractRepository.findById(contractId)
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (currentUser != null && currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
                        if (!contract.getCustomerId().equals(currentUser.getId())) {
                                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền hủy yêu cầu trả kho của hợp đồng này");
                        }
                }

                if (contract.getStatus() != ContractStatus.PENDING_RETURN) {
                        throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_RETURN, "Hợp đồng không ở trạng thái chờ trả kho để hủy");
                }

                ReturnRequest returnRequest = returnRequestRepository
                                .findTopByContractIdOrderByCreatedAtDesc(contractId)
                                .orElseThrow(() -> new CustomException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

                if (returnRequest.getInspectedAt() != null || returnRequest.getStatus() != ReturnRequestStatus.PENDING) {
                        throw new CustomException(ErrorCode.RETURN_INSPECTION_ALREADY_STARTED,
                                        "Không thể hủy vì nhân viên đã bắt đầu tiến hành kiểm tra nghiệm thu.");
                }

                returnRequest.setStatus(ReturnRequestStatus.CANCELLED);
                returnRequest.setCancelledAt(OffsetDateTime.now());
                returnRequestRepository.save(returnRequest);

                LocalDate today = LocalDate.now();
                if (contract.getEndDateExclusive() != null && today.isAfter(contract.getEndDateExclusive())) {
                        contract.setStatus(ContractStatus.OVERDUE);
                } else {
                        contract.setStatus(ContractStatus.ACTIVE);
                }
                contract.setReturnDate(null);
                contractRepository.save(contract);

                return ReturnNoticeResponse.builder()
                                .id(returnRequest.getId())
                                .contractId(contract.getId())
                                .intendedReturnDate(returnRequest.getRequestedReturnDate())
                                .status(returnRequest.getStatus())
                                .createdAt(returnRequest.getCreatedAt())
                                .build();
        }

        @Override
        @Transactional
        public ReturnInspectionResponse submitReturnInspection(Long contractId, ReturnInspectionRequest request,
                        Long staffId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() != ContractStatus.ACTIVE 
                                && contract.getStatus() != ContractStatus.OVERDUE
                                && contract.getStatus() != ContractStatus.PENDING_RETURN) {
                        throw new CustomException(ErrorCode.CONTRACT_NOT_ACTIVE_OR_OVERDUE);
                }

                ReturnRequest returnRequest = returnRequestRepository
                                .findTopByContractIdOrderByCreatedAtDesc(contractId)
                                .orElseGet(() -> ReturnRequest.builder()
                                                .contractId(contract.getId())
                                                .requestedReturnDate(request.getReturnDate())
                                                .build());

                if (!Boolean.TRUE.equals(request.getCustomerConfirmed())
                                || request.getSignatureDataUrl() == null
                                || request.getSignatureDataUrl().isBlank()) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Khách hàng phải ký và xác nhận biên bản nghiệm thu");
                }

                boolean isIntact = "GOOD".equalsIgnoreCase(request.getCondition());
                List<Long> feeIds = request.getExtraFeeTypeIds() == null ? List.of() : request.getExtraFeeTypeIds();
                if (isIntact && !feeIds.isEmpty()) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Ô nguyên trạng không ghi phụ phí vệ sinh hoặc bồi thường");
                }
                if (!isIntact && feeIds.isEmpty()) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Chọn khoản vệ sinh hoặc bồi thường đang hiệu lực trong danh mục");
                }
                if (!isIntact
                                && (request.getDamageNotes() == null || request.getDamageNotes().isBlank()
                                                || request.getEvidenceImageUrls() == null
                                                || request.getEvidenceImageUrls().isBlank())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Nghiệm thu có phụ phí phải có mô tả và ít nhất một ảnh");
                }

                long catalogSum = 0L;
                for (Long feeId : feeIds) {
                        ExtraFeeType fee = requireApplicableFee(feeId, contract, INSPECTION_FEE_CATEGORIES);
                        long amount = snapshotFeeAmount(fee, contract.getMonthlyPrice());
                        catalogSum += amount;
                        String note = request.getDamageNotes() == null ? "" : request.getDamageNotes().trim();
                        extraChargeRepository.save(ContractExtraCharge.builder()
                                        .contractId(contract.getId())
                                        .extraFeeTypeId(fee.getId())
                                        .amount(amount)
                                        .reason(fee.getCategory() + ": " + fee.getName()
                                                        + (note.isBlank() ? "" : " — " + note))
                                        .recordedBy(staffId)
                                        .status(ExtraChargeStatus.UNPAID)
                                        .build());
                }

                returnRequest.setInspectedBy(staffId);
                returnRequest.setInspectedAt(OffsetDateTime.now());
                returnRequest.setIsIntact(isIntact);
                returnRequest.setConditionNote(request.getDamageNotes());
                // Phụ phí danh mục nằm trên contract_extra_charge. Không lưu thêm số tự do (BR-RET-04).
                returnRequest.setDamageCost(0L);
                returnRequest.setEvidenceImageUrls(request.getEvidenceImageUrls());
                returnRequest.setCustomerConfirmed(true);
                returnRequest.setCustomerConfirmedAt(OffsetDateTime.now());
                returnRequest.setSignatureData(request.getSignatureDataUrl());
                returnRequest.setStatus(ReturnRequestStatus.PENDING);
                returnRequestRepository.save(returnRequest);

                contract.setStatus(ContractStatus.PENDING_RETURN);
                contract.setReturnDate(request.getReturnDate());
                contract.setAccessCode(null);
                contractRepository.save(contract);

                if (contract.getStorageUnitId() != null) {
                        storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(unit -> {
                                if (unit.getStatus() == StorageUnitStatus.OCCUPIED
                                                || unit.getStatus() == StorageUnitStatus.CLEANING) {
                                        unit.setStatus(StorageUnitStatus.CLEANING);
                                        storageUnitRepository.save(unit);
                                }
                        });
                }

                long earlyRentRefund = earlyRentRefund(contract, request.getReturnDate());
                long availableBalance = (earlyRentRefund > 0) ? earlyRentRefund : contract.getDepositBalance();
                long estimatedRefund = Math.max(0, availableBalance - catalogSum
                                - contract.getOverdueFeeAccrued());

                return ReturnInspectionResponse.builder()
                                .id(contract.getId())
                                .status(contract.getStatus())
                                .returnDate(request.getReturnDate())
                                .estimatedDepositRefund(estimatedRefund)
                                .overdueFee(contract.getOverdueFeeAccrued())
                                .damageCost(catalogSum)
                                .build();
        }

        @Override
        @Transactional
        public CatalogFeeChargeResponse applyCatalogFee(Long contractId, ApplyCatalogFeeRequest request,
                        Long actorId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);
                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));
                if (contract.getStatus() != ContractStatus.ACTIVE && contract.getStatus() != ContractStatus.OVERDUE) {
                        throw new CustomException(ErrorCode.CONTRACT_NOT_ACTIVE_OR_OVERDUE);
                }
                if (request == null || request.getExtraFeeTypeId() == null) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Phải chọn khoản phụ phí trong danh mục");
                }
                ExtraFeeType fee = requireApplicableFee(request.getExtraFeeTypeId(), contract, RENTAL_FEE_CATEGORIES);
                long amount = snapshotFeeAmount(fee, contract.getMonthlyPrice());
                String note = request.getNote() == null ? "" : request.getNote().trim();
                ExtraChargeStatus chargeStatus = Boolean.TRUE.equals(request.getPaid())
                                ? ExtraChargeStatus.PAID
                                : ExtraChargeStatus.UNPAID;
                ContractExtraCharge saved = extraChargeRepository.save(ContractExtraCharge.builder()
                                .contractId(contract.getId())
                                .extraFeeTypeId(fee.getId())
                                .amount(amount)
                                .reason(fee.getCategory() + ": " + fee.getName() + (note.isBlank() ? "" : " — " + note))
                                .recordedBy(actorId)
                                .status(chargeStatus)
                                .build());
                return CatalogFeeChargeResponse.builder()
                                .id(saved.getId())
                                .contractId(contract.getId())
                                .extraFeeTypeId(fee.getId())
                                .name(fee.getName())
                                .category(fee.getCategory())
                                .amount(amount)
                                .status(saved.getStatus().name())
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public SettlementPreviewResponse getSettlementPreview(Long contractId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() == ContractStatus.TERMINATED) {
                        if (contract.getCheckinDate() == null) {
                                // BR-CHK-06: Từ chối bàn giao ở khâu Check-in -> hoàn 100% tiền thuê + 100% cọc
                                long rentAmount = contract.getTotalRentalFee() > 0
                                                ? contract.getTotalRentalFee()
                                                : contract.getMonthlyPrice() * Math.max(1, contract.getRentalMonths());
                                long deposit = contract.getDepositAmount();
                                long totalPaid = rentAmount + deposit;
                                return SettlementPreviewResponse.builder()
                                                .contractId(contract.getId())
                                                .depositAmount(deposit)
                                                .damageCost(0L)
                                                .overdueFee(0L)
                                                .unpaidExtraCharges(0L)
                                                .depositRefundAmount(totalPaid)
                                                .payableAmount(0L)
                                                .earlyRentRefund(rentAmount)
                                                .earlyReturn(false)
                                                .build();
                        } else {
                                // BR-OVD-07: Chấm dứt do quá hạn D+10 sau khi đã nhận kho -> không hoàn tiền thuê
                                long deposit = contract.getDepositAmount();
                                long overdue = contract.getOverdueFeeAccrued();
                                long damage = 0L;
                                ReturnRequest returnReq = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId)
                                                .orElse(null);
                                if (returnReq != null) {
                                        damage = returnReq.getDamageCost();
                                }
                                List<ContractExtraCharge> unpaidCharges = extraChargeRepository.findByContractIdAndStatus(contractId,
                                                ExtraChargeStatus.UNPAID);
                                long totalUnpaid = unpaidChargesOutsideLegacyDamage(unpaidCharges);
                                long availableBalance = contract.getDepositBalance();
                                long netDeduction = damage + totalUnpaid;
                                long refundAmount = Math.max(0, availableBalance - netDeduction);
                                long payableAmount = Math.max(0, netDeduction - availableBalance);
                                Long pendingOrderCode = null;
                                if (paymentTransactionRepository != null) {
                                        pendingOrderCode = paymentTransactionRepository
                                                        .findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(contract.getId(), "SETTLEMENT")
                                                        .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus()))
                                                        .map(PaymentTransaction::getOrderCode)
                                                        .orElse(null);
                                }
                                return SettlementPreviewResponse.builder()
                                                .contractId(contract.getId())
                                                .depositAmount(deposit)
                                                .damageCost(damage)
                                                .overdueFee(overdue)
                                                .unpaidExtraCharges(totalUnpaid)
                                                .depositRefundAmount(refundAmount)
                                                .payableAmount(payableAmount)
                                                .earlyRentRefund(0L)
                                                .earlyReturn(false)
                                                .pendingSettlementOrderCode(pendingOrderCode)
                                                .build();
                        }
                }

                ReturnRequest returnReq = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId)
                                .orElse(ReturnRequest.builder().damageCost(0).build());

                List<ContractExtraCharge> unpaidCharges = extraChargeRepository.findByContractIdAndStatus(contractId,
                                ExtraChargeStatus.UNPAID);
                long totalUnpaid = unpaidChargesOutsideLegacyDamage(unpaidCharges);

                long deposit = contract.getDepositAmount();
                long damage = returnReq.getDamageCost();
                long overdue = contract.getOverdueFeeAccrued();

                long totalDeduction = damage + overdue + totalUnpaid;
                long earlyRentRefund = earlyRentRefund(contract, contract.getReturnDate());
                boolean isEarlyReturn = earlyRentRefund > 0;
                // BR-RET-06: Trả kho sớm phạt 100% cọc. Nguồn hoàn tiền tính từ phần tiền thuê chưa dùng.
                long availableBalance = isEarlyReturn ? earlyRentRefund : deposit;
                long net = totalDeduction - availableBalance;
                long refundAmount = Math.max(0, -net);
                long payableAmount = Math.max(0, net);

                Long pendingOrderCode = null;
                if (paymentTransactionRepository != null) {
                        pendingOrderCode = paymentTransactionRepository
                                        .findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(contract.getId(), "SETTLEMENT")
                                        .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus()))
                                        .map(PaymentTransaction::getOrderCode)
                                        .orElse(null);
                }

                return SettlementPreviewResponse.builder()
                                .contractId(contract.getId())
                                .depositAmount(deposit)
                                .damageCost(damage)
                                .overdueFee(overdue)
                                .unpaidExtraCharges(totalUnpaid)
                                .depositRefundAmount(refundAmount)
                                .payableAmount(payableAmount)
                                .earlyRentRefund(earlyRentRefund)
                                .earlyReturn(isEarlyReturn)
                                .pendingSettlementOrderCode(pendingOrderCode)
                                .build();
        }

        @Override
        @Transactional
        public SettlementApprovalResponse approveSettlement(Long contractId, SettlementApprovalRequest request,
                        Long managerId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() != ContractStatus.PENDING_RETURN
                                && contract.getStatus() != ContractStatus.OVERDUE
                                && contract.getStatus() != ContractStatus.TERMINATED) {
                        throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_RETURN);
                }

                ReturnRequest returnReq = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId)
                                .orElseGet(() -> ReturnRequest.builder()
                                                .contractId(contractId)
                                                .requestedReturnDate(LocalDate.now())
                                                .status(ReturnRequestStatus.PENDING)
                                                .inspectedAt(OffsetDateTime.now())
                                                .inspectedBy(managerId)
                                                .damageCost(0L)
                                                .depositRefundAmount(contract.getDepositAmount())
                                                .build());

                if (contract.getStatus() == ContractStatus.TERMINATED) {
                        if (contract.getCheckinDate() == null) {
                                // BR-CHK-06: Từ chối bàn giao ở khâu Check-in -> hoàn 100% tiền thuê + 100% cọc
                                long rentAmount = contract.getTotalRentalFee() > 0
                                                ? contract.getTotalRentalFee()
                                                : contract.getMonthlyPrice() * Math.max(1, contract.getRentalMonths());
                                long depositAmount = contract.getDepositAmount();
                                long totalRefund = rentAmount + depositAmount;
                                return closeSettledContract(contract, returnReq, managerId, totalRefund, 0L);
                        } else {
                                // BR-OVD-07, BR-OVD-11: Chấm dứt cưỡng chế do quá hạn D+7 sau khi đã nhận kho (hàng ở Kho Tổng) -> không hoàn tiền thuê.
                                // Cho phép FM nhập thêm chi phí phát sinh (Lưu kho tổng / Khác) qua adjustedDamageCost khi khách chuộc đồ trong 30 ngày,
                                // hoặc để 0đ khi chốt thanh lý ngoại tuyến sau 30 ngày.
                                if (request != null && request.getAdjustedDamageCost() != null) {
                                        returnReq.setDamageCost(Math.max(0L, request.getAdjustedDamageCost()));
                                }
                                if (request != null && request.getApprovedNotes() != null && !request.getApprovedNotes().isBlank()) {
                                        returnReq.setConditionNote(request.getApprovedNotes().trim());
                                }
                                List<ContractExtraCharge> unpaidCharges = extraChargeRepository.findByContractIdAndStatus(contractId,
                                                ExtraChargeStatus.UNPAID);
                                long totalUnpaid = unpaidChargesOutsideLegacyDamage(unpaidCharges);
                                long availableBalance = contract.getDepositBalance();
                                long netDeduction = returnReq.getDamageCost() + totalUnpaid;
                                long refundAmount = Math.max(0, availableBalance - netDeduction);
                                long payableAmount = Math.max(0, netDeduction - availableBalance);
                                if (payableAmount > 0) {
                                        returnReq.setDepositRefundAmount(0L);
                                        returnRequestRepository.save(returnReq);
                                        contract.setAccessCode(null);
                                        contractRepository.save(contract);

                                        eventPublisher.publishEvent(ContractSettledEvent.builder()
                                                        .contractId(contract.getId())
                                                        .customerId(contract.getCustomerId())
                                                        .facilityId(contract.getFacilityId())
                                                        .depositRefundAmount(0L)
                                                        .payableAmount(payableAmount)
                                                        .settledAt(OffsetDateTime.now())
                                                        .build());

                                        return SettlementApprovalResponse.builder()
                                                        .contractId(contract.getId())
                                                        .status(contract.getStatus())
                                                        .depositRefundAmount(0L)
                                                        .payableAmount(payableAmount)
                                                        .message("Khách còn phải nộp phần thiếu (chi phí lưu Kho Tổng / phát sinh). Hợp đồng đóng sau khi thanh toán thành công")
                                                        .build();
                                }
                                return closeSettledContract(contract, returnReq, managerId, refundAmount, 0L);
                        }
                }

                if (returnReq.getInspectedAt() == null) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Chưa thể quyết toán: Ô kho chưa được nhân viên kiểm tra hiện trường và lập biên bản nghiệm thu (BR-RET-02)");
                }

                List<ContractExtraCharge> unpaidCharges = extraChargeRepository.findByContractIdAndStatus(contractId,
                                ExtraChargeStatus.UNPAID);
                boolean catalogInspection = unpaidCharges.stream().anyMatch(this::isCatalogInspectionCharge);
                // Số tự do chỉ còn cho biên bản cũ. Phụ phí danh mục đã nằm trong dòng chưa thu.
                if (request != null && request.getAdjustedDamageCost() != null && !catalogInspection) {
                        returnReq.setDamageCost(request.getAdjustedDamageCost());
                }
                long totalUnpaid = unpaidChargesOutsideLegacyDamage(unpaidCharges);

                long deposit = contract.getDepositAmount();
                long damage = returnReq.getDamageCost();
                long overdue = contract.getOverdueFeeAccrued();
                long totalDeduction = damage + overdue + totalUnpaid;
                long earlyRentRefund = earlyRentRefund(contract, contract.getReturnDate());
                boolean isEarlyReturn = earlyRentRefund > 0;
                // BR-RET-06: Trả kho sớm phạt 100% cọc. Nguồn hoàn tiền tính từ phần tiền thuê chưa dùng.
                long availableBalance = isEarlyReturn ? earlyRentRefund : deposit;
                long net = totalDeduction - availableBalance;
                long refundAmount = Math.max(0, -net);
                long payableAmount = Math.max(0, net);

                // BR-RET-04: còn phần thiếu thì giữ hợp đồng mở và chờ thanh toán SETTLEMENT.
                if (payableAmount > 0) {
                        returnReq.setDepositRefundAmount(0L);
                        returnRequestRepository.save(returnReq);
                        contract.setAccessCode(null);
                        contractRepository.save(contract);

                        eventPublisher.publishEvent(ContractSettledEvent.builder()
                                        .contractId(contract.getId())
                                        .customerId(contract.getCustomerId())
                                        .facilityId(contract.getFacilityId())
                                        .depositRefundAmount(0L)
                                        .payableAmount(payableAmount)
                                        .settledAt(OffsetDateTime.now())
                                        .build());

                        return SettlementApprovalResponse.builder()
                                        .contractId(contract.getId())
                                        .status(contract.getStatus())
                                        .depositRefundAmount(0L)
                                        .payableAmount(payableAmount)
                                        .message("Khách còn phải nộp phần thiếu. Hợp đồng đóng sau khi thanh toán thành công")
                                        .build();
                }

                return closeSettledContract(contract, returnReq, managerId, refundAmount, 0L);
        }

        @Override
        @Transactional
        public void closeContractAfterSettlementPayment(Long contractId) {
                RentalContract contract = contractRepository.findById(contractId)
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));
                if (contract.getStatus() == ContractStatus.CLOSED) {
                        return;
                }
                if (contract.getStatus() != ContractStatus.PENDING_RETURN
                                && contract.getStatus() != ContractStatus.OVERDUE
                                && contract.getStatus() != ContractStatus.TERMINATED) {
                        throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_RETURN);
                }
                ReturnRequest returnReq = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId)
                                .orElseThrow(() -> new CustomException(ErrorCode.RETURN_REQUEST_NOT_FOUND));
                closeSettledContract(contract, returnReq, returnReq.getSettledBy(), 0L, 0L);
        }

        @Override
        @Transactional
        public ContractResponse completeCleaning(Long contractId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);
                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));
                if (contract.getStorageUnitId() == null) {
                        throw new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND);
                }
                StorageUnit unit = storageUnitRepository.findById(contract.getStorageUnitId())
                                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
                if (unit.getStatus() != StorageUnitStatus.CLEANING && unit.getStatus() != StorageUnitStatus.RESERVED) {
                        throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                                        "Chỉ hoàn tất dọn khi ô kho đang ở trạng thái CLEANING hoặc RESERVED");
                }
                boolean awaitingCheckIn = reservationRepository.existsByStorageUnitIdAndStatusIn(
                                unit.getId(), List.of(ReservationStatus.CONFIRMED));
                unit.setStatus(awaitingCheckIn ? StorageUnitStatus.RESERVED : StorageUnitStatus.AVAILABLE);
                storageUnitRepository.save(unit);
                return toResponse(contract);
        }

        private SettlementApprovalResponse closeSettledContract(RentalContract contract, ReturnRequest returnReq,
                        Long managerId, long refundAmount, long payableAmount) {
                returnReq.setStatus(ReturnRequestStatus.COMPLETED);
                returnReq.setDepositRefundAmount(refundAmount);
                returnReq.setSettledBy(managerId);
                returnReq.setSettledAt(OffsetDateTime.now());
                returnRequestRepository.save(returnReq);

                extraChargeRepository.findByContractIdAndStatus(contract.getId(), ExtraChargeStatus.UNPAID)
                                .forEach(charge -> {
                                        charge.setStatus(ExtraChargeStatus.PAID);
                                        extraChargeRepository.save(charge);
                                });

                contract.setDepositBalance(0);
                contract.setOverdueFeeAccrued(0);
                contract.setStatus(ContractStatus.CLOSED);
                contract.setClosedAt(OffsetDateTime.now());
                contract.setAccessCode(null);
                contractRepository.save(contract);

                if (contract.getStorageUnitId() != null) {
                        storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(unit -> {
                                if (unit.getStatus() == StorageUnitStatus.OCCUPIED) {
                                        unit.setStatus(StorageUnitStatus.CLEANING);
                                        storageUnitRepository.save(unit);
                                }
                        });
                }

                if (refundAmount > 0) {
                        eventPublisher.publishEvent(ContractSettledEvent.builder()
                                        .contractId(contract.getId())
                                        .customerId(contract.getCustomerId())
                                        .facilityId(contract.getFacilityId())
                                        .depositRefundAmount(refundAmount)
                                        .payableAmount(payableAmount)
                                        .settledAt(returnReq.getSettledAt())
                                        .build());
                }

                return SettlementApprovalResponse.builder()
                                .contractId(contract.getId())
                                .status(contract.getStatus())
                                .depositRefundAmount(refundAmount)
                                .payableAmount(payableAmount)
                                .settledAt(returnReq.getSettledAt())
                                .message(refundAmount > 0
                                                ? "Phê duyệt quyết toán và hoàn cọc thành công. Hoàn trong "
                                                                + refundWorkingDays(contract) + " ngày làm việc"
                                                : "Đã đóng hợp đồng sau khi khách nộp đủ phần thiếu")
                                .build();
        }

        @Override
        @Transactional
        public ContractResponse assignReturnStaff(Long contractId, AssignReturnStaffRequest request,
                        Long managerId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() != ContractStatus.PENDING_RETURN) {
                        throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_RETURN);
                }

                if (request.getStaffId() != null) {
                        if (userRepository != null) {
                                AppUser staff = userRepository.findById(request.getStaffId())
                                                .orElseThrow(() -> new CustomException(ErrorCode.STAFF_NOT_FOUND));
                                if (staff.getStatus() != UserStatus.ACTIVE) {
                                        throw new CustomException(ErrorCode.STAFF_NOT_ACTIVE);
                                }
                        }
                        if (userFacilityAssignmentRepository != null) {
                                boolean assigned = userFacilityAssignmentRepository.existsByUserIdAndFacilityId(request.getStaffId(), contract.getFacilityId());
                                if (!assigned) {
                                        throw new CustomException(ErrorCode.STAFF_NOT_IN_FACILITY);
                                }
                        }
                }

                ReturnRequest returnRequest = returnRequestRepository
                                .findTopByContractIdOrderByCreatedAtDesc(contractId)
                                .orElseGet(() -> ReturnRequest.builder()
                                                .contractId(contract.getId())
                                                .requestedReturnDate(LocalDate.now())
                                                .build());

                returnRequest.setInspectedBy(request.getStaffId());
                if (request.getNotes() != null && !request.getNotes().isBlank()) {
                        String currentNote = returnRequest.getConditionNote() != null ? returnRequest.getConditionNote() : "";
                        returnRequest.setConditionNote((currentNote + " [Phân công]: " + request.getNotes()).trim());
                }
                returnRequestRepository.save(returnRequest);

                if (staffDailyAssignmentRepository != null && request.getStaffId() != null) {
                        StaffDailyAssignment assignment = staffDailyAssignmentRepository
                                        .findByReferenceTypeAndReferenceId("CONTRACT", contractId)
                                        .orElseGet(() -> StaffDailyAssignment.builder()
                                                        .facilityId(contract.getFacilityId())
                                                        .workDate(LocalDate.now())
                                                        .taskType(AssignmentTaskType.RETURN)
                                                        .referenceType("CONTRACT")
                                                        .referenceId(contract.getId())
                                                        .build());
                        assignment.setStaffId(request.getStaffId());
                        assignment.setAssignedBy(managerId != null ? managerId : request.getStaffId());
                        assignment.setFacilityId(contract.getFacilityId());
                        assignment.setTaskType(AssignmentTaskType.RETURN);
                        assignment.setWorkDate(LocalDate.now());
                        staffDailyAssignmentRepository.save(assignment);
                }

                return toResponse(contract);
        }

        @Override
        @Transactional
        public ContractResponse assignCheckInStaff(Long contractId, AssignReturnStaffRequest request,
                        Long managerId, List<Long> facilityIds) {
                Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                                ? contractRepository.findById(contractId)
                                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

                RentalContract contract = contractOpt
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() != ContractStatus.PENDING_CHECK_IN) {
                        throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_CHECKIN, "Hợp đồng không ở trạng thái chờ nhận kho");
                }

                if (request.getStaffId() != null) {
                        if (userRepository != null) {
                                AppUser staff = userRepository.findById(request.getStaffId())
                                                .orElseThrow(() -> new CustomException(ErrorCode.STAFF_NOT_FOUND));
                                if (staff.getStatus() != UserStatus.ACTIVE) {
                                        throw new CustomException(ErrorCode.STAFF_NOT_ACTIVE);
                                }
                        }
                        if (userFacilityAssignmentRepository != null) {
                                boolean assigned = userFacilityAssignmentRepository.existsByUserIdAndFacilityId(request.getStaffId(), contract.getFacilityId());
                                if (!assigned) {
                                        throw new CustomException(ErrorCode.STAFF_NOT_IN_FACILITY);
                                }
                        }
                }

                if (staffDailyAssignmentRepository != null) {
                        LocalDate today = LocalDate.now();
                        LocalDate effectiveWorkDate = (contract.getStartDate() != null && !contract.getStartDate().isAfter(today))
                                        ? contract.getStartDate()
                                        : today;
                        StaffDailyAssignment assignment = staffDailyAssignmentRepository
                                        .findByReferenceTypeAndReferenceId("CONTRACT", contractId)
                                        .orElseGet(() -> StaffDailyAssignment.builder()
                                                        .facilityId(contract.getFacilityId())
                                                        .workDate(effectiveWorkDate)
                                                        .taskType(AssignmentTaskType.HANDOVER)
                                                        .referenceType("CONTRACT")
                                                        .referenceId(contract.getId())
                                                        .build());

                        assignment.setStaffId(request.getStaffId());
                        assignment.setAssignedBy(managerId);
                        assignment.setFacilityId(contract.getFacilityId());
                        assignment.setWorkDate(effectiveWorkDate);
                        staffDailyAssignmentRepository.save(assignment);
                }

                return toResponse(contract);
        }

        private int refundWorkingDays(RentalContract contract) {
                if (policyVersionRepository == null || contract.getPolicyVersionId() == null) {
                        return 7;
                }
                return policyVersionRepository.findById(contract.getPolicyVersionId())
                                .map(PolicyVersion::getReturnRefundWorkingDays)
                                .filter(days -> days != null && days >= 0)
                                .orElse(7);
        }

        private ExtraFeeType requireApplicableFee(Long feeId, RentalContract contract, Set<String> allowedCategories) {
                if (extraFeeTypeRepository == null || feeId == null) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Không xác minh được danh mục phụ phí");
                }
                ExtraFeeType fee = extraFeeTypeRepository.findById(feeId)
                                .orElseThrow(() -> new CustomException(ErrorCode.VALIDATION_FAILED,
                                                "Khoản phụ phí không còn trong danh mục"));
                String category = fee.getCategory() == null ? "" : fee.getCategory().trim().toUpperCase();
                if (!allowedCategories.contains(category)) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Khoản phụ phí không thuộc nhóm được phép cho thao tác này");
                }
                if (!Boolean.TRUE.equals(fee.getIsActive())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Khoản phụ phí đã ngừng hiệu lực");
                }
                if (fee.getFacilityId() != null && !fee.getFacilityId().equals(contract.getFacilityId())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Khoản phụ phí không áp dụng cho cơ sở của hợp đồng");
                }
                if (fee.getEffectiveFrom() != null && fee.getEffectiveFrom().isAfter(AppliedPriceLookup.todayVn())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Khoản phụ phí chưa đến ngày hiệu lực");
                }
                return fee;
        }

        private long snapshotFeeAmount(ExtraFeeType fee, long monthlyPrice) {
                var lines = SurchargeAmountCalculator.lines(List.of(fee), monthlyPrice, 1);
                if (lines.isEmpty()) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Không tính được số tiền phụ phí");
                }
                return lines.get(0).getAmount();
        }

        private boolean isCatalogInspectionCharge(ContractExtraCharge charge) {
                if (charge.getExtraFeeTypeId() == null || charge.getReason() == null) {
                        return false;
                }
                return charge.getReason().startsWith("CLEANING:") || charge.getReason().startsWith("DAMAGE:");
        }

        /** Dòng danh mục tính một lần. Biên bản cũ gắn tiền tự do thì loại prefix để không cộng trùng. */
        private long unpaidChargesOutsideLegacyDamage(List<ContractExtraCharge> unpaidCharges) {
                return unpaidCharges.stream()
                                .filter(charge -> charge.getReason() == null
                                                || !charge.getReason().startsWith(LEGACY_DAMAGE_REASON))
                                .mapToLong(ContractExtraCharge::getAmount)
                                .sum();
        }

        private long earlyRentRefund(RentalContract contract, LocalDate returnDate) {
                if (contract == null || returnDate == null || contract.getEndDateExclusive() == null
                                || !returnDate.isBefore(contract.getEndDateExclusive())) {
                        return 0L;
                }
                PolicyVersion policy = null;
                if (policyVersionRepository != null && contract.getPolicyVersionId() != null) {
                        policy = policyVersionRepository.findById(contract.getPolicyVersionId()).orElse(null);
                }
                int noticeDays = (policy != null && policy.getReturnNoticeDays() != null && policy.getReturnNoticeDays() >= 0)
                                ? policy.getReturnNoticeDays()
                                : 30;
                long unusedDays = java.time.temporal.ChronoUnit.DAYS.between(returnDate, contract.getEndDateExclusive());
                if (unusedDays <= noticeDays) {
                        // BR-RET-01, BR-RET-06 Best-of-Both: Trả kho trong tháng cuối (<= 30 ngày / return.notice_days)
                        // được hoàn 100% cọc Deposit (availableBalance = deposit), không hoàn tiền lẻ ngày thuê chưa dùng.
                        return 0L;
                }
                long unusedRent = PolicyNumbers.dailyRent(contract.getMonthlyPrice(), policy) * unusedDays;
                if (policy == null || policy.getReturnEarlyRefundRate() == null) {
                        // BR-RET-06: Trả sớm trước hạn dài (> 30 ngày): Hoàn 100% tiền thuê thời gian chưa dùng, phạt 100% cọc.
                        return unusedRent;
                }
                return PolicyNumbers.share(unusedRent, policy.getReturnEarlyRefundRate());
        }

        private record UnitConflictCheckResult(boolean available, String reason) {}

        private UnitConflictCheckResult evaluateUnitAvailability(
                        StorageUnit unit,
                        LocalDate newStartDate,
                        LocalDate newEndDate,
                        int bufferDays,
                        Long excludeContractId,
                        Long excludeReservationId,
                        OffsetDateTime now) {
                if (unit == null) {
                        return new UnitConflictCheckResult(false, "Không tìm thấy dữ liệu ô kho");
                }

                // 1. Kiểm tra trạng thái vật lý
                if (unit.getStatus() == StorageUnitStatus.MAINTENANCE) {
                        return new UnitConflictCheckResult(false, "Ô kho đang trong chế độ bảo trì");
                }
                if (unit.getStatus() == StorageUnitStatus.OUT_OF_SERVICE) {
                        return new UnitConflictCheckResult(false, "Ô kho đang ngừng hoạt động");
                }

                // 2. Kiểm tra tiến trình dọn dẹp (CLEANING)
                if (unit.getStatus() == StorageUnitStatus.CLEANING) {
                        LocalDate cleaningStartDate = null;
                        var latestClosed = contractRepository.findFirstByStorageUnitIdAndStatusOrderByClosedAtDesc(
                                        unit.getId(), ContractStatus.CLOSED);
                        if (latestClosed.isPresent() && latestClosed.get().getClosedAt() != null) {
                                cleaningStartDate = latestClosed.get().getClosedAt().toLocalDate();
                        } else if (unit.getUpdatedAt() != null) {
                                cleaningStartDate = unit.getUpdatedAt().toLocalDate();
                        } else {
                                cleaningStartDate = LocalDate.now();
                        }
                        LocalDate readyDate = cleaningStartDate.plusDays(bufferDays);
                        if (newStartDate.isBefore(readyDate)) {
                                return new UnitConflictCheckResult(false,
                                                String.format("Ô kho đang được vệ sinh dọn dẹp sau trả kho (dự kiến hoàn tất vào ngày %s)", readyDate));
                        }
                }

                // 3. Kiểm tra trùng hợp đồng (tính cả bufferDays)
                List<RentalContract> overlappingContracts = contractRepository.findOverlappingContractsForUnit(
                                unit.getId(), newStartDate, newEndDate, bufferDays, excludeContractId != null ? excludeContractId : 0L);
                if (overlappingContracts != null && !overlappingContracts.isEmpty()) {
                        RentalContract c = overlappingContracts.get(0);
                        boolean directOverlap = newStartDate.isBefore(c.getEndDateExclusive()) && newEndDate.isAfter(c.getStartDate());
                        if (directOverlap) {
                                return new UnitConflictCheckResult(false,
                                                String.format("Dính lịch hợp đồng thuê của khách khác %s (từ %s đến %s)",
                                                                c.getCode(), c.getStartDate(), c.getEndDateExclusive()));
                        } else if (!newStartDate.isBefore(c.getEndDateExclusive())) {
                                LocalDate bufferEnd = c.getEndDateExclusive().plusDays(bufferDays);
                                return new UnitConflictCheckResult(false,
                                                String.format("Dính lịch dọn dẹp vệ sinh sau trả kho (D+%d) của hợp đồng %s (thời gian dọn dẹp từ %s đến %s)",
                                                                bufferDays, c.getCode(), c.getEndDateExclusive(), bufferEnd));
                        } else {
                                return new UnitConflictCheckResult(false,
                                                String.format("Không đủ %d ngày đệm dọn dẹp vệ sinh trước hợp đồng tiếp theo %s (bắt đầu ngày %s)",
                                                                bufferDays, c.getCode(), c.getStartDate()));
                        }
                }

                // 4. Kiểm tra trùng đơn giữ chỗ (tính cả bufferDays)
                List<Reservation> overlappingReservations = reservationRepository.findOverlappingReservationsForUnit(
                                unit.getId(), newStartDate, newEndDate, now, bufferDays, excludeReservationId != null ? excludeReservationId : 0L);
                if (overlappingReservations != null && !overlappingReservations.isEmpty()) {
                        Reservation r = overlappingReservations.get(0);
                        boolean directOverlap = newStartDate.isBefore(r.getEndDateExclusive()) && newEndDate.isAfter(r.getStartDate());
                        if (directOverlap) {
                                return new UnitConflictCheckResult(false,
                                                String.format("Dính lịch đơn đặt chỗ trước %s (từ %s đến %s)",
                                                                r.getCode(), r.getStartDate(), r.getEndDateExclusive()));
                        } else if (!newStartDate.isBefore(r.getEndDateExclusive())) {
                                LocalDate bufferEnd = r.getEndDateExclusive().plusDays(bufferDays);
                                return new UnitConflictCheckResult(false,
                                                String.format("Dính lịch dọn dẹp vệ sinh sau trả kho (D+%d) của đơn %s (thời gian dọn dẹp từ %s đến %s)",
                                                                bufferDays, r.getCode(), r.getEndDateExclusive(), bufferEnd));
                        } else {
                                return new UnitConflictCheckResult(false,
                                                String.format("Không đủ %d ngày đệm dọn dẹp vệ sinh trước đơn đặt chỗ tiếp theo %s (bắt đầu ngày %s)",
                                                                bufferDays, r.getCode(), r.getStartDate()));
                        }
                }

                return new UnitConflictCheckResult(true, null);
        }

        @Override
        @Transactional
        public ContractResponse rescheduleRentalPeriod(Long contractId, RescheduleRentalPeriodRequest request, Long currentUserId) {
                if (request == null || request.getNewStartDate() == null) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày bắt đầu mới không được để trống");
                }

                LocalDate newStartDate = request.getNewStartDate();
                LocalDate today = LocalDate.now();
                if (newStartDate.isBefore(today.plusDays(1))) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày bắt đầu mới phải từ ngày mai trở đi");
                }

                RentalContract contract = contractRepository.findById(contractId)
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getStatus() != ContractStatus.PENDING_CHECK_IN) {
                        throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                                        "Chỉ được dời lịch khi hợp đồng đang ở trạng thái Chờ nhận kho (PENDING_CHECK_IN)");
                }

                // BR-RES-06: Giới hạn tối đa 1 lần dời lịch duy nhất trên mỗi hợp đồng
                if (contract.getRescheduleCount() >= 1) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Mỗi hợp đồng chỉ được phép dời ngày nhận kho tối đa 1 lần duy nhất (BR-RES-06)");
                }

                if (newStartDate.equals(contract.getStartDate())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày bắt đầu mới phải khác ngày bắt đầu hiện tại");
                }

                long diffDays = 0;
                // BR-RES-06: Ràng buộc báo trước tối thiểu 48 giờ
                if (contract.getStartDate() != null) {
                        long hoursUntilStart = java.time.Duration.between(java.time.LocalDateTime.now(), contract.getStartDate().atStartOfDay()).toHours();
                        if (hoursUntilStart < 48) {
                                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Yêu cầu dời ngày nhận kho phải gửi trước ít nhất 48 giờ");
                        }

                        // BR-RES-06: Giới hạn dời từ 1 đến tối đa 7 ngày
                        diffDays = java.time.temporal.ChronoUnit.DAYS.between(contract.getStartDate(), newStartDate);
                        if (diffDays > 7 || diffDays < 1) {
                                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Thời gian dời ngày nhận kho chỉ được phép từ 1 đến tối đa 7 ngày");
                        }
                }

                int months = contract.getRentalMonths() > 0 ? contract.getRentalMonths() : 1;
                LocalDate newEndDate = newStartDate.plusMonths(months);

                Long currentUnitId = contract.getStorageUnitId();
                Long facilityId = contract.getFacilityId();
                Long unitTypeId = contract.getUnitTypeId();

                // Lấy policy buffer days
                int bufferDays = 8;
                if (contract.getPolicyVersionId() != null && policyVersionRepository != null) {
                        bufferDays = policyVersionRepository.findById(contract.getPolicyVersionId())
                                        .map(p -> p.getRentalBufferDays() != null ? p.getRentalBufferDays() : 8)
                                        .orElse(8);
                }

                OffsetDateTime now = OffsetDateTime.now();
                Long reservationId = contract.getReservationId();
                long excludeReservationId = reservationId != null ? reservationId : 0L;

                Long targetUnitId = null;

                if (currentUnitId == null) {
                        // Hợp đồng chưa được phân bổ ô kho cụ thể (đang chờ Quản lý cơ sở phân bổ).
                        // Chỉ kiểm tra công suất tổng thể của cơ sở cho loại kho này trong khoảng ngày mới.
                        long busyUnits = storageUnitRepository.countBusyUnits(facilityId, unitTypeId, newStartDate, newEndDate, bufferDays);
                        long exploitableUnits = storageUnitRepository.countExploitableUnits(
                                        facilityId, unitTypeId, List.of(StorageUnitStatus.MAINTENANCE, StorageUnitStatus.OUT_OF_SERVICE));
                        if (busyUnits >= exploitableUnits) {
                                String unitTypeName = unitTypeRepository != null && unitTypeId != null
                                                ? unitTypeRepository.findById(unitTypeId).map(UnitType::getName).orElse("Kho tiêu chuẩn")
                                                : "Kho tiêu chuẩn";
                                String facilityName = facilityRepository != null && facilityId != null
                                                ? facilityRepository.findById(facilityId).map(Facility::getName).orElse("Cơ sở")
                                                : "Cơ sở";
                                throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE,
                                                String.format("Cơ sở '%s' không còn đủ công suất trống cho loại kho '%s' trong khoảng thời gian mới (%s đến %s). Vui lòng chọn ngày khác!",
                                                                facilityName, unitTypeName, newStartDate, newEndDate));
                        }
                        targetUnitId = null;
                } else {
                        StorageUnit currentUnit = storageUnitRepository.findById(currentUnitId).orElse(null);
                        UnitConflictCheckResult currentUnitCheck = evaluateUnitAvailability(
                                        currentUnit, newStartDate, newEndDate, bufferDays, contract.getId(), excludeReservationId, now);

                        if (currentUnitCheck.available()) {
                                targetUnitId = currentUnitId;
                        } else {
                                // Tìm các ô kho khác cùng loại tại cơ sở (kể cả ô đang có khách nhưng sẽ hết hạn trước newStartDate)
                                List<StorageUnit> candidateUnits = storageUnitRepository.findByFacilityId(facilityId)
                                                .stream()
                                                .filter(u -> Objects.equals(u.getUnitTypeId(), unitTypeId))
                                                .filter(u -> !Objects.equals(u.getId(), currentUnitId))
                                                .toList();

                                StorageUnit availableUnit = null;
                                List<String> candidateReasons = new ArrayList<>();

                                for (StorageUnit candidate : candidateUnits) {
                                        UnitConflictCheckResult candCheck = evaluateUnitAvailability(
                                                        candidate, newStartDate, newEndDate, bufferDays, contract.getId(), excludeReservationId, now);
                                        if (candCheck.available()) {
                                                availableUnit = candidate;
                                                break;
                                        } else {
                                                candidateReasons.add("Ô " + candidate.getCode() + ": " + candCheck.reason());
                                        }
                                }

                                if (availableUnit == null) {
                                        String currentUnitCode = currentUnit != null ? currentUnit.getCode() : ("U-" + currentUnitId);
                                        String unitTypeName = unitTypeRepository != null && unitTypeId != null
                                                        ? unitTypeRepository.findById(unitTypeId).map(UnitType::getName).orElse("Kho tiêu chuẩn")
                                                        : "Kho tiêu chuẩn";
                                        String facilityName = facilityRepository != null && facilityId != null
                                                        ? facilityRepository.findById(facilityId).map(Facility::getName).orElse("Cơ sở")
                                                        : "Cơ sở";

                                        StringBuilder sb = new StringBuilder();
                                        sb.append(String.format("Ô kho hiện tại [%s] không khả dụng trong khung ngày mới (%s đến %s) do: %s.\n\n",
                                                        currentUnitCode, newStartDate, newEndDate, currentUnitCheck.reason()));

                                        if (candidateUnits.isEmpty()) {
                                                sb.append(String.format("Tại cơ sở '%s' không còn ô kho nào khác thuộc loại '%s'.\n", facilityName, unitTypeName));
                                        } else {
                                                sb.append(String.format("Hệ thống đã tự động kiểm tra các ô kho cùng loại '%s' tại cơ sở '%s' nhưng không thể bố trí:\n",
                                                                unitTypeName, facilityName));
                                                for (String r : candidateReasons) {
                                                        sb.append("• ").append(r).append("\n");
                                                }
                                        }
                                        sb.append("\nVui lòng chọn một ngày nhận kho khác phù hợp hơn!");

                                        throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, sb.toString());
                                }

                                targetUnitId = availableUnit.getId();

                                // Cập nhật ô kho cũ nếu không còn ai giữ
                                if (currentUnit != null) {
                                        boolean stillReserved = reservationRepository.existsByStorageUnitIdAndStatusIn(
                                                        currentUnit.getId(), List.of(ReservationStatus.CONFIRMED, ReservationStatus.PENDING_PAYMENT));
                                        if (!stillReserved) {
                                                currentUnit.setStatus(StorageUnitStatus.AVAILABLE);
                                                storageUnitRepository.save(currentUnit);
                                        }
                                }

                                // Đổi trạng thái ô kho mới sang RESERVED
                                availableUnit.setStatus(StorageUnitStatus.RESERVED);
                                storageUnitRepository.save(availableUnit);
                        }
                }

                contract.setStartDate(newStartDate);
                contract.setEndDateExclusive(newEndDate);
                contract.setStorageUnitId(targetUnitId);
                contract.setRescheduleCount(contract.getRescheduleCount() + 1);
                contract.setRescheduledAt(OffsetDateTime.now());
                contractRepository.save(contract);

                // Đồng bộ sang Reservation
                if (reservationId != null) {
                        Optional<Reservation> rsvOpt = reservationRepository.findById(reservationId);
                        if (rsvOpt.isPresent()) {
                                Reservation rsv = rsvOpt.get();
                                rsv.setStartDate(newStartDate);
                                rsv.setEndDateExclusive(newEndDate);
                                rsv.setStorageUnitId(targetUnitId);
                                reservationRepository.save(rsv);
                        }
                }

                PolicyVersion reschedulePolicy = null;
                if (contract.getPolicyVersionId() != null && policyVersionRepository != null) {
                        reschedulePolicy = policyVersionRepository.findById(contract.getPolicyVersionId()).orElse(null);
                }
                long rescheduleFee = com.swp391.selfstorage.policy.service.PolicyNumbers
                                .prorateTotalUpToThousand(contract.getMonthlyPrice(), diffDays, reschedulePolicy);

                log.info("Dời thời gian hợp đồng [{}] thành công sang: {} -> {}, ô kho: {}, phí dời ngày: {} đ, lần dời: {}",
                                contract.getCode(), newStartDate, newEndDate, targetUnitId, rescheduleFee, contract.getRescheduleCount());

                return toResponse(contract);
        }

        @Override
        public void validateRescheduleAvailability(Long contractId, LocalDate newStartDate, LocalDate newEndDate) {
                RentalContract contract = contractRepository.findById(contractId)
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                Long currentUnitId = contract.getStorageUnitId();
                Long facilityId = contract.getFacilityId();
                Long unitTypeId = contract.getUnitTypeId();

                int bufferDays = 8;
                if (contract.getPolicyVersionId() != null && policyVersionRepository != null) {
                        bufferDays = policyVersionRepository.findById(contract.getPolicyVersionId())
                                        .map(p -> p.getRentalBufferDays() != null ? p.getRentalBufferDays() : 8)
                                        .orElse(8);
                }

                OffsetDateTime now = OffsetDateTime.now();
                Long reservationId = contract.getReservationId();
                long excludeReservationId = reservationId != null ? reservationId : 0L;

                if (currentUnitId == null) {
                        long busyUnits = storageUnitRepository.countBusyUnits(facilityId, unitTypeId, newStartDate, newEndDate, bufferDays);
                        long exploitableUnits = storageUnitRepository.countExploitableUnits(
                                        facilityId, unitTypeId, List.of(StorageUnitStatus.MAINTENANCE, StorageUnitStatus.OUT_OF_SERVICE));
                        if (busyUnits >= exploitableUnits) {
                                String unitTypeName = unitTypeRepository != null && unitTypeId != null
                                                ? unitTypeRepository.findById(unitTypeId).map(UnitType::getName).orElse("Kho tiêu chuẩn")
                                                : "Kho tiêu chuẩn";
                                String facilityName = facilityRepository != null && facilityId != null
                                                ? facilityRepository.findById(facilityId).map(Facility::getName).orElse("Cơ sở")
                                                : "Cơ sở";
                                throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE,
                                                String.format("Cơ sở '%s' không còn đủ công suất trống cho loại kho '%s' trong khoảng thời gian mới (%s đến %s). Vui lòng chọn ngày khác!",
                                                                facilityName, unitTypeName, newStartDate, newEndDate));
                        }
                } else {
                        StorageUnit currentUnit = storageUnitRepository.findById(currentUnitId).orElse(null);
                        UnitConflictCheckResult currentUnitCheck = evaluateUnitAvailability(
                                        currentUnit, newStartDate, newEndDate, bufferDays, contract.getId(), excludeReservationId, now);

                        if (!currentUnitCheck.available()) {
                                List<StorageUnit> candidateUnits = storageUnitRepository.findByFacilityId(facilityId)
                                                .stream()
                                                .filter(u -> Objects.equals(u.getUnitTypeId(), unitTypeId))
                                                .filter(u -> !Objects.equals(u.getId(), currentUnitId))
                                                .toList();

                                boolean hasAlternative = false;
                                for (StorageUnit candidate : candidateUnits) {
                                        UnitConflictCheckResult candCheck = evaluateUnitAvailability(
                                                        candidate, newStartDate, newEndDate, bufferDays, contract.getId(), excludeReservationId, now);
                                        if (candCheck.available()) {
                                                hasAlternative = true;
                                                break;
                                        }
                                }

                                if (!hasAlternative) {
                                        String currentUnitCode = currentUnit != null ? currentUnit.getCode() : ("U-" + currentUnitId);
                                        String unitTypeName = unitTypeRepository != null && unitTypeId != null
                                                        ? unitTypeRepository.findById(unitTypeId).map(UnitType::getName).orElse("Kho tiêu chuẩn")
                                                        : "Kho tiêu chuẩn";
                                        String facilityName = facilityRepository != null && facilityId != null
                                                        ? facilityRepository.findById(facilityId).map(Facility::getName).orElse("Cơ sở")
                                                        : "Cơ sở";
                                        throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE,
                                                        String.format("Ô kho hiện tại [%s] và các ô kho cùng loại '%s' tại cơ sở '%s' không khả dụng trong khung ngày mới (%s đến %s). Vui lòng chọn ngày khác!",
                                                                        currentUnitCode, unitTypeName, facilityName, newStartDate, newEndDate));
                                }
                        }
                }
        }

        @Override
        @Transactional
        public ContractResponse applyRescheduledStartDate(Long contractId, LocalDate newStartDate) {
                RentalContract contract = contractRepository.findById(contractId)
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (contract.getRescheduleCount() >= 1) {
                        log.warn("Hợp đồng [{}] đã dời lịch {} lần, bỏ qua gọi lặp", contract.getCode(), contract.getRescheduleCount());
                        return toResponse(contract);
                }

                int months = contract.getRentalMonths() > 0 ? contract.getRentalMonths() : 1;
                LocalDate newEndDate = newStartDate.plusMonths(months);

                Long currentUnitId = contract.getStorageUnitId();
                Long facilityId = contract.getFacilityId();
                Long unitTypeId = contract.getUnitTypeId();

                int bufferDays = 8;
                if (contract.getPolicyVersionId() != null && policyVersionRepository != null) {
                        bufferDays = policyVersionRepository.findById(contract.getPolicyVersionId())
                                        .map(p -> p.getRentalBufferDays() != null ? p.getRentalBufferDays() : 8)
                                        .orElse(8);
                }

                OffsetDateTime now = OffsetDateTime.now();
                Long reservationId = contract.getReservationId();
                long excludeReservationId = reservationId != null ? reservationId : 0L;

                Long targetUnitId = null;

                if (currentUnitId == null) {
                        targetUnitId = null;
                } else {
                        StorageUnit currentUnit = storageUnitRepository.findById(currentUnitId).orElse(null);
                        UnitConflictCheckResult currentUnitCheck = evaluateUnitAvailability(
                                        currentUnit, newStartDate, newEndDate, bufferDays, contract.getId(), excludeReservationId, now);

                        if (currentUnitCheck.available()) {
                                targetUnitId = currentUnitId;
                        } else {
                                List<StorageUnit> candidateUnits = storageUnitRepository.findByFacilityId(facilityId)
                                                .stream()
                                                .filter(u -> Objects.equals(u.getUnitTypeId(), unitTypeId))
                                                .filter(u -> !Objects.equals(u.getId(), currentUnitId))
                                                .toList();

                                StorageUnit availableUnit = null;
                                for (StorageUnit candidate : candidateUnits) {
                                        UnitConflictCheckResult candCheck = evaluateUnitAvailability(
                                                        candidate, newStartDate, newEndDate, bufferDays, contract.getId(), excludeReservationId, now);
                                        if (candCheck.available()) {
                                                availableUnit = candidate;
                                                break;
                                        }
                                }

                                if (availableUnit != null) {
                                        targetUnitId = availableUnit.getId();
                                        if (currentUnit != null) {
                                                boolean stillReserved = reservationRepository.existsByStorageUnitIdAndStatusIn(
                                                                currentUnit.getId(), List.of(ReservationStatus.CONFIRMED, ReservationStatus.PENDING_PAYMENT));
                                                if (!stillReserved) {
                                                        currentUnit.setStatus(StorageUnitStatus.AVAILABLE);
                                                        storageUnitRepository.save(currentUnit);
                                                }
                                        }
                                        availableUnit.setStatus(StorageUnitStatus.RESERVED);
                                        storageUnitRepository.save(availableUnit);
                                } else {
                                        targetUnitId = currentUnitId;
                                }
                        }
                }

                contract.setStartDate(newStartDate);
                contract.setEndDateExclusive(newEndDate);
                contract.setStorageUnitId(targetUnitId);
                contract.setRescheduleCount(contract.getRescheduleCount() + 1);
                contract.setRescheduledAt(OffsetDateTime.now());
                contractRepository.save(contract);

                if (reservationId != null) {
                        Optional<Reservation> rsvOpt = reservationRepository.findById(reservationId);
                        if (rsvOpt.isPresent()) {
                                Reservation rsv = rsvOpt.get();
                                rsv.setStartDate(newStartDate);
                                rsv.setEndDateExclusive(newEndDate);
                                rsv.setStorageUnitId(targetUnitId);
                                reservationRepository.save(rsv);
                        }
                }

                log.info("Áp dụng dời ngày thành công sau thanh toán cho hợp đồng [{}]: {} -> {}, ô kho: {}, lần dời: {}",
                                contract.getCode(), newStartDate, newEndDate, targetUnitId, contract.getRescheduleCount());

                return toResponse(contract);
        }

        @Override
        @Transactional
        public ContractResponse cancelPendingContract(Long contractId, CancelReservationRequest request, UserPrincipal currentUser) {
                RentalContract contract = contractRepository.findById(contractId)
                                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

                if (currentUser != null && currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
                        if (!contract.getCustomerId().equals(currentUser.getId())) {
                                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền thao tác trên hợp đồng này");
                        }
                }

                if (contract.getStatus() != ContractStatus.PENDING_CHECK_IN) {
                        throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                                        "Chỉ có thể hủy nhận kho cho hợp đồng đang ở trạng thái Chờ nhận kho (PENDING_CHECK_IN)");
                }

                OffsetDateTime now = OffsetDateTime.now();
                String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                                ? request.getReason()
                                : "Khách hàng hủy nhận kho trên trang Kho của tôi";

                PolicyVersion cancelPolicy = null;
                if (contract.getPolicyVersionId() != null && policyVersionRepository != null) {
                        cancelPolicy = policyVersionRepository.findById(contract.getPolicyVersionId()).orElse(null);
                }

                int coolingOffHours = cancelPolicy != null && cancelPolicy.getCancelFullRefundHours() != null
                                ? cancelPolicy.getCancelFullRefundHours()
                                : 48;
                OffsetDateTime startDateTime = contract.getStartDate() != null
                                ? contract.getStartDate().atStartOfDay().atOffset(now.getOffset())
                                : now;
                long hoursUntilStart = Duration.between(now, startDateTime).toHours();
                boolean isWithinCoolingOff = contract.getCreatedAt() != null
                                && Duration.between(contract.getCreatedAt(), now).toHours() <= coolingOffHours;
                int graceDays = cancelPolicy != null && cancelPolicy.getCheckinGraceDays() != null
                                ? cancelPolicy.getCheckinGraceDays()
                                : 10;
                long heldDays = contract.getStartDate() != null
                                ? Math.max(0, ChronoUnit.DAYS.between(contract.getStartDate(), now.toLocalDate()))
                                : 0;
                com.swp391.selfstorage.policy.service.PolicyNumbers.RefundParts parts =
                                com.swp391.selfstorage.policy.service.PolicyNumbers.cancelRefund(
                                                cancelPolicy,
                                                contract.getTotalRentalFee(),
                                                contract.getDepositAmount(),
                                                contract.getMonthlyPrice(),
                                                hoursUntilStart,
                                                isWithinCoolingOff,
                                                now.isBefore(startDateTime),
                                                heldDays,
                                                graceDays);
                long refundAmount = parts.total();
                long orderBase = System.currentTimeMillis();
                savePendingRefund(contract.getId(), contract.getReservationId(), "RENT_REFUND", parts.rent,
                                "REFUND CANCEL: " + reason, orderBase);
                savePendingRefund(contract.getId(), contract.getReservationId(), "DEPOSIT_REFUND", parts.deposit,
                                "REFUND CANCEL: " + reason, orderBase + 1);

                // Cập nhật trạng thái hợp đồng -> CANCELLED
                contract.setStatus(ContractStatus.CANCELLED);
                RentalContract saved = contractRepository.save(contract);

                // Giải phóng ô kho -> AVAILABLE
                if (contract.getStorageUnitId() != null && storageUnitRepository != null) {
                        storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(unit -> {
                                unit.setStatus(StorageUnitStatus.AVAILABLE);
                                storageUnitRepository.save(unit);
                        });
                }

                // Đồng bộ cập nhật đơn reservation nếu có
                if (contract.getReservationId() != null && reservationRepository != null) {
                        reservationRepository.findById(contract.getReservationId()).ifPresent(rsv -> {
                                rsv.setStatus(ReservationStatus.CANCELLED);
                                rsv.setCancelledAt(now);
                                rsv.setCancelReason(reason);
                                reservationRepository.save(rsv);
                        });
                }

                // Cập nhật bộ đếm chống Spam Bom hàng (BR-SPAM-01)
                if (contract.getCustomerId() != null && userRepository != null) {
                        userRepository.findById(contract.getCustomerId()).ifPresent(user -> {
                                LocalDate todayDate = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
                                if (user.getLastCancelDate() != null && user.getLastCancelDate().equals(todayDate)) {
                                        user.setDailyCancelCount(user.getDailyCancelCount() + 1);
                                } else {
                                        user.setLastCancelDate(todayDate);
                                        user.setDailyCancelCount(1);
                                }
                                userRepository.save(user);
                        });
                }

                log.info("Khách hàng đã hủy hợp đồng [{}] thành công. Số tiền hoàn lại dự kiến: {} VNĐ",
                                contract.getCode(), refundAmount);
                return toResponse(saved);
        }

        /** PIN theo độ dài trong snapshot hợp đồng, không ghim 6 số. */
        private void savePendingRefund(Long contractId, Long reservationId, String type, long amount, String reason,
                        long orderCode) {
                if (amount <= 0 || paymentTransactionRepository == null) {
                        return;
                }
                paymentTransactionRepository.save(PaymentTransaction.builder()
                                .contractId(contractId)
                                .reservationId(reservationId)
                                .amount(amount)
                                .transactionType(type)
                                .paymentMethod("BANK_TRANSFER")
                                .status("PENDING_REFUND")
                                .providerReference(reason)
                                .orderCode(orderCode)
                                .build());
        }

        private String generateUniquePin(int length) {
                int digits = Math.min(10, Math.max(4, length));
                int bound = (int) Math.pow(10, digits);
                for (int i = 0; i < 10; i++) {
                        String pin = String.format("%0" + digits + "d", ThreadLocalRandom.current().nextInt(bound));
                        if (!contractRepository.existsByAccessCode(pin))
                                return pin;
                }
                throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR,
                                "Khong the sinh Access Code, vui long thu lai");
        }

        private void linkPaymentsToContract(Long reservationId, Long contractId) {
                if (paymentTransactionRepository != null && reservationId != null && contractId != null) {
                        try {
                                List<PaymentTransaction> txns = paymentTransactionRepository.findByReservationId(reservationId);
                                if (txns != null && !txns.isEmpty()) {
                                        for (PaymentTransaction txn : txns) {
                                                if (txn.getContractId() == null) {
                                                        txn.setContractId(contractId);
                                                        paymentTransactionRepository.save(txn);
                                                        log.info("Linked PaymentTransaction id={} to Contract id={}", txn.getId(), contractId);
                                                }
                                        }
                                }
                        } catch (Exception e) {
                                log.warn("Could not link PaymentTransactions for reservationId={} to contractId={}: {}", reservationId, contractId, e.getMessage());
                        }
                }
        }

        private ContractResponse toResponse(RentalContract c) {
                ContractResponse r = new ContractResponse();
                r.setId(c.getId());
                r.setCode(c.getCode());
                r.setReservationId(c.getReservationId());
                r.setCustomerId(c.getCustomerId());
                r.setFacilityId(c.getFacilityId());
                r.setStorageUnitId(c.getStorageUnitId());
                r.setUnitTypeId(c.getUnitTypeId());
                r.setStartDate(c.getStartDate());
                r.setEndDateExclusive(c.getEndDateExclusive());
                r.setCheckinGraceDays(resolveCheckinGraceDays(c));
                r.setRentalMonths(c.getRentalMonths());
                r.setMonthlyPrice(c.getMonthlyPrice());
                r.setTotalRentalFee(c.getTotalRentalFee());
                r.setDepositAmount(c.getDepositAmount());
                r.setDepositBalance(c.getDepositBalance());
                r.setTotalAmount(c.getTotalRentalFee() + c.getDepositAmount());
                r.setAccessCode(c.getAccessCode());
                r.setStatus(c.getStatus());
                r.setCheckinDate(c.getCheckinDate());
                r.setReturnDate(c.getReturnDate());
                r.setRescheduleCount(c.getRescheduleCount());
                r.setRescheduledAt(c.getRescheduledAt());

                if (storageUnitRepository != null && c.getStorageUnitId() != null) {
                        storageUnitRepository.findById(c.getStorageUnitId()).ifPresent(su -> {
                                r.setStorageUnitCode(su.getCode());
                                r.setFloor(su.getFloor());
                                r.setPosition(su.getPosition());
                        });
                }
                if (unitTypeRepository != null && c.getUnitTypeId() != null) {
                        unitTypeRepository.findById(c.getUnitTypeId()).ifPresent(ut -> {
                                r.setUnitTypeName(ut.getName());
                                r.setUnitDimensions(String.format(java.util.Locale.US, "%.1fm x %.1fm x %.1fm",
                                                ut.getWidthM() != null ? ut.getWidthM().doubleValue() : 0.0,
                                                ut.getLengthM() != null ? ut.getLengthM().doubleValue() : 0.0,
                                                ut.getHeightM() != null ? ut.getHeightM().doubleValue() : 0.0));
                        });
                }
                if (facilityRepository != null && c.getFacilityId() != null) {
                        facilityRepository.findById(c.getFacilityId()).ifPresent(f -> {
                                r.setFacilityName(f.getName());
                                r.setFacilityAddress(f.getAddress());
                                r.setFacilityPhone(f.getPhone());
                        });
                }
                if (userService != null && c.getCustomerId() != null) {
                        try {
                                var userDto = userService.getUserById(c.getCustomerId());
                                if (userDto != null) {
                                        r.setCustomerName(userDto.getFullName());
                                        r.setCustomerPhone(userDto.getPhone());
                                        r.setCustomerEmail(userDto.getEmail());
                                        r.setCustomerIdentityNumber(userDto.getIdentityNumber());
                                }
                        } catch (Exception ignored) {
                        }
                }
                if (reservationRepository != null && c.getReservationId() != null) {
                        try {
                                reservationRepository.findById(c.getReservationId()).ifPresent(rsv -> {
                                        if (rsv.getCustomerName() != null && !rsv.getCustomerName().isBlank()) {
                                                r.setCustomerName(rsv.getCustomerName());
                                        }
                                        if (rsv.getCustomerPhone() != null && !rsv.getCustomerPhone().isBlank()) {
                                                r.setCustomerPhone(rsv.getCustomerPhone());
                                        }
                                        if (rsv.getCustomerEmail() != null && !rsv.getCustomerEmail().isBlank()) {
                                                r.setCustomerEmail(rsv.getCustomerEmail());
                                        }
                                        if (rsv.getCustomerIdentityNumber() != null && !rsv.getCustomerIdentityNumber().isBlank()) {
                                                r.setCustomerIdentityNumber(rsv.getCustomerIdentityNumber());
                                        }
                                });
                        } catch (Exception ignored) {
                        }
                }
                if (c.getCustomerName() != null && !c.getCustomerName().isBlank()) {
                        r.setCustomerName(c.getCustomerName());
                }
                if (c.getCustomerPhone() != null && !c.getCustomerPhone().isBlank()) {
                        r.setCustomerPhone(c.getCustomerPhone());
                }
                if (c.getCustomerEmail() != null && !c.getCustomerEmail().isBlank()) {
                        r.setCustomerEmail(c.getCustomerEmail());
                }
                if (c.getCustomerIdentityNumber() != null && !c.getCustomerIdentityNumber().isBlank()) {
                        r.setCustomerIdentityNumber(c.getCustomerIdentityNumber());
                }

                if (returnRequestRepository != null && c.getStatus() != ContractStatus.CLOSED) {
                        returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(c.getId()).ifPresent(req -> {
                                if (c.getStatus() != ContractStatus.TERMINATED
                                                && req.getStatus() == ReturnRequestStatus.PENDING
                                                && c.getStatus() != ContractStatus.OVERDUE) {
                                        r.setStatus(ContractStatus.PENDING_RETURN);
                                }
                                if (req.getInspectedAt() != null || c.getStatus() == ContractStatus.TERMINATED) {
                                        r.setIsInspected(req.getInspectedAt() != null);
                                        r.setDamageCost(req.getDamageCost());
                                        r.setDamageNotes(req.getConditionNote());
                                }
                                if (req.getInspectedBy() != null) {
                                        r.setAssignedStaffId(req.getInspectedBy());
                                        if (userService != null) {
                                                try {
                                                        var staffUser = userService.getUserById(req.getInspectedBy());
                                                        if (staffUser != null) {
                                                                r.setAssignedStaffName(staffUser.getFullName());
                                                        }
                                                } catch (Exception ignored) {
                                                }
                                        }
                                }
                        });
                }

                if (c.getStatus() == ContractStatus.PENDING_CHECK_IN && staffDailyAssignmentRepository != null) {
                        staffDailyAssignmentRepository.findByReferenceTypeAndReferenceId("CONTRACT", c.getId()).ifPresent(a -> {
                                if (a.getStaffId() != null) {
                                        r.setAssignedStaffId(a.getStaffId());
                                        if (userService != null) {
                                                try {
                                                        var staffUser = userService.getUserById(a.getStaffId());
                                                        if (staffUser != null) {
                                                                r.setAssignedStaffName(staffUser.getFullName());
                                                        }
                                                } catch (Exception ignored) {
                                                }
                                        }
                                }
                        });
                }

                if (c.getStatus() == ContractStatus.OVERDUE || 
                    (c.getEndDateExclusive() != null && LocalDate.now().isAfter(c.getEndDateExclusive()) 
                     && c.getStatus() != ContractStatus.CLOSED && c.getStatus() != ContractStatus.TERMINATED)) {
                        long days = java.time.temporal.ChronoUnit.DAYS.between(c.getEndDateExclusive(), LocalDate.now());
                        if (days > 0) {
                                r.setOverdueDays((int) days);
                                long accrued = previewOverdueFee(days, c.getDepositAmount(), loadOverduePreviewRates(c));
                                if (c.getStatus() == ContractStatus.OVERDUE
                                                && (c.getOverdueFeeAccrued() > 0 || c.getAccessCode() != null)) {
                                        r.setAccruedOverdueFee(c.getOverdueFeeAccrued());
                                } else {
                                        r.setAccruedOverdueFee(c.getOverdueFeeAccrued() > 0 ? c.getOverdueFeeAccrued() : accrued);
                                }
                        }
                } else {
                        r.setAccruedOverdueFee(c.getOverdueFeeAccrued());
                }

                if (c.getStatus() == ContractStatus.PENDING_CHECK_IN || c.getStatus() == ContractStatus.ACTIVE) {
                        if (supportRequestRepository != null) {
                                supportRequestRepository.findTopByContractIdOrderByCreatedAtDesc(c.getId()).ifPresent(ticket -> {
                                        if (Boolean.TRUE.equals(ticket.getRelocationRequired())
                                                        && ticket.getStatus() != com.swp391.selfstorage.support.entity.SupportStatus.RESOLVED
                                                        && ticket.getStatus() != com.swp391.selfstorage.support.entity.SupportStatus.CLOSED
                                                        && ticket.getStatus() != com.swp391.selfstorage.support.entity.SupportStatus.AUTO_CLOSED) {
                                                r.setRelocationEligible(true);
                                                r.setOpenSupportRequestId(ticket.getId());
                                        }
                                });
                        }
                        if ((r.getRelocationEligible() == null || !r.getRelocationEligible()) && c.getStorageUnitId() != null && storageUnitRepository != null) {
                                storageUnitRepository.findById(c.getStorageUnitId()).ifPresent(su -> {
                                        if (su.getStatus() == StorageUnitStatus.MAINTENANCE) {
                                                r.setRelocationEligible(true);
                                        }
                                });
                        }
                }

                if (Boolean.TRUE.equals(r.getRelocationEligible())
                                && c.getStatus() == ContractStatus.PENDING_CHECK_IN) {
                        r.setStorageUnitCode(null);
                }

                return r;
        }

        private OverduePreviewRates overdueRatesFor(RentalContract contract, Map<Long, OverduePreviewRates> cache) {
                Long policyVersionId = contract.getPolicyVersionId();
                if (policyVersionId == null) {
                        return loadOverduePreviewRates(contract);
                }
                return cache.computeIfAbsent(policyVersionId, id -> loadOverduePreviewRates(contract));
        }

        private OverduePreviewRates loadOverduePreviewRates(RentalContract contract) {
                PolicyVersion policy = null;
                if (policyVersionRepository != null && contract.getPolicyVersionId() != null) {
                        policy = policyVersionRepository.findById(contract.getPolicyVersionId()).orElse(null);
                }
                int graceDays = policy != null && policy.getOverdueGraceDays() != null
                                ? policy.getOverdueGraceDays() : 3;
                BigDecimal dailyRate = policy != null && policy.getOverdueDailyRate() != null
                                ? policy.getOverdueDailyRate() : BigDecimal.valueOf(0.10);
                BigDecimal capRate = policy != null && policy.getOverdueCapRate() != null
                                ? policy.getOverdueCapRate() : BigDecimal.valueOf(0.55);
                int terminationDays = policy != null && policy.getOverdueTerminationDays() != null
                                ? policy.getOverdueTerminationDays() : 7;
                return new OverduePreviewRates(graceDays, dailyRate, capRate, terminationDays);
        }

        /** Cùng mốc với OverdueProcessingServiceImpl: Giai đoạn 1 (5% cọc/ngày), Giai đoạn 2 (10% cọc/ngày), trần 55% tại D+7. */
        private static long previewOverdueFee(long overdueDays, long deposit, OverduePreviewRates rates) {
                if (overdueDays <= 0) {
                        return 0L;
                }
                long maxCapFee = Math.round(deposit * rates.capRate.doubleValue());
                long stage1Days = Math.min(overdueDays, rates.graceDays);
                long stage2Days = Math.max(0L, overdueDays - rates.graceDays);
                double stage1Rate = 0.05;
                long accruedByDays = Math.round(deposit * (stage1Rate * stage1Days + rates.dailyRate.doubleValue() * stage2Days));
                return Math.min(accruedByDays, maxCapFee);
        }

        private int resolveCheckinGraceDays(RentalContract c) {
                if (c == null) {
                        return 10;
                }
                if (c.getStatus() == ContractStatus.PENDING_CHECK_IN && policyVersionRepository != null) {
                        Optional<PolicyVersion> active = policyVersionRepository
                                        .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now());
                        if (active.isPresent() && active.get().getCheckinGraceDays() != null) {
                                return active.get().getCheckinGraceDays();
                        }
                }
                return PolicyNumbers.snapshotInt(c.getPolicySnapshot(), "checkinGraceDays", 10);
        }

        @Override
        @Transactional
        public ContractResponse createDirectContract(CreateDirectContractRequest request, UserPrincipal currentUser) {
                if (request == null) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Dữ liệu yêu cầu không hợp lệ");
                }

                // 1. Kiểm tra phân quyền cơ sở nếu người thực hiện là FM hoặc Staff
                if (currentUser != null && (currentUser.getRole() == UserRole.FACILITY_MANAGER || currentUser.getRole() == UserRole.FACILITY_STAFF)) {
                        List<Long> assigned = currentUser.getFacilityIds();
                        if (assigned == null || !assigned.contains(request.getFacilityId())) {
                                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền thao tác trên cơ sở này");
                        }
                }

                // 2. Xác định hoặc khởi tạo khách hàng
                final Long customerId = resolveOrRegisterCustomerId(request);
                if (customerId == null) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Không thể xác định thông tin khách hàng");
                }

                // 3. Kiểm tra cơ sở hoạt động
                var facility = (facilityRepository != null)
                                ? facilityRepository.findById(request.getFacilityId())
                                                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND))
                                : null;
                if (facility != null && !facility.isActive()) {
                        throw new CustomException(ErrorCode.FACILITY_INACTIVE, "Cơ sở hiện không hoạt động");
                }

                // 4. Kiểm tra loại ô kho hoạt động
                var unitType = (unitTypeRepository != null)
                                ? unitTypeRepository.findById(request.getUnitTypeId())
                                                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND))
                                : null;
                if (unitType != null && !unitType.isActive()) {
                        throw new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND, "Loại ô kho hiện không hoạt động");
                }

                LocalDate startDate = request.getStartDate();
                if (startDate == null || startDate.isBefore(LocalDate.now())) {
                        throw new CustomException(ErrorCode.INVALID_START_DATE, "Ngày bắt đầu thuê phải từ hôm nay trở đi");
                }

                int rentalMonths = Math.max(1, request.getRentalMonths());
                LocalDate endDateExclusive = startDate.plusMonths(rentalMonths);

                PolicyVersion policy = (policyVersionRepository != null)
                                ? policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now(ZoneOffset.UTC)).orElse(null)
                                : null;
                int bufferDays = (policy != null && policy.getRentalBufferDays() != null) ? policy.getRentalBufferDays() : 15;
                Long policyVersionId = policy != null ? policy.getId() : 1L;
                int checkinGraceDays = (policy != null && policy.getCheckinGraceDays() != null) ? policy.getCheckinGraceDays() : 10;
                int accessPinLength = (policy != null && policy.getAccessPinLength() != null) ? policy.getAccessPinLength() : 6;
                String snapshot = String.format("{\"policyVersionId\":%d,\"checkinGraceDays\":%d,\"accessPinLength\":%d}",
                                policyVersionId, checkinGraceDays, accessPinLength);

                // 5. Kiểm tra tính khả dụng của ô kho (nếu có chỉ định cụ thể) hoặc công suất toàn cơ sở
                StorageUnit assignedUnit = null;
                long exploitable = (storageUnitRepository != null)
                                ? storageUnitRepository.countExploitableUnits(request.getFacilityId(), request.getUnitTypeId(),
                                                List.of(StorageUnitStatus.MAINTENANCE, StorageUnitStatus.OUT_OF_SERVICE))
                                : 0L;
                long busy = (storageUnitRepository != null)
                                ? storageUnitRepository.countBusyUnits(request.getFacilityId(), request.getUnitTypeId(), startDate, endDateExclusive, bufferDays)
                                : 0L;
                long unassigned = (reservationRepository != null)
                                ? reservationRepository.countUnassignedOverlappingReservations(
                                                request.getFacilityId(), request.getUnitTypeId(), startDate, endDateExclusive,
                                                OffsetDateTime.now(ZoneOffset.UTC), bufferDays)
                                : 0L;

                // Quy tắc ưu tiên sống còn: Khách đặt cọc trước (Reservation) được ưu tiên tuyệt đối so với Danh sách chờ (Waitlist)
                if (request.getWaitlistId() != null) {
                        if (unassigned > 0 || (exploitable - busy - unassigned) <= 0) {
                                throw new CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE,
                                                "Không thể tạo hợp đồng cho khách từ Danh sách chờ: Hiện có " + unassigned
                                                + " đơn đặt chỗ của khách đặt trước chưa được gán ô kho. Vui lòng ưu tiên gán ô kho cho khách đặt trước tại mục 'Gán ô kho'!");
                        }
                }

                if (request.getStorageUnitId() != null) {
                        assignedUnit = storageUnitRepository.findById(request.getStorageUnitId())
                                        .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND, "Không tìm thấy ô kho đã chọn"));
                        if (!assignedUnit.getFacilityId().equals(request.getFacilityId()) || !assignedUnit.getUnitTypeId().equals(request.getUnitTypeId())) {
                                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ô kho đã chọn không thuộc đúng cơ sở hoặc loại kho đã đăng ký");
                        }
                        if (assignedUnit.getStatus() == StorageUnitStatus.MAINTENANCE || assignedUnit.getStatus() == StorageUnitStatus.OUT_OF_SERVICE) {
                                throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "Ô kho đã chọn đang trong diện bảo trì hoặc ngừng hoạt động");
                        }
                        if (assignedUnit.getStatus() == StorageUnitStatus.OCCUPIED) {
                                throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "Ô kho đã chọn hiện đang có khách thuê sử dụng");
                        }
                        if (contractRepository.existsOverlappingContractForUnit(request.getStorageUnitId(), startDate, endDateExclusive, bufferDays, 0L)) {
                                throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "Ô kho đã chọn đã có hợp đồng thuê hoạt động trong khoảng thời gian này");
                        }
                        // Bảo vệ đơn đặt cọc trước: Nếu có đơn đặt trước chưa gán (unassigned > 0) và tổng số ô kho trống hiện tại không vượt quá số đơn đặt trước,
                        // không được chiếm ô kho trống này cho khách mới
                        if (unassigned > 0 && (exploitable - busy) <= unassigned) {
                                throw new CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE,
                                                "Không thể gán ô kho này: Toàn bộ " + (exploitable - busy)
                                                + " ô kho trống hiện tại phải được ưu tiên gán cho " + unassigned
                                                + " đơn đặt chỗ trước của khách hàng. Vui lòng vào mục 'Gán ô kho' để xử lý!");
                        }
                } else if (storageUnitRepository != null) {
                        // Late-binding: Kiểm tra số lượng ô kho vật lý thực tế chưa bị chiếm bởi hợp đồng đang chạy và đơn đặt trước
                        storageUnitRepository.lockExploitableUnitIds(request.getFacilityId(), request.getUnitTypeId());
                        if (exploitable - busy - unassigned <= 0) {
                                throw new CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE,
                                                "Cơ sở đã hết ô kho trống khả dụng sau khi trừ " + unassigned
                                                + " đơn đặt chỗ trước chưa gán ô kho. Vui lòng hoàn tất gán ô kho cho khách đặt trước!");
                        }
                }

                // 6. Tính toán giá thuê và tiền đặt cọc
                long monthlyPrice = lookupMonthlyPriceDirect(request.getFacilityId(), request.getUnitTypeId());
                if (monthlyPrice <= 0) {
                        monthlyPrice = 1_000_000L;
                }
                BigDecimal multiplier = (policy != null && policy.getDepositMultiplier() != null) ? policy.getDepositMultiplier() : BigDecimal.ONE;
                long rawRent = monthlyPrice * rentalMonths;
                long deposit = Math.round((monthlyPrice * multiplier.doubleValue()) / 1000.0) * 1000;
                long totalPayable = rawRent + deposit;

                // 7. Tạo bản ghi Reservation CONFIRMED để bảo toàn toàn vẹn schema CSDL
                String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
                Reservation reservation = new Reservation();
                reservation.setCode("RSV-" + datePart + "-" + randomSuffix);
                reservation.setCustomerId(customerId);
                reservation.setFacilityId(request.getFacilityId());
                reservation.setUnitTypeId(request.getUnitTypeId());
                reservation.setStorageUnitId(request.getStorageUnitId());
                reservation.setStartDate(startDate);
                reservation.setRentalMonths(rentalMonths);
                reservation.setEndDateExclusive(endDateExclusive);
                reservation.setMonthlyPriceSnapshot(monthlyPrice);
                reservation.setPolicyVersionId(policyVersionId);
                reservation.setDiscountAmount(0L);
                reservation.setDepositAmount(deposit);
                reservation.setTotalRentalFee(rawRent);
                reservation.setTotalPayable(totalPayable);
                reservation.setStatus(ReservationStatus.CONFIRMED);
                reservation.setHoldExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(2));
                reservation.setConfirmedAt(OffsetDateTime.now(ZoneOffset.UTC));
                Reservation savedReservation = reservationRepository.save(reservation);

                // 8. Tạo giao dịch PaymentTransaction (nếu CASH: đã thu tại quầy -> SUCCESS; nếu BANK_TRANSFER: PENDING chờ khách thanh toán online)
                boolean isCash = "CASH".equalsIgnoreCase(request.getPaymentMethod());
                PaymentTransaction payment = PaymentTransaction.builder()
                                .reservationId(savedReservation.getId())
                                .transactionType(PaymentTransactionType.INITIAL_PAYMENT.name())
                                .amount(totalPayable)
                                .status(isCash ? PaymentStatus.SUCCESS.name() : PaymentStatus.PENDING.name())
                                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH")
                                .providerReference(isCash ? "DIRECT_CONTRACT_DESK_CASH" : "DIRECT_CONTRACT_BANK_TRANSFER")
                                .orderCode(ThreadLocalRandom.current().nextLong(1_000_000_000L, 9_999_999_999L))
                                .build();
                if (paymentTransactionRepository != null) {
                        payment = paymentTransactionRepository.save(payment);
                }

                // 9. Tạo RentalContract PENDING_CHECK_IN
                String contractCode = "CTR-" + datePart + "-" + ThreadLocalRandom.current().nextInt(1000, 9999);
                RentalContract contract = RentalContract.builder()
                                .code(contractCode)
                                .reservationId(savedReservation.getId())
                                .customerId(customerId)
                                .facilityId(request.getFacilityId())
                                .unitTypeId(request.getUnitTypeId())
                                .storageUnitId(request.getStorageUnitId())
                                .startDate(startDate)
                                .endDateExclusive(endDateExclusive)
                                .rentalMonths(rentalMonths)
                                .monthlyPrice(monthlyPrice)
                                .totalRentalFee(rawRent)
                                .depositAmount(deposit)
                                .depositBalance(deposit)
                                .status(ContractStatus.PENDING_CHECK_IN)
                                .policySnapshot(snapshot)
                                .policyVersionId(policyVersionId)
                                .build();
                RentalContract savedContract = contractRepository.save(contract);

                if (payment != null && paymentTransactionRepository != null) {
                        payment.setContractId(savedContract.getId());
                        paymentTransactionRepository.save(payment);
                }

                if (assignedUnit != null) {
                        assignedUnit.setStatus(StorageUnitStatus.RESERVED);
                        storageUnitRepository.save(assignedUnit);

                        if (reservationRepository != null) {
                                List<Reservation> lingering = reservationRepository.findOverlappingReservationsForUnit(
                                                assignedUnit.getId(), startDate, endDateExclusive, OffsetDateTime.now(ZoneOffset.UTC), bufferDays, savedReservation.getId());
                                for (Reservation oldRsv : lingering) {
                                        oldRsv.setStatus(ReservationStatus.FULFILLED);
                                        reservationRepository.save(oldRsv);
                                }
                        }
                }

                // 10. Nếu xuất phát từ Waitlist -> Chuyển thành CONVERTED và gán ID hợp đồng
                if (request.getWaitlistId() != null && waitlistRepository != null) {
                        waitlistRepository.findById(request.getWaitlistId()).ifPresent(w -> {
                                w.setStatus(WaitlistStatus.CONVERTED);
                                w.setConvertedReservationId(savedReservation.getId());
                                w.setConvertedContractId(savedContract.getId());
                                w.setContactTimeoutAt(null);
                                if (request.getNotes() != null && !request.getNotes().isBlank()) {
                                        w.setContactNotes(request.getNotes());
                                }
                                waitlistRepository.save(w);
                        });
                }

                log.info("Created direct contract id={}, code={}, customerId={}, facilityId={}, startDate={}",
                                savedContract.getId(), savedContract.getCode(), customerId, request.getFacilityId(), startDate);

                return toResponse(savedContract);
        }

        private Long resolveOrRegisterCustomerId(CreateDirectContractRequest request) {
                Long customerId = request.getCustomerId();
                if (customerId != null) {
                        if (userRepository != null) {
                                AppUser customer = userRepository.findById(customerId)
                                                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy khách hàng với ID: " + request.getCustomerId()));
                                if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
                                        customer.setPhone(request.getCustomerPhone().trim());
                                }
                                if (request.getCustomerFullName() != null && !request.getCustomerFullName().isBlank()
                                                && (customer.getFullName() == null || customer.getFullName().isBlank())) {
                                        customer.setFullName(request.getCustomerFullName().trim());
                                }
                                userRepository.save(customer);
                        }
                        return customerId;
                }

                // Khách vãng lai đến quầy hoặc tìm qua email / SĐT
                String email = request.getCustomerEmail() != null ? request.getCustomerEmail().trim().toLowerCase() : null;
                String phone = request.getCustomerPhone() != null ? request.getCustomerPhone().trim() : null;
                String fullName = (request.getCustomerFullName() != null && !request.getCustomerFullName().isBlank())
                                ? request.getCustomerFullName().trim()
                                : "Khách hàng tại quầy";

                if ((email == null || email.isBlank()) && (phone == null || phone.isBlank())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Vui lòng chọn khách hàng hoặc cung cấp số điện thoại / email của khách");
                }

                if (userRepository != null) {
                        AppUser existing = null;
                        if (email != null && !email.isBlank()) {
                                existing = userRepository.findByEmail(email).orElse(null);
                        }
                        if (existing == null && phone != null && !phone.isBlank()) {
                                existing = userRepository.findFirstByPhone(phone).orElse(null);
                        }

                        if (existing != null) {
                                if (phone != null && !phone.isBlank() && (existing.getPhone() == null || existing.getPhone().isBlank())) {
                                        existing.setPhone(phone);
                                }
                                if (fullName != null && !fullName.isBlank() && ("Khách hàng tại quầy".equals(existing.getFullName()) || existing.getFullName() == null)) {
                                        existing.setFullName(fullName);
                                }
                                existing = userRepository.save(existing);
                                return existing.getId();
                        } else {
                                if (email == null || email.isBlank()) {
                                        email = "khachhang." + (phone != null ? phone : System.currentTimeMillis()) + "@smartstorage.vn";
                                }
                                String encodedPass = (passwordEncoder != null)
                                                ? passwordEncoder.encode(java.util.UUID.randomUUID().toString())
                                                : "{noop}secret";
                                AppUser newUser = new AppUser(email, encodedPass, fullName, phone, null, UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE);
                                newUser = userRepository.save(newUser);
                                return newUser.getId();
                        }
                }
                return null;
        }

        private long lookupMonthlyPriceDirect(Long facilityId, Long unitTypeId) {
                if (appliedPriceLookup != null) {
                        return appliedPriceLookup.resolveMonthlyPrice(facilityId, unitTypeId)
                                        .filter(p -> p > 0)
                                        .orElse(0L);
                }
                if (facilityUnitTypePriceRepository != null) {
                        return facilityUnitTypePriceRepository.findByFacilityIdAndUnitTypeId(facilityId, unitTypeId)
                                        .map(FacilityUnitTypePrice::getMonthlyPrice)
                                        .orElse(0L);
                }
                return 0L;
        }

        private record OverduePreviewRates(int graceDays, BigDecimal dailyRate, BigDecimal capRate, int terminationDays) {
        }
}
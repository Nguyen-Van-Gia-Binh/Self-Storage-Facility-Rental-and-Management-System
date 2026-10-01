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
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.service.AuditLogService;
import com.swp391.selfstorage.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
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
        private StaffDailyAssignmentRepository staffDailyAssignmentRepository;

        @Autowired(required = false)
        private PolicyVersionRepository policyVersionRepository;

        @Autowired(required = false)
        private SupportRequestRepository supportRequestRepository;

        @Autowired(required = false)
        private ExtraFeeTypeRepository extraFeeTypeRepository;

        @Autowired(required = false)
        private AuditLogService auditLogService;

        private static final List<SupportStatus> OPEN_UNIT_DAMAGE = List.of(
                        SupportStatus.NEW, SupportStatus.ASSIGNED, SupportStatus.IN_PROGRESS);

        private static final String LEGACY_DAMAGE_REASON = "Bồi thường hư hại ô kho";
        private static final Set<String> INSPECTION_FEE_CATEGORIES = Set.of("CLEANING", "DAMAGE");
        private static final Set<String> RENTAL_FEE_CATEGORIES = Set.of("ACCESS_KEY", "VALUE_ADDED");

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

                handoverRecordRepository.save(HandoverRecord.builder()
                                .contractId(contractId)
                                .staffId(staffId)
                                .handoverAt(OffsetDateTime.now())
                                .conditionNote(request.getNotes())
                                .customerConfirmed(true)
                                .customerConfirmedAt(OffsetDateTime.now())
                                .rejected(false)
                                .build());

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

                if (contract.getStorageUnitId() != null) {
                        storageUnitRepository.findByIdForUpdate(contract.getStorageUnitId()).ifPresent(unit -> {
                                unit.setStatus(StorageUnitStatus.MAINTENANCE);
                                storageUnitRepository.save(unit);
                        });
                }

                contract.setStatus(ContractStatus.TERMINATED);
                contractRepository.save(contract);

                handoverRecordRepository.save(HandoverRecord.builder()
                                .contractId(contractId)
                                .staffId(staffId)
                                .handoverAt(OffsetDateTime.now())
                                .rejected(true)
                                .rejectionReason(request.getRejectionReason())
                                .conditionNote(request.getReportedDefects())
                                .customerConfirmed(false)
                                .build());

                return new HandoverRejectionResponse(contractId, ContractStatus.TERMINATED,
                                StorageUnitStatus.MAINTENANCE,
                                "Da ghi nhan tu choi. FM se xu ly hoan tien trong 3 ngay lam viec.");
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
                LocalDate now = LocalDate.now();
                LocalDate threshold = now.plusDays(7);
                Map<Long, OverduePreviewRates> overdueRatesByPolicy = new HashMap<>();
                Map<Long, SupportRequest> relocationTickets = findRelocationTickets(page.getContent());

                List<ContractSummaryResponse> content = page.getContent().stream().map(c -> {
                        boolean nearExp = c.getStatus() == ContractStatus.ACTIVE
                                        && !c.getEndDateExclusive().isBefore(now)
                                        && !c.getEndDateExclusive().isAfter(threshold);

                        String storageCode = (storageUnitRepository != null && c.getStorageUnitId() != null)
                                        ? storageUnitRepository.findById(c.getStorageUnitId()).map(StorageUnit::getCode).orElse("U-" + c.getStorageUnitId())
                                        : (c.getStorageUnitId() != null ? "U-" + c.getStorageUnitId() : "Chưa gán");

                        String unitName = (unitTypeRepository != null && c.getUnitTypeId() != null)
                                        ? unitTypeRepository.findById(c.getUnitTypeId()).map(UnitType::getName).orElse(null)
                                        : null;

                        String facName = (facilityRepository != null && c.getFacilityId() != null)
                                        ? facilityRepository.findById(c.getFacilityId()).map(Facility::getName).orElse(null)
                                        : null;

                        String custName = "Khách hàng #" + c.getCustomerId();
                        String custPhone = "";
                        String custIdentity = "";
                        String custEmail = "";
                        if (userService != null && c.getCustomerId() != null) {
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
                                        if (c.getStatus() == ContractStatus.OVERDUE && c.getOverdueFeeAccrued() > 0) {
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
                        if (returnRequestRepository != null && c.getStatus() != ContractStatus.CLOSED && c.getStatus() != ContractStatus.TERMINATED) {
                                var reqOpt = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(c.getId());
                                if (reqOpt.isPresent()) {
                                        var req = reqOpt.get();
                                        if (req.getStatus() == ReturnRequestStatus.PENDING) {
                                                displayStatus = ContractStatus.PENDING_RETURN;
                                        }
                                        if (req.getInspectedAt() != null) {
                                                isInspected = true;
                                                damageCost = req.getDamageCost();
                                                damageNotes = req.getConditionNote();
                                        }
                                        if (req.getInspectedBy() != null) {
                                                assignedStaffId = req.getInspectedBy();
                                                if (userService != null) {
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
                        }

                        if (c.getStatus() == ContractStatus.PENDING_CHECK_IN && staffDailyAssignmentRepository != null) {
                                var assignOpt = staffDailyAssignmentRepository.findByReferenceTypeAndReferenceId("CONTRACT", c.getId());
                                if (assignOpt.isPresent() && assignOpt.get().getStaffId() != null) {
                                        assignedStaffId = assignOpt.get().getStaffId();
                                        if (userService != null) {
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
                                        .customerId(c.getCustomerId())
                                        .customerName(custName)
                                        .customerPhone(custPhone)
                                        .customerIdentityNumber(custIdentity)
                                        .customerEmail(custEmail)
                                        .facilityId(c.getFacilityId())
                                        .facilityName(facName)
                                        .storageUnitId(c.getStorageUnitId())
                                        .storageUnitCode(storageCode)
                                        .unitTypeId(c.getUnitTypeId())
                                        .unitTypeName(unitName)
                                        .startDate(c.getStartDate())
                                        .endDateExclusive(c.getEndDateExclusive())
                                        .checkinGraceDays(PolicyNumbers.snapshotInt(c.getPolicySnapshot(), "checkinGraceDays", 10))
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
                                        .relocationEligible(relocationTickets.get(c.getId()) != null)
                                        .openSupportRequestId(relocationTickets.containsKey(c.getId())
                                                        ? relocationTickets.get(c.getId()).getId()
                                                        : null)
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
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Chỉ có thể đổi ô kho cho hợp đồng đang chờ nhận kho hoặc đang hoạt động.");
                }

                if (request.getSupportRequestId() == null) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Đổi ô chỉ thực hiện khi có phiếu hư hỏng ô kho đang mở.");
                }
                if (supportRequestRepository == null) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Không xác minh được phiếu sự cố.");
                }

                SupportRequest ticket = supportRequestRepository.findById(request.getSupportRequestId())
                                .orElseThrow(() -> new CustomException(ErrorCode.VALIDATION_FAILED,
                                                "Không tìm thấy phiếu sự cố."));
                if (ticket.getCategory() != SupportCategory.UNIT_DAMAGE) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Chỉ phiếu hư hỏng ô kho mới được dùng để đổi ô.");
                }
                if (!OPEN_UNIT_DAMAGE.contains(ticket.getStatus())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Phiếu sự cố không còn mở.");
                }
                if (!ticketMatchesCurrentUnit(ticket, contract)) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Phiếu sự cố không gắn với ô kho hiện tại của hợp đồng.");
                }
                if (contract.getStatus() == ContractStatus.PENDING_CHECK_IN
                                && !Boolean.TRUE.equals(request.getCustomerConsent())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Cần ghi nhận khách đã đồng ý đổi ô trước khi nhận kho.");
                }
                if (contract.getStatus() == ContractStatus.ACTIVE
                                && !Boolean.TRUE.equals(ticket.getRelocationRequired())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Phiếu hư hỏng chưa được đánh dấu cần di dời.");
                }

                if (contract.getStorageUnitId().equals(request.getNewStorageUnitId())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ô kho mới trùng với ô kho hiện tại.");
                }

                StorageUnit newUnit = storageUnitRepository.findById(request.getNewStorageUnitId())
                                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND, "Không tìm thấy ô kho mới."));

                if (!newUnit.getFacilityId().equals(contract.getFacilityId())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ô kho mới phải thuộc cùng cơ sở với hợp đồng.");
                }
                if (contract.getUnitTypeId() == null || newUnit.getUnitTypeId() == null
                                || !contract.getUnitTypeId().equals(newUnit.getUnitTypeId())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Chỉ được đổi sang ô cùng Unit Type.");
                }
                if (newUnit.getStatus() != StorageUnitStatus.AVAILABLE) {
                        throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "Ô kho mới hiện không có sẵn (trạng thái: " + newUnit.getStatus() + ").");
                }

                Long oldUnitId = contract.getStorageUnitId();
                StorageUnit oldUnit = storageUnitRepository.findById(oldUnitId)
                                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND, "Không tìm thấy ô kho hiện tại."));
                String oldCode = oldUnit.getCode() != null ? oldUnit.getCode() : ("U-" + oldUnitId);

                if (ticket.getStorageUnitId() == null) {
                        ticket.setStorageUnitId(oldUnitId);
                }
                oldUnit.setStatus(StorageUnitStatus.MAINTENANCE);
                storageUnitRepository.save(oldUnit);

                if (contract.getStatus() == ContractStatus.PENDING_CHECK_IN) {
                        newUnit.setStatus(StorageUnitStatus.RESERVED);
                } else {
                        newUnit.setStatus(StorageUnitStatus.OCCUPIED);
                        ticket.setRelocationRequired(Boolean.FALSE);
                }
                storageUnitRepository.save(newUnit);

                long monthlyPriceSnapshot = contract.getMonthlyPrice();
                long depositSnapshot = contract.getDepositAmount();
                contract.setStorageUnitId(newUnit.getId());
                contract.setRelocationSupportRequestId(ticket.getId());
                contract.setMonthlyPrice(monthlyPriceSnapshot);
                contract.setDepositAmount(depositSnapshot);
                contractRepository.save(contract);

                String notice = "Cơ sở đã đổi ô kho từ " + oldCode + " sang " + newUnit.getCode()
                                + ". Giá thuê và tiền cọc giữ nguyên.";
                if (notice.length() > 500) {
                        notice = notice.substring(0, 500);
                }
                ticket.setCustomerNotice(notice);
                supportRequestRepository.save(ticket);

                if (auditLogService != null) {
                        auditLogService.logAction(managerId, "REASSIGN_UNIT", "RENTAL_CONTRACT", contract.getId(),
                                        "unit:" + oldUnitId, "unit:" + newUnit.getId() + ",ticket:" + ticket.getId());
                }

                log.info("Manager {} đã đổi ô kho cho hợp đồng {} từ {} sang {} theo phiếu {}. Lý do: {}",
                                managerId, contract.getCode(), oldCode, newUnit.getCode(), ticket.getCode(), request.getReason());

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

                LocalDate now = LocalDate.now();
                LocalDate threshold = now.plusDays(7);
                boolean nearExp = contract.getStatus() == ContractStatus.ACTIVE
                                && !contract.getEndDateExclusive().isBefore(now)
                                && !contract.getEndDateExclusive().isAfter(threshold);

                return ContractSummaryResponse.builder()
                                .id(contract.getId())
                                .code(contract.getCode())
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
                                .checkinGraceDays(PolicyNumbers.snapshotInt(contract.getPolicySnapshot(), "checkinGraceDays", 10))
                                .rentalMonths(contract.getRentalMonths())
                                .monthlyPrice(contract.getMonthlyPrice())
                                .depositAmount(contract.getDepositAmount())
                                .depositBalance(contract.getDepositBalance())
                                .status(contract.getStatus())
                                .nearExpiration(nearExp)
                                .relocationEligible(false)
                                .openSupportRequestId(null)
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
                        for (SupportRequest ticket : supportRequestRepository.findByContractIdInAndCategoryAndStatusIn(
                                        contractIds, SupportCategory.UNIT_DAMAGE, OPEN_UNIT_DAMAGE)) {
                                byId.putIfAbsent(ticket.getId(), ticket);
                        }
                }
                if (!unitIds.isEmpty()) {
                        for (SupportRequest ticket : supportRequestRepository.findByStorageUnitIdInAndCategoryAndStatusIn(
                                        unitIds, SupportCategory.UNIT_DAMAGE, OPEN_UNIT_DAMAGE)) {
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
                                if (contract.getStatus() == ContractStatus.ACTIVE
                                                && !Boolean.TRUE.equals(ticket.getRelocationRequired())) {
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
                long estimatedRefund = Math.max(0, contract.getDepositBalance() - catalogSum
                                - contract.getOverdueFeeAccrued()) + earlyRentRefund;

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
                ContractExtraCharge saved = extraChargeRepository.save(ContractExtraCharge.builder()
                                .contractId(contract.getId())
                                .extraFeeTypeId(fee.getId())
                                .amount(amount)
                                .reason(fee.getCategory() + ": " + fee.getName() + (note.isBlank() ? "" : " — " + note))
                                .recordedBy(actorId)
                                .status(ExtraChargeStatus.UNPAID)
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
                long net = totalDeduction - deposit - earlyRentRefund;
                long refundAmount = Math.max(0, -net);
                long payableAmount = Math.max(0, net);

                return SettlementPreviewResponse.builder()
                                .contractId(contract.getId())
                                .depositAmount(deposit)
                                .damageCost(damage)
                                .overdueFee(overdue)
                                .unpaidExtraCharges(totalUnpaid)
                                .depositRefundAmount(refundAmount)
                                .payableAmount(payableAmount)
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
                                && contract.getStatus() != ContractStatus.OVERDUE) {
                        throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_RETURN);
                }

                ReturnRequest returnReq = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId)
                                .orElseThrow(() -> new CustomException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

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
                long net = totalDeduction - deposit - earlyRentRefund;
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
                                && contract.getStatus() != ContractStatus.OVERDUE) {
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
                if (unit.getStatus() != StorageUnitStatus.CLEANING) {
                        throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                                        "Chỉ hoàn tất dọn khi ô kho đang ở trạng thái CLEANING");
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

                if (staffDailyAssignmentRepository != null) {
                        StaffDailyAssignment assignment = staffDailyAssignmentRepository
                                        .findByReferenceTypeAndReferenceId("CONTRACT", contractId)
                                        .orElseGet(() -> StaffDailyAssignment.builder()
                                                        .facilityId(contract.getFacilityId())
                                                        .workDate(contract.getStartDate() != null ? contract.getStartDate() : LocalDate.now())
                                                        .taskType(AssignmentTaskType.HANDOVER)
                                                        .referenceType("CONTRACT")
                                                        .referenceId(contract.getId())
                                                        .build());

                        assignment.setStaffId(request.getStaffId());
                        assignment.setAssignedBy(managerId);
                        assignment.setFacilityId(contract.getFacilityId());
                        assignment.setWorkDate(contract.getStartDate() != null ? contract.getStartDate() : LocalDate.now());
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
                if (policy == null || policy.getReturnEarlyRefundRate() == null) {
                        return 0L;
                }
                long unusedDays = java.time.temporal.ChronoUnit.DAYS.between(returnDate, contract.getEndDateExclusive());
                long unusedRent = PolicyNumbers.dailyRent(contract.getMonthlyPrice(), policy) * unusedDays;
                return PolicyNumbers.share(unusedRent, policy.getReturnEarlyRefundRate());
        }

        /** PIN theo độ dài trong snapshot hợp đồng, không ghim 6 số. */
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
                r.setRentalMonths(c.getRentalMonths());
                r.setMonthlyPrice(c.getMonthlyPrice());
                r.setTotalRentalFee(c.getTotalRentalFee());
                r.setDepositAmount(c.getDepositAmount());
                r.setDepositBalance(c.getDepositBalance());
                r.setAccessCode(c.getAccessCode());
                r.setStatus(c.getStatus());
                r.setCheckinDate(c.getCheckinDate());
                r.setReturnDate(c.getReturnDate());

                if (storageUnitRepository != null && c.getStorageUnitId() != null) {
                        storageUnitRepository.findById(c.getStorageUnitId()).ifPresent(su -> r.setStorageUnitCode(su.getCode()));
                }
                if (unitTypeRepository != null && c.getUnitTypeId() != null) {
                        unitTypeRepository.findById(c.getUnitTypeId()).ifPresent(ut -> r.setUnitTypeName(ut.getName()));
                }
                if (facilityRepository != null && c.getFacilityId() != null) {
                        facilityRepository.findById(c.getFacilityId()).ifPresent(f -> r.setFacilityName(f.getName()));
                }
                if (userService != null && c.getCustomerId() != null) {
                        try {
                                var userDto = userService.getUserById(c.getCustomerId());
                                if (userDto != null) {
                                        r.setCustomerName(userDto.getFullName());
                                        r.setCustomerPhone(userDto.getPhone());
                                        r.setCustomerEmail(userDto.getEmail());
                                }
                        } catch (Exception ignored) {
                        }
                }

                if (c.getStatus() == ContractStatus.PENDING_RETURN && returnRequestRepository != null) {
                        returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(c.getId()).ifPresent(req -> {
                                if (req.getInspectedAt() != null) {
                                        r.setIsInspected(true);
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
                                r.setAccruedOverdueFee(c.getOverdueFeeAccrued() > 0 ? c.getOverdueFeeAccrued() : accrued);
                        }
                } else {
                        r.setAccruedOverdueFee(c.getOverdueFeeAccrued());
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
                                ? policy.getOverdueCapRate() : BigDecimal.valueOf(0.70);
                int terminationDays = policy != null && policy.getOverdueTerminationDays() != null
                                ? policy.getOverdueTerminationDays() : 10;
                return new OverduePreviewRates(graceDays, dailyRate, capRate, terminationDays);
        }

        /** Cùng mốc với OverdueProcessingServiceImpl: ân hạn, phạt theo ngày, rồi trần khi tới ngày chấm dứt. */
        private static long previewOverdueFee(long overdueDays, long deposit, OverduePreviewRates rates) {
                if (overdueDays <= rates.graceDays) {
                        return 0L;
                }
                long maxCapFee = Math.round(deposit * rates.capRate.doubleValue());
                if (overdueDays < rates.terminationDays) {
                        long daysToCharge = overdueDays - rates.graceDays;
                        return Math.min(Math.round(deposit * rates.dailyRate.doubleValue() * daysToCharge), maxCapFee);
                }
                return maxCapFee;
        }

        private record OverduePreviewRates(int graceDays, BigDecimal dailyRate, BigDecimal capRate, int terminationDays) {
        }
}
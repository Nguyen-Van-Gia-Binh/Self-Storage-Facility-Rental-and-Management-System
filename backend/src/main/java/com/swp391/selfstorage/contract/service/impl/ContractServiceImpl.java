package com.swp391.selfstorage.contract.service.impl;

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
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
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
import java.util.List;
import java.util.Optional;
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

                String snapshot = String.format(
                                "{\"policyVersionId\":%d,\"checkinGraceDays\":10,\"accessPinLength\":6}",
                                rsv.getPolicyVersionId() != null ? rsv.getPolicyVersionId() : 1);

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
                                .policyVersionId(rsv.getPolicyVersionId() != null ? rsv.getPolicyVersionId() : 1L)
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

                String pin = generateUniquePin();
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
                OverduePreviewRates overdueRates = loadOverduePreviewRates();

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
                                        long accrued = previewOverdueFee(days, c.getDepositAmount(), overdueRates);
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

                if (contract.getStorageUnitId().equals(request.getNewStorageUnitId())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ô kho mới trùng với ô kho hiện tại.");
                }

                StorageUnit newUnit = storageUnitRepository.findById(request.getNewStorageUnitId())
                                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND, "Không tìm thấy ô kho mới."));

                if (!newUnit.getFacilityId().equals(contract.getFacilityId())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ô kho mới phải thuộc cùng cơ sở với hợp đồng.");
                }

                if (newUnit.getStatus() != StorageUnitStatus.AVAILABLE) {
                        throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "Ô kho mới hiện không có sẵn (trạng thái: " + newUnit.getStatus() + ").");
                }

                // Giải phóng ô kho cũ về AVAILABLE
                storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(oldUnit -> {
                        oldUnit.setStatus(StorageUnitStatus.AVAILABLE);
                        storageUnitRepository.save(oldUnit);
                });

                // Cập nhật trạng thái ô kho mới tương ứng trạng thái hợp đồng
                if (contract.getStatus() == ContractStatus.PENDING_CHECK_IN) {
                        newUnit.setStatus(StorageUnitStatus.RESERVED);
                } else {
                        newUnit.setStatus(StorageUnitStatus.OCCUPIED);
                }
                storageUnitRepository.save(newUnit);

                // Cập nhật hợp đồng
                contract.setStorageUnitId(newUnit.getId());
                contractRepository.save(contract);

                log.info("Manager {} đã đổi ô kho cho hợp đồng {} sang ô kho {}. Lý do: {}",
                                managerId, contract.getCode(), newUnit.getCode(), request.getReason());

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
                                .rentalMonths(contract.getRentalMonths())
                                .monthlyPrice(contract.getMonthlyPrice())
                                .depositAmount(contract.getDepositAmount())
                                .depositBalance(contract.getDepositBalance())
                                .status(contract.getStatus())
                                .nearExpiration(nearExp)
                                .build();
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
                if (request.getDamageCost() > 0
                                && (request.getDamageNotes() == null || request.getDamageNotes().isBlank()
                                                || request.getEvidenceImageUrls() == null
                                                || request.getEvidenceImageUrls().isBlank())) {
                        throw new CustomException(ErrorCode.VALIDATION_FAILED,
                                        "Nghiệm thu có hư hại phải có ghi chú và ảnh bằng chứng");
                }

                boolean isIntact = "GOOD".equalsIgnoreCase(request.getCondition()) && request.getDamageCost() == 0;
                returnRequest.setInspectedBy(staffId);
                returnRequest.setInspectedAt(OffsetDateTime.now());
                returnRequest.setIsIntact(isIntact);
                returnRequest.setConditionNote(request.getDamageNotes());
                returnRequest.setDamageCost(request.getDamageCost());
                returnRequest.setEvidenceImageUrls(request.getEvidenceImageUrls());
                returnRequest.setCustomerConfirmed(true);
                returnRequest.setCustomerConfirmedAt(OffsetDateTime.now());
                returnRequest.setSignatureData(request.getSignatureDataUrl());
                returnRequest.setStatus(ReturnRequestStatus.PENDING);
                returnRequestRepository.save(returnRequest);

                if (request.getDamageCost() > 0) {
                        ContractExtraCharge extraCharge = ContractExtraCharge.builder()
                                        .contractId(contract.getId())
                                        .amount(request.getDamageCost())
                                        .reason("Bồi thường hư hại ô kho: "
                                                        + (request.getDamageNotes() != null ? request.getDamageNotes()
                                                                        : "Inspection damage"))
                                        .recordedBy(staffId)
                                        .status(ExtraChargeStatus.UNPAID)
                                        .build();
                        extraChargeRepository.save(extraCharge);
                }

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

                long estimatedRefund = Math.max(0, contract.getDepositBalance() - request.getDamageCost()
                                - contract.getOverdueFeeAccrued());

                return ReturnInspectionResponse.builder()
                                .id(contract.getId())
                                .status(contract.getStatus())
                                .returnDate(request.getReturnDate())
                                .estimatedDepositRefund(estimatedRefund)
                                .overdueFee(contract.getOverdueFeeAccrued())
                                .damageCost(request.getDamageCost())
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
                // Loại trừ phụ phí hư hại ô kho đã được tính độc lập ở biến damage để tránh
                // khấu trừ kép (ISS-14, BR-RET-04)
                long totalUnpaid = unpaidCharges.stream()
                                .filter(charge -> charge.getReason() == null
                                                || !charge.getReason().startsWith("Bồi thường hư hại ô kho"))
                                .mapToLong(ContractExtraCharge::getAmount)
                                .sum();

                long deposit = contract.getDepositAmount();
                long damage = returnReq.getDamageCost();
                long overdue = contract.getOverdueFeeAccrued();

                long totalDeduction = damage + overdue + totalUnpaid;
                long refundAmount = Math.max(0, deposit - totalDeduction);
                long payableAmount = Math.max(0, totalDeduction - deposit);

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

                // Cho phep FM dieu chinh so tien khau tru hu hai neu co
                if (request != null && request.getAdjustedDamageCost() != null) {
                        returnReq.setDamageCost(request.getAdjustedDamageCost());
                }

                List<ContractExtraCharge> unpaidCharges = extraChargeRepository.findByContractIdAndStatus(contractId,
                                ExtraChargeStatus.UNPAID);
                // Loại trừ phụ phí hư hại ô kho đã được tính độc lập ở biến damage để tránh
                // khấu trừ kép (ISS-14, BR-RET-04)
                long totalUnpaid = unpaidCharges.stream()
                                .filter(charge -> charge.getReason() == null
                                                || !charge.getReason().startsWith("Bồi thường hư hại ô kho"))
                                .mapToLong(ContractExtraCharge::getAmount)
                                .sum();

                long deposit = contract.getDepositAmount();
                long damage = returnReq.getDamageCost();
                long overdue = contract.getOverdueFeeAccrued();
                long totalDeduction = damage + overdue + totalUnpaid;

                long refundAmount = Math.max(0, deposit - totalDeduction);
                long payableAmount = Math.max(0, totalDeduction - deposit);

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
                                                ? "Phê duyệt quyết toán và hoàn cọc thành công"
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

        /** BR-ACC-01: PIN 6 chu so unique toan he thong */
        private String generateUniquePin() {
                for (int i = 0; i < 10; i++) {
                        String pin = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
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
                                long accrued = previewOverdueFee(days, c.getDepositAmount(), loadOverduePreviewRates());
                                r.setAccruedOverdueFee(c.getOverdueFeeAccrued() > 0 ? c.getOverdueFeeAccrued() : accrued);
                        }
                } else {
                        r.setAccruedOverdueFee(c.getOverdueFeeAccrued());
                }
                return r;
        }

        private OverduePreviewRates loadOverduePreviewRates() {
                PolicyVersion policy = null;
                if (policyVersionRepository != null) {
                        policy = policyVersionRepository
                                        .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(OffsetDateTime.now())
                                        .orElse(null);
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
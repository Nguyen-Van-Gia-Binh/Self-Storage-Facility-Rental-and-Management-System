package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.event.ContractSettledEvent;
import com.swp391.selfstorage.contract.repository.*;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    @Transactional
    public ContractResponse createFromReservation(Long reservationId) {
        var rsv = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        // Idempotent: tra ve Contract hien co neu da tao (event trung lap)
        Optional<RentalContract> existing = contractRepository.findByReservationId(reservationId);
        if (existing.isPresent()) return toResponse(existing.get());

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
    public PageResponse<ContractSummaryResponse> getContractsPage(ContractFilterRequest filter, Pageable pageable, List<Long> facilityIds) {
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
                    predicates.add(cb.like(root.get("code"), "%" + filter.getKeyword().trim() + "%"));
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

        List<ContractSummaryResponse> content = page.getContent().stream().map(c -> {
            boolean nearExp = c.getStatus() == ContractStatus.ACTIVE 
                    && !c.getEndDateExclusive().isBefore(now) 
                    && !c.getEndDateExclusive().isAfter(threshold);

            return ContractSummaryResponse.builder()
                    .id(c.getId())
                    .code(c.getCode())
                    .customerId(c.getCustomerId())
                    .facilityId(c.getFacilityId())
                    .storageUnitId(c.getStorageUnitId())
                    .unitTypeId(c.getUnitTypeId())
                    .startDate(c.getStartDate())
                    .endDateExclusive(c.getEndDateExclusive())
                    .rentalMonths(c.getRentalMonths())
                    .monthlyPrice(c.getMonthlyPrice())
                    .depositAmount(c.getDepositAmount())
                    .depositBalance(c.getDepositBalance())
                    .status(c.getStatus())
                    .nearExpiration(nearExp)
                    .build();
        }).toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
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

        return ContractFinancialSummaryResponse.builder()
                .contractId(contract.getId())
                .depositAmount(contract.getDepositAmount())
                .depositBalance(contract.getDepositBalance())
                .totalRentalFee(contract.getTotalRentalFee())
                .overdueFeeAccrued(contract.getOverdueFeeAccrued())
                .totalUnpaidExtraCharges(unpaidCharges)
                .totalOutstandingDebt(contract.getOverdueFeeAccrued() + unpaidCharges)
                .extraCharges(chargeDtos)
                .build();
    }

    // ==========================================
    // T4.3: Return & Settlement Workflow
    // ==========================================

    @Override
    @Transactional
    public ReturnNoticeResponse submitReturnNotice(Long contractId, ReturnNoticeRequest request, List<Long> facilityIds) {
        Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                ? contractRepository.findById(contractId)
                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

        RentalContract contract = contractOpt
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        if (contract.getStatus() != ContractStatus.ACTIVE && contract.getStatus() != ContractStatus.OVERDUE) {
            throw new CustomException(ErrorCode.CONTRACT_NOT_ACTIVE_OR_OVERDUE);
        }

        if (request.getIntendedReturnDate().isBefore(LocalDate.now())) {
            throw new CustomException(ErrorCode.RETURN_NOTICE_TOO_SHORT);
        }

        ReturnRequest returnRequest = ReturnRequest.builder()
                .contractId(contract.getId())
                .requestedReturnDate(request.getIntendedReturnDate())
                .conditionNote(request.getNotes())
                .status(ReturnRequestStatus.PENDING)
                .build();

        ReturnRequest saved = returnRequestRepository.save(returnRequest);

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
    public ReturnInspectionResponse submitReturnInspection(Long contractId, ReturnInspectionRequest request, Long staffId, List<Long> facilityIds) {
        Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                ? contractRepository.findById(contractId)
                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

        RentalContract contract = contractOpt
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        if (contract.getStatus() != ContractStatus.ACTIVE && contract.getStatus() != ContractStatus.OVERDUE) {
            throw new CustomException(ErrorCode.CONTRACT_NOT_ACTIVE_OR_OVERDUE);
        }

        ReturnRequest returnRequest = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId)
                .orElseGet(() -> ReturnRequest.builder()
                        .contractId(contract.getId())
                        .requestedReturnDate(request.getReturnDate())
                        .build());

        boolean isIntact = "GOOD".equalsIgnoreCase(request.getCondition()) && request.getDamageCost() == 0;
        returnRequest.setInspectedBy(staffId);
        returnRequest.setInspectedAt(OffsetDateTime.now());
        returnRequest.setIsIntact(isIntact);
        returnRequest.setConditionNote(request.getDamageNotes());
        returnRequest.setDamageCost(request.getDamageCost());
        returnRequest.setEvidenceImageUrls(request.getEvidenceImageUrls());
        returnRequest.setStatus(ReturnRequestStatus.PENDING);
        returnRequestRepository.save(returnRequest);

        if (request.getDamageCost() > 0) {
            ContractExtraCharge extraCharge = ContractExtraCharge.builder()
                    .contractId(contract.getId())
                    .amount(request.getDamageCost())
                    .reason("Bồi thường hư hại ô kho: " + (request.getDamageNotes() != null ? request.getDamageNotes() : "Inspection damage"))
                    .recordedBy(staffId)
                    .status(ExtraChargeStatus.UNPAID)
                    .build();
            extraChargeRepository.save(extraCharge);
        }

        contract.setStatus(ContractStatus.PENDING_RETURN);
        contract.setReturnDate(request.getReturnDate());
        contractRepository.save(contract);

        long estimatedRefund = Math.max(0, contract.getDepositBalance() - request.getDamageCost() - contract.getOverdueFeeAccrued());

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

        List<ContractExtraCharge> unpaidCharges = extraChargeRepository.findByContractIdAndStatus(contractId, ExtraChargeStatus.UNPAID);
        long totalUnpaid = unpaidCharges.stream().mapToLong(ContractExtraCharge::getAmount).sum();

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
    public SettlementApprovalResponse approveSettlement(Long contractId, SettlementApprovalRequest request, Long managerId, List<Long> facilityIds) {
        Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                ? contractRepository.findById(contractId)
                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

        RentalContract contract = contractOpt
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        if (contract.getStatus() != ContractStatus.PENDING_RETURN && contract.getStatus() != ContractStatus.OVERDUE) {
            throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_RETURN);
        }

        ReturnRequest returnReq = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        // Cho phep FM dieu chinh so tien khau tru hu hai neu co
        if (request != null && request.getAdjustedDamageCost() != null) {
            returnReq.setDamageCost(request.getAdjustedDamageCost());
        }

        List<ContractExtraCharge> unpaidCharges = extraChargeRepository.findByContractIdAndStatus(contractId, ExtraChargeStatus.UNPAID);
        long totalUnpaid = unpaidCharges.stream().mapToLong(ContractExtraCharge::getAmount).sum();

        long deposit = contract.getDepositAmount();
        long damage = returnReq.getDamageCost();
        long overdue = contract.getOverdueFeeAccrued();
        long totalDeduction = damage + overdue + totalUnpaid;

        long refundAmount = Math.max(0, deposit - totalDeduction);
        long payableAmount = Math.max(0, totalDeduction - deposit);

        // Cap nhat ReturnRequest
        returnReq.setStatus(ReturnRequestStatus.COMPLETED);
        returnReq.setDepositRefundAmount(refundAmount);
        returnReq.setSettledBy(managerId);
        returnReq.setSettledAt(OffsetDateTime.now());
        returnRequestRepository.save(returnReq);

        // Cap nhat Contract sang CLOSED, thu hoi ma access
        contract.setDepositBalance(0);
        contract.setStatus(ContractStatus.CLOSED);
        contract.setClosedAt(OffsetDateTime.now());
        contract.setAccessCode(null);
        contractRepository.save(contract);

        // Chuyen trang thai o kho sang CLEANING theo BR-RET-09
        if (contract.getStorageUnitId() != null) {
            storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(unit -> {
                unit.setStatus(StorageUnitStatus.CLEANING);
                storageUnitRepository.save(unit);
            });
        }

        // Ban Event cho WS3 (Payment/Ledger) ghi nhan giao dich hoan coc
        eventPublisher.publishEvent(ContractSettledEvent.builder()
                .contractId(contract.getId())
                .customerId(contract.getCustomerId())
                .facilityId(contract.getFacilityId())
                .depositRefundAmount(refundAmount)
                .payableAmount(payableAmount)
                .settledAt(returnReq.getSettledAt())
                .build());

        return SettlementApprovalResponse.builder()
                .contractId(contract.getId())
                .status(contract.getStatus())
                .depositRefundAmount(refundAmount)
                .payableAmount(payableAmount)
                .settledAt(returnReq.getSettledAt())
                .message("Phê duyệt quyết toán và hoàn cọc thành công")
                .build();
    }

    /** BR-ACC-01: PIN 6 chu so unique toan he thong */
    private String generateUniquePin() {
        for (int i = 0; i < 10; i++) {
            String pin = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
            if (!contractRepository.existsByAccessCode(pin)) return pin;
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
        return r;
    }
}
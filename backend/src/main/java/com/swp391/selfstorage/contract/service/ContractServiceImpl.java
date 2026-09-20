package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.repository.*;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

        // T3.7: Unit -> OCCUPIED
        StorageUnit unit = storageUnitRepository.findByIdForUpdate(contract.getStorageUnitId())
                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        unit.setStatus(StorageUnitStatus.OCCUPIED);
        storageUnitRepository.save(unit);

        // BR-RES-05: Reservation -> FULFILLED
        reservationRepository.findById(contract.getReservationId()).ifPresent(rsv -> {
            rsv.setStatus(ReservationStatus.FULFILLED);
            rsv.setFulfilledAt(OffsetDateTime.now());
            reservationRepository.save(rsv);
        });

        handoverRecordRepository.save(HandoverRecord.builder()
                .contractId(contractId)
                .staffId(staffId)
                .handoverAt(OffsetDateTime.now())
                .conditionNote(request.getConditionNote())
                .customerConfirmed(request.isCustomerConfirmed())
                .customerConfirmedAt(request.isCustomerConfirmed() ? OffsetDateTime.now() : null)
                .rejected(false)
                .build());

        return new CheckInResponse(contract.getId(), ContractStatus.ACTIVE,
                contract.getCheckinDate(), pin);
    }

    @Override
    @Transactional(timeout = 5)
    public HandoverRejectionResponse rejectHandover(Long contractId,
            HandoverRejectionRequest request, Long staffId, List<Long> facilityIds) {
        Optional<RentalContract> contractOpt = (facilityIds == null || facilityIds.isEmpty())
                ? contractRepository.findById(contractId)
                : contractRepository.findByIdAndFacilityIdIn(contractId, facilityIds);

        RentalContract contract = contractOpt
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        if (contract.getStatus() != ContractStatus.PENDING_CHECK_IN)
            throw new CustomException(ErrorCode.CONTRACT_NOT_PENDING_CHECKIN);

        // Unit -> MAINTENANCE — BR-CHK-06
        StorageUnit unit = storageUnitRepository.findByIdForUpdate(contract.getStorageUnitId())
                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND));
        unit.setStatus(StorageUnitStatus.MAINTENANCE);
        storageUnitRepository.save(unit);

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
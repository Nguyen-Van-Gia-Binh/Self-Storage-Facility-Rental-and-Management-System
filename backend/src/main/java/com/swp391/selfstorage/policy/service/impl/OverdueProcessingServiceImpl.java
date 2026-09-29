package com.swp391.selfstorage.policy.service.impl;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.policy.dto.OverdueProcessingResult;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.OverdueProcessingService;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OverdueProcessingServiceImpl implements OverdueProcessingService {

    private final RentalContractRepository rentalContractRepository;
    private final PolicyVersionRepository policyVersionRepository;
    private final StorageUnitRepository storageUnitRepository;

    @Override
    @Transactional
    public OverdueProcessingResult processOverdueContracts(LocalDate runDate) {
        log.info("Bắt đầu quét xử lý hợp đồng quá hạn cho ngày mốc: {}", runDate);

        // 1. Lấy PolicyVersion hiện hành (nếu chưa có thì dùng mặc định theo BR-OVD-*)
        PolicyVersion policy = policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(OffsetDateTime.now())
                .orElse(null);

        int graceDays = (policy != null && policy.getOverdueGraceDays() != null) ? policy.getOverdueGraceDays() : 3;
        BigDecimal dailyRate = (policy != null && policy.getOverdueDailyRate() != null) ? policy.getOverdueDailyRate()
                : BigDecimal.valueOf(0.10);
        BigDecimal capRate = (policy != null && policy.getOverdueCapRate() != null) ? policy.getOverdueCapRate()
                : BigDecimal.valueOf(0.70);
        int terminationDays = (policy != null && policy.getOverdueTerminationDays() != null)
                ? policy.getOverdueTerminationDays()
                : 10;

        // 2. Tìm tất cả hợp đồng có status là ACTIVE hoặc OVERDUE mà endDateExclusive
        // <= runDate
        List<RentalContract> candidateContracts = rentalContractRepository
                .findByStatusInAndEndDateExclusiveLessThanEqual(List.of(ContractStatus.ACTIVE, ContractStatus.OVERDUE),
                        runDate);

        int totalScanned = candidateContracts.size();
        int markedOverdueCount = 0;
        int penalizedCount = 0;
        int terminatedCount = 0;
        long totalPenaltiesAccrued = 0L;

        // 3. Xử lý từng hợp đồng theo số ngày quá hạn tuyệt đối
        for (RentalContract contract : candidateContracts) {
            long overdueDays = ChronoUnit.DAYS.between(contract.getEndDateExclusive(), runDate);

            if (overdueDays <= 0) {
                continue; // Chưa quá hạn, bỏ qua
            }

            long deposit = contract.getDepositAmount();
            long maxCapFee = Math.round(deposit * capRate.doubleValue());
            long daysToCharge = Math.max(0L, overdueDays - graceDays);
            long accruedByDays = Math.round(deposit * dailyRate.doubleValue() * daysToCharge);
            long calculatedFee = Math.min(accruedByDays, maxCapFee);

            if (overdueDays <= graceDays) {
                // Mốc D+1..D+3: Ân hạn (BR-OVD-01, BR-OVD-02)
                if (contract.getStatus() == ContractStatus.ACTIVE) {
                    contract.setStatus(ContractStatus.OVERDUE);
                    contract.setOverdueFeeAccrued(0L);
                    markedOverdueCount++;
                    log.info("Hợp đồng [{}] chuyển sang OVERDUE (ân hạn D+{}).", contract.getCode(), overdueDays);
                }
            } else if (overdueDays < terminationDays) {
                // Mốc D+4..D+9: Phạt theo ngày (BR-OVD-03, BR-OVD-04)
                if (contract.getStatus() == ContractStatus.ACTIVE) {
                    contract.setStatus(ContractStatus.OVERDUE);
                    markedOverdueCount++;
                }

                long penaltyDelta = calculatedFee - contract.getOverdueFeeAccrued();
                if (penaltyDelta > 0) {
                    totalPenaltiesAccrued += penaltyDelta;
                }

                contract.setOverdueFeeAccrued(calculatedFee);
                penalizedCount++;
                log.info("Hợp đồng [{}] D+{}: Phạt {} ngày = {} đ.", contract.getCode(), overdueDays, daysToCharge,
                        calculatedFee);

                // BR-OVD-05: Khóa mã truy cập tại D+7 (D+4..D+6 khách vẫn vào dọn đồ được)
                int lockAccessDays = (policy != null && policy.getOverdueLockAccessDays() != null)
                        ? policy.getOverdueLockAccessDays() : 7;
                if (overdueDays >= lockAccessDays && contract.getAccessCode() != null) {
                    contract.setAccessCode(null);
                    log.info("Hợp đồng [{}] D+{}: Khóa mã truy cập theo BR-OVD-05 (lockAccessDays={}).",
                            contract.getCode(), overdueDays, lockAccessDays);
                }
            } else {
                // Mốc D+10+: Cưỡng chế chấm dứt (BR-OVD-05, BR-OVD-07)
                contract.setOverdueFeeAccrued(calculatedFee);
                contract.setDepositBalance(Math.max(0L, deposit - calculatedFee));
                contract.setAccessCode(null); // Vô hiệu hóa mã truy cập
                contract.setStatus(ContractStatus.TERMINATED);
                terminatedCount++;

                // Chuyển ô kho vật lý sang trạng thái CLEANING
                if (contract.getStorageUnitId() != null) {
                    storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(unit -> {
                        unit.setStatus(StorageUnitStatus.CLEANING);
                        storageUnitRepository.save(unit);
                        log.info("Ô kho [{}] chuyển sang CLEANING để dọn đồ tồn.", unit.getId());
                    });
                }
                log.warn("Hợp đồng [{}] bị CHẤM DỨT cưỡng chế tại D+{}.", contract.getCode(), overdueDays);
            }

            rentalContractRepository.save(contract);
        }

        return OverdueProcessingResult.builder()
                .totalScanned(totalScanned)
                .markedOverdueCount(markedOverdueCount)
                .penalizedCount(penalizedCount)
                .terminatedCount(terminatedCount)
                .totalPenaltiesAccrued(totalPenaltiesAccrued)
                .executedAt(OffsetDateTime.now())
                .build();
    }
}

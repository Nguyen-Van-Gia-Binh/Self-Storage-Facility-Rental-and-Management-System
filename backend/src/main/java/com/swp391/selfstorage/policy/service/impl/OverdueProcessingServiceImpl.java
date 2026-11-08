package com.swp391.selfstorage.policy.service.impl;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.policy.dto.OverdueProcessingResult;
import com.swp391.selfstorage.policy.dto.OverdueSingleResult;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.OverdueProcessingService;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OverdueProcessingServiceImpl implements OverdueProcessingService {

    private final RentalContractRepository rentalContractRepository;
    private final PolicyVersionRepository policyVersionRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Autowired(required = false)
    @Lazy
    private OverdueProcessingServiceImpl self;

    /**
     * Tác vụ điều phối quét hợp đồng quá hạn (Nightly Cronjob Orchestrator).
     * <p>
     * CHÚ Ý KIẾN TRÚC DOANH NGHIỆP:
     * Phương thức này TUYỆT ĐỐI KHÔNG mang annotation @Transactional.
     * Lý do: Vòng lặp điều phối bên ngoài không được chiếm giữ kết nối DB xuyên suốt cả mẻ
     * để tránh cạn kiệt HikariCP Connection Pool. Từng hợp đồng được giao cho
     * processSingleContract(...) chạy trong transaction độc lập (REQUIRES_NEW).
     */
    @Override
    public OverdueProcessingResult processOverdueContracts(LocalDate runDate) {
        log.info("Bắt đầu quét xử lý hợp đồng quá hạn cho ngày mốc: {}", runDate);

        // Mỗi hợp đồng dùng đúng phiên bản đã lưu lúc tạo (BR-GEN-02), không lấy bản đang hiệu lực.
        Map<Long, OverdueTerms> termsByPolicyId = new HashMap<>();

        int markedOverdueCount = 0;
        int penalizedCount = 0;
        int terminatedCount = 0;
        long totalPenaltiesAccrued = 0L;

        OverdueProcessingServiceImpl runner = (self != null) ? self : this;
        // ponytail: single List query, add Page chunking when active+overdue contracts exceed 5,000
        List<RentalContract> contracts = Optional.ofNullable(
                rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(
                        List.of(ContractStatus.ACTIVE, ContractStatus.OVERDUE, ContractStatus.TERMINATED),
                        runDate))
                .orElse(List.of());

        int totalScanned = contracts.size();

        for (RentalContract contract : contracts) {
            try {
                OverdueSingleResult singleRes = runner.processSingleContract(contract, runDate, termsByPolicyId);
                if (singleRes.markedOverdue()) {
                    markedOverdueCount++;
                }
                if (singleRes.penalized()) {
                    penalizedCount++;
                }
                if (singleRes.terminated()) {
                    terminatedCount++;
                }
                totalPenaltiesAccrued += singleRes.penaltyDelta();
            } catch (Exception e) {
                log.error("[CRON OVERDUE] Lỗi khi xử lý HĐ [{}] (id={}): {}, bỏ qua và chạy tiếp HĐ khác.",
                        contract.getCode(), contract.getId(), e.getMessage(), e);
            }
        }

        // 4. Tự động giải phóng các ô kho CLEANING sau 5 ngày dọn dẹp (BR-RET-09 / Trả kho hoàn tất)
        releaseCleaningUnits(runDate);

        log.info("Hoàn tất quét quá hạn: Scanned={}, Overdue={}, Penalized={}, Terminated={}, TotalPenalty={}đ",
                totalScanned, markedOverdueCount, penalizedCount, terminatedCount, totalPenaltiesAccrued);

        return OverdueProcessingResult.builder()
                .totalScanned(totalScanned)
                .markedOverdueCount(markedOverdueCount)
                .penalizedCount(penalizedCount)
                .terminatedCount(terminatedCount)
                .totalPenaltiesAccrued(totalPenaltiesAccrued)
                .executedAt(OffsetDateTime.now())
                .build();
    }

    /**
     * Xử lý 1 hợp đồng trong một Transaction độc lập (Fault Isolation).
     * Nếu hợp đồng này gặp lỗi ném Exception, chỉ riêng transaction của nó bị rollback,
     * các hợp đồng khác trong mẻ vẫn commit an toàn.
     */
    @Transactional(rollbackFor = Exception.class)
    public OverdueSingleResult processSingleContract(RentalContract contract, LocalDate runDate, Map<Long, OverdueTerms> termsByPolicyId) {
        long overdueDays = ChronoUnit.DAYS.between(contract.getEndDateExclusive(), runDate);

        if (overdueDays <= 0) {
            return OverdueSingleResult.noop(); // Chưa quá hạn, bỏ qua
        }

        OverdueTerms terms = termsOf(contract, termsByPolicyId);
        int unitReleaseDay = terms.terminationDays() + 1; // Mặc định D+8 (sau 1 ngày niêm phong & dọn dẹp tại D+7)

        // Hợp đồng đã bị TERMINATED từ trước: Kiểm tra giải phóng bảo trì tại mốc D+8 (terminationDays + 1)
        if (contract.getStatus() == ContractStatus.TERMINATED) {
            if (overdueDays >= unitReleaseDay && contract.getStorageUnitId() != null) {
                storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(unit -> {
                    if (unit.getStatus() == StorageUnitStatus.MAINTENANCE || unit.getStatus() == StorageUnitStatus.CLEANING) {
                        StorageUnitStatus newStatus = releaseUnitToAvailableOrReserved(unit, runDate);
                        log.info("Hợp đồng [{}] chạm mốc D+{} (>={}): Ô kho [{}] tự động hoàn tất dọn dẹp, chuyển sang {}.",
                                contract.getCode(), overdueDays, unitReleaseDay, unit.getId(), newStatus);
                    }
                });
            }
            return OverdueSingleResult.noop(); // Hợp đồng đã chấm dứt không tính lại phí phạt
        }

        long deposit = contract.getDepositAmount();
        long maxCapFee = Math.round(deposit * terms.capRate().doubleValue());
        // Giai đoạn 1 (D+1..graceDays): Miễn phạt vi phạm, thu phí lưu kho quá hạn 5% cọc/ngày (3 ngày = 15% cọc)
        long stage1Days = Math.min(overdueDays, terms.graceDays());
        // Giai đoạn 2 (sau graceDays..terminationDays): Phạt vi phạm 10% cọc/ngày (4 ngày = 40% cọc)
        long stage2Days = Math.max(0L, overdueDays - terms.graceDays());
        double stage1Rate = 0.05;
        long accruedByDays = Math.round(deposit * (stage1Rate * stage1Days + terms.dailyRate().doubleValue() * stage2Days));
        long totalCalculatedFee = Math.min(accruedByDays, maxCapFee);
        long alreadyPaidPenalty = (paymentTransactionRepository != null && contract.getId() != null)
                ? paymentTransactionRepository.sumSuccessfulAmountByContractIdAndTransactionType(
                        contract.getId(), "OVERDUE_PENALTY")
                : 0L;
        long calculatedFee = Math.max(0L, totalCalculatedFee - alreadyPaidPenalty);

        boolean markedOverdue = false;
        boolean penalized = false;
        boolean terminated = false;
        long penaltyDelta = 0L;

        if (overdueDays < terms.terminationDays()) {
            // Mốc D+1..D+6: Chuyển OVERDUE, tính phí lưu kho (D+1..D+3: 5%/ngày) & phạt vi phạm (D+4..D+6: +10%/ngày)
            if (contract.getStatus() == ContractStatus.ACTIVE) {
                contract.setStatus(ContractStatus.OVERDUE);
                markedOverdue = true;
            }

            penaltyDelta = calculatedFee - contract.getOverdueFeeAccrued();
            contract.setOverdueFeeAccrued(calculatedFee);
            penalized = true;

            // BR-OVD-01, BR-OVD-05: Nguyên tắc "No Pay, No PIN" — Khóa mã truy cập theo lockAccessDays (mặc định D+1)
            int lockAccessDays = terms.lockAccessDays();
            if (overdueDays >= lockAccessDays && contract.getAccessCode() != null) {
                contract.setAccessCode(null);
                log.info("Hợp đồng [{}] D+{}: Khóa mã truy cập theo BR-OVD-05 (lockAccessDays={}).",
                        contract.getCode(), overdueDays, lockAccessDays);
            }

            log.info("Hợp đồng [{}] D+{}: Phí quá hạn lũy kế = {} đ (stage1={} ngày, stage2={} ngày).",
                    contract.getCode(), overdueDays, calculatedFee, stage1Days, stage2Days);
        } else {
            // Mốc D+7+ (terminationDays): Cưỡng chế chấm dứt & Niêm phong về Kho Tổng (BR-OVD-04, BR-OVD-07)
            // Khấu trừ 100% cọc: 55% phí quá hạn (15% + 40%) + 45% phí cắt khóa, kiểm kê, niêm phong & vận chuyển về Kho Tổng -> depositBalance = 0
            penaltyDelta = calculatedFee - contract.getOverdueFeeAccrued();
            contract.setOverdueFeeAccrued(calculatedFee);
            contract.setDepositBalance(0L);
            contract.setAccessCode(null); // Vô hiệu hóa mã truy cập vĩnh viễn
            contract.setStatus(ContractStatus.TERMINATED);
            terminated = true;

            // Chuyển ô kho vật lý sang trạng thái MAINTENANCE (1 ngày dọn dẹp tại D+7) hoặc giải phóng nếu >= D+8
            if (contract.getStorageUnitId() != null) {
                storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(unit -> {
                    if (overdueDays >= unitReleaseDay) {
                        StorageUnitStatus newStatus = releaseUnitToAvailableOrReserved(unit, runDate);
                        log.info("Hợp đồng [{}] cưỡng chế tại D+{} (>={}): Ô kho [{}] tự động hoàn tất dọn dẹp, chuyển sang {}.",
                                contract.getCode(), overdueDays, unitReleaseDay, unit.getId(), newStatus);
                    } else {
                        unit.setStatus(StorageUnitStatus.MAINTENANCE);
                        storageUnitRepository.save(unit);
                        log.info("Ô kho [{}] chuyển sang MAINTENANCE (1 ngày) để niêm phong đồ về Kho Tổng & vệ sinh.", unit.getId());
                    }
                });
            }
            log.warn("Hợp đồng [{}] bị CHẤM DỨT cưỡng chế tại D+{} (khấu trừ 100% cọc: 55% quá hạn + 45% phí niêm phong Kho Tổng).",
                    contract.getCode(), overdueDays);
        }

        rentalContractRepository.save(contract);
        return new OverdueSingleResult(markedOverdue, penalized, terminated, Math.max(0L, penaltyDelta), false);
    }

    private void releaseCleaningUnits(LocalDate runDate) {
        List<StorageUnit> cleaningUnits = storageUnitRepository.findByStatus(StorageUnitStatus.CLEANING);
        for (StorageUnit unit : cleaningUnits) {
            try {
                LocalDate cleaningStartDate = null;
                Optional<RentalContract> latestClosedContract = rentalContractRepository
                        .findFirstByStorageUnitIdAndStatusOrderByClosedAtDesc(unit.getId(), ContractStatus.CLOSED);
                if (latestClosedContract.isPresent() && latestClosedContract.get().getClosedAt() != null) {
                    cleaningStartDate = latestClosedContract.get().getClosedAt().toLocalDate();
                } else if (unit.getUpdatedAt() != null) {
                    cleaningStartDate = unit.getUpdatedAt().toLocalDate();
                }

                if (cleaningStartDate != null) {
                    long cleaningDays = ChronoUnit.DAYS.between(cleaningStartDate, runDate);
                    if (cleaningDays >= 5) {
                        StorageUnitStatus newStatus = releaseUnitToAvailableOrReserved(unit, runDate);
                        log.info("Ô kho [{}] đã dọn dẹp {} ngày (>= 5 ngày từ {}): Tự động chuyển sang {}.",
                                unit.getCode(), cleaningDays, cleaningStartDate, newStatus);
                    }
                }
            } catch (Exception e) {
                log.error("[CRON OVERDUE] Lỗi khi giải phóng ô kho cleaning [{}]: {}", unit.getCode(), e.getMessage());
            }
        }
    }

    private StorageUnitStatus releaseUnitToAvailableOrReserved(StorageUnit unit, LocalDate runDate) {
        boolean awaitingCheckIn = reservationRepository != null &&
                reservationRepository.existsActiveOrFutureReservation(
                        unit.getId(), List.of(ReservationStatus.CONFIRMED), runDate);
        StorageUnitStatus newStatus = awaitingCheckIn ? StorageUnitStatus.RESERVED : StorageUnitStatus.AVAILABLE;
        unit.setStatus(newStatus);
        storageUnitRepository.save(unit);
        return newStatus;
    }

    private OverdueTerms termsOf(RentalContract contract, Map<Long, OverdueTerms> cache) {
        Long policyVersionId = contract.getPolicyVersionId();
        if (policyVersionId == null) {
            return OverdueTerms.defaults();
        }
        return cache.computeIfAbsent(policyVersionId, this::loadTerms);
    }

    private OverdueTerms loadTerms(Long policyVersionId) {
        return policyVersionRepository.findById(policyVersionId)
                .map(OverdueTerms::from)
                .orElseGet(OverdueTerms::defaults);
    }

    private record OverdueTerms(
            int graceDays,
            BigDecimal dailyRate,
            BigDecimal capRate,
            int lockAccessDays,
            int terminationDays) {

        static OverdueTerms defaults() {
            return new OverdueTerms(3, BigDecimal.valueOf(0.10), BigDecimal.valueOf(0.55), 1, 7);
        }

        static OverdueTerms from(PolicyVersion policy) {
            return new OverdueTerms(
                    policy.getOverdueGraceDays() != null ? policy.getOverdueGraceDays() : 3,
                    policy.getOverdueDailyRate() != null ? policy.getOverdueDailyRate() : BigDecimal.valueOf(0.10),
                    policy.getOverdueCapRate() != null ? policy.getOverdueCapRate() : BigDecimal.valueOf(0.55),
                    policy.getOverdueLockAccessDays() != null ? policy.getOverdueLockAccessDays() : 1,
                    policy.getOverdueTerminationDays() != null ? policy.getOverdueTerminationDays() : 7);
        }
    }
}

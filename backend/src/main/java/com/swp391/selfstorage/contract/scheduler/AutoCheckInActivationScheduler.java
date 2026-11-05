package com.swp391.selfstorage.contract.scheduler;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Tác vụ nền tự động kích hoạt hợp đồng và ô kho sau 10 ngày ân hạn nhận kho (BR-CAN-04, BR-CHK-05).
 * Lúc 00:00 hàng ngày, quét các hợp đồng PENDING_CHECK_IN có ngày bắt đầu trước cutoffDate (T+11),
 * tự động chuyển sang ACTIVE, cấp mã PIN điện tử, cập nhật StorageUnit sang OCCUPIED,
 * và bảo toàn 100% doanh thu gói thuê.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AutoCheckInActivationScheduler {

    private final RentalContractRepository contractRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final ReservationRepository reservationRepository;

    @Scheduled(cron = "${app.scheduler.auto-checkin-cron:0 0 0 * * ?}")
    @Transactional
    public void scanAndAutoActivateContracts() {
        LocalDate cutoffDate = LocalDate.now().minusDays(10);
        List<RentalContract> pendingContracts = contractRepository.findByStatus(ContractStatus.PENDING_CHECK_IN);

        for (RentalContract contract : pendingContracts) {
            if (contract.getStartDate() != null && contract.getStartDate().isBefore(cutoffDate)) {
                log.info("Auto-Activating contract [{}] at T+11 (Start date: {}) - BR-CAN-04",
                        contract.getCode(), contract.getStartDate());

                contract.setStatus(ContractStatus.ACTIVE);
                contract.setCheckinDate(LocalDate.now());

                if (contract.getAccessCode() == null || contract.getAccessCode().isBlank()) {
                    String generatedPin = String.format("%06d", (int) (Math.random() * 900000) + 100000);
                    contract.setAccessCode(generatedPin);
                }

                contractRepository.save(contract);

                // Cập nhật trạng thái StorageUnit sang OCCUPIED
                if (contract.getStorageUnitId() != null) {
                    storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(unit -> {
                        unit.setStatus(StorageUnitStatus.OCCUPIED);
                        storageUnitRepository.save(unit);
                        log.info("Updated StorageUnit [{}] to OCCUPIED for contract [{}]",
                                unit.getCode(), contract.getCode());
                    });
                }

                // Cập nhật trạng thái Reservation sang FULFILLED
                if (contract.getReservationId() != null) {
                    reservationRepository.findById(contract.getReservationId()).ifPresent(res -> {
                        res.setStatus(ReservationStatus.FULFILLED);
                        reservationRepository.save(res);
                        log.info("Updated Reservation [{}] to FULFILLED for contract [{}]",
                                res.getId(), contract.getCode());
                    });
                }
            }
        }
    }
}

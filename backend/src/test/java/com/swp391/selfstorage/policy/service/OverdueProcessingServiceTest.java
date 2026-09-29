package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.policy.dto.OverdueProcessingResult;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.impl.OverdueProcessingServiceImpl;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OverdueProcessingServiceTest {

    @Mock
    private RentalContractRepository rentalContractRepository;

    @Mock
    private PolicyVersionRepository policyVersionRepository;

    @Mock
    private StorageUnitRepository storageUnitRepository;

    @InjectMocks
    private OverdueProcessingServiceImpl overdueProcessingService;

    private PolicyVersion mockPolicy;
    private LocalDate baseEndDate;

    @BeforeEach
    void setUp() {
        // Chính sách chuẩn: ân hạn 3 ngày, phạt 10%/ngày, trần phạt 70%, chấm dứt tại
        // D+10
        mockPolicy = PolicyVersion.builder()
                .id(1L)
                .versionNo(1)
                .effectiveFrom(OffsetDateTime.now().minusMonths(1))
                .overdueGraceDays(3)
                .overdueDailyRate(BigDecimal.valueOf(0.10))
                .overdueCapRate(BigDecimal.valueOf(0.70))
                .overdueLockAccessDays(7)   // BR-OVD-05: Khóa mã truy cập tại D+7
                .overdueTerminationDays(10) // BR-OVD-07: Cưỡng chế chấm dứt tại D+10
                .build();

        baseEndDate = LocalDate.of(2026, 10, 1);
    }

    @Test
    @DisplayName("Kịch bản 1: Mốc D+2 (Ân hạn) - Chuyển sang OVERDUE, chưa tính phạt, giữ nguyên accessCode")
    void testGracePeriod_D2_ShouldMarkOverdueWithZeroFee() {
        LocalDate runDate = baseEndDate.plusDays(2); // 2026-10-03 (D+2)

        RentalContract contract = RentalContract.builder()
                .id(100L)
                .code("CTR-001")
                .status(ContractStatus.ACTIVE)
                .endDateExclusive(baseEndDate)
                .depositAmount(2_000_000L)
                .depositBalance(2_000_000L)
                .overdueFeeAccrued(0L)
                .accessCode("AC-123456")
                .build();

        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
                .thenReturn(Optional.of(mockPolicy));
        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(1, result.getTotalScanned());
        assertEquals(1, result.getMarkedOverdueCount());
        assertEquals(0, result.getPenalizedCount());
        assertEquals(0, result.getTerminatedCount());
        assertEquals(0L, result.getTotalPenaltiesAccrued());

        assertEquals(ContractStatus.OVERDUE, contract.getStatus());
        assertEquals(0L, contract.getOverdueFeeAccrued());
        assertEquals("AC-123456", contract.getAccessCode()); // Khách vẫn mở kho bình thường
    }

    @Test
    @DisplayName("Kịch bản 2: Mốc D+5 (Phạt lũy tiến) - Phạt 2 ngày = 20% tiền cọc (400.000đ)")
    void testDailyPenalty_D5_ShouldAccruePenalty() {
        LocalDate runDate = baseEndDate.plusDays(5); // 2026-10-06 (D+5)

        // Quá hạn 5 ngày -> Số ngày tính phạt = 5 - 3 = 2 ngày -> 2 * 10% * 2.000.000 =
        // 400.000đ
        RentalContract contract = RentalContract.builder()
                .id(101L)
                .code("CTR-002")
                .status(ContractStatus.OVERDUE)
                .endDateExclusive(baseEndDate)
                .depositAmount(2_000_000L)
                .depositBalance(2_000_000L)
                .overdueFeeAccrued(0L)
                .accessCode("AC-123456")
                .build();

        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
                .thenReturn(Optional.of(mockPolicy));
        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(1, result.getTotalScanned());
        assertEquals(1, result.getPenalizedCount());
        assertEquals(400_000L, result.getTotalPenaltiesAccrued());

        assertEquals(ContractStatus.OVERDUE, contract.getStatus());
        assertEquals(400_000L, contract.getOverdueFeeAccrued());
        assertEquals("AC-123456", contract.getAccessCode()); // Vẫn cho phép vào dọn đồ
    }

    @Test
    @DisplayName("Kịch bản 3: Mốc D+10 (Cưỡng chế) - Chốt trần 70% cọc, cấn trừ cọc, khóa accessCode, TERMINATED, kho CLEANING")
    void testForcedTermination_D10_ShouldTerminateLockAccessAndSetCleaning() {
        LocalDate runDate = baseEndDate.plusDays(10); // 2026-10-11 (D+10)

        RentalContract contract = RentalContract.builder()
                .id(102L)
                .code("CTR-003")
                .status(ContractStatus.OVERDUE)
                .endDateExclusive(baseEndDate)
                .storageUnitId(55L)
                .depositAmount(2_000_000L)
                .depositBalance(2_000_000L)
                .overdueFeeAccrued(600_000L)
                .accessCode("AC-123456")
                .build();

        StorageUnit mockUnit = StorageUnit.builder()
                .id(55L)
                .status(StorageUnitStatus.OCCUPIED)
                .build();

        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
                .thenReturn(Optional.of(mockPolicy));
        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));
        when(storageUnitRepository.findById(55L)).thenReturn(Optional.of(mockUnit));

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(1, result.getTotalScanned());
        assertEquals(1, result.getTerminatedCount());

        // Phạt trần 70% cọc = 1.400.000đ
        assertEquals(1_400_000L, contract.getOverdueFeeAccrued());
        // Cấn trừ cọc: 2.000.000 - 1.400.000 = 600.000đ
        assertEquals(600_000L, contract.getDepositBalance());
        // Khóa mã mở cửa
        assertNull(contract.getAccessCode());
        // Hợp đồng chuyển sang TERMINATED
        assertEquals(ContractStatus.TERMINATED, contract.getStatus());
        // Ô kho chuyển sang CLEANING để dọn đồ
        assertEquals(StorageUnitStatus.CLEANING, mockUnit.getStatus());
    }

    @Test
    @DisplayName("Kịch bản 4: Tính bất biến (Idempotency) - Chạy 2 lần trong cùng 1 ngày không bị tính phạt nhân đôi")
    void testIdempotency_RunningTwiceOnSameDay_ShouldProduceSameFee() {
        LocalDate runDate = baseEndDate.plusDays(5); // D+5

        RentalContract contract = RentalContract.builder()
                .id(103L)
                .code("CTR-004")
                .status(ContractStatus.OVERDUE)
                .endDateExclusive(baseEndDate)
                .depositAmount(2_000_000L)
                .depositBalance(2_000_000L)
                .overdueFeeAccrued(400_000L) // Đã được tính 400.000đ từ lần chạy trước
                .accessCode("AC-123456")
                .build();

        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
                .thenReturn(Optional.of(mockPolicy));
        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        // Chạy lần 2
        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        // Số tiền phạt vẫn phải là 400.000đ, tuyệt đối không bị cộng thêm thành
        // 800.000đ
        assertEquals(400_000L, contract.getOverdueFeeAccrued());
        assertEquals(ContractStatus.OVERDUE, contract.getStatus());
    }

    @Test
    @DisplayName("BR-OVD-05: Kịch bản 5 — Mốc D+7 — Khóa mã truy cập (accessCode = null)")
    void testAccessCodeLock_D7_ShouldSuspendAccessCode() {
        LocalDate runDate = baseEndDate.plusDays(7); // D+7

        RentalContract contract = RentalContract.builder()
                .id(104L).code("CTR-005").status(ContractStatus.OVERDUE)
                .endDateExclusive(baseEndDate).depositAmount(2_000_000L)
                .depositBalance(2_000_000L).overdueFeeAccrued(400_000L)
                .accessCode("AC-777999").build();

        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
                .thenReturn(Optional.of(mockPolicy));
        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        overdueProcessingService.processOverdueContracts(runDate);

        assertNull(contract.getAccessCode(),
                "D+7: accessCode phải bị khóa (null) theo BR-OVD-05");
        assertEquals(ContractStatus.OVERDUE, contract.getStatus(),
                "D+7: hợp đồng vẫn OVERDUE, chưa TERMINATED");
    }

    @Test
    @DisplayName("BR-OVD-05: Kịch bản 6 — Mốc D+5 — Chưa đến D+7, accessCode vẫn còn để khách dọn đồ")
    void testAccessCodeLock_D5_ShouldKeepAccessCode() {
        LocalDate runDate = baseEndDate.plusDays(5); // D+5

        RentalContract contract = RentalContract.builder()
                .id(105L).code("CTR-006").status(ContractStatus.OVERDUE)
                .endDateExclusive(baseEndDate).depositAmount(2_000_000L)
                .depositBalance(2_000_000L).overdueFeeAccrued(0L)
                .accessCode("AC-555111").build();

        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
                .thenReturn(Optional.of(mockPolicy));
        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        overdueProcessingService.processOverdueContracts(runDate);

        assertEquals("AC-555111", contract.getAccessCode(),
                "D+5: accessCode CHƯA bị khóa — khách vẫn vào được để dọn đồ (BR-OVD-05)");
        assertEquals(ContractStatus.OVERDUE, contract.getStatus());
    }
}

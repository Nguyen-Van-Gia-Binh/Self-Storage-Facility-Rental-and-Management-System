package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.policy.dto.OverdueProcessingResult;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.impl.OverdueProcessingServiceImpl;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
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

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @InjectMocks
    private OverdueProcessingServiceImpl overdueProcessingService;

    private PolicyVersion mockPolicy;
    private LocalDate baseEndDate;

    @BeforeEach
    void setUp() {
        // Chính sách chuẩn chu kỳ 8 ngày: Giai đoạn 1 (3 ngày, 5%/ngày = 15%),
        // Giai đoạn 2 (4 ngày D+4..D+7, 10%/ngày = 40%), trần quá hạn 55% (+45% phí niêm phong = 100% cọc),
        // khóa PIN ngay từ D+1, cưỡng chế chấm dứt tại D+7 (dọn 1 ngày, D+8 mở bán lại).
        mockPolicy = PolicyVersion.builder()
                .id(1L)
                .versionNo(1)
                .effectiveFrom(OffsetDateTime.now().minusMonths(1))
                .overdueGraceDays(3)
                .overdueDailyRate(BigDecimal.valueOf(0.10))
                .overdueCapRate(BigDecimal.valueOf(0.55))
                .overdueLockAccessDays(1)    // BR-OVD-01, BR-OVD-05: Khóa mã truy cập ngay từ D+1 (No Pay, No PIN)
                .overdueTerminationDays(7)   // BR-OVD-07: Cưỡng chế chấm dứt & niêm phong Kho Tổng tại D+7
                .rentalBufferDays(8)
                .build();

        baseEndDate = LocalDate.of(2026, 10, 1);
        lenient().when(policyVersionRepository.findById(1L)).thenReturn(Optional.of(mockPolicy));
    }

    @Test
    @DisplayName("Kịch bản 1: Mốc D+2 (Giai đoạn 1: 5% cọc/ngày) - Chuyển sang OVERDUE, phí lưu kho 10% cọc (200.000đ), khóa accessCode")
    void testGracePeriod_D2_ShouldMarkOverdueWithStage1FeeAndLockPin() {
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

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(1, result.getTotalScanned());
        assertEquals(1, result.getMarkedOverdueCount());
        assertEquals(1, result.getPenalizedCount());
        assertEquals(0, result.getTerminatedCount());
        assertEquals(200_000L, result.getTotalPenaltiesAccrued());

        assertEquals(ContractStatus.OVERDUE, contract.getStatus());
        assertEquals(200_000L, contract.getOverdueFeeAccrued());
        assertNull(contract.getAccessCode()); // Nguyên tắc No Pay, No PIN ngay từ D+1
    }

    @Test
    @DisplayName("Kịch bản 2: Mốc D+5 (Giai đoạn 2: +10% cọc/ngày) - Lũy kế 15% (3 ngày đầu) + 20% (2 ngày phạt) = 35% cọc (700.000đ)")
    void testDailyPenalty_D5_ShouldAccruePenalty() {
        LocalDate runDate = baseEndDate.plusDays(5); // 2026-10-06 (D+5)

        // Quá hạn 5 ngày -> 3 ngày đầu (15%) + 2 ngày D+4, D+5 (20%) = 35% * 2.000.000 = 700.000đ
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

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(1, result.getTotalScanned());
        assertEquals(1, result.getPenalizedCount());
        assertEquals(700_000L, result.getTotalPenaltiesAccrued());

        assertEquals(ContractStatus.OVERDUE, contract.getStatus());
        assertEquals(700_000L, contract.getOverdueFeeAccrued());
        assertNull(contract.getAccessCode());
    }

    @Test
    @DisplayName("Kịch bản 3: Mốc D+7 (Cưỡng chế & Niêm phong Kho Tổng) - Phí quá hạn 55% cọc + 45% phí niêm phong = khấu trừ 100% cọc (depositBalance = 0), TERMINATED, kho MAINTENANCE")
    void testForcedTermination_D7_ShouldTerminateDeductFullDepositAndSetMaintenance() {
        LocalDate runDate = baseEndDate.plusDays(7); // 2026-10-08 (D+7)

        RentalContract contract = RentalContract.builder()
                .id(102L)
                .code("CTR-003")
                .status(ContractStatus.OVERDUE)
                .endDateExclusive(baseEndDate)
                .storageUnitId(55L)
                .depositAmount(2_000_000L)
                .depositBalance(2_000_000L)
                .overdueFeeAccrued(900_000L)
                .accessCode("AC-123456")
                .build();

        StorageUnit mockUnit = StorageUnit.builder()
                .id(55L)
                .status(StorageUnitStatus.OCCUPIED)
                .build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));
        when(storageUnitRepository.findById(55L)).thenReturn(Optional.of(mockUnit));

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(1, result.getTotalScanned());
        assertEquals(1, result.getTerminatedCount());

        // Phí quá hạn chạm trần 55% cọc (15% + 40%) = 1.100.000đ
        assertEquals(1_100_000L, contract.getOverdueFeeAccrued());
        // Khấu trừ nốt 45% cọc (900.000đ) làm phí cắt khóa, niêm phong & vận chuyển về Kho Tổng -> depositBalance = 0đ
        assertEquals(0L, contract.getDepositBalance());
        // Khóa mã mở cửa vĩnh viễn
        assertNull(contract.getAccessCode());
        // Hợp đồng chuyển sang TERMINATED
        assertEquals(ContractStatus.TERMINATED, contract.getStatus());
        // Ô kho chuyển sang MAINTENANCE (1 ngày) để niêm phong đồ về Kho Tổng & vệ sinh
        assertEquals(StorageUnitStatus.MAINTENANCE, mockUnit.getStatus());
    }

    @Test
    @DisplayName("Kịch bản 3.1: Mốc D+8 (Sau 1 ngày dọn dẹp) - Tự động chuyển kho sang RESERVED nếu có người đặt trước CONFIRMED")
    void testAutoReleaseUnit_D8_ShouldSetReserved_WhenConfirmedReservationExists() {
        LocalDate runDate = baseEndDate.plusDays(8); // D+8

        RentalContract terminatedContract = RentalContract.builder()
                .id(104L)
                .code("CTR-004")
                .status(ContractStatus.TERMINATED)
                .endDateExclusive(baseEndDate)
                .storageUnitId(60L)
                .build();

        StorageUnit maintenanceUnit = StorageUnit.builder()
                .id(60L)
                .status(StorageUnitStatus.MAINTENANCE)
                .build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(terminatedContract));
        when(storageUnitRepository.findById(60L)).thenReturn(Optional.of(maintenanceUnit));
        when(reservationRepository.existsActiveOrFutureReservation(eq(60L), any(), eq(runDate))).thenReturn(true);

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(1, result.getTotalScanned());
        assertEquals(StorageUnitStatus.RESERVED, maintenanceUnit.getStatus());
        verify(storageUnitRepository).save(maintenanceUnit);
    }

    @Test
    @DisplayName("Kịch bản 3.2: Mốc D+8 (Sau 1 ngày dọn dẹp) - Tự động chuyển kho sang AVAILABLE nếu chưa có ai đặt trước")
    void testAutoReleaseUnit_D8_ShouldSetAvailable_WhenNoReservationExists() {
        LocalDate runDate = baseEndDate.plusDays(8); // D+8

        RentalContract terminatedContract = RentalContract.builder()
                .id(105L)
                .code("CTR-005")
                .status(ContractStatus.TERMINATED)
                .endDateExclusive(baseEndDate)
                .storageUnitId(61L)
                .build();

        StorageUnit maintenanceUnit = StorageUnit.builder()
                .id(61L)
                .status(StorageUnitStatus.MAINTENANCE)
                .build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(terminatedContract));
        when(storageUnitRepository.findById(61L)).thenReturn(Optional.of(maintenanceUnit));
        when(reservationRepository.existsActiveOrFutureReservation(eq(61L), any(), eq(runDate))).thenReturn(false);

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(1, result.getTotalScanned());
        assertEquals(StorageUnitStatus.AVAILABLE, maintenanceUnit.getStatus());
        verify(storageUnitRepository).save(maintenanceUnit);
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
                .overdueFeeAccrued(700_000L) // Đã được tính 35% (700.000đ) từ lần chạy trước
                .accessCode(null)
                .build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        // Chạy lần 2
        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        // Số tiền phạt vẫn phải là 700.000đ, tuyệt đối không bị cộng thêm
        assertEquals(700_000L, contract.getOverdueFeeAccrued());
        assertEquals(0L, result.getTotalPenaltiesAccrued());
        assertEquals(ContractStatus.OVERDUE, contract.getStatus());
    }

    @Test
    @DisplayName("BR-OVD-01, BR-OVD-05: Kịch bản 5 — Mốc D+1 — Khóa mã truy cập ngay khi quá hạn (No Pay, No PIN) & thu 5% cọc")
    void testAccessCodeLock_D1_ShouldSuspendAccessCodeImmediately() {
        LocalDate runDate = baseEndDate.plusDays(1); // D+1

        RentalContract contract = RentalContract.builder()
                .id(104L).code("CTR-005").status(ContractStatus.ACTIVE)
                .endDateExclusive(baseEndDate).depositAmount(2_000_000L)
                .depositBalance(2_000_000L).overdueFeeAccrued(0L)
                .accessCode("AC-777999").build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        overdueProcessingService.processOverdueContracts(runDate);

        assertNull(contract.getAccessCode(),
                "D+1: accessCode phải bị khóa ngay (null) theo nguyên tắc No Pay, No PIN (BR-OVD-05)");
        assertEquals(ContractStatus.OVERDUE, contract.getStatus(),
                "D+1: hợp đồng chuyển sang OVERDUE");
        assertEquals(100_000L, contract.getOverdueFeeAccrued(),
                "D+1: phí lưu kho quá hạn 5% cọc = 100.000đ");
    }

    @Test
    @DisplayName("BR-OVD-02: Kịch bản 6 — Mốc D+3 — Kết thúc 3 ngày đầu, tổng phí lưu kho = 15% cọc (300.000đ)")
    void testStage1End_D3_ShouldAccrue15PercentDeposit() {
        LocalDate runDate = baseEndDate.plusDays(3); // D+3

        RentalContract contract = RentalContract.builder()
                .id(105L).code("CTR-006").status(ContractStatus.OVERDUE)
                .endDateExclusive(baseEndDate).depositAmount(2_000_000L)
                .depositBalance(2_000_000L).overdueFeeAccrued(200_000L)
                .accessCode("AC-555111").build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        overdueProcessingService.processOverdueContracts(runDate);

        assertNull(contract.getAccessCode());
        assertEquals(300_000L, contract.getOverdueFeeAccrued());
        assertEquals(ContractStatus.OVERDUE, contract.getStatus());
    }

    @Test
    @DisplayName("BR-GEN-02: quá hạn dùng policyVersionId trên hợp đồng, không dùng chính sách đang hiệu lực")
    void usesContractPolicySnapshot_notTheCurrentPolicy() {
        PolicyVersion currentPolicy = PolicyVersion.builder()
                .id(9L)
                .overdueGraceDays(0)
                .overdueDailyRate(BigDecimal.valueOf(0.50))
                .overdueCapRate(BigDecimal.valueOf(0.90))
                .overdueLockAccessDays(1)
                .overdueTerminationDays(30)
                .build();
        lenient().when(policyVersionRepository
                        .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any()))
                .thenReturn(Optional.of(currentPolicy));

        LocalDate runDate = baseEndDate.plusDays(5);
        RentalContract contract = RentalContract.builder()
                .id(106L).code("CTR-007").status(ContractStatus.OVERDUE)
                .endDateExclusive(baseEndDate).depositAmount(2_000_000L)
                .depositBalance(2_000_000L).overdueFeeAccrued(0L)
                .policyVersionId(1L)
                .accessCode("AC-000111")
                .build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));

        overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(700_000L, contract.getOverdueFeeAccrued());
        assertNull(contract.getAccessCode());
        verify(policyVersionRepository, never())
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any());
    }

    @Test
    @DisplayName("BR-RET-09: Ô kho CLEANING chưa đủ 5 ngày thì giữ nguyên trạng thái CLEANING")
    void testCleaningUnit_LessThan5Days_ShouldRemainCleaning() {
        LocalDate runDate = LocalDate.of(2026, 10, 11);
        StorageUnit unit = StorageUnit.builder()
                .id(201L).code("Q1-B201").status(StorageUnitStatus.CLEANING)
                .updatedAt(OffsetDateTime.parse("2026-10-08T00:00:00Z"))
                .build();

        RentalContract closedContract = RentalContract.builder()
                .id(999L).code("CTR-CLOSED").status(ContractStatus.CLOSED)
                .closedAt(OffsetDateTime.parse("2026-10-08T00:00:00Z"))
                .build();

        when(storageUnitRepository.findByStatus(StorageUnitStatus.CLEANING)).thenReturn(List.of(unit));
        when(rentalContractRepository.findFirstByStorageUnitIdAndStatusOrderByClosedAtDesc(201L, ContractStatus.CLOSED))
                .thenReturn(Optional.of(closedContract));

        overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(StorageUnitStatus.CLEANING, unit.getStatus(), "Mới được 3 ngày (<5), vẫn phải là CLEANING");
        verify(storageUnitRepository, never()).save(unit);
    }

    @Test
    @DisplayName("BR-RET-09: Ô kho CLEANING đủ 5 ngày trở lên tự động giải phóng sang AVAILABLE")
    void testCleaningUnit_5DaysOrMore_ShouldBecomeAvailable() {
        LocalDate runDate = LocalDate.of(2026, 10, 11);
        StorageUnit unit = StorageUnit.builder()
                .id(201L).code("Q1-B201").status(StorageUnitStatus.CLEANING)
                .updatedAt(OffsetDateTime.parse("2026-10-05T00:00:00Z"))
                .build();

        RentalContract closedContract = RentalContract.builder()
                .id(999L).code("CTR-CLOSED").status(ContractStatus.CLOSED)
                .closedAt(OffsetDateTime.parse("2026-10-05T00:00:00Z"))
                .build();

        when(storageUnitRepository.findByStatus(StorageUnitStatus.CLEANING)).thenReturn(List.of(unit));
        when(rentalContractRepository.findFirstByStorageUnitIdAndStatusOrderByClosedAtDesc(201L, ContractStatus.CLOSED))
                .thenReturn(Optional.of(closedContract));
        when(reservationRepository.existsActiveOrFutureReservation(eq(201L), anyList(), eq(runDate)))
                .thenReturn(false);

        overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(StorageUnitStatus.AVAILABLE, unit.getStatus(), "Đã qua 6 ngày (>=5), tự động chuyển sang AVAILABLE");
        verify(storageUnitRepository).save(unit);
    }

    @Test
    @DisplayName("Batch Fault-Tolerance: Hợp đồng lỗi không làm gián đoạn các hợp đồng khác trong mẻ quét")
    void testBatchFaultTolerance_SingleFailureDoesNotHaltBatch() {
        LocalDate runDate = baseEndDate.plusDays(5); // 2026-10-06 (D+5)

        // Hợp đồng 1: Bị thiếu dữ liệu hoặc lỗi
        RentalContract faultyContract = RentalContract.builder()
                .id(991L)
                .code("CTR-FAIL")
                .status(ContractStatus.ACTIVE)
                .endDateExclusive(null) // Gây NullPointerException trong logic xử lý
                .depositAmount(2_000_000L)
                .depositBalance(2_000_000L)
                .build();

        // Hợp đồng 2: Bình thường
        RentalContract normalContract = RentalContract.builder()
                .id(992L)
                .code("CTR-OK")
                .status(ContractStatus.ACTIVE)
                .endDateExclusive(baseEndDate)
                .depositAmount(2_000_000L)
                .depositBalance(2_000_000L)
                .overdueFeeAccrued(0L)
                .build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(faultyContract, normalContract));

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        // HĐ 1 bị lỗi và bỏ qua, HĐ 2 vẫn được xử lý phạt thành công
        assertEquals(2, result.getTotalScanned(), "Cả 2 HĐ đều được quét");
        assertEquals(1, result.getPenalizedCount(), "HĐ bình thường vẫn được tính phạt D+5 thành công");
        assertEquals(ContractStatus.OVERDUE, normalContract.getStatus());
        assertEquals(700_000L, normalContract.getOverdueFeeAccrued());
    }

    @Test
    @DisplayName("Batch Processing: Quét tuần tự danh sách nhiều hợp đồng trong cùng mẻ")
    void testMultiPagePagination_ShouldProcessAllPagesWithoutOom() {
        LocalDate runDate = baseEndDate.plusDays(2); // D+2 (chuyển OVERDUE)

        RentalContract c1 = RentalContract.builder()
                .id(1L).code("CTR-PAGE0").status(ContractStatus.ACTIVE)
                .endDateExclusive(baseEndDate).depositAmount(1_000_000L).depositBalance(1_000_000L).build();
        RentalContract c2 = RentalContract.builder()
                .id(2L).code("CTR-PAGE1").status(ContractStatus.ACTIVE)
                .endDateExclusive(baseEndDate).depositAmount(1_000_000L).depositBalance(1_000_000L).build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(c1, c2));

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(2, result.getTotalScanned(), "Cả 2 hợp đồng đều được quét lần lượt");
        assertEquals(2, result.getMarkedOverdueCount(), "Cả 2 hợp đồng đều được chuyển sang OVERDUE");
        verify(rentalContractRepository).findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate));
    }

    @Test
    @DisplayName("BR-OVD-08: Khách đóng phạt 25% ở D+4 được mở PIN nhưng không dọn đồ -> D+5 tự khóa lại PIN và chỉ tính thêm 10% ngày mới")
    void testPaidPenaltyAtD4_ThenStaysToD5_ShouldRelockPinAndChargeOnlyNewDay() {
        LocalDate runDate = baseEndDate.plusDays(5); // D+5 (lũy kế 15% + 20% = 35% = 700.000đ)

        RentalContract contract = RentalContract.builder()
                .id(108L)
                .code("CTR-008")
                .status(ContractStatus.OVERDUE)
                .endDateExclusive(baseEndDate)
                .depositAmount(2_000_000L)
                .depositBalance(2_000_000L)
                .overdueFeeAccrued(0L) // Đã đóng 500.000đ (25%) ở D+4 nên nợ tạm thời về 0
                .accessCode("654321")  // Mã PIN tạm thời được cấp lại ở D+4
                .build();

        when(rentalContractRepository.findByStatusInAndEndDateExclusiveLessThanEqual(anyList(), eq(runDate)))
                .thenReturn(List.of(contract));
        when(paymentTransactionRepository.sumSuccessfulAmountByContractIdAndTransactionType(108L, "OVERDUE_PENALTY"))
                .thenReturn(500_000L);

        OverdueProcessingResult result = overdueProcessingService.processOverdueContracts(runDate);

        assertEquals(1, result.getPenalizedCount());
        assertEquals(200_000L, contract.getOverdueFeeAccrued(), "Chỉ thu thêm 1 ngày mới D+5 (200.000đ), không thu trùng 500.000đ đã đóng ở D+4");
        assertNull(contract.getAccessCode(), "Sang 00:05 D+5 khách chưa báo trả kho thì phải tự động khóa lại mã PIN");
    }
}

package com.swp391.selfstorage.policy.integration;

import com.swp391.selfstorage.contract.dto.ReturnInspectionRequest;
import com.swp391.selfstorage.contract.dto.ReturnInspectionResponse;
import com.swp391.selfstorage.contract.dto.SettlementPreviewResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.service.ContractService;
import com.swp391.selfstorage.policy.dto.OverdueProcessingResult;
import com.swp391.selfstorage.policy.entity.ExtraFeeType;
import com.swp391.selfstorage.policy.repository.ExtraFeeTypeRepository;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.OverdueProcessingService;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class OverdueAndRefundIntegrationTest {

    @Autowired
    private OverdueProcessingService overdueProcessingService;

    @Autowired
    private ContractService contractService;

    @Autowired
    private RentalContractRepository rentalContractRepository;

    @Autowired
    private StorageUnitRepository storageUnitRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ExtraFeeTypeRepository extraFeeTypeRepository;

    @Autowired
    @Autowired
    private PolicyVersionRepository policyVersionRepository;

    private StorageUnit testUnit;
    private LocalDate baseEndDate;

    @BeforeEach
    void setUp() {
        baseEndDate = LocalDate.of(2026, 10, 1);

        policyVersionRepository.findById(1L).ifPresent(policy -> {
            policy.setOverdueGraceDays(3);
            policy.setOverdueDailyRate(BigDecimal.valueOf(0.10));
            policy.setOverdueCapRate(BigDecimal.valueOf(0.55));
            policy.setOverdueLockAccessDays(1);
            policy.setOverdueTerminationDays(7);
            policy.setRentalBufferDays(8);
            policyVersionRepository.save(policy);
        });

        // Tạo ô kho mẫu trong DB thật
        testUnit = StorageUnit.builder()
                .facilityId(1L)
                .unitTypeId(1L)
                .code("UNIT-TEST-" + UUID.randomUUID().toString().substring(0, 8))
                .status(StorageUnitStatus.OCCUPIED)
                .build();
        testUnit = storageUnitRepository.save(testUnit);
    }

    private Long saveDamageFee(long amount) {
        ExtraFeeType fee = ExtraFeeType.builder()
                .code("DMG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name("Bồi thường kiểm thử")
                .category("DAMAGE")
                .amount(amount)
                .feeType("FIXED")
                .facilityId(1L)
                .isActive(true)
                .effectiveFrom(LocalDate.of(2026, 1, 1))
                .build();
        return extraFeeTypeRepository.save(fee).getId();
    }

    private RentalContract createAndSaveContract(LocalDate endDate, long depositAmount) {
        // 1. Tạo và lưu bản ghi Reservation hợp lệ vào SQL Server để thỏa mãn khóa
        // ngoại fk_rental_contract_reservation_id
        Reservation reservation = new Reservation();
        reservation.setCode("RES-" + UUID.randomUUID().toString().substring(0, 8));
        reservation.setCustomerId(1L); // ID 1 là customer@storage.vn đã có sẵn trong bảng app_user
        reservation.setFacilityId(1L);
        reservation.setUnitTypeId(1L);
        reservation.setStorageUnitId(testUnit.getId());
        reservation.setStartDate(endDate.minusMonths(3));
        reservation.setRentalMonths(3);
        reservation.setEndDateExclusive(endDate);
        reservation.setMonthlyPriceSnapshot(2_000_000L);
        reservation.setPolicyVersionId(1L);
        reservation.setDiscountAmount(0L);
        reservation.setDepositAmount(depositAmount);
        reservation.setTotalRentalFee(6_000_000L);
        reservation.setTotalPayable(6_000_000L + depositAmount);
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setHoldExpiresAt(OffsetDateTime.now().plusDays(2));
        reservation = reservationRepository.save(reservation);

        // 2. Tạo RentalContract với reservationId lấy từ bản ghi cha vừa lưu
        RentalContract contract = RentalContract.builder()
                .code("CTR-" + UUID.randomUUID().toString().substring(0, 8))
                .reservationId(reservation.getId())
                .customerId(1L)
                .facilityId(1L)
                .storageUnitId(testUnit.getId())
                .unitTypeId(1L)
                .startDate(endDate.minusMonths(3))
                .endDateExclusive(endDate)
                .rentalMonths(3)
                .monthlyPrice(2_000_000L)
                .totalRentalFee(6_000_000L)
                .depositAmount(depositAmount)
                .depositBalance(depositAmount)
                .accessCode("AC-999999")
                .status(ContractStatus.ACTIVE)
                .policyVersionId(1L)
                .overdueFeeAccrued(0L)
                .build();
        return rentalContractRepository.save(contract);
    }

    @Test
    @DisplayName("Kịch bản 1: Trả kho tại D+2 (Giai đoạn 1: 5% cọc/ngày) -> Phí lưu kho 10% cọc (200k) -> Quyết toán cấn trừ hoàn 90% tiền cọc (1.800.000đ)")
    void testStage1Return_ShouldDeduct10PercentAndRefundRemainingDeposit() {
        RentalContract contract = createAndSaveContract(baseEndDate, 2_000_000L);
        LocalDate returnDate = baseEndDate.plusDays(2); // D+2 (2 ngày * 5% = 10% = 200.000đ)

        // 1. Cronjob quét qua đêm D+2
        OverdueProcessingResult cronResult = overdueProcessingService.processOverdueContracts(returnDate);
        assertTrue(cronResult.getTotalScanned() >= 1);

        // Hợp đồng chuyển sang OVERDUE, khóa PIN và thu 10% cọc (200.000đ)
        RentalContract updatedContract = rentalContractRepository.findById(contract.getId()).orElseThrow();
        assertEquals(ContractStatus.OVERDUE, updatedContract.getStatus());
        assertEquals(200_000L, updatedContract.getOverdueFeeAccrued());
        assertNull(updatedContract.getAccessCode());

        // 2. Khách trả kho và Staff nghiệm thu không có hư hỏng
        ReturnInspectionRequest inspectionReq = ReturnInspectionRequest.builder()
                .returnDate(returnDate)
                .condition("GOOD")
                .damageCost(0L)
                .damageNotes("Kho sạch sẽ, nguyên trạng")
                .customerConfirmed(true)
                .signatureDataUrl("data:image/png;base64,abc")
                .build();

        ReturnInspectionResponse inspectionRes = contractService.submitReturnInspection(
                updatedContract.getId(), inspectionReq, 1L, List.of(1L));

        assertEquals(1_800_000L, inspectionRes.getEstimatedDepositRefund());
        assertEquals(200_000L, inspectionRes.getOverdueFee());

        // 3. Xem trước quyết toán (Settlement Preview)
        SettlementPreviewResponse settlement = contractService.getSettlementPreview(updatedContract.getId(),
                List.of(1L));
        assertEquals(2_000_000L, settlement.getDepositAmount());
        assertEquals(200_000L, settlement.getOverdueFee());
        assertEquals(0L, settlement.getDamageCost());
        assertEquals(1_800_000L, settlement.getDepositRefundAmount()); // Hoàn 90% cọc (1.800.000đ)
        assertEquals(0L, settlement.getPayableAmount());
    }

    @Test
    @DisplayName("Kịch bản 2: Trả kho tại D+5 -> Lũy kế 35% cọc (15% + 20% = 700k) + Hư hỏng 100k -> Quyết toán cấn trừ chuẩn xác")
    void testLateReturnWithDamage_ShouldDeductBothOverdueAndDamage() {
        RentalContract contract = createAndSaveContract(baseEndDate, 2_000_000L);
        LocalDate returnDate = baseEndDate.plusDays(5); // D+5 (15% + 20% = 35% cọc = 700k)

        // 1. Cronjob quét ngày D+5
        overdueProcessingService.processOverdueContracts(returnDate);

        RentalContract updatedContract = rentalContractRepository.findById(contract.getId()).orElseThrow();
        assertEquals(ContractStatus.OVERDUE, updatedContract.getStatus());
        assertEquals(700_000L, updatedContract.getOverdueFeeAccrued());

        // 2. Staff nghiệm thu phát hiện hư hỏng cửa 100.000 đ
        ReturnInspectionRequest inspectionReq = ReturnInspectionRequest.builder()
                .returnDate(returnDate)
                .condition("MINOR_DAMAGE")
                .extraFeeTypeIds(List.of(saveDamageFee(100_000L)))
                .damageNotes("Trầy xước cửa cuốn")
                .evidenceImageUrls("https://example.com/damage.jpg")
                .customerConfirmed(true)
                .signatureDataUrl("data:image/png;base64,abc")
                .build();

        contractService.submitReturnInspection(updatedContract.getId(), inspectionReq, 1L, List.of(1L));

        // 3. Xem trước quyết toán: 2.000.000 cọc - 700.000 phạt - 100.000 hư hỏng = 1.200.000 đ hoàn
        SettlementPreviewResponse settlement = contractService.getSettlementPreview(updatedContract.getId(),
                List.of(1L));
        assertEquals(2_000_000L, settlement.getDepositAmount());
        assertEquals(700_000L, settlement.getOverdueFee());
        assertEquals(0L, settlement.getDamageCost());
        assertEquals(100_000L, settlement.getUnpaidExtraCharges());
        assertEquals(1_200_000L, settlement.getDepositRefundAmount());
        assertEquals(0L, settlement.getPayableAmount());
    }

    @Test
    @DisplayName("Kịch bản 3: Cưỡng chế tại D+7 -> Khấu trừ 100% cọc (55% quá hạn + 45% niêm phong Kho Tổng -> depositBalance = 0), TERMINATED, ô kho MAINTENANCE")
    void testForcedTermination_AtD7_ShouldEnforceSystemRules() {
        RentalContract contract = createAndSaveContract(baseEndDate, 2_000_000L);
        LocalDate runDate = baseEndDate.plusDays(7); // D+7

        // 1. Cronjob quét ngày D+7
        overdueProcessingService.processOverdueContracts(runDate);

        // 2. Kiểm tra CSDL thực tế
        RentalContract terminatedContract = rentalContractRepository.findById(contract.getId()).orElseThrow();
        assertEquals(ContractStatus.TERMINATED, terminatedContract.getStatus());
        assertEquals(1_100_000L, terminatedContract.getOverdueFeeAccrued()); // Trần 55% của 2tr (15% + 40%)
        assertEquals(0L, terminatedContract.getDepositBalance()); // Khấu trừ nốt 45% phí niêm phong Kho Tổng -> 0đ
        assertNull(terminatedContract.getAccessCode()); // Khóa mã mở cửa

        // Ô kho vật lý chuyển sang MAINTENANCE (1 ngày) để nhân viên niêm phong về Kho Tổng & vệ sinh
        StorageUnit unitInDb = storageUnitRepository.findById(testUnit.getId()).orElseThrow();
        assertEquals(StorageUnitStatus.MAINTENANCE, unitInDb.getStatus());
    }

    @Test
    @DisplayName("Kịch bản 3.1: Tại D+8 -> Tự động giải phóng ô kho MAINTENANCE về AVAILABLE sau 1 ngày dọn dẹp")
    void testAutoReleaseUnit_AtD8_ShouldReleaseToAvailable() {
        RentalContract contract = createAndSaveContract(baseEndDate, 2_000_000L);
        LocalDate d7Date = baseEndDate.plusDays(7); // D+7
        overdueProcessingService.processOverdueContracts(d7Date);

        // Ô kho đang MAINTENANCE tại D+7
        StorageUnit unitAtD7 = storageUnitRepository.findById(testUnit.getId()).orElseThrow();
        assertEquals(StorageUnitStatus.MAINTENANCE, unitAtD7.getStatus());

        // Chạy tiếp tại D+8
        LocalDate d8Date = baseEndDate.plusDays(8); // D+8
        overdueProcessingService.processOverdueContracts(d8Date);

        // Ô kho tự động chuyển sang AVAILABLE tại D+8
        StorageUnit unitAtD8 = storageUnitRepository.findById(testUnit.getId()).orElseThrow();
        assertEquals(StorageUnitStatus.AVAILABLE, unitAtD8.getStatus());
    }

    @Test
    @DisplayName("Kịch bản 4: Hư hỏng + Phạt quá hạn vượt tiền cọc -> Tiền hoàn = 0, phát sinh số tiền phải nộp thêm")
    void testExcessiveDeductions_ShouldRequirePayableAmount() {
        RentalContract contract = createAndSaveContract(baseEndDate, 1_000_000L); // Cọc 1 triệu
        LocalDate returnDate = baseEndDate.plusDays(5); // Lũy kế 35% của 1tr = 350k

        // 1. Cronjob quét phạt 350.000 đ
        overdueProcessingService.processOverdueContracts(returnDate);

        // 2. Staff nghiệm thu phát sinh hư hỏng nặng kết cấu 1.500.000 đ (vượt cả tiền cọc)
        ReturnInspectionRequest inspectionReq = ReturnInspectionRequest.builder()
                .returnDate(returnDate)
                .condition("MAJOR_DAMAGE")
                .extraFeeTypeIds(List.of(saveDamageFee(1_500_000L)))
                .damageNotes("Hư hỏng kết cấu vách ngăn")
                .evidenceImageUrls("https://example.com/damage.jpg")
                .customerConfirmed(true)
                .signatureDataUrl("data:image/png;base64,abc")
                .build();

        contractService.submitReturnInspection(contract.getId(), inspectionReq, 1L, List.of(1L));

        // 3. Quyết toán:
        // Tổng khấu trừ = 350.000 (phạt) + 1.500.000 (hư hỏng) = 1.850.000 đ
        // Tiền cọc = 1.000.000 đ -> Tiền hoàn = 0, Khách phải đóng thêm = 850.000 đ
        SettlementPreviewResponse settlement = contractService.getSettlementPreview(contract.getId(), List.of(1L));
        assertEquals(1_000_000L, settlement.getDepositAmount());
        assertEquals(350_000L, settlement.getOverdueFee());
        assertEquals(0L, settlement.getDamageCost());
        assertEquals(1_500_000L, settlement.getUnpaidExtraCharges());
        assertEquals(0L, settlement.getDepositRefundAmount());
        assertEquals(850_000L, settlement.getPayableAmount()); // BR-RET-04: Kết quả âm, khách nộp bổ sung
    }
}

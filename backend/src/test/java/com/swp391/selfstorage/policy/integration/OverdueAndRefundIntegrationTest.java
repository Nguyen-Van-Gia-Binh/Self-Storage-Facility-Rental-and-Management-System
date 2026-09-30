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

    private StorageUnit testUnit;
    private LocalDate baseEndDate;

    @BeforeEach
    void setUp() {
        baseEndDate = LocalDate.of(2026, 10, 1);

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
    @DisplayName("Kịch bản 1: Trả kho trong ân hạn (D+2) -> Cronjob không phạt -> Quyết toán hoàn 100% tiền cọc (BR-OVD-02, BR-RET-04)")
    void testGracePeriodReturn_ShouldRefundFullDeposit() {
        RentalContract contract = createAndSaveContract(baseEndDate, 2_000_000L);
        LocalDate returnDate = baseEndDate.plusDays(2); // D+2 (trong ân hạn 3 ngày)

        // 1. Cronjob quét qua đêm D+2
        OverdueProcessingResult cronResult = overdueProcessingService.processOverdueContracts(returnDate);
        assertTrue(cronResult.getTotalScanned() >= 1);

        // Hợp đồng được chuyển sang OVERDUE nhưng chưa tính phí phạt
        RentalContract updatedContract = rentalContractRepository.findById(contract.getId()).orElseThrow();
        assertEquals(ContractStatus.OVERDUE, updatedContract.getStatus());
        assertEquals(0L, updatedContract.getOverdueFeeAccrued());

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

        assertEquals(2_000_000L, inspectionRes.getEstimatedDepositRefund());
        assertEquals(0L, inspectionRes.getOverdueFee());

        // 3. Xem trước quyết toán (Settlement Preview)
        SettlementPreviewResponse settlement = contractService.getSettlementPreview(updatedContract.getId(),
                List.of(1L));
        assertEquals(2_000_000L, settlement.getDepositAmount());
        assertEquals(0L, settlement.getOverdueFee());
        assertEquals(0L, settlement.getDamageCost());
        assertEquals(2_000_000L, settlement.getDepositRefundAmount()); // Hoàn 100% cọc!
        assertEquals(0L, settlement.getPayableAmount());
    }

    @Test
    @DisplayName("Kịch bản 2: Trả kho tại D+5 -> Cronjob phạt 2 ngày (20%) + Hư hỏng 100k -> Quyết toán cấn trừ chuẩn xác")
    void testLateReturnWithDamage_ShouldDeductBothOverdueAndDamage() {
        RentalContract contract = createAndSaveContract(baseEndDate, 2_000_000L);
        LocalDate returnDate = baseEndDate.plusDays(5); // D+5 (Quá hạn 5 ngày -> phạt 2 ngày = 20% cọc = 400k)

        // 1. Cronjob quét ngày D+5
        overdueProcessingService.processOverdueContracts(returnDate);

        RentalContract updatedContract = rentalContractRepository.findById(contract.getId()).orElseThrow();
        assertEquals(ContractStatus.OVERDUE, updatedContract.getStatus());
        assertEquals(400_000L, updatedContract.getOverdueFeeAccrued());

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

        // 3. Xem trước quyết toán: 2.000.000 cọc - 400.000 phạt - 100.000 hư hỏng =
        // 1.500.000 đ hoàn
        SettlementPreviewResponse settlement = contractService.getSettlementPreview(updatedContract.getId(),
                List.of(1L));
        assertEquals(2_000_000L, settlement.getDepositAmount());
        assertEquals(400_000L, settlement.getOverdueFee());
        assertEquals(0L, settlement.getDamageCost());
        assertEquals(100_000L, settlement.getUnpaidExtraCharges());
        assertEquals(1_500_000L, settlement.getDepositRefundAmount());
        assertEquals(0L, settlement.getPayableAmount());
    }

    @Test
    @DisplayName("Kịch bản 3: Cưỡng chế tại D+10 -> Cronjob chốt trần 70% cọc, khóa mã, TERMINATED, ô kho CLEANING")
    void testForcedTermination_AtD10_ShouldEnforceSystemRules() {
        RentalContract contract = createAndSaveContract(baseEndDate, 2_000_000L);
        LocalDate runDate = baseEndDate.plusDays(10); // D+10

        // 1. Cronjob quét ngày D+10
        overdueProcessingService.processOverdueContracts(runDate);

        // 2. Kiểm tra CSDL thực tế
        RentalContract terminatedContract = rentalContractRepository.findById(contract.getId()).orElseThrow();
        assertEquals(ContractStatus.TERMINATED, terminatedContract.getStatus());
        assertEquals(1_400_000L, terminatedContract.getOverdueFeeAccrued()); // Trần 70% của 2tr
        assertEquals(600_000L, terminatedContract.getDepositBalance()); // Cọc còn lại: 2tr - 1.4tr
        assertNull(terminatedContract.getAccessCode()); // Khóa mã mở cửa

        // Ô kho vật lý chuyển sang CLEANING để nhân viên thu dọn
        StorageUnit unitInDb = storageUnitRepository.findById(testUnit.getId()).orElseThrow();
        assertEquals(StorageUnitStatus.CLEANING, unitInDb.getStatus());
    }

    @Test
    @DisplayName("Kịch bản 4: Hư hỏng + Phạt quá hạn vượt tiền cọc -> Tiền hoàn = 0, phát sinh số tiền phải nộp thêm")
    void testExcessiveDeductions_ShouldRequirePayableAmount() {
        RentalContract contract = createAndSaveContract(baseEndDate, 1_000_000L); // Cọc 1 triệu
        LocalDate returnDate = baseEndDate.plusDays(5); // Phạt 2 ngày = 20% của 1tr = 200k

        // 1. Cronjob quét phạt 200.000 đ
        overdueProcessingService.processOverdueContracts(returnDate);

        // 2. Staff nghiệm thu phát sinh hư hỏng nặng kết cấu 1.500.000 đ (vượt cả tiền
        // cọc)
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
        // Tổng khấu trừ = 200.000 (phạt) + 1.500.000 (hư hỏng) = 1.700.000 đ
        // Tiền cọc = 1.000.000 đ -> Tiền hoàn = 0, Khách phải đóng thêm = 700.000 đ
        SettlementPreviewResponse settlement = contractService.getSettlementPreview(contract.getId(), List.of(1L));
        assertEquals(1_000_000L, settlement.getDepositAmount());
        assertEquals(200_000L, settlement.getOverdueFee());
        assertEquals(0L, settlement.getDamageCost());
        assertEquals(1_500_000L, settlement.getUnpaidExtraCharges());
        assertEquals(0L, settlement.getDepositRefundAmount());
        assertEquals(700_000L, settlement.getPayableAmount()); // BR-RET-04: Kết quả âm, khách nộp bổ sung
    }
}

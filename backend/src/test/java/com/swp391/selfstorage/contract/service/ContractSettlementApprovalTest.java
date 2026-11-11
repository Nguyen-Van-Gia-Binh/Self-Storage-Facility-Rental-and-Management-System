package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.event.ContractSettledEvent;
import com.swp391.selfstorage.contract.repository.*;
import com.swp391.selfstorage.contract.service.impl.ContractServiceImpl;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractSettlementApprovalTest {

        @Mock
        private RentalContractRepository contractRepository;
        @Mock
        private ReturnRequestRepository returnRequestRepository;
        @Mock
        private ContractExtraChargeRepository extraChargeRepository;
        @Mock
        private StorageUnitRepository storageUnitRepository;
        @Mock
        private ApplicationEventPublisher eventPublisher;
        @InjectMocks
        private ContractServiceImpl contractService;

        @Test
        @DisplayName("FM-04: getSettlementPreview tính đúng số tiền hoàn cọc và nộp bù")
        void testGetSettlementPreview() {
                RentalContract contract = RentalContract.builder()
                                .id(500L)
                                .depositAmount(1_000_000L)
                                .overdueFeeAccrued(100_000L)
                                .status(ContractStatus.PENDING_RETURN)
                                .build();

                ReturnRequest returnReq = ReturnRequest.builder()
                                .contractId(500L)
                                .damageCost(150_000L)
                                .build();

                when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L))
                                .thenReturn(Optional.of(returnReq));
                when(extraChargeRepository.findByContractIdAndStatus(500L, ExtraChargeStatus.UNPAID))
                                .thenReturn(List.of());

                SettlementPreviewResponse preview = contractService.getSettlementPreview(500L, List.of(1L));

                assertNotNull(preview);
                assertEquals(1_000_000L, preview.getDepositAmount());
                assertEquals(150_000L, preview.getDamageCost());
                assertEquals(100_000L, preview.getOverdueFee());
                assertEquals(750_000L, preview.getDepositRefundAmount());
                assertEquals(0L, preview.getPayableAmount());
        }

        @Test
        @DisplayName("BR-CHK-06: chấm dứt trước check-in hoàn totalRentalFee, không hoàn giá niêm yết")
        void terminatedBeforeCheckInRefundsPaidRent() {
                RentalContract contract = RentalContract.builder()
                                .id(77L)
                                .customerId(15L)
                                .facilityId(1L)
                                .status(ContractStatus.TERMINATED)
                                .checkinDate(null)
                                .monthlyPrice(1_000_000L)
                                .rentalMonths(12)
                                .totalRentalFee(10_800_000L)
                                .depositAmount(800_000L)
                                .depositBalance(800_000L)
                                .build();
                when(contractRepository.findById(77L)).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(77L)).thenReturn(Optional.empty());
                when(returnRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
                when(extraChargeRepository.findByContractIdAndStatus(eq(77L), any())).thenReturn(List.of());
                when(contractRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

                SettlementApprovalResponse response = contractService.approveSettlement(77L, null, 4L, List.of());

                assertEquals(11_600_000L, response.getDepositRefundAmount());
        }

        @Test
        @DisplayName("FM-04: approveSettlement chuyển Contract CLOSED, Unit CLEANING và bắn ContractSettledEvent")
        void testApproveSettlement() {
                RentalContract contract = RentalContract.builder()
                                .id(500L)
                                .customerId(15L)
                                .facilityId(1L)
                                .storageUnitId(42L)
                                .depositAmount(1_000_000L)
                                .depositBalance(1_000_000L)
                                .accessCode("123456")
                                .status(ContractStatus.PENDING_RETURN)
                                .build();

                ReturnRequest returnReq = ReturnRequest.builder()
                                .id(20L)
                                .contractId(500L)
                                .damageCost(200_000L)
                                .inspectedAt(OffsetDateTime.now())
                                .build();

                StorageUnit unit = StorageUnit.builder()
                                .id(42L)
                                .status(StorageUnitStatus.OCCUPIED)
                                .build();

                when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L))
                                .thenReturn(Optional.of(returnReq));
                when(extraChargeRepository.findByContractIdAndStatus(500L, ExtraChargeStatus.UNPAID))
                                .thenReturn(List.of());
                when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(unit));

                SettlementApprovalRequest request = SettlementApprovalRequest.builder()
                                .approvedNotes("Duyệt quyết toán hợp lệ")
                                .build();

                SettlementApprovalResponse response = contractService.approveSettlement(500L, request, 99L,
                                List.of(1L));

                assertNotNull(response);
                assertEquals(ContractStatus.CLOSED, contract.getStatus());
                assertEquals(0L, contract.getDepositBalance());
                assertNull(contract.getAccessCode());
                assertEquals(StorageUnitStatus.CLEANING, unit.getStatus());
                assertEquals(800_000L, response.getDepositRefundAmount());
                verify(eventPublisher).publishEvent(any(ContractSettledEvent.class));
        }

        @Test
        @DisplayName("BR-RET-02: approveSettlement ném VALIDATION_FAILED khi chưa có biên bản nghiệm thu từ nhân viên")
        void testApproveSettlement_ThrowsWhenNotInspected() {
                RentalContract contract = RentalContract.builder()
                                .id(500L)
                                .customerId(15L)
                                .facilityId(1L)
                                .storageUnitId(42L)
                                .status(ContractStatus.PENDING_RETURN)
                                .build();

                ReturnRequest uninspectedReq = ReturnRequest.builder()
                                .id(20L)
                                .contractId(500L)
                                .inspectedAt(null)
                                .build();

                when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L))
                                .thenReturn(Optional.of(uninspectedReq));

                CustomException ex = assertThrows(CustomException.class, () ->
                                contractService.approveSettlement(500L, SettlementApprovalRequest.builder().build(), 99L, List.of(1L)));

                assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
                assertTrue(ex.getMessage().contains("chưa được nhân viên kiểm tra"));
        }

        @Test
        @DisplayName("BR-CHK-06: getSettlementPreview & approveSettlement hoàn 100% tiền thuê + cọc khi TERMINATED chưa check-in")
        void testSettlement_TerminatedBeforeCheckIn_FullRefund() {
                RentalContract contract = RentalContract.builder()
                                .id(601L)
                                .customerId(15L)
                                .facilityId(1L)
                                .storageUnitId(42L)
                                .monthlyPrice(1_000_000L)
                                .rentalMonths(2)
                                .totalRentalFee(2_000_000L)
                                .depositAmount(1_000_000L)
                                .depositBalance(1_000_000L)
                                .checkinDate(null)
                                .status(ContractStatus.TERMINATED)
                                .build();

                when(contractRepository.findByIdAndFacilityIdIn(eq(601L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(601L))
                                .thenReturn(Optional.empty());

                SettlementPreviewResponse preview = contractService.getSettlementPreview(601L, List.of(1L));
                assertNotNull(preview);
                assertEquals(3_000_000L, preview.getDepositRefundAmount());
                assertEquals(0L, preview.getPayableAmount());

                StorageUnit unit = StorageUnit.builder().id(42L).status(StorageUnitStatus.OCCUPIED).build();
                when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(unit));
                when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));

                SettlementApprovalResponse approval = contractService.approveSettlement(601L,
                                SettlementApprovalRequest.builder().build(), 99L, List.of(1L));
                assertEquals(3_000_000L, approval.getDepositRefundAmount());
                assertEquals(0L, approval.getPayableAmount());
                assertEquals(ContractStatus.CLOSED, contract.getStatus());
        }

        @Test
        @DisplayName("BR-OVD-07, BR-OVD-11: TERMINATED do quá hạn D+7 (sau 30 ngày thanh lý ngoại tuyến, chi phí phát sinh = 0đ) -> đóng CLOSED ngay, hoàn 0đ")
        void testSettlement_TerminatedAfterCheckIn_OverdueTermination_NoRentRefund() {
                RentalContract contract = RentalContract.builder()
                                .id(602L)
                                .customerId(15L)
                                .facilityId(1L)
                                .storageUnitId(42L)
                                .monthlyPrice(1_000_000L)
                                .rentalMonths(2)
                                .depositAmount(1_000_000L)
                                .depositBalance(0L)
                                .overdueFeeAccrued(550_000L)
                                .checkinDate(LocalDate.now().minusMonths(2))
                                .status(ContractStatus.TERMINATED)
                                .build();

                ReturnRequest returnReq = ReturnRequest.builder()
                                .id(22L)
                                .contractId(602L)
                                .damageCost(0L)
                                .inspectedAt(OffsetDateTime.now())
                                .build();

                when(contractRepository.findByIdAndFacilityIdIn(eq(602L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(602L))
                                .thenReturn(Optional.of(returnReq));
                when(extraChargeRepository.findByContractIdAndStatus(602L, ExtraChargeStatus.UNPAID))
                                .thenReturn(List.of());

                SettlementPreviewResponse preview = contractService.getSettlementPreview(602L, List.of(1L));
                assertNotNull(preview);
                assertEquals(0L, preview.getEarlyRentRefund());
                assertEquals(0L, preview.getDepositRefundAmount());
                assertEquals(0L, preview.getPayableAmount());

                StorageUnit unit = StorageUnit.builder().id(42L).status(StorageUnitStatus.AVAILABLE).build();
                when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(unit));
                when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));

                SettlementApprovalResponse approval = contractService.approveSettlement(602L,
                                SettlementApprovalRequest.builder()
                                                .adjustedDamageCost(0L)
                                                .approvedNotes("Khách bỏ hàng quá 30 ngày tại Kho Tổng, đã thanh lý ngoại tuyến và chốt hợp đồng")
                                                .build(),
                                99L, List.of(1L));
                assertEquals(0L, approval.getDepositRefundAmount());
                assertEquals(0L, approval.getPayableAmount());
                assertEquals(ContractStatus.CLOSED, contract.getStatus());
        }

        @Test
        @DisplayName("BR-OVD-11: TERMINATED do quá hạn D+7 (Khách đến Kho Tổng chuộc đồ trong 30 ngày, FM nhập thêm chi phí lưu Kho Tổng 300k) -> sinh payableAmount 300k -> đóng CLOSED sau khi thanh toán")
        void testSettlement_TerminatedAfterCheckIn_WithCentralWarehouseStorageFee_RequiresPaymentThenCloses() {
                RentalContract contract = RentalContract.builder()
                                .id(603L)
                                .customerId(15L)
                                .facilityId(1L)
                                .storageUnitId(42L)
                                .monthlyPrice(1_000_000L)
                                .rentalMonths(2)
                                .depositAmount(1_000_000L)
                                .depositBalance(0L) // Đã khấu trừ 100% cọc (55% quá hạn + 45% niêm phong Kho Tổng)
                                .overdueFeeAccrued(550_000L)
                                .checkinDate(LocalDate.now().minusMonths(2))
                                .status(ContractStatus.TERMINATED)
                                .build();

                ReturnRequest returnReq = ReturnRequest.builder()
                                .id(23L)
                                .contractId(603L)
                                .damageCost(0L)
                                .inspectedAt(OffsetDateTime.now())
                                .build();

                when(contractRepository.findByIdAndFacilityIdIn(eq(603L), anyList())).thenReturn(Optional.of(contract));
                when(contractRepository.findById(603L)).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(603L))
                                .thenReturn(Optional.of(returnReq));
                when(extraChargeRepository.findByContractIdAndStatus(603L, ExtraChargeStatus.UNPAID))
                                .thenReturn(List.of());
                when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));

                // 1. FM bấm "+ Thêm chi phí phát sinh" nhập 300.000đ phí lưu Kho Tổng 10 ngày
                SettlementApprovalResponse approval = contractService.approveSettlement(603L,
                                SettlementApprovalRequest.builder()
                                                .adjustedDamageCost(300_000L)
                                                .approvedNotes("Phí lưu giữ bảo quản tại Kho Tổng 10 ngày (30.000đ/ngày)")
                                                .build(),
                                99L, List.of(1L));

                assertEquals(0L, approval.getDepositRefundAmount());
                assertEquals(300_000L, approval.getPayableAmount());
                assertEquals(300_000L, returnReq.getDamageCost());
                assertEquals(ContractStatus.TERMINATED, contract.getStatus()); // Chờ khách nộp bù 300k
                verify(eventPublisher).publishEvent(any(ContractSettledEvent.class));

                // 2. Khách thanh toán 300k qua VNPay (SETTLEMENT) -> đóng hợp đồng sang CLOSED
                StorageUnit unit = StorageUnit.builder().id(42L).status(StorageUnitStatus.AVAILABLE).build();
                when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(unit));

                contractService.closeContractAfterSettlementPayment(603L);
                assertEquals(ContractStatus.CLOSED, contract.getStatus());
                assertNotNull(contract.getClosedAt());
        }
}

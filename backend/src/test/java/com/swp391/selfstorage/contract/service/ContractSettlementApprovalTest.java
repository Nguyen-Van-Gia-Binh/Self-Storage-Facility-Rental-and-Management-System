package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.event.ContractSettledEvent;
import com.swp391.selfstorage.contract.repository.*;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractSettlementApprovalTest {

    @Mock private RentalContractRepository contractRepository;
    @Mock private ReturnRequestRepository returnRequestRepository;
    @Mock private ContractExtraChargeRepository extraChargeRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @InjectMocks private ContractServiceImpl contractService;

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
        when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L)).thenReturn(Optional.of(returnReq));
        when(extraChargeRepository.findByContractIdAndStatus(500L, ExtraChargeStatus.UNPAID)).thenReturn(List.of());

        SettlementPreviewResponse preview = contractService.getSettlementPreview(500L, List.of(1L));

        assertNotNull(preview);
        assertEquals(1_000_000L, preview.getDepositAmount());
        assertEquals(150_000L, preview.getDamageCost());
        assertEquals(100_000L, preview.getOverdueFee());
        assertEquals(750_000L, preview.getDepositRefundAmount());
        assertEquals(0L, preview.getPayableAmount());
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
                .build();

        StorageUnit unit = StorageUnit.builder()
                .id(42L)
                .status(StorageUnitStatus.OCCUPIED)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
        when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L)).thenReturn(Optional.of(returnReq));
        when(extraChargeRepository.findByContractIdAndStatus(500L, ExtraChargeStatus.UNPAID)).thenReturn(List.of());
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(unit));

        SettlementApprovalRequest request = SettlementApprovalRequest.builder()
                .approvedNotes("Duyệt quyết toán hợp lệ")
                .build();

        SettlementApprovalResponse response = contractService.approveSettlement(500L, request, 99L, List.of(1L));

        assertNotNull(response);
        assertEquals(ContractStatus.CLOSED, contract.getStatus());
        assertEquals(0L, contract.getDepositBalance());
        assertNull(contract.getAccessCode());
        assertEquals(StorageUnitStatus.CLEANING, unit.getStatus());
        assertEquals(800_000L, response.getDepositRefundAmount());
        verify(eventPublisher).publishEvent(any(ContractSettledEvent.class));
    }
}

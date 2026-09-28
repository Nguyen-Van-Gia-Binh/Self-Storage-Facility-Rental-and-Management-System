package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.contract.dto.ContractFilterRequest;
import com.swp391.selfstorage.contract.dto.ContractFinancialSummaryResponse;
import com.swp391.selfstorage.contract.dto.ContractSummaryResponse;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.repository.*;
import com.swp391.selfstorage.contract.service.impl.ContractServiceImpl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractTrackingServiceTest {

    @Mock
    private RentalContractRepository contractRepository;
    @Mock
    private ContractExtraChargeRepository extraChargeRepository;
    @Mock
    private ReturnRequestRepository returnRequestRepository;
    @Mock
    private com.swp391.selfstorage.user.service.UserService userService;
    @InjectMocks
    private ContractServiceImpl contractService;

    @Test
    @DisplayName("T4.2: getContractsPage trả về danh sách phân trang và gắn đúng cờ nearExpiration")
    void testGetContractsPage() {
        RentalContract contract = RentalContract.builder()
                .id(100L)
                .code("CTR-202610-001")
                .customerId(15L)
                .facilityId(1L)
                .storageUnitId(42L)
                .startDate(LocalDate.now().minusMonths(1))
                .endDateExclusive(LocalDate.now().plusDays(4)) // <= 7 ngay
                .status(ContractStatus.ACTIVE)
                .depositAmount(800_000L)
                .build();

        Page<RentalContract> page = new PageImpl<>(List.of(contract), PageRequest.of(0, 10), 1);
        when(contractRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ContractFilterRequest filter = ContractFilterRequest.builder().facilityId(1L).build();
        PageResponse<ContractSummaryResponse> result = contractService.getContractsPage(filter, PageRequest.of(0, 10),
                List.of(1L));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertTrue(result.getContent().get(0).isNearExpiration());
    }

    @Test
    @DisplayName("T4.15: getContractsPage nạp assignedStaffId và assignedStaffName từ ReturnRequest cho hợp đồng PENDING_RETURN")
    void testGetContractsPage_PendingReturnWithAssignedStaff() {
        RentalContract contract = RentalContract.builder()
                .id(200L)
                .code("CTR-202610-002")
                .customerId(15L)
                .facilityId(1L)
                .storageUnitId(42L)
                .startDate(LocalDate.now().minusMonths(2))
                .endDateExclusive(LocalDate.now().minusDays(1))
                .status(ContractStatus.PENDING_RETURN)
                .depositAmount(1_200_000L)
                .build();

        ReturnRequest returnReq = ReturnRequest.builder()
                .id(10L)
                .contractId(200L)
                .inspectedBy(5L)
                .status(ReturnRequestStatus.PENDING)
                .build();

        com.swp391.selfstorage.user.dto.UserResponse staffUser = new com.swp391.selfstorage.user.dto.UserResponse();
        staffUser.setId(5L);
        staffUser.setFullName("Nguyễn Văn Staff");

        org.springframework.test.util.ReflectionTestUtils.setField(contractService, "userService", userService);

        Page<RentalContract> page = new PageImpl<>(List.of(contract), PageRequest.of(0, 10), 1);
        when(contractRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(200L)).thenReturn(Optional.of(returnReq));
        when(userService.getUserById(5L)).thenReturn(staffUser);

        ContractFilterRequest filter = ContractFilterRequest.builder().status(ContractStatus.PENDING_RETURN).build();
        PageResponse<ContractSummaryResponse> result = contractService.getContractsPage(filter, PageRequest.of(0, 10), List.of(1L));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        ContractSummaryResponse item = result.getContent().get(0);
        assertEquals(200L, item.getId());
        assertEquals(ContractStatus.PENDING_RETURN, item.getStatus());
        assertEquals(5L, item.getAssignedStaffId());
        assertEquals("Nguyễn Văn Staff", item.getAssignedStaffName());
    }

    @Test
    @DisplayName("T4.2: getFinancialSummary trả về chi tiết tiền cọc, nợ quá hạn và phụ phí")
    void testGetFinancialSummary() {
        RentalContract contract = RentalContract.builder()
                .id(100L)
                .depositAmount(1_000_000L)
                .depositBalance(1_000_000L)
                .totalRentalFee(3_000_000L)
                .overdueFeeAccrued(200_000L)
                .facilityId(1L)
                .build();

        ContractExtraCharge charge = ContractExtraCharge.builder()
                .id(1L)
                .contractId(100L)
                .amount(50_000L)
                .reason("Phi thay khoa")
                .status(ExtraChargeStatus.UNPAID)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(eq(100L), anyList())).thenReturn(Optional.of(contract));
        when(extraChargeRepository.findByContractId(100L)).thenReturn(List.of(charge));

        ContractFinancialSummaryResponse summary = contractService.getContractFinancialSummary(100L, List.of(1L));

        assertNotNull(summary);
        assertEquals(1_000_000L, summary.getDepositAmount());
        assertEquals(200_000L, summary.getOverdueFeeAccrued());
        assertEquals(50_000L, summary.getTotalUnpaidExtraCharges());
        assertEquals(250_000L, summary.getTotalOutstandingDebt());
    }
}

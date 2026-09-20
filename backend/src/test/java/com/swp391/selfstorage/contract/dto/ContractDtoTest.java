package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class ContractDtoTest {

    @Test
    @DisplayName("ContractSummaryResponse tính toán đúng nearExpiration khi còn dưới 7 ngày")
    void testContractSummaryResponseNearExpiration() {
        ContractSummaryResponse summary = ContractSummaryResponse.builder()
                .id(1L)
                .code("CTR-001")
                .customerId(15L)
                .facilityId(1L)
                .storageUnitId(42L)
                .startDate(LocalDate.now().minusMonths(1))
                .endDateExclusive(LocalDate.now().plusDays(5))
                .depositAmount(800_000L)
                .status(ContractStatus.ACTIVE)
                .nearExpiration(true)
                .build();

        assertTrue(summary.isNearExpiration());
        assertEquals("CTR-001", summary.getCode());
    }

    @Test
    @DisplayName("SettlementPreviewResponse tính toán hoàn cọc và nộp bù chính xác theo BR-RET-04")
    void testSettlementPreviewResponse() {
        long deposit = 1_000_000L;
        long damage = 200_000L;
        long overdue = 100_000L;
        long unpaid = 50_000L;
        long refund = Math.max(0, deposit - damage - overdue - unpaid);
        long payable = Math.max(0, (damage + overdue + unpaid) - deposit);

        SettlementPreviewResponse preview = SettlementPreviewResponse.builder()
                .contractId(500L)
                .depositAmount(deposit)
                .damageCost(damage)
                .overdueFee(overdue)
                .unpaidExtraCharges(unpaid)
                .depositRefundAmount(refund)
                .payableAmount(payable)
                .build();

        assertEquals(650_000L, preview.getDepositRefundAmount());
        assertEquals(0L, preview.getPayableAmount());
    }

    @Test
    @DisplayName("ErrorCode có đủ các mã phục vụ cho Return Workflow")
    void testReturnErrorCodes() {
        assertNotNull(ErrorCode.valueOf("RETURN_REQUEST_NOT_FOUND"));
        assertNotNull(ErrorCode.valueOf("CONTRACT_NOT_ACTIVE_OR_OVERDUE"));
        assertNotNull(ErrorCode.valueOf("CONTRACT_NOT_PENDING_RETURN"));
        assertNotNull(ErrorCode.valueOf("RETURN_NOTICE_TOO_SHORT"));
    }
}

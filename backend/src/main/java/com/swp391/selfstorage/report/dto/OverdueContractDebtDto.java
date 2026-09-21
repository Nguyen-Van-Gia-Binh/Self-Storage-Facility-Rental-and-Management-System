package com.swp391.selfstorage.report.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverdueContractDebtDto {
    private Long contractId;
    private String contractCode;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long storageUnitId;
    private String unitCode;
    private LocalDate endDateExclusive;
    private long overdueDays;
    private long monthlyRentalPrice;
    private long accruedOverdueFee;
    private long totalDebt;
    private ContractStatus status;
}

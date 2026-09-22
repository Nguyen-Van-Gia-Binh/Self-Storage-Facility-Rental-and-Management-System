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
public class OverdueContractDetailDto {

    private Long contractId;
    private String contractCode;

    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    private Long facilityId;
    private String facilityName;

    private Long storageUnitId;
    private String unitCode;

    private LocalDate startDate;
    private LocalDate endDateExclusive;

    private long overdueDays;
    private long monthlyPrice;
    private long accruedOverdueFee;
    private long totalOutstandingDebt;

    private ContractStatus status;
}

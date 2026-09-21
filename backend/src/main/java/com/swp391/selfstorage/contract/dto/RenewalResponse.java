package com.swp391.selfstorage.contract.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenewalResponse {

    private Long id;
    private Long contractId;
    private LocalDate previousEndDate;
    private LocalDate newEndDate;
    private Integer renewalMonths;
    private Long monthlyPriceSnapshot;
    private Long policyVersionId;
    private Long overdueFeeSettled;
    private Long rentalFeeAmount;
    private Long totalPaid;
    private OffsetDateTime createdAt;
}

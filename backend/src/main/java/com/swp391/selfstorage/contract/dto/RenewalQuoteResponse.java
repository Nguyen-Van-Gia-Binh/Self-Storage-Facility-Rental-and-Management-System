package com.swp391.selfstorage.contract.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenewalQuoteResponse {

    private Long contractId;
    private String contractCode;
    private Integer renewalMonths;
    private LocalDate previousEndDate;
    private LocalDate newEndDate;
    private Long monthlyPriceSnapshot;
    private Long rentalFeeAmount;
    private Long overdueFeeSettled;
    private Long totalAmount;
    private Long policyVersionId;
}

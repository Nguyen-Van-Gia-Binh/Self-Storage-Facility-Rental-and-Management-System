package com.swp391.selfstorage.contract.mapper;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import org.springframework.stereotype.Component;

import com.swp391.selfstorage.contract.dto.RenewalQuoteResponse;
import com.swp391.selfstorage.contract.dto.RenewalResponse;
import com.swp391.selfstorage.contract.entity.ContractRenewal;
import com.swp391.selfstorage.contract.entity.RentalContract;

@Component
public class RenewalMapper {

    public RenewalQuoteResponse toQuoteResponse(RentalContract contract, int renewalMonths,
            LocalDate newEndDate, long monthlyPrice,
            long rentalFeeAmount, long overdueFee,
            long totalAmount, Long policyVersionId) {
        return RenewalQuoteResponse.builder()
                .contractId(contract.getId())
                .contractCode(contract.getCode())
                .renewalMonths(renewalMonths)
                .previousEndDate(contract.getEndDateExclusive())
                .newEndDate(newEndDate)
                .monthlyPriceSnapshot(monthlyPrice)
                .rentalFeeAmount(rentalFeeAmount)
                .overdueFeeSettled(overdueFee)
                .totalAmount(totalAmount)
                .policyVersionId(policyVersionId)
                .build();
    }

    public ContractRenewal toEntity(Long contractId, LocalDate previousEndDate, LocalDate newEndDate,
            int renewalMonths, long monthlyPriceSnapshot, Long policyVersionId,
            long overdueFeeSettled, long rentalFeeAmount, long totalPaid, Long paymentTransactionId) {
        return ContractRenewal.builder()
                .contractId(contractId)
                .paymentTransactionId(paymentTransactionId)
                .previousEndDate(previousEndDate)
                .newEndDate(newEndDate)
                .rentalMonths(renewalMonths)
                .monthlyPriceSnapshot(monthlyPriceSnapshot)
                .policyVersionId(policyVersionId)
                .overdueFeeSettled(overdueFeeSettled)
                .rentalFeeAmount(rentalFeeAmount)
                .totalPaid(totalPaid)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    public RenewalResponse toResponse(ContractRenewal entity) {
        if (entity == null) {
            return null;
        }

        return RenewalResponse.builder()
                .id(entity.getId())
                .contractId(entity.getContractId())
                .previousEndDate(entity.getPreviousEndDate())
                .newEndDate(entity.getNewEndDate())
                .renewalMonths(entity.getRentalMonths())
                .monthlyPriceSnapshot(entity.getMonthlyPriceSnapshot())
                .policyVersionId(entity.getPolicyVersionId())
                .overdueFeeSettled(entity.getOverdueFeeSettled())
                .rentalFeeAmount(entity.getRentalFeeAmount())
                .totalPaid(entity.getTotalPaid())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

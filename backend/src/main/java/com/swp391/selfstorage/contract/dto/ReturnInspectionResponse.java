package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnInspectionResponse {
    private Long id;
    private ContractStatus status;
    private LocalDate returnDate;
    private long estimatedDepositRefund;
    private long overdueFee;
    private long damageCost;
}

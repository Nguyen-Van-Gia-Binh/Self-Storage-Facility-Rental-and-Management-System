package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContractSummaryResponse {
    private Long id;
    private String code;
    private Long customerId;
    private Long facilityId;
    private Long storageUnitId;
    private Long unitTypeId;
    private LocalDate startDate;
    private LocalDate endDateExclusive;
    private int rentalMonths;
    private long monthlyPrice;
    private long depositAmount;
    private long depositBalance;
    private ContractStatus status;
    private boolean nearExpiration; // true neu endDateExclusive - now <= 7 ngay va status == ACTIVE
}

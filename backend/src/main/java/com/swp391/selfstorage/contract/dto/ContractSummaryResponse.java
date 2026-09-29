package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContractSummaryResponse {
    private Long id;
    private String code;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerIdentityNumber;
    private String customerEmail;
    private Long facilityId;
    private String facilityName;
    private Long storageUnitId;
    private String storageUnitCode;
    private Long unitTypeId;
    private String unitTypeName;
    private LocalDate startDate;
    private LocalDate endDateExclusive;
    private Integer checkinGraceDays;
    private int rentalMonths;
    private long monthlyPrice;
    private long depositAmount;
    private long depositBalance;
    private ContractStatus status;
    private boolean nearExpiration; // true neu endDateExclusive - now <= 7 ngay va status == ACTIVE
    private Integer overdueDays;
    private Long accruedOverdueFee;
    private Long assignedStaffId;
    private String assignedStaffName;
    private Boolean isInspected;
    private Long damageCost;
    private String damageNotes;
    private Boolean relocationEligible;
    private Long openSupportRequestId;
}


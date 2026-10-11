package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ContractResponse {
    private Long id;
    private String code;
    private Long reservationId;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String customerIdentityNumber;
    private Long facilityId;
    private String facilityName;
    private String facilityAddress;
    private String facilityPhone;
    private Long storageUnitId;
    private String storageUnitCode;
    private Integer floor;
    private String position;
    private Long unitTypeId;
    private String unitTypeName;
    private String unitDimensions;
    private LocalDate startDate;
    private LocalDate endDateExclusive;
    private int rentalMonths;
    private long monthlyPrice;
    private long totalRentalFee;
    private long depositAmount;
    private long depositBalance;
    private String accessCode;
    private ContractStatus status;
    private LocalDate checkinDate;
    private LocalDate returnDate;
    private Integer overdueDays;
    private Long accruedOverdueFee;
    private Long assignedStaffId;
    private String assignedStaffName;
    private Boolean isInspected;
    private Long damageCost;
    private String damageNotes;
}

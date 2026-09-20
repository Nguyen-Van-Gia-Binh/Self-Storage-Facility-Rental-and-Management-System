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
    private Long facilityId;
    private Long storageUnitId;
    private Long unitTypeId;
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
}

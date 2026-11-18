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
    private Long discountAmount;
    private Double discountPercentage;
    private String discountProgramName;
    private Long lateAdminFee;
    private Boolean isForceRenewal;
    private Long overdueFeeSettled;
    private Long totalAmount;
    private Long policyVersionId;

    // Chi tiết xung đột và khả năng điều chuyển ô kho thay thế (FM-02, BR-REN-10)
    private Boolean hasCapacityConflict;
    private Boolean canReassignAlternative;
    private String conflictMessage;
    private Long conflictingReservationId;
    private String conflictingReservationCode;
    private String conflictingCustomerName;
    private String conflictingCustomerPhone;
    private LocalDate conflictingStartDate;
    private Long alternativeUnitId;
    private String alternativeUnitCode;
    private java.util.List<String> alternativeAvailableUnits;
}

package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

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
    private Integer checkinGraceDays;
    private int rentalMonths;
    private long monthlyPrice;
    private long totalRentalFee;
    private long depositAmount;
    private long depositBalance;
    private long totalAmount;
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
    private java.time.LocalTime scheduledStartTime;
    private java.time.LocalTime scheduledEndTime;
    private Integer rescheduleCount;
    private java.time.OffsetDateTime rescheduledAt;
    private Boolean relocationEligible;
    private Long openSupportRequestId;
    private List<PaymentTransactionItem> paymentTransactions;
    private List<UnpaidExtraChargeItem> unpaidExtraCharges;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentTransactionItem {
        private Long id;
        private String transactionType;
        private Long amount;
        private String status;
        private String paymentMethod;
        private Long orderCode;
        private String providerReference;
        private Integer renewalMonths;
        private Instant paidAt;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnpaidExtraChargeItem {
        private Long id;
        private Long amount;
        private String reason;
        private OffsetDateTime createdAt;
    }
}

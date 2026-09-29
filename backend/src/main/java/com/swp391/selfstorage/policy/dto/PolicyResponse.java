package com.swp391.selfstorage.policy.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyResponse {

    private Long id;
    private Integer versionNo;
    private OffsetDateTime effectiveFrom;
    private BigDecimal depositMultiplier;
    private Integer reservationHoldHours;
    private Integer rentalBufferDays;
    private Integer rentalDailyDivisor;
    private Integer checkinGraceDays;
    private Integer cancelFullRefundHours;
    private BigDecimal cancelLateRefundRate;
    private BigDecimal cancelNoShowRefundRate;
    private String renewalReminderDays;
    private Integer renewalMinMonths;
    private Integer renewalMaxMonths;
    private Integer overdueGraceDays;
    private BigDecimal overdueDailyRate;
    private BigDecimal overdueCapRate;
    private Integer overdueLockAccessDays;
    private Integer overdueNoticeDays;
    private Integer overdueTerminationDays;
    private Integer returnNoticeDays;
    private Integer returnRefundWorkingDays;
    private BigDecimal returnEarlyRefundRate;
    private Integer accessPinLength;
    private Integer supportUrgentSlaHours;
    private Integer supportAutoCloseWorkingDays;
    private Long publishedBy;
    private OffsetDateTime createdAt;
}

package com.swp391.selfstorage.policy.mapper;

import java.time.OffsetDateTime;

import org.springframework.stereotype.Component;

import com.swp391.selfstorage.policy.dto.CreatePolicyRequest;
import com.swp391.selfstorage.policy.dto.PolicyResponse;
import com.swp391.selfstorage.policy.entity.PolicyVersion;

@Component
public class PolicyMapper {

    public PolicyVersion toEntity(CreatePolicyRequest request, Integer versionNo, Long publishedBy) {
        if (request == null) {
            return null;
        }

        return PolicyVersion.builder()
                .versionNo(versionNo)
                .effectiveFrom(request.getEffectiveFrom())
                .depositMultiplier(request.getDepositMultiplier())
                .reservationHoldHours(request.getReservationHoldHours())
                .checkinGraceDays(request.getCheckinGraceDays())
                .cancelFullRefundHours(request.getCancelFullRefundHours())
                .cancelLateRefundRate(request.getCancelLateRefundRate())
                .cancelNoShowRefundRate(request.getCancelNoShowRefundRate())
                .renewalReminderDays(
                        request.getRenewalReminderDays() != null ? request.getRenewalReminderDays().trim() : null)
                .renewalMinMonths(request.getRenewalMinMonths())
                .renewalMaxMonths(request.getRenewalMaxMonths())
                .overdueGraceDays(request.getOverdueGraceDays())
                .overdueDailyRate(request.getOverdueDailyRate())
                .overdueCapRate(request.getOverdueCapRate())
                .overdueLockAccessDays(request.getOverdueLockAccessDays())
                .overdueNoticeDays(request.getOverdueNoticeDays())
                .overdueTerminationDays(request.getOverdueTerminationDays())
                .returnNoticeDays(request.getReturnNoticeDays())
                .returnRefundWorkingDays(request.getReturnRefundWorkingDays())
                .returnEarlyRefundRate(request.getReturnEarlyRefundRate())
                .accessPinLength(request.getAccessPinLength() != null ? request.getAccessPinLength() : 6)
                .supportUrgentSlaHours(request.getSupportUrgentSlaHours())
                .supportAutoCloseWorkingDays(request.getSupportAutoCloseWorkingDays())
                .publishedBy(publishedBy)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    public PolicyResponse toResponse(PolicyVersion entity) {
        if (entity == null) {
            return null;
        }

        return PolicyResponse.builder()
                .id(entity.getId())
                .versionNo(entity.getVersionNo())
                .effectiveFrom(entity.getEffectiveFrom())
                .depositMultiplier(entity.getDepositMultiplier())
                .reservationHoldHours(entity.getReservationHoldHours())
                .checkinGraceDays(entity.getCheckinGraceDays())
                .cancelFullRefundHours(entity.getCancelFullRefundHours())
                .cancelLateRefundRate(entity.getCancelLateRefundRate())
                .cancelNoShowRefundRate(entity.getCancelNoShowRefundRate())
                .renewalReminderDays(entity.getRenewalReminderDays())
                .renewalMinMonths(entity.getRenewalMinMonths())
                .renewalMaxMonths(entity.getRenewalMaxMonths())
                .overdueGraceDays(entity.getOverdueGraceDays())
                .overdueDailyRate(entity.getOverdueDailyRate())
                .overdueCapRate(entity.getOverdueCapRate())
                .overdueLockAccessDays(entity.getOverdueLockAccessDays())
                .overdueNoticeDays(entity.getOverdueNoticeDays())
                .overdueTerminationDays(entity.getOverdueTerminationDays())
                .returnNoticeDays(entity.getReturnNoticeDays())
                .returnRefundWorkingDays(entity.getReturnRefundWorkingDays())
                .returnEarlyRefundRate(entity.getReturnEarlyRefundRate())
                .accessPinLength(entity.getAccessPinLength())
                .supportUrgentSlaHours(entity.getSupportUrgentSlaHours())
                .supportAutoCloseWorkingDays(entity.getSupportAutoCloseWorkingDays())
                .publishedBy(entity.getPublishedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

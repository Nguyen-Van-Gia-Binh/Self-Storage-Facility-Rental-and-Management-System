package com.swp391.selfstorage.policy.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "policy_version")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "version_no", nullable = false, unique = true)
    private Integer versionNo;

    @Column(name = "effective_from", nullable = false)
    private OffsetDateTime effectiveFrom;

    @Column(name = "deposit_multiplier", nullable = false, precision = 5, scale = 2)
    private BigDecimal depositMultiplier;

    @Column(name = "reservation_hold_hours", nullable = false)
    private Integer reservationHoldHours;

    /** BR-AVL-02: khoảng đệm sau ngày kết thúc loại trừ trước khi ô kho nhận lượt thuê kế tiếp. */
    @Column(name = "rental_buffer_days", nullable = false)
    @Builder.Default
    private Integer rentalBufferDays = 15;

    /** BR-PRI-03: số ngày quy ước của một tháng khi quy đổi tiền thuê theo ngày. */
    @Column(name = "rental_daily_divisor", nullable = false)
    @Builder.Default
    private Integer rentalDailyDivisor = 30;

    @Column(name = "checkin_grace_days", nullable = false)
    private Integer checkinGraceDays;

    @Column(name = "cancel_full_refund_hours", nullable = false)
    private Integer cancelFullRefundHours;

    @Column(name = "cancel_late_refund_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal cancelLateRefundRate;

    @Column(name = "cancel_no_show_refund_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal cancelNoShowRefundRate;

    @Column(name = "renewal_reminder_days", nullable = false, length = 50)
    private String renewalReminderDays;

    @Column(name = "renewal_min_months", nullable = false)
    private Integer renewalMinMonths;

    @Column(name = "renewal_max_months", nullable = false)
    private Integer renewalMaxMonths;

    @Column(name = "overdue_grace_days", nullable = false)
    private Integer overdueGraceDays;

    @Column(name = "overdue_daily_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal overdueDailyRate;

    @Column(name = "overdue_cap_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal overdueCapRate;

    @Column(name = "overdue_lock_access_days", nullable = false)
    private Integer overdueLockAccessDays;

    @Column(name = "overdue_notice_days", nullable = false)
    private Integer overdueNoticeDays;

    @Column(name = "overdue_termination_days", nullable = false)
    private Integer overdueTerminationDays;

    @Column(name = "return_notice_days", nullable = false)
    private Integer returnNoticeDays;

    @Column(name = "return_refund_working_days", nullable = false)
    private Integer returnRefundWorkingDays;

    @Column(name = "return_early_refund_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal returnEarlyRefundRate;

    @Column(name = "access_pin_length", nullable = false)
    @Builder.Default
    private Integer accessPinLength = 6;

    @Column(name = "support_urgent_sla_hours", nullable = false)
    private Integer supportUrgentSlaHours;

    @Column(name = "support_auto_close_working_days", nullable = false)
    private Integer supportAutoCloseWorkingDays;

    @Column(name = "published_by", nullable = false)
    private Long publishedBy;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

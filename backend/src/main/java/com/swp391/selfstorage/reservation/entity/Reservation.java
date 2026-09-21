package com.swp391.selfstorage.reservation.entity;

import com.swp391.selfstorage.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Entity ánh xạ bảng reservation trong CSDL (Flow 1, V1__init_schema.sql).
 * Tuân thủ CONVENTIONS.md: kiểu tiền tệ long, thời gian OffsetDateTime, enum STRING.
 */
@Entity
@Table(name = "reservation")
public class Reservation extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "unit_type_id", nullable = false)
    private Long unitTypeId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "rental_months", nullable = false)
    private int rentalMonths;

    @Column(name = "end_date_exclusive", nullable = false)
    private LocalDate endDateExclusive;

    @Column(name = "monthly_price_snapshot", nullable = false)
    private long monthlyPriceSnapshot;

    @Column(name = "policy_version_id", nullable = false)
    private Long policyVersionId;

    @Column(name = "discount_program_id")
    private Long discountProgramId;

    @Column(name = "discount_amount", nullable = false)
    private long discountAmount;

    @Column(name = "deposit_amount", nullable = false)
    private long depositAmount;

    @Column(name = "total_rental_fee", nullable = false)
    private long totalRentalFee;

    @Column(name = "total_payable", nullable = false)
    private long totalPayable;

    @Column(name = "storage_unit_id")
    private Long storageUnitId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReservationStatus status = ReservationStatus.PENDING_PAYMENT;

    @Column(name = "hold_expires_at", nullable = false)
    private OffsetDateTime holdExpiresAt;

    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;

    @Column(name = "fulfilled_at")
    private OffsetDateTime fulfilledAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    public Reservation() {}

    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public Long getUnitTypeId() { return unitTypeId; }
    public void setUnitTypeId(Long unitTypeId) { this.unitTypeId = unitTypeId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public int getRentalMonths() { return rentalMonths; }
    public void setRentalMonths(int rentalMonths) { this.rentalMonths = rentalMonths; }

    public LocalDate getEndDateExclusive() { return endDateExclusive; }
    public void setEndDateExclusive(LocalDate endDateExclusive) { this.endDateExclusive = endDateExclusive; }

    public long getMonthlyPriceSnapshot() { return monthlyPriceSnapshot; }
    public void setMonthlyPriceSnapshot(long monthlyPriceSnapshot) { this.monthlyPriceSnapshot = monthlyPriceSnapshot; }

    public Long getPolicyVersionId() { return policyVersionId; }
    public void setPolicyVersionId(Long policyVersionId) { this.policyVersionId = policyVersionId; }

    public Long getDiscountProgramId() { return discountProgramId; }
    public void setDiscountProgramId(Long discountProgramId) { this.discountProgramId = discountProgramId; }

    public long getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(long discountAmount) { this.discountAmount = discountAmount; }

    public long getDepositAmount() { return depositAmount; }
    public void setDepositAmount(long depositAmount) { this.depositAmount = depositAmount; }

    public long getTotalRentalFee() { return totalRentalFee; }
    public void setTotalRentalFee(long totalRentalFee) { this.totalRentalFee = totalRentalFee; }

    public long getTotalPayable() { return totalPayable; }
    public void setTotalPayable(long totalPayable) { this.totalPayable = totalPayable; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }

    public OffsetDateTime getHoldExpiresAt() { return holdExpiresAt; }
    public void setHoldExpiresAt(OffsetDateTime holdExpiresAt) { this.holdExpiresAt = holdExpiresAt; }

    public OffsetDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(OffsetDateTime confirmedAt) { this.confirmedAt = confirmedAt; }

    public OffsetDateTime getFulfilledAt() { return fulfilledAt; }
    public void setFulfilledAt(OffsetDateTime fulfilledAt) { this.fulfilledAt = fulfilledAt; }

    public OffsetDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(OffsetDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
}

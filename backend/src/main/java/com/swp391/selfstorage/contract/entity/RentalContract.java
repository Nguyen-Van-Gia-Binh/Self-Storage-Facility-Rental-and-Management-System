package com.swp391.selfstorage.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "rental_contract")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RentalContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "reservation_id", nullable = false, unique = true)
    private Long reservationId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "storage_unit_id", nullable = false)
    private Long storageUnitId;

    @Column(name = "unit_type_id")
    private Long unitTypeId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDateExclusive;

    @Column(name = "rental_months", nullable = false)
    private int rentalMonths;

    @Column(name = "monthly_price_snapshot", nullable = false)
    private long monthlyPrice;

    @Column(name = "total_rental_fee", nullable = false)
    private long totalRentalFee;

    @Column(name = "deposit_amount", nullable = false)
    private long depositAmount;

    @Column(name = "deposit_balance", nullable = false)
    private long depositBalance;

    @Column(name = "access_code", length = 10)
    private String accessCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ContractStatus status = ContractStatus.PENDING_CHECK_IN;

    @Column(name = "checkin_date")
    private LocalDate checkinDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "policy_version_id", nullable = false)
    @Builder.Default
    private Long policyVersionId = 1L;

    @Column(name = "policy_snapshot", columnDefinition = "NVARCHAR(MAX)")
    private String policySnapshot;

    @Column(name = "overdue_fee_accrued", nullable = false)
    @Builder.Default
    private long overdueFeeAccrued = 0;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Explicit Getters and Setters (đảm bảo IDE nhận diện symbol mà không phụ thuộc vào cấu hình Lombok của IDE)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public Long getUnitTypeId() { return unitTypeId; }
    public void setUnitTypeId(Long unitTypeId) { this.unitTypeId = unitTypeId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDateExclusive() { return endDateExclusive; }
    public void setEndDateExclusive(LocalDate endDateExclusive) { this.endDateExclusive = endDateExclusive; }

    public int getRentalMonths() { return rentalMonths; }
    public void setRentalMonths(int rentalMonths) { this.rentalMonths = rentalMonths; }

    public long getMonthlyPrice() { return monthlyPrice; }
    public void setMonthlyPrice(long monthlyPrice) { this.monthlyPrice = monthlyPrice; }

    public long getTotalRentalFee() { return totalRentalFee; }
    public void setTotalRentalFee(long totalRentalFee) { this.totalRentalFee = totalRentalFee; }

    public long getDepositAmount() { return depositAmount; }
    public void setDepositAmount(long depositAmount) { this.depositAmount = depositAmount; }

    public long getDepositBalance() { return depositBalance; }
    public void setDepositBalance(long depositBalance) { this.depositBalance = depositBalance; }

    public String getAccessCode() { return accessCode; }
    public void setAccessCode(String accessCode) { this.accessCode = accessCode; }

    public ContractStatus getStatus() { return status; }
    public void setStatus(ContractStatus status) { this.status = status; }

    public LocalDate getCheckinDate() { return checkinDate; }
    public void setCheckinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; }

    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }

    public Long getPolicyVersionId() { return policyVersionId; }
    public void setPolicyVersionId(Long policyVersionId) { this.policyVersionId = policyVersionId; }

    public String getPolicySnapshot() { return policySnapshot; }
    public void setPolicySnapshot(String policySnapshot) { this.policySnapshot = policySnapshot; }

    public long getOverdueFeeAccrued() { return overdueFeeAccrued; }
    public void setOverdueFeeAccrued(long overdueFeeAccrued) { this.overdueFeeAccrued = overdueFeeAccrued; }

    public OffsetDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(OffsetDateTime closedAt) { this.closedAt = closedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
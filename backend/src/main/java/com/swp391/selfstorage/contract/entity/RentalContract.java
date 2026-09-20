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
}
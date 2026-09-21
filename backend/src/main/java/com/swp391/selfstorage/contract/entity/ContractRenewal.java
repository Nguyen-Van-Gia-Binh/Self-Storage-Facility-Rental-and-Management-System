package com.swp391.selfstorage.contract.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "contract_renewal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractRenewal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "previous_end_date", nullable = false)
    private LocalDate previousEndDate;

    @Column(name = "new_end_date", nullable = false)
    private LocalDate newEndDate;

    @Column(name = "rental_months", nullable = false)
    private Integer rentalMonths;

    @Column(name = "monthly_price_snapshot", nullable = false)
    private Long monthlyPriceSnapshot;

    @Column(name = "policy_version_id", nullable = false)
    private Long policyVersionId;

    @Column(name = "overdue_fee_settled", nullable = false)
    @Builder.Default
    private Long overdueFeeSettled = 0L;

    @Column(name = "rental_fee_amount", nullable = false)
    private Long rentalFeeAmount;

    @Column(name = "total_paid", nullable = false)
    private Long totalPaid;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}

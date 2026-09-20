package com.swp391.selfstorage.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "contract_extra_charge")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContractExtraCharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "extra_fee_type_id")
    private Long extraFeeTypeId;

    @Column(name = "amount", nullable = false)
    private long amount;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "recorded_by")
    private Long recordedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ExtraChargeStatus status = ExtraChargeStatus.UNPAID;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}

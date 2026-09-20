package com.swp391.selfstorage.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "handover_record")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HandoverRecord {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "staff_id", nullable = false)
    private Long staffId;

    @Column(name = "handover_at", nullable = false)
    private OffsetDateTime handoverAt;

    @Column(name = "condition_note", length = 500)
    private String conditionNote;

    @Column(name = "customer_confirmed", nullable = false)
    @Builder.Default
    private boolean customerConfirmed = false;

    @Column(name = "customer_confirmed_at")
    private OffsetDateTime customerConfirmedAt;

    @Column(name = "rejected", nullable = false)
    @Builder.Default
    private boolean rejected = false;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (handoverAt == null) {
            handoverAt = OffsetDateTime.now();
        }
    }
}

package com.swp391.selfstorage.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "return_request")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "requested_at", nullable = false)
    @Builder.Default
    private OffsetDateTime requestedAt = OffsetDateTime.now();

    @Column(name = "requested_return_date", nullable = false)
    private LocalDate requestedReturnDate;

    @Column(name = "appointment_slot", length = 50)
    private String appointmentSlot;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReturnRequestStatus status = ReturnRequestStatus.PENDING;

    @Column(name = "inspected_by")
    private Long inspectedBy;

    @Column(name = "inspected_at")
    private OffsetDateTime inspectedAt;

    @Column(name = "is_intact")
    private Boolean isIntact;

    @Column(name = "condition_note", length = 1000)
    private String conditionNote;

    @Column(name = "damage_cost", nullable = false)
    @Builder.Default
    private long damageCost = 0;

    @Column(name = "evidence_image_urls", columnDefinition = "NVARCHAR(MAX)")
    private String evidenceImageUrls;

    @Column(name = "customer_confirmed", nullable = false)
    @Builder.Default
    private Boolean customerConfirmed = false;

    @Column(name = "customer_confirmed_at")
    private OffsetDateTime customerConfirmedAt;

    @Column(name = "signature_data", columnDefinition = "NVARCHAR(MAX)")
    private String signatureData;

    @Column(name = "deposit_refund_amount")
    private Long depositRefundAmount;

    @Column(name = "settled_by")
    private Long settledBy;

    @Column(name = "settled_at")
    private OffsetDateTime settledAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}

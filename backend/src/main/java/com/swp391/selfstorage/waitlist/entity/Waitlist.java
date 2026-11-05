package com.swp391.selfstorage.waitlist.entity;

import com.swp391.selfstorage.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Entity ánh xạ bảng waitlist phục vụ quy trình Telesales CRM (Flow 1, BR-WAT-*).
 */
@Entity
@Table(name = "waitlist")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Waitlist extends BaseEntity {

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "unit_type_id", nullable = false)
    private Long unitTypeId;

    @Column(name = "target_start_date", nullable = false)
    private LocalDate targetStartDate;

    @Column(name = "rental_months", nullable = false)
    @Builder.Default
    private int rentalMonths = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 25)
    @Builder.Default
    private WaitlistStatus status = WaitlistStatus.WAITING;

    @Column(name = "assigned_fm_id")
    private Long assignedFmId;

    @Column(name = "last_contacted_at")
    private OffsetDateTime lastContactedAt;

    @Column(name = "contact_timeout_at")
    private OffsetDateTime contactTimeoutAt;

    @Column(name = "contact_notes", length = 500)
    private String contactNotes;

    @Column(name = "converted_reservation_id")
    private Long convertedReservationId;

    @Column(name = "converted_contract_id")
    private Long convertedContractId;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;
}

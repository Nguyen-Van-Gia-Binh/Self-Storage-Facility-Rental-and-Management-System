package com.swp391.selfstorage.policy.entity;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.swp391.selfstorage.common.entity.BaseEntity;

@Entity
@Table(name = "extra_fee_type")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtraFeeType extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Column(name = "facility_id")
    private Long facilityId;

    @Builder.Default
    @Column(name = "fee_type", nullable = false, length = 20)
    private String feeType = "FIXED";

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

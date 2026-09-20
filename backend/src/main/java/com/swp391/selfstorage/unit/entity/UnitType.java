package com.swp391.selfstorage.unit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "unit_type")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "width_m", nullable = false, precision = 5, scale = 2)
    private BigDecimal widthM;

    @Column(name = "length_m", nullable = false, precision = 5, scale = 2)
    private BigDecimal lengthM;

    @Column(name = "height_m", nullable = false, precision = 5, scale = 2)
    private BigDecimal heightM;

    @Column(length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public BigDecimal getAreaM2() {
        if (widthM == null || lengthM == null) return BigDecimal.ZERO;
        return widthM.multiply(lengthM).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal getVolumeM3() {
        if (widthM == null || lengthM == null || heightM == null) return BigDecimal.ZERO;
        return widthM.multiply(lengthM).multiply(heightM).setScale(3, java.math.RoundingMode.HALF_UP);
    }
}

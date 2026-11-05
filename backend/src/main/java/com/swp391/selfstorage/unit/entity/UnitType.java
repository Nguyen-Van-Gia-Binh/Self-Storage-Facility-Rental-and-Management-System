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

    @Column(name = "width_m", nullable = false, precision = 10, scale = 2)
    private BigDecimal widthM;

    @Column(name = "length_m", nullable = false, precision = 10, scale = 2)
    private BigDecimal lengthM;

    @Column(name = "height_m", nullable = false, precision = 10, scale = 2)
    private BigDecimal heightM;

    @Column(length = 500)
    private String description;

    @Column(name = "pallet_capacity")
    @Builder.Default
    private Integer palletCapacity = 0;

    @Column(name = "max_load_kg_m2")
    @Builder.Default
    private Integer maxLoadKgM2 = 500;

    @Column(length = 30)
    @Builder.Default
    private String environment = "DRY";

    @Column(length = 500)
    private String features;

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

    // Explicit Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getWidthM() { return widthM; }
    public void setWidthM(BigDecimal widthM) { this.widthM = widthM; }

    public BigDecimal getLengthM() { return lengthM; }
    public void setLengthM(BigDecimal lengthM) { this.lengthM = lengthM; }

    public BigDecimal getHeightM() { return heightM; }
    public void setHeightM(BigDecimal heightM) { this.heightM = heightM; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getPalletCapacity() { return palletCapacity; }
    public void setPalletCapacity(Integer palletCapacity) { this.palletCapacity = palletCapacity; }

    public Integer getMaxLoadKgM2() { return maxLoadKgM2; }
    public void setMaxLoadKgM2(Integer maxLoadKgM2) { this.maxLoadKgM2 = maxLoadKgM2; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}

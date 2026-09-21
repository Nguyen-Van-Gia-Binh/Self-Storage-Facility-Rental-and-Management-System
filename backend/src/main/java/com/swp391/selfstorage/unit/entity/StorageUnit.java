package com.swp391.selfstorage.unit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "storage_unit", uniqueConstraints = {
    @UniqueConstraint(name = "uq_storage_unit_facility_code", columnNames = {"facility_id", "code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "unit_type_id", nullable = false)
    private Long unitTypeId;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(name = "floor")
    private Integer floor;

    @Column(name = "position", length = 50)
    private String position;

    @Column(name = "location_note", length = 255)
    private String locationNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StorageUnitStatus status = StorageUnitStatus.AVAILABLE;

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

    public boolean isActive() {
        return status != StorageUnitStatus.OUT_OF_SERVICE;
    }

    // Explicit Getters and Setters (đảm bảo IDE nhận diện symbol mà không phụ thuộc vào cấu hình Lombok của IDE)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public Long getUnitTypeId() { return unitTypeId; }
    public void setUnitTypeId(Long unitTypeId) { this.unitTypeId = unitTypeId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getLocationNote() { return locationNote; }
    public void setLocationNote(String locationNote) { this.locationNote = locationNote; }

    public StorageUnitStatus getStatus() { return status; }
    public void setStatus(StorageUnitStatus status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}

package com.swp391.selfstorage.facility.entity;

import com.swp391.selfstorage.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "facility")
public class Facility extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "opening_hours", length = 50)
    private String openingHours;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FacilityStatus status = FacilityStatus.ACTIVE;

    public Facility() {}

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }

    public FacilityStatus getStatus() { return status; }
    public void setStatus(FacilityStatus status) { this.status = status; }

    public boolean isActive() {
        return this.status == FacilityStatus.ACTIVE;
    }
}

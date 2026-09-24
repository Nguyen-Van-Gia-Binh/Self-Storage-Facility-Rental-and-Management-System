package com.swp391.selfstorage.facility.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;

public class FacilityResponse {

    private Long id;
    private String code;
    private String name;
    private String address;
    private String phone;
    private String description;
    private String openingHours;

    @JsonProperty("isActive")
    private boolean isActive;

    private BigDecimal lowestMonthlyPrice;
    private Integer activeUnitTypeCount;

    private Instant createdAt;
    private Instant updatedAt;

    public FacilityResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    @JsonProperty("isActive")
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public BigDecimal getLowestMonthlyPrice() { return lowestMonthlyPrice; }
    public void setLowestMonthlyPrice(BigDecimal lowestMonthlyPrice) { this.lowestMonthlyPrice = lowestMonthlyPrice; }

    public Integer getActiveUnitTypeCount() { return activeUnitTypeCount; }
    public void setActiveUnitTypeCount(Integer activeUnitTypeCount) { this.activeUnitTypeCount = activeUnitTypeCount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

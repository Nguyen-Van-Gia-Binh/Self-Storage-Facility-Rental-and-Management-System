package com.swp391.selfstorage.reservation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CalculatePriceRequest {

    @NotNull(message = "Cơ sở không được để trống")
    private Long facilityId;

    @NotNull(message = "Loại ô kho không được để trống")
    private Long unitTypeId;

    @Min(value = 1, message = "Số tháng thuê tối thiểu là 1 tháng")
    private int months = 1;

    public CalculatePriceRequest() {}

    public CalculatePriceRequest(Long facilityId, Long unitTypeId, int months) {
        this.facilityId = facilityId;
        this.unitTypeId = unitTypeId;
        this.months = months;
    }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public Long getUnitTypeId() { return unitTypeId; }
    public void setUnitTypeId(Long unitTypeId) { this.unitTypeId = unitTypeId; }

    public int getMonths() { return months; }
    public void setMonths(int months) { this.months = months; }
}

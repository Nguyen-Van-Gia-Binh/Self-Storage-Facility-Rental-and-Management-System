package com.swp391.selfstorage.facility.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateFacilityStatusRequest {

    @NotNull(message = "isActive không được để trống")
    private Boolean isActive;

    public UpdateFacilityStatusRequest() {}

    public UpdateFacilityStatusRequest(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

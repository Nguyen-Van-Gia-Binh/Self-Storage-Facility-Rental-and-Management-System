package com.swp391.selfstorage.user.dto;

import com.swp391.selfstorage.user.entity.UserStatus;

public class UpdateUserStatusRequest {

    private Boolean isActive;
    private UserStatus status;

    public UpdateUserStatusRequest() {}

    public UpdateUserStatusRequest(Boolean isActive) {
        this.isActive = isActive;
        if (isActive != null) {
            this.status = isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
        }
    }

    public UpdateUserStatusRequest(UserStatus status) {
        this.status = status;
        if (status != null) {
            this.isActive = (status == UserStatus.ACTIVE);
        }
    }

    public Boolean getIsActive() {
        if (isActive != null) return isActive;
        return status == UserStatus.ACTIVE;
    }

    public void setIsActive(Boolean active) {
        this.isActive = active;
        if (active != null) {
            this.status = active ? UserStatus.ACTIVE : UserStatus.INACTIVE;
        }
    }

    public UserStatus getStatus() {
        if (status != null) return status;
        if (isActive != null) {
            return isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
        }
        return null;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
        if (status != null) {
            this.isActive = (status == UserStatus.ACTIVE);
        }
    }
}

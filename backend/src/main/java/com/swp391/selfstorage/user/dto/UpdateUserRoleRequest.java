package com.swp391.selfstorage.user.dto;

import com.swp391.selfstorage.user.entity.UserRole;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

public class UpdateUserRoleRequest {

    @NotNull(message = "Vai trò không được để trống")
    private UserRole role;

    private List<Long> facilityIds = new ArrayList<>();

    public UpdateUserRoleRequest() {}

    public UpdateUserRoleRequest(UserRole role, List<Long> facilityIds) {
        this.role = role;
        this.facilityIds = (facilityIds != null) ? facilityIds : new ArrayList<>();
    }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public List<Long> getFacilityIds() { return facilityIds; }
    public void setFacilityIds(List<Long> facilityIds) { this.facilityIds = facilityIds; }
}

package com.swp391.selfstorage.user.dto;

import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class UserResponse {

    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String identityNumber;
    private UserRole role;
    private UserStatus status;
    private boolean active;
    private List<Long> facilityIds = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;

    public UserResponse() {}

    public UserResponse(Long id, String email, String fullName, String phone, String identityNumber,
                        UserRole role, UserStatus status, boolean active, List<Long> facilityIds,
                        Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.identityNumber = identityNumber;
        this.role = role;
        this.status = status;
        this.active = active;
        this.facilityIds = (facilityIds != null) ? facilityIds : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private String identityNumber;
        private UserRole role;
        private UserStatus status;
        private boolean active;
        private List<Long> facilityIds = new ArrayList<>();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder identityNumber(String identityNumber) { this.identityNumber = identityNumber; return this; }
        public Builder role(UserRole role) { this.role = role; return this; }
        public Builder status(UserStatus status) { this.status = status; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        public Builder facilityIds(List<Long> facilityIds) { this.facilityIds = facilityIds; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public UserResponse build() {
            return new UserResponse(id, email, fullName, phone, identityNumber, role, status, active, facilityIds, createdAt, updatedAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getIdentityNumber() { return identityNumber; }
    public void setIdentityNumber(String identityNumber) { this.identityNumber = identityNumber; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public List<Long> getFacilityIds() { return facilityIds; }
    public void setFacilityIds(List<Long> facilityIds) { this.facilityIds = facilityIds; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

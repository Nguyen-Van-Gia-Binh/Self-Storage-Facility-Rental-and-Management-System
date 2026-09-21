package com.swp391.selfstorage.user.mapper;

import com.swp391.selfstorage.user.dto.CreateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRequest;
import com.swp391.selfstorage.user.dto.UserResponse;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class UserMapper {

    public AppUser toEntity(CreateUserRequest request, String encodedPassword) {
        if (request == null) return null;
        AppUser user = new AppUser();
        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(encodedPassword);
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setIdentityNumber(request.getIdentityNumber() != null ? request.getIdentityNumber().trim() : null);
        user.setRole(request.getRole());
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }

    public void updateEntity(AppUser user, UpdateUserRequest request) {
        if (user == null || request == null) return;
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getIdentityNumber() != null) {
            user.setIdentityNumber(request.getIdentityNumber().trim());
        }
    }

    public UserResponse toResponse(AppUser user, List<Long> facilityIds) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .identityNumber(user.getIdentityNumber())
                .role(user.getRole())
                .status(user.getStatus())
                .active(user.isActive())
                .facilityIds(facilityIds != null ? facilityIds : Collections.emptyList())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public UserResponse toResponse(AppUser user) {
        return toResponse(user, Collections.emptyList());
    }
}

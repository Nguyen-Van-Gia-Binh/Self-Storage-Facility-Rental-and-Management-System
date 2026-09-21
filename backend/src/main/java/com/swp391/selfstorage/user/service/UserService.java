package com.swp391.selfstorage.user.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.user.dto.CreateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRoleRequest;
import com.swp391.selfstorage.user.dto.UpdateUserStatusRequest;
import com.swp391.selfstorage.user.dto.UserResponse;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {

    PageResponse<UserResponse> getUsers(String keyword, UserRole role, UserStatus status, Pageable pageable);

    UserResponse getUserById(Long id);

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    UserResponse updateUserRole(Long id, UpdateUserRoleRequest request);

    UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request);

    List<Long> getAssignedFacilityIds(Long userId);
}

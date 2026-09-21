package com.swp391.selfstorage.user.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.user.dto.CreateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRoleRequest;
import com.swp391.selfstorage.user.dto.UpdateUserStatusRequest;
import com.swp391.selfstorage.user.dto.UserResponse;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserFacilityAssignment;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.mapper.UserMapper;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserFacilityAssignmentRepository assignmentRepository;
    private final FacilityRepository facilityRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository,
                           UserFacilityAssignmentRepository assignmentRepository,
                           FacilityRepository facilityRepository,
                           PasswordEncoder passwordEncoder,
                           UserMapper userMapper) {
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.facilityRepository = facilityRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(String keyword, UserRole role, UserStatus status, Pageable pageable) {
        Page<AppUser> userPage = userRepository.findByFilters(keyword, role, status, pageable);
        List<UserResponse> responses = userPage.getContent().stream()
                .map(user -> {
                    List<Long> facilityIds = assignmentRepository.findFacilityIdsByUserId(user.getId());
                    return userMapper.toResponse(user, facilityIds);
                })
                .toList();

        return new PageResponse<>(
                responses,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        AppUser user = findUserById(id);
        List<Long> facilityIds = assignmentRepository.findFacilityIdsByUserId(id);
        return userMapper.toResponse(user, facilityIds);
    }

    @Override
    public UserResponse createUser(CreateUserRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new CustomException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        validateRoleAndFacilities(request.getRole(), request.getFacilityIds());

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : "Password123";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        AppUser user = userMapper.toEntity(request, encodedPassword);
        AppUser savedUser = userRepository.save(user);

        if (request.getFacilityIds() != null && !request.getFacilityIds().isEmpty()) {
            for (Long facilityId : request.getFacilityIds()) {
                assignmentRepository.save(new UserFacilityAssignment(savedUser.getId(), facilityId));
            }
        }

        List<Long> assignedFacilityIds = assignmentRepository.findFacilityIdsByUserId(savedUser.getId());
        return userMapper.toResponse(savedUser, assignedFacilityIds);
    }

    @Override
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        AppUser user = findUserById(id);
        userMapper.updateEntity(user, request);
        AppUser updated = userRepository.save(user);
        List<Long> facilityIds = assignmentRepository.findFacilityIdsByUserId(id);
        return userMapper.toResponse(updated, facilityIds);
    }

    @Override
    public UserResponse updateUserRole(Long id, UpdateUserRoleRequest request) {
        AppUser user = findUserById(id);
        validateRoleAndFacilities(request.getRole(), request.getFacilityIds());

        user.setRole(request.getRole());
        AppUser updated = userRepository.save(user);

        assignmentRepository.deleteByUserId(id);
        if (isFacilityScopedRole(request.getRole()) && request.getFacilityIds() != null) {
            for (Long facilityId : request.getFacilityIds()) {
                assignmentRepository.save(new UserFacilityAssignment(id, facilityId));
            }
        }

        List<Long> facilityIds = assignmentRepository.findFacilityIdsByUserId(id);
        return userMapper.toResponse(updated, facilityIds);
    }

    @Override
    public UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request) {
        AppUser user = findUserById(id);
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
        AppUser updated = userRepository.save(user);
        List<Long> facilityIds = assignmentRepository.findFacilityIdsByUserId(id);
        return userMapper.toResponse(updated, facilityIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> getAssignedFacilityIds(Long userId) {
        return assignmentRepository.findFacilityIdsByUserId(userId);
    }

    private AppUser findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private void validateRoleAndFacilities(UserRole role, List<Long> facilityIds) {
        if (isFacilityScopedRole(role)) {
            if (facilityIds == null || facilityIds.isEmpty()) {
                throw new CustomException(ErrorCode.ROLE_REQUIRES_FACILITY);
            }
            for (Long facilityId : facilityIds) {
                if (!facilityRepository.existsById(facilityId)) {
                    throw new CustomException(ErrorCode.FACILITY_NOT_FOUND);
                }
            }
        }
    }

    private boolean isFacilityScopedRole(UserRole role) {
        return role == UserRole.FACILITY_STAFF || role == UserRole.FACILITY_MANAGER;
    }
}

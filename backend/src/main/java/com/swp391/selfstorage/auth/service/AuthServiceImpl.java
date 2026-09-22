package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.auth.dto.AuthResponse;
import com.swp391.selfstorage.auth.dto.ChangePasswordRequest;
import com.swp391.selfstorage.auth.dto.LoginRequest;
import com.swp391.selfstorage.auth.dto.RefreshTokenRequest;
import com.swp391.selfstorage.auth.dto.RegisterRequest;
import com.swp391.selfstorage.auth.jwt.JwtTokenProvider;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import com.swp391.selfstorage.user.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserFacilityAssignmentRepository userFacilityAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;

    public AuthServiceImpl(UserRepository userRepository,
                           UserFacilityAssignmentRepository userFacilityAssignmentRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider) {
        this(userRepository, userFacilityAssignmentRepository, passwordEncoder, jwtTokenProvider, null);
    }

    @Autowired
    public AuthServiceImpl(UserRepository userRepository,
                           UserFacilityAssignmentRepository userFacilityAssignmentRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider,
                           AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.userFacilityAssignmentRepository = userFacilityAssignmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());

        AppUser user = new AppUser(
                request.getEmail(),
                passwordHash,
                request.getFullName(),
                request.getPhone(),
                request.getIdentityNumber(),
                UserRole.STORAGE_CUSTOMER,
                UserStatus.ACTIVE
        );

        AppUser savedUser = userRepository.save(user);

        List<Long> facilityIds = Collections.emptyList();
        String accessToken = jwtTokenProvider.generateAccessToken(savedUser, facilityIds);
        String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser);

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                facilityIds
        );

        return AuthResponse.of(accessToken, refreshToken, jwtTokenProvider.getAccessTokenExpirationSeconds(), userInfo);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        return login(request, null, null);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        AppUser user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            if (auditLogService != null) {
                auditLogService.recordLogin(null, request.getEmail(), ipAddress, userAgent, false, "Email không tồn tại");
            }
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            if (auditLogService != null) {
                auditLogService.recordLogin(user.getId(), user.getEmail(), ipAddress, userAgent, false, "Mật khẩu không đúng");
            }
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!user.isActive()) {
            if (auditLogService != null) {
                auditLogService.recordLogin(user.getId(), user.getEmail(), ipAddress, userAgent, false, "Tài khoản bị vô hiệu hóa");
            }
            throw new CustomException(ErrorCode.ACCOUNT_DISABLED);
        }

        if (auditLogService != null) {
            auditLogService.recordLogin(user.getId(), user.getEmail(), ipAddress, userAgent, true, null);
        }

        List<Long> facilityIds = userFacilityAssignmentRepository.findFacilityIdsByUserId(user.getId());

        String accessToken = jwtTokenProvider.generateAccessToken(user, facilityIds);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                facilityIds
        );

        return AuthResponse.of(accessToken, refreshToken, jwtTokenProvider.getAccessTokenExpirationSeconds(), userInfo);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (!jwtTokenProvider.validateToken(request.getRefreshToken())) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        String email = jwtTokenProvider.getEmailFromToken(request.getRefreshToken());
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));

        if (!user.isActive()) {
            throw new CustomException(ErrorCode.ACCOUNT_DISABLED);
        }

        List<Long> facilityIds = userFacilityAssignmentRepository.findFacilityIdsByUserId(user.getId());
        String newAccessToken = jwtTokenProvider.generateAccessToken(user, facilityIds);

        return AuthResponse.of(newAccessToken, request.getRefreshToken(), jwtTokenProvider.getAccessTokenExpirationSeconds(), null);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS, "Mật khẩu hiện tại không chính xác");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}

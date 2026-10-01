package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.auth.dto.AuthResponse;
import com.swp391.selfstorage.auth.dto.ChangePasswordRequest;
import com.swp391.selfstorage.auth.dto.ForgotPasswordRequest;
import com.swp391.selfstorage.auth.dto.GoogleLoginRequest;
import com.swp391.selfstorage.auth.dto.LoginRequest;
import com.swp391.selfstorage.auth.dto.RefreshTokenRequest;
import com.swp391.selfstorage.auth.dto.RegisterRequest;
import com.swp391.selfstorage.auth.dto.ResetPasswordRequest;
import com.swp391.selfstorage.auth.entity.PasswordResetOtp;
import com.swp391.selfstorage.auth.jwt.JwtTokenProvider;
import com.swp391.selfstorage.auth.repository.PasswordResetOtpRepository;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.common.service.EmailService;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import com.swp391.selfstorage.user.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final UserFacilityAssignmentRepository userFacilityAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final EmailService emailService;
    private final RestTemplate restTemplate;

    @Value("${google.client-id:}")
    private String googleClientId;

    public AuthServiceImpl(UserRepository userRepository,
                           UserFacilityAssignmentRepository userFacilityAssignmentRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider) {
        this(userRepository, userFacilityAssignmentRepository, passwordEncoder, jwtTokenProvider, null, null, null, null);
    }

    @Autowired
    public AuthServiceImpl(UserRepository userRepository,
                           UserFacilityAssignmentRepository userFacilityAssignmentRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider,
                           @Autowired(required = false) AuditLogService auditLogService,
                           @Autowired(required = false) PasswordResetOtpRepository passwordResetOtpRepository,
                           @Autowired(required = false) EmailService emailService,
                           @Autowired(required = false) RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.userFacilityAssignmentRepository = userFacilityAssignmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.auditLogService = auditLogService;
        this.passwordResetOtpRepository = passwordResetOtpRepository;
        this.emailService = emailService;
        this.restTemplate = restTemplate;
    }

    public void setGoogleClientId(String googleClientId) {
        this.googleClientId = googleClientId;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        return register(request, null, null);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress, String userAgent) {
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

        // Ghi nhận đăng ký thành công (T3.15 - Issue #15: Audit Log thời gian thực)
        // Chạy sau khi commit để tránh lock conflict giữa app_user uncommitted và REQUIRES_NEW trong SQL Server
        if (auditLogService != null) {
            if (TransactionSynchronizationManager.isActualTransactionActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        auditLogService.recordLogin(savedUser.getId(), savedUser.getEmail(), ipAddress, userAgent, true, "Đăng ký tài khoản mới");
                    }
                });
            } else {
                auditLogService.recordLogin(savedUser.getId(), savedUser.getEmail(), ipAddress, userAgent, true, "Đăng ký tài khoản mới");
            }
        }

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
    @Transactional
    @SuppressWarnings("unchecked")
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        if (restTemplate == null) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "Dịch vụ RestTemplate chưa được khởi tạo");
        }

        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken();
        Map<String, Object> tokenInfo;
        try {
            tokenInfo = restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.error("Google token verification failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        if (tokenInfo == null) {
            throw new CustomException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        String aud = (String) tokenInfo.get("aud");
        if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals(aud)) {
            log.error("Google token aud mismatch: expected {}, got {}", googleClientId, aud);
            throw new CustomException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        String email = (String) tokenInfo.get("email");
        if (email == null || email.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        String name = (String) tokenInfo.get("name");
        if (name == null || name.isBlank()) {
            name = email.split("@")[0];
        }

        AppUser user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            String randomPassword = UUID.randomUUID().toString();
            user = new AppUser(
                    email,
                    passwordEncoder.encode(randomPassword),
                    name,
                    null,
                    null,
                    UserRole.STORAGE_CUSTOMER,
                    UserStatus.ACTIVE
            );
            user = userRepository.save(user);
            log.info("Tạo tài khoản mới từ Google OAuth cho email: {}", email);
        } else if (!user.isActive()) {
            throw new CustomException(ErrorCode.ACCOUNT_DISABLED);
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
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        AppUser user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy tài khoản với email này"));

        if (!user.isActive()) {
            throw new CustomException(ErrorCode.ACCOUNT_DISABLED);
        }

        String otpCode = String.format("%06d", new SecureRandom().nextInt(1000000));
        LocalDateTime expiredAt = LocalDateTime.now().plusSeconds(60);

        if (passwordResetOtpRepository != null) {
            PasswordResetOtp otpEntity = new PasswordResetOtp(request.getEmail(), otpCode, expiredAt);
            passwordResetOtpRepository.save(otpEntity);
        }

        if (emailService != null) {
            emailService.sendOtpEmail(request.getEmail(), otpCode, 60);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyOtp(com.swp391.selfstorage.auth.dto.VerifyOtpRequest request) {
        if (passwordResetOtpRepository == null) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "Dịch vụ xác thực OTP chưa sẵn sàng");
        }

        PasswordResetOtp otpEntity = passwordResetOtpRepository
                .findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc(request.getEmail(), request.getOtp())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_OTP));

        if (otpEntity.isExpired()) {
            throw new CustomException(ErrorCode.OTP_EXPIRED);
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (passwordResetOtpRepository == null) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "Dịch vụ xác thực OTP chưa sẵn sàng");
        }

        PasswordResetOtp otpEntity = passwordResetOtpRepository
                .findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc(request.getEmail(), request.getOtp())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_OTP));

        if (otpEntity.isExpired()) {
            throw new CustomException(ErrorCode.OTP_EXPIRED);
        }

        otpEntity.setUsed(true);
        passwordResetOtpRepository.save(otpEntity);

        AppUser user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Đặt lại mật khẩu thành công cho email: {}", request.getEmail());
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

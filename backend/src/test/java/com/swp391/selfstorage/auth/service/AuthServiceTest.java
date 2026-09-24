package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.auth.dto.AuthResponse;
import com.swp391.selfstorage.auth.dto.ForgotPasswordRequest;
import com.swp391.selfstorage.auth.dto.GoogleLoginRequest;
import com.swp391.selfstorage.auth.dto.LoginRequest;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserFacilityAssignmentRepository userFacilityAssignmentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordResetOtpRepository passwordResetOtpRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AuthServiceImpl authService;

    private AppUser sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new AppUser(
                "tung@example.com",
                "hashed_pwd",
                "Lê Thanh Tùng",
                "0901234567",
                "0123456789",
                UserRole.STORAGE_CUSTOMER,
                UserStatus.ACTIVE
        );
        sampleUser.setId(1L);
    }

    @Test
    @DisplayName("Đăng ký thành công tài khoản Storage Customer mới")
    void register_Success() {
        RegisterRequest request = new RegisterRequest(
                "Lê Thanh Tùng",
                "tung@example.com",
                "0901234567",
                "0123456789",
                "Password123"
        );

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed_pwd");
        when(userRepository.save(any(AppUser.class))).thenReturn(sampleUser);
        when(jwtTokenProvider.generateAccessToken(any(AppUser.class), anyList())).thenReturn("mock-access-token");
        when(jwtTokenProvider.generateRefreshToken(any(AppUser.class))).thenReturn("mock-refresh-token");
        when(jwtTokenProvider.getAccessTokenExpirationSeconds()).thenReturn(900L);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
        assertThat(response.getRefreshToken()).isEqualTo("mock-refresh-token");
        assertThat(response.getUser().getEmail()).isEqualTo("tung@example.com");
        assertThat(response.getUser().getRole()).isEqualTo(UserRole.STORAGE_CUSTOMER);

        verify(userRepository).save(any(AppUser.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi email đã tồn tại trong hệ thống (409 Conflict)")
    void register_EmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest(
                "Lê Thanh Tùng",
                "tung@example.com",
                "0901234567",
                "0123456789",
                "Password123"
        );

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    @Test
    @DisplayName("Đăng nhập thành công trả về cặp token và danh sách facilityIds")
    void login_Success() {
        LoginRequest request = new LoginRequest("tung@example.com", "Password123");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches(request.getPassword(), sampleUser.getPasswordHash())).thenReturn(true);
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(sampleUser.getId())).thenReturn(List.of(1L, 2L));
        when(jwtTokenProvider.generateAccessToken(sampleUser, List.of(1L, 2L))).thenReturn("mock-access-token");
        when(jwtTokenProvider.generateRefreshToken(sampleUser)).thenReturn("mock-refresh-token");
        when(jwtTokenProvider.getAccessTokenExpirationSeconds()).thenReturn(900L);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
        assertThat(response.getUser().getFacilityIds()).containsExactly(1L, 2L);
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi sai mật khẩu (401 Unauthorized)")
    void login_InvalidCredentials_WrongPassword() {
        LoginRequest request = new LoginRequest("tung@example.com", "WrongPassword");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches(request.getPassword(), sampleUser.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi tài khoản bị khóa INACTIVE (403 Forbidden)")
    void login_AccountDisabled() {
        sampleUser.setStatus(UserStatus.INACTIVE);
        LoginRequest request = new LoginRequest("tung@example.com", "Password123");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches(request.getPassword(), sampleUser.getPasswordHash())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCOUNT_DISABLED);
    }

    @Test
    @DisplayName("Đăng nhập Google thành công với người dùng mới (tự động tạo tài khoản)")
    void loginWithGoogle_Success_NewUser() {
        GoogleLoginRequest request = new GoogleLoginRequest("mock-google-id-token");
        Map<String, Object> tokenInfo = new HashMap<>();
        tokenInfo.put("email", "newuser@gmail.com");
        tokenInfo.put("name", "New User");
        tokenInfo.put("aud", "test-client-id");

        authService.setGoogleClientId("test-client-id");
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(tokenInfo);
        when(userRepository.findByEmail("newuser@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-random-uuid");

        AppUser createdUser = new AppUser(
                "newuser@gmail.com",
                "hashed-random-uuid",
                "New User",
                null,
                null,
                UserRole.STORAGE_CUSTOMER,
                UserStatus.ACTIVE
        );
        createdUser.setId(99L);
        when(userRepository.save(any(AppUser.class))).thenReturn(createdUser);
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(99L)).thenReturn(Collections.emptyList());
        when(jwtTokenProvider.generateAccessToken(eq(createdUser), anyList())).thenReturn("mock-access-token");
        when(jwtTokenProvider.generateRefreshToken(eq(createdUser))).thenReturn("mock-refresh-token");
        when(jwtTokenProvider.getAccessTokenExpirationSeconds()).thenReturn(900L);

        var response = authService.loginWithGoogle(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
        assertThat(response.getUser().getEmail()).isEqualTo("newuser@gmail.com");
        assertThat(response.getUser().getRole()).isEqualTo(UserRole.STORAGE_CUSTOMER);
        verify(userRepository).save(any(AppUser.class));
    }

    @Test
    @DisplayName("Đăng nhập Google thất bại khi token không hợp lệ (401 Unauthorized)")
    void loginWithGoogle_InvalidToken() {
        GoogleLoginRequest request = new GoogleLoginRequest("invalid-token");
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenThrow(new RuntimeException("Token verification error"));

        assertThatThrownBy(() -> authService.loginWithGoogle(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_GOOGLE_TOKEN);
    }

    @Test
    @DisplayName("Quên mật khẩu thành công: tạo OTP và gửi email xác thực")
    void forgotPassword_Success() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("tung@example.com");
        when(userRepository.findByEmail("tung@example.com")).thenReturn(Optional.of(sampleUser));

        authService.forgotPassword(request);

        verify(passwordResetOtpRepository).save(any(PasswordResetOtp.class));
        verify(emailService).sendOtpEmail(eq("tung@example.com"), anyString(), eq(60));
    }

    @Test
    @DisplayName("Quên mật khẩu thất bại khi email không tồn tại trong hệ thống (404 Not Found)")
    void forgotPassword_UserNotFound() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("nonexistent@example.com");
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.forgotPassword(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thành công khi OTP hợp lệ và còn hạn")
    void resetPassword_Success() {
        ResetPasswordRequest request = new ResetPasswordRequest("tung@example.com", "123456", "NewSecretPass123");
        PasswordResetOtp validOtp = new PasswordResetOtp("tung@example.com", "123456", LocalDateTime.now().plusSeconds(50));

        when(passwordResetOtpRepository.findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc("tung@example.com", "123456"))
                .thenReturn(Optional.of(validOtp));
        when(userRepository.findByEmail("tung@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("NewSecretPass123")).thenReturn("new-hashed-password");

        authService.resetPassword(request);

        assertThat(validOtp.isUsed()).isTrue();
        verify(passwordResetOtpRepository).save(validOtp);
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại khi OTP đã hết hạn 60s")
    void resetPassword_ExpiredOtp() {
        ResetPasswordRequest request = new ResetPasswordRequest("tung@example.com", "123456", "NewSecretPass123");
        PasswordResetOtp expiredOtp = new PasswordResetOtp("tung@example.com", "123456", LocalDateTime.now().minusSeconds(10));

        when(passwordResetOtpRepository.findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc("tung@example.com", "123456"))
                .thenReturn(Optional.of(expiredOtp));

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OTP_EXPIRED);
    }

    @Test
    @DisplayName("Xác thực OTP thành công khi mã đúng và còn hạn")
    void verifyOtp_Success() {
        com.swp391.selfstorage.auth.dto.VerifyOtpRequest request =
                new com.swp391.selfstorage.auth.dto.VerifyOtpRequest("tung@example.com", "123456");
        PasswordResetOtp validOtp = new PasswordResetOtp("tung@example.com", "123456", LocalDateTime.now().plusSeconds(50));

        when(passwordResetOtpRepository.findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc("tung@example.com", "123456"))
                .thenReturn(Optional.of(validOtp));

        authService.verifyOtp(request);
        // Khong throw exception la pass
    }

    @Test
    @DisplayName("Xác thực OTP thất bại khi mã không đúng")
    void verifyOtp_InvalidOtp() {
        com.swp391.selfstorage.auth.dto.VerifyOtpRequest request =
                new com.swp391.selfstorage.auth.dto.VerifyOtpRequest("tung@example.com", "999999");

        when(passwordResetOtpRepository.findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc("tung@example.com", "999999"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyOtp(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_OTP);
    }

    @Test
    @DisplayName("Xác thực OTP thất bại khi mã đã hết hạn")
    void verifyOtp_ExpiredOtp() {
        com.swp391.selfstorage.auth.dto.VerifyOtpRequest request =
                new com.swp391.selfstorage.auth.dto.VerifyOtpRequest("tung@example.com", "123456");
        PasswordResetOtp expiredOtp = new PasswordResetOtp("tung@example.com", "123456", LocalDateTime.now().minusSeconds(10));

        when(passwordResetOtpRepository.findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc("tung@example.com", "123456"))
                .thenReturn(Optional.of(expiredOtp));

        assertThatThrownBy(() -> authService.verifyOtp(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OTP_EXPIRED);
    }
}

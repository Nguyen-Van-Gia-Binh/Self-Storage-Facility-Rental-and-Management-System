package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.auth.dto.AuthResponse;
import com.swp391.selfstorage.auth.dto.LoginRequest;
import com.swp391.selfstorage.auth.dto.RegisterRequest;
import com.swp391.selfstorage.auth.jwt.JwtTokenProvider;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
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
}

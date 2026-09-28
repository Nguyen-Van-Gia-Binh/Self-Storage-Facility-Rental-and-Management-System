package com.swp391.selfstorage.auth;

import com.swp391.selfstorage.auth.dto.AuthResponse;
import com.swp391.selfstorage.auth.dto.LoginRequest;
import com.swp391.selfstorage.auth.jwt.JwtTokenProvider;
import com.swp391.selfstorage.auth.repository.PasswordResetOtpRepository;
import com.swp391.selfstorage.auth.service.AuthServiceImpl;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import com.swp391.selfstorage.user.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class DemoAccountsVerificationTest {

    private UserRepository userRepository;
    private UserFacilityAssignmentRepository userFacilityAssignmentRepository;
    private PasswordEncoder passwordEncoder;
    private JwtTokenProvider jwtTokenProvider;
    private AuthServiceImpl authService;

    // Hash từ migration V11/V12/V13 cho password123
    private static final String BCRYPT_HASH_FOR_PASSWORD123 = "$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi";

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userFacilityAssignmentRepository = mock(UserFacilityAssignmentRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        jwtTokenProvider = mock(JwtTokenProvider.class);

        when(jwtTokenProvider.generateAccessToken(any(AppUser.class), anyList())).thenReturn("mock-access-token");
        when(jwtTokenProvider.generateRefreshToken(any(AppUser.class))).thenReturn("mock-refresh-token");
        when(jwtTokenProvider.getAccessTokenExpirationSeconds()).thenReturn(900L);

        authService = new AuthServiceImpl(
                userRepository,
                userFacilityAssignmentRepository,
                passwordEncoder,
                jwtTokenProvider
        );
    }

    @ParameterizedTest(name = "Tài khoản {0} vai trò {1} đăng nhập thành công với password123")
    @CsvSource({
            "admin@smartstorage.vn, SYSTEM_ADMINISTRATOR, Lê Thanh Tùng",
            "bom@smartstorage.vn, BUSINESS_OPERATIONS_MANAGER, Huỳnh Nhật",
            "fm.q1@smartstorage.vn, FACILITY_MANAGER, Nguyễn Văn Gia Bình",
            "staff.q1@smartstorage.vn, FACILITY_STAFF, Trần Văn Hùng",
            "nhi.customer@gmail.com, STORAGE_CUSTOMER, Nguyễn Phạm Xuân Nhi"
    })
    @DisplayName("Kiểm tra 5 tài khoản mẫu đăng nhập chuẩn xác theo đặc tả 1.1")
    void testAll5DemoAccountsLoginSuccess(String email, UserRole role, String fullName) {
        AppUser mockUser = new AppUser(
                email,
                BCRYPT_HASH_FOR_PASSWORD123,
                fullName,
                "0900000000",
                "079099000000",
                role,
                UserStatus.ACTIVE
        );
        mockUser.setId(100L);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mockUser));
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(100L))
                .thenReturn(role == UserRole.FACILITY_MANAGER ? List.of(1L, 2L) : List.of());

        // Thực hiện đăng nhập
        LoginRequest request = new LoginRequest(email, "password123");
        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getEmail()).isEqualTo(email);
        assertThat(response.getUser().getRole()).isEqualTo(role);
        assertThat(response.getUser().getFullName()).isEqualTo(fullName);

        // Kiểm tra khớp hash mật khẩu
        assertThat(passwordEncoder.matches("password123", mockUser.getPasswordHash())).isTrue();
    }
}

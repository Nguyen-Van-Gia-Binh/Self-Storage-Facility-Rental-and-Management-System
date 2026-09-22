package com.swp391.selfstorage.user.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.user.dto.AuditLogFilterRequest;
import com.swp391.selfstorage.user.dto.AuditLogResponse;
import com.swp391.selfstorage.user.dto.LoginHistoryFilterRequest;
import com.swp391.selfstorage.user.dto.LoginHistoryResponse;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.AuditLog;
import com.swp391.selfstorage.user.entity.LoginHistory;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.AuditLogRepository;
import com.swp391.selfstorage.user.repository.LoginHistoryRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import com.swp391.selfstorage.user.service.impl.AuditLogServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogService Tests")
class AuditLogServiceTest {

    @Mock
    private LoginHistoryRepository loginHistoryRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    private AuditLogService auditLogService;

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @BeforeEach
    void setUp() {
        auditLogService = new AuditLogServiceImpl(loginHistoryRepository, auditLogRepository, userRepository);
    }

    @Nested
    @DisplayName("recordLogin Tests")
    class RecordLoginTests {

        @Test
        @DisplayName("Should record successful login")
        void recordLogin_Success() {
            auditLogService.recordLogin(1L, "user@example.com", "192.168.1.1", "Mozilla/5.0", true, null);

            ArgumentCaptor<LoginHistory> captor = ArgumentCaptor.forClass(LoginHistory.class);
            verify(loginHistoryRepository).save(captor.capture());

            LoginHistory saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(1L);
            assertThat(saved.getEmail()).isEqualTo("user@example.com");
            assertThat(saved.getIpAddress()).isEqualTo("192.168.1.1");
            assertThat(saved.getUserAgent()).isEqualTo("Mozilla/5.0");
            assertThat(saved.isSuccess()).isTrue();
            assertThat(saved.getFailureReason()).isNull();
            assertThat(saved.getLoggedInAt()).isNotNull();
        }

        @Test
        @DisplayName("Should record failed login with null userId and reason")
        void recordLogin_FailureNonExistentUser() {
            auditLogService.recordLogin(null, "unknown@example.com", "10.0.0.1", "curl/7.68", false, "Email không tồn tại");

            ArgumentCaptor<LoginHistory> captor = ArgumentCaptor.forClass(LoginHistory.class);
            verify(loginHistoryRepository).save(captor.capture());

            LoginHistory saved = captor.getValue();
            assertThat(saved.getUserId()).isNull();
            assertThat(saved.getEmail()).isEqualTo("unknown@example.com");
            assertThat(saved.isSuccess()).isFalse();
            assertThat(saved.getFailureReason()).isEqualTo("Email không tồn tại");
        }

        @Test
        @DisplayName("Should not throw exception when repository save fails")
        void recordLogin_ExceptionSwallowed() {
            doThrow(new RuntimeException("DB error")).when(loginHistoryRepository).save(any());

            // Should not throw
            auditLogService.recordLogin(1L, "user@example.com", "127.0.0.1", "test", false, "Error");
            verify(loginHistoryRepository).save(any());
        }
    }

    @Nested
    @DisplayName("getLoginHistories Tests")
    class GetLoginHistoriesTests {

        @Test
        @DisplayName("Should return paginated login histories with filters")
        void getLoginHistories_WithFilter() {
            LoginHistory history = LoginHistory.builder()
                    .id(100L)
                    .userId(1L)
                    .email("test@example.com")
                    .ipAddress("127.0.0.1")
                    .userAgent("Chrome")
                    .success(true)
                    .loggedInAt(OffsetDateTime.now(VN_ZONE))
                    .build();

            Page<LoginHistory> page = new PageImpl<>(List.of(history), PageRequest.of(0, 10), 1);
            when(loginHistoryRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

            LoginHistoryFilterRequest filter = new LoginHistoryFilterRequest();
            filter.setEmail("test");
            filter.setIsSuccess(true);
            filter.setFrom(LocalDate.of(2026, 9, 1));
            filter.setTo(LocalDate.of(2026, 9, 22));

            PageResponse<LoginHistoryResponse> response = auditLogService.getLoginHistories(filter, PageRequest.of(0, 10));

            assertThat(response.getContent()).hasSize(1);
            assertThat(response.getContent().get(0).getId()).isEqualTo(100L);
            assertThat(response.getContent().get(0).getEmail()).isEqualTo("test@example.com");
            assertThat(response.getContent().get(0).isSuccess()).isTrue();
            assertThat(response.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should return empty PageResponse when no records match")
        void getLoginHistories_Empty() {
            Page<LoginHistory> page = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
            when(loginHistoryRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

            PageResponse<LoginHistoryResponse> response = auditLogService.getLoginHistories(null, PageRequest.of(0, 10));

            assertThat(response.getContent()).isEmpty();
            assertThat(response.getTotalElements()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("logAction & getAuditLogs Tests")
    class AuditLogActionTests {

        @Test
        @DisplayName("Should save audit log and sanitize sensitive fields")
        void logAction_SanitizesSensitiveData() {
            String before = "{\"username\": \"admin\", \"password\": \"secret123\"}";
            String after = "{\"username\": \"admin\", \"password\": \"newSecret456\"}";

            auditLogService.logAction(1L, "UPDATE_PASSWORD", "AppUser", 2L, before, after);

            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(captor.capture());

            AuditLog saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(1L);
            assertThat(saved.getAction()).isEqualTo("UPDATE_PASSWORD");
            assertThat(saved.getEntityType()).isEqualTo("AppUser");
            assertThat(saved.getEntityId()).isEqualTo(2L);
            assertThat(saved.getBeforeValue()).doesNotContain("secret123");
            assertThat(saved.getBeforeValue()).contains("***");
            assertThat(saved.getAfterValue()).doesNotContain("newSecret456");
            assertThat(saved.getAfterValue()).contains("***");
        }

        @Test
        @DisplayName("Should return paginated audit logs with user info")
        void getAuditLogs_WithUserInfo() {
            AuditLog auditLog = AuditLog.builder()
                    .id(1L)
                    .userId(2L)
                    .action("UPDATE_ROLE")
                    .entityType("AppUser")
                    .entityId(3L)
                    .beforeValue("role: CUSTOMER")
                    .afterValue("role: FACILITY_STAFF")
                    .createdAt(OffsetDateTime.now(VN_ZONE))
                    .build();

            AppUser actor = new AppUser("admin@storage.com", "hash", "Admin User", "0901234567",
                    "001234567890", UserRole.SYSTEM_ADMINISTRATOR, UserStatus.ACTIVE);
            actor.setId(2L);

            Page<AuditLog> page = new PageImpl<>(List.of(auditLog), PageRequest.of(0, 10), 1);
            when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
            when(userRepository.findAllById(anySet())).thenReturn(List.of(actor));

            AuditLogFilterRequest filter = new AuditLogFilterRequest();
            filter.setAction("UPDATE_ROLE");

            PageResponse<AuditLogResponse> response = auditLogService.getAuditLogs(filter, PageRequest.of(0, 10));

            assertThat(response.getContent()).hasSize(1);
            AuditLogResponse item = response.getContent().get(0);
            assertThat(item.getId()).isEqualTo(1L);
            assertThat(item.getUserId()).isEqualTo(2L);
            assertThat(item.getUserEmail()).isEqualTo("admin@storage.com");
            assertThat(item.getUserFullName()).isEqualTo("Admin User");
            assertThat(item.getAction()).isEqualTo("UPDATE_ROLE");
        }
    }

    @Nested
    @DisplayName("getUserActivityLogs Tests")
    class GetUserActivityLogsTests {

        private UserPrincipal createPrincipal(Long id, String email, UserRole role) {
            AppUser user = new AppUser(email, "pwd", "Name", "0900000000", "001000000000", role, UserStatus.ACTIVE);
            user.setId(id);
            return UserPrincipal.create(user, Collections.emptyList());
        }

        @Test
        @DisplayName("Admin can view any user activity logs")
        void getUserActivityLogs_AdminSuccess() {
            UserPrincipal adminPrincipal = createPrincipal(1L, "admin@test.com", UserRole.SYSTEM_ADMINISTRATOR);

            Page<AuditLog> page = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
            when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

            PageResponse<AuditLogResponse> response = auditLogService.getUserActivityLogs(5L, null, PageRequest.of(0, 10), adminPrincipal);
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("User can view their own activity logs")
        void getUserActivityLogs_SelfSuccess() {
            UserPrincipal selfPrincipal = createPrincipal(5L, "self@test.com", UserRole.STORAGE_CUSTOMER);

            Page<AuditLog> page = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
            when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

            PageResponse<AuditLogResponse> response = auditLogService.getUserActivityLogs(5L, null, PageRequest.of(0, 10), selfPrincipal);
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("User cannot view another user's activity logs")
        void getUserActivityLogs_Forbidden() {
            UserPrincipal userPrincipal = createPrincipal(5L, "self@test.com", UserRole.STORAGE_CUSTOMER);

            assertThatThrownBy(() -> auditLogService.getUserActivityLogs(99L, null, PageRequest.of(0, 10), userPrincipal))
                    .isInstanceOf(CustomException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
        }

        @Test
        @DisplayName("Unauthenticated user throws ACCESS_DENIED")
        void getUserActivityLogs_Unauthenticated() {
            assertThatThrownBy(() -> auditLogService.getUserActivityLogs(5L, null, PageRequest.of(0, 10), null))
                    .isInstanceOf(CustomException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
        }
    }

    @Nested
    @DisplayName("exportAuditLogsCsv Tests")
    class ExportAuditLogsCsvTests {

        @Test
        @DisplayName("Should export CSV with UTF-8 BOM, headers, and sanitized content")
        void exportAuditLogsCsv_Success() {
            AuditLog auditLog = AuditLog.builder()
                    .id(1L)
                    .userId(2L)
                    .action("UPDATE_USER_ROLE")
                    .entityType("AppUser")
                    .entityId(3L)
                    .beforeValue("role: CUSTOMER, token: abc123xyz")
                    .afterValue("role: MANAGER, token: def456uvw")
                    .createdAt(OffsetDateTime.of(2026, 9, 22, 10, 30, 0, 0, ZoneId.of("+07:00").getRules().getOffset(java.time.Instant.now())))
                    .build();

            AppUser actor = new AppUser("admin@storage.com", "hash", "Admin User", "0901234567",
                    "001234567890", UserRole.SYSTEM_ADMINISTRATOR, UserStatus.ACTIVE);
            actor.setId(2L);

            Page<AuditLog> page = new PageImpl<>(List.of(auditLog), PageRequest.of(0, 5000), 1);
            when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
            when(userRepository.findAllById(anySet())).thenReturn(List.of(actor));

            byte[] csvBytes = auditLogService.exportAuditLogsCsv(null);

            assertThat(csvBytes).isNotNull();
            // Check UTF-8 BOM
            assertThat(csvBytes[0]).isEqualTo((byte) 0xEF);
            assertThat(csvBytes[1]).isEqualTo((byte) 0xBB);
            assertThat(csvBytes[2]).isEqualTo((byte) 0xBF);

            String csvContent = new String(csvBytes, StandardCharsets.UTF_8);
            assertThat(csvContent).contains("ID,Thời điểm (Asia/Ho_Chi_Minh),Mã người dùng,Email,Họ và tên,Hành động,Đối tượng,Mã đối tượng,Giá trị trước,Giá trị sau");
            assertThat(csvContent).contains("admin@storage.com");
            assertThat(csvContent).contains("Admin User");
            assertThat(csvContent).contains("UPDATE_USER_ROLE");
            assertThat(csvContent).doesNotContain("abc123xyz");
            assertThat(csvContent).doesNotContain("def456uvw");
        }
    }
}

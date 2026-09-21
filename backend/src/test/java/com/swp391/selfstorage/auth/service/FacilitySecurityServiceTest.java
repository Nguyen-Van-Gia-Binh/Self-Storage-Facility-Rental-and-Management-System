package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FacilitySecurityServiceTest {

    private FacilitySecurityService facilitySecurityService;

    @BeforeEach
    void setUp() {
        facilitySecurityService = new FacilitySecurityService();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setSecurityContext(UserRole role, List<Long> facilityIds) {
        AppUser user = new AppUser(
                "user@example.com",
                "pwd",
                "Test User",
                "0900000000",
                "000000000",
                role,
                UserStatus.ACTIVE
        );
        user.setId(100L);
        UserPrincipal principal = UserPrincipal.create(user, facilityIds);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Admin có quyền truy cập mọi cơ sở (SA-03)")
    void canAccessFacility_Admin_ReturnsTrue() {
        setSecurityContext(UserRole.SYSTEM_ADMINISTRATOR, List.of());

        assertThat(facilitySecurityService.canAccessFacility(1L)).isTrue();
        assertThat(facilitySecurityService.canAccessFacility(999L)).isTrue();
    }

    @Test
    @DisplayName("BOM có quyền truy cập mọi cơ sở (SA-03)")
    void canAccessFacility_BusinessOperationsManager_ReturnsTrue() {
        setSecurityContext(UserRole.BUSINESS_OPERATIONS_MANAGER, List.of());

        assertThat(facilitySecurityService.canAccessFacility(1L)).isTrue();
        assertThat(facilitySecurityService.canAccessFacility(50L)).isTrue();
    }

    @Test
    @DisplayName("Staff truy cập cơ sở được phân công -> Cho phép (SA-03)")
    void canAccessFacility_Staff_AssignedFacility_ReturnsTrue() {
        setSecurityContext(UserRole.FACILITY_STAFF, List.of(1L, 2L));

        assertThat(facilitySecurityService.canAccessFacility(1L)).isTrue();
        assertThat(facilitySecurityService.canAccessFacility(2L)).isTrue();
    }

    @Test
    @DisplayName("Staff truy cập cơ sở KHÔNG được phân công -> Từ chối (SA-03)")
    void canAccessFacility_Staff_UnassignedFacility_ReturnsFalse() {
        setSecurityContext(UserRole.FACILITY_STAFF, List.of(1L, 2L));

        assertThat(facilitySecurityService.canAccessFacility(3L)).isFalse();
    }

    @Test
    @DisplayName("Manager truy cập cơ sở được phân công -> Cho phép (SA-03)")
    void canAccessFacility_Manager_AssignedFacility_ReturnsTrue() {
        setSecurityContext(UserRole.FACILITY_MANAGER, List.of(10L));

        assertThat(facilitySecurityService.canAccessFacility(10L)).isTrue();
    }

    @Test
    @DisplayName("Manager truy cập cơ sở KHÔNG được phân công -> Từ chối (SA-03)")
    void canAccessFacility_Manager_UnassignedFacility_ReturnsFalse() {
        setSecurityContext(UserRole.FACILITY_MANAGER, List.of(10L));

        assertThat(facilitySecurityService.canAccessFacility(20L)).isFalse();
    }

    @Test
    @DisplayName("Customer không có quyền quản lý cơ sở")
    void canAccessFacility_Customer_ReturnsFalse() {
        setSecurityContext(UserRole.STORAGE_CUSTOMER, List.of(1L));

        assertThat(facilitySecurityService.canAccessFacility(1L)).isFalse();
    }

    @Test
    @DisplayName("Chưa đăng nhập -> Từ chối truy cập")
    void canAccessFacility_Unauthenticated_ReturnsFalse() {
        SecurityContextHolder.clearContext();

        assertThat(facilitySecurityService.canAccessFacility(1L)).isFalse();
    }

    @Test
    @DisplayName("ID cơ sở null -> Từ chối truy cập")
    void canAccessFacility_NullFacilityId_ReturnsFalse() {
        setSecurityContext(UserRole.SYSTEM_ADMINISTRATOR, List.of());

        assertThat(facilitySecurityService.canAccessFacility(null)).isFalse();
    }

    @Test
    @DisplayName("validateFacilityAccess ném FACILITY_ACCESS_DENIED khi không có quyền")
    void validateFacilityAccess_Denied_ThrowsException() {
        setSecurityContext(UserRole.FACILITY_STAFF, List.of(1L));

        assertThatThrownBy(() -> facilitySecurityService.validateFacilityAccess(99L))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FACILITY_ACCESS_DENIED);
    }

    @Test
    @DisplayName("validateFacilityAccess thành công khi có quyền")
    void validateFacilityAccess_Allowed_Success() {
        setSecurityContext(UserRole.FACILITY_STAFF, List.of(1L));

        assertThatCode(() -> facilitySecurityService.validateFacilityAccess(1L))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("isGlobalManagerOrAdmin trả về true cho Admin/BOM và false cho Staff")
    void isGlobalManagerOrAdmin_Checks() {
        setSecurityContext(UserRole.SYSTEM_ADMINISTRATOR, List.of());
        assertThat(facilitySecurityService.isGlobalManagerOrAdmin()).isTrue();

        setSecurityContext(UserRole.FACILITY_STAFF, List.of(1L));
        assertThat(facilitySecurityService.isGlobalManagerOrAdmin()).isFalse();
    }
}

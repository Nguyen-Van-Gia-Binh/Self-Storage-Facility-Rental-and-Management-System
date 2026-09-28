package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class UserPrincipalTest {

    private AppUser buildUser(Long id, String email, UserRole role) {
        AppUser user = new AppUser(
                email,
                "hashed_pwd",
                "Test User",
                "0900000000",
                "123456789012",
                role,
                UserStatus.ACTIVE
        );
        user.setId(id);
        return user;
    }

    @Test
    @DisplayName("UserPrincipal cho SYSTEM_ADMINISTRATOR chứa cả ROLE_SYSTEM_ADMINISTRATOR và alias ROLE_ADMIN")
    void shouldContainCanonicalAndAliasForSystemAdministrator() {
        AppUser admin = buildUser(1L, "admin@smartstorage.vn", UserRole.SYSTEM_ADMINISTRATOR);
        UserPrincipal principal = UserPrincipal.create(admin, List.of());

        Set<String> authorities = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        assertThat(authorities).contains("ROLE_SYSTEM_ADMINISTRATOR", "ROLE_ADMIN");
    }

    @Test
    @DisplayName("UserPrincipal cho BUSINESS_OPERATIONS_MANAGER chứa cả ROLE_BUSINESS_OPERATIONS_MANAGER và alias")
    void shouldContainCanonicalAndAliasForBOM() {
        AppUser bom = buildUser(2L, "bom@smartstorage.vn", UserRole.BUSINESS_OPERATIONS_MANAGER);
        UserPrincipal principal = UserPrincipal.create(bom, List.of());

        Set<String> authorities = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        assertThat(authorities).contains(
                "ROLE_BUSINESS_OPERATIONS_MANAGER",
                "ROLE_BOM",
                "ROLE_BUSINESS_MANAGER"
        );
    }

    @Test
    @DisplayName("UserPrincipal cho FACILITY_MANAGER chứa cả ROLE_FACILITY_MANAGER và alias ROLE_MANAGER")
    void shouldContainCanonicalAndAliasForManager() {
        AppUser manager = buildUser(3L, "fm.q1@smartstorage.vn", UserRole.FACILITY_MANAGER);
        UserPrincipal principal = UserPrincipal.create(manager, List.of(1L));

        Set<String> authorities = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        assertThat(authorities).contains("ROLE_FACILITY_MANAGER", "ROLE_MANAGER");
        assertThat(principal.getFacilityIds()).containsExactly(1L);
    }

    @Test
    @DisplayName("UserPrincipal cho FACILITY_STAFF chứa cả ROLE_FACILITY_STAFF và alias ROLE_STAFF")
    void shouldContainCanonicalAndAliasForStaff() {
        AppUser staff = buildUser(4L, "staff.q1@smartstorage.vn", UserRole.FACILITY_STAFF);
        UserPrincipal principal = UserPrincipal.create(staff, List.of(1L));

        Set<String> authorities = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        assertThat(authorities).contains("ROLE_FACILITY_STAFF", "ROLE_STAFF");
    }

    @Test
    @DisplayName("UserPrincipal cho STORAGE_CUSTOMER chứa cả ROLE_STORAGE_CUSTOMER và alias ROLE_CUSTOMER")
    void shouldContainCanonicalAndAliasForCustomer() {
        AppUser customer = buildUser(5L, "nhi.customer@gmail.com", UserRole.STORAGE_CUSTOMER);
        UserPrincipal principal = UserPrincipal.create(customer, List.of());

        Set<String> authorities = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        assertThat(authorities).contains("ROLE_STORAGE_CUSTOMER", "ROLE_CUSTOMER");
    }
}

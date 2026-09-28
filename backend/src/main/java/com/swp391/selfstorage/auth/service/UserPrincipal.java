package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final String fullName;
    private final UserRole role;
    private final UserStatus status;
    private final List<Long> facilityIds;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(Long id, String email, String password, String fullName, UserRole role,
                         UserStatus status, List<Long> facilityIds,
                         Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.status = status;
        this.facilityIds = facilityIds != null ? facilityIds : Collections.emptyList();
        this.authorities = authorities;
    }

    public static UserPrincipal create(AppUser user, List<Long> facilityIds) {
        List<GrantedAuthority> authorities = new java.util.ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        if (user.getRole() != null) {
            switch (user.getRole()) {
                case SYSTEM_ADMINISTRATOR -> authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                case BUSINESS_OPERATIONS_MANAGER -> {
                    authorities.add(new SimpleGrantedAuthority("ROLE_BOM"));
                    authorities.add(new SimpleGrantedAuthority("ROLE_BUSINESS_MANAGER"));
                }
                case FACILITY_MANAGER -> authorities.add(new SimpleGrantedAuthority("ROLE_MANAGER"));
                case FACILITY_STAFF -> authorities.add(new SimpleGrantedAuthority("ROLE_STAFF"));
                case STORAGE_CUSTOMER -> authorities.add(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
            }
        }

        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getFullName(),
                user.getRole(),
                user.getStatus(),
                facilityIds,
                Collections.unmodifiableList(authorities)
        );
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public UserRole getRole() {
        return role;
    }

    public List<Long> getFacilityIds() {
        return facilityIds;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}

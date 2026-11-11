package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.common.config.CacheConfig;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.user.dto.UpdateUserStatusRequest;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.mapper.UserMapper;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import com.swp391.selfstorage.user.service.UserService;
import com.swp391.selfstorage.user.service.UserServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringJUnitConfig(CustomUserDetailsServiceCacheTest.TestConfig.class)
class CustomUserDetailsServiceCacheTest {

    @Configuration
    @Import(CacheConfig.class)
    static class TestConfig {
        @Bean
        UserRepository userRepository() {
            return mock(UserRepository.class);
        }

        @Bean
        UserFacilityAssignmentRepository userFacilityAssignmentRepository() {
            return mock(UserFacilityAssignmentRepository.class);
        }

        @Bean
        FacilityRepository facilityRepository() {
            return mock(FacilityRepository.class);
        }

        @Bean
        UserMapper userMapper() {
            return new UserMapper();
        }

        @Bean
        PasswordEncoder passwordEncoder() {
            return mock(PasswordEncoder.class);
        }

        @Bean
        CustomUserDetailsService customUserDetailsService(
                UserRepository userRepository,
                UserFacilityAssignmentRepository userFacilityAssignmentRepository) {
            return new CustomUserDetailsService(userRepository, userFacilityAssignmentRepository);
        }

        @Bean
        UserService userService(
                UserRepository userRepository,
                UserFacilityAssignmentRepository assignmentRepository,
                FacilityRepository facilityRepository,
                PasswordEncoder passwordEncoder,
                UserMapper userMapper) {
            return new UserServiceImpl(userRepository, assignmentRepository, facilityRepository, passwordEncoder, userMapper);
        }
    }

    @Autowired
    private UserDetailsService customUserDetailsService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserFacilityAssignmentRepository assignmentRepository;

    @Test
    @DisplayName("Cache userDetails: gọi lặp lại cùng email không query DB; updateUserStatus tự động evict cache")
    void shouldCacheUserDetailsAndEvictOnStatusUpdate() {
        reset(userRepository, assignmentRepository);

        AppUser activeUser = new AppUser();
        activeUser.setId(10L);
        activeUser.setEmail("staff@selfstorage.vn");
        activeUser.setPasswordHash("hash");
        activeUser.setFullName("Nhân viên A");
        activeUser.setRole(UserRole.FACILITY_STAFF);
        activeUser.setStatus(UserStatus.ACTIVE);

        when(userRepository.findByEmail("staff@selfstorage.vn")).thenReturn(Optional.of(activeUser));
        when(assignmentRepository.findFacilityIdsByUserId(10L)).thenReturn(List.of(1L, 2L));
        when(userRepository.findById(10L)).thenReturn(Optional.of(activeUser));
        when(userRepository.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDetails first = customUserDetailsService.loadUserByUsername("staff@selfstorage.vn");
        UserDetails second = customUserDetailsService.loadUserByUsername("staff@selfstorage.vn");
        UserDetails third = customUserDetailsService.loadUserByUsername("staff@selfstorage.vn");

        assertTrue(first.isEnabled());
        assertSame(first, second);
        assertSame(first, third);
        verify(userRepository, times(1)).findByEmail("staff@selfstorage.vn");
        verify(assignmentRepository, times(1)).findFacilityIdsByUserId(10L);

        UpdateUserStatusRequest lockReq = new UpdateUserStatusRequest();
        lockReq.setStatus(UserStatus.INACTIVE);
        userService.updateUserStatus(10L, lockReq);

        UserDetails afterEvict = customUserDetailsService.loadUserByUsername("staff@selfstorage.vn");
        assertFalse(afterEvict.isEnabled());
        verify(userRepository, times(2)).findByEmail("staff@selfstorage.vn");
        verify(assignmentRepository, times(3)).findFacilityIdsByUserId(10L);
    }
}

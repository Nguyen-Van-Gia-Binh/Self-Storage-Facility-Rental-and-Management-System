package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserFacilityAssignmentRepository userFacilityAssignmentRepository;

    public CustomUserDetailsService(UserRepository userRepository,
                                    UserFacilityAssignmentRepository userFacilityAssignmentRepository) {
        this.userRepository = userRepository;
        this.userFacilityAssignmentRepository = userFacilityAssignmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        List<Long> facilityIds = userFacilityAssignmentRepository.findFacilityIdsByUserId(user.getId());

        return UserPrincipal.create(user, facilityIds);
    }
}

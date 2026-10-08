package com.swp391.selfstorage.auth.repository;

import com.swp391.selfstorage.auth.entity.RegistrationOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegistrationOtpRepository extends JpaRepository<RegistrationOtp, Long> {

    Optional<RegistrationOtp> findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc(String email, String otpCode);

    Optional<RegistrationOtp> findTopByEmailOrderByCreatedAtDesc(String email);
}

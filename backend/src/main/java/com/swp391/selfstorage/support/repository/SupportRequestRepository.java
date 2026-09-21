package com.swp391.selfstorage.support.repository;

import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportRequest;
import com.swp391.selfstorage.support.entity.SupportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupportRequestRepository extends JpaRepository<SupportRequest, Long> {

    Page<SupportRequest> findByCustomerId(Long customerId, Pageable pageable);

    Page<SupportRequest> findByCustomerIdAndStatus(Long customerId, SupportStatus status, Pageable pageable);

    Page<SupportRequest> findByCustomerIdAndCategory(Long customerId, SupportCategory category, Pageable pageable);

    Page<SupportRequest> findByCustomerIdAndStatusAndCategory(
            Long customerId, SupportStatus status, SupportCategory category, Pageable pageable
    );

    Optional<SupportRequest> findByIdAndCustomerId(Long id, Long customerId);

    Optional<SupportRequest> findByCode(String code);

    long countByCodeStartingWith(String prefix);
}

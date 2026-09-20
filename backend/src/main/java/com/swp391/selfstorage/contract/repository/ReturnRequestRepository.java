package com.swp391.selfstorage.contract.repository;

import com.swp391.selfstorage.contract.entity.ReturnRequest;
import com.swp391.selfstorage.contract.entity.ReturnRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    Optional<ReturnRequest> findByContractIdAndStatus(Long contractId, ReturnRequestStatus status);
    List<ReturnRequest> findByContractIdOrderByCreatedAtDesc(Long contractId);
    Optional<ReturnRequest> findTopByContractIdOrderByCreatedAtDesc(Long contractId);
}

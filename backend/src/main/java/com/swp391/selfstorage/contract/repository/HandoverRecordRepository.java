package com.swp391.selfstorage.contract.repository;

import com.swp391.selfstorage.contract.entity.HandoverRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HandoverRecordRepository extends JpaRepository<HandoverRecord, Long> {
    Optional<HandoverRecord> findTopByContractIdAndRejectedFalseOrderByHandoverAtDesc(Long contractId);
}


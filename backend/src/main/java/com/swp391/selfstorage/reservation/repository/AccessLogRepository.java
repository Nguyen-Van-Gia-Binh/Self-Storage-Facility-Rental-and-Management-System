package com.swp391.selfstorage.reservation.repository;

import com.swp391.selfstorage.reservation.entity.AccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {
    List<AccessLog> findByContractIdOrderByAccessedAtDesc(Long contractId);
}

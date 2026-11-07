package com.swp391.selfstorage.contract.repository;

import com.swp391.selfstorage.contract.entity.HandoverRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HandoverRecordRepository extends JpaRepository<HandoverRecord, Long> {
    Optional<HandoverRecord> findTopByContractIdAndRejectedFalseOrderByHandoverAtDesc(Long contractId);

    /**
     * Tìm bản ghi bàn giao theo contractId.
     * Dùng để upsert (cập nhật nếu đã tồn tại, tạo mới nếu chưa có)
     * nhằm tránh vi phạm unique constraint uq_handover_record_contract_id.
     */
    Optional<HandoverRecord> findByContractId(Long contractId);
}


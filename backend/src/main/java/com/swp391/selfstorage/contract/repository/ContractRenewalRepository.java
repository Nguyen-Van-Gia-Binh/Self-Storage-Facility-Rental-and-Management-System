package com.swp391.selfstorage.contract.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.swp391.selfstorage.contract.entity.ContractRenewal;

@Repository
public interface ContractRenewalRepository extends JpaRepository<ContractRenewal, Long> {

    /**
     * Lấy toàn bộ lịch sử các lần gia hạn của một hợp đồng (sắp xếp mới nhất lên
     * đầu).
     */
    List<ContractRenewal> findByContractIdOrderByCreatedAtDesc(Long contractId);

    /**
     * Lấy lần gia hạn gần nhất của hợp đồng.
     */
    Optional<ContractRenewal> findTopByContractIdOrderByCreatedAtDesc(Long contractId);

    /**
     * Một giao dịch thanh toán chỉ được ghi nhận một lần gia hạn.
     */
    Optional<ContractRenewal> findByPaymentTransactionId(Long paymentTransactionId);
}

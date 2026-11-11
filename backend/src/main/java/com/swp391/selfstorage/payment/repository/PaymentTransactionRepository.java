package com.swp391.selfstorage.payment.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.swp391.selfstorage.payment.entity.PaymentTransaction;

import jakarta.persistence.LockModeType;

@Repository
public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, Long>, JpaSpecificationExecutor<PaymentTransaction> {

    List<PaymentTransaction> findByReservationId(Long reservationId);

    List<PaymentTransaction> findByReservationIdIn(Collection<Long> reservationIds);

    List<PaymentTransaction> findByContractId(Long contractId);

    List<PaymentTransaction> findByContractIdIn(Collection<Long> contractIds);

    Optional<PaymentTransaction> findByOrderCode(Long orderCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentTransaction p where p.orderCode = :orderCode")
    Optional<PaymentTransaction> findByOrderCodeForUpdate(@Param("orderCode") Long orderCode);

    List<PaymentTransaction> findByStatusOrderByCreatedAtAsc(String status);

    List<PaymentTransaction> findByStatusOrderByCreatedAtAsc(String status, Pageable pageable);

    Optional<PaymentTransaction> findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(Long contractId, String transactionType);

    @Query("select coalesce(sum(p.amount), 0) from PaymentTransaction p where p.contractId = :contractId and p.transactionType = :transactionType and p.status = 'SUCCESS'")
    long sumSuccessfulAmountByContractIdAndTransactionType(@Param("contractId") Long contractId,
            @Param("transactionType") String transactionType);
}

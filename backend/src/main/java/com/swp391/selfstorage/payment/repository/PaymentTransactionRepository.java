package com.swp391.selfstorage.payment.repository;

import java.util.List;
import java.util.Optional;

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

    List<PaymentTransaction> findByContractId(Long contractId);

    Optional<PaymentTransaction> findByOrderCode(Long orderCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentTransaction p where p.orderCode = :orderCode")
    Optional<PaymentTransaction> findByOrderCodeForUpdate(@Param("orderCode") Long orderCode);

    Optional<PaymentTransaction> findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(Long contractId, String transactionType);
}

package com.swp391.selfstorage.payment.event;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.swp391.selfstorage.contract.event.ContractSettledEvent;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Listener lắng nghe các sự kiện nghiệp vụ liên quan đến hợp đồng và thanh lý quyết toán (FS-04, FM-04).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {

    private final PaymentTransactionRepository paymentTransactionRepository;

    /**
     * Lắng nghe khi hợp đồng được phê duyệt quyết toán trả kho (FM-04).
     * - Nếu depositRefundAmount > 0: Tạo giao dịch hoàn cọc (REFUND) ở trạng thái PENDING_REFUND
     * - Nếu payableAmount > 0: Tạo giao dịch thu nợ phát sinh (SETTLEMENT) ở trạng thái PENDING
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleContractSettled(ContractSettledEvent event) {
        log.info("Xử lý ContractSettledEvent cho contractId={}, rentRefund={}, depositRefund={}, payableAmount={}",
                event.getContractId(), event.getRentRefundAmount(), event.getDepositRefundAmount(), event.getPayableAmount());

        List<PaymentTransaction> existing = List.of();
        if (paymentTransactionRepository != null) {
            List<PaymentTransaction> found = paymentTransactionRepository.findByContractId(event.getContractId());
            if (found != null) {
                existing = found;
            }
        }
        long orderCode = System.currentTimeMillis();
        if (saveRefundPart(existing, event, event.getRentRefundAmount(), "RENT_REFUND",
                "Hoàn tiền thuê quyết toán hợp đồng #", orderCode)) {
            orderCode++;
        }
        saveRefundPart(existing, event, event.getDepositRefundAmount(), "DEPOSIT_REFUND",
                "Hoàn cọc quyết toán hợp đồng #", orderCode);

        // 2. Nợ thêm do hư hại/quá hạn vượt tiền cọc -> Tạo/cập nhật giao dịch thu nợ SETTLEMENT
        if (event.getPayableAmount() > 0) {
            Optional<PaymentTransaction> existingPayable = existing.stream()
                    .filter(t -> "SETTLEMENT".equalsIgnoreCase(t.getTransactionType()))
                    .findFirst();

            Instant paidAt = event.getSettledAt() != null ? event.getSettledAt().toInstant() : Instant.now();
            boolean isConfirmed = event.isConfirmPaid();

            if (existingPayable.isPresent()) {
                PaymentTransaction payableTxn = existingPayable.get();
                if (isConfirmed && !"SUCCESS".equalsIgnoreCase(payableTxn.getStatus())) {
                    payableTxn.setStatus("SUCCESS");
                    payableTxn.setPaymentMethod("CASH");
                    payableTxn.setPaidAt(paidAt);
                    payableTxn.setAmount(event.getPayableAmount());
                    paymentTransactionRepository.save(payableTxn);
                    log.info("Đã cập nhật SETTLEMENT sang SUCCESS (CASH) cho contractId={}", event.getContractId());
                }
            } else {
                PaymentTransaction payableTxn = PaymentTransaction.builder()
                        .contractId(event.getContractId())
                        .amount(event.getPayableAmount())
                        .transactionType("SETTLEMENT")
                        .paymentMethod(isConfirmed ? "CASH" : "VNPAY")
                        .status(isConfirmed ? "SUCCESS" : "PENDING")
                        .paidAt(isConfirmed ? paidAt : null)
                        .providerReference("Thu nợ thanh lý hợp đồng #" + event.getContractId())
                        .orderCode(System.currentTimeMillis())
                        .build();

                paymentTransactionRepository.save(payableTxn);
                log.info("Đã tạo bản ghi SETTLEMENT {} ({}) cho contractId={}",
                        isConfirmed ? "SUCCESS" : "PENDING", isConfirmed ? "CASH" : "VNPAY", event.getContractId());
            }
        }
    }

    /** Ghi hoặc cập nhật phần hoàn sang SUCCESS khi hợp đồng đã quyết toán. */
    private boolean saveRefundPart(List<PaymentTransaction> existing, ContractSettledEvent event,
            long amount, String type, String referencePrefix, long orderCode) {
        if (amount <= 0 || paymentTransactionRepository == null) {
            return false;
        }
        Optional<PaymentTransaction> existingTxn = existing.stream()
                .filter(t -> type.equalsIgnoreCase(t.getTransactionType()))
                .findFirst();

        Instant paidAt = event.getSettledAt() != null ? event.getSettledAt().toInstant() : Instant.now();
        if (existingTxn.isPresent()) {
            PaymentTransaction txn = existingTxn.get();
            if (!"SUCCESS".equalsIgnoreCase(txn.getStatus())) {
                txn.setStatus("SUCCESS");
                txn.setPaidAt(paidAt);
                txn.setAmount(amount);
                paymentTransactionRepository.save(txn);
                log.info("Hợp đồng contractId={} đã cập nhật {} sang SUCCESS", event.getContractId(), type);
            }
            return false;
        }

        paymentTransactionRepository.save(PaymentTransaction.builder()
                .contractId(event.getContractId())
                .amount(amount)
                .transactionType(type)
                .paymentMethod("BANK_TRANSFER")
                .status("SUCCESS")
                .paidAt(paidAt)
                .providerReference(referencePrefix + event.getContractId())
                .orderCode(orderCode)
                .build());
        log.info("Đã tạo bản ghi {} SUCCESS cho contractId={}", type, event.getContractId());
        return true;
    }
}

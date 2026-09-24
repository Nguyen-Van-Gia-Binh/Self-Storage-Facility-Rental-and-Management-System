package com.swp391.selfstorage.payment.event;

import org.springframework.stereotype.Component;
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
    public void handleContractSettled(ContractSettledEvent event) {
        log.info("Xử lý ContractSettledEvent cho contractId={}, refundAmount={}, payableAmount={}",
                event.getContractId(), event.getDepositRefundAmount(), event.getPayableAmount());

        // 1. Dư cọc sau khi đối trừ -> Tạo giao dịch hoàn tiền
        if (event.getDepositRefundAmount() > 0) {
            PaymentTransaction refundTxn = PaymentTransaction.builder()
                    .contractId(event.getContractId())
                    .amount(event.getDepositRefundAmount())
                    .transactionType("REFUND")
                    .paymentMethod("BANK_TRANSFER")
                    .status("PENDING_REFUND")
                    .providerReference("Hoàn cọc quyết toán hợp đồng #" + event.getContractId())
                    .orderCode(System.currentTimeMillis())
                    .build();

            paymentTransactionRepository.save(refundTxn);
            log.info("Đã tạo bản ghi REFUND PENDING_REFUND cho contractId={}", event.getContractId());
        }

        // 2. Nợ thêm do hư hại/quá hạn vượt tiền cọc -> Tạo giao dịch thu nợ
        if (event.getPayableAmount() > 0) {
            PaymentTransaction payableTxn = PaymentTransaction.builder()
                    .contractId(event.getContractId())
                    .amount(event.getPayableAmount())
                    .transactionType("SETTLEMENT")
                    .paymentMethod("VIETQR_PAYOS")
                    .status("PENDING")
                    .providerReference("Thu nợ thanh lý hợp đồng #" + event.getContractId())
                    .orderCode(System.currentTimeMillis())
                    .build();

            paymentTransactionRepository.save(payableTxn);
            log.info("Đã tạo bản ghi SETTLEMENT PENDING cho contractId={}", event.getContractId());
        }
    }
}

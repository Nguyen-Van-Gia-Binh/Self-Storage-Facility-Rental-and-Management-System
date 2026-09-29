package com.swp391.selfstorage.contract.event;

import com.swp391.selfstorage.contract.service.ContractService;
import com.swp391.selfstorage.payment.event.PaymentCompletedEvent;
import com.swp391.selfstorage.payment.event.SettlementDebtPaidEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContractEventListener {

    private final ContractService contractService;
    private final com.swp391.selfstorage.contract.service.RenewalService renewalService;

    /**
     * Tao Contract PENDING_CHECK_IN sau khi Payment da commit — T3.4.
     * AFTER_COMMIT: chi chay sau Payment commit thanh cong.
     * REQUIRES_NEW: loi Contract khong rollback Payment.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        log.info("Creating contract for reservationId={}", event.reservationId());
        try {
            contractService.createFromReservation(event.reservationId());
        } catch (Exception e) {
            log.error("Contract creation failed for reservationId={}: {}",
                    event.reservationId(), e.getMessage(), e);
            // Khong re-throw: Payment da commit, FM xu ly thu cong neu can
        }
    }

    /**
     * Tự động gia hạn hợp đồng sau khi thanh toán gia hạn qua PayOS VietQR thành công — SC-04.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onContractRenewalPaymentCompleted(com.swp391.selfstorage.payment.event.ContractRenewalPaymentCompletedEvent event) {
        log.info("Processing renewal for contractId={}, months={}", event.contractId(), event.renewalMonths());
        try {
            if (event.renewalMonths() == null || event.renewalMonths() <= 0) {
                log.error("Bỏ qua gia hạn contractId={}: thiếu số tháng đã chốt, không mặc định 1 tháng",
                        event.contractId());
                return;
            }
            renewalService.processRenewal(event.contractId(),
                    new com.swp391.selfstorage.contract.dto.RenewalRequest(event.renewalMonths()), event.paymentId());
            log.info("Contract renewal successfully processed for contractId={}", event.contractId());
        } catch (Exception e) {
            log.error("Contract renewal failed for contractId={}: {}", event.contractId(), e.getMessage(), e);
        }
    }

    /**
     * Đóng hợp đồng sau khi khách nộp đủ phần thiếu của quyết toán (BR-RET-04).
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSettlementDebtPaid(SettlementDebtPaidEvent event) {
        if (event.contractId() == null) {
            return;
        }
        try {
            contractService.closeContractAfterSettlementPayment(event.contractId());
        } catch (Exception e) {
            log.error("Không đóng được hợp đồng sau thanh toán quyết toán contractId={}: {}",
                    event.contractId(), e.getMessage(), e);
        }
    }
}
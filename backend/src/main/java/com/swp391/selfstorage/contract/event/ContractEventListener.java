package com.swp391.selfstorage.contract.event;

import com.swp391.selfstorage.contract.service.ContractService;
import com.swp391.selfstorage.payment.event.PaymentCompletedEvent;
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
}
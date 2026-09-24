package com.swp391.selfstorage.payment.event;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;

import java.time.OffsetDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.swp391.selfstorage.contract.event.ContractSettledEvent;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;

@ExtendWith(MockitoExtension.class)
class PaymentEventListenerTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @InjectMocks
    private PaymentEventListener paymentEventListener;

    @Test
    @DisplayName("FM-04: handleContractSettled khi có depositRefundAmount > 0 -> Lưu giao dịch REFUND PENDING_REFUND")
    void handleContractSettled_WhenRefund_ShouldSaveRefundTransaction() {
        ContractSettledEvent event = ContractSettledEvent.builder()
                .contractId(300L)
                .customerId(15L)
                .facilityId(1L)
                .depositRefundAmount(1_200_000L)
                .payableAmount(0L)
                .settledAt(OffsetDateTime.now())
                .build();

        paymentEventListener.handleContractSettled(event);

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(captor.capture());
        PaymentTransaction saved = captor.getValue();

        assertEquals(300L, saved.getContractId());
        assertEquals("REFUND", saved.getTransactionType());
        assertEquals("PENDING_REFUND", saved.getStatus());
        assertEquals(1_200_000L, saved.getAmount());
        assertEquals("BANK_TRANSFER", saved.getPaymentMethod());
    }

    @Test
    @DisplayName("FM-04: handleContractSettled khi có payableAmount > 0 -> Lưu giao dịch SETTLEMENT PENDING")
    void handleContractSettled_WhenPayable_ShouldSaveSettlementTransaction() {
        ContractSettledEvent event = ContractSettledEvent.builder()
                .contractId(301L)
                .customerId(15L)
                .facilityId(1L)
                .depositRefundAmount(0L)
                .payableAmount(500_000L)
                .settledAt(OffsetDateTime.now())
                .build();

        paymentEventListener.handleContractSettled(event);

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(captor.capture());
        PaymentTransaction saved = captor.getValue();

        assertEquals(301L, saved.getContractId());
        assertEquals("SETTLEMENT", saved.getTransactionType());
        assertEquals("PENDING", saved.getStatus());
        assertEquals(500_000L, saved.getAmount());
        assertEquals("VIETQR_PAYOS", saved.getPaymentMethod());
    }
}

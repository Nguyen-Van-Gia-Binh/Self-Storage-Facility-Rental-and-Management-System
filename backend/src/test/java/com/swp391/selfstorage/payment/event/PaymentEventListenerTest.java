package com.swp391.selfstorage.payment.event;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
    @DisplayName("FM-04: handleContractSettled khi có depositRefundAmount > 0 -> Lưu giao dịch DEPOSIT_REFUND SUCCESS")
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
        assertEquals("DEPOSIT_REFUND", saved.getTransactionType());
        assertEquals("SUCCESS", saved.getStatus());
        assertNotNull(saved.getPaidAt());
        assertEquals(1_200_000L, saved.getAmount());
        assertEquals("BANK_TRANSFER", saved.getPaymentMethod());
    }

    @Test
    @DisplayName("FM-04: handleContractSettled khi hợp đồng đã có sẵn giao dịch hoàn tiền -> Không tạo trùng lặp")
    void handleContractSettled_WhenRefundAlreadyExists_ShouldNotDuplicate() {
        PaymentTransaction existingRefund = PaymentTransaction.builder()
                .contractId(302L)
                .transactionType("RENT_REFUND")
                .amount(7_200_000L)
                .status("SUCCESS")
                .build();

        org.mockito.Mockito.when(paymentTransactionRepository.findByContractId(302L))
                .thenReturn(java.util.List.of(existingRefund));

        ContractSettledEvent event = ContractSettledEvent.builder()
                .contractId(302L)
                .customerId(15L)
                .facilityId(1L)
                .depositRefundAmount(8_400_000L)
                .payableAmount(0L)
                .settledAt(OffsetDateTime.now())
                .build();

        paymentEventListener.handleContractSettled(event);

        org.mockito.Mockito.verify(paymentTransactionRepository, org.mockito.Mockito.never())
                .save(org.mockito.ArgumentMatchers.any(PaymentTransaction.class));
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
        assertEquals("VNPAY", saved.getPaymentMethod());
    }
}

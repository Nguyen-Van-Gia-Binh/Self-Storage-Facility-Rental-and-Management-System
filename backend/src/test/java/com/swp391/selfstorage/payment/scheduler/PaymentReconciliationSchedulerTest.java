package com.swp391.selfstorage.payment.scheduler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.gateway.VnPayGateway;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.payment.service.PaymentService;

@ExtendWith(MockitoExtension.class)
class PaymentReconciliationSchedulerTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private VnPayGateway vnPayGateway;

    private PaymentReconciliationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new PaymentReconciliationScheduler(
                paymentTransactionRepository,
                paymentService,
                vnPayGateway
        );
        ReflectionTestUtils.setField(scheduler, "enabled", true);
    }

    @Test
    @DisplayName("Khi job bị tắt qua cấu hình (enabled=false) -> không quét và trả về 0")
    void whenDisabled_thenSkipsProcessing() {
        ReflectionTestUtils.setField(scheduler, "enabled", false);

        int processed = scheduler.reconcilePendingPayments();

        assertEquals(0, processed);
        verify(paymentTransactionRepository, never()).findByStatusOrderByCreatedAtAsc(any(), any());
    }

    @Test
    @DisplayName("Khi VNPay chưa được cấu hình -> trả về 0")
    void whenNotConfigured_thenSkipsProcessing() {
        when(vnPayGateway.configured()).thenReturn(false);

        int processed = scheduler.reconcilePendingPayments();

        assertEquals(0, processed);
        verify(paymentTransactionRepository, never()).findByStatusOrderByCreatedAtAsc(any(), any());
    }

    @Test
    @DisplayName("Phân trang tối đa 50 đơn và ủy quyền cho PaymentService xử lý độc lập")
    void whenPendingOrdersFound_thenDelegatesToPaymentService() {
        when(vnPayGateway.configured()).thenReturn(true);

        PaymentTransaction txn1 = PaymentTransaction.builder().id(1L).orderCode(1001L).status("PENDING").build();
        PaymentTransaction txn2 = PaymentTransaction.builder().id(2L).orderCode(1002L).status("PENDING").build();

        Pageable expectedPageable = PageRequest.of(0, 50);
        when(paymentTransactionRepository.findByStatusOrderByCreatedAtAsc(eq("PENDING"), eq(expectedPageable)))
                .thenReturn(List.of(txn1, txn2));

        when(paymentService.reconcileSingleOrder(1001L)).thenReturn(true);
        when(paymentService.reconcileSingleOrder(1002L)).thenReturn(false);

        int processed = scheduler.reconcilePendingPayments();

        assertEquals(1, processed);
        verify(paymentService).reconcileSingleOrder(1001L);
        verify(paymentService).reconcileSingleOrder(1002L);
    }
}

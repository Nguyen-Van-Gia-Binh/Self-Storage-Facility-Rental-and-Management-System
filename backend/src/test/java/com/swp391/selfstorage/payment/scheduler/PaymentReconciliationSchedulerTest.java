package com.swp391.selfstorage.payment.scheduler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.gateway.VnPayGateway;
import com.swp391.selfstorage.payment.gateway.dto.VnPayQueryResult;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.payment.service.PaymentService;
import com.swp391.selfstorage.reservation.service.ReservationHoldExpiryService;

@ExtendWith(MockitoExtension.class)
class PaymentReconciliationSchedulerTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private VnPayGateway vnPayGateway;

    @Mock
    private ReservationHoldExpiryService reservationHoldExpiryService;

    private PaymentReconciliationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new PaymentReconciliationScheduler(
                paymentTransactionRepository,
                paymentService,
                vnPayGateway,
                reservationHoldExpiryService
        );
    }

    @Test
    @DisplayName("Lớp 3: Đơn PENDING < 24h đối soát thành công qua QueryDR -> kích hoạt đơn")
    void whenPaymentIsSuccess_thenCompletesPayment() {
        when(vnPayGateway.configured()).thenReturn(true);

        Instant tenMinsAgo = Instant.now().minus(10, ChronoUnit.MINUTES);
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(1L)
                .orderCode(1001L)
                .status("PENDING")
                .amount(2_000_000L)
                .reservationId(10L)
                .build();
        txn.setCreatedAt(tenMinsAgo);

        when(paymentTransactionRepository.findByStatusOrderByCreatedAtAsc("PENDING"))
                .thenReturn(List.of(txn));
        when(paymentTransactionRepository.findByOrderCodeForUpdate(1001L))
                .thenReturn(Optional.of(txn));

        VnPayQueryResult querySuccess = VnPayQueryResult.builder()
                .responseCode("00")
                .transactionStatus("00")
                .amount(200_000_000L)
                .transactionNo("VNP123456")
                .bankCode("NCB")
                .build();
        when(vnPayGateway.queryDr(eq(1001L), any(Instant.class)))
                .thenReturn(querySuccess);
        when(paymentService.completeVnpayPayment(eq(1001L), eq(true), eq(200_000_000L), eq("VNP123456"), eq("NCB")))
                .thenReturn(true);

        int processed = scheduler.reconcilePendingPayments();

        assertEquals(1, processed);
        verify(paymentService).completeVnpayPayment(1001L, true, 200_000_000L, "VNP123456", "NCB");
        verify(paymentTransactionRepository, never()).save(txn);
    }

    @Test
    @DisplayName("Bẫy 24h VietQR: Đơn > 24h nhưng VNPay báo SUCCESS -> Kích hoạt bình thường, không hủy oan")
    void whenOlderThan24hButVnPaySuccess_thenActivatesOrderWithoutExpiring() {
        when(vnPayGateway.configured()).thenReturn(true);

        Instant dayAndHalfAgo = Instant.now().minus(26, ChronoUnit.HOURS);
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(2L)
                .orderCode(1002L)
                .status("PENDING")
                .amount(1_500_000L)
                .reservationId(20L)
                .build();
        txn.setCreatedAt(dayAndHalfAgo);

        when(paymentTransactionRepository.findByStatusOrderByCreatedAtAsc("PENDING"))
                .thenReturn(List.of(txn));
        when(paymentTransactionRepository.findByOrderCodeForUpdate(1002L))
                .thenReturn(Optional.of(txn));

        VnPayQueryResult querySuccess = VnPayQueryResult.builder()
                .responseCode("00")
                .transactionStatus("00")
                .amount(150_000_000L)
                .transactionNo("VNP999")
                .bankCode("VIETCOMBANK")
                .build();
        when(vnPayGateway.queryDr(eq(1002L), any(Instant.class)))
                .thenReturn(querySuccess);
        when(paymentService.completeVnpayPayment(eq(1002L), eq(true), eq(150_000_000L), eq("VNP999"), eq("VIETCOMBANK")))
                .thenReturn(true);

        int processed = scheduler.reconcilePendingPayments();

        assertEquals(1, processed);
        verify(paymentService).completeVnpayPayment(1002L, true, 150_000_000L, "VNP999", "VIETCOMBANK");
        assertEquals("PENDING", txn.getStatus(), "Không được tự ý đổi sang EXPIRED khi VNPay xác nhận SUCCESS");
    }

    @Test
    @DisplayName("QueryDR-first Expiration: Đơn > 24h và VNPay xác nhận NOT_FOUND -> Chuyển EXPIRED & giải phóng giữ chỗ")
    void whenOlderThan24hAndVnPayNotFound_thenExpiresPaymentAndHold() {
        when(vnPayGateway.configured()).thenReturn(true);

        Instant twoDaysAgo = Instant.now().minus(48, ChronoUnit.HOURS);
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(3L)
                .orderCode(1003L)
                .status("PENDING")
                .amount(1_000_000L)
                .reservationId(30L)
                .build();
        txn.setCreatedAt(twoDaysAgo);

        when(paymentTransactionRepository.findByStatusOrderByCreatedAtAsc("PENDING"))
                .thenReturn(List.of(txn));
        when(paymentTransactionRepository.findByOrderCodeForUpdate(1003L))
                .thenReturn(Optional.of(txn));

        VnPayQueryResult queryNotFound = VnPayQueryResult.builder()
                .responseCode("91")
                .transactionStatus("91")
                .message("Khong tim thay giao dich")
                .build();
        when(vnPayGateway.queryDr(eq(1003L), any(Instant.class)))
                .thenReturn(queryNotFound);

        int processed = scheduler.reconcilePendingPayments();

        assertEquals(1, processed);
        assertEquals("EXPIRED", txn.getStatus());
        verify(paymentTransactionRepository).save(txn);
        verify(reservationHoldExpiryService).expireIfElapsed(30L);
        verify(paymentService, never()).completeVnpayPayment(anyLong(), anyBoolean(), anyLong(), anyString(), anyString());
    }

    @Test
    @DisplayName("An toàn kết nối: Đơn > 24h nhưng QueryDR bị lỗi mạng -> Giữ nguyên PENDING, không mù quáng chuyển EXPIRED")
    void whenOlderThan24hAndNetworkError_thenKeepsPending() {
        when(vnPayGateway.configured()).thenReturn(true);

        Instant twoDaysAgo = Instant.now().minus(48, ChronoUnit.HOURS);
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(4L)
                .orderCode(1004L)
                .status("PENDING")
                .amount(1_000_000L)
                .build();
        txn.setCreatedAt(twoDaysAgo);

        when(paymentTransactionRepository.findByStatusOrderByCreatedAtAsc("PENDING"))
                .thenReturn(List.of(txn));
        when(paymentTransactionRepository.findByOrderCodeForUpdate(1004L))
                .thenReturn(Optional.of(txn));

        VnPayQueryResult errorResult = VnPayQueryResult.builder()
                .responseCode("99")
                .transactionStatus("ERROR")
                .message("Connect timed out")
                .build();
        when(vnPayGateway.queryDr(eq(1004L), any(Instant.class)))
                .thenReturn(errorResult);

        int processed = scheduler.reconcilePendingPayments();

        assertEquals(0, processed);
        assertEquals("PENDING", txn.getStatus(), "Phải giữ PENDING khi kết nối mạng lỗi");
        verify(paymentTransactionRepository, never()).save(txn);
    }

    @Test
    @DisplayName("Test Case 1.4 (Idempotency): Webhook IPN xử lý cùng lúc với Cronjob -> Lock hàng kiểm tra trạng thái và bỏ qua lặp")
    void whenConcurrentWebhookArrives_thenSchedulerLocksAndSkipsDuplicateProcessing() {
        when(vnPayGateway.configured()).thenReturn(true);

        // Lúc Scheduler quét ban đầu, txn vẫn là PENDING
        Instant tenMinsAgo = Instant.now().minus(10, ChronoUnit.MINUTES);
        PaymentTransaction txnInList = PaymentTransaction.builder()
                .id(5L)
                .orderCode(1005L)
                .status("PENDING")
                .amount(2_000_000L)
                .build();
        txnInList.setCreatedAt(tenMinsAgo);

        when(paymentTransactionRepository.findByStatusOrderByCreatedAtAsc("PENDING"))
                .thenReturn(List.of(txnInList));

        // Nhưng khi Scheduler đạt được Pessimistic Lock qua findByOrderCodeForUpdate,
        // Webhook IPN ở thread khác vừa commit xong và status đã chuyển thành SUCCESS
        PaymentTransaction txnAfterLock = PaymentTransaction.builder()
                .id(5L)
                .orderCode(1005L)
                .status("SUCCESS")
                .amount(2_000_000L)
                .build();
        txnAfterLock.setCreatedAt(tenMinsAgo);

        when(paymentTransactionRepository.findByOrderCodeForUpdate(1005L))
                .thenReturn(Optional.of(txnAfterLock));

        int processed = scheduler.reconcilePendingPayments();

        // Kỳ vọng: Scheduler phát hiện đã SUCCESS nên bỏ qua ngay lập tức
        assertEquals(0, processed, "Không được xử lý lại đơn đã SUCCESS do Webhook xử lý trước");
        verify(vnPayGateway, never()).queryDr(anyLong(), any());
        verify(paymentService, never()).completeVnpayPayment(anyLong(), anyBoolean(), anyLong(), anyString(), anyString());
        verify(paymentTransactionRepository, never()).save(any());
    }
}

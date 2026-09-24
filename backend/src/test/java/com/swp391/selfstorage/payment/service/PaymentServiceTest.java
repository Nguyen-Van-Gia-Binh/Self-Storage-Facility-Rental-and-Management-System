package com.swp391.selfstorage.payment.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.payment.dto.CreatePaymentRequest;
import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.event.PaymentCompletedEvent;
import com.swp391.selfstorage.payment.mapper.PaymentMapper;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.payment.service.impl.PaymentServiceImpl;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.reservation.service.ReservationService;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ReservationService reservationService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private vn.payos.PayOS payOS;

    @Mock
    private vn.payos.service.blocking.v2.paymentRequests.PaymentRequestsService paymentRequestsService;

    @Mock
    private vn.payos.service.blocking.webhooks.WebhooksService webhooksService;

    @Spy
    private PaymentMapper paymentMapper = new PaymentMapper();

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Reservation mockReservation;
    private CreatePaymentRequest validRequest;

    @BeforeEach
    void setUp() {
        mockReservation = new Reservation();
        mockReservation.setId(100L);
        mockReservation.setTotalPayable(3_200_000L);
        mockReservation.setStatus(ReservationStatus.PENDING_PAYMENT);
        mockReservation.setHoldExpiresAt(OffsetDateTime.now().plusHours(24));

        validRequest = CreatePaymentRequest.builder()
                .referenceType("RESERVATION")
                .referenceId(100L)
                .amount(3_200_000L)
                .method("BANK_TRANSFER")
                .transactionRef("MB123456")
                .build();
    }

    @Test
    @DisplayName("Thanh toán thành công: Lưu giao dịch, gọi confirm Reservation và bắn Event")
    void processPayment_Success() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(invocation -> {
                    PaymentTransaction p = invocation.getArgument(0);
                    p.setId(1L);
                    p.setCreatedAt(Instant.now());
                    p.setUpdatedAt(Instant.now());
                    return p;
                });

        PaymentResponse response = paymentService.processPayment(validRequest);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(3_200_000L, response.getAmount());

        // Verify gọi confirm giữ ô kho nguyên tử
        verify(reservationService).confirmAfterPayment(100L);

        // Verify bắn sự kiện PaymentCompletedEvent cho WS2 tạo hợp đồng
        ArgumentCaptor<PaymentCompletedEvent> eventCaptor = ArgumentCaptor.forClass(PaymentCompletedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals(100L, eventCaptor.getValue().reservationId());
        assertEquals(1L, eventCaptor.getValue().paymentId());
    }

    @Test
    @DisplayName("Ném AMOUNT_MISMATCH (422) khi số tiền không khớp với totalPayable")
    void processPayment_AmountMismatch() {
        validRequest.setAmount(2_000_000L); // Sai số tiền (phải là 3.200.000đ)
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));

        CustomException ex = assertThrows(CustomException.class,
                () -> paymentService.processPayment(validRequest));

        assertEquals(ErrorCode.AMOUNT_MISMATCH, ex.getErrorCode());
        verify(paymentTransactionRepository, never()).save(any());
        verify(reservationService, never()).confirmAfterPayment(any());
    }

    @Test
    @DisplayName("Ném RESERVATION_EXPIRED (409) khi đơn đặt chỗ đã quá hạn 48h")
    void processPayment_ReservationExpired() {
        mockReservation.setHoldExpiresAt(OffsetDateTime.now().minusHours(1)); // Đã quá hạn
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));

        CustomException ex = assertThrows(CustomException.class,
                () -> paymentService.processPayment(validRequest));

        assertEquals(ErrorCode.RESERVATION_EXPIRED, ex.getErrorCode());
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném RESERVATION_NOT_FOUND (404) khi ID đơn không tồn tại")
    void processPayment_ReservationNotFound() {
        when(reservationRepository.findById(999L)).thenReturn(Optional.empty());
        validRequest.setReferenceId(999L);

        CustomException ex = assertThrows(CustomException.class,
                () -> paymentService.processPayment(validRequest));

        assertEquals(ErrorCode.RESERVATION_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("createCheckoutLink: Thành công sinh link PayOS và lưu PaymentTransaction PENDING")
    void createCheckoutLink_Success() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));
        when(payOS.paymentRequests()).thenReturn(paymentRequestsService);

        when(paymentRequestsService.create(any(vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest.class)))
                .thenAnswer(invocation -> {
                    vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest r = invocation.getArgument(0);
                    return vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse.builder()
                            .bin("970422")
                            .accountNumber("0888567999")
                            .accountName("SMART STORAGE")
                            .amount(r.getAmount())
                            .description(r.getDescription())
                            .orderCode(r.getOrderCode())
                            .currency("VND")
                            .paymentLinkId("PL123")
                            .status(vn.payos.model.v2.paymentRequests.PaymentLinkStatus.PENDING)
                            .checkoutUrl("https://pay.payos.vn/web/" + r.getOrderCode())
                            .qrCode("00020101021238540010A00000072701260006970422...")
                            .build();
                });

        when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        com.swp391.selfstorage.payment.dto.CheckoutRequest req = com.swp391.selfstorage.payment.dto.CheckoutRequest.builder()
                .referenceType("RESERVATION")
                .referenceId(100L)
                .build();

        com.swp391.selfstorage.payment.dto.CheckoutResponse resp = paymentService.createCheckoutLink(req);

        assertNotNull(resp);
        assertNotNull(resp.getOrderCode());
        assertEquals("https://pay.payos.vn/web/" + resp.getOrderCode(), resp.getCheckoutUrl());
        assertEquals("00020101021238540010A00000072701260006970422...", resp.getQrCode());
        assertEquals(3_200_000L, resp.getAmount());
        assertEquals("PENDING", resp.getStatus());

        ArgumentCaptor<PaymentTransaction> txnCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(txnCaptor.capture());
        PaymentTransaction savedTxn = txnCaptor.getValue();
        assertEquals(100L, savedTxn.getReservationId());
        assertEquals("PENDING", savedTxn.getStatus());
        assertEquals("VIETQR_PAYOS", savedTxn.getPaymentMethod());
        assertEquals(resp.getOrderCode(), savedTxn.getOrderCode());
    }

    @Test
    @DisplayName("createCheckoutLink: Ném RESERVATION_EXPIRED khi đơn đã quá 48 giờ")
    void createCheckoutLink_ReservationExpired() {
        mockReservation.setHoldExpiresAt(OffsetDateTime.now().minusHours(2));
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));

        com.swp391.selfstorage.payment.dto.CheckoutRequest req = com.swp391.selfstorage.payment.dto.CheckoutRequest.builder()
                .referenceType("RESERVATION")
                .referenceId(100L)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> paymentService.createCheckoutLink(req));
        assertEquals(ErrorCode.RESERVATION_EXPIRED, ex.getErrorCode());
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("processPayOSWebhook: Xử lý webhook lần đầu -> Cập nhật SUCCESS, confirm Reservation và bắn Event")
    void processPayOSWebhook_Success_FirstTime() {
        when(payOS.webhooks()).thenReturn(webhooksService);

        vn.payos.model.webhooks.WebhookData webhookData = vn.payos.model.webhooks.WebhookData.builder()
                .orderCode(123456789L)
                .amount(3_200_000L)
                .description("DH100")
                .accountNumber("0888567999")
                .reference("FT242500001")
                .transactionDateTime("2026-09-24 21:00:00")
                .currency("VND")
                .paymentLinkId("PL123")
                .code("00")
                .desc("success")
                .build();

        when(webhooksService.verify(any())).thenReturn(webhookData);

        PaymentTransaction pendingTxn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("PENDING")
                .paymentMethod("VIETQR_PAYOS")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(pendingTxn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        PaymentResponse resp = paymentService.processPayOSWebhook("dummyWebhookBody");

        assertNotNull(resp);
        assertEquals("SUCCESS", resp.getStatus());
        assertEquals("FT242500001", resp.getTransactionRef());

        verify(reservationService).confirmAfterPayment(100L);
        ArgumentCaptor<PaymentCompletedEvent> eventCaptor = ArgumentCaptor.forClass(PaymentCompletedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals(100L, eventCaptor.getValue().reservationId());
        assertEquals(50L, eventCaptor.getValue().paymentId());
    }

    @Test
    @DisplayName("processPayOSWebhook: Idempotent - Nếu đã SUCCESS từ trước thì không confirm hay bắn Event lại")
    void processPayOSWebhook_Idempotent_AlreadySuccess() {
        when(payOS.webhooks()).thenReturn(webhooksService);

        vn.payos.model.webhooks.WebhookData webhookData = vn.payos.model.webhooks.WebhookData.builder()
                .orderCode(123456789L)
                .amount(3_200_000L)
                .description("DH100")
                .accountNumber("0888567999")
                .reference("FT242500001")
                .transactionDateTime("2026-09-24 21:00:00")
                .currency("VND")
                .paymentLinkId("PL123")
                .code("00")
                .desc("success")
                .build();

        when(webhooksService.verify(any())).thenReturn(webhookData);

        PaymentTransaction alreadySuccessTxn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("SUCCESS")
                .paymentMethod("VIETQR_PAYOS")
                .providerReference("FT242500001")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(alreadySuccessTxn));

        PaymentResponse resp = paymentService.processPayOSWebhook("dummyWebhookBody");

        assertNotNull(resp);
        assertEquals("SUCCESS", resp.getStatus());

        // Tuyệt đối không gọi confirm hoặc bắn event lần thứ 2
        verify(reservationService, never()).confirmAfterPayment(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("processPayOSWebhook: Giao dịch thất bại (code != 00) -> Cập nhật FAILED và không tạo hợp đồng")
    void processPayOSWebhook_Failure_WhenCodeNot00() {
        when(payOS.webhooks()).thenReturn(webhooksService);

        vn.payos.model.webhooks.WebhookData webhookData = vn.payos.model.webhooks.WebhookData.builder()
                .orderCode(123456789L)
                .amount(3_200_000L)
                .description("DH100")
                .accountNumber("0888567999")
                .reference("FAILED_REF_123")
                .transactionDateTime("2026-09-24 21:00:00")
                .currency("VND")
                .paymentLinkId("PL123")
                .code("01")
                .desc("Khách hàng hủy giao dịch")
                .build();

        when(webhooksService.verify(any())).thenReturn(webhookData);

        PaymentTransaction pendingTxn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("PENDING")
                .paymentMethod("VIETQR_PAYOS")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(pendingTxn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        PaymentResponse resp = paymentService.processPayOSWebhook("dummyWebhookBody");

        assertNotNull(resp);
        assertEquals("FAILED", resp.getStatus());
        assertEquals("FAILED_REF_123", resp.getTransactionRef());

        // Không confirm reservation và không bắn event tạo hợp đồng
        verify(reservationService, never()).confirmAfterPayment(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("processPayOSWebhook: Webhook test ping từ PayOS Dashboard -> Trả về 200 OK không ném lỗi")
    void processPayOSWebhook_TestPing_WhenOrderNotFound() {
        when(payOS.webhooks()).thenReturn(webhooksService);

        vn.payos.model.webhooks.WebhookData webhookData = vn.payos.model.webhooks.WebhookData.builder()
                .orderCode(999999L)
                .amount(1000L)
                .description("Webhook test ping")
                .accountNumber("0888567999")
                .reference("PING_123")
                .transactionDateTime("2026-09-24 21:00:00")
                .currency("VND")
                .paymentLinkId("PL123")
                .code("00")
                .desc("Webhook test ping")
                .build();

        when(webhooksService.verify(any())).thenReturn(webhookData);
        when(paymentTransactionRepository.findByOrderCode(999999L)).thenReturn(Optional.empty());

        PaymentResponse resp = paymentService.processPayOSWebhook("dummyWebhookBody");

        assertNotNull(resp);
        assertEquals(999999L, resp.getOrderCode());
        assertEquals("SUCCESS", resp.getStatus());
        verify(paymentTransactionRepository, never()).save(any());
        verify(reservationService, never()).confirmAfterPayment(any());
    }

    @Test
    @DisplayName("getPaymentByOrderCode: Tra cứu thành công giao dịch theo orderCode")
    void getPaymentByOrderCode_Success() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("SUCCESS")
                .paymentMethod("VIETQR_PAYOS")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(txn));

        PaymentResponse resp = paymentService.getPaymentByOrderCode(123456789L);

        assertNotNull(resp);
        assertEquals(50L, resp.getId());
        assertEquals(123456789L, resp.getOrderCode());
    }

    @Test
    @DisplayName("simulatePaymentSuccess: Giả lập thành công đơn hàng đang PENDING")
    void simulatePaymentSuccess_Success() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("PENDING")
                .paymentMethod("VIETQR_PAYOS")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(txn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse resp = paymentService.simulatePaymentSuccess(123456789L);

        assertNotNull(resp);
        assertEquals("SUCCESS", resp.getStatus());
        assertTrue(resp.getTransactionRef().startsWith("SIMULATED-"));
        verify(reservationService).confirmAfterPayment(100L);
        verify(eventPublisher).publishEvent(any(PaymentCompletedEvent.class));
    }

    @Test
    @DisplayName("simulatePaymentSuccess: Khi đã SUCCESS từ trước thì không bắn event trùng lặp")
    void simulatePaymentSuccess_AlreadySuccess() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("SUCCESS")
                .paymentMethod("VIETQR_PAYOS")
                .providerReference("SIMULATED-PREV")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(txn));

        PaymentResponse resp = paymentService.simulatePaymentSuccess(123456789L);

        assertNotNull(resp);
        assertEquals("SUCCESS", resp.getStatus());
        verify(reservationService, never()).confirmAfterPayment(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("simulatePaymentSuccess: Ném lỗi PAYMENT_NOT_FOUND khi không tìm thấy orderCode")
    void simulatePaymentSuccess_NotFound() {
        when(paymentTransactionRepository.findByOrderCode(999L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> paymentService.simulatePaymentSuccess(999L));
        assertEquals(ErrorCode.PAYMENT_NOT_FOUND, ex.getErrorCode());
    }
}

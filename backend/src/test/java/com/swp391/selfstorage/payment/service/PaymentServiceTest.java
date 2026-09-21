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
}

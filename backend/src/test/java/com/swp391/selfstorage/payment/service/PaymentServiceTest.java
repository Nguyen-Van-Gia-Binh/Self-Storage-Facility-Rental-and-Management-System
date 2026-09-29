package com.swp391.selfstorage.payment.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.OffsetDateTime;
import java.util.Map;
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
import com.swp391.selfstorage.payment.dto.CheckoutRequest;
import com.swp391.selfstorage.payment.dto.CheckoutResponse;
import com.swp391.selfstorage.payment.dto.CreatePaymentRequest;
import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.event.ContractRenewalPaymentCompletedEvent;
import com.swp391.selfstorage.payment.event.PaymentCompletedEvent;
import com.swp391.selfstorage.payment.gateway.PaymentGateway;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutCommand;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutResult;
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
    private com.swp391.selfstorage.contract.repository.RentalContractRepository rentalContractRepository;

    @Mock
    private com.swp391.selfstorage.contract.service.RenewalService renewalService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private PaymentGateway paymentGateway;

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
                    return p;
                });

        PaymentResponse response = paymentService.processPayment(validRequest);

        assertNotNull(response);
        assertEquals(3_200_000L, response.getAmount());
        assertEquals("SUCCESS", response.getStatus());
        assertEquals("BANK_TRANSFER", response.getMethod());

        verify(reservationService).confirmAfterPayment(100L);
        verify(eventPublisher).publishEvent(any(PaymentCompletedEvent.class));
    }

    @Test
    @DisplayName("Ném AMOUNT_MISMATCH khi số tiền thanh toán không khớp")
    void processPayment_AmountMismatch() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));
        validRequest.setAmount(2_000_000L);

        CustomException ex = assertThrows(CustomException.class,
                () -> paymentService.processPayment(validRequest));

        assertEquals(ErrorCode.AMOUNT_MISMATCH, ex.getErrorCode());
        verify(paymentTransactionRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Ném RESERVATION_EXPIRED khi thời gian giữ chỗ 48h đã hết")
    void processPayment_ReservationExpired() {
        mockReservation.setHoldExpiresAt(OffsetDateTime.now().minusHours(1));
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));

        CustomException ex = assertThrows(CustomException.class,
                () -> paymentService.processPayment(validRequest));

        assertEquals(ErrorCode.RESERVATION_EXPIRED, ex.getErrorCode());
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
    @DisplayName("createCheckoutLink: Thành công sinh thông tin thanh toán Sandbox và lưu PaymentTransaction PENDING")
    void createCheckoutLink_Success() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));

        when(paymentGateway.createPayment(any(PaymentCheckoutCommand.class)))
                .thenAnswer(invocation -> {
                    PaymentCheckoutCommand cmd = invocation.getArgument(0);
                    return PaymentCheckoutResult.builder()
                            .orderCode(cmd.getOrderCode())
                            .amount(cmd.getAmount())
                            .description(cmd.getDescription())
                            .accountName("CONG TY CP SMARTSTORAGE VIETNAM")
                            .accountNumber("0888567999")
                            .bin("970422")
                            .checkoutUrl("http://localhost:5173/payment/checkout?orderCode=" + cmd.getOrderCode())
                            .qrCode("https://img.vietqr.io/image/970422-0888567999-compact2.png")
                            .build();
                });

        when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CheckoutRequest req = CheckoutRequest.builder()
                .referenceType("RESERVATION")
                .referenceId(100L)
                .build();

        CheckoutResponse resp = paymentService.createCheckoutLink(req);

        assertNotNull(resp);
        assertNotNull(resp.getOrderCode());
        assertEquals("http://localhost:5173/payment/checkout?orderCode=" + resp.getOrderCode(), resp.getCheckoutUrl());
        assertEquals("https://img.vietqr.io/image/970422-0888567999-compact2.png", resp.getQrCode());
        assertEquals(3_200_000L, resp.getAmount());
        assertEquals("PENDING", resp.getStatus());

        ArgumentCaptor<PaymentTransaction> txnCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(txnCaptor.capture());
        PaymentTransaction savedTxn = txnCaptor.getValue();
        assertEquals(100L, savedTxn.getReservationId());
        assertEquals("PENDING", savedTxn.getStatus());
        assertEquals("SANDBOX_VIETQR", savedTxn.getPaymentMethod());
        assertEquals(resp.getOrderCode(), savedTxn.getOrderCode());
    }

    @Test
    @DisplayName("createCheckoutLink: Ném RESERVATION_EXPIRED khi đơn đã quá 48 giờ")
    void createCheckoutLink_ReservationExpired() {
        mockReservation.setHoldExpiresAt(OffsetDateTime.now().minusHours(2));
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));

        CheckoutRequest req = CheckoutRequest.builder()
                .referenceType("RESERVATION")
                .referenceId(100L)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> paymentService.createCheckoutLink(req));
        assertEquals(ErrorCode.RESERVATION_EXPIRED, ex.getErrorCode());
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("getPaymentByOrderCode: Trả về trạng thái thực tế PENDING từ DB khi chưa thanh toán")
    void getPaymentByOrderCode_ReturnsCurrentStatus() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(1L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("PENDING")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(txn));

        PaymentResponse response = paymentService.getPaymentByOrderCode(123456789L);

        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        assertEquals(123456789L, response.getOrderCode());
    }

    @Test
    @DisplayName("getPaymentByOrderCode: Ném PAYMENT_NOT_FOUND (404) khi orderCode không tồn tại")
    void getPaymentByOrderCode_NotFound() {
        when(paymentTransactionRepository.findByOrderCode(999999L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> paymentService.getPaymentByOrderCode(999999L));

        assertEquals(ErrorCode.PAYMENT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("processSandboxTransfer: Xác nhận chuyển tiền thành công -> Chuyển SUCCESS, confirm và bắn Event")
    void processSandboxTransfer_Success() {
        PaymentTransaction pendingTxn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("PENDING")
                .transactionType("INITIAL_PAYMENT")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(pendingTxn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.processSandboxTransfer(123456789L, "TRANSFER_SUCCESS");

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals("SUCCESS", pendingTxn.getStatus());
        verify(reservationService).confirmAfterPayment(100L);
        verify(eventPublisher).publishEvent(any(PaymentCompletedEvent.class));
    }

    @Test
    @DisplayName("processSandboxTransfer: Khách bấm Hủy giao dịch -> Chuyển FAILED")
    void processSandboxTransfer_Cancel() {
        PaymentTransaction pendingTxn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("PENDING")
                .transactionType("INITIAL_PAYMENT")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(pendingTxn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.processSandboxTransfer(123456789L, "CANCEL");

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertEquals("FAILED", pendingTxn.getStatus());
        verify(reservationService, never()).confirmAfterPayment(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("processSandboxTransfer: Idempotency - Đã SUCCESS thì bỏ qua, không xử lý lại")
    void processSandboxTransfer_Idempotent() {
        PaymentTransaction successTxn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("SUCCESS")
                .transactionType("INITIAL_PAYMENT")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(successTxn));

        PaymentResponse response = paymentService.processSandboxTransfer(123456789L, "TRANSFER_SUCCESS");

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        verify(paymentTransactionRepository, never()).save(any());
        verify(reservationService, never()).confirmAfterPayment(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("processPayOSWebhook: Xử lý Webhook thành công (code=00)")
    void processPayOSWebhook_Success() {
        PaymentTransaction pendingTxn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("PENDING")
                .transactionType("INITIAL_PAYMENT")
                .build();

        when(paymentTransactionRepository.findByOrderCode(123456789L)).thenReturn(Optional.of(pendingTxn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> payload = Map.of(
                "code", "00",
                "desc", "Success",
                "data", Map.of(
                        "orderCode", 123456789L,
                        "amount", 3_200_000L,
                        "reference", "FT26090001"
                )
        );

        PaymentResponse response = paymentService.processPayOSWebhook(payload);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        verify(reservationService).confirmAfterPayment(100L);
    }

    @Test
    @DisplayName("Tạo link thanh toán nợ phạt OVERDUE_PENALTY: Thành công lấy số tiền nợ từ hợp đồng")
    void createCheckoutLink_OverduePenalty_Success() {
        com.swp391.selfstorage.contract.entity.RentalContract mockContract = new com.swp391.selfstorage.contract.entity.RentalContract();
        mockContract.setId(80017L);
        mockContract.setStatus(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE);
        mockContract.setOverdueFeeAccrued(250_000L);

        when(rentalContractRepository.findById(80017L)).thenReturn(Optional.of(mockContract));
        when(paymentGateway.createPayment(any(PaymentCheckoutCommand.class)))
                .thenReturn(PaymentCheckoutResult.builder()
                        .orderCode(12345678L)
                        .checkoutUrl("https://payos.vn/checkout/12345678")
                        .qrCode("vietqr://250000/PHAT80017")
                        .amount(250_000L)
                        .build());
        when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest request = CheckoutRequest.builder()
                .referenceType("OVERDUE_PENALTY")
                .referenceId(80017L)
                .build();

        CheckoutResponse response = paymentService.createCheckoutLink(request);

        assertNotNull(response);
        assertEquals(250_000L, response.getAmount());
        assertNotNull(response.getOrderCode());
        verify(rentalContractRepository).findById(80017L);
    }

    @Test
    @DisplayName("Tạo link thanh toán nợ phạt OVERDUE_PENALTY: Thất bại nếu hợp đồng không có nợ (overdueFeeAccrued <= 0)")
    void createCheckoutLink_OverduePenalty_NoDebt_ThrowsException() {
        com.swp391.selfstorage.contract.entity.RentalContract mockContract = new com.swp391.selfstorage.contract.entity.RentalContract();
        mockContract.setId(80017L);
        mockContract.setStatus(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE);
        mockContract.setOverdueFeeAccrued(0L);

        when(rentalContractRepository.findById(80017L)).thenReturn(Optional.of(mockContract));

        CheckoutRequest request = CheckoutRequest.builder()
                .referenceType("OVERDUE_PENALTY")
                .referenceId(80017L)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> paymentService.createCheckoutLink(request));
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("nợ phạt quá hạn"));
    }

    @Test
    @DisplayName("Sandbox OVERDUE_PENALTY thành công: Xóa nợ phạt về 0 cho hợp đồng")
    void processSandboxTransfer_OverduePenalty_ClearsDebt() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(999L)
                .orderCode(88889999L)
                .amount(250_000L)
                .status("PENDING")
                .transactionType("OVERDUE_PENALTY")
                .contractId(80017L)
                .build();

        com.swp391.selfstorage.contract.entity.RentalContract mockContract = new com.swp391.selfstorage.contract.entity.RentalContract();
        mockContract.setId(80017L);
        mockContract.setOverdueFeeAccrued(250_000L);

        when(paymentTransactionRepository.findByOrderCode(88889999L)).thenReturn(Optional.of(txn));
        when(rentalContractRepository.findById(80017L)).thenReturn(Optional.of(mockContract));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentResponse res = paymentService.processSandboxTransfer(88889999L, "TRANSFER_SUCCESS");

        assertEquals("SUCCESS", res.getStatus());
        assertEquals(0L, mockContract.getOverdueFeeAccrued());
        verify(rentalContractRepository).save(mockContract);
    }

    @Test
    @DisplayName("OverduePenaltyPaymentService: Hợp đồng OVERDUE KHÔNG chuyển về ACTIVE sau thanh toán phạt Sandbox (BR-OVD-08)")
    void processSandboxTransfer_OverduePenalty_ContractStaysOverdue() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(1001L).orderCode(99991111L).amount(300_000L)
                .status("PENDING").transactionType("OVERDUE_PENALTY").contractId(80020L)
                .build();

        com.swp391.selfstorage.contract.entity.RentalContract contract =
                new com.swp391.selfstorage.contract.entity.RentalContract();
        contract.setId(80020L);
        contract.setStatus(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE);
        contract.setOverdueFeeAccrued(300_000L);

        when(paymentTransactionRepository.findByOrderCode(99991111L)).thenReturn(Optional.of(txn));
        when(rentalContractRepository.findById(80020L)).thenReturn(Optional.of(contract));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        paymentService.processSandboxTransfer(99991111L, "TRANSFER_SUCCESS");

        assertEquals(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE, contract.getStatus(),
                "Hợp đồng PHẢI giữ nguyên OVERDUE sau khi nộp phạt — KHÔNG được chuyển ACTIVE (BR-OVD-08)");
        assertEquals(0L, contract.getOverdueFeeAccrued(),
                "Nợ phạt phải được xóa về 0 sau khi thanh toán thành công");
    }

    @Test
    @DisplayName("OverduePenaltyPaymentService: Hợp đồng OVERDUE KHÔNG chuyển về ACTIVE sau PayOS Webhook (BR-OVD-08)")
    void processPayOSWebhook_OverduePenalty_ContractStaysOverdue() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(1002L).orderCode(77778888L).amount(350_000L)
                .status("PENDING").transactionType("OVERDUE_PENALTY").contractId(90002L)
                .build();

        com.swp391.selfstorage.contract.entity.RentalContract contract =
                new com.swp391.selfstorage.contract.entity.RentalContract();
        contract.setId(90002L);
        contract.setStatus(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE);
        contract.setOverdueFeeAccrued(350_000L);

        when(paymentTransactionRepository.findByOrderCode(77778888L)).thenReturn(Optional.of(txn));
        when(rentalContractRepository.findById(90002L)).thenReturn(Optional.of(contract));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> payload = Map.of(
                "code", "00",
                "data", Map.of("orderCode", 77778888L, "reference", "FT99001")
        );
        paymentService.processPayOSWebhook(payload);

        assertEquals(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE, contract.getStatus(),
                "Hợp đồng PHẢI giữ nguyên OVERDUE qua PayOS Webhook — KHÔNG được chuyển ACTIVE (BR-OVD-08)");
        assertEquals(0L, contract.getOverdueFeeAccrued(),
                "Nợ phạt phải được xóa về 0 sau thanh toán PayOS thành công");
    }
}

package com.swp391.selfstorage.payment.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.RenewalQuoteResponse;
import com.swp391.selfstorage.payment.dto.CheckoutRequest;
import com.swp391.selfstorage.payment.dto.CheckoutResponse;
import com.swp391.selfstorage.payment.dto.CreatePaymentRequest;
import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.event.ContractRenewalPaymentCompletedEvent;
import com.swp391.selfstorage.payment.event.PaymentCompletedEvent;
import com.swp391.selfstorage.payment.gateway.PaymentGateway;
import com.swp391.selfstorage.payment.gateway.VnPayGateway;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutCommand;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutResult;
import com.swp391.selfstorage.payment.gateway.dto.VnPayQueryResult;
import com.swp391.selfstorage.payment.mapper.PaymentMapper;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.payment.service.impl.PaymentServiceImpl;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.reservation.service.ReservationHoldExpiryService;
import com.swp391.selfstorage.reservation.service.ReservationService;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

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

    @Mock
    private VnPayGateway vnPayGateway;

    @Mock
    private ReservationHoldExpiryService reservationHoldExpiryService;

    @Mock
    private com.swp391.selfstorage.policy.repository.PolicyVersionRepository policyVersionRepository;

    @Mock
    private org.springframework.beans.factory.ObjectProvider<com.swp391.selfstorage.contract.service.ContractService> contractServiceProvider;

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
        assertEquals(ReservationStatus.EXPIRED, mockReservation.getStatus());
        verify(reservationRepository).save(mockReservation);
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
    void createCheckoutLink_ConfirmedReservation_Rejected() {
        mockReservation.setStatus(ReservationStatus.CONFIRMED);
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));
        CheckoutRequest req = CheckoutRequest.builder().referenceType("RESERVATION").referenceId(100L).build();

        CustomException ex = assertThrows(CustomException.class, () -> paymentService.createCheckoutLink(req));

        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    void createCheckoutLink_ExistingSuccessPayment_Rejected() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(mockReservation));
        PaymentTransaction paid = PaymentTransaction.builder()
                .reservationId(100L).transactionType("INITIAL_PAYMENT").status("SUCCESS").amount(3_200_000L).build();
        when(paymentTransactionRepository.findByReservationId(100L)).thenReturn(List.of(paid));
        CheckoutRequest req = CheckoutRequest.builder().referenceType("RESERVATION").referenceId(100L).build();

        CustomException ex = assertThrows(CustomException.class, () -> paymentService.createCheckoutLink(req));

        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
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
        assertEquals(ReservationStatus.EXPIRED, mockReservation.getStatus());
        verify(reservationRepository).save(mockReservation);
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
    @DisplayName("completeVnpayPayment: Xác nhận chuyển tiền thành công -> Chuyển SUCCESS, confirm và bắn Event")
    void completeVnpayPayment_Success() {
        PaymentTransaction pendingTxn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123456789L)
                .amount(3_200_000L)
                .status("PENDING")
                .transactionType("INITIAL_PAYMENT")
                .build();

        when(paymentTransactionRepository.findByOrderCodeForUpdate(123456789L)).thenReturn(Optional.of(pendingTxn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        boolean ok = paymentService.completeVnpayPayment(123456789L, true, 3_200_000L * 100L, "VNPAY-REF", "NCB");

        assertTrue(ok);
        assertEquals("SUCCESS", pendingTxn.getStatus());
        verify(reservationService).confirmAfterPayment(100L);
        verify(eventPublisher).publishEvent(any(PaymentCompletedEvent.class));
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
    @DisplayName("VNPay OVERDUE_PENALTY thành công: Xóa nợ phạt về 0 cho hợp đồng")
    void completeVnpayPayment_OverduePenalty_ClearsDebt() {
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

        when(paymentTransactionRepository.findByOrderCodeForUpdate(88889999L)).thenReturn(Optional.of(txn));
        when(rentalContractRepository.findById(80017L)).thenReturn(Optional.of(mockContract));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean ok = paymentService.completeVnpayPayment(88889999L, true, 250_000L * 100L, "VNPAY-REF", "NCB");

        assertTrue(ok);
        assertEquals("SUCCESS", txn.getStatus());
        assertEquals(0L, mockContract.getOverdueFeeAccrued());
        verify(rentalContractRepository).save(mockContract);
    }

    @Test
    @DisplayName("OverduePenaltyPaymentService: Hợp đồng OVERDUE KHÔNG chuyển về ACTIVE sau thanh toán phạt VNPay (BR-OVD-08)")
    void completeVnpayPayment_OverduePenalty_ContractStaysOverdue() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(1001L).orderCode(99991111L).amount(300_000L)
                .status("PENDING").transactionType("OVERDUE_PENALTY").contractId(80020L)
                .build();

        com.swp391.selfstorage.contract.entity.RentalContract contract =
                new com.swp391.selfstorage.contract.entity.RentalContract();
        contract.setId(80020L);
        contract.setStatus(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE);
        contract.setOverdueFeeAccrued(300_000L);

        when(paymentTransactionRepository.findByOrderCodeForUpdate(99991111L)).thenReturn(Optional.of(txn));
        when(rentalContractRepository.findById(80020L)).thenReturn(Optional.of(contract));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean ok = paymentService.completeVnpayPayment(99991111L, true, 300_000L * 100L, "VNPAY-REF", "NCB");

        assertTrue(ok);
        assertEquals(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE, contract.getStatus(),
                "Hợp đồng PHẢI giữ nguyên OVERDUE sau khi nộp phạt — KHÔNG được chuyển ACTIVE (BR-OVD-08)");
        assertEquals(0L, contract.getOverdueFeeAccrued(),
                "Nợ phạt phải được xóa về 0 sau khi thanh toán thành công");
        assertNotNull(contract.getAccessCode(), "Phải cấp lại mã PIN sau khi tất toán nợ phạt (BR-OVD-08)");
        assertEquals(6, contract.getAccessCode().length(), "Mã PIN cấp lại phải có độ dài 6 chữ số");
    }

    @Test
    @DisplayName("BR-OVD-08: Thanh toán nợ phạt khi mã PIN chưa bị khóa (D+4..D+6) giữ nguyên mã PIN cũ")
    void completeVnpayPayment_OverduePenalty_PreservesExistingAccessCode() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(1002L).orderCode(99992222L).amount(100_000L)
                .status("PENDING").transactionType("OVERDUE_PENALTY").contractId(80021L)
                .build();

        com.swp391.selfstorage.contract.entity.RentalContract contract =
                new com.swp391.selfstorage.contract.entity.RentalContract();
        contract.setId(80021L);
        contract.setStatus(com.swp391.selfstorage.contract.entity.ContractStatus.OVERDUE);
        contract.setOverdueFeeAccrued(100_000L);
        contract.setAccessCode("654321"); // Chưa bị khóa tại D+5

        when(paymentTransactionRepository.findByOrderCodeForUpdate(99992222L)).thenReturn(Optional.of(txn));
        when(rentalContractRepository.findById(80021L)).thenReturn(Optional.of(contract));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean ok = paymentService.completeVnpayPayment(99992222L, true, 100_000L * 100L, "VNPAY-REF", "NCB");

        assertTrue(ok);
        assertEquals(0L, contract.getOverdueFeeAccrued());
        assertEquals("654321", contract.getAccessCode(), "Mã PIN cũ phải được giữ nguyên khi chưa bị xóa");
    }

    @Test
    @DisplayName("Checkout gia hạn lưu đúng số tháng đã chốt, không suy ra từ nội dung chuyển khoản")
    void createCheckoutLink_ContractRenewal_PersistsMonths() {
        com.swp391.selfstorage.contract.entity.RentalContract contract =
                new com.swp391.selfstorage.contract.entity.RentalContract();
        contract.setId(100L);

        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(renewalService.getRenewalQuote(eq(100L), any()))
                .thenReturn(RenewalQuoteResponse.builder().totalAmount(2_400_000L).build());
        when(paymentGateway.createPayment(any(PaymentCheckoutCommand.class)))
                .thenReturn(PaymentCheckoutResult.builder()
                        .orderCode(1L)
                        .amount(2_400_000L)
                        .checkoutUrl("http://localhost/payment/checkout")
                        .build());
        when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CheckoutRequest request = CheckoutRequest.builder()
                .referenceType("CONTRACT_RENEWAL")
                .referenceId(100L)
                .renewalMonths(3)
                .description("GH100T12")
                .build();

        paymentService.createCheckoutLink(request);

        ArgumentCaptor<PaymentTransaction> saved = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(saved.capture());
        assertEquals(3, saved.getValue().getRenewalMonths());
        assertEquals("CONTRACT_RENEWAL", saved.getValue().getTransactionType());
    }

    @Test
    @DisplayName("VNPay gia hạn bắn event đúng số tháng đã lưu, không hard-code 1 tháng")
    void completeVnpayPayment_ContractRenewal_UsesStoredMonths() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(77L)
                .contractId(100L)
                .orderCode(555L)
                .amount(2_400_000L)
                .status("PENDING")
                .transactionType("CONTRACT_RENEWAL")
                .renewalMonths(3)
                .build();

        when(paymentTransactionRepository.findByOrderCodeForUpdate(555L)).thenReturn(Optional.of(txn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        paymentService.completeVnpayPayment(555L, true, 2_400_000L * 100L, "VNPAY-REF", "NCB");

        ArgumentCaptor<ContractRenewalPaymentCompletedEvent> event =
                ArgumentCaptor.forClass(ContractRenewalPaymentCompletedEvent.class);
        verify(eventPublisher).publishEvent(event.capture());
        assertEquals(100L, event.getValue().contractId());
        assertEquals(77L, event.getValue().paymentId());
        assertEquals(3, event.getValue().renewalMonths());
    }



    @ParameterizedTest(name = "VNPay gia hạn {0} tháng bắn đúng {0} tháng, không rút về 1")
    @ValueSource(ints = {1, 3, 6, 12})
    void completeVnpayPayment_ContractRenewal_KeepsSelectedMonths(int months) {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(70L + months)
                .contractId(100L)
                .orderCode(700L + months)
                .amount(3_000_000L * months)
                .status("PENDING")
                .transactionType("CONTRACT_RENEWAL")
                .renewalMonths(months)
                .build();

        when(paymentTransactionRepository.findByOrderCodeForUpdate(700L + months)).thenReturn(Optional.of(txn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));

        paymentService.completeVnpayPayment(700L + months, true, 3_000_000L * months * 100L, "VNPAY-REF", "NCB");

        ArgumentCaptor<ContractRenewalPaymentCompletedEvent> event =
                ArgumentCaptor.forClass(ContractRenewalPaymentCompletedEvent.class);
        verify(eventPublisher).publishEvent(event.capture());
        assertEquals(months, event.getValue().renewalMonths());
    }

    @Test
    @DisplayName("Thiếu renewal_months thì suy ra từ số tiền, không mặc định 1 tháng")
    void processSandboxTransfer_NullMonths_DerivesFromAmount() {
        PaymentTransaction txn = PaymentTransaction.builder()
                .id(91L)
                .contractId(100L)
                .orderCode(910L)
                .amount(18_000_000L)
                .status("PENDING")
                .transactionType("CONTRACT_RENEWAL")
                .build();

        com.swp391.selfstorage.contract.entity.RentalContract contract =
                new com.swp391.selfstorage.contract.entity.RentalContract();
        contract.setId(100L);
        contract.setMonthlyPrice(3_000_000L);

        when(paymentTransactionRepository.findByOrderCodeForUpdate(910L)).thenReturn(Optional.of(txn));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(i -> i.getArgument(0));
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));

        paymentService.completeVnpayPayment(910L, true, 18_000_000L * 100L, "VNPAY-REF", "NCB");

        ArgumentCaptor<ContractRenewalPaymentCompletedEvent> event =
                ArgumentCaptor.forClass(ContractRenewalPaymentCompletedEvent.class);
        verify(eventPublisher).publishEvent(event.capture());
        assertEquals(6, event.getValue().renewalMonths());
    }

    @Test
    @DisplayName("completeVnpayPayment: đã SUCCESS thì không confirm lần nữa")
    void completeVnpayPayment_AlreadySuccess() {
        PaymentTransaction successTxn = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123L)
                .amount(1_000L)
                .status("SUCCESS")
                .transactionType("INITIAL_PAYMENT")
                .build();
        when(paymentTransactionRepository.findByOrderCodeForUpdate(123L)).thenReturn(Optional.of(successTxn));

        assertTrue(paymentService.completeVnpayPayment(123L, true, 100_000L, "1", "NCB"));

        verify(paymentTransactionRepository, never()).save(any());
        verify(reservationService, never()).confirmAfterPayment(any());
    }

    @Test
    @DisplayName("completeVnpayPayment: hủy hoặc lệch tiền thì giữ PENDING")
    void completeVnpayPayment_KeepsPending() {
        PaymentTransaction pending = PaymentTransaction.builder()
                .id(50L)
                .reservationId(100L)
                .orderCode(123L)
                .amount(1_000L)
                .status("PENDING")
                .transactionType("INITIAL_PAYMENT")
                .paymentMethod("SANDBOX_VIETQR")
                .build();
        when(paymentTransactionRepository.findByOrderCodeForUpdate(123L)).thenReturn(Optional.of(pending));

        assertFalse(paymentService.completeVnpayPayment(123L, false, 100_000L, "1", "NCB"));
        assertFalse(paymentService.completeVnpayPayment(123L, true, 1L, "1", "NCB"));

        assertEquals("PENDING", pending.getStatus());
        verify(paymentTransactionRepository, never()).save(any());
        verify(reservationService, never()).confirmAfterPayment(any());
    }

    @Test
    @DisplayName("reconcileSingleOrder: dưới 5 phút thì bỏ qua để nhường Webhook IPN")
    void reconcileSingleOrder_YoungerThan5m_ReturnsFalse() {
        PaymentTransaction pending = PaymentTransaction.builder()
                .id(1L)
                .orderCode(1001L)
                .status("PENDING")
                .build();
        pending.setCreatedAt(Instant.now().minus(2, ChronoUnit.MINUTES));
        when(paymentTransactionRepository.findByOrderCode(1001L)).thenReturn(Optional.of(pending));

        assertFalse(paymentService.reconcileSingleOrder(1001L));
        verify(vnPayGateway, never()).queryDr(anyLong(), any());
    }

    @Test
    @DisplayName("reconcileSingleOrder: VNPay báo 00 (SUCCESS) -> kích hoạt đơn hoàn tất")
    void reconcileSingleOrder_Success_CompletesPayment() {
        PaymentTransaction pending = PaymentTransaction.builder()
                .id(1L)
                .orderCode(1001L)
                .amount(2_000_000L)
                .status("PENDING")
                .build();
        pending.setCreatedAt(Instant.now().minus(10, ChronoUnit.MINUTES));
        when(paymentTransactionRepository.findByOrderCode(1001L)).thenReturn(Optional.of(pending));
        when(paymentTransactionRepository.findByOrderCodeForUpdate(1001L)).thenReturn(Optional.of(pending));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        VnPayQueryResult successQr = VnPayQueryResult.builder()
                .responseCode("00")
                .transactionStatus("00")
                .amount(200_000_000L)
                .transactionNo("TXN123")
                .bankCode("NCB")
                .build();
        when(vnPayGateway.queryDr(eq(1001L), any(Instant.class))).thenReturn(successQr);

        assertTrue(paymentService.reconcileSingleOrder(1001L));
    }

    @Test
    @DisplayName("reconcileSingleOrder: VNPay báo 91 (NOT_FOUND) -> chuyển EXPIRED và nhả giữ chỗ")
    void reconcileSingleOrder_NotFound_Expires() {
        org.springframework.test.util.ReflectionTestUtils.setField(paymentService, "reservationHoldExpiryService", reservationHoldExpiryService);
        PaymentTransaction pending = PaymentTransaction.builder()
                .id(1L)
                .orderCode(1001L)
                .status("PENDING")
                .reservationId(50L)
                .build();
        pending.setCreatedAt(Instant.now().minus(10, ChronoUnit.MINUTES));
        when(paymentTransactionRepository.findByOrderCode(1001L)).thenReturn(Optional.of(pending));
        when(paymentTransactionRepository.findByOrderCodeForUpdate(1001L)).thenReturn(Optional.of(pending));

        VnPayQueryResult notFoundQr = VnPayQueryResult.builder()
                .responseCode("91")
                .transactionStatus("91")
                .build();
        when(vnPayGateway.queryDr(eq(1001L), any(Instant.class))).thenReturn(notFoundQr);

        assertTrue(paymentService.reconcileSingleOrder(1001L));
        assertEquals("EXPIRED", pending.getStatus());
        verify(paymentTransactionRepository).save(pending);
        verify(reservationHoldExpiryService).expireIfElapsed(50L);
    }

    @Test
    @DisplayName("reconcileSingleOrder: VNPay lỗi 99 nhưng đã >= 48h (Hard Timeout) -> chuyển EXPIRED")
    void reconcileSingleOrder_OlderThan48hAndError99_ExpiresHardTimeout() {
        org.springframework.test.util.ReflectionTestUtils.setField(paymentService, "reservationHoldExpiryService", reservationHoldExpiryService);
        PaymentTransaction pending = PaymentTransaction.builder()
                .id(1L)
                .orderCode(1001L)
                .status("PENDING")
                .reservationId(60L)
                .build();
        pending.setCreatedAt(Instant.now().minus(50, ChronoUnit.HOURS));
        when(paymentTransactionRepository.findByOrderCode(1001L)).thenReturn(Optional.of(pending));
        when(paymentTransactionRepository.findByOrderCodeForUpdate(1001L)).thenReturn(Optional.of(pending));

        VnPayQueryResult errorQr = VnPayQueryResult.builder()
                .responseCode("99")
                .transactionStatus("ERROR")
                .build();
        when(vnPayGateway.queryDr(eq(1001L), any(Instant.class))).thenReturn(errorQr);

        assertTrue(paymentService.reconcileSingleOrder(1001L));
        assertEquals("EXPIRED", pending.getStatus());
        verify(paymentTransactionRepository).save(pending);
        verify(reservationHoldExpiryService).expireIfElapsed(60L);
    }

    @Test
    @DisplayName("reconcileSingleOrder: VNPay lỗi 99 và < 48h -> giữ PENDING cho lần sau")
    void reconcileSingleOrder_YoungerThan48hAndError99_KeepsPending() {
        PaymentTransaction pending = PaymentTransaction.builder()
                .id(1L)
                .orderCode(1001L)
                .status("PENDING")
                .build();
        pending.setCreatedAt(Instant.now().minus(20, ChronoUnit.HOURS));
        when(paymentTransactionRepository.findByOrderCode(1001L)).thenReturn(Optional.of(pending));
        when(paymentTransactionRepository.findByOrderCodeForUpdate(1001L)).thenReturn(Optional.of(pending));

        VnPayQueryResult errorQr = VnPayQueryResult.builder()
                .responseCode("99")
                .transactionStatus("ERROR")
                .build();
        when(vnPayGateway.queryDr(eq(1001L), any(Instant.class))).thenReturn(errorQr);

        assertFalse(paymentService.reconcileSingleOrder(1001L));
        assertEquals("PENDING", pending.getStatus());
        verify(paymentTransactionRepository, never()).save(pending);
    }

    @Test
    @DisplayName("reconcileSingleOrder (Guardrail Idempotency): Webhook IPN commit SUCCESS trong lúc chờ mạng -> Lock và bỏ qua lặp")
    void reconcileSingleOrder_ConcurrentWebhookSuccess_SkipsProcessing() {
        PaymentTransaction pendingBeforeNetwork = PaymentTransaction.builder()
                .id(1L)
                .orderCode(1001L)
                .status("PENDING")
                .build();
        pendingBeforeNetwork.setCreatedAt(Instant.now().minus(10, ChronoUnit.MINUTES));
        when(paymentTransactionRepository.findByOrderCode(1001L)).thenReturn(Optional.of(pendingBeforeNetwork));

        VnPayQueryResult successQr = VnPayQueryResult.builder()
                .responseCode("00")
                .transactionStatus("00")
                .amount(200_000_000L)
                .transactionNo("TXN123")
                .bankCode("NCB")
                .build();
        when(vnPayGateway.queryDr(eq(1001L), any(Instant.class))).thenReturn(successQr);

        // Nhưng khi acquire lock findByOrderCodeForUpdate, status đã là SUCCESS do Webhook IPN vừa commit xong
        PaymentTransaction updatedByWebhook = PaymentTransaction.builder()
                .id(1L)
                .orderCode(1001L)
                .status("SUCCESS")
                .build();
        when(paymentTransactionRepository.findByOrderCodeForUpdate(1001L)).thenReturn(Optional.of(updatedByWebhook));

        assertFalse(paymentService.reconcileSingleOrder(1001L), "Phải bỏ qua khi đơn đã được Webhook xử lý");
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("createCheckoutLink (RESCHEDULE_FEE): Khởi tạo giao dịch dời ngày nhận kho hợp lệ và tính đúng phí (BR-RES-06)")
    void createCheckoutLink_RescheduleFee_Success() {
        java.time.LocalDate startDate = java.time.LocalDate.now().plusDays(5);
        java.time.LocalDate newStartDate = startDate.plusDays(3);

        com.swp391.selfstorage.contract.entity.RentalContract contract = com.swp391.selfstorage.contract.entity.RentalContract.builder()
                .id(80050L)
                .code("CTR-80050")
                .status(com.swp391.selfstorage.contract.entity.ContractStatus.PENDING_CHECK_IN)
                .startDate(startDate)
                .monthlyPrice(900_000L)
                .rentalMonths(3)
                .rescheduleCount(0)
                .build();

        when(rentalContractRepository.findById(80050L)).thenReturn(Optional.of(contract));
        when(paymentGateway.createPayment(any())).thenReturn(PaymentCheckoutResult.builder()
                .orderCode(998877L)
                .amount(90_000L)
                .checkoutUrl("https://sandbox.vnpayment.vn/pay/998877")
                .description("DOI80050D3")
                .build());

        CheckoutRequest request = CheckoutRequest.builder()
                .referenceType("RESCHEDULE_FEE")
                .referenceId(80050L)
                .newStartDate(newStartDate)
                .build();

        CheckoutResponse response = paymentService.createCheckoutLink(request);

        assertNotNull(response);
        assertNotNull(response.getOrderCode());

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(captor.capture());
        PaymentTransaction saved = captor.getValue();
        assertEquals("RESCHEDULE_FEE", saved.getTransactionType());
        assertEquals(90_000L, saved.getAmount());
        assertEquals(newStartDate, saved.getRescheduledStartDate());
        assertEquals(80050L, saved.getContractId());
    }

    @Test
    @DisplayName("createCheckoutLink (RESCHEDULE_FEE): Chặn dời lịch khi hợp đồng đã dời 1 lần (BR-RES-06)")
    void createCheckoutLink_RescheduleFee_AlreadyRescheduled_ThrowsException() {
        java.time.LocalDate startDate = java.time.LocalDate.now().plusDays(5);
        java.time.LocalDate newStartDate = startDate.plusDays(2);

        com.swp391.selfstorage.contract.entity.RentalContract contract = com.swp391.selfstorage.contract.entity.RentalContract.builder()
                .id(80051L)
                .code("CTR-80051")
                .status(com.swp391.selfstorage.contract.entity.ContractStatus.PENDING_CHECK_IN)
                .startDate(startDate)
                .rescheduleCount(1)
                .build();

        when(rentalContractRepository.findById(80051L)).thenReturn(Optional.of(contract));

        CheckoutRequest request = CheckoutRequest.builder()
                .referenceType("RESCHEDULE_FEE")
                .referenceId(80051L)
                .newStartDate(newStartDate)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> paymentService.createCheckoutLink(request));
        assertTrue(ex.getMessage().contains("tối đa 1 lần duy nhất"));
    }
}

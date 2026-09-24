package com.swp391.selfstorage.payment.service.impl;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.payment.dto.CheckoutRequest;
import com.swp391.selfstorage.payment.dto.CheckoutResponse;
import com.swp391.selfstorage.payment.dto.CreatePaymentRequest;
import com.swp391.selfstorage.payment.dto.PaymentFilterRequest;
import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.event.PaymentCompletedEvent;
import com.swp391.selfstorage.payment.mapper.PaymentMapper;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.payment.service.PaymentService;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.reservation.service.ReservationService;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.WebhookData;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationService reservationService;
    private final ApplicationEventPublisher eventPublisher;
    private final PaymentMapper paymentMapper;
    private final PayOS payOS;

    @Value("${payos.return-url:http://localhost:5173/payment/success}")
    private String returnUrl = "http://localhost:5173/payment/success";

    @Value("${payos.cancel-url:http://localhost:5173/payment/cancel}")
    private String cancelUrl = "http://localhost:5173/payment/cancel";

    @Override
    @Transactional
    public CheckoutResponse createCheckoutLink(CheckoutRequest request) {
        log.info("Creating PayOS checkout link for referenceType={}, referenceId={}",
                request.getReferenceType(), request.getReferenceId());

        if (!"RESERVATION".equalsIgnoreCase(request.getReferenceType())) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Hiện tại hệ thống chỉ hỗ trợ thanh toán cho đơn đặt chỗ (RESERVATION)");
        }

        // 1. Kiểm tra đơn đặt chỗ có tồn tại không
        Reservation reservation = reservationRepository.findById(request.getReferenceId())
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        // 2. Kiểm tra trạng thái đơn
        if (reservation.getStatus() == ReservationStatus.FULFILLED) {
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED);
        }
        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT
                && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Đơn đặt chỗ không ở trạng thái chờ thanh toán");
        }

        // 3. Kiểm tra thời gian giữ chỗ 48h theo BR-DEP-03
        if (reservation.getHoldExpiresAt() != null
                && reservation.getHoldExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new CustomException(ErrorCode.RESERVATION_EXPIRED);
        }

        Long amount = reservation.getTotalPayable();
        // Sinh orderCode ngẫu nhiên duy nhất dựa trên thời gian
        Long orderCode = Long.parseLong(String.valueOf(System.currentTimeMillis()).substring(2)
                + String.format("%02d", (int) (Math.random() * 100)));

        String description = request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription()
                : "DH" + reservation.getId();
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }

        CreatePaymentLinkRequest paymentLinkRequest = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount)
                .description(description)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .build();

        CreatePaymentLinkResponse paymentLinkResponse;
        try {
            paymentLinkResponse = payOS.paymentRequests().create(paymentLinkRequest);
        } catch (Exception e) {
            log.error("Lỗi khi gọi API PayOS tạo payment link: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.PAYMENT_FAILED,
                    "Không thể kết nối cổng thanh toán PayOS: " + e.getMessage());
        }

        PaymentTransaction payment = PaymentTransaction.builder()
                .reservationId(reservation.getId())
                .transactionType("INITIAL_PAYMENT")
                .amount(amount)
                .status("PENDING")
                .paymentMethod("VIETQR_PAYOS")
                .orderCode(orderCode)
                .providerReference(paymentLinkResponse.getPaymentLinkId())
                .build();

        paymentTransactionRepository.save(payment);

        return CheckoutResponse.builder()
                .orderCode(orderCode)
                .checkoutUrl(paymentLinkResponse.getCheckoutUrl())
                .qrCode(paymentLinkResponse.getQrCode())
                .amount(paymentLinkResponse.getAmount())
                .description(paymentLinkResponse.getDescription())
                .accountName(paymentLinkResponse.getAccountName())
                .accountNumber(paymentLinkResponse.getAccountNumber())
                .bin(paymentLinkResponse.getBin())
                .status("PENDING")
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse processPayOSWebhook(Object webhookBody) {
        log.info("Processing PayOS Webhook...");
        WebhookData webhookData;
        try {
            webhookData = payOS.webhooks().verify(webhookBody);
        } catch (Exception e) {
            log.error("Xác thực chữ ký Webhook PayOS thất bại: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Chữ ký webhook PayOS không hợp lệ: " + e.getMessage());
        }

        Long orderCode = webhookData.getOrderCode();
        PaymentTransaction payment = paymentTransactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND,
                        "Không tìm thấy giao dịch tương ứng với orderCode=" + orderCode));

        // Idempotency check: nếu đã SUCCESS thì bỏ qua, không xử lý lặp
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            log.info("Giao dịch orderCode={} đã ở trạng thái SUCCESS, bỏ qua xử lý lặp", orderCode);
            return paymentMapper.toResponse(payment);
        }

        payment.setStatus("SUCCESS");
        if (webhookData.getReference() != null) {
            payment.setProviderReference(webhookData.getReference());
        }
        payment = paymentTransactionRepository.save(payment);

        if (payment.getReservationId() != null) {
            reservationService.confirmAfterPayment(payment.getReservationId());
            eventPublisher.publishEvent(new PaymentCompletedEvent(payment.getReservationId(), payment.getId()));
        }

        return paymentMapper.toResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentByOrderCode(Long orderCode) {
        PaymentTransaction payment = paymentTransactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND,
                        "Không tìm thấy giao dịch với orderCode=" + orderCode));
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional
    public PaymentResponse processPayment(CreatePaymentRequest request) {
        log.info("Processing payment for referenceType={}, referenceId={}, amount={}",
                request.getReferenceType(), request.getReferenceId(), request.getAmount());

        if (!"RESERVATION".equalsIgnoreCase(request.getReferenceType())) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Hiện tại hệ thống chỉ hỗ trợ thanh toán cho đơn đặt chỗ (RESERVATION)");
        }

        // 1. Kiểm tra đơn đặt chỗ có tồn tại không
        Reservation reservation = reservationRepository.findById(request.getReferenceId())
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

        // 2. Kiểm tra trạng thái đơn
        if (reservation.getStatus() == ReservationStatus.FULFILLED) {
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED);
        }
        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT
                && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Đơn đặt chỗ không ở trạng thái chờ thanh toán");
        }

        // 3. Kiểm tra thời gian giữ chỗ 48h theo BR-DEP-03
        if (reservation.getHoldExpiresAt() != null
                && reservation.getHoldExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new CustomException(ErrorCode.RESERVATION_EXPIRED);
        }

        // 4. Kiểm tra số tiền khớp với tổng phải trả theo BR-DEP-01, BR-DEP-02
        if (request.getAmount() != reservation.getTotalPayable()) {
            throw new CustomException(ErrorCode.AMOUNT_MISMATCH,
                    String.format("Số tiền thanh toán (%dđ) không khớp với số tiền phải trả (%dđ)",
                            request.getAmount(), reservation.getTotalPayable()));
        }

        // 5. Lưu bản ghi PaymentTransaction
        PaymentTransaction payment = PaymentTransaction.builder()
                .reservationId(reservation.getId())
                .transactionType("INITIAL_PAYMENT")
                .amount(request.getAmount())
                .status("SUCCESS")
                .paymentMethod(request.getMethod())
                .providerReference(request.getTransactionRef() != null ? request.getTransactionRef()
                        : "PAY-" + System.currentTimeMillis())
                .build();

        payment = paymentTransactionRepository.save(payment);
        log.info("PaymentTransaction saved successfully with id={}", payment.getId());

        // 6. Gọi ReservationService để xác nhận giữ chỗ nguyên tử (BR-PAY-02)
        reservationService.confirmAfterPayment(reservation.getId());

        // 7. Phát sự kiện để module Contract (WS2) tự động sinh RentalContract sau khi
        // commit
        eventPublisher.publishEvent(new PaymentCompletedEvent(reservation.getId(), payment.getId()));

        return paymentMapper.toResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentById(Long id) {
        PaymentTransaction payment = paymentTransactionRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND));
        return paymentMapper.toResponse(payment);
    }

    @Override
    public PageResponse<PaymentResponse> getPayments(PaymentFilterRequest filter, Pageable pageable) {
        Specification<PaymentTransaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter != null) {
                if (filter.getReferenceType() != null && !filter.getReferenceType().isBlank()) {
                    predicates.add(cb.equal(root.get("transactionType"), filter.getReferenceType()));
                }
                if (filter.getReferenceId() != null) {
                    predicates.add(cb.or(
                            cb.equal(root.get("reservationId"), filter.getReferenceId()),
                            cb.equal(root.get("contractId"), filter.getReferenceId())));
                }
                if (filter.getStatus() != null && !filter.getStatus().isBlank()) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PaymentTransaction> page = paymentTransactionRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(paymentMapper::toResponse));
    }
}

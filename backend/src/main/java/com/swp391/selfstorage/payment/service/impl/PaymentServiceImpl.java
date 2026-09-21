package com.swp391.selfstorage.payment.service.impl;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
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

package com.swp391.selfstorage.payment.service.impl;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
import java.util.Map;
import com.swp391.selfstorage.payment.gateway.PaymentGateway;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutCommand;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutResult;

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
    private final com.swp391.selfstorage.contract.repository.RentalContractRepository rentalContractRepository;
    private final com.swp391.selfstorage.contract.service.RenewalService renewalService;
    private final ApplicationEventPublisher eventPublisher;
    private final PaymentMapper paymentMapper;
    private final PaymentGateway paymentGateway;

    @Override
    @Transactional
    public CheckoutResponse createCheckoutLink(CheckoutRequest request) {
        log.info("Creating PayOS checkout link for referenceType={}, referenceId={}",
                request.getReferenceType(), request.getReferenceId());

        Long amount;
        String defaultDesc;
        Long reservationId = null;
        Long contractId = null;
        String txnType;

        if ("RESERVATION".equalsIgnoreCase(request.getReferenceType())) {
            Reservation reservation = reservationRepository.findById(request.getReferenceId())
                    .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));

            if (reservation.getStatus() == ReservationStatus.FULFILLED) {
                throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED);
            }
            if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT
                    && reservation.getStatus() != ReservationStatus.CONFIRMED) {
                throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                        "Đơn đặt chỗ không ở trạng thái chờ thanh toán");
            }
            if (reservation.getHoldExpiresAt() != null
                    && reservation.getHoldExpiresAt().isBefore(OffsetDateTime.now())) {
                throw new CustomException(ErrorCode.RESERVATION_EXPIRED);
            }

            if (reservation.getTotalPayable() <= 0) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Tổng số tiền phải trả không hợp lệ");
            }

            amount = reservation.getTotalPayable();
            defaultDesc = "DH" + reservation.getId();
            reservationId = reservation.getId();
            txnType = "INITIAL_PAYMENT";
        } else if ("CONTRACT_RENEWAL".equalsIgnoreCase(request.getReferenceType())
                || "CONTRACT_EXTENSION".equalsIgnoreCase(request.getReferenceType())) {
            com.swp391.selfstorage.contract.entity.RentalContract contract = rentalContractRepository.findById(request.getReferenceId())
                    .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND,
                            "Không tìm thấy hợp đồng với ID=" + request.getReferenceId()));

            int months = (request.getRenewalMonths() != null && request.getRenewalMonths() > 0)
                    ? request.getRenewalMonths()
                    : 1;

            com.swp391.selfstorage.contract.dto.RenewalQuoteResponse quote = renewalService.getRenewalQuote(
                    contract.getId(), new com.swp391.selfstorage.contract.dto.RenewalRequest(months));

            amount = quote.getTotalAmount();
            defaultDesc = "GH" + contract.getId() + "T" + months;
            contractId = contract.getId();
            txnType = "CONTRACT_RENEWAL";
        } else if ("SETTLEMENT".equalsIgnoreCase(request.getReferenceType())) {
            com.swp391.selfstorage.contract.entity.RentalContract contract = rentalContractRepository.findById(request.getReferenceId())
                    .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND,
                            "Không tìm thấy hợp đồng với ID=" + request.getReferenceId()));

            Optional<PaymentTransaction> pendingTxn = paymentTransactionRepository
                    .findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(contract.getId(), "SETTLEMENT");

            if (pendingTxn.isEmpty() || !"PENDING".equals(pendingTxn.get().getStatus())) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Hợp đồng không có khoản nợ quyết toán cần thanh toán");
            }

            amount = pendingTxn.get().getAmount();
            defaultDesc = "QT" + contract.getId();
            contractId = contract.getId();
            txnType = "SETTLEMENT";
        } else if ("OVERDUE_PENALTY".equalsIgnoreCase(request.getReferenceType())) {
            com.swp391.selfstorage.contract.entity.RentalContract contract = rentalContractRepository.findById(request.getReferenceId())
                    .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND,
                            "Không tìm thấy hợp đồng với ID=" + request.getReferenceId()));

            if (contract.getOverdueFeeAccrued() <= 0) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Hợp đồng không có nợ phạt quá hạn cần thanh toán");
            }

            amount = contract.getOverdueFeeAccrued();
            defaultDesc = "PHAT" + contract.getId();
            contractId = contract.getId();
            txnType = "OVERDUE_PENALTY";
        } else {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Loại thanh toán không được hỗ trợ: " + request.getReferenceType());
        }

        // Sinh orderCode ngẫu nhiên duy nhất dựa trên thời gian
        Long orderCode = Long.parseLong(String.valueOf(System.currentTimeMillis()).substring(2)
                + String.format("%02d", (int) (Math.random() * 100)));

        String description = request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription()
                : defaultDesc;
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }

        PaymentCheckoutResult checkoutResult = paymentGateway.createPayment(
                PaymentCheckoutCommand.builder()
                        .orderCode(orderCode)
                        .amount(amount)
                        .description(description)
                        .build());

        PaymentTransaction payment = PaymentTransaction.builder()
                .reservationId(reservationId)
                .contractId(contractId)
                .transactionType(txnType)
                .amount(amount)
                .status("PENDING")
                .paymentMethod("SANDBOX_VIETQR")
                .orderCode(orderCode)
                .providerReference("SBX-" + orderCode)
                .build();

        paymentTransactionRepository.save(payment);

        return CheckoutResponse.builder()
                .orderCode(orderCode)
                .checkoutUrl(checkoutResult.getCheckoutUrl())
                .qrCode(checkoutResult.getQrCode())
                .amount(checkoutResult.getAmount())
                .description(checkoutResult.getDescription())
                .accountName(checkoutResult.getAccountName())
                .accountNumber(checkoutResult.getAccountNumber())
                .bin(checkoutResult.getBin())
                .status("PENDING")
                .build();
    }


    @Override
    @Transactional
    public PaymentResponse processSandboxTransfer(Long orderCode, String action) {
        log.info("Processing Sandbox transfer for orderCode={}, action={}", orderCode, action);
        PaymentTransaction payment = paymentTransactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND,
                        "Không tìm thấy giao dịch với orderCode=" + orderCode));

        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            log.info("Giao dịch orderCode={} đã ở trạng thái SUCCESS, bỏ qua xử lý lặp", orderCode);
            return paymentMapper.toResponse(payment);
        }

        if ("CANCEL".equalsIgnoreCase(action)) {
            payment.setStatus("FAILED");
            payment = paymentTransactionRepository.save(payment);
            return paymentMapper.toResponse(payment);
        }

        payment.setStatus("SUCCESS");
        payment.setProviderReference("SANDBOX-" + System.currentTimeMillis());
        payment = paymentTransactionRepository.save(payment);

        if (payment.getReservationId() != null) {
            reservationService.confirmAfterPayment(payment.getReservationId());
            eventPublisher.publishEvent(new PaymentCompletedEvent(payment.getReservationId(), payment.getId()));
        } else if (payment.getContractId() != null
                && "CONTRACT_RENEWAL".equalsIgnoreCase(payment.getTransactionType())) {
            int months = 1;
            eventPublisher.publishEvent(new com.swp391.selfstorage.payment.event.ContractRenewalPaymentCompletedEvent(
                    payment.getContractId(), payment.getId(), months, payment.getAmount()));
        } else if ("SETTLEMENT".equalsIgnoreCase(payment.getTransactionType())) {
            log.info("Thanh toán quyết toán thu nợ Sandbox thành công cho contractId={}, transactionId={}",
                    payment.getContractId(), payment.getId());
        } else if ("OVERDUE_PENALTY".equalsIgnoreCase(payment.getTransactionType())
                || "EXTRA_FEE_PAYMENT".equalsIgnoreCase(payment.getTransactionType())) {
            if (payment.getContractId() != null) {
                rentalContractRepository.findById(payment.getContractId()).ifPresent(c -> {
                    c.setOverdueFeeAccrued(0L);
                    rentalContractRepository.save(c);
                    log.info("Thanh toán nợ phạt Sandbox thành công: Đã xóa nợ phạt về 0 cho contractId={}", c.getId());
                });
            }
        }

        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public PaymentResponse processPayOSWebhook(Object webhookBody) {
        log.info("Processing Payment Webhook...");
        Long orderCode = null;
        String code = "00";
        String reference = null;
        String description = null;

        if (webhookBody instanceof Map<?, ?> map) {
            Object codeObj = map.get("code");
            code = codeObj != null ? String.valueOf(codeObj) : "00";
            Object dataObj = map.get("data");
            if (dataObj instanceof Map<?, ?> dataMap) {
                Object oc = dataMap.get("orderCode");
                if (oc instanceof Number num) {
                    orderCode = num.longValue();
                } else if (oc != null) {
                    orderCode = Long.parseLong(oc.toString());
                }
                Object ref = dataMap.get("reference");
                if (ref != null) reference = ref.toString();
                Object desc = dataMap.get("description");
                if (desc != null) description = desc.toString();
            } else {
                Object oc = map.get("orderCode");
                if (oc instanceof Number num) {
                    orderCode = num.longValue();
                } else if (oc != null) {
                    orderCode = Long.parseLong(oc.toString());
                }
            }
        }

        if (orderCode == null) {
            log.info("Nhận webhook ping test hoặc payload không có orderCode. Trả lời HTTP 200 OK.");
            return PaymentResponse.builder()
                    .status("SUCCESS")
                    .build();
        }

        PaymentTransaction payment = paymentTransactionRepository.findByOrderCode(orderCode)
                .orElse(null);

        if (payment == null) {
            log.info("orderCode={} không tồn tại trong hệ thống. Trả lời HTTP 200 OK.", orderCode);
            return PaymentResponse.builder()
                    .orderCode(orderCode)
                    .status("SUCCESS")
                    .build();
        }

        if (!"00".equals(code)) {
            log.warn("Thanh toán không thành công cho orderCode={}: code={}", orderCode, code);
            payment.setStatus("FAILED");
            if (reference != null) payment.setProviderReference(reference);
            payment = paymentTransactionRepository.save(payment);
            return paymentMapper.toResponse(payment);
        }

        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            log.info("Giao dịch orderCode={} đã ở trạng thái SUCCESS, bỏ qua xử lý lặp", orderCode);
            return paymentMapper.toResponse(payment);
        }

        payment.setStatus("SUCCESS");
        payment.setProviderReference(reference != null ? reference : "SANDBOX-" + System.currentTimeMillis());
        payment = paymentTransactionRepository.save(payment);

        if (payment.getReservationId() != null) {
            reservationService.confirmAfterPayment(payment.getReservationId());
            eventPublisher.publishEvent(new PaymentCompletedEvent(payment.getReservationId(), payment.getId()));
        } else if (payment.getContractId() != null
                && "CONTRACT_RENEWAL".equalsIgnoreCase(payment.getTransactionType())) {
            int months = 1;
            if (description != null && description.contains("T")) {
                try {
                    String part = description.substring(description.indexOf("T") + 1);
                    months = Integer.parseInt(part.replaceAll("\\D", ""));
                } catch (Exception ignored) {
                    months = 1;
                }
            }
            eventPublisher.publishEvent(new com.swp391.selfstorage.payment.event.ContractRenewalPaymentCompletedEvent(
                    payment.getContractId(), payment.getId(), months, payment.getAmount()));
        } else if ("SETTLEMENT".equalsIgnoreCase(payment.getTransactionType())) {
            log.info("Thanh toán quyết toán thu nợ PayOS thành công cho contractId={}, transactionId={}",
                    payment.getContractId(), payment.getId());
        } else if ("OVERDUE_PENALTY".equalsIgnoreCase(payment.getTransactionType())
                || "EXTRA_FEE_PAYMENT".equalsIgnoreCase(payment.getTransactionType())) {
            if (payment.getContractId() != null) {
                rentalContractRepository.findById(payment.getContractId()).ifPresent(c -> {
                    c.setOverdueFeeAccrued(0L);
                    rentalContractRepository.save(c);
                    log.info("PayOS Webhook: Đã xóa nợ phạt quá hạn về 0 cho contractId={}", c.getId());
                });
            }
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

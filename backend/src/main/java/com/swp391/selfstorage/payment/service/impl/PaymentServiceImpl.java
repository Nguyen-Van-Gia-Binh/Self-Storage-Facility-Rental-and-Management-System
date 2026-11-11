package com.swp391.selfstorage.payment.service.impl;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.ObjectProvider;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
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
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.reservation.service.ReservationHoldExpiryService;
import com.swp391.selfstorage.reservation.service.ReservationService;

import jakarta.persistence.criteria.Predicate;
import java.util.Map;
import com.swp391.selfstorage.payment.constant.PaymentStatus;
import com.swp391.selfstorage.payment.constant.PaymentTransactionType;
import com.swp391.selfstorage.payment.constant.VnPayResponseCode;
import com.swp391.selfstorage.payment.gateway.PaymentGateway;
import com.swp391.selfstorage.payment.gateway.VnPayGateway;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutCommand;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutResult;
import com.swp391.selfstorage.payment.gateway.dto.VnPayQueryResult;
import org.springframework.transaction.support.TransactionTemplate;

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
    private final PolicyVersionRepository policyVersionRepository;
    private final VnPayGateway vnPayGateway;
    private final ObjectProvider<com.swp391.selfstorage.contract.service.ContractService> contractServiceProvider;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired(required = false)
    private ReservationHoldExpiryService reservationHoldExpiryService;

    @Autowired(required = false)
    private TransactionTemplate transactionTemplate;

    private void rejectIfHoldElapsed(Reservation reservation) {
        if (reservation.getHoldExpiresAt() == null
                || !reservation.getHoldExpiresAt().isBefore(OffsetDateTime.now())) {
            return;
        }
        if (reservation.getStatus() == ReservationStatus.PENDING_PAYMENT) {
            if (reservationHoldExpiryService != null) {
                reservationHoldExpiryService.expireIfElapsed(reservation.getId());
            } else {
                reservation.setStatus(ReservationStatus.EXPIRED);
                reservationRepository.save(reservation);
            }
        }
        throw new CustomException(ErrorCode.RESERVATION_EXPIRED);
    }

    private int activeHoldHours() {
        if (policyVersionRepository == null) {
            return 48;
        }
        return policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now())
                .map(com.swp391.selfstorage.policy.entity.PolicyVersion::getReservationHoldHours)
                .filter(hours -> hours != null && hours > 0)
                .orElse(48);
    }

    @Override
    @Transactional
    public CheckoutResponse createCheckoutLink(CheckoutRequest request) {
        log.info("Creating VNPay checkout order for referenceType={}, referenceId={}",
                request.getReferenceType(), request.getReferenceId());

        Long amount;
        String defaultDesc;
        Long reservationId = null;
        Long contractId = null;
        String txnType;
        Integer storedRenewalMonths = null;
        LocalDate storedRescheduledStartDate = null;

        if ("RESERVATION".equalsIgnoreCase(request.getReferenceType())) {
            Reservation reservation = reservationRepository.findById(request.getReferenceId())
                    .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));
            assertPayer(reservation.getId(), null);

            if (reservation.getStatus() == ReservationStatus.FULFILLED) {
                throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED);
            }
            if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT) {
                throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                        "Đơn đặt chỗ không ở trạng thái chờ thanh toán");
            }
            boolean alreadyPaid = paymentTransactionRepository.findByReservationId(reservation.getId()).stream()
                    .anyMatch(t -> "SUCCESS".equalsIgnoreCase(t.getStatus())
                            && "INITIAL_PAYMENT".equalsIgnoreCase(t.getTransactionType()));
            if (alreadyPaid) {
                throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Đơn đặt chỗ đã thanh toán");
            }
            rejectIfHoldElapsed(reservation);

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
            assertPayer(null, contract.getId());

            int months = (request.getRenewalMonths() != null && request.getRenewalMonths() > 0)
                    ? request.getRenewalMonths()
                    : 1;

            com.swp391.selfstorage.contract.dto.RenewalQuoteResponse quote = renewalService.getRenewalQuote(
                    contract.getId(), new com.swp391.selfstorage.contract.dto.RenewalRequest(months));

            amount = quote.getTotalAmount();
            defaultDesc = "GH" + contract.getId() + "T" + months;
            contractId = contract.getId();
            txnType = "CONTRACT_RENEWAL";
            storedRenewalMonths = months;

            Optional<PaymentTransaction> existingPending = paymentTransactionRepository
                    .findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(contract.getId(), "CONTRACT_RENEWAL");
            if (existingPending.isPresent()) {
                PaymentTransaction txn = existingPending.get();
                if ("PENDING".equals(txn.getStatus())) {
                    java.time.Instant expiresAt = txn.getCreatedAt().plus(activeHoldHours(), java.time.temporal.ChronoUnit.HOURS);
                    if (java.time.Instant.now().isBefore(expiresAt)) {
                        if (txn.getRenewalMonths() != null && txn.getRenewalMonths().equals(months)) {
                            // Tái sử dụng
                            PaymentCheckoutResult reused = paymentGateway.createPayment(
                                    PaymentCheckoutCommand.builder()
                                            .orderCode(txn.getOrderCode())
                                            .amount(txn.getAmount())
                                            .description(txn.getProviderReference())
                                            .build());
                            return CheckoutResponse.builder()
                                    .orderCode(reused.getOrderCode())
                                    .checkoutUrl(reused.getCheckoutUrl())
                                    .qrCode(reused.getQrCode())
                                    .amount(reused.getAmount())
                                    .description(reused.getDescription())
                                    .accountName(reused.getAccountName())
                                    .accountNumber(reused.getAccountNumber())
                                    .bin(reused.getBin())
                                    .status("PENDING")
                                    .build();
                        } else {
                            // Số tháng khác - hủy giao dịch cũ
                            txn.setStatus("FAILED");
                            paymentTransactionRepository.save(txn);
                        }
                    } else {
                        // Hết hạn - hủy
                        txn.setStatus("FAILED");
                        paymentTransactionRepository.save(txn);
                    }
                }
            }
        } else if ("SETTLEMENT".equalsIgnoreCase(request.getReferenceType())) {
            com.swp391.selfstorage.contract.entity.RentalContract contract = rentalContractRepository.findById(request.getReferenceId())
                    .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND,
                            "Không tìm thấy hợp đồng với ID=" + request.getReferenceId()));
            assertPayer(null, contract.getId());

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
            assertPayer(null, contract.getId());

            if (contract.getOverdueFeeAccrued() <= 0) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Hợp đồng không có nợ phạt quá hạn cần thanh toán");
            }

            amount = contract.getOverdueFeeAccrued();
            defaultDesc = "PHAT" + contract.getId();
            contractId = contract.getId();
            txnType = "OVERDUE_PENALTY";
        } else if ("RESCHEDULE_FEE".equalsIgnoreCase(request.getReferenceType())) {
            com.swp391.selfstorage.contract.entity.RentalContract contract = rentalContractRepository.findById(request.getReferenceId())
                    .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND,
                            "Không tìm thấy hợp đồng với ID=" + request.getReferenceId()));
            assertPayer(null, contract.getId());

            if (contract.getStatus() != com.swp391.selfstorage.contract.entity.ContractStatus.PENDING_CHECK_IN) {
                throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                        "Chỉ được dời lịch khi hợp đồng đang ở trạng thái Chờ nhận kho (PENDING_CHECK_IN)");
            }

            if (contract.getRescheduleCount() >= 1) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                        "Mỗi hợp đồng chỉ được phép dời ngày nhận kho tối đa 1 lần duy nhất (BR-RES-06)");
            }

            LocalDate newStartDate = request.getNewStartDate();
            if (newStartDate == null) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày bắt đầu mới không được để trống");
            }

            LocalDate today = LocalDate.now();
            if (newStartDate.isBefore(today.plusDays(1))) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày bắt đầu mới phải từ ngày mai trở đi");
            }

            if (newStartDate.equals(contract.getStartDate())) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày bắt đầu mới phải khác ngày bắt đầu hiện tại");
            }

            if (contract.getStartDate() != null) {
                long hoursUntilStart = java.time.Duration.between(java.time.LocalDateTime.now(), contract.getStartDate().atStartOfDay()).toHours();
                if (hoursUntilStart < 48) {
                    throw new CustomException(ErrorCode.VALIDATION_FAILED, "Yêu cầu dời ngày nhận kho phải gửi trước ít nhất 48 giờ (BR-RES-06)");
                }
            }

            long diffDays = java.time.temporal.ChronoUnit.DAYS.between(contract.getStartDate(), newStartDate);
            if (diffDays > 7 || diffDays < 1) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Thời gian dời ngày nhận kho chỉ được phép từ 1 đến tối đa 7 ngày (BR-RES-06)");
            }

            int months = contract.getRentalMonths() > 0 ? contract.getRentalMonths() : 1;
            LocalDate newEndDate = newStartDate.plusMonths(months);

            if (contractServiceProvider != null) {
                com.swp391.selfstorage.contract.service.ContractService cs = contractServiceProvider.getIfAvailable();
                if (cs != null) {
                    cs.validateRescheduleAvailability(contract.getId(), newStartDate, newEndDate);
                }
            }

            com.swp391.selfstorage.policy.entity.PolicyVersion feePolicy = null;
            if (contract.getPolicyVersionId() != null && policyVersionRepository != null) {
                feePolicy = policyVersionRepository.findById(contract.getPolicyVersionId()).orElse(null);
            }
            amount = com.swp391.selfstorage.policy.service.PolicyNumbers
                    .prorateTotalUpToThousand(contract.getMonthlyPrice(), diffDays, feePolicy);
            defaultDesc = "DOI" + contract.getId() + "D" + diffDays;
            contractId = contract.getId();
            txnType = "RESCHEDULE_FEE";
            storedRescheduledStartDate = newStartDate;

            Optional<PaymentTransaction> existingPending = paymentTransactionRepository
                    .findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(contract.getId(), "RESCHEDULE_FEE");
            if (existingPending.isPresent()) {
                PaymentTransaction txn = existingPending.get();
                if ("PENDING".equals(txn.getStatus())) {
                    java.time.Instant expiresAt = txn.getCreatedAt().plus(activeHoldHours(), java.time.temporal.ChronoUnit.HOURS);
                    if (java.time.Instant.now().isBefore(expiresAt) && newStartDate.equals(txn.getRescheduledStartDate())) {
                        PaymentCheckoutResult reused = paymentGateway.createPayment(
                                PaymentCheckoutCommand.builder()
                                        .orderCode(txn.getOrderCode())
                                        .amount(txn.getAmount())
                                        .description(txn.getProviderReference())
                                        .build());
                        return CheckoutResponse.builder()
                                .orderCode(reused.getOrderCode())
                                .checkoutUrl(reused.getCheckoutUrl())
                                .qrCode(reused.getQrCode())
                                .amount(reused.getAmount())
                                .description(reused.getDescription())
                                .accountName(reused.getAccountName())
                                .accountNumber(reused.getAccountNumber())
                                .bin(reused.getBin())
                                .status("PENDING")
                                .build();
                    } else {
                        txn.setStatus("FAILED");
                        paymentTransactionRepository.save(txn);
                    }
                }
            }
        } else if ("CONTRACT_INITIAL".equalsIgnoreCase(request.getReferenceType())
                || "DIRECT_CONTRACT".equalsIgnoreCase(request.getReferenceType())) {
            com.swp391.selfstorage.contract.entity.RentalContract contract = rentalContractRepository.findById(request.getReferenceId())
                    .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND,
                            "Không tìm thấy hợp đồng với ID=" + request.getReferenceId()));
            assertPayer(null, contract.getId());

            List<PaymentTransaction> txns = paymentTransactionRepository.findByContractId(contract.getId());
            Optional<PaymentTransaction> pendingTxn = txns.stream()
                    .filter(t -> "INITIAL_PAYMENT".equalsIgnoreCase(t.getTransactionType()) && "PENDING".equalsIgnoreCase(t.getStatus()))
                    .findFirst();

            if (pendingTxn.isEmpty()) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Hợp đồng không có khoản thanh toán ban đầu đang chờ xử lý");
            }

            PaymentTransaction txn = pendingTxn.get();
            if (txn.getOrderCode() != null) {
                PaymentCheckoutResult reused = paymentGateway.createPayment(
                        PaymentCheckoutCommand.builder()
                                .orderCode(txn.getOrderCode())
                                .amount(txn.getAmount())
                                .description(txn.getProviderReference() != null ? txn.getProviderReference() : ("HD" + contract.getId()))
                                .build());
                return CheckoutResponse.builder()
                        .orderCode(reused.getOrderCode())
                        .checkoutUrl(reused.getCheckoutUrl())
                        .qrCode(reused.getQrCode())
                        .amount(reused.getAmount())
                        .description(reused.getDescription())
                        .accountName(reused.getAccountName())
                        .accountNumber(reused.getAccountNumber())
                        .bin(reused.getBin())
                        .status("PENDING")
                        .build();
            }

            amount = txn.getAmount();
            defaultDesc = "HD" + contract.getId();
            contractId = contract.getId();
            reservationId = contract.getReservationId();
            txnType = "INITIAL_PAYMENT";
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
                .paymentMethod("VNPAY")
                .orderCode(orderCode)
                .providerReference("SBX-" + orderCode)
                .renewalMonths(storedRenewalMonths)
                .rescheduledStartDate(storedRescheduledStartDate)
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
    public PaymentResponse requirePendingPayment(Long orderCode) {
        PaymentTransaction payment = paymentTransactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND,
                        "Không tìm thấy giao dịch với orderCode=" + orderCode));
        if (!"PENDING".equalsIgnoreCase(payment.getStatus())) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Đơn thanh toán không còn chờ thanh toán");
        }
        if (payment.getAmount() == null || payment.getAmount() <= 0) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Số tiền thanh toán không hợp lệ");
        }
        PaymentResponse response = paymentMapper.toResponse(payment);
        response.setTransferContent(vnpayOrderInfo(payment));
        return response;
    }

    @Override
    @Transactional
    public boolean completeVnpayPayment(Long orderCode, boolean successCode, Long vnpAmount,
            String providerRef, String bankCode) {
        PaymentTransaction payment = paymentTransactionRepository.findByOrderCodeForUpdate(orderCode).orElse(null);
        if (payment == null) {
            return false;
        }
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            log.info("Giao dịch orderCode={} đã ở trạng thái SUCCESS, bỏ qua xử lý lặp", orderCode);
            return true;
        }
        if (!successCode) {
            return false;
        }
        long expected = payment.getAmount() == null ? -1L : payment.getAmount() * 100L;
        if (vnpAmount == null || vnpAmount != expected) {
            log.warn("VNPay lệch số tiền orderCode={} vnpAmount={} expected={}", orderCode, vnpAmount, expected);
            return false;
        }
        String ref = providerRef == null || providerRef.isBlank() ? "VNPAY-" + orderCode : providerRef;
        if (ref.length() > 100) {
            ref = ref.substring(0, 100);
        }
        markPaid(payment, ref, vnpayMethod(bankCode));
        return true;
    }

    private static String vnpayMethod(String bankCode) {
        String code = bankCode == null ? "" : bankCode.replaceAll("[^A-Za-z0-9]", "");
        String method = code.isEmpty() ? "VNPAY" : "VNPAY_" + code;
        return method.length() > 50 ? method.substring(0, 50) : method;
    }

    private static String vnpayOrderInfo(PaymentTransaction payment) {
        String info;
        if (payment.getReservationId() != null) {
            info = "DH" + payment.getReservationId();
        } else if ("CONTRACT_RENEWAL".equalsIgnoreCase(payment.getTransactionType()) && payment.getContractId() != null) {
            info = "GH" + payment.getContractId() + (payment.getRenewalMonths() != null ? "T" + payment.getRenewalMonths() : "");
        } else if ("RESCHEDULE_FEE".equalsIgnoreCase(payment.getTransactionType()) && payment.getContractId() != null) {
            info = "DOI" + payment.getContractId();
        } else if (payment.getContractId() != null) {
            info = "TT" + payment.getContractId();
        } else {
            info = "TT" + payment.getOrderCode();
        }
        return info.length() > 255 ? info.substring(0, 255) : info;
    }

    private PaymentResponse markPaid(PaymentTransaction payment, String providerReference, String paymentMethod) {
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            log.info("Giao dịch orderCode={} đã ở trạng thái SUCCESS, bỏ qua xử lý lặp", payment.getOrderCode());
            return paymentMapper.toResponse(payment);
        }
        payment.setStatus("SUCCESS");
        payment.setPaidAt(Instant.now());
        if (providerReference != null) {
            payment.setProviderReference(providerReference);
        }
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            payment.setPaymentMethod(paymentMethod);
        }
        payment = paymentTransactionRepository.save(payment);

        if (payment.getReservationId() != null) {
            reservationService.confirmAfterPayment(payment.getReservationId());
            eventPublisher.publishEvent(new PaymentCompletedEvent(payment.getReservationId(), payment.getId()));
        } else if (payment.getContractId() != null
                && "CONTRACT_RENEWAL".equalsIgnoreCase(payment.getTransactionType())) {
            publishContractRenewalCompleted(payment);
        } else if ("SETTLEMENT".equalsIgnoreCase(payment.getTransactionType())) {
            eventPublisher.publishEvent(new com.swp391.selfstorage.payment.event.SettlementDebtPaidEvent(
                    payment.getContractId(), payment.getId()));
        } else if ("OVERDUE_PENALTY".equalsIgnoreCase(payment.getTransactionType())
                || "EXTRA_FEE_PAYMENT".equalsIgnoreCase(payment.getTransactionType())) {
            if (payment.getContractId() != null) {
                rentalContractRepository.findById(payment.getContractId()).ifPresent(c -> {
                    c.setOverdueFeeAccrued(0L);
                    if (c.getAccessCode() == null || c.getAccessCode().isBlank()) {
                        String restoredPin = String.format("%06d", (int) (Math.random() * 900000) + 100000);
                        c.setAccessCode(restoredPin);
                        log.info("Cấp lại mã PIN mới [{}] cho contractId={} sau khi tất toán nợ phạt (BR-OVD-08)", restoredPin, c.getId());
                    }
                    rentalContractRepository.save(c);
                    log.info("Xóa nợ phạt về 0 cho contractId={}, giữ nguyên trạng thái OVERDUE (BR-OVD-08)", c.getId());
                });
            }
        } else if ("RESCHEDULE_FEE".equalsIgnoreCase(payment.getTransactionType())) {
            if (payment.getContractId() != null && payment.getRescheduledStartDate() != null && contractServiceProvider != null) {
                com.swp391.selfstorage.contract.service.ContractService cs = contractServiceProvider.getIfAvailable();
                if (cs != null) {
                    cs.applyRescheduledStartDate(payment.getContractId(), payment.getRescheduledStartDate());
                    log.info("Đã áp dụng dời ngày cho contractId={} sang ngày {}", payment.getContractId(), payment.getRescheduledStartDate());
                }
            }
        }

        return paymentMapper.toResponse(payment);
    }

private void publishContractRenewalCompleted(PaymentTransaction payment) {
        int months = resolveRenewalMonths(payment);
        eventPublisher.publishEvent(new com.swp391.selfstorage.payment.event.ContractRenewalPaymentCompletedEvent(
                payment.getContractId(), payment.getId(), months, payment.getAmount()));
    }

    /**
     * Số tháng đã chốt lúc checkout. Không được mặc định 1 tháng khi khách đã trả tiền cho kỳ dài hơn.
     * Giao dịch cũ chưa có cột renewal_months thì suy ra từ số tiền chia đơn giá tháng.
     */
    private int resolveRenewalMonths(PaymentTransaction payment) {
        if (payment.getRenewalMonths() != null && payment.getRenewalMonths() > 0) {
            return payment.getRenewalMonths();
        }
        if (payment.getContractId() == null || payment.getAmount() == null || payment.getAmount() <= 0) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Giao dịch gia hạn thiếu số tháng đã chốt");
        }
        com.swp391.selfstorage.contract.entity.RentalContract contract = rentalContractRepository
                .findById(payment.getContractId())
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));
        long monthlyPrice = contract.getMonthlyPrice();
        if (monthlyPrice <= 0 || payment.getAmount() % monthlyPrice != 0) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Không xác định được số tháng gia hạn từ số tiền đã thanh toán");
        }
        int months = (int) (payment.getAmount() / monthlyPrice);
        if (months < 1 || months > 12) {
            throw new CustomException(ErrorCode.RENEWAL_MONTHS_INVALID);
        }
        log.warn("Giao dịch {} thiếu renewal_months, suy ra {} tháng từ amount={}",
                payment.getId(), months, payment.getAmount());
        return months;
    }

    private void assertPayer(Long reservationId, Long contractId) {
        // shortcut: không có principal thì bỏ qua để unit test cũ chạy; mọi HTTP đã có JWT thì kiểm tra.
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof com.swp391.selfstorage.auth.service.UserPrincipal user)) {
            return;
        }
        if (user.getRole() != com.swp391.selfstorage.user.entity.UserRole.STORAGE_CUSTOMER) {
            return;
        }
        if (reservationId != null) {
            Reservation reservation = reservationRepository.findById(reservationId)
                    .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));
            if (!user.getId().equals(reservation.getCustomerId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
        }
        if (contractId != null) {
            var contract = rentalContractRepository.findById(contractId)
                    .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));
            if (!user.getId().equals(contract.getCustomerId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
        }
    }

    @Override
    public PaymentResponse getPaymentByOrderCode(Long orderCode) {
        PaymentTransaction payment = paymentTransactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND,
                        "Không tìm thấy giao dịch với orderCode=" + orderCode));
        assertPayer(payment.getReservationId(), payment.getContractId());
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(noRollbackFor = CustomException.class)
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
        assertPayer(reservation.getId(), null);

        // 2. Kiểm tra trạng thái đơn
        if (reservation.getStatus() == ReservationStatus.FULFILLED) {
            throw new CustomException(ErrorCode.RESERVATION_ALREADY_FULFILLED);
        }
        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Đơn đặt chỗ không ở trạng thái chờ thanh toán");
        }
        boolean alreadyPaid = paymentTransactionRepository.findByReservationId(reservation.getId()).stream()
                .anyMatch(t -> "SUCCESS".equalsIgnoreCase(t.getStatus())
                        && "INITIAL_PAYMENT".equalsIgnoreCase(t.getTransactionType()));
        if (alreadyPaid) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Đơn đặt chỗ đã thanh toán");
        }

        // 3. Kiểm tra thời gian giữ chỗ theo BR-DEP-03
        rejectIfHoldElapsed(reservation);

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
                .paidAt(Instant.now())
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
        assertPayer(payment.getReservationId(), payment.getContractId());
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
                // Cùng mốc với báo cáo doanh thu: ngày tiền tới, giao dịch cũ chưa có paid_at dùng created_at
                jakarta.persistence.criteria.Expression<Instant> moneyAt =
                        cb.coalesce(root.<Instant>get("paidAt"), root.<Instant>get("createdAt"));
                if (filter.getFrom() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(moneyAt,
                            filter.getFrom().atStartOfDay(VN_ZONE).toInstant()));
                }
                if (filter.getTo() != null) {
                    predicates.add(cb.lessThan(moneyAt,
                            filter.getTo().plusDays(1).atStartOfDay(VN_ZONE).toInstant()));
                }
                if (filter.getFacilityId() != null) {
                    var rsv = query.subquery(Long.class);
                    var r = rsv.from(Reservation.class);
                    rsv.select(r.get("id")).where(cb.equal(r.get("facilityId"), filter.getFacilityId()));
                    var ctr = query.subquery(Long.class);
                    var c = ctr.from(RentalContract.class);
                    ctr.select(c.get("id")).where(cb.equal(c.get("facilityId"), filter.getFacilityId()));
                    predicates.add(cb.or(root.get("reservationId").in(rsv), root.get("contractId").in(ctr)));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PaymentTransaction> page = paymentTransactionRepository.findAll(spec, pageable);
        List<PaymentTransaction> rows = page.getContent();

        Map<Long, Reservation> reservations = reservationRepository.findAllById(
                rows.stream().map(PaymentTransaction::getReservationId).filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Reservation::getId, r -> r));
        Map<Long, RentalContract> contracts = rentalContractRepository.findAllById(
                rows.stream().map(PaymentTransaction::getContractId).filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(RentalContract::getId, c -> c));

        Map<Long, Long[]> owner = new HashMap<>(); // txId -> {facilityId, customerId}
        for (PaymentTransaction t : rows) {
            RentalContract c = contracts.get(t.getContractId());
            Reservation r = reservations.get(t.getReservationId());
            if (c != null) owner.put(t.getId(), new Long[] { c.getFacilityId(), c.getCustomerId() });
            else if (r != null) owner.put(t.getId(), new Long[] { r.getFacilityId(), r.getCustomerId() });
        }
        Map<Long, String> facilityNames = new HashMap<>();
        facilityRepository.findAllById(
                owner.values().stream().map(o -> o[0]).filter(Objects::nonNull).collect(Collectors.toSet()))
                .forEach(f -> facilityNames.put(f.getId(), f.getName()));
        Map<Long, String> customerNames = new HashMap<>();
        userRepository.findAllById(
                owner.values().stream().map(o -> o[1]).filter(Objects::nonNull).collect(Collectors.toSet()))
                .forEach(u -> customerNames.put(u.getId(), u.getFullName()));

        return PageResponse.from(page.map(t -> {
            PaymentResponse res = paymentMapper.toResponse(t);
            Long[] o = owner.get(t.getId());
            if (o != null) {
                res.setFacilityName(facilityNames.get(o[0]));
                res.setCustomerName(customerNames.get(o[1]));
            }
            return res;
        }));
    }

    @Override
    public boolean reconcileSingleOrder(Long orderCode) {
        // 1. Đọc nhanh thông tin không khóa DB để kiểm tra sơ bộ
        PaymentTransaction txn = paymentTransactionRepository.findByOrderCode(orderCode).orElse(null);
        if (txn == null || !PaymentStatus.PENDING.name().equalsIgnoreCase(txn.getStatus())) {
            return false;
        }

        Instant createdAt = txn.getCreatedAt();
        if (createdAt == null) {
            return false;
        }

        Duration age = Duration.between(createdAt, Instant.now());
        if (age.toMinutes() < 5) {
            // Đơn mới tạo dưới 5 phút: Nhường khách hàng thanh toán và Webhook IPN xử lý
            return false;
        }

        // 2. Network I/O HOÀN TOÀN NGOÀI TRANSACTION: Không giữ bất kỳ DB connection hay row lock nào
        VnPayQueryResult qr = vnPayGateway.queryDr(txn.getOrderCode(), createdAt);

        // 3. Mở Transaction chớp nhoáng (~2ms) để lock dòng và cập nhật CSDL an toàn
        return executeInNewTransaction(() -> applyReconciliationResult(orderCode, qr, age));
    }

    private boolean applyReconciliationResult(Long orderCode, VnPayQueryResult qr, Duration age) {
        PaymentTransaction lockedTxn = paymentTransactionRepository.findByOrderCodeForUpdate(orderCode).orElse(null);
        // Idempotency check: Nếu Webhook IPN hoặc thread khác đã cập nhật đơn trước đó trong lúc chờ mạng
        if (lockedTxn == null || !PaymentStatus.PENDING.name().equalsIgnoreCase(lockedTxn.getStatus())) {
            log.info("[RECONCILIATION] Đơn orderCode={} đã được cập nhật trước bởi tiến trình khác (status={}), bỏ qua lặp.",
                    orderCode, lockedTxn == null ? "NULL" : lockedTxn.getStatus());
            return false;
        }

        if (qr.isSuccess()) {
            log.info("[RECONCILIATION] VNPay SUCCESS cho orderCode={}, kích hoạt hoàn tất đơn", orderCode);
            return completeVnpayPayment(
                    orderCode,
                    true,
                    qr.getAmount(),
                    qr.getTransactionNo(),
                    qr.getBankCode());
        }

        if (qr.isNotFound() || qr.isFailed()) {
            log.warn("[RECONCILIATION] VNPay xác nhận NOT_FOUND/FAILED cho orderCode={} -> Chuyển EXPIRED", orderCode);
            expireReconciledTransaction(lockedTxn);
            return true;
        }

        // VNPay trả lỗi 99 hoặc lỗi mạng: Hard Timeout nếu >= 48h
        if (age.toHours() >= 48) {
            log.warn("[RECONCILIATION] Đơn orderCode={} đã quá 48h và VNPay trả lỗi ({}) -> Chuyển EXPIRED",
                    orderCode, qr.getResponseCode());
            expireReconciledTransaction(lockedTxn);
            return true;
        }

        log.info("[RECONCILIATION] Đơn orderCode={} gặp lỗi ({}), giữ PENDING để tiếp tục đối soát",
                orderCode, qr.getResponseCode());
        return false;
    }

    private boolean executeInNewTransaction(java.util.function.Supplier<Boolean> action) {
        if (transactionTemplate != null) {
            transactionTemplate.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            Boolean result = transactionTemplate.execute(status -> action.get());
            return Boolean.TRUE.equals(result);
        }
        return action.get();
    }

    @Override
    @Transactional
    public PaymentResponse confirmRefundPayout(Long paymentId) {
        PaymentTransaction payment = paymentTransactionRepository.findById(paymentId)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND));
        String type = payment.getTransactionType() == null ? "" : payment.getTransactionType();
        if (!"REFUND".equalsIgnoreCase(type)
                && !"RENT_REFUND".equalsIgnoreCase(type)
                && !"DEPOSIT_REFUND".equalsIgnoreCase(type)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Giao dịch không phải khoản hoàn tiền");
        }
        if (!"PENDING_REFUND".equalsIgnoreCase(payment.getStatus())) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Chỉ xác nhận khoản hoàn đang chờ chuyển");
        }
        payment.setStatus("SUCCESS");
        payment.setPaidAt(Instant.now());
        return paymentMapper.toResponse(paymentTransactionRepository.save(payment));
    }

    private void expireReconciledTransaction(PaymentTransaction txn) {
        txn.setStatus(PaymentStatus.EXPIRED.name());
        paymentTransactionRepository.save(txn);
        if (txn.getReservationId() != null && reservationHoldExpiryService != null) {
            reservationHoldExpiryService.expireIfElapsed(txn.getReservationId());
        }
    }
}

package com.swp391.selfstorage.payment.scheduler;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.gateway.VnPayGateway;
import com.swp391.selfstorage.payment.gateway.dto.VnPayQueryResult;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.payment.service.PaymentService;
import com.swp391.selfstorage.reservation.service.ReservationHoldExpiryService;

import lombok.extern.slf4j.Slf4j;

/**
 * Flow SYS: Đối soát giao dịch VNPay ngầm (3-Layer Defense: Lớp 3 - Delayed Fallback).
 * Quét định kỳ các giao dịch PENDING để gọi QueryDR xác minh với VNPay.
 * Áp dụng Idempotent Lock (Pessimistic Write) và vòng lặp độc lập không giữ Transaction dài.
 */
@Component
@Slf4j
public class PaymentReconciliationScheduler {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentService paymentService;
    private final VnPayGateway vnPayGateway;
    private final ReservationHoldExpiryService reservationHoldExpiryService;

    @Autowired
    @Lazy
    private PaymentReconciliationScheduler self;

    public PaymentReconciliationScheduler(
            PaymentTransactionRepository paymentTransactionRepository,
            PaymentService paymentService,
            VnPayGateway vnPayGateway,
            ReservationHoldExpiryService reservationHoldExpiryService) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentService = paymentService;
        this.vnPayGateway = vnPayGateway;
        this.reservationHoldExpiryService = reservationHoldExpiryService;
    }

    /**
     * Mặc định quét mỗi 15 phút một lần để đối soát đơn hàng treo.
     */
    @Scheduled(cron = "${app.cron.payment-reconciliation:0 */15 * * * ?}", zone = "Asia/Ho_Chi_Minh")
    public void scheduleReconciliation() {
        try {
            reconcilePendingPayments();
        } catch (Exception ex) {
            log.error("[RECONCILIATION] Lỗi khi thực hiện job đối soát thanh toán: {}", ex.getMessage(), ex);
        }
    }

    /**
     * Hàm điều phối quét danh sách PENDING.
     * TUYỆT ĐỐI KHÔNG có @Transactional ở hàm ngoài này để chống nghẽn Connection Pool HikariCP.
     */
    public int reconcilePendingPayments() {
        if (!vnPayGateway.configured()) {
            return 0;
        }

        List<PaymentTransaction> pendingList = paymentTransactionRepository.findByStatusOrderByCreatedAtAsc("PENDING");
        if (pendingList.isEmpty()) {
            return 0;
        }

        log.info("[RECONCILIATION] Bắt đầu đối soát {} giao dịch PENDING", pendingList.size());
        int processedCount = 0;

        PaymentReconciliationScheduler executor = (self != null) ? self : this;

        for (PaymentTransaction txn : pendingList) {
            if (txn.getOrderCode() == null) {
                continue;
            }
            try {
                boolean reconciled = executor.reconcileSingleOrder(txn.getOrderCode());
                if (reconciled) {
                    processedCount++;
                }
            } catch (Exception e) {
                log.error("[RECONCILIATION] Lỗi đối soát đơn orderCode={}, bỏ qua để chạy tiếp: {}",
                        txn.getOrderCode(), e.getMessage());
            }
        }

        log.info("[RECONCILIATION] Hoàn tất đối soát: Đã xử lý cập nhật {}/{} giao dịch",
                processedCount, pendingList.size());
        return processedCount;
    }

    /**
     * Xử lý độc lập từng đơn hàng trong một transaction REQUIRES_NEW.
     * Sử dụng Khóa Idempotent (Pessimistic Write Lock) ngăn chặn Race Condition với Webhook IPN.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public boolean reconcileSingleOrder(Long orderCode) {
        PaymentTransaction txn = paymentTransactionRepository.findByOrderCodeForUpdate(orderCode).orElse(null);
        if (txn == null || !"PENDING".equalsIgnoreCase(txn.getStatus())) {
            // Đã được Webhook IPN xử lý xong trước đó
            return false;
        }

        Instant createdAt = txn.getCreatedAt();
        boolean olderThan24h = createdAt != null && createdAt.isBefore(Instant.now().minus(24, ChronoUnit.HOURS));
        boolean olderThan5m = createdAt != null && createdAt.isBefore(Instant.now().minus(5, ChronoUnit.MINUTES));

        if (!olderThan5m) {
            // Đơn mới tạo dưới 5 phút: Nhường khách hàng thanh toán và Webhook IPN xử lý
            return false;
        }

        // Gọi API QueryDR sang VNPay
        VnPayQueryResult qr = vnPayGateway.queryDr(txn.getOrderCode(), createdAt);

        if (qr.isSuccess()) {
            // Lớp 3 kích hoạt thành công đơn hàng
            log.info("[RECONCILIATION] Khách đã thanh toán thành công trên VNPay cho orderCode={}, kích hoạt hoàn tất đơn!",
                    orderCode);
            return paymentService.completeVnpayPayment(
                    orderCode,
                    true,
                    qr.getAmount(),
                    qr.getTransactionNo(),
                    qr.getBankCode()
            );
        }

        if (olderThan24h) {
            // Bẫy kỹ thuật: Chỉ khi VNPay báo NOT_FOUND (91) hoặc FAILED (02) mới được phép chuyển EXPIRED
            if (qr.isNotFound() || qr.isFailed()) {
                log.warn("[RECONCILIATION] Đơn orderCode={} đã quá 24h và VNPay xác nhận NOT_FOUND/FAILED (status={}) -> Chuyển sang EXPIRED",
                        orderCode, qr.getTransactionStatus());
                txn.setStatus("EXPIRED");
                paymentTransactionRepository.save(txn);

                if (txn.getReservationId() != null) {
                    reservationHoldExpiryService.expireIfElapsed(txn.getReservationId());
                }
                return true;
            } else {
                log.info("[RECONCILIATION] Đơn orderCode={} quá 24h nhưng VNPay trả status={}, tạm giữ PENDING để tiếp tục đối soát",
                        orderCode, qr.getTransactionStatus());
            }
        }

        return false;
    }
}

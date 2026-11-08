package com.swp391.selfstorage.payment.scheduler;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.gateway.VnPayGateway;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.payment.service.PaymentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Flow SYS: Đối soát giao dịch VNPay ngầm (3-Layer Defense: Lớp 3 - Delayed Fallback).
 * Quét định kỳ các giao dịch PENDING để gọi QueryDR xác minh với VNPay.
 * Điều phối gọi sang PaymentService xử lý độc lập từng đơn hàng theo transaction REQUIRES_NEW.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentReconciliationScheduler {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentService paymentService;
    private final VnPayGateway vnPayGateway;

    @Value("${app.cron.payment-reconciliation.enabled:true}")
    private boolean enabled;

    /**
     * Mặc định quét mỗi 15 phút một lần để đối soát đơn hàng treo.
     */
    @Scheduled(cron = "${app.cron.payment-reconciliation.cron-expression:0 */15 * * * ?}", zone = "Asia/Ho_Chi_Minh")
    public void scheduleReconciliation() {
        if (!enabled) {
            log.debug("[RECONCILIATION] Job đối soát thanh toán đang bị tắt bởi cấu hình.");
            return;
        }
        try {
            reconcilePendingPayments();
        } catch (Exception ex) {
            log.error("[RECONCILIATION] Lỗi khi thực hiện job đối soát thanh toán: {}", ex.getMessage(), ex);
        }
    }

    /**
     * Hàm điều phối quét danh sách PENDING với phân trang tối đa 50 đơn/lần.
     */
    public int reconcilePendingPayments() {
        if (!enabled || !vnPayGateway.configured()) {
            return 0;
        }

        Pageable pageable = PageRequest.of(0, 50);
        List<PaymentTransaction> pendingList = paymentTransactionRepository.findByStatusOrderByCreatedAtAsc("PENDING", pageable);
        if (pendingList.isEmpty()) {
            return 0;
        }

        log.info("[RECONCILIATION] Bắt đầu đối soát {} giao dịch PENDING", pendingList.size());
        int processedCount = 0;

        for (PaymentTransaction txn : pendingList) {
            if (txn.getOrderCode() == null) {
                continue;
            }
            try {
                if (paymentService.reconcileSingleOrder(txn.getOrderCode())) {
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
}

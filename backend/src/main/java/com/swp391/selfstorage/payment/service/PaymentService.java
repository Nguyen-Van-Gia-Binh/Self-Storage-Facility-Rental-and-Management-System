package com.swp391.selfstorage.payment.service;

import org.springframework.data.domain.Pageable;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.payment.dto.CreatePaymentRequest;
import com.swp391.selfstorage.payment.dto.PaymentFilterRequest;
import com.swp391.selfstorage.payment.dto.PaymentResponse;

public interface PaymentService {

    /**
     * Sinh link thanh toán PayOS VietQR động cho đơn đặt chỗ hoặc gia hạn.
     */
    com.swp391.selfstorage.payment.dto.CheckoutResponse createCheckoutLink(com.swp391.selfstorage.payment.dto.CheckoutRequest request);

    /**
     * Xác thực chữ ký và xử lý Webhook IPN gửi về từ cổng thanh toán PayOS / MoMo.
     */
    PaymentResponse processPayOSWebhook(Object webhookBody);

    /**
     * Xác thực chữ ký và xử lý Webhook IPN gửi về từ cổng thanh toán MoMo Sandbox (SC-03).
     */
    PaymentResponse processMomoIpn(com.swp391.selfstorage.payment.dto.MomoIpnRequest ipnRequest);

    /**
     * Tra cứu giao dịch theo mã đơn hàng PayOS / MoMo (orderCode) phục vụ Polling.
     */
    PaymentResponse getPaymentByOrderCode(Long orderCode);

    /**
     * Xử lý xác nhận chuyển tiền hoặc hủy thanh toán qua Cổng Sandbox nội bộ (SC-03).
     */
    PaymentResponse processSandboxTransfer(Long orderCode, String action);

    /**
     * Xử lý thanh toán cho đơn đặt chỗ hoặc hợp đồng (SC-03, BR-DEP-01, BR-DEP-02).
     */
    PaymentResponse processPayment(CreatePaymentRequest request);

    /**
     * Tra cứu chi tiết một giao dịch thanh toán theo ID.
     */
    PaymentResponse getPaymentById(Long id);

    /**
     * Tra cứu danh sách phân trang lịch sử thanh toán kèm bộ lọc.
     */
    PageResponse<PaymentResponse> getPayments(PaymentFilterRequest filter, Pageable pageable);
}

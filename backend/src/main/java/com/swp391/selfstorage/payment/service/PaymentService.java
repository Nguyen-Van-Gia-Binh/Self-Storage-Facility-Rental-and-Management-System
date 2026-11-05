package com.swp391.selfstorage.payment.service;

import org.springframework.data.domain.Pageable;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.payment.dto.CreatePaymentRequest;
import com.swp391.selfstorage.payment.dto.PaymentFilterRequest;
import com.swp391.selfstorage.payment.dto.PaymentResponse;

public interface PaymentService {

    /**
     * Sinh đơn thanh toán VNPay Sandbox động cho đơn đặt chỗ hoặc gia hạn.
     */
    com.swp391.selfstorage.payment.dto.CheckoutResponse createCheckoutLink(com.swp391.selfstorage.payment.dto.CheckoutRequest request);

    /**
     * Tra cứu giao dịch theo mã đơn hàng (orderCode) phục vụ Polling.
     */
    PaymentResponse getPaymentByOrderCode(Long orderCode);

    /**
     * Đơn PENDING dùng để ký URL VNPay. transferContent là vnp_OrderInfo.
     */
    PaymentResponse requirePendingPayment(Long orderCode);

    /**
     * Sau khi chữ ký đã đúng. Đã SUCCESS thì không phát sự kiện lần nữa.
     * Mã khác 00 hoặc lệch số tiền: giữ PENDING, trả false.
     */
    boolean completeVnpayPayment(Long orderCode, boolean successCode, Long vnpAmount, String providerRef, String bankCode);

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

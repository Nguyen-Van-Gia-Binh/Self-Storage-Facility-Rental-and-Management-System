package com.swp391.selfstorage.payment.service;

import org.springframework.data.domain.Pageable;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.payment.dto.CreatePaymentRequest;
import com.swp391.selfstorage.payment.dto.PaymentFilterRequest;
import com.swp391.selfstorage.payment.dto.PaymentResponse;

public interface PaymentService {

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

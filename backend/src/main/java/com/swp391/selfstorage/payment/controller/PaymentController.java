package com.swp391.selfstorage.payment.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.payment.dto.CreatePaymentRequest;
import com.swp391.selfstorage.payment.dto.PaymentFilterRequest;
import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.service.PaymentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/payments")
@Tag(name = "Payment", description = "Quản lý thanh toán trực tuyến VietQR/PayOS (SC-03)")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tạo và xử lý giao dịch thanh toán thủ công (SC-03)")
    public ResponseEntity<PaymentResponse> processPayment(@Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.processPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/checkout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Khởi tạo link thanh toán PayOS VietQR tự động (SC-03)")
    public ResponseEntity<com.swp391.selfstorage.payment.dto.CheckoutResponse> createCheckout(
            @Valid @RequestBody com.swp391.selfstorage.payment.dto.CheckoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createCheckoutLink(request));
    }

    @PostMapping("/sandbox/process-transfer")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xử lý chuyển tiền thanh toán qua Cổng Sandbox nội bộ (SC-03)")
    public ResponseEntity<PaymentResponse> processSandboxTransfer(
            @Valid @RequestBody com.swp391.selfstorage.payment.dto.SandboxTransferRequest request) {
        return ResponseEntity.ok(paymentService.processSandboxTransfer(request.getOrderCode(), request.getAction()));
    }


    @PostMapping("/webhook/payos")
    @Operation(summary = "Webhook tiếp nhận thông báo thanh toán tự động từ cổng PayOS / Sandbox")
    public ResponseEntity<java.util.Map<String, Object>> handlePayOSWebhook(@RequestBody Object webhookBody) {
        paymentService.processPayOSWebhook(webhookBody);
        return ResponseEntity.ok(java.util.Map.of("error", 0, "message", "Success"));
    }

    @GetMapping("/order/{orderCode}/status")
    @Operation(summary = "Kiểm tra trạng thái thanh toán theo mã đơn hàng PayOS (cho Frontend Polling)")
    public ResponseEntity<PaymentResponse> getPaymentByOrderCode(@PathVariable Long orderCode) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderCode(orderCode));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết giao dịch thanh toán theo ID")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping
    @Operation(summary = "Danh sách phân trang lịch sử thanh toán kèm bộ lọc")
    public ResponseEntity<PageResponse<PaymentResponse>> getPayments(
            @ModelAttribute PaymentFilterRequest filter,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(paymentService.getPayments(filter, pageable));
    }
}

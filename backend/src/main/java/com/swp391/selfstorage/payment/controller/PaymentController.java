package com.swp391.selfstorage.payment.controller;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.payment.dto.CreatePaymentRequest;
import com.swp391.selfstorage.payment.dto.PaymentFilterRequest;
import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.gateway.VnPayGateway;
import com.swp391.selfstorage.payment.service.PaymentService;

import jakarta.servlet.http.HttpServletRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/payments")
@Tag(name = "Payment", description = "Quản lý thanh toán trực tuyến VietQR/PayOS (SC-03)")
public class PaymentController {

    private final PaymentService paymentService;
    private final VnPayGateway vnPayGateway;

    public PaymentController(PaymentService paymentService, VnPayGateway vnPayGateway) {
        this.paymentService = paymentService;
        this.vnPayGateway = vnPayGateway;
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

    @GetMapping("/vnpay/pay/{orderCode}")
    @Operation(summary = "Chuyển tới VNPay sandbox (VNBANK hoặc INTCARD)")
    public ResponseEntity<Void> vnpayPay(
            @PathVariable Long orderCode,
            @RequestParam String bankCode,
            HttpServletRequest request) {
        if (!"VNBANK".equals(bankCode) && !"INTCARD".equals(bankCode)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Chỉ hỗ trợ VNBANK hoặc INTCARD");
        }
        PaymentResponse current = paymentService.getPaymentByOrderCode(orderCode);
        if ("SUCCESS".equalsIgnoreCase(current.getStatus())) {
            return vnpayRedirect(String.valueOf(orderCode), true);
        }
        PaymentResponse pending = paymentService.requirePendingPayment(orderCode);
        String url = vnPayGateway.buildPayUrl(
                orderCode,
                pending.getAmount(),
                pending.getTransferContent(),
                bankCode,
                clientIp(request));
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    // shortcut: IPN không tới localhost, xác nhận bằng return URL; bật IPN khi có URL public.
    @GetMapping("/vnpay/return")
    @Operation(summary = "VNPay redirect về sau thanh toán. Đối chữ ký trước khi ghi nhận.")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        if (!vnPayGateway.verify(params)) {
            return vnpayRedirect(txnRef, false);
        }
        Long orderCode;
        Long vnpAmount;
        try {
            orderCode = Long.valueOf(txnRef);
            String amount = params.get("vnp_Amount");
            vnpAmount = amount == null ? null : Long.valueOf(amount);
        } catch (NumberFormatException ex) {
            return vnpayRedirect(txnRef, false);
        }
        boolean successCode = "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));
        boolean ok;
        try {
            ok = paymentService.completeVnpayPayment(
                    orderCode,
                    successCode,
                    vnpAmount,
                    params.get("vnp_TransactionNo"),
                    params.get("vnp_BankCode"));
        } catch (RuntimeException ex) {
            // shortcut: transaction rollback nên đơn vẫn PENDING; không hoàn tiền VNPay, cần IPN khi có URL public.
            log.error("VNPay return không ghi được orderCode={}", orderCode, ex);
            return vnpayRedirect(txnRef, false);
        }
        return vnpayRedirect(txnRef, ok);
    }

    private ResponseEntity<Void> vnpayRedirect(String orderCode, boolean ok) {
        String base = vnPayGateway.frontendReturnUrl();
        String query = "result=" + (ok ? "ok" : "failed");
        if (orderCode != null && !orderCode.isBlank()) {
            query += "&orderCode=" + URLEncoder.encode(orderCode, StandardCharsets.UTF_8);
        }
        String joiner = base.contains("?") ? "&" : "?";
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(base + joiner + query)).build();
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded != null && !forwarded.isBlank()
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
        if (ip == null || ip.isBlank() || "::1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip)) {
            return "127.0.0.1";
        }
        return ip;
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
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Kiểm tra trạng thái thanh toán theo mã đơn hàng PayOS (cho Frontend Polling)")
    public ResponseEntity<PaymentResponse> getPaymentByOrderCode(@PathVariable Long orderCode) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderCode(orderCode));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem chi tiết giao dịch thanh toán theo ID")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Danh sách phân trang lịch sử thanh toán kèm bộ lọc")
    public ResponseEntity<PageResponse<PaymentResponse>> getPayments(
            @ModelAttribute PaymentFilterRequest filter,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(paymentService.getPayments(filter, pageable));
    }
}

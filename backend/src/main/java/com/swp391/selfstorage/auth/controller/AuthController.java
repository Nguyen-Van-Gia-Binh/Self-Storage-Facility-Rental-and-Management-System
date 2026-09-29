package com.swp391.selfstorage.auth.controller;

import com.swp391.selfstorage.auth.dto.AuthResponse;
import com.swp391.selfstorage.auth.dto.ChangePasswordRequest;
import com.swp391.selfstorage.auth.dto.ForgotPasswordRequest;
import com.swp391.selfstorage.auth.dto.GoogleLoginRequest;
import com.swp391.selfstorage.auth.dto.LoginRequest;
import com.swp391.selfstorage.auth.dto.RefreshTokenRequest;
import com.swp391.selfstorage.auth.dto.RegisterRequest;
import com.swp391.selfstorage.auth.dto.ResetPasswordRequest;
import com.swp391.selfstorage.auth.service.AuthService;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Xác thực người dùng và quản lý phiên đăng nhập JWT (T2.3)")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản Storage Customer mới (Công khai)")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            jakarta.servlet.http.HttpServletRequest servletRequest) {
        String ipAddress = extractClientIp(servletRequest);
        String userAgent = servletRequest != null ? servletRequest.getHeader("User-Agent") : null;
        AuthResponse response = authService.register(request, ipAddress, userAgent);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đăng ký tài khoản thành công"));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập và nhận cặp Access Token / Refresh Token (Công khai)")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            jakarta.servlet.http.HttpServletRequest servletRequest) {
        String ipAddress = extractClientIp(servletRequest);
        String userAgent = servletRequest != null ? servletRequest.getHeader("User-Agent") : null;
        AuthResponse response = authService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    @PostMapping("/google")
    @Operation(summary = "Đăng nhập bằng Google ID Token (Công khai)")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = authService.loginWithGoogle(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập bằng Google thành công"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu gửi mã OTP 60s qua email để đặt lại mật khẩu (Công khai)")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Mã xác thực OTP đã được gửi đến email của bạn"));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Kiểm tra mã xác thực OTP hợp lệ trước khi cho phép đặt mật khẩu mới (Công khai)")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody com.swp391.selfstorage.auth.dto.VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Mã xác thực OTP hợp lệ"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu mới bằng mã OTP (Công khai)")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới"));
    }

    private String extractClientIp(jakarta.servlet.http.HttpServletRequest request) {
        if (request == null) return null;
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới Access Token khi hết hạn (Công khai)")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Làm mới token thành công"));
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đổi mật khẩu người dùng (Yêu cầu đăng nhập)")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
    }
}

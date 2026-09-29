package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.auth.dto.AuthResponse;
import com.swp391.selfstorage.auth.dto.ChangePasswordRequest;
import com.swp391.selfstorage.auth.dto.ForgotPasswordRequest;
import com.swp391.selfstorage.auth.dto.GoogleLoginRequest;
import com.swp391.selfstorage.auth.dto.LoginRequest;
import com.swp391.selfstorage.auth.dto.RefreshTokenRequest;
import com.swp391.selfstorage.auth.dto.RegisterRequest;
import com.swp391.selfstorage.auth.dto.ResetPasswordRequest;
import com.swp391.selfstorage.auth.dto.VerifyOtpRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse register(RegisterRequest request, String ipAddress, String userAgent);

    AuthResponse login(LoginRequest request);

    AuthResponse login(LoginRequest request, String ipAddress, String userAgent);

    AuthResponse loginWithGoogle(GoogleLoginRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void verifyOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);
}


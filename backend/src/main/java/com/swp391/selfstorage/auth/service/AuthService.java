package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.auth.dto.AuthResponse;
import com.swp391.selfstorage.auth.dto.ChangePasswordRequest;
import com.swp391.selfstorage.auth.dto.LoginRequest;
import com.swp391.selfstorage.auth.dto.RefreshTokenRequest;
import com.swp391.selfstorage.auth.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);
}

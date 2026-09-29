package com.swp391.selfstorage.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.auth.dto.*;
import com.swp391.selfstorage.auth.service.AuthService;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.user.entity.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    @DisplayName("POST /auth/login - Đăng nhập thành công trả về 200 OK và Token")
    void login_Success() throws Exception {
        LoginRequest request = new LoginRequest("admin@smartstorage.vn", "password123");
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                1L, "Lê Thanh Tùng", "admin@smartstorage.vn", UserRole.SYSTEM_ADMINISTRATOR, List.of()
        );
        AuthResponse response = AuthResponse.of("mock-access-token", "mock-refresh-token", 900L, userInfo);

        when(authService.login(any(LoginRequest.class), any(), any())).thenReturn(response);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.accessToken").value("mock-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("mock-refresh-token"))
                .andExpect(jsonPath("$.data.user.role").value("SYSTEM_ADMINISTRATOR"));
    }

    @Test
    @DisplayName("POST /auth/login - Thất bại do sai mật khẩu trả về lỗi")
    void login_InvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("admin@smartstorage.vn", "wrongpassword");

        when(authService.login(any(LoginRequest.class), any(), any()))
                .thenThrow(new CustomException(ErrorCode.INVALID_CREDENTIALS));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value(ErrorCode.INVALID_CREDENTIALS.getDefaultMessage()));
    }

    @Test
    @DisplayName("POST /auth/register - Đăng ký tài khoản khách hàng mới thành công trả về 201 Created")
    void register_Success() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Khách hàng mới", "newbie@example.com", "0912345678", "079099009999", "password123"
        );
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                10L, "Khách hàng mới", "newbie@example.com", UserRole.STORAGE_CUSTOMER, List.of()
        );
        AuthResponse response = AuthResponse.of("new-access-token", "new-refresh-token", 900L, userInfo);

        when(authService.register(any(RegisterRequest.class), any(), any())).thenReturn(response);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.data.user.role").value("STORAGE_CUSTOMER"));
    }

    @Test
    @DisplayName("POST /auth/forgot-password - Gửi yêu cầu OTP thành công trả về 200 OK")
    void forgotPassword_Success() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("nhi.customer@gmail.com");
        doNothing().when(authService).forgotPassword(any(ForgotPasswordRequest.class));

        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }

    @Test
    @DisplayName("POST /auth/verify-otp - Xác thực OTP thành công trả về 200 OK")
    void verifyOtp_Success() throws Exception {
        VerifyOtpRequest request = new VerifyOtpRequest("nhi.customer@gmail.com", "123456");
        doNothing().when(authService).verifyOtp(any(VerifyOtpRequest.class));

        mockMvc.perform(post("/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }

    @Test
    @DisplayName("POST /auth/reset-password - Đặt lại mật khẩu thành công trả về 200 OK")
    void resetPassword_Success() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("nhi.customer@gmail.com", "123456", "newpassword123");
        doNothing().when(authService).resetPassword(any(ResetPasswordRequest.class));

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }

    @Test
    @DisplayName("POST /auth/refresh - Làm mới token thành công trả về 200 OK")
    void refreshToken_Success() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");
        AuthResponse response = AuthResponse.of("brand-new-access-token", "valid-refresh-token", 900L, null);

        when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(response);

        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.accessToken").value("brand-new-access-token"));
    }
}

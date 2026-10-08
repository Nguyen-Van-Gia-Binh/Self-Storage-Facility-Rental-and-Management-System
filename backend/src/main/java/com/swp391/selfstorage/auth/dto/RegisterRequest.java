package com.swp391.selfstorage.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    @Size(max = 20, message = "Số CMND/CCCD tối đa 20 ký tự")
    private String identityNumber;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu phải có tối thiểu 8 ký tự")
    private String password;

    @NotBlank(message = "Mã xác thực OTP không được để trống")
    @Size(min = 6, max = 10, message = "Mã xác thực OTP gồm 6 chữ số")
    private String otp;

    public RegisterRequest() {}

    public RegisterRequest(String fullName, String email, String phone, String identityNumber, String password) {
        this(fullName, email, phone, identityNumber, password, null);
    }

    public RegisterRequest(String fullName, String email, String phone, String identityNumber, String password, String otp) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.identityNumber = identityNumber;
        this.password = password;
        this.otp = otp;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getIdentityNumber() {
        return identityNumber;
    }

    public void setIdentityNumber(String identityNumber) {
        this.identityNumber = identityNumber;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}

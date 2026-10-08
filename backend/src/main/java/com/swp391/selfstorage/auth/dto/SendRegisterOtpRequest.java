package com.swp391.selfstorage.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class SendRegisterOtpRequest {

    @NotBlank(message = "Địa chỉ email không được để trống")
    @Email(message = "Địa chỉ email không đúng định dạng")
    private String email;

    public SendRegisterOtpRequest() {}

    public SendRegisterOtpRequest(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

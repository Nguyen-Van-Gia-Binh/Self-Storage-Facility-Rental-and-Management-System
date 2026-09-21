package com.swp391.selfstorage.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 150, message = "Họ và tên phải từ 2 đến 150 ký tự")
    private String fullName;

    private String phone;

    private String identityNumber;

    public UpdateUserRequest() {}

    public UpdateUserRequest(String fullName, String phone, String identityNumber) {
        this.fullName = fullName;
        this.phone = phone;
        this.identityNumber = identityNumber;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getIdentityNumber() { return identityNumber; }
    public void setIdentityNumber(String identityNumber) { this.identityNumber = identityNumber; }
}

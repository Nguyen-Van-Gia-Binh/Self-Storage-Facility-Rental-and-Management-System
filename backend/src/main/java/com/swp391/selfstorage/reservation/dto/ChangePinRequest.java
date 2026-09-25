package com.swp391.selfstorage.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ChangePinRequest {

    @NotBlank(message = "Mã PIN mới không được để trống")
    @Pattern(regexp = "^\\d{4,6}$", message = "Mã PIN bắt buộc phải gồm từ 4 đến 6 chữ số (0-9)")
    private String newPin;

    public ChangePinRequest() {}

    public ChangePinRequest(String newPin) {
        this.newPin = newPin;
    }

    public String getNewPin() {
        return newPin;
    }

    public void setNewPin(String newPin) {
        this.newPin = newPin;
    }
}

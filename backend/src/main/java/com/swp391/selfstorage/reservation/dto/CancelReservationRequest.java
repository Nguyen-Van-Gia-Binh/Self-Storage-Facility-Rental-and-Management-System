package com.swp391.selfstorage.reservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO tiếp nhận yêu cầu hủy đặt chỗ từ khách hàng hoặc quản lý (BR-RES-04).
 */
@Schema(description = "Yêu cầu hủy đơn đặt chỗ")
public class CancelReservationRequest {

    @Schema(description = "Lý do hủy đơn đặt chỗ", example = "Thay đổi kế hoạch")
    @NotBlank(message = "Lý do hủy đơn không được để trống")
    @Size(max = 500, message = "Lý do hủy không được vượt quá 500 ký tự")
    private String reason;

    public CancelReservationRequest() {}

    public CancelReservationRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

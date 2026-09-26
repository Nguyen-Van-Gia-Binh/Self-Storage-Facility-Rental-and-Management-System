package com.swp391.selfstorage.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SandboxTransferRequest {

    @NotNull(message = "Mã đơn hàng orderCode không được để trống")
    private Long orderCode;

    @NotBlank(message = "Hành động action không được để trống (TRANSFER_SUCCESS hoặc CANCEL)")
    private String action;
}

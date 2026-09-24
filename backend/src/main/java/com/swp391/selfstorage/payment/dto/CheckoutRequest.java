package com.swp391.selfstorage.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    @NotBlank(message = "Loại tham chiếu không được để trống (RESERVATION, RENEWAL)")
    private String referenceType;

    @NotNull(message = "ID tham chiếu không được để trống")
    @Positive(message = "ID tham chiếu phải lớn hơn 0")
    private Long referenceId;

    private String description;
}

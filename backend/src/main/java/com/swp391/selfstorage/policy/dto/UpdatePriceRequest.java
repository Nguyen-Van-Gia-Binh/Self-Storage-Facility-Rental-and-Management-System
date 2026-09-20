package com.swp391.selfstorage.policy.dto;

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
public class UpdatePriceRequest {

    @NotNull(message = "Đơn giá tháng không được để trống")
    @Positive(message = "Đơn giá tháng phải lớn hơn 0")
    private Long monthlyPrice;

}

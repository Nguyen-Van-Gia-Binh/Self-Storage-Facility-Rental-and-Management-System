package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenewalRequest {

    @NotNull(message = "Số tháng gia hạn không được để trống")
    @Min(value = 1, message = "Thời gian gia hạn tối thiểu là 1 tháng")
    private Integer renewalMonths;
}

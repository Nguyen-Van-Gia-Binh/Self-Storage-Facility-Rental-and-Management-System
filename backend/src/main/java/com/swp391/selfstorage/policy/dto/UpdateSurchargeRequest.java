package com.swp391.selfstorage.policy.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
public class UpdateSurchargeRequest {

    @NotBlank(message = "Tên phụ phí không được để trống")
    @Size(max = 150, message = "Tên phụ phí tối đa 150 ký tự")
    private String name;

    @NotNull(message = "Số tiền phụ phí không được để trống")
    @Positive(message = "Số tiền phụ phí phải lớn hơn 0")
    private Long amount;

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean isActive;

    /** Nếu gửi lên, ngày hiệu lực không được ở quá khứ (BR-GEN-01). */
    private LocalDate effectiveDate;
}

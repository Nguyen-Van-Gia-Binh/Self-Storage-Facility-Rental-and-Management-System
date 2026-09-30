package com.swp391.selfstorage.policy.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
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
public class CreateSurchargeRequest {

    @Size(max = 30, message = "Mã phụ phí tối đa 30 ký tự")
    private String code;

    @NotBlank(message = "Tên phụ phí không được để trống")
    @Size(max = 150, message = "Tên phụ phí tối đa 150 ký tự")
    private String name;

    @NotBlank(message = "Nhóm phụ phí không được để trống")
    @Pattern(regexp = "ACCESS_KEY|CLEANING|DAMAGE|VALUE_ADDED",
            message = "Nhóm phụ phí phải là ACCESS_KEY, CLEANING, DAMAGE hoặc VALUE_ADDED")
    private String category;

    @NotNull(message = "Số tiền phụ phí không được để trống")
    @PositiveOrZero(message = "Số tiền phụ phí phải lớn hơn hoặc bằng 0")
    private Long amount;

    /** Null = áp dụng toàn hệ thống. */
    private Long facilityId;

    @Pattern(regexp = "FIXED|PERCENTAGE", message = "Loại phụ phí phải là FIXED hoặc PERCENTAGE")
    private String type;

    private LocalDate effectiveDate;
}

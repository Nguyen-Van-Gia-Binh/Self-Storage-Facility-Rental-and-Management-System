package com.swp391.selfstorage.policy.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDiscountProgramRequest {
    @NotBlank(message = "Tên chương trình khuyến mãi không được để trống")
    @Size(max = 150, message = "Tên chương trình tối đa 150 ký tự")
    private String name;

    @NotBlank(message = "Loại giảm giá không được để trống (PERCENT hoặc AMOUNT)")
    @Pattern(regexp = "^(PERCENT|AMOUNT)$", message = "Loại giảm giá chỉ chấp nhận PERCENT hoặc AMOUNT")
    private String discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    @NotNull(message = "Số tháng thuê tối thiểu không được để trống")
    @Min(value = 1, message = "Số tháng thuê tối thiểu phải từ 1 tháng trở lên")
    private Integer minRentalMonths;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    @NotBlank(message = "Phạm vi áp dụng không được để trống (SYSTEM, FACILITY hoặc UNIT_TYPE)")
    @Pattern(regexp = "^(SYSTEM|FACILITY|UNIT_TYPE)$", message = "Phạm vi chỉ chấp nhận SYSTEM, FACILITY hoặc UNIT_TYPE")
    private String scopeType;

    private Long facilityId;
    private Long unitTypeId;
}

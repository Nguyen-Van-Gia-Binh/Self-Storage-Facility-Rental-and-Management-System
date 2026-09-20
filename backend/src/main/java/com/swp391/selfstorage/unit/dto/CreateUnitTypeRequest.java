package com.swp391.selfstorage.unit.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUnitTypeRequest {

    @NotBlank(message = "Mã loại ô kho không được để trống")
    @Size(max = 20, message = "Mã loại ô kho không được vượt quá 20 ký tự")
    private String code;

    @NotBlank(message = "Tên loại ô kho không được để trống")
    @Size(max = 100, message = "Tên loại ô kho không được vượt quá 100 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    @NotNull(message = "Chiều rộng không được để trống")
    @DecimalMin(value = "0.1", message = "Chiều rộng phải lớn hơn 0")
    private BigDecimal widthM;

    @NotNull(message = "Chiều dài/sâu không được để trống")
    @DecimalMin(value = "0.1", message = "Chiều dài phải lớn hơn 0")
    private BigDecimal depthM;

    @NotNull(message = "Chiều cao không được để trống")
    @DecimalMin(value = "0.1", message = "Chiều cao phải lớn hơn 0")
    private BigDecimal heightM;

    @NotNull(message = "Đơn giá tháng không được để trống")
    @Min(value = 1, message = "Đơn giá tháng phải lớn hơn 0")
    private Long monthlyPrice;
}

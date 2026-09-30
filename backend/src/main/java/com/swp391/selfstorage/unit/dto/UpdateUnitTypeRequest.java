package com.swp391.selfstorage.unit.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUnitTypeRequest {

    @NotBlank(message = "Tên loại ô kho không được để trống")
    @Size(max = 100, message = "Tên loại ô kho không được vượt quá 100 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    @NotNull(message = "Chiều rộng không được để trống")
    @DecimalMin(value = "0.1", message = "Chiều rộng phải từ 0.1m trở lên")
    @DecimalMax(value = "999.99", message = "Chiều rộng tối đa 999.99m")
    @Digits(integer = 3, fraction = 2, message = "Chiều rộng tối đa 3 chữ số nguyên và 2 chữ số thập phân (đơn vị mét)")
    private BigDecimal widthM;

    @NotNull(message = "Chiều dài/sâu không được để trống")
    @DecimalMin(value = "0.1", message = "Chiều dài phải từ 0.1m trở lên")
    @DecimalMax(value = "999.99", message = "Chiều dài/sâu tối đa 999.99m")
    @Digits(integer = 3, fraction = 2, message = "Chiều dài/sâu tối đa 3 chữ số nguyên và 2 chữ số thập phân (đơn vị mét)")
    private BigDecimal depthM;

    @NotNull(message = "Chiều cao không được để trống")
    @DecimalMin(value = "0.1", message = "Chiều cao phải từ 0.1m trở lên")
    @DecimalMax(value = "999.99", message = "Chiều cao tối đa 999.99m")
    @Digits(integer = 3, fraction = 2, message = "Chiều cao tối đa 3 chữ số nguyên và 2 chữ số thập phân (đơn vị mét)")
    private BigDecimal heightM;

    @Min(value = 0, message = "Đơn giá tháng không được âm")
    private Long monthlyPrice;

    private Boolean isActive;
}

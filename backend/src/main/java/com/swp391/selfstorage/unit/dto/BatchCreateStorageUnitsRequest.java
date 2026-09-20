package com.swp391.selfstorage.unit.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchCreateStorageUnitsRequest {

    @NotNull(message = "Loại ô kho không được để trống")
    private Long unitTypeId;

    @NotBlank(message = "Tiền tố mã không được để trống")
    private String prefix;

    @Min(value = 1, message = "Tầng phải lớn hơn hoặc bằng 1")
    private Integer floor;

    private String position;

    @NotNull(message = "Số bắt đầu không được để trống")
    @Min(value = 1, message = "Số bắt đầu phải >= 1")
    private Integer startNumber;

    @NotNull(message = "Số kết thúc không được để trống")
    @Min(value = 1, message = "Số kết thúc phải >= 1")
    private Integer endNumber;
}

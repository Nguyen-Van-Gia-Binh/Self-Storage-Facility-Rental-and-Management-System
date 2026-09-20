package com.swp391.selfstorage.unit.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStorageUnitRequest {

    @NotNull(message = "Loại ô kho không được để trống")
    private Long unitTypeId;

    @NotBlank(message = "Mã ô kho không được để trống")
    @Size(max = 30, message = "Mã ô kho không được vượt quá 30 ký tự")
    private String code;

    @Min(value = 1, message = "Tầng phải lớn hơn hoặc bằng 1")
    private Integer floor;

    @Size(max = 50, message = "Vị trí không được vượt quá 50 ký tự")
    private String position;

    @Size(max = 255, message = "Ghi chú vị trí không được vượt quá 255 ký tự")
    private String locationNote;
}

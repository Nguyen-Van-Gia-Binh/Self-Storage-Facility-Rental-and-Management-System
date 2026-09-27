package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReassignUnitRequest {

    @NotNull(message = "ID ô kho mới không được để trống")
    private Long newStorageUnitId;

    @NotBlank(message = "Lý do đổi ô kho không được để trống")
    private String reason;
}

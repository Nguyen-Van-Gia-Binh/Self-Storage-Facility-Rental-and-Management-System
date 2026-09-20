package com.swp391.selfstorage.unit.dto;

import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStorageUnitStatusRequest {

    @NotNull(message = "Trạng thái mới không được để trống")
    private StorageUnitStatus status;

    private String reason;
}

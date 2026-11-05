package com.swp391.selfstorage.reservation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReassignStaffRequest {
    @NotNull(message = "Vui lòng chọn nhân viên mới")
    private Long newStaffId;
    private String reason;
}


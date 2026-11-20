package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyCompensationRequest {
    @NotBlank(message = "Lý do bồi thường khẩn cấp không được để trống")
    private String reason;
    private String notes;
}

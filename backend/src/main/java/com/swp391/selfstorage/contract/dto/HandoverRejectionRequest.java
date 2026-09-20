package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HandoverRejectionRequest {
    @NotBlank
    private String rejectionReason;
    private String reportedDefects;
}

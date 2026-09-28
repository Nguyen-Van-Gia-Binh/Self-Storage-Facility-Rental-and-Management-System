package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AssignReturnStaffRequest {
    @NotNull(message = "ID nhân viên phụ trách không được để trống")
    private Long staffId;
    private String notes;
}

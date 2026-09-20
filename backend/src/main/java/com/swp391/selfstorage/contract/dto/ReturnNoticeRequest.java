package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnNoticeRequest {
    @NotNull(message = "Ngày hẹn trả kho không được để trống")
    private LocalDate intendedReturnDate;
    private String notes;
}

package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CheckInRequest {
    @NotNull
    private LocalDate checkinDate;
    private String conditionNote;
    private boolean customerConfirmed;
    private String notes;
}

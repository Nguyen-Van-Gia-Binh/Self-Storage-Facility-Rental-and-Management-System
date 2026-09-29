package com.swp391.selfstorage.support.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RelocationRequiredRequest {

    @NotNull(message = "Cờ cần di dời không được để trống")
    private Boolean required;
}

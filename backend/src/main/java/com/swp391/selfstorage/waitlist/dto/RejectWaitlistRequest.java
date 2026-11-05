package com.swp391.selfstorage.waitlist.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectWaitlistRequest {

    @Size(max = 500, message = "Lý do từ chối không được vượt quá 500 ký tự")
    private String reason;
}

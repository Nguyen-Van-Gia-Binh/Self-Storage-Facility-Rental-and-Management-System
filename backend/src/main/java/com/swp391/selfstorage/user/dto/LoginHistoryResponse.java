package com.swp391.selfstorage.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginHistoryResponse {
    private Long id;
    private Long userId;
    private String email;
    private OffsetDateTime loggedInAt;
    private String ipAddress;
    private String userAgent;
    private boolean isSuccess;
    private String failureReason;
}

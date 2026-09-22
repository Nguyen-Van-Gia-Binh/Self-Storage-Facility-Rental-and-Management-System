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
public class AuditLogResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private String action;
    private String entityType;
    private Long entityId;
    private String beforeValue;
    private String afterValue;
    private OffsetDateTime createdAt;
}

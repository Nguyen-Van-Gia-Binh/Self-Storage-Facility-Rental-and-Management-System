package com.swp391.selfstorage.policy.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurchargeResponse {
    private Long id;
    private String code;
    private String name;
    private Long amount;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}

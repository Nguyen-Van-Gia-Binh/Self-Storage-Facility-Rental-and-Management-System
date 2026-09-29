package com.swp391.selfstorage.policy.dto;

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
public class PriceAuditFieldResponse {
    private String key;
    private String label;
    private String oldValue;
    private String newValue;
}

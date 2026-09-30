package com.swp391.selfstorage.contract.dto;

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
public class CatalogFeeChargeResponse {
    private Long id;
    private Long contractId;
    private Long extraFeeTypeId;
    private String name;
    private String category;
    private long amount;
    private String status;
}

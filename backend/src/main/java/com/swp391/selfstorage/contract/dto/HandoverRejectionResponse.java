package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HandoverRejectionResponse {
    private Long contractId;
    private ContractStatus contractStatus;
    private StorageUnitStatus storageUnitStatus;
    private String message;
}

package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContractFilterRequest {
    private ContractStatus status;
    private Long facilityId;
    private Long facilityIds;
    private Long customerId;
    private String keyword;
    private Boolean expiringSoon; // true: loc cac hop dong co endDateExclusive <= now + 7 ngay

    public Long getFacilityId() {
        return facilityId != null ? facilityId : facilityIds;
    }
}

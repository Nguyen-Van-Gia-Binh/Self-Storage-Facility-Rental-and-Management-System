package com.swp391.selfstorage.contract.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SettlementApprovalRequest {
    private Long adjustedDamageCost; // Cho phep FM dieu chinh so tien khau tru truoc khi duyet (US-FM-04.1 AC-2)
    private String approvedNotes;
}

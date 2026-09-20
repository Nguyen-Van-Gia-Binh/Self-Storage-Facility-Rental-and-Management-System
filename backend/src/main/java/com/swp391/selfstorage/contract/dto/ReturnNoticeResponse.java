package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ReturnRequestStatus;
import lombok.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnNoticeResponse {
    private Long id;
    private Long contractId;
    private LocalDate intendedReturnDate;
    private ReturnRequestStatus status;
    private OffsetDateTime createdAt;
}

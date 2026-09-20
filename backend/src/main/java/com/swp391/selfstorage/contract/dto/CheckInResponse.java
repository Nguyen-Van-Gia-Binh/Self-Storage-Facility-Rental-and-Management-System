package com.swp391.selfstorage.contract.dto;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckInResponse {
    private Long contractId;
    private ContractStatus status;
    private LocalDate checkinDate;
    private String accessCode;
}

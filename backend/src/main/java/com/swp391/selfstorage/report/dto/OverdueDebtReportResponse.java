package com.swp391.selfstorage.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverdueDebtReportResponse {
    private Long facilityId;
    private String facilityName;
    private int totalOverdueContracts;
    private long totalOverdueDebt;
    private DebtAgeBracket bracketD1ToD3;
    private DebtAgeBracket bracketD4ToD6;
    private DebtAgeBracket bracketD7ToD10;
    private DebtAgeBracket bracketTerminatedD10Plus;

    // Giữ lại tương thích ngược
    private DebtAgeBracket bracketD1ToD10;
    private DebtAgeBracket bracketD11ToD30;
    private DebtAgeBracket bracketOverD30;
    private List<OverdueContractDebtDto> contracts;
}

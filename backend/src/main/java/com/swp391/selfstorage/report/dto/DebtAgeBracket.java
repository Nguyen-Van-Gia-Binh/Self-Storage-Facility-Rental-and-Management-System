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
public class DebtAgeBracket {
    private String bracketCode;
    private String bracketName;
    private int contractCount;
    private long totalDebt;
    private List<OverdueContractDebtDto> contracts;
}

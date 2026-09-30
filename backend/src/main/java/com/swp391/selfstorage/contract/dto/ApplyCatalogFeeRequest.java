package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.NotNull;
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
public class ApplyCatalogFeeRequest {

    @NotNull(message = "Phải chọn khoản phụ phí trong danh mục")
    private Long extraFeeTypeId;

    private String note;
}

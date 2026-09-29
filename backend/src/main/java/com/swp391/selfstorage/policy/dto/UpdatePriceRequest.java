package com.swp391.selfstorage.policy.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Positive;
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
public class UpdatePriceRequest {

    /**
     * Legacy: một số test / client cũ gửi thẳng giá tháng.
     * UI mới gửi {@link #pricePerM2}.
     */
    @Positive(message = "Đơn giá tháng phải lớn hơn 0")
    private Long monthlyPrice;

    /** Đơn giá 1 m² (VND / m² / tháng) — BOM nhập. */
    @Positive(message = "Đơn giá m² phải lớn hơn 0")
    private Long pricePerM2;

    /** Ngày hiệu lực; null = hôm nay (Asia/Ho_Chi_Minh). Không được ở quá khứ. */
    private LocalDate effectiveDate;

    /** Giữ constructor 1 tham số để test cũ compile. */
    public UpdatePriceRequest(Long monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }
}

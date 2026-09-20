package com.swp391.selfstorage.reservation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CalculatePriceRequest {

    @NotNull(message = "Đơn giá tháng không được để trống")
    @Min(value = 0, message = "Đơn giá tháng phải lớn hơn hoặc bằng 0")
    private Long monthlyPrice;

    @Min(value = 1, message = "Số tháng thuê tối thiểu là 1 tháng")
    private int months = 1;

    public CalculatePriceRequest() {}

    public CalculatePriceRequest(Long monthlyPrice, int months) {
        this.monthlyPrice = monthlyPrice;
        this.months = months;
    }

    public Long getMonthlyPrice() { return monthlyPrice; }
    public void setMonthlyPrice(Long monthlyPrice) { this.monthlyPrice = monthlyPrice; }

    public int getMonths() { return months; }
    public void setMonths(int months) { this.months = months; }
}

package com.swp391.selfstorage.policy.service;

import java.time.LocalDate;

/**
 * Giá đang áp dụng / lịch sử rút gọn cho Unit Type tại Facility.
 */
public class AppliedPriceInfo {

    public static final String STATUS_UNLISTED = "Chưa niêm yết";
    public static final String STATUS_APPLIED = "Đang áp dụng";
    public static final String STATUS_PENDING = "Chưa áp dụng";
    public static final String STATUS_REPLACED = "Đã thay thế";

    private final Long monthlyPrice;
    private final Long pricePerM2;
    private final String priceStatus;
    private final LocalDate scheduledEffectiveFrom;
    private final Long scheduledPricePerM2;

    public AppliedPriceInfo(
            Long monthlyPrice,
            Long pricePerM2,
            String priceStatus,
            LocalDate scheduledEffectiveFrom,
            Long scheduledPricePerM2) {
        this.monthlyPrice = monthlyPrice;
        this.pricePerM2 = pricePerM2;
        this.priceStatus = priceStatus;
        this.scheduledEffectiveFrom = scheduledEffectiveFrom;
        this.scheduledPricePerM2 = scheduledPricePerM2;
    }

    public Long getMonthlyPrice() {
        return monthlyPrice;
    }

    public Long getPricePerM2() {
        return pricePerM2;
    }

    public String getPriceStatus() {
        return priceStatus;
    }

    public LocalDate getScheduledEffectiveFrom() {
        return scheduledEffectiveFrom;
    }

    public Long getScheduledPricePerM2() {
        return scheduledPricePerM2;
    }
}

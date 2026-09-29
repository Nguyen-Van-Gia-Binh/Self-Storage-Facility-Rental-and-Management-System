package com.swp391.selfstorage.policy.service;

import java.util.ArrayList;
import java.util.List;

import com.swp391.selfstorage.policy.dto.SurchargeLineResponse;
import com.swp391.selfstorage.policy.entity.ExtraFeeType;

public final class SurchargeAmountCalculator {

    private SurchargeAmountCalculator() {
    }

    public static List<SurchargeLineResponse> lines(List<ExtraFeeType> fees, long monthlyPrice, int months) {
        if (fees == null || fees.isEmpty()) {
            return List.of();
        }
        int safeMonths = Math.max(1, months);
        long rate = Math.max(0, monthlyPrice);
        List<SurchargeLineResponse> lines = new ArrayList<>();
        for (ExtraFeeType fee : fees) {
            if (fee == null || fee.getAmount() == null || fee.getAmount() <= 0 || fee.getName() == null) {
                continue;
            }
            long amount = lineAmount(fee, rate, safeMonths);
            if (amount <= 0) {
                continue;
            }
            lines.add(new SurchargeLineResponse(fee.getName(), amount));
        }
        return lines;
    }

    public static long total(List<SurchargeLineResponse> lines) {
        if (lines == null || lines.isEmpty()) {
            return 0L;
        }
        return lines.stream().mapToLong(SurchargeLineResponse::getAmount).sum();
    }

    private static long lineAmount(ExtraFeeType fee, long monthlyPrice, int months) {
        if ("PERCENTAGE".equalsIgnoreCase(fee.getFeeType())) {
            double raw = monthlyPrice * months * (fee.getAmount() / 100.0);
            return Math.round(raw / 1000.0) * 1000;
        }
        return fee.getAmount();
    }
}

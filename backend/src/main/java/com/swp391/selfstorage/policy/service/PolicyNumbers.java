package com.swp391.selfstorage.policy.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.policy.entity.PolicyVersion;

/**
 * Đọc số trên phiên bản chính sách đã ban hành. Không bịa số khi field có giá trị.
 */
public final class PolicyNumbers {

    private static final Pattern SNAPSHOT_INT = Pattern.compile("\"([a-zA-Z]+)\"\\s*:\\s*(\\d+)");

    private PolicyNumbers() {
    }

    public static void requireTerm(PolicyVersion policy, int months) {
        if (policy == null || policy.getRenewalMinMonths() == null || policy.getRenewalMaxMonths() == null) {
            return;
        }
        int min = policy.getRenewalMinMonths();
        int max = policy.getRenewalMaxMonths();
        if (months < min || months > max) {
            throw new CustomException(
                    ErrorCode.VALIDATION_FAILED,
                    "Số tháng thuê phải từ " + min + " đến " + max + " tháng theo chính sách đang hiệu lực");
        }
    }

    public static int pinLength(PolicyVersion policy) {
        int length = policy != null && policy.getAccessPinLength() != null ? policy.getAccessPinLength() : 6;
        return Math.min(10, Math.max(4, length));
    }

    public static int snapshotInt(String snapshot, String key, int fallback) {
        if (snapshot == null || key == null) {
            return fallback;
        }
        Matcher matcher = SNAPSHOT_INT.matcher(snapshot);
        while (matcher.find()) {
            if (key.equals(matcher.group(1))) {
                return Integer.parseInt(matcher.group(2));
            }
        }
        return fallback;
    }

    public static int dailyDivisor(PolicyVersion policy) {
        int divisor = policy != null && policy.getRentalDailyDivisor() != null ? policy.getRentalDailyDivisor() : 30;
        return Math.max(1, divisor);
    }

    public static long share(long amount, BigDecimal rate) {
        if (amount <= 0 || rate == null || rate.signum() <= 0) {
            return 0L;
        }
        return Math.round((amount * rate.doubleValue()) / 1000.0) * 1000;
    }

    public static long dailyRent(long monthlyPrice, PolicyVersion policy) {
        if (monthlyPrice <= 0) {
            return 0L;
        }
        return Math.round((monthlyPrice / (double) dailyDivisor(policy)) / 1000.0) * 1000;
    }

    /** Tổng (giá tháng × số ngày / dailyDivisor) làm tròn lên nghìn. Không làm tròn từng ngày. */
    public static long prorateTotalUpToThousand(long monthlyPrice, long days, PolicyVersion policy) {
        if (monthlyPrice <= 0 || days <= 0) {
            return 0L;
        }
        BigDecimal raw = BigDecimal.valueOf(monthlyPrice)
                .multiply(BigDecimal.valueOf(days))
                .divide(BigDecimal.valueOf(dailyDivisor(policy)), 0, RoundingMode.CEILING);
        BigDecimal thousand = BigDecimal.valueOf(1000);
        return raw.divide(thousand, 0, RoundingMode.CEILING).multiply(thousand).longValueExact();
    }

    public static int fullRefundDays(PolicyVersion policy) {
        int days = policy != null && policy.getCancelFullRefundDays() != null
                ? policy.getCancelFullRefundDays()
                : 7;
        return Math.max(1, days);
    }

    public static BigDecimal midRefundRate(PolicyVersion policy) {
        if (policy != null && policy.getCancelMidRefundRate() != null) {
            return policy.getCancelMidRefundRate();
        }
        return new BigDecimal("0.50");
    }

    public static BigDecimal lateRefundRate(PolicyVersion policy) {
        if (policy != null && policy.getCancelLateRefundRate() != null) {
            return policy.getCancelLateRefundRate();
        }
        return BigDecimal.ZERO;
    }

    public static final class RefundParts {
        public final long rent;
        public final long deposit;

        public RefundParts(long rent, long deposit) {
            this.rent = rent;
            this.deposit = deposit;
        }

        public long total() {
            return rent + deposit;
        }
    }

    /**
     * Hoàn tiền hủy nhận kho. Cả Reservation và Contract gọi hàm này.
     * full_refund_days / mid_refund_rate / late_refund_rate và dailyDivisor lấy từ policy.
     */
    public static RefundParts cancelRefund(
            PolicyVersion policy,
            long rentalFee,
            long deposit,
            long monthlyPrice,
            long hoursUntilStart,
            boolean withinCoolingOff,
            boolean beforeStart,
            long heldDays,
            int graceDays) {
        long rent = Math.max(0, rentalFee);
        long dep = Math.max(0, deposit);
        int fullHours = fullRefundDays(policy) * 24;
        int lateHours = policy != null && policy.getCancelFullRefundHours() != null
                ? policy.getCancelFullRefundHours()
                : 48;
        if (withinCoolingOff || (beforeStart && hoursUntilStart >= fullHours)) {
            return new RefundParts(rent, dep);
        }
        if (beforeStart && hoursUntilStart >= lateHours) {
            return new RefundParts(rent, share(dep, midRefundRate(policy)));
        }
        if (beforeStart) {
            return new RefundParts(rent, share(dep, lateRefundRate(policy)));
        }
        if (heldDays > graceDays) {
            return new RefundParts(0L, 0L);
        }
        long daily = dailyRent(monthlyPrice, policy);
        long rentCharged = Math.min(rent, daily * Math.max(0, heldDays));
        BigDecimal noShow = policy != null && policy.getCancelNoShowRefundRate() != null
                ? policy.getCancelNoShowRefundRate()
                : BigDecimal.ZERO;
        return new RefundParts(Math.max(0, rent - rentCharged), share(dep, noShow));
    }

    public static List<Integer> reminderDays(String raw) {
        List<Integer> days = new ArrayList<>();
        if (raw == null || raw.isBlank()) {
            return days;
        }
        for (String part : raw.split(",")) {
            try {
                int day = Integer.parseInt(part.trim());
                if (day > 0) {
                    days.add(day);
                }
            } catch (NumberFormatException ignored) {
                // Bỏ mốc không phải số.
            }
        }
        return days;
    }

    public static OffsetDateTime plusWorkingDays(OffsetDateTime start, int workingDays) {
        if (start == null) {
            return null;
        }
        int remaining = Math.max(0, workingDays);
        LocalDate cursor = start.toLocalDate();
        while (remaining > 0) {
            cursor = cursor.plusDays(1);
            DayOfWeek day = cursor.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                remaining--;
            }
        }
        return cursor.atTime(start.toLocalTime()).atOffset(start.getOffset());
    }

    public static OffsetDateTime minusWorkingDays(OffsetDateTime start, int workingDays) {
        if (start == null) {
            return null;
        }
        int remaining = Math.max(0, workingDays);
        LocalDate cursor = start.toLocalDate();
        while (remaining > 0) {
            cursor = cursor.minusDays(1);
            DayOfWeek day = cursor.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                remaining--;
            }
        }
        return cursor.atTime(start.toLocalTime()).atOffset(start.getOffset());
    }
}

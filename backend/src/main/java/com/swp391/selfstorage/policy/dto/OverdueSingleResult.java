package com.swp391.selfstorage.policy.dto;

public record OverdueSingleResult(
        boolean markedOverdue,
        boolean penalized,
        boolean terminated,
        long penaltyDelta,
        boolean isError
) {
    public static OverdueSingleResult noop() {
        return new OverdueSingleResult(false, false, false, 0L, false);
    }

    public static OverdueSingleResult failure() {
        return new OverdueSingleResult(false, false, false, 0L, true);
    }
}

package com.swp391.selfstorage.support.entity;

/**
 * Trạng thái yêu cầu hỗ trợ (CK_SUPPORT_REQUEST_STATUS).
 */
public enum SupportStatus {
    NEW("Mới gửi"),
    ASSIGNED("Đã phân công"),
    IN_PROGRESS("Đang xử lý"),
    RESOLVED("Đã giải quyết"),
    CLOSED("Đã đóng"),
    AUTO_CLOSED("Tự động đóng");

    private final String displayName;

    SupportStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

package com.swp391.selfstorage.support.entity;

/**
 * Danh mục sự cố / yêu cầu hỗ trợ (CK_SUPPORT_REQUEST_CATEGORY).
 */
public enum SupportCategory {
    UNIT_DAMAGE("Hư hại ô kho"),
    LOCK_ACCESS("Sự cố khóa / Mã PIN ra vào"),
    PAYMENT("Vấn đề thanh toán / Tiền cọc"),
    BELONGINGS("Tài sản lưu trữ"),
    OTHER("Sự cố khác");

    private final String displayName;

    SupportCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

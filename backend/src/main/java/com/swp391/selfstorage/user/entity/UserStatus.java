package com.swp391.selfstorage.user.entity;

/**
 * Trạng thái tài khoản người dùng (SA-01, V1__init_schema.sql).
 * Khớp với CHECK constraint ck_app_user_status.
 */
public enum UserStatus {
    ACTIVE("Đang hoạt động"),
    INACTIVE("Đã vô hiệu hóa");

    private final String description;

    UserStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
